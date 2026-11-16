---
phase: 187-deploy-pipeline
plan: "26"
subsystem: infra
tags: [ci-evidence, secret-scan, trufflehog, push-migrations, edge-functions, e2e-tests, dependency-audit, main-yaml, gap-closure]
status: stopped

requires:
  - phase: 187-15
    provides: "run 43817899191 read job by job: the URI findings, the Linux push-migrations failures and the CI-only mailed-link timeouts this plan fixed"
provides:
  - "`evidence/187-26-ci-closure.md`: the fixes' readings, the gates, the closing E2E window, the push under attempt 20261116T092214Z.46a06578a, and run 43839245785 read job by job"
  - "Public: branch `ci-evidence/187-final-2` at 102202f7a162cb8a67d31cc50f7692a22e015ab7"
  - "`.planning/todos/pending/2026-11-16-drift-guard-docker-stand-in-link.md`: the drift-guard follow-up the operator ruled"
affects: [187-15, 187-18, 189]

actuals:
  tokens: 19400
  tasks: 7
  commits: 11
plan_head_before: 4977d049f17c89ffa19e9720dc3dc41eaa22da60
plan_head_after: 260efc4160148c1e7e8996d3ae09399c5feaab72

tech-stack:
  added: []
  patterns:
    - "A CI run is followed by `gh run watch`, then by polling `gh run view --json status` when the watch dies on a network error. Conclusions are read only at job level"
    - "Audit ids are compared by their table rows only. A GHSA id that appears only in another advisory's description is not a finding"

key-files:
  created:
    - infra/scripts/main-e2e-workflow.test.ts
    - .planning/todos/pending/2026-11-16-drift-guard-docker-stand-in-link.md
  modified:
    - tests/tests/utils/deployedTarget.test.ts
    - infra/scripts/push-migrations.sh
    - infra/scripts/push-migrations.test.ts
    - .github/workflows/main.yaml
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-26-ci-closure.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-12-evidence-commits.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-13-closing-e2e.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/deferred-items.md

key-decisions:
  - "Plan 187-26 stops at Task 7. On run 43839245785, e2e-tests concluded failure on three CI-only contestant readiness timeouts, with the cause unconfirmed. The fix is a new plan. Plan 187-15 is not closed and its ROADMAP line stays unticked"
  - "Run 43817899191's three red jobs are closed on the final tree. secret-scan reports 0 results, push-migrations.test.ts passes 14 of 14 on Linux, and e2e-tests no longer shows the awaitLinkWitness or ERR_ENV_UNCONFIGURED signature"
  - "dependency-audit failure accepted per the phase-189 todo: the same 16 audit ids over the same 11 GHSA ids, none new"
  - "Drift-guard follow-up (operator ruling push-now-fix-in-follow-up): link the docker stand-in in checkDriftLinkedGuard.test.ts to an existing binary before the milestone's final evidence push; filed as a pending todo"

duration: 100min
completed: 2026-11-16
---

# Phase 187 Plan 26: Gap closure of run 43817899191 Summary

```
CI_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/43839245785
SECRET_SCAN=success
FRONTEND_AND_SHARED_MODULE_VALIDATION=success
E2E_TESTS=failure
DEPENDENCY_AUDIT=failure (accepted per the phase-189 todo)
DRIFT_GUARD_CAUSE=unconfirmed (operator ruling: push-now-fix-in-follow-up)
STAGING_FUNCTION_SECRETS_BLOCKER=none
```

**The three fixes closed run 43817899191's red jobs in CI, but `e2e-tests` on `ci-evidence/187-final-2` is red on three new CI-only contestant-app readiness timeouts. The plan stops at Task 7, and 187-15 stays open.**

## Performance

- **Duration:** about 100 min for this session (Tasks 1 to 5 ran in earlier sessions on the same day)
- **Completed:** 2026-11-16
- **Tasks:** 7 of 7 executed. Task 7's success branch (the 187-15 closure) was not taken.
- **Files modified:** 11 since the plan ledger

## What was done

