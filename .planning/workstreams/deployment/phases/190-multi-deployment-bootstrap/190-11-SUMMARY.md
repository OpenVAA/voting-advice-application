---
phase: 190-multi-deployment-bootstrap
plan: "11"
subsystem: infra
tags: [terraform, bootstrap, moved-blocks, iam, operator-apply, runbook]

requires:
  - phase: 190
    provides: "190-01 plan guard; 190-04 MOVE_COMMIT and its offline move proof (moved 37); 190-06 TIGHTEN_COMMIT and EXPECTED_UPDATES"
provides:
  - "infra/bootstrap/README.md Steps 11 to 13: the deployment map, the pure move, the Environment-tag tightening, adding a deployment, each plan through check-bootstrap-plan.sh"
  - "staging's bootstrap state lives at the map's addresses (apply 1: 0 added, 0 changed, 0 destroyed; moved 37)"
  - "the Environment-scoped deploy policies and the own-key plan deny are live for staging (apply 2: 4 in-place updates, equal to EXPECTED_UPDATES)"
  - "a green staging deploy under the tightened scopes (run 44939177207)"
affects: [190-12, 190-13, 190-14]

actuals:
  tasks: 3
  commits: 6
plan_head_before: b512010e8
plan_head_after: 161766684

tech-stack:
  added: []
  patterns:
    - "every live bootstrap plan saved with -out, read by check-bootstrap-plan.sh from terraform show -json, and only that saved file applied"

key-files:
  created:
    - .planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/evidence/190-11-applies.md
  modified:
    - infra/bootstrap/README.md

key-decisions:
  - "190-11: catch-up apply of 46554181e before the move: its plan-deny statement DenyObjectReadsOutsidePipeline was never applied live (state last written 2026-11-16, statement first in be6e289c8 on 2026-11-22); one in-place update of plan_deny through the guard, then the base plan read No changes"
  - "190-11: apply 1 of MOVE_COMMIT ce17178c6: guard pass with --pure-move, moved 37 = the offline proof's count, 0 delete/replace/update/create; post-apply No changes"
  - "190-11: apply 2 of TIGHTEN_COMMIT 7d4ab1242: inventory 45 + 2 Root=aws resources all Environment=staging; guard pass, update 4 = EXPECTED_UPDATES, create 0, replace 0; post-apply No changes; staging deploy run 44939177207 success"
  - "190-11: the runbook names the pinned Terraform 1.16.5 built for the workstation's own platform, and Step 11 checks version and platform before the first plan"

requirements-completed: [INFRA-21, INFRA-22, INFRA-23, INFRA-24]

duration: about 4 h 45 min wall clock (16:03 to 20:48 UTC, mostly operator applies)
completed: 2026-11-24
---

# Phase 190 Plan 11: The bootstrap applies Summary

**Staging's bootstrap moved onto the deployment map with nothing added, changed or destroyed (37 addresses moved, as the offline proof said). The Environment-tag tightening went live as exactly the four expected in-place policy updates, and staging deployed green under it. Both applies were run by the operator through `check-bootstrap-plan.sh`, following the runbook's Steps 11 and 12. Before the move, a catch-up apply of the base tree's plan-deny policy was needed.**

## Evidence

All operator lines are verbatim in [evidence/190-11-applies.md](evidence/190-11-applies.md). The operator worked on 2026-11-24 with account 471112560111, profile `openvaa-admin` and Terraform 1.16.5 darwin_arm64.

