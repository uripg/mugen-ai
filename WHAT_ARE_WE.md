# WHAT ARE WE?

An agentic expansion copilot for **European B2B companies trying to land their first customers or partners in Japan, Korea, and Singapore** — without hiring a local team.

This document explains the product from the user's point of view: the problem, the mental model, the user flows, what appears on screen, and why each design decision was made. (For build status and tool wiring, see `HOW.md`.)

---

## 1. The problem we solve

A European B2B vendor (say, a German payments-infrastructure company) wants its first deal in APAC. Three things kill that effort in practice:

1. **Timing blindness.** They don't know *which* of their dream accounts is open to a foreign vendor *right now*. Cold outreach to a company that isn't in a buying moment is wasted.
2. **Contact blindness.** Even when the timing is right, they don't know *who* the real decision-maker is, and guessed email addresses bounce or land nowhere.
3. **Cultural blindness.** Outreach that works in Berlin fails in Tokyo. Buying processes, hierarchy, consensus norms, and buyer psychology differ sharply between Japan, Korea, and Singapore — and generic "APAC" advice is worse than useless.

Existing tools solve none of these together. Sales-intelligence platforms do generic multi-region lead lists ("500 fintech leads in Asia"); that's spray-and-pray, and it's exactly what we are **not**. Our whole value proposition is being *sharp about three specific markets* and a *curated set of target accounts*.

## 2. The mental model: a radar, not a search engine

The single most important thing to understand:

> The user does **not** type "I want to sell to company Y — how?" and get a plan.
> The user configures a watchlist of dream accounts **once**, and the platform then acts as a **radar** that tells them *when* an account becomes approachable and handles the *how*.

- **Pull model (what we are not):** on-demand strategy generation for an arbitrary company.
- **Push/watch model (what we are):** continuous monitoring of a fixed target list. When a real buying signal fires, the platform surfaces it with everything needed to act: the evidence, a verified human to contact, market context, and a ready-to-approve outreach draft.

The platform answers two questions:

1. **"Which of my targets should I approach *this week*, and why?"** → signals + readiness score
2. **"Who exactly do I write to, and what do I say, given how buying works in that country?"** → verified contact + culturally-framed draft

The user's job shrinks to reviewing and clicking **Approve**.

## 3. The two layers: market intelligence vs. account action

Users sometimes ask: "am I forced to focus on one company instead of a market?" The answer is that the product works on both layers, but they play different roles:

- **The market layer is where the intelligence lives.** Cultural playbooks, buying-process notes, and buyer psychology are per-market (Japan / Korea / Singapore). Competitor research is about the account's local market. Every account interaction is infused with this market-level knowledge.
- **The account layer is where action happens.** You can't email "Singapore" — you email a specific person at a specific company, triggered by a specific signal. So the pipeline runs per account.

The dashboard spans the whole target list across all three markets; signals provide **prioritization within a market**. Instead of approaching every Singapore fintech generically, the user sees "Nium is hiring a Director of Partnerships – Expansion right now, readiness 78" and goes deep on that one first.

## 4. The cast of characters

| Concept | What it is | Why it exists |
|---|---|---|
| **Target accounts** | 12 real financial companies across JP/KR/SG (DBS, MUFG, Nium, Toss, Money Forward, …) | The curated dream-account list. Sharp focus beats broad lists. |
| **Signals** | Public evidence an account is expansion-ready, in exactly 4 types (see §5) | The *reason to reach out this week* rather than cold. |
| **Verified contact** | A named person whose work email FullEnrich confirmed as deliverable | Guessed emails destroy sender reputation and trust. Hard gate: no verification → no contact shown. |
| **Buying committee** | A small set of additional stakeholders around the main contact | In JP/KR especially, deals are won by consensus, not one champion. |
| **Cultural playbook** | Team-authored notes on how buying works in each market | The model is forbidden from inventing cultural claims — hallucinated cultural advice is worse than none. |
| **Competitor note** | 1–2 verified local competitors in the account's market, with cited sources | Sharpens positioning ("they already talk to Thunes — here's your angle"). |
| **Readiness score** | 0–100 estimate of approach-readiness, always shipped with visible reasoning | Prioritization across accounts. Never a bare number. |
| **Outreach draft** | A personalized English email framed by the market's playbook | The concrete, executable next step. |
| **Why-panel** | Per-data-point trace back to the real source call | The anti-hallucination guarantee (see §7). |

## 5. The four signal types

The platform maps raw detections (from Sillage, our monitoring layer) onto exactly four types of expansion-readiness evidence:

1. **International-facing hiring** — the account posts roles like "Director – Partnerships & Network Management, Expansion" (a real detection at Nium). Hiring for expansion means budget and mandate exist *now*.
2. **Exec with international background joining** — a leadership change often reopens vendor decisions and signals an outward-looking strategy.
3. **Engagement with a competing European vendor** — if they're already talking to a European competitor, they're demonstrably open to European vendors; the window is open but closing.
4. **Funding round** — fresh capital means new initiatives and procurement appetite.

Any one of these turns a cold account into a warm one. If no signal exists, the account honestly shows nothing — **there are no mocked signals anywhere in the product**.

