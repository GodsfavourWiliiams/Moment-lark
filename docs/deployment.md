# Connecting Moment Lark to Cloudflare

Updated 21 November 2026. The repository contains the public guest implementation and separate database bindings. Cloud resources are not ready merely because a build passes: apply migrations, configure secrets, deploy, and verify the real widget and guest flow.

## Which environment uses which database?

| Environment | Worker | D1 database | Wrangler selector |
| --- | --- | --- | --- |
| Production | `moment-lark` | `moment-lark-production` | `--config wrangler.jsonc` (no named environment) |
| Deployed development | `dev-moment-lark` | `moment-lark-dev` | `--config wrangler.jsonc --env dev` |
| Local machine | local API on port 8787 | local SQLite-backed D1 simulation | `--config wrangler.local.jsonc --local` |

Production ID: `f2d65328-234b-4a31-9adb-35a984520a71`. Dev ID: `78ded81a-62cd-4fd9-b532-93b86b58c647`. IDs and the Turnstile site key are identifiers, not passwords. Both deployments use binding `DB`, but the binding points to a different database. Tests use a third disposable database. Do not copy production data into tests.

## Configuration versus secrets

`wrangler.jsonc` is JSON configuration. `d1_databases` connects a resource, and `vars` supplies normal runtime settings. The public site key is delivered to the frontend through `/api/guest/challenge`, so changing it does not require a Next.js build-time environment variable. No database password or connection string is needed.

Two secrets must be set separately on **each** deployed Worker:

- `TURNSTILE_SECRET`: the secret belonging to the configured widget. Cloudflare uses it to verify challenge tokens. Never put it in `NEXT_PUBLIC_*`, source control, screenshots or chat.
- `NETWORK_HASH_SECRET`: an independent random value, at least 32 characters, used as an HMAC key to turn a network address into a window-specific pseudonymous identifier. Raw IPs are not stored in D1. Use different values for dev and production. Rotating this secret resets the association with existing network counters; do not regenerate it on each build.

Set secrets through Workers & Pages → the specific Worker → Settings → Variables and Secrets → Add → Secret. Existing secrets survive regular code deployments. For CLI setup, after `npx wrangler login`, these commands prompt for the Turnstile secret without putting it in a command argument:

```sh
npx wrangler secret put TURNSTILE_SECRET --config wrangler.jsonc
npx wrangler secret put TURNSTILE_SECRET --config wrangler.jsonc --env dev
```

These commands generate and send independent random network secrets directly to Wrangler, without printing their values. Run only once per environment, after checking whether a secret already exists:

```sh
openssl rand -hex 32 | npx wrangler secret put NETWORK_HASH_SECRET --config wrangler.jsonc
openssl rand -hex 32 | npx wrangler secret put NETWORK_HASH_SECRET --config wrangler.jsonc --env dev
```

For local development, `wrangler.local.jsonc` keeps `GUEST_MODE=local`, loopback-only access and no Turnstile dependency. Private local values, if needed later, belong in ignored `.dev.vars` files; they do not automatically configure deployed Workers.

## Understand the database operations before running them

SQL is the language used to read and change database records. TypeScript is the language of our backend; Wrangler is the CLI that sends deployment and database-management requests to Cloudflare.

| Command | What it does |
| --- | --- |
| `SELECT` | Reads records or schema information. Does not modify application data. |
| `CREATE TABLE` | Defines a new table and its columns. |
| `CREATE INDEX` | Adds a lookup structure to avoid scanning every row. |
| `INSERT` | Adds records, such as a guest or an analysis reservation. |
| `UPDATE` | Changes existing records, such as reserved → completed. |
| `ALTER TABLE` | Changes a table's columns. |
| `CREATE TRIGGER` | Defines SQL that runs automatically with a related insert/update. |
| `DELETE` | Removes matching records. |
| `DROP TABLE` | Removes an entire table. Migration 0003 drops only its temporary validation table. |

First inspect the remote schema with a read-only query (repeat with the production name/config when ready):

```sh
npx wrangler d1 execute moment-lark-dev --remote --config wrangler.jsonc --env dev --command "SELECT name, type FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name;"
```

`--remote` means the real Cloudflare database. `--local` means this computer's simulation. Never omit environment selection when you mean deployed dev.

Migrations are numbered SQL files. Wrangler tracks applied filenames in `d1_migrations` so they are not rerun on every deployment. If a database already contains application tables, compare them and its migration history before applying anything. A list command may initialize Wrangler's migration tracking table; it does not apply application migrations.

