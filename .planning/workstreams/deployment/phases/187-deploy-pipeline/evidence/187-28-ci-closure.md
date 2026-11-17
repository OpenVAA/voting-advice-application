# 187-28 evidence: the rebased branch carried to a green CI run

Repository `OpenVAA/voting-advice-application`, branch `feat/deployment-terraform-supabase`. Read and written by the plan executor from this checkout, 2026-11-17. Remote reads were `git ls-remote` and `gh api` GETs only. Nothing was pushed by the executor, and no GitHub, AWS or Supabase setting was read or changed. Logs and status files are under `tmp/187-28/` (ignored); the first attempt's are under `tmp/187-28/attempt-1/`.

**Pre-rebase commit ids.** Every -infra commit id cited in this workstream's evidence before 2026-11-16 names a commit of `backup/deployment-pre-rebase-20261116`, and every -infra id cited by plan 187-27 (and `INFRA_PRE_REBASE_HEAD` of `187-28-ci-measurement.md`) names a commit of `backup/infra-pre-rebase-2026-11-17`; none of them is a commit of HEAD. Those lines are left as written. A new line that needs a pre-rebase base uses the commit of `cecf649d8..HEAD` with the same subject and records both ids. The -infra ids of § First attempt (stopped) below (`e42e32cf3`, `642b31ce4`, `89c83eabb`, and the first attempt's own commit `0d4ca8887`) name the intermediate history rebased onto `dfe9cae8b`, which no branch holds; its lines are renamed `*_SUPERSEDED=` and otherwise left as written.

## Deviation: the fix tip moved from `dfe9cae8b` to `cecf649d8`

```
DEVIATION_FIX_TIP=cecf649d8e0c6702be0e0ab2082b1e99df6e6dcf (was dfe9cae8b21fcbf3e224769500c9e50f48b9eb2a)
```

- **Why.** The first attempt of Task 1 (below) stopped on `lint:check`: the comment-hygiene guard failed `tests/playwright.config.ts:1622`, a forced line break that the -gsd commit `2934f0c67` exposed (owner -gsd). The orchestrator fixed it in -gsd with `cecf649d8` (`style(e2e): join the trace comment's broken line`, `tests/playwright.config.ts`, 1 insertion, 2 deletions, comment only) on `fix/v2.16-ci-e2e`, on top of `dfe9cae8b`, and reported `yarn lint:check` and `yarn format:check` exit 0 there. It then rebased this branch again with `git rebase --onto fix/v2.16-ci-e2e dfe9cae8b`. The new HEAD is `494bfa63b`, whose tip is the rebased counterpart of the first attempt's commit `0d4ca8887`. `backup/infra-pre-rebase-2026-11-17` is unchanged (`15e82a60b`). Task 1 was made again from the start against that state.
- **What changed in the plan.** Only the verify commands that name the fix tip, in `187-28-PLAN.md`, committed as `6d1ad7ed5`: Task 1's verify now checks `REBASE_ONTO=cecf649d8e0c6702be0e0ab2082b1e99df6e6dcf`, proves the source delta against `git diff 9cd30f7a5 cecf649d8`, and checks each counterpart descends from `cecf649d8`. Task 2's verify now expects `GREEN_DIFF_VS_MEASURE_3` to be `.github/workflows/main.yaml` and `tests/playwright.config.ts`, because the measurement commit `5202d34df` carried `dfe9cae8b`'s config, without the comment join. The plan's prose, which names `dfe9cae8b` as the fix tip, is not changed; read it as `cecf649d8`.
- **What it does to the suite.** `cecf649d8` changes one doc comment and no code, so it reaches no test. `E2E_SUMMED_DELTAS` stays 0.

## The rebase (2026-11-17)

```
REBASE_HEAD_AT_START=6d1ad7ed5a3b6f2c8feac8b338ee25c6dd5f620e
REBASE_BACKUP_TIP=15e82a60bb49bed2983b03728923c443aaf7a324
REBASE_ONTO=cecf649d8e0c6702be0e0ab2082b1e99df6e6dcf
REBASE_OLD_ONTO=c2b3bff15c78168ae73fa244f1e443f05a34269e
REBASE_DELTA_PATHS=tests/README.md,tests/playwright.config.ts,tests/scripts/e2e-run.sh,tests/scripts/visual-container.sh,tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-desktop.png,tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-mobile.png
REBASE_SOURCE_DELTA_EQUALS_GSD_FIX=yes
REBASE_DELTA_TOUCHES_MANIFEST_LOCKFILE_MIGRATION_WORKFLOW=no
REBASE_COUNTERPART_ee85b83a3=4474af6b80c45f449520cf8faebf68cc57cb6103
REBASE_COUNTERPART_a7a4222a8=e0b16c129f67e1aa80e20b924889f7d16c923750
PRE_REBASE_SHAS_RESOLVE_IN_BACKUP_ONLY=yes
HELPERS_COPIED=yes
LOCAL_MIGRATIONS_APPLIED=22
```

- `REBASE_HEAD_AT_START` is `git rev-parse HEAD` before this attempt's evidence commit: `6d1ad7ed5`, the plan's verify amendment (the deviation above), one past `494bfa63b`, the rebased first-attempt commit. `REBASE_BACKUP_TIP` is `git rev-parse backup/infra-pre-rebase-2026-11-17`. `REBASE_ONTO` is `fix/v2.16-ci-e2e` (`cecf649d8`, see the deviation above). `REBASE_OLD_ONTO` is the backup's base, the base of the rebase of 2026-11-16; the intermediate base `dfe9cae8b` is an ancestor of `cecf649d8`.
- **`REBASE_SOURCE_DELTA_EQUALS_GSD_FIX=yes`.** `git diff --name-only backup/infra-pre-rebase-2026-11-17 HEAD -- . ':!.planning'` lists the six paths of `REBASE_DELTA_PATHS`, and `git diff --name-only 9cd30f7a5 cecf649d8` lists the same six in the same order. `git patch-id --stable` of the two diffs gives the same id, `d0d9a1159a0707e0661c4ac5627d883a98f36d85`; the first attempt's id against `dfe9cae8b` was `1134bbc40`.
- **`REBASE_DELTA_TOUCHES_MANIFEST_LOCKFILE_MIGRATION_WORKFLOW=no`.** No delta path is a `package.json`, `yarn.lock`, a file under `apps/supabase/supabase/migrations/` or a file under `.github/`. So 187-27 Task 1's install, database, pgTAP and types gates are not repeated.
- **The counterparts.** Of the 484 commits of `cecf649d8..HEAD`, one each has the subject `docs(187): pattern map` (`4474af6b8`) and `docs(186): discussion points and context (recommendations, operator away)` (`e0b16c129`). Their ids cited by 187-27 are `d35c1bb6a` and `36a676018`; in the first attempt they were `642b31ce4` and `89c83eabb`.
- **`PRE_REBASE_SHAS_RESOLVE_IN_BACKUP_ONLY=yes`.** For each of `527d9e866`, `ced5b42bb`, `e56db5391`, `b29c91405`, `1f5c56781`, `fabe70c1b`, `e6f1e114e`, `d35c1bb6a` and `36a676018`, `git merge-base --is-ancestor <id> backup/infra-pre-rebase-2026-11-17` exited 0 and `git merge-base --is-ancestor <id> HEAD` exited 1. The first attempt's ids `e42e32cf3`, `642b31ce4`, `89c83eabb` and `0d4ca8887` are ancestors of neither.
- Every earlier -infra evidence id names one of the two backups' histories, or the first attempt's intermediate one, and is left as written.
- **`HELPERS_COPIED=yes`.** The six copies made in the first attempt (`build-archive.sh`, `run-tf.sh`, `scan.sh`, `t1/run-gates.sh`, `t5/run.sh`, `commits/make-commits.sh`, copied from `tmp/187-27/` with `cp -p` and rewritten with `sed`: `tmp/187-27` to `tmp/187-28`, the earlier session's scratch directory to this session's) were checked again: each is executable, passes `bash -n` and names neither old directory. The first attempt's outputs, including its turbo cache, were moved to `tmp/187-28/attempt-1/`, so this attempt's turbo cache started empty.
- **`LOCAL_MIGRATIONS_APPLIED=22`.** `docker exec supabase_db_openvaa-local psql -U postgres -tAc 'select count(*) from supabase_migrations.schema_migrations'` exit 0 printed `22`, the number of `.sql` files under `apps/supabase/supabase/migrations/` at HEAD (`git ls-tree`). No reset was needed.

