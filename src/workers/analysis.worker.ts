import { Input, BlobSource, ALL_FORMATS } from "mediabunny";
import { readAudioWindow, rms } from "../lib/analysis/audio";
import {
  evidenceBatches,
  rankedMomentsSchema,
  speechEvidence,
  toClips,
  type Evidence,
  type RankedMoment,
} from "../lib/analysis/evidence";
import {
  MOMENT_JSON_SCHEMA,
  MOMENT_SYSTEM_PROMPT,
  momentUserPrompt,
} from "../lib/analysis/prompts";
import {
  SPEECH_MODEL,
  SOUND_MODEL,
  RANK_MODEL,
  RANK_REVISION,
} from "../lib/analysis/models";
import type { AnalysisRequest, AnalysisEvent } from "../lib/analysis/protocol";
import type { AnalysisSnapshot } from "../types/analysis";

function send(event: AnalysisEvent) {
  self.postMessage(event);
}
let snapshot: AnalysisSnapshot = {};
function report(update: AnalysisSnapshot) {
  snapshot = {
    ...snapshot,
    ...update,
    stageResults: { ...snapshot.stageResults, ...update.stageResults },
  };
  send({ type: "progress", snapshot });
}

async function analyze({ file, source }: AnalysisRequest) {
  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS,
  });
  try {
    report({ stage: 1, detail: "Checking audio and local AI support…" });
    const track = await input.getPrimaryAudioTrack();
    // No audio is a real empty result, not a fabricated visual analysis.
    if (!track) {
      send({ type: "complete", clips: [] });
      return;
    }
    if (!(await track.canDecode()))
      throw new Error(
        "This browser cannot decode the audio track. Try an AAC MP4 or Opus WebM.",
      );
    const gpu = (
      navigator as Navigator & {
        gpu?: { requestAdapter: () => Promise<unknown> };
      }
    ).gpu;
    if (!gpu || !(await gpu.requestAdapter()))
      throw new Error(
        "Local AI needs WebGPU. Use a current desktop Chrome or Edge browser with hardware acceleration enabled.",
      );
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false;
    if (env.backends.onnx.wasm) env.backends.onnx.wasm.numThreads = 1;
    // Package default remote WASM paths match its pinned ONNX Runtime version.
    const progress_callback = (event: {
      status: string;
      file?: string;
      progress?: number;
    }) => {
      if (event.status === "progress")
        report({
          detail: `Downloading ${event.file ?? "AI model"}: ${Math.round(event.progress ?? 0)}%`,
        });
    };
    const evidence: Evidence[] = [];
    const duration = source.durationInFrames / source.fps;
    const speech = await pipeline(
      "automatic-speech-recognition",
      SPEECH_MODEL.id,
      {
        revision: SPEECH_MODEL.revision,
        device: "webgpu",
        dtype: { encoder_model: "fp32", decoder_model_merged: "q4" },
        progress_callback,
      },
    );
    try {
      report({
        stage: 2,
        progress: 10,
        detail: "Transcribing on this device…",
        stageResults: { 1: "Speech model ready" },
      });
      for (let offset = 0; offset < duration; offset += 25) {
        const end = Math.min(duration, offset + 30);
        const audio = await readAudioWindow(track, offset, end);
        // Only digital silence is skipped; soft speech still reaches Whisper.
        if (rms(audio) > 0.00001) {
          const output = await speech(audio, {
            return_timestamps: true,
            task: "transcribe",
            chunk_length_s: 30,
            stride_length_s: 5,
          });
          const result = Array.isArray(output) ? output[0] : output;
          evidence.push(
            ...speechEvidence(
              result.chunks ?? [],
              offset,
              end,
              offset === 0 ? 0 : offset + 2.5,
              end === duration ? duration + 1 : offset + 27.5,
              evidence,
            ),
          );
        }
        report({
          progress: 10 + (45 * end) / duration,
          detail: `Speech analyzed: ${Math.round(end)} / ${Math.ceil(duration)} seconds`,
          frame: Math.min(
            source.durationInFrames - 1,
            Math.floor(end * source.fps),
          ),
        });
        if (end === duration) break;
      }
    } finally {
      await speech.dispose();
    }
    const words = evidence.reduce(
      (count, e) => count + e.text.split(/\s+/).length,
      0,
    );
    report({
      stage: 3,
      progress: 55,
      speechWpm: Math.round(words / (duration / 60)),
      detail: "Loading sound-event model…",
      stageResults: { 2: `${evidence.length} speech segments` },
    });
    // Run models sequentially to avoid retaining speech + sound + LLM allocations together.
    const classifier = await pipeline("audio-classification", SOUND_MODEL.id, {
      revision: SOUND_MODEL.revision,
      device: "wasm",
      dtype: "q8",
      progress_callback,
    });
    let eventCount = 0;
    try {
      for (let start = 0; start < duration; start += 10) {
        const end = Math.min(duration, start + 10);
        const audio = await readAudioWindow(track, start, end);
        const level = rms(audio);
        if (level > 0.00001) {
          const output = await classifier(audio, { top_k: 8 });
          const classes = Array.isArray(output[0]) ? output[0] : output;
          for (const item of classes) {
            if (
              !("label" in item) ||
              item.score < 0.15 ||
              !/laugh|applause|cheer|shout|scream|gunshot|explosion/i.test(
                item.label,
              )
            )
              continue;
            evidence.push({
              id: `a${eventCount++}`,
              start,
              end,
              kind: "sound",
              text: `Possible ${item.label.toLowerCase()} (classifier score ${item.score.toFixed(2)})`,
            });
          }
        }
        report({
          progress: 55 + (20 * end) / duration,
          audioLevel: Math.min(1, level),
          soundEvents: eventCount,
          detail: `Sound analyzed: ${Math.round(end)} / ${Math.ceil(duration)} seconds`,
        });
      }
    } finally {
      await classifier.dispose();
    }
    report({
      stage: 4,
      progress: 75,
      detail: "Loading local clip-selection model…",
      stageResults: { 3: `${eventCount} sound events` },
    });
    if (!evidence.length) {
      send({ type: "complete", clips: [] });
      return;
    }
    const { CreateMLCEngine, prebuiltAppConfig } = await import(
      "@mlc-ai/web-llm"
    );
    const record = prebuiltAppConfig.model_list.find(
      (m) => m.model_id === RANK_MODEL,
    );
    if (!record)
      throw new Error("The local clip-selection model is not configured.");
    const engine = await CreateMLCEngine(RANK_MODEL, {
      appConfig: {
        ...prebuiltAppConfig,
        model_list: [
          {
            ...record,
            model: `https://huggingface.co/mlc-ai/${RANK_MODEL}/resolve/${RANK_REVISION}/`,
          },
        ],
      },
      initProgressCallback: (p) =>
        report({
          detail: `Loading clip-selection model: ${Math.round(p.progress * 100)}%`,
        }),
    });
    try {
      const batches = evidenceBatches(evidence);
      const results: { moment: RankedMoment; evidence: Evidence[] }[] = [];
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        report({
          detail: `Selecting moments: section ${i + 1} of ${batches.length}`,
        });
        let valid = false;
        for (let attempt = 0; attempt < 2; attempt++) {
          const completion = await engine.chat.completions.create({
            messages: [
              { role: "system", content: MOMENT_SYSTEM_PROMPT },
              { role: "user", content: momentUserPrompt(batch) },
            ],
            temperature: 0,
            seed: 42,
            max_tokens: 850,
            response_format: {
              type: "json_object",
              schema: MOMENT_JSON_SCHEMA,
            },
          });
          const choice = completion.choices[0];
          if (choice?.finish_reason === "length") continue;
          const parsed = rankedMomentsSchema.safeParse(
            (() => {
              try {
                return JSON.parse(choice?.message.content ?? "null");
              } catch {
                return null;
              }
            })(),
          );
          if (!parsed.success) continue;
          if (
            parsed.data.moments.some(
              (m) =>
                !batch.some((e) => e.id === m.startId) ||
                !batch.some((e) => e.id === m.endId),
            )
          )
            continue;
          for (const moment of parsed.data.moments)
            results.push({ moment, evidence: batch });
          valid = true;
          break;
        }
        if (!valid)
          throw new Error(
            "The local AI returned an invalid result. Please retry analysis; this attempt will not use a video slot.",
          );
        report({ progress: 75 + (24 * (i + 1)) / batches.length });
      }
      const clips = toClips(results, evidence, source);
      report({
        progress: 99,
        detail: "Saving analysis completion…",
        stageResults: { 4: `${clips.length} suggestions` },
      });
      send({ type: "complete", clips });
    } finally {
      await engine.unload();
    }
  } finally {
    input.dispose();
  }
}
self.onmessage = (event: MessageEvent<AnalysisRequest>) => {
  void analyze(event.data).catch((error: unknown) =>
    send({
      type: "error",
      message:
        error instanceof Error
          ? error.message
          : "Local analysis failed. Please retry.",
    }),
  );
};
