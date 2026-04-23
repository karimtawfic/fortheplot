import React from "react";
import { useNavigate } from "react-router-dom";

const STEPS = [
  { n: "1", title: "Set the scene", body: "Create a room (30m – 4h). Share the 6-letter code — up to 20 players." },
  { n: "2", title: "Swipe through dares", body: "250+ dares across 5 categories. Some chill, some wild." },
  { n: "3", title: "Capture proof", body: "Snap a photo or record a video. AI verifies most automatically." },
  { n: "4", title: "Earn points live", body: "Points land on the leaderboard instantly. Watch friends climb." },
  { n: "5", title: "Get your reel", body: "When time's up, we stitch a 60-sec personal reel + a group reel." },
];

export function InstructionsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex flex-col" style={{ color: "#fff" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-3">
        <div style={{ width: 56 }} />
        <div style={{ fontSize: 16, fontWeight: 700 }}>How to Play</div>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", color: "#FF6B35", fontSize: 16, fontWeight: 700, cursor: "pointer" }}
        >Done</button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: "4px 18px 18px", gap: 8 }}>
        {STEPS.map((step) => (
          <div key={step.n} style={{
            display: "flex", gap: 11,
            padding: "11px 12px", borderRadius: 13,
            background: "#1A1A2E", border: "1px solid #2A2A4A",
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 999, flexShrink: 0,
              background: "linear-gradient(135deg, #FF6B35, #E94560)",
              color: "#fff", fontWeight: 900, fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(255,107,53,0.3)",
            }}>{step.n}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2, lineHeight: 1.2 }}>{step.title}</div>
              <div style={{ fontSize: 12, color: "#AAAACC", lineHeight: 1.35 }}>{step.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
