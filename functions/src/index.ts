import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK once
admin.initializeApp();

// ─── Room lifecycle ───────────────────────────────────────────────────────────
export { createRoom } from "./room/createRoom";
export { joinRoom } from "./room/joinRoom";
export { startGame } from "./room/startGame";
export { endGame } from "./room/endGame";

// ─── Gameplay ─────────────────────────────────────────────────────────────────
export { submitDare } from "./dares/submitDare";

// ─── Reels ───────────────────────────────────────────────────────────────────
export { triggerRenderWorker } from "./reels/triggerRenderWorker";

// ─── Triggers ─────────────────────────────────────────────────────────────────
export { onPlayerJoin } from "./triggers/onPlayerJoin";
export { scheduledGameEnd } from "./triggers/scheduledGameEnd";

// ─── Admin ────────────────────────────────────────────────────────────────────
export { validateAndSeedDares } from "./admin/seedDares";
