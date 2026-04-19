import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { endGameInternal } from "../room/endGame";

const db = admin.firestore();

/**
 * Safety net: runs every minute to catch rooms where endsAt has passed
 * but the status hasn't been updated (e.g. trigger missed under high load).
 */
export const scheduledGameEnd = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();

    const expiredRooms = await db.collection("rooms")
      .where("status", "==", "live")
      .where("endsAt", "<=", now)
      .limit(50) // process in batches
      .get();

    if (expiredRooms.empty) {
      return;
    }

    functions.logger.info(`Found ${expiredRooms.size} expired rooms to end.`);

    const promises = expiredRooms.docs.map((doc) =>
      endGameInternal(doc.id).catch((err) => {
        functions.logger.error(`Failed to end game for room ${doc.id}:`, err);
      })
    );

    await Promise.allSettled(promises);
  });
