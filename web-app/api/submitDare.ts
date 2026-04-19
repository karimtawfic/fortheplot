import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "crypto";
import { adminDb, Timestamp, FieldValue } from "./_admin";
import { verifyAuth, ok, err } from "./_helpers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return err(res, 405, "Method not allowed");
  try {
    const uid = await verifyAuth(req);
    const { roomId, dareId, mediaUrl, thumbnailUrl, mediaType } = req.body as {
      roomId: string;
      dareId: string;
      mediaUrl: string;
      thumbnailUrl: string;
      mediaType: "photo" | "video";
    };
    if (!roomId || !dareId || !mediaUrl || !thumbnailUrl || !mediaType)
      return err(res, 400, "Missing fields");

    const submissionId = randomUUID();

    const result = await adminDb.runTransaction(async (tx) => {
      const roomRef = adminDb.doc(`rooms/${roomId}`);
      const playerRef = adminDb.doc(`rooms/${roomId}/players/${uid}`);
      const dareRef = adminDb.doc(`dares/${dareId}`);

      const [roomSnap, playerSnap, dareSnap] = await Promise.all([
        tx.get(roomRef),
        tx.get(playerRef),
        tx.get(dareRef),
      ]);

      const room = roomSnap.data();
      if (!room) throw new Error("Room not found");
      if (room.status !== "live") throw new Error("Game is not live");
      if (room.endsAt && room.endsAt.toMillis() < Date.now()) throw new Error("Game has ended");
      if (!playerSnap.exists) throw new Error("Player not in room");

      const dare = dareSnap.data();
      if (!dare || !dare.active) throw new Error("Dare not found");

      // Duplicate check inside transaction
      const dupSnap = await tx.get(
        adminDb
          .collection(`rooms/${roomId}/submissions`)
          .where("playerId", "==", uid)
          .where("dareId", "==", dareId)
      );
      if (!dupSnap.empty) throw new Error("Already submitted this dare");

      const now = Timestamp.now();
      const subRef = adminDb.doc(`rooms/${roomId}/submissions/${submissionId}`);
      tx.set(subRef, {
        submissionId,
        roomId,
        playerId: uid,
        dareId,
        dareTextSnapshot: dare.text,
        pointsAwarded: dare.points,
        mediaType,
        mediaUrl,
        thumbnailUrl,
        createdAt: now,
        renderEligible: true,
      });
      tx.update(playerRef, { totalPoints: FieldValue.increment(dare.points) });

      return { submissionId, pointsAwarded: dare.points as number };
    });

    ok(res, result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status = msg === "Unauthorized" ? 401 :
      msg === "Already submitted this dare" ? 409 :
      msg === "Game is not live" || msg === "Game has ended" ? 422 : 500;
    err(res, status, msg);
  }
}
