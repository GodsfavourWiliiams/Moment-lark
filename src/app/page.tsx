"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  ["01", "Select a video", "Choose a recording from your device and preview it here."],
  ["02", "Find the moments", "On-device AI will suggest clips with clear reasons."],
  ["03", "Refine and export", "Review the suggestions, adjust your picks, and download MP4s."],
];

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

function formatDuration(seconds: number) {
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remaining = String(total % 60).padStart(2, "0");
  return hours
    ? hours + ":" + String(minutes).padStart(2, "0") + ":" + remaining
    : minutes + ":" + remaining;
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [details, setDetails] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    };
  }, []);

  function selectFile(candidate?: File) {
    if (!candidate) return;
    if (!candidate.type.startsWith("video/")) {
      setError("Choose a video file to continue.");
      return;
    }
    setError(null);
    setDetails(null);
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    const url = URL.createObjectURL(candidate);
    videoUrlRef.current = url;
    setVideoUrl(url);
    setFile(candidate);
  }

  return (
    <div className="site-background min-h-screen p-3 text-[#f4f5f0] sm:p-5">
      <div className="mx-auto min-h-[calc(100vh-1.5rem)] max-w-[1500px] overflow-hidden rounded-[22px] border border-white/10 bg-[#111312] shadow-[0_28px_80px_rgba(0,0,0,.45)] sm:min-h-[calc(100vh-2.5rem)]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#161816] px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#c8ff00] text-lg font-black text-[#111607]" aria-hidden="true">M</div>
            <div>
              <p className="font-bold tracking-tight">MomentLark</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a6ada3]">Local creator studio</p>
            </div>
          </div>
          <nav aria-label="Workflow" className="order-3 flex w-full gap-1 overflow-x-auto rounded-xl border border-white/10 bg-[#0c0e0d] p-1 text-sm font-medium lg:order-2 lg:w-auto">
            <span aria-current="page" className="rounded-lg bg-[#c8ff00] px-4 py-2 text-[#151a07]">Import</span>
            {["Suggestions", "Editor", "Clips", "Export"].map((item) => (
              <span key={item} className="whitespace-nowrap rounded-lg px-4 py-2 text-[#929b90]">{item}</span>
            ))}
          </nav>
          <span className="order-2 inline-flex items-center gap-2 rounded-full border border-[#236c52] bg-[#123127] px-3 py-2 text-xs font-semibold text-[#80e1b8] lg:order-3">
            <span className="size-1.5 rounded-full bg-[#7debaf]" aria-hidden="true" />
            Video stays on your device
          </span>
        </header>

        <main className="px-5 pb-12 pt-12 lg:px-10 lg:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#668223]/35 bg-[#c8ff00]/8 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#d6ff5a]">
              <span className="size-1.5 rounded-full bg-[#c8ff00]" aria-hidden="true" />
              Your footage, your moments
            </p>
            <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.07] tracking-[-0.045em] sm:text-5xl lg:text-6xl">Find the moments<br />worth sharing.</h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-7 text-[#adb3a8] sm:text-base">
              Start with a video from your device. Preview your footage here, then turn the best moments into clips you can share.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-[1.08fr_.92fr]">
            <section
              aria-labelledby="import-heading"
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
              onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0]); }}
              className={"flex min-h-[380px] flex-col items-center justify-center rounded-[18px] border-2 border-dashed px-6 py-10 text-center transition-colors " + (dragging ? "border-[#c8ff00] bg-[#c8ff00]/10" : "border-white/12 bg-[#1d201e]")}
            >
              <div className="flex size-16 items-center justify-center rounded-2xl border border-[#c8ff00]/30 bg-[#c8ff00]/10 text-[#c8ff00] shadow-[0_0_30px_rgba(200,255,0,.12)]" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M13 2v7h7" /><path d="M12 12v6m-3-3h6" /></svg>
              </div>
              <h2 id="import-heading" className="mt-6 text-xl font-semibold tracking-tight">Drop a video here</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#a4aa9f]">Or choose a file to start previewing your footage.</p>
              <input ref={inputRef} type="file" accept="video/*" className="sr-only" aria-label="Choose a video file" onChange={(event) => selectFile(event.currentTarget.files?.[0])} />
              <button type="button" onClick={() => inputRef.current?.click()} className="mt-7 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#c8ff00] px-7 text-sm font-bold text-[#151a07] shadow-[0_0_24px_rgba(200,255,0,.22)] transition hover:bg-[#d9ff4d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c8ff00]">Choose video file</button>
              <p className="mt-5 text-xs text-[#8d9689]">Supported playback depends on your browser and the video codec.</p>
              {error && <p role="alert" className="mt-4 rounded-lg bg-red-950/60 px-4 py-2 text-sm text-red-200">{error}</p>}
            </section>

            <section aria-labelledby="preview-heading" className="flex min-h-[380px] flex-col rounded-[18px] border border-white/10 bg-[#1d201e] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c8ff00]">Source preview</p>
                  <h2 id="preview-heading" className="mt-1 truncate text-base font-semibold">{file ? file.name : "Your video will appear here"}</h2>
                </div>
                {file && <button type="button" onClick={() => inputRef.current?.click()} className="shrink-0 rounded-lg border border-white/12 px-3 py-2 text-xs font-semibold text-[#d5dad0] hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-[#c8ff00]">Change video</button>}
              </div>
              <div className="mt-4 flex min-h-[235px] flex-1 items-center justify-center overflow-hidden rounded-xl bg-[#0b0d0c]">
                {videoUrl ? (
                  <video key={videoUrl} src={videoUrl} controls preload="metadata" className="max-h-[360px] w-full object-contain"
                    onLoadedMetadata={(event) => {
                      const video = event.currentTarget;
                      setDetails(formatDuration(video.duration) + " · " + video.videoWidth + " × " + video.videoHeight);
                    }}
                    onError={() => setError("This browser could not play the selected video. Try another video format.")}
                  >Your browser does not support video playback.</video>
                ) : (
                  <div className="px-6 text-center">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#a9b2a3]" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="2" /><path d="m10 8 6 4-6 4Z" /></svg>
                    </div>
                    <p className="mt-4 text-sm font-medium text-[#c6cdc2]">A clear view of your source footage</p>
                    <p className="mt-2 text-xs text-[#8d9689]">Select a video to preview it before analysis.</p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#b4bcb0]">
                {file ? <><span className="rounded-md bg-white/6 px-2.5 py-1.5">{formatBytes(file.size)}</span>{details && <span className="rounded-md bg-white/6 px-2.5 py-1.5">{details}</span>}</> : <span>No video selected yet</span>}
              </div>
            </section>
          </div>

          <section aria-labelledby="workflow-heading" className="mx-auto mt-14 max-w-6xl">
            <div className="flex items-center gap-4"><h2 id="workflow-heading" className="shrink-0 text-[11px] font-bold uppercase tracking-[0.16em] text-[#c8ff00]">How it works</h2><div className="h-px w-full bg-white/10" /></div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {steps.map(([number, title, description]) => (
                <div key={number} className="min-h-44 rounded-xl border border-white/10 bg-[#1d201e] p-5">
                  <span className="inline-flex size-9 items-center justify-center rounded-lg bg-[#0d1007] text-sm font-bold text-[#c8ff00]">{number}</span>
                  <h3 className="mt-5 text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#a1aa9e]">{description}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
