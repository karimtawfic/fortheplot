import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { createRoom } from "../repositories/roomRepository";
import { useAppStore } from "../store/appStore";
import { EMOJI_OPTIONS, TIMER_OPTIONS } from "../types";
import type { Room, Player } from "../types";
import { Timestamp } from "firebase/firestore";

export function CreateRoomPage() {
  const navigate = useNavigate();
  const { setSession, currentUser } = useAppStore();

  const [displayName, setDisplayName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("🔥");
  const [timerMinutes, setTimerMinutes] = useState(15);
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
    <div className="min-h-screen bg-bg flex flex-col px-6 py-8 gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white/60 text-2xl">←</button>
        <h1 className="text-xl font-bold text-white">Create Room</h1>
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <label className="text-white/60 text-sm mb-2 block">Your name</label>
          <input
            className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary"
            placeholder="Enter your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={20}
          />
        </div>

        <div>
          <label className="text-white/60 text-sm mb-2 block">Pick your avatar</label>
          <div className="grid grid-cols-10 gap-2">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setAvatarEmoji(emoji)}
                className={`text-2xl p-1 rounded-lg transition-all ${
                  avatarEmoji === emoji ? "bg-primary/30 ring-2 ring-primary" : "hover:bg-white/10"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-white/60 text-sm mb-2 block">Game duration</label>
          <div className="grid grid-cols-4 gap-2">
            {TIMER_OPTIONS.map((mins) => (
              <button
                key={mins}
                onClick={() => setTimerMinutes(mins)}
                className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                  timerMinutes === mins
                    ? "bg-primary text-white"
                    : "bg-surface text-white/60 hover:bg-surface/80"
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <Button size="lg" loading={loading} onClick={handleCreate} className="mt-2">
          Create Room
        </Button>
      </div>
    </div>
  );
}
