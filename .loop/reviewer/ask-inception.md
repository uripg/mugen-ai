**Review Result: Needs Changes Before Ratification**

1. **Inventions / Overreach Not Grounded Enough**
- `ARCHITECTURE.md` pre-authorizes deploys to the demo Worker via ratification. This is a reasonable proposed resolution, but it is still a human-only item under `CONSTRAINTS.md`; keep it as a blocking question until explicitly answered. `MEMORY.md` Q-2 correctly does this.
- `ARCHITECTURE.md` says ratifying it also signs off new production dependencies. That is acceptable only if the human explicitly understands ratification includes dependency approval. `MEMORY.md` should add this as a separate blocking question or fold it clearly into ratification.
- `SPEC.md` proposes shared email/password auth. IDEA allows shared login or OAuth, so this is grounded, but it remains an agent proposal and should stay marked provisional until ratified.
- “Singapore safest” and “one market first = Singapore” are grounded in IDEA. No issue.
- “D1 deletion after hackathon” appears as posture in AGENTS §8, but CONSTRAINTS has not explicitly defined retention mechanics. Human should confirm whether deletion is manual, timed, or just a demo promise.

2. **Missing / Weak Invariants**
- Missing invariant for **hackathon submission timing**: IDEA non-negotiable says repo has no commits before hackathon start. This should be in AGENTS §1 or §5/checklist, because it can fail the submission independent of product behavior.
- Missing invariant that **Phase 1 is JP/KR/SG only** / not generic multi-region. It appears in SPEC, but not as an invariant or human-only scope boundary.
- Missing invariant that **no mocks appear in the live success path**. AGENTS §1 says grounded in real data, but success criteria specifically say no mocks. Consider making this explicit.
- AGENTS §1.4 covers cultural notes and committee-role assumptions, but IDEA also says **messaging judgment** comes from team expertise. The invariant should include outreach/message framing if that is intended to constrain generated drafts.
- Spend containment invariant says paid API calls only inside explicit runs, but CONSTRAINTS says **no real money unless budget granted**. AGENTS §1/§5 covers this partly; add an invariant or gate that no paid API is used until TOOLBOX/MEMORY has explicit spend authorization.

3. **CONSTRAINTS / IDEA Items Not Fully Reflected in AGENTS**
- `CONSTRAINTS.md` “No external publishing” is not clearly represented in AGENTS §5. “Going live” mentions publishing, but third-party uploads/public repos/packages should be explicit.
- `CONSTRAINTS.md` “No destructive operations on data/infrastructure that isn’t disposable dev-local state” is in AGENTS §5 only as “production migration or destructive change on live data.” That is narrower than the source constraint. Broaden it.
- `CONSTRAINTS.md` data rules are still template placeholders. AGENTS filled in demo D1/PII posture from IDEA, but the human should ratify because CONSTRAINTS itself did not specify exact sensitive data/flow rules.
- IDEA says local env vars go in `.dev.vars`, not `.env.local`; AGENTS §8 covers `.dev.vars`, but §2 could also explicitly ban `.env.local` for this project if you want reviewers to catch it.

4. **Stack Proposals With Weak or Needs-Verification Rationale**
- Next.js 16, OpenNext, Better Auth Cloudflare template, KV TTL behavior, Anthropic `web_search`, Sillage V2 API, FullEnrich API, and exact deploy commands all **must be verified against current docs at implementation time**. The draft says this for model/API generally; reviewers should enforce it per ticket.
- `drizzle-orm` + `drizzle-kit`: rationale is plausible but weakly grounded. IDEA did not require Drizzle; it is agent-proposed. Human dependency approval needed.
- `vitest`: reasonable for deterministic core tests but still a new dev dependency. Human approval needed under CONSTRAINTS “no new production dependencies” is technically production-only, but AGENTS §5 says new production dependency. Decide whether dev dependencies also need sign-off.
- Pipeline execution “one account/signal end-to-end within request” is the riskiest architecture proposal. Rationale is simple, but Workers request limits and external API latency could break live demo. The fallback “split into per-stage requests” is good; first implementation ticket should verify current Cloudflare/OpenNext runtime limits against current docs.
- Tailwind CSS 4 is in architecture but not AGENTS §2. If already scaffolded, fine; if relied on as committed stack, include it or explicitly treat as scaffold detail.

5. **MEMORY Blocking Questions**
- Q-1 through Q-4 are good and concrete.
- Add **Q-5: new dependency approval**: Better Auth package/template, Drizzle, Anthropic SDK, zod, vitest, and any Tailwind/scaffold assumptions if not already present.
- Add **Q-6: retention/deletion**: what “deleted after hackathon dataset” means operationally.
- Add **Q-7: hackathon start-time compliance**: confirm initial commit timestamp is allowed.
- Consider adding a question for **playbook fallback content** separately if Q-3 becomes too broad.

**Bottom Line**

Do not ratify yet. The draft is mostly faithful to IDEA, but AGENTS is missing a few load-bearing constraints, and MEMORY should ask explicitly about dependency approval, retention/deletion, and hackathon commit timing. Platform/API/version claims must be re-verified against current docs during implementation.
