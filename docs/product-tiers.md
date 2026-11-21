# Product tiers and local processing foundation

Updated 21 November 2026. This is the product direction, not a list of shipped features. Production allowances and prices remain to be decided after testing. Local testing now allows 2 GB per source file and grants three source-video analyses per guest, with no scheduled reset. There is no fixed source-duration cap. The guest session and D1 allowance display are implemented locally, while reservation/settlement and AI integration remain pending.

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

## Guest video allowance belongs to Moment Lark

The guest allowance is application-defined and independent of any model provider's credits. Display **videos available**: three source videos per local guest, maximum 2 GB each, with no scheduled reset. Processing uses the user's device. The guest/session API stores counts, but reservation and settlement endpoints are still pending.

One successful source-video analysis should consume one slot. Multiple clips from that source, ordinary edits, exports and reopening an existing project do not consume more slots. Failed analysis releases its reservation. Use stable project/source identity and idempotent jobs to avoid double charges on retry. Keep video-slot allowances separate from future paid cloud minutes and storage. There is no fixed duration cap; benchmark long sources and handle memory in chunks.

- [ ] Centralize tier capabilities, maximum source file size, analysis allowance, reset policy and concurrency limits.
- [ ] Issue a random, opaque guest identifier from the backend in a Secure, HttpOnly cookie. Store the authoritative allowance and job ledger in the database; browser storage may cache display data only.
- [ ] Reserve allowance atomically through the backend before starting local analysis; finalize once, with a unique job ID. Require connectivity for new analysis authorization and explain backend outages clearly.
- [ ] Release reservations on application failures and define fair cancellation/re-analysis rules. Ordinary edits and exports should not consume another video slot.
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
4. Test correctness, latency and memory on 30-, 60- and 90-minute sources. Also test multi-hour compressed recordings below the 2 GB cap; full-length AI processing performance is not yet verified.
5. Add free accounts and account-linked allowances, preserving local processing.
6. Add paid entitlements, billing, cloud saving/processing and later visual AI. Validate cost and quality before assigning included capacity.

The foundation should use explicit job modes and capabilities, shared project/analysis result types and a single entitlement policy. Build the local mode first; future cloud execution must be an explicit paid choice, not an automatic fallback. Do not implement empty cloud integrations before a provider is selected.

## Clip-maker market review — 21 November 2026

This review covers the six products in the supplied search screenshots, Restream, and four relevant alternatives. It is a review of official product/help/pricing documentation, not a hands-on quality benchmark or an exhaustive catalogue. Free account access, free AI runs, source-minute quotas, output duration and watermark-free downloads are different entitlements. Unpublished quotas remain unknown rather than assumed unlimited.

