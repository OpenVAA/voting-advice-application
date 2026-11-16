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

## Task 2: the evidence commits and the green commit's scan (stopped at the red build)

```
GREEN_DIFF_VS_FINAL_3=tests/README.md,tests/playwright.config.ts,tests/scripts/e2e-run.sh,tests/scripts/visual-container.sh,tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-desktop.png,tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-mobile.png
GREEN_DIFF_VS_MEASURE_3=.github/workflows/main.yaml,tests/playwright.config.ts
TASK2_GREEN_COMMIT=68a54299aa81b2a2f95fd2151031ab4e624ef01c
TASK2_GREEN_TREE=a9d648e87d3e075e1dafc650f2c5030afdda29fb
TASK2_GREEN_PARENT=340a200708c28fb7ed078d452138712f3400c789
TASK2_GREEN_LOCAL_BUILD_EXIT=0
TASK2_RED_COMMIT=3250ba0e8e964f8c87c03459f812bd935637272b
TASK2_RED_TREE=20756a2dec61b17bab3dafecbc020c4d0f1510c0
TASK2_RED_LOCAL_BUILD_EXIT=102
TASK2_RED_FAILED_AT_FRONTEND_BUILD=no
TASK2_RED_NAMES_MISSING_MODULE=no
BUILD_STOPPED=red archive build: #13 ERROR: process "/bin/sh -c yarn install --immutable" did not complete successfully: cannot allocate memory: apps/frontend/Dockerfile:21 (owner: deployment, the local Docker VM; not a defect of the tree)
```

- **The commits** (`tmp/187-28/commits/make-commits.sh`, in the background, exit 0, written 23:36:50Z from HEAD `246f5dc8b`). The parent is `git rev-parse --verify refs/remotes/origin/main` (`340a20070`, no fetch). The green tree is HEAD's without `.planning/`, written in a temporary index under the session scratch directory and removed afterwards; `git diff --quiet HEAD <green> -- . ':!.planning'` exit 0, 3533 paths and none under `.planning/`, and the real index untouched (`git diff --cached --quiet` exit 0). The red commit is the green tree with the blob `8ccc60be8f1696621812d5e7f8084f403b708aa7` (the broken import prepended to the unchanged `apps/frontend/src/routes/+layout.ts`, the same blob as in 187-26 and 187-27) at that path; `git diff-tree -r --name-only` of the two prints that one path, `1 file changed, 1 insertion(+)`. `refs/evidence/187/green` and `refs/evidence/187/red` now point at them, and `git for-each-ref --contains` prints exactly that ref for each.
- **`GREEN_DIFF_VS_FINAL_3`** equals Task 1's `REBASE_DELTA_PATHS` path for path. **`GREEN_DIFF_VS_MEASURE_3`** is `main.yaml`, the measurement's job matrix, and `tests/playwright.config.ts`, the comment join of `cecf649d8` (the deviation above); `5202d34df` is in this checkout's store.
- **The green build** (`tmp/187-28/build-archive.sh green 68a54299a`, in the background): `git archive` exit 0, extraction exit 0, `docker buildx build --platform linux/arm64 --target production --build-arg BUILD_SHA=<commit> --provenance=false --sbom=false --output type=cacheonly` exit 0, 23:36:51Z to 23:38:04Z (73 s). `#15 [shared 2/2] RUN yarn build` `DONE 41.5s`, `#19 [production 2/2] RUN yarn workspace @openvaa/frontend build` `DONE 10.4s`.
- **The red build** (`tmp/187-28/build-archive.sh red 3250ba0e8`, directly after it): archive and extraction exit 0, then the build exited 102 in 10 s, 23:38:05Z to 23:38:15Z. It did not reach the frontend build. Its first error line is `#13 ERROR: process "/bin/sh -c yarn install --immutable" did not complete successfully: cannot allocate memory`, at `Dockerfile:21` (`RUN yarn install --immutable`), during yarn's fetch step, ending `ERROR: failed to build: failed to solve: ResourceExhausted`. The install layer is not reused from the green build because `COPY apps apps` precedes it and the red tree differs under `apps/`.
- **Why it stops the plan.** The red build must fail at the frontend build and name the missing module. This one failed earlier, for want of memory, so it proves nothing about the red commit, and the plan does not re-run a build to get the expected result. The memory is the Docker VM's (8.2 GB, `docker info`), shared at the time with this checkout's Supabase stack and a second, unrelated Supabase stack (`*_next-supabase-skimle2`), both Up. Nothing in the tree is implicated: the green commit, which differs from the red one by one import line, installed and built in the same VM a minute earlier.
- **Not done.** The 187-12 re-run section (step 4) was not written, so its plan 187-27 lines stay current; the scan (step 5) and the builder-cache prune (step 6) were not run, and the green build's cache is left in place. Task 3 was not started: the developer's functions env file was not moved, and no E2E run was made. Nothing was pushed.
- **To resume** (for the orchestrator to decide): free Docker VM memory (stopping the unrelated stack, or raising the VM's memory), then run `tmp/187-28/build-archive.sh red 3250ba0e8e964f8c87c03459f812bd935637272b` once as a new red-build attempt, and carry on from Task 2 step 3. The commits need not be rewritten.

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
