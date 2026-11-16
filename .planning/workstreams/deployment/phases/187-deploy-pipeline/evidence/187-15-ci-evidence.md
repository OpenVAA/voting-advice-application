# 187-15 evidence: the CI run on the final tree

Repository `OpenVAA/voting-advice-application`. The Task 1 readings were made by the plan executor from this checkout. Their one remote read was `git ls-remote`. During Task 1 nothing was pushed, no ref was created or moved, and no GitHub, AWS or Supabase setting was read or changed. The first reading created no attempt file; after the re-reading, attempt `187-15-2` was created under `tmp/183-evidence/` (see the re-reading). The push itself, after the operator's approval, and the run it started are recorded in the Task 3 section at the end of this file.

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

## Task 3: the push, the run job by job, and the audit (read 2026-11-16T06:36Z to 06:58Z)

**The push.** The orchestrator made it at top level, not the executor. Task 2's reply was stored with `bash "$A" put 187-15-2` under `OPERATOR_REPLY=received attempt=20261115T211655Z.3aff29a93 plan=187-15 task=2`. Before the push, `put`, `bound 187-15-2 OPERATOR_REPLY plan=187-15 task=2` and `has 187-15-2 '^answer_push=approve$'` each exited 0. `refs/evidence/187/green` was re-read as `395b71c712f9af6a80512625f2b38baf93167c1a`, its tree `3c82ab567` equal to HEAD's tree without `.planning/`, and `git ls-remote origin refs/heads/ci-evidence/187-final` printed nothing. Then `git push origin 395b71c71…:refs/heads/ci-evidence/187-final` exited 0 and created a new branch. After the run, the executor read both checks again: `bound` exit 0, `has` exit 0. `git ls-remote origin refs/heads/ci-evidence/187-final` exit 0 printed `395b71c712f9af6a80512625f2b38baf93167c1a`.

**The run.** `gh run list --branch ci-evidence/187-final --workflow main.yaml --json databaseId,headSha` exit 0 listed one run, `43817899191`, head `395b71c712f9af6a80512625f2b38baf93167c1a`, event `push`, created 2026-11-16T06:36:24Z. A background `gh run watch 43817899191` exited 0 at completion, and the run's last update was 06:49:32Z. Each conclusion below was read at job level, from `gh run view 43817899191 --json jobs` (exit 0), not from the run's conclusion.

```
PUSHED=yes
CI_RUN_ID=43817899191
CI_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/43817899191
CI_RUN_HEAD_SHA=395b71c712f9af6a80512625f2b38baf93167c1a
JOB=skill-drift-check conclusion=success
JOB=secret-scan conclusion=failure
JOB=frontend-and-shared-module-validation conclusion=failure
JOB=docker-image-build conclusion=success
JOB=supabase-tests conclusion=success
JOB=sql-lint conclusion=success
JOB=dependency-audit conclusion=failure
JOB=dev-seed-integration conclusion=success
JOB=supabase-types-drift conclusion=success
JOB=e2e-tests conclusion=failure
JOB=e2e-visual conclusion=success
JOB=node-engine-range-negative-control conclusion=success
JOB=infra-validate conclusion=success
SECRET_SCAN=failure
SECRET_SCAN_FINDING=tests/tests/utils/deployedTarget.test.ts:603 detector=URI verified=false
SECRET_SCAN_FINDING=tests/tests/utils/deployedTarget.test.ts:604 detector=URI verified=false
INFRA_VALIDATE=success
DEPENDENCY_AUDIT=failure
DEPENDENCY_AUDIT_SUMMARY=Summary: 16 new advisory(ies) at high+, 0 accepted
DEPENDENCY_AUDIT_ADVISORIES=GHSA-cg2g-xh64-v4q7 GHSA-pqg4-j6r4-53mv GHSA-vc2v-76pw-4v95 GHSA-mrv2-3pqr-j5jr GHSA-587h-7wmj-h5pm GHSA-68fv-2mgg-jv7q GHSA-xjj6-f33q-929c GHSA-4w7w-5xrc-9h26 GHSA-2m5v-pch6-74hx GHSA-qrxm-fqhp-jwvm GHSA-mrhx-c7xc-m3w5
DEPENDENCY_AUDIT_CAUSE=third-party
TODO_FILED=.planning/todos/pending/2026-11-15-dependency-audit-third-party-advisories.md
PLAN_STOPPED=yes
STOP_REASON=secret-scan concluded failure on two unverified URI findings in tests/tests/utils/deployedTarget.test.ts, a file of this workstream (phase 186); the fix is a new plan
```

The job logs were read with `gh api --allow-escape-sequences repos/OpenVAA/voting-advice-application/actions/jobs/<job id>/logs`, each exit 0, and annotations with `gh api …/check-runs/<job id>/annotations`, each exit 0. While the run was in progress, `gh run view --log` refused (exit 1). The logs were kept only in the session scratch directory and are not reproduced here. No finding's matched text is written to this file.

### `secret-scan` (job 133134035364): failure, the plan stops here

