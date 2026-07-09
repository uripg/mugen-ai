# IDEA.md — the project seed

## The idea

An agentic copilot that helps European B2B companies find and open doors with the right companies in Japan, Korea, and Singapore — three very different playbooks for the same region, and markets this team knows firsthand. Cold outreach into APAC usually fails twice: European sellers can't tell which local companies are actually receptive to a foreign vendor right now, and even when they can, generic outreach reads as tone-deaf to local business norms. This agent watches target accounts in these three markets for signals that specifically indicate international/Europe-expansion readiness — an English-language "Head of Global Partnerships" posting, an executive with international experience joining, engagement with a competing European vendor, a funding round — enriches a verified contact behind that signal, scores how ready that account looks for a European partner, and drafts an outreach message shaped by the team's own knowledge of how business is actually done in that market.

It's for European B2B companies (SaaS, industrial, professional services) actively trying to land their first customers or partners in Japan, Korea, or Singapore, who don't have a local team on the ground yet. It is NOT a generic multi-region outbound tool — the entire value is being sharp about these three markets specifically, not broad.

## SWOT

**Strengths**

- Team has firsthand experience in the JP/KR/SG markets — a real edge competitors can't fake in a day
- Built on real, verifiable data (Sillage signals, FullEnrich contacts) and Claude reasoning, not guesswork
- Every score and message ships with visible reasoning — designed against the "black box AI" objection from day one, not bolted on after

**Weaknesses**

- Singapore's business culture already runs closer to Western/European norms than Japan's or Korea's — the cultural-navigation value prop is strongest for two of the three markets, thinnest for the one picked for demo safety
- Small team, tight timeline: v1 covers one ICP shape, a 2-person buying committee cap, and English-first drafts
- Cultural/market playbooks are only as good as what the team manually encodes — not yet learned from outcomes

**Opportunities**

- APAC market-entry is a real, underserved pain point — most GTM tooling is built US/EU-first and stops there
- The team's market fluency is a moat: hard for a generic outbound tool to replicate quickly
- Singapore is the default regional beachhead for many MNCs — landing there can open doors across the wider region, not just locally
- Clear expansion path: more markets, deeper buying-committee intelligence, playbooks learned from outcomes over time

**Threats**

- Buyer hesitation about AI-driven outreach specifically: hallucinated claims, brand damage from a bad send, privacy handling of enriched personal data, distrust of an opaque score, a culturally tone-deaf message damaging a relationship that took months to build
- Enrichment/signal coverage in APAC could stay thin regardless of how good the product is
- Established players (Apollo, Clay, Cognism, ZoomInfo) adding APAC-specific features
- Real regulatory surface on cross-border personal data: GDPR on the EU side, plus Japan's APPI, Korea's PIPA, and Singapore's PDPA on the receiving side

Every non-negotiable below answers one of these threats directly — that mapping is the pitch for why this is safe to trust, not just a list of features.

## The MVP (Phase 1)

Built for a live one-day demo, sized for AI-assisted building (expect the coding agent to move roughly 10x faster than a human writing this by hand — use that speed for polish and breadth, not scope creep into fragile features). Deployed to Cloudflare (Workers + D1 + KV via OpenNext), not run locally-only — the live demo runs off a real deployed URL.

**Step 0 — before writing any code (do this first):** add one Japanese, one Korean, and one Singaporean target company to Sillage, and manually try enriching 2–3 of each one's leadership contacts in FullEnrich. Singapore should be the safest of the three — English-first, heavy LinkedIn presence, and a common regional HQ for exactly the kind of company you're targeting — so this is now a quick sanity check rather than a real risk, but still 5 minutes well spent before building on top of it.

**Step 0.5 — scaffold and deploy a bare skeleton before building features:** get an empty Next.js app with Better Auth + D1 + KV wired up and actually deployed to a live Cloudflare URL first. This stack has a few documented rough edges (see Stack preferences) that are far cheaper to hit in the first 30 minutes than in the last one.

**IN:**

