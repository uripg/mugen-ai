---
id: T-012
title: Enable Japan + Korea end-to-end
status: todo
priority: P1
phase: 1
depends-on: [T-011]
spec-refs: [SPEC.md §2 build order, SPEC.md §6, ARCHITECTURE.md §6.5]
invariants: [2, 4, 12]
reviewer-verdict:
---

## Description
Bring the remaining two markets live: JP + KR accounts seeded (from Q-4), their
team-authored playbooks wired (from Q-3), and a real end-to-end run verified per
market on the deployed URL. **Gated on QUESTIONS.md Q-3 and Q-4 for JP/KR.**

## Acceptance criteria
- [ ] JP and KR accounts from Q-4 seeded; a live run per market produces a scored,
      enriched lead card with why-panel on mugen-ai.kedalen.dev
- [ ] JP/KR playbook content is human-authored (invariant 4)
- [ ] Thin data in any market surfaces honestly (invariant 2) — demo expectations
      set from Q-4's spot-check notes, not padded
- [ ] Still JP/KR/SG only — no generic market plumbing added (invariant 12)
- [ ] type-check / lint / test / build pass

## Plan

## Notes / Decisions

## Reviewer verdict
