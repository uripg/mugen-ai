# MEMORY.md — loop source of truth

> The loop's durable state. A zero-context agent reading this + `tickets/` + `git log`
> must be able to continue with no loss. Updated at every full stop (LOOP.md §5).

---

## Current phase

**Main loop running (plan approved 2026-07-09 with testing-reduction amendment).**
`SPEC.md`, `ARCHITECTURE.md`, `AGENTS.md` are `RATIFIED` (amended twice by human
decision: testing reduced; shadcn-exclusive UI).

**Board:** T-001..T-004, T-014 **done** · T-005..T-013 todo.
Playbooks (Q-3) transcribed to `src/lib/playbooks/`. App live at
https://mugen-ai.kedalen.dev behind the shared team login.

## Active ticket

None in progress. **Next: T-005 (enrich_contact — FullEnrich client).** After
that: T-006 research_market → T-007 core pipeline (SG) → T-008 dashboard.
Note for T-010: the human playbooks use committee-role labels beyond the
contacts.committeeRole enum (strategic evaluator, commercial evaluator/gatekeeper,
market-entry scout, senior sponsor) — extend the enum or map at intel time.

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

- 2026-07-09 · **Human decision: shadcn/ui + shadcn CLI EXCLUSIVELY for all UI**
  (hard requirement) · recorded in AGENTS.md §2 + ARCHITECTURE.md §2; UI tickets
  amended; T-014 filed to init shadcn and convert the T-002 screens.
- 2026-07-09 · **Human: "spend is ok"** — explicit spend authorization for the
  Sillage / FullEnrich / Anthropic hackathon keys within plan limits (satisfies
  invariant 10's gate + CONSTRAINTS "no real money" carve-out). Also: agent runs
  `wrangler secret put` itself — done; all 4 secrets live on the Worker
  (SILLAGE_API_KEY, FULLENRICH_API_KEY, CLAUDE_API_KEY, BETTER_AUTH_SECRET).

- 2026-07-09 · **T-004 done** (reviewer PASS after 1 fix round). Canonical
  Sillage doc = in-repo `SILLAGE_API.md`. Design: resolve account → workspace
  company id via TAL (cached in `target_accounts.sillage_id`, ids
  130411–130422 all resolved), `POST /v2/workspace/signals/query` unfiltered
  (v2 `type` filter omits deepSearch/jobPosting), deterministic client-side
  mapping to the 4 SPEC types, raw-payload provenance, dedupe on detection id.
  Created Sillage agent #2680 `job_posting_keyword_detection`
  ("Intl/Europe-facing hiring — mugen-ai", keywords from SPEC §2.3) alongside
  existing job_update #2553; runs #1051/#1052 → 340 live detections; tool
  persisted DBS 41 / MUFG 167 / Nium 28 / MoneyForward 1 / Toss 0 (honest
  empty) into LOCAL D1. Notes: Sillage emits duplicate detections per posting
  (dedupe-for-display deferred to T-007/T-008); signal-type coverage today =
  hiring + exec-join only (see open items below).

## Blocking questions (awaiting the human)

**Non-blocking items for the human (build continues):**
- Competitor-engagement signals need a Sillage **competitor watchlist agent**,
  but WHICH European competitor companies to watch is the team's business
  call — tell me the list (or add the agent in the Sillage UI) and T-007+ will
  surface those signals. Funding signals: deepSearch agents aren't creatable
  via the API — if the Sillage UI offers a Deep Search agent, enabling it adds
  funding coverage; the tool already maps both types.
- Sillage workspace is shared & churning: someone's "KFTC" add resolved to
  "Kentuckians For The Commonwealth" (kftc.org) — wrong company, worth
  removing in the UI. Also the 8 SaaS accounts (Rippling, Asana, …) from
  earlier experiments were replaced on the TAL at ~13:45Z by parties unknown —
  coordinate with teammates so our 12 banks stay on the list.

<!-- Q-N · <question, why it blocks, options, recommendation> · asked <date> -->
- ~~Q-1 (remainder)~~ **RESOLVED 2026-07-09**: human added `SILLAGE_API_KEY` and
  `FULLENRICH_API_KEY` to `.dev.vars` during T-002. Prod `wrangler secret put`
  still pending (QUESTIONS.md Q-1 item 3 preference unanswered — agent will set
  them when the pipeline deploys unless told otherwise).
- ~~Q-3~~ **RESOLVED 2026-07-09**: playbooks for all three markets supplied in QUESTIONS.md, transcribed verbatim to src/lib/playbooks/{jp,kr,sg}.ts (with sources + fallback lines). Was: Team-authored JP/KR/SG
  cultural buying-process notes, buyer psychology notes, committee-role
  heuristics + one generic fallback line per market. Blocks: the Deal Intelligence
  tickets only. · asked 2026-07-09
- **Q-4 · Sillage half RESOLVED 2026-07-09**: mapping completed; all 12 banks
  `found` on the TAL and real signals verified live (T-004). Note: Tokio
  Marine Insurance Group (Asia) classified as sg (regional HQ Singapore) —
  human to correct if wrong. **Still open: FullEnrich spot-check note**
  (blocks nothing until T-005's live-test criterion; T-005 client can be
  built first). · asked 2026-07-09
- ~~HOLD~~ **LIFTED 2026-07-09**: human confirmed via /loop prompt — proceed to
  T-004/T-005. (Was: after secrets were set, human said "hold".)

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
- Secrets local: `.dev.vars` (gitignored) — `CLAUDE_API_KEY`,
  `BETTER_AUTH_SECRET`, `SILLAGE_API_KEY`, `FULLENRICH_API_KEY`, plus the shared
  team login (`TEAM_LOGIN_EMAIL`/`TEAM_LOGIN_PASSWORD`). Prod Worker secrets:
  only `BETTER_AUTH_SECRET` set so far; the three API keys go up via
  `wrangler secret put` with the pipeline tickets.
- UI: shadcn/ui EXCLUSIVELY via the shadcn CLI (hard requirement) — components.json
  at repo root, components in `src/components/ui/`.
