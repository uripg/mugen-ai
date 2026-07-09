# LOOP.md — the implementation loop

**You are the implementing agent (Claude Code) for this project.** Your job is to build
the product in `SPEC.md`, the way `ARCHITECTURE.md` says to build it, under the rules
in `AGENTS.md` — incrementally, one ticket at a time, verified by an independent
reviewer agent, and **checkpointed to disk after every step** so the work survives any
context reset.

This file is the loop. Read it fully, then execute it. It is self-resuming: at every
stop you either continue (fresh context budget) or emit the exact command for a new
session to pick up where you left off.

> **Time-boxed build?** `LOOP-SPRINT.md` overlays this file for short sprints with
> the human present (single live ratification, milestone gates, batched async
> review, parallel waves in git worktrees). It applies when the human runs
> `/sprint` or `MEMORY.md` says `MODE: sprint`; where the two conflict, the sprint
> file wins.

---

## 0. The four operating principles (these govern everything)

1. **Disk is the source of truth — not your context window.** Every decision, status
   change, and open question is written to a file the moment it happens. If your
   context were wiped this instant, a new agent reading `MEMORY.md` + `tickets/` +
   `git log` must continue with **zero loss**. If that's not true, you may not proceed.
2. **When unsure, STOP and ASK — never guess** (`AGENTS.md` §0). A flagged stop is a
   success. A confident wrong guess about a platform rule, a business decision, or an
   API is the worst outcome here.
3. **One ticket at a time, small and atomic, verified before "done."** Reviewer
   verification is **risk-gated** (STEP 7): a ticket that touches an invariant,
   security, data, money, or carries residual uncertainty MUST be independently
   reviewed and the findings addressed; a low-risk ticket may skip review with a
   logged one-line justification. Self-review (STEP 6) is never skipped.
4. **Every iteration ends with a CONTEXT FULL STOP** (§5): state flushed, work
   committed, loop resumable.

---

## 1. The files (and the order you read them)

**Human-written inputs (read-only for you; never edit to make a build pass):**
- `IDEA.md` — the human's raw project seed: what to build and why. Consumed at
  inception (§2.0) to generate the spec docs below.
- `TOOLBOX.md` — *extra* tools and project wiring. You are **permissive by
  default**: use anything your environment already offers (installed CLIs, MCP
  servers, skills) without needing it listed. This file adds what you couldn't
  safely discover or assume yourself: the reviewer command, the canonical gate
  commands, credentials that have been provisioned (and where they live), and any
  optional loops (e.g. a UI design loop) with their exit criteria. Restrictions
  never live here — they live in `CONSTRAINTS.md`.
- `DESIGN.md` + `designs/` — optional visual design input: Figma screenshot exports
  plus a screen inventory. Consumed at inception and before every UI ticket;
  `DESIGN.md` §2 defines what in the screenshots is authoritative vs. indicative.
- `CONSTRAINTS.md` — what you may *not do*: hard limits on spend, data, network,
  dependencies, and actions, plus the human-only decision list. At inception these
  seed `AGENTS.md` §1 (invariants) and §5 (human-only); afterwards they still apply
  directly — if `CONSTRAINTS.md` and anything else conflict, `CONSTRAINTS.md` wins
  and the conflict is a blocking question.

**Generated spec docs (drafted at inception, ratified by the human; then read-only):**
- `SPEC.md` — product, strategy, business intent (what / why).
- `ARCHITECTURE.md` — the technical design and its build-sequence section (how).
- `AGENTS.md` — coding rules + invariants + "ask when unsure." Generic rules are
  fixed; the project slots (§1 invariants, §2 stack, §3 layout, §5 human-only list)
  are *filled at inception, ratified by the human.*

**Mutable working state (you own these):**
- `MEMORY.md` — the loop's source of truth: current phase, active ticket, decisions
  log, env/setup notes, and **blocking questions awaiting a human**.
- `tickets/` — backlog, one md per ticket (`T-NNN-slug.md`), status in frontmatter.
  Schema: `tickets/TEMPLATE.md`.
