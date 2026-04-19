import React, { useRef, useState } from "react";
import type { Dare } from "../types";
import { uploadMedia, compressImage, extractVideoThumbnail } from "../lib/storage";
import { submitDare } from "../repositories/submissionRepository";
import { Button } from "./Button";
import { PointsBadge } from "./PointsBadge";
import { currentUID } from "../lib/auth";

interface ProofUploadProps {
  dare: Dare;
  roomId: string;
  onSuccess: (pointsAwarded: number, status: string) => void;
  onCancel: () => void;
}

type Stage = "idle" | "uploading" | "submitting" | "done" | "error";

export function ProofUpload({ dare, roomId, onSuccess, onCancel }: ProofUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [pointsEarned, setPointsEarned] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!selectedFile) return;
    const uid = currentUID();

    // Generate submissionId client-side so it can be embedded in the Storage path
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
        metadata: {
          fileSizeBytes: selectedFile.size,
          mimeType: selectedFile.type,
        },
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

  if (stage === "done") {
    const isPending = verificationStatus === "needs_review" || verificationStatus === "pending";
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <span className="text-6xl">{isPending ? "🕐" : "🎉"}</span>
        <p className="text-white font-bold text-xl">
          {isPending ? "Submitted!" : "Dare completed!"}
        </p>
        {isPending ? (
          <p className="text-white/60 text-sm text-center px-4">
            {verificationStatus === "needs_review" ? "Awaiting host approval" : "Verifying…"}
          </p>
        ) : (
          <PointsBadge points={pointsEarned} size="lg" />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="bg-surface/60 rounded-xl p-4">
        <p className="text-white/60 text-xs uppercase tracking-wide mb-1">{dare.category}</p>
        <p className="text-white font-semibold">{dare.text}</p>
        <div className="mt-2">
          <PointsBadge points={dare.points} />
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {!selectedFile ? (
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.accept = "image/*";
                fileRef.current.capture = "environment";
                fileRef.current.click();
              }
            }}
          >
            📷 Photo
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.accept = "video/*";
                fileRef.current.capture = "environment";
                fileRef.current.click();
              }
            }}
          >
            🎥 Video
          </Button>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
          {selectedFile.type.startsWith("video/") ? (
            <video src={preview ?? ""} controls className="w-full h-full object-contain" />
          ) : (
            <img src={preview ?? ""} alt="preview" className="w-full h-full object-contain" />
          )}
          <button
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm"
            onClick={() => { setSelectedFile(null); setPreview(null); }}
          >
            ✕
          </button>
        </div>
      )}

      {stage === "uploading" && (
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}

      {stage === "error" && (
        <p className="text-red-400 text-sm text-center">{errorMsg}</p>
      )}

      <div className="flex gap-3 mt-2">
        <Button variant="ghost" onClick={onCancel} className="flex-1" disabled={stage === "uploading" || stage === "submitting"}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          loading={stage === "uploading" || stage === "submitting"}
          disabled={!selectedFile}
          onClick={handleSubmit}
        >
          {stage === "uploading" ? `Uploading ${Math.round(progress * 100)}%` : stage === "submitting" ? "Submitting…" : "Submit Dare"}
        </Button>
      </div>
    </div>
  );
}