## Task 1: the gates on the rebased tree

```
GATES_HEAD=494bfa63b46f781712a7b2d1d031159214b48f31
lint:check exit=0
format:check exit=0
typecheck exit=0
test:unit exit=0
lint:workflows exit=0
E2E_SELF_TEST_EXIT=0
INFRA_TESTS_PASSED=bootstrap-tfvars.test.ts,build-push-image.test.ts,check-destroy-plan.test.ts,deploy-workflow.test.ts,destroy-workflow.test.ts,infra-plan-workflow.test.ts,main-e2e-workflow.test.ts,probe-hosted.test.ts,push-migrations.test.ts,request-loop.test.ts,running-image-digest.test.ts,workflows.test.ts
GUARD_DEPLOYED_SMOKE=passed
TF_FMT_EXIT=0
TF_ROOTS_VALIDATED=8
TF_MODULES_TESTED=frontend-service,github-oidc
TF_EXAMPLE_PLANS=example/aws,example/dns-mail,example/supabase
SC4_LOCAL_GATE_DIFF=empty
PHASE_APP_DIFF=apps/frontend/src/hooks.server.ts,packages/dev-seed/tests/checkDriftLinkedGuard.test.ts,tests/README.md,tests/tests/fixtures/contestant/contestantHomePage.fixture.ts,tests/tests/fixtures/contestant/contestantTermsOfUsePage.fixture.ts,tests/tests/helpers/navigation.ts,tests/tests/specs/a11y/contestant-a11y.spec.ts,tests/tests/specs/voter/analytics-gpc.spec.ts,tests/tests/specs/voter/voter-journey.spec.ts,tests/tests/specs/voter/voter-prefs-tracking.spec.ts,tests/tests/specs/voter/voter-tracking-consent-free.spec.ts,tests/tests/utils/deployedTarget.test.ts
PHASE_APP_DIFF_UNCHANGED_SINCE_187_27=yes
```

How each line was read (every exit from its own `.status` file under `tmp/187-28/t5/`, never through a pipe):

- **The repository gates** (`tmp/187-28/t1/run-gates.sh tmp/187-28/t5/gates`, called by `tmp/187-28/t5/run.sh` in the background, one after another, `TURBO_CACHE_DIR=tmp/187-28/turbo-cache`, empty at the start). HEAD was `494bfa63b` before and after. `lint:check` 23:31:19Z to 23:32:08Z exit 0: the comment-hygiene guard `0 violation(s)`, and every guard after it in the chain ran, through `No-preregister guard ... 0 finding(s).` `format:check` to 23:32:26Z exit 0 (`All matched files use Prettier code style!`). `typecheck` exit 0. `test:unit` 23:32:27Z to 23:33:15Z exit 0 (`Tasks: 26 successful, 26 total`); the stack was Up for its dev-seed integration tests. `lint:workflows` exit 0 (`actionlint found nothing in 3 workflows`). Each gate ran once in this attempt.
- **`E2E_SELF_TEST_EXIT=0`.** `tests/scripts/e2e-run.sh --self-test`, after `run.sh` in the same background command, because the wrapper is in the delta: `e2e-run.sh: self-test passed: 13 case(s).` The command ended 23:34:49Z.
- **`INFRA_TESTS_PASSED`.** `vitest run --config infra/vitest.config.ts --reporter=verbose` exit 0, `Test Files 12 passed (12)`, `Tests 323 passed (323)`, the same count as 187-27's 323.
- **`GUARD_DEPLOYED_SMOKE=passed`.** `vitest run --config tests/vitest.config.ts --reporter=verbose` exit 0, `Test Files 15 passed (15)`, `Tests 358 passed (358)`, the same count as 187-27's 358, with 16 `✓ tests/utils/deployedSmokeGuards.test.ts` lines and no failed test.
- **Terraform** (`tmp/187-28/run-tf.sh t5`, after the gates and the vitest configs, alone; never alongside `test:unit`). `terraform fmt -check -recursive -diff infra` exit 0. The eight roots (`infra/bootstrap` and the seven under `infra/envs/*/*/`) each `init -backend=false -lockfile=readonly` and `validate` exit 0. `terraform test` of `frontend-service` `Success! 33 passed, 0 failed.` and of `github-oidc` `Success! 11 passed, 0 failed.`. The three example roots each `Success! 1 passed, 0 failed.`. `git status --porcelain` afterwards listed only the untracked ledger and the plan's verify amendment, then uncommitted; it was committed as `6d1ad7ed5` before this evidence. The amendment changes no file outside `.planning/`, so the tree the gates read is `494bfa63b`'s and `6d1ad7ed5`'s alike.
- **`SC4_LOCAL_GATE_DIFF=empty`.** `git diff --quiet e0b16c129 HEAD -- tests/playwright.config.ts tests/global-setup.ts tests/tests/support/preflight.ts` exit 0, with `e0b16c129` the rebased counterpart of `a7a4222a8` (187-27's `36a676018`). The -gsd changes to the config, `cecf649d8` included, lie in the base, before the counterpart.
- **`PHASE_APP_DIFF`.** `git diff --name-only 4474af6b8..HEAD -- apps packages tests`, with `4474af6b8` the rebased counterpart of `ee85b83a3` (187-27's `d35c1bb6a`). It equals the `PHASE_APP_DIFF=` line of `187-27-ci-closure.md` path for path.

## Task 2: the evidence commits and the green commit's scan

```
GREEN_DIFF_VS_FINAL_3=tests/README.md,tests/playwright.config.ts,tests/scripts/e2e-run.sh,tests/scripts/visual-container.sh,tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-desktop.png,tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-mobile.png
GREEN_DIFF_VS_MEASURE_3=.github/workflows/main.yaml,tests/playwright.config.ts
PUSH_SCAN_HEAD=68a54299aa81b2a2f95fd2151031ab4e624ef01c
PUSH_SCAN_BASE=340a200708c28fb7ed078d452138712f3400c789
PUSH_SCAN_EXIT=0
PUSH_SCAN_RESULTS=0
```

- The green and red commits, their archive builds (green exit 0; red exit 1 at the frontend build naming the missing module, on its second attempt, the first being void) and the builder-cache prune are recorded in `187-12-evidence-commits.md` § Re-run 2026-11-16 (plan 187-28).
- **`GREEN_DIFF_VS_FINAL_3`** (`git diff --name-only 2b0842fd4 <GREEN_COMMIT>`) equals Task 1's `REBASE_DELTA_PATHS` path for path. **`GREEN_DIFF_VS_MEASURE_3`** (against `5202d34df`, `ci-evidence/187-ci-measure-3`, which is in this checkout's store) is `main.yaml`, the measurement's own job matrix, and `tests/playwright.config.ts`, the comment join of `cecf649d8` (§ Deviation). Outside those two files the green tree is the tree the measurement ran green five times.
- **The scan.** `tmp/187-28/scan.sh green 340a20070 refs/evidence/187/green`, in the background, 23:41:53Z to 23:42:08Z, exit 0: 187-27's command (`ghcr.io/trufflesecurity/trufflehog:3.97.9`, digest `sha256:52e67fef4d054ecff5c2ce4b4ae376626d1ef54aa0898b53cac19c25e92e14db`, main.yaml's `extra_args`), in a fresh `git init` repository fetched from this checkout, whose HEAD and base its `range.txt` names as the two lines above. The `--github-actions` run exit 0, `"verified_secrets": 0, "unverified_secrets": 0` over 4186 chunks, no annotation. The `--json` run exit 0; the `jq` selection of file, line, detector, verified and commit found no result, so there is no finding line. Its mode-700 directory was deleted, the scan repository removed, and the empty `tmp/187-28/scan/` removed after it.

