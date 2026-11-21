import assert from "node:assert/strict";
import test from "node:test";
import {
  evidenceBatches,
  rankedMomentsSchema,
  speechEvidence,
  toClips,
  type Evidence,
} from "../src/lib/analysis/evidence";
import {
  MOMENT_SYSTEM_PROMPT,
  momentUserPrompt,
} from "../src/lib/analysis/prompts";
import type { MediaSource } from "../src/types/editing";
const source: MediaSource = {
  id: "source",
  kind: "local",
  name: "clip.mp4",
  url: null,
  fps: 30,
  durationInFrames: 9000,
  width: 1920,
  height: 1080,
};
const evidence: Evidence[] = [
  { id: "s0", kind: "speech", start: 5, end: 12, text: "Question?" },
  { id: "s1", kind: "speech", start: 12, end: 25, text: "A complete answer." },
];
const moment = {
  startId: "s0",
  endId: "s1",
  title: "Answer",
  reason: "A question and complete answer",
  relevance: 85,
};
test("ranked evidence becomes uncropped, unreviewed clips with source-relative captions", () => {
  const [clip] = toClips([{ moment, evidence }], evidence, source);
  assert.equal(clip.inFrame, 150);
  assert.equal(clip.outFrame, 750);
  assert.equal(clip.aspect, "original");
  assert.equal(clip.status, "unreviewed");
  assert.equal(clip.cropX, 0.5);
  assert.equal(clip.captions[1].start, 360);
});
test("invented IDs, reversed ranges and excessive duration never become clips", () => {
  for (const invalid of [
    { ...moment, startId: "fake" },
    { ...moment, startId: "s1", endId: "s0" },
  ])
    assert.deepEqual(
      toClips([{ moment: invalid, evidence }], evidence, source),
      [],
    );
  assert.deepEqual(
    toClips(
      [{ moment, evidence: [evidence[0], { ...evidence[1], end: 250 }] }],
      evidence,
      source,
    ),
    [],
  );
  assert.equal(
    rankedMomentsSchema.safeParse({ moments: [{ ...moment, relevance: 101 }] })
      .success,
    false,
  );
});
test("overlapping candidates deduplicate and sound-only moments need no fabricated captions", () => {
  assert.equal(
    toClips(
      [
        { moment, evidence },
        { moment, evidence },
      ],
      evidence,
      source,
    ).length,
    1,
  );
  const sound: Evidence[] = [
    { id: "a0", start: 0, end: 10, kind: "sound", text: "Possible cheering" },
  ];
  const [clip] = toClips(
    [{ moment: { ...moment, startId: "a0", endId: "a0" }, evidence: sound }],
    sound,
    source,
  );
  assert.deepEqual(clip.captions, []);
});
test("overlapping speech windows have one owner and retain monotonic captions", () => {
  const first = speechEvidence(
    [
      { text: "Hello", timestamp: [22, 27] },
      { text: "Next", timestamp: [27, 29] },
    ],
    0,
    30,
    0,
    27.5,
    [],
  );
  const second = speechEvidence(
    [
      { text: "Hello", timestamp: [0, 2] },
      { text: "Next", timestamp: [2, 4] },
    ],
    25,
    55,
    27.5,
    52.5,
    first,
  );
  assert.equal(first.length, 1);
  assert.equal(second.length, 1);
  assert.equal(second[0].text, "Next");
  assert.equal(second[0].start, 27);
});
test("ranking batches remain bounded and prompt treats transcript injection as data", () => {
  const items = Array.from({ length: 500 }, (_, i) => ({
    id: `s${i}`,
    kind: "speech" as const,
    start: i * 10,
    end: i * 10 + 10,
    text: "x".repeat(600),
  }));
  const batches = evidenceBatches(items);
  assert.ok(batches.length > 1);
  assert.ok(
    batches.every(
      (b) => new TextEncoder().encode(JSON.stringify(b)).length <= 2600,
    ),
  );
  assert.match(MOMENT_SYSTEM_PROMPT, /untrusted/);
  assert.match(momentUserPrompt(evidence), /"id":"s0"/);
});

test("multilingual and escaped text stays within context budget without truncating captions", () => {
  for (const text of [
    "😀".repeat(900),
    "\u0000".repeat(900),
    "这是测试".repeat(300),
  ]) {
    const items = [0, 1, 200].map((start, i) => ({
      id: `s${i}`,
      kind: "speech" as const,
      start,
      end: start + 8,
      text,
    }));
    const batches = evidenceBatches(items);
    assert.ok(
      batches.every(
        (b) => new TextEncoder().encode(JSON.stringify(b)).length <= 2600,
      ),
    );
    assert.ok(batches.every((b) => b.at(-1)!.end - b[0].start <= 180));
    assert.equal(items[0].text, text);
    const speech = speechEvidence(
      [{ text, timestamp: [0, 8] }],
      0,
      30,
      0,
      30,
      [],
    );
    assert.equal(speech[0].text, text);
  }
});
