# ARCHITECTURE.md — technical design (how)

> **STATUS: RATIFIED 2026-07-09.** Drafted at inception (LOOP.md §2.0) from
> `IDEA.md` + the drafted `SPEC.md`. [agent-proposed] items were accepted at
> ratification. This file is now read-only; changes are an `AGENTS.md` §5 human
> decision.
>
> At ratification the human explicitly signed off (MEMORY.md Q-2, Q-5): (a) the
> **new dependencies (prod and dev)** listed in §2, and (b) **deploys to the demo
> Worker `mugen-ai`, served at `mugen-ai.kedalen.dev`**.

---

## 1. System shape

One Next.js application deployed to Cloudflare Workers via OpenNext. Everything —
UI, API routes, the agent pipeline — lives in this single Worker. No separate
services.

```
Browser (team, Better Auth session)
   │
   ▼
Next.js on Cloudflare Workers (OpenNext)
   ├── Dashboard page (server components + client polling)
   ├── /api/auth/*          Better Auth (D1-backed, KV for session cache/rate limit)
   ├── /api/pipeline/run    starts a pipeline run for an account/signal
   ├── /api/leads ...       read leads / approve / edit / regenerate
   │
   ├── Pipeline (server-side agent loop, Anthropic API)
   │      tools: get_signals ──────► Sillage V2 API
   │             enrich_contact ───► FullEnrich API
   │             research_market ──► Anthropic web_search (server tool)
   │      playbooks: team-authored JP/KR/SG files (read-only input to prompts)
   │
   ├── D1 (SQLite)  accounts, signals, contacts, deal intelligence, drafts,
   │                approval state, pipeline run status
   └── KV           Better Auth session cache + rate limiting
```

**Pipeline execution model [agent-proposed]:** a pipeline run is started by an
authenticated POST (`/api/pipeline/run`) and processes **one account/signal
end-to-end within that request**, writing each stage's result to D1 as it completes
(signal → contact → committee → notes → score → draft). The dashboard **polls** a
read endpoint every few seconds, so cards visibly populate stage-by-stage as rows
update. Rationale: polling + per-request runs is the simplest thing that satisfies
"live-updating" and "survives refresh" (state is in D1, not in a socket); no
Queues/Workflows/Durable Objects needed for a demo. To demo all three markets, the
dashboard fires one run per account (sequentially or in parallel requests). If a
single run risks Workers request limits in practice, split it into per-stage
requests chained from the client — same D1 state model, no architectural change.

## 2. Stack (every committed choice; seeds AGENTS.md §2)

Already in the scaffold (commit `be6da4d`):

| Choice | What / why |
|---|---|
| TypeScript (strict) | Per IDEA.md — throughout. |
| Next.js 16 (App Router) | Per IDEA.md; scaffolded by create-cloudflare. |
| `@opennextjs/cloudflare` | The current, preferred Workers adapter (the deprecated `@cloudflare/next-on-pages` is banned per IDEA.md). Deploy = `opennextjs-cloudflare build && deploy`. |
| Tailwind CSS 4 | In the scaffold; used for the dashboard UI. |
| bun | Package manager (TOOLBOX.md §6). |
| wrangler | Bindings, D1/KV provisioning, secrets, deploys. |

New production dependencies **[agent-proposed — ratification of this doc is the
CONSTRAINTS.md sign-off for adding them]**:

| Dependency | Why |
|---|---|
| `better-auth` (+ the community `better-auth-cloudflare` package/CLI template) | Per IDEA.md — team-only login wired to D1 + KV. Known sharp edges honored: instantiate Better Auth **per-request** with that request's D1 binding (a module-scope instance locks up under Workers isolates), and override the KV rate-limiter TTL above KV's 60-second minimum. |
| `drizzle-orm` + `drizzle-kit` (dev) | The better-auth-cloudflare template's schema/migration path for D1; also used for our own tables. **[agent-proposed]** — beats hand-rolled SQL migrations for a one-day build. |
| `@anthropic-ai/sdk` | The agent pipeline: Claude tool-use loop + the native `web_search` server tool. |
| `zod` | Validate all external input at the boundary: API route bodies and Sillage/FullEnrich responses. |
| ~~`vitest` (dev)~~ | Dropped 2026-07-09 by human decision at plan review — testing radically reduced for iteration speed; no unit-test suite in Phase 1. |

**Model [agent-proposed]:** the pipeline uses a current Claude model via the
Anthropic API; exact model id chosen at implementation time against current docs
(training data is stale on model ids — AGENTS.md §0).

External services (credentials are Worker secrets / `.dev.vars` — see MEMORY.md
blocking question on provisioning):

- **Sillage V2 API** — expansion-readiness signals (hiring, exec joins, competitor
  engagement, funding). API surface verified against current docs at
  implementation time.
- **FullEnrich API** — contact enrichment. Returns-nothing case is surfaced as
  "no verified contact", never invented (invariant).
- **Anthropic API** — Claude tool-use loop + `web_search` server tool for
  `research_market`.

**Conventions:** conventional commits referencing the ticket id
(`feat(T-004): …`); ESLint (scaffold config); TypeScript strict mode stays on.

## 3. Data model (all in D1; Better Auth's own tables managed by its CLI)

