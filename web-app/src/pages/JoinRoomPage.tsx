import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { joinRoom } from "../repositories/roomRepository";
import { useAppStore } from "../store/appStore";
import { EMOJI_OPTIONS } from "../types";
import type { Room, Player } from "../types";
import { Timestamp } from "firebase/firestore";

export function JoinRoomPage() {
  const navigate = useNavigate();
  const { setSession } = useAppStore();

  const [inviteCode, setInviteCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("⚡");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin() {
    if (!inviteCode.trim()) { setError("Enter the invite code"); return; }
    if (!displayName.trim()) { setError("Enter your name"); return; }
    setLoading(true);
    setError("");
    try {
      const result = await joinRoom({
        inviteCode: inviteCode.trim().toUpperCase(),
        displayName: displayName.trim(),
        avatarEmoji,
      });
      const now = Timestamp.now();
      const room: Room = {
        roomId: result.roomId,
        hostPlayerId: "",
        createdAt: now,
        status: "lobby",
        timerMinutes: 15,
        currentPlayerCount: 1,
        dareDeckVersion: "v1",
        personalReelsReadyCount: 0,
        groupReelReady: false,
        inviteCode: inviteCode.trim().toUpperCase(),
      };
      const player: Player = {
        playerId: result.playerId,
        roomId: result.roomId,
        displayName: displayName.trim(),
        avatarEmoji,
        totalPoints: 0,
        joinedAt: now,
        isHost: false,
        lastSeenAt: now,
      };
      setSession(room, player);
      navigate(`/lobby/${result.roomId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to join room");
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
        <h1 className="text-2xl font-black text-white">Join Room</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8 flex flex-col gap-6">
        {/* Invite code */}
        <div>
          <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3 block">
            Room code
          </label>
          <input
            className="w-full bg-surface border-2 border-border rounded-2xl px-4 py-4 text-white placeholder-white/20 focus:outline-none focus:border-primary transition-colors text-center text-3xl font-mono tracking-[0.5em] uppercase"
            placeholder="• • • • • •"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          <p className="text-white/30 text-xs text-center mt-2">6-character code from the host</p>
        </div>

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

        {error && <p className="text-accent text-sm text-center">{error}</p>}

        <Button size="lg" loading={loading} onClick={handleJoin} className="w-full mt-2">
          Join Room
        </Button>
      </div>
    </div>
  );
}
