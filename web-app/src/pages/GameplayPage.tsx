import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { DareCard } from "../components/DareCard";
import { Scoreboard } from "../components/Scoreboard";
import { ProofUpload } from "../components/ProofUpload";
import { useRoom, usePlayers } from "../hooks/useRoom";
import { useDares } from "../hooks/useDares";
import { useMySubmissions } from "../hooks/useSubmissions";
import { useTimer } from "../hooks/useTimer";
import { useAppStore } from "../store/appStore";
import { CATEGORY_COLORS, CATEGORY_EMOJIS } from "../types";
import type { Dare, DareCategory } from "../types";

type Tab = "dares" | "scoreboard";
type ViewMode = "grid" | "list";

const ALL_CATS: DareCategory[] = ["social", "physical", "creative", "food", "outdoor"];

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
  const { formatted: timerFormatted, secondsLeft } = useTimer(room?.endsAt);
  const isWarn = secondsLeft > 0 && secondsLeft < 5 * 60;

  const [tab, setTab] = useState<Tab>("dares");
  const [selectedDare, setSelectedDare] = useState<Dare | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [activeCats, setActiveCats] = useState<Set<DareCategory>>(new Set(ALL_CATS));
  const [pointsFilter, setPointsFilter] = useState<PointsFilter>("all");
  const [hideDone, setHideDone] = useState(false);

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

  function toggleCat(cat: DareCategory) {
    setActiveCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  const allCatsActive = activeCats.size === ALL_CATS.length;

  const catCounts = useMemo(() => {
    const counts: Partial<Record<DareCategory, number>> = {};
    dares.forEach(d => { counts[d.category] = (counts[d.category] ?? 0) + 1; });
    return counts;
  }, [dares]);

  const pointsBucket = POINTS_FILTERS.find((b) => b.value === pointsFilter)!;
  const filteredDares = dares.filter(
    (d) =>
      activeCats.has(d.category) &&
      pointsBucket.test(d.points) &&
      (!hideDone || submissionByDareId.get(d.dareId)?.verificationStatus !== "approved")
  );

  const completedCount = [...submittedDareIds].filter(
    id => submissionByDareId.get(id)?.verificationStatus === "approved"
  ).length;
  const progressPct = dares.length > 0 ? Math.min((completedCount / dares.length) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur border-b border-white/5">
        {/* Top bar: timer | points | action button */}
        <div className="flex items-center gap-3 px-4 pt-safe pt-3 pb-2">
          {/* Timer pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${isWarn ? "text-accent" : "text-white"}`}
            style={{ background: isWarn ? "rgba(233,69,96,0.14)" : "rgba(255,255,255,0.07)" }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="font-mono font-black text-base tabular-nums">{timerFormatted}</span>
          </div>

          <div className="flex-1" />

          {/* Points */}
          <div className="text-right">
            <p className="text-gold font-black text-xl leading-none tabular-nums">
              {currentPlayer.totalPoints}
            </p>
            <p className="text-[8px] font-black text-white/40 tracking-[0.1em] mt-0.5">PTS</p>
          </div>

          {/* Host review button or placeholder */}
          {isHost ? (
            <Link
              to={`/admin/${roomId}`}
              className="w-9 h-9 bg-surface border border-border rounded-xl flex items-center justify-center text-[10px] font-black text-primary"
            >
              Rev
            </Link>
          ) : (
            <div className="w-9 h-9 bg-surface border border-border rounded-xl flex items-center justify-center">
              <svg width="15" height="12" viewBox="0 0 18 14" fill="none">
                <path d="M1 2h16M1 7h16M1 12h11" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>

        {/* Progress strip */}
        <div className="flex items-center gap-2 px-4 pb-2">
          <span className="text-[11px] font-black text-white/50 flex-shrink-0 tabular-nums">
            {completedCount} / {dares.length} done
          </span>
          <div className="flex-1 h-1 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, #FF6B35, #E94560)",
              }}
            />
          </div>
          <span className="text-[11px] font-black text-white flex-shrink-0 tabular-nums">
            {Math.round(progressPct)}%
          </span>
        </div>

        {/* Tab bar */}
        <div className="flex px-4 gap-1 pb-2">
          {(["dares", "scoreboard"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                tab === t ? "text-white" : "text-white/40 hover:text-white/60"
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
          {/* Filters */}
          <div
            className="px-3 pt-3 pb-2 border-b border-white/5"
            style={{ background: "rgba(0,0,0,0.15)" }}
          >
            {/* Category label + divider */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <span
                className="text-[9px] font-black text-white/30 uppercase flex-shrink-0"
                style={{ letterSpacing: "0.08em" }}
              >
                CATEGORY
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Category pills (multi-select) */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                onClick={() => setActiveCats(new Set(ALL_CATS))}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-all border ${
                  allCatsActive
                    ? "text-white border-transparent"
                    : "text-white/50 border-border bg-transparent"
                }`}
                style={allCatsActive ? { background: "linear-gradient(135deg, #FF6B35, #E94560)" } : undefined}
              >
                All
              </button>
              {ALL_CATS.map(cat => {
                const on = activeCats.has(cat);
                const color = CATEGORY_COLORS[cat];
                const emoji = CATEGORY_EMOJIS[cat];
                const label = cat.charAt(0).toUpperCase() + cat.slice(1);
                const count = catCounts[cat] ?? 0;
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCat(cat)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black transition-all border"
                    style={{
                      background: on ? `${color}22` : "transparent",
                      color: on ? color : "#AAAACC",
                      borderColor: on ? `${color}66` : "#2A2A4A",
                      opacity: on ? 1 : 0.7,
                    }}
                  >
                    <span>{emoji}</span>
                    {label}
                    <span style={{ fontSize: 9, opacity: 0.7, fontWeight: 700 }}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Points label + hide done */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <span
                className="text-[9px] font-black text-white/30 uppercase flex-shrink-0"
                style={{ letterSpacing: "0.08em" }}
              >
                POINTS
              </span>
              <div className="flex-1 h-px bg-border" />
              <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={hideDone}
                  onChange={e => setHideDone(e.target.checked)}
                  className="cursor-pointer"
                  style={{ accentColor: "#FF6B35" }}
                />
                <span
                  className="text-[10px] font-black"
                  style={{ color: hideDone ? "#FF6B35" : "#AAAACC" }}
                >
                  Hide done
                </span>
              </label>
            </div>

            {/* Points filter buttons */}
            <div className="flex gap-1.5">
              {POINTS_FILTERS.map((b) => (
                <button
                  key={b.value}
                  onClick={() => setPointsFilter(b.value)}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all border"
                  style={{
                    background: pointsFilter === b.value ? "#FF6B35" : "transparent",
                    color: pointsFilter === b.value ? "#fff" : "#AAAACC",
                    borderColor: pointsFilter === b.value ? "#FF6B35" : "#2A2A4A",
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results count + view toggle */}
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-[11px] font-black text-white/50">
              {filteredDares.length} challenge{filteredDares.length === 1 ? "" : "s"}
            </span>
            <div className="flex bg-surface rounded-xl border border-border p-0.5">
              {(["list", "grid"] as ViewMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black transition-all"
                  style={{
                    background: viewMode === m ? "#FF6B35" : "transparent",
                    color: viewMode === m ? "#fff" : "#AAAACC",
                  }}
                >
                  {m === "list" ? (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M1 3h10M1 6h10M1 9h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <rect x="1" y="1" width="4" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
                      <rect x="7" y="1" width="4" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
                      <rect x="1" y="7" width="4" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
                      <rect x="7" y="7" width="4" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                  )}
                  {m.toUpperCase()}
                </button>
              ))}
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
                    {dares.length === 0 ? "Loading dares…" : "No dares match your filters"}
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
                    {dares.length === 0 ? "Loading dares…" : "No dares match your filters"}
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

// ─── Dare list row ────────────────────────────────────────────────────────────

import type { DareSubmission } from "../types";

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
          width: 40,
          height: 40,
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
          style={{
            textDecoration: done ? "line-through" : "none",
            textDecorationColor: "rgba(255,255,255,0.25)",
          }}
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
              {status === "needs_review"
                ? "🕐 host"
                : status === "rejected"
                ? "✕ retry"
                : "⏳ verifying"}
            </span>
          )}
        </div>
      </div>

      {/* Points */}
      <div className="flex-shrink-0 text-right">
        <div
          className="font-black leading-none tabular-nums"
          style={{
            fontSize: 20,
            color: done ? "#4CAF50" : "#FFD700",
          }}
        >
          {done ? `+${submission?.pointsAwarded ?? dare.points}` : dare.points}
        </div>
        <div
          className="font-black mt-0.5"
          style={{
            fontSize: 8,
            color: done ? "#4CAF50" : "#AAAACC",
            letterSpacing: 1,
          }}
        >
          PTS
        </div>
      </div>
    </button>
  );
}