- **The range.** `event.before` was unusable for a new branch, so the range step printed `no usable event.before; scanning from merge-base with the default branch: 340a200708c28fb7ed078d452138712f3400c789`. The scan ran over `340a20070..395b71c71` with `--config=.github/trufflehog-openvaa.yml --exclude-paths=.github/trufflehog-exclude-paths.txt`. The plan's assumption held.
- **The result.** trufflehog 3.97.9 reported `"verified_secrets": 0, "unverified_secrets": 3` over 3779 chunks (17 756 529 bytes), and the step exited 183. The two warning annotations, both `Found unverified URI result`, name `tests/tests/utils/deployedTarget.test.ts` at lines 603 and 604. The third counted result produced no annotation and no printed result.
- **The two exclusions held.** Neither `tests/tests/utils/mailedLink.test.ts` nor `apps/supabase/supabase/functions/account-access/signInLink.test.ts` appears in any annotation. That is the run-43405262494 debt this plan was meant to observe, and it is closed.
- **What the findings are.** Lines 603 and 604 are two rows of the `it.each` table under `describe('gateTargetLine')`. Each row is an `https://` base URL that carries made-up user info, one with a user and a password and one with a password alone, for the test that the gate's first line withholds user info. They are deliberate fixtures, not credentials. The file belongs to this workstream: its last commit is `a2fa17061` (`fix(186): withhold user info from the deployed setup's first line`). The research's carried debt named only the two v2.16 files.
- **The disposition.** Under the plan, a failed scan stops the plan, and the fix is a new plan. The likely fix is a third measured exact-path entry in `.github/trufflehog-exclude-paths.txt` citing this run, or fixture URLs the URI detector does not match. Either fix needs a new green evidence commit, a new E2E coverage check, a new approval and a new push. None was made here.

### `infra-validate` (job 133134035565): success

`terraform fmt -check -recursive -diff infra` passed. Each of the eight `terraform validate` blocks printed `Success! The configuration is valid.`. The two `terraform test` groups printed `Success! 33 passed, 0 failed.` and `Success! 11 passed, 0 failed.`, and `bash infra/scripts/check-settings-types.sh` ran. This is the first run of `infra-validate` on this phase's final tree.

### `dependency-audit` (job 133134035449): failure, filed for phase 189

`yarn audit:deps` compared against `security/audit-baseline.json` (recorded 2026-10-03 at `9e3301a35`, 0 accepted) and listed 16 new findings: 16 audit ids over 11 GHSA ids (above), in dompurify, shell-quote, compression, launch-editor, source-map-js, undici (8 ids, 4 advisories), vite and zod. The workstream's one lockfile change is `07690d24d` (187-08), which adds `js-yaml` to the root devDependencies, and `js-yaml` has none of the advisories. The other manifest commits of phases 183 to 187 add root scripts only. Hence `DEPENDENCY_AUDIT_CAUSE=third-party` and the todo. The research had read the same summary line before this phase's work.

### Two further failures, outside the plan's three debts (recorded, not diagnosed further)

These jobs are not among the jobs the plan observes. They are read here because every job's conclusion is recorded at job level. Their causes are as observed in the log. Neither cause was confirmed in isolation.

- **`frontend-and-shared-module-validation` (job 133134035378): failure in `yarn test:unit`.** Build, format check, typecheck and `lint:check` passed. In the infra vitest project, `scripts/push-migrations.test.ts` failed 3 of its tests (`Test Files 1 failed | 10 passed (11)`, `Tests 3 failed | 311 passed (314)`). All three are in `describe('push-migrations.sh --confirmed-ref')`:
  - "pushes without a terminal when the ref is confirmed in a staging Actions job, and runs the drift check": `push-migrations.test.ts:129`, an expected output line was missing.
  - "accepts a confirmed ref on a deploy-evidence branch": `:179`, exit status 1 where 0 was expected.
  - "pushes nothing when the database is up to date and the ref is confirmed": `:185`, the output held `push_connection=unknown` but no `drift_status=0`.

  The pattern points at the drift check's step on the CI runner: no `drift_status=` line, then a non-zero exit. That is an unconfirmed reading. The file is this workstream's (`infra/scripts/`). Every other unit project passed.
- **`e2e-tests` (job 133134035368): failure, `11 failed`, `441 did not run`, `96 passed (6.7m)`; preflight `failures 0, successes 1`.** All 11 failures raise the same error, `awaitLinkWitness: witness <id> read neither sent nor not-sent within 30000 ms` (`tests/tests/utils/supabaseAdminClient.ts:432`). Every mailed-link flow failed: invitation-contract, invitation-landing, contestant-email-registration (2), contestant-code-registration, contestant-password-recovery (3), contestant-entry-scan, the `data-setup-passwordless-session` setup, and contestant-journey's registration step. The 441 did-not-run tests are downstream of these. In CI the `account-access` link witness never resolved. The closing local run on the same source tree (`187-13-closing-e2e.md`) had 548 passed and 0 failed. The previous evidence run, 43405262494, also failed `e2e-tests`, but with 5 different failures and no `awaitLinkWitness` error. The CI-only cause, probably the CI edge runtime's environment or its mail path, is unconfirmed.

## Reading of Task 3

Two of the plan's three carried debts are now observed on the final tree. `infra-validate` is green. `dependency-audit` was read and filed for phase 189. The two exact-path exclusions cleared the v2.16 findings. But `secret-scan` is still red, on two new unverified URI fixtures that phase 186 added, so G-03 is not closed. Task 3's automated verify fails on `SECRET_SCAN=success`. The plan stops as its action prescribes, and the fix is a new plan. The same run also shows two failures that occur only in CI: three `push-migrations.sh --confirmed-ref` unit tests, and every mailed-link E2E spec. Each needs its own diagnosis before the next evidence push.
