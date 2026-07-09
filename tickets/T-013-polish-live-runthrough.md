---
id: T-013
title: Polish + full live demo run-through
status: done
priority: P1
phase: 1
depends-on: [T-012]
spec-refs: [SPEC.md §6, ARCHITECTURE.md §6.6]
invariants: [1, 2, 3, 6]
reviewer-verdict: skipped — speed directive 2026-07-09
---

## Description
Make the 90-second demo real: prod secrets set on the Worker (per QUESTIONS.md Q-1
preference), all three markets streaming on the deployed URL, dashboard polish, and
a full timed rehearsal of the on-stage path — signals → scored lead → why-panel →
human approves one.

## Acceptance criteria
- [ ] All secrets set as Worker secrets via `wrangler secret put`; grep confirms
      none in repo or client bundle (invariant 6)
- [ ] Full demo path rehearsed end-to-end on https://mugen-ai.kedalen.dev in under
      90 seconds, every on-screen data point tracing to a real call (SPEC §6,
      invariants 2, 3)
- [ ] Approve moment works live: draft → approved → sent-simulated (invariant 1)
- [ ] Degraded states presentable if a live API is slow/empty on stage (honest
      empty states, not blanks)
- [ ] type-check / lint / build pass

## Plan

## Notes / Decisions

- Secrets: all 4 on Worker, repo grep clean, .dev.vars ignored; approve moment live-verified; degraded states (no-contact, none-verified competitor) render honestly; demo executed live by the human 2026-07-09 ~13:00Z off mugen-ai.kedalen.dev.

## Reviewer verdict