| Migration | Effect |
| --- | --- |
| 0001 | Creates guests, session-token digests and session indexes. |
| 0002 | Historical local-test minute allowance update; on a new empty DB it changes no guest rows. |
| 0003 | Converts the unused historical minute columns to video counts. A temporary CHECK guard stops migration if unexpected old usage exists. It does not silently discard usage. |
| 0004 | Creates analysis jobs and triggers that reserve/settle guest video counts atomically. |
| 0005 | Adds prompt/model provenance and stage timings; no video or transcript content. |
| 0006 | Adds network counters and used-token digests, plus the analysis-job network reference and settlement triggers. Existing jobs keep a null network reference. |

After reviewing the pending migrations, apply to dev first:

```sh
npx wrangler d1 migrations list moment-lark-dev --remote --config wrangler.jsonc --env dev
npx wrangler d1 migrations apply moment-lark-dev --remote --config wrangler.jsonc --env dev
```

Only after dev is verified, repeat for production:

```sh
npx wrangler d1 migrations list moment-lark-production --remote --config wrangler.jsonc
npx wrangler d1 migrations apply moment-lark-production --remote --config wrangler.jsonc
```

## Guest authorization and limits

1. A valid returning session reads its balance without a new challenge.
2. A new guest receives the public widget configuration. The browser obtains a Turnstile token.
3. The Worker validates the token with Siteverify and checks the exact deployment hostname, `guest_session` action, success and timestamp. A production request cannot use a token verified for localhost or dev.
4. A transaction redeems the token once, counts issuance and creates the guest/session. Only a digest is stored. Concurrent duplicate submissions cannot grant two allowances even if Siteverify accepts both.
5. A Secure/HttpOnly/SameSite host-only cookie identifies the guest. The frontend cannot read it.
6. Starting analysis reserves both guest and network capacity atomically. Completion spends it once; cancellation/expiry releases both. Media and transcripts stay local.

Initial configurable beta settings: three videos per guest, 2 GB per source, no duration cap or scheduled guest reset. Network buckets allow three new guests/day and nine completed-or-reserved videos/day; additionally, at most 10 verification attempts and 30 new analysis requests per ten minutes. Network windows use UTC boundaries and never reset an existing guest's used count. Shared networks can hit these caps; they are abuse controls, not proof of a unique person or a promise of lifetime per-person metering. Sessions expire after seven days. IP changes/VPNs and distributed attacks are not eliminated by Turnstile.

An hourly scheduled handler expires abandoned leases and deletes up to 500 expired verification-token records and 500 expired, unreferenced network counters per run. It retains guests, allowances, jobs and diagnostics. Long-term retention/deletion of those records needs a separate policy; no automatic erasure of user balances is introduced.

## Build and deploy

The project pins `pnpm@12.11.2` in `package.json` so local commands and Cloudflare Builds use the same package manager. Install with `pnpm install --frozen-lockfile`. Commit `pnpm-workspace.yaml` with `package.json` and `pnpm-lock.yaml`: pnpm 12 reads overrides from the workspace file, not the old `package.json` `pnpm` field. The separate npm `overrides` entry remains for npm users.

The workspace file explicitly permits the pinned esbuild/workerd setup scripts and skips the Node-only ONNX CUDA installer and protobufjs install hook. Its release-age exceptions apply only to the four Cloudflare tooling versions already locked before this migration; other packages and future versions retain pnpm's checks.

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run check:deploy:dev
npm run check:deploy
```

Dry runs bundle and validate configuration without publishing or applying SQL. For Cloudflare Git builds, use `pnpm run build` as the build command. Configure the deployed dev Worker to run `npx wrangler deploy --config wrangler.jsonc --env dev`; configure production/master to run `npx wrangler deploy --config wrangler.jsonc`. The equivalent local scripts are `npm run deploy:dev` and `npm run deploy:production`.

Branch-preview URLs are not automatically trusted origins and should not be used as public guest environments. Use the stable dev URL for testing. Never connect a branch preview to the production ledger. Do not remove the `--env dev` selector from dev deployment commands.

Before release, verify the real dev widget, reload/session reuse, a local video analysis through Suggestions, cancellation/refund, exhausted quota and error recovery. Tests mock Siteverify to exercise rejection and concurrency; they do not certify the real hosted widget. The public APIs return unavailable if required configuration/secrets are missing, rather than bypassing verification.

References: [D1 bindings](https://developers.cloudflare.com/d1/get-started/), [migrations](https://developers.cloudflare.com/d1/reference/migrations/), [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [D1 free limits](https://developers.cloudflare.com/d1/platform/limits/).
