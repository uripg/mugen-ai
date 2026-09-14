---
id: T-006
title: research_market tool — Anthropic web_search server tool
status: done
priority: P1
phase: 1
depends-on: [T-003]
spec-refs: [SPEC.md §2 IN-2/IN-4 (competitor note), ARCHITECTURE.md §2]
invariants: [2, 6, 10]
reviewer-verdict: PASS — .loop/reviewer/verify-T-006-20260709-163023.md
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
- [x] Current web_search server-tool API + model id verified against current
      Anthropic docs before coding; key passed explicitly (`CLAUDE_API_KEY` env
      name — MEMORY.md decision) — `web_search_20260209` on `claude-opus-4-8`
- [x] Competitor note persists to `deal_intel` with citation/source payload
      (invariant 2); empty findings surface as "none found", not filler —
      both outcomes exercised live (none_found in constrained runs;
      competitors_found with Thunes/Airwallex + 10 source URLs for Nium)
- [x] Key server-side only (invariant 6); explicit runs only, bounded
      searches/retries (invariant 10) — max_uses 10, max 3 pause_turn resumes
- [x] type-check / lint / build pass

## Plan

API verified via the claude-api skill (current docs, 2026-07): web search is a
**server tool** `{type: "web_search_20260209", name: "web_search"}` (dynamic
filtering; no beta header) on model **`claude-opus-4-8`** (current recommended
Opus; exact id from the skill's model catalog). Results come back as
`server_tool_use` + `web_search_tool_result` blocks and `text` blocks carrying
a `citations` array (url/title). Server-side loop can return
`stop_reason: "pause_turn"` → resume by re-sending, bounded. `refusal` stop
reason must be handled before reading content.

Steps:
1. `bun add @anthropic-ai/sdk` (ratified dependency, ARCHITECTURE §2).
2. `src/lib/tools/research_market.ts` — `researchMarket(env, { leadId })`:
   - lead → account (market guard as in the other tools); key passed
     explicitly `new Anthropic({ apiKey: env.CLAUDE_API_KEY })` (MEMORY
     decision — never the default env var name).
   - one messages.create call: web_search tool with `max_uses: 5` (bounded,
     invariant 10), `pause_turn` resumed max 3 times, no retries beyond the
     SDK default.
   - prompt: find 1–2 known LOCAL competitors in the account's market/space;
     answer with a short note, or the literal token `NONE_FOUND` when nothing
     verifiable exists — never filler.
   - grounding gate (invariant 2): a "found" note is persisted ONLY if the
     text carries ≥1 web citation; otherwise the outcome is an explicit
     `none_found` note ("No local competitors identified…"). Both outcomes
     persist to `deal_intel` (kind `competitor-note`) with
     `sourceTool: "research_market"` and rawPayload = full response content +
     model + usage (citations traceable in the why-panel).
3. `scripts/dev-research-market.ts` — platform-proxy exercise: resolves the
   account, finds-or-creates a dev lead row from a REAL persisted signal (+
   contact if present), runs the tool once, prints note + citation count.
4. Live test against a Q-4 company (Nium — real signals + contact already in
   local D1). Spend authorized 2026-07-09.

Uncertainty routing: tool type/model id resolved from current docs via the
claude-api skill (stale-training risk addressed). No business calls involved.

## Notes / Decisions

- Live-observed behaviors of `web_search_20260209` (dynamic filtering runs
  searches through code execution under the hood):
  - failed code-exec search attempts also consume `max_uses` — 5 was
    exhausted before one verified result; bound raised to 10.
  - text blocks carry NO span-level `citations` arrays — grounding evidence
    is the `web_search_tool_result` blocks; sources derived from consulted
    results when span citations are absent.
- Note content = text after the last tool block only (search narration is
  not part of the note); prompt instructs no preamble.
- Input takes `productContext` from the caller — the pipeline (T-007/T-010)
  decides the demo vendor's product one-liner; not hardcoded in the tool.
- Dev script creates a dev lead from a REAL persisted signal when none
  exists (local D1 only); Nium lead 1de948c8… used for the live test.
- Spend this ticket: 3 Opus runs + ~23 web searches (authorized 2026-07-09).

## Reviewer verdict
