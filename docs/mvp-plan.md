# First MVP: local AI clipping

Planning baseline: 21 November 2026. This document describes remaining work; unchecked items are not implemented.

## Outcome and cost boundary

A user imports a recording, receives useful AI clip suggestions with timestamps and reasons, adjusts the clips, and downloads them. This is a general video tool: comedy, skits, reactions, vlogs, gameplay, performances, tutorials and interviews. Speech AND sound events (including laughter, applause, cheering and shouting) belong in the MVP. Visual AI is post-MVP: silent visual jokes and action may be missed, so manual clipping remains available.

The first MVP must not depend on a paid inference API. Transcription, sound detection, ranking and rendering run on the user's device. Model downloads, hosting, bandwidth, browser storage, memory and battery are still real resources; this is not a promise of unlimited free infrastructure. Do not train a model for this release.

The MVP includes local autosave AND a backend for guest sessions, server-side analysis credits and IP-based network limits. Video, audio, transcripts and rendered clips stay on the device; only session/usage metadata reaches our backend. Guest analysis requires an online authorization request. Accounts, paid cloud saving/processing and subscriptions follow in [the roadmap](roadmap.md); see [product tiers](product-tiers.md). Numeric allowances and prices remain undecided.

## Backend language and services

Use **TypeScript + Hono on Cloudflare Workers**, with **Cloudflare D1 (SQL)** for guest sessions, usage and network limits, **Turnstile** for bot challenges and **Wrangler** for local backend development/deployment. This keeps the same language as the frontend and builds on the repository’s existing Workers Static Assets deployment. Keep Next.js static export and add Worker API routes at `/api/*` on the same origin. Runtime API handlers cannot run inside the exported Next.js files.

See [the backend implementation and learning guide](backend-plan.md) for the service roles, setup requirements, folder structure, endpoints, database design, free-tier limits and build sequence. These are selected planning choices; no backend has been implemented or provisioned by this documentation update.

## Guest identity and IP-based allowances

Use two checks together: a cookie-backed guest ledger and a shared allowance bucket for the public IP/network. The backend observes the IP through the trusted hosting edge and associates the session with a keyed IP hash. A fresh browser/incognito session on the same IP still meets the same network limit during its configured window; it does not receive unlimited fresh network capacity. Do not restore another guest’s identity or expose their data based on IP alone.

