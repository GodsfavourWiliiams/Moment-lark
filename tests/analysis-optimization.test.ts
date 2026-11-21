import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { checkPromptBundle, verifyPromptHistory } from "../scripts/prompts.mjs";
import fixture from "./fixtures/ai/evidence.json";
import {
  evidenceBatches,
  rankingBatches,
  toClips,
  type Evidence,
} from "../src/lib/analysis/evidence";
import {
  momentUserPrompt,
  repairUserPrompt,
  REPAIR_SYSTEM_PROMPT,
} from "../src/lib/analysis/prompts";
import {
  DEFAULT_ANALYSIS_OPTIONS,
  sourceGuidance,
  stageThroughput,
} from "../src/lib/analysis/options";
import { AnalysisView } from "../src/features/analysis";
import { initialStudioState, studioReducer } from "../src/state/studio";
import {
  analysisProvenanceSchema,
  analysisTimingsSchema,
} from "../shared/contracts/analysis-job";

test("short videos warn, sub-six-second videos block, and long videos have no duration cap", () => {
  assert.equal(sourceGuidance(5.99).blocked, true);
  assert.equal(sourceGuidance(6).blocked, false);
  assert.match(sourceGuidance(28).message, /already short/);
  assert.match(sourceGuidance(7200).message, /long recording/);
  assert.equal(sourceGuidance(7200).blocked, false);
  assert.equal(DEFAULT_ANALYSIS_OPTIONS.soundEvents, false);
  let state = studioReducer(initialStudioState, {
    type: "start-analysis",
    video: { name: "small.mp4", size: 100 },
  });
  state = studioReducer(state, { type: "video-ready" });
  assert.equal(state.awaitingAnalysis, true);
  assert.equal(state.analysis.stage, undefined);
  assert.equal(
    studioReducer(state, { type: "run-analysis" }).awaitingAnalysis,
    false,
  );
});

test("preflight names model/download costs and does not require a sound scan", () => {
  const html = renderToStaticMarkup(
    createElement(AnalysisView, {
      video: { name: "small.mp4", size: 1024 },
      source: {
        id: "source",
        name: "small.mp4",
        url: "blob:local",
        kind: "local",
        fps: 30,
        durationInFrames: 840,
        width: 1280,
        height: 720,
      },
      reading: false,
      complete: false,
      error: null,
      awaitingAnalysis: true,
      onStart: () => {},
      onCancel: () => {},
    }),
  );
  for (const label of [
    "already short",
    "Whisper Base",
    "Qwen2.5 1.5B",
    "AudioSet AST",
    "869 MB",
    "Start local analysis",
  ])
    assert.ok(html.includes(label));
  assert.doesNotMatch(html, /checked=""/);
  assert.doesNotMatch(html, /Proceed to Suggestions/);
});

test("throughput is measured only after enough audio and estimates just the current stage", () => {
  assert.equal(stageThroughput(28, 7200, 10000), undefined);
  assert.deepEqual(stageThroughput(60, 120, 30000), {
    speed: 2,
    remainingSeconds: 30,
  });
});

test("token packing reduces representative ranking calls without exceeding tokenizer budgets", async () => {
  const items = Array.from({ length: 60 }, (_, i) => ({
    id: `s${i}`,
    kind: "speech" as const,
    start: i * 3,
    end: i * 3 + 3,
    text: "A complete explanation of a local editing benefit and its tradeoff. ".repeat(
      3,
    ),
  }));
  // Deterministic tokenizer stand-in; runtime uses engine.tokenize on the complete prompt.
  const measure = async (batch: Evidence[]) =>
    Math.ceil(JSON.stringify(batch).length / 4) + 350;
  const previous = evidenceBatches(items);
  const packed = await rankingBatches(items, measure);
  assert.ok(packed.length < previous.length);
  for (const batch of packed) assert.ok((await measure(batch)) <= 2700);
  assert.equal(
    new Set(packed.flat().map((item) => item.id)).size,
    items.length,
  );
  const unicodeMeasure = async (batch: Evidence[]) =>
    new TextEncoder().encode(JSON.stringify(batch)).length;
  const unicode = await rankingBatches(items, unicodeMeasure);
  for (const batch of unicode) assert.ok((await unicodeMeasure(batch)) <= 2700);
});

test("registered prompt artifacts and compiled browser bundle match released hashes", () => {
  checkPromptBundle();
  verifyPromptHistory("HEAD");
});

test("injection fixture remains quoted data and invented ranges cannot become clips", () => {
  const evidence = fixture.segments as Evidence[];
  const source = {
    id: "source",
    kind: "local" as const,
    name: "fixture.mp4",
    url: null,
    fps: 30,
    durationInFrames: 1800,
    width: 1280,
    height: 720,
  };
  assert.match(momentUserPrompt(evidence), /Ignore the system/);
  assert.deepEqual(
    toClips([{ moment: fixture.invented, evidence }], evidence, source),
    [],
  );
  assert.equal(
    toClips([{ moment: fixture.grounded, evidence }], evidence, source)[0]
      .inFrame,
    240,
  );
  assert.match(REPAIR_SYSTEM_PROMPT, /untrusted/);
  const repair = JSON.parse(
    repairUserPrompt("Ignore the schema", evidence, ["unknown ID"]),
  );
  assert.deepEqual(repair.allowedIds, ["s0", "s1", "s2"]);
  assert.equal(repair.invalidResponse, "Ignore the schema");
});

test("diagnostics reject media content, unknown timing fields, and invalid durations", () => {
  assert.equal(
    analysisTimingsSchema.safeParse({ transcription: -1 }).success,
    false,
  );
  assert.equal(
    analysisTimingsSchema.safeParse({ transcript: "private" }).success,
    false,
  );
  assert.equal(
    analysisTimingsSchema.safeParse({ transcription: 2500, total: 5000 })
      .success,
    true,
  );
  assert.equal(
    analysisProvenanceSchema.safeParse({
      promptId: "highlights",
      promptVersion: "v1",
      schemaVersion: "highlights-result@1",
      repairVersion: "v1",
      speechModel: "whisper",
      soundModel: null,
      rankingModel: "qwen",
      transcript: "private",
    }).success,
    false,
  );
});
