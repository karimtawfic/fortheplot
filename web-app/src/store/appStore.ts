import { create } from "zustand";
import type { User } from "firebase/auth";
import type { Room, Player } from "../types";

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticating: boolean;

  // Session
  currentRoom: Room | null;
  currentPlayer: Player | null;

  // Actions
  setUser: (user: User | null) => void;
  setAuthenticating: (v: boolean) => void;
  setSession: (room: Room, player: Player) => void;
  updateRoom: (room: Room) => void;
  updatePlayer: (player: Player) => void;
  clearSession: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  isAuthenticating: false,
  currentRoom: null,
  currentPlayer: null,

  setUser: (user) => set({ currentUser: user }),
  setAuthenticating: (v) => set({ isAuthenticating: v }),
  setSession: (room, player) => set({ currentRoom: room, currentPlayer: player }),
  updateRoom: (room) => set({ currentRoom: room }),
  updatePlayer: (player) => set({ currentPlayer: player }),
  clearSession: () => set({ currentRoom: null, currentPlayer: null }),
}));
