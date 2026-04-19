import { useEffect, useState } from "react";
import { subscribeToRoom, subscribeToPlayers } from "../repositories/roomRepository";
import type { Room, Player } from "../types";

export function useRoom(roomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) { setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeToRoom(roomId, (r) => {
      setRoom(r);
      setLoading(false);
    });
    return unsub;
  }, [roomId]);

  return { room, loading };
}

export function usePlayers(roomId: string | null) {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (!roomId) return;
    return subscribeToPlayers(roomId, setPlayers);
  }, [roomId]);

  return players;
}
