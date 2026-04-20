import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb, Timestamp, FieldValue } from "./_admin";
import { verifyAuth, ok, err } from "./_helpers";
import { runRuleEngine, type SubmissionMetadata, type MediaType } from "./_verification";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return err(res, 405, "Method not allowed");
  try {
    const uid = await verifyAuth(req);
    const { submissionId, roomId, dareId, mediaUrl, thumbnailUrl, mediaType: rawMediaType, metadata } = req.body as {
      submissionId: string;
      roomId: string;
      dareId: string;
      mediaUrl: string;
      thumbnailUrl: string;
      mediaType: string;
      metadata?: SubmissionMetadata;
    };

    if (!submissionId || !roomId || !dareId || !mediaUrl || !thumbnailUrl || !rawMediaType) {
      return err(res, 400, "Missing fields");
    }

    // Normalize mediaType: "photo" (legacy iOS) → "image"
    const mediaType: MediaType = rawMediaType === "photo" ? "image" : (rawMediaType as MediaType);

    if (mediaType !== "image" && mediaType !== "video") {
      return err(res, 400, "mediaType must be image or video");
    }

    const submittedAtMillis = Date.now();

    const result = await adminDb.runTransaction(async (tx) => {
      const roomRef = adminDb.doc(`rooms/${roomId}`);
      const playerRef = adminDb.doc(`rooms/${roomId}/players/${uid}`);
      const dareRef = adminDb.doc(`dares/${dareId}`);

      const [roomSnap, playerSnap, dareSnap] = await Promise.all([
        tx.get(roomRef),
        tx.get(playerRef),
        tx.get(dareRef),
      ]);

      if (!roomSnap.exists) throw Object.assign(new Error("Room not found"), { status: 404 });
      if (!playerSnap.exists) throw Object.assign(new Error("Not in room"), { status: 403 });
      if (!dareSnap.exists) throw Object.assign(new Error("Dare not found"), { status: 404 });

      const room = roomSnap.data()!;
      const dare = dareSnap.data()!;
      dare.dareId = dareSnap.id;

      // Prevent replaying same submissionId
      const subRef = adminDb.doc(`rooms/${roomId}/submissions/${submissionId}`);
      const existingSubSnap = await tx.get(subRef);
      if (existingSubSnap.exists) throw Object.assign(new Error("Submission already exists"), { status: 409 });

      // Read existing submissions for rule checks (outside tx read — ok for verification, atomicity ensured by subRef check above)
      const existingSnap = await adminDb
        .collection(`rooms/${roomId}/submissions`)
        .where("playerId", "==", uid)
        .get();
      const existingSubmissions = existingSnap.docs.map((d) => d.data());

      const verification = runRuleEngine({
        room,
        player: playerSnap.data()!,
        dare,
        existingSubmissions,
        playerId: uid,
        submittedAtMillis,
        mediaUrl,
        thumbnailUrl,
        mediaType,
        metadata,
      });

      const isApproved = verification.status === "approved";
      const pointsAwarded = isApproved ? (dare.points as number) : 0;
      const currentPoints = (playerSnap.data()?.totalPoints ?? 0) as number;
      const newTotal = currentPoints + pointsAwarded;
      const now = Timestamp.now();

      tx.set(subRef, {
        submissionId,
        roomId,
        playerId: uid,
        dareId,
        dareTextSnapshot: dare.text,
        pointsAwarded,
        pointsPotential: dare.points,
        mediaType,
        mediaUrl,
        thumbnailUrl,
        createdAt: now,
        renderEligible: isApproved,
        verificationStatus: verification.status,
        verificationReason: verification.reason ?? null,
        verificationSource: verification.source,
        ...(verification.duplicateOfSubmissionId ? { duplicateOfSubmissionId: verification.duplicateOfSubmissionId } : {}),
        ...(isApproved ? { verifiedAt: now } : {}),
        ...(metadata ? { metadata } : {}),
      });

      if (isApproved) {
        tx.update(playerRef, { totalPoints: FieldValue.increment(pointsAwarded) });
      }

      return {
        submissionId,
        pointsAwarded,
        newTotal,
        verificationStatus: verification.status,
        verificationReason: verification.reason,
      };
    });

    ok(res, result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status = (e as { status?: number }).status ?? (
      msg === "Unauthorized" ? 401 :
      msg === "Dare already completed" ? 409 :
      msg === "Game is not active" || msg === "Game timer has expired" ? 422 : 500
    );
    err(res, status, msg);
  }
}
