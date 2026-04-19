import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { SubmitDarePayload, SubmitDareResult, DareSubmission } from "../types";

const db = admin.firestore();

export const submitDare = functions.https.onCall(
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be authenticated.");
    }

    const data = request.data as SubmitDarePayload;
    const uid = request.auth.uid;

    // Basic input validation
    if (!data.roomId || !data.dareId || !data.mediaUrl || !data.mediaType) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "roomId, dareId, mediaType, and mediaUrl are required."
      );
    }

    if (!["photo", "video"].includes(data.mediaType)) {
      throw new functions.https.HttpsError("invalid-argument", "mediaType must be photo or video.");
    }

    if (!data.mediaUrl.startsWith("https://")) {
      throw new functions.https.HttpsError("invalid-argument", "mediaUrl must be a valid HTTPS URL.");
    }

    const roomRef = db.collection("rooms").doc(data.roomId);
    const playerRef = roomRef.collection("players").doc(uid);
    const dareRef = db.collection("dares").doc(data.dareId);

    const result: SubmitDareResult = await db.runTransaction(async (tx) => {
      const [roomSnap, playerSnap, dareSnap] = await Promise.all([
        tx.get(roomRef),
        tx.get(playerRef),
        tx.get(dareRef),
      ]);

      // Validate room
      if (!roomSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Room not found.");
      }
      const room = roomSnap.data()!;

      if (room.status !== "live") {
        throw new functions.https.HttpsError("failed-precondition", "Game is not live.");
      }

      // Check timer hasn't expired
      if (room.endsAt && room.endsAt.toMillis() < Date.now()) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Game timer has expired. No more submissions."
        );
      }

      // Validate player is in room
      if (!playerSnap.exists) {
        throw new functions.https.HttpsError("permission-denied", "You are not in this room.");
      }

      // Validate dare exists and is active
      if (!dareSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Dare not found.");
      }
      const dare = dareSnap.data()!;
      if (!dare.active) {
        throw new functions.https.HttpsError("failed-precondition", "This dare is no longer active.");
      }

      // Check for duplicate submission (same player, same dare)
      const dupQuery = await tx.get(
        roomRef.collection("submissions")
          .where("playerId", "==", uid)
          .where("dareId", "==", data.dareId)
          .limit(1)
      );

      if (!dupQuery.empty) {
        throw new functions.https.HttpsError(
          "already-exists",
          "You have already completed this dare."
        );
      }

      // All checks passed — write submission
      const submissionRef = roomRef.collection("submissions").doc();
      const now = admin.firestore.Timestamp.now();

      const submission: DareSubmission = {
        submissionId: submissionRef.id,
        roomId: data.roomId,
        playerId: uid,
        dareId: data.dareId,
        dareTextSnapshot: dare.text,
        pointsAwarded: dare.points,
        mediaType: data.mediaType,
        mediaUrl: data.mediaUrl,
        thumbnailUrl: data.thumbnailUrl || data.mediaUrl,
        createdAt: now,
        renderEligible: true,
      };

      const currentPoints = (playerSnap.data()?.totalPoints ?? 0) as number;
      const newTotal = currentPoints + dare.points;

      tx.set(submissionRef, submission);
      tx.update(playerRef, {
        totalPoints: admin.firestore.FieldValue.increment(dare.points),
        lastSeenAt: now,
      });

      return {
        submissionId: submissionRef.id,
        pointsAwarded: dare.points as number,
        newTotal,
      };
    });

    return result;
  }
);
