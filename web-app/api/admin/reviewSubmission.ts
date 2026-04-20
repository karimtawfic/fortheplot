import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb, Timestamp, FieldValue } from "../_admin";
import { verifyAuth, ok, err } from "../_helpers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return err(res, 405, "Method not allowed");
  try {
    const uid = await verifyAuth(req);
    const { roomId, submissionId, action, reason } = req.body as {
      roomId: string;
      submissionId: string;
      action: "approve" | "reject";
      reason?: string;
    };

    if (!roomId || !submissionId || !action) return err(res, 400, "Missing fields");
    if (action !== "approve" && action !== "reject") return err(res, 400, "action must be approve or reject");

    const result = await adminDb.runTransaction(async (tx) => {
      const roomRef = adminDb.doc(`rooms/${roomId}`);
      const subRef = adminDb.doc(`rooms/${roomId}/submissions/${submissionId}`);

      const [roomSnap, subSnap] = await Promise.all([tx.get(roomRef), tx.get(subRef)]);

      if (!roomSnap.exists) throw Object.assign(new Error("Room not found"), { status: 404 });
      if (roomSnap.data()!.hostPlayerId !== uid) throw Object.assign(new Error("Host only"), { status: 403 });
      if (!subSnap.exists) throw Object.assign(new Error("Submission not found"), { status: 404 });

      const sub = subSnap.data()!;
      if (sub.verificationStatus !== "needs_review") {
        throw Object.assign(new Error("Submission is not pending review"), { status: 409 });
      }

      const now = Timestamp.now();

      if (action === "approve") {
        const pointsPotential = (sub.pointsPotential ?? sub.pointsAwarded ?? 0) as number;
        const playerRef = adminDb.doc(`rooms/${roomId}/players/${sub.playerId}`);

        tx.update(subRef, {
          verificationStatus: "approved",
          pointsAwarded: pointsPotential,
          renderEligible: true,
          verifiedAt: now,
          verificationSource: "admin",
          verificationReason: null,
        });
        tx.update(playerRef, {
          totalPoints: FieldValue.increment(pointsPotential),
        });

        return { submissionId, action: "approved", pointsAwarded: pointsPotential };
      } else {
        tx.update(subRef, {
          verificationStatus: "rejected",
          pointsAwarded: 0,
          renderEligible: false,
          verifiedAt: now,
          verificationSource: "admin",
          verificationReason: reason ?? "Rejected by host",
        });

        return { submissionId, action: "rejected", pointsAwarded: 0 };
      }
    });

    ok(res, result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status = (e as { status?: number }).status ?? (msg === "Unauthorized" ? 401 : 500);
    err(res, status, msg);
  }
}
