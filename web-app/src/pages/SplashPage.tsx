import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/appStore";

export function SplashPage() {
  const navigate = useNavigate();
  const { isAuthenticating } = useAppStore();

  useEffect(() => {
    if (!isAuthenticating) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticating, navigate]);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6 px-6 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col items-center gap-4 animate-fadeIn relative z-10">
        <div className="text-7xl">🎯</div>
        <h1 className="text-4xl font-black text-white tracking-tight">For The Plot</h1>
        <p className="text-white/50 text-center">The dare game for real life</p>
      </div>

      {isAuthenticating && (
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin relative z-10" />
      )}
    </div>
  );
}
