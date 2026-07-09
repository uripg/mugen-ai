---
id: T-004
title: get_signals tool — Sillage V2 client
status: done
priority: P0
phase: 1
depends-on: [T-003]
spec-refs: [SPEC.md §2 IN-2/IN-3, ARCHITECTURE.md §2]
invariants: [2, 6, 8, 10, 12]
reviewer-verdict: PASS — .loop/reviewer/verify-T-004-20260709-155215.md (round 1 FAIL verify-T-004-20260709-155033.md addressed: market guard + live evidence)
---

## Description
Server-side Sillage V2 client exposed to the Claude loop as the `get_signals` tool:
fetch signals for a tracked account, filtered/mapped to the four
expansion-readiness types (international/Europe-facing hiring, exec with
international background joining, competitor engagement, funding round).
**Gated on QUESTIONS.md Q-1 remainder (SILLAGE_API_KEY in `.dev.vars`) and Q-4
(spot-check companies) for live testing** — client + validation can be written
first, but the ticket is not done until it has returned real signals.

## Acceptance criteria
- [x] Sillage V2 endpoints/shapes verified against current API docs before coding
      (AGENTS.md §0) — in-repo `SILLAGE_API.md` (official doc)
- [x] Responses zod-validated at the boundary (invariant 8); raw payload persisted
      to `signals` with provenance (invariant 2)
- [x] Only the four SPEC §2.3 signal types surface; JP/KR/SG accounts only
      (invariant 12 — deterministic type mapping + runtime market guard)
- [x] Key read server-side only from env/secret (invariant 6); called only inside
      explicit runs, bounded retries (invariant 10)
- [x] Empty/thin results surface honestly as empty — never padded (invariant 2 —
      Toss Bank returned 0, reported as 0; unmapped accounts reported unmapped)
- [x] Live call returns real signals for at least one Q-4 account (DBS 41,
      MUFG 167, Nium 28, Money Forward 1)
- [x] type-check / lint / build pass

## Plan

API surface verified against `SILLAGE_API.md` (human-provided full API doc, in-repo,
v1.0.0 — supersedes web research; base `https://api.getsillage.com`, Bearer auth).

1. `src/lib/tools/sillage.ts` — thin server-side client: `fetch` wrapper with
   `Authorization: Bearer <SILLAGE_API_KEY>` (from Worker env, never client),
   bounded retry (1 retry on 429/5xx with backoff, invariant 10), RFC 9457
   error surfacing.
2. `src/lib/tools/get_signals.ts` — the tool:
   a. Resolve Sillage `company_id`: use `target_accounts.sillage_id` if set;
      else page `GET /v2/top-account-list/accounts` (found-only), match by
      domain (fallback: exact name), persist id back. Not found → return
      `{ signals: [], unmapped: true }` — honest empty (invariant 2).
   b. `POST /v2/workspace/signals/query` `{ company_id, limit: 100 }`, cursor
      pagination bounded to 5 pages.
   c. zod-validate the envelope + each detection (passthrough raw payload).
   d. Map `signal_type` → SPEC's four types, drop the rest:
      `newJob`/`recentlyPromoted` → exec-join;
      `jobPosting`/`jobPostingInsight`/`jobPostingHiringManager`/
      `jobPostingKeywordDetection` → hiring;
      `competitorInboundComment`/`competitorOutboundComment` → competitor-engagement;
      `deepSearch` tag `funding` → funding, tag `hiring` → hiring; others dropped.
   e. Persist mapped signals to `signals` (rawPayload = full detection JSON,
      deterministic non-AI summary string, detectedAt from detected_at).
      Dedupe on Sillage detection id (skip already-persisted).
3. Dev exercise script (auth-gated usage comes in T-007): run the tool once
   locally against a Q-4 account to satisfy "live call returns real signals".

Uncertainties & resolutions:
- The v2 `type` request filter enum omits `deepSearch`/`jobPosting` even though
  responses document them → query WITHOUT a type filter and map client-side.
- Sillage mapping was still QUEUING at Q-4 time → probe live status first; if
  zero signals exist yet for all 12 accounts, that's an honest-empty result and
  the live-call criterion waits on Sillage finishing (not on code).

## Notes / Decisions

- 2026-07-09 · Canonical API reference = in-repo `SILLAGE_API.md` (human-provided
  official doc). Base `https://api.getsillage.com/api`, Bearer auth.
- 2026-07-09 · Sillage workspace is SHARED and actively churning (teammates
  adding/replacing accounts). Our 12 banks are all `found` on the TAL
  (workspace company ids 130411–130422, cached into `target_accounts.sillage_id`
  on first resolution). NOTE for human: a teammate's "KFTC" add resolved to
  "Kentuckians For The Commonwealth" (kftc.org) — wrong company, fix in UI.
- 2026-07-09 · Workspace had 1 agent (job_update #2553) and 0 signals; launched
  run #1036 (0 detections — no leads existed pre-mapping). Created agent #2680
  `job_posting_keyword_detection` "Intl/Europe-facing hiring — mugen-ai"
  (keywords: international, Europe, European, global expansion, market entry,
  cross-border — direct operationalization of SPEC §2.3 type 1), then launched
  runs #1051 (2680) + #1052 (2553). Agent creation is within spend
  authorization; named so the team can identify/remove it.
- 2026-07-09 · v2 `type` request filter omits deepSearch/jobPosting → query
  unfiltered, map client-side (per plan). Domain-filter 404 = "no such company
  on TAL" verified live; company_id path chosen (verified consistent with TAL
  ids via `resolved_companies`).
- 2026-07-09 · funding coverage: no API-creatable agent type produces
  `deepSearch` funding signals (create types: keyword_detection, watchlists ×5,
  job_update, job_posting_keyword_detection). Funding mapping implemented and
  will surface if/when deep-search signals exist; noted honestly.
- 2026-07-09 · competitor-engagement coverage: needs a competitor watchlist
  agent, but WHICH European competitor companies to watch is the team's
  business call (persona/product not in scope for the agent to invent) →
  flagged to human in MEMORY.md, not created unilaterally.
- 2026-07-09 · **LIVE RESULT (runs #1051/#1052 completed 13:49Z): 340 real
  detections workspace-wide.** Tool exercised live against 5 Q-4 accounts:
  DBS 41 signals persisted, MUFG 167, Nium 28, Money Forward 1, Toss Bank 0
  (honest empty — no matching postings). Acceptance criterion "live call
  returns real signals for at least one Q-4 account" MET. Supersedes the
  earlier run #1036 note (0 detections pre-mapping).
- 2026-07-09 · Data-quality note for T-007/T-008: Sillage emits duplicate
  detections for the same job posting (distinct detection ids, e.g. one Nium
  posting ×4). Persisted faithfully with provenance; dedupe-for-display is a
  lead-building concern, not a get_signals concern.
- 2026-07-09 · Reviewer FAIL round 1 addressed: added invariant-12 runtime
  market guard before any Sillage call (TS enum alone doesn't constrain D1
  rows); live-signal criterion evidence updated above (reviewer had read the
  stale pre-run note). DB CHECK constraint deliberately not added — reviewer
  offered "constraint OR runtime guard"; guard avoids a migration.

## Reviewer verdict
