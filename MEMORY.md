# MEMORY.md — loop source of truth

> The loop's durable state. A zero-context agent reading this + `tickets/` + `git log`
> must be able to continue with no loss. Updated at every full stop (LOOP.md §5).

---

## Current phase

**Ratified 2026-07-09 → Phase-1 tickets cut (T-001..T-013), reviewer plan review
addressed. Awaiting human review of the ticket plan (LOOP.md §2.1.7) + answers in
`QUESTIONS.md`.** `SPEC.md`, `ARCHITECTURE.md`, `AGENTS.md` are `RATIFIED` and
read-only.

**Next action:** human reviews the ticket plan in `tickets/` and (in parallel or
after) answers `QUESTIONS.md` (Q-1 remainder: Sillage/FullEnrich keys + spend
authorization; Q-3 playbooks; Q-4 spot-check companies). Then run the loop → main
loop starts at T-001 (unblocked: T-001, T-002, T-003 need no pending answers).

## Active ticket

T-003 **done** (reviewer PASS round 3). All 7 app tables live in D1 (local +
remote), provenance columns throughout, score⇄reasoning CHECK enforced. App
accounts table renamed **`target_accounts`** (better-auth owns `accounts`).

**Next: T-004 (get_signals) + T-005 (enrich_contact)** — both now *startable*
(T-003 done, keys in `.dev.vars`) but *not completable* without QUESTIONS.md
**Q-4** (spot-check companies to run live calls against) and ideally the
Sillage/FullEnrich API doc links (QUESTIONS.md Q-1 optional items). T-010/T-012
still gated on **Q-3** (playbooks). Board: T-001..T-003 done; T-004..T-013 todo.

## Decisions log

<!-- <date> · <decision> · <one-line rationale> — settled decisions are not re-litigated -->
- 2026-07-09 · TOOLBOX.md §2–§5 and CONSTRAINTS.md were unedited templates → defaults
  treated as in force. Gate commands agent-proposed in AGENTS.md §6, ratified.
- 2026-07-09 · `designs/` is empty → no visual design input; agent proposes UI per
  DESIGN.md and flags UI tickets as unvalidated-by-design.
- 2026-07-09 · Pipeline execution model: one account/signal per authenticated
  request, stage results written to D1, dashboard polls · ratified with
  ARCHITECTURE.md §1 (fallback: per-stage requests chained from client).
- 2026-07-09 · Auth: single shared email+password via Better Auth · ratified.
- 2026-07-09 · Reviewer CLI confirmed working: `codex` 0.142.5.
- 2026-07-09 · Inception reviewer pass (`.loop/reviewer/ask-inception.md`) findings
  all addressed (invariants 12–13, no-mocks/messaging/spend wording, §5 additions,
  Q-5..Q-7).
- 2026-07-09 · **Human ratified all three docs** and answered: Q-1 keys live in
  `.dev.vars` (see remainder below); Q-2 deploys approved to Worker `mugen-ai` at
  **mugen-ai.kedalen.dev**; Q-5 dependency list approved; Q-6 no retention
  mechanism needed — the project will not continue to exist after the hackathon
  (pitch statement stands; no wipe script required); Q-7 scaffold commit timestamp
  confirmed compliant.
- 2026-07-09 · `.dev.vars` names the Anthropic key `CLAUDE_API_KEY` (not
  `ANTHROPIC_API_KEY`) · code must pass it explicitly to the SDK, not rely on the
  default env var name.
- 2026-07-09 · Pending human inputs expanded into `QUESTIONS.md` (human-requested;
  answers get transcribed back here, file then archived).
- 2026-07-09 · Phase-1 plan = 13 tickets T-001..T-013 mirroring ARCHITECTURE.md §6;
  STRETCH inbound-qualification deliberately not ticketed (SPEC: only after
  everything works). Reviewer plan review
  (`.loop/reviewer/ask-ticket-plan.md`) verdict "mostly sound"; all 5 patches
  applied (Q-1 spend gate on T-006, explicit Q-1/Q-4 blockers on T-007, invariants
  2/5 on T-008, regenerate-is-paid-run on T-009 w/ invariants 8/10, T-011→T-012
  typo in T-010) + scope-guard notes on T-003/T-010.

- 2026-07-09 · **Human decision at plan review: testing radically reduced for
  iteration speed** — vitest dropped, no unit-test suite in Phase 1, test gate
  removed from AGENTS.md §6 table and all tickets; verification = typecheck + lint
  + build + exercising the change live. (Human-authorized amendment to the
  ratified AGENTS.md/ARCHITECTURE.md test slots.) Plan otherwise approved → main
  loop started.

## Blocking questions (awaiting the human)

<!-- Q-N · <question, why it blocks, options, recommendation> · asked <date> -->
- ~~Q-1 (remainder)~~ **RESOLVED 2026-07-09**: human added `SILLAGE_API_KEY` and
  `FULLENRICH_API_KEY` to `.dev.vars` during T-002. Prod `wrangler secret put`
  still pending (QUESTIONS.md Q-1 item 3 preference unanswered — agent will set
  them when the pipeline deploys unless told otherwise).
- **Q-3 · Playbook content (pending, human said).** Team-authored JP/KR/SG
  cultural buying-process notes, buyer psychology notes, committee-role
  heuristics + one generic fallback line per market. Blocks: the Deal Intelligence
  tickets only. · asked 2026-07-09
- **Q-4 · Step 0 spot-check (pending, human said).** 1 JP + 1 KR + 1 SG company
  added to Sillage, 2–3 contacts each test-enriched in FullEnrich; share the three
  company names/domains to seed `accounts`. Blocks: pipeline tickets that hit real
  APIs. · asked 2026-07-09

## Env / setup notes

- Repo pre-exists the loop: `create-cloudflare` Next.js scaffold (bun, OpenNext on
  Workers), commit `be6da4d`.
- Package manager: bun. Deploy: `bun run deploy`. Worker `mugen-ai`, served at
  **mugen-ai.kedalen.dev** (custom domain bound in wrangler.jsonc; live since
  T-001, version 8b265662).
- D1 `mugen-ai-db` → binding `DB`; KV `mugen-ai-kv` → binding `KV`
  (wrangler.jsonc; ids in T-001 notes).
- Next 16: `next lint` removed — lint = `eslint .` with flat
  eslint-config-next imports (T-001 note). Gates: `bun run typecheck` / `lint` /
  `build`.
- Secrets local: `.dev.vars` (gitignored) — has `CLAUDE_API_KEY`,
  `BETTER_AUTH_SECRET`; missing Sillage/FullEnrich (Q-1 remainder). Prod: Worker
  secrets via `wrangler secret put` (not yet set).
- No `typecheck`/`test` scripts yet — added in the skeleton ticket per AGENTS.md §6
  gates.
