import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Scoreboard } from "../components/Scoreboard";
import { Button } from "../components/Button";
import { useRoom, usePlayers } from "../hooks/useRoom";
import { useAppStore } from "../store/appStore";
import { buildLeaderboard } from "../types";

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
  const isWinner = winner?.playerId === currentPlayer?.playerId;

  return (
    <div className="min-h-screen bg-bg flex flex-col px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col items-center gap-3 pt-safe pt-10 pb-6 relative z-10 animate-fadeIn">
        <span className="text-6xl">🏆</span>
        <h1 className="text-3xl font-black text-white">
          {isWinner ? "You won! 🎉" : "Game Over!"}
        </h1>
        <p className="text-white/40 text-sm">Final results</p>
      </div>

      {/* Winner spotlight */}
      {winner && (
        <div
          className="rounded-3xl p-5 flex items-center gap-4 mb-6 border relative z-10 animate-scaleIn"
          style={{ background: "rgba(255, 215, 0, 0.08)", borderColor: "rgba(255, 215, 0, 0.3)" }}
        >
          <span className="text-4xl">{winner.avatarEmoji}</span>
          <div className="flex-1">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">Winner</p>
            <p className="text-white font-black text-xl">{winner.displayName}</p>
          </div>
          <div className="text-right">
            <p className="text-gold font-black text-2xl">{winner.totalPoints}</p>
            <p className="text-gold/60 text-xs">points</p>
          </div>
        </div>
      )}

      {/* Reel cards */}
      <div className="flex gap-3 mb-6 relative z-10">
        <button
          onClick={() => navigate(`/reels/${roomId}`)}
          className="flex-1 bg-surface border border-border rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-all"
        >
          <span className="text-3xl">🎬</span>
          <p className="text-white font-bold text-sm">Your Reel</p>
          <p className="text-white/40 text-xs">Personal highlight</p>
        </button>
        <button
          onClick={() => navigate(`/reels/${roomId}/preview`)}
          className="flex-1 bg-surface border border-border rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-all"
        >
          <span className="text-3xl">🌟</span>
          <p className="text-white font-bold text-sm">Group Reel</p>
          <p className="text-white/40 text-xs">Everyone's best</p>
        </button>
      </div>

      {/* Final standings */}
      <div className="flex-1 relative z-10">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Final standings</p>
        <Scoreboard players={players} currentPlayerId={currentPlayer?.playerId} />
      </div>

      {/* Home button */}
      <div className="pb-safe pb-8 mt-6 relative z-10">
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            useAppStore.getState().clearSession();
            navigate("/home", { replace: true });
          }}
        >
          ← Back to Home
        </Button>
      </div>
    </div>
  );
}
