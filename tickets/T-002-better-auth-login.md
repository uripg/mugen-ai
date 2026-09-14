---
id: T-002
title: Better Auth team-only login gating a dashboard shell
status: done
priority: P0
phase: 1
depends-on: [T-001]
spec-refs: [SPEC.md §2 IN-1, ARCHITECTURE.md §2, ARCHITECTURE.md §6.1]
invariants: [6, 7, 11]
reviewer-verdict: "PASS — .loop/reviewer/disc-T-002.md (after 2 fix rounds: verify-T-002-20260709-143251.md, -143619.md, -143829.md)"
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
1. Deps (ratified): better-auth, better-auth-cloudflare, @better-auth/drizzle-adapter
   (better-auth's own adapter split-package — counts under the ratified better-auth
   line), drizzle-orm (+ drizzle-kit dev).
2. `src/lib/auth/index.ts`: `createAuth(env, cf, baseURL)` wrapped in
   `withCloudflare` (d1: drizzle(env.DB), kv: env.KV, rateLimit window ≥ 60s) +
   `initAuth()` per-request via `getCloudflareContext({async:true})` (sharp edge 1).
   CLI-export variant (no env) for schema generation.
3. `@better-auth/cli generate` → `src/lib/db/auth.schema.ts`; drizzle.config.ts;
   drizzle-kit generate → `drizzle/` SQL; apply via `wrangler d1 migrations apply`
   (migrations_dir wired in wrangler.jsonc) local + remote.
4. `/api/auth/[...all]` route (GET/POST → auth.handler), auth client w/
   cloudflareClient plugin, `/login` page (email+password sign-in only).
5. `/` dashboard shell: server-side session check → redirect to /login.
6. Shared credential: signup disabled by default (`disableSignUp` unless
   `ALLOW_SIGNUP=true` var); seed once via temporarily-enabled signup on deploy,
   then flip off and redeploy. Credentials stored in `.dev.vars` comments-free keys
   (TEAM_LOGIN_EMAIL/PASSWORD) for the team.
7. Set `BETTER_AUTH_SECRET` as Worker secret (value from `.dev.vars`, never echoed).
8. Gates + deploy + live verification (login → dashboard, wrong password rejected,
   signup absent).

Uncertainties routed: better-auth-cloudflare 0.3.0 integration pattern verified
against its live README (withCloudflare, per-request initAuth, KV 60s TTL note);
package versions verified on npm (better-auth 1.6.23, adapter 1.6.23, CLI 1.4.21).

## Notes / Decisions
- Live verification evidence (2026-07-09, version e3496d07, all via curl against
  https://mugen-ai.kedalen.dev):
  - signup closed: POST /api/auth/sign-up/email → 400
    `EMAIL_PASSWORD_SIGN_UP_DISABLED`
  - unauthenticated `/` → 307 redirect to `/login`
  - wrong password → 401; correct shared credential → 200 + session cookie
  - with session cookie, `/` → 200 (dashboard renders)
  - client-bundle grep: secret VALUE clean across .next/static +
    .open-next/assets (invariant 6); the env KEY NAME appears only inside
    better-auth's isomorphic runtime-env accessor — inert, accepted by reviewer
    (disc-T-002.md; don't re-flag)
- Seeding flow: ALLOW_SIGNUP var flipped true for one deploy (version c82a8a0d),
  shared user `team@kedalen.dev` created, flipped back false and redeployed.
  Credentials live in `.dev.vars` (TEAM_LOGIN_EMAIL / TEAM_LOGIN_PASSWORD).
- Reviewer FAIL round 1 fixed: CLI-only auth instance moved out of the runtime
  module into `src/lib/auth/cli.ts` (generation entrypoint only); `createAuth`
  exported for it.
- Human answered Q-1 remainder mid-ticket: SILLAGE_API_KEY + FULLENRICH_API_KEY
  now present in `.dev.vars` (noticed while seeding).
- Reviewer FAIL round 2 fixed: `@better-auth/drizzle-adapter` (not on the
  ratified list) removed — replaced with better-auth's built-in
  `better-auth/adapters/drizzle` export. Zero extra dependencies.

## Reviewer verdict
