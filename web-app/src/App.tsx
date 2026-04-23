import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { subscribeToAuth } from "./lib/auth";
import { signInAnon } from "./lib/auth";
import { useAppStore } from "./store/appStore";

import { SplashPage } from "./pages/SplashPage";
import { HomePage } from "./pages/HomePage";
import { InstructionsPage } from "./pages/InstructionsPage";
import { CreateRoomPage } from "./pages/CreateRoomPage";
import { JoinRoomPage } from "./pages/JoinRoomPage";
import { LobbyPage } from "./pages/LobbyPage";
import { GameplayPage } from "./pages/GameplayPage";
import { GameEndPage } from "./pages/GameEndPage";
import { ReelStatusPage } from "./pages/ReelStatusPage";
import { ReelPreviewPage } from "./pages/ReelPreviewPage";
import { AdminReviewPage } from "./pages/AdminReviewPage";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthenticating } = useAppStore();
  if (isAuthenticating) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
  if (!currentUser) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

export function App() {
  const { setUser, setAuthenticating } = useAppStore();

  useEffect(() => {
    setAuthenticating(true);
    const unsub = subscribeToAuth((user) => {
      if (user) {
        setUser(user);
        setAuthenticating(false);
      } else {
        signInAnon()
          .then((u) => { setUser(u); setAuthenticating(false); })
          .catch(() => setAuthenticating(false));
      }
    });
    return unsub;
  }, [setUser, setAuthenticating]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/instructions" element={<InstructionsPage />} />
        <Route path="/create" element={<AuthGate><CreateRoomPage /></AuthGate>} />
        <Route path="/join" element={<AuthGate><JoinRoomPage /></AuthGate>} />
        <Route path="/lobby/:roomId" element={<AuthGate><LobbyPage /></AuthGate>} />
        <Route path="/game/:roomId" element={<AuthGate><GameplayPage /></AuthGate>} />
        <Route path="/end/:roomId" element={<AuthGate><GameEndPage /></AuthGate>} />
        <Route path="/reels/:roomId" element={<AuthGate><ReelStatusPage /></AuthGate>} />
        <Route path="/reels/:roomId/preview" element={<AuthGate><ReelPreviewPage /></AuthGate>} />
        <Route path="/admin/:roomId" element={<AuthGate><AdminReviewPage /></AuthGate>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
