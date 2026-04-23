import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { joinRoom } from "../repositories/roomRepository";
import { useAppStore } from "../store/appStore";
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
    <div className="min-h-screen bg-bg flex flex-col" style={{ color: "#fff" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-2">
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 10, background: "#1A1A2E", border: "none", color: "#AAAACC",
            cursor: "pointer", fontSize: 18,
          }}
        >←</button>
        <h1 style={{ fontSize: 17, fontWeight: 700, flex: 1, textAlign: "center", whiteSpace: "nowrap" }}>Join Room</h1>
        <div style={{ width: 36 }} />
      </div>

      {/* 30s countdown ribbon */}
      <div style={{
        margin: "0 18px 8px", padding: "8px 12px", borderRadius: 11,
        background: crit ? "rgba(233,69,96,0.14)" : "rgba(255,107,53,0.10)",
        border: `1px solid ${crit ? "rgba(233,69,96,0.35)" : "rgba(255,107,53,0.25)"}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 999,
          background: crit ? "#E94560" : "#FF6B35",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 900, color: "#fff", flexShrink: 0,
        }}>{secs}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: crit ? "#E94560" : "#fff", lineHeight: 1.1 }}>
            {secs === 0 ? "Room may be closing" : `Join in ${secs}s`}
          </div>
          <div style={{ fontSize: 10, color: "#AAAACC", marginTop: 1 }}>Host starts soon</div>
        </div>
        <div style={{ width: 50, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${(secs / 30) * 100}%`,
            background: crit ? "#E94560" : "#FF6B35",
            transition: "width 0.3s linear",
          }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: "0 20px 20px", gap: 14 }}>

        {/* Room code */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 900, color: "#AAAACC", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span>🔑</span> Room Code
          </div>
          <input
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "10px", fontSize: 22, fontWeight: 900,
              color: "#FF6B35", textAlign: "center",
              letterSpacing: 6, fontFamily: "SF Mono, ui-monospace, monospace",
              background: "#1A1A2E",
              border: `1.5px solid ${inviteCode.length === 6 ? "#FF6B35" : "#2A2A4A"}`,
              borderRadius: 12, outline: "none",
            }}
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
          <div style={{ fontSize: 9, fontWeight: 900, color: "#AAAACC", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span>👤</span> Your Name
          </div>
          <input
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "10px 14px", fontSize: 15, fontWeight: 600,
              color: "#fff", background: "#1A1A2E",
              border: `1.5px solid ${displayName ? "#FF6B35" : "#2A2A4A"}`,
              borderRadius: 12, outline: "none", fontFamily: "inherit",
            }}
            placeholder="Enter your name..."
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={20}
          />
        </div>

        {/* Selfie */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 900, color: "#AAAACC", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span>🤳</span> Your Selfie
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
            <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleSelfieChange} />
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: 70, height: 70, borderRadius: 16, cursor: "pointer",
                overflow: "hidden", position: "relative", flexShrink: 0,
                background: selfie ? "#000" : "#1A1A2E",
                border: `2px ${selfie ? "solid" : "dashed"} ${selfie ? "#FF6B35" : "#2A2A4A"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {selfie ? (
                <img src={selfie} alt="selfie" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22 }}>📷</div>
                  <div style={{ fontSize: 8, color: "#AAAACC", fontWeight: 800, marginTop: 1, letterSpacing: 0.3 }}>ADD</div>
                </div>
              )}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{selfie ? "Looking good 😎" : "Snap a selfie"}</div>
              <div style={{ fontSize: 10, color: "#AAAACC", lineHeight: 1.3 }}>
                Shows on the lobby + leaderboard. Tap to {selfie ? "replace" : "use camera"}.
              </div>
              {selfie && (
                <button
                  onClick={() => setSelfie(null)}
                  style={{
                    alignSelf: "flex-start", marginTop: 2, padding: "3px 7px", borderRadius: 7,
                    background: "transparent", border: "1px solid #2A2A4A", color: "#AAAACC",
                    fontSize: 9, fontWeight: 800, cursor: "pointer", letterSpacing: 0.3, fontFamily: "inherit",
                  }}
                >REMOVE</button>
              )}
            </div>
          </div>
        </div>

        {/* Avatar strip — first 10 */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 900, color: "#AAAACC", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span>😀</span> Or Pick an Avatar
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4 }}>
            {EMOJI_OPTIONS.slice(0, 10).map((emoji) => (
              <button
                key={emoji}
                onClick={() => setAvatarEmoji(emoji)}
                style={{
                  aspectRatio: "1/1", fontSize: 18, cursor: "pointer", padding: 0,
                  background: avatarEmoji === emoji ? "rgba(255,107,53,0.22)" : "#1A1A2E",
                  border: `2px solid ${avatarEmoji === emoji ? "#FF6B35" : "transparent"}`,
                  borderRadius: 9,
                }}
              >{emoji}</button>
            ))}
          </div>
        </div>

        {error && <p style={{ color: "#E94560", fontSize: 14, textAlign: "center", margin: 0 }}>{error}</p>}

        <button
          onClick={handleJoin}
          disabled={loading || !displayName.trim() || inviteCode.length !== 6}
          style={{
            width: "100%", height: 56, border: "none", cursor: "pointer",
            borderRadius: 16,
            background: (loading || !displayName.trim() || inviteCode.length !== 6)
              ? "#2A2A4A"
              : "linear-gradient(135deg, #FF6B35, #E94560)",
            color: "#fff", fontSize: 17, fontWeight: 800,
            opacity: (loading || !displayName.trim() || inviteCode.length !== 6) ? 0.5 : 1,
            fontFamily: "inherit",
          }}
        >
          {loading ? "Joining…" : "Join Room"}
        </button>
      </div>
    </div>
  );
}
