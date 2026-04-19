import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createReelJobsInternal } from "../reels/createReelJobs";

const db = admin.firestore();

/**
 * Callable by host as a manual override (e.g. end early).
 * The scheduled trigger also calls endGameInternal automatically.
 */
export const endGame = functions.https.onCall(
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be authenticated.");
    }

    const { roomId } = request.data as { roomId: string };
    if (!roomId) {
      throw new functions.https.HttpsError("invalid-argument", "roomId is required.");
    }

    const roomRef = db.collection("rooms").doc(roomId);
    const roomSnap = await roomRef.get();
    if (!roomSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Room not found.");
    }

    const room = roomSnap.data()!;
    if (room.hostPlayerId !== request.auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Only the host can end the game.");
    }

    if (room.status !== "live") {
      throw new functions.https.HttpsError("failed-precondition", "Game is not live.");
    }

    await endGameInternal(roomId);
    return { success: true };
  }
);

export async function endGameInternal(roomId: string): Promise<void> {
  const roomRef = db.collection("rooms").doc(roomId);

  await roomRef.update({ status: "rendering" });

  // Fire off reel job creation — runs async
  await createReelJobsInternal(roomId).catch((err) => {
    functions.logger.error(`Failed to create reel jobs for room ${roomId}:`, err);
  });
}
