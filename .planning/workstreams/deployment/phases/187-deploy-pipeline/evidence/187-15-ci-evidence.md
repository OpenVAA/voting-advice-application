# 187-15 evidence: the CI run on the final tree

Repository `OpenVAA/voting-advice-application`. These readings were made by the plan executor from this checkout. The one remote read was `git ls-remote`. Nothing was pushed, no ref was created or moved, and no GitHub, AWS or Supabase setting was read or changed. The first reading created no attempt file; after the re-reading, attempt `187-15-2` was created under `tmp/183-evidence/` (see the re-reading).

## Task 1, first reading (superseded): what would be pushed, read-only (read 2026-11-15T20:04Z, HEAD `dff44d18f`)

```
READ_AT_SUPERSEDED=2026-11-15T20:04Z
PUSH_COMMIT_SUPERSEDED=69d10a72357e149c1c35a7002d7779233ffc4d44
PUSH_TREE_SUPERSEDED=fa16b0c68a9d32835f811344393d2bb31a173c9b
HEAD_SOURCE_TREE_SUPERSEDED=0f222299b88d63aa18878080896f1b6b50c6fe3a
PUSH_TREE_MATCHES_HEAD_SUPERSEDED=no
PUSH_TREE_COVERED_BY_E2E_SUPERSEDED=yes
PUSH_PATHS_SUPERSEDED=3320
PUSH_PLANNING_PATHS_SUPERSEDED=0
PUSH_EXCLUSIONS_PRESENT_SUPERSEDED=yes
BRANCH_ABSENT_SUPERSEDED=yes
MAIN_YAML_TRIGGERS_ON_CI_EVIDENCE_SUPERSEDED=yes
READY_TO_PUSH_SUPERSEDED=no
STOP_REASON_SUPERSEDED=the green evidence commit's tree is not HEAD's tree without .planning/: 17 source paths under .github/workflows/ and infra/ changed after it, in 16 commits
```

How each line was read:

- **`PUSH_COMMIT`.** `git rev-parse --verify refs/evidence/187/green` exit 0 printed `69d10a72357e149c1c35a7002d7779233ffc4d44`, which is `GREEN_COMMIT` of `187-12-evidence-commits.md`. Its tree, `git rev-parse <commit>^{tree}`, is `fa16b0c68a9d32835f811344393d2bb31a173c9b` (`GREEN_TREE`). `git for-each-ref --contains <commit>` prints only `refs/evidence/187/green`: no branch and no remote-tracking ref holds it.
- **`PUSH_TREE_MATCHES_HEAD=no`.** I wrote a temporary index under the session scratch directory and removed it afterwards. With HEAD at `1b2af2af9`: `git read-tree HEAD` exit 0, `git rm -r --cached --quiet .planning` exit 0, and `git write-tree` exit 0 printed `0f222299b88d63aa18878080896f1b6b50c6fe3a`. That is not `GREEN_TREE`. The real index was not touched (`git diff --cached --quiet` exit 0). HEAD then moved to `dff44d18f` through a concurrent executor's commit. That commit changes only `.planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-17-smoke-contestant.md` (`git diff --quiet 1b2af2af9 HEAD -- . ':!.planning'` exit 0), so the reading holds for the current HEAD as well.
- **What differs.** `git diff --stat fa16b0c68 0f222299b` reports 17 files changed, 776 insertions(+) and 329 deletions(-). The files are:
  - `.github/workflows/`: `deploy.yml`, `destroy.yml`, `infra-plan.yml`
  - `infra/`: `README.md`, `bootstrap/README.md`, `envs/example/aws/tests/plan.tftest.hcl`, `envs/staging/supabase/README.md`, `modules/github-oidc/deploy-policies.tf`, `modules/github-oidc/tests/github_oidc.tftest.hcl`
  - `infra/scripts/`: `check-destroy-plan.sh`, `check-destroy-plan.test.ts`, `deploy-workflow.test.ts`, `destroy-workflow.test.ts`, `infra-plan-workflow.test.ts`, `push-migrations.sh`, `push-migrations.test.ts`, `workflowGuards.ts`

  `git log --oneline 54e79823b..HEAD -- . ':!.planning'` lists 16 commits that changed them, all after the closing E2E run's HEAD. Fourteen are code-review fixes, from `49d8ec823` (WR-08) to `6bf28e0e1` (IN-04). The other two are `95d1d6ad5` (docs 186-08) and `d55a94b7a` (docs 187, R-01). No file under `apps/`, `packages/` or `tests/` is among them.
