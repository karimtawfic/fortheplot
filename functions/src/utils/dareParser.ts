import { createHash } from "crypto";
import type { DareCategory, DareDifficulty, VerificationMode } from "../types";

export interface RawDareRow {
  id: string;
  text: string;
  points: number;
  category: DareCategory;
  active: boolean;
  repeatable: boolean;
  verificationMode: VerificationMode;
  difficulty: DareDifficulty;
}

const VALID_CATEGORIES = new Set<string>(["social", "physical", "creative", "food", "outdoor"]);
const VALID_VERIFICATION_MODES = new Set<string>(["none", "media_required", "ai_check", "admin_review"]);
const VALID_DIFFICULTIES = new Set<string>(["easy", "medium", "hard", "wild"]);

export function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function generateDareId(text: string): string {
  return "dare_" + createHash("sha256").update(normalizeText(text)).digest("hex").substring(0, 12);
}

// RFC 4180 CSV parser — handles quoted fields with embedded commas/newlines
export function parseCsv(raw: string): Record<string, string>[] {
  // Strip BOM if present
  const input = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  const lines = input.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = values[idx] ?? "";
    });
    rows.push(row);
  }

  return rows;
}

function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

export interface ParseError {
  row: number;
  field: string;
  message: string;
}

export function validateRow(row: Record<string, string>, rowIndex: number): ParseError[] {
  const errors: ParseError[] = [];

  if (!row.text?.trim()) {
    errors.push({ row: rowIndex, field: "text", message: "text is required" });
  }

  const points = Number(row.points);
  if (isNaN(points) || points <= 0) {
    errors.push({ row: rowIndex, field: "points", message: "points must be a positive number" });
  }

  if (!VALID_CATEGORIES.has(row.category)) {
    errors.push({ row: rowIndex, field: "category", message: `invalid category: ${row.category}` });
  }

  if (!VALID_VERIFICATION_MODES.has(row.verificationMode)) {
    errors.push({ row: rowIndex, field: "verificationMode", message: `invalid verificationMode: ${row.verificationMode}` });
  }

  if (!VALID_DIFFICULTIES.has(row.difficulty)) {
    errors.push({ row: rowIndex, field: "difficulty", message: `invalid difficulty: ${row.difficulty}` });
  }

  return errors;
}

export function normalizeRow(row: Record<string, string>): RawDareRow {
  return {
    id: row.id?.trim() || "",
    text: row.text.trim(),
    points: Number(row.points),
    category: (row.category as DareCategory),
    active: row.active?.toLowerCase() !== "false",
    repeatable: row.repeatable?.toLowerCase() === "true",
    verificationMode: (row.verificationMode as VerificationMode) ?? "media_required",
    difficulty: (row.difficulty as DareDifficulty) ?? "medium",
  };
}

export function parseJson(raw: string): RawDareRow[] {
  const arr = JSON.parse(raw) as Record<string, unknown>[];
  return arr.map((item) => ({
    id: String(item.id ?? ""),
    text: String(item.text ?? ""),
    points: Number(item.points ?? 0),
    category: (item.category as DareCategory) ?? "social",
    active: item.active !== false,
    repeatable: item.repeatable === true,
    verificationMode: (item.verificationMode as VerificationMode) ?? "media_required",
    difficulty: (item.difficulty as DareDifficulty) ?? "medium",
  }));
}
