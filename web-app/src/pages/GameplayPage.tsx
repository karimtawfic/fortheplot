import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { DareCard } from "../components/DareCard";
import { Timer } from "../components/Timer";
import { Scoreboard } from "../components/Scoreboard";
import { ProofUpload } from "../components/ProofUpload";
import { CategoryChip } from "../components/CategoryChip";
import { useRoom, usePlayers } from "../hooks/useRoom";
import { useDares } from "../hooks/useDares";
import { useMySubmissions } from "../hooks/useSubmissions";
import { useAppStore } from "../store/appStore";
import type { Dare, DareCategory } from "../types";

type Tab = "dares" | "scoreboard";
type ViewMode = "grid" | "list";

const CATEGORY_FILTERS: Array<{ label: string; value: DareCategory | "all" }> = [
  { label: "All", value: "all" },
  { label: "Social", value: "social" },
  { label: "Physical", value: "physical" },
  { label: "Creative", value: "creative" },
  { label: "Food", value: "food" },
  { label: "Outdoor", value: "outdoor" },
];

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
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [categoryFilter, setCategoryFilter] = useState<DareCategory | "all">("all");

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
    const sub = submissionByDareId.get(dare.dareId);
    if (sub?.verificationStatus === "rejected") {
      setSelectedDare(dare);
    }
  }

  const filteredDares = categoryFilter === "all"
    ? dares
    : dares.filter((d) => d.category === categoryFilter);

  const completedCount = submittedDareIds.size;
  const progressPct = dares.length > 0 ? Math.min((completedCount / dares.length) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur border-b border-white/5">
        <div className="flex items-center justify-between px-4 pt-safe pt-3 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentPlayer.avatarEmoji}</span>
            <div>
              <p className="text-white font-bold text-sm leading-none">{currentPlayer.displayName}</p>
              <p className="text-gold font-semibold text-xs mt-0.5">{currentPlayer.totalPoints} pts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isHost && (
              <Link
                to={`/admin/${roomId}`}
                className="text-xs text-primary font-semibold bg-primary/15 px-2.5 py-1.5 rounded-xl"
              >
                Review
              </Link>
            )}
            <div className="bg-surface border border-border rounded-xl px-3 py-1.5">
              <Timer endsAt={room?.endsAt} />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-1">
          <div className="h-1 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, #FF6B35, #E94560)",
              }}
            />
          </div>
          <p className="text-white/30 text-xs mt-1">{completedCount} of {dares.length} completed</p>
        </div>

        {/* Tab bar */}
        <div className="flex px-4 gap-1 pb-2">
          {(["dares", "scoreboard"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                tab === t
                  ? "text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
              style={tab === t ? { background: "linear-gradient(135deg, #FF6B35, #E94560)" } : undefined}
            >
              {t === "dares" ? "🎯 Dares" : "🏆 Scores"}
            </button>
          ))}
        </div>
      </div>

      {/* Dares tab */}
      {tab === "dares" && (
        <>
          {/* Filters + view toggle */}
          <div className="flex items-center gap-3 px-4 pt-3 pb-2">
            <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
              {CATEGORY_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setCategoryFilter(f.value)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    categoryFilter === f.value
                      ? "text-white border-transparent"
                      : "text-white/50 border-border hover:border-white/20 bg-surface"
                  }`}
                  style={
                    categoryFilter === f.value
                      ? { background: "linear-gradient(135deg, #FF6B35, #E94560)" }
                      : undefined
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-xl transition-colors ${viewMode === "grid" ? "bg-primary/20 text-primary" : "text-white/30 hover:text-white/60"}`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="0" y="0" width="7" height="7" rx="1.5" />
                  <rect x="9" y="0" width="7" height="7" rx="1.5" />
                  <rect x="0" y="9" width="7" height="7" rx="1.5" />
                  <rect x="9" y="9" width="7" height="7" rx="1.5" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-xl transition-colors ${viewMode === "list" ? "bg-primary/20 text-primary" : "text-white/30 hover:text-white/60"}`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="0" y="1" width="16" height="3" rx="1.5" />
                  <rect x="0" y="6.5" width="16" height="3" rx="1.5" />
                  <rect x="0" y="12" width="16" height="3" rx="1.5" />
                </svg>
              </button>
            </div>
          </div>

          {/* Dare list/grid */}
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredDares.map((dare) => (
                  <DareCard
                    key={dare.dareId}
                    dare={dare}
                    submission={submissionByDareId.get(dare.dareId)}
                    onClick={() => handleDareClick(dare)}
                  />
                ))}
                {filteredDares.length === 0 && (
                  <div className="col-span-2 text-white/40 text-center py-12">
                    {dares.length === 0 ? "Loading dares…" : "No dares in this category"}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredDares.map((dare) => (
                  <DareListRow
                    key={dare.dareId}
                    dare={dare}
                    submission={submissionByDareId.get(dare.dareId)}
                    onClick={() => handleDareClick(dare)}
                  />
                ))}
                {filteredDares.length === 0 && (
                  <div className="text-white/40 text-center py-12">
                    {dares.length === 0 ? "Loading dares…" : "No dares in this category"}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Scoreboard tab */}
      {tab === "scoreboard" && (
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
          <Scoreboard players={players} currentPlayerId={currentPlayer.playerId} />
        </div>
      )}

      {/* Proof upload sheet */}
      {selectedDare && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-bg rounded-t-3xl max-h-[90vh] overflow-y-auto">
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

// Inline list row component for list view mode
import type { DareSubmission } from "../types";
import { PointsBadge } from "../components/PointsBadge";
import { CATEGORY_COLORS, CATEGORY_EMOJIS } from "../types";

function DareListRow({
  dare,
  submission,
  onClick,
}: {
  dare: Dare;
  submission?: DareSubmission;
  onClick?: () => void;
}) {
  const color = CATEGORY_COLORS[dare.category];
  const emoji = CATEGORY_EMOJIS[dare.category];
  const status = submission?.verificationStatus ?? null;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98]"
      style={{ borderColor: `${color}33`, background: `linear-gradient(135deg, ${color}11 0%, #1A1A2E 100%)` }}
    >
      <span className="text-2xl w-9 text-center flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold leading-snug line-clamp-2">{dare.text}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <CategoryChip category={dare.category} size="sm" />
        </div>
      </div>
      <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
        <PointsBadge points={dare.points} size="sm" />
        {status === "approved" && <span className="text-lg">✅</span>}
        {status === "pending" && <span className="text-lg">⏳</span>}
        {status === "rejected" && <span className="text-xs text-primary font-semibold">Retry</span>}
        {status === "needs_review" && <span className="text-lg">🕐</span>}
      </div>
    </button>
  );
}
