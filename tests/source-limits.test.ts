import assert from "node:assert/strict";
import { it } from "node:test";
import {
  validateSourceDuration,
  validateSourceFileSize,
} from "../src/lib/media/source-limits";

it("accepts valid durations without the former 90-minute cap", () => {
  for (const seconds of [0.01, 1800, 5400, 5400.01, 7200, 36000]) {
    assert.doesNotThrow(() => validateSourceDuration(seconds));
  }
});

it("accepts files up to exactly 2 decimal GB and rejects one byte over", () => {
  assert.doesNotThrow(() => validateSourceFileSize(1));
  assert.doesNotThrow(() => validateSourceFileSize(2_000_000_000));
  assert.throws(() => validateSourceFileSize(2_000_000_001), /2 GB/);
});

it("rejects empty files and invalid file sizes", () => {
  for (const size of [0, -1, NaN, Infinity, 1.5]) {
    assert.throws(() => validateSourceFileSize(size), /non-empty/);
  }
});

it("rejects unreadable or invalid durations", () => {
  for (const seconds of [NaN, Infinity, -Infinity, 0, -1]) {
    assert.throws(() => validateSourceDuration(seconds), /could not be read/);
  }
});
