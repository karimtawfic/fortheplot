import { httpsCallable } from "firebase/functions";
import { doc, collection } from "firebase/firestore";
import { functions, db } from "../firebase";
import { subscribeDocument, subscribeCollection } from "../lib/firestore";
import type { Room, Player } from "../types";

interface CreateRoomArgs {
  displayName: string;
  avatarEmoji: string;
  timerMinutes: number;
}
interface CreateRoomResult {
  roomId: string;
  playerId: string;
  inviteCode: string;
}

interface JoinRoomArgs {
  inviteCode: string;
  displayName: string;
  avatarEmoji: string;
}
interface JoinRoomResult {
  roomId: string;
  playerId: string;
}

export async function createRoom(args: CreateRoomArgs): Promise<CreateRoomResult> {
  const fn = httpsCallable<CreateRoomArgs, CreateRoomResult>(functions, "createRoom");
  const result = await fn(args);
  return result.data;
}

export async function joinRoom(args: JoinRoomArgs): Promise<JoinRoomResult> {
  const fn = httpsCallable<JoinRoomArgs, JoinRoomResult>(functions, "joinRoom");
  const result = await fn(args);
  return result.data;
}

export async function startGame(roomId: string): Promise<void> {
  const fn = httpsCallable<{ roomId: string }, void>(functions, "startGame");
  await fn({ roomId });
}

export async function endGame(roomId: string): Promise<void> {
  const fn = httpsCallable<{ roomId: string }, void>(functions, "endGame");
  await fn({ roomId });
}

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
  return subscribeCollection<Player>(
    collection(db, "rooms", roomId, "players"),
    onData,
    onError
  );
}
