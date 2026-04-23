import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { useRoom, usePlayers } from "../hooks/useRoom";
import { useAppStore } from "../store/appStore";
import { buildLeaderboard } from "../types";

const CONFETTI_COLORS = ["#FF6B35", "#E94560", "#FFD700", "#4FC3F7", "#CE93D8"];

export function GameEndPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentPlayer, updateRoom } = useAppStore();
  const { room } = useRoom(roomId ?? null);
  const players = usePlayers(roomId ?? null);

  useEffect(() => {
    if (room) updateRoom(room);
  }, [room, updateRoom]);

  const leaderboard = buildLeaderboard(players);
  const winner = leaderboard[0];
  const me = leaderboard.find((e) => e.playerId === currentPlayer?.playerId);
  const myRank = me?.rank ?? 0;
  const myPoints = me?.totalPoints ?? 0;
  const isWinner = winner?.playerId === currentPlayer?.playerId;
  const rankEmoji = myRank === 1 ? "🥇" : myRank === 2 ? "🥈" : myRank === 3 ? "🥉" : null;

  return (
    <div className="min-h-screen bg-bg flex flex-col px-5 relative overflow-hidden">
      {/* Confetti squares */}
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            top: `${(i * 53) % 90}%`,
            left: `${(i * 37) % 95}%`,
            background: CONFETTI_COLORS[i % 5],
            opacity: 0.28,
            transform: `rotate(${i * 45}deg)`,
          }}
        />
      ))}

      <div className="flex-1 flex flex-col relative z-10 pt-safe pt-12 pb-8">
        {/* Header */}
        <div className="text-center mb-3">
          <div className="text-5xl leading-none mb-2">🎉</div>
          <h1
            className="font-black leading-none mb-2"
            style={{
              fontSize: 32,
              letterSpacing: -1.2,
              background: "linear-gradient(135deg, #FF6B35, #E94560)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Game Over!
          </h1>
          {winner && (
            <p className="font-bold" style={{ fontSize: 13, color: "#FFD700" }}>
              {winner.avatarEmoji} {isWinner ? "You won!" : `${winner.displayName} wins`} with {winner.totalPoints} pts
            </p>
          )}
        </div>

        {/* Your Score card */}
        <div
          className="rounded-2xl p-4 text-center mb-3"
          style={{
            background: "linear-gradient(160deg, rgba(255,215,0,0.12), #1A1A2E)",
            border: "1.5px solid rgba(255,215,0,0.4)",
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-lg">{rankEmoji ?? (myRank > 0 ? `#${myRank}` : "")}</span>
            <span
              className="font-black uppercase text-white/40"
              style={{ fontSize: 11, letterSpacing: "0.15em" }}
            >
              Your Score
            </span>
          </div>
          <div className="font-black text-gold tabular-nums leading-none" style={{ fontSize: 44 }}>
            {myPoints}
          </div>
          <p className="text-white/40 mt-1" style={{ fontSize: 11 }}>
            points
          </p>
        </div>

        {/* Reels */}
        <p className="font-black uppercase text-white/40 mb-2" style={{ fontSize: 11, letterSpacing: "0.15em" }}>
          Your Reels
        </p>
        <div className="flex flex-col gap-2 mb-4">
          <button
            onClick={() => navigate(`/reels/${roomId}`)}
            className="flex items-center gap-3 rounded-2xl p-3 active:scale-[0.98] transition-all text-left"
            style={{
              background: "linear-gradient(135deg, #FF6B35, #E94560)",
              boxShadow: "0 8px 20px rgba(255,107,53,0.3)",
            }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              🎬
            </div>
            <div className="flex-1">
              <p className="text-white font-black leading-tight" style={{ fontSize: 13 }}>My Personal Reel</p>
              <p className="text-white/70 mt-0.5" style={{ fontSize: 10 }}>60-sec highlight</p>
            </div>
            <span className="text-white/80 text-base">→</span>
          </button>

          <button
            onClick={() => navigate(`/reels/${roomId}/preview`)}
            className="flex items-center gap-3 rounded-2xl p-3 active:scale-[0.98] transition-all text-left border border-border"
            style={{ background: "#1A1A2E" }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
              style={{ background: "rgba(79,195,247,0.15)" }}
            >
              👥
            </div>
            <div className="flex-1">
              <p className="text-white font-black leading-tight" style={{ fontSize: 13 }}>Group Reel</p>
              <p className="text-white/40 mt-0.5" style={{ fontSize: 10 }}>
                {room?.groupReelReady ? "Ready to watch" : "Generating…"}
              </p>
            </div>
            <span className="text-white/40 text-base">→</span>
          </button>
        </div>

        {/* Final standings */}
        <p className="font-black uppercase text-white/40 mb-2" style={{ fontSize: 11, letterSpacing: "0.15em" }}>
          Final Standings
        </p>
        <div className="rounded-2xl p-3 border border-border" style={{ background: "#1A1A2E" }}>
          {leaderboard.map((entry) => {
            const isMe = entry.playerId === currentPlayer?.playerId;
            const entryRankEmoji =
              entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : null;
            return (
              <div key={entry.playerId} className="flex items-center gap-2 py-1">
                <div
                  className="font-black text-center"
                  style={{ width: 22, fontSize: 12, color: entry.rank <= 3 ? "#FFD700" : "#AAAACC" }}
                >
                  {entryRankEmoji ?? `#${entry.rank}`}
                </div>
                <span style={{ fontSize: 16 }}>{entry.avatarEmoji}</span>
                <span
                  className="flex-1 font-bold truncate"
                  style={{ fontSize: 12, color: isMe ? "#FFD700" : "#fff" }}
                >
                  {entry.displayName}
                  {isMe && (
                    <span className="text-white/40 font-normal ml-1" style={{ fontSize: 10 }}>
                      (you)
                    </span>
                  )}
                </span>
                <span
                  className="font-black tabular-nums flex-shrink-0"
                  style={{ fontSize: 12, color: isMe ? "#FFD700" : "#AAAACC" }}
                >
                  {entry.totalPoints}
                </span>
              </div>
            );
          })}
          {leaderboard.length === 0 && (
            <p className="text-white/30 text-sm text-center py-4">No results yet</p>
          )}
        </div>

        {/* Back to Home */}
        <div className="mt-4">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              useAppStore.getState().clearSession();
              navigate("/home", { replace: true });
            }}
          >
            🏠 Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
