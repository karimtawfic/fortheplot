import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { CreateRoomPayload, CreateRoomResult, Room, Player } from "../types";

const db = admin.firestore();

function generateInviteCode(): string {
  // Exclude ambiguous characters (0/O, 1/I/L)
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

async function isInviteCodeUnique(code: string): Promise<boolean> {
  const snap = await db.collection("rooms")
    .where("inviteCode", "==", code)
    .where("status", "in", ["lobby", "live"])
    .limit(1)
    .get();
  return snap.empty;
}

async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateInviteCode();
    if (await isInviteCodeUnique(code)) return code;
  }
  throw new functions.https.HttpsError(
    "internal",
    "Failed to generate a unique invite code. Please try again."
  );
}

export const createRoom = functions.https.onCall(
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be authenticated.");
    }

    const data = request.data as CreateRoomPayload;

    if (!data.displayName || data.displayName.trim().length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "displayName is required.");
    }

    const validTimers = [5, 10, 15, 30, 45, 60, 90, 120];
    if (!validTimers.includes(data.timerMinutes)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `timerMinutes must be one of: ${validTimers.join(", ")}`
      );
    }

    const uid = request.auth.uid;
    const inviteCode = await generateUniqueCode();
    const roomRef = db.collection("rooms").doc();
    const roomId = roomRef.id;

    const now = admin.firestore.Timestamp.now();

    const room: Room = {
      roomId,
      hostPlayerId: uid,
      createdAt: now,
      status: "lobby",
      timerMinutes: data.timerMinutes,
      currentPlayerCount: 0,
      dareDeckVersion: "v1",
      personalReelsReadyCount: 0,
      groupReelReady: false,
      inviteCode,
    };

    const playerRef = roomRef.collection("players").doc(uid);
    const player: Player = {
      playerId: uid,
      roomId,
      displayName: data.displayName.trim(),
      avatarEmoji: data.avatarEmoji || "😊",
      totalPoints: 0,
      joinedAt: now,
      isHost: true,
      lastSeenAt: now,
    };

    const batch = db.batch();
    batch.set(roomRef, room);
    batch.set(playerRef, player);
    // Increment count via batch (trigger will also reconcile)
    batch.update(roomRef, { currentPlayerCount: 1 });
    await batch.commit();

    const result: CreateRoomResult = { roomId, inviteCode, playerId: uid };
    return result;
  }
);
