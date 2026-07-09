---
id: T-011
title: Expansion Readiness Score + why-panel
status: todo
priority: P1
phase: 1
depends-on: [T-009, T-010]
spec-refs: [SPEC.md §2 IN-5/IN-7, ARCHITECTURE.md §3 leads, ARCHITECTURE.md §6.4]
invariants: [2, 3]
reviewer-verdict:
---

## Description
The 0–100 Expansion Readiness Score, produced from the signal + deal intelligence
with its reasoning captured, and the why-panel rendering everything next to the
draft: signal, buying committee, cultural note, buyer psychology note, competitor
note, and score reasoning — the product's answer to the black-box objection.

## Acceptance criteria
- [ ] Score is never rendered anywhere without its reasoning (invariant 3 — UI
      structurally couples them; `score_reasoning` required at the data layer)
- [ ] Score reasoning references only real, persisted inputs (invariant 2); a
      market with thin data scores honestly, never padded
- [ ] Why-panel shows all six SPEC §2 IN-7 elements beside the draft, each
      traceable to its source row/tool
- [ ] Renders correctly in the degraded states: no verified contact, no committee
      member, competitor note cut, fallback playbook line
- [ ] type-check / lint / build pass

## Plan

## Notes / Decisions

## Reviewer verdict
