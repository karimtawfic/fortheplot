import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Scoreboard } from "../components/Scoreboard";
import { Button } from "../components/Button";
import { useRoom, usePlayers } from "../hooks/useRoom";
import { useAppStore } from "../store/appStore";

export function GameEndPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentPlayer, updateRoom } = useAppStore();
  const { room } = useRoom(roomId ?? null);
  const players = usePlayers(roomId ?? null);

  useEffect(() => {
    if (room) updateRoom(room);
    if (room?.status === "rendering" || room?.status === "ended") {
      // stay here — show leaderboard and offer reel navigation
    }
  }, [room, updateRoom]);

  return (
    <div className="min-h-screen bg-bg flex flex-col px-6 py-8 gap-6">
      <div className="flex flex-col items-center gap-3 pt-4">
        <span className="text-6xl">🏆</span>
        <h1 className="text-3xl font-black text-white">Game Over!</h1>
        <p className="text-white/50 text-sm">Final scores</p>
      </div>

      <Scoreboard players={players} currentPlayerId={currentPlayer?.playerId} />

      <div className="mt-auto flex flex-col gap-3">
        {(room?.status === "rendering" || room?.personalReelsReadyCount !== undefined) && (
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate(`/reels/${roomId}`)}
          >
            🎬 View Reels
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            useAppStore.getState().clearSession();
            navigate("/home", { replace: true });
          }}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}
