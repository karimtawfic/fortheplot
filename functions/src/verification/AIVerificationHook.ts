import type { VerificationContext, VerificationResult } from "./types";

// Stub: always defers to human review. Replace with real model call when ready.
export async function verifyWithAI(_ctx: VerificationContext): Promise<VerificationResult> {
  return { status: "needs_review", reason: "AI verification pending", source: "ai" };
}
