import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { DareCard } from "../components/DareCard";
import { ProofUpload } from "../components/ProofUpload";
import { Scoreboard } from "../components/Scoreboard";
import { useRoom, usePlayers } from "../hooks/useRoom";
import { useDares } from "../hooks/useDares";
import { useMySubmissions } from "../hooks/useSubmissions";
import { useAppStore } from "../store/appStore";
import { useTimer } from "../hooks/useTimer";
import type { Dare, DareCategory, DareSubmission } from "../types";
import { CATEGORY_COLORS, CATEGORY_EMOJIS } from "../types";

type ViewMode = "list" | "grid";
type PointsFilter = "all" | "low" | "mid" | "high";

const CATEGORY_LABELS: Record<DareCategory, string> = {
  social: "Social",
  physical: "Physical",
  creative: "Creative",
  food: "Food",
  outdoor: "Outdoor",
};

const POINTS_FILTERS: Array<{ label: string; value: PointsFilter; test: (p: number) => boolean }> = [
  { label: "Any", value: "all", test: () => true },
  { label: "≤ 25", value: "low", test: (p) => p <= 25 },
  { label: "26–50", value: "mid", test: (p) => p > 25 && p <= 50 },
  { label: "51+", value: "high", test: (p) => p > 50 },
];

const ALL_CATS: DareCategory[] = ["social", "physical", "creative", "food", "outdoor"];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "#A5D6A7",
  medium: "#FFF176",
  hard: "#FF8A65",
  wild: "#E94560",
};