- **Task 1 (secret scan).** The gate-line user-info fixtures in `tests/tests/utils/deployedTarget.test.ts` are now built from parts. trufflehog 3.97.9, run locally as CI runs it, reproduced the 3 results on 395b71c71 and reported 0 after the fix. 118 tests before and after, and the negative control failed 2 rows. No exclusion was added.
- **Task 2A (`run_child` on Linux).** `push-migrations.sh` now leaves the drift check on the script's own streams (`run_child 0 - -`). In node:24-alpine the failing statuses `1,1,1` became `0,0,0`.
- **Task 2B (drift guard).** Not reproduced in 28 runs. No host suspend was found. `DRIFT_GUARD_CAUSE=unconfirmed`, and the operator ruled push now, fix in a follow-up.
- **Task 3 (CI's E2E job).** `main.yaml`'s `e2e-tests` copies the tracked Edge Functions env template into place before `Start Supabase`, and prints the edge runtime's log on failure. `infra/scripts/main-e2e-workflow.test.ts` guards both. `STAGING_FUNCTION_SECRETS_BLOCKER=none`.
- **Task 4 (gates and commits).** Every gate exited 0 on the final tree. The new green commit 102202f7a and red commit 34d7b211d were proven by archive builds. The green commit's local scan found 0.
- **Task 5 (closing E2E window).** Without the functions env, the run reproduced CI's failure (the operator ruled it `reproduced`). On the template the run was green: 548 passed, 0 failed, 0 flaky, 0 did not run. The developer's file was restored with the same inode, size and mtime.
- **Task 6 (push).** The orchestrator pushed `102202f7a…:refs/heads/ci-evidence/187-final-2` under attempt 20261116T092214Z.46a06578a. Approval was bound and read back, and the verify exited 0 except for the overruled drift-guard stop.
- **Task 7 (the run).** Run 43839245785 was read job by job: 11 success, 2 failure. The audit failure is accepted. The e2e-tests failure stops the plan.

## Run 43839245785, job by job

| Job | Conclusion |
| --- | --- |
| secret-scan | success (0 verified, 0 unverified, 3781 chunks, from merge-base 340a20070) |
| dev-seed-integration | success |
| skill-drift-check | success |
| sql-lint | success |
| frontend-and-shared-module-validation | success (`push-migrations.test.ts` 14 tests; infra 321 of 321) |
| docker-image-build | success |
| dependency-audit | failure, accepted per the phase-189 todo (16 audit ids over the todo's 11 GHSA ids; `DEPENDENCY_AUDIT_NEW_SINCE_TODO=none`) |
| supabase-tests | success |
| supabase-types-drift | success |
| e2e-visual | success |
| node-engine-range-negative-control | success |
| e2e-tests | **failure**: 3 failed, 343 did not run, 202 passed (9.9m); preflight 0 failures |
| infra-validate | success |

## Why the plan stops

`e2e-tests` failed on three readiness waits in the contestant app, in three different projects:

1. `contestant-email-registration.spec.ts:186`: the `contestant-email-sent` screen was not found within 10 s.
2. `contestantAxeScan.ts:152` cand-home (dark): `contestant-home-continue` stayed disabled, with no `data-next-step="preview"`, for 10 s.
3. `contestant-terms-gate-phone.spec.ts:28`: `terms-of-use-submit` was still disabled after 5 s.

The previous run's signature is gone: 0 `awaitLinkWitness` lines and 0 `ERR_ENV_UNCONFIGURED`. `account-access` served 69 requests. The local closing run on the same tree was 548 of 548 green. That matches a slower CI runner, but the cause is **unconfirmed**. Each failure's `error-context.md` and trace are in the run's `e2e-run` artifact (id 14213491247), which was not downloaded. Under the plan, the fix is a new plan, and this executor fixed and pushed nothing.

## Deviations from Plan

- **Task 6's `DRIFT_GUARD_CAUSE=unconfirmed` stop was not applied.** The operator overruled it with `DRIFT_GUARD_RULING=push-now-fix-in-follow-up`. Every other check of Task 6's verify held. The follow-up is the pending todo below.
- **Task 5's `NOFILE_REPRODUCES_CI=partial` was ruled `reproduced` by the operator.** The edge log logs an error's name and code, never its message, so the plan's `SITE_URL` grep could not match.
- **The `gh run watch` died on a network read error** (exit 1) before the run ended. Polling `gh run view --json status` replaced it, and no conclusion was inferred.
- **One read was refused by the secret-read hook.** It was a `grep` of the downloaded CI log whose pattern held a `.env` path string. It was not retried in another form. The step it would have shown is recorded at job level (`Configure the Edge Functions' environment`: success).
- **Plan 187-15 is not closed**, as Task 7 prescribes on a red run. `187-15-SUMMARY.md` and its ROADMAP line are unchanged.
- **`commits: 11`.** Measured from the plan ledger `4977d049f..HEAD`. One of them, `797d1cfb5` (a todo about the CloudFront edge cache), is another session's commit.

## Follow-ups

- **Drift guard (named per the operator's ruling).** `.planning/todos/pending/2026-11-16-drift-guard-docker-stand-in-link.md`: link the `docker` stand-in in `packages/dev-seed/tests/checkDriftLinkedGuard.test.ts` to an existing binary, keeping the 15 s budget, before the milestone's final evidence push. It is also recorded in `deferred-items.md`.
- **New plan needed.** Diagnose and fix the three CI-only contestant readiness timeouts on run 43839245785, starting from the `e2e-run` artifact's error contexts. Then make a new green commit, coverage run, approval and push. G-03 and plan 187-15 close on that run.
- **dependency-audit** stays owned by phase 189 (`.planning/todos/pending/2026-11-15-dependency-audit-third-party-advisories.md`).

## Self-Check: PASSED

- FOUND: .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-26-ci-closure.md
- FOUND: .planning/todos/pending/2026-11-16-drift-guard-docker-stand-in-link.md
- FOUND: infra/scripts/main-e2e-workflow.test.ts
- FOUND commits: 02a1530b2, 6c8d41c6f, 97a631eb9, 260efc416 (ancestors of HEAD)
- FOUND remote: refs/heads/ci-evidence/187-final-2 at 102202f7a162cb8a67d31cc50f7692a22e015ab7
