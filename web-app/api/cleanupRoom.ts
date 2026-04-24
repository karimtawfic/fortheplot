import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "./_admin";
import { verifyAuth, ok, err } from "./_helpers";

async function deleteCollection(path: string): Promise<void> {
  const snap = await adminDb.collection(path).get();
  if (snap.empty) return;
  const batch = adminDb.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return err(res, 405, "Method not allowed");
  try {
    const uid = await verifyAuth(req);
    const { roomId } = req.body as { roomId: string };
    if (!roomId) return err(res, 400, "Missing roomId");

    const roomRef = adminDb.doc(`rooms/${roomId}`);
    const snap = await roomRef.get();
    if (!snap.exists) return ok(res, { cleaned: true });

    const room = snap.data()!;
    if (room.hostPlayerId !== uid) return err(res, 403, "Only host can clean up");
    if (room.status !== "ended") return err(res, 400, "Room has not ended");

    await Promise.all([
      deleteCollection(`rooms/${roomId}/players`),
      deleteCollection(`rooms/${roomId}/submissions`),
      deleteCollection(`rooms/${roomId}/reelJobs`),
    ]);
    await roomRef.delete();

    return ok(res, { cleaned: true });
  } catch (e: unknown) {
    return err(
      res,
      e instanceof Error && e.message === "Unauthorized" ? 401 : 500,
      e instanceof Error ? e.message : "Server error"
    );
  }
}
