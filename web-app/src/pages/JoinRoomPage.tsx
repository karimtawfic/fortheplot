import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { joinRoom } from "../repositories/roomRepository";
import { useAppStore } from "../store/appStore";
import { Button } from "../components/Button";
import { EMOJI_OPTIONS } from "../types";
import type { Room, Player } from "../types";
import { Timestamp } from "firebase/firestore";

export function JoinRoomPage() {
  const navigate = useNavigate();
  const { setSession } = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [inviteCode, setInviteCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState(EMOJI_OPTIONS[0]);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [secs, setSecs] = useState(30);

  useEffect(() => {
    const id = setInterval(() => setSecs(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const crit = secs <= 10;

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
        timerMinutes: 60,
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

  function handleSelfieChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setSelfie(URL.createObjectURL(file));
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface text-white/60 text-lg"
        >←</button>
        <h1 className="flex-1 text-center text-base font-black text-white">Join Room</h1>
        <div className="w-9" />
      </div>

      {/* Countdown ribbon */}
      <div
        className="mx-4 mb-2 px-3 py-2 rounded-xl border flex items-center gap-3"
        style={{
          background: crit ? "rgba(233,69,96,0.14)" : "rgba(255,107,53,0.10)",
          borderColor: crit ? "rgba(233,69,96,0.35)" : "rgba(255,107,53,0.25)",
        }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
          style={{ background: crit ? "#E94560" : "#FF6B35" }}
        >
          {secs}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black leading-tight" style={{ color: crit ? "#E94560" : "#fff" }}>
            {secs === 0 ? "Room may be closing" : `Join in ${secs}s`}
          </p>
          <p className="text-[10px] text-white/50 mt-0.5">Host starts soon</p>
        </div>
        <div className="w-12 h-0.5 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
          <div
            className="h-full rounded-full transition-all duration-300 ease-linear"
            style={{
              width: `${(secs / 30) * 100}%`,
              background: crit ? "#E94560" : "#FF6B35",
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-4 px-5 pb-8">

        {/* Room code */}
        <div>
          <label className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <span>🔑</span> Room Code
          </label>
          <input
            className={`w-full bg-surface border-2 rounded-2xl px-4 py-3 text-3xl font-black text-center text-primary font-mono tracking-[0.4em] focus:outline-none transition-colors placeholder-white/20 ${
              inviteCode.length === 6 ? "border-primary" : "border-border"
            }`}
            placeholder="XXXXXX"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        {/* Name */}
        <div>
          <label className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <span>👤</span> Your Name
          </label>
          <input
            className={`w-full bg-surface border rounded-2xl px-4 py-3 text-white text-sm font-semibold placeholder-white/30 focus:outline-none transition-colors ${
              displayName ? "border-primary" : "border-border"
            }`}
            placeholder="Enter your name..."
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={20}
          />
        </div>

        {/* Selfie */}
        <div>
          <label className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <span>🤳</span> Your Selfie
          </label>
          <div className="flex gap-3 items-stretch">
            <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleSelfieChange} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`w-16 h-16 rounded-2xl flex-shrink-0 flex flex-col items-center justify-center border-2 overflow-hidden transition-all ${
                selfie ? "border-primary" : "border-dashed border-border bg-surface"
              }`}
            >
              {selfie ? (
                <img src={selfie} alt="selfie" className="w-full h-full object-cover" />
              ) : (
                <>
                  <span className="text-2xl">📷</span>
                  <span className="text-[8px] text-white/50 font-black mt-0.5 tracking-wide">ADD</span>
                </>
              )}
            </button>
            <div className="flex-1 flex flex-col justify-center gap-1">
              <p className="text-sm font-bold text-white">{selfie ? "Looking good 😎" : "Snap a selfie"}</p>
              <p className="text-[10px] text-white/50 leading-relaxed">
                Shows on the lobby + leaderboard. Tap to {selfie ? "replace" : "use camera"}.
              </p>
              {selfie && (
                <button
                  type="button"
                  onClick={() => setSelfie(null)}
                  className="self-start mt-1 px-2 py-1 rounded-lg border border-border text-[9px] font-black text-white/50 tracking-wide"
                >
                  REMOVE
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Avatar strip */}
        <div>
          <label className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <span>😀</span> Or Pick an Avatar
          </label>
          <div className="grid grid-cols-10 gap-1">
            {EMOJI_OPTIONS.slice(0, 10).map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatarEmoji(emoji)}
                className={`aspect-square text-lg rounded-xl transition-all ${
                  avatarEmoji === emoji
                    ? "bg-primary/20 ring-2 ring-primary scale-110"
                    : "bg-surface hover:bg-surface/80"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-accent text-sm text-center">{error}</p>}

        <Button
          size="lg"
          loading={loading}
          disabled={loading || !displayName.trim() || inviteCode.length !== 6}
          onClick={handleJoin}
          className="w-full"
        >
          Join Room
        </Button>
      </div>
    </div>
  );
}
