---
id: T-006
title: research_market tool — Anthropic web_search server tool
status: todo
priority: P1
phase: 1
depends-on: [T-003]
spec-refs: [SPEC.md §2 IN-2/IN-4 (competitor note), ARCHITECTURE.md §2]
invariants: [2, 6, 10]
reviewer-verdict:
---

## Description
`research_market`: a pipeline step using Anthropic's native web_search server tool
to research 1–2 known local competitors in the account's space (and
buying-committee context Sillage/FullEnrich don't cover). Results carry citations
so the why-panel can trace them (invariant 2). **Live calls are a paid API path:
gated on the Q-1 spend authorization recorded in QUESTIONS.md/MEMORY.md, and the
web_search API + model id must be re-verified against current Anthropic docs
first.**

## Acceptance criteria
- [ ] Current web_search server-tool API + model id verified against current
      Anthropic docs before coding; key passed explicitly (`CLAUDE_API_KEY` env
      name — MEMORY.md decision)
- [ ] Competitor note persists to `deal_intel` with citation/source payload
      (invariant 2); empty findings surface as "none found", not filler
- [ ] Key server-side only (invariant 6); explicit runs only, bounded
      searches/retries (invariant 10)
- [ ] type-check / lint / build pass

## Plan

## Notes / Decisions

## Reviewer verdict
