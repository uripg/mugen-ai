**Review Verdict: Mostly sound, with a few fixes needed before implementation.**

The ticket sequence is broadly faithful to `ARCHITECTURE.md §6`: skeleton/auth/schema → tools → SG headless pipeline → dashboard/actions → deal intelligence/score → JP/KR → polish. The STRETCH inbound feature being absent is correct.

**Findings**

1. **T-006 is missing the Q-1 / spend gate.**  
   `research_market` uses Anthropic `web_search`, which is a paid API path under AGENTS invariant 10. Even if `CLAUDE_API_KEY` exists, the ticket should explicitly require MEMORY/QUESTIONS Q-1 spend authorization and current Anthropic API/model/web_search docs verification before any live call. Any Anthropic API details must be verified against current docs.

2. **T-007 should explicitly name Q-1 and Q-4 as blockers.**  
   It depends on T-004/T-005, so the gate is mostly inherited, but the ticket itself says it seeds the SG account from Q-4 and runs real paid APIs. Make the blocker explicit so an implementer cannot start the live pipeline without Sillage/FullEnrich keys, spot-check account data, and spend authorization.

3. **T-008 should list invariants 2 and 5, not only 7.**  
   Its acceptance criteria already say no mock/placeholder content and render “no verified contact”; that touches invariant 2 and invariant 5. Add them to frontmatter so reviewer scope is clear.

4. **T-009 is underspecified for Regenerate.**  
   Regenerate likely invokes Anthropic/pipeline behavior, so it should include invariant 10 and probably invariant 8 for route-body validation. If regenerate is only a deterministic local rewrite, say so; otherwise it is a paid human-triggered run and needs bounded retry/spend/auth validation coverage.

5. **T-010 has a dependency/wording typo.**  
   It says “SG first, JP/KR via T-011”; JP/KR is T-012. Fix that. The dependency graph itself is okay because T-010 depends on T-006 and T-007, and T-007 depends on T-005.

6. **T-003 may be a large one-session ticket.**  
   Whole schema, migrations, provenance shape, score constraints, contact constraints, and state-transition tests are reasonable but dense. It is still atomic as “data foundation,” but implementers should keep it schema/helper-only and avoid route/UI work.

7. **T-010 may also be large.**  
   It combines committee enrichment, playbook integration, competitor research, repositioning, prompt changes, draft rewrite, fallback behavior, and tests. It matches the architecture slice, but it is the riskiest one-session ticket. If time pressure matters, split into `playbook+committee` and `competitor+repositioned draft`; otherwise keep as P1 but expect reviewer scrutiny.

**Human Gates**

Q-1: correctly attached to T-004/T-005 and T-013, but should also be explicit on T-006, T-007, and any regenerate path in T-009 if it calls paid APIs.

Q-3: correctly attached to T-010 and T-012. That is the right place; agents must not author playbook content.

Q-4: correctly attached to T-004/T-005 and T-012, but should be explicit on T-007 because SG core pipeline needs the SG account from Q-4.

**Bottom line:** the plan is structurally good and ordered correctly. Patch the gate annotations and invariant frontmatter before starting T-001.
