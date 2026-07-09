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

- Sillage V2 docs URL: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***
- FullEnrich docs URL: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

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

# MARKET: Singapore

## 1. Cultural buying-process note

- Singapore is generally **structured, pragmatic, English-friendly, procurement-aware, and ROI/risk-driven**.
- Compared with Japan and Korea, foreign vendors usually face less language friction, but buyers still expect strong business justification, clear implementation details, and professional follow-through.
- In enterprise deals, expect a buying committee: business owner, finance/procurement, IT/security, legal/compliance, and sometimes an executive sponsor.
- Government, government-linked, financial, and regulated buyers are especially process-driven. Singapore public procurement emphasizes **fairness, openness, competitiveness, transparency, integrity, and value for money**.
- APAC B2B buying is committee-heavy. Forrester’s APAC data reports a median of **eight people** involved in B2B purchase decisions, with many firms involving **10+ people** and multiple departments.

## 2. Buyer psychology note

- Singapore buyers prioritize **business value, ROI, reliability, compliance, security, implementation speed, professionalism, and regional credibility**.
- A new foreign vendor is acceptable if the business case is clear and the vendor can prove supportability, security, and execution quality.
- Common concerns: “Can they support Singapore/APAC?”, “Will this pass procurement/security?”, “Can they integrate cleanly?”, “Is the ROI measurable?”, and “Will implementation create operational risk?”
- Buyers can be more direct than in Japan/Korea, but trust, reputation, and relationship quality still matter.

## 3. Committee-role heuristics

- If the signal contact is **Head of Global Partnerships / Regional Strategy / APAC Growth / Business Development**, tag them as **champion** or **strategic evaluator**.
- Enrich the **business unit owner / regional GM / functional VP** as **economic buyer** or **executive sponsor**.
- Enrich **procurement / finance** as **commercial evaluator**, especially for enterprise, government-linked, or formal RFP environments.
- Enrich **IT/security/compliance** as **technical evaluator**, especially for SaaS, AI, fintech, HR, procurement, data, or infrastructure products.
- Practical SG heuristic: **champion + business owner + procurement/IT-security**.

## 4. Messaging judgment

- **Do:** be concise, polished, direct, and business-case-first.
- **Do:** lead with relevance, measurable value, Singapore/APAC fit, proof points, security/compliance posture, and implementation clarity.
- **Do:** include regional references, named customers if allowed, ROI evidence, and a clear next step.
- **Don’t:** overdo ceremony or vague relationship-building. Singapore buyers usually tolerate direct commercial messaging better than Japan/Korea.
- **Don’t:** make unsupported claims about compliance, government readiness, AI safety, data residency, cost savings, or local presence.
- **Don’t:** hide support limitations. If support is regional or remote, explain the support model clearly.

## 5. FALLBACK LINE

- Singapore is pragmatic and procurement-aware, so pair the champion with the business owner and procurement/IT evaluator, then lead with ROI, credibility, compliance, and implementation clarity.

## Sources

- Singapore GeBIZ, “Guide to Singapore Procurement” — https://www.gebiz.gov.sg/singapore-government-procurement-regime.html
- Singapore Ministry of Finance, “Government Procurement” — https://www.mof.gov.sg/policies/government-procurement/overview/
- Forrester, “The Complexity Of The B2B Buying Process In Asia Pacific” — https://www.forrester.com/report/the-complexity-of-the-b2b-buying-process-in-asia-pacific/RES181577
- Forrester, “The State Of Business Buying, 2024” — https://www.forrester.com/press-newsroom/forrester-the-state-of-business-buying-2024/

# MARKET: Korea

## 1. Cultural buying-process note

- Korea is **hierarchical, fast-moving once trust exists, and relationship-sensitive**. Seniority, title, and department status matter, especially in larger companies and chaebol-style organizations.
- Decisions are not always purely top-down. A senior person may have the final say, but the working team still needs to validate fit, implementation effort, risk, and internal usefulness.
- Expect visible progress to be ambiguous. Positive meetings may mean interest, not commitment. Internal approval can still depend on senior sponsorship, procurement, legal, IT/security, and business-unit alignment.
- Warm introductions, local partners, Korean-language support, and senior-level engagement can materially improve credibility and speed.

## 2. Buyer psychology note

- Korean buyers often prioritize **credibility, speed of response, status/signaling, senior-level seriousness, local accountability, and proof that the vendor understands Korea**.
- A new foreign vendor may trigger concerns such as: “Will they support us locally?”, “Will they respond quickly?”, “Do they understand Korean business norms?”, “Can I defend this choice internally?”, and “Are they serious about Korea or just testing the market?”
- Risk avoidance is important, but Korea can move faster than Japan when the problem is urgent and the right senior sponsor is engaged.
- Price matters, especially in competitive procurement, but credibility, responsiveness, implementation ability, and local seriousness often determine whether the buyer engages deeply.

## 3. Committee-role heuristics

- If the signal contact is **Head of Global Partnerships / Strategy / Overseas Business / Business Development**, tag them as **champion** or **strategic evaluator**.
- Enrich the **division head / senior director / VP-level business owner** as **executive sponsor** or **economic buyer**. Senior endorsement matters.
- Enrich **procurement / purchasing** as **commercial gatekeeper**, especially in large companies.
- Enrich **IT/security, platform owner, operations lead, or implementation lead** as **technical evaluator** if the product touches systems, data, workflow, AI, infrastructure, or customer operations.
- Practical KR heuristic: **champion + senior sponsor + procurement or technical evaluator**.

## 4. Messaging judgment

