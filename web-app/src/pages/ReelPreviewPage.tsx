import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";

export function ReelPreviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const url = searchParams.get("url") ?? "";

  async function handleSave() {
    const a = document.createElement("a");
    a.href = url;
    a.download = "reel.mp4";
    a.target = "_blank";
    a.click();
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Check out my reel!", url });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex items-center gap-3 px-4 py-4 absolute top-0 left-0 right-0 z-10">
        <button onClick={() => navigate(-1)} className="text-white/60 text-2xl bg-black/40 rounded-full w-10 h-10 flex items-center justify-center">←</button>
        <h1 className="text-white font-bold">Reel Preview</h1>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {url ? (
          <video
            src={url}
            controls
            autoPlay
            playsInline
            loop
            className="w-full max-h-screen object-contain"
          />
        ) : (
          <p className="text-white/40">No reel URL provided</p>
        )}
      </div>

      <div className="flex gap-3 p-4 bg-black/80">
        <Button variant="secondary" className="flex-1" onClick={handleSave}>
          💾 Save
        </Button>
        <Button className="flex-1" onClick={handleShare}>
          📤 Share
        </Button>
      </div>
    </div>
  );
}
