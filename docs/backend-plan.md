# MVP backend: stack, guest limits and learning path

Updated 21 November 2026. Local and public guest sessions, analysis reservations, Turnstile verification and network counters are implemented. Remote activation still requires secrets, migrations and a real hosted-widget check. Follow [the deployment walkthrough](deployment.md). This accompanies the [MVP checklist](mvp-plan.md) and [product tiers](product-tiers.md).

## First working slice: local guest sessions

Start `npm run dev` and `npm run dev:api` in separate terminals, then open `http://localhost:3000`. The API command applies the versioned local D1 migration before starting Wrangler on port 8787. No Cloudflare login, remote database, AI key, or paid service is needed for this local slice. Use Node.js 24 as in CI.

Follow a request through the code:

1. `src/features/guest/index.tsx` displays loading, allowance, unavailable, or retry states with the existing Tailwind tokens.
2. `src/hooks/use-guest.ts` manages the lifecycle; `src/state/guest.ts` stores the UI result.
3. `src/services/guest.ts` asks `GET /api/guest/usage`. Only a `401 session_required` triggers `POST /api/guest/session`; outages do not create replacement identities. It then verifies that the browser retained the cookie. In-flight initialization is deduplicated, and browsers supporting Web Locks coordinate initialization across tabs.
4. Next.js proxies local API requests to Wrangler. The deployed Worker handles `/api/*` directly alongside the exported site.
5. `server/routes/guest.ts` validates Origin, request size/type/body, and the local-only policy. `shared/contracts/guest.ts` defines the public data shape; clients cannot choose their allowance.
6. `server/services/guest-session.ts` generates a random token and hashes it. `server/repositories/guests.ts` uses parameterized SQL and one transactional batch to create the guest and session together.
7. D1 returns the stored grant, used and reserved video counts; the server calculates the remaining allowance. Only the opaque token goes into an HttpOnly cookie. The browser cannot read it through JavaScript.

The approved local grant is **three source videos**, configured as `GUEST_ALLOWANCE_VIDEOS: "3"` in `wrangler.local.jsonc`, with no scheduled reset. Each imported file is limited to **2 GB (2,000,000,000 bytes)** by `src/lib/media/source-limits.ts`; there is no fixed duration cap. File size and processing time are not interchangeable. Configuration changes affect new guests. Migration `0003` converts the unused minute ledger to video counts, preserving IDs and sessions. It fails rather than discarding unexpected old usage. Local sessions expire after seven days; expiry/cleared cookies can create a fresh guest, so this is not a lifetime per-person limit. Local HTTP cookies omit Secure; HTTPS sets it. Production issuance needs the hardened cookie and abuse policy.

Implemented tables: `guests`, `guest_sessions`, and `analysis_jobs`, managed by versioned files in `server/db/migrations/`.

An analysis job is one attempt to analyze a source. `POST /api/analysis-jobs` atomically inserts a reservation only if a slot remains. SQL triggers update the guest balance in the same database operation; competing tabs cannot overspend. The job ID makes retries idempotent. Ownership always comes from the cookie, never a client-provided guest ID. Only UUIDs, declared file size, timestamps, status, model/prompt versions and numeric stage timings reach D1. Migration `0005_analysis_diagnostics.sql` adds nullable JSON columns for version provenance and completion timings, preserving existing jobs. These explain which configuration produced a result and where processing time went without storing its content. Strict request schemas reject extra transcript fields; retries cannot overwrite the first completion timings. The browser keeps all media, captions and AI evidence.

`heartbeat` renews a 15-minute lease once a minute. `complete` changes one reserved slot to used; `cancel` releases it. Reading usage or starting/updating a job expires abandoned reservations. There is no daily allowance reset. A network failure can hold a slot until lease expiry. Completion and file size are browser-reported: this is a product allowance, not trusted metering or proof of AI execution. Re-importing creates a new source; reopening/editing/exporting the current source creates no job.

Guest routes use loopback-only local mode or exact-origin HTTPS public mode. Public mode requires the D1 binding, allowance settings, Turnstile keys and a network-hashing secret; missing settings return `503 guest_unavailable`. Production and deployed dev have separate D1 bindings. Preview URLs are not automatically trusted. This local slice deliberately does not claim incognito/IP protection: a new cookie can create another local guest. Expired records are retained in the local development database; production cleanup/retention must be implemented before launch.

