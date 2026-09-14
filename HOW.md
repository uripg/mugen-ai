## When you can test

- **Right now:** https://mugen-ai.kedalen.dev is live behind the shared team login (email+password from `.dev.vars`). But today it's just the auth-gated skeleton — the three data tools work and have been live-verified, but only via dev scripts, not through the UI.
- **Within this work session (T-007, in progress now):** the first end-to-end pipeline run — you'll be able to `POST /api/pipeline/run` for a Singapore account (Nium) against the deployed Worker and watch real rows land in D1: signal → verified contact → English outreach draft. Still headless (logs/D1, no screens).
- **Next ticket (T-008):** the dashboard — the first thing that's genuinely _demoable_: a live-updating page where cards populate as the pipeline runs.
- **After T-009–T-012:** approve/edit/regenerate buttons, the deal-intelligence layer with the readiness score and why-panel, then Japan and Korea enabled. T-013 is the full 90-second live run-through.

## What we're building (the product)

An agentic copilot for **European B2B companies trying to land their first customers/partners in Japan, Korea, and Singapore** without a local team. The whole value proposition is being sharp about those three specific markets, not generic multi-region outbound. It's a hackathon prototype for a live demo — no real emails are ever sent.

## How Sillage is used (`get_signals`)

Sillage is our **signal radar**. The workspace tracks 12 target financial accounts (banks/fintechs/insurers across JP/KR/SG — DBS, MUFG, Nium, Toss, Money Forward, etc.) on its top-account list, with a persona already configured ("APAC Financial Buyers — JP/KR/SG Expansion-Ready": partnerships/BD/digital/innovation job titles, financial-sector industries, per-country contact heuristics). Two Sillage agents run detections: a job-update agent and a job-posting keyword agent we created tuned to expansion keywords ("international", "cross-border", etc.). Our `get_signals` tool queries detections per company and deterministically maps them onto **four expansion-readiness signal types**: international-facing hiring, an exec with international background joining, engagement with a competing European vendor, and funding rounds. 340 real detections already pulled (e.g. Nium's "Director – Partnerships & Network Management, Expansion" posting). Empty results stay honestly empty — no mocks anywhere.

## How FullEnrich is used (`enrich_contact`)

FullEnrich is the **contact-verification gate**. Given a person's name (or LinkedIn URL) at a target account, it runs an async enrichment for verified work emails (1 credit each, bounded polling). A contact row is written **only** if FullEnrich returns a deliverable/high-probability email — if not, the product shows "no verified contact"; a contact is never invented. Live-verified already (Nium's CEO, deliverable email). Since job postings don't name a person, the pipeline uses web search to identify a likely decision-maker, then FullEnrich verifies them.

## The third tool (`research_market`)

Claude's native web search finds 1–2 **verified local competitors** in the account's market (live test on Nium found Thunes and Airwallex, with 10 cited sources), feeding the deal-intelligence layer.

## What your users will be able to do (once T-008+ land)

Log in to one dashboard and, per target account: trigger a pipeline run; watch a card populate stage-by-stage with the real signal, a verified contact, a small buying committee, cultural buying-process and buyer-psychology notes (from your team-authored playbooks only — the model never invents cultural claims), the local competitor note, a 0–100 expansion-readiness score that always ships with visible reasoning, and a personalized English draft framed by that market's playbook. Then **Approve / Edit / Regenerate** — approval is a human-only gate, "sent" is simulated, and every data point on screen traces back to a real Sillage, FullEnrich, or web-search call via a why-panel.
