import React, { useEffect } from "react";
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
  const [starting, setStarting] = React.useState(false);
  const [error, setError] = React.useState("");

  useEffect(() => {
    if (room) updateRoom(room);
    if (room?.status === "live") {
      navigate(`/game/${room.roomId}`, { replace: true });
    }
  }, [room, navigate, updateRoom]);

  const isHost = currentPlayer?.isHost ?? false;

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

  return (
    <div className="min-h-screen bg-bg flex flex-col px-6 py-8 gap-6">
      <div className="flex flex-col items-center gap-2 pt-4">
        <h1 className="text-2xl font-bold text-white">Lobby</h1>
        <div className="flex items-center gap-2 bg-surface/60 px-4 py-2 rounded-xl">
          <span className="text-white/50 text-sm">Invite code:</span>
          <span className="text-white font-mono font-bold tracking-widest text-lg">
            {room?.inviteCode ?? "------"}
          </span>
          <button
            className="text-white/40 hover:text-white text-sm"
            onClick={() => room?.inviteCode && navigator.clipboard.writeText(room.inviteCode)}
          >
            📋
          </button>
        </div>
      </div>

      <div>
        <p className="text-white/50 text-sm mb-3">
          {players.length} player{players.length !== 1 ? "s" : ""} joined
        </p>
        <div className="flex flex-col gap-2">
          {players.map((p) => (
            <div key={p.playerId} className="flex items-center gap-3 bg-surface/60 rounded-xl px-4 py-3">
              <span className="text-2xl">{p.avatarEmoji}</span>
              <span className="text-white font-semibold flex-1">{p.displayName}</span>
              {p.isHost && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Host</span>}
              {p.playerId === currentPlayer?.playerId && (
                <span className="text-xs text-white/40">(you)</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        {room && (
          <p className="text-white/40 text-sm text-center">
            {room.timerMinutes} minute game
          </p>
        )}
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        {isHost ? (
          <Button size="lg" loading={starting} onClick={handleStart} disabled={players.length < 1}>
            🚀 Start Game
          </Button>
        ) : (
          <div className="bg-surface/60 rounded-xl p-4 text-center text-white/50 text-sm">
            Waiting for the host to start the game…
          </div>
        )}
      </div>
    </div>
  );
}
