import React from "react";
import { CATEGORY_COLORS, CATEGORY_EMOJIS, type Dare, type DareSubmission } from "../types";

interface DareCardProps {
  dare: Dare;
  submission?: DareSubmission;
  onClick?: () => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "#A5D6A7",
  medium: "#FFF176",
  hard: "#FF8A65",
  wild: "#E94560",
};

export function DareCard({ dare, submission, onClick }: DareCardProps) {
  const color = CATEGORY_COLORS[dare.category];
  const emoji = CATEGORY_EMOJIS[dare.category];
  const status = submission?.verificationStatus ?? null;
  const done = status === "approved";
  const pending = status && status !== "approved";
  const diffColor = DIFFICULTY_COLORS[dare.difficulty] ?? "#AAAACC";

  return (
    <button
      onClick={onClick}
      className="relative w-full aspect-square rounded-2xl overflow-hidden text-left transition-transform active:scale-95 focus:outline-none"
      style={{
        background: done
          ? "linear-gradient(160deg, rgba(76,175,80,0.3) 0%, #1A1A2E 75%)"
          : `linear-gradient(160deg, ${color}40 0%, #1A1A2E 70%)`,
        border: `1px solid ${done ? "rgba(76,175,80,0.4)" : `${color}33`}`,
      }}
    >
      {/* Faint oversized emoji watermark */}
      <span
        className="absolute select-none pointer-events-none"
        style={{ right: -12, bottom: -12, fontSize: 90, lineHeight: 1, opacity: 0.08 }}
        aria-hidden
      >
        {emoji}
      </span>

      <div className="relative z-10 flex flex-col h-full p-3 gap-1.5">
        {/* Top row: icon + points */}
        <div className="flex items-start justify-between">
          <div
            className="text-lg p-1.5 rounded-lg"
            style={{ background: done ? "rgba(76,175,80,0.2)" : `${color}22` }}
          >
            {done ? "✓" : emoji}
          </div>
          <div
            className="text-xs font-black px-1.5 py-0.5 rounded-full"
            style={{
              background: "linear-gradient(135deg, #FFD700, #FFA500)",
              color: "#1A1A2E",
            }}
          >
            +{done ? (submission?.pointsAwarded ?? dare.points) : dare.points}
          </div>
        </div>

        {/* Dare text */}
        <p
          className="text-white font-bold text-xs leading-snug flex-1 overflow-hidden"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            textDecoration: done ? "line-through" : "none",
            textDecorationColor: "rgba(255,255,255,0.3)",
          }}
        >
          {dare.text}
        </p>

        {/* Bottom row: difficulty + status indicator */}
        <div className="flex items-center justify-between">
          <span
            className="font-black uppercase"
            style={{ color: diffColor, fontSize: 8, letterSpacing: "0.07em" }}
          >
            ● {dare.difficulty}
          </span>
          {pending && (
            <span className="text-sm leading-none">
              {status === "needs_review" ? "🕐" : status === "rejected" ? "✕" : "⏳"}
            </span>
          )}
          {status === "rejected" && (
            <span className="text-primary text-xs font-semibold">Retry</span>
          )}
        </div>
      </div>
    </button>
  );
}
