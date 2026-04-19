import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { StartGamePayload, StartGameResult } from "../types";

const db = admin.firestore();

export const startGame = functions.https.onCall(
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be authenticated.");
    }

    const data = request.data as StartGamePayload;
    const uid = request.auth.uid;

    if (!data.roomId) {
      throw new functions.https.HttpsError("invalid-argument", "roomId is required.");
    }

    const validTimers = [5, 10, 15, 30, 45, 60, 90, 120];
    if (!validTimers.includes(data.timerMinutes)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `timerMinutes must be one of: ${validTimers.join(", ")}`
      );
    }

    const roomRef = db.collection("rooms").doc(data.roomId);
    const endsAtStr: string = await db.runTransaction(async (tx) => {
      const roomSnap = await tx.get(roomRef);
      if (!roomSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Room not found.");
      }

      const room = roomSnap.data()!;

      if (room.hostPlayerId !== uid) {
        throw new functions.https.HttpsError("permission-denied", "Only the host can start the game.");
      }

      if (room.status !== "lobby") {
        throw new functions.https.HttpsError("failed-precondition", "Game is not in lobby status.");
      }

      if (room.currentPlayerCount < 2) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Need at least 2 players to start."
        );
      }

      const now = Date.now();
      const endsAtMs = now + data.timerMinutes * 60 * 1000;
      const endsAt = admin.firestore.Timestamp.fromMillis(endsAtMs);
      const startedAt = admin.firestore.Timestamp.fromMillis(now);

      tx.update(roomRef, {
        status: "live",
        startedAt,
        endsAt,
        timerMinutes: data.timerMinutes,
      });

      return new Date(endsAtMs).toISOString();
    });

    const result: StartGameResult = { endsAt: endsAtStr };
    return result;
  }
);
