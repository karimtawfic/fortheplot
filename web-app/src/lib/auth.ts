import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../firebase";

export async function signInAnon(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export function currentUser(): User | null {
  return auth.currentUser;
}

export function currentUID(): string {
  return auth.currentUser?.uid ?? "";
}
