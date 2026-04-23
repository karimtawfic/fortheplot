import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex flex-col px-6 py-12 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-24 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero section */}
      <div className="flex-1 flex flex-col justify-center gap-8 relative z-10">
        <div className="flex flex-col gap-5 animate-slideUp">
          <p className="text-primary text-xs font-bold tracking-widest uppercase">
            Real world. Real dares.
          </p>
          <h1 className="text-5xl font-black text-white leading-tight tracking-tight">
            For The Plot
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-xs">
            Complete dares. Earn points. Win the night.
          </p>

          <div className="flex flex-col gap-3 mt-2">
            {[
              { icon: "📸", text: "Photo & video proof verification" },
              { icon: "📍", text: "Real-world location dares" },
              { icon: "🏆", text: "Live leaderboard & highlight reels" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">{icon}</span>
                <span className="text-white/50 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col gap-3 w-full max-w-sm mx-auto animate-slideUp relative z-10">
        <Button size="lg" onClick={() => navigate("/create")} className="w-full">
          🏠 Create Room
        </Button>
        <Button size="lg" variant="secondary" onClick={() => navigate("/join")} className="w-full">
          🔗 Join Room
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate("/instructions")}
          className="w-full"
        >
          How to play
        </Button>
      </div>
    </div>
  );
}
