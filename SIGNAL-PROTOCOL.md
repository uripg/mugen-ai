# SIGNAL-PROTOCOL.md — Signal Quality, Ranking & Reliability Protocol

Status: v1.1 · 2026-07-09 · governs how raw Sillage detections become scored, ranked,
displayed signals. Written to be **adversarial to our own pipeline**: every rule below
exists because we found (or anticipated) a concrete way the naive version lies.
v1.1 folds in the full empirical audit of agent #2680's 15,410 detections (§9) —
which invalidated several v1 assumptions; deltas are marked ⚡.

---

## 0. Prime rules (anti-hallucination — non-negotiable)

1. **Provenance or it doesn't exist.** Every signal surfaced anywhere traces to a
   persisted raw payload: detection id → `rawPayload` → `source_url`. No source_url,
   no display.
2. **Deterministic classification only.** `signal_type` mapping is code
   (`get_signals.ts`), never model judgment. The model may *phrase* a summary; it may
   never *add* a fact absent from the raw payload.
3. **Honest empty, honest thin.** A missing data tier caps the score (see §3); it is
   never backfilled, estimated, or "likely". Zero detections renders as zero.
4. **Score never ships without reasoning** (invariant 3), and reasoning may cite only
   persisted rows.
5. **Dedupe before counting.** Unique key = `source_url` per company. One posting
   matching 4 keywords is **one** signal carrying 4 keyword tags — not four signals.
   (Observed: UOB "WB Branch Relationship Manager" fired 4 detections; Sillage also
   emits duplicate detection ids for the same posting — T-004 note.)
6. **Freshness = `signal_date`, never `detected_at`.** A run today can detect an April
   posting (observed: UOB posting signal_date 2026-04-17, detected 2026-07-09).
   Treating detection time as event time fabricates urgency.

---

## 1. Signal taxonomy — types → sub-signals

The four SPEC §2.3 types decompose into sub-signals with distinct evidential value.
Axis legend: **D**irection (Europe, not elsewhere) · **T**iming (now) · **R**eceptivity
(open to foreign vendors).

### Type 1 — International/Europe-facing hiring (agent #2680, `jobPosting*`)
| Sub-signal | Axis | Tier |
|---|---|---|
| Vendor/procurement-function posting (K1 keyword) | D+T | HIGH |
| Expansion-role posting (market entry, regional expansion, EMEA) | D+T | HIGH |
| Hiring cluster: 3+ **deduped** postings / 30d / company | T | HIGH (computed in scoring, not Sillage) |
| English-language posting from JP/KR account | D | MED (computed: language-detect the excerpt; JP/KR accounts only — English is default in SG) |
| Generic intl-language posting (K2 keyword) | D | MED |
| Bank-vocabulary match (K3 keyword) | — | VALIDATOR ONLY (weight ≈ 0 alone) |

### Type 2 — Exec with international background joining (agent #2553, `newJob`/`recentlyPromoted`)
| Sub-signal | Axis | Tier |
|---|---|---|
| New hire into T1 title (§4) **with** prior European employer in `experiences` | D+R | HIGH (the hottest non-engagement signal) |
| New hire into T1 title, no European history | T+R | MED-HIGH |
| Promotion into T1/T2 mandate | T | MED |
| Job change, title outside T1/T2 | — | LOW |

### Type 3 — Engagement with competing European vendor (agent #2745, `competitor*Comment`)
| Sub-signal | Axis | Tier |
|---|---|---|
| Inbound: account person comments substantively on watched vendor's post | R+D | HIGH — highest-value single event in the system |
| Outbound: watched vendor engages account content | R | MED-HIGH |
| Engagement by account's marketing/brand function | R | MED (discount §5) |

### Type 4 — Funding round
**Not detectable.** No API-creatable agent emits `deepSearch` funding signals (verified
against the 8-type playbook library). Contribution to score: **0, always.** Never
estimated from news, memory, or model knowledge. If Sillage ever emits one, the
existing mapping surfaces it.

### Posts agent #2746 (`keywordDetection`) — corroboration tier, NOT a signal type
Detections from the LinkedIn-posts agent are **outside** the four SPEC types and are
dropped by `get_signals` by design (invariant 12). They may be used only as
**validators** in the why-panel narrative (workspace-side), never as triggers, never
as score points on their own. Empirically justified: first run's "proud to work with"
hit was a scholarship-committee post — zero buying intent.

