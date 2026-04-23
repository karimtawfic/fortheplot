import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";

const FEATURES = [
  { icon: "🏠", text: "Join with a 6-letter code" },
  { icon: "📸", text: "Prove dares with photo or video" },
  { icon: "🏆", text: "Live leaderboard, real-time" },
  { icon: "🎬", text: "Auto-generated highlight reel" },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex flex-col relative overflow-hidden">
      {/* Ambient gradient glows */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -80, left: -60, width: 360, height: 360, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,107,53,0.32), transparent 70%)",
          filter: "blur(24px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: 200, right: -100, width: 340, height: 340, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(233,69,96,0.24), transparent 70%)",
          filter: "blur(24px)",
        }}
      />

      {/* Header row */}
      <div className="flex items-center justify-between px-5 pt-14 pb-0 relative z-10">
        <div
          className="text-base font-black tracking-tight flex items-center gap-1.5"
          style={{
            background: "linear-gradient(135deg, #FF6B35, #E94560)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          <span style={{ WebkitTextFillColor: "initial" }}>🌍</span>
          For The Plot
        </div>
        <button
          onClick={() => navigate("/instructions")}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.08)" }}
          aria-label="How to play"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#AAAACC" strokeWidth="1.8" />
            <path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5M12 17v.01" stroke="#AAAACC" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Hero */}
      <div className="px-6 pt-5 pb-4 text-center relative z-10">
        <h1
          className="font-black leading-none tracking-tight"
          style={{ fontSize: 40, letterSpacing: -1.5 }}
        >
          <span className="block text-white">Real world.</span>
          <span className="block text-white">Real dares.</span>
          <span
            className="block italic"
            style={{
              background: "linear-gradient(135deg, #FF6B35, #E94560)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            For the plot.
          </span>
        </h1>
        <p className="text-white/50 text-sm mt-3 leading-relaxed mx-auto max-w-xs">
          Gather your crew, pick your dares, compete in the real world.
        </p>
      </div>

      {/* Feature cards */}
      <div className="px-5 flex flex-col gap-2 relative z-10">
        {FEATURES.map(({ icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border"
            style={{
              background: "rgba(26,26,46,0.7)",
              borderColor: "#2A2A4A",
              backdropFilter: "blur(12px)",
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
              style={{
                background: "rgba(255,107,53,0.14)",
                border: "1px solid rgba(255,107,53,0.3)",
              }}
            >
              {icon}
            </div>
            <span className="text-white font-bold text-sm">{text}</span>
          </div>
        ))}
      </div>

      <div className="flex-1" />

      {/* CTAs */}
      <div className="px-5 pb-10 flex flex-col gap-3 relative z-10">
        <Button size="lg" onClick={() => navigate("/create")} className="w-full">
          Create a Room
        </Button>
        <Button size="lg" variant="secondary" onClick={() => navigate("/join")} className="w-full">
          Join a Room
        </Button>
      </div>
    </div>
  );
}
