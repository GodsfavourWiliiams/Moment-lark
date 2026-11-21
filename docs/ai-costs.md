# Speech, sound and future video AI: architecture and costs

Researched 21 November 2026. Published prices and quotas can change. These are planning calculations, not measured bills or guaranteed quality. No hosted provider or paid plan has been enabled.

## MVP scope

The authoritative tier direction is in [product tiers](product-tiers.md): guests and free signed-in users process locally; cloud features require paid sign-in. Hosted examples below are future paid-tier cost research, not a proposed guest execution path.

This is a general video app, including comedy, reactions and gameplay. Speech transcription AND sound-event understanding are required. Visual AI is post-MVP. The video still plays and exports normally; the MVP simply does not inspect its pictures to decide which moments matter.

The processing stages have different jobs:

1. Whisper writes down spoken words with timestamps.
2. An audio event classifier detects candidate laughter, applause, cheering, shouting and other sounds. Signal processing adds silence and energy changes. Preserve those sounds during preprocessing.
3. A ranking model considers the transcript, event timestamps and surrounding context to propose complete moments. It should include the setup before a joke and the reaction afterward, not just a loud sound.
4. Application code validates boundaries, enforces duration preferences, removes duplicates and builds the existing clip documents.
5. The user reviews; the browser renders the selected clips.

Neither a sound classifier nor loudness proves humor, excitement or virality. Evaluate event precision/recall and clip usefulness separately. Background music, soundboards and laugh tracks can mislead detection.

## Model candidates and delivery options

| Job | No hosted inference bill | Hosted alternative |
| --- | --- | --- |
| Speech | Whisper Base ONNX through Transformers.js; benchmark Small for quality | Groq Whisper Large V3 Turbo |
| Sound events | AudioSet AST through Transformers.js; benchmark YAMNet with a verified browser runtime if needed | Gemini audio input with event/timestamp instructions |
| Moment decisions | A tested small WebLLM instruction model; exact release choice pending evaluation | Gemini 3.5 Flash-Lite using transcript plus detected events, or raw audio |
| Future visual decisions | Not required for MVP | Gemini 3.5 Flash-Lite audio/video candidate for evaluation; a stronger model may be required |

Local inference has no provider audio-minute/request quota. Device memory, speed, model distribution bandwidth and app policy still limit use. A model downloaded into the browser is not a cloud service subscription. Do not interpret locally free inference as proven accuracy or fast processing on every machine.

The strongest recommendation is a short evaluation before committing: compare fully local results to one hosted reference run on the same recordings. Spending on that comparison requires an explicit choice; use available free quota if suitable. Do not train models for this release.

