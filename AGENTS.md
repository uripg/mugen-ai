# AGENTS.md — build rules

Rules and invariants for any agent (implementer, reviewer, or a human) working in this
repo. `LOOP.md` references this file constantly. Read it in full at the start of every
work session. Do not edit it to make a build pass — if a rule is wrong, that's a
blocking question for the human.

> **STATUS: RATIFIED 2026-07-09.** The project slots (§1 invariants, §2 stack,
> §3 layout, §5 human-only list, §6 gate names, §8 posture) were filled at
> inception (LOOP.md §2.0) from `IDEA.md` + `TOOLBOX.md` + `CONSTRAINTS.md` +
> `SPEC.md`/`ARCHITECTURE.md` and ratified by the human. The generic rules in this
> file apply to every project as-is and are never edited.

---

## §0. The most important rule: when unsure, STOP and ASK — never guess

- A flagged stop is a **success**, not a failure. A confident wrong guess about a
  platform rule, a business decision, or an API is the worst outcome in this project.
- **Your training data is stale.** Before relying on any platform / framework / SDK
  API, flag, or pricing detail, **re-verify it against current docs.** If you can't
  verify it, treat it as unknown and route the uncertainty (§ below + `LOOP.md` §4).
- Routing: **technical/design/API** uncertainty → the reviewer (`LOOP.md` §6).
  **Business / compliance / scope / anything on §5 below** → human (blocking question
  in `MEMORY.md`). Never start coding with an unresolved uncertainty.

## §1. Invariants (these must ALWAYS hold; the reviewer verifies against them)

These are the load-bearing laws of the system. A change that violates one is a
**FAIL**, regardless of acceptance criteria.

> Filled at inception. Write each as a single testable sentence, optionally with a
> rationale. Good invariants are about security boundaries, money, user data, and
> correctness — the things that must survive every refactor. Derive them from
> IDEA.md's "Non-negotiables", CONSTRAINTS.md's hard limits, and the architecture's
> security boundaries. Examples of the *shape* to aim for:
> - "Secret X never reaches the client; every call using it goes through the server."
> - "Authorization/entitlement is checked server-side; the client is never trusted."
> - "Every spend path passes a budget circuit-breaker before the paid call."
> - "No personal data leaves the device without explicit consent, and deletion works."
> - "All external input is validated at the service boundary before use."
> - "Stay on the committed stack (§2); substituting a component is a §5 item."

1. **No message is ever really sent, and nothing reaches a "sent" state without an
   explicit human approval click.** v1 has no auto-send code path at all; "sent" is
   a simulated state behind a server-enforced, authenticated approve action.
2. **Every draft, score, and piece of deal intelligence is grounded in real data
   returned by Sillage / FullEnrich / `research_market` for that contact** — never
   fabricated to look better, never papering over a market whose data came back
   empty, and **no mock data anywhere in the demo path** (SPEC.md §6). Provenance
   (source tool + payload) is stored with every AI-produced row.
3. **The readiness score is never shown as a bare number** — it always ships with
   its reasoning, visible in the why-panel.
4. **Messaging judgment, cultural buying-process notes, buyer psychology notes,
   and committee-role assumptions come only from the team-authored playbook files
   (`src/lib/playbooks/`)** — drafts are framed by the playbook's guidance; the
   model selects/quotes from it and never invents or stereotypes its own market
   claims.
5. **If FullEnrich can't find a verified contact, the product shows "no verified
   contact"** — a contact is never invented.
6. **Secrets live only in Cloudflare Worker secrets / gitignored `.dev.vars`** —
   never committed, never in the client bundle; every call using one runs
   server-side.
7. **Auth is checked server-side on every dashboard page and non-auth API route**;
   the client is never trusted for authorization.
8. **All external input (API route bodies and Sillage/FullEnrich responses) is
   zod-validated at the boundary before use or persistence.**
9. **Enriched personal data lives only in this demo's D1 database** — not
   repurposed, not persisted beyond the hackathon dataset, and no PII in logs.
10. **Paid API calls happen only inside explicit human-triggered runs** — no cron,
    no webhook, bounded retries only — **and no paid API (Anthropic / Sillage /
    FullEnrich) is called at all until TOOLBOX.md §3 / MEMORY.md records explicit
    spend authorization** (CONSTRAINTS.md "no real money"; MEMORY.md Q-1).
11. **Stay on the committed stack (§2); substituting a component is a §5 item.**
    In particular: OpenNext adapter only — the deprecated
    `@cloudflare/next-on-pages` is banned.
12. **Phase 1 scope is Japan, Korea, and Singapore only** — no generic
    multi-region capability creeps in (SPEC.md §4).
