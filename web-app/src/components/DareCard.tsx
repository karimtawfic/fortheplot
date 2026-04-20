import React from "react";
import { CATEGORY_COLORS, CATEGORY_EMOJIS, type Dare, type DareSubmission } from "../types";
import { PointsBadge } from "./PointsBadge";
import { CategoryChip } from "./CategoryChip";

interface DareCardProps {
  dare: Dare;
  submission?: DareSubmission;
  onClick?: () => void;
}

export function DareCard({ dare, submission, onClick }: DareCardProps) {
  const color = CATEGORY_COLORS[dare.category];
  const emoji = CATEGORY_EMOJIS[dare.category];
  const status = submission?.verificationStatus ?? null;

  const hasThumbnail = !!submission?.thumbnailUrl;

  return (
    <button
      onClick={onClick}
      className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden text-left transition-transform active:scale-95 focus:outline-none"
      style={{
        background: status
          ? "transparent"
          : `linear-gradient(160deg, ${color}33 0%, #1A1A2E 80%)`,
        border: `1px solid ${color}44`,
      }}
    >
      {/* Thumbnail background for any submitted state */}
      {hasThumbnail && status && (
        <>
          <img
            src={submission!.thumbnailUrl}
            alt="proof"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className={`absolute inset-0 ${status === "approved" ? "bg-black/50" : "bg-black/70"}`} />
        </>
      )}

      {/* Approved */}
      {status === "approved" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span className="text-4xl">✅</span>
          <PointsBadge points={submission!.pointsAwarded} size="sm" />
        </div>
      )}

      {/* Pending (should resolve quickly for rule_engine verdicts) */}
      {status === "pending" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
          <span className="text-4xl">⏳</span>
          <p className="text-white/80 text-xs font-medium">Verifying…</p>
        </div>
      )}

      {/* Needs review (admin must approve) */}
      {status === "needs_review" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
          <span className="text-4xl">🕐</span>
          <p className="text-white/80 text-xs font-medium text-center px-2">Awaiting host</p>
        </div>
      )}

      {/* Rejected — tap to retry */}
      {status === "rejected" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
          <span className="text-4xl">✕</span>
          <p className="text-white/50 text-xs text-center px-3 line-clamp-2">
            {submission!.verificationReason ?? "Rejected"}
          </p>
          <p className="text-primary text-xs font-semibold">Tap to retry</p>
        </div>
      )}

      {/* Not yet attempted */}
      {!status && (
        <div className="absolute inset-0 flex flex-col p-4 gap-3">
          <div className="text-4xl">{emoji}</div>
          <p className="text-white font-semibold text-sm leading-snug flex-1">{dare.text}</p>
          <div className="flex items-center justify-between">
            <CategoryChip category={dare.category} size="sm" />
            <PointsBadge points={dare.points} size="sm" />
          </div>
        </div>
      )}
    </button>
  );
}