function GameplayTimer({ endsAt }: { endsAt?: any }) {
  const { formatted, secondsLeft } = useTimer(endsAt);
  const isWarn = secondsLeft > 0 && secondsLeft <= 5 * 60;
  return (
    <div
      className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
      style={{ background: isWarn ? "rgba(233,69,96,0.14)" : "rgba(255,255,255,0.06)" }}
    >
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ color: isWarn ? "#E94560" : "#fff", flexShrink: 0 }}>
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="font-mono font-black text-base leading-none tabular-nums" style={{ color: isWarn ? "#E94560" : "#fff" }}>
        {formatted}
      </span>
    </div>
  );
}

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

  const [selectedDare, setSelectedDare] = useState<Dare | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [activeCats, setActiveCats] = useState<Set<DareCategory>>(new Set(ALL_CATS));
  const [pointsFilter, setPointsFilter] = useState<PointsFilter>("all");
  const [hideDone, setHideDone] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);

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
    if (sub?.verificationStatus === "rejected") setSelectedDare(dare);
  }

  const toggleCat = (cat: DareCategory) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };
  const allActive = activeCats.size === ALL_CATS.length;

  const pointsBucket = POINTS_FILTERS.find((b) => b.value === pointsFilter)!;
  const filteredDares = dares.filter(
    (d) =>
      activeCats.has(d.category) &&
      pointsBucket.test(d.points) &&
      (!hideDone || submissionByDareId.get(d.dareId)?.verificationStatus !== "approved")
  );

  const completedCount = submittedDareIds.size;
  const progressPct = dares.length > 0 ? Math.min((completedCount / dares.length) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Scoreboard overlay */}
      {showScoreboard && (
        <div className="fixed inset-0 bg-bg z-50 flex flex-col">
          <div
            className="flex items-center px-4 pb-3 border-b border-white/5"
            style={{ paddingTop: "max(env(safe-area-inset-top), 16px)" }}
          >
            <div style={{ width: 56 }} />
            <p className="flex-1 text-white font-bold text-base text-center">Leaderboard</p>
            <button
              onClick={() => setShowScoreboard(false)}
              className="text-primary font-bold text-sm"
              style={{ width: 56, textAlign: "right" }}
            >
              Done
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
            <Scoreboard players={players} currentPlayerId={currentPlayer.playerId} showPodium />
          </div>
        </div>
      )}

      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur border-b border-white/5">
        {/* Top bar: timer | spacer | points | scoreboard icon */}
        <div className="flex items-center gap-2 px-4 pt-safe pt-3 pb-2">
          <GameplayTimer endsAt={room?.endsAt} />
          <div className="flex-1" />
          <div className="text-right">
            <div className="text-gold font-black text-xl leading-none tabular-nums">
              {currentPlayer.totalPoints}
            </div>
            <div className="text-white/30 font-black uppercase mt-0.5" style={{ fontSize: 8, letterSpacing: "0.12em" }}>
              PTS
            </div>
          </div>
          <button
            onClick={() => setShowScoreboard(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface border border-border"
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M2 4h14M2 9h14M2 14h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          {isHost && (
            <Link
              to={`/admin/${roomId}`}
              className="text-xs text-primary font-semibold bg-primary/15 px-2.5 py-1.5 rounded-xl"
            >
              Review
            </Link>
          )}
        </div>

        {/* Progress strip */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-white/40 font-black whitespace-nowrap" style={{ fontSize: 11 }}>
              {completedCount} / {dares.length} done
            </span>
            <div className="flex-1 h-1 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #FF6B35, #E94560)" }}
              />
            </div>
            <span className="text-white font-black tabular-nums" style={{ fontSize: 11 }}>
              {Math.round(progressPct)}%
            </span>
          </div>
        </div>

        {/* Mode banner */}
        <div
          className="mx-3 mb-2 px-3 py-2.5 rounded-2xl flex items-center gap-3"
          style={{
            background: "linear-gradient(135deg, rgba(255,107,53,0.15), rgba(233,69,96,0.10))",
            border: "1.5px solid rgba(255,107,53,0.4)",
            boxShadow: "0 0 0 3px rgba(255,107,53,0.06)",
          }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: "#FF6B35", boxShadow: "0 4px 14px rgba(255,107,53,0.45)" }}
          >
            🌱
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-primary uppercase leading-none mb-0.5" style={{ fontSize: 9, letterSpacing: "0.08em" }}>
              Easy mode
            </p>
            <p className="text-white font-black leading-tight" style={{ fontSize: 13, letterSpacing: -0.2 }}>
              Pick a challenge to start
            </p>
            <p className="text-white/40 leading-tight" style={{ fontSize: 10.5 }}>
              Tap any card → capture proof → score points
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="px-3 pb-1 border-t border-white/5" style={{ background: "rgba(0,0,0,0.18)" }}>
          {/* CATEGORY */}
          <div className="flex items-center gap-1.5 pt-2 mb-1.5">
            <span className="text-white/30 font-black uppercase flex-shrink-0" style={{ fontSize: 9, letterSpacing: "0.08em" }}>
              CATEGORY
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-2.5 pb-0.5">
            <button
              onClick={() => setActiveCats(new Set(ALL_CATS))}
              className="flex-shrink-0 px-2.5 py-1 rounded-full font-black border transition-all"
              style={{
                fontSize: 10,
                background: allActive ? "linear-gradient(135deg, #FF6B35, #E94560)" : "transparent",
                color: allActive ? "#fff" : "#AAAACC",
                borderColor: allActive ? "transparent" : "#2A2A4A",
              }}
            >
              All
            </button>
            {ALL_CATS.map((cat) => {
              const on = activeCats.has(cat);
              const color = CATEGORY_COLORS[cat];
              const count = dares.filter((d) => d.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => toggleCat(cat)}
                  className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full font-black border transition-all"
                  style={{
                    fontSize: 10,
                    background: on ? `${color}22` : "transparent",
                    color: on ? color : "#AAAACC",
                    borderColor: on ? `${color}66` : "#2A2A4A",
                    opacity: on ? 1 : 0.75,
                  }}
                >
                  <span style={{ fontSize: 11 }}>{CATEGORY_EMOJIS[cat]}</span>
                  {CATEGORY_LABELS[cat]}
                  <span style={{ fontSize: 9, opacity: 0.7 }}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* POINTS + Hide done */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-white/30 font-black uppercase flex-shrink-0" style={{ fontSize: 9, letterSpacing: "0.08em" }}>
              POINTS
            </span>
            <div className="flex-1 h-px bg-border" />
            <label className="flex items-center gap-1 cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={hideDone}
                onChange={(e) => setHideDone(e.target.checked)}
                style={{ accentColor: "#FF6B35", cursor: "pointer" }}
              />
              <span className="font-black" style={{ fontSize: 10, color: hideDone ? "#FF6B35" : "#AAAACC" }}>
                Hide done
              </span>
            </label>
          </div>
          <div className="flex gap-1.5 mb-1">
            {POINTS_FILTERS.map((b) => (
              <button
                key={b.value}
                onClick={() => setPointsFilter(b.value)}
                className="flex-1 py-1.5 rounded-lg font-black border transition-all"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.03em",
                  background: pointsFilter === b.value ? "#FF6B35" : "transparent",
                  color: pointsFilter === b.value ? "#fff" : "#AAAACC",
                  borderColor: pointsFilter === b.value ? "transparent" : "#2A2A4A",
                }}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count + LIST/GRID toggle */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-white/5">
          <span className="text-white/40 font-black" style={{ fontSize: 11 }}>
            {filteredDares.length} challenge{filteredDares.length === 1 ? "" : "s"}
          </span>
          <div className="flex rounded-xl border border-border p-0.5 bg-surface">
            {(["list", "grid"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-black transition-all border-none"
                style={{
                  fontSize: 10,
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
      </div>

      {/* Dare list / grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-8">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-2 pt-2">
            {filteredDares.map((dare) => (
              <DareCard
                key={dare.dareId}
                dare={dare}
                submission={submissionByDareId.get(dare.dareId)}
                onClick={() => handleDareClick(dare)}
              />
            ))}
            {filteredDares.length === 0 && (
              <div className="col-span-2 text-white/40 text-center py-12 text-sm">
                {dares.length === 0 ? "Loading dares…" : "No dares match your filters"}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 pt-2">
            {filteredDares.map((dare) => (
              <DareListRow
                key={dare.dareId}
                dare={dare}
                submission={submissionByDareId.get(dare.dareId)}
                onClick={() => handleDareClick(dare)}
              />
            ))}
            {filteredDares.length === 0 && (
              <div className="text-white/40 text-center py-12 text-sm">
                {dares.length === 0 ? "Loading dares…" : "No dares match your filters"}
              </div>
            )}
          </div>
        )}
      </div>

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
  const catLabel = CATEGORY_LABELS[dare.category];

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
      <div
        className="flex items-center justify-center flex-shrink-0 rounded-xl"
        style={{
          width: 40,
          height: 40,
          fontSize: 20,
          background: done ? "rgba(76,175,80,0.18)" : `${color}18`,
          border: `1px solid ${done ? "rgba(76,175,80,0.35)" : `${color}33`}`,
        }}
      >
        {done ? "✓" : emoji}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <p
          className="text-white font-bold leading-snug"
          style={{
            fontSize: 14,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textDecoration: done ? "line-through" : "none",
            textDecorationColor: "rgba(255,255,255,0.25)",
          }}
        >
          {dare.text}
        </p>
        <div className="flex items-center gap-2" style={{ whiteSpace: "nowrap", overflow: "hidden" }}>
          <span className="font-black uppercase flex-shrink-0" style={{ fontSize: 9, letterSpacing: "0.07em", color }}>
            {catLabel}
          </span>
          <span className="font-black uppercase flex-shrink-0" style={{ fontSize: 9, letterSpacing: "0.07em", color: diffColor }}>
            ● {dare.difficulty}
          </span>
          {pending && (
            <span className="font-bold flex-shrink-0" style={{ fontSize: 10, color: "#CE93D8" }}>
              {status === "needs_review" ? "🕐 host" : status === "rejected" ? "✕ retry" : "⏳ verifying"}
            </span>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="font-black leading-none tabular-nums" style={{ fontSize: 20, color: done ? "#4CAF50" : "#FFD700" }}>
          {done ? `+${submission?.pointsAwarded ?? dare.points}` : dare.points}
        </div>
        <div className="font-black mt-0.5" style={{ fontSize: 8, color: done ? "#4CAF50" : "#AAAACC", letterSpacing: 1 }}>
          PTS
        </div>
      </div>
    </button>
  );
}
