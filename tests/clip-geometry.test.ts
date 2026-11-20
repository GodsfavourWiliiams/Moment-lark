import { fixtureState } from "./fixtures/editing";
import assert from "node:assert/strict";
import test from "node:test";
import {
  mediaRect,
  outputSize,
  PREVIEW_SIZE,
  previewGeometry,
} from "../src/lib/clip-geometry";
import { editingReducer } from "../src/state/editing";

const sources = [
  { width: 3840, height: 2160 },
  { width: 1080, height: 1920 },
  { width: 1440, height: 1080 },
  { width: 1080, height: 1080 },
];

function approximately(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 0.000001, `${actual} ≠ ${expected}`);
}

test("original preserves source resolution and shows the full frame in every orientation", () => {
  for (const source of sources) {
    assert.deepEqual(outputSize("original", source), source);
    for (const cropX of [0, 0.5, 1]) {
      const { media, crop } = previewGeometry(source, "original", cropX);
      approximately(media.width / media.height, source.width / source.height);
      assert.ok(media.left >= 0 && media.top >= 0);
      assert.ok(media.left + media.width <= PREVIEW_SIZE.width);
      assert.ok(media.top + media.height <= PREVIEW_SIZE.height);
      for (const key of ["left", "top", "width", "height"] as const)
        approximately(crop[key], media[key]);
      assert.deepEqual(
        mediaRect(source, outputSize("original", source), "cover", cropX),
        {
          ...source,
          left: 0,
          top: 0,
        },
      );
    }
  }
});

test("explicit crop guides match the source region used by the export renderer", () => {
  for (const source of sources) {
    for (const aspect of ["9:16", "1:1", "16:9"] as const) {
      for (const cropX of [0, 0.25, 1]) {
        const { media, crop } = previewGeometry(source, aspect, cropX);
        const output = outputSize(aspect, source);
        const exported = mediaRect(source, output, "cover", cropX);
        approximately(crop.width / crop.height, output.width / output.height);
        approximately(
          (crop.left - media.left) / media.width,
          -exported.left / exported.width,
        );
        approximately(
          (crop.top - media.top) / media.height,
          -exported.top / exported.height,
        );
        approximately(crop.width / media.width, output.width / exported.width);
        approximately(
          crop.height / media.height,
          output.height / exported.height,
        );
      }
    }
  }
});

test("clips start uncropped and returning to Original preserves content edits", () => {
  assert.ok(
    fixtureState.document!.clips.every((clip) => clip.aspect === "original"),
  );
  const cropped = editingReducer(fixtureState, {
    type: "patch",
    id: "2",
    patch: { aspect: "9:16", cropX: 0.2, inFrame: 690 * 60, title: "My clip" },
  });
  const original = editingReducer(cropped, {
    type: "patch",
    id: "2",
    patch: { aspect: "original" },
  });
  assert.deepEqual(original.document!.clips[1], {
    ...cropped.document!.clips[1],
    aspect: "original",
  });
});
