import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";

const STEPS = [
  { emoji: "🏠", title: "Create or join a room", body: "One person creates a room and shares the invite code. Others join with the code." },
  { emoji: "🎯", title: "Pick a dare", body: "Swipe through dare cards and choose one that looks fun." },
  { emoji: "📸", title: "Complete & capture", body: "Do the dare and film or photo your proof." },
  { emoji: "⏱️", title: "Race the clock", body: "Complete as many dares as you can before the timer runs out." },
  { emoji: "🏆", title: "Win points", body: "Each dare is worth points. Highest score wins!" },
  { emoji: "🎬", title: "Get your reel", body: "After the game, everyone gets a personal highlight reel." },
];

export function InstructionsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex flex-col px-6 py-8 gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white/60 text-2xl">←</button>
        <h1 className="text-xl font-bold text-white">How to play</h1>
      </div>

      <div className="flex flex-col gap-4">
        {STEPS.map((step, i) => (
          <div key={i} className="flex gap-4 bg-surface/60 rounded-xl p-4">
            <span className="text-3xl">{step.emoji}</span>
            <div>
              <p className="text-white font-semibold">{step.title}</p>
              <p className="text-white/60 text-sm mt-1">{step.body}</p>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={() => navigate("/home")} className="mt-auto">Let's play!</Button>
    </div>
  );
}
