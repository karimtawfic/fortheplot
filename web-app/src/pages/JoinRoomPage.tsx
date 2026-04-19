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
    <div className="min-h-screen bg-bg flex flex-col px-6 py-8 gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white/60 text-2xl">←</button>
        <h1 className="text-xl font-bold text-white">Join Room</h1>
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <label className="text-white/60 text-sm mb-2 block">Invite code</label>
          <input
            className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary text-center text-xl font-mono tracking-[0.3em] uppercase"
            placeholder="ABC123"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
        </div>

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

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <Button size="lg" loading={loading} onClick={handleJoin} className="mt-2">
          Join Room
        </Button>
      </div>
    </div>
  );
}
