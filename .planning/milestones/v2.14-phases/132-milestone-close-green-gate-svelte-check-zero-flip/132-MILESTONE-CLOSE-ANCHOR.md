# v2.14 Milestone-Close Green Gate — Anchor

**Milestone:** v2.14 — E2E Coverage Expansion + Svelte 5 Idiom Polish + svelte-check Zero
**Recorded:** 2026-07-23
**Requirements:** HARDN-02, TYPE-10

This document is the milestone-close anchor: the recorded green-gate result proving the v2.14
milestone (Phases 118–131) landed with the full E2E suite green to the 3× determinism standard and
`apps/frontend` svelte-check at 0 errors / 0 warnings, enforced by a blocking CI gate. It is the
artifact `/gsd-complete-milestone` consumes next (that ceremony is deferred, a separate step).

## Static gates (live, repo root — clean tree, HEAD ad3f46e84)

| Gate | Command | Result |
|------|---------|--------|
| Build | `yarn build` | ✅ 14/14 turbo tasks |
| Unit | `yarn test:unit` | ✅ frontend 759 passed / 54 files / 0 failed; dev-seed 444 passed / 42 files / 0 failed (19/19 tasks) |
| Typecheck | `yarn workspace @openvaa/frontend check` (svelte-check) | ✅ **0 errors / 0 warnings** (2676 files) — CHANGED vs v2.13's "151 documented baseline"; now 0-absolute, enforced by `--fail-on-warnings` (Plan 02, commit f70baae0d) as a blocking CI step |
| Lint | `yarn lint:check` | ✅ exit 0, 0 errors (warnings-only residual; 0-errors standard matches the v2.13 anchor) |

Evidence: `gate/132-static-gates.txt`, `gate/132-svelte-check-close.txt`.

**Note on svelte-check (TYPE-10):** the milestone flips the historical "≤ 151 baseline" bookkeeping
to a **0-absolute** gate. There was no encoded svelte-check CI step before v2.14; Plan 02 ADDED a
blocking step to the `frontend-and-shared-module-validation` job running the frontend `check` with
`--fail-on-warnings` (so BOTH errors and warnings break the build), and made the shared `check`
script strict so local `yarn check` and CI enforce the same 0/0 standard. Live re-verify at close: 0/0.

## Full E2E suite — 3× determinism re-run (2026-07-23, full `yarn test:e2e`)

Local profile `workers: 6, retries: 0` (STRICTER than CI's `workers: 1, retries: 3`). Each run on a
FRESH `:5173` Vite dev server (stale server killed first; no Playwright `webServer`) + a clean DB
(`yarn db:reset` → migrations + `seed.sql`, **0 elections**, no `default`-template pollution;
`public-assets` bucket asserted). Suite = 129 tests across the perm-DAG + voter/candidate journeys +
a11y + new-feature specs.

| Run | Server / DB | Result |
|-----|-------------|--------|
| 1 | fresh Vite dev server, **clean DB** (`yarn db:reset`) | **129 passed / 0 failed / 0 did-not-run** (10.5m) |
| 2 | **fresh** Vite dev server + clean DB | **129 passed / 0 failed / 0 did-not-run** (10.6m) |
| 3 | **fresh** Vite dev server + clean DB | **129 passed / 0 failed / 0 did-not-run** (10.6m) |

**Verdict: 3× green → HARDN-02 closed.** Run 1 doubles as the D-02 full-concurrent-DAG proof of the
Plan 01 `candidate-journey` step-13.5 (:661) harden — candidate-journey passed under the full perm-DAG
load profile. Evidence: `gate/132-full-suite-run{1,2,3}.txt`, `gate/132-phase-gate-summary.txt`.

## Environmental preconditions (required for deterministic green)

1. **Clean DB (no `default`-template pollution).** Start each run from `yarn db:reset` (migrations +
   `seed.sql`, which carries 0 elections). A pre-run DB holding `default`-template rows makes
   `voter-journey` stall at constituency selection (a 3rd election renders whose constituency the
   fixture never selects → Continue stays disabled). Never `db:reset-with-data` / `db:seed --template default`.
2. **Fresh server per run.** Restart the Vite dev server before each run — three suites against one
   long-lived server accumulates SSR-compile pressure and surfaces late-run load flakes (the v2.13
   lesson; re-confirmed here — the pre-count failure below was an SSR-compile-load stall).

## Count-restart log (D-05 / D-06)

A PRE-COUNT run FAILED once and RESTARTED the 3× count at 0 (never skipped, never retried-to-green):

- **Failure:** `perm-hide-election-tags.spec.ts:15` — 90s test-timeout at `voterNavigation.ts:216`
  waiting for `voter-elections-continue` visibility (the documented `elections-continue-stall` under
  SSR-compile load; the error-context snapshot showed the page had already advanced to `/questions`).
  105 passed / 1 failed / 23 did-not-run (8.3m). The 23 did-not-run cascaded from the 1 failure.
- **Root cause (harness gap, not a product bug):** `advanceVoterFlow`'s elections (:216) and
  constituencies (:193) branches each opened with an UNBOUNDED `...Cont.waitFor({ state: 'visible' })`
  — no fast-fail + hard-nav fallback, unlike the sibling click/URL-settle steps in the same branches.
- **Fix (in-phase test-side harden, D-03/D-06, commit `ad3f46e84`):** bounded `TIMEOUTS.slowPage`
  visibility wait + `navigateDirectlyToQuestions()` fallback on both branches. Behavior-neutral on the
  happy path; recovers the stall instead of hanging the full test timeout. Todo filed FIXED:
  `todos/completed/2026-07-23-elections-continue-stall-voternavigation-unbounded-wait.md`.
- After the fix, the count was restarted at 0; runs 1–3 above are the clean post-fix count.

## Discarded-run log (D-07 — env-wedge ≠ suite failure)

During pre-run `yarn db:reset` setup, local Supabase storage wedged twice (`storage/v1/bucket`
"context deadline exceeded" / imgproxy 502). Each was recovered per the D-07 runbook
(`yarn db:stop && yarn db:start && yarn db:reset`, then `public-assets` bucket asserted) BEFORE any
counted test run started. **No counted run was invalidated by an env-wedge** — these were pre-run
setup wedges, recovered, and logged for evidence integrity. Never counted as a pass or a suite failure.

## Anchor commit

Static + 3× E2E gate evidence recorded across commits:
- `d0c39520d` — static-gate + svelte-check-close evidence (Task 1)
- `ad3f46e84` — voterNavigation.ts elections/constituencies-continue harden (mid-gate flake fix)
- `6431679f1` — 3× E2E determinism gate evidence (Task 2)
- This anchor + COVERAGE.md + REQUIREMENTS/ROADMAP flips + flake-todo FIXED move land in the Plan 03
  Task 3 docs commit (the immediately-following commit).

Milestone archive ceremony (`/gsd-complete-milestone`) intentionally deferred to the next step.
