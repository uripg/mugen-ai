---
id: T-001
title: Skeleton infra — gates, D1/KV provisioning, bindings, first deploy
status: todo
priority: P0
phase: 1
depends-on: []
spec-refs: [SPEC.md §2 Step 0.5, ARCHITECTURE.md §1, ARCHITECTURE.md §6.1]
invariants: [6, 11, 13]
reviewer-verdict:
---

## Description
Turn the bare create-cloudflare scaffold into the deployable skeleton everything
else builds on: gate commands, D1 + KV provisioned and bound, dev bindings enabled,
and the app live at mugen-ai.kedalen.dev. IDEA.md: hit the stack's rough edges in
the first 30 minutes, not the last.

## Acceptance criteria
- [ ] `bun run typecheck` (`tsc --noEmit`) and `bun run test` (vitest, ratified dev
      dep) scripts exist and pass (AGENTS.md §6 gates)
- [ ] D1 database + KV namespace created via wrangler and bound in `wrangler.jsonc`;
      `bun run cf-typegen` regenerated
- [ ] `initOpenNextCloudflareForDev()` in `next.config.ts`; local dev reaches D1/KV
      bindings; secrets only in `.dev.vars` (invariant 6 — grep clean)
- [ ] `bun run deploy` succeeds; app responds at https://mugen-ai.kedalen.dev
      (deploy pre-authorized at ratification)
- [ ] type-check / lint / test pass; `bun run build` (smoke) passes
- [ ] wrangler/OpenNext config options verified against current docs

## Plan

## Notes / Decisions

## Reviewer verdict
