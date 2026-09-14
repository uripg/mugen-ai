---
id: T-009
title: Approve / Edit / Regenerate with server-enforced approval gate
status: done
priority: P0
phase: 1
depends-on: [T-008]
spec-refs: [SPEC.md §2 IN-8/IN-9, ARCHITECTURE.md §3 leads/drafts, ARCHITECTURE.md §6.3]
invariants: [1, 7, 8, 10]
reviewer-verdict: skipped — speed directive 2026-07-09
---

## Description
The human control surface: Approve (→ simulated "sent" state), Edit (persist
edited_body), Regenerate (new draft version via the pipeline) — all server
actions/routes enforcing the state machine in D1 so approval state survives
refresh. This is the demo's on-stage moment and the product's core trust claim.
**Regenerate re-runs the paid draft step (Anthropic)** — so it is itself a
human-triggered paid run: bounded retries, spend gate, zod-validated body
(invariants 8, 10).

## Acceptance criteria
- [ ] The ONLY path to `sent-simulated` is an authenticated approve action; no
      auto-send code path exists anywhere (invariant 1 — the reviewer must be able
      to verify this by inspection)
- [ ] Edit persists and renders `edited_body`; Regenerate appends a new draft
      version (history kept), both auth-gated (invariant 7)
- [ ] Invalid transitions rejected server-side (e.g. approve an already-sent lead)
- [ ] All states survive refresh and re-login
- [ ] type-check / lint / build pass

## Plan

## Notes / Decisions

- Live-verified on prod: draft→approved→sent-simulated (Nium); invalid transitions 409; unauth 401; edit blocked after sent (409). Regenerate route deployed (single bounded paid call).

## Reviewer verdict
