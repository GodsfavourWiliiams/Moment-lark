import assert from "node:assert/strict";
import { afterEach, it } from "node:test";
import { GuestApiError, loadGuestUsage } from "../src/services/guest";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
const usage = {
  guest: {
    id: "211b5f10-8ddb-4b11-8ec4-e05772fbc345",
    expiresAt: "2026-12-01T00:00:00.000Z",
  },
  allowance: {
    grantedVideos: 3,
    usedVideos: 1,
    reservedVideos: 0,
    remainingVideos: 2,
  },
  mode: "local-development",
};

it("deduplicates guest initialization and verifies the new cookie with a usage read", async () => {
  const calls: string[] = [];
  globalThis.fetch = async (url, options) => {
    calls.push(`${options?.method} ${url}`);
    assert.equal(options?.credentials, "same-origin");
    if (calls.length === 1)
      return Response.json(
        { error: { code: "session_required", message: "Session required" } },
        { status: 401 },
      );
    return Response.json(usage);
  };
  const [first, second] = await Promise.all([
    loadGuestUsage(),
    loadGuestUsage(),
  ]);
  assert.deepEqual(first, usage);
  assert.deepEqual(second, usage);
  assert.deepEqual(calls, [
    "GET /api/guest/usage",
    "POST /api/guest/session",
    "GET /api/guest/usage",
  ]);
});

it("does not issue new guests on backend outages", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json(
      { error: { code: "guest_unavailable", message: "Not available" } },
      { status: 503 },
    );
  };
  await assert.rejects(
    loadGuestUsage(),
    (error) =>
      error instanceof GuestApiError && error.code === "guest_unavailable",
  );
  assert.equal(calls, 1);
});

it("reports blocked cookies instead of looping through guest creation", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return calls === 2
      ? Response.json(usage)
      : Response.json(
          { error: { code: "session_required", message: "Session required" } },
          { status: 401 },
        );
  };
  await assert.rejects(
    loadGuestUsage(),
    (error) =>
      error instanceof GuestApiError && error.code === "cookies_required",
  );
  assert.equal(calls, 3);
});
