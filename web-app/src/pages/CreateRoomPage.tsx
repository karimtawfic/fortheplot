import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { createRoom } from "../repositories/roomRepository";
import { useAppStore } from "../store/appStore";
import { EMOJI_OPTIONS, TIMER_OPTIONS } from "../types";
import type { Room, Player } from "../types";
import { Timestamp } from "firebase/firestore";

const GAME_MODES = [
  { id: "easy", label: "Easy", icon: "😊", desc: "Full catalog · Unlimited reshuffles" },
  { id: "medium", label: "Medium", icon: "🎯", desc: "5 options · 5 reshuffles" },
  { id: "hard", label: "Hard", icon: "🔥", desc: "3 options · 3 reshuffles" },
  { id: "extreme", label: "Extreme", icon: "⚡", desc: "1 dare · 1 reshuffle" },
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
          <div className="grid grid-cols-10 gap-2">
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
          <div className="grid grid-cols-4 gap-2">
            {TIMER_OPTIONS.map((mins) => (
              <button
                key={mins}
                onClick={() => setTimerMinutes(mins)}
                className={`py-3 rounded-2xl text-sm font-bold transition-all ${
                  timerMinutes === mins
                    ? "text-white shadow-glow"
                    : "bg-surface text-white/50 hover:text-white/70"
                }`}
                style={timerMinutes === mins ? { background: "linear-gradient(135deg, #FF6B35, #E94560)" } : undefined}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Game mode */}
        <div>
          <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3 block">
            Difficulty
          </label>
          <div className="flex flex-col gap-2">
            {GAME_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setGameMode(mode.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                  gameMode === mode.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface hover:border-white/20"
                }`}
              >
                <span className="text-2xl">{mode.icon}</span>
                <div className="flex-1">
                  <p className={`font-bold text-sm ${gameMode === mode.id ? "text-primary" : "text-white"}`}>
                    {mode.label}
                  </p>
                  <p className="text-white/40 text-xs mt-0.5">{mode.desc}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    gameMode === mode.id ? "border-primary" : "border-white/20"
                  }`}
                >
                  {gameMode === mode.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </div>
              </button>
            ))}
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
