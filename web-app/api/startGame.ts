import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb, Timestamp } from "./_admin";
import { verifyAuth, ok, err } from "./_helpers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return err(res, 405, "Method not allowed");
  try {
    const uid = await verifyAuth(req);
    const { roomId } = req.body as { roomId: string };
    if (!roomId) return err(res, 400, "Missing roomId");

    const roomRef = adminDb.doc(`rooms/${roomId}`);
    const roomSnap = await roomRef.get();
    const room = roomSnap.data();

    if (!room) return err(res, 404, "Room not found");
    if (room.hostPlayerId !== uid) return err(res, 403, "Only the host can start the game");
    if (room.status !== "lobby") return err(res, 409, "Game already started");

    const now = Timestamp.now();
    const endsAt = Timestamp.fromMillis(now.toMillis() + room.timerMinutes * 60 * 1000);

    await roomRef.update({ status: "live", startedAt: now, endsAt });
    ok(res, { ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    err(res, msg === "Unauthorized" ? 401 : 500, msg);
  }
}
