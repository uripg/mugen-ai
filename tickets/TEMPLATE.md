---
id: T-NNN
title: <short imperative title>
status: todo            # todo | in-progress | blocked | in-review | done
priority: P2            # P0 (now) | P1 | P2 | P3
phase: 1
depends-on: []          # e.g. [T-001, T-004]
spec-refs: []           # e.g. [SPEC.md §5, ARCHITECTURE.md §3]
invariants: []          # AGENTS.md §1 items this ticket touches, e.g. [1, 4]
reviewer-verdict:       # path under .loop/reviewer/ once verified, or "skipped — <reason>" (LOOP.md STEP 7 risk gate)
---

## Description
<what this ticket delivers and why — 2–5 sentences. Link the spec sections it implements.>

## Acceptance criteria
- [ ] <criterion mapped to a spec section>
- [ ] <criterion mapped to an invariant — e.g. "no secret present in the client bundle (grep clean)">
- [ ] type-check / lint / test pass; eval/smoke gate (if any) passes
- [ ] platform APIs used were verified against current docs

## Plan
<!-- filled by the implementing agent at STEP 3. List every uncertainty explicitly and how it was routed (reviewer / human). -->

## Notes / Decisions
<!-- decisions made while building, with one-line rationale; new tickets discovered (file them, don't expand scope). -->

## Reviewer verdict
<!-- link to .loop/reviewer/verify-T-NNN-*.md and the PASS/FAIL outcome,
     or "skipped — <one-line reason>" when the STEP 7 risk gate allowed it -->