13. **Git history never contains a commit predating the hackathon's start time**
    (IDEA.md submission rule) — never rewrite history to backdate anything.

## §2. Stack & conventions (the committed choices — do not substitute without §5 sign-off)

> Filled at inception from IDEA.md's stack preferences (or agent proposals ratified
> with ARCHITECTURE.md) and any extra tools/credentials granted in TOOLBOX.md. Include:
> language(s) + strictness, framework(s), data layer, third-party services,
> validation, test framework, lint/format, secrets handling, commit convention
> (conventional commits referencing the ticket id, e.g. `feat(T-004): <summary>`).

- **Language:** TypeScript, strict mode on, throughout.
- **Framework:** Next.js 16 (App Router) deployed to Cloudflare Workers via
  `@opennextjs/cloudflare` (OpenNext). Deploy: `bun run deploy`.
- **Auth:** Better Auth via the community `better-auth-cloudflare` template —
  team-only login, no signup/roles/multi-tenant. Sharp edges honored:
  per-request auth instance with that request's D1 binding; KV rate-limiter TTL
  ≥ 60s.
- **Data:** Cloudflare D1 (drizzle-orm schema + drizzle-kit migrations); KV for
  session cache + rate limiting.
- **AI:** `@anthropic-ai/sdk` — Claude tool-use loop; `research_market` uses the
  native `web_search` server tool. Model id verified against current docs at
  implementation time.
- **External services:** Sillage V2 (signals), FullEnrich (contact enrichment) —
  keys as Worker secrets / `.dev.vars`.
- **Validation:** zod at every boundary (route bodies + third-party responses).
- **Tests:** radically reduced by human decision 2026-07-09 (iteration speed):
  no unit-test suite / no vitest; §7 applies only if a test is ever added.
  Verification = gates + exercising the change on the live deployment.
- **Lint/format:** ESLint (scaffold config). Tailwind CSS 4 (scaffold) for UI.
- **Package manager:** bun.
- **Env files:** local secrets in gitignored `.dev.vars` only — `.env.local` is
  banned in this project (IDEA.md stack notes; OpenNext dev bindings read
  `.dev.vars`).
- **Dependencies:** the exact list in ARCHITECTURE.md §2 (prod **and** dev) is
  what ratification approves; anything beyond it is a §5 item.
- **Commits:** conventional commits referencing the ticket id, e.g.
  `feat(T-004): <summary>`.

## §3. Project structure (target)

> Filled at inception to mirror ARCHITECTURE.md. Always keep these loop-owned paths:

```
tickets/           backlog (one md per ticket)
scripts/           reviewer-ask.sh, reviewer-verify.sh, dev/build helpers
.loop/             iteration log + captured reviewer transcripts
designs/           visual design exports (read-only input, if any) + DESIGN.md
```

Application code (mirrors ARCHITECTURE.md §5):

```
src/
  app/                     dashboard page, login/, api/ (auth, pipeline/run, leads)
  lib/
    auth/                  per-request Better Auth instance (D1 + KV)
    pipeline/              agent loop: stages, prompts, scoring assembly
    tools/                 get_signals.ts, enrich_contact.ts, research_market.ts
    playbooks/             jp.ts, kr.ts, sg.ts — TEAM-AUTHORED ONLY (invariant 4)
    db/                    drizzle schema + client
  components/              cards, why-panel, approve/edit controls
drizzle/                   migrations
```

## §4. Workflow (defers to LOOP.md)

One ticket at a time → resolve uncertainty first → implement → self-review →
**reviewer verification** → close out → **full stop**. Disk is the source of truth;
after every step, `MEMORY.md` + the ticket + `git log` must let a zero-context agent
continue. See `LOOP.md`.

## §5. Requires a HUMAN (blocking question → `MEMORY.md`, set ticket `blocked`, STOP)

Never decide these yourself:

> Keep this list short and sharp — it's the agent's escalation contract. Seed it from
> CONSTRAINTS.md's "Decisions only the human makes" + IDEA.md. Typical entries:
> pricing/billing mechanics, legal/compliance interpretations, anything touching what
> personal data goes where, consent copy / privacy policy, production migrations,
> spending real money, external publishing.

- **Pricing, billing mechanics, or anything that changes how money flows** —
  including granting any paid-API spend beyond what ratification/TOOLBOX.md
  provisions.
- **Legal / compliance / platform-policy interpretation; consent & privacy copy**
  — incl. anything touching GDPR / APPI / PIPA / PDPA framing in the product or
  pitch.
