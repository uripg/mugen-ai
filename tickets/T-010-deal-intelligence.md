---
id: T-010
title: Deal Intelligence layer — committee, playbook notes, competitor, repositioning
status: todo
priority: P1
phase: 1
depends-on: [T-006, T-007]
spec-refs: [SPEC.md §2 IN-4/IN-6, ARCHITECTURE.md §3 deal_intel/playbooks, ARCHITECTURE.md §6.4]
invariants: [2, 4, 5, 9, 12]
reviewer-verdict:
---

## Description
Once a signal resolves to a real contact: enrich +1 likely stakeholder tagged by
role (playbook heuristics; a 2nd extra only if time allows — hard cap 2), attach
the market's cultural buying-process + buyer psychology notes **verbatim from the
team-authored playbooks**, a competitor note via `research_market`, then a
repositioned value prop reasoning step that the draft is rewritten from.
**Gated on QUESTIONS.md Q-3 (playbook content) — the agent scaffolds
`src/lib/playbooks/{jp,kr,sg}.ts` but may not author market content (invariant 4).**
Plan-review note: riskiest one-session slice — if it runs long, split into
`committee+playbook-notes` and `competitor+repositioned-draft` (file the second
half as a new ticket rather than stretching this one).

## Acceptance criteria
- [ ] Playbook files contain only human-supplied content (git history shows it
      arriving from the human's answer; invariant 4); pipeline selects/quotes,
      never generates market claims
- [ ] Committee member is a real FullEnrich result with role tag from playbook
      heuristics; missing → shown as not found (invariants 2, 5); cap ≤ 2 extra
      (SPEC §4)
- [ ] Cultural + psychology notes recorded with their playbook key; competitor
      note with citations (invariant 2)
- [ ] Draft is demonstrably written from the repositioned value prop (prompt takes
      the reposition output; not a generic European pitch)
- [ ] Cut-order fallback works: with notes cut, the team-authored generic line per
      market renders instead (SPEC §2 cut order)
- [ ] No PII in logs (invariant 9); SG first, JP/KR via T-012 (invariant 12)
- [ ] type-check / lint / build pass

## Plan

## Notes / Decisions

## Reviewer verdict