### The void red build (first attempt, 2026-11-16T23:38:05Z to 23:38:15Z)

```
RED_LOCAL_BUILD_EXIT_VOID=102
RED_FAILED_AT_FRONTEND_BUILD_VOID=no
RED_NAMES_MISSING_MODULE_VOID=no
RED_BUILD_VOID_CAUSE=the Docker VM's memory: #13 ERROR: process "/bin/sh -c yarn install --immutable" did not complete successfully: cannot allocate memory (apps/frontend/Dockerfile:21, ResourceExhausted)
```

- **Void, by the orchestrator's ruling.** The first red archive build (`tmp/187-28/build-archive.sh red 3250ba0e8`, directly after the green one) exited 102 after 10 s, at `yarn install`, before the step under test, for want of memory in the Docker VM (8.2 GB, shared at the time with this checkout's Supabase stack and a second, unrelated Supabase stack, `*_next-supabase-skimle2`, both Up). It is an environment fault, like the wrapper's void-host-suspend rule: neither a red nor a green result, and it is not counted. The executor first recorded it as a stop of the plan (commit `78ebbc563`); the orchestrator ruled it void, and these lines replace that record.
- **The new attempt** was made by the orchestrator at top level: `yarn db:stop` of this checkout's own stack (the operator authorises this checkout's stack to be stopped freely; the unrelated stack was left alone), then `bash tmp/187-28/build-archive.sh red 3250ba0e8e964f8c87c03459f812bd935637272b` once, 23:40:13Z to 23:40:39Z, then `yarn db:start` exit 0. Its result is the current red-build record in `187-12-evidence-commits.md`. Afterwards the database and the edge runtime are Up, the edge runtime started 23:40:54Z.
- **The void attempt's log is gone.** `build-archive.sh` writes `tmp/187-28/commits/red-build.log` and its status files under the same names on every attempt, so the new attempt overwrote them. The void attempt's first error line, exit status and times survive only in this record (copied from its log before it was overwritten).

## Task 3: the closing E2E window

```
DEV_ENV_STAT_BEFORE=342396339 10343 1791823238
E2E_LAST_FULL_PASSED=729
E2E_LAST_FULL_TREE_DIFF=tests/README.md,tests/playwright.config.ts,tests/scripts/e2e-run.sh,tests/scripts/visual-container.sh,tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-desktop.png,tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-mobile.png
E2E_SUMMED_DELTAS=0
E2E_FUNCTIONS_ENV=template
TEMPLATE_LINK_SAME_INODE=yes
DEV_FUNCTIONS_ENV_ASIDE_DURING_RUN=yes
DEV_ENV_STAT_AFTER=342396339 10343 1791823238
FUNCTIONS_ENV_RESTORED=yes
EDGE_RUNTIME_RESTARTED_AFTER_RESTORE=yes
GSD_SESSION_MUST_RESET=yes
```

