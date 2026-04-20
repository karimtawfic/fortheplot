#!/usr/bin/env tsx
/**
 * Import dares from CSV (or JSON fallback) into Firestore.
 * Usage: npm run import-dares [-- --file <path>] [--dry-run] [--reset] [--project <id>]
 */

import * as fs from "fs";
import * as path from "path";
import * as admin from "firebase-admin";
import { parseCsv, parseJson, validateRow, normalizeRow, generateDareId } from "../src/utils/dareParser";
import type { RawDareRow } from "../src/utils/dareParser";

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const fileArgIdx = args.indexOf("--file");
const filePath = fileArgIdx !== -1 ? args[fileArgIdx + 1] : null;
const dryRun = args.includes("--dry-run");
const reset = args.includes("--reset");
const projectArgIdx = args.indexOf("--project");
const projectId = projectArgIdx !== -1 ? args[projectArgIdx + 1] : undefined;

// ─── Firebase init ────────────────────────────────────────────────────────────

const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountEnv && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("ERROR: Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS");
  process.exit(1);
}

const appOptions: admin.AppOptions = projectId ? { projectId } : {};
if (serviceAccountEnv) {
  appOptions.credential = admin.credential.cert(JSON.parse(serviceAccountEnv));
}
admin.initializeApp(appOptions);
const db = admin.firestore();

// ─── Load source file ─────────────────────────────────────────────────────────

function loadRows(): RawDareRow[] {
  const candidates = [
    filePath,
    path.join(__dirname, "../../Seed/dares.csv"),
    path.join(__dirname, "../../Seed/dares.sample.json"),
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    const raw = fs.readFileSync(p, "utf-8");
    if (p.endsWith(".csv")) {
      console.log(`Loading CSV: ${p}`);
      const csvRows = parseCsv(raw);
      return csvRows.map((row, i) => {
        const errors = validateRow(row, i + 1);
        if (errors.length > 0) {
          errors.forEach((e) => console.warn(`  Row ${e.row} [${e.field}]: ${e.message}`));
        }
        return normalizeRow(row);
      });
    } else if (p.endsWith(".json")) {
      console.log(`Loading JSON: ${p}`);
      return parseJson(raw);
    }
  }

  console.error("ERROR: No dare source file found");
  process.exit(1);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const rows = loadRows();
  console.log(`Loaded ${rows.length} dare rows`);

  if (dryRun) {
    console.log("DRY RUN — no writes will be made");
  }

  const stats = { total: rows.length, inserted: 0, updated: 0, unchanged: 0, migrated: 0, skipped: 0, errors: [] as string[] };

  if (reset && !dryRun) {
    console.log("RESET: deleting existing dares collection...");
    const existing = await db.collection("dares").get();
    const deleteBatch = db.batch();
    existing.docs.forEach((doc) => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
    console.log(`Deleted ${existing.size} existing dares`);
  }

  // Process in batches of 499 ops
  const BATCH_SIZE = 499;
  let batchOps: Array<() => void> = [];
  let batch = db.batch();

  const flush = async () => {
    if (dryRun || batchOps.length === 0) return;
    batchOps.forEach((fn) => fn());
    await batch.commit();
    batch = db.batch();
    batchOps = [];
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (!row.text) {
      stats.skipped++;
      stats.errors.push(`Row ${i + 1}: missing text`);
      continue;
    }

    const hashId = generateDareId(row.text);
    const legacyId = row.id;
    const daresCol = db.collection("dares");

    try {
      const hashDoc = await daresCol.doc(hashId).get();

      if (hashDoc.exists) {
        const existing = hashDoc.data()!;
        const hasChanges =
          existing.text !== row.text ||
          existing.points !== row.points ||
          existing.category !== row.category ||
          existing.active !== row.active ||
          existing.repeatable !== row.repeatable ||
          existing.verificationMode !== row.verificationMode ||
          existing.difficulty !== row.difficulty;

        if (hasChanges) {
          const ref = daresCol.doc(hashId);
          batchOps.push(() => {
            batch.update(ref, {
              text: row.text,
              points: row.points,
              category: row.category,
              active: row.active,
              repeatable: row.repeatable,
              verificationMode: row.verificationMode,
              difficulty: row.difficulty,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });
          stats.updated++;
        } else {
          stats.unchanged++;
        }
      } else if (legacyId) {
        const legacyDoc = await daresCol.doc(legacyId).get();

        if (legacyDoc.exists) {
          // Migrate: write to hash-based ID, deactivate legacy
          const ref = daresCol.doc(hashId);
          const legacyRef = daresCol.doc(legacyId);
          batchOps.push(() => {
            batch.set(ref, {
              dareId: hashId,
              text: row.text,
              points: row.points,
              category: row.category,
              active: row.active,
              repeatable: row.repeatable,
              verificationMode: row.verificationMode,
              difficulty: row.difficulty,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            batch.update(legacyRef, { active: false });
          });
          stats.migrated++;
        } else {
          // Insert new
          const ref = daresCol.doc(hashId);
          batchOps.push(() => {
            batch.set(ref, {
              dareId: hashId,
              text: row.text,
              points: row.points,
              category: row.category,
              active: row.active,
              repeatable: row.repeatable,
              verificationMode: row.verificationMode,
              difficulty: row.difficulty,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });
          stats.inserted++;
        }
      } else {
        // Insert new (no legacy id)
        const ref = daresCol.doc(hashId);
        batchOps.push(() => {
          batch.set(ref, {
            dareId: hashId,
            text: row.text,
            points: row.points,
            category: row.category,
            active: row.active,
            repeatable: row.repeatable,
            verificationMode: row.verificationMode,
            difficulty: row.difficulty,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
        stats.inserted++;
      }

      if (batchOps.length >= BATCH_SIZE) {
        await flush();
      }
    } catch (err) {
      stats.errors.push(`Row ${i + 1} (${hashId}): ${err}`);
      stats.skipped++;
    }
  }

  await flush();

  console.log("\n=== Import Summary ===");
  console.log(`Total:     ${stats.total}`);
  console.log(`Inserted:  ${stats.inserted}`);
  console.log(`Updated:   ${stats.updated}`);
  console.log(`Unchanged: ${stats.unchanged}`);
  console.log(`Migrated:  ${stats.migrated}`);
  console.log(`Skipped:   ${stats.skipped}`);
  if (stats.errors.length > 0) {
    console.log(`\nErrors:`);
    stats.errors.forEach((e) => console.log(`  - ${e}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
