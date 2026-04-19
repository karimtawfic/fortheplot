import React from "react";
import type { Timestamp } from "firebase/firestore";
import { useTimer } from "../hooks/useTimer";
import { clsx } from "clsx";

interface TimerProps {
  endsAt: Timestamp | undefined;
  onExpire?: () => void;
}

export function Timer({ endsAt, onExpire }: TimerProps) {
  const { formatted, secondsLeft, isExpired } = useTimer(endsAt);

  React.useEffect(() => {
    if (isExpired) onExpire?.();
  }, [isExpired, onExpire]);

  return (
    <div
      className={clsx(
        "font-mono font-bold tabular-nums transition-colors",
        secondsLeft <= 60 ? "text-red-400 animate-pulse" : "text-white"
      )}
    >
      {formatted}
    </div>
  );
}