Sources: [Whisper Base](https://huggingface.co/onnx-community/whisper-base), [Transformers.js WebGPU](https://huggingface.co/docs/transformers.js/guides/webgpu), [AST browser model](https://huggingface.co/Xenova/ast-finetuned-audioset-10-10-0.4593), [AST event labels](https://huggingface.co/Xenova/ast-finetuned-audioset-10-10-0.4593/blob/main/config.json), [YAMNet](https://www.tensorflow.org/hub/tutorials/yamnet), [YAMNet event labels](https://raw.githubusercontent.com/tensorflow/models/master/research/audioset/yamnet/yamnet_class_map.csv), [WebLLM](https://webllm.mlc.ai/).

## Paid-rate AI examples

Use paid rates for planning so the business does not rely on a changing free allowance. All figures below are USD, per source recording, with browser export. They exclude storage, backend/database/auth, taxes, extra passes and retries. They include sound detection either locally or through audio/video input.

Assumptions:

- Groq Whisper Large V3 Turbo: $0.04 per audio hour.
- Gemini 3.5 Flash-Lite standard: $0.30 per million input tokens and $2.50 per million output tokens, including thinking tokens.
- For 30 minutes, transcript/event ranking uses 10,000 total input tokens and 2,000 total billed output tokens across requests. Double those budgets for 60 minutes. These are example budgets, not measured transcript sizes or enforced provider limits.
- Raw audio: 32 tokens/second. Video static mode at 1 sampled frame/second: approximately 100 tokens/second at low resolution or 300 at high resolution, including audio/metadata.
- Video/audio examples budget 2,000 output tokens for 30 minutes and 4,000 for 60. High-resolution 60-minute input can exceed a model's context window and must be split; repeated context and overlap add cost.

| Pipeline | 30 minutes | 60 minutes |
| --- | ---: | ---: |
| Local speech + local events + local ranking | $0 hosted inference | $0 hosted inference |
| Local speech/events + hosted text ranking | $0.008 | $0.016 |
| Groq speech + local events + hosted text ranking | $0.028 | $0.056 |
| Groq speech + Gemini raw-audio analysis/ranking | $0.04228 | $0.08456 |
| Future: Groq speech + Gemini video/audio analysis, low resolution | $0.079 | $0.158 |
| Future: Groq speech + Gemini video/audio analysis, high resolution | $0.187 | $0.374 |

Example: 30-minute hosted speech plus text ranking = (0.5 × $0.04) + (10,000 / 1,000,000 × $0.30) + (2,000 / 1,000,000 × $2.50) = $0.028. Event classification and rendering in that row run locally.

The separate Whisper pass in the audio/video rows supplies the caption transcript. Gemini handles event/context interpretation and selection; it is not an additional text-ranking pass. Real runs with chunk summaries, re-ranking, thinking or retry requests may exceed these budgets. Track actual usage. A provisional 2–3× AI cost reserve is a planning cushion, not a maximum.

One-frame-per-second analysis is sampled visual understanding, not exhaustive inspection of the original 30/60 fps recording. Fast action may require denser sampling or targeted second passes. These estimates are for an economical candidate model, not a guarantee it meets every quality requirement or that every premium feature is included.

Sources: [Groq speech pricing](https://console.groq.com/docs/speech-to-text), [Gemini pricing](https://aistudio.google.com/docs/pricing#gemini-3.5-flash-lite), [audio tokenization and non-speech support](https://aistudio.google.com/docs/audio#technical-details), [video tokenization](https://aistudio.google.com/docs/video-understanding#technical-details-video).

## Free allowances are shared, not per app user

Groq's published table lists Whisper at 7,200 audio seconds/hour and 28,800/day (2 audio hours per clock hour, 8/day), alongside request limits. The page offers Free/Developer tabs and notes account-specific exceptions; confirm the exact free-plan allowance in the console before launch. At those audio limits, the theoretical total is four 30-minute recordings/hour and sixteen/day, or two 60-minute recordings/hour and eight/day, shared by the organization. Chunk overlap, retries and other constraints reduce that capacity.

Gemini limits apply per project, not per API key or Moment Lark user. The active account/model limits are shown in AI Studio. No fixed per-user free-video allowance can be inferred from a free model price. Requests, tokens and daily caps all matter. Provider free allowances are not a durable production capacity commitment.

Sources: [Groq rate limits](https://console.groq.com/docs/rate-limits), [Gemini rate limits](https://aistudio.google.com/docs/rate-limits).

Guest allowances are application-defined credits for local analysis, recorded in our backend, not an allocation of hosted model quota. A two-video/60-minute guest grant was an earlier example, not a decided policy. Set credit balances and maximum lengths after local benchmarks. Paid cloud allowances need a separate global hosted budget; guest jobs never consume it. Reserve quota atomically before work, reconcile successful/failed/canceled jobs, and make retries idempotent. Application failures must not accidentally spend a user's allowance twice. Stop or queue hosted work when the global allowance is exhausted; never silently activate paid processing.

## Backend and infrastructure

The first MVP requires a lightweight backend for guest sessions and authoritative credit accounting, even though inference and rendering run locally. Store only guest identity, usage and minimal job metadata; no guest media/transcripts are uploaded. Require backend authorization before new local analysis jobs. A new browser or incognito session may appear as a new guest but still hits the same IP-based network allowance during its window. Shared networks and changed IPs limit this protection; account sign-in gives identity continuity. See [the backend plan](backend-plan.md) for the selected TypeScript/Hono, Workers, D1 and Turnstile stack. This backend/database may have operating costs even when hosted inference costs $0.

MVP backend responsibilities are guest issuance, atomic reservations, idempotent completion, abandoned-job recovery and abuse throttles. Client-reported local execution is not verifiable billing evidence. Later account/paid capabilities add:

- Verify account identity and own the usage ledger; same account means same allowance in another browser.
- Protect provider secrets and enforce per-job input/output budgets plus global spending caps.
- Manage jobs, retries, rate-limit backoff and cancellation; a disconnected browser should not create duplicate billed work.
- Authorize cloud project access and optional media uploads; validate duration/size server-side for hosted jobs.
- Use a database for metadata and an object store for large media, with retention and deletion policies.

The current Next.js static export cannot host runtime API handlers. Keep the frontend export and add a Hono Worker API alongside Workers Static Assets on the same origin, routing `/api/*` to backend code. The Worker coordinates model APIs; it should not be assumed capable of running long GPU inference or video rendering itself. Local-only frontend limits cannot be made tamper-proof; trusted billing enforcement applies to server-provided services.

Cloudflare Workers has a free tier and a paid subscription starting at $5/month with usage allowances. R2 standard storage is $0.015/GB-month before free allowances, with operation charges and free Internet egress. A 30-minute source at 8 Mbps is approximately 1.8 GB, or $0.027 for one month of raw storage; 60 minutes is approximately 3.6 GB/$0.054. Actual bitrate, additional outputs, request rounding and retention determine the bill.

For illustration only: 100 hosted full-video analyses of 30 minutes each, keeping 1.8 GB/source for a month, would be about $7.90–$18.70 AI + $2.70 raw storage + a $5 Workers base = $15.60–$26.40 before free allowances, operations, database/auth, outputs, taxes and retries. That is not an all-inclusive operating quote. Cloud rendering would be extra; measure it using output count, length, resolution and render time before pricing it.

Sources: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [R2 pricing](https://developers.cloudflare.com/r2/pricing/).

## Next implementation step

Build a benchmark for a short recording containing speech, laughter, applause, silence and music. Measure Whisper transcription, event detection and local ranking independently, then test 30- and 60-minute sources for time/memory. This is the evidence needed to choose a default model, a supported-device baseline and safe product limits. No claim that a 30-minute video finishes in a particular time is justified yet.
