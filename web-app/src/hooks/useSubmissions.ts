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

  const submittedDareIds = new Set(submissions.map((s) => s.dareId));
  return { submissions, submittedDareIds };
}

export function useAllSubmissions(roomId: string | null) {
  const [submissions, setSubmissions] = useState<DareSubmission[]>([]);

  useEffect(() => {
    if (!roomId) return;
    return subscribeToAllSubmissions(roomId, setSubmissions);
  }, [roomId]);

  return submissions;
}