- `.loop/log.md` — append-only iteration log (one line per step).
- `.loop/reviewer/` — captured reviewer replies and discussion transcripts.

**At the start of any work, re-read** `MEMORY.md`, `AGENTS.md`, `TOOLBOX.md`, and
`CONSTRAINTS.md` in full, plus the `SPEC.md` / `ARCHITECTURE.md` sections the current
ticket cites. Don't rely on memory.

---

## 2. Bootstrap (run only when `tickets/` is empty)

### 2.0 Inception (run first, only while any spec doc says `STATUS: NOT GENERATED`)

The human writes at most four project files: `IDEA.md` (required), `TOOLBOX.md` and
`CONSTRAINTS.md` (recommended), and `DESIGN.md` + `designs/` (optional, when visual
designs exist). Everything project-specific in the other docs is derived from them,
here — never hand-guessed later.

1. Read `IDEA.md`, `TOOLBOX.md`, and `CONSTRAINTS.md` end to end, plus `DESIGN.md`
   and the `designs/` screenshots if present. If `TOOLBOX.md` or `CONSTRAINTS.md` is
   still the unedited template, treat its defaults as in force and note that in
   `MEMORY.md`.
2. **Draft `SPEC.md`** (what/why) from `IDEA.md`, producing the sections its header
   lists. Where IDEA.md is silent on something the spec needs (pricing, scope edge, a
   §5-type call) → **blocking question** in `MEMORY.md`, not an invention.
3. **Draft `ARCHITECTURE.md`** (how) from IDEA.md + the drafted spec: honor stated
   stack preferences and any credentials/tools `TOOLBOX.md` grants; where IDEA.md
   said "agent proposes," propose with a one-line rationale (the human ratifies it
   next). Include a concrete **build sequence**.
4. **Fill the `AGENTS.md` project slots**: §1 invariants (from IDEA.md
   "Non-negotiables" + `CONSTRAINTS.md` hard limits + the architecture's security
   boundaries), §2 stack, §3 layout, §5 human-only list (from `CONSTRAINTS.md`
   "Decisions only the human makes"), §6 gate names (from `TOOLBOX.md` §2, or
   propose them for ratification if left on defaults), §8 posture.
   Do not touch the generic rules.
5. **Reviewer pass:** `bash scripts/reviewer-ask.sh "Review my inception draft:
   SPEC.md, ARCHITECTURE.md, and the AGENTS.md project slots, against IDEA.md,
   TOOLBOX.md, and CONSTRAINTS.md. Flag inventions not grounded in the inputs,
   missing invariants, constraints that didn't make it into §1/§5, and stack
   proposals with weak rationale."` Address the feedback.
6. In each drafted doc, flip the marker to `STATUS: DRAFT — awaiting human
   ratification`. Commit (`chore: inception draft from IDEA.md`), then **FULL STOP**
   (§5): the human reviews and edits/approves. On approval, flip markers to
   `STATUS: RATIFIED <date>`, commit — from that moment the three docs are read-only
   inputs, and changing them is an `AGENTS.md` §5 human decision.

### 2.1 Ticket decomposition (run when ratified and `tickets/` is empty)

1. Read `SPEC.md`, `ARCHITECTURE.md`, `AGENTS.md` end to end.
2. Ensure `MEMORY.md` exists with its seeded structure. **Decisions already recorded
   there are settled — do not re-litigate them.**
