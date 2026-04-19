import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

const db = admin.firestore();

/**
 * Fires when a new reelJob document is created (status: queued).
 * Invokes the Cloud Run render worker via HTTP.
 */
export const triggerRenderWorker = functions.firestore
  .document("reelJobs/{jobId}")
  .onCreate(async (snap) => {
    const job = snap.data();

    if (job.status !== "queued") {
      return;
    }

    const jobId = snap.id;
    const workerUrl = functions.config().render?.worker_url;

    if (!workerUrl) {
      functions.logger.error("render.worker_url config is not set. Cannot trigger render worker.");
      await snap.ref.update({
        status: "failed",
        errorMessage: "Render worker URL is not configured.",
        updatedAt: admin.firestore.Timestamp.now(),
      });
      return;
    }

    // Mark as processing before calling worker (idempotency guard)
    await snap.ref.update({
      status: "processing",
      updatedAt: admin.firestore.Timestamp.now(),
    });

    try {
      const response = await axios.post(
        `${workerUrl}/render`,
        { jobId },
        {
          timeout: 30000, // 30s for the HTTP handshake; worker runs async
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status !== 202 && response.status !== 200) {
        throw new Error(`Worker returned status ${response.status}`);
      }

      functions.logger.info(`Render job ${jobId} dispatched successfully.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      functions.logger.error(`Failed to dispatch render job ${jobId}:`, message);

      await snap.ref.update({
        status: "failed",
        errorMessage: message,
        updatedAt: admin.firestore.Timestamp.now(),
      });
    }
  });

/**
 * Manual retry endpoint for failed reel jobs.
 */
export const retryReelJob = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be authenticated.");
  }

  const { jobId } = request.data as { jobId: string };
  if (!jobId) {
    throw new functions.https.HttpsError("invalid-argument", "jobId is required.");
  }

  const jobRef = db.collection("reelJobs").doc(jobId);
  const jobSnap = await jobRef.get();
  if (!jobSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Job not found.");
  }

  const job = jobSnap.data()!;
  if (job.status !== "failed") {
    throw new functions.https.HttpsError("failed-precondition", "Only failed jobs can be retried.");
  }

  // Verify requester is the player whose job this is, or the room host
  if (job.playerId !== request.auth.uid) {
    const roomSnap = await db.collection("rooms").doc(job.roomId).get();
    if (!roomSnap.exists || roomSnap.data()!.hostPlayerId !== request.auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Not authorized.");
    }
  }

  await jobRef.update({
    status: "queued",
    errorMessage: admin.firestore.FieldValue.delete(),
    updatedAt: admin.firestore.Timestamp.now(),
  });

  return { success: true };
});
