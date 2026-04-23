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
  const me = leaderboard.find(e => e.playerId === currentPlayer?.playerId);
  const myRank = me?.rank ?? 0;
  const myPoints = me?.totalPoints ?? currentPlayer?.totalPoints ?? 0;
  const groupReelReady = room?.groupReelReady ?? false;

  return (
    <div className="min-h-screen bg-bg flex flex-col relative overflow-hidden">
      {/* Confetti dots */}
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-sm pointer-events-none"
          style={{
            top: `${(i * 53) % 90}%`,
            left: `${(i * 37) % 95}%`,
            background: CONFETTI_COLORS[i % 5],
            opacity: 0.3,
            transform: `rotate(${i * 45}deg)`,
            animation: `gameend-float ${3 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}

      <div className="flex-1 flex flex-col px-5 pt-14 pb-8 relative z-10 overflow-y-auto gap-3">
        {/* Header */}
        <div className="text-center">
          <div className="text-5xl leading-none mb-1">🎉</div>
          <h1
            className="text-3xl font-black leading-tight mb-1"
            style={{
              background: "linear-gradient(135deg, #FF6B35, #E94560)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Game Over!
          </h1>
          <p className="text-gold text-sm font-bold">
            {winner?.avatarEmoji}{" "}
            {winner?.playerId === currentPlayer?.playerId
              ? "You won!"
              : `${winner?.displayName ?? "?"} wins`}{" "}
            with {winner?.totalPoints ?? 0} pts
          </p>
        </div>

        {/* My score card */}
        <div
          className="rounded-2xl p-4 text-center border"
          style={{
            background: "linear-gradient(160deg, rgba(255,215,0,0.12), #1A1A2E)",
            borderColor: "rgba(255,215,0,0.35)",
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-lg">
              {myRank === 1 ? "🥇" : myRank === 2 ? "🥈" : myRank === 3 ? "🥉" : myRank > 0 ? `#${myRank}` : "—"}
            </span>
            <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Your Score</p>
          </div>
          <p className="text-4xl font-black text-gold leading-tight tabular-nums">{myPoints}</p>
          <p className="text-xs text-white/40 mt-1">
            points{leaderboard.length > 0 ? ` · rank ${myRank} of ${leaderboard.length}` : ""}
          </p>
        </div>

        {/* Reels */}
        <div>
          <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-2">Your Reels</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate(`/reels/${roomId}`)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl active:scale-95 transition-all"
              style={{
                background: "linear-gradient(135deg, #FF6B35, #E94560)",
                boxShadow: "0 8px 20px rgba(255,107,53,0.3)",
              }}
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-base flex-shrink-0">
                🎬
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black text-white leading-tight">My Personal Reel</p>
                <p className="text-[10px] text-white/80 mt-0.5">60-sec highlight</p>
              </div>
              <span className="text-white text-base">→</span>
            </button>

            <button
              onClick={() => navigate(`/reels/${roomId}/preview`)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface border border-border active:scale-95 transition-all"
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ background: "rgba(79,195,247,0.2)" }}
              >
                👥
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black text-white leading-tight">Group Reel</p>
                <p className="text-[10px] text-white/50 mt-0.5 flex items-center gap-1">
                  {groupReelReady ? (
                    "Ready to watch"
                  ) : (
                    <>
                      <span className="w-2 h-2 border border-white/30 border-t-white/80 rounded-full inline-block animate-spin" />
                      Generating…
                    </>
                  )}
                </p>
              </div>
              <span className="text-white/40 text-base">→</span>
            </button>
          </div>
        </div>

        {/* Final standings */}
        <div className="bg-surface border border-border rounded-2xl p-3">
          <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-2">Final Standings</p>
          <div className="flex flex-col gap-0.5">
            {leaderboard.map(entry => {
              const isMe = entry.playerId === currentPlayer?.playerId;
              const rankEmoji =
                entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : null;
              return (
                <div key={entry.playerId} className="flex items-center gap-2 py-1">
                  <span
                    className="w-6 text-[11px] font-black text-center flex-shrink-0"
                    style={{ color: entry.rank <= 3 ? "#FFD700" : "#AAAACC" }}
                  >
                    {rankEmoji ?? `#${entry.rank}`}
                  </span>
                  <span className="text-base flex-shrink-0">{entry.avatarEmoji}</span>
                  <span
                    className="flex-1 text-xs font-bold truncate"
                    style={{ color: isMe ? "#FFD700" : "#fff" }}
                  >
                    {entry.displayName}
                    {isMe && " (you)"}
                  </span>
                  <span
                    className="text-xs font-black flex-shrink-0 tabular-nums"
                    style={{ color: isMe ? "#FFD700" : "#AAAACC" }}
                  >
                    {entry.totalPoints}
                  </span>
                </div>
              );
            })}
            {leaderboard.length === 0 && (
              <p className="text-white/30 text-xs text-center py-3">Loading results…</p>
            )}
          </div>
        </div>

        <Button
          variant="secondary"
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
  );
}
