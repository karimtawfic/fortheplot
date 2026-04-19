import { runRuleEngine } from "./RuleEngine";
import { verifyWithAI } from "./AIVerificationHook";
import type { VerificationContext, VerificationResult } from "./types";

export interface IVerificationService {
  verify(ctx: VerificationContext): Promise<VerificationResult>;
}

class DefaultVerificationService implements IVerificationService {
  async verify(ctx: VerificationContext): Promise<VerificationResult> {
    const result = runRuleEngine(ctx);

    // If rule engine deferred to AI, invoke the AI hook
    if (result.status === "needs_review" && result.source === "ai") {
      return verifyWithAI(ctx);
    }

    return result;
  }
}

export function createVerificationService(): IVerificationService {
  return new DefaultVerificationService();
}