| Acceptance criterion | Recorded | Verdict |
|---|---|---|
| Task 1: `grep -c '^## Step 1[123]:'` = 3; `check-bootstrap-plan.sh` ≥ 3; `--pure-move` ≥ 1; format | 3; 4; 4; `yarn format:check` 0 | pass |
| Apply 1: base plan `No changes.` | `s11_base_plan_line=No changes. ...` (after the catch-up apply, see Deviations) | pass |
| Apply 1: the guard lines with `guard=pass`, `update=0` | delete 0, replace 0, moved 37, failed_move 0, update 0, create 0, unexpected_create 0, guard pass | pass |
| Apply 1: `moved` = MOVE_PROOF's count | 37 = 37 (190-04) | pass |
| Apply 1: `Plan: 0 to add, 0 to change, 0 to destroy.`, apply line, post-apply `No changes.` | all three recorded | pass |
| Apply 2: inventory, every line `staging` | `eu-north-1 environment=staging count=45`, `us-east-1 environment=staging count=2`, no other value | pass (recorded as counts per value) |
| Apply 2: guard with create 0, replace 0; update list = EXPECTED_UPDATES | update 4: deploy_edge, deploy_load_balancing, deploy_network, plan_deny of `module.github_oidc["staging"]` | pass |
| Apply 2: post-apply `No changes.` | recorded | pass |
| Apply 2: green staging deploy run URL | https://github.com/OpenVAA/voting-advice-application/actions/runs/44939177207 success (attempt 2, deploy/staging at 2ddc331d1) | pass |

Both automated verify commands of Tasks 2 and 3 pass: the file has `bootstrap_plan_guard=pass` three times, plus `bootstrap_plan_update=0` and `Apply 2`.

## Task Commits

1. **Task 1**: `b512010e8`, runbook Steps 11 to 13. `161766684` adds the platform-build line (see Deviations).
2. **Task 2** (operator): `36ef4a0e1` records the catch-up apply and apply 1.
3. **Task 3** (operator): `702a73586` records apply 2, and `cd407b768` the green staging deploy.

State checkpoint commit: `a98ce31e7`.

## Deviations from Plan

**1. [Rule 3 - Blocking] Catch-up apply of the base tree before the move (operator ruling).** The base precondition first read `Plan: 0 to add, 2 to change, 0 to destroy.`. The first change was the budget notification, from a mistyped `TF_VAR_alert_email`, which was corrected. The second was `module.github_oidc.aws_iam_policy.plan_deny`: its statement `DenyObjectReadsOutsidePipeline` had never been applied live. The bootstrap state was last written at 2026-11-16T06:58:40Z, and the statement first appears in be6e289c8 on 2026-11-22. Every other statement matched 46554181e. The operator applied 46554181e first, through the guard (update 1, everything else 0, guard pass). The base plan then read `No changes.`, so the move started from the tree the offline proof assumed.

**2. Terraform build.** The first base plan used Terraform 1.17.2 darwin_amd64. It failed with `timeout while waiting for plugin to start`, because the amd64 AWS provider runs under Rosetta. All the recorded plans and applies were then made with the pinned 1.16.5 darwin_arm64.

**3. [Rule 2] The runbook names the platform build (`161766684`).** The prerequisites bullet now says Terraform 1.16.5 must be built for the workstation's own platform, and names the Rosetta symptom. Step 11 requires `terraform version | head -2` to print `Terraform v1.16.5` and the workstation's own `on <os>_<arch>` before the first plan. The runbook is in this plan's `files_modified`, so the change is in scope.

**4. Staging deploy as a re-run.** The green deploy is attempt 2 of run 44939177207, approved by the operator. The evidence records attempt 2's conclusion, not attempt 1's.

## E2E

No local E2E project's spec, fixture, route or helper was touched, so no targeted run was due. Project deltas are 0 against `tests/e2e-runs/191-06-full` (742 passed).

## Next

- 190-12 Task 3, the two staging smoke runs, runs right after 190-14's evidence deploy (operator ruling). Its token probe is recorded in `evidence/190-12-observations.md` with `EMPTY_ENVIRONMENT=runs-without`.
- 190-14 can start: it was waiting on this plan's applies.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: evidence/190-11-applies.md, infra/bootstrap/README.md (Steps 11 to 13)
- FOUND commits: b512010e8, a98ce31e7, 36ef4a0e1, 702a73586, cd407b768, 161766684
