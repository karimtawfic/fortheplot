import { collection, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { callApi } from "../lib/api";
import { subscribeCollection } from "../lib/firestore";
import type { DareSubmission } from "../types";

interface SubmitDareArgs {
  roomId: string;
  dareId: string;
  mediaUrl: string;
  thumbnailUrl: string;
  mediaType: "photo" | "video";
}
interface SubmitDareResult { submissionId: string; pointsAwarded: number; }

export const submitDare = (args: SubmitDareArgs) =>
  callApi<SubmitDareResult>("/api/submitDare", args);

export function subscribeToMySubmissions(
  roomId: string,
  playerId: string,
  onData: (submissions: DareSubmission[]) => void,
  onError?: (err: Error) => void
): () => void {
  return subscribeCollection<DareSubmission>(
    query(collection(db, "rooms", roomId, "submissions"), where("playerId", "==", playerId)),
    onData,
    onError
  );
}

export function subscribeToAllSubmissions(
  roomId: string,
  onData: (submissions: DareSubmission[]) => void,
  onError?: (err: Error) => void
): () => void {
  return subscribeCollection<DareSubmission>(
    query(collection(db, "rooms", roomId, "submissions"), orderBy("createdAt", "desc")),
    onData,
    onError
  );
}