- **Before.** None of `tmp/187-28/env-aside/functions-dotenv.aside`, `tmp/187-27/env-aside/functions-dotenv.aside` and `tmp/187-26/env-aside/functions-dotenv.aside` existed; the developer's file existed (`test -e`) and was not `-ef` the template; `refs/evidence/187/green`'s tree equals HEAD's without `.planning/`; 175 GiB free and Docker build cache 0 B (pruned in Task 2); no listener on 5273 (the wrapper's default `FRONTEND_PORT`), 8777 or 9443 (`lsof` exit 1 each); the database and the edge runtime Up. `stat -f '%i %z %m'` of the file gave `DEV_ENV_STAT_BEFORE`. The template's inode is 395205672.
- **`E2E_LAST_FULL_PASSED=729`** is the current `E2E_PASSED=` of `187-13-closing-e2e.md` when the window started: plan 187-27's closing run, the last full run. **`E2E_LAST_FULL_TREE_DIFF`** is `git diff --name-only e6f1e114e HEAD -- . ':!.planning'`, with `e6f1e114e` that run's tree (a pre-rebase id, a commit of `backup/infra-pre-rebase-2026-11-17`); it equals Task 1's `REBASE_DELTA_PATHS`. **`E2E_SUMMED_DELTAS=0`**: of those paths only the opt-in visual baselines and the config's worker and trace keys reach the suite, and both keys are read from `GITHUB_ACTIONS`, unset locally; `cecf649d8` joins a doc comment and reaches nothing.
- **The window.** One background zsh command, written out on its command line, every step's status in its own file under `tmp/187-28/window/`. Before anything moved it set its restore as the trap on EXIT and, through a once-only guard (a `RESTORED` flag the restore sets first), on INT, TERM and HUP.
  - **a. Aside** (23:44:26Z). `mkdir -p -m 700 tmp/187-28/env-aside`, then `mv` of the file to `tmp/187-28/env-aside/functions-dotenv.aside`, exit 0. No hook or permission refusal occurred.
  - **b. The template.** `ln` of the template to the file's path exit 0, `test -ef` against the template exit 0, and `stat` showed the path at the template's inode 395205672 (`TEMPLATE_LINK_SAME_INODE=yes`). `yarn db:stop` and `yarn db:start` exit 0. The applied migration count read `22`, HEAD's `.sql` count, so no reset was needed. Then the full run (`187-13-closing-e2e.md` § Re-run 2026-11-16 (plan 187-28)), whose wrapper also restarted the stack at its end, still on the template; then `docker logs` of the edge runtime to `edge-template.log` (8 lines, no error line).
  - **c. The restore** (00:03:56Z). The path was `-ef` the template, so it was removed with `rm` (exit 0), then the aside file was moved back with `mv` (exit 0). `yarn db:stop` and `yarn db:start` exit 0, and `rmdir tmp/187-28/env-aside` exit 0. `stat` of the file afterwards equals the line before (`FUNCTIONS_ENV_RESTORED=yes`), and the template's link count is 1 again. The edge runtime's `StartedAt` is 2026-11-17T00:04:14Z, after the restore at 00:03:56Z (`EDGE_RUNTIME_RESTARTED_AFTER_RESTORE=yes`); it and the database are Up.
- **Judging the run.** Wrapper exit 0, no void marker, `e2e-evidence.mjs` exit 0 (729 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run) and `e2e-spec-verdict.mjs --no-flaky` exit 0, and 729 equals `E2E_LAST_FULL_PASSED` plus the summed deltas, so `E2E_GATE=green`.
- **The file's content was not read.** The only operations on the developer's file or its path were `test -e`, `test -ef`, `stat -f '%i %z %m'`, `mv` (twice), `ln`, and `rm` of the link while it was the template.
- **The shared stack.** It was restarted by the window and by the wrapper's own restore, and runs with the developer's environment. The -gsd worktree shares it, so `GSD_SESSION_MUST_RESET=yes`.

### What would be pushed

```
PUSH_COMMIT=68a54299aa81b2a2f95fd2151031ab4e624ef01c
PUSH_TREE=a9d648e87d3e075e1dafc650f2c5030afdda29fb
PUSH_PARENT=340a200708c28fb7ed078d452138712f3400c789
PUSH_PATHS=3533
PUSH_TREE_MATCHES_HEAD=yes
PUSH_TREE_COVERED_BY_E2E=yes
PUSH_PLANNING_PATHS=0
PUSH_EXCLUSIONS=unchanged
PUSH_TARGET_REF=refs/heads/ci-evidence/187-final-4
BRANCH_ABSENT=yes
MAIN_YAML_TRIGGERS_ON_CI_EVIDENCE=yes
MAIN_YAML_UNCHANGED_SINCE_FINAL_3=yes
MAIN_YAML_JOB_COUNT=13
MAIN_YAML_ASSUMES_NO_AWS_ROLE=yes
READY_TO_PUSH=yes
```

Read-only; its one remote read is `git ls-remote`.

- **`PUSH_COMMIT`.** `refs/evidence/187/green`, `GREEN_COMMIT` of `187-12-evidence-commits.md` (re-run 2026-11-16, plan 187-28), tree `a9d648e87`, parent `340a20070`. `git for-each-ref --contains` prints only `refs/evidence/187/green`.
- **`PUSH_TREE_MATCHES_HEAD=yes`.** `git diff --quiet HEAD refs/evidence/187/green -- . ':!.planning'` exit 0, and the green tree was written from HEAD's tree without `.planning/` in a temporary index; the real index untouched.
- **`PUSH_TREE_COVERED_BY_E2E=yes`.** `git diff --quiet 450632a5c 68a54299a -- . ':!.planning'` exit 0, where `450632a5c` is `E2E_TREE_SHA`.
- **`PUSH_PLANNING_PATHS=0`.** `git ls-tree -r --name-only` of the commit lists 3533 paths and none under `.planning/`.
- **`PUSH_EXCLUSIONS=unchanged`.** `.github/trufflehog-exclude-paths.txt` is identical at `2b0842fd4` and at this commit (`git diff --quiet` exit 0).
- **`BRANCH_ABSENT=yes`.** `git ls-remote origin refs/heads/ci-evidence/187-final-4` exit 0 printed nothing, during the window and again after it.
- **`MAIN_YAML_TRIGGERS_ON_CI_EVIDENCE=yes`.** The commit's `main.yaml`, parsed with the root `yaml` package, has `on.push.branches` `main` and `ci-evidence/**`; `paths-ignore` (`**.md` and the `.env.example` paths) does not suppress the run, since 4026 of the 4488 paths the commit changes against its parent are not `.md` files. It names 13 jobs (`MAIN_YAML_JOB_COUNT`).
- **`MAIN_YAML_UNCHANGED_SINCE_FINAL_3=yes`.** `git diff --quiet 2b0842fd4 68a54299a -- .github/workflows/main.yaml` exit 0.
- **`MAIN_YAML_ASSUMES_NO_AWS_ROLE=yes`.** Over the commit's `main.yaml`, comment lines excluded, `grep -ciE 'role-to-assume|aws-actions|id-token: write'` counts 0.
- **`READY_TO_PUSH=yes`** holds for every line above. Nothing was pushed.

## Task 4: the push (made by the orchestrator at top level, 2026-11-17)

```
PUSH_ATTEMPT=20261117T064156Z.a9f5a5bde
PUSH_APPROVAL=answer_push=approve (a fresh reply of the operator, 2026-11-17, stored with put)
PUSH_VERIFY_EXIT=0
PUSH_BRANCH_ABSENT_AT_PUSH=yes
PUSH_COMMAND=git push origin 68a54299aa81b2a2f95fd2151031ab4e624ef01c:refs/heads/ci-evidence/187-final-4
PUSH_EXIT=not captured (zsh has no PIPESTATUS); the push is read back below
PUSHED=yes
```

