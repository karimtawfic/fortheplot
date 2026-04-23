import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb, Timestamp, FieldValue } from "./_admin";
import { verifyAuth, ok, err } from "./_helpers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return err(res, 405, "Method not allowed");
  try {
    const uid = await verifyAuth(req);
    const { inviteCode, displayName, avatarEmoji } = req.body as {
      inviteCode: string;
      displayName: string;
      avatarEmoji: string;
    };
    if (!inviteCode || !displayName || !avatarEmoji) return err(res, 400, "Missing fields");

    // Find room by invite code
    const snap = await adminDb
      .collection("rooms")
      .where("inviteCode", "==", inviteCode.toUpperCase())
      .limit(1)
      .get();

    if (snap.empty) return err(res, 404, "Room not found");
    const roomDoc = snap.docs[0];
    const roomId = roomDoc.id;

    const result = await adminDb.runTransaction(async (tx) => {
      const roomRef = adminDb.doc(`rooms/${roomId}`);
      const playerRef = adminDb.doc(`rooms/${roomId}/players/${uid}`);
      const [roomSnap, playerSnap] = await Promise.all([tx.get(roomRef), tx.get(playerRef)]);

      const room = roomSnap.data();
      if (!room) throw new Error("Room not found");
      if (room.status !== "lobby") throw new Error("Game already started");
      if (room.currentPlayerCount >= 20) throw new Error("Room is full");

      // Idempotent re-join
      if (!playerSnap.exists) {
        const now = Timestamp.now();
        tx.set(playerRef, {
          playerId: uid,
          roomId,
          displayName,
          avatarEmoji,
          totalPoints: 0,
          joinedAt: now,
          isHost: false,
          lastSeenAt: now,
        });
        tx.update(roomRef, { currentPlayerCount: FieldValue.increment(1) });
      }
      return { roomId, playerId: uid };
    });

    ok(res, result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status = msg === "Unauthorized" ? 401 : msg.includes("not found") ? 404 :
      msg === "Room is full" || msg === "Game already started" ? 409 : 500;
    err(res, status, msg);
  }
}
