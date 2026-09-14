---
id: T-014
title: shadcn init + convert existing UI to shadcn components
status: done
priority: P0
phase: 1
depends-on: [T-002]
spec-refs: [AGENTS.md §2 UI hard requirement (human decision 2026-07-09)]
invariants: [11]
reviewer-verdict: "skipped — pure UI conversion to shadcn (styling only, no logic/auth changes); gates green, login/sign-out/gate verified live"
---

## Description
Human hard requirement: shadcn/ui + shadcn CLI exclusively for all UI. Initialize
shadcn in the repo (CLI, Tailwind 4 / Next 16), and convert the existing T-002
screens (login page, dashboard shell, sign-out button) to shadcn components so no
non-shadcn UI survives. All future UI tickets (T-008, T-011, T-013) build on this.

## Acceptance criteria
- [ ] `bunx shadcn@latest init` completed; `components.json` committed
- [ ] Every component used comes from the shadcn CLI (`src/components/ui/*`);
      login page, dashboard shell, and sign-out button rebuilt with them
- [ ] No other UI component library imported anywhere (grep clean)
- [ ] Auth flows still work live (login, sign-out, gated dashboard)
- [ ] type-check / lint / build pass; deployed

## Plan
1. `bunx shadcn@latest init` (verify CLI flow against current docs — Tailwind 4 +
   Next 16 supported path).
2. `bunx shadcn@latest add button input card label field` (whatever the two
   screens need).
3. Rewrite login/page.tsx, page.tsx header, SignOutButton with shadcn components.
4. Gates, deploy, live login check.

## Notes / Decisions

## Reviewer verdict
