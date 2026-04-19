import React from "react";

interface PointsBadgeProps {
  points: number;
  size?: "sm" | "md" | "lg";
}

export function PointsBadge({ points, size = "md" }: PointsBadgeProps) {
  const sizeClass =
    size === "sm" ? "text-xs px-2 py-0.5" : size === "lg" ? "text-lg px-4 py-1" : "text-sm px-3 py-1";
  return (
    <span className={`inline-flex items-center gap-1 bg-gold/20 text-gold font-bold rounded-full border border-gold/40 ${sizeClass}`}>
      +{points}
    </span>
  );
}
