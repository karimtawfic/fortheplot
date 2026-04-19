import { runRuleEngine } from "../verification/RuleEngine";
import type { VerificationContext } from "../verification/types";
import type { Room, Player, Dare, DareSubmission } from "../types";
import * as admin from "firebase-admin";

// Minimal Timestamp mock
function ts(ms: number) {
  return { toMillis: () => ms } as admin.firestore.Timestamp;
}

function makeCtx(overrides: Partial<VerificationContext> = {}): VerificationContext {
  const now = Date.now();
  return {
    room: {
      roomId: "r1",
      status: "live",
      endsAt: ts(now + 60_000),
    } as unknown as Room,
    player: { playerId: "p1", totalPoints: 0 } as unknown as Player,
    dare: {
      dareId: "d1",
      active: true,
      repeatable: false,
      verificationMode: "media_required",
      points: 20,
    } as unknown as Dare,
    existingSubmissions: [],
    submittedAtMillis: now,
    mediaUrl: "https://storage.example.com/orig.jpg",
    thumbnailUrl: "https://storage.example.com/thumb.jpg",
    mediaType: "image",
    ...overrides,
  };
}

// ─── L1 Tests ─────────────────────────────────────────────────────────────────

describe("L1 — Entity checks", () => {
  it("rejects when room.status is not live", () => {
    const ctx = makeCtx({ room: { ...makeCtx().room, status: "ended" } as unknown as Room });
    expect(runRuleEngine(ctx).status).toBe("rejected");
  });

  it("rejects when timer has expired (beyond grace window)", () => {
    const past = Date.now() - 40_000; // 40s after endsAt (> 30s grace)
    const ctx = makeCtx({
      room: { ...makeCtx().room, status: "live", endsAt: ts(Date.now() - 40_000) } as unknown as Room,
      submittedAtMillis: Date.now(),
    });
    expect(runRuleEngine(ctx).status).toBe("rejected");
    expect(runRuleEngine(ctx).reason).toMatch(/expired/i);
  });

  it("allows submission within grace window", () => {
    const ctx = makeCtx({
      room: { ...makeCtx().room, status: "live", endsAt: ts(Date.now() - 10_000) } as unknown as Room,
      submittedAtMillis: Date.now(),
    });
    expect(runRuleEngine(ctx).status).toBe("approved");
  });

  it("rejects when dare is inactive", () => {
    const ctx = makeCtx({ dare: { ...makeCtx().dare, active: false } as unknown as Dare });
    expect(runRuleEngine(ctx).status).toBe("rejected");
  });

  it("rejects duplicate non-repeatable dare (approved existing)", () => {
    const ctx = makeCtx({
      existingSubmissions: [{
        submissionId: "s1", playerId: "p1", dareId: "d1", verificationStatus: "approved",
        createdAt: ts(Date.now() - 10_000),
      }] as unknown as DareSubmission[],
    });
    expect(runRuleEngine(ctx).status).toBe("rejected");
    expect(runRuleEngine(ctx).reason).toMatch(/already completed/i);
  });

  it("allows retry of a rejected dare", () => {
    const ctx = makeCtx({
      existingSubmissions: [{
        submissionId: "s1", playerId: "p1", dareId: "d1", verificationStatus: "rejected",
        createdAt: ts(Date.now() - 10_000),
      }] as unknown as DareSubmission[],
    });
    expect(runRuleEngine(ctx).status).toBe("approved");
  });

  it("allows repeatable dare even when already submitted", () => {
    const ctx = makeCtx({
      dare: { ...makeCtx().dare, repeatable: true } as unknown as Dare,
      existingSubmissions: [{
        submissionId: "s1", playerId: "p1", dareId: "d1", verificationStatus: "approved",
        createdAt: ts(Date.now() - 10_000),
      }] as unknown as DareSubmission[],
    });
    expect(runRuleEngine(ctx).status).toBe("approved");
  });
});

// ─── L2 Tests ─────────────────────────────────────────────────────────────────

