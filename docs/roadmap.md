# After the first MVP

Planning baseline: 21 November 2026. These capabilities are planned, not implemented. The tier direction is defined in [product tiers](product-tiers.md): guest/free processing stays local; paid signed-in users unlock cloud capabilities and later visual AI. Prices and numeric allowances will be decided after evaluation. See [the MVP plan](mvp-plan.md) for the current release boundary.

## Accounts and cloud projects

The first release includes a guest identity backend and server-side guest credit ledger without requiring sign-in; guest media processing stays local. Free accounts follow with account-linked allowances; processing still stays local. Cloud project saving, media processing and visual AI require paid entitlements as they become available.

- [ ] Sign-in, account recovery, verified identities, account deletion and session management.
- [ ] Authenticated project ownership and server-side authorization for every read/write.
- [ ] Cloud saves for edits, transcripts and analysis results, with cross-device restore and conflict handling.
- [ ] Optional source-video and rendered-clip storage using object storage, resumable uploads, retention limits and deletion controls.
- [ ] Explain which information is uploaded. Cloud metadata alone does not make a local source video available on another device.
- [ ] Track storage, bandwidth, inference and rendering costs before deciding plan allowances.

The MVP backend uses TypeScript/Hono on Cloudflare Workers with D1 and Turnstile; see [the backend plan](backend-plan.md). For later accounts, evaluate a managed auth provider; R2 is the cloud-media storage candidate. Auth and billing providers are not selected, and no free-tier capacity is assumed sufficient for production.

## Usage limits, trials and paid features

- [ ] Central entitlements for video count, total analyzed minutes, maximum source duration/file size, storage and concurrent jobs.
- [ ] Configurable trial policy. Two videos is a candidate, not an approved or implemented limit. Decide whether trial counts are lifetime or reset periodically.
- [ ] Extend the MVP guest ledger to authenticated accounts, with explicit guest-to-account credit handling. Define when a job reserves/consumes allowance and how failures, cancellations and retries are handled; prevent double charging and concurrent overuse.
- [ ] Revalidate uploaded media duration and size on the server for hosted processing; never trust a client-supplied duration or counter for billing.
- [ ] Subscription or credit billing, verified/idempotent webhooks, upgrades, downgrades, cancellations and receipts.
- [ ] Usage dashboard and clear explanations before an action incurs cost.

### Across browsers

Signing into the same account in another browser must retain the same usage allowance. Cookies and localStorage are browser-specific and resettable; neither is a reliable quota authority. The MVP uses IP-based network budgets alongside guest ledgers to constrain fresh browsers/incognito on the same connection. IP addresses do not identify a person; retain account identity as the authority for account credits and never merge accounts by IP. A new account is a separate abuse problem; verification and rate limits can reduce it but do not guarantee one trial per human.

Purely local processing cannot be made tamper-proof through frontend checks: users control their browser. Strong billing enforcement belongs around authenticated server capabilities such as cloud storage or hosted inference. Model downloads and account access can be controlled, but downloaded local execution cannot be reliably metered as if it ran on our server.

## Better AI and broader video coverage

- [ ] Benchmark larger transcription and ranking models against the same evaluation set.
- [ ] Paid, signed-in hosted inference with explicit consent for transferred audio/transcripts/frames, protected server credentials and spending caps.
- [ ] Face detection, temporal tracking and smooth automatic reframing.
- [ ] Active-speaker identification for multi-person footage; face detection alone does not identify who is speaking.
- [ ] Visual analysis for gameplay, sports, silent footage and broader audiovisual highlights. Laughter, applause and other basic sound-event analysis are already first-MVP requirements.
- [ ] Speaker diarization, multilingual evaluation, translation and improved word alignment.
- [ ] Keep/dismiss feedback and quality evaluation; consider fine-tuning only when evidence and appropriately licensed data justify it.

## Editing and publishing

- [ ] Caption templates, word highlighting, styling presets and SRT/VTT downloads.
- [ ] Additional social presets, reusable branding, thumbnails and export profiles.
- [ ] Background/resumable processing where platform capabilities permit it.
- [ ] Optional cloud rendering for devices unable to render locally.
- [ ] Direct publishing/scheduling and collaboration if user demand warrants the integration effort.

## Release prerequisites

- [ ] Privacy and retention controls appropriate to the actual cloud transfers.
- [ ] Operational monitoring, error reporting, budget alerts and recovery procedures.
- [ ] Review model and renderer licensing against the final product/team structure.
- [ ] Benchmark operating cost per processed minute, stored project and exported clip before publishing prices or unlimited allowances.

## Suggested sequence and rough effort

| Phase | Dependency | Rough additional effort |
| --- | --- | --- |
| Accounts and cloud project metadata | Stable local project schema | 1–2 weeks |
| Cloud media storage and cross-device recovery | Accounts, storage/retention policy | 1–2 weeks |
| Account-linked entitlements and billing (guest ledger exists in MVP) | Accounts, chosen pricing policy | 1–2 weeks |
| Face detection and automatic reframing | Representative video evaluation set | 1–2 weeks |
| Multi-speaker tracking | Stable face tracking and audio alignment | 2–4 weeks |
| Broader visual highlight selection | Labeled examples for the target video types | 2–4+ weeks |
| Caption styles and subtitle downloads | Correct caption timing | 3–5 days |

These are planning ranges for one experienced developer, not additive delivery commitments. Provider integrations, device coverage and testing can change them. Monetization remains a separate product decision after evaluating the completed capabilities.
