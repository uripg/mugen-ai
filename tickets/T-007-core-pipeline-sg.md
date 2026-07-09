---
id: T-007
title: Core headless pipeline — Singapore, one contact, no deal intelligence
status: todo
priority: P0
phase: 1
depends-on: [T-004, T-005]
spec-refs: [SPEC.md §2 build order, ARCHITECTURE.md §1 pipeline model, ARCHITECTURE.md §6.2]
invariants: [1, 2, 6, 7, 8, 10, 12]
reviewer-verdict:
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
- [ ] Auth-gated route runs one account/signal end-to-end per request, persisting
      stage-by-stage per the ratified execution model (ARCHITECTURE §1); Workers
      request limits verified against current docs, fallback (per-stage requests)
      applied only if needed
- [ ] Every persisted artifact traces to a real tool call (invariant 2 — no mocks)
- [ ] Draft is created in `draft` status; no send path of any kind exists
      (invariant 1)
- [ ] Route body zod-validated (invariant 8); session checked server-side
      (invariant 7); paid calls only inside this human-triggered run (invariant 10)
- [ ] Run completes against the real deployed Worker, not just local
- [ ] type-check / lint / build pass

## Plan

## Notes / Decisions

- From T-005 review (reviewer condition on accepting the scope rebuttal): when
  `enrich_contact` returns `{ outcome: "no_verified_contact", reason,
  enrichmentId, rawResult }`, the pipeline MUST persist that outcome durably on
  the lead/run (e.g. lead stage/status + provenance from `rawResult`) so the
  dashboard renders "no verified contact" after a refresh (invariant 5) — it is
  never silently dropped and never turned into an invented contact.

## Reviewer verdict
