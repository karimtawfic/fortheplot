import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { subscribeToNeedsReview, callReviewSubmission } from "../repositories/submissionRepository";
import { useRoom } from "../hooks/useRoom";
import { useAppStore } from "../store/appStore";
import { Button } from "../components/Button";
import type { DareSubmission } from "../types";

export function AdminReviewPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentPlayer } = useAppStore();
  const { room } = useRoom(roomId ?? null);
  const [submissions, setSubmissions] = useState<DareSubmission[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const isHost = room?.hostPlayerId === currentPlayer?.playerId;

  useEffect(() => {
    if (!roomId) return;
    return subscribeToNeedsReview(roomId, setSubmissions);
  }, [roomId]);

  async function handleAction(submissionId: string, action: "approve" | "reject") {
    if (!roomId || busyId) return;
    setBusyId(submissionId);
    try {
      await callReviewSubmission({
        roomId,
        submissionId,
        action,
        reason: action === "reject" ? (rejectReason[submissionId] ?? "Rejected by host") : undefined,
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  if (!isHost && room) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-white/60">Host only</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <button onClick={() => navigate(-1)} className="text-white/60 text-2xl">←</button>
        <h1 className="text-white font-bold flex-1">Review Queue</h1>
        <span className="text-white/40 text-sm">{submissions.length} pending</span>
      </div>

      {submissions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/40">Nothing to review</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {submissions.map((sub) => (
            <div key={sub.submissionId} className="p-4 flex flex-col gap-3">
              <div className="flex gap-3 items-start">
                {sub.thumbnailUrl && (
                  <img
                    src={sub.thumbnailUrl}
                    alt="proof"
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm line-clamp-2">{sub.dareTextSnapshot}</p>
                  <p className="text-white/40 text-xs mt-1">{sub.playerId.slice(0, 8)}</p>
                  <p className="text-gold text-xs font-semibold mt-1">+{sub.pointsPotential} pts</p>
                </div>
              </div>

              <input
                type="text"
                placeholder="Rejection reason (optional)"
                value={rejectReason[sub.submissionId] ?? ""}
                onChange={(e) =>
                  setRejectReason((r) => ({ ...r, [sub.submissionId]: e.target.value }))
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary/50"
              />

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 !border-red-500/40 !text-red-400"
                  loading={busyId === sub.submissionId}
                  onClick={() => handleAction(sub.submissionId, "reject")}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  loading={busyId === sub.submissionId}
                  onClick={() => handleAction(sub.submissionId, "approve")}
                >
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