| Product | Published free access / limits | Relevant workflow and comparison |
| --- | --- | --- |
| Restream Clips | One uploaded-video free try is advertised. Recurring Clips is an add-on: $19/month for 50 generated clips, $29 for 100, $59 for 250. A 7-day subscription trial renews unless canceled. | Stream recordings, uploads and supported public URLs; higher tier includes live clipping/autoposting. Competes on the streaming workflow. [Tool](https://restream.io/tools/ai-clip-generator), [pricing FAQ](https://support.restream.io/en/articles/10559070-clips-pricing-faqs). |
| OpusClip | 60 credits/month; watermarked exports up to 1080p, no editing on Free, exports expire after 3 days. Starter is $15/month. | Direct benchmark for ranked clips, captions and review. Paid plans expand editing, publishing and formats. [Pricing](https://www.opus.pro/pricing). |
| Vizard | 60 credits/month, 720p exports and 3-day storage; free exports have a watermark. One credit equals one source minute. | AI clipping with a full editor even on Free; paid scheduling and brand options. [Pricing](https://vizard.ai/pricing), [free-plan help](https://help.vizard.ai/en/articles/8767572-what-does-the-free-plan-for-vizard-offer). |
| CapCut | Free-to-start long-to-short tools; exact AI runs and export entitlements depend on the account/product surface. Official pages do not establish one universal unlimited allowance. | Broad editing, effects, captions and templates. Benchmark editing convenience; do not equate free manual editing with unlimited AI clipping. [Workflow and access caveats](https://www.capcut.com/resource/ai-video-summarizer). |
| Adobe Express | Advertises a free Clip maker. Documented source requirements: English, up to 1 GB, 1 minute–2 hours. A recurring clipping quota was not established from these pages. | Highlight extraction with captions and access to the larger design editor. A 90-minute source cap alone does not differentiate us. [Clip maker](https://www.adobe.com/express/create/video/clip), [requirements](https://helpx.adobe.com/express/web/video-creation-and-editing/create-videos/important-information-about-clip-maker.html). |
| HeyGen | Advertises free AI clips without a credit card; exact clipping-specific free source minutes are not stated on the feature page. | Speech-led highlights, editable trims, captions and aspect ratios within a broader AI video suite. [Clip generator](https://www.heygen.com/tool/ai-video-clip-generator). |
| ImagineArt | Free to start; paid plans add source minutes and higher export resolution. Exact free quota could not be verified from its accessible pricing page. | YouTube/file input, captions, scoring, vertical 9:16 output and a separate editor. Explicitly favors talk-heavy videos. [Autoclipper](https://www.imagine.art/ai-auto-clipper). |
| Lumen5 | General Free plan lists 5 videos/month, maximum 2-minute output and a branded outro. Clip Maker describes trial access; this does not establish a 5-source-video AI quota. | Prompt-guided highlights, brand styles, multiple ratios and team review. [Pricing](https://lumen5.com/pricing/), [Clip Maker](https://lumen5.com/features/video-clip-maker). |
| Eklipse | Gameplay Intelligence help advertises 3 free highlights; other help pages differ by feature and date. Do not promise a repeating free allowance without checking the account. | Important gaming benchmark for action/reaction highlights and stream workflows, with feature/game-specific restrictions. [Free highlights](https://eklipse.gg/help/maximize-3-free-highlights-new-streamer/), [feature restrictions](https://eklipse.gg/help/are-all-features-behind-a-paywall/). |
| Descript | Current pricing lists 60 media minutes/month on Free and limited AI repurposing access; watermark-free export is paid on the comparison table. | Text-based editing and AI clip extraction in a fuller production editor. Older tool-page export claims differ; use the current pricing table. [Pricing](https://www.descript.com/pricing). |
| Riverside | Public pricing lists Free with Magic Clips, 720p and watermark; recheck in-account terms because the rendered page also includes a staging-information warning. | Recording, transcript editing and clipping together. Local recording is not the same as keeping the complete workflow offline: Riverside describes continuous cloud upload. [Pricing](https://riverside.com/pricing), [Magic Clips](https://riverside.fm/magic-clips), [recording architecture](https://riverside.fm/blog/video-platforms). |

### What this means for Moment Lark

AI highlights, captions, optional aspect ratios and editable clips are established capabilities, not unique claims. Our intended combination is guest access, on-device media processing, original framing by default, and precise review before keeping/exporting clips. Existing local preview/export and guest identity are implemented; real local AI ranking and long-recording performance remain unproven. Cloud tools avoid relying entirely on the user's hardware and often already provide links, collaboration, publishing and live capture. We should not claim equivalent maturity or faster processing without measurements.

Restream explicitly warns that speech-led clipping can perform poorly on gameplay without talking. Our speech-and-sound MVP should therefore be tested on gameplay with commentary, reactions, laughter, and non-speech audio events, while treating silent visual action as a known gap. Supporting a GTA recording as a file does not establish reliable GTA highlight detection or live-stream ingestion. [Restream workflow limitations](https://support.restream.io/en/articles/10574261-how-to-create-your-viral-clips).

Recommended evaluation: use the same authorized podcast, comedy/reaction and gameplay recordings across selected tools and Moment Lark. Include 30-, 60- and 90-minute sources. Record useful clips retained per hour, complete-thought boundaries, missed moments, caption corrections, framing errors, processing time, peak memory, export success and actual free-plan restrictions. Include speech accents/code-switching and low-spec devices. Treat virality scores as vendor heuristics, not guaranteed audience outcomes. No competitor subscriptions or uploads were made during this documentation review.
