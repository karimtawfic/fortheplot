import { useEffect, useState } from "react";
import {
  subscribeToMyReelJob,
  subscribeToGroupReelJob,
  subscribeToReelJobs,
} from "../repositories/reelRepository";
import type { ReelJob } from "../types";

export function useMyReelJob(roomId: string | null, playerId: string | null) {
  const [job, setJob] = useState<ReelJob | null>(null);

  useEffect(() => {
    if (!roomId || !playerId) return;
    return subscribeToMyReelJob(roomId, playerId, setJob);
  }, [roomId, playerId]);

  return job;
}

export function useGroupReelJob(roomId: string | null) {
  const [job, setJob] = useState<ReelJob | null>(null);

  useEffect(() => {
    if (!roomId) return;
    return subscribeToGroupReelJob(roomId, setJob);
  }, [roomId]);

  return job;
}

export function useAllReelJobs(roomId: string | null) {
  const [jobs, setJobs] = useState<ReelJob[]>([]);

  useEffect(() => {
    if (!roomId) return;
    return subscribeToReelJobs(roomId, setJobs);
  }, [roomId]);

  return jobs;
}