- **`PUSH_TREE_COVERED_BY_E2E=yes`.** `git diff --quiet 54e79823b1fa6a3548a82bdf2d27644e4b7af317..HEAD -- apps packages tests` exit 0. Also, `git diff --quiet 54e79823b <PUSH_COMMIT> -- . ':!.planning'` exit 0: the green commit's tree is exactly the source tree the closing run covered (`E2E_TREE_SHA` of `187-13-closing-e2e.md`).
- **`PUSH_PLANNING_PATHS=0`.** `git ls-tree -r --name-only <PUSH_COMMIT>` exit 0 lists 3320 paths. `grep -c '^\.planning/'` over them counts 0 (exit 1, no match). HEAD's source tree also holds 3320 paths: the 17 files changed, but no path was added or removed.
- **`PUSH_EXCLUSIONS_PRESENT=yes`.** `git show <PUSH_COMMIT>:.github/trufflehog-exclude-paths.txt` holds both new exact-path entries, counted 2 by `grep -cxF`: `^tests/tests/utils/mailedLink\.test\.ts$` and `^apps/supabase/supabase/functions/account-access/signInLink\.test\.ts$`. The file and `.github/workflows/main.yaml` are identical at the green commit and at HEAD (`git diff --quiet <PUSH_COMMIT> HEAD -- <both>` exit 0).
- **`BRANCH_ABSENT=yes`.** `git ls-remote origin refs/heads/ci-evidence/187-final` exit 0 printed nothing (0 bytes), so a first push would carry no lease.
- **`MAIN_YAML_TRIGGERS_ON_CI_EVIDENCE=yes`.** In the green commit's `.github/workflows/main.yaml`, `on.push.branches` holds `main` and `"ci-evidence/**"`. `paths-ignore` (`**.md` and the `.env.example` paths) does not suppress the run: the commit's diff against its parent `340a20070` (origin's `main`) touches many paths that are not `.md` files.

## Reading of the first reading (superseded)

The execution rules allow the push only when the green commit's tree equals HEAD's tree without `.planning/`, and that check fails. The review-fix commits changed `deploy.yml`, `destroy.yml`, `infra-plan.yml`, the `github-oidc` module and the infra scripts after the green commit was written. Pushing `refs/evidence/187/green` now would run `secret-scan` and `infra-validate` on a tree from before those fixes, not on the phase's final tree, so G-03 would not be observed. The plan's rule applies: plan 187-12 Tasks 2 and 3 and plan 187-13 run again first, and then this plan's Task 1 is read again. Until then, Task 2's approval is not requested and no attempt of key `187-15-2` is created.

The closing E2E run's coverage of `apps/`, `packages/` and `tests/` still holds for HEAD, because no file there changed. Whether plan 187-13 really must run again for a change confined to `.github/workflows/` and `infra/` is a question for the operator or the planner. As written, the plan requires it.

## Task 1, re-reading 2026-11-15T21:15Z (after plans 187-12 and 187-13 re-ran), HEAD `f580f2222`

Read by a plan executor that the orchestrator spawned to re-run this task after plans 187-12 and 187-13 were re-run on the tree with the review fixes. The first reading's lines above are renamed `*_SUPERSEDED=` (the convention of `187-12-evidence-commits.md` and `187-13-closing-e2e.md`), so each line a verify reads has one value. The lines below are current. All of it is read-only: the one remote read was `git ls-remote`. Nothing was pushed, and no ref was created or moved.

```
READ_AT=2026-11-15T21:15Z
READ_AT_HEAD=f580f222256dc1cda04293236cdb1500b3460728
PUSH_COMMIT=395b71c712f9af6a80512625f2b38baf93167c1a
PUSH_TREE=3c82ab567d5b375c81e300e6bdb9fdbf72d7e42b
PUSH_PARENT=340a200708c28fb7ed078d452138712f3400c789
HEAD_SOURCE_TREE=3c82ab567d5b375c81e300e6bdb9fdbf72d7e42b
PUSH_TREE_MATCHES_HEAD=yes
PUSH_TREE_COVERED_BY_E2E=yes
PUSH_PATHS=3320
PUSH_PLANNING_PATHS=0
PUSH_EXCLUSIONS_PRESENT=yes
BRANCH_ABSENT=yes
MAIN_YAML_TRIGGERS_ON_CI_EVIDENCE=yes
PUSH_TARGET_REF=refs/heads/ci-evidence/187-final
READY_TO_PUSH=yes
```

How each line was read:

- **`PUSH_COMMIT`.** `git rev-parse --verify refs/evidence/187/green` exit 0 printed `395b71c712f9af6a80512625f2b38baf93167c1a`, which is `GREEN_COMMIT` of `187-12-evidence-commits.md` (re-run). Its tree, `git rev-parse <commit>^{tree}`, is `3c82ab567d5b375c81e300e6bdb9fdbf72d7e42b` (`GREEN_TREE`), and its one parent is `340a200708c28fb7ed078d452138712f3400c789` (`GREEN_PARENT`, origin's `main` at the last fetch). `git for-each-ref --contains <commit>` prints only `refs/evidence/187/green`: no branch and no remote-tracking ref holds it.
- **`PUSH_TREE_MATCHES_HEAD=yes`.** In a temporary index under the session scratch directory, removed afterwards, with HEAD at `f580f2222`: `git read-tree HEAD` exit 0, `git rm -r --cached --quiet .planning` exit 0, and `git write-tree` exit 0 printed `3c82ab567d5b375c81e300e6bdb9fdbf72d7e42b`, which is `PUSH_TREE`. The real index was not touched (`git diff --cached --quiet` exit 0). `git log --oneline 3c7be6128..HEAD -- . ':!.planning'` exit 0 prints nothing: no commit since the closing run's HEAD changed a path outside `.planning/`.
- **`PUSH_TREE_COVERED_BY_E2E=yes`.** `git diff --quiet 3c7be6128515981160de0e3e5a89dafae73c4a29..HEAD -- apps packages tests` exit 0, where `3c7be6128` is `E2E_TREE_SHA` of `187-13-closing-e2e.md` (run `tests/e2e-runs/187-13-rerun-20261115T202406Z`, 548 passed, 0 failed, 0 flaky, 0 did not run). Also `git diff --quiet 3c7be6128 <PUSH_COMMIT> -- . ':!.planning'` exit 0: the commit's tree is exactly the source tree that run covered, not only its `apps/`, `packages/` and `tests/`.
- **`PUSH_PLANNING_PATHS=0`.** `git ls-tree -r --name-only <PUSH_COMMIT>` exit 0 lists 3320 paths. `grep -c '^\.planning/'` over them counts 0 (exit 1, no match).
- **`PUSH_EXCLUSIONS_PRESENT=yes`.** `git show <PUSH_COMMIT>:.github/trufflehog-exclude-paths.txt` exit 0. `grep -cxF` counts both new exact-path entries, 2: `^tests/tests/utils/mailedLink\.test\.ts$` and `^apps/supabase/supabase/functions/account-access/signInLink\.test\.ts$`. The file and `.github/workflows/main.yaml` are identical at the commit and at HEAD (`git diff --quiet <PUSH_COMMIT> HEAD -- <both>` exit 0). The `secret-scan` job passes the file with `--exclude-paths=.github/trufflehog-exclude-paths.txt` and, on a first push of a branch, scans from the merge-base with the default branch.
- **`BRANCH_ABSENT=yes`.** `git ls-remote origin refs/heads/ci-evidence/187-final` exit 0 printed nothing (0 bytes), so a first push carries no lease.
- **`MAIN_YAML_TRIGGERS_ON_CI_EVIDENCE=yes`.** `git show <PUSH_COMMIT>:.github/workflows/main.yaml` exit 0. Its `on.push.branches` holds `main` and `"ci-evidence/**"`. `paths-ignore` (`**.md` and the `.env.example` paths) does not suppress the run: `git diff --name-only <PUSH_PARENT> <PUSH_COMMIT>` exit 0 lists 4261 paths, and 3805 of them are not `.md` files. The file names 13 jobs: `skill-drift-check`, `secret-scan`, `frontend-and-shared-module-validation`, `docker-image-build`, `supabase-tests`, `sql-lint`, `dependency-audit`, `dev-seed-integration`, `supabase-types-drift`, `e2e-tests`, `e2e-visual`, `node-engine-range-negative-control` and `infra-validate`. `grep -ciE 'role-to-assume|aws-actions|id-token: write'` counts 0 (exit 1), so no job of the run assumes an AWS role.

## Reading of the re-reading

Every readiness line holds. The commit to push is the covered, source-only final tree, and nothing is published yet. The push itself waits for Task 2: the operator's reply to attempt `187-15-2`, bound and read back as the execution rules require.