---

## 2. Keyword classes for #2680 (reliability-mapped)

The widened keyword list is NOT uniform quality. At financial institutions much of our
vocabulary is *their product language*. Classes (⚡ re-graded per §9 audit):

**⚡ Trigger rule (supersedes class alone): a keyword is trigger-grade ONLY when it
matches in the job TITLE.** Description-only matches — 96.7% of all detections — are
validator-tier regardless of class, because descriptions carry company boilerplate
(§7 L12). Title-match cuts 3,406 deduped postings to 113 auditable candidates.

- **K1 — trigger-grade on title-match:** `"market entry"`, `"regional expansion"`,
  `"proof of concept"`, `RFP`, `alliances` (title hit observed: UOB "SVP Strategic
  Procurement, Strategic Alliances & Sourcing" — a genuine foreign-procurement role),
  `"cross-border"` **in title only** (observed: "Deputy Director, Cross-Border
  Payments"), `経営企画` (title hits are real corporate-planning hires, e.g. Rakuten
  "経営企画マネージャー候補") · `海外事業`, `해외사업`, `전략기획` — kept, near-zero
  volume so far.
- **K2 — medium:** `international`, `Europe`, `European`, `overseas`,
  `"global expansion"`, `"partnership manager"`, `EMEA` (⚡ demoted from K1: at
  JP megabanks EMEA-analyst hiring is business-as-usual for existing EMEA desks —
  MUFG/Nomura title hits were all routine capital-markets roles),
  `"vendor management"`, `"vendor selection"` (⚡ demoted: description hits landed on
  "Manager - Accounts Payable", "Head of Regional Support Operations").
- **K3 — validator-only (weight ≈ 0 standalone):** `"strategic partnerships"`,
  `"digital transformation"`, `"core banking"` (⚡ title hits are overwhelmingly IT
  maintenance roles — "L3 Production Support, Core Banking"; upgrade to K1 only when
  paired with transformation/modernization language, e.g. "MD, Core Banking
  Transformation"), `"core modernization"`, `"cloud migration"`, `"open banking"`,
  `"embedded finance"`, `"third-party risk"` (⚡ demoted from K1: at banks this is the
  risk department's own function — hits were Risk Management Group staffing),
  `グローバル` (⚡ demoted from CJK-K1: 135 hits, almost all Rakuten **org-unit names**
  — "Global Talent Acquisition", "Global Ad Division" — not expansion intent),
  `"global markets"` → **REMOVED from agent entirely** (bank division name).

K3 keywords stay in the agent (except the removed one) because they corroborate K1/K2
hits on the *same posting*; they must never put an account on the board alone.

---

## 3. Ranking formula (0–100) — axis-gated, corroboration-multiplied

```
raw = Σ over deduped signals: base(tier) × reliability(grade) × decay(signal_date) × behavior(§5)
base: HIGH=25 · MED-HIGH=18 · MED=10 · LOW=4 · VALIDATOR=0 (validators add ×1.15 to the signal they corroborate, max ×1.3)
decay: half-life 30 days on signal_date; floor 0 at >90d
```

**Hard caps (the anti-inflation gates) — applied after summing:**
| Evidence state | Max score |
|---|---|
| Only 1 axis proven | 40 ("candidate") |
| 2 axes, but from a single agent type | 55 |
| ≥2 axes from ≥2 agent types | 85 |
| 3 axes from ≥3 agent types (incl. one Type-3 engagement) | 100 |

**Reliability grades (multiplier):** A = live-verified with true positives (×1.0) ·
B = live but observed false positives (×0.6) · C = wired, zero live data — unproven
(×0.5, and the why-panel must label it "unproven detector") · D = unavailable (×0,
excluded).

**Current grade map (update after every audit):**
| Agent | Grade | Evidence |
|---|---|---|
| #2680 title-matched K1 | A | verified TPs: Nium "Director – Partnerships & Network Management, Expansion", UOB "SVP Strategic Alliances & Sourcing" |
| #2680 description-only matches (any keyword) | B− | ⚡ 96.7% of feed; boilerplate-dominated (L12) — validator tier |
| #2680 CJK: 経営企画 | B | ⚡ 37 hits, title hits are real corp-planning hires |
| #2680 CJK: グローバル | B− | ⚡ 135 hits, org-unit names — K3 validator |
| #2680 CJK: 海外事業/해외사업/글로벌/전략기획 | C | ⚡ 0–2 hits, unproven |
| #2746 posts | B | true positive (Nium CMO "global expansion"/Circle) AND false positive (scholarship post) in the same first run |
| #2553 job_update | C | 0 detections across 3 runs — unproven; re-grade after account mapping completes |
| #2745 competitor | C | 0 detections at 180d max lookback; watchlist n=6 |
| funding | D | not provisionable |

**Score reasoning template (why-panel):** `scored N: <axis> (<sub-signal>, <source>),
… — <k> axes, <m> agent types; caps applied: <cap>; unproven detectors excluded: <list>`.

---

## 4. Profile layer (who the signal is about)

- **T1 titles** (buying-intent staffing): Head of Global/International Partnerships ·
  Head of Overseas BD (海外事業部長 / 해외사업) · VP/Head Vendor Management (Intl) ·
  CDO / Head of Digital Transformation · Head of Innovation · Head of Corporate/
  Strategic Planning (経営企画 / 전략기획 — the real decision locus JP/KR) · Head of
  Strategic Alliances · Head of Procurement/Sourcing–Technology · Regional Director
  APAC · Head of Fintech Partnerships/Ecosystem.
- **T2:** direct reports / managers inside those functions.
- **Rules:** profile facts come ONLY from persisted Sillage lead/enrichment fields
  (`headline`, `experiences`) — never from model world-knowledge about a person.
  European-employer check runs on the `experiences` array, not the headline.
  A contact is *displayable* only after FullEnrich verification (existing invariant);
  an unverified person can carry score weight but renders as "no verified contact".

---

## 5. Behavior layer (what they actually did)

Engagement quality ladder (multiplier on Type-3 and posts-corroboration):
`substantive comment (×1.0) > reshare with commentary (×0.7) > original post (×0.6) >
like/reaction (×0.2 — near-noise)`. "Substantive" = comment_text present and >10 words;
read the text, don't infer from the act.
- **Author discount:** corporate brand account or marketing-titled author ×0.4 (their
  job is to post); line-exec or T1/T2 author ×1.0.
- **Language behavior:** English strategy post/posting from a JP/KR account = Direction
  MED, computed by language-detecting the persisted excerpt in the scoring layer (a
  keyword agent cannot detect language). Never applies to SG.

---

## 6. Trend layer (velocity & direction)

- **Cluster rule:** 3+ deduped Type-1 signals / 30d / company = Timing HIGH.
- **Momentum:** deduped signal count last 30d vs prior 30d; ratio >2 = "accelerating"
  tag. Requires ≥2 time-separated data points — a trend is NEVER inferred from a
  single detection, and never extrapolated past the observed window.
- **Staleness:** signal_date >90d = 0 contribution (matches demo lookback); the
  why-panel shows the real signal_date so stale-but-detected-today can't masquerade.

---

## 7. Loophole register (found by attacking our own pipeline) → mitigations

| # | Loophole | Mitigation | Status |
|---|---|---|---|
| L1 | Multi-keyword + Sillage-dupe inflation (1 posting → 4+ detections) | §0.5 dedupe on source_url | REQUIRED in T-010/T-011 |
| L2 | Bank-vocabulary false positives (cross-border = their product) | K3 class; "global markets" removed | DONE (agent edit) |
| L3 | **Posting geography ≠ account market.** Observed: UOB detection from `th.linkedin.com` — a Thailand posting by a SG bank. Account-level market guard passes it; it's not a JP/KR/SG expansion signal | Parse job_url locale subdomain; non-JP/KR/SG/global locale → validator-only | REQUIRED in scoring layer |
| L4 | Marketing-account noise inflating engagement | §5 author discount | REQUIRED |
| L5 | Recruiter boilerplate ("global exposure", "international team") | keywords audited per §8; boilerplate phrases never added | ONGOING |
| L6 | detected_at masquerading as fresh | §0.6 + §6 staleness | REQUIRED |
| L7 | Workspace churn by teammates: wrong companies (KFTC→Kentuckians, Toyota→dealergeek.com), non-financial adds (Nintendo, Panasonic) | Pipeline trusts only cached `target_accounts.sillage_id` (12 accounts) + runtime market guard; workspace noise cannot enter D1 | DONE (T-004) |
| L8 | Claiming "0 exec-join signals" while attribution might be lossy | Re-run #2553 after mapping completes before re-grading; grade C (not D) meanwhile | PENDING |
| L9 | CJK keywords unproven on English-skewed data | Grade C, zero weight until first audited hit | DONE (grade map) |
| L10 | Score inflation via many same-axis signals | §3 axis-gated hard caps | REQUIRED |
| L11 | Posts-agent detections leaking into D1 as a 5th type | invariant-12 mapping drops them; corroboration only | DONE (by design) |
| L12 | ⚡ **Company boilerplate in job descriptions** — every UOB posting carries the bank's About-us blurb ("global network…"), so generic roles ("Personal Banker" ×25) fire on expansion keywords. 96.7% of detections are description-only matches | Trigger requires TITLE match (§2); description-only = validator | REQUIRED in scoring layer |
| L13 | ⚡ Org-unit naming: グローバル matches division names (Rakuten "Global Talent Acquisition"), not intent | グローバル demoted to K3 | DONE (protocol) |
| L14 | ⚡ Core-function vocabulary: "core banking"/"third-party risk" title hits are the bank's own IT/risk staffing | K3; conditional upgrade only with transformation language | DONE (protocol) |
| L15 | ⚡ Volume asymmetry: detection counts track posting volume, not intent (UOB 3,258 vs Nium 153 — but Nium's were the true positives) | Never rank accounts by raw count; rank by deduped, title-matched, tier-weighted score only | REQUIRED |

---

## 8. Quality-estimation loop (how grades stay honest)

1. **Per-run audit:** sample up to 10 deduped detections per keyword class; hand-label
   true/false positive against the question "does this evidence expansion / foreign-
   vendor readiness?"
2. **Promotion/demotion:** precision <30% → demote to K3 (or remove); >70% across ≥5
   samples → eligible for K1. CJK keywords enter grading only after first hit.
3. **Re-grade agents** (table §3) after every material event: mapping completion,
   watchlist change, keyword change.
4. **⚡ Current quality estimate (2026-07-09, post-audit — see §9):**
   - Type 1 hiring: **usable only through the §2 title-match + tier filter.** Raw
     feed is 15,410 detections → 3,406 deduped postings → 113 title-matched → an
     estimated few dozen genuine expansion signals after tier weighting. Demo-grade
     after the filter; misleading before it.
   - Type 2 exec-join: **no data** (0/3 runs) — do not feature until post-mapping rerun.
   - Type 3 competitor: **no data** (0 at 180d, n=6 watchlist) — honest-empty on card.
   - Type 4 funding: **structurally absent** — card must say so.
   - Posts corroboration: ~50% precision on n=7 (1 clear TP, ≥1 clear FP) — validator
     use only, consistent with grade B.

---

## 9. Empirical audit v1 — agent #2680 full-feed tally (2026-07-09)

Full pagination of the widened agent's detections (152 pages + 2, raw extract in
session scratchpad `all.tsv`):

- **15,410 detections → 3,406 unique (company, title) postings** — 4.5× duplicate
  inflation; worst single posting fired 30 detections. §0.5 dedupe is mandatory.
- **Only 113 postings (3.3%) match the keyword in the title.** The rest are
  description-body matches dominated by company boilerplate (L12).
- **Volume ≠ intent (L15):** UOB 3,258 · Rakuten 2,461 · MUFG-cluster 2,138 ·
  OCBC 1,504 · DBS 1,350 — while Nium, the account with the verified true-positive
  expansion posting, produced just 153.
- **Keyword distribution:** the top four by volume ("strategic partnerships" 1,900,
  "global expansion" 1,802, "market entry" 1,515, "global markets" 1,441 — since
  removed) are all noise-dominated. Precision is inversely correlated with volume.
- **CJK verdict:** グローバル 135 (org-unit names — K3), 経営企画 37 (real
  corporate-planning hires in titles — K1 on title-match), 글로벌 2, 전략기획 1,
  海外事業/해외사업 0. The "English-skewed data" caveat was wrong for Rakuten-style
  bilingual job boards, right elsewhere.
- **signal_date range:** 2026-04-11 → 2026-07-09 (consistent with 90d lookback).
- Re-grades applied to §2/§3 and loopholes L12–L15 added. Next audit: after the
  post-mapping rerun of #2553 (exec-join grade C pending).