1. **Team-only login** via Better Auth — a single shared login or OAuth (e.g. GitHub) is enough. Not a multi-tenant product; no signup, roles, or invite flows.
2. **Backend pipeline** — three tools Claude can call: `get_signals` (Sillage V2 API), `enrich_contact` (FullEnrich API), and `research_market` (Anthropic's native web_search server tool, for local-competitor and buying-committee research the other two don't cover).
3. **Signal types tuned for expansion-readiness, not generic activity** — international/global/Europe-facing hiring (e.g. "Head of Europe Partnerships"), an executive with international background joining, engagement with a competing European vendor, and a funding round (more budget/ambition to bring on new vendors — Sillage supports this signal natively). These are also the signal types most likely to actually be visible in Sillage's largely LinkedIn-sourced data across all three markets.
4. **Deal Intelligence step**, run once a signal resolves to a real contact, before drafting:
   - **Buying committee** — enrich 1 additional likely stakeholder beyond the signal contact (e.g. an economic buyer alongside the champion), tagged by likely role. Only add a 2nd extra contact if Step 0/0.5 went smoothly and time allows.
   - **Cultural buying-process note** — how this market typically reaches a purchase decision (consensus-driven, hierarchical sign-off, relationship-first, timeline expectations) — drawn from the team's own playbook, never invented by the model.
   - **Buyer psychology note** — what this market's buyers tend to prioritize and worry about when evaluating a new, especially foreign, vendor — also from the team's playbook.
   - **Local competitor note** — 1–2 known local players in the account's space, via `research_market`, so outreach differentiates instead of reading as generic.
   - **Repositioned value prop** — using the three notes above, a short reasoning step on how to frame the pitch for this specific market and buying committee, before the draft is written.
5. **Expansion Readiness Score** — 0–100, always shown together with the reasoning behind it (never a bare number), factoring in the deal intelligence above.
6. **Personalized draft, in English by default** — written from the repositioned value prop, not a European pitch translated word-for-word.
7. **"Why" panel** — signal, buying committee, cultural note, buyer psychology note, competitor note, and score reasoning, all visible next to the draft.
8. **One live-updating dashboard page**, persisted in D1 — cards populate as the pipeline runs; Approve / Edit / Regenerate; approval state survives a refresh.
9. **Human approval gate** — nothing sends without a click.

**STRETCH (only after everything above works end-to-end):** 10. **Inbound lead qualification** — same deal-intelligence pipeline, triggered by an inbound contact (a form fill, a reply) instead of an outbound Sillage signal: enrich, map the buying committee, add the cultural/psychology/competitor notes, score, and suggest a response. Reuses the entire pipeline, new entry point only — but it's still net-new surface area, so it does not start until the core outbound flow and dashboard are fully working.

**OUT (explicitly deferred, protects the 4-hour budget):**

- Full buying committee (3+ stakeholders) — capped at 1–2 for the demo
- Real auto-send (simulate the "sent" state instead)
- CRM write-back
- Multi-touch follow-up sequences
- Reply/intent detection
- Machine-translated outreach copy
- Multi-tenant auth, roles, or signup flows
- Account health / usage / ticket / sentiment tracking, cross-sell/upsell from usage patterns, churn detection — these are Track 2 (Expansion) motions for accounts you already have as customers. There's no usage or ticket data to track for a market you haven't entered yet. See Later phases.

**Suggested build order:** Step 0 spot-check, then Step 0.5 (deploy the bare skeleton). Then the CORE headless pipeline — one market, one contact, no deal intelligence — tools + Claude loop, printed to console/logs; this is the safety net if time runs short. Then wire the dashboard UI to that pipeline, backed by D1. Then layer in Deal Intelligence (buying committee, cultural note, buyer psychology note, competitor note, repositioning) and the readiness score/why-panel on top. Then the remaining markets. Polish and a full live run-through last.

**If behind schedule, cut in this order:** 2nd buying-committee contact first → competitor research second → cultural/psychology notes third (fall back to one generic line each). Keep the core loop and the why-panel intact — those carry the most demo weight.

## Later phases (rough sketch only)

