---
id: T-008
title: Dashboard v1 — live-updating lead cards via polling
status: todo
priority: P0
phase: 1
depends-on: [T-007]
spec-refs: [SPEC.md §2 IN-8, ARCHITECTURE.md §1, §5, ARCHITECTURE.md §6.3]
invariants: [2, 5, 7]
reviewer-verdict:
---

## Description
The one dashboard page: auth-gated, polling a read endpoint every few seconds so
lead cards visibly populate stage-by-stage as pipeline runs write to D1 (signal →
contact → draft). Includes a "run pipeline" trigger per account. UI is
agent-proposed (designs/ is empty) — **flagged unvalidated-by-design per
DESIGN.md**.

## Acceptance criteria
- [ ] Cards appear/update within a poll interval of D1 changes during a live run
      (SPEC §2 IN-8 "cards populate as the pipeline runs")
- [ ] All state renders from D1 — a hard refresh mid-run loses nothing
- [ ] Page + read endpoint session-checked server-side (invariant 7)
- [ ] Pipeline stages, contact ("no verified contact" included), and draft body
      render honestly from persisted data — no placeholder/mock content
- [ ] type-check / lint / build pass

## Plan

## Notes / Decisions

## Reviewer verdict
