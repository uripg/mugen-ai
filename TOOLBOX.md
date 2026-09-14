# TOOLBOX.md — extra tools & project wiring (per project)

> **Human-written input.** You (the human) edit this file; the agent never does.
> Read at inception (LOOP.md §2.0) and re-read at the start of every session.
>
> **The agent is permissive by default:** it may use anything its environment
> already offers — installed CLIs, MCP servers, skills, the standard toolchain —
> without it being listed here. This file exists to tell the agent about things it
> **couldn't safely discover or assume on its own**: which reviewer command to use,
> which gate commands are canonical, where credentials live, and any extra tools or
> loops you're granting. Anything the agent must NOT do goes in `CONSTRAINTS.md`,
> not here.

---

## 1. Reviewer (required)

The independent, read-only second model that verifies tickets when LOOP.md's STEP 7
risk gate requires it (LOOP.md §6). `scripts/reviewer-ask.sh` and
`scripts/reviewer-verify.sh` call it.

- **Command:** `codex exec` (default — edit the two scripts if you change this).
  Runs at low reasoning effort by default for speed; override per call with
  `REVIEWER_EFFORT=medium|high`.
- **Authenticated:** yes / no ← confirm before the first run
- **Notes:** must be able to read the repo; must NEVER edit files. Any CLI that can
  read a directory and answer a prompt works (a second Claude, gemini, etc.).

## 2. Gate commands

The canonical commands STEP 6 and the Definition of Done (`AGENTS.md` §6) run. If
you leave this on defaults, the agent proposes the gates with ARCHITECTURE.md at
inception and you ratify them there.

| Gate | Command |
|---|---|
| type-check | `<e.g. bun run typecheck>` |
| lint | `<e.g. bun run lint>` |
| test | `<e.g. bun run test>` |
| smoke (optional) | — |

## 3. Credentials & services granted

Third-party services the agent may use *because you've provisioned access* — say
where each secret lives (env var, `.dev.vars`, secret manager); never paste values
here. Without an entry the agent won't assume a credential exists — it'll ask.

- `<service>` — `<mode: test/sandbox/live>` — `<where the credential lives>`

## 4. Extra tools, MCP servers & skills

Anything beyond the ambient environment you want the agent to know about or prefer:
a specific deploy CLI, a project MCP server, a skill to use for a class of work.

- `<tool/server/skill>` — `<what it's for / when to prefer it>`

## 5. Optional loops

Per-change-type loops STEP 6 must run to their exit criteria before reviewer
verification.

- `<e.g. a UI design loop for UI tickets, with its exit criteria>`

## 6. Environment notes

Anything environment-specific worth knowing up front: package manager, runtime
versions, how to run the dev server, ports in use, quirks.

- Package manager: **bun** (`bun.lock` present).
- The repo was scaffolded with `create-cloudflare` — Next.js deployed to Cloudflare
  Workers via OpenNext (`wrangler.jsonc`, `open-next.config.ts`); local secrets in
  gitignored `.dev.vars`.
