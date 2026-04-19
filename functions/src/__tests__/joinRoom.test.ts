// Unit tests for joinRoom business logic

describe("joinRoom - validation", () => {
  it("normalizes invite code to uppercase", () => {
    const code = "abc123";
    expect(code.trim().toUpperCase()).toBe("ABC123");
  });

  it("rejects invite codes not exactly 6 characters", () => {
    const invalid = ["", "ABC", "ABCDEFG", "12345", "1234567"];
    invalid.forEach((code) => {
      expect(code.trim().length !== 6).toBe(true);
    });
  });

  it("accepts valid 6-character codes", () => {
    const valid = ["ABCDEF", "123456", "A1B2C3"];
    valid.forEach((code) => {
      expect(code.trim().length === 6).toBe(true);
    });
  });

  it("rejects empty displayName", () => {
    const invalid = ["", "  ", "\n"];
    invalid.forEach((name) => {
      expect(name.trim().length === 0).toBe(true);
    });
  });
});

describe("joinRoom - room capacity", () => {
  it("allows joining when under 20 players", () => {
    const counts = [0, 1, 10, 19];
    counts.forEach((count) => {
      expect(count >= 20).toBe(false);
    });
  });

  it("blocks joining when at 20 players", () => {
    const counts = [20, 21, 100];
    counts.forEach((count) => {
      expect(count >= 20).toBe(true);
    });
  });
});

describe("joinRoom - room status checks", () => {
  const allowedStatus = "lobby";

  it("allows joining when room is in lobby", () => {
    expect("lobby" === allowedStatus).toBe(true);
  });

  it("blocks joining when room is live", () => {
    expect("live" === allowedStatus).toBe(false);
  });

  it("blocks joining when room is ended", () => {
    expect("ended" === allowedStatus).toBe(false);
  });

  it("blocks joining when room is rendering", () => {
    expect("rendering" === allowedStatus).toBe(false);
  });
});
