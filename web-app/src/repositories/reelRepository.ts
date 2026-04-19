import { collection, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { subscribeCollection } from "../lib/firestore";
import type { ReelJob } from "../types";

export function subscribeToReelJobs(
  roomId: string,
  onData: (jobs: ReelJob[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, "reelJobs"), where("roomId", "==", roomId));
  return subscribeCollection<ReelJob>(q, onData, onError);
}

export function subscribeToMyReelJob(
  roomId: string,
  playerId: string,
  onData: (job: ReelJob | null) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, "reelJobs"),
    where("roomId", "==", roomId),
    where("playerId", "==", playerId),
    where("type", "==", "personal")
  );
  return subscribeCollection<ReelJob>(q, (jobs) => onData(jobs[0] ?? null), onError);
}

export function subscribeToGroupReelJob(
  roomId: string,
  onData: (job: ReelJob | null) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, "reelJobs"),
    where("roomId", "==", roomId),
    where("type", "==", "group")
  );
  return subscribeCollection<ReelJob>(q, (jobs) => onData(jobs[0] ?? null), onError);
}
