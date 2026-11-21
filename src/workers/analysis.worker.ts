import { Input, BlobSource, ALL_FORMATS } from "mediabunny";
import { readAudioWindow, rms } from "../lib/analysis/audio";
import {
  rankingBatches,
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
  REPAIR_SYSTEM_PROMPT,
  repairUserPrompt,
} from "../lib/analysis/prompts";
import {
  SPEECH_MODEL,
  SOUND_MODEL,
  RANK_MODEL,
  RANK_MODEL_URL,
  RANK_LIBRARY_URL,
} from "../lib/analysis/models";
import type { AnalysisRequest, AnalysisEvent } from "../lib/analysis/protocol";
import { stageThroughput, sourceGuidance } from "../lib/analysis/options";
import { createModelAssetCache } from "../lib/analysis/model-assets";
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
  const duration = source.durationInFrames / source.fps;
  const guidance = sourceGuidance(duration);
  if (guidance.blocked) throw new Error(guidance.message);
  const timings: Record<string, number> = {};
  const started = performance.now();
  const measure = async <T>(
    name: string,
    task: () => Promise<T>,
  ): Promise<T> => {
    const begin = performance.now();
    try {
      return await task();
    } catch (error) {
      if (
        ["speechLoad", "soundLoad", "rankerLoad"].includes(name) &&
        error instanceof Error &&
        /failed to fetch|networkerror|load failed/i.test(error.message)
      ) {
        throw new Error(
          "The browser could not download an AI model file. Check your connection and whether this browser or network blocks Hugging Face, then retry. Already saved model files will be reused when available.",
        );
      }
      throw error;
    } finally {
      timings[name] = Math.round(performance.now() - begin);
    }
  };
  const complete = (clips: import("../types/editing").ClipDocument[]) =>
    send({
      type: "complete",
      clips,
      timings: { ...timings, total: Math.round(performance.now() - started) },
    });
  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS,
  });
  try {
    report({ stage: 1, detail: "Checking audio and local AI support…" });
    const track = await input.getPrimaryAudioTrack();
    // No audio is a real empty result, not a fabricated visual analysis.
    if (!track) {
      complete([]);
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
    env.customCache = await createModelAssetCache(self.location.origin);
    env.useCustomCache = true;
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
    const speech = await measure("speechLoad", () =>
      pipeline("automatic-speech-recognition", SPEECH_MODEL.id, {
        revision: SPEECH_MODEL.revision,
        device: "webgpu",
        dtype: { encoder_model: "fp32", decoder_model_merged: "q4" },
        progress_callback,
      }),
    );
    const transcriptionStart = performance.now();
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
            num_beams: 1,
            do_sample: false,
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
        const throughput = stageThroughput(
          end,
          duration,
          performance.now() - transcriptionStart,
        );
        report({
          timing: throughput
            ? `Transcription: ${throughput.speed.toFixed(1)}× real time · about ${Math.ceil(throughput.remainingSeconds / 60)} min left in this stage`
            : `Transcription: ${Math.round((performance.now() - transcriptionStart) / 1000)}s elapsed · measuring speed…`,
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
      timings.transcription = Math.round(
        performance.now() - transcriptionStart,
      );
      await speech.dispose();
    }
    const words = evidence.reduce(
      (count, e) => count + e.text.split(/\s+/).length,
      0,
    );
    let eventCount = 0;
    {
      report({
        stage: 3,
        progress: 55,
        speechWpm: Math.round(words / (duration / 60)),
        detail: "Loading sound-event model…",
        stageResults: { 2: `${evidence.length} speech segments` },
        timing: "Loading sound model…",
      });
      // Run models sequentially to avoid retaining speech + sound + LLM allocations together.
      const classifier = await measure("soundLoad", () =>
        pipeline("audio-classification", SOUND_MODEL.id, {
          revision: SOUND_MODEL.revision,
          device: "wasm",
          dtype: "q8",
          progress_callback,
        }),
      );
      const soundStart = performance.now();
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
            timing: `Sound scan: ${Math.round((performance.now() - soundStart) / 1000)}s elapsed`,
            detail: `Sound analyzed: ${Math.round(end)} / ${Math.ceil(duration)} seconds`,
          });
        }
      } finally {
        timings.soundScan = Math.round(performance.now() - soundStart);
        await classifier.dispose();
      }
    }
    report({
      stage: 4,
      progress: 75,
      detail: "Loading local clip-selection model…",
      timing: "Model loading is separate from transcription time",
      stageResults: {
        3: `${eventCount} sound events`,
      },
    });
    if (!evidence.length) {
      complete([]);
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
    const engine = await measure("rankerLoad", () =>
      CreateMLCEngine(RANK_MODEL, {
        appConfig: {
          ...prebuiltAppConfig,
          model_list: [
            {
              ...record,
              model: RANK_MODEL_URL,
              model_lib: RANK_LIBRARY_URL,
            },
          ],
        },
        initProgressCallback: (p) =>
          report({
            detail: `Loading clip-selection model: ${Math.round(p.progress * 100)}%`,
          }),
      }),
    );
    const rankingStart = performance.now();
    try {
      // 2700 prompt tokens + 850 output + 256 chat-template headroom < 4096 context.
      const batches = await rankingBatches(
        evidence,
        async (batch) =>
          (
            await engine.tokenize(
              MOMENT_SYSTEM_PROMPT + "\n" + momentUserPrompt(batch),
            )
          ).length,
      );
      const results: { moment: RankedMoment; evidence: Evidence[] }[] = [];
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        report({
          detail: `Selecting moments: section ${i + 1} of ${batches.length}`,
        });
        let valid = false;
        let invalid = "";
        let errors = ["Invalid result"];
        for (let attempt = 0; attempt < 2; attempt++) {
          const messages =
            attempt === 0
              ? [
                  { role: "system" as const, content: MOMENT_SYSTEM_PROMPT },
                  { role: "user" as const, content: momentUserPrompt(batch) },
                ]
              : [
                  { role: "system" as const, content: REPAIR_SYSTEM_PROMPT },
                  {
                    role: "user" as const,
                    content: repairUserPrompt(invalid, batch, errors),
                  },
                ];
          if (
            (
              await engine.tokenize(
                messages.map((message) => message.content).join("\n"),
              )
            ).length > 2700
          )
            break;
          const completion = await engine.chat.completions.create({
            messages,
            temperature: 0,
            seed: 42,
            max_tokens: 850,
            response_format: {
              type: "json_object",
              schema: MOMENT_JSON_SCHEMA,
            },
          });
          const choice = completion.choices[0];
          invalid = choice?.message.content ?? "";
          if (choice?.finish_reason === "length") {
            errors = ["Response exceeded output limit"];
            continue;
          }
          const parsed = rankedMomentsSchema.safeParse(
            (() => {
              try {
                return JSON.parse(choice?.message.content ?? "null");
              } catch {
                return null;
              }
            })(),
          );
          if (!parsed.success) {
            errors = parsed.error.issues.map(
              (issue) => `${issue.path.join(".")}: ${issue.code}`,
            );
            continue;
          }
          if (
            parsed.data.moments.some(
              (m) =>
                !batch.some((e) => e.id === m.startId) ||
                !batch.some((e) => e.id === m.endId),
            )
          ) {
            errors = ["Unknown evidence IDs"];
            continue;
          }
          for (const moment of parsed.data.moments)
            results.push({ moment, evidence: batch });
          valid = true;
          break;
        }
        if (!valid)
          throw new Error(
            "The local AI returned an invalid result. Please retry analysis; this attempt will not use a video slot.",
          );
        report({
          progress: 75 + (24 * (i + 1)) / batches.length,
          timing: `Clip selection: ${Math.round((performance.now() - rankingStart) / 1000)}s elapsed · ${i + 1}/${batches.length} sections`,
        });
      }
      const clips = toClips(results, evidence, source);
      report({
        progress: 99,
        detail: "Saving analysis completion…",
        stageResults: { 4: `${clips.length} suggestions` },
      });
      timings.ranking = Math.round(performance.now() - rankingStart);
      complete(clips);
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