- **The approval.** The operator approved the push in the session, after the readiness report. The operator ran `bash "$A" new 187-28-4` in their terminal, which made attempt `20261117T064156Z.a9f5a5bde`; `bash "$A" id 187-28-4` matched. The orchestrator stored the reply with `put` (exit 0) as four lines: `OPERATOR_REPLY=received attempt=20261117T064156Z.a9f5a5bde plan=187-28 task=4`, `answer_attempt=20261117T064156Z.a9f5a5bde`, `answer_push=approve`, and `note: approved by the operator on 2026-11-17 in the session after the readiness report`. It is a fresh reply, not the standing approval of 2026-11-16.
- **The four checks**, made by the orchestrator immediately before the push: `bound 187-28-4 OPERATOR_REPLY plan=187-28 task=4` exit 0; `has 187-28-4 '^answer_push=approve$'` exit 0; Task 4's verify, extracted from the plan (non-empty), exit 0; `git ls-remote origin refs/heads/ci-evidence/187-final-4` exit 0, printing nothing.
- **The push**, at 2026-11-17T06:44:28Z, created a new branch with no lease, as the first push of a branch. Its exit status was not captured, because the orchestrator's zsh has no `PIPESTATUS`; `PUSHED=yes` rests on the read-back.
- **Read back by the executor (Task 5).** `bash "$A" id 187-28-4` printed `20261117T064156Z.a9f5a5bde`; `bound 187-28-4 OPERATOR_REPLY plan=187-28 task=4` exit 0 and `has 187-28-4 '^answer_push=approve$'` exit 0. `git ls-remote origin refs/heads/ci-evidence/187-final-4` exit 0 printed `68a54299aa81b2a2f95fd2151031ab4e624ef01c	refs/heads/ci-evidence/187-final-4`.

## Task 5: the run job by job (read 2026-11-17T06:46Z to 07:24Z, and attempt 2 of e2e-visual at 07:34Z)

**The run.** `gh run list --branch ci-evidence/187-final-4 --workflow main.yaml --json databaseId,headSha,…` exited 0 and listed one run, `44033456141`, at head `68a54299aa81b2a2f95fd2151031ab4e624ef01c`, event `push`, created 2026-11-17T06:44:30Z. A background poll of `gh run view --json status` every 30 s ran until the status was `completed` (the last job ended 07:23:11Z). Each conclusion below was read at job level from `gh run view 44033456141 --json status,conclusion,jobs,headSha,url` (exit 0), never from the run's conclusion.

```
CI_RUN_ID=44033456141
CI_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44033456141
CI_RUN_HEAD_SHA=68a54299aa81b2a2f95fd2151031ab4e624ef01c
CI_RUN_JOBS=13
JOB=docker-image-build conclusion=success
JOB=infra-validate conclusion=success
JOB=supabase-tests conclusion=success
JOB=sql-lint conclusion=success
JOB=node-engine-range-negative-control conclusion=success
JOB=secret-scan conclusion=success
JOB=e2e-visual conclusion=success
JOB=supabase-types-drift conclusion=success
JOB=e2e-tests conclusion=success
JOB=dev-seed-integration conclusion=success
JOB=skill-drift-check conclusion=success
JOB=frontend-and-shared-module-validation conclusion=success
JOB=dependency-audit conclusion=failure
SECRET_SCAN=success
FRONTEND_AND_SHARED_MODULE_VALIDATION=success
E2E_TESTS=success
E2E_VISUAL=success
INFRA_VALIDATE=success
DEPENDENCY_AUDIT=failure
CI_E2E_WORKERS=4
E2E_TESTS_RESULT=729 passed (33.6m); playwright exit 0; preflight failures 0, successes 1; no failed, flaky or did-not-run line
E2E_VISUAL_RESULT=8 passed (40.5s), using 4 workers; playwright exit 0; preflight failures 0, successes 1 (run attempt 2, job 133887903492)
E2E_VISUAL_RESULT_VOID=did not run: the job's "Start Supabase" step (supabase start) exited 1 before the visual step; no run directory, no artifact uploaded
E2E_VISUAL_FAILED_VOID=supabase start: failed to start docker container "supabase_inbucket_openvaa-local": ... failed to bind host port 0.0.0.0:54326/tcp: address already in use
E2E_VISUAL_CAUSE_VOID=unconfirmed: on the runner, host port 54326 (the local mail server's pop3_port in apps/supabase/supabase/config.toml) was already bound when supabase start reached the mail container; nothing of this repository's had started on that runner before the step, and the visual specs never ran
E2E_VISUAL_OWNER_VOID=the CI runner environment, at the e2e-visual job's supabase start step (.github/workflows/main.yaml, unchanged since ci-evidence/187-final-3, where the same step started; the step and the port configuration come from the -gsd base, 5002d5aef and 11f877913); no test, baseline or fixture is implicated
DEPENDENCY_AUDIT_SUMMARY=Summary: 17 new advisory(ies) at high+, 0 accepted
DEPENDENCY_AUDIT_ADVISORIES=GHSA-cg2g-xh64-v4q7 GHSA-pqg4-j6r4-53mv GHSA-3r8g-jcqq-3p5j GHSA-vc2v-76pw-4v95 GHSA-mrv2-3pqr-j5jr GHSA-587h-7wmj-h5pm GHSA-68fv-2mgg-jv7q GHSA-xjj6-f33q-929c GHSA-4w7w-5xrc-9h26 GHSA-2m5v-pch6-74hx GHSA-qrxm-fqhp-jwvm GHSA-mrhx-c7xc-m3w5
DEPENDENCY_AUDIT_NEW_SINCE_TODO=none
WORKSTREAM_ADDED_PACKAGES=js-yaml
DEPENDENCY_AUDIT_ACCEPTED=per-phase-189-todo
ALL_JOBS_GREEN_EXCEPT_DEPENDENCY_AUDIT_SUPERSEDED=no
G03_CLOSED_SUPERSEDED=no
PLAN_STOPPED_SUPERSEDED=yes
STOP_REASON_SUPERSEDED=e2e-visual failed at its supabase start step, on a runner host port (54326) already in use, before any visual test ran (cause unconfirmed, the runner environment); every other job but dependency-audit succeeded, e2e-tests with 729 of 729 passed on 4 workers; no job was re-run, and plans 187-15, 187-26 and 187-27 are not closed
E2E_VISUAL_ATTEMPT_1_VOID=job 133870600988, conclusion failure, 06:44:33Z to 06:48:15Z
E2E_VISUAL_VOID_RULING=the operator, in session on 2026-11-17: "void + rerun"
E2E_VISUAL_RERUN=gh run rerun 44033456141 --job 133870600988, by the orchestrator at 2026-11-17T07:26:40Z: run attempt 2, e2e-visual job 133887903492, conclusion success, 07:26:44Z to 07:33:01Z
ALL_JOBS_GREEN_EXCEPT_DEPENDENCY_AUDIT=yes
G03_CLOSED=yes
SUMMARY_15_BASE_BLOB=ee44d349344ce0d981e9cfc015373dff183b744d
SUMMARY_26_BASE_BLOB=cf8a565ddbd3aaf02039f8dfa0bab971926c2c04
SUMMARY_27_BASE_BLOB=7a55ea63ea3d9c10a4a998992448e9ba7c4b3c11
PLAN_187_15_POINTER_APPENDED=yes
PLAN_187_26_POINTER_APPENDED=yes
PLAN_187_27_POINTER_APPENDED=yes
ROADMAP_187_15_TICKED=yes
ROADMAP_187_26_TICKED=yes
ROADMAP_187_27_TICKED=yes
REQUIREMENTS_ADVANCED=SUPA-08,PIPE-02,PIPE-06
```

