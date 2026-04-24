import React, { useRef, useState } from "react";
import type { Dare, DareCategory } from "../types";
import { CATEGORY_COLORS, CATEGORY_EMOJIS } from "../types";
import { uploadMedia, compressImage, extractVideoThumbnail } from "../lib/storage";
import { submitDare } from "../repositories/submissionRepository";
import { PointsBadge } from "./PointsBadge";
import { currentUID } from "../lib/auth";

interface ProofUploadProps {
  dare: Dare;
  roomId: string;
  onSuccess: (pointsAwarded: number, status: string) => void;
  onCancel: () => void;
}

type Stage = "idle" | "uploading" | "submitting" | "done" | "error";

const CATEGORY_TIPS: Record<DareCategory, string> = {
  social: "Commit fully — the first 5 seconds are the hardest. After that, you're unstoppable.",
  physical: "Pace yourself and show the full movement clearly in frame. Energy wins points.",
  creative: "Make it unexpected. The most memorable submissions always have a twist.",
  food: "Show the food AND your reaction. The combo is what makes it real.",
  outdoor: "Frame the environment — let the surroundings tell the story.",
};

export function ProofUpload({ dare, roomId, onSuccess, onCancel }: ProofUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [pointsEarned, setPointsEarned] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState("");

  const catColor = CATEGORY_COLORS[dare.category];
  const catEmoji = CATEGORY_EMOJIS[dare.category];
  const tip = CATEGORY_TIPS[dare.category];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function triggerPicker(accept: string, capture?: boolean) {
    if (!fileRef.current) return;
    fileRef.current.accept = accept;
    if (capture) {
      fileRef.current.setAttribute("capture", "environment");
    } else {
      fileRef.current.removeAttribute("capture");
    }
    fileRef.current.click();
  }

  async function handleSubmit() {
    if (!selectedFile) return;
    const uid = currentUID();
    const submissionId = crypto.randomUUID();
    const basePath = `rooms/${roomId}/players/${uid}/submissions/${submissionId}`;

    setStage("uploading");
    setErrorMsg("");

    try {
      const isVideo = selectedFile.type.startsWith("video/");
      const ext = isVideo ? "mp4" : "jpg";

      let blob: Blob;
      let thumbBlob: Blob;

      if (isVideo) {
        blob = selectedFile;
        thumbBlob = await extractVideoThumbnail(selectedFile);
      } else {
        blob = await compressImage(selectedFile);
        thumbBlob = blob;
      }

      const [mediaResult, thumbResult] = await Promise.all([
        uploadMedia(`${basePath}/original.${ext}`, blob, selectedFile.type, setProgress),
        uploadMedia(`${basePath}/thumb.jpg`, thumbBlob, "image/jpeg"),
      ]);

      setStage("submitting");
      const result = await submitDare({
        submissionId,
        roomId,
        dareId: dare.dareId,
        mediaUrl: mediaResult.url,
        thumbnailUrl: thumbResult.url,
        mediaType: isVideo ? "video" : "image",
        metadata: { fileSizeBytes: selectedFile.size, mimeType: selectedFile.type },
      });

      setPointsEarned(result.pointsAwarded);
      setVerificationStatus(result.verificationStatus);
      setStage("done");
      setTimeout(() => onSuccess(result.pointsAwarded, result.verificationStatus), 1400);
    } catch (err: unknown) {
      setStage("error");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (stage === "done") {
    const isPending = verificationStatus === "needs_review" || verificationStatus === "pending";
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 px-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-4xl"
          style={{ background: isPending ? "rgba(206,147,216,0.15)" : "rgba(76,175,80,0.15)" }}
        >
          {isPending ? "🕐" : "✓"}
        </div>
        <div className="text-center">
          <p className="text-white font-black text-xl mb-1">
            {isPending ? "Submitted!" : "Dare Complete!"}
          </p>
          {isPending ? (
            <p className="text-white/50 text-sm">
              {verificationStatus === "needs_review" ? "Awaiting host approval" : "Verifying…"}
            </p>
          ) : (
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-gold font-black text-2xl">+{pointsEarned}</span>
              <span className="text-gold/60 font-black text-sm">pts</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Header ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3 px-4 pb-6 pt-2">
      {/* Cancel / Prove It header */}
      <div className="flex items-center">
        <button
          onClick={onCancel}
          className="font-semibold"
          style={{ fontSize: 15, color: "#AAAACC", width: 56, textAlign: "left" }}
          disabled={stage === "uploading" || stage === "submitting"}
        >
          Cancel
        </button>
        <p className="flex-1 text-white font-bold text-center" style={{ fontSize: 15, whiteSpace: "nowrap" }}>
          Prove It
        </p>
        <div style={{ width: 56 }} />
      </div>

      {/* Dare info card */}
      <div
        className="rounded-2xl p-3 flex items-center gap-3"
        style={{
          background: `linear-gradient(160deg, ${catColor}30, #1A1A2E)`,
          border: `1px solid ${catColor}44`,
        }}
      >
        <div className="flex-1 min-w-0">
          <span
            className="inline-flex items-center gap-1 rounded-full font-bold mb-1.5"
            style={{
              fontSize: 11,
              padding: "3px 8px",
              background: `${catColor}22`,
              border: `1px solid ${catColor}55`,
              color: catColor,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {catEmoji} {dare.category}
          </span>
          <p className="text-white font-black leading-snug" style={{ fontSize: 15, letterSpacing: -0.2 }}>
            {dare.text}
          </p>
          {dare.verificationMode === "admin_review" && (
            <p className="text-white/40 text-xs mt-1 flex items-center gap-1">
              <span>🕐</span> Host verifies
            </p>
          )}
        </div>
        <PointsBadge points={dare.points} size="md" />
      </div>

      {/* Media area */}
      {stage === "uploading" || stage === "submitting" ? (
        <div className="rounded-2xl p-4 bg-surface border border-border">
          <div className="flex justify-between mb-2">
            <span className="text-white/50 text-sm font-semibold">
              {stage === "uploading" ? "Uploading…" : "Submitting…"}
            </span>
            <span className="text-primary font-bold text-sm">{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress * 100}%`, background: "linear-gradient(90deg, #FF6B35, #E94560)" }}
            />
          </div>
        </div>
      ) : preview ? (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
          {selectedFile?.type.startsWith("video/") ? (
            <video src={preview} controls className="w-full h-full object-contain" />
          ) : (
            <img src={preview} alt="proof" className="w-full h-full object-contain" />
          )}
          <button
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center text-sm"
            onClick={() => { setSelectedFile(null); setPreview(null); }}
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          {/* Pro tip */}
          <div
            className="rounded-2xl p-3 flex gap-3 items-start"
            style={{
              background: "linear-gradient(135deg, rgba(255,215,0,0.10), rgba(255,107,53,0.06))",
              border: "1px solid rgba(255,215,0,0.3)",
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
              style={{ background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.4)" }}
            >
              💡
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="font-black uppercase mb-1"
                style={{ fontSize: 9, letterSpacing: "0.08em", color: "#FFD700" }}
              >
                Pro tip
              </p>
              <p className="text-white leading-snug" style={{ fontSize: 12, fontWeight: 500 }}>
                {tip}
              </p>
            </div>
          </div>

          {/* How to win points */}
          <div
            className="rounded-xl p-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #2A2A4A" }}
          >
            <p
              className="font-black uppercase mb-2 text-white/40"
              style={{ fontSize: 9, letterSpacing: "0.08em" }}
            >
              How to win points
            </p>
            <div className="flex flex-col gap-2">
              {[
                ["1.", "Show yourself clearly in frame"],
                ["2.", "Capture the exact moment"],
                ["3.", "No staging — keep it real"],
              ].map(([n, t]) => (
                <div key={n} className="flex gap-2 items-start" style={{ lineHeight: 1.4 }}>
                  <span className="font-black flex-shrink-0" style={{ fontSize: 10, color: "#FF6B35", minWidth: 14 }}>{n}</span>
                  <span className="text-white/50" style={{ fontSize: 11 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dropzone */}
          <div
            className="rounded-2xl flex items-center justify-center gap-3 py-4 px-5"
            style={{
              minHeight: 80,
              background: "#1A1A2E",
              border: "1.5px dashed #2A2A4A",
            }}
          >
            <span style={{ fontSize: 28, lineHeight: 1 }}>📸</span>
            <div className="flex flex-col gap-0.5">
              <p className="text-white/50 font-bold" style={{ fontSize: 13 }}>Add your proof</p>
              <p style={{ fontSize: 10, color: "#2A2A4A" }}>Photo or video required</p>
            </div>
          </div>
        </>
      )}

      {/* Error */}
      {stage === "error" && (
        <p className="text-red-400 text-sm text-center">{errorMsg}</p>
      )}

      {/* Action buttons */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {preview ? (
        <button
          onClick={handleSubmit}
          disabled={stage === "uploading" || stage === "submitting"}
          className="w-full rounded-2xl font-black text-white flex items-center justify-center"
          style={{
            height: 52,
            fontSize: 16,
            background: "linear-gradient(135deg, #FF6B35, #E94560)",
            boxShadow: "0 8px 24px rgba(255,107,53,0.35)",
            opacity: stage === "uploading" || stage === "submitting" ? 0.6 : 1,
          }}
        >
          ✓ Submit Proof
        </button>
      ) : (
        <div className="flex gap-2">
          {[
            { label: "📷 Camera", accept: "image/*", capture: true },
            { label: "🖼 Photo", accept: "image/*", capture: false },
            { label: "🎥 Video", accept: "video/*", capture: true },
          ].map(({ label, accept, capture }) => (
            <button
              key={label}
              onClick={() => triggerPicker(accept, capture)}
              className="flex-1 rounded-xl font-bold border transition-all active:scale-95"
              style={{
                height: 46,
                fontSize: 13,
                background: "#1A1A2E",
                border: "1.5px solid #2A2A4A",
                color: "#fff",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
