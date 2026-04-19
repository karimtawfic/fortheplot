import * as admin from "firebase-admin";
import { ReelJob } from "../types";

const db = admin.firestore();

export async function createReelJobsInternal(roomId: string): Promise<string[]> {
  const playersSnap = await db
    .collection("rooms")
    .doc(roomId)
    .collection("players")
    .get();

  const now = admin.firestore.Timestamp.now();
  const batch = db.batch();
  const jobIds: string[] = [];

  // Personal reel for each player
  for (const playerDoc of playersSnap.docs) {
    const jobRef = db.collection("reelJobs").doc();
    const job: ReelJob = {
      jobId: jobRef.id,
      roomId,
      playerId: playerDoc.id,
      type: "personal",
      status: "queued",
      createdAt: now,
      updatedAt: now,
    };
    batch.set(jobRef, job);
    jobIds.push(jobRef.id);
  }

  // Group reel
  const groupJobRef = db.collection("reelJobs").doc();
  const groupJob: ReelJob = {
    jobId: groupJobRef.id,
    roomId,
    playerId: null,
    type: "group",
    status: "queued",
    createdAt: now,
    updatedAt: now,
  };
  batch.set(groupJobRef, groupJob);
  jobIds.push(groupJobRef.id);

  await batch.commit();
  return jobIds;
}
