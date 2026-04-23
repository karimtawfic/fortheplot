import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "../_admin";
import { verifyAuth, ok, err } from "../_helpers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return err(res, 405, "Method not allowed");
  try {
    const uid = await verifyAuth(req);
    const { roomId } = req.query as { roomId: string };
    if (!roomId) return err(res, 400, "roomId required");

    const roomSnap = await adminDb.doc(`rooms/${roomId}`).get();
    if (!roomSnap.exists) return err(res, 404, "Room not found");
    if (roomSnap.data()!.hostPlayerId !== uid) return err(res, 403, "Host only");

    const snap = await adminDb
      .collection(`rooms/${roomId}/submissions`)
      .where("verificationStatus", "==", "needs_review")
      .orderBy("createdAt", "asc")
      .get();

    const submissions = snap.docs.map((d) => ({
      ...d.data(),
      createdAt: d.data().createdAt?.toMillis?.() ?? null,
      verifiedAt: d.data().verifiedAt?.toMillis?.() ?? null,
    }));

    ok(res, { submissions });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    err(res, msg === "Unauthorized" ? 401 : 500, msg);
  }
}
