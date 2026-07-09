# QUESTIONS.md — pending human inputs (detailed)

> Written 2026-07-09 at the human's request. These are the three open items from
> `MEMORY.md ## Blocking questions`, expanded with exactly what's needed, in what
> format, and what each one blocks. Answer by editing this file in place (fill the
> blanks / templates below), or however you prefer — the agent will transcribe
> answers into the right places and never treats this file as ratified doc content.

---

## Q-1 (remainder) — Sillage & FullEnrich API keys

**Status:** partially answered. You said keys live in `.dev.vars`; it currently
contains `CLAUDE_API_KEY` and `BETTER_AUTH_SECRET` but **no Sillage or FullEnrich
key**.

**What's needed:**

1. Add two lines to `.dev.vars` (gitignored — never committed):

   ```
   SILLAGE_API_KEY=<your Sillage V2 API key>
   FULLENRICH_API_KEY=<your FullEnrich API key>
   ```

2. Confirm both keys are **live/production** keys for the hackathon accounts, and
   that spending within those accounts' plan limits is OK (CONSTRAINTS.md "no real
   money" needs this stated once, explicitly):

   - [ ] Yes, both keys are live and spend within plan limits is authorized.

3. For the deployed Worker the same three secrets must be set once via
   `wrangler secret put SILLAGE_API_KEY` / `FULLENRICH_API_KEY` / `CLAUDE_API_KEY`
   (+ `BETTER_AUTH_SECRET`). **Preference:**
   - [ ] Agent runs `wrangler secret put` itself when the pipeline tickets deploy
         (it will read values from `.dev.vars` at that moment, never echo them).
   - [ ] You'll set them yourself; agent will tell you when.

**Blocks:** T-tickets implementing `get_signals` and `enrich_contact` against the
real APIs, and any deployed end-to-end run. Skeleton/auth/dashboard work is NOT
blocked.

**Also useful (not blocking):** links to the Sillage V2 and FullEnrich API docs you
use, if they're not publicly discoverable — the agent must verify endpoints/shapes
against real docs before coding (AGENTS.md §0) and will otherwise search for them.

- Sillage V2 docs URL: ______________________________________
- FullEnrich docs URL: ______________________________________

---

## Q-3 — Team-authored market playbooks (JP / KR / SG)

**Why this is on you:** AGENTS.md invariant 4 (from IDEA.md's non-negotiables):
messaging judgment, cultural buying-process notes, buyer psychology notes, and
committee-role assumptions come **only from the team's own market expertise — the
model is forbidden from inventing or stereotyping them**. The agent will scaffold
`src/lib/playbooks/{jp,kr,sg}.ts` and slot your text in verbatim.

**What's needed — per market (Japan, Korea, Singapore), in plain bullets/prose,
English, any length (3–6 bullets per section is plenty):**

### Template — copy once per market

```
MARKET: <Japan | Korea | Singapore>

1. Cultural buying-process note — how companies in this market typically reach a
   purchase decision (consensus-driven? hierarchical sign-off? relationship-first?
   typical timeline expectations? who has to be in the room?):
   - ...

2. Buyer psychology note — what buyers here prioritize and worry about when
   evaluating a NEW, especially FOREIGN, vendor (risk aversion? references?
   local support expectations? price vs. reliability?):
   - ...

3. Committee-role heuristics — given a signal contact (e.g. a "Head of Global
   Partnerships" hire), who is the likely 1–2 additional stakeholders worth
   enriching, and what role tag fits them (champion / economic buyer / technical
   evaluator / executive sponsor)? e.g. "in JP, pair the champion with the
   department head (bucho) who owns budget":
   - ...

4. Messaging judgment — do's and don'ts for the outreach draft itself in this
   market (tone, formality, directness, how to open, what to never claim,
   relationship vs. product-first framing):
   - ...

5. FALLBACK LINE (required) — ONE generic sentence for this market, used if the
   full notes get cut under time pressure (SPEC.md cut order):
   - ...
```

**Blocks:** the Deal Intelligence tickets (cultural/psychology notes, committee
tagging, repositioned value prop) and the draft-quality bar. The core pipeline,
dashboard, auth, score plumbing are NOT blocked — build continues while you write.

**Minimum viable answer if pressed for time:** section 5 (the fallback line) for
all three markets + sections 1–4 for **Singapore only** (first market built).

---

## Q-4 — Step 0 spot-check (Sillage + FullEnrich data sanity)

**What IDEA.md prescribes (human, ~5 minutes, before pipeline code builds on the
data):** add one Japanese, one Korean, and one Singaporean target company to
Sillage, and manually try enriching 2–3 of each one's leadership contacts in
FullEnrich.

**What's needed back:**

1. Confirmation it's done:
   - [ ] Done.

2. The three companies (these seed the `accounts` table — the demo runs on them):

   | Market | Company name | Domain | Sillage identifier (if visible) |
   |---|---|---|---|
   | JP | | | |
   | KR | | | |
   | SG | | | |

3. One line per market on what the spot-check showed, so expectations are set
   honestly (invariant 2 forbids papering over thin data):
   - JP — signals visible? contacts enriched OK? ______________________
   - KR — ______________________
   - SG — ______________________

**Blocks:** pipeline tickets that call the real APIs end-to-end, and seeding
`accounts`. Everything up to and including the dashboard shell is NOT blocked.

---

*When all three are answered, delete or archive this file — `MEMORY.md` remains the
canonical record.*
