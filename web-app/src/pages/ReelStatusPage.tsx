import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { useMyReelJob, useGroupReelJob } from "../hooks/useReels";
import { useAppStore } from "../store/appStore";
import type { ReelJob } from "../types";
import { clsx } from "clsx";

function ReelJobRow({ label, job, onWatch }: { label: string; job: ReelJob | null; onWatch?: () => void }) {
  const icon =
    !job ? "⏳" :
    job.status === "queued" ? "⏳" :
    job.status === "processing" ? "⚙️" :
    job.status === "complete" ? "✅" : "❌";

  const text =
    !job ? "Not started" :
    job.status === "queued" ? "Queued" :
    job.status === "processing" ? "Rendering…" :
    job.status === "complete" ? "Ready!" : "Failed";

  return (
    <div className={clsx(
      "flex items-center gap-4 bg-surface/60 rounded-xl px-4 py-4",
      job?.status === "complete" && "border border-primary/30"
    )}>
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <p className="text-white font-semibold text-sm">{label}</p>
        <p className="text-white/50 text-xs">{text}</p>
      </div>
      {job?.status === "complete" && onWatch && (
        <Button size="sm" onClick={onWatch}>Watch</Button>
      )}
    </div>
  );
}

export function ReelStatusPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentPlayer } = useAppStore();
  const myJob = useMyReelJob(roomId ?? null, currentPlayer?.playerId ?? null);
  const groupJob = useGroupReelJob(roomId ?? null);

  return (
    <div className="min-h-screen bg-bg flex flex-col px-6 py-8 gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white/60 text-2xl">←</button>
        <h1 className="text-xl font-bold text-white">Your Reels</h1>
      </div>

      <p className="text-white/50 text-sm text-center">
        Reels are being rendered. This takes about a minute.
      </p>

      <div className="flex flex-col gap-3">
        <ReelJobRow
          label="My Reel"
          job={myJob}
          onWatch={myJob?.outputUrl ? () => navigate(`/reels/${roomId}/preview?url=${encodeURIComponent(myJob.outputUrl!)}`) : undefined}
        />
        <ReelJobRow
          label="Group Reel"
          job={groupJob}
          onWatch={groupJob?.outputUrl ? () => navigate(`/reels/${roomId}/preview?url=${encodeURIComponent(groupJob.outputUrl!)}`) : undefined}
        />
      </div>

      <Button variant="ghost" className="mt-auto" onClick={() => navigate(`/end/${roomId}`)}>
        Back to Leaderboard
      </Button>
    </div>
  );
}
