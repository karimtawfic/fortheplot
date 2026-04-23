import React from "react";
import type { Player } from "../types";
import { buildLeaderboard } from "../types";

interface ScoreboardProps {
  players: Player[];
  currentPlayerId?: string;
  showPodium?: boolean;
}

const PODIUM_COLORS = ["#C0C0C0", "#FFD700", "#CD7F32"];
const PODIUM_CROWNS = ["🥈", "🥇", "🥉"];
const PODIUM_HEIGHTS = [76, 96, 62];

export function Scoreboard({ players, currentPlayerId, showPodium = false }: ScoreboardProps) {
  const entries = buildLeaderboard(players);
  const top3 = entries.slice(0, 3);

  // Podium order: 2nd (left), 1st (centre), 3rd (right)
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="flex flex-col gap-2">
      {/* Podium — only shown on game-end screen */}
      {showPodium && top3.length >= 2 && (
        <div className="flex items-end justify-center gap-2 pb-4">
          {podiumOrder.map((entry, i) => {
            const color = PODIUM_COLORS[i];
            const crown = PODIUM_CROWNS[i];
            const height = PODIUM_HEIGHTS[i];
            const isMe = entry.playerId === currentPlayerId;

            return (
              <div key={entry.playerId} className="flex flex-col items-center gap-1" style={{ flex: "0 0 86px" }}>
                <span className="text-2xl">{crown}</span>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
                  style={{
                    background: "#16213E",
                    border: `2px solid ${color}88`,
                    boxShadow: isMe ? `0 0 12px ${color}66` : undefined,
                  }}
                >
                  {entry.avatarEmoji}
                </div>
                <span className="text-white text-xs font-bold text-center leading-tight truncate w-full px-1">
                  {entry.displayName}
                </span>
                <div
                  className="w-full rounded-t-xl flex items-start justify-center pt-1.5"
                  style={{
                    height,
                    background: `linear-gradient(180deg, ${color}33, ${color}11)`,
                    border: `1px solid ${color}44`,
                    borderBottom: "none",
                  }}
                >
                  <span className="font-black text-base" style={{ color }}>{entry.totalPoints}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Flat list */}
      {entries.map((entry) => {
        const isMe = entry.playerId === currentPlayerId;
        const rankEmoji = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : null;

        return (
          <div
            key={entry.playerId}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              isMe ? "bg-primary/20 border border-primary/40" : "bg-surface/60"
            }`}
          >
            <div className="w-8 text-center text-xl flex-shrink-0">
              {rankEmoji ?? <span className="text-white/30 font-bold text-sm">{entry.rank}</span>}
            </div>
            <span className="text-2xl">{entry.avatarEmoji}</span>
            <span className={`flex-1 font-semibold truncate ${isMe ? "text-primary" : "text-white"}`}>
              {entry.displayName}
              {isMe && <span className="ml-1 text-xs text-white/50">(you)</span>}
            </span>
            <span className={`font-bold ${isMe ? "text-gold" : "text-gold"}`}>{entry.totalPoints}</span>
          </div>
        );
      })}

      {entries.length === 0 && (
        <p className="text-white/40 text-sm text-center py-4">No players yet</p>
      )}
    </div>
  );
}
