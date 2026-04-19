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

export interface Dare {
  dareId: string;
  text: string;
  points: number;
  category: DareCategory;
  active: boolean;
}

// ─── Submission ───────────────────────────────────────────────────────────────

export type MediaType = "photo" | "video";

export interface DareSubmission {
  submissionId: string;
  roomId: string;
  playerId: string;
  dareId: string;
  dareTextSnapshot: string;
  pointsAwarded: number;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl: string;
  createdAt: admin.firestore.Timestamp;
  renderEligible: boolean;
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
  roomId: string;
  dareId: string;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl: string;
}

export interface SubmitDareResult {
  submissionId: string;
  pointsAwarded: number;
  newTotal: number;
}
