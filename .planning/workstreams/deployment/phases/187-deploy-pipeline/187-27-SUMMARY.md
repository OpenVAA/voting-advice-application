---
phase: 187-deploy-pipeline
plan: "27"
subsystem: infra
tags: [ci-evidence, rebase, e2e-tests, e2e-visual, readiness, hydration, drift-guard, conformance-probe, dependency-audit, main-yaml, gap-closure]
status: stopped

requires:
  - phase: 187-26
    provides: "run 43839245785 read job by job: the three CI-only contestant readiness timeouts and the drift-guard follow-up this plan took on"
provides:
  - "`evidence/187-27-ci-closure.md`: the rebase readings, the gates on the rebased and the final tree, what the rebase carries to staging, the throttled and delayed-hydration controls, the drift guard, the closing E2E window, the push under attempt 20261116T192353Z.8b93ad083, and run 43938990256 read job by job"
  - "Public: branch `ci-evidence/187-final-3` at 2b0842fd46bf6f26dfa6dad009a13b2297197b30"
  - "`deferred-items.md`: what the rebase carries to staging for plans 187-21 and later, and the `yarn dev` start race between the package watcher and Vite's optimiser"
  - "`.planning/todos/done/2026-11-16-drift-guard-docker-stand-in-link.md`: the drift-guard todo, closed"
affects: [187-15, 187-18, 187-21, 187-25, 189]

actuals:
  tokens: null
  tasks: 8
  commits: 15
plan_head_before: 201a6320aeca8eb31ac824fcad9191f80035f2bd
plan_head_after: 1f5c56781f5983110fa703f621c6f376b046f870

tech-stack:
  added: []
  patterns:
    - "A CI-only readiness timeout is reproduced by a deterministic delayed-hydration control (a temporary `page.route` holding SvelteKit's client `entry.js` for 12 s), not by CPU throttling, which slows only the page's own script"
    - "A test helper that waits on hydration takes an optional `{ timeout }`, defaulting to the old bucket, so a caller widens its own wait without changing anyone else's"

key-files:
  created:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-27-ci-closure.md
  modified:
    - apps/frontend/src/hooks.server.ts
    - infra/scripts/probe/checks.mjs
    - infra/scripts/probe/sources.mjs
    - infra/scripts/probe-hosted.mjs
    - infra/scripts/probe-hosted.test.ts
    - packages/dev-seed/tests/checkDriftLinkedGuard.test.ts
    - tests/tests/helpers/navigation.ts
    - tests/tests/fixtures/contestant/contestantHomePage.fixture.ts
    - tests/tests/fixtures/contestant/contestantTermsOfUsePage.fixture.ts
    - tests/tests/specs/a11y/contestant-a11y.spec.ts
    - tests/tests/specs/voter/analytics-gpc.spec.ts
    - tests/tests/specs/voter/voter-journey.spec.ts
    - tests/tests/specs/voter/voter-prefs-tracking.spec.ts
    - tests/tests/specs/voter/voter-tracking-consent-free.spec.ts
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-12-evidence-commits.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-13-closing-e2e.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/deferred-items.md
    - .planning/todos/done/2026-11-16-drift-guard-docker-stand-in-link.md
    - .planning/todos/pending/2026-11-15-dependency-audit-third-party-advisories.md

