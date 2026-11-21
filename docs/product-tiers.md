# Product tiers and local processing foundation

Updated 21 November 2026. This is the product direction, not a list of shipped features. Numeric allowances and prices remain to be decided after testing.

## Product scope

Moment Lark is a general video clipping application: comedy, skits, reactions, vlogs, interviews, tutorials, performances, gameplay and other recordings. It is not a podcast-specific editor.

The first MVP finds moments using speech AND sound events: laughter, applause, cheering, shouting, pauses and energy changes. The evaluation set must cover these video categories instead of only conversational recordings. Visual AI comes after the MVP. Until then, a silent visual joke or action with no informative audio may be missed; offer manual selection and describe that limitation clearly.

## Tier direction

| Capability | Guest | Signed in, free | Signed in, paid |
| --- | --- | --- | --- |
| Import and process video locally | Yes | Yes | Yes |
| Local speech transcription and sound detection | Yes | Yes | Yes |
| Local AI moment suggestions | Yes, guest allowance | Yes, larger allowance proposed | Yes, larger allowance proposed |
| Manual editing, captions, framing and local export | Core workflow included | Core workflow included | Core workflow included |
| Local autosave and project-file download | Yes, this browser/device | Yes, this browser/device | Yes, this browser/device |
| Backend identity and usage ledger | Anonymous guest session | Account-linked | Account-linked |
| Account required | No | Yes | Yes |
| Cloud project/media saving and cross-device project restore | No | No | Included up to plan limits |
| Hosted AI or cloud rendering | No | No | Opt-in, metered allowance |
| Visual AI, after MVP | Not in initial offering | Not in initial offering | Planned premium capability; benchmark first |
| Additional cloud processing/storage capacity | No | Upgrade required | Purchase more capacity or upgrade |

Signing in alone does not upload videos, transcripts or projects. A free account may store identity, plan and allowance metadata on the backend. Actual cloud project saving and cloud media processing require a paid entitlement and an explicit user action. Paid users keep the option to process locally.

The paid tier provides the expanded feature package with finite included allowances; it is not an unlimited commitment. Access to a feature and available capacity are separate checks. Features enter each tier only when implemented and verified.

## Guest credits belong to Moment Lark

Guest credits are an application-defined allowance, independent of any model provider's free quota. Prefer the name **analysis credits** or **analysis minutes** over model tokens so users can predict their usage.

Proposed accounting unit: one credit per source minute analyzed, with the precise rounding rule and starting balance configurable. This is a product proposal, not a committed grant amount. Track local analysis credits separately from paid cloud minutes/storage so local use cannot accidentally consume a paid provider budget.

- [ ] Centralize tier capabilities, maximum source duration/size, analysis allowance, reset policy and concurrency limits.
- [ ] Issue a random, opaque guest identifier from the backend in a Secure, HttpOnly cookie. Store the authoritative allowance and job ledger in the database; browser storage may cache display data only.
- [ ] Reserve allowance atomically through the backend before starting local analysis; finalize once, with a unique job ID. Require connectivity for new analysis authorization and explain backend outages clearly.
- [ ] Release reservations on application failures and define fair cancellation/re-analysis rules. Ordinary edits and exports should not consume another analysis credit.
- [ ] Display remaining allowance and expected cost before analysis.
- [ ] Make retries idempotent and recover abandoned reservations after refresh/crashes.
- [ ] Associate guest sessions with server-derived HMAC IP keys; enforce guest-creation rates and shared per-network analysis budgets alongside per-guest credits. New browsers/incognito on the same IP share that network cap. Verify Turnstile challenges server-side; a challenge never resets credits. See [the backend plan](backend-plan.md#guest-and-ip-policy).
- [ ] Keep guest processing local. Unsupported devices and exhausted allowances must not trigger cloud processing.
- [ ] Support sign-in without losing the guest's current local project; define how remaining guest credits are treated without granting the same credit twice.

The TypeScript/Hono backend on Cloudflare Workers, with D1 and Turnstile, belongs in the first MVP even though all media processing stays on the device. See [stack and setup](backend-plan.md). It stores guest identity, allowance and minimal job metadata, not videos, audio or transcripts. This is cloud coordination, distinct from paid cloud media processing/saving.

The backend prevents a browser counter reset from restoring credits for a recognized guest, but a new browser or incognito session may have no guest cookie and appear new. The same public IP still hits the same network allowance during its window, even with a new cookie. Shared networks can affect unrelated guests; changed IPs/VPNs can evade the network check. Never merge identities or reveal sessions based on IP. These controls do not guarantee one allowance per person. Reliable continuity across browsers requires signing into the same account. If strict cross-browser allowances are a launch requirement, bring account sign-in into the MVP before analysis rather than promise anonymous recognition.

Users also control local execution and reported duration/results. Server authorization does not make downloaded local models tamper-proof or client-reported usage suitable for trusted billing. Strong commercial enforcement applies to server-provided capabilities. Guest jobs never call a paid model API.

## Cost boundary

Guest and other local jobs incur $0 hosted AI inference and $0 cloud rendering charges. The user's computer supplies computation. Site hosting, guest API/database operation, model distribution, bandwidth, engineering and applicable software licensing can still cost money; do not advertise the entire service as costless to operate.

Cloud features introduce metered costs and must be protected by authentication, paid entitlements, per-account reservations and an app-wide spending ceiling. Consult [the researched cost examples](ai-costs.md) before setting prices.

## Build order

1. Prove local speech + sound detection + ranking on varied videos, including comedy and reactions.
2. Connect real analysis to the existing editor and export workflow.
3. Implement the guest identity API and server-side credit ledger, abuse controls, configurable resource limits, local saving and recovery.
4. Test correctness, latency and memory on 30- and 60-minute sources; choose actual limits from the results.
5. Add free accounts and account-linked allowances, preserving local processing.
6. Add paid entitlements, billing, cloud saving/processing and later visual AI. Validate cost and quality before assigning included capacity.

The foundation should use explicit job modes and capabilities, shared project/analysis result types and a single entitlement policy. Build the local mode first; future cloud execution must be an explicit paid choice, not an automatic fallback. Do not implement empty cloud integrations before a provider is selected.
