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
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-3">
        <div className="w-14" />
        <p className="text-base font-bold text-white">How to Play</p>
        <button
          onClick={() => navigate(-1)}
          className="text-primary font-bold text-base"
        >
          Done
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2 px-5 pb-6">
        {STEPS.map((step) => (
          <div
            key={step.n}
            className="flex gap-3 p-3 rounded-2xl bg-surface border border-border"
          >
            <div
              className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-black text-sm text-white"
              style={{ background: "linear-gradient(135deg, #FF6B35, #E94560)" }}
            >
              {step.n}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black mb-0.5 leading-tight text-white">{step.title}</p>
              <p className="text-xs text-white/50 leading-relaxed">{step.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