- **Do:** be respectful, concise, credible, and title-aware.
- **Do:** signal seriousness about Korea: Korean-language materials, local support/partner path, Korean or APAC references, relevant industry proof, and fast response expectations.
- **Do:** make the business value obvious quickly. Korean buyers are often competitive and execution-focused.
- **Don’t:** be overly casual, too blunt, or too “Silicon Valley hype.” Avoid unsupported disruption language.
- **Don’t:** push too hard for a fast decision before trust exists. It can signal that you do not understand the internal decision process.
- **Don’t:** bypass hierarchy clumsily. If messaging a senior person, keep it strategic; if messaging an operator, give them internal ammunition.

## 5. FALLBACK LINE

- Korea is hierarchy- and trust-sensitive, so pair the initial champion with a senior sponsor and show local seriousness through Korean-language support, fast responsiveness, and credible references.

## Sources

- Source of Asia, “South Korean Business Culture Guide” — https://www.sourceofasia.com/south-korean-business-culture-guide/
- Asian Absolute, “A Guide to Business Etiquette in Asia: South Korea” — https://asianabsolute.co.uk/blog/a-guide-to-business-etiquette-in-asia-south-korea/
- KoreaTechDesk, “In Korea, Progress Doesn't Always Mean Commitment for Global Business” — https://koreatechdesk.com/korea-decision-making-gap-progress-vs-commitment-global-business
- CIBTvisas, “A Guide to South Korean Business Etiquette” — https://cibtvisas.com/blog/business-etiquette-south-korea

# MARKET: Japan

## 1. Cultural buying-process note

- Japan is highly **consensus-driven**. Purchase decisions often move through informal pre-alignment (_nemawashi_) before a formal approval route such as _ringi/ringisho_, where a proposal circulates across multiple stakeholders for sign-off.
- Do not assume the person who likes the product can buy alone. The internal path often includes the business champion, the department head, IT/security, procurement, legal, finance, and sometimes a senior executive sponsor.
- Enterprise sales cycles can be long. Recent Japan B2B sales guidance describes formal approval chains involving roughly **5–12 stakeholders** and enterprise deal cycles often taking **6–18 months**.
- Documentation matters. Buyers often need clear written material they can forward internally: business case, implementation plan, security notes, pricing, references, support model, and risk mitigation.

## 2. Buyer psychology note

- Japanese buyers tend to prioritize **risk reduction, reliability, stability, references, local support, and long-term vendor commitment**.
- A new foreign vendor may be viewed as risky until it proves it understands the Japanese market, can support implementation properly, and will not disappear after the sale.
- Localization matters: Japanese-language collateral, Japanese support paths, local partner coverage, and Japan/APAC references all reduce perceived risk.
- Price matters, but usually after the vendor is considered safe. “Reliable and proven” usually beats “cheap but uncertain.”

## 3. Committee-role heuristics

- If the signal contact is **Head of Global Partnerships / Business Development / Strategy**, tag them as **champion** or **market-entry scout**.
- Enrich the **department head / bucho-level owner** as **economic buyer** or **executive sponsor**, because budget and internal credibility often sit above the first contact.
- Enrich **IT/security, operations, systems owner, or implementation lead** as **technical evaluator**, especially for SaaS, AI, workflow, integrations, data, or compliance products.
- Practical JP heuristic: **champion + bucho/economic buyer + technical evaluator**. Champion-only enrichment is usually too thin.

## 4. Messaging judgment

- **Do:** use a formal, precise, humble, evidence-led tone.
- **Do:** open with why this account/person is relevant, then ask for a low-pressure conversation or feedback.
- **Do:** include proof points: references, security posture, implementation support, localization, Japanese-language materials, and long-term commitment.
- **Do:** make the message easy to forward internally.
- **Don’t:** overclaim, use aggressive urgency, imply they should decide quickly, or position the product as obviously superior to local alternatives.
- **Don’t:** treat silence as disinterest too quickly. The process may be moving internally without visible momentum.

## 5. FALLBACK LINE

- Japan is consensus-led and risk-sensitive, so pair the initial champion with the budget-owning department head and lead with trust, localization, references, and implementation safety.

## Sources

- Mind Melt, “Japan B2B Sales Strategy for Foreign Companies” — https://mindmelt.jp/insights/japan-b2b-sales-strategy
- Silkdrive, “Ringi: The Japanese Approval Process European Sales Teams Keep Misreading” — https://www.silkdrive.com/insights/ringi-japanese-approval-process
- Nihonium, “Japanese B2B Sales: Key Differences from Western Markets” — https://nihonium.io/japanese-b2b-sales-key-differences-from-western-markets/
- Litmus, “Why Partnerships Drive B2B Sales Growth in Japan” — https://www.litmus-jp.com/thought-starters/why-partnerships-drive-b2b-sales-growth-in-japan

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
   | ------ | ------------ | ------ | ------------------------------- |
   | JP     |              |        |                                 |
   | KR     |              |        |                                 |
   | SG     |              |        |                                 |

3. One line per market on what the spot-check showed, so expectations are set
   honestly (invariant 2 forbids papering over thin data):
   - JP — signals visible? contacts enriched OK? \***\*\*\*\*\***\_\_\***\*\*\*\*\***
   - KR — \***\*\*\*\*\***\_\_\***\*\*\*\*\***
   - SG — \***\*\*\*\*\***\_\_\***\*\*\*\*\***

**Blocks:** pipeline tickets that call the real APIs end-to-end, and seeding
`accounts`. Everything up to and including the dashboard shell is NOT blocked.

---

_When all three are answered, delete or archive this file — `MEMORY.md` remains the
canonical record._
