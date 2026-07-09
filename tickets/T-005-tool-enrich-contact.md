---
id: T-005
title: enrich_contact tool — FullEnrich client
status: todo
priority: P0
phase: 1
depends-on: [T-003]
spec-refs: [SPEC.md §2 IN-2/IN-4, ARCHITECTURE.md §2]
invariants: [2, 5, 6, 8, 9, 10]
reviewer-verdict:
---

## Description
Server-side FullEnrich client exposed as the `enrich_contact` tool: resolve the
person behind a signal into a verified contact. The no-result case is a first-class
outcome: "no verified contact", never an invention (invariant 5). **Gated on
QUESTIONS.md Q-1 remainder (FULLENRICH_API_KEY) and Q-4 for live testing.**

## Acceptance criteria
- [ ] FullEnrich endpoints/shapes (incl. async/polling behavior if any) verified
      against current API docs before coding
- [ ] Responses zod-validated (invariant 8); `contacts` row written only for a real
      verified result, with provenance (invariants 2, 5)
- [ ] No-result path returns/persists an explicit "no verified contact" state that
      the UI can render (invariant 5)
- [ ] Key server-side only (invariant 6); explicit runs only, bounded retries
      (invariant 10); no PII in logs (invariant 9)
- [ ] Live call enriches at least one real contact from a Q-4 company
- [ ] type-check / lint / test / build pass; validation + no-result paths
      unit-tested with injected fixtures

## Plan

## Notes / Decisions

## Reviewer verdict
