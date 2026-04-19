import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomBytes, randomUUID } from "crypto";
import { adminDb, Timestamp, FieldValue } from "./_admin";
import { verifyAuth, ok, err } from "./_helpers";

function inviteCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from(randomBytes(6))
    .map((b) => chars[b % chars.length])
    .join("");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return err(res, 405, "Method not allowed");
  try {
    const uid = await verifyAuth(req);
    const { displayName, avatarEmoji, timerMinutes } = req.body as {
      displayName: string;
      avatarEmoji: string;
      timerMinutes: number;
    };
    if (!displayName || !avatarEmoji || !timerMinutes) return err(res, 400, "Missing fields");

    const roomId = randomUUID();
    const playerId = uid;
    const code = inviteCode();
    const now = Timestamp.now();

    const batch = adminDb.batch();
    batch.set(adminDb.doc(`rooms/${roomId}`), {
      roomId,
      hostPlayerId: playerId,
      createdAt: now,
      status: "lobby",
      timerMinutes,
      currentPlayerCount: 1,
      dareDeckVersion: "v1",
      personalReelsReadyCount: 0,
      groupReelReady: false,
      inviteCode: code,
    });
    batch.set(adminDb.doc(`rooms/${roomId}/players/${playerId}`), {
      playerId,
      roomId,
      displayName,
      avatarEmoji,
      totalPoints: 0,
      joinedAt: now,
      isHost: true,
      lastSeenAt: now,
    });
    await batch.commit();

    ok(res, { roomId, playerId, inviteCode: code });
  } catch (e: unknown) {
    err(res, e instanceof Error && e.message === "Unauthorized" ? 401 : 500,
      e instanceof Error ? e.message : "Server error");
  }
}
