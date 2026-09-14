# DESIGN.md — the visual design input (optional)

> **Human-written input — read-only for the agent; never edit to make a build pass.**
> This file plus the screenshots in `designs/` are the visual reference for the
> product. The agent consumes them at inception (LOOP.md §2.0) — they inform
> `SPEC.md` user flows and the frontend structure in `ARCHITECTURE.md` — and again
> on **every UI ticket** before writing any screen. If no visual designs exist,
> leave this file as-is; the agent proposes designs and flags them as
> unvalidated-by-design.

---

## 1. Where the designs live

- Folder: `designs/` — PNG/JPG exports (e.g. from Figma), one file per screen or state.
- Naming: `NN-screen-name.png`, numbered in rough user-flow order
  (e.g. `01-home.png`, `02-detail.png`). A state variant gets a suffix:
  `02-detail-empty.png`.
- When a design changes, re-export **over the same filename** and note the change in
  §3 — don't accumulate `-v2` files.

## 2. How to read the screenshots (agent rules)

- **Authoritative** (match the screenshot): screen layout, component placement,
  navigation structure, iconography intent, overall visual style (colors, spacing
  feel, typography hierarchy).
- **Indicative only** (do not copy literally): placeholder text, sample data, counts
  and numbers, user names, exact pixel dimensions.
- If a flow in `IDEA.md`/`SPEC.md` has **no screenshot**, propose a design that
  reuses the components and style visible in the existing screens, and flag it in
  the ticket as unvalidated-by-design.
- If a screenshot **contradicts** `IDEA.md`, `SPEC.md`, or a non-negotiable, that is
  a **blocking question** in `MEMORY.md`, not a judgment call.

## 3. Screen inventory (human fills this in)

One entry per file in `designs/`. Keep it short — the screenshot carries the
visuals; this table carries what the picture can't say (behavior, states, links to
spec sections).

| File | Screen | Notes for the agent |
| --- | --- | --- |
| `01-….png` | `<screen name>` | `<what it does, tap targets, states not shown, spec section it implements>` |

_(Delete this line once real rows exist: until the table is filled, the agent may
use the screenshots but must list each un-inventoried file as a blocking question.)_
