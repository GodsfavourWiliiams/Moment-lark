import assert from "node:assert/strict";
import { it } from "node:test";
import { validateSourceDuration } from "../src/lib/media/source-limits";

it("accepts recordings through exactly 90 minutes", () => {
  for (const seconds of [0.01, 1800, 3600, 5399.99, 5400]) {
    assert.doesNotThrow(() => validateSourceDuration(seconds));
  }
});

it("rejects recordings beyond 90 minutes before analysis", () => {
  for (const seconds of [5400.01, 7200]) {
    assert.throws(() => validateSourceDuration(seconds), /90 minutes/);
  }
});

it("rejects unreadable or invalid durations", () => {
  for (const seconds of [NaN, Infinity, -Infinity, 0, -1]) {
    assert.throws(() => validateSourceDuration(seconds), /could not be read/);
  }
});
