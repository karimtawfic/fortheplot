import React from "react";
import { CATEGORY_COLORS, CATEGORY_EMOJIS, type Dare } from "../types";
import { PointsBadge } from "./PointsBadge";
import { CategoryChip } from "./CategoryChip";

interface DareCardProps {
  dare: Dare;
  completed?: boolean;
  thumbnailUrl?: string;
  onClick?: () => void;
}

export function DareCard({ dare, completed = false, thumbnailUrl, onClick }: DareCardProps) {
  const color = CATEGORY_COLORS[dare.category];
  const emoji = CATEGORY_EMOJIS[dare.category];

  return (
    <button
      onClick={onClick}
      className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden text-left transition-transform active:scale-95 focus:outline-none"
      style={{
        background: completed
          ? "transparent"
          : `linear-gradient(160deg, ${color}33 0%, #1A1A2E 80%)`,
        border: `1px solid ${color}44`,
      }}
    >
      {completed && thumbnailUrl && (
        <>
          <img
            src={thumbnailUrl}
            alt="proof"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </>
      )}

      {completed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span className="text-4xl">✅</span>
          <PointsBadge points={dare.points} size="sm" />
        </div>
      )}

      {!completed && (
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