Shared Wi-Fi/mobile networks can represent several people, and VPNs or changing IPs can evade network-only limits. Explain network limits with a retry time; never claim one IP equals one person. An existing cookie keeps its guest balance when the IP changes. Account sign-in later provides identity continuity across browsers. Detailed counter, retention and shared-network rules are in [the backend guide](backend-plan.md#guest-and-ip-policy).

## Existing foundation

- Local import and media metadata, shared editor state and workflow guards.
- Clip trimming, titles, editable timed captions, original/vertical/square framing, manual horizontal crop, undo and redo.
- Keep/dismiss decisions, clip queue, duplicates and export selection.
- Sequential browser MP4 export, cancellation/retry, individual downloads and ZIP archives.
- Feature components, shared UI, hooks, reducers, media utilities and static deployment configuration.

The review of dev at `30c07d4` passed lint, TypeScript, 20 tests and production build after installing locked dependencies. This is not cross-browser or end-to-end certification. Analysis currently waits for `analysis-complete`; no production engine dispatches it yet. Later workflow screens are therefore unreachable from a normal fresh import.

## Transcription decision

Start with the multilingual ONNX model `onnx-community/whisper-base`, using Transformers.js in a Web Worker. Download and cache a pinned model revision, use a tested quantized configuration, and measure download size, memory, processing time and accuracy on the target devices. WebGPU is the initial acceleration target; check support explicitly and show an actionable unsupported-device message. Do not silently switch to a paid service.

Benchmark `onnx-community/whisper-small` as the quality alternative before selecting the release default. Base is a starting recommendation for browser resource use, not an accuracy guarantee. Include the actual accents, languages and audio conditions users need. English-only variants should only be considered if the supported language scope is explicitly English-only.

Whisper produces a transcript, not ranked highlights. A separate, small instruction model must select moments from transcript segments and timestamped sound events locally. Benchmark a model supported by WebLLM on the same device set; the exact ranking model is a release decision, not yet selected. Load speech and ranking models sequentially and release resources between stages to control memory pressure. A larger model must earn its place through measured quality gains.

Sources:

- [Whisper Base ONNX model and usage](https://huggingface.co/onnx-community/whisper-base)
- [Whisper Small ONNX model and usage](https://huggingface.co/onnx-community/whisper-small)
- [Transformers.js WebGPU guide](https://huggingface.co/docs/transformers.js/guides/webgpu)
- [WebLLM](https://webllm.mlc.ai/)

## Sound understanding decision

Benchmark the AudioSet AST model available through Transformers.js against laughter, applause, cheering and shouting examples. YAMNet is an alternative to evaluate if a suitable browser conversion/runtime is validated. Add silence and energy measurements with audio signal processing. Preserve non-speech audio; speech detection must not discard laughter before the event model runs. Event probabilities are clues, not proof of emotion, humor or virality. The ranker needs the setup before a reaction and context after it.

Sources: [AST browser model](https://huggingface.co/Xenova/ast-finetuned-audioset-10-10-0.4593), [YAMNet](https://www.tensorflow.org/hub/tutorials/yamnet).

## Implementation order

### 1. Establish a small evaluation set and device baseline

- [ ] Obtain representative recordings with permission to test them, including comedy, reactions, gameplay, noisy speech, laughter, applause, music, silence and the required languages/accents.
- [ ] Have the intended user mark good clip ranges and explain bad cuts.
- [ ] Record the Mac chip/RAM/browser and at least one Windows test configuration. Keep application logic OS-independent; publish supported browser capabilities honestly.
- [ ] Compare Base and Small on transcript accuracy, timestamp alignment, time and peak memory. Start with short samples, then 10-minute and longer recordings.
- [ ] Measure sound-event precision and missed events, including laugh tracks/music that could cause false positives.
- [ ] Benchmark a local ranking model against those marked moments before committing to its download and memory requirements.

Deliverable: a reproducible evaluation report and selected model revisions/configurations.

### 2. Prepare audio, transcribe speech and detect sound events

- [ ] Extend the existing Mediabunny media layer to decode/resample mono audio in bounded windows; avoid decoding an entire long recording into RAM.
- [ ] Add speech/silence handling, overlapping chunks and duplicate removal at chunk boundaries.
- [ ] Run the event classifier on bounded audio windows and return source-relative event intervals/probabilities. Preserve reactions across chunk boundaries.
- [ ] Add worker lifecycle, model download progress, caching, cancellation and retry.
- [ ] Return transcript segments in source-relative timestamps; convert to the existing frame grid at the integration boundary.
- [ ] Generate editable captions from those segments. Validate end times and prevent overlapping auto-generated cues from hiding each other.
- [ ] Handle no audio, no speech, decode errors, interrupted downloads and unsupported runtime capabilities explicitly.

### 3. Generate useful local AI suggestions

- [ ] Group transcript segments and sound events into complete moments with nearby context, respecting the ranking model's context budget.
- [ ] Ask the local model for segment/event IDs, a short title, selection reason and relative relevance score.
- [ ] Validate structured output and resolve IDs to real timestamps; reject invented IDs, invalid bounds and cuts outside the source.
- [ ] Apply configurable clip duration preferences, boundary cleanup and overlap/duplicate suppression.
- [ ] Treat scores as relative model judgments, never promises of virality.
- [ ] Return a clear no-results state with a manual-clip action when nothing is useful.

### 4. Connect the engine to the current workflow

- [ ] Create an analysis controller tied to the active source ID. Ignore canceled or replaced-source results.
- [ ] Feed actual stage and progress events into the Analysis view; align stage copy with implemented speech analysis rather than claiming vision or tracking.
- [ ] Dispatch `analysis-complete` with validated clips and attached captions to unlock Suggestions.
- [ ] Make cancellation stop actual work and release resources. Provide recoverable errors and a fresh retry.
- [ ] Exercise the full path: import → analysis → suggestions → optional edit → kept clips → export.

### 5. Build the guest backend and save work locally

- [ ] Add the TypeScript/Hono Worker, D1 binding and initial SQL schema; keep secrets on the server and preview data separate from production.
- [ ] Implement session creation, usage lookup, analysis reservation and job completion/cancellation endpoints with validated inputs and session ownership checks.
- [ ] Issue opaque Secure/HttpOnly/SameSite guest cookies. Store balances in D1, never trust a browser counter.
- [ ] Associate sessions/reservations with an HMAC-derived network key. Enforce guest creation rate, per-guest credits and aggregate per-network analysis allowance; challenge repeated issuance with server-validated Turnstile.
- [ ] Reserve guest and network allowance together atomically, with unique request IDs. Prevent concurrent overspending and repeated completion/refunds; recover expired reservations.
- [ ] Handle network changes without resetting guest credits. Do not merge guests merely because they share an IP. Display network-limit retry times without exposing other sessions.
- [ ] Require connectivity for new analysis authorization. Keep existing local edits and exports usable during an outage. Local execution/reporting remains user-controlled, not verifiable paid usage.
- [ ] Test incognito/new-cookie requests on the same IP, shared networks, changed IPs, IPv6 representation, invalid challenge tokens, forged headers, duplicate requests and concurrent reservations.

- [ ] Store projects, transcript, clip edits and analysis results in IndexedDB with autosave and explicit delete/export-project actions.
- [ ] Restore after refresh; request that the user reconnect the matching original file when it is unavailable. A blob URL is not persistent storage.
- [ ] Handle storage limits, eviction and save failures visibly. Browser storage is not a guaranteed backup or cross-device cloud sync.
- [ ] Introduce centralized limits for source duration, file size and queued exports. Choose release values from device tests; do not present proposed test values as final product policy.
- [ ] Validate metadata before loading models and explain rejected inputs. Client-side limits protect device resources; they are not enforceable commercial quotas.

### 6. Stabilize and release

- [ ] Fix the confirmed caption bug: adding a line retains the first cue's full duration, so it masks later cues. Add a regression test that verifies visible caption changes.
- [ ] Review no-results recovery, preview/export consistency and timeline accuracy.
- [ ] Test long media, rotated/variable-frame-rate inputs, supported codecs, cancellation and multiple exports on real devices.
- [ ] Test keyboard operation, responsive layouts, and permission/error states.
- [ ] Remove claims such as absolute privacy, offline readiness or active-speaker tracking unless supported by the actual runtime. Existing renderer licensing telemetry still applies.
- [ ] Verify the deployed static app and CI when the GitHub billing lock is resolved.

## MVP acceptance gate

- An ordinary fresh import reaches real suggestions without fixtures or developer-dispatched events.
- Suggested ranges correspond to actual speech/sound events and meet measured usefulness criteria on the evaluation set.
- Captions are editable and align with preview/export; exported clips honor the selected ranges and framing.
- Reload restores edits, or clearly explains how to reconnect the source; no silent loss of saved work.
- No paid inference API, API key or sign-in is required for the guest workflow. The guest backend authorizes new analysis without receiving media/transcripts.
- A new browser on the same public IP cannot exceed the shared network allowance during its window. Existing guest credits survive IP changes; no identity or project is exposed based on matching IPs.
- Server balances cannot be overspent through concurrent requests; retries, cancellations and abandoned jobs follow the documented policy without double charges/refunds.
- Unsupported devices, excessive files and analysis failures get useful messages instead of endless progress.
- Model download sizes, supported devices, practical duration limits and quality limitations are documented from measurement.

## Planning estimate

Budget roughly 5–7 focused engineering weeks for local speech, sound detection, ranking, integration, saving and device testing, plus 1–2 weeks for the guest/IP backend and its concurrency/abuse tests. Rough total: 6–9 weeks for an experienced developer. For learning backend while building, provisionally allow 9–14 weeks and revise after the first complete vertical slice. This is an estimate for one experienced developer, not a delivery promise. Poor local ranking performance or weak-device support may change scope; resolve those risks in step 1. The hosted/hybrid 3–5 week estimate discussed previously does not cover the same local-runtime work.

## Inputs needed

- Target Mac chip, RAM and browser, plus access to a Windows test device.
- Representative recordings and preferred clip examples, languages and typical source lengths.
- A browser/device support baseline and measured acceptance criteria for speed and clip quality.
- A Cloudflare account for Workers, D1 and Turnstile; local development can begin before provisioning. Follow the setup list in [the backend guide](backend-plan.md).
- No paid AI account or training dataset is needed to begin; a small evaluation set is needed to choose models responsibly.
