import * as admin from "firebase-admin";

// ─── Room ─────────────────────────────────────────────────────────────────────

export type RoomStatus = "lobby" | "live" | "ended" | "rendering";

export interface Room {
  roomId: string;
  hostPlayerId: string;
  createdAt: admin.firestore.Timestamp;
  status: RoomStatus;
  timerMinutes: number;
  startedAt?: admin.firestore.Timestamp;
  endsAt?: admin.firestore.Timestamp;
  currentPlayerCount: number;
  dareDeckVersion: string;
  personalReelsReadyCount: number;
  groupReelReady: boolean;
  inviteCode: string;
}

// ─── Player ───────────────────────────────────────────────────────────────────

export interface Player {
  playerId: string;
  roomId: string;
  displayName: string;
  avatarEmoji: string;
  totalPoints: number;
  joinedAt: admin.firestore.Timestamp;
  isHost: boolean;
  lastSeenAt: admin.firestore.Timestamp;
}

// ─── Dare ─────────────────────────────────────────────────────────────────────

export type DareCategory = "social" | "physical" | "creative" | "food" | "outdoor";
export type VerificationMode = "none" | "media_required" | "ai_check" | "admin_review";
export type DareDifficulty = "easy" | "medium" | "hard" | "wild";

export interface Dare {
  dareId: string;
  text: string;
  points: number;
  category: DareCategory;
  active: boolean;
  repeatable: boolean;
  verificationMode: VerificationMode;
  difficulty: DareDifficulty;
  createdAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
}

// ─── Submission ───────────────────────────────────────────────────────────────

export type MediaType = "image" | "video";
export type VerificationStatus = "pending" | "approved" | "rejected" | "needs_review";
export type VerificationSource = "rule_engine" | "ai" | "admin";

export interface SubmissionMetadata {
  fileSizeBytes?: number;
  durationSeconds?: number;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface DareSubmission {
  submissionId: string;
  roomId: string;
  playerId: string;
  dareId: string;
  dareTextSnapshot: string;
  pointsAwarded: number;
  pointsPotential: number;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl: string;
  createdAt: admin.firestore.Timestamp;
  renderEligible: boolean;
  verificationStatus: VerificationStatus;
  verificationReason?: string;
  verificationSource?: VerificationSource;
  verifiedAt?: admin.firestore.Timestamp;
  duplicateOfSubmissionId?: string;
  metadata?: SubmissionMetadata;
}

// ─── ScoreEntry ───────────────────────────────────────────────────────────────

export interface ScoreEntry {
  playerId: string;
  displayName: string;
  avatarEmoji: string;
  totalPoints: number;
  rank: number;
}

// ─── ReelJob ──────────────────────────────────────────────────────────────────

export type ReelJobType = "personal" | "group";
export type ReelJobStatus = "queued" | "processing" | "complete" | "failed";

export interface ReelJob {
  jobId: string;
  roomId: string;
  playerId: string | null;
  type: ReelJobType;
  status: ReelJobStatus;
  outputUrl?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  errorMessage?: string;
}

// ─── Cloud Function Payloads ──────────────────────────────────────────────────

export interface CreateRoomPayload {
  timerMinutes: number;
  displayName: string;
  avatarEmoji: string;
}

export interface CreateRoomResult {
  roomId: string;
  inviteCode: string;
  playerId: string;
}

export interface JoinRoomPayload {
  inviteCode: string;
  displayName: string;
  avatarEmoji: string;
}

export interface JoinRoomResult {
  roomId: string;
  playerId: string;
}

export interface StartGamePayload {
  roomId: string;
  timerMinutes: number;
}

export interface StartGameResult {
  endsAt: string;
}

export interface SubmitDarePayload {
  submissionId: string;
  roomId: string;
  dareId: string;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl: string;
  metadata?: SubmissionMetadata;
}

export interface SubmitDareResult {
  submissionId: string;
  pointsAwarded: number;
  newTotal: number;
  verificationStatus: VerificationStatus;
  verificationReason?: string;
}
