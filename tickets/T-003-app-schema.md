---
id: T-003
title: Application D1 schema (drizzle) for the whole pipeline
status: todo
priority: P0
phase: 1
depends-on: [T-002]
spec-refs: [ARCHITECTURE.md §3]
invariants: [2, 9]
reviewer-verdict:
---

## Description
Drizzle schema + migrations for `accounts`, `signals`, `contacts`, `leads`,
`deal_intel`, `drafts`, `pipeline_runs` per ARCHITECTURE.md §3, including the
provenance fields (source tool + payload reference) invariant 2 requires and the
score/score_reasoning pairing invariant 3 will rely on. Scope guard (plan
review): schema + deterministic helpers ONLY — no routes, no UI.

## Acceptance criteria
- [ ] All seven tables match ARCHITECTURE.md §3 (fields, statuses, provenance)
- [ ] `contacts` rows can only represent real FullEnrich results (verified flag;
      no "invented contact" shape exists)
- [ ] `leads.score_reasoning` is structurally required whenever `score` is set
- [ ] Migration applies cleanly to local and remote D1
- [ ] No PII in any log statement added (invariant 9)
- [ ] type-check / lint / test / build pass; unit tests for any state-transition
      helpers (draft → approved/edited → sent-simulated)

## Plan

## Notes / Decisions

## Reviewer verdict
