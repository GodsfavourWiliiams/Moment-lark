import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { Miniflare } from "miniflare";
import app from "../index";
import type { Bindings } from "../types";
import { guestUsageSchema } from "../../shared/contracts/guest";
import { digestSessionToken } from "../services/guest-session";
import { maintainGuestRecords } from "../services/maintenance";
import { networkWindow } from "../services/public-guest";
import { insertGuestSession } from "../repositories/guests";

describe("guest API with local D1", () => {
  let runtime: Miniflare;
  let db: D1Database;
  let migrationDb: D1Database;
  let env: Bindings;

  async function applyMigration(database: D1Database, name: string) {
    const sql = await readFile(
      new URL(`../db/migrations/${name}`, import.meta.url),
      "utf8",
    );
    await database.batch(
      sql
        .replace(/^--.*$/gm, "")
        .split(
          sql.includes("--> statement-breakpoint")
            ? "--> statement-breakpoint"
            : ";",
        )
        .map((statement) => statement.trim())
        .filter(Boolean)
        .map((statement) => database.prepare(statement)),
    );
  }

  before(async () => {
    runtime = new Miniflare({
      workers: [
        {
          config: {
            name: "guest-test",
            compatibilityDate: "2026-11-20",
            manifest: {
              mainModule: "index.js",
              modules: {
                "index.js": {
                  type: "esm",
                  contents:
                    "export default { fetch() { return new Response('test'); } }",
                },
              },
            },
            env: {
              DB: { type: "d1", id: "guest-test-db" },
              MIGRATION_DB: { type: "d1", id: "guest-migration-test-db" },
            },
          },
        },
      ],
    });
    db = (await runtime.getD1Database("DB")) as unknown as D1Database;
    migrationDb = (await runtime.getD1Database(
      "MIGRATION_DB",
    )) as unknown as D1Database;
    for (const name of [
      "0001_guests.sql",
      "0002_local_guest_allowance.sql",
      "0003_video_allowance.sql",
      "0004_analysis_jobs.sql",
      "0005_analysis_diagnostics.sql",
      "0006_public_guests.sql",
    ]) {
      await applyMigration(db, name);
    }
    env = {
      DB: db,
      GUEST_MODE: "local",
      GUEST_ALLOWANCE_VIDEOS: "3",
      APP_ORIGIN: "http://localhost:3000",
    };
  });
  after(async () => {
    await runtime?.dispose();
  });
  beforeEach(async () => {
    await db.batch([
      db.prepare("DELETE FROM analysis_jobs"),
      db.prepare("DELETE FROM guest_sessions"),
      db.prepare("DELETE FROM guests"),
      db.prepare("DELETE FROM turnstile_redemptions"),
      db.prepare("DELETE FROM network_windows"),
    ]);
  });

  function create(
    cookie?: string,
    overrides: RequestInit = {},
    bindings = env,
  ) {
    return app.request(
      "http://localhost:8787/api/guest/session",
      {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          "Content-Type": "application/json",
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: "{}",
        ...overrides,
      },
      bindings,
    );
  }
  async function session() {
    const response = await create();
    assert.equal(response.status, 201);
    return {
      usage: guestUsageSchema.parse(await response.json()),
      cookie: response.headers.get("set-cookie")!.split(";")[0],
      header: response.headers.get("set-cookie")!,
    };
  }
  function usage(cookie?: string, bindings = env) {
    return app.request(
      "http://localhost:8787/api/guest/usage",
      { headers: cookie ? { Cookie: cookie } : {} },
      bindings,
    );
  }

  it("returns health and JSON API 404s without a database", async () => {
    const health = await app.request("http://localhost/api/health", {}, {});
    assert.equal(health.status, 200);
    assert.equal(health.headers.get("cache-control"), "no-store");
    const unknown = await app.request("http://localhost/api/unknown", {}, {});
    assert.equal(unknown.status, 404);
    assert.match(unknown.headers.get("content-type")!, /application\/json/);
  });

  it("does not create a guest when reading unauthenticated usage", async () => {
    assert.equal((await usage()).status, 401);
    assert.equal(
      await db.prepare("SELECT count(*) AS count FROM guests").first("count"),
      0,
    );
  });

  it("creates the configured allowance and stores only a token digest", async () => {
    const guest = await session();
    assert.equal(guest.usage.allowance.remainingVideos, 3);
    assert.match(guest.header, /HttpOnly/);
    assert.match(guest.header, /SameSite=Strict/i);
    assert.match(guest.header, /Path=\//);
    assert.doesNotMatch(guest.header, /Domain=/i);
    const token = guest.cookie.split("=")[1];
    const digest = await db
      .prepare("SELECT token_digest FROM guest_sessions")
      .first("token_digest");
    assert.notEqual(digest, token);
    assert.equal(digest, await digestSessionToken(token));
    const response = await usage(guest.cookie);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), guest.usage);
  });

  it("sets Secure on HTTPS local sessions", async () => {
    const response = await app.request(
      "https://localhost/api/guest/session",
      {
        method: "POST",
        headers: {
          Origin: "https://localhost",
          "Content-Type": "application/json",
        },
        body: "{}",
      },
      { ...env, APP_ORIGIN: "https://localhost" },
    );
    assert.equal(response.status, 201);
    assert.match(response.headers.get("set-cookie")!, /; Secure/);
  });

  it("reuses the same guest without resetting spent/reserved allowance", async () => {
    const guest = await session();
    await db
      .prepare(
        "UPDATE guests SET used_videos = 1, reserved_videos = 1 WHERE id = ?",
      )
      .bind(guest.usage.guest.id)
      .run();
    const response = await create(
      guest.cookie,
      {},
      { ...env, GUEST_ALLOWANCE_VIDEOS: "5" },
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("set-cookie"), null);
    const returned = guestUsageSchema.parse(await response.json());
    assert.equal(returned.guest.id, guest.usage.guest.id);
    assert.deepEqual(returned.allowance, {
      grantedVideos: 3,
      usedVideos: 1,
      reservedVideos: 1,
      remainingVideos: 1,
    });
    assert.equal(
      await db.prepare("SELECT count(*) AS count FROM guests").first("count"),
      1,
    );
  });

  it("migrates minute grants to three videos while preserving sessions and rejecting ambiguous usage", async () => {
    await applyMigration(migrationDb, "0001_guests.sql");
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const token = "b".repeat(64);
    await migrationDb.batch([
      migrationDb
        .prepare(
          "INSERT INTO guests (id, created_at, granted_seconds, used_seconds) VALUES (?, ?, 1800, 60)",
        )
        .bind(id, now),
      migrationDb
        .prepare(
          "INSERT INTO guest_sessions (token_digest, guest_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
        )
        .bind(await digestSessionToken(token), id, now, now + 3600),
    ]);
    await applyMigration(migrationDb, "0002_local_guest_allowance.sql");
    await assert.rejects(
      applyMigration(migrationDb, "0003_video_allowance.sql"),
    );
    assert.equal(
      await migrationDb
        .prepare("SELECT used_seconds FROM guests WHERE id = ?")
        .bind(id)
        .first("used_seconds"),
      60,
    );
    // No analysis has shipped. Clear this deliberately seeded usage for the conversion.
    await migrationDb.prepare("UPDATE guests SET used_seconds = 0").run();
    await applyMigration(migrationDb, "0003_video_allowance.sql");
    await applyMigration(migrationDb, "0004_analysis_jobs.sql");
    await applyMigration(migrationDb, "0005_analysis_diagnostics.sql");
    await applyMigration(migrationDb, "0006_public_guests.sql");
    const result = await usage("ml_guest_local=" + token, {
      ...env,
      DB: migrationDb,
    });
    assert.equal(result.status, 200);
    const returned = guestUsageSchema.parse(await result.json());
    assert.equal(returned.guest.id, id);
    assert.deepEqual(returned.allowance, {
      grantedVideos: 3,
      usedVideos: 0,
      reservedVideos: 0,
      remainingVideos: 3,
    });
    await assert.rejects(
      migrationDb.prepare("UPDATE guests SET reserved_videos = 4").run(),
    );
  });

  it("isolates guests and rejects forged tokens", async () => {
    const first = await session();
    const second = await session();
    assert.notEqual(first.usage.guest.id, second.usage.guest.id);
    assert.equal((await usage("ml_guest_local=" + "a".repeat(64))).status, 401);
    assert.equal((await usage("ml_guest_local=' OR 1=1 --")).status, 401);
    assert.equal(
      guestUsageSchema.parse(await (await usage(first.cookie)).json()).guest.id,
      first.usage.guest.id,
    );
  });

  it("expires old sessions and replaces them rather than resurrecting identity", async () => {
    const guest = await session();
    await db
      .prepare("UPDATE guest_sessions SET created_at = 1, expires_at = 2")
      .run();
    assert.equal((await usage(guest.cookie)).status, 401);
    const response = await create(guest.cookie);
    assert.equal(response.status, 201);
    assert.notEqual(
      guestUsageSchema.parse(await response.json()).guest.id,
      guest.usage.guest.id,
    );
  });

  it("rejects foreign or missing origins and cross-site reads", async () => {
    for (const origin of [
      undefined,
      "https://attacker.example",
      "http://localhost:3000.attacker.example",
    ]) {
      assert.equal(
        (
          await create(undefined, {
            headers: {
              "Content-Type": "application/json",
              ...(origin ? { Origin: origin } : {}),
            },
          })
        ).status,
        403,
      );
    }
    const guest = await session();
    const response = await app.request(
      "http://localhost/api/guest/usage",
      { headers: { Cookie: guest.cookie, "Sec-Fetch-Site": "cross-site" } },
      env,
    );
    assert.equal(response.status, 403);
  });

  it("rejects malformed, oversized, or client-defined allowance requests", async () => {
    assert.equal((await create(undefined, { body: "{" })).status, 400);
    assert.equal(
      (await create(undefined, { body: '{"allowanceVideos":999999}' })).status,
      400,
    );
    assert.equal(
      (await create(undefined, { body: " ".repeat(4097) })).status,
      413,
    );
    assert.equal(
      (
        await create(undefined, {
          headers: {
            Origin: "http://localhost:3000",
            "Content-Type": "text/plain",
          },
        })
      ).status,
      415,
    );
    assert.equal(
      await db.prepare("SELECT count(*) AS count FROM guests").first("count"),
      0,
    );
  });

  it("fails closed outside local development or with missing configuration", async () => {
    for (const bindings of [
      {},
      { ...env, GUEST_MODE: "production" },
      { ...env, DB: undefined },
      { ...env, GUEST_ALLOWANCE_VIDEOS: "invalid" },
    ]) {
      const response = await create(undefined, {}, bindings);
      assert.equal(response.status, 503);
    }
    const remote = await app.request(
      "https://moment-lark.example/api/guest/usage",
      {},
      env,
    );
    assert.equal(remote.status, 503);
  });

  it("enforces nonnegative balances and transactional session creation", async () => {
    const guest = await session();
    await assert.rejects(
      db
        .prepare("UPDATE guests SET used_videos = 4 WHERE id = ?")
        .bind(guest.usage.guest.id)
        .run(),
    );
    const digest = await db
      .prepare("SELECT token_digest FROM guest_sessions")
      .first<string>("token_digest");
    await assert.rejects(
      insertGuestSession(db, {
        id: crypto.randomUUID(),
        digest: digest!,
        now: 10,
        expiresAt: 20,
        allowanceVideos: 3,
      }),
    );
    assert.equal(
      await db.prepare("SELECT count(*) AS count FROM guests").first("count"),
      1,
    );
  });

  it("does not expose database errors or raw credentials", async () => {
    const response = await create(
      undefined,
      {},
      {
        ...env,
        DB: {
          prepare: () => {
            throw new Error("private database diagnostic");
          },
        } as unknown as D1Database,
      },
    );
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /private database diagnostic/);
    assert.equal(response.headers.get("set-cookie"), null);
  });
  function jobRequest(cookie: string, body: unknown, action = "") {
    return app.request(
      `http://localhost:8787/api/analysis-jobs${action ? `/${action}` : ""}`,
      {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify(body),
      },
      env,
    );
  }
  const newJob = () => ({
    id: crypto.randomUUID(),
    sourceId: crypto.randomUUID(),
    fileBytes: 1024,
  });
  it("stores versioned diagnostics without content and preserves the first completion", async () => {
    const guest = await session();
    const provenance = {
      promptId: "highlights",
      promptVersion: "v1",
      schemaVersion: "highlights-result@1",
      repairVersion: "v1",
      speechModel: "whisper-base@revision",
      soundModel: null,
      rankingModel: "qwen@revision",
    };
    const job = { ...newJob(), provenance };
    assert.equal(
      (
        await jobRequest(guest.cookie, {
          ...job,
          provenance: { ...provenance, transcript: "private content" },
        })
      ).status,
      400,
    );
    assert.equal((await jobRequest(guest.cookie, job)).status, 200);
    const timings = {
      speechLoad: 12,
      transcription: 100,
      rankerLoad: 20,
      ranking: 30,
      total: 170,
    };
    assert.equal(
      (
        await jobRequest(
          guest.cookie,
          { id: job.id, timings: { total: -1 } },
          "complete",
        )
      ).status,
      400,
    );
    assert.equal(
      (await jobRequest(guest.cookie, { id: job.id, timings }, "complete"))
        .status,
      200,
    );
    assert.equal(
      (
        await jobRequest(
          guest.cookie,
          { id: job.id, timings: { total: 999 } },
          "complete",
        )
      ).status,
      200,
    );
    const stored = await db
      .prepare("SELECT provenance, timings FROM analysis_jobs WHERE id = ?")
      .bind(job.id)
      .first<{ provenance: string; timings: string }>();
    assert.deepEqual(JSON.parse(stored!.provenance), provenance);
    assert.deepEqual(JSON.parse(stored!.timings), timings);
  });
  it("reserves atomically across tabs, completes once and rejects overspending", async () => {
    const guest = await session();
    const jobs = Array.from({ length: 5 }, newJob);
    const responses = await Promise.all(
      jobs.map((job) => jobRequest(guest.cookie, job)),
    );
    assert.equal(responses.filter((r) => r.status === 200).length, 3);
    assert.equal(responses.filter((r) => r.status === 409).length, 2);
    const index = responses.findIndex((r) => r.status === 200);
    assert.equal((await jobRequest(guest.cookie, jobs[index])).status, 200);
    for (let i = 0; i < 2; i++)
      assert.equal(
        (await jobRequest(guest.cookie, { id: jobs[index].id }, "complete"))
          .status,
        200,
      );
    const balance = guestUsageSchema.parse(
      await (await usage(guest.cookie)).json(),
    ).allowance;
    assert.equal(balance.usedVideos, 1);
    assert.equal(balance.reservedVideos, 2);
    assert.equal(balance.remainingVideos, 0);
    await jobRequest(guest.cookie, { id: jobs[index].id }, "cancel");
    assert.equal(
      guestUsageSchema.parse(await (await usage(guest.cookie)).json()).allowance
        .usedVideos,
      1,
    );
  });
  it("cancels without spending, enforces ownership and expires abandoned reservations", async () => {
    const a = await session(),
      b = await session(),
      job = newJob();
    await jobRequest(a.cookie, job);
    assert.equal(
      (await jobRequest(b.cookie, { id: job.id }, "complete")).status,
      404,
    );
    await jobRequest(a.cookie, { id: job.id }, "cancel");
    assert.equal(
      guestUsageSchema.parse(await (await usage(a.cookie)).json()).allowance
        .remainingVideos,
      3,
    );
    const abandoned = newJob();
    await jobRequest(a.cookie, abandoned);
    await db
      .prepare("UPDATE analysis_jobs SET expires_at = 1 WHERE id = ?")
      .bind(abandoned.id)
      .run();
    assert.equal(
      guestUsageSchema.parse(await (await usage(a.cookie)).json()).allowance
        .remainingVideos,
      3,
    );
    assert.equal(
      (
        (await (
          await jobRequest(a.cookie, { id: abandoned.id }, "complete")
        ).json()) as { status: string }
      ).status,
      "expired",
    );
  });
  it("validates source size, origin, identity and heartbeat state", async () => {
    const guest = await session(),
      job = newJob();
    assert.equal(
      (await jobRequest(guest.cookie, { ...job, fileBytes: 2_000_000_001 }))
        .status,
      400,
    );
    assert.equal((await jobRequest("", job)).status, 401);
    assert.equal(
      (
        await app.request(
          "http://localhost:8787/api/analysis-jobs",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: guest.cookie,
            },
            body: JSON.stringify(job),
          },
          env,
        )
      ).status,
      403,
    );
    await jobRequest(guest.cookie, job);
    await db
      .prepare("UPDATE analysis_jobs SET expires_at = ? WHERE id = ?")
      .bind(Math.floor(Date.now() / 1000) + 10, job.id)
      .run();
    await jobRequest(guest.cookie, { id: job.id }, "heartbeat");
    assert.ok(
      (await db
        .prepare("SELECT expires_at FROM analysis_jobs WHERE id = ?")
        .bind(job.id)
        .first<number>("expires_at"))! >
        Math.floor(Date.now() / 1000) + 800,
    );
  });
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });
  const publicOrigin = "https://moment-lark.example";
  const publicEnv = (): Bindings => ({
    ...env,
    GUEST_MODE: "public",
    APP_ORIGIN: publicOrigin,
    TURNSTILE_SITE_KEY: "public-site-key",
    TURNSTILE_SECRET: "private-test-secret",
    NETWORK_HASH_SECRET: "private-network-key-long-enough-32-characters",
    NETWORK_GUESTS_PER_DAY: "3",
    NETWORK_VIDEOS_PER_DAY: "9",
  });
  function publicRequest(
    path: string,
    body?: unknown,
    cookie?: string,
    bindings = publicEnv(),
    extraHeaders: Record<string, string> = {},
  ) {
    return app.request(
      publicOrigin + "/api/" + path,
      {
        method: body === undefined ? "GET" : "POST",
        headers: {
          Origin: publicOrigin,
          "Content-Type": "application/json",
          "CF-Connecting-IP": "192.0.2.10",
          ...(cookie ? { Cookie: cookie } : {}),
          ...extraHeaders,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      },
      bindings,
    );
  }
  function mockVerify(overrides: Record<string, unknown> = {}) {
    globalThis.fetch = async (url, init) => {
      if (
        String(url) !==
        "https://challenges.cloudflare.com/turnstile/v0/siteverify"
      )
        return originalFetch(url, init);
      assert.equal(
        JSON.parse(String(init?.body)).secret,
        "private-test-secret",
      );
      return Response.json({
        success: true,
        hostname: "moment-lark.example",
        action: "guest_session",
        challenge_ts: new Date().toISOString(),
        ...overrides,
      });
    };
  }
  async function publicSession(
    token = crypto.randomUUID(),
    bindings = publicEnv(),
  ) {
    const response = await publicRequest(
      "guest/session",
      { turnstileToken: token },
      undefined,
      bindings,
    );
    assert.equal(response.status, 201, await response.clone().text());
    return {
      cookie: response.headers.get("set-cookie")!.split(";")[0],
      header: response.headers.get("set-cookie")!,
      usage: guestUsageSchema.parse(await response.json()),
    };
  }
  it("requires production secrets, exact HTTPS origin and public mode before issuing challenges", async () => {
    for (const overrides of [
      { TURNSTILE_SECRET: undefined },
      { NETWORK_HASH_SECRET: undefined },
      { DB: undefined },
      { APP_ORIGIN: "https://different.example" },
      { GUEST_MODE: "local" },
    ]) {
      assert.equal(
        (
          await publicRequest("guest/challenge", undefined, undefined, {
            ...publicEnv(),
            ...overrides,
          })
        ).status,
        503,
      );
    }
    assert.equal(
      (
        await app.request(
          "http://moment-lark.example/api/guest/challenge",
          {},
          publicEnv(),
        )
      ).status,
      503,
    );
    const response = await publicRequest("guest/challenge");
    assert.deepEqual(await response.json(), {
      siteKey: "public-site-key",
      action: "guest_session",
    });
    assert.equal((await publicRequest("guest/session", {})).status, 403);
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM guests").first("n"),
      0,
    );
  });
  it("verifies guests, uses host-only Secure cookies and reuses sessions without another challenge", async () => {
    mockVerify();
    const guest = await publicSession();
    assert.match(guest.header, /__Host-ml_guest=/);
    assert.match(guest.header, /Secure/);
    assert.match(guest.header, /HttpOnly/);
    assert.match(guest.header, /SameSite=Strict/i);
    assert.doesNotMatch(guest.header, /Domain=/i);
    assert.equal(guest.usage.mode, "public");
    const reused = await publicRequest("guest/session", {}, guest.cookie);
    assert.equal(reused.status, 200);
    assert.equal(reused.headers.get("set-cookie"), null);
    assert.deepEqual(await reused.json(), guest.usage);
    const row = await db
      .prepare("SELECT token_digest FROM turnstile_redemptions")
      .first<{ token_digest: string }>();
    assert.match(row!.token_digest, /^[a-f0-9]{64}$/);
    assert.equal(
      (
        await publicRequest("guest/session", {}, guest.cookie, publicEnv(), {
          Origin: "https://evil.example",
        })
      ).status,
      403,
    );
  });
  it("rejects failed, expired, wrong-action and wrong-hostname verification without granting allowance", async () => {
    for (const overrides of [
      { success: false },
      { hostname: "localhost" },
      { hostname: "dev.moment-lark.example" },
      { action: "another_form" },
      { challenge_ts: new Date(Date.now() - 600000).toISOString() },
    ]) {
      mockVerify(overrides);
      assert.equal(
        (
          await publicRequest("guest/session", {
            turnstileToken: crypto.randomUUID(),
          })
        ).status,
        403,
      );
    }
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM guests").first("n"),
      0,
    );
    assert.equal(
      await db
        .prepare("SELECT count(*) AS n FROM turnstile_redemptions")
        .first("n"),
      0,
    );
  });
  it("rejects replay even when concurrent Siteverify responses both succeed", async () => {
    mockVerify();
    const token = crypto.randomUUID();
    const responses = await Promise.all(
      Array.from({ length: 2 }, () =>
        publicRequest("guest/session", { turnstileToken: token }),
      ),
    );
    assert.deepEqual(responses.map((r) => r.status).sort(), [201, 403]);
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM guests").first("n"),
      1,
    );
    assert.equal(
      await db
        .prepare("SELECT count(*) AS n FROM turnstile_redemptions")
        .first("n"),
      1,
    );
    assert.equal(
      (await publicRequest("guest/session", { turnstileToken: token })).status,
      403,
    );
  });
  it("bounds guest issuance across fresh cookies and preserves existing sessions at the cap", async () => {
    mockVerify();
    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        publicRequest("guest/session", { turnstileToken: crypto.randomUUID() }),
      ),
    );
    assert.equal(responses.filter((r) => r.status === 201).length, 3);
    assert.equal(responses.filter((r) => r.status === 429).length, 2);
    const cookie = responses
      .find((r) => r.status === 201)!
      .headers.get("set-cookie")!
      .split(";")[0];
    assert.equal(
      (await publicRequest("guest/session", {}, cookie)).status,
      200,
    );
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM guests").first("n"),
      3,
    );
    assert.equal(
      await db
        .prepare("SELECT count(*) AS n FROM turnstile_redemptions")
        .first("n"),
      3,
    );
  });
  it("rate-limits failed challenges without spending a guest video slot", async () => {
    mockVerify({ success: false });
    for (let i = 0; i < 10; i++)
      assert.equal(
        (
          await publicRequest("guest/session", {
            turnstileToken: crypto.randomUUID(),
          })
        ).status,
        403,
      );
    const blocked = await publicRequest("guest/session", {
      turnstileToken: crypto.randomUUID(),
    });
    assert.equal(blocked.status, 429);
    assert.ok(blocked.headers.has("retry-after"));
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM guests").first("n"),
      0,
    );
  });
  it("fails closed on verification outage or absent trusted client IP", async () => {
    globalThis.fetch = async (url, init) =>
      String(url).includes("siteverify")
        ? Response.json({}, { status: 503 })
        : originalFetch(url, init);
    const result = await publicRequest("guest/session", {
      turnstileToken: "test-token",
    });
    assert.equal(result.status, 503);
    assert.doesNotMatch(await result.text(), /private-test-secret|test-token/);
    mockVerify();
    assert.equal(
      (
        await publicRequest(
          "guest/session",
          { turnstileToken: "token" },
          undefined,
          publicEnv(),
          { "CF-Connecting-IP": "" },
        )
      ).status,
      503,
    );
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM guests").first("n"),
      0,
    );
  });
  it("atomically reserves a network allowance across guests and refunds cancelled or expired jobs", async () => {
    mockVerify();
    const bindings = { ...publicEnv(), NETWORK_VIDEOS_PER_DAY: "2" };
    const a = await publicSession(crypto.randomUUID(), bindings),
      b = await publicSession(crypto.randomUUID(), bindings);
    const jobs = Array.from({ length: 4 }, newJob);
    const cookies = [a.cookie, b.cookie, a.cookie, b.cookie];
    const responses = await Promise.all(
      jobs.map((job, i) =>
        publicRequest("analysis-jobs", job, cookies[i], bindings),
      ),
    );
    assert.equal(responses.filter((r) => r.status === 200).length, 2);
    assert.equal(responses.filter((r) => r.status === 409).length, 2);
    const accepted = responses.flatMap((r, i) => (r.status === 200 ? [i] : []));
    const one = accepted[0],
      two = accepted[1];
    for (let i = 0; i < 2; i++)
      assert.equal(
        (
          await publicRequest(
            "analysis-jobs/complete",
            { id: jobs[one].id },
            cookies[one],
            bindings,
          )
        ).status,
        200,
      );
    await publicRequest(
      "analysis-jobs/cancel",
      { id: jobs[two].id },
      cookies[two],
      bindings,
    );
    const fresh = newJob();
    assert.equal(
      (await publicRequest("analysis-jobs", fresh, a.cookie, bindings)).status,
      200,
    );
    await db
      .prepare("UPDATE analysis_jobs SET expires_at = 1 WHERE id = ?")
      .bind(fresh.id)
      .run();
    assert.equal(
      (await publicRequest("analysis-jobs", newJob(), b.cookie, bindings))
        .status,
      200,
    );
    const balance = await db
      .prepare(
        "SELECT used, reserved FROM network_windows WHERE id = (SELECT network_window FROM analysis_jobs WHERE id = ?)",
      )
      .bind(jobs[one].id)
      .first();
    assert.deepEqual(balance, { used: 1, reserved: 1 });
  });
  it("network identifiers are keyed and window-specific, not raw IPs", async () => {
    const a = await networkWindow("secret-one", "192.0.2.1", 86401, "analysis");
    assert.equal(a.expiresAt, 172800);
    assert.match(a.id, /^[a-f0-9]{64}$/);
    assert.notEqual(
      a.id,
      (await networkWindow("secret-one", "192.0.2.1", 172801, "analysis")).id,
    );
    assert.notEqual(
      a.id,
      (await networkWindow("secret-two", "192.0.2.1", 86401, "analysis")).id,
    );
  });

  it("cleans expired protection records and leases without deleting guests or completed history", async () => {
    mockVerify();
    const guest = await publicSession();
    const job = newJob();
    await publicRequest("analysis-jobs", job, guest.cookie);
    await db
      .prepare("UPDATE analysis_jobs SET expires_at = 1 WHERE id = ?")
      .bind(job.id)
      .run();
    await db.prepare("UPDATE turnstile_redemptions SET expires_at = 1").run();
    await db.prepare("UPDATE network_windows SET expires_at = 1").run();
    await maintainGuestRecords(db, Math.floor(Date.now() / 1000));
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM guests").first("n"),
      1,
    );
    assert.equal(
      await db
        .prepare("SELECT status FROM analysis_jobs WHERE id = ?")
        .bind(job.id)
        .first("status"),
      "expired",
    );
    assert.equal(
      await db
        .prepare("SELECT count(*) AS n FROM turnstile_redemptions")
        .first("n"),
      0,
    );
    assert.equal(
      await db.prepare("SELECT count(*) AS n FROM network_windows").first("n"),
      1,
    );
    const usage = guestUsageSchema.parse(
      await (
        await publicRequest("guest/usage", undefined, guest.cookie)
      ).json(),
    );
    assert.equal(usage.allowance.remainingVideos, 3);
  });
});
