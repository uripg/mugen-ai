---
id: T-002
title: Better Auth team-only login gating a dashboard shell
status: todo
priority: P0
phase: 1
depends-on: [T-001]
spec-refs: [SPEC.md §2 IN-1, ARCHITECTURE.md §2, ARCHITECTURE.md §6.1]
invariants: [6, 7, 11]
reviewer-verdict:
---

## Description
Wire Better Auth (via the ratified better-auth-cloudflare template/CLI path) to D1 +
KV: a single shared email+password credential (ratified), a login page, and a
session-gated placeholder dashboard, deployed. Honors the two documented sharp
edges: per-request auth instance with that request's D1 binding, and KV rate-limiter
TTL ≥ 60s.

## Acceptance criteria
- [ ] Better Auth instantiated per-request with the request's D1 binding — no
      module-scope instance (IDEA.md sharp edge)
- [ ] KV-backed rate limiter TTL explicitly ≥ 60s (IDEA.md sharp edge)
- [ ] Shared team credential works; no signup/roles/invite surface exists (SPEC §4)
- [ ] Dashboard route + all non-auth API routes check the session server-side;
      unauthenticated → redirect/401 (invariant 7)
- [ ] `BETTER_AUTH_SECRET` never client-side (invariant 6 — bundle grep clean)
- [ ] Drizzle schema/migrations path established (auth tables migrated)
- [ ] Deployed and verified at mugen-ai.kedalen.dev
- [ ] type-check / lint / build pass
- [ ] better-auth + better-auth-cloudflare APIs verified against current docs

## Plan

## Notes / Decisions

## Reviewer verdict