## 6. User flows

### Flow 0 — Setup (currently pre-baked)

In a real product, a new customer would onboard: describe what they sell, pick their target accounts, and get playbooks per market. **In this prototype, that configuration is done by us in advance** — the Sillage workspace already tracks the 12 accounts with a configured buyer persona ("APAC Financial Buyers — JP/KR/SG Expansion-Ready") and two detection agents (job updates + expansion-keyword job postings). There is no self-serve onboarding UI. This is the honest gap between the demo and the real product.

### Flow 1 — Log in and survey the radar

1. The user logs in (shared team login for the demo).
2. They land on **one dashboard** listing all 12 target accounts across the three markets.
3. At a glance they can see which accounts have live signals and which are quiet.

*Why one dashboard:* the user's daily question is "where should my attention go today?" — that's a single prioritized view, not a per-country silo.

### Flow 2 — Run the pipeline on an account (the core loop)

The user picks an account with a promising signal — say **Nium (Singapore)** — and triggers a pipeline run. The account's card then **populates live, stage by stage**, so the user watches the work happen rather than staring at a spinner:

1. **Signal** appears — the real detection, e.g. the Nium expansion-role job posting, with its source.
2. **Verified contact** appears — the pipeline used web search to identify the likely decision-maker (job postings don't name people), then FullEnrich confirmed a deliverable work email. If verification fails, the card says **"no verified contact"** — a person is *never* invented.
3. **Buying committee** appears — a small set of surrounding stakeholders.
4. **Cultural notes** appear — buying-process and buyer-psychology notes for that market, drawn *only* from the team-authored playbooks.
5. **Competitor note** appears — 1–2 verified local competitors (for Nium: Thunes and Airwallex, found live with 10 cited sources).
6. **Readiness score** appears — 0–100 with its reasoning visible ("expansion hiring signal + recent funding + verified senior contact → 78").
7. **Outreach draft** appears — a personalized English email that references the signal and is framed by the market playbook (e.g., for Japan: relationship-first, credential-forward; for Singapore: efficiency-forward, direct value).

*Why stage-by-stage:* each stage is a real external call (Sillage, web search, FullEnrich, Claude). Showing them land one by one makes the system legible and demonstrably real.

### Flow 3 — Review and act (the human gate)

With the card fully populated, the user has three buttons:

- **Approve** — accept the draft. "Sent" is **simulated**; this is a demo and no real email ever leaves the system. In the real product this would hand off to their email tool.
- **Edit** — adjust the draft by hand before approving.
- **Regenerate** — reject the draft and have the model produce a new one (same verified facts, new framing).

*Why a human-only gate:* first-contact outreach into a relationship-driven market is a high-stakes, irreversible act. The AI prepares; the human decides. This is a product principle, not a temporary limitation.

### Flow 4 — Interrogate any fact (the why-panel)

At any point, the user can open the **why-panel** on any data point on screen — the signal, the contact, the competitor, the score — and see exactly which real Sillage detection, FullEnrich verification, or cited web-search result produced it.

*Why:* trust. The user is about to put their company's name on an email to a dream account. Every fact must be traceable; nothing on the dashboard is "the AI said so."

## 7. The honesty guarantees (design principles)

These constraints shape everything above and are worth stating as a creed:

1. **No mocks.** Empty results stay empty. A quiet account shows no signal rather than a plausible fake one.
2. **No invented contacts.** A contact row exists only if FullEnrich verified a deliverable email. Otherwise: "no verified contact."
3. **No invented cultural claims.** Cultural notes come exclusively from team-authored playbooks; the model may select and apply them but never fabricate them.
4. **No bare scores.** The readiness score always ships with its visible reasoning.
5. **No autonomous sending.** Approval is a human-only gate, and even then sending is simulated in the demo.
6. **Everything traceable.** Every on-screen fact links back to a real external call via the why-panel.

## 8. What we are NOT

- **Not a lead-list generator.** No "give me 500 leads in Japan." Curated accounts, deep context.
- **Not a generic multi-region tool.** Three markets, deeply understood, is the product.
- **Not an autonomous outbound bot.** No email is ever sent, real or otherwise, without a human clicking Approve — and in this prototype, not even then.
- **Not an on-demand strategy generator.** You don't type in an arbitrary company; the radar watches a configured list.

## 9. Where the build is today

| Stage | Status |
|---|---|
| Auth-gated skeleton live at https://mugen-ai.kedalen.dev | ✅ Done |
| Three data tools (signals / contact verification / market research), live-verified via dev scripts | ✅ Done (T-004–T-006) |
| First end-to-end pipeline run — headless, `POST /api/pipeline/run` for Nium (SG), rows land in D1 | 🔨 In progress (T-007) |
| Dashboard with live-updating cards — first genuinely demoable build | Next (T-008) |
| Approve / Edit / Regenerate, readiness score + why-panel, Japan & Korea enabled | T-009–T-012 |
| Full 90-second live demo run-through | T-013 |

Until T-008 lands, the product is real but invisible: pipeline runs can be triggered via API and verified in logs and the database, but there are no screens.
