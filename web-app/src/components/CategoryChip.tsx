import React from "react";
import { CATEGORY_COLORS, CATEGORY_EMOJIS, type DareCategory } from "../types";

interface CategoryChipProps {
  category: DareCategory;
  size?: "sm" | "md";
}

export function CategoryChip({ category, size = "md" }: CategoryChipProps) {
  const color = CATEGORY_COLORS[category];
  const emoji = CATEGORY_EMOJIS[category];
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass}`}
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {emoji} {category}
    </span>
  );
}
