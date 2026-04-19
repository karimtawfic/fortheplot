import React from "react";
import type { Player } from "../types";
import { buildLeaderboard } from "../types";

interface ScoreboardProps {
  players: Player[];
  currentPlayerId?: string;
}

export function Scoreboard({ players, currentPlayerId }: ScoreboardProps) {
  const entries = buildLeaderboard(players);

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => {
        const isMe = entry.playerId === currentPlayerId;
        const rankEmoji = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `${entry.rank}.`;

        return (
          <div
            key={entry.playerId}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              isMe ? "bg-primary/20 border border-primary/40" : "bg-surface/60"
            }`}
          >
            <span className="text-xl w-8 text-center">{rankEmoji}</span>
            <span className="text-2xl">{entry.avatarEmoji}</span>
            <span className={`flex-1 font-semibold truncate ${isMe ? "text-primary" : "text-white"}`}>
              {entry.displayName}
              {isMe && <span className="ml-1 text-xs text-white/50">(you)</span>}
            </span>
            <span className="text-gold font-bold">{entry.totalPoints}</span>
          </div>
        );
      })}
      {entries.length === 0 && (
        <p className="text-white/40 text-sm text-center py-4">No players yet</p>
      )}
    </div>
  );
}
