#!/usr/bin/env node
/**
 * Seed the `dares` Firestore collection from Seed/dares.json.
 *
 * Usage:
 *   # Set credentials first:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *   # OR:
 *   export FIREBASE_SERVICE_ACCOUNT="$(cat /path/to/service-account.json)"
 *
 *   npm run seed
 */
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
initializeApp({
  credential: sa ? cert(JSON.parse(sa)) : applicationDefault(),
});

const db = getFirestore();
const seedPath = resolve(__dirname, "../../Seed/dares.json");
const dares = JSON.parse(readFileSync(seedPath, "utf-8")) as Array<{
  id: string;
  text: string;
  points: number;
  category: string;
  active: boolean;
}>;

console.log(`Seeding ${dares.length} dares…`);

const batch = db.batch();
for (const dare of dares) {
  batch.set(db.doc(`dares/${dare.id}`), {
    dareId: dare.id,
    text: dare.text,
    points: dare.points,
    category: dare.category,
    active: dare.active,
  });
}
await batch.commit();

console.log(`✅ Seeded ${dares.length} dares to Firestore.`);
process.exit(0);
