---
phase: 187-deploy-pipeline
plan: "15"
subsystem: infra
tags: [ci-evidence, secret-scan, trufflehog, infra-validate, dependency-audit, main-yaml]
status: stopped

requires:
  - phase: 187-12
    provides: "the green evidence commit `refs/evidence/187/green` 395b71c71, the source-only final tree"
  - phase: 187-13
    provides: "the closing E2E run (548 passed, 0 failed) that covered the pushed tree"
  - phase: 187-14
    provides: "the gates in place before any push"
provides:
  - "`evidence/187-15-ci-evidence.md`: the Task 1 readiness lines, the push under attempt 20261115T211655Z.3aff29a93, and run 43817899191 read job by job"
  - "Public: branch `ci-evidence/187-final` at 395b71c712f9af6a80512625f2b38baf93167c1a"
  - "`.planning/todos/pending/2026-11-15-dependency-audit-third-party-advisories.md`, owned by phase 189"
affects: [187-16, 187-18, 189]

actuals:
  tokens: 5800
  tasks: 3
  commits: 16
plan_head_before: dff44d18f37e57ae3bf9c50a5aee576a25038525
plan_head_after: b2b8919a4

tech-stack:
  added: []
  patterns:
    - "Per-job logs read with `gh api --allow-escape-sequences …/actions/jobs/<id>/logs` while the run is still in progress, where `gh run view --log` refuses; secret findings recorded as file:line, detector and verified only"

key-files:
  created:
    - .planning/todos/pending/2026-11-15-dependency-audit-third-party-advisories.md
  modified:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-15-ci-evidence.md

key-decisions:
  - "The plan stops at Task 3. secret-scan is red on two unverified URI fixtures in tests/tests/utils/deployedTarget.test.ts:603,604, a phase-186 file of this workstream. The fix is a new plan, and it needs a new green evidence commit, coverage check, approval and push"
  - "dependency-audit's 16 high+ advisories are third-party. The workstream's only lockfile change is js-yaml (07690d24d), which none of them names. Filed for phase 189"

requirements-completed: []
requirements-advanced: [SUPA-08, PIPE-02]

metrics:
  duration: "about 11h wall clock (2026-11-15T20:04Z to 2026-11-16T06:58Z), most of it the two re-runs and the operator checkpoint; the CI run took 13 min"
  completed: 2026-11-16
---

# Phase 187 Plan 15: The CI run on the final tree Summary

```
SECRET_SCAN=failure
INFRA_VALIDATE=success
DEPENDENCY_AUDIT=failure
CI_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/43817899191
```

**The plan stopped at Task 3.** The source-only final tree went out once as `ci-evidence/187-final` and ran `main.yaml`. The run turned `infra-validate` green, read the dependency audit and filed it, and confirmed that the two measured exclusions clear the v2.16 findings. But `secret-scan` is red on two new unverified URI fixtures that phase 186 added, so G-03 is not closed.

## What happened

- **Task 1** (commits `b2a3c5dbd`, `3aff29a93`). The first reading found the green commit older than the review fixes, and the plan stopped. After plans 187-12 and 187-13 re-ran, the re-reading recorded all seven readiness lines (`READY_TO_PUSH=yes`).
- **Task 2** (orchestrator). The operator approved. The reply was stored under attempt `20261115T211655Z.3aff29a93`, bound and read back. The orchestrator pushed `395b71c71` to `refs/heads/ci-evidence/187-final`, exit 0, as a new branch.
- **Task 3** (commit `b2b8919a4`). Run `43817899191` (head `395b71c71`, event `push`) was watched to completion, and every job was read at job level:

| Job | Conclusion |
|-----|------------|
| skill-drift-check | success |
| secret-scan | **failure** |
| frontend-and-shared-module-validation | **failure** |
| docker-image-build | success |
| supabase-tests | success |
| sql-lint | success |
| dependency-audit | **failure** |
| dev-seed-integration | success |
| supabase-types-drift | success |
| e2e-tests | **failure** |
| e2e-visual | success |
| node-engine-range-negative-control | success |
| infra-validate | success |

## The three carried debts

