---
id: T-011
title: Expansion Readiness Score + why-panel
status: in-progress
priority: P1
phase: 1
depends-on: [T-009, T-010]
spec-refs: [SPEC.md §2 IN-5/IN-7, ARCHITECTURE.md §3 leads, ARCHITECTURE.md §6.4]
invariants: [2, 3, 11]
reviewer-verdict: skipped — speed directive 2026-07-09
---

## Description
The 0–100 Expansion Readiness Score, produced from the signal + deal intelligence
with its reasoning captured, and the why-panel rendering everything next to the
draft: signal, buying committee, cultural note, buyer psychology note, competitor
note, and score reasoning — the product's answer to the black-box objection.

## Acceptance criteria
- [ ] Score is never rendered anywhere without its reasoning (invariant 3 — UI
      structurally couples them; `score_reasoning` required at the data layer)
- [ ] Score reasoning references only real, persisted inputs (invariant 2); a
      market with thin data scores honestly, never padded
- [ ] Why-panel shows all six SPEC §2 IN-7 elements beside the draft, each
      traceable to its source row/tool
- [ ] Renders correctly in the degraded states: no verified contact, no committee
      member, competitor note cut, fallback playbook line
- [ ] type-check / lint / build pass

## Plan

## Notes / Decisions

- 2026-07-09 · Scoring framework from human-supplied signal research (see chat):
  tag every signal by **axis** — direction (Europe, not US) / timing (now) /
  receptivity (open to foreign) — and by role — **trigger** (puts account on
  the board) vs **validator** (corroborates). Scoring rule: high score requires
  **≥2 axes proven by ≥2 different agent types**; no single signal scores high
  except an inbound competitor comment (receptivity+direction in one event).
  E.g. funding (timing) + European-experienced hire (direction) + inbound
  comment (receptivity) = defensible ~90; funding alone = ~40 "candidate".
  Why-panel should name the axes explicitly ("scored 88: receptivity (…),
  direction (…), timing (…) — three independent axes, three agents").
- 2026-07-09 · Signal-weight guidance: job postings > LinkedIn posts (postings
  cost headcount; post keywords are validators only, never triggers — marketing
  noise). Hiring **cluster** (3+ intl/transformation postings per company_id in
  ~30d) proves timing decisively — compute in scoring layer, not Sillage.
  For job_update leads, read `experiences` (prior European employer = direction
  proof), not just title. English-language posting/post from a JP/KR account is
  itself a direction signal (not in SG, where English is default).
- 2026-07-09 · High-intent title list for exec-join weighting (partnerships/
  overseas BD/vendor mgmt/CDO/innovation/corp planning 経営企画·전략기획/
  alliances/tech procurement/APAC regional/fintech ecosystem) — full list in
  the same research doc; corporate-planning offices are the real decision locus
  for JP/KR (chaebol/keiretsu buying centers).
- 2026-07-09 · **`SIGNAL-PROTOCOL.md` (repo root) is now the canonical scoring
  spec** — supersedes the sketches above. Carries: sub-signal taxonomy + tiers,
  keyword classes K1/K2/K3, axis-gated hard caps, agent reliability grades
  (A/B/C/D with live evidence), dedupe + staleness rules, behavior/trend
  layers, an 11-entry loophole register (incl. L3: posting geography ≠ account
  market — UOB Thailand posting observed), and the audit loop that keeps
  grades honest. Implement T-011 scoring against it.

## Reviewer verdict
