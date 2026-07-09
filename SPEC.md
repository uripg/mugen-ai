# SPEC.md — product spec (what / why)

> **STATUS: RATIFIED 2026-07-09.** Drafted at inception (LOOP.md §2.0) from
> `IDEA.md`, `TOOLBOX.md`, `CONSTRAINTS.md`. This file is now read-only; changes
> are an `AGENTS.md` §5 human decision.

---

## 1. The product in one paragraph

An agentic copilot that helps **European B2B companies (SaaS, industrial,
professional services) land their first customers or partners in Japan, Korea, and
Singapore** — companies actively entering these markets without a local team on the
ground. The agent watches target accounts in these three markets for signals that
specifically indicate **international/Europe-expansion readiness** (an
English-language "Head of Global Partnerships" posting, an executive with
international background joining, engagement with a competing European vendor, a
funding round), enriches a verified contact behind the signal, maps a small buying
committee, layers on the team's own market playbook (cultural buying-process note,
buyer psychology note, local competitor note), scores how ready that account looks
for a European partner (0–100, always with visible reasoning), and drafts outreach
shaped by how business is actually done in that market. It is **NOT** a generic
multi-region outbound tool — the entire value is being sharp about these three
markets specifically. It is a hackathon prototype built for a live one-day demo, not
a product being sold.

## 2. The MVP — Phase 1

Built for a live demo, deployed to Cloudflare (Workers + D1 + KV via OpenNext) — the
demo runs off the real deployed URL, not localhost.

**Pre-build steps (from IDEA.md, in order):**

- **Step 0 (human):** add one Japanese, one Korean, and one Singaporean target
  company to Sillage; manually enrich 2–3 of each one's leadership contacts in
  FullEnrich. A 5-minute data-coverage sanity check before building on top of it.
- **Step 0.5 (agent):** scaffold and deploy a bare skeleton — Next.js + Better Auth
  + D1 + KV wired up and live on a real Cloudflare URL — before building features.

**IN (user-visible capabilities):**

1. **Team-only login** via Better Auth. A single shared login **[provisional —
   agent-proposed: shared email+password credential, no OAuth app to register]**.
   No signup, roles, or invite flows.
2. **Backend pipeline** — three tools Claude can call:
   - `get_signals` — Sillage V2 API
   - `enrich_contact` — FullEnrich API
   - `research_market` — Anthropic's native `web_search` server tool, for
     local-competitor and buying-committee research the other two don't cover
3. **Signal types tuned for expansion-readiness**, not generic activity:
   international/global/Europe-facing hiring, an executive with international
   background joining, engagement with a competing European vendor, and a funding
   round.
4. **Deal Intelligence step** — run once a signal resolves to a real contact,
   before drafting:
   - **Buying committee** — enrich 1 additional likely stakeholder beyond the
     signal contact, tagged by likely role. A 2nd extra contact only if Step
     0/0.5 went smoothly and time allows (hard cap: 2 extra).
   - **Cultural buying-process note** — how this market typically reaches a
     purchase decision — drawn from the team's own playbook, never invented by
     the model.
   - **Buyer psychology note** — what this market's buyers prioritize and worry
     about when evaluating a new, especially foreign, vendor — also from the
     team's playbook.
   - **Local competitor note** — 1–2 known local players in the account's space,
     via `research_market`.
   - **Repositioned value prop** — a short reasoning step using the three notes
     above on how to frame the pitch for this market and committee, before the
     draft is written.
5. **Expansion Readiness Score** — 0–100, always shown together with the reasoning
   behind it (never a bare number), factoring in the deal intelligence above.
6. **Personalized draft, English by default** — written from the repositioned value
   prop, not a European pitch translated word-for-word.
7. **"Why" panel** — signal, buying committee, cultural note, buyer psychology
   note, competitor note, and score reasoning, all visible next to the draft.
8. **One live-updating dashboard page**, persisted in D1 — cards populate as the
   pipeline runs; Approve / Edit / Regenerate; approval state survives a refresh.
9. **Human approval gate** — nothing sends without a click. (v1 has no real send at
   all — "sent" is a simulated state.)

**STRETCH (only after everything above works end-to-end):**

10. **Inbound lead qualification** — the same deal-intelligence pipeline triggered
    by an inbound contact instead of an outbound Sillage signal. Reuses the whole
    pipeline, new entry point only; does not start until the core outbound flow and
    dashboard fully work.

**Build order (from IDEA.md):** Step 0 spot-check → Step 0.5 skeleton deployed →
CORE headless pipeline (one market, one contact, no deal intelligence; console/log
output — the safety net if time runs short) → dashboard UI wired to that pipeline,
backed by D1 → Deal Intelligence + score + why-panel → remaining markets → polish +
full live run-through.

**If behind schedule, cut in this order:** 2nd buying-committee contact → competitor
research → cultural/psychology notes (fall back to one generic team-authored line
each). Keep the core loop and the why-panel intact.

## 3. Later phases (sketch only — not planned in detail)

- **Phase 2 — Expansion:** the same signal-and-intelligence engine extended to
  account management once first APAC customers exist — account health, expansion
  triggers inside existing accounts, cross-sell/upsell, churn flags. A roadmap
  slide, not part of this build.
- Real auto-send via Gmail/Outlook once approved
- Continuous signal listening (Sillage webhook) instead of on-demand runs
- CRM write-back (HubSpot/Salesforce)
- Buying committee beyond 2 contacts
- Localized (human-reviewed, not machine-translated) message variants per market
- Playbooks learned from real outcomes instead of only manually authored
- Reply/positive-intent detection routing hot leads to a rep
- China, then further APAC markets, once this is proven

## 4. Non-goals (explicitly OUT of Phase 1)

- Full buying committee (3+ stakeholders) — capped at 1–2 extra for the demo
- Real auto-send — the "sent" state is simulated
- CRM write-back
- Multi-touch follow-up sequences
- Reply/intent detection
- Machine-translated outreach copy
- Multi-tenant auth, roles, or signup flows
- Account health / usage / ticket / sentiment tracking, cross-sell/upsell, churn
  detection (Track 2 / Phase 2 territory)
- Generic multi-region outbound — anything not JP/KR/SG-specific

## 5. Business model

None — hackathon prototype, not a product being sold.

## 6. Success criteria

Live demo, **under 90 seconds**, running off the **real deployed Cloudflare URL**
(not localhost): the dashboard shows real signals streaming in from tracked
Japanese, Korean, and Singaporean accounts, each resolving into a readiness-scored,
enriched, personalized draft — with a visible why-panel showing the buying
committee, cultural buying-process note, buyer psychology note, local competitor
note, and the reasoning behind the score — and a human approving one on stage.
**Every data point on screen traces back to a real Sillage, FullEnrich, or
`research_market` call — no mocks.**