The job logs were read with `gh api --allow-escape-sequences repos/OpenVAA/voting-advice-application/actions/jobs/<job id>/logs` (each exit 0) and the failing job's annotations with `gh api .../check-runs/<job id>/annotations`; they are kept in `tmp/187-28/ci/` (ignored) and not reproduced here.

- **`secret-scan` (job 133870600918): success.** trufflehog reported `"verified_secrets": 0`, `"unverified_secrets": 0` over 4186 chunks, the local scan's exact count.
- **`frontend-and-shared-module-validation` (job 133870601011), `infra-validate` (job 133870600774): success.**
- **`e2e-tests` (job 133870600992): success.** Playwright printed `Running 729 tests using 4 workers`, so the 4-worker fix of `dfe9cae8b` was live in the pushed run, and the wrapper printed `729 passed (33.6m)`, `playwright exit 0` and `preflight failures 0, successes 1`, with no failed, flaky or did-not-run line. That is the count of the closing local run on the same source tree, and the first green `e2e-tests` of this workstream's final tree.
- **`dependency-audit` (job 133870601137): failure, accepted per the phase-189 todo.** The audit's table has 17 rows: the todo's 16 rows and the row it gained on 2026-11-16 (`@sveltejs/kit` 1247438 `GHSA-3r8g-jcqq-3p5j`), each unchanged, and no other row, so nothing was appended to the todo. `git diff cecf649d8..HEAD` of the manifests adds one dependency, `js-yaml` (root devDependency, plan 187-08), which names no advisory.
- **`e2e-visual`, attempt 1 (job 133870600988): failure, ruled void.** The job built the packages and then ran `supabase start` (`.github/workflows/main.yaml`, the step `Start Supabase`). It applied the 22 migrations and seeded, then `Starting containers...` failed: `failed to start docker container "supabase_inbucket_openvaa-local": Error response from daemon: failed to set up container networking: driver failed programming external connectivity on endpoint supabase_inbucket_openvaa-local (...): failed to bind host port 0.0.0.0:54326/tcp: address already in use`, and the step ended `Process completed with exit code 1`. Port 54326 is the local mail server's `pop3_port` in `apps/supabase/supabase/config.toml`. The visual step never ran, so `tests/e2e-runs/ci-visual/` was never written, and `upload-artifact` warned `No files were found with the provided path`; the run's only artifact is `e2e-tests`' `e2e-run` (2370404 bytes), so there is no visual run directory to download. The same step started on run 43938990256 (`ci-evidence/187-final-3`, where `main.yaml` is identical) and on the measurement's runs, where the job ran green at `5202d34df`.
- **Its cause is unconfirmed** (the `*_VOID=` lines). No step of this repository's job binds 54326 before `supabase start`, and the occupant is not named in the log. The job's annotations also carry runner-service warnings from the same minutes (`Failed to restore: Cache service responded with 400`, and `Failed to save: ... Our services aren't available right now`), and the image pulls of `e2e-tests` retried several times, but none of that is shown to bear on the port. Linux's default ephemeral port range (32768 to 60999) includes 54326, so an outbound connection holding it as its local port is one possibility, not a finding. No test, baseline, fixture or source file is implicated.
- **The ruling: void, and the one job re-run.** The executor re-ran nothing and stopped the plan on this reading (commit `53859170b`). The operator then ruled in session on 2026-11-17, replying "void + rerun": the failure is a void environment fault, a host port held on the runner before the step under test, like the void red build of Task 2, so it is neither a red nor a green result and is not counted, and only that job is re-run on the same commit. The attempt's `e2e-visual` lines are renamed `*_VOID=`, and its stop lines `*_SUPERSEDED=`. The port's place inside the ephemeral range is filed as a todo (`.planning/todos/pending/2026-11-17-local-supabase-ports-in-ephemeral-range.md`).
- **`e2e-visual`, attempt 2 (job 133887903492): success.** The orchestrator ran `gh run rerun 44033456141 --job 133870600988` at 07:26:40Z. `gh run view 44033456141 --attempt 2 --json jobs,status,conclusion,headSha,attempt` (exit 0) shows attempt 2 at head `68a54299a`, with 13 jobs: `e2e-visual` job 133887903492 `success`, 07:26:44Z to 07:33:01Z, and every other job carried over from attempt 1 with its attempt-1 times and conclusion (the twelve conclusions above, `dependency-audit` `failure` among them). The run's own conclusion stays `failure` because of `dependency-audit`. The job's log (`gh api --allow-escape-sequences .../actions/jobs/133887903492/logs`, exit 0) shows `supabase start` completing and the visual step printing `Running 8 tests using 4 workers`, `8 passed (40.5s)`, `playwright exit 0` and `preflight failures 0, successes 1`: the two Voter Results baselines re-baselined by -gsd `e6ba6921e` match on the runner.
- **G-03 closed.** Every job other than `dependency-audit` concluded `success` at job level on this tree, `e2e-tests` with 729 of 729 on 4 workers, so `ALL_JOBS_GREEN_EXCEPT_DEPENDENCY_AUDIT=yes` and `G03_CLOSED=yes`. Plans 187-15, 187-26 and 187-27 are closed by pointer below.

### The closure of plans 187-15, 187-26 and 187-27

- **The pointers.** Each SUMMARY's blob at HEAD before the closure is its `SUMMARY_*_BASE_BLOB` line. A section `## Closed by plan 187-28 (2026-11-17)` was appended to each, naming the run URL, the five conclusions and this file, and saying that its status stays `stopped`, since that plan's own run was red, and that G-03 is closed by plan 187-28. No existing line was changed or removed.
- **`requirements-advanced`.** `requirements-advanced: [SUPA-08, PIPE-02, PIPE-06]` was inserted into the frontmatter of `187-26-SUMMARY.md` and `187-27-SUMMARY.md`, after their `status: stopped` line; `187-15-SUMMARY.md` keeps its own `requirements-advanced: [SUPA-08, PIPE-02]`.
- **The ROADMAP ticks.** The three plan lines of `ROADMAP.md` are ticked, with `(stopped at Task 3; G-03 closed by 187-28)`, `(stopped at Task 7; closed by 187-28)` and `(stopped at Task 8; closed by 187-28)` added.
- **`REQUIREMENTS_ADVANCED=SUPA-08,PIPE-02,PIPE-06`.** `requirements.mark-complete` is not run, because plans 187-18 to 187-25 still carry those ids.

