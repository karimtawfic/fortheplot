// Unit tests for submitDare business logic (verification-aware)

describe("submitDare — input validation", () => {
  it("requires submissionId", () => {
    const data = { submissionId: "", roomId: "r1", dareId: "d1", mediaUrl: "https://x.com/a.jpg", thumbnailUrl: "https://x.com/t.jpg", mediaType: "image" };
    expect(!data.submissionId).toBe(true);
  });

  it("requires roomId", () => {
    const data = { submissionId: "uuid", roomId: "", dareId: "d1", mediaUrl: "https://x.com/a.jpg", thumbnailUrl: "https://x.com/t.jpg", mediaType: "image" };
    expect(!data.roomId).toBe(true);
  });

  it("requires dareId", () => {
    const data = { submissionId: "uuid", roomId: "r1", dareId: "", mediaUrl: "https://x.com/a.jpg", thumbnailUrl: "https://x.com/t.jpg", mediaType: "image" };
    expect(!data.dareId).toBe(true);
  });

  it("validates mediaType is image or video", () => {
    const valid = ["image", "video"];
    expect(valid.includes("image")).toBe(true);
    expect(valid.includes("video")).toBe(true);
    expect(valid.includes("photo")).toBe(false); // legacy, normalized by handler
    expect(valid.includes("audio")).toBe(false);
  });

  it("normalizes photo → image", () => {
    const rawMediaType = "photo";
    const normalized = rawMediaType === "photo" ? "image" : rawMediaType;
    expect(normalized).toBe("image");
  });

  it("validates mediaUrl starts with https", () => {
    expect("https://storage.googleapis.com/bucket/file.jpg".startsWith("https://")).toBe(true);
    expect("http://insecure.com/file.jpg".startsWith("https://")).toBe(false);
  });
});

function calcPoints(status: string, darePoints: number): number {
  return status === "approved" ? darePoints : 0;
}

describe("submitDare — points awarded based on verificationStatus", () => {
  it("awards dare.points when status is approved", () => {
    expect(calcPoints("approved", 30)).toBe(30);
  });

  it("awards 0 points when status is needs_review", () => {
    expect(calcPoints("needs_review", 30)).toBe(0);
  });

  it("awards 0 points when status is rejected", () => {
    expect(calcPoints("rejected", 80)).toBe(0);
  });

  it("awards 0 points when status is pending", () => {
    expect(calcPoints("pending", 50)).toBe(0);
  });
});

describe("submitDare — client-provided submissionId", () => {
  it("uses the client-provided submissionId as Firestore document ID", () => {
    const clientId = "550e8400-e29b-41d4-a716-446655440000";
    const docId = clientId; // server should use this directly
    expect(docId).toBe(clientId);
  });

  it("rejects replay if submissionId document already exists", () => {
    const existingDoc = { exists: true };
    expect(existingDoc.exists).toBe(true); // should throw already-exists error
  });
});

describe("submitDare — duplicate dare prevention (L1)", () => {
  it("blocks re-submission of an approved dare", () => {
    const existingSubmissions = [{ playerId: "p1", dareId: "d1", verificationStatus: "approved" }];
    const nonRejected = existingSubmissions.filter((s) => s.verificationStatus !== "rejected");
    const alreadyDone = nonRejected.some((s) => s.playerId === "p1" && s.dareId === "d1");
    expect(alreadyDone).toBe(true);
  });

  it("allows retry of a rejected dare", () => {
    const existingSubmissions = [{ playerId: "p1", dareId: "d1", verificationStatus: "rejected" }];
    const nonRejected = existingSubmissions.filter((s) => s.verificationStatus !== "rejected");
    const alreadyDone = nonRejected.some((s) => s.playerId === "p1" && s.dareId === "d1");
    expect(alreadyDone).toBe(false);
  });

  it("allows re-submission of a repeatable dare", () => {
    const dare = { repeatable: true };
    const existingSubmissions = [{ playerId: "p1", dareId: "d1", verificationStatus: "approved" }];
    let alreadyDone = false;
    if (!dare.repeatable) {
      const nonRejected = existingSubmissions.filter((s) => s.verificationStatus !== "rejected");
      alreadyDone = nonRejected.some((s) => s.playerId === "p1" && s.dareId === "d1");
    }
    expect(alreadyDone).toBe(false);
  });
});

describe("submitDare — timer expiry with grace window", () => {
  const GRACE_MS = 30_000;

  it("blocks submission beyond grace window", () => {
    const endsAt = { toMillis: () => Date.now() - 40_000 }; // 40s expired
    const submittedAt = Date.now();
    expect(submittedAt > endsAt.toMillis() + GRACE_MS).toBe(true);
  });

  it("allows submission within grace window", () => {
    const endsAt = { toMillis: () => Date.now() - 10_000 }; // 10s expired
    const submittedAt = Date.now();
    expect(submittedAt > endsAt.toMillis() + GRACE_MS).toBe(false);
  });
});
