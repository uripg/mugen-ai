# LOOP-SPRINT.md — sprint overrides (time-boxed builds, ~3 hours)

**This file overlays `LOOP.md` for a time-boxed sprint with the human present.**
Read `LOOP.md` first; everything not overridden here still applies. The premise
shift: the base loop is built for multi-week autonomous work with an absent human —
its ceremony (full stops, per-ticket gates, blocking-question stops) buys
resumability and safety across long gaps. In a sprint the human is **in the chat**,
so feedback is seconds away and the ceremony is replaced with cheaper equivalents.

The overlay is active when the human kicks off with the sprint command (§8) or
`MEMORY.md` says `MODE: sprint`. Record the mode and the agreed time budget in
`MEMORY.md` at kickoff.

---

## §1. What is NOT relaxed (read this first)

Sprint mode trades ceremony for speed — never safety:

- `CONSTRAINTS.md` applies in full. `AGENTS.md` §0 (never guess), §1 invariants,
  §5 human-only decisions, and §8 posture apply in full.
- Secrets, auth, money, personal data: same rules, same reviewer requirement.
- Never weaken a test or criterion to go green.
- Commit per ticket — small commits are what make a 3-hour sprint recoverable.

## §2. Inception → one live ratification (replaces LOOP.md §2.0/§2.1's two stops)

1. Draft **lean** spec docs: `SPEC.md` ~1 page, `ARCHITECTURE.md` ~1 page + build
   sequence, `AGENTS.md` slots with 5–8 invariants max. Skip the inception
   reviewer pass; the human's live review replaces it.
2. Decompose immediately into **5–8 vertical-slice tickets** (§3) in the same
   pass — do not stop between docs and tickets.
3. Present docs + ticket plan + wave plan (§6) to the human **in the chat** as one
   summary and get a single go/adjust answer. That answer is ratification — flip
   the STATUS markers, commit once, start building. Target: coding starts within
   ~20 minutes of kickoff.

**Blocking questions never stop the sprint:** ask the human in the chat, keep
working on whatever isn't blocked while waiting, and log the answer in `MEMORY.md`.
Only set a ticket `blocked` if the human is truly unreachable.

## §3. Ticketing: few, big, vertical

- 5–8 tickets total. Each is a vertical slice that ends in something visible
  (screen + API + data), not a layer.
- Ticket 1 is always the **skeleton**: scaffold adjustments, deploy pipeline,
  shared types/schema, app shell. It runs **serial** — everything else depends on
  the interfaces it freezes.
- Each ticket's frontmatter gains two sprint fields:
  `wave: N` (parallel group, §6) and `files: [...]` (the path globs it owns —
  used to prove waves are disjoint).
- Plan sections: 3 bullets max. Uncertainties still listed, but routed live (§2).

## §4. Checkpoints (replaces LOOP.md §5 CONTEXT FULL STOP)

After each ticket: update the ticket status, `git commit`, append one line to
`.loop/log.md`. That's the whole checkpoint — no `MEMORY.md` essay, no
resumability proof. Do a real LOOP.md §5 full stop only at genuine context
pressure or the end of the sprint. `MEMORY.md` gets updated at wave boundaries
and at the end, not per ticket.

## §5. Gates & review at milestones (replaces per-ticket STEP 6/7 cadence)

- **Continuous:** type-check after every ticket (it's fast). Fix immediately.
- **Milestone gates:** the full suite (type-check + lint + tests + secret-grep
  smoke) runs at each **wave merge** (§6) and once more in the final polish pass —
  not after every ticket.
- **Reviewer:** the STEP 7 risk gate stands (invariant/security/data/money/schema
  tickets MUST be reviewed; trivial ones skip with a logged reason), with two
  sprint adjustments:
  1. **Batch per wave:** one `reviewer-verify.sh` call covers the wave's merged
     diff (pass the wave's primary ticket id; note the other ids in the ticket).
  2. **Run it async:** fire the reviewer in the background at a wave merge and
     start the next wave while it runs; address findings when they land. Never
     end the sprint with an unread verdict or an unresolved FAIL.
- Discussion cap in sprint mode: **1 round**, then straight to the human in-chat.

## §6. Parallel waves via git worktrees (replaces the serial main loop)

After the skeleton ticket lands, group the remaining tickets into **waves** of up
to 3 tickets whose `files:` footprints are **disjoint** (proven at plan time, §3).
Tickets that touch shared code go in different waves or run serial.

**Per wave:**

1. **Freeze shared surface.** Shared types/schemas/utilities the wave depends on
   are frozen — a parallel agent that needs a shared-surface change stops that
   ticket and reports back; the orchestrator makes the change serially, then
   resumes the wave. Parallel agents never edit shared files, `MEMORY.md`, or
   another ticket's files.
2. **Spawn one implementer agent per ticket, each in its own worktree.** In
   Claude Code: the Agent tool with `isolation: "worktree"` (or manually:
   `git worktree add ../<repo>-T-NNN -b sprint/T-NNN`). Each agent's brief is:
   its ticket file verbatim, `AGENTS.md`, the frozen-surface list, and the
   instruction to implement + type-check + commit on its branch and return a
   summary of what it changed — nothing outside its `files:` globs.
3. **Merge in dependency order** back on the main branch, one ticket at a time:
   merge → type-check → next. Conflicts should be near-impossible if footprints
   were truly disjoint; a real conflict means the wave plan was wrong — fix
   serially, note it in `MEMORY.md`.
4. **Wave gate:** full milestone gates (§5) on the merged result, then the
   batched/async reviewer call, then clean up worktrees
   (`git worktree prune` after removing merged branches' worktrees).

The orchestrator (the main session) does not implement during a wave — it
prepares the next wave, watches for agent questions, and handles merges. Anything
an agent was unsure about is re-checked at merge, because parallel agents can't
ask the human directly.

## §7. Suggested time budget (3h — adjust at kickoff, track in MEMORY.md)

- 0:00–0:20 — inception + live ratification (§2)
- 0:20–0:50 — skeleton ticket, serial (deployable "hello" end-to-end)
- 0:50–2:20 — 2–3 parallel waves (§6), merging + async review between
- 2:20–2:50 — integration polish, full gates, remaining reviewer findings
- 2:50–3:00 — final full stop (LOOP.md §5), deploy only if the human says go

At the halfway mark, cut scope, not corners: drop whole tickets (file them as
later-phase), never the invariants or the gates.

## §8. Kickoff

The human starts a sprint with:

> **"Read LOOP.md, then LOOP-SPRINT.md and MEMORY.md, and run the sprint."**

(Wired as `/sprint` in `.claude/commands/sprint.md`.) `IDEA.md` must be filled in
first — for a sprint, even rough bullets are enough; §2's live conversation fills
the gaps.
