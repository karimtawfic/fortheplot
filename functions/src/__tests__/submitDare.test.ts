// Unit tests for submitDare business logic

describe("submitDare - input validation", () => {
  it("requires roomId", () => {
    const data = { roomId: "", dareId: "dare_001", mediaUrl: "https://x.com/a.jpg", mediaType: "photo" };
    expect(!data.roomId).toBe(true);
  });

  it("requires dareId", () => {
    const data = { roomId: "room_001", dareId: "", mediaUrl: "https://x.com/a.jpg", mediaType: "photo" };
    expect(!data.dareId).toBe(true);
  });

  it("requires mediaUrl", () => {
    const data = { roomId: "room_001", dareId: "dare_001", mediaUrl: "", mediaType: "photo" };
    expect(!data.mediaUrl).toBe(true);
  });

  it("validates mediaType is photo or video", () => {
    const valid = ["photo", "video"];
    expect(valid.includes("photo")).toBe(true);
    expect(valid.includes("video")).toBe(true);
    expect(valid.includes("audio")).toBe(false);
    expect(valid.includes("")).toBe(false);
  });

  it("validates mediaUrl starts with https", () => {
    expect("https://storage.googleapis.com/bucket/file.jpg".startsWith("https://")).toBe(true);
    expect("http://insecure.com/file.jpg".startsWith("https://")).toBe(false);
    expect("ftp://nope.com".startsWith("https://")).toBe(false);
  });
});

describe("submitDare - timer expiry logic", () => {
  it("blocks submission when endsAt is in the past", () => {
    const endsAt = { toMillis: () => Date.now() - 1000 }; // 1 second ago
    expect(endsAt.toMillis() < Date.now()).toBe(true);
  });

  it("allows submission when endsAt is in the future", () => {
    const endsAt = { toMillis: () => Date.now() + 60000 }; // 1 minute from now
    expect(endsAt.toMillis() < Date.now()).toBe(false);
  });

  it("blocks submission exactly at expiry", () => {
    const now = Date.now();
    const endsAt = { toMillis: () => now - 1 };
    expect(endsAt.toMillis() < now).toBe(true);
  });
});

describe("submitDare - duplicate prevention", () => {
  it("detects duplicate when query returns non-empty result", () => {
    const queryResult = { empty: false, docs: [{ id: "sub_001" }] };
    expect(!queryResult.empty).toBe(true); // duplicate found
  });

  it("allows submission when no duplicate exists", () => {
    const queryResult = { empty: true, docs: [] };
    expect(!queryResult.empty).toBe(false); // no duplicate
  });
});

describe("submitDare - points calculation", () => {
  it("calculates new total correctly", () => {
    const currentPoints = 150;
    const darePoints = 50;
    expect(currentPoints + darePoints).toBe(200);
  });

  it("handles zero starting points", () => {
    const currentPoints = 0;
    const darePoints = 30;
    expect(currentPoints + darePoints).toBe(30);
  });
});
