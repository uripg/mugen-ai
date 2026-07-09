# MEMORY.md — loop source of truth

> The loop's durable state. A zero-context agent reading this + `tickets/` + `git log`
> must be able to continue with no loss. Updated at every full stop (LOOP.md §5).

---

## Current phase

**Inception (LOOP.md §2.0) — draft complete, awaiting human ratification.**
`SPEC.md`, `ARCHITECTURE.md`, and the `AGENTS.md` project slots are drafted
(`STATUS: DRAFT`), reviewer-checked, and committed.

**Next action:** human reviews/edits the three drafts and the blocking questions
below. On approval: flip the three STATUS markers to `RATIFIED <date>`, answer
Q-1–Q-4, commit — then run the loop again for ticket decomposition (LOOP.md §2.1).

## Active ticket

None (pre-tickets phase).

## Decisions log

<!-- <date> · <decision> · <one-line rationale> — settled decisions are not re-litigated -->
- 2026-07-09 · TOOLBOX.md §2–§5 and CONSTRAINTS.md were unedited templates → defaults
  treated as in force (per LOOP.md §2.0.1). Gate commands therefore agent-proposed in
  AGENTS.md §6 for ratification.
- 2026-07-09 · `designs/` is empty → no visual design input; the agent proposes UI
  designs per DESIGN.md and flags UI tickets as unvalidated-by-design.
- 2026-07-09 · Pipeline execution model [agent-proposed]: one account/signal per
  authenticated request, stage results written to D1 as they complete, dashboard
  polls · simplest model satisfying "live-updating + survives refresh" without
  Queues/DOs (ARCHITECTURE.md §1).
- 2026-07-09 · Auth [agent-proposed]: single shared email+password via Better Auth ·
  no OAuth app to register; IDEA.md allows either.
- 2026-07-09 · Reviewer CLI confirmed installed and working: `codex` 0.142.5 at
  `~/.local/bin/codex`.
- 2026-07-09 · Inception reviewer pass done (`.loop/reviewer/ask-inception.md`):
  verdict "needs changes"; all findings addressed — added invariants 12 (JP/KR/SG
  scope), 13 (no pre-hackathon commits), no-mocks + messaging-judgment + spend-gate
  wording to invariants 2/4/10; §5 gained external-publishing + broad
  destructive-ops; §2 gained Tailwind, `.dev.vars`-only, dependency-list scope;
  Q-5/Q-6/Q-7 added.

## Blocking questions (awaiting the human)

<!-- Q-N · <question, why it blocks, options, recommendation> · asked <date> -->
- **Q-1 · API credentials & spend.** TOOLBOX.md §3 lists no provisioned
  credentials, and CONSTRAINTS.md defaults say "no real money" without an explicit
  budget — but the MVP needs live Sillage V2, FullEnrich, and Anthropic keys (all
  paid). Blocks: every pipeline ticket. Please confirm each key is provisioned,
  state where it lives (expected: Worker secrets + local `.dev.vars`), and grant a
  spend line (e.g. "hackathon keys, spend within plan limits OK").
  Recommendation: add the three entries to TOOLBOX.md §3. · asked 2026-07-09
- **Q-2 · Deploy sign-off.** CONSTRAINTS.md default "no production / no live
  deploys without human sign-off" vs. IDEA.md's requirement that the demo run off a
  real deployed Cloudflare URL. ARCHITECTURE.md's header proposes that ratifying it
  grants standing sign-off for deploys **to the `mugen-ai` demo Worker only**.
  Confirm (or restrict). · asked 2026-07-09
- **Q-3 · Playbook content.** Cultural buying-process notes, buyer psychology
  notes, and committee-role heuristics for JP/KR/SG must be team-authored (IDEA.md
  non-negotiable; AGENTS.md invariant 4 — the model may not write them). Blocks:
  the Deal Intelligence tickets (not the skeleton or core pipeline). Please supply
  the content (bullets are fine) — the agent will scaffold
  `src/lib/playbooks/{jp,kr,sg}.ts` and slot your text in verbatim. Also needed for
  the cut-order fallback: one generic team-authored line per market. · asked
  2026-07-09
- **Q-4 · Step 0 spot-check.** Has the human Step 0 been done (1 JP + 1 KR + 1 SG
  company added to Sillage; 2–3 leadership contacts per company test-enriched in
  FullEnrich)? Blocks: pipeline tickets build on its outcome. If done, share the
  three company names/domains so they can seed the `accounts` table. · asked
  2026-07-09
- **Q-5 · Dependency sign-off.** CONSTRAINTS.md requires human sign-off for new
  dependencies. ARCHITECTURE.md §2 lists the proposed set: `better-auth` (+
  `better-auth-cloudflare` template), `drizzle-orm`/`drizzle-kit`,
  `@anthropic-ai/sdk`, `zod`, `vitest`. Confirm the list (ratifying
  ARCHITECTURE.md with this question answered = the sign-off; anything beyond the
  list stays a §5 item). · asked 2026-07-09
- **Q-6 · Data retention mechanics.** "Enriched personal data deleted after the
  hackathon" — is that a manual wipe by the human, something the agent should
  script (e.g. a documented `wrangler d1` wipe command), or just a pitch
  statement? Recommendation: agent documents a one-line wipe command; human runs
  it post-demo. · asked 2026-07-09
- **Q-7 · Hackathon start-time compliance.** Submission rule: no commits before
  the hackathon's start. History starts at `be6da4d` (human-made scaffold commit).
  Confirm its timestamp is after the official start. · asked 2026-07-09

## Env / setup notes

- Repo pre-exists the loop: a `create-cloudflare` Next.js scaffold (bun, OpenNext on
  Cloudflare Workers) committed as `be6da4d`. Inception treated it as the starting
  point, not a greenfield.
- Package manager: bun. Deploy script: `bun run deploy` (opennextjs-cloudflare
  build && deploy). Worker name: `mugen-ai` (wrangler.jsonc).
- No `typecheck`/`test` scripts exist yet — added in the skeleton ticket per
  AGENTS.md §6 gates.
- IDEA.md submission rule "no commits before the hackathon's start time": history
  starts at `be6da4d` (the scaffold). Assumed compliant since the human made that
  commit; flag to the human if the start time says otherwise.
