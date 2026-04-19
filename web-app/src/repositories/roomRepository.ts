import { doc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { callApi } from "../lib/api";
import { subscribeDocument, subscribeCollection } from "../lib/firestore";
import type { Room, Player } from "../types";

interface CreateRoomResult { roomId: string; playerId: string; inviteCode: string; }
interface JoinRoomResult { roomId: string; playerId: string; }

export const createRoom = (args: { displayName: string; avatarEmoji: string; timerMinutes: number }) =>
  callApi<CreateRoomResult>("/api/createRoom", args);

export const joinRoom = (args: { inviteCode: string; displayName: string; avatarEmoji: string }) =>
  callApi<JoinRoomResult>("/api/joinRoom", args);

export const startGame = (roomId: string) =>
  callApi<void>("/api/startGame", { roomId });

export const endGame = (roomId: string) =>
  callApi<void>("/api/endGame", { roomId });

export function subscribeToRoom(
  roomId: string,
  onData: (room: Room | null) => void,
  onError?: (err: Error) => void
): () => void {
  return subscribeDocument<Room>(doc(db, "rooms", roomId), onData, onError);
}

export function subscribeToPlayers(
  roomId: string,
  onData: (players: Player[]) => void,
  onError?: (err: Error) => void
): () => void {
  return subscribeCollection<Player>(collection(db, "rooms", roomId, "players"), onData, onError);
}
