#!/usr/bin/env bash
# reviewer-verify.sh — VERIFICATION mode (LOOP.md §6/§7).
# Independent, READ-ONLY review of the current change set against a ticket's
# acceptance criteria + the AGENTS.md invariants + ARCHITECTURE.md. Captures the
# verdict under .loop/reviewer/.
#
# Usage:
#   scripts/reviewer-verify.sh T-004
#
# Requires the `codex` CLI installed + authenticated (READ-ONLY). Verify flags against
# `codex --help` for your version. The reviewer MUST NOT edit files — review only.
set -euo pipefail

TICKET="${1:?usage: reviewer-verify.sh <ticket-id>   e.g. T-004}"

TICKET_FILE="$(ls tickets/${TICKET}-*.md 2>/dev/null | head -1 || true)"
if [[ -z "$TICKET_FILE" ]]; then
  echo "error: no ticket file matching tickets/${TICKET}-*.md" >&2
  exit 1
fi

OUT=".loop/reviewer/verify-${TICKET}-$(date +%Y%m%d-%H%M%S).md"
mkdir -p "$(dirname "$OUT")"

# Staged + unstaged diff = the change set under review. Exclude lockfiles and
# generated artifacts — large, mechanical churn that drowns the signal (and can
# overflow Linux's 128KB per-argument limit). Extend this list for your project's
# generators (ORM meta snapshots, codegen output); keep hand-relevant files in.
LOCKFILE_EXCLUDES=(':(exclude)pnpm-lock.yaml' ':(exclude)package-lock.json' ':(exclude)yarn.lock' ':(exclude)bun.lock' ':(exclude)bun.lockb' ':(exclude)Cargo.lock' ':(exclude)poetry.lock' ':(exclude)uv.lock')
DIFF="$(git diff --staged -- . "${LOCKFILE_EXCLUDES[@]}"; git diff -- . "${LOCKFILE_EXCLUDES[@]}")"
if [[ -z "$DIFF" ]]; then
  echo "warning: empty diff — nothing to verify for $TICKET" >&2
fi

PROMPT="You are the INDEPENDENT VERIFIER for this project. READ-ONLY: do not edit any files.

Verify the change set below against:
  1. the acceptance criteria + invariants declared in this ticket, and
  2. the rules/invariants in AGENTS.md (read it), the hard limits in CONSTRAINTS.md
     (read it), and the design in ARCHITECTURE.md (read it).

Pay special attention to the AGENTS.md §1 invariants — a violation is an automatic FAIL,
regardless of acceptance criteria.

Output FORMAT:
  First line exactly: 'VERDICT: PASS' or 'VERDICT: FAIL'
  Then findings as: <file>:<line> · <severity> · <what + why>.
Be specific and actionable. If you cite a platform API/flag, note it must be verified
against current docs. Do NOT invent a business, billing, or compliance rule.

Be DECISIVE: spot-check the riskiest one or two claims, then emit your VERDICT. The
implementer has already verified the platform APIs against current docs — you need not
exhaustively re-derive every one. End your reply with the VERDICT line if you opened with it.

=== TICKET ($TICKET) ===
$(cat "$TICKET_FILE")

=== CHANGE SET (git diff) ===
$DIFF"

# `< /dev/null`: a prompt is passed as argv, so close stdin — otherwise
# `codex exec` blocks on "Reading additional input from stdin..." when run with
# an open stdin (e.g. foreground).
# Reasoning effort is overridable; default `low` for speed — STEP 7's risk gate
# already routes only the tickets that need review here. Bump to medium/high via
# REVIEWER_EFFORT for invariant-heavy or security-sensitive tickets.
codex exec --sandbox read-only \
  -c model_reasoning_effort="${REVIEWER_EFFORT:-low}" \
  "$PROMPT" < /dev/null | tee "$OUT"

printf '\n\n---\ncaptured: %s\n' "$OUT"
printf 'Record this path in the ticket'\''s reviewer-verdict field.\n'
