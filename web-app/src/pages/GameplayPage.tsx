import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { DareCard } from "../components/DareCard";
import { Timer } from "../components/Timer";
import { Scoreboard } from "../components/Scoreboard";
import { ProofUpload } from "../components/ProofUpload";
import { useRoom, usePlayers } from "../hooks/useRoom";
import { useDares } from "../hooks/useDares";
import { useMySubmissions } from "../hooks/useSubmissions";
import { useAppStore } from "../store/appStore";
import type { Dare } from "../types";

type Tab = "dares" | "scoreboard";

export function GameplayPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentPlayer, updateRoom } = useAppStore();
  const { room } = useRoom(roomId ?? null);
  const players = usePlayers(roomId ?? null);
  const { dares } = useDares();
  const { submittedDareIds, submissionByDareId } = useMySubmissions(
    roomId ?? null,
    currentPlayer?.playerId ?? null
  );

  const [tab, setTab] = useState<Tab>("dares");
  const [selectedDare, setSelectedDare] = useState<Dare | null>(null);

  const isHost = room?.hostPlayerId === currentPlayer?.playerId;

  useEffect(() => {
    if (room) updateRoom(room);
    if (room?.status === "ended" || room?.status === "rendering") {
      navigate(`/end/${room.roomId}`, { replace: true });
    }
  }, [room, navigate, updateRoom]);

  if (!roomId || !currentPlayer) return null;

  function handleDareClick(dare: Dare) {
    if (!submittedDareIds.has(dare.dareId)) {
      setSelectedDare(dare);
      return;
    }
    // Allow retry for rejected dares
    const sub = submissionByDareId.get(dare.dareId);
    if (sub?.verificationStatus === "rejected") {
      setSelectedDare(dare);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 bg-bg/80 backdrop-blur sticky top-0 z-10 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentPlayer.avatarEmoji}</span>
          <span className="text-white font-semibold text-sm">{currentPlayer.displayName}</span>
          <span className="text-gold font-bold text-sm">{currentPlayer.totalPoints}pts</span>
        </div>
        <div className="flex items-center gap-3">
          {isHost && (
            <Link
              to={`/admin/${roomId}`}
              className="text-xs text-primary font-semibold bg-primary/10 px-2 py-1 rounded-lg"
            >
              Review
            </Link>
          )}
          <Timer endsAt={room?.endsAt} />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-white/10">
        {(["dares", "scoreboard"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
              tab === t ? "text-primary border-b-2 border-primary" : "text-white/40"
            }`}
          >
            {t === "dares" ? "🎯 Dares" : "🏆 Scores"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "dares" && (
          <div className="grid grid-cols-2 gap-3">
            {dares.map((dare) => (
              <DareCard
                key={dare.dareId}
                dare={dare}
                submission={submissionByDareId.get(dare.dareId)}
                onClick={() => handleDareClick(dare)}
              />
            ))}
            {dares.length === 0 && (
              <div className="col-span-2 text-white/40 text-center py-12">Loading dares…</div>
            )}
          </div>
        )}
        {tab === "scoreboard" && (
          <Scoreboard players={players} currentPlayerId={currentPlayer.playerId} />
        )}
      </div>

      {/* Proof upload sheet */}
      {selectedDare && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-bg rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1" />
            <ProofUpload
              dare={selectedDare}
              roomId={roomId}
              onSuccess={() => setSelectedDare(null)}
              onCancel={() => setSelectedDare(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