key-decisions:
  - "Plan 187-27 stops at Task 8. On run 43938990256, e2e-visual and e2e-tests concluded failure. Plans 187-15 and 187-26 are not closed and their ROADMAP lines stay unticked, and G-03 is not closed"
  - "e2e-visual's cause is confirmed: every differing pixel of the two Voter Results baselines lies in a candidate portrait, shifted by the base template's new row `test-e2e-base-ca-admin-flows` from db9e314b2 (-gsd stream). e2e-tests' seven CI-only 10 s readiness timeouts have an unconfirmed cause. Both are owned by the -gsd stream"
  - "This plan's two readiness fixes held in CI: cand-home and the terms gate did not fail on run 43938990256"
  - "dependency-audit failure accepted per the phase-189 todo: the todo's 16 rows unchanged, and one new third-party row (`@sveltejs/kit`, GHSA-3r8g-jcqq-3p5j) from the rebase's lockfile, appended to the todo"
  - "Operator rulings of 2026-11-16 during the plan: `THROTTLE_RULING=delayed-entry-module` and `PROBE_RULING=fix-in-187-27`"
  - "Operator rulings of 2026-11-16 for the next step: the fixes for the -gsd-owned failures are made in the -gsd worktree, on a new branch on top of `ship/v2.16-12-planning`, and the -infra stack is then rebased onto it. The next work starts by measuring CI (worker count and warm-up experiments on `ci-evidence/*` branches), because only the runner reproduces the timeouts"

duration: 140min
completed: 2026-11-16
---

# Phase 187 Plan 27: Gap closure after the rebase onto the -gsd stream Summary

```
CI_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/43938990256
SECRET_SCAN=success
FRONTEND_AND_SHARED_MODULE_VALIDATION=success
INFRA_VALIDATE=success
E2E_TESTS=failure
E2E_VISUAL=failure
DEPENDENCY_AUDIT=failure (accepted per the phase-189 todo)
E2E_VISUAL_CAUSE=confirmed (-gsd base-template row, db9e314b2)
E2E_TESTS_CAUSE=unconfirmed
```

**The rebased tree passes every local gate and the closing local run (729 of 729), and this plan's two readiness fixes held in CI. But on `ci-evidence/187-final-3`, `e2e-visual` is red on portrait baselines shifted by a -gsd base-template row, and `e2e-tests` is red on seven new CI-only readiness timeouts in -gsd-owned specs. The plan stops at Task 8, and 187-15 and 187-26 stay open.**

## Performance

- **Duration:** about 140 min, from the plan's commit `dbe69d1a6` (19:27 +0200) to the run's record `1f5c56781` (21:46 +0200)
- **Completed:** 2026-11-16
- **Tasks:** 8 of 8 executed. Task 8's success branch (the closure of 187-15 and 187-26) was not taken.
- **Files modified:** 20 after the plan's own commit (`dbe69d1a6..1f5c56781`)

## What was done

- **Task 1 (the rebased tree).** Every gate exited 0 on the rebased HEAD, with the local database at HEAD's 22 migrations. The archive build of the probe commit exited 0, and its trufflehog 3.97.9 scan found 0. The one piece of fallout was `format:check` on `apps/frontend/src/hooks.server.ts`, the rebase's hand-resolved conflict; fixed in `527d9e866`.
- **Task 2 (what the rebase carries to staging, from records only).** No hosted read or write. 187-21's first pipeline deploy will push 21 migrations (`00002` to `00022`), none needing a hosted step. Two hosted settings changed (`mailer_otp_length` 6 to 10, the redirect paths to `/auth/confirm`), so runbook Step 18 is needed by hand before 187-21. The one new environment name is `IDENTITY_CALLBACK_SERVER_SECRET`, and no staging function secret changes. The conformance probe's `identity-callback` check was found stale against HEAD.
- **Task 3 (the two CI-only readiness timeouts).** CPU throttling at rate 4 and 6 did not reproduce either timeout (`THROTTLE_REPRODUCES_CI=no`), and the task stopped. Under the operator's `THROTTLE_RULING=delayed-entry-module`, a temporary route held SvelteKit's client `entry.js` for 12 s. HEAD's cand-home and the terms fixture without its hydration wait both failed at CI's exact assertions, and with the fixes both passed (44 of 44, 6 of 6). The fixes are `b29c91405`: `waitForNavigationFocusReset` and `expectNextStep` take an optional budget, the terms fixture and the cand-home reach use `TIMEOUTS.testMax`, and four voter specs call the shared helper in place of private copies. The scan's settle wait was not changed (`SETTLE_HYDRATION_WAIT=not-applied:cand-preview`). Five targeted runs were green.
- **The probe (`e56db5391`, under `PROBE_RULING=fix-in-187-27`).** `functions.identity-callback-unverified` now expects HEAD's 400 `bad_request` and 401 `refused` bodies. The infra tests pass 98 of 98 for the probe file.
- **Task 4 (the drift guard, `ced5b42bb`).** The `docker` stand-in is a link to `/usr/bin/true` on this host and on CI's ubuntu-24.04 image, and the 15 s budget is unchanged. 10 runs alone and 18 under load had 0 timeouts. The todo is closed.
- **Task 5 (gates and commits).** Every gate exited 0 on `fabe70c1b`, the infra tests 323 of 323. The new green commit 2b0842fd4 and red commit 3e03b9648 were proven by archive builds (green exit 0, red exit 1 at `@openvaa/frontend#build`). The green commit's scan found 0.
- **Task 6 (closing E2E window).** With the developer's functions env moved aside and the template in its place, the full run was green: 729 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run. The developer's file was restored with the same inode, size and mtime, and the edge runtime restarted with it.
- **Task 7 (push).** The orchestrator pushed `2b0842fd4…:refs/heads/ci-evidence/187-final-3` under attempt 20261116T192353Z.8b93ad083, on the standing approval of 2026-11-16. The verify exited 0 and the approval was read back.
- **Task 8 (the run).** Run 43938990256 was read job by job: 10 success, 3 failure. The audit failure is accepted. The e2e-visual and e2e-tests failures stop the plan.

