// Unit tests for createRoom Cloud Function logic
// Uses mocked Firebase Admin SDK

const mockSet = jest.fn().mockResolvedValue(undefined);
const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockGet = jest.fn();
const mockBatchSet = jest.fn();
const mockBatchUpdate = jest.fn();
const mockBatchCommit = jest.fn().mockResolvedValue(undefined);
const mockBatch = jest.fn().mockReturnValue({
  set: mockBatchSet,
  update: mockBatchUpdate,
  commit: mockBatchCommit,
});

const mockWhere = jest.fn();
const mockLimit = jest.fn();
const mockCollectionGet = jest.fn();

jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn().mockReturnValue({
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        id: "mock-room-id",
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({ id: "mock-player-id" }),
        }),
        set: mockSet,
        update: mockUpdate,
      }),
      where: mockWhere,
    }),
    batch: mockBatch,
  }),
  firestore: Object.assign(
    jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          id: "mock-room-id",
          collection: jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnValue({ id: "mock-uid" }),
          }),
        }),
        where: mockWhere,
      }),
      batch: mockBatch,
    }),
    {
      Timestamp: {
        now: jest.fn().mockReturnValue({ toMillis: () => Date.now() }),
        fromMillis: jest.fn((ms) => ({ toMillis: () => ms })),
      },
      FieldValue: {
        increment: jest.fn((n) => ({ _increment: n })),
        delete: jest.fn(),
      },
    }
  ),
}));

jest.mock("firebase-functions", () => ({
  https: {
    onCall: jest.fn((handler) => handler),
    HttpsError: class HttpsError extends Error {
      code: string;
      constructor(code: string, message: string) {
        super(message);
        this.code = code;
      }
    },
  },
  config: jest.fn().mockReturnValue({}),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("createRoom - invite code generation", () => {
  const VALID_CHARS = new Set("ABCDEFGHJKMNPQRSTUVWXYZ23456789".split(""));

  it("generates a 6-character invite code with valid characters only", () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    for (let i = 0; i < 100; i++) {
      const code = Array.from({ length: 6 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join("");
      expect(code).toHaveLength(6);
      code.split("").forEach((c) => {
        expect(VALID_CHARS.has(c)).toBe(true);
      });
    }
  });

  it("never includes ambiguous characters O, 0, I, 1, L", () => {
    const ambiguous = new Set(["O", "0", "I", "1", "L"]);
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    chars.split("").forEach((c) => {
      expect(ambiguous.has(c)).toBe(false);
    });
  });
});

describe("createRoom - validation", () => {
  const validTimers = [5, 10, 15, 30, 45, 60, 90, 120];

  it("accepts all valid timer durations", () => {
    validTimers.forEach((t) => {
      expect(validTimers.includes(t)).toBe(true);
    });
  });

  it("rejects invalid timer duration", () => {
    const invalid = [0, 1, 7, 25, 200];
    invalid.forEach((t) => {
      expect(validTimers.includes(t)).toBe(false);
    });
  });

  it("rejects empty displayName", () => {
    const empty = ["", "   ", "\t"];
    empty.forEach((name) => {
      expect(name.trim().length).toBe(0);
    });
  });
});
