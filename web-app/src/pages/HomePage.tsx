import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-between px-6 py-16">
      <div className="flex flex-col items-center gap-4 mt-8 animate-slideUp">
        <div className="text-8xl">🎯</div>
        <h1 className="text-4xl font-black text-white tracking-tight">Out & About</h1>
        <p className="text-white/50 text-center max-w-xs">
          Complete dares. Earn points. Win the night.
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm animate-slideUp">
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
