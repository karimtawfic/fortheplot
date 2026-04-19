import express, { Request, Response } from "express";
import * as admin from "firebase-admin";
import { processReelJob } from "./worker";

// Initialize Firebase Admin with Application Default Credentials (Cloud Run identity)
admin.initializeApp();

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || "8080", 10);

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "out-and-about-render-worker" });
});

// Main render endpoint — called by Cloud Function trigger
app.post("/render", async (req: Request, res: Response) => {
  const { jobId } = req.body as { jobId?: string };

  if (!jobId) {
    res.status(400).json({ error: "jobId is required" });
    return;
  }

  console.log(`[render] Received job: ${jobId}`);

  // Respond with 202 immediately so the calling Function doesn't time out
  // The actual processing happens asynchronously
  res.status(202).json({ accepted: true, jobId });

  // Process async (Cloud Run stays alive until the request handler completes
  // but we've already responded, so this runs after)
  processReelJob(jobId).catch((err: Error) => {
    console.error(`[render] Unhandled error for job ${jobId}:`, err.message);
  });
});

app.listen(PORT, () => {
  console.log(`Render worker listening on port ${PORT}`);
});

export default app;
