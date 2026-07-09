---
id: T-003
title: Application D1 schema (drizzle) for the whole pipeline
status: done
priority: P0
phase: 1
depends-on: [T-002]
spec-refs: [ARCHITECTURE.md §3]
invariants: [2, 9]
reviewer-verdict: "PASS — .loop/reviewer/disc-T-003.md (round 3; rounds 1-2: verify-T-003-20260709-144401.md + disc)"
---

## Description
Drizzle schema + migrations for `accounts`, `signals`, `contacts`, `leads`,
`deal_intel`, `drafts`, `pipeline_runs` per ARCHITECTURE.md §3, including the
provenance fields (source tool + payload reference) invariant 2 requires and the
score/score_reasoning pairing invariant 3 will rely on. Scope guard (plan
review): schema + deterministic helpers ONLY — no routes, no UI.

## Acceptance criteria
- [ ] All seven tables match ARCHITECTURE.md §3 (fields, statuses, provenance)
- [ ] `contacts` rows can only represent real FullEnrich results (verified flag;
      no "invented contact" shape exists)
- [ ] `leads.score_reasoning` is structurally required whenever `score` is set
- [ ] Migration applies cleanly to local and remote D1
- [ ] No PII in any log statement added (invariant 9)
- [ ] type-check / lint / build pass

## Plan
1. `src/lib/db/app.schema.ts`: the 7 ARCHITECTURE §3 tables in drizzle sqlite-core
   — accounts, signals, contacts, leads, deal_intel, drafts, pipeline_runs — with
   provenance columns (source tool + raw payload JSON) on every AI/tool-produced
   row, `verified` flag on contacts, and status/stage TEXT enums via
   `text({ enum })`.
2. Invariant-3 coupling at the data layer: SQLite CHECK constraint — `score IS
   NULL OR score_reasoning IS NOT NULL` (drizzle `check()`).
3. Re-export from schema.ts; drizzle-kit generate; apply local + remote.
4. Gates. No routes/UI (scope guard from plan review).

Uncertainties: none business-level; drizzle check() API verified against installed
drizzle-orm 0.45 types at compile time.

## Notes / Decisions
- App accounts table is named **`target_accounts`** (export `targetAccounts`) —
  better-auth's generated schema owns the `accounts` name in the same D1 DB;
  reviewer accepted the rename rationale.
- Provenance hardened in review: drafts got `source_tool` + `raw_payload`
  NOT NULL; leads got `score_source_refs` (CHECK requires reasoning AND refs AND
  0–100 whenever score is set); `contacts.verified` has no default (explicit).
- Migrations 0001–0003 applied local + remote; full fresh chain 0000→0003
  verified from a wiped local D1, plus valid/invalid CHECK smoke inserts.
- 0003's INSERT..SELECT hand-edited to select NULL for the new column (reviewer
  round-3 finding — quoted-identifier-as-literal footgun).

## Reviewer verdict
