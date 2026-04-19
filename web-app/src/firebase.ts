import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// ─── Firebase config ─────────────────────────────────────────────────────────
// Replace these values with your Firebase project config.
// In CI/CD: inject via environment variables at build time.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "REPLACE_WITH_REAL_VALUE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "REPLACE_WITH_REAL_VALUE",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "REPLACE_WITH_REAL_VALUE",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "REPLACE_WITH_REAL_VALUE",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "REPLACE_WITH_REAL_VALUE",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "REPLACE_WITH_REAL_VALUE",
};

// Guard against double-init (e.g. HMR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === "true") {
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "localhost", 8080);
  connectStorageEmulator(storage, "localhost", 9199);
}
