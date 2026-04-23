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

type PointsFilter = "all" | "low" | "mid" | "high";
const POINTS_FILTERS: Array<{ label: string; value: PointsFilter; test: (p: number) => boolean }> = [
  { label: "Any", value: "all", test: () => true },
  { label: "≤ 25", value: "low", test: (p) => p <= 25 },
  { label: "26–50", value: "mid", test: (p) => p > 25 && p <= 50 },
  { label: "51+", value: "high", test: (p) => p > 50 },
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
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [categoryFilter, setCategoryFilter] = useState<DareCategory | "all">("all");
  const [pointsFilter, setPointsFilter] = useState<PointsFilter>("all");

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

  const pointsBucket = POINTS_FILTERS.find((b) => b.value === pointsFilter)!;
  const filteredDares = dares.filter(
    (d) =>
      (categoryFilter === "all" || d.category === categoryFilter) &&
      pointsBucket.test(d.points)
  );

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
          <div className="px-4 pt-3 pb-2 border-b border-white/5" style={{ background: "rgba(0,0,0,0.15)" }}>
            {/* Category row */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white/30 font-black uppercase flex-shrink-0" style={{ fontSize: 9, letterSpacing: "0.08em" }}>CAT</span>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1">
                {CATEGORY_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setCategoryFilter(f.value)}
                    className={`flex-shrink-0 px-2.5 py-1 rounded-full font-bold transition-all border ${
                      categoryFilter === f.value
                        ? "text-white border-transparent"
                        : "text-white/50 border-border bg-transparent"
                    }`}
                    style={{
                      fontSize: 10,
                      ...(categoryFilter === f.value
                        ? { background: "linear-gradient(135deg, #FF6B35, #E94560)" }
                        : undefined),
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Points row + view toggle */}
            <div className="flex items-center gap-2">
              <span className="text-white/30 font-black uppercase flex-shrink-0" style={{ fontSize: 9, letterSpacing: "0.08em" }}>PTS</span>
              <div className="flex gap-1.5 flex-1">
                {POINTS_FILTERS.map((b) => (
                  <button
                    key={b.value}
                    onClick={() => setPointsFilter(b.value)}
                    className={`flex-1 py-1 rounded-lg font-black transition-all border ${
                      pointsFilter === b.value
                        ? "text-white border-transparent"
                        : "text-white/40 border-border bg-transparent"
                    }`}
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.03em",
                      ...(pointsFilter === b.value ? { background: "#FF6B35" } : undefined),
                    }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-0.5 flex-shrink-0 bg-surface rounded-xl border border-border p-0.5">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary/20 text-primary" : "text-white/30"}`}
                >
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M1 3h10M1 6h10M1 9h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary/20 text-primary" : "text-white/30"}`}
                >
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="4" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.4"/><rect x="7" y="1" width="4" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.4"/><rect x="1" y="7" width="4" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.4"/><rect x="7" y="7" width="4" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.4"/></svg>
                </button>
              </div>
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
import { CATEGORY_COLORS, CATEGORY_EMOJIS } from "../types";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "#A5D6A7",
  medium: "#FFF176",
  hard: "#FF8A65",
  wild: "#E94560",
};

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
  const done = status === "approved";
  const pending = status && status !== "approved";
  const diffColor = DIFFICULTY_COLORS[dare.difficulty] ?? "#AAAACC";
  const catLabel = dare.category.charAt(0).toUpperCase() + dare.category.slice(1);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-xl text-left transition-all active:scale-[0.98]"
      style={{
        padding: "12px 14px",
        background: done ? "rgba(76,175,80,0.08)" : "#1A1A2E",
        border: `1px solid ${done ? "rgba(76,175,80,0.35)" : "#2A2A4A"}`,
        borderLeft: `3px solid ${done ? "#4CAF50" : color}`,
      }}
    >
      {/* Icon box */}
      <div
        className="flex items-center justify-center flex-shrink-0 text-xl rounded-xl"
        style={{
          width: 40, height: 40,
          background: done ? "rgba(76,175,80,0.18)" : `${color}18`,
          border: `1px solid ${done ? "rgba(76,175,80,0.35)" : `${color}33`}`,
        }}
      >
        {done ? "✓" : emoji}
      </div>

      {/* Text block */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <p
          className="text-white text-sm font-bold leading-snug line-clamp-2"
          style={{ textDecoration: done ? "line-through" : "none", textDecorationColor: "rgba(255,255,255,0.25)" }}
        >
          {dare.text}
        </p>
        <div className="flex items-center gap-2">
          <span
            className="font-black uppercase"
            style={{ fontSize: 9, letterSpacing: "0.07em", color }}
          >
            {catLabel}
          </span>
          <span
            className="font-black uppercase"
            style={{ fontSize: 9, letterSpacing: "0.07em", color: diffColor }}
          >
            ● {dare.difficulty}
          </span>
          {pending && (
            <span className="text-xs font-bold" style={{ color: "#CE93D8" }}>
              {status === "needs_review" ? "🕐 host" : status === "rejected" ? "✕ retry" : "⏳ verifying"}
            </span>
          )}
        </div>
      </div>

      {/* Points */}
      <div className="flex-shrink-0 text-right">
        <div
          className="font-black leading-none"
          style={{ fontSize: 20, color: done ? "#4CAF50" : "#FFD700", fontVariantNumeric: "tabular-nums" }}
        >
          {done ? `+${submission?.pointsAwarded ?? dare.points}` : dare.points}
        </div>
        <div
          className="font-black mt-0.5"
          style={{ fontSize: 8, color: done ? "#4CAF50" : "#AAAACC", letterSpacing: 1 }}
        >
          PTS
        </div>
      </div>
    </button>
  );
}
