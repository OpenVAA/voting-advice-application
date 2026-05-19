# Phase 69 + 70 + 71 — Playwright parity-gate follow-up (bundled)

**Captured:** 2026-05-09 (during Phase 69 Plan 02 close)
**Updated:** 2026-05-10 (bundled with Phase 70 + Phase 71 deferrals)
**Status:** pending — bundled v2.8 verification follow-up (covers Phases 69, 70, 71)
**Origin:** `.planning/phases/69-alliance-card-lane-a/69-02-PLAN.md` Task 6 (Playwright parity capture); same defer pattern applied at Phase 70 + Phase 71 verification.

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

## Bundled scope — what one parity run resolves

A single parity smoke run against current HEAD (post-Phase-71) covers all three deferred phases:

- **Phase 69 ALLIANCE-01 SC-4** — Alliance card render path + matchStore Alliance branch wiring; route-matcher widening.
- **Phase 70 WARN-01 SC-4 / BIND-01 SC-4** — Svelte 5 reactivity rewrites (`state_referenced_locally` etc.) + comment-only `// bind: keep —` strip.
- **Phase 71 TYPING-01 SC-4** — Type-only changes (no runtime behavior diff) + the Plan 71-03 `tests/` auto-fix sweep that rewrote 14 `not.toBeVisible()` → `toBeHidden()` sites (Playwright treats them as equivalent; worth confirming once on a real browser per REVIEW WR-01).

If the gate passes for the bundled HEAD, all three phases reconcile in one operator session.

## Pre-capture caveat (added 2026-05-10)

A first attempt by the user on 2026-05-10 surfaced a vite-cache staleness regression: cached pre-bundled deps in `apps/frontend/node_modules/.vite/deps/@openvaa_app-shared.js` retained the pre-Phase-69 source (`organization: ['info', 'candidates', 'opinions']`) and i18n keys flowed through as raw `entityDetails.tabs.candidates` literals because Phase 69 also renamed the i18n key to `entityDetails.tabs.children`. The voter-detail "party detail drawer" test timed out as a result. A second pre-existing failure (candidate-profile image upload timeout) is the documented intermittent imgproxy 502 (`yarn dev:down && yarn dev` workaround in STATE.md). **Before re-running the gate, clear vite + svelte-kit caches:**

```bash
rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit
```

Then proceed with the canonical recipe below.

## Cross-references

- `.planning/phases/69-alliance-card-lane-a/69-02-PLAN.md` Task 6 — full protocol detail.
- `.planning/phases/69-alliance-card-lane-a/69-RESEARCH.md` Finding 6 + Finding 10 — false-positive trap warning + canonical invocation.
- `.planning/phases/69-alliance-card-lane-a/69-VALIDATION.md` "Pre-capture protocol for parity" — the canonical recipe.
- `.planning/phases/70-svelte-5-ssr-a11y-warning-sweep-bind-rationale-cleanup/70-VERIFICATION.md` — Phase 70 PASS-WITH-DEFERRAL reference.
- `.planning/phases/71-frontend-strict-typing-cleanup/71-VERIFICATION.md` — Phase 71 PASS-WITH-DEFERRAL reference + REVIEW WR-01 (tests/ auto-fix `not.toBeVisible()` → `toBeHidden()` shift).
- `.planning/milestones/v2.7-phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs` — the diff script.
- v2.6 P64 anchor baseline: `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json` (HEAD `2c7ad2dea`).