describe("L2 — Media sanity checks", () => {
  it("rejects non-https mediaUrl", () => {
    const ctx = makeCtx({ mediaUrl: "http://insecure.com/a.jpg" });
    expect(runRuleEngine(ctx).status).toBe("rejected");
  });

  it("rejects non-https thumbnailUrl", () => {
    const ctx = makeCtx({ thumbnailUrl: "http://insecure.com/t.jpg" });
    expect(runRuleEngine(ctx).status).toBe("rejected");
  });

  it("rejects disallowed MIME type", () => {
    const ctx = makeCtx({ metadata: { mimeType: "audio/mpeg" } });
    expect(runRuleEngine(ctx).status).toBe("rejected");
  });

  it("rejects oversized image", () => {
    const ctx = makeCtx({ metadata: { fileSizeBytes: 60 * 1024 * 1024 } }); // 60 MB
    expect(runRuleEngine(ctx).status).toBe("rejected");
  });

  it("rejects oversized video", () => {
    const ctx = makeCtx({ mediaType: "video", metadata: { fileSizeBytes: 250 * 1024 * 1024 } });
    expect(runRuleEngine(ctx).status).toBe("rejected");
  });

  it("rejects video exceeding duration limit", () => {
    const ctx = makeCtx({ mediaType: "video", metadata: { durationSeconds: 150 } });
    expect(runRuleEngine(ctx).status).toBe("rejected");
  });

  it("accepts valid image with metadata", () => {
    const ctx = makeCtx({ metadata: { mimeType: "image/jpeg", fileSizeBytes: 1024 * 1024 } });
    expect(runRuleEngine(ctx).status).toBe("approved");
  });
});

// ─── L3 Tests ─────────────────────────────────────────────────────────────────

describe("L3 — Duplicate detection", () => {
  it("rejects when same file size submitted within 60s", () => {
    const ctx = makeCtx({
      metadata: { fileSizeBytes: 12345 },
      existingSubmissions: [{
        submissionId: "s2", playerId: "p2", dareId: "d2", verificationStatus: "approved",
        metadata: { fileSizeBytes: 12345 },
        createdAt: ts(Date.now() - 5_000),
      }] as unknown as DareSubmission[],
    });
    const result = runRuleEngine(ctx);
    expect(result.status).toBe("rejected");
    expect(result.reason).toMatch(/duplicate/i);
    expect(result.duplicateOfSubmissionId).toBe("s2");
  });

  it("does not flag duplicate when file size differs", () => {
    const ctx = makeCtx({
      metadata: { fileSizeBytes: 12345 },
      existingSubmissions: [{
        submissionId: "s2", playerId: "p2", dareId: "d2", verificationStatus: "approved",
        metadata: { fileSizeBytes: 99999 },
        createdAt: ts(Date.now() - 5_000),
      }] as unknown as DareSubmission[],
    });
    expect(runRuleEngine(ctx).status).toBe("approved");
  });

  it("does not flag duplicate outside 60s window", () => {
    const ctx = makeCtx({
      metadata: { fileSizeBytes: 12345 },
      existingSubmissions: [{
        submissionId: "s2", playerId: "p2", dareId: "d2", verificationStatus: "approved",
        metadata: { fileSizeBytes: 12345 },
        createdAt: ts(Date.now() - 90_000),
      }] as unknown as DareSubmission[],
    });
    expect(runRuleEngine(ctx).status).toBe("approved");
  });
});

// ─── verificationMode routing ─────────────────────────────────────────────────

describe("verificationMode routing", () => {
  it("none → approved", () => {
    const ctx = makeCtx({ dare: { ...makeCtx().dare, verificationMode: "none" } as unknown as Dare });
    expect(runRuleEngine(ctx).status).toBe("approved");
  });

  it("media_required → approved when media present", () => {
    const ctx = makeCtx();
    expect(runRuleEngine(ctx).status).toBe("approved");
  });

  it("admin_review → needs_review", () => {
    const ctx = makeCtx({ dare: { ...makeCtx().dare, verificationMode: "admin_review" } as unknown as Dare });
    const result = runRuleEngine(ctx);
    expect(result.status).toBe("needs_review");
    expect(result.reason).toMatch(/admin/i);
  });

  it("ai_check → needs_review with source ai", () => {
    const ctx = makeCtx({ dare: { ...makeCtx().dare, verificationMode: "ai_check" } as unknown as Dare });
    const result = runRuleEngine(ctx);
    expect(result.status).toBe("needs_review");
    expect(result.source).toBe("ai");
  });
});