Validation includes real local D1 tests for session reuse, expiry, guest isolation, token hashing, cookie flags, origin checks, bad payloads, transaction rollback, invalid configuration, and safe database errors. The client tests cover duplicate initialization, outage behavior, and blocked cookies. Tests additionally cover concurrent reservation, idempotent completion, cancellation, expiry, heartbeat renewal and ownership. Import first reads metadata and displays a preflight with download costs and short/long-video guidance. Only clicking Start local analysis reserves a slot and invokes the models. Validated results and completion acknowledgment automatically open Suggestions.

## The stack we will use

| Tool/service | Job in Moment Lark | Plain-language explanation |
| --- | --- | --- |
| TypeScript | Backend language as well as frontend language | Use familiar types, functions, promises and fetch; learn server responsibilities without another language. |
| Hono | HTTP routes and middleware | Connect a URL such as `/api/guest/session` to the function that handles it. |
| Cloudflare Workers | Run backend code | Cloudflare executes our request handlers; we do not maintain a server machine. This is a Workers runtime, not a conventional Node.js server. |
| Cloudflare D1 | SQL database | Store guest records, balances, reservations and network counters. Use parameterized SQL through the D1 binding initially; no ORM needed for the first small schema. |
| Cloudflare Turnstile | Bot challenge | Slow automated creation of guest sessions. Verify every submitted challenge token on the backend; it is not proof of a unique person. |
| Zod | Runtime input validation | Check incoming JSON; TypeScript types alone cannot validate an HTTP request. |
| Wrangler | Local development and deployment | Run the Worker and local D1, configure bindings/secrets, then deploy. |
| Workers Static Assets | Host the existing Next.js export | Serve `out/` alongside the API on one origin. |

