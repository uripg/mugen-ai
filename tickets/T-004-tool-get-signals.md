---
id: T-004
title: get_signals tool — Sillage V2 client
status: todo
priority: P0
phase: 1
depends-on: [T-003]
spec-refs: [SPEC.md §2 IN-2/IN-3, ARCHITECTURE.md §2]
invariants: [2, 6, 8, 10, 12]
reviewer-verdict:
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
- [ ] Sillage V2 endpoints/shapes verified against current API docs before coding
      (AGENTS.md §0)
- [ ] Responses zod-validated at the boundary (invariant 8); raw payload persisted
      to `signals` with provenance (invariant 2)
- [ ] Only the four SPEC §2.3 signal types surface; JP/KR/SG accounts only
      (invariant 12)
- [ ] Key read server-side only from env/secret (invariant 6); called only inside
      explicit runs, bounded retries (invariant 10)
- [ ] Empty/thin results surface honestly as empty — never padded (invariant 2)
- [ ] Live call returns real signals for at least one Q-4 account
- [ ] type-check / lint / build pass

## Plan

## Notes / Decisions

## Reviewer verdict
