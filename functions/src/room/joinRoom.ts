import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { JoinRoomPayload, JoinRoomResult, Player } from "../types";

const db = admin.firestore();

export const joinRoom = functions.https.onCall(
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be authenticated.");
    }

    const data = request.data as JoinRoomPayload;

    if (!data.inviteCode || data.inviteCode.trim().length !== 6) {
      throw new functions.https.HttpsError("invalid-argument", "inviteCode must be 6 characters.");
    }

    if (!data.displayName || data.displayName.trim().length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "displayName is required.");
    }

    const uid = request.auth.uid;
    const code = data.inviteCode.trim().toUpperCase();

    const roomSnap = await db.collection("rooms")
      .where("inviteCode", "==", code)
      .where("status", "==", "lobby")
      .limit(1)
      .get();

    if (roomSnap.empty) {
      throw new functions.https.HttpsError(
        "not-found",
        "Room not found or game has already started."
      );
    }

    const roomDoc = roomSnap.docs[0];
    const roomId = roomDoc.id;

    const result: JoinRoomResult = await db.runTransaction(async (tx) => {
      const freshRoom = await tx.get(roomDoc.ref);
      const roomData = freshRoom.data();

      if (!roomData) {
        throw new functions.https.HttpsError("not-found", "Room not found.");
      }

      if (roomData.status !== "lobby") {
        throw new functions.https.HttpsError("failed-precondition", "Game has already started.");
      }

      if (roomData.currentPlayerCount >= 20) {
        throw new functions.https.HttpsError("resource-exhausted", "Room is full (20 players max).");
      }

      const playerRef = roomDoc.ref.collection("players").doc(uid);
      const existingPlayer = await tx.get(playerRef);

      if (existingPlayer.exists) {
        // Player is rejoining — return existing data
        return { roomId, playerId: uid };
      }

      const now = admin.firestore.Timestamp.now();
      const player: Player = {
        playerId: uid,
        roomId,
        displayName: data.displayName.trim(),
        avatarEmoji: data.avatarEmoji || "😊",
        totalPoints: 0,
        joinedAt: now,
        isHost: false,
        lastSeenAt: now,
      };

      tx.set(playerRef, player);
      tx.update(roomDoc.ref, {
        currentPlayerCount: admin.firestore.FieldValue.increment(1),
      });

      return { roomId, playerId: uid };
    });

    return result;
  }
);
