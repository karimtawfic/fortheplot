// Mirror of functions/src/verification — kept in sync manually.
// Can't cross-import from functions/ since Vercel compiles API routes independently.

import type { DocumentData } from "firebase-admin/firestore";

export type VerificationStatus = "pending" | "approved" | "rejected" | "needs_review";
export type VerificationSource = "rule_engine" | "ai" | "admin";
export type VerificationMode = "none" | "media_required" | "ai_check" | "admin_review";
export type MediaType = "image" | "video";

export interface SubmissionMetadata {
  fileSizeBytes?: number;
  durationSeconds?: number;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface VerificationResult {
  status: VerificationStatus;
  reason?: string;
  source: VerificationSource;
  duplicateOfSubmissionId?: string;
}

// ─── Limits (mirror of mediaLimits.ts) ───────────────────────────────────────

const IMAGE_MAX_SIZE_BYTES = 50 * 1024 * 1024;
const VIDEO_MAX_SIZE_BYTES = 200 * 1024 * 1024;
const VIDEO_MAX_DURATION_SECONDS = 120;
const GRACE_WINDOW_MS = 30_000;
const DUPLICATE_WINDOW_MS = 60_000;

const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const ALLOWED_VIDEO_MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const ALLOWED_MIME_TYPES = [...ALLOWED_IMAGE_MIME_TYPES, ...ALLOWED_VIDEO_MIME_TYPES];

// ─── Rule Engine ──────────────────────────────────────────────────────────────

export interface VerificationContext {
  room: DocumentData;
  player: DocumentData;
  dare: DocumentData;
  existingSubmissions: DocumentData[];
  playerId: string;
  submittedAtMillis: number;
  mediaUrl: string;
  thumbnailUrl: string;
  mediaType: MediaType;
  metadata?: SubmissionMetadata;
}

export function runRuleEngine(ctx: VerificationContext): VerificationResult {
  const l1 = checkL1(ctx);
  if (l1) return l1;

  const l2 = checkL2(ctx);
  if (l2) return l2;

  const l3 = checkL3(ctx);
  if (l3) return l3;

  return routeVerificationMode(ctx);
}

function checkL1(ctx: VerificationContext): VerificationResult | null {
  const { room, dare, playerId, existingSubmissions, submittedAtMillis } = ctx;

  if (room.status !== "live") return reject("Game is not active");

  if (room.endsAt) {
    const endsAtMillis = room.endsAt.toMillis ? room.endsAt.toMillis() : Number(room.endsAt);
    if (submittedAtMillis > endsAtMillis + GRACE_WINDOW_MS) return reject("Game timer has expired");
  }

  if (!dare.active) return reject("Dare is no longer active");

  const repeatable = dare.repeatable ?? false;
  if (!repeatable) {
    const alreadyCompleted = existingSubmissions
      .filter((s) => s.verificationStatus !== "rejected")
      .some((s) => s.playerId === playerId && s.dareId === dare.dareId);
    if (alreadyCompleted) return reject("Dare already completed");
  }

  return null;
}

function checkL2(ctx: VerificationContext): VerificationResult | null {
  const { dare, mediaUrl, thumbnailUrl, metadata, mediaType } = ctx;

  if (!mediaUrl.startsWith("https://") || !thumbnailUrl.startsWith("https://")) {
    return reject("Invalid media URL");
  }

  const mode: VerificationMode = dare.verificationMode ?? "media_required";
  if (mode === "media_required" && !mediaUrl) return reject("Media is required for this dare");

  if (metadata) {
    const { mimeType, fileSizeBytes, durationSeconds } = metadata;
    if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) return reject(`Unsupported media type: ${mimeType}`);
    if (mediaType === "image" && fileSizeBytes !== undefined && fileSizeBytes > IMAGE_MAX_SIZE_BYTES) return reject("Image exceeds 50 MB limit");
    if (mediaType === "video") {
      if (fileSizeBytes !== undefined && fileSizeBytes > VIDEO_MAX_SIZE_BYTES) return reject("Video exceeds 200 MB limit");
      if (durationSeconds !== undefined && durationSeconds > VIDEO_MAX_DURATION_SECONDS) return reject("Video exceeds 2 minute limit");
    }
  }

  return null;
}

function checkL3(ctx: VerificationContext): VerificationResult | null {
  const { existingSubmissions, submittedAtMillis, metadata } = ctx;
  if (!metadata?.fileSizeBytes) return null;

  const dup = existingSubmissions.find((s) => {
    if (s.metadata?.fileSizeBytes !== metadata.fileSizeBytes) return false;
    const createdMs = s.createdAt?.toMillis ? s.createdAt.toMillis() : 0;
    return Math.abs(createdMs - submittedAtMillis) < DUPLICATE_WINDOW_MS;
  });

  if (dup) {
    return { status: "rejected", reason: "Duplicate media detected", source: "rule_engine", duplicateOfSubmissionId: dup.submissionId };
  }

  return null;
}

function routeVerificationMode(ctx: VerificationContext): VerificationResult {
  const mode: VerificationMode = ctx.dare.verificationMode ?? "media_required";
  if (mode === "none" || mode === "media_required") return { status: "approved", source: "rule_engine" };
  if (mode === "admin_review") return { status: "needs_review", reason: "Admin review required", source: "rule_engine" };
  // ai_check — stub: always needs_review
  return { status: "needs_review", reason: "AI verification pending", source: "ai" };
}

function reject(reason: string): VerificationResult {
  return { status: "rejected", reason, source: "rule_engine" };
}
