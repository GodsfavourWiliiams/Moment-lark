import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AnalysisView } from "../src/features/analysis";
import type { MediaSource } from "../src/types/editing";

const source: MediaSource = {
  id: "imported",
  kind: "local",
  name: "my-video.mp4",
  url: "blob:my-video",
  width: 1280,
  height: 720,
  fps: 30,
  durationInFrames: 300,
};
const props = {
  video: { name: source.name, size: 1024 },
  source,
  reading: false,
  complete: false,
  error: null,
  onCancel: () => {},
};

test("analysis retains stage and telemetry content, previews the imported source, and has no manual continue action", () => {
  const html = renderToStaticMarkup(createElement(AnalysisView, props));
  for (const title of [
    "Downloading on-device AI models",
    "Transcribing &amp; analyzing speech",
    "Scanning visual moments &amp; speaker framing",
    "Preparing ranked clip suggestions",
    "Live Framing Telemetry",
    "Speech Cadence Detection",
    "Emotional Inflection Index",
  ])
    assert.ok(html.includes(title), title);
  assert.match(html, /<video[^>]*src="blob:my-video"/);
  assert.match(html, /object-contain/);
  assert.match(html, /width:0%/);
  assert.doesNotMatch(
    html,
    /Proceed to Suggestions|96%|142 WPM|podcast_|analysis-studio/,
  );
  assert.match(html, /Auto-advancing on complete/);
  assert.doesNotMatch(
    html,
    /Hardware Backend|Active Inference|Frame Buffer|Privacy Assurance/,
  );
});

test("analysis displays supplied progress and measurements without inventing them", () => {
  const html = renderToStaticMarkup(
    createElement(AnalysisView, {
      ...props,
      snapshot: {
        stage: 3,
        progress: 71,
        remainingSeconds: 12,
        speechWpm: 120,
        frame: 150,
      },
    }),
  );
  assert.match(html, /Step 3 of 4/);
  assert.match(html, /aria-valuenow="71"/);
  assert.match(html, /width:71%/);
  assert.match(html, /120 WPM/);
  assert.match(html, /Frame 150/);
  assert.doesNotMatch(html, /Proceed to Suggestions/);
});