## Run 43938990256, job by job

| Job | Conclusion |
| --- | --- |
| secret-scan | success (0 verified, 0 unverified, 4186 chunks, from merge-base 340a20070) |
| skill-drift-check | success |
| docker-image-build | success |
| supabase-tests | success |
| node-engine-range-negative-control | success |
| sql-lint | success |
| supabase-types-drift | success |
| frontend-and-shared-module-validation | success (`checkDriftLinkedGuard.test.ts` 13 tests on Linux; the infra tests, the probe's among them) |
| e2e-tests | **failure**: 7 failed, 511 did not run, 211 passed (13.3m); preflight 0 failures |
| dev-seed-integration | success |
| dependency-audit | failure, accepted per the phase-189 todo (17 rows: the todo's 16 and one new third-party row, `@sveltejs/kit` GHSA-3r8g-jcqq-3p5j) |
| infra-validate | success |
| e2e-visual | **failure**: 2 failed, 6 passed (58.9s); preflight 0 failures |

## Why the plan stops

**`e2e-visual` (cause confirmed).** Only the two Voter Results screenshots differ, by about 1% of the pixels (7830 desktop, 7841 mobile). Every differing pixel lies in a candidate portrait. The base template gained the candidate `test-e2e-base-ca-admin-flows` in db9e314b2 (-gsd stream, 179.2-04, 2026-11-12). The dev-seed writer assigns portraits as `portraits[i % 30]` over the candidates sorted by `external_id`, so the new row shifts the portrait of every candidate after it, and the baselines (e811fd2f1, 2026-11-07) predate it. The pre-rebase tree passed this job on run 43839245785 because it held neither the commit nor its row.

**`e2e-tests` (cause unconfirmed).** Seven readiness waits failed at the 10 s render and hydration buckets, each the first wait after a cold load or a mailed-link landing:

1. `voter-nominations.spec.ts:21`: `voter-nominations-list` not visible.
2. `contestant-code-registration.spec.ts:143`: `register-submit` still disabled.
3. `voter-results-redraw.spec.ts:440`: `voter-results-list` not visible.
4. `contestant-email-registration.spec.ts:145`: `contestant-home-status` not visible.
5. `admin-account-flows.spec.ts:133`: `admin-set-password-gate` not visible.
6. `contestant-email-registration.spec.ts:481`: the focus reset never landed (`signInScriptLoaded`).
7. `entity-selection.setup.ts:57`: `locator.waitFor` at `registerAndStoreSession.ts:89`.

The 511 did-not-run tests are downstream of these, chiefly of `data-setup-entity-selection`. They are the class this plan's two fixes closed for cand-home and the terms gate, which passed here, and the closing local run on the same source tree passed 729 of 729. Every failing spec, fixture and setup file is owned by the -gsd stream; this plan added only an optional budget to the shared `helpers/navigation.ts`, with the default unchanged. A delayed-hydration control per wait is needed before any budget changes. Under the plan, the fix is a new plan, and nothing more was fixed or pushed.

## Deviations from Plan

- **Task 3 stopped on `THROTTLE_REPRODUCES_CI=no`**, and the operator ruled `THROTTLE_RULING=delayed-entry-module`. Task 3's verify reads the throttle; its `THROTTLE_RATE` and `THROTTLE_REPRODUCES_CI` checks were read as satisfied by the delayed-entry control, and `THROTTLED_A11Y_AFTER` and `THROTTLED_TERMS_AFTER` carry the delayed readings. Every other check applied unchanged.
- **The probe was fixed in this plan** (`e56db5391`, Rule 1, under `PROBE_RULING=fix-in-187-27`). It touches four `infra/scripts/` files outside the plan's `files_modified`.
- **Rebase fallout** (`527d9e866`): the merged `sequence(...)` call in `apps/frontend/src/hooks.server.ts`, a -gsd file whose conflict this branch's rebase resolved, was formatted. No other gate was red.
- **The generated types were read after a second `yarn db:reset`.** The first `yarn db:types` ran after the pgTAP tests and picked up their 18 helper lines; CI generates on an untested database. A measurement-order correction, not fallout.
- **The scan's settle wait was not applied** (`SETTLE_HYDRATION_WAIT=not-applied:cand-preview`): cand-preview never shows the focus reset after a cold load, so the wait ran to the test ceiling. `contestantAxeScan.ts` is unchanged, and cand-home is closed by its own reach.
- **One delayed control's dev server failed to start** (wrapper exit 5, Vite's optimiser against the watcher's rebuild of `@openvaa/data`). There was no result to read; the control was made again under a new directory, and the race is in `deferred-items.md`.
- **Plans 187-15 and 187-26 are not closed**, as Task 8 prescribes on a red run. Their SUMMARY files and ROADMAP lines are unchanged.

## Follow-ups

- **Next step (operator rulings, 2026-11-16).** The fixes for the -gsd-owned failures (the portrait baselines or the new row's sort position, and the seven readiness waits) are made in the -gsd worktree on a new branch on top of `ship/v2.16-12-planning`, and the -infra stack is then rebased onto it. The work starts by measuring CI, with worker-count and warm-up experiments on `ci-evidence/*` branches, because only the runner reproduces the timeouts. Then a new green commit, coverage run, approval and push; G-03 and plans 187-15 and 187-26 close on that run.
- **For plans 187-21 and 187-25** (`deferred-items.md`). 187-21's first deploy pushes 21 migrations under one approval; its Task 1 `EXPECTED_PENDING=none` is stale; runbook Step 18 is applied by hand in the same sitting, immediately before its approval. `00018` and `00020` define SECURITY DEFINER functions that update `auth.users`, and whether the hosted `postgres` role holds that privilege is checked at review.
- **`yarn dev` start race** between the package watcher and Vite's optimiser, owned by the -gsd stream's dev tooling (`deferred-items.md`).
- **dependency-audit** stays owned by phase 189 (`.planning/todos/pending/2026-11-15-dependency-audit-third-party-advisories.md`, with the new row appended).

## Self-Check: PASSED

- FOUND: .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-27-ci-closure.md
- FOUND: .planning/todos/done/2026-11-16-drift-guard-docker-stand-in-link.md
- FOUND commits: 527d9e866, ced5b42bb, e56db5391, b29c91405, 1f5c56781 (ancestors of HEAD)
- FOUND remote: refs/heads/ci-evidence/187-final-3 at 2b0842fd46bf6f26dfa6dad009a13b2297197b30 (read back with `git ls-remote` in Task 8)