## First attempt (stopped)

Made on the tree rebased onto `dfe9cae8b`, HEAD `e42e32cf3`, and committed as `0d4ca8887` (now `494bfa63b`). Its lines are renamed `*_SUPERSEDED=` so that each current line above occurs once; nothing else in it is changed. Its logs, named below under `tmp/187-28/t5/` and `tmp/187-28/tf-t5/`, are now under `tmp/187-28/attempt-1/`.

### The rebase onto `dfe9cae8b` (2026-11-17, first attempt)

```
REBASE_HEAD_AT_START_SUPERSEDED=e42e32cf3341c0933faff9dfc290699417baa453
REBASE_BACKUP_TIP_SUPERSEDED=15e82a60bb49bed2983b03728923c443aaf7a324
REBASE_ONTO_SUPERSEDED=dfe9cae8b21fcbf3e224769500c9e50f48b9eb2a
REBASE_OLD_ONTO_SUPERSEDED=c2b3bff15c78168ae73fa244f1e443f05a34269e
REBASE_DELTA_PATHS_SUPERSEDED=tests/README.md,tests/playwright.config.ts,tests/scripts/e2e-run.sh,tests/scripts/visual-container.sh,tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-desktop.png,tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-mobile.png
REBASE_SOURCE_DELTA_EQUALS_GSD_FIX_SUPERSEDED=yes
REBASE_DELTA_TOUCHES_MANIFEST_LOCKFILE_MIGRATION_WORKFLOW_SUPERSEDED=no
REBASE_COUNTERPART_ee85b83a3_SUPERSEDED=642b31ce4ad2184b7c61b3981e0d6fe7cdc853b4
REBASE_COUNTERPART_a7a4222a8_SUPERSEDED=89c83eabb163fd8d82224702fae207cc453bda4b
PRE_REBASE_SHAS_RESOLVE_IN_BACKUP_ONLY_SUPERSEDED=yes
HELPERS_COPIED_SUPERSEDED=yes
LOCAL_MIGRATIONS_APPLIED_SUPERSEDED=22
```

- `REBASE_HEAD_AT_START` is `git rev-parse HEAD` before this plan's first commit: the plan's own commit `e42e32cf3`, one past the planning-time HEAD `8622c3a1b`. `REBASE_BACKUP_TIP` is `git rev-parse backup/infra-pre-rebase-2026-11-17`. `REBASE_ONTO` is `fix/v2.16-ci-e2e` (`dfe9cae8b`), and `REBASE_OLD_ONTO` the base of the rebase of 2026-11-16.
- **`REBASE_SOURCE_DELTA_EQUALS_GSD_FIX=yes`.** `git diff --name-only backup/infra-pre-rebase-2026-11-17 HEAD -- . ':!.planning'` lists the six paths of `REBASE_DELTA_PATHS`, and `git diff --name-only 9cd30f7a5 dfe9cae8b` lists the same six in the same order. `git patch-id --stable` of the two diffs gives the same id, `1134bbc40f08346d00e1ff4962f84e0036623609`.
- **`REBASE_DELTA_TOUCHES_MANIFEST_LOCKFILE_MIGRATION_WORKFLOW=no`.** No delta path is a `package.json`, `yarn.lock`, a file under `apps/supabase/supabase/migrations/` or a file under `.github/`. So 187-27 Task 1's install, database, pgTAP and types gates are not repeated.
- **The counterparts.** Of the 483 commits of `dfe9cae8b..HEAD`, one each has the subject `docs(187): pattern map` (`642b31ce4`) and `docs(186): discussion points and context (recommendations, operator away)` (`89c83eabb`). Their pre-rebase ids, cited by 187-27, are `d35c1bb6a` and `36a676018`.
- **`PRE_REBASE_SHAS_RESOLVE_IN_BACKUP_ONLY=yes`.** For each of `527d9e866`, `ced5b42bb`, `e56db5391`, `b29c91405`, `1f5c56781`, `fabe70c1b`, `e6f1e114e`, `d35c1bb6a` and `36a676018`, `git merge-base --is-ancestor <id> backup/infra-pre-rebase-2026-11-17` exited 0 and `git merge-base --is-ancestor <id> HEAD` exited 1.
- Every earlier -infra evidence id names one of the two backups' histories and is left as written.
- **`HELPERS_COPIED=yes`.** `build-archive.sh`, `run-tf.sh`, `scan.sh`, `t1/run-gates.sh`, `t5/run.sh` and `commits/make-commits.sh` were copied from `tmp/187-27/` to `tmp/187-28/` with `cp -p` (mode kept), then rewritten with `sed` in the copies only: `tmp/187-27` to `tmp/187-28`, and the earlier session's scratch directory to this session's. Each copy passes `bash -n` and names neither old directory.
- **`LOCAL_MIGRATIONS_APPLIED=22`.** `docker exec supabase_db_openvaa-local psql -U postgres -tAc 'select count(*) from supabase_migrations.schema_migrations'` exit 0 printed `22`, the number of `.sql` files under `apps/supabase/supabase/migrations/` at HEAD (`git ls-tree`). No reset was needed.

### Task 1: the gates on the tree rebased onto `dfe9cae8b` (first attempt)

```
GATES_HEAD_SUPERSEDED=e42e32cf3341c0933faff9dfc290699417baa453
lint:check exit_SUPERSEDED=1
format:check exit_SUPERSEDED=0
typecheck exit_SUPERSEDED=0
test:unit exit_SUPERSEDED=0
lint:workflows exit_SUPERSEDED=0
E2E_SELF_TEST_EXIT_SUPERSEDED=0
INFRA_TESTS_PASSED_SUPERSEDED=bootstrap-tfvars.test.ts,build-push-image.test.ts,check-destroy-plan.test.ts,deploy-workflow.test.ts,destroy-workflow.test.ts,infra-plan-workflow.test.ts,main-e2e-workflow.test.ts,probe-hosted.test.ts,push-migrations.test.ts,request-loop.test.ts,running-image-digest.test.ts,workflows.test.ts
GUARD_DEPLOYED_SMOKE_SUPERSEDED=passed
TF_FMT_EXIT_SUPERSEDED=0
TF_ROOTS_VALIDATED_SUPERSEDED=8
TF_MODULES_TESTED_SUPERSEDED=frontend-service,github-oidc
TF_EXAMPLE_PLANS_SUPERSEDED=example/aws,example/dns-mail,example/supabase
SC4_LOCAL_GATE_DIFF_SUPERSEDED=empty
PHASE_APP_DIFF_SUPERSEDED=apps/frontend/src/hooks.server.ts,packages/dev-seed/tests/checkDriftLinkedGuard.test.ts,tests/README.md,tests/tests/fixtures/contestant/contestantHomePage.fixture.ts,tests/tests/fixtures/contestant/contestantTermsOfUsePage.fixture.ts,tests/tests/helpers/navigation.ts,tests/tests/specs/a11y/contestant-a11y.spec.ts,tests/tests/specs/voter/analytics-gpc.spec.ts,tests/tests/specs/voter/voter-journey.spec.ts,tests/tests/specs/voter/voter-prefs-tracking.spec.ts,tests/tests/specs/voter/voter-tracking-consent-free.spec.ts,tests/tests/utils/deployedTarget.test.ts
PHASE_APP_DIFF_UNCHANGED_SINCE_187_27_SUPERSEDED=yes
GATE_STOPPED_SUPERSEDED=lint:check: [ERROR] scripts/assert-comment-hygiene.mjs: tests/playwright.config.ts:1622: rule 2 (D-A4) — this comment line ends without terminal punctuation and the line under it continues the same comment at the same indent. Join them into one line.: tests/playwright.config.ts (owner: -gsd)
```