- **Phase 2 — Expansion, once there's a base to manage:** the same signal-and-intelligence engine naturally extends to account management once a company has landed its first APAC customers — track account health via usage/tickets/sentiment, catch expansion triggers (new hires, funding, team growth) inside existing accounts, spot cross-sell/upsell in usage patterns, flag churn from early disengagement. This is Track 2's motion — a strong roadmap slide for the pitch, not part of this weekend's build.
- Real auto-send via Gmail/Outlook once approved
- Continuous signal listening (webhook from Sillage) instead of on-demand runs
- CRM write-back (HubSpot/Salesforce) logging each touch
- Expand buying committee mapping beyond 2 contacts
- Localized (human-reviewed, not machine-translated) message variants per market
- Learn cultural/buyer-psychology playbooks from real outcomes instead of only manually authored ones
- Reply/positive-intent detection routing hot leads to a rep
- Bring China into the playbook once there's a validated approach and clearer data-coverage options, plus further APAC markets beyond JP/KR/SG once this is proven

## Stack preferences

- Language: TypeScript throughout
- Framework: Next.js, deployed to Cloudflare Workers via the OpenNext adapter (`@opennextjs/cloudflare` — current, preferred path; the older `@cloudflare/next-on-pages` is deprecated, don't use it)
- Auth: Better Auth, gating the dashboard to the team only — a single shared login or OAuth is enough, not a full multi-tenant system
- Database: Cloudflare D1 (SQLite) — leads, signals, drafts, deal intelligence, approval state
- Secondary storage: Cloudflare KV — session caching, rate limiting
- Scaffolding shortcut: the community `better-auth-cloudflare` package (`npx @better-auth-cloudflare/cli generate`) ships a ready-made Next.js/OpenNext template wiring up Better Auth + D1 + KV together — use it instead of hand-wiring each piece. Two known sharp edges regardless: re-instantiate the Better Auth instance per-request using that request's D1 binding (a single instance at module load will lock up under Workers' isolate model), and if KV backs Better Auth's rate limiter, its default TTL can fall under KV's 60-second minimum and fail silently — override it if sign-in gets flaky.
- Hosting: Cloudflare Workers (global edge) — `opennextjs-cloudflare build && opennextjs-cloudflare deploy`; the demo runs off the real deployed URL, not localhost
- Local dev: add `initOpenNextCloudflareForDev()` to `next.config` so local dev can reach D1/KV bindings; local env vars go in `.dev.vars`, not `.env.local`

## Non-negotiables

- No email is ever auto-sent without explicit human approval — answers the brand-damage and relationship-damage fears directly
- Every draft, score, and piece of deal intelligence must be grounded in real data returned by Sillage/FullEnrich/`research_market` for that contact — never fabricated to make the demo look better, and never used to paper over a market where the data came back empty. Answers the hallucination fear.
- The readiness score is never shown as a bare number — it always ships with the reasoning behind it, visible in the why-panel. Answers the "no control or understanding of AI choices" fear.
- Messaging judgment, cultural buying-process notes, buyer psychology notes, and buying-committee role assumptions all come from the team's own market expertise, not invented or stereotyped by the model
- Enriched personal data is used only for this demo, not persisted beyond the hackathon dataset or repurposed — say this openly in the pitch as a known productionization gap rather than glossing over it. Answers the privacy fear, and the real GDPR/PIPL/APPI/PIPA surface named in Threats.
- Secrets (Sillage, FullEnrich, Anthropic, and Better Auth keys) are stored as Cloudflare Worker secrets / `.dev.vars` locally, never hardcoded or committed
- If FullEnrich can't find a verified contact, the tool shows "no verified contact" rather than inventing one
- Repo has no commits before the hackathon's start time (per submission rules)

## Business model (if any)

None — hackathon prototype, not a product being sold.

## Success criteria

Live demo, under 90 seconds, running off the real deployed Cloudflare URL (not localhost): the dashboard shows real signals streaming in from tracked Japanese, Korean, and Singaporean accounts, each resolving into a readiness-scored, enriched, personalized draft — with a visible why-panel showing the buying committee, cultural buying-process note, buyer psychology note, local competitor note, and the reasoning behind the score — and a human approving one on stage. Every data point on screen traces back to a real Sillage, FullEnrich, or research call, not a mock.