- **secret-scan: red, the plan stops.** trufflehog 3.97.9 scanned from the merge-base `340a20070`, so the plan's assumption held. It found `verified_secrets: 0, unverified_secrets: 3` and exited 183. The annotations name `SECRET_SCAN_FINDING=tests/tests/utils/deployedTarget.test.ts:603 detector=URI verified=false` and `…:604`. These are made-up user-info base URLs in the `gateTargetLine` test table, added by `a2fa17061` (phase 186). Neither v2.16 file that this plan's exclusions target was flagged, so that debt is closed.
- **infra-validate: green.** `terraform fmt` passed, all eight `terraform validate` blocks passed, and the two `terraform test` groups passed with 33 and 11 tests and 0 failed. This is the first observation of the job on this phase's tree.
- **dependency-audit: read and filed.** It printed `Summary: 16 new advisory(ies) at high+, 0 accepted`: 16 audit ids over 11 GHSA ids, in dompurify, shell-quote, compression, launch-editor, source-map-js, undici, vite and zod. All are third-party (`DEPENDENCY_AUDIT_CAUSE=third-party`), so the todo was filed for phase 189.

## Two further failures (outside the plan's three, recorded, cause unconfirmed)

- **frontend-and-shared-module-validation.** `yarn test:unit` failed 3 tests in `infra/scripts/push-migrations.test.ts`, all under `push-migrations.sh --confirmed-ref`. One expected an output line that was missing (:129). One got exit 1 where 0 was expected (:179). One got `push_connection=unknown` without `drift_status=0` (:185). The pattern points at the drift-check step on the CI runner. The file belongs to this workstream.
- **e2e-tests.** The run had 11 failed, 441 did not run and 96 passed. All 11 failures raised `awaitLinkWitness: … read neither sent nor not-sent within 30000 ms`, which covers every mailed-link flow. The closing local run on the same tree had 548 passed and 0 failed, and the previous evidence run failed differently. The cause appears only in CI and is probably the edge runtime's environment or its mail path. It is unconfirmed.

## Deviations from Plan

- **The plan stopped at Task 3, as its action prescribes for a failed scan.** Task 3's automated verify fails on the missing line `SECRET_SCAN=success`. The must-have truth allows this branch: the findings were read from the log, and the plan stops for a fix. The evidence records `PLAN_STOPPED=yes` and the reason.
- **Two failures outside the plan's three debts were recorded but not fixed.** The orchestrator's instruction was to read and report only. No code was changed and nothing was pushed by the executor.
- **The todo's date.** The file carries the plan's path, dated 2026-11-15. The reading was made on 2026-11-16, and the todo says so.
- **`commits: 16`.** This is measured from the plan ledger `dff44d18f..HEAD`. Because the plan stopped and resumed across the re-runs of 187-12 and 187-13, the range also holds 12 commits of plans 187-12, 187-13, 187-16 and 187-17 and one infra docs commit (`1e10dff7f`). Three commits are this plan's own (`b2a3c5dbd`, `3aff29a93`, `b2b8919a4`), plus the metadata commit of this SUMMARY.

## Next

The secret-scan fix needs a new plan. The likely fix is a third measured exact-path entry in `.github/trufflehog-exclude-paths.txt`, citing run 43817899191, or fixture URLs that the URI detector does not match. Before the next evidence push, the plan also needs a diagnosis of the CI-only `push-migrations --confirmed-ref` failures and the mailed-link E2E timeouts. That push then needs a new green evidence commit, a new E2E coverage check and a new approval.

## Self-Check: PASSED

- FOUND: .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-15-ci-evidence.md
- FOUND: .planning/todos/pending/2026-11-15-dependency-audit-third-party-advisories.md
- FOUND commits: b2a3c5dbd, 3aff29a93, b2b8919a4 (ancestors of HEAD)
- FOUND remote: refs/heads/ci-evidence/187-final at 395b71c712f9af6a80512625f2b38baf93167c1a

## Closed by plan 187-28 (2026-11-17)

G-03 is closed by plan 187-28 on run [44033456141](https://github.com/OpenVAA/voting-advice-application/actions/runs/44033456141), the push of the rebased final tree as `ci-evidence/187-final-4` at `68a54299aa81b2a2f95fd2151031ab4e624ef01c`. Every conclusion was read at job level:

- `SECRET_SCAN=success`
- `E2E_TESTS=success` (729 passed on 4 workers)
- `E2E_VISUAL=success` (run attempt 2, after the operator ruled attempt 1's `supabase start` port collision void)
- `INFRA_VALIDATE=success`
- `DEPENDENCY_AUDIT=failure`, accepted per the phase-189 todo (`.planning/todos/pending/2026-11-15-dependency-audit-third-party-advisories.md`)

Every other job concluded `success`. The record is `evidence/187-28-ci-closure.md` § Task 5. This plan's status stays `stopped`, because its run 43817899191 (`ci-evidence/187-final`) was red; the closure is plan 187-28's.
