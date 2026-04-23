import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";

const STEPS = [
  { emoji: "🏠", title: "Create or join a room", body: "One person creates a room and shares the 6-character code. Others join with the code." },
  { emoji: "🎯", title: "Pick a dare", body: "Browse dare cards by category and choose one that looks fun — or challenging." },
  { emoji: "📸", title: "Complete & capture", body: "Do the dare and film or photograph your proof. The more creative the better." },
  { emoji: "⏱️", title: "Race the clock", body: "Complete as many dares as you can before the timer runs out." },
  { emoji: "🏆", title: "Win points", body: "Each dare is worth points. Harder dares score more. Highest score wins!" },
  { emoji: "🎬", title: "Get your reel", body: "After the game, everyone gets a personal highlight reel of their best moments." },
];

export function InstructionsPage() {
  const navigate = useNavigate();

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
        <h1 className="text-2xl font-black text-white">How to play</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8 flex flex-col gap-3">
        {STEPS.map((step, i) => (
          <div key={i} className="flex gap-4 bg-surface border border-border rounded-2xl p-4">
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black"
                style={{ background: "linear-gradient(135deg, #FF6B35, #E94560)" }}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && <div className="w-px flex-1 bg-border" />}
            </div>
            <div className="pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{step.emoji}</span>
                <p className="text-white font-bold">{step.title}</p>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">{step.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 pb-safe pb-8">
        <Button onClick={() => navigate("/home")} size="lg" className="w-full">
          Let's play! 🎯
        </Button>
      </div>
    </div>
  );
}
