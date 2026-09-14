# CONSTRAINTS.md — what the agent may NOT do (per project)

> **Human-written input.** You (the human) edit this file; the agent never does.
> Read at inception (LOOP.md §2.0) — where it seeds `AGENTS.md` §1 (invariants) and
> §5 (human-only decisions) — and re-read every session. Constraints apply directly
> and always: if this file conflicts with anything else, **this file wins** and the
> conflict is a blocking question. A constraint that seems wrong is escalated, never
> routed around. Defaults below are in force until you edit them.

---

## 1. Hard limits (violating one is an automatic FAIL)

Defaults — keep, edit, or extend:

- **No real money.** Test/sandbox mode for every payment or paid API unless a line
  here explicitly grants a budget (e.g. "LLM API spend ≤ $5/day, key in X").
- **No production.** No live deploys, prod migrations, DNS changes, app-store
  submissions, or emails/messages to real users without human sign-off.
- **No secrets in the repo or the client.** Secrets live server-side (env/secret
  manager); never committed, never bundled client-side.
- **No new production dependencies** without human sign-off.
- **No destructive operations** on data or infrastructure that isn't disposable
  dev-local state.
- **No external publishing** (packages, posts, public repos, third-party uploads).

Project-specific additions:

- `<e.g. "everything must run offline / on-device", "no user data leaves the EU",
  "GPL-incompatible licenses banned", "API served only on localhost">`

## 2. Decisions only the human makes

Seeds `AGENTS.md` §5. Defaults — keep, edit, or extend:

- Pricing, billing mechanics, and anything that changes how money flows.
- Legal / compliance / platform-policy interpretation; consent & privacy copy.
- What personal data goes to which third parties; data retention.
- Going live (prod deploys, live API modes, real emails, publishing).
- Ratified-doc changes (`SPEC.md` / `ARCHITECTURE.md` / `AGENTS.md` after inception).

Project-specific additions:

- `<e.g. "the public API surface", "anything visible to customers of client X">`

## 3. Data rules

- What data is sensitive here: `<e.g. "user emails + amounts", "health records", "none — no user data in this project">`
- Where it may live / flow: `<e.g. "Neon dev branch only; no third-party analytics">`
- Logging: no PII in logs by default.

## 4. Scope boundaries

What this project deliberately is NOT — so the agent never drifts there:

- `<e.g. "no admin panel in Phase 1", "no mobile app", "integrations are out of scope">`
