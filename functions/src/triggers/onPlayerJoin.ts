import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Reconciliation trigger: keeps currentPlayerCount accurate on the room
 * document whenever a player document is created in the players subcollection.
 */
export const onPlayerJoin = functions.firestore
  .document("rooms/{roomId}/players/{playerId}")
  .onCreate(async (snap, context) => {
    const { roomId } = context.params;
    const roomRef = db.collection("rooms").doc(roomId);

    await roomRef.update({
      currentPlayerCount: admin.firestore.FieldValue.increment(1),
    }).catch((err) => {
      functions.logger.error(
        `Failed to increment player count for room ${roomId}:`,
        err
      );
    });
  });