How each line was read (every exit from its own `.status` file under `tmp/187-28/`, never through a pipe):

- **The repository gates** (`tmp/187-28/t1/run-gates.sh tmp/187-28/t5/gates`, called by `tmp/187-28/t5/run.sh` in the background, one after another, `TURBO_CACHE_DIR=tmp/187-28/turbo-cache`, a cache private to this attempt and empty at its start). HEAD was `e42e32cf3` before and after. `lint:check` 23:23:49Z to 23:24:30Z exit 1 (below). `format:check` to 23:24:48Z exit 0 (`All matched files use Prettier code style!`). `typecheck` exit 0. `test:unit` 23:24:48Z to 23:25:39Z exit 0 (`Tasks: 26 successful, 26 total`); the stack was Up for its dev-seed integration tests. `lint:workflows` exit 0 (`actionlint found nothing in 3 workflows`). Each gate ran once; none was run again.
- **`E2E_SELF_TEST_EXIT=0`.** `tests/scripts/e2e-run.sh --self-test`, after `run.sh` in the same background command, because the wrapper is in the delta: `e2e-run.sh: self-test passed: 13 case(s).`
- **`INFRA_TESTS_PASSED`.** `vitest run --config infra/vitest.config.ts --reporter=verbose` exit 0, `Test Files 12 passed (12)`, `Tests 323 passed (323)`, the same count as 187-27's 323.
- **`GUARD_DEPLOYED_SMOKE=passed`.** `vitest run --config tests/vitest.config.ts --reporter=verbose` exit 0, `Test Files 15 passed (15)`, `Tests 358 passed (358)`, the same count as 187-27's 358, with 16 `✓ tests/utils/deployedSmokeGuards.test.ts` lines and no failed test.
- **Terraform** (`tmp/187-28/run-tf.sh t5`, after the gates and the vitest configs, alone; never alongside `test:unit`). `terraform fmt -check -recursive -diff infra` exit 0. The eight roots (`infra/bootstrap` and the seven under `infra/envs/*/*/`) each `init -backend=false -lockfile=readonly` and `validate` exit 0. `terraform test` of `frontend-service` `Success! 33 passed, 0 failed.` and of `github-oidc` `Success! 11 passed, 0 failed.`. The three example roots each `Success! 1 passed, 0 failed.`. `git status --porcelain` afterwards listed only the untracked ledger and this evidence file.
- **`SC4_LOCAL_GATE_DIFF=empty`.** `git diff --quiet 89c83eabb HEAD -- tests/playwright.config.ts tests/global-setup.ts tests/tests/support/preflight.ts` exit 0, with `89c83eabb` the rebased counterpart of `a7a4222a8` (pre-rebase `36a676018`). The -gsd change to the config lies in the base, before the counterpart.
- **`PHASE_APP_DIFF`.** `git diff --name-only 642b31ce4..HEAD -- apps packages tests`, with `642b31ce4` the rebased counterpart of `ee85b83a3` (pre-rebase `d35c1bb6a`). It equals the `PHASE_APP_DIFF=` line of `187-27-ci-closure.md` path for path.

#### The red gate: `lint:check` (the plan stops here)

- **The first error line**, from `tmp/187-28/t5/gates/lint-check.log`: `[ERROR] scripts/assert-comment-hygiene.mjs: tests/playwright.config.ts:1622: rule 2 (D-A4) — this comment line ends without terminal punctuation and the line under it continues the same comment at the same indent. Join them into one line.` The guard's summary: `Comment hygiene guard (phase 152: REVIEW-HYG-01) — files scanned: 2332; ... rules live: 2 of 2 (unicode-escape-in-comment; forced-line-break). 1 violation(s).` Everything in `lint:check` before it passed: `turbo run lint` (`Tasks: 12 successful, 12 total`, warnings only), `eslint tests` (one warning), `typecheck:tests`, `typecheck`, and the i18n-catalog and a11y-scan-wiring guards (0 violations each). `lint:check` is an `&&` chain, so the guards after `assert:comment-hygiene` (`assert:no-candidate-app-names` to `assert:no-preregister`) did not run in it.
- **Where it comes from.** Line 1622 of `tests/playwright.config.ts`, the trace setting's doc comment, ends `... by the \`forensicCapture\` fixture, which`, and the line under it continues the sentence. The line is older (`d778fca2b`), but until the -gsd commit `2934f0c67` (`fix(e2e): run CI first attempts untraced, as the trace setting intends`) the line under it closed the comment (`... whether the test passed or not. */`). That commit appended a paragraph after it, so the line under it no longer closes the comment, and the guard's forced-line-break rule now applies to the pair. `git blame` of line 1623 names `2934f0c67`.
- **The owner: -gsd.** `tests/playwright.config.ts` at HEAD is byte-identical to the file at `dfe9cae8b` (`git diff --quiet dfe9cae8b HEAD -- tests/playwright.config.ts` exit 0), and the guard `scripts/assert-comment-hygiene.mjs` is the same blob (`576cb3875`) at `9cd30f7a5`, `dfe9cae8b`, the backup and HEAD. So the violation is in the -gsd fix branch `fix/v2.16-ci-e2e` itself, and arrived in this tree only through the rebase. At the backup the file equals the one at `9cd30f7a5`, which is why 187-27's `lint:check` exited 0.
- **Not fixed, not re-run.** This plan changes no file outside `.planning/`. The fix (joining line 1622 and the line under it, or ending it with punctuation) belongs to the -gsd stream on `fix/v2.16-ci-e2e`, after which this branch is rebased again and this plan's Task 1 made again. Tasks 2 to 5 were not started: no evidence commit was written, nothing was built, scanned or run, and nothing was pushed.
