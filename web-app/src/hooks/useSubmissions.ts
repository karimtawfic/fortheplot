import { useEffect, useState } from "react";
import {
  subscribeToMySubmissions,
  subscribeToAllSubmissions,
} from "../repositories/submissionRepository";
import type { DareSubmission } from "../types";

export function useMySubmissions(roomId: string | null, playerId: string | null) {
  const [submissions, setSubmissions] = useState<DareSubmission[]>([]);

  useEffect(() => {
    if (!roomId || !playerId) return;
    return subscribeToMySubmissions(roomId, playerId, setSubmissions);
  }, [roomId, playerId]);

  // Exclude rejected so clicking a rejected dare opens ProofUpload for retry
  const submittedDareIds = new Set(
    submissions
      .filter((s) => (s.verificationStatus ?? "approved") !== "rejected")
      .map((s) => s.dareId)
  );

  const submissionByDareId = new Map(submissions.map((s) => [s.dareId, s]));

  return { submissions, submittedDareIds, submissionByDareId };
}

export function useAllSubmissions(roomId: string | null) {
  const [submissions, setSubmissions] = useState<DareSubmission[]>([]);

  useEffect(() => {
    if (!roomId) return;
    return subscribeToAllSubmissions(roomId, setSubmissions);
  }, [roomId]);

  return submissions;
}