- **What personal data goes to which third parties; data retention** — the demo
  posture (enriched data stays in demo D1, deleted after) is fixed; any deviation
  is human-only.
- **Going live in any form:** real emails/messages to real people (v1 sends
  nothing), live API modes, publishing, DNS. Deploys to the demo Worker are
  pre-authorized by ARCHITECTURE.md ratification; anything beyond that Worker is
  human-only.
- **The content of the JP/KR/SG playbooks** (cultural notes, buyer psychology,
  committee-role heuristics) — team-authored only; the agent may scaffold the file
  shape but never writes the market content.
- **Editing or removing an acceptance criterion, eval case, or invariant.**
- **Any external publishing** — packages, posts, public repos, third-party uploads
  (CONSTRAINTS.md §1).
- **Any destructive operation on data or infrastructure that isn't disposable
  dev-local state** (CONSTRAINTS.md §1 — broader than just live-data migrations).

- **A new production dependency, or substituting any §2 stack component.** (always)
- **Any production migration or destructive change on live data.** (always)
- **An implementer↔reviewer deadlock** (3 rounds, no convergence). (always)
- **Ratified-doc changes** (`SPEC.md` / `ARCHITECTURE.md` / `AGENTS.md` after
  inception). (always)

How to ask well: write the question, why it blocks, the options you see, and your
recommendation — answerable in one reply.

## §6. Definition of Done (a ticket is not done until ALL are true)

- [ ] Acceptance criteria in the ticket are met.
- [ ] All §1 invariants the ticket touches are respected.
- [ ] All gate commands pass (type-check, lint, test — per `TOOLBOX.md` §2 or as
      ratified here at inception — plus any smoke/eval gate and any ticket-defined
      gate).

  Canonical gates **[agent-proposed at inception — TOOLBOX.md §2 was left on
  defaults]**:
  | Gate | Command |
  |---|---|
  | type-check | `bun run typecheck` (`tsc --noEmit`; script added in the skeleton ticket) |
  | lint | `bun run lint` |
  | test | — (testing radically reduced by human decision 2026-07-09 for iteration speed; vitest dropped. Verification = type-check + lint + build + exercising the change live) |
  | smoke | `bun run build` (Next.js production build compiles) |
- [ ] Platform APIs used were verified against current docs.
- [ ] Any optional loop `TOOLBOX.md` declares for this kind of change (e.g. a UI
      design loop for UI tickets) ran to its declared exit criteria.
- [ ] **Reviewer verification returned PASS** (or a disagreement was resolved, not
      overridden) — **or** the LOOP.md STEP 7 risk gate justified skipping review
      and the one-line reason is logged in the ticket's `reviewer-verdict` field
      and `MEMORY.md`. A ticket touching a §1 invariant, security, data, money, a
      new dependency, or a migration can never skip.
- [ ] `MEMORY.md`, the ticket file, and `.loop/log.md` are updated; work is committed
      referencing the ticket.

## §7. Testing & the eval gate

- The deterministic core of any feature (money math, quotas, validation, permission
  decisions) is unit-tested with clocks/costs/external services **injected**, never
  called live in tests.
- Never weaken a test or acceptance criterion to get a green build — escalate
  instead (§5).
- Critical paths get at least a smoke test asserting the §1 invariants they touch
  (e.g. "no secret in the client bundle — grep clean").

## §8. Security & privacy posture

> Filled at inception from CONSTRAINTS.md + the architecture's boundaries. Always
> keep: secrets server-side only; least-privilege API credentials; webhook/callback
> signatures verified; user data sensitive by default; no PII in logs or analytics;
> test/sandbox mode until the human says live.

- Secrets server-side only: Worker secrets in prod, gitignored `.dev.vars`
  locally; never in `NEXT_PUBLIC_*` or the client bundle (invariant 6).
- Auth is the outer wall: server-side Better Auth session check on every page and
  non-auth route (invariant 7); the approval gate is server-enforced (invariant 1).
- Enriched personal data is demo-only: demo D1 dataset, no repurposing, deleted
  after the hackathon (retention mechanics = MEMORY.md Q-6, human-decided); no PII
  in logs or analytics (invariant 9) — stated openly in the pitch as a known
  productionization gap.
- Paid APIs called only from explicit human-triggered runs, bounded retries
  (invariant 10); no real sends of any kind in v1 (invariant 1).
- All external input zod-validated at the boundary (invariant 8).
- No webhooks/callbacks in v1; if one is ever added (Phase 2 Sillage listening),
  its signature must be verified.

## §9. When in doubt

Re-read §0. Full-stop. Ask. A clean blocked ticket beats a confident wrong build.
