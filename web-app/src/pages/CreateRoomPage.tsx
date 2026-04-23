import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { createRoom } from "../repositories/roomRepository";
import { useAppStore } from "../store/appStore";
import { EMOJI_OPTIONS, TIMER_OPTIONS } from "../types";
import type { Room, Player } from "../types";
import { Timestamp } from "firebase/firestore";

const GAME_MODES = [
  { id: "easy",    label: "Easy",    emoji: "🌱", tagline: "Any challenge", sub: "Full catalog, browse freely",  color: "#81C784" },
  { id: "medium",  label: "Medium",  emoji: "🎯", tagline: "5 options",     sub: "Rolling hand of 5 dares",     color: "#4FC3F7" },
  { id: "hard",    label: "Hard",    emoji: "🔥", tagline: "3 options",     sub: "Only 3 on deck — commit",     color: "#FF8A65" },
  { id: "extreme", label: "Extreme", emoji: "💀", tagline: "1 only",        sub: "No choice — do it or pass",   color: "#E94560" },
] as const;

export function CreateRoomPage() {
  const navigate = useNavigate();
  const { setSession, currentUser } = useAppStore();

  const [displayName, setDisplayName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("🔥");
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [gameMode, setGameMode] = useState<string>("easy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!displayName.trim()) { setError("Enter your name"); return; }
    setLoading(true);
    setError("");
    try {
      const result = await createRoom({ displayName: displayName.trim(), avatarEmoji, timerMinutes });
      const now = Timestamp.now();
      const room: Room = {
        roomId: result.roomId,
        hostPlayerId: result.playerId,
        createdAt: now,
        status: "lobby",
        timerMinutes,
        currentPlayerCount: 1,
        dareDeckVersion: "v1",
        personalReelsReadyCount: 0,
        groupReelReady: false,
        inviteCode: result.inviteCode,
      };
      const player: Player = {
        playerId: result.playerId,
        roomId: result.roomId,
        displayName: displayName.trim(),
        avatarEmoji,
        totalPoints: 0,
        joinedAt: now,
        isHost: true,
        lastSeenAt: now,
      };
      setSession(room, player);
      navigate(`/lobby/${result.roomId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create room");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-safe pt-6 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-surface text-white/60 hover:text-white transition-colors text-xl"
        >
          ←
        </button>
        <h1 className="text-2xl font-black text-white">Create Room</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8 flex flex-col gap-6">
        {/* Name */}
        <div>
          <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2 block">
            Your name
          </label>
          <input
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-primary transition-colors"
            placeholder="Enter your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={20}
          />
        </div>

        {/* Avatar */}
        <div>
          <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3 block">
            Pick your avatar
          </label>
          <div className="grid grid-cols-8 gap-2">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setAvatarEmoji(emoji)}
                className={`text-2xl py-1.5 rounded-xl transition-all ${
                  avatarEmoji === emoji
                    ? "bg-primary/25 ring-2 ring-primary scale-110"
                    : "hover:bg-white/8 bg-surface/50"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3 block">
            Game duration
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {TIMER_OPTIONS.map((mins) => (
              <button
                key={mins}
                onClick={() => setTimerMinutes(mins)}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  timerMinutes === mins
                    ? "text-white"
                    : "bg-surface text-white/50 hover:text-white/70"
                }`}
                style={timerMinutes === mins ? { background: "#FF6B35" } : undefined}
              >
                {mins < 60 ? `${mins}m` : mins === 60 ? "1h" : mins === 90 ? "1.5h" : `${mins / 60}h`}
              </button>
            ))}
          </div>
        </div>

        {/* Game mode */}
        <div>
          <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3 block">
            Difficulty
          </label>
          <div className="flex flex-col gap-1.5">
            {GAME_MODES.map((mode) => {
              const on = gameMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setGameMode(mode.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 11px", cursor: "pointer", textAlign: "left",
                    background: on ? `${mode.color}18` : "#1A1A2E",
                    border: `1.5px solid ${on ? mode.color : "transparent"}`,
                    borderRadius: 12, color: "#fff", fontFamily: "inherit", width: "100%",
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: on ? `${mode.color}33` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${on ? `${mode.color}88` : "#2A2A4A"}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                  }}>{mode.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, lineHeight: 1.3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: on ? mode.color : "#fff" }}>{mode.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#AAAACC", whiteSpace: "nowrap" }}>· {mode.tagline}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#AAAACC", marginTop: 1, lineHeight: 1.3 }}>{mode.sub}</div>
                  </div>
                  <div style={{
                    width: 16, height: 16, borderRadius: 999, flexShrink: 0,
                    background: on ? mode.color : "transparent",
                    border: `2px solid ${on ? mode.color : "#2A2A4A"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {on && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-accent text-sm text-center">{error}</p>}

        <Button size="lg" loading={loading} onClick={handleCreate} className="w-full mt-2">
          Create Room
        </Button>
      </div>
    </div>
  );
}
