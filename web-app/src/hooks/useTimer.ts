import { useEffect, useState } from "react";
import type { Timestamp } from "firebase/firestore";

interface TimerState {
  secondsLeft: number;
  formatted: string;
  isExpired: boolean;
}

function computeState(endsAt: Timestamp | undefined): TimerState {
  if (!endsAt) return { secondsLeft: 0, formatted: "0:00", isExpired: false };
  const ms = endsAt.toMillis() - Date.now();
  const secs = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return {
    secondsLeft: secs,
    formatted: `${m}:${String(s).padStart(2, "0")}`,
    isExpired: secs === 0,
  };
}

export function useTimer(endsAt: Timestamp | undefined): TimerState {
  const [state, setState] = useState(() => computeState(endsAt));

  useEffect(() => {
    setState(computeState(endsAt));
    if (!endsAt) return;
    const id = setInterval(() => {
      const next = computeState(endsAt);
      setState(next);
      if (next.isExpired) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return state;
}
