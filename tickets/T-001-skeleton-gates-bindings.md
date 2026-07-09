---
id: T-001
title: Skeleton infra — gates, D1/KV provisioning, bindings, first deploy
status: done
priority: P0
phase: 1
depends-on: []
spec-refs: [SPEC.md §2 Step 0.5, ARCHITECTURE.md §1, ARCHITECTURE.md §6.1]
invariants: [6, 11, 13]
reviewer-verdict: "skipped — pure infra/config wiring (bindings, scripts, eslint fix), no app logic or secrets in diff; gates green + live URL verified"
---

## Description
Turn the bare create-cloudflare scaffold into the deployable skeleton everything
else builds on: gate commands, D1 + KV provisioned and bound, dev bindings enabled,
and the app live at mugen-ai.kedalen.dev. IDEA.md: hit the stack's rough edges in
the first 30 minutes, not the last.

## Acceptance criteria
- [ ] `bun run typecheck` (`tsc --noEmit`) script exists and passes (AGENTS.md §6
      gates; no test suite — testing radically reduced per 2026-07-09 decision)
- [ ] D1 database + KV namespace created via wrangler and bound in `wrangler.jsonc`;
      `bun run cf-typegen` regenerated
- [ ] `initOpenNextCloudflareForDev()` in `next.config.ts`; local dev reaches D1/KV
      bindings; secrets only in `.dev.vars` (invariant 6 — grep clean)
- [ ] `bun run deploy` succeeds; app responds at https://mugen-ai.kedalen.dev
      (deploy pre-authorized at ratification)
- [ ] type-check / lint pass; `bun run build` (smoke) passes
- [ ] wrangler/OpenNext config options verified against current docs

## Plan
1. `typecheck` script (`tsc --noEmit`) in package.json.
2. Create D1 `mugen-ai-db` + KV `mugen-ai-kv` via wrangler; bind as `DB` / `KV` in
   wrangler.jsonc; add custom domain route `mugen-ai.kedalen.dev`
   (`custom_domain: true`); regen `cloudflare-env.d.ts`.
3. `initOpenNextCloudflareForDev()` in next.config.ts (per IDEA.md stack notes).
4. Gates (typecheck/lint/build), deploy, curl-verify the URL.

Uncertainties routed:
- wrangler auth → verified logged in (account 44f5…e73d).
- kedalen.dev zone on this account → NS records point to Cloudflare (konnor/
  rosalyn.ns.cloudflare.com); custom-domain binding verified at deploy.
- Custom-domain DNS creation is authorized: human explicitly named
  mugen-ai.kedalen.dev as the deploy target (MEMORY.md decision).
- Binding names DB/KV are provisional until T-002's better-auth-cloudflare
  template confirms its expected names — cheap rename if needed (noted for T-002).

## Notes / Decisions
- D1 `mugen-ai-db` (38b857d6-8807-41f9-8e9e-adf49ad35086), KV `mugen-ai-kv`
  (41f469a2557f4e5683cc3b467d3c163f); bindings `DB` / `KV` (rename in T-002 if the
  better-auth-cloudflare template expects different names).
- Next 16 removed `next lint` → lint script is `eslint .`; scaffold's FlatCompat
  eslint config broke against eslint-config-next 16's flat exports → rewrote
  eslint.config.mjs with direct flat imports (verified empirically).
- `initOpenNextCloudflareForDev()` was already present in the scaffold.
- Deployed version 8b265662; custom domain mugen-ai.kedalen.dev live (HTTP 200).
- All criteria met: typecheck/lint/build green, D1+KV bound, cf-typegen regenerated,
  `.dev.vars` confirmed gitignored.

## Reviewer verdict
