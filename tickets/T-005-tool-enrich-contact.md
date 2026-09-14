---
id: T-005
title: enrich_contact tool — FullEnrich client
status: done
priority: P0
phase: 1
depends-on: [T-003]
spec-refs: [SPEC.md §2 IN-2/IN-4, ARCHITECTURE.md §2]
invariants: [2, 5, 6, 8, 9, 10]
reviewer-verdict: FAIL→PASS — .loop/reviewer/verify-T-005-20260709-161754.md + .loop/reviewer/disc-T-005.md
---

## Description
Server-side FullEnrich client exposed as the `enrich_contact` tool: resolve the
person behind a signal into a verified contact. The no-result case is a first-class
outcome: "no verified contact", never an invention (invariant 5). **Gated on
QUESTIONS.md Q-1 remainder (FULLENRICH_API_KEY) and Q-4 for live testing.**

## Acceptance criteria
- [x] FullEnrich endpoints/shapes (incl. async/polling behavior if any) verified
      against current API docs before coding
- [x] Responses zod-validated (invariant 8); `contacts` row written only for a real
      verified result, with provenance (invariants 2, 5)
- [x] No-result path returns/persists an explicit "no verified contact" state that
      the UI can render (invariant 5) — tool returns the explicit discriminated
      state + raw provenance; durable persistence lands on the lead in T-007
      (reviewer-accepted scope split; T-007 note added)
- [x] Key server-side only (invariant 6); explicit runs only, bounded retries
      (invariant 10); no PII in logs (invariant 9)
- [x] Live call enriches at least one real contact from a Q-4 company
      (Nium CEO — DELIVERABLE work email, verified=true, row in local D1)
- [x] type-check / lint / build pass

## Plan

API verified live against https://docs.fullenrich.com (v2 — llms.txt index,
bulk POST/GET pages, authentication, ratelimit, email-status, data-dictionary):

- `POST https://app.fullenrich.com/api/v2/contact/enrich/bulk` (Bearer key) with
  `{ name, data: [{ first_name+last_name or linkedin_url, domain|company_name,
  enrich_fields }] }` → `{ enrichment_id }`. **Async**: poll
  `GET .../bulk/{enrichment_id}`; 400 `error.enrichment.in_progress` while
  running; 200 with `status: CREATED|IN_PROGRESS|FINISHED|CANCELED|
  CREDITS_INSUFFICIENT|RATE_LIMIT|UNKNOWN` + `data[].contact_info/profile`.
  Rate limit 60 calls/min. Email statuses: DELIVERABLE (2% bounce) >
  HIGH_PROBABILITY (9%, triple-verified catch-all) > CATCH_ALL > INVALID.

Steps:
1. `src/lib/tools/fullenrich.ts` — fetch helper mirroring `sillage.ts`
   (Bearer auth, one bounded retry on 429/5xx, typed error with FullEnrich
   error `code`, no PII/key in error messages).
2. `src/lib/tools/enrich_contact.ts` — `enrichContact(env, input)`:
   - input `{ accountId, signalId?, firstName?, lastName?, linkedinUrl?,
     domain?, companyName? }` (name pair or linkedin_url required; company
     defaults from the account row); market-scope guard as in get_signals.
   - spend containment: same-account contact with same normalized name or
     linkedin URL → return existing row (`reused: true`), no paid call.
   - `enrich_fields: ["contact.work_emails"]` only (1 credit; drafts need a
     work email, not phones/personal).
   - bounded poll: 5s initial wait, then every 5s, max 24 polls (~2 min);
     timeout → final `forceResults=true` read; still unfinished → throw
     (a timeout is a failure, NOT "no verified contact").
   - zod-validate the GET response (looseObject; raw payload preserved).
   - mapping (grounded in FullEnrich email-status docs): contact row written
     iff `most_probable_work_email.status ∈ {DELIVERABLE, HIGH_PROBABILITY}`;
     `verified = (status === "DELIVERABLE")`. Anything else (no email,
     CATCH_ALL, INVALID, or FINISHED-empty) → `{ outcome:
     "no_verified_contact", reason, rawResult }` — no row (invariant 5), raw
     result returned so the pipeline can persist honest provenance.
   - name/title/linkedin from `profile`; `committeeRole` left null (set at
     T-010 intel time); rawPayload = full per-contact result (invariant 2).
3. `scripts/dev-enrich-contact.ts` — dev exercise mirroring
   dev-get-signals.ts (platform proxy, LOCAL D1, real API; prints outcome +
   status + row id, masks the email — invariant 9).
4. Live test (Q-4 company): enrich a real leadership contact of one of the
   12 banks (person taken from a persisted exec-join Sillage detection or
   public leadership page), verify a row lands in local D1.

Uncertainties resolved before coding: endpoint shapes/async behavior (docs,
above); "verified" semantics (provider's own status tiers, above). Spend:
authorized 2026-07-09 ("spend is ok", MEMORY.md); ~1 credit for the live test.

## Notes / Decisions

- **FullEnrich key in `.dev.vars` was corrupted** — a missing newline ran the
  key value straight into `TEAM_LOGIN_EMAIL=…` on one line, so the "key" sent
  had a 33-char suffix → 401 `error.api.key`. Fixed the file (newline inserted,
  duplicate line removed) and **re-put the prod Worker secret**
  `FULLENRICH_API_KEY` (it was set from the same corrupted value). Verified:
  `GET /api/v2/account/credits` → 200, balance 2500.
- Live-observed API divergence from docs: while CREATED/IN_PROGRESS the GET can
  return **200 without `data`** (docs only describe the 400
  `error.enrichment.in_progress` reply) — schema made tolerant.
- Verified semantics grounded in FullEnrich email-status docs: row written iff
  `most_probable_work_email.status ∈ {DELIVERABLE, HIGH_PROBABILITY}`;
  `verified = (status === "DELIVERABLE")`. Work emails only (1 credit/call).
- Spend containment: same-account contact with same normalized name or
  linkedin URL is returned reused, no paid call (verified live).
- Review round 1 FAIL → fixed: provider `message` dropped from thrown errors
  (invariant 9); most-probable-only email selection. Finding 1 (durable
  no-result state) accepted as T-007 scope with the note recorded there.
- Live spend this ticket: 1 credit (Nium enrichment).

## Reviewer verdict
