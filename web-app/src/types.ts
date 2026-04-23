// Web-side mirror of functions/src/types.ts
// Keep in sync with the backend types.

import type { Timestamp } from "firebase/firestore";

// ─── Room ─────────────────────────────────────────────────────────────────────

export type RoomStatus = "lobby" | "live" | "ended" | "rendering";

export interface Room {
  roomId: string;
  hostPlayerId: string;
  createdAt: Timestamp;
  status: RoomStatus;
  timerMinutes: number;
  startedAt?: Timestamp;
  endsAt?: Timestamp;
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
  joinedAt: Timestamp;
  isHost: boolean;
  lastSeenAt: Timestamp;
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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
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
  createdAt: Timestamp;
  renderEligible: boolean;
  verificationStatus: VerificationStatus;
  verificationReason?: string;
  verificationSource?: VerificationSource;
  verifiedAt?: Timestamp;
  duplicateOfSubmissionId?: string;
  metadata?: SubmissionMetadata;
}

// ─── Reel Job ─────────────────────────────────────────────────────────────────

export type ReelJobType = "personal" | "group";
export type ReelJobStatus = "queued" | "processing" | "complete" | "failed";

export interface ReelJob {
  jobId: string;
  roomId: string;
  playerId: string | null;
  type: ReelJobType;
  status: ReelJobStatus;
  outputUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  errorMessage?: string;
}

// ─── UI-only types ────────────────────────────────────────────────────────────

export interface ScoreEntry {
  playerId: string;
  displayName: string;
  avatarEmoji: string;
  totalPoints: number;
  rank: number;
}

export function buildLeaderboard(players: Player[]): ScoreEntry[] {
  return [...players]
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return a.joinedAt.toMillis() - b.joinedAt.toMillis();
    })
    .map((p, i) => ({
      playerId: p.playerId,
      displayName: p.displayName,
      avatarEmoji: p.avatarEmoji,
      totalPoints: p.totalPoints,
      rank: i + 1,
    }));
}

export function isVerificationTerminal(status: VerificationStatus): boolean {
  return status === "approved" || status === "rejected";
}

export const CATEGORY_COLORS: Record<DareCategory, string> = {
  social: "#4FC3F7",
  physical: "#FF8A65",
  creative: "#CE93D8",
  food: "#FFF176",
  outdoor: "#A5D6A7",
};

export const CATEGORY_EMOJIS: Record<DareCategory, string> = {
  social: "🤝",
  physical: "💪",
  creative: "🎨",
  food: "🍕",
  outdoor: "🌿",
};

export const DIFFICULTY_LABELS: Record<DareDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  wild: "Wild!",
};

export const TIMER_OPTIONS = [30, 60, 90, 120, 180, 240];

export const EMOJI_OPTIONS = [
  "🦊","🐙","🌸","🦁","🐸","🍄","🐨","🦋","🍕","🌈","🪐","🔥","👽","🎸","🧚",
];