3. **Decompose into tickets — Phase 1 only.** Phase 1 = the thinnest end-to-end slice
   that proves the product works (per `ARCHITECTURE.md`'s build sequence). Do **not**
   plan later phases in detail yet. Order tickets by dependency; make each small enough
   to implement + verify within one work session.
4. For each ticket use `tickets/TEMPLATE.md`: acceptance criteria mapped to specific
   `SPEC.md` / `ARCHITECTURE.md` sections, `depends-on`, and the **invariants touched**
   (`AGENTS.md` §1).
5. **If decomposition hits real ambiguity** (scope, ordering, a business decision) →
   do **not** invent it. Write it to `MEMORY.md` → `## Blocking questions` and stop.
6. **Have the reviewer review the plan once** before committing:
   `bash scripts/reviewer-ask.sh "Review my Phase-1 ticket plan in tickets/. Are the slices atomic, correctly ordered by dependency, and faithful to ARCHITECTURE.md's build sequence + the AGENTS.md invariants? Flag any missing invariant coverage or any ticket too big for one work session."`
   Address its feedback.
7. Commit (`chore: bootstrap phase-1 tickets`), then **FULL STOP** (§5) and ask the
   human to review the ticket plan before implementation begins.

---

## 3. The main loop (one iteration = one ticket, or one safe slice)

Stop the moment a stop condition fires.

- **STEP 0 — Rehydrate.** Read `MEMORY.md` + `AGENTS.md` (+ `TOOLBOX.md` /
  `CONSTRAINTS.md` if not already fresh). List `tickets/` and compute the board
  (counts by status, what's ready). Re-read the `SPEC.md` / `ARCHITECTURE.md`
  sections the candidate ticket cites.
- **STEP 1 — Blocking-question gate.** If `MEMORY.md` has unanswered blocking
  questions that block every ready ticket → **STOP**. If some tickets are still
  unblocked, continue with those.
- **STEP 2 — Select.** Pick the highest-priority `todo` ticket whose `depends-on` are
  all `done`. If none → **STOP** (report why).
- **STEP 3 — Plan.** Set the ticket `in-progress`. Write a short plan into its Plan
  section. Explicitly list every uncertainty (API behavior, design tradeoff, anything
  you'd otherwise guess).
- **STEP 4 — Resolve uncertainty BEFORE writing code.** Route each:
  - **Business / pricing / compliance / scope, or any `AGENTS.md` §5 /
    `CONSTRAINTS.md` item** → blocking question in `MEMORY.md`, set ticket
    `blocked`, **STOP**. Don't guess.
  - **Technical / design / correctness / API** → reviewer (§6), up to 3 rounds. If the
    reviewer is unsure too, or it's a spec ambiguity → escalate to human.
  - Never code with an unresolved uncertainty.
- **STEP 5 — Implement.** Follow `AGENTS.md`. Use whatever tools your environment
  offers plus anything `TOOLBOX.md` adds, within `CONSTRAINTS.md`; don't assume an
  unprovisioned credential exists — ask. **Re-verify any platform API against
  current docs before relying on it** — training data is stale. Keep changes scoped
  to this ticket.
- **STEP 6 — Self-review.** Walk the acceptance criteria, the `AGENTS.md` §1
  invariants, and the §6 Definition of Done. Run the gate commands declared in
  `TOOLBOX.md` (type-check, lint, tests, any eval/smoke gate). Fix what you find.
  **If `TOOLBOX.md` defines an optional loop for this kind of change** (e.g. a UI
  design loop for UI tickets), run it to its declared exit criteria before
  requesting reviewer verification.
- **STEP 7 — Reviewer verification (risk-gated).** First decide whether this ticket
  needs an independent review. Review is **REQUIRED** if any of these hold:
  - it touches an `AGENTS.md` §1 invariant, or auth / security / secrets /
    personal data / money;
  - it adds a dependency, changes a schema, runs a migration, or integrates an
    external API;
  - the diff contains non-trivial logic (business rules, validation, concurrency —
    anything with edge cases);
  - you have residual uncertainty, or STEP 4/6 surfaced something you're not fully
    sure you resolved.

  Otherwise — docs/copy, pure styling, config tweaks, small mechanical refactors,
  with every gate green — you MAY **skip** review: write
  `skipped — <one-line reason>` in the ticket's `reviewer-verdict` field, note it in
  `MEMORY.md`, and go straight to STEP 8. When in doubt, review — a wrongly skipped
  review is a guess (§0).

  If reviewing: set the ticket `in-review`. Run
  `bash scripts/reviewer-verify.sh <ticket-id>` (read-only; the reviewer judges the
  diff against the docs + acceptance criteria; reasoning effort defaults to `low` —
  export `REVIEWER_EFFORT=medium|high` for invariant-heavy or security-sensitive
  diffs). Then:
  - **PASS** → STEP 8.
  - **FAIL** → read findings. Agree → fix and re-verify (this back-and-forth *is* the
    discussion). Disagree → bounded discussion
    (`scripts/reviewer-ask.sh "<rebuttal>" .loop/reviewer/disc-<ticket>.md --resume`),
    max 3 rounds. Still disagree → escalate to human with both positions + your
    recommendation, set `blocked`, **STOP**. **Never mark a ticket done over an
    unresolved FAIL.**
- **STEP 8 — Close out.** Set `done`. Update `MEMORY.md` (decision + one-line
  rationale, progress, any **new tickets** you discovered — file them, don't silently
  expand scope). Append to `.loop/log.md`.
- **STEP 9 — CONTEXT FULL STOP.** Do §5. Then continue the inner loop (STEP 0)
  **only if** context is comfortably within budget; otherwise STOP and emit the
  resume command.

---

## 4. Stop conditions

Stop — cleanly, after a full stop — when any is true:
- A **blocking question** must go to a human (business/compliance, an `AGENTS.md` §5
  or `CONSTRAINTS.md` item, or an implementer↔reviewer deadlock).
- **No ticket is ready** (all done, or all blocked / waiting on deps).
- A **human-review gate** (e.g. the post-bootstrap plan review).
- **Context pressure**: long transcript, many tool calls, summaries accumulating.
  Don't push your luck — hand to a fresh session.
- You're about to do something **risky** (a prod migration, a new dependency, a stack
  change) — needs human sign-off (`AGENTS.md` §5).

---

## 5. CONTEXT FULL STOP protocol (the heart of resumability)

A hard checkpoint where the loop is provably resumable by a zero-context agent.
Mandatory after every ticket (STEP 9) and any stop condition.

In order:
1. **Update `MEMORY.md`**: active ticket + status, the next concrete action, any
   decision (+ rationale), any blocking question.
2. **Update the ticket file**: status, plan notes, the reviewer verdict link.
3. **Commit**: `git add -A && git commit -m "<type>(<ticket>): <summary>"`.
4. **Log**: append to `.loop/log.md` —
   `<date> · <ticket> · <step> · <result> · <next action>`.
5. **Prove resumability (golden test):** *if my context were wiped now, could a new
   agent reading `MEMORY.md` + `tickets/` + `git log` continue with zero loss?* If
   **no**, the full stop isn't finished — write down what's missing until **yes**.
6. **Continue or hand off:**
   - Continuing (budget healthy): print `▶ CONTINUE: next ticket <id>` and loop to
     STEP 0.
   - Handing off: print exactly —
     ```
     ⏹ FULL STOP — resume in a fresh Claude Code session with:
        "Read LOOP.md and MEMORY.md, then continue the loop."
        Next action: <one line>
        Blocking on human: <yes/no — if yes, see MEMORY.md ## Blocking questions>
     ```
   - then **STOP**. Don't keep working.

> Durable state, every step replayable, nothing critical living only in volatile
> memory — the same checkpointing discipline you'd demand of a production system,
> applied to yourself.

---

## 6. The implementer ↔ reviewer discussion protocol

**Roles.** You (Claude) are the **driver/implementer** — you write the code. The
**reviewer** (a second, independent model — see `TOOLBOX.md` for the configured
command) is **read-only**, **never edits files**. Two different models catch more
than either alone.

**Two modes:**
- **Consultation** (STEP 4): unsure about an approach/API/tradeoff →
  `bash scripts/reviewer-ask.sh "<focused question>"`.
- **Verification** (STEP 7, when the risk gate requires it): the reviewer
  independently reviews your diff against docs + acceptance criteria + invariants →
  `bash scripts/reviewer-verify.sh <ticket-id>`.

Both scripts run the reviewer at **low reasoning effort by default** for speed;
export `REVIEWER_EFFORT=medium|high` when the question or diff is genuinely hard
(invariants, security, tricky concurrency).

The reviewer reads the canonical docs itself (read-only sandbox), so pass it the
*question* or the *diff*, not the whole repo. Both scripts capture replies to
`.loop/reviewer/`.

**Discussion loop:** propose → reviewer critiques → you respond (fix, or rebut with
reasoning) → repeat. **Max 3 rounds.** Resume the same thread with
`scripts/reviewer-ask.sh "<reply>" <path> --resume`. Log it.

**Convergence:** Agree → proceed. Disagree after 3 rounds → STOP the ping-pong,
escalate to human with both positions + your recommendation. Never loop indefinitely.
**Never override a legitimate FAIL by just marking the ticket done.**

**Trust boundary:** the reviewer can be wrong too. If it asserts a checkable fact (an
API, version, or flag), **verify against current docs** before acting. "Unsure" =
"needs verification," not ground truth. **Neither of you invents a business,
billing, or compliance rule** — anything on `AGENTS.md` §5 goes to the human.

---

## 7. Question routing (who answers what)

- **Ask the REVIEWER (in-loop, fast):** code review; correctness/edge cases;
  design/architecture tradeoffs; "does this API behave as I think?"; whether a change
  respects the invariants.
- **Ask the HUMAN (blocking; write to `MEMORY.md` → `## Blocking questions`, set
  ticket `blocked`, STOP):** everything listed in `AGENTS.md` §5 and
  `CONSTRAINTS.md`, plus any implementer↔reviewer deadlock.
- **Never** guess to keep moving. **Never** weaken an eval case or acceptance
  criterion for a green build — escalate.

---

## 8. Ticket schema

See `tickets/TEMPLATE.md`. Each ticket carries: `id`, `title`, `status`
(`todo` | `in-progress` | `blocked` | `in-review` | `done`), `priority`, `phase`,
`depends-on`, `spec-refs` (SPEC/ARCHITECTURE sections), `invariants` (from
`AGENTS.md` §1), a description, an **acceptance-criteria checklist**, a Plan section
(you fill), a Notes/Decisions section, and a link to the reviewer verdict. Keep each
small enough to implement + verify within one context budget — if it isn't, split it.

---

## 9. Kickoff

The human starts the loop by opening Claude Code in the repo and saying:

> **"Read LOOP.md and MEMORY.md, then run the loop."**

(Wired as a slash command in `.claude/commands/loop.md`.)

On the very first run the spec docs say `NOT GENERATED` → do **Inception** (§2.0),
ending in a full stop for ratification. Next run, `tickets/` is empty → **ticket
decomposition** (§2.1), ending in a full stop for plan review. Every subsequent
run → the **main loop** (§3).

---

## 10. Guardrails — never do these

- ❌ Write code while an uncertainty is unresolved (ask first — §4, §7).
- ❌ Mark a ticket done over an unresolved reviewer FAIL.
- ❌ Skip reviewer verification when the STEP 7 risk gate requires it, or skip
  without logging the one-line reason in the ticket + `MEMORY.md`.
- ❌ Let critical state live only in your context (full-stop after every step — §5).
- ❌ Guess a business rule, a platform policy, or an API signature (ask / verify — §0).
- ❌ Violate a `CONSTRAINTS.md` limit, ever — a constraint that seems wrong is a
  blocking question, not an obstacle to route around.
- ❌ Edit `IDEA.md` / `TOOLBOX.md` / `CONSTRAINTS.md` / `DESIGN.md` + `designs/` (human-written inputs), or
  `SPEC.md` / `ARCHITECTURE.md` / `AGENTS.md` after ratification (inception, §2.0,
  is the only writing pass; afterwards, changes are a §5 human decision).
- ❌ Let the reviewer edit files (read-only review only — §6).
- ❌ Skip the eval/smoke gate or weaken a test/criterion to go green (escalate — §7).
- ❌ Plan later phases in detail before Phase 1 works (§2).
- ❌ Loop implementer↔reviewer more than 3 rounds without escalating (§6).
- ❌ Make large commits or carry uncommitted work across a stop.

When in doubt: re-read §0, full-stop, and ask.
