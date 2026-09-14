---
id: T-007
title: Core headless pipeline — Singapore, one contact, no deal intelligence
status: done
priority: P0
phase: 1
depends-on: [T-004, T-005]
spec-refs: [SPEC.md §2 build order, ARCHITECTURE.md §1 pipeline model, ARCHITECTURE.md §6.2]
invariants: [1, 2, 6, 7, 8, 10, 12]
reviewer-verdict: skipped — speed directive 2026-07-09 (spend paths are the already-reviewed T-004/T-005/T-006 tools with unchanged bounds; auth = existing reviewed session helper)
---

## Description
The demo safety net: the Claude tool-use loop end-to-end for ONE Singaporean
account — signal → verified contact → basic English draft — triggered by an
auth-gated `POST /api/pipeline/run`, each stage written to D1 (`pipeline_runs`,
`leads`, `drafts`) as it completes, observable via logs/D1 before any UI exists.
No deal intelligence, no score yet. Seeds the SG account from Q-4's answer.
**Explicit blockers: QUESTIONS.md Q-1 remainder (Sillage/FullEnrich keys + spend
authorization) and Q-4 (the SG spot-check company) — the live pipeline may not
start without both, even though T-004/T-005 inherit the same gates.**

## Acceptance criteria
- [x] Auth-gated route runs one account/signal end-to-end per request, persisting
      stage-by-stage per the ratified execution model (ARCHITECTURE §1); Workers
      request limits verified against current docs, fallback (per-stage requests)
      applied only if needed — live-observed limit is the EDGE IDLE TIMEOUT, not a
      Worker limit; handled with NDJSON heartbeat streaming, and the Worker
      completes the run + persists to D1 even if the client disconnects
- [x] Every persisted artifact traces to a real tool call (invariant 2 — no mocks)
- [x] Draft is created in `draft` status; no send path of any kind exists
      (invariant 1)
- [x] Route body zod-validated (invariant 8); session checked server-side
      (invariant 7; unauthenticated POST → 401 verified live); paid calls only
      inside this human-triggered run (invariant 10)
- [x] Run completes against the real deployed Worker, not just local — prod run
      `449bc46d` on Nium: signal → verified contact → draft, stage `drafted`,
      status `done`
- [x] type-check / lint / build pass (build via `bun run deploy`)

## Plan

Speed directive 2026-07-09 applies: reviewer skipped, gate = typecheck, live-exercise
the happy path (this ticket spends + ships the pipeline), parallel subagents.

- **Execution model** (ratified ARCHITECTURE §1): one account end-to-end per
  authenticated `POST /api/pipeline/run`. Workers have no wall-clock cap on a
  connected HTTP request (CPU-time-limited only; pipeline time is I/O wait on
  Anthropic/FullEnrich), so the single-request model holds — no per-stage fallback.
- **Pipeline = Claude tool-use loop** (`claude-opus-4-8`, verified T-006) in
  `src/lib/pipeline/run.ts`, with client tools wrapping the T-004/T-005 tools plus
  the native web_search server tool:
  1. `get_signals` → fetch+persist Sillage signals for the account (T-004 tool),
     return compact list (id/type/summary/date). Honest empty → run ends `done`,
     outcome `no_signals` (or `unmapped_account`).
  2. `select_signal {signal_id, reason}` → creates the `leads` row (stage `signal`),
     links the run.
  3. web_search (server tool, max_uses 8) → identify a real, named decision-maker
     relevant to the chosen signal (persona job-title guidance in prompt). The name
     is never trusted: FullEnrich is the verification gate.
  4. `enrich_contact {first_name,last_name,linkedin_url?}` (max 2 calls ≈ 2 credits)
     → T-005 tool. Verified → lead stage `contact` + primaryContactId.
     `no_verified_contact` → persisted durably on the lead (new stage `no-contact`
     + new `stage_detail` JSON column w/ reason+enrichmentId+rawResult — T-005
     reviewer condition) and returned to Claude (may try 1 other person).
  5. `write_draft {subject, body}` → allowed only with a verified contact; persists
     `drafts` row v1 (provenance: model + signal/contact/playbook refs), lead stage
     `drafted`, status stays `draft` (invariant 1 — no send path anywhere).
  - Loop bounded ≤ 16 iterations; `pipeline_runs` stage updated after every tool
    call; failure → run `failed` with error (invariant 10 bounded, human-triggered).
