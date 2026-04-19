import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  onSnapshot,
  type Query,
  type DocumentReference,
  type CollectionReference,
} from "firebase/firestore";
import { db } from "../firebase";

export { collection, doc, query, db };
export type { Query, DocumentReference, CollectionReference };

// ─── One-shot reads ───────────────────────────────────────────────────────────

export async function fetchDocument<T>(ref: DocumentReference): Promise<T | null> {
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { ...(snap.data() as T) };
}

export async function fetchCollection<T>(q: Query): Promise<T[]> {
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data() } as T));
}

// ─── Realtime subscriptions ───────────────────────────────────────────────────

export function subscribeDocument<T>(
  ref: DocumentReference,
  onData: (data: T | null) => void,
  onError?: (err: Error) => void
): () => void {
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) { onData(null); return; }
      onData({ ...snap.data() } as T);
    },
    (err) => {
      console.error("[Firestore] doc subscription error:", err);
      onError?.(err);
    }
  );
}

export function subscribeCollection<T>(
  q: Query,
  onData: (items: T[]) => void,
  onError?: (err: Error) => void
): () => void {
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ ...d.data() } as T)));
    },
    (err) => {
      console.error("[Firestore] collection subscription error:", err);
      onError?.(err);
    }
  );
}
