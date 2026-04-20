import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import type { SubmitDarePayload, SubmitDareResult, MediaType } from "../types";
import { createVerificationService } from "../verification/VerificationService";
import type { VerificationContext } from "../verification/types";

const db = admin.firestore();
const verificationService = createVerificationService();

export const submitDare = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be authenticated.");
  }

  const rawData = request.data as Record<string, unknown>;
  const data = rawData as unknown as SubmitDarePayload;
  const uid = request.auth.uid;

  const rawMediaType = String(rawData.mediaType ?? "");

  if (!data.submissionId || !data.roomId || !data.dareId || !data.mediaUrl || !data.thumbnailUrl || !rawMediaType) {
    throw new functions.https.HttpsError("invalid-argument", "submissionId, roomId, dareId, mediaType, mediaUrl, and thumbnailUrl are required.");
  }

  // Normalize mediaType: "photo" (legacy iOS) → "image"
  const mediaType: MediaType = rawMediaType === "photo" ? "image" : (rawMediaType as MediaType);

  if (mediaType !== "image" && mediaType !== "video") {
    throw new functions.https.HttpsError("invalid-argument", "mediaType must be image or video.");
  }

  const submittedAtMillis = Date.now();
  const roomRef = db.collection("rooms").doc(data.roomId);
  const playerRef = roomRef.collection("players").doc(uid);
  const dareRef = db.collection("dares").doc(data.dareId);
  const subRef = roomRef.collection("submissions").doc(data.submissionId);

  const result: SubmitDareResult = await db.runTransaction(async (tx) => {
    const [roomSnap, playerSnap, dareSnap, existingSubSnap] = await Promise.all([
      tx.get(roomRef),
      tx.get(playerRef),
      tx.get(dareRef),
      tx.get(subRef),
    ]);

    if (!roomSnap.exists) throw new functions.https.HttpsError("not-found", "Room not found.");
    if (!playerSnap.exists) throw new functions.https.HttpsError("permission-denied", "You are not in this room.");
    if (!dareSnap.exists) throw new functions.https.HttpsError("not-found", "Dare not found.");
    if (existingSubSnap.exists) throw new functions.https.HttpsError("already-exists", "Submission already exists.");

    const room = roomSnap.data()!;
    const dare = { ...dareSnap.data(), dareId: dareSnap.id } as import("../types").Dare;

    // Read existing submissions for rule checks
    const existingSnap = await db
      .collection(`rooms/${data.roomId}/submissions`)
      .where("playerId", "==", uid)
      .get();
    const existingSubmissions = existingSnap.docs.map((d) => d.data()) as import("../types").DareSubmission[];

    const ctx: VerificationContext = {
      room: room as import("../types").Room,
      player: playerSnap.data()! as import("../types").Player,
      dare: dare as import("../types").Dare,
      existingSubmissions,
      submittedAtMillis,
      mediaUrl: data.mediaUrl,
      thumbnailUrl: data.thumbnailUrl,
      mediaType,
      metadata: data.metadata,
    };

    const verification = await verificationService.verify(ctx);

    const isApproved = verification.status === "approved";
    const pointsAwarded = isApproved ? (dare.points as number) : 0;
    const currentPoints = (playerSnap.data()?.totalPoints ?? 0) as number;
    const newTotal = currentPoints + pointsAwarded;
    const now = admin.firestore.Timestamp.now();

    tx.set(subRef, {
      submissionId: data.submissionId,
      roomId: data.roomId,
      playerId: uid,
      dareId: data.dareId,
      dareTextSnapshot: dare.text,
      pointsAwarded,
      pointsPotential: dare.points,
      mediaType,
      mediaUrl: data.mediaUrl,
      thumbnailUrl: data.thumbnailUrl,
      createdAt: now,
      renderEligible: isApproved,
      verificationStatus: verification.status,
      verificationReason: verification.reason ?? null,
      verificationSource: verification.source,
      ...(verification.duplicateOfSubmissionId ? { duplicateOfSubmissionId: verification.duplicateOfSubmissionId } : {}),
      ...(isApproved ? { verifiedAt: now } : {}),
      ...(data.metadata ? { metadata: data.metadata } : {}),
    });

    if (isApproved) {
      tx.update(playerRef, {
        totalPoints: admin.firestore.FieldValue.increment(pointsAwarded),
        lastSeenAt: now,
      });
    }

    return {
      submissionId: data.submissionId,
      pointsAwarded,
      newTotal,
      verificationStatus: verification.status,
      verificationReason: verification.reason,
    };
  });

  return result;
});