| Table | Purpose / key fields |
|---|---|
| `accounts` | Tracked target companies: name, market (`jp`\|`kr`\|`sg`), domain, Sillage identifier. |
| `signals` | Raw signals from `get_signals`: account_id, type (hiring \| exec-join \| competitor-engagement \| funding), payload JSON, detected_at, **source** (Sillage). |
| `contacts` | Enriched people from `enrich_contact`: signal/account link, name, title, verified email/handle, committee_role (champion \| economic-buyer \| …), enrichment payload, **verified flag** — a row exists only for a real FullEnrich result. |
| `leads` | One card on the dashboard: account_id, signal_id, pipeline stage/status, readiness score (0–100), **score_reasoning** (never null when score is set), status (`draft` \| `approved` \| `edited` \| `sent-simulated`), timestamps. |
| `deal_intel` | Per-lead intelligence: cultural note + psychology note (**playbook-sourced, with playbook key recorded**), competitor note (+ `research_market` citation payload), repositioned value prop. |
| `drafts` | Outreach drafts per lead: body (English), version (regenerations append), edited_body. |
| `pipeline_runs` | Run bookkeeping: lead/account, current stage, status, error, started/finished — what the dashboard polls. |

Every AI-produced row stores enough provenance (source tool + raw payload
reference) that the why-panel can trace each data point to a real call
(SPEC.md §6 / invariant 2).

**Playbooks are not data:** the JP/KR/SG cultural buying-process notes, buyer
psychology notes, and committee-role heuristics live as **team-authored files in
the repo** (`src/lib/playbooks/{jp,kr,sg}.ts`), version-controlled and human-edited
only. The pipeline quotes/selects from them; the model never authors their content.

## 4. Security boundaries (seeds AGENTS.md §1 / §8)

- **Secrets** (`ANTHROPIC_API_KEY`, `SILLAGE_API_KEY`, `FULLENRICH_API_KEY`,
  `BETTER_AUTH_SECRET`) exist only as Cloudflare Worker secrets (prod) and
  gitignored `.dev.vars` (local). Never committed, never in `NEXT_PUBLIC_*`, never
  in client bundles; all third-party calls happen server-side.
- **Auth is the outer wall:** every dashboard page and every non-auth API route
  checks the Better Auth session server-side; unauthenticated → redirect/401. The
  client is never trusted for authorization.
- **Validation edge:** all external input — API route bodies AND third-party API
  responses (Sillage, FullEnrich) — is zod-validated before use or persistence.
- **Approval gate is server-enforced:** the only path to `sent-simulated` is an
  authenticated approve action; there is no auto-send code path at all in v1.
- **PII containment:** enriched personal data lives only in this demo's D1
  database, is never repurposed, and never appears in logs (log ids, not names or
  emails).
- **Spend containment:** paid API calls (Anthropic/Sillage/FullEnrich) happen only
  inside explicit, human-triggered pipeline runs — no cron, no webhook, no retry
  storms (bounded retries only).

## 5. Project layout (target; seeds AGENTS.md §3)

```
src/
  app/
    page.tsx               dashboard (the one live-updating page)
    login/                 Better Auth sign-in
    api/
      auth/[...all]/       Better Auth handler
      pipeline/run/        start a run (auth-gated)
      leads/               list/read leads (poll target), approve/edit/regenerate
  lib/
    auth/                  per-request Better Auth instance (D1 + KV bindings)
    pipeline/              the agent loop: stages, prompts, scoring assembly
    tools/                 get_signals.ts, enrich_contact.ts, research_market.ts
    playbooks/             jp.ts, kr.ts, sg.ts — TEAM-AUTHORED ONLY
    db/                    drizzle schema + client
  components/              dashboard cards, why-panel, approve/edit controls
drizzle/                   migrations
tickets/  scripts/  .loop/  designs/    (loop-owned paths — AGENTS.md §3)
```

## 6. Build sequence (Phase-1 tickets are cut from this; mirrors SPEC.md §2)

0. **Human Step 0 gate** — Sillage/FullEnrich spot-check confirmed done (blocking
   question in MEMORY.md; no code depends on it, but pipeline tickets do).
1. **Skeleton deploy (Step 0.5):** wire Better Auth + D1 + KV into the existing
   scaffold (via the better-auth-cloudflare template/CLI), provision D1/KV with
   wrangler, set secrets, add gate commands (typecheck/lint/test scripts), deploy;
   a login-gated "hello" page live on the real workers.dev URL.
2. **Core headless pipeline:** the three tools + Claude loop for ONE market
   (Singapore — safest data coverage per IDEA.md), one contact, no deal
   intelligence; invoked by an auth-gated route; results in logs/D1 rows. This is
   the safety net if time runs short.
3. **Dashboard v1:** leads table in D1 + the dashboard page with polling; cards
   populate from the core pipeline; Approve / Edit / Regenerate actions with
   server-enforced state that survives refresh.
4. **Deal Intelligence layer:** buying-committee enrichment (+1 contact),
   playbook-sourced cultural + psychology notes, `research_market` competitor
   note, repositioned value prop; readiness score + why-panel rendering all of it.
5. **All three markets:** JP + KR accounts/playbooks enabled; per-market run
   verified with real data.
6. **Polish + full live run-through** against the deployed URL (90-second demo
   path).
7. **STRETCH — inbound qualification entry point** (only if 1–6 are fully done).

Cut order under time pressure (per SPEC.md): 2nd committee contact → competitor
research → cultural/psychology notes (one generic team-authored line each). The
core loop and why-panel are never cut.
