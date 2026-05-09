# Phase 69 — Playwright parity-gate follow-up

**Captured:** 2026-05-09 (during Phase 69 Plan 02 close)
**Status:** pending — Phase 69 verification follow-up
**Origin:** `.planning/phases/69-alliance-card-lane-a/69-02-PLAN.md` Task 6 (Playwright parity capture)

## Why deferred

Plan 02 Task 6 (parity gate) was deferred at plan-close time because:

1. The user had `yarn dev` running for the SC-4 manual UI smoke (Plan 02 Task 5), which PASSED with explicit operator approval.
2. The parity-gate pre-capture protocol (`yarn supabase:reset` per RESEARCH Finding 6/10 — NOT `yarn dev:reset-with-data` to avoid the Phase 67 false-positive trap) would have wiped the user's running dev session.
3. Per the executor's parity-gate fallback directive: "the smoke (Task 5) was the actual SC-4 reconciliation gate; parity is a regression-only check. The user has answered enough questions during this session that they may not want a 10-15min parity run blocking the close."

Phase 69 SC-4 (manual smoke) is the requirement-level acceptance gate; the parity gate is a secondary regression-only safety net. Deferring it does NOT block closing Phase 69 against ALLIANCE-01.

## What needs to happen

Run the parity gate when convenient (before or during Phase 70 / Phase 71 close, or as a standalone verification pass). Per the v2.6 P64 attempt-4 protocol (see `.planning/phases/69-alliance-card-lane-a/69-VALIDATION.md` "Pre-capture protocol for parity"):

```bash
# 1. Stop any running yarn dev session
# 2. Reset supabase to migrations-only state (NO seed overlay):
yarn supabase:reset

# 3. Start the frontend dev server in a separate terminal:
yarn workspace @openvaa/frontend dev
# Wait until http://localhost:5173 responds 200.

# 4. Run the full E2E suite with JSON reporter:
yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json > raw.json 2>&1 || true

# 5. Strip dotenv stdout pollution and place under post-fix/:
mkdir -p .planning/phases/69-alliance-card-lane-a/post-fix
tail -n +2 raw.json > .planning/phases/69-alliance-card-lane-a/post-fix/playwright-report.json
node -e "JSON.parse(require('fs').readFileSync('.planning/phases/69-alliance-card-lane-a/post-fix/playwright-report.json','utf8'))" || echo "INVALID JSON"

# 6. Run the diff-parity gate against the v2.6 P64 anchor baseline:
node .planning/milestones/v2.7-phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs \
  .planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json \
  .planning/phases/69-alliance-card-lane-a/post-fix/playwright-report.json
```

Acceptance: `PARITY GATE: PASS` with counts `67p / 1f / 34c` (or per-test diff showing no `p → f` regressions; tests that flip `f → p` are acceptable improvements).

## Resolution

When the gate passes, append a note to `.planning/phases/69-alliance-card-lane-a/69-02-SUMMARY.md` "Verification Gate Results" table and delete this todo file (or move to `.planning/todos/completed/`).

If the gate FAILS (any `p → f` regression), root-cause via the per-test diff output. Likely candidates: matchStore Alliance branch wiring, EntityCard alliance render gating, route-matcher widening edge cases. Either revert + replan or fix in-place; do NOT mark Phase 69 fully verified until the gate passes.

## Cross-references

- `.planning/phases/69-alliance-card-lane-a/69-02-PLAN.md` Task 6 — full protocol detail.
- `.planning/phases/69-alliance-card-lane-a/69-RESEARCH.md` Finding 6 + Finding 10 — false-positive trap warning + canonical invocation.
- `.planning/phases/69-alliance-card-lane-a/69-VALIDATION.md` "Pre-capture protocol for parity" — the canonical recipe.
- `.planning/milestones/v2.7-phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs` — the diff script.
- v2.6 P64 anchor baseline: `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json` (HEAD `2c7ad2dea`).
