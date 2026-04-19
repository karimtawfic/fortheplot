import { httpsCallable } from "firebase/functions";
import { collection, query, where, orderBy } from "firebase/firestore";
import { functions, db } from "../firebase";
import { subscribeCollection } from "../lib/firestore";
import type { DareSubmission } from "../types";

interface SubmitDareArgs {
  roomId: string;
  dareId: string;
  mediaUrl: string;
  thumbnailUrl: string;
  mediaType: "photo" | "video";
}
interface SubmitDareResult {
  submissionId: string;
  pointsAwarded: number;
}

export async function submitDare(args: SubmitDareArgs): Promise<SubmitDareResult> {
  const fn = httpsCallable<SubmitDareArgs, SubmitDareResult>(functions, "submitDare");
  const result = await fn(args);
  return result.data;
}

export function subscribeToMySubmissions(
  roomId: string,
  playerId: string,
  onData: (submissions: DareSubmission[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, "rooms", roomId, "submissions"),
    where("playerId", "==", playerId)
  );
  return subscribeCollection<DareSubmission>(q, onData, onError);
}

export function subscribeToAllSubmissions(
  roomId: string,
  onData: (submissions: DareSubmission[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, "rooms", roomId, "submissions"),
    orderBy("createdAt", "desc")
  );
  return subscribeCollection<DareSubmission>(q, onData, onError);
}
