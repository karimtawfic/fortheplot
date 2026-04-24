export interface SavedGamePlayer {
  playerId: string;
  displayName: string;
  avatarEmoji: string;
  totalPoints: number;
  rank: number;
}

export interface SavedGameSubmission {
  submissionId: string;
  dareId: string;
  dareText: string;
  pointsAwarded: number;
  mediaType: "image" | "video";
  mediaUrl: string;
  thumbnailUrl: string;
  verificationStatus: string;
}

export interface SavedGame {
  roomId: string;
  inviteCode: string;
  hostPlayerId: string;
  savedAt: string;
  timerMinutes: number;
  myPlayerId: string;
  players: SavedGamePlayer[];
  mySubmissions: SavedGameSubmission[];
}

const KEY = "ftp:games";
const MAX = 20;

export function saveGame(game: SavedGame): void {
  try {
    const prev = loadGames().filter((g) => g.roomId !== game.roomId);
    localStorage.setItem(KEY, JSON.stringify([game, ...prev].slice(0, MAX)));
  } catch {
    // storage full or unavailable
  }
}

export function loadGames(): SavedGame[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function loadGame(roomId: string): SavedGame | null {
  return loadGames().find((g) => g.roomId === roomId) ?? null;
}
