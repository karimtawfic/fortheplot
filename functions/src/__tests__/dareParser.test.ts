import { parseCsv, parseJson, normalizeText, generateDareId, validateRow, normalizeRow } from "../utils/dareParser";

describe("normalizeText", () => {
  it("trims whitespace and lowercases", () => {
    expect(normalizeText("  Hello World  ")).toBe("hello world");
  });

  it("collapses internal spaces", () => {
    expect(normalizeText("Hello   World")).toBe("hello world");
  });
});

describe("generateDareId", () => {
  it("produces a dare_ prefixed 12-char hex id", () => {
    const id = generateDareId("Get a stranger to high-five you");
    expect(id).toMatch(/^dare_[a-f0-9]{12}$/);
  });

  it("is deterministic", () => {
    const text = "Do 10 jumping jacks in a public place";
    expect(generateDareId(text)).toBe(generateDareId(text));
  });

  it("normalizes before hashing", () => {
    expect(generateDareId("Hello World")).toBe(generateDareId("  hello  world  "));
  });

  it("produces different IDs for different text", () => {
    expect(generateDareId("Dare one")).not.toBe(generateDareId("Dare two"));
  });
});

describe("parseCsv", () => {
  it("parses header row + data row", () => {
    const csv = "id,text,points\ndare_001,Get high-five,20";
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("dare_001");
    expect(rows[0].text).toBe("Get high-five");
    expect(rows[0].points).toBe("20");
  });

  it("handles quoted fields with commas", () => {
    const csv = `id,text,points\ndare_001,"Hello, world",20`;
    const rows = parseCsv(csv);
    expect(rows[0].text).toBe("Hello, world");
  });

  it("skips empty lines", () => {
    const csv = "id,text,points\ndare_001,A,10\n\ndare_002,B,20\n";
    expect(parseCsv(csv)).toHaveLength(2);
  });

  it("strips BOM", () => {
    const csv = "\uFEFFid,text,points\ndare_001,A,10";
    const rows = parseCsv(csv);
    expect(rows[0].id).toBe("dare_001");
  });
});

describe("validateRow", () => {
  const validRow = {
    id: "dare_001",
    text: "Do something fun",
    points: "30",
    category: "social",
    active: "true",
    repeatable: "false",
    verificationMode: "media_required",
    difficulty: "easy",
  };

  it("passes a valid row", () => {
    expect(validateRow(validRow, 1)).toHaveLength(0);
  });

  it("fails on missing text", () => {
    const errors = validateRow({ ...validRow, text: "" }, 1);
    expect(errors.some((e) => e.field === "text")).toBe(true);
  });

  it("fails on invalid points", () => {
    const errors = validateRow({ ...validRow, points: "abc" }, 1);
    expect(errors.some((e) => e.field === "points")).toBe(true);
  });

  it("fails on zero points", () => {
    const errors = validateRow({ ...validRow, points: "0" }, 1);
    expect(errors.some((e) => e.field === "points")).toBe(true);
  });

  it("fails on invalid category", () => {
    const errors = validateRow({ ...validRow, category: "unknown" }, 1);
    expect(errors.some((e) => e.field === "category")).toBe(true);
  });

  it("fails on invalid verificationMode", () => {
    const errors = validateRow({ ...validRow, verificationMode: "auto" }, 1);
    expect(errors.some((e) => e.field === "verificationMode")).toBe(true);
  });

  it("fails on invalid difficulty", () => {
    const errors = validateRow({ ...validRow, difficulty: "extreme" }, 1);
    expect(errors.some((e) => e.field === "difficulty")).toBe(true);
  });
});

describe("normalizeRow", () => {
  const raw = {
    id: "dare_001",
    text: "Do something fun",
    points: "30",
    category: "social",
    active: "true",
    repeatable: "false",
    verificationMode: "media_required",
    difficulty: "easy",
  };

  it("casts points to number", () => {
    expect(normalizeRow(raw).points).toBe(30);
  });

  it("casts active to boolean", () => {
    expect(normalizeRow(raw).active).toBe(true);
    expect(normalizeRow({ ...raw, active: "false" }).active).toBe(false);
  });

  it("casts repeatable to boolean", () => {
    expect(normalizeRow(raw).repeatable).toBe(false);
    expect(normalizeRow({ ...raw, repeatable: "true" }).repeatable).toBe(true);
  });
});

describe("parseJson", () => {
  it("parses a JSON array", () => {
    const json = JSON.stringify([
      { id: "d1", text: "A dare", points: 20, category: "social", active: true, repeatable: false, verificationMode: "media_required", difficulty: "easy" },
    ]);
    const rows = parseJson(json);
    expect(rows).toHaveLength(1);
    expect(rows[0].text).toBe("A dare");
    expect(rows[0].points).toBe(20);
  });

  it("defaults missing fields", () => {
    const json = JSON.stringify([{ text: "Minimal", points: 10 }]);
    const rows = parseJson(json);
    expect(rows[0].category).toBe("social");
    expect(rows[0].repeatable).toBe(false);
    expect(rows[0].verificationMode).toBe("media_required");
    expect(rows[0].difficulty).toBe("medium");
  });
});
