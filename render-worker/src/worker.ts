import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import ffmpeg from "fluent-ffmpeg";

const db = admin.firestore();
const storage = admin.storage();

interface ReelJob {
  jobId: string;
  roomId: string;
  playerId: string | null;
  type: "personal" | "group";
  status: string;
  outputUrl?: string;
  errorMessage?: string;
}

interface Submission {
  submissionId: string;
  playerId: string;
  dareTextSnapshot: string;
  pointsAwarded: number;
  mediaType: "photo" | "video";
  mediaUrl: string;
  thumbnailUrl: string;
  createdAt: admin.firestore.Timestamp;
}

interface Player {
  displayName: string;
  avatarEmoji: string;
  totalPoints: number;
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export async function processReelJob(jobId: string): Promise<void> {
  const jobRef = db.collection("reelJobs").doc(jobId);
  const jobSnap = await jobRef.get();

  if (!jobSnap.exists) {
    throw new Error(`Job ${jobId} not found`);
  }

  const job = jobSnap.data() as ReelJob;

  // Idempotency: skip if already complete or processing by another worker
  if (job.status === "complete" || job.status === "failed") {
    console.log(`[worker] Job ${jobId} already in terminal state: ${job.status}`);
    return;
  }

  const tmpDir = path.join("/tmp", jobId);

  try {
    fs.mkdirSync(tmpDir, { recursive: true });
    console.log(`[worker] Processing ${job.type} reel for job ${jobId}`);

    if (job.type === "personal" && job.playerId) {
      await renderPersonalReel(job, tmpDir, jobRef);
    } else if (job.type === "group") {
      await renderGroupReel(job, tmpDir, jobRef);
    } else {
      throw new Error(`Unknown job type: ${job.type}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[worker] Job ${jobId} failed:`, message);

    await jobRef.update({
      status: "failed",
      errorMessage: message,
      updatedAt: admin.firestore.Timestamp.now(),
    });
  } finally {
    // Cleanup temp files
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup
    }
  }
}

// ─── Personal Reel ────────────────────────────────────────────────────────────

async function renderPersonalReel(
  job: ReelJob,
  tmpDir: string,
  jobRef: admin.firestore.DocumentReference
): Promise<void> {
  const { roomId, playerId } = job;

  // Fetch player info
  const playerSnap = await db
    .collection("rooms").doc(roomId)
    .collection("players").doc(playerId!)
    .get();

  const player = playerSnap.data() as Player;
  const displayName = player?.displayName || "Player";
  const totalPoints = player?.totalPoints || 0;

  // Fetch submissions for this player
  const subsSnap = await db
    .collection("rooms").doc(roomId)
    .collection("submissions")
    .where("playerId", "==", playerId)
    .where("renderEligible", "==", true)
    .orderBy("createdAt", "asc")
    .get();

  const submissions = subsSnap.docs.map((d) => d.data() as Submission);

  if (submissions.length === 0) {
    // No media to render — create a simple title card reel
    const outputPath = await renderTitleOnlyReel(displayName, totalPoints, tmpDir);
    await uploadAndFinalize(job, outputPath, jobRef);
    return;
  }

  // 1. Generate title card
  const titleCardPath = path.join(tmpDir, "title.mp4");
  await generateTitleCard(displayName, totalPoints, titleCardPath);

  // 2. Download and prepare each submission clip
  const clips: string[] = [titleCardPath];

  for (let i = 0; i < submissions.length; i++) {
    const sub = submissions[i];
    const ext = sub.mediaType === "video" ? "mp4" : "jpg";
    const localPath = path.join(tmpDir, `clip_${i}.${ext}`);

    await downloadFromStorage(sub.mediaUrl, localPath);

    if (sub.mediaType === "photo") {
      // Convert photo to short video clip with dare text overlay
      const photoClipPath = path.join(tmpDir, `clip_${i}_vid.mp4`);
      await photoToClip(localPath, sub.dareTextSnapshot, sub.pointsAwarded, photoClipPath);
      clips.push(photoClipPath);
    } else {
      // Add text overlay to video
      const overlayPath = path.join(tmpDir, `clip_${i}_overlay.mp4`);
      await addTextOverlayToVideo(localPath, sub.dareTextSnapshot, sub.pointsAwarded, overlayPath);
      clips.push(overlayPath);
    }
  }

  // 3. Concatenate all clips
  const outputPath = path.join(tmpDir, "personal_reel.mp4");
  await concatenateClips(clips, outputPath);

  // 4. Upload and update Firestore
  await uploadAndFinalize(job, outputPath, jobRef);

  // 5. Update room personalReelsReadyCount
  await updateRoomReelCount(job.roomId, jobRef);
}

// ─── Group Reel ───────────────────────────────────────────────────────────────

async function renderGroupReel(
  job: ReelJob,
  tmpDir: string,
  jobRef: admin.firestore.DocumentReference
): Promise<void> {
  const { roomId } = job;

  // Fetch top players for winner slide
  const playersSnap = await db
    .collection("rooms").doc(roomId)
    .collection("players")
    .orderBy("totalPoints", "desc")
    .limit(3)
    .get();

  const topPlayers = playersSnap.docs.map((d) => d.data() as Player);
  const winnerName = topPlayers[0]?.displayName || "Unknown";

  // Fetch all eligible submissions across all players
  const subsSnap = await db
    .collection("rooms").doc(roomId)
    .collection("submissions")
    .where("renderEligible", "==", true)
    .orderBy("createdAt", "asc")
    .get();

  const submissions = subsSnap.docs.map((d) => d.data() as Submission);

  // 1. Generate group title card
  const titleCardPath = path.join(tmpDir, "group_title.mp4");
  await generateGroupTitleCard(winnerName, submissions.length, titleCardPath);

  const clips: string[] = [titleCardPath];

  // 2. Process up to 30 submissions for the group reel (keep it reasonable)
  const limited = submissions.slice(0, 30);

  for (let i = 0; i < limited.length; i++) {
    const sub = limited[i];
    const ext = sub.mediaType === "video" ? "mp4" : "jpg";
    const localPath = path.join(tmpDir, `group_clip_${i}.${ext}`);

    await downloadFromStorage(sub.mediaUrl, localPath);

    if (sub.mediaType === "photo") {
      const clipPath = path.join(tmpDir, `group_clip_${i}_vid.mp4`);
      await photoToClip(localPath, sub.dareTextSnapshot, sub.pointsAwarded, clipPath);
      clips.push(clipPath);
    } else {
      // Trim video to max 8 seconds for group reel
      const trimmedPath = path.join(tmpDir, `group_clip_${i}_trim.mp4`);
      await trimVideo(localPath, 8, trimmedPath);
      const overlayPath = path.join(tmpDir, `group_clip_${i}_overlay.mp4`);
      await addTextOverlayToVideo(trimmedPath, sub.dareTextSnapshot, sub.pointsAwarded, overlayPath);
      clips.push(overlayPath);
    }
  }

  // 3. Concatenate
  const outputPath = path.join(tmpDir, "group_reel.mp4");
  await concatenateClips(clips, outputPath);

  // 4. Upload
  await uploadAndFinalize(job, outputPath, jobRef);

  // 5. Mark group reel as ready on the room
  await db.collection("rooms").doc(roomId).update({
    groupReelReady: true,
  });
}

// ─── ffmpeg Helpers ───────────────────────────────────────────────────────────

function generateTitleCard(
  displayName: string,
  totalPoints: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const safeName = displayName.replace(/'/g, "\\'").substring(0, 30);
    ffmpeg()
      .input("color=c=#1A1A2E:size=1080x1920:rate=30")
      .inputOption("-f lavfi")
      .duration(3)
      .videoFilter([
        `drawtext=text='${safeName}':fontsize=90:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-80:font=Arial:fontcolor_expr=white`,
        `drawtext=text='${totalPoints} pts':fontsize=60:fontcolor=#FF6B35:x=(w-text_w)/2:y=(h-text_h)/2+60:font=Arial`,
        "drawtext=text='Out \\& About':fontsize=40:fontcolor=#AAAAAA:x=(w-text_w)/2:y=100:font=Arial",
      ])
      .outputOptions(["-c:v libx264", "-preset fast", "-crf 23", "-pix_fmt yuv420p"])
      .output(outputPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

function generateGroupTitleCard(
  winnerName: string,
  clipCount: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const safeName = winnerName.replace(/'/g, "\\'").substring(0, 30);
    ffmpeg()
      .input("color=c=#1A1A2E:size=1080x1920:rate=30")
      .inputOption("-f lavfi")
      .duration(4)
      .videoFilter([
        "drawtext=text='Out \\& About':fontsize=80:fontcolor=#FF6B35:x=(w-text_w)/2:y=200:font=Arial",
        "drawtext=text='Group Reel':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-60:font=Arial",
        `drawtext=text='${clipCount} dares completed':fontsize=40:fontcolor=#AAAAAA:x=(w-text_w)/2:y=(h-text_h)/2+60:font=Arial`,
        `drawtext=text='Winner\\: ${safeName}':fontsize=50:fontcolor=#FFD700:x=(w-text_w)/2:y=(h-text_h)/2+160:font=Arial`,
      ])
      .outputOptions(["-c:v libx264", "-preset fast", "-crf 23", "-pix_fmt yuv420p"])
      .output(outputPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

function photoToClip(
  photoPath: string,
  dareText: string,
  points: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const safeText = dareText.replace(/'/g, "\\'").substring(0, 60);
    ffmpeg()
      .input(photoPath)
      .inputOptions(["-loop 1"])
      .duration(4)
      .videoFilter([
        "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black",
        `drawtext=text='${safeText}':fontsize=44:fontcolor=white:x=40:y=h-200:font=Arial:shadowcolor=black:shadowx=2:shadowy=2:box=1:boxcolor=black@0.5:boxborderw=10`,
        `drawtext=text='+${points} pts':fontsize=56:fontcolor=#FF6B35:x=w-220:y=60:font=Arial:shadowcolor=black:shadowx=2:shadowy=2`,
      ])
      .outputOptions(["-c:v libx264", "-preset fast", "-crf 23", "-pix_fmt yuv420p", "-r 30"])
      .output(outputPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

function addTextOverlayToVideo(
  inputPath: string,
  dareText: string,
  points: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const safeText = dareText.replace(/'/g, "\\'").substring(0, 60);
    ffmpeg(inputPath)
      .videoFilter([
        "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black",
        `drawtext=text='${safeText}':fontsize=44:fontcolor=white:x=40:y=h-200:font=Arial:shadowcolor=black:shadowx=2:shadowy=2:box=1:boxcolor=black@0.5:boxborderw=10`,
        `drawtext=text='+${points} pts':fontsize=56:fontcolor=#FF6B35:x=w-220:y=60:font=Arial:shadowcolor=black:shadowx=2:shadowy=2`,
      ])
      .outputOptions(["-c:v libx264", "-preset fast", "-crf 23", "-pix_fmt yuv420p"])
      .output(outputPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

function trimVideo(inputPath: string, maxSeconds: number, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .duration(maxSeconds)
      .outputOptions(["-c:v libx264", "-preset fast", "-crf 23"])
      .output(outputPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

function concatenateClips(clips: string[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (clips.length === 0) {
      reject(new Error("No clips to concatenate"));
      return;
    }

    if (clips.length === 1) {
      fs.copyFileSync(clips[0], outputPath);
      resolve();
      return;
    }

    const concatFile = path.join(path.dirname(outputPath), "concat.txt");
    const lines = clips.map((c) => `file '${c}'`).join("\n");
    fs.writeFileSync(concatFile, lines);

    ffmpeg()
      .input(concatFile)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions([
        "-c:v libx264",
        "-preset fast",
        "-crf 23",
        "-pix_fmt yuv420p",
        "-movflags +faststart",
      ])
      .output(outputPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

async function renderTitleOnlyReel(
  displayName: string,
  totalPoints: number,
  tmpDir: string
): Promise<string> {
  const outputPath = path.join(tmpDir, "reel.mp4");
  await generateTitleCard(displayName, totalPoints, outputPath);
  return outputPath;
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

function downloadFromStorage(mediaUrl: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Support both Firebase Storage download URLs and gs:// paths
    if (mediaUrl.startsWith("gs://")) {
      const withoutGS = mediaUrl.slice(5);
      const slashIdx = withoutGS.indexOf("/");
      const bucketName = withoutGS.slice(0, slashIdx);
      const filePath = withoutGS.slice(slashIdx + 1);
      storage.bucket(bucketName).file(filePath).download({ destination: destPath })
        .then(() => resolve())
        .catch(reject);
    } else {
      // HTTPS download URL
      const file = fs.createWriteStream(destPath);
      const protocol = mediaUrl.startsWith("https") ? https : http;
      protocol.get(mediaUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ${mediaUrl}: HTTP ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on("finish", () => file.close(() => resolve()));
        file.on("error", reject);
      }).on("error", reject);
    }
  });
}

async function uploadAndFinalize(
  job: ReelJob,
  localPath: string,
  jobRef: admin.firestore.DocumentReference
): Promise<void> {
  const bucket = storage.bucket();
  const destPath = job.type === "personal"
    ? `reels/${job.roomId}/${job.playerId}_personal.mp4`
    : `reels/${job.roomId}/group.mp4`;

  await bucket.upload(localPath, {
    destination: destPath,
    metadata: { contentType: "video/mp4" },
  });

  // Get a signed URL valid for 7 days (or use public access if bucket is public)
  const [file] = await bucket.file(destPath).getSignedUrl({
    action: "read",
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const now = admin.firestore.Timestamp.now();
  await jobRef.update({
    status: "complete",
    outputUrl: file,
    updatedAt: now,
  });

  console.log(`[worker] Job ${job.jobId} complete. Output: ${destPath}`);
}

async function updateRoomReelCount(
  roomId: string,
  jobRef: admin.firestore.DocumentReference
): Promise<void> {
  const roomRef = db.collection("rooms").doc(roomId);

  // Check how many personal jobs are complete vs total players
  const [completeSnap, totalSnap] = await Promise.all([
    db.collection("reelJobs")
      .where("roomId", "==", roomId)
      .where("type", "==", "personal")
      .where("status", "==", "complete")
      .get(),
    db.collection("rooms").doc(roomId).collection("players").get(),
  ]);

  const completeCount = completeSnap.size;
  const totalPlayers = totalSnap.size;

  await roomRef.update({
    personalReelsReadyCount: completeCount,
  });

  // If all personal reels are done, the group reel trigger will fire separately
  console.log(`[worker] Personal reels: ${completeCount}/${totalPlayers} complete`);

  void jobRef; // suppress unused warning
}
