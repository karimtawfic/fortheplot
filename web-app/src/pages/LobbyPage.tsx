import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { startGame } from "../repositories/roomRepository";
import { useRoom, usePlayers } from "../hooks/useRoom";
import { useAppStore } from "../store/appStore";

export function LobbyPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentPlayer, updateRoom } = useAppStore();
  const { room } = useRoom(roomId ?? null);
  const players = usePlayers(roomId ?? null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (room) updateRoom(room);
    if (room?.status === "live") {
      navigate(`/game/${room.roomId}`, { replace: true });
    }
  }, [room, navigate, updateRoom]);

  const isHost = currentPlayer?.isHost ?? false;
  const inviteCode = room?.inviteCode ?? "------";

  async function handleStart() {
    if (!roomId) return;
    setStarting(true);
    setError("");
    try {
      await startGame(roomId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start game");
      setStarting(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: "Join my For The Plot game!", text: `Use code: ${inviteCode}` });
    } else {
      handleCopy();
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col px-6 pt-safe relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="pt-8 pb-6 flex flex-col items-center gap-1 relative z-10">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Lobby</p>
        <h1 className="text-xl font-black text-white">Waiting for players…</h1>
      </div>

      {/* Room code card */}
      <div className="bg-surface border border-border rounded-3xl p-6 flex flex-col items-center gap-4 relative z-10">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Room code</p>
        <p className="text-5xl font-black tracking-[0.3em] text-primary font-mono">{inviteCode}</p>
        <div className="flex gap-2 w-full">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 rounded-2xl bg-surface-2 border border-border text-white/60 text-sm font-semibold hover:text-white transition-colors"
          >
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-2.5 rounded-2xl bg-surface-2 border border-border text-white/60 text-sm font-semibold hover:text-white transition-colors"
          >
            📤 Share
          </button>
        </div>
      </div>

      {/* Players list */}
      <div className="flex-1 flex flex-col gap-3 mt-6 relative z-10">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">
          {players.length} player{players.length !== 1 ? "s" : ""} joined
        </p>
        <div className="flex flex-col gap-2">
          {players.map((p) => {
            const isMe = p.playerId === currentPlayer?.playerId;
            return (
              <div
                key={p.playerId}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 border transition-all ${
                  isMe ? "bg-primary/10 border-primary/30" : "bg-surface border-border"
                }`}
              >
                <span className="text-2xl">{p.avatarEmoji}</span>
                <span className={`flex-1 font-semibold truncate ${isMe ? "text-primary" : "text-white"}`}>
                  {p.displayName}
                </span>
                {p.isHost && (
                  <span className="text-xs bg-primary/20 text-primary px-2.5 py-1 rounded-full font-semibold">
                    Host
                  </span>
                )}
                {isMe && !p.isHost && (
                  <span className="text-xs text-white/30 font-medium">you</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="pb-safe pb-8 flex flex-col gap-3 mt-6 relative z-10">
        {room && (
          <p className="text-white/30 text-sm text-center">{room.timerMinutes} minute game</p>
        )}
        {error && <p className="text-accent text-sm text-center">{error}</p>}
        {isHost ? (
          <Button size="lg" loading={starting} onClick={handleStart} className="w-full">
            🚀 Start Game
          </Button>
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-4 text-center text-white/40 text-sm">
            Waiting for the host to start…
          </div>
        )}
      </div>
    </div>
  );
}
