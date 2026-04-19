import {
  IMAGE_MAX_SIZE_BYTES,
  VIDEO_MAX_SIZE_BYTES,
  VIDEO_MAX_DURATION_SECONDS,
  ALLOWED_MIME_TYPES,
  GRACE_WINDOW_MS,
} from "../utils/mediaLimits";
import type { VerificationContext, VerificationResult } from "./types";

const DUPLICATE_WINDOW_MS = 60_000;

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
  const { room, dare, player, existingSubmissions, submittedAtMillis } = ctx;

  if (room.status !== "live") {
    return reject("Game is not active");
  }

  if (room.endsAt) {
    const endsAtMillis = room.endsAt.toMillis();
    if (submittedAtMillis > endsAtMillis + GRACE_WINDOW_MS) {
      return reject("Game timer has expired");
    }
  }

  if (!dare.active) {
    return reject("Dare is no longer active");
  }

  if (!dare.repeatable) {
    const alreadyCompleted = existingSubmissions
      .filter((s) => s.verificationStatus !== "rejected")
      .some((s) => s.playerId === player.playerId && s.dareId === dare.dareId);
    if (alreadyCompleted) {
      return reject("Dare already completed");
    }
  }

  return null;
}

function checkL2(ctx: VerificationContext): VerificationResult | null {
  const { dare, mediaUrl, thumbnailUrl, metadata } = ctx;

  if (!mediaUrl.startsWith("https://") || !thumbnailUrl.startsWith("https://")) {
    return reject("Invalid media URL");
  }

  if (dare.verificationMode === "media_required" && !mediaUrl) {
    return reject("Media is required for this dare");
  }

  if (metadata) {
    const { mimeType, fileSizeBytes, durationSeconds } = metadata;

    if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
      return reject(`Unsupported media type: ${mimeType}`);
    }

    if (ctx.mediaType === "image" && fileSizeBytes !== undefined && fileSizeBytes > IMAGE_MAX_SIZE_BYTES) {
      return reject("Image exceeds 50 MB limit");
    }

    if (ctx.mediaType === "video") {
      if (fileSizeBytes !== undefined && fileSizeBytes > VIDEO_MAX_SIZE_BYTES) {
        return reject("Video exceeds 200 MB limit");
      }
      if (durationSeconds !== undefined && durationSeconds > VIDEO_MAX_DURATION_SECONDS) {
        return reject("Video exceeds 2 minute limit");
      }
    }
  }

  return null;
}

function checkL3(ctx: VerificationContext): VerificationResult | null {
  const { existingSubmissions, submittedAtMillis, metadata } = ctx;

  if (!metadata?.fileSizeBytes) return null;

  const duplicate = existingSubmissions.find((s) => {
    if (s.metadata?.fileSizeBytes !== metadata.fileSizeBytes) return false;
    const delta = Math.abs(s.createdAt.toMillis() - submittedAtMillis);
    return delta < DUPLICATE_WINDOW_MS;
  });

  if (duplicate) {
    return {
      status: "rejected",
      reason: "Duplicate media detected",
      source: "rule_engine",
      duplicateOfSubmissionId: duplicate.submissionId,
    };
  }

  return null;
}

function routeVerificationMode(ctx: VerificationContext): VerificationResult {
  const mode = ctx.dare.verificationMode;

  if (mode === "none" || mode === "media_required") {
    return { status: "approved", source: "rule_engine" };
  }

  if (mode === "admin_review") {
    return { status: "needs_review", reason: "Admin review required", source: "rule_engine" };
  }

  // ai_check — delegate to AI hook (caller handles async)
  return { status: "needs_review", reason: "AI verification pending", source: "ai" };
}

function reject(reason: string): VerificationResult {
  return { status: "rejected", reason, source: "rule_engine" };
}
