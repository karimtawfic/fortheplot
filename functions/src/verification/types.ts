import type { DareSubmission, Room, Player, Dare, VerificationStatus, VerificationSource, SubmissionMetadata } from "../types";

export interface VerificationContext {
  room: Room;
  player: Player;
  dare: Dare;
  existingSubmissions: DareSubmission[];
  submittedAtMillis: number;
  mediaUrl: string;
  thumbnailUrl: string;
  mediaType: "image" | "video";
  metadata?: SubmissionMetadata;
}

export interface VerificationResult {
  status: VerificationStatus;
  reason?: string;
  source: VerificationSource;
  duplicateOfSubmissionId?: string;
}
