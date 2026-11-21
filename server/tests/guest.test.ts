import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, describe, it } from "node:test";
import { Miniflare } from "miniflare";
import app from "../index";
import type { Bindings } from "../types";
import { guestUsageSchema } from "../../shared/contracts/guest";
import { digestSessionToken } from "../services/guest-session";
import { insertGuestSession } from "../repositories/guests";

describe("guest API with local D1", () => {
  let runtime: Miniflare;
  let db: D1Database;
  let env: Bindings;

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
            env: { DB: { type: "d1", id: "guest-test-db" } },
          },
        },
      ],
    });
    db = (await runtime.getD1Database("DB")) as unknown as D1Database;
    const migration = await readFile(
      new URL("../db/migrations/0001_guests.sql", import.meta.url),
      "utf8",
    );
    await db.batch(
      migration
        .split(";")
        .map((sql) => sql.trim())
        .filter(Boolean)
        .map((sql) => db.prepare(sql)),
    );
    env = {
      DB: db,
      GUEST_MODE: "local",
      GUEST_ALLOWANCE_SECONDS: "1800",
      APP_ORIGIN: "http://localhost:3000",
    };
  });
  after(async () => {
    await runtime?.dispose();
  });
  beforeEach(async () => {
    await db.batch([
      db.prepare("DELETE FROM guest_sessions"),
      db.prepare("DELETE FROM guests"),
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
    assert.equal(guest.usage.allowance.remainingSeconds, 1800);
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
        "UPDATE guests SET used_seconds = 300, reserved_seconds = 120 WHERE id = ?",
      )
      .bind(guest.usage.guest.id)
      .run();
    const response = await create(
      guest.cookie,
      {},
      { ...env, GUEST_ALLOWANCE_SECONDS: "3600" },
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("set-cookie"), null);
    const returned = guestUsageSchema.parse(await response.json());
    assert.equal(returned.guest.id, guest.usage.guest.id);
    assert.deepEqual(returned.allowance, {
      grantedSeconds: 1800,
      usedSeconds: 300,
      reservedSeconds: 120,
      remainingSeconds: 1380,
    });
    assert.equal(
      await db.prepare("SELECT count(*) AS count FROM guests").first("count"),
      1,
    );
  });

  it("upgrades local test grants to 90 minutes without resetting usage", async () => {
    const guest = await session();
    await db
      .prepare(
        "UPDATE guests SET used_seconds = 300, reserved_seconds = 120 WHERE id = ?",
      )
      .bind(guest.usage.guest.id)
      .run();
    const migration = await readFile(
      new URL(
        "../db/migrations/0002_local_guest_allowance.sql",
        import.meta.url,
      ),
      "utf8",
    );
    await db.prepare(migration).run();
    await db.prepare(migration).run();
    const returned = guestUsageSchema.parse(
      await (await usage(guest.cookie)).json(),
    );
    assert.equal(returned.guest.id, guest.usage.guest.id);
    assert.deepEqual(returned.allowance, {
      grantedSeconds: 5400,
      usedSeconds: 300,
      reservedSeconds: 120,
      remainingSeconds: 4980,
    });
    const fresh = await create(
      undefined,
      {},
      { ...env, GUEST_ALLOWANCE_SECONDS: "5400" },
    );
    assert.equal(
      guestUsageSchema.parse(await fresh.json()).allowance.remainingSeconds,
      5400,
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
      (await create(undefined, { body: '{"allowanceSeconds":999999}' })).status,
      400,
    );
    assert.equal(
      (await create(undefined, { body: " ".repeat(1025) })).status,
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
      { ...env, GUEST_ALLOWANCE_SECONDS: "invalid" },
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
        .prepare("UPDATE guests SET used_seconds = 1801 WHERE id = ?")
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
        allowanceSeconds: 1800,
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
});
