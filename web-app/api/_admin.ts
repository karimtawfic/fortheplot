import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error("FIREBASE_SERVICE_ACCOUNT env var not set");
  initializeApp({ credential: cert(JSON.parse(sa)) });
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
export { FieldValue, Timestamp };
