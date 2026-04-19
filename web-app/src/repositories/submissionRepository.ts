import { collection, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { callApi } from "../lib/api";
import { subscribeCollection } from "../lib/firestore";
import type { DareSubmission, SubmissionMetadata, VerificationStatus } from "../types";

export interface SubmitDareArgs {
  submissionId: string;
  roomId: string;
  dareId: string;
  mediaUrl: string;
  thumbnailUrl: string;
  mediaType: "image" | "video";
  metadata?: SubmissionMetadata;
}

export interface SubmitDareResult {
  submissionId: string;
  pointsAwarded: number;
  newTotal: number;
  verificationStatus: VerificationStatus;
  verificationReason?: string;
}

export interface ReviewSubmissionArgs {
  roomId: string;
  submissionId: string;
  action: "approve" | "reject";
  reason?: string;
}

export interface ReviewSubmissionResult {
  submissionId: string;
  action: "approved" | "rejected";
  pointsAwarded: number;
}

export const submitDare = (args: SubmitDareArgs) =>
  callApi<SubmitDareResult>("/api/submitDare", args);

export const callReviewSubmission = (args: ReviewSubmissionArgs) =>
  callApi<ReviewSubmissionResult>("/api/admin/reviewSubmission", args);

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

export function subscribeToNeedsReview(
  roomId: string,
  onData: (submissions: DareSubmission[]) => void,
  onError?: (err: Error) => void
): () => void {
  return subscribeCollection<DareSubmission>(
    query(
      collection(db, "rooms", roomId, "submissions"),
      where("verificationStatus", "==", "needs_review"),
      orderBy("createdAt", "asc")
    ),
    onData,
    onError
  );
}