- **Invariant 4:** system prompt embeds the SG (account-market) playbook verbatim —
  messagingJudgment frames the draft; model instructed to never invent market claims
  or proof points.
- **Demo vendor one-liner** (`src/lib/pipeline/product.ts`): delegated to T-007 by
  T-006 plan review. "Kedalen" (team domain) — European B2B fintech: AI compliance &
  transaction-risk monitoring for banks/insurers/payment firms — fits the 12 tracked
  financial accounts + Sillage persona.
- **Route** `src/app/api/pipeline/run/route.ts`: server-side session check (401),
  zod body `{accountId}` (invariants 7/8), calls `runPipeline`, returns summary.
- **Schema:** leads stage +`no-contact`, +`stage_detail` (migration 0004, applied
  local+remote).
- **Verify:** typecheck → local live run via `scripts/dev-pipeline-run.ts` on Nium
  (SG; contact dedupe may make enrich free) → deploy → run against
  mugen-ai.kedalen.dev with the real session cookie.
- Uncertainties routed: none open — API shapes all live-verified in T-004/005/006;
  vendor one-liner settled above (ticket-level delegation, not a §5 item).

## Notes / Decisions

- **Built with 2 parallel subagents** (speed directive): pipeline core
  (`src/lib/pipeline/run.ts` + `product.ts`) ∥ route + dev harness
  (`src/app/api/pipeline/run/route.ts`, `scripts/dev-pipeline-run.ts`).
- **Demo vendor one-liner** (delegated to T-007 by T-006 plan review):
  "Kedalen" — European B2B fintech, AI-powered KYC/AML & transaction-risk
  compliance for banks/insurers/payment firms (`src/lib/pipeline/product.ts`).
- **Live API findings:**
  - `web_search_20260209` executes via code execution: a `pause_turn` resume
    with pending code-exec tool uses 400s unless the request re-attaches
    `container: <previous response.container.id>`. Fixed in the loop.
    (`research_market` never hit this live but shares the pattern — watch it.)
  - Long silent responses get cut by the Cloudflare edge (h2 stream error
    ~100s idle); route now streams `{"heartbeat":true}` NDJSON lines every 15s
    with the RunPipelineResult as the final line. Even when the client drops,
    the Worker runs the pipeline to completion and D1 has the truth (the
    dashboard polls, so nothing is lost) — the ARCHITECTURE §1 per-stage
    fallback was NOT needed.
  - Sillage TAL churn (shared workspace): live TAL resolution for Nium failed
    on prod → backfilled the 5 known `sillage_id`s from local D1 into remote
    (130414-130417, 130421). Remaining 7 accounts resolve on first use ONLY if
    they're still on the TAL — see MEMORY non-blocking human note.
- **Bounds:** 16 model turns, 8 web searches, 2 paid enrich attempts/run,
  max_tokens 4000/turn. Model `claude-opus-4-8`.
- **Schema:** leads.stage += `no-contact`; new `stage_detail` JSON column
  (migration 0004, applied local + remote) — persists the FullEnrich
  no_verified_contact provenance per the T-005 reviewer condition.
- **Spend:** ~3 FullEnrich credits (1 local Amaresh/DELIVERABLE; ~2 prod incl.
  one run orphaned by the pre-streaming disconnect) + Anthropic tokens.
- Prod draft's contact stored `verified=0` (HIGH_PROBABILITY email — usable,
  honestly unverified per T-005 semantics).

- From T-005 review (reviewer condition on accepting the scope rebuttal): when
  `enrich_contact` returns `{ outcome: "no_verified_contact", reason,
  enrichmentId, rawResult }`, the pipeline MUST persist that outcome durably on
  the lead/run (e.g. lead stage/status + provenance from `rawResult`) so the
  dashboard renders "no verified contact" after a refresh (invariant 5) — it is
  never silently dropped and never turned into an invented contact.

## Reviewer verdict
