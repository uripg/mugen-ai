#!/usr/bin/env bash
# reviewer-ask.sh — CONSULTATION mode (LOOP.md §6).
# Ask the independent reviewer a focused question, read-only, and capture the reply
# under .loop/reviewer/ so it survives a context full-stop.
#
# Usage:
#   scripts/reviewer-ask.sh "<question>"                                  # new thread
#   scripts/reviewer-ask.sh "<reply>" .loop/reviewer/disc-T-004.md --resume  # continue last thread
#
# Requires the `codex` CLI installed + authenticated. Swap `codex exec` for another
# read-only reviewer CLI if you prefer (e.g. a second model) — keep it READ-ONLY.
# NOTE: codex CLI flags change between versions — verify `--sandbox` / `resume` against
#       `codex --help` for your installed version before relying on them.
set -euo pipefail

QUESTION="${1:?usage: reviewer-ask.sh \"<question>\" [output-path] [--resume]}"
OUT="${2:-.loop/reviewer/ask-$(date +%Y%m%d-%H%M%S).md}"
RESUME_FLAG="${3:-}"

mkdir -p "$(dirname "$OUT")"

read -r -d '' PREAMBLE <<'EOF' || true
You are the INDEPENDENT REVIEWER for this project. You are READ-ONLY: do not edit,
create, or delete any files. Canonical docs in this repo you may read: SPEC.md,
ARCHITECTURE.md, AGENTS.md, CONSTRAINTS.md, MEMORY.md, and the relevant tickets/.
Answer concisely and
concretely. If you assert any platform API / version / flag, state explicitly that it
must be verified against current docs. Do NOT invent a business, billing, or
compliance rule — those go to the human (AGENTS.md §5).

QUESTION:
EOF

# Reasoning effort defaults to `low` for fast consultations; bump via
# REVIEWER_EFFORT=medium/high when the question is genuinely hard.
if [[ "$RESUME_FLAG" == "--resume" ]]; then
  # Continue the most recent reviewer thread.
  codex exec -c model_reasoning_effort="${REVIEWER_EFFORT:-low}" \
    resume --last "$QUESTION" | tee -a "$OUT"
else
  codex exec --sandbox read-only \
    -c model_reasoning_effort="${REVIEWER_EFFORT:-low}" \
    "$PREAMBLE
$QUESTION" | tee "$OUT"
fi

printf '\n\n---\ncaptured: %s\n' "$OUT"
