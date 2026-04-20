import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/appStore";

export function SplashPage() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticating } = useAppStore();

  useEffect(() => {
    if (!isAuthenticating && currentUser) {
      navigate("/home", { replace: true });
    }
  }, [currentUser, isAuthenticating, navigate]);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6 px-6">
      <div className="flex flex-col items-center gap-4 animate-fadeIn">
        <div className="text-7xl">🎯</div>
        <h1 className="text-4xl font-black text-white tracking-tight">For The Plot</h1>
        <p className="text-white/50 text-center">The dare game for real life</p>
      </div>
      {isAuthenticating && (
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      )}
    </div>
  );
}