Sources: [Workers TypeScript](https://developers.cloudflare.com/workers/languages/typescript/), [Hono on Workers](https://hono.dev/docs/getting-started/cloudflare-workers), [D1 API and transactional batches](https://developers.cloudflare.com/d1/worker-api/d1-database/), [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

The repository already exports Next.js and deploys Workers Static Assets. Keep that architecture: add a Worker entry point and route `/api/*` to it using `assets.run_worker_first`; serve exported pages as assets. Unknown API paths return JSON 404s. Next.js static export cannot execute request-time API handlers. No OpenNext adapter is required for this plan. See [Worker/asset routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/) and [Next.js static export limitations](https://nextjs.org/docs/app/guides/static-exports).

## What stays where

```mermaid
flowchart TD
    A[Browser imports video locally] --> B[Request guest session and allowance]
    B --> C[Worker checks cookie, network limits and challenge]
    C --> D[(D1 guest and network ledgers)]
    D --> E{Reserve analysis allowance?}
    E -->|No| F[Show limit or retry time]
    E -->|Yes| G[Browser transcribes speech and detects sounds]
    G --> H[Local model proposes moments]
    H --> I[Review, edit, save locally and export]
    H --> J[Report job status to backend]
    J --> D
```

Only session, allowance and minimal job metadata go to our API. Guest video/audio, transcripts, clips and project content stay on the device. Model downloads still require network access initially. New analysis requires online authorization; existing local editing/export need not depend on the API. The browser performs heavy computation; Workers is not the AI/video processing machine.

## Guest and IP policy

Use **guest video slots plus a shared network allowance**. This explicitly addresses a user reopening the app in incognito on the same connection.

1. Read the connecting IP at the trusted Cloudflare ingress, not from JSON or a client-supplied forwarding header. Canonicalize IPv4/IPv6 and derive a network key using HMAC with a server secret. Validate the deployed proxy/Worker path; do not assume every forwarded header is trustworthy.
2. Issue a random session token in a host-only Secure, HttpOnly, SameSite cookie. Store a digest of the token, with expiry, attached to a guest record. A cookie identifies a session; an IP is a network grouping.
3. Associate the session/job with that network key. Independently cap new guest issuance per network/time window and aggregate video analyses per network/window. Keep each guest's own credit balance too.
4. Before analysis, reserve against both balances in one atomic database operation. A new incognito guest does not reset the existing network bucket. A challenge may permit session creation but never clears a spent allowance.
5. Keep the same guest ledger if a recognized guest changes network; check the new network bucket too. Bind each reservation to the bucket used at authorization so later completion/refunds update the original bucket.
6. Never recover an old guest cookie, reveal their balance/history, or grant access to their jobs solely because an IP matches. Different people on the same Wi-Fi remain separate guests.
7. Return a clear `429` response and retry time for a temporary network cap. Account-based exemptions can be added when accounts exist; do not offer a sign-in button before it works.

**Example, not final policy:** suppose a network permits six source-video analyses per day. After four successful analyses, a new incognito guest can use at most the two remaining network slots, subject to that guest's own allowance. Other people on the same Wi-Fi share that network budget. This is distinct from the approved local three-video guest grant and still needs a production policy.

The local three-video grant and 2 GB file cap are selected. Production guest expiry, network budget, issuance rate and reset window remain configurable product decisions. Start with canonical full-address keys; benchmark IPv6 prefix grouping before adopting it because grouping blocks more unrelated users. Full-address keys can be evaded by IPv6 address rotation. VPNs, mobile networks and changing IPs can also bypass network-only controls; carrier NAT may group many people. No lifetime one-trial-per-human guarantee. Account sign-in gives continuity for the same account, while multiple-account abuse remains separate.

Proposed network retention: keep counters only for the active allowance window plus a short operational recovery period; choose and document the exact period before launch. Keep HMAC key versions stable for active windows so rotation does not silently reset limits. Do not log raw IPs, cookies, transcripts or filenames in application logs. HMAC keys are pseudonymous, not anonymous. Explain network-based abuse controls in the product privacy notice.

Sources: [Cloudflare connecting-IP header and proxy caveats](https://developers.cloudflare.com/fundamentals/reference/http-headers/), [IP and request rate-limiting use cases](https://developers.cloudflare.com/waf/rate-limiting-rules/best-practices/). Our durable allowance ledger is application logic in D1; this plan does not require a paid WAF package.

## API and data design

| Endpoint | Purpose |
| --- | --- |
| `POST /api/guest/session` | Reuse a valid session or issue one subject to network issuance limits and challenge policy. |
| `GET /api/guest/usage` | Return this guest's allowance and applicable limit status, with no other guests' details. |
| `POST /api/analysis/reservations` | Validate source identity/size metadata and atomically reserve one guest video slot plus network capacity; require an idempotency key. |
| `POST /api/analysis/jobs/:id/complete` | Settle a reservation once; verify guest ownership. |
| `POST /api/analysis/jobs/:id/cancel` | Apply the cancellation/failure policy once; verify ownership. |

Initial tables: `guests`, `guest_sessions`, `network_windows`, `analysis_jobs` and `usage_events`. Index token digests, expiry, network/window keys and guest/job IDs. Jobs record the source identity/size, policy version, reserved network bucket, expiry and state. Unique request keys and database constraints prevent duplicate reservations/settlements.

Atomic means guest and network reservations either both succeed or neither changes. Use conditional SQL plus a D1 transactional batch and constraints; a zero-row update is not itself a SQL failure, so prove the entire invariant with concurrency tests. Never implement this as independent read-balance then write-balance requests. Recover expired reservations on subsequent access or scheduled cleanup, without refunding a completed job twice. Refund app failures, define cancellation/re-analysis rules, and throttle repeated reserve/cancel loops. Manual edits and exports do not consume another video slot.

Use server time, parameterized SQL, body-size limits, runtime validation, session ownership and origin/CSRF checks for mutations. Keep secrets outside `NEXT_PUBLIC_*`. New analysis should fail visibly if authorization is unavailable. Local computation and completion reports remain user-controlled: a backend cannot make downloaded models tamper-proof or verify actual processing duration without doing trusted work itself. Paid cloud services will need their own enforceable metering.

## Repository structure and remaining additions

Do not create placeholder directories until their first implementation is needed. Keep existing frontend folders and add:

```text
server/
  index.ts             Worker entry point and Hono route registration
  routes/              Guest and analysis HTTP handlers
  middleware/          Session, origin checks, request limits
  services/            Guest policy and reservation business logic
  repositories/        Parameterized D1 reads/writes
  db/migrations/       Versioned SQL migrations (guests/session tables implemented)
  tests/               API, ownership, quota and concurrency tests
shared/contracts/      Request/response schemas and safe shared types
src/services/          Frontend API client functions
src/hooks/             Guest balance and reservation lifecycle hooks
```

Use separate TypeScript configurations for server and browser code. Share contracts, not database implementations or secrets. Remove obsolete paths instead of retaining compatibility wrappers. Existing local app port 3000 should be reused; Wrangler's separate backend process can use its own port. Decide local API origin/proxy configuration during setup; production remains same-origin.

## What you need and what it costs

### Create the cloud resources with the generated Cloudflare URL

A purchased domain is not required. In **Workers & Pages → moment-lark**, copy the deployed `https://…workers.dev` URL. Use that exact origin for the public app configuration; Turnstile takes the hostname without `https://` or a path. Add the custom domain later when you own it.

1. Open **D1 SQL database → Create Database** in the Cloudflare dashboard. Name it `moment-lark-production` and create it. Copy its database ID. D1 is a real SQL database; the Worker accesses it using the `DB` binding rather than a database password in browser code.
2. Create a separate `moment-lark-preview` database for preview deployments. Keep `wrangler.local.jsonc` pointing to the local emulator; local development must not write production data.
3. Open **Turnstile → Add widget**. Name it `Moment Lark production`, select **Managed**, and add the exact deployed hostname. Choose the applicable visitor region. Keep pre-clearance off for this session-creation flow. Save the public site key and store the secret securely.
4. Share the app URL, database ID and public site key when configuring this repository. The secret belongs in a Cloudflare Worker secret, not chat, Git, or a `NEXT_PUBLIC_*` variable. These values do not enable public guests by themselves: server-side challenge verification, issuance/network limits and environment configuration still need implementation.
5. Once the correct production database is bound as `DB` with `migrations_dir: "server/db/migrations"`, apply the checked-in migrations with `npx wrangler d1 migrations apply DB --remote --config wrangler.jsonc`. This command changes the cloud database; do not run it against an unverified binding. The current repository configuration intentionally has no production database ID.

The migrations create the tables; there is no need to manually invent tables in the dashboard. Our guest/session/job records hold IDs, allowance counts and job state. Videos and transcripts stay in the browser. Turnstile supplies a short-lived challenge token that the backend must validate before issuing a public session; it does not identify a person or store videos.

Official setup: [create and bind D1](https://developers.cloudflare.com/d1/get-started/), [create a Turnstile widget](https://developers.cloudflare.com/turnstile/get-started/widget-management/dashboard/), [validate challenge tokens](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

- Use the existing Cloudflare account/deployment. Create development and production D1 databases; preview builds must never use production guest records or secrets.
- Create a Turnstile widget for deployed hostnames, using its test keys locally. The site key is public; the secret is server-only.
- Configure the D1 binding, Turnstile secret and IP-HMAC secret with Wrangler/Cloudflare. No AI provider key is needed for guest processing.
- Use a local D1 database while learning. No cloud media bucket, paid auth service or subscription processor is required for this MVP.

Published free allowances checked on 21 November 2026: Workers includes 100,000 requests/day with 10 ms CPU per invocation; D1 includes 5 million rows read/day, 100,000 written/day and 5 GB total storage. Turnstile has a free plan. These are app/account-level service limits, not credits for each guest. Keep queries indexed and benchmark request CPU. Development and a small test release may fit within free allowances; that is an estimate, not guaranteed zero operating cost. Model distribution is a separate bandwidth concern.

Sources: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/).

For paid cloud releases, evaluate R2 for media storage and a managed account provider; billing provider selection must match the business's country and payment requirements. Those integrations are post-MVP decisions, not prerequisites to learn this backend.

## Learn while implementing

| Step | Build | Backend concept to learn |
| --- | --- | --- |
| 1 | One local health endpoint and frontend fetch | Requests, responses, status codes, server/browser boundary |
| 2 | Create/read a guest in local D1 | SQL tables, indexes, prepared statements and bindings |
| 3 | Add cookie session and usage display | Sessions, secrets, ownership and validation |
| 4 | Reserve and settle a fake analysis job | Transactions, idempotency, concurrency and failure recovery |
| 5 | Add IP buckets and Turnstile | Trusted proxy headers, abuse limits and shared-network behavior |
| 6 | Connect a real local analysis job | Progress, cancellation and coordinating browser/server state |
| 7 | Deploy preview and test failures | Environment isolation, logs, quotas and production checks |

Complete each slice with a visible UI result and focused tests before extending it. Test same-IP incognito requests, changed IP with existing cookie, unrelated guests on shared Wi-Fi, forged headers, malformed input, reused challenges, duplicate completion, concurrent reservations and expiry. Rough backend effort: 1–2 focused weeks for an experienced developer, or approximately 2–4 weeks while learning; revise after the first integrated slice.


## Public implementation update

Migration 0006 adds hashed network-window counters and verification-token redemption digests. Hostname/action/expiry checks, atomic replay protection, public host-only secure cookies, issuance throttles, aggregate network reservation/settlement, and hourly bounded cleanup of temporary protection records are implemented. The browser loads the site key from the API and can verify during Import or analysis preflight; no secret is embedded in the Next.js bundle. See [deployment.md](deployment.md) for the configured thresholds, SQL explanation, two database IDs and exact per-environment commands. These controls reduce automation; they do not prove unique identity or trusted local AI usage.
