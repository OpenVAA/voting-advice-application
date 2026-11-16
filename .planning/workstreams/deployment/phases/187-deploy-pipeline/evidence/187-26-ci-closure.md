# 187-26 evidence: closing run 43817899191's red jobs at their causes

Repository `OpenVAA/voting-advice-application`, branch `feat/deployment-terraform-supabase`. Read and written by the plan executor from this checkout, 2026-11-16. Remote reads were `gh api` GETs and `git ls-remote` only. Nothing was pushed, and no GitHub, AWS or Supabase setting was read or changed. Logs and status files are under `tmp/187-26/` (ignored).

## Operator rulings of 2026-11-16, as given

- **B-02 override:** the two steps added to `main.yaml`'s existing `e2e-tests` job (the Edge Functions env template copy before "Start Supabase", and the `if: failure()` edge-runtime log dump) are approved.
- **G-05 override:** rewriting the user-info fixtures in `tests/tests/utils/deployedTarget.test.ts` is approved; the exclusion-file entry stays a fallback only.
- **The closing full E2E run** is made with the developer's untracked `apps/supabase/supabase/functions/.env` moved aside (never read, never printed, never listed) and restored afterwards with the edge runtime restarted, exactly as Task 5 specifies. If any move or restore command is refused by a hook or the permission system, the executor stops at once, leaves the file wherever it safely is, and reports the exact command and the file's location.
- **The push** was approved in advance by the operator, conditionally; it is Task 6's business (the orchestrator's), not the executor's.

## Task 1: the secret scan, reproduced locally at 3.97.9, then 0 on the fixed tree

```
SCAN_TOOL_VERSION=3.97.9
SCAN_IMAGE_DIGEST=ghcr.io/trufflesecurity/trufflehog@sha256:52e67fef4d054ecff5c2ce4b4ae376626d1ef54aa0898b53cac19c25e92e14db
SCAN_ARGS_FROM_ACTION=yes
SCAN_BASE=340a200708c28fb7ed078d452138712f3400c789
SCAN_BASELINE_HEAD=395b71c712f9af6a80512625f2b38baf93167c1a
SCAN_BASELINE_EXIT=183
SCAN_BASELINE_RESULTS=3
SCAN_BASELINE_FINDING=tests/tests/utils/deployedTarget.test.ts:603 detector=URI verified=false
SCAN_BASELINE_FINDING=tests/tests/utils/deployedTarget.test.ts:604 detector=URI verified=false
SCAN_BASELINE_FINDING=tests/tests/utils/deployedTarget.test.ts:603 detector=URI verified=false
SCAN_THIRD_RESULT=a second URI result at tests/tests/utils/deployedTarget.test.ts:603, same commit, unverified; the --github-actions printer writes one annotation per file and line, so CI and the local run each showed 2 annotations for 3 results
EXCLUSION_ADDED=none
FIXTURE_TESTS_BEFORE=118
FIXTURE_TESTS_AFTER=118
NEGATIVE_CONTROL_FAILED=2
NEGATIVE_CONTROL_RESTORED=yes
FIXTURE_FIX_COMMIT=02a1530b209d9eb11dcce0955a21b8c4b65bb62b
SCAN_PROBE_HEAD=e9e50bf88e155f9163c83277421475028d01f502
SCAN_PROBE_TREE=63ccb45bff21138dd891a677c31e0ab3fa8e770f
SCAN_AFTER_EXIT=0
SCAN_AFTER_RESULTS=0
SCAN_PROBE_REF_DELETED=yes
```

How each line was read:

- **The command.** `gh api 'repos/trufflesecurity/trufflehog/contents/action.yml?ref=v3.97.9' --jq .content | base64 -d` exit 0. The action's run step is `docker run --rm -v .:/tmp -w /tmp "${IMAGE}:${VERSION}" git file:///tmp/ --since-commit ${BASE} --branch ${HEAD} --fail --no-update --github-actions ${ARGS}`, with `IMAGE` defaulting to `ghcr.io/trufflesecurity/trufflehog`. The local command is that line verbatim, with `VERSION=3.97.9`, `HEAD` the scanned commit's SHA, and `ARGS` main.yaml's `extra_args`: `--config=.github/trufflehog-openvaa.yml --exclude-paths=.github/trufflehog-exclude-paths.txt`. `docker pull ghcr.io/trufflesecurity/trufflehog:3.97.9` exit 0; `--version` printed `trufflehog 3.97.9`; the digest is from `docker image inspect --format '{{json .RepoDigests}}'`. The script is `tmp/187-26/scan.sh`.
- **The scan repository.** For each scan, `git init` under `tmp/187-26/scan/<label>/`, then `git fetch` from this checkout's own path of `refs/remotes/origin/main` and the head, and `git checkout` of the head. The directory was removed after each scan, and `tmp/187-26/scan/` itself after the last.
- **Baseline.** Head `395b71c71`, base `340a20070`. The `--github-actions` run exited 183, the code CI's step exited with. Its summary line reads `"verified_secrets": 0, "unverified_secrets": 3` over 3779 chunks, CI's exact numbers. Its two annotations name `deployedTarget.test.ts` lines 603 and 604, as CI's did. The `--json` run, to a file in a mode-700 `mktemp -d` directory, also exited 183. `jq` selected only `.SourceMetadata.Data.Git.file`, `.line`, `.commit`, `.DetectorName` and `.Verified`, giving the three finding lines above, all at commit `395b71c71`. Then the directory was deleted, unread otherwise. No raw or redacted field was selected, and no matched text was printed or kept.
- **The fix.** In `tests/tests/utils/deployedTarget.test.ts`, the four fixtures holding a user, a colon and an `@` after the scheme separator (the deployed setup's user-info `baseURL`, and the `gateTargetLine` rows for a user and a password, a password alone, and a space in the host) are now built by one helper, `httpsWithUserInfo(userInfo, rest)`, which returns `` `https://${userInfo}@${rest}` ``. No source line now holds a whole user-info URL: `grep -cE '://[^/ ]*:[^/ ]*@'` over the file counts 0, where HEAD counted 4. A node comparison (`tmp/187-26/compare-fixtures.mjs`) of HEAD's four literals with the four reconstructed calls printed `old=4 new=4 equal`, so every string that reaches `gateTargetLine` or the setup is byte-identical. The two "user alone" fixtures carry no colon, are not URI findings, and are left as they are. No exclusion was needed.
- **Same test.** `vitest run --config tests/vitest.config.ts --reporter=verbose deployedTarget.test.ts` printed `Tests 118 passed (118)` before (exit 0) and after (exit 0). Prettier and ESLint on the file exited 0.
- **Negative control.** With the one line `url.password = '';` of `gateTargetLine` in `tests/tests/utils/deployedTarget.ts` deleted, the file exited 1 with `Tests 2 failed | 116 passed (118)`: "withholds user info made of a user and a password" and "withholds user info made of a password alone". `git checkout -- tests/tests/utils/deployedTarget.ts`, then `git diff --quiet` on it exit 0.
- **After.** The probe commit is HEAD `02a1530b2`'s tree without `.planning/`, written in a temporary index (`read-tree HEAD`, `rm -r --cached .planning`, `write-tree`), with parent `340a20070` and message `deploy: staging`, held by `refs/evidence/187/scan-probe`; its tree has 0 planning paths and the real index stayed clean. Scanned as above: both runs exit 0, `"verified_secrets": 0, "unverified_secrets": 0` over 3780 chunks, no annotation, no JSON result. `git update-ref -d refs/evidence/187/scan-probe`, then `git show-ref --quiet` on it exit 1.

## Task 2A: `run_child` on Linux

```
LINUX_REPRO_IMAGE=node:24-alpine
LINUX_REPRO_BEFORE_STATUSES=1,1,1
LINUX_REPRO_BEFORE_DRIFT_LINES=0
LINUX_REPRO_BEFORE_REPRODUCES_CI=yes
LINUX_REPRO_AFTER_STATUSES=0,0,0
LINUX_REPRO_AFTER_DRIFT_LINES=3
PUSH_MIGRATIONS_TESTS_LOCAL=passed
RUN_CHILD_FIX_COMMIT=6c8d41c6f
```

- **The harness.** The confirmed reproduction's `harness.mjs`, copied into `tmp/187-26/linux-repro/`. It builds `makeRoot()`'s throwaway root (a stub CLI that records its arguments and answers the dry run, a stub drift check, a work directory linked to `abcdefghijklmnopqrst`) and spawns `bash <script> --log-dir <root>/logs --ref <ref> --workdir work --confirmed-ref <ref>` detached with three pipes and the pipeline environment, for three cases: pending, a `deploy-evidence` ref, and up to date.
- **Before.** `git show HEAD:infra/scripts/push-migrations.sh` (HEAD `20584ee48`) into the same directory, then `docker run --rm -v <dir>:/r:ro node:24-alpine sh -c 'apk add --no-cache bash && node /r/harness.mjs /r/push-migrations.head.sh'` exit 0. All three cases exited 1, and each printed `drift_status=1`, never `drift_status=0`, after `line 298: /dev/fd/1: No such device or address` on standard error. The drift check never ran (its stub's `stub drift check` line is absent). That is CI's failure: an expected line missing at `:129`, status 1 at `:179`, and no `drift_status=0` at `:185`.
- **The fix.** `run_child` with both stream arguments `-` now runs the command in the background with only `</dev/null`, so it writes through the descriptors it inherits. With two files it redirects to them as before. A single `-` beside a file is refused through `fatal` with status 2; no call site passes one (the three call sites pass two files, two files, and `- -`). `grep -nE '/dev/fd|/proc/self/fd|/dev/std(out|err|in)'` over the script finds nothing. The function's header comment states this behaviour.
- **After.** The same harness on the fixed script: statuses 0, 0 and 0, each with `stub drift check` and `drift_status=0` on standard output and nothing but the script's own notes on standard error.
- **The guard case.** A new `describe('push-migrations.sh reopens no stream through the descriptor directory')` in `infra/scripts/push-migrations.test.ts`. Its helper lists the non-comment lines of a script naming `/dev/fd/`, `/proc/self/fd/` or `/dev/std{in,out,err}`. On the real script it lists none. On two in-memory copies, one with `echo started >/dev/fd/2` and one with `[ "$out" = "-" ] && out=/dev/fd/1` added to `run_child`, it lists exactly the added line. On the HEAD script before the fix it lists its two lines `[ "$out" = "-" ] && out=/dev/fd/1` and `[ "$err" = "-" ] && err=/dev/fd/2` (a `node -e` over `git show HEAD:…`), so the case is red on the failing script and green on the fixed one.
- **Local runs.** `vitest run --config infra/vitest.config.ts --reporter=verbose push-migrations.test.ts` exit 0, `Tests 14 passed (14)`. The other two files that run the script, `packages/dev-seed/tests/pushMigrationsGate.test.ts` (12 of 12) and `infra/scripts/deploy-workflow.test.ts` (41 of 41), exit 0. Prettier and ESLint on the test file exit 0.

## Task 2B: the drift guard's 15 s timeout

```
DRIFT_GUARD_HOST_EVENTS=2026-11-15 22:09:40 +0200 Notification "Display is turned off"; no Sleep, Wake or DarkWake line from 22:05 to 22:12 +0200
DRIFT_GUARD_SYSPOLICY_LOG=reaches the window; 6779 syspolicyd lines from 22:08:30 to 22:10:30 +0200, none naming a check-drift-bin- path
DRIFT_GUARD_ALONE_RUNS=10
DRIFT_GUARD_ALONE_MAX_MS=215
DRIFT_GUARD_LOADED_SESSIONS=3
DRIFT_GUARD_LOADED_RUNS=6
DRIFT_GUARD_LOADED_TIMEOUTS=0
DRIFT_GUARD_LOADED_MAX_MS=300
DRIFT_GUARD_UNDER_TEST_UNIT_ONLY_RUNS=12
DRIFT_GUARD_UNDER_TEST_UNIT_ONLY_MAX_MS=338
DRIFT_GUARD_FIRST_EXEC_MS=129-160 for a freshly written #!/bin/sh stand-in, 4-14 for its second exec, 2-6 for a link to /usr/bin/true (10 each)
DRIFT_GUARD_TRACE_GAP=no trace was slow: every --target local child's trace spans 0 s or 1 s of bash SECONDS; the two that cross a second boundary (session 1 run 1, session 2 run 3) cross it across `docker info`, the first exec of the freshly written docker stand-in, which is the case's one step the other twelve cases do not take
DRIFT_GUARD_CAUSE=unconfirmed
```

How each line was read:

- **Host events.** `pmset -g log`, lines from `2026-11-15 22:05` to `22:12 +0200` (20:05Z to 20:12Z), filtered to Sleep, Wake, DarkWake and display. The one display line is the notification `Display is turned off` at 22:09:40 +0200, inside the occurrence's window (20:09:04Z to 20:09:57Z); the others in the window are caffeinate and powerd assertion changes. There is no Sleep, Wake or DarkWake. A display turning off is not a suspend, and its relation to the 15 s stall is not shown.
- **The unified log.** `/usr/bin/log show --start '2026-11-15 22:08:30' --end '2026-11-15 22:10:30' --predicate 'process == "syspolicyd" OR process CONTAINS "XProtect"'` exit 0 (`tmp/187-26/logshow-window.txt`), so the log still reaches that time. It holds 6779 lines, mostly `com.apple.syspolicy.exec` (`Unable to initialize qtn_proc`, `dispatch_mig_server returned`) and notarization-daemon errors, with bursts of 1605 and 715 lines in the seconds 22:09:32 and 22:09:47. `grep -c 'check-drift-bin-'` counts 0: no line names the test's stand-in directory.
- **Alone.** `yarn workspace @openvaa/dev-seed vitest run --reporter=verbose tests/checkDriftLinkedGuard.test.ts` ten times in a row, each exit 0 and `Tests 13 passed (13)`. The `--target local` case took 177, 179, 175, 195, 160, 215, 184, 175, 192 and 167 ms. Every other case of the file takes 1 to 19 ms. The local case is the only one that runs with `BIN_WITH_DOCKER_SHIM`, so it is the only one that executes a file the test has just written.
- **First exec.** `tmp/187-26/drift/firstexec.pl`, ten times: write `#!/bin/sh\nexit 0\n` into a new temporary directory, `chmod 755`, exec it, exec it again, and exec a symlink to `/usr/bin/true` beside it. First exec 153, 130, 150, 152, 160, 155, 154, 141, 136, 129 ms; second exec 4 to 14 ms; link 2 to 6 ms. So the local case's extra 150 to 200 ms is the first exec of the fresh stand-in (macOS's exec assessment of a new file), which matches the trace below.
- **Loaded.** `tmp/187-26/drift/load.sh <session>`, three sessions one after another (08:15:18Z to 08:19:31Z). Each starts `yarn test:unit` with a fresh private turbo cache (`Cached: 0 cached, 25 total`; 1m38s, 45s, 45s; each exit 0) and plan 187-12 Task 1's Terraform loops (fmt, 8 root inits and validates, 2 module test suites, 3 example tests; each part exit 0) together, and 25 s later runs the file six times, 5 s apart, with `BASH_ENV` set for that vitest process only. Of the 18 file runs, 6 ran while both loads ran and 12 while `yarn test:unit` alone ran (from the end times of their status files). Every run exited 0 with 13 of 13 tests; no case timed out. During session 1, syspolicyd logged 16317 lines in 114 s, more than twice the rate of the occurrence's window, so exec-assessment load of that size does not by itself produce the stall. `git status --porcelain` afterwards lists only the untracked ledger.
- **The trace.** `tmp/187-26/drift/bash-env.sh` sets `PS4='+${SECONDS}s ${BASH_SOURCE##*/}:${LINENO}: '`, tees standard error to one file per bash process (`traces/<run>/trace.<pid>`, with the process's start time from Time::HiRes) and turns xtrace on. The host's bash is 3.2, which has neither `EPOCHREALTIME` nor `BASH_XTRACEFD`, so the resolution is one second. Each local child's trace has the same 92 lines, ending at `exit 2` after the loopback refusal. No trace shows a gap of a second or more between two commands, and none shows time before the first traced command.
- **Decision.** Not reproduced (0 timeouts in 6 runs under both loads and 12 more under `yarn test:unit`), and no Sleep, Wake or DarkWake in the window, so `DRIFT_GUARD_CAUSE=unconfirmed`. No code was changed. The lead for the operator's ruling: the only step that distinguishes the timed-out case is the first exec of a stand-in the test writes a moment before, measured at 130 to 160 ms against 2 to 6 ms for a link to an existing binary, and the stall coincided with the display turning off and with syspolicyd bursts. A change of the stand-in to a link would remove that step, but no trace shows it is where the 15 s went. Under the plan, Task 6 blocks for the operator's ruling.

## Task 3: the Edge Functions' env file in CI's E2E job, its guard, and the staging function secrets

```
MAIN_YAML_E2E_ENV_STEP=before-start-supabase
MAIN_YAML_E2E_LOG_DUMP=on-failure
MAIN_YAML_E2E_VISUAL=unchanged
MAIN_YAML_ACTIONLINT_NEW_FINDINGS=0
MAIN_E2E_GUARD_COMMIT=97a631eb9
STAGING_FUNCTION_SECRETS_IN_CODE=yes
STAGING_TFVARS_SETS_PROJECT_ID_AND_SMTP=yes
STAGING_FUNCTION_SECRET_NAMES_OBSERVED=2026-11-11
DEPLOY_WORKFLOW_SETS_FUNCTION_SECRETS=no
STAGING_FUNCTION_SECRETS_BLOCKER=none
```

- **The workflow.** In `main.yaml`'s `e2e-tests` job, directly before `Start Supabase`, the step `Configure the Edge Functions' environment` runs `cp apps/supabase/supabase/functions/.env.example apps/supabase/supabase/functions/.env`, under a two-line comment. Directly after `Run E2E tests`, the step `Print the edge runtime's log`, with `if: failure()`, runs `docker logs --timestamps supabase_edge_runtime_openvaa-local`; it lies before the upload and `Stop Supabase`. This is B-02's amendment for this one job, approved by the operator on 2026-11-16; no pipeline job enters `main.yaml`.
- **`e2e-visual` unchanged.** It passed on run 43817899191, and its chain (the `visual-regression` project and the setups it depends on) sends no mailed link.
- **The guard.** `infra/scripts/main-e2e-workflow.test.ts` parses `main.yaml` with `parseWorkflow`, `workflowJobs` and `jobSteps` of `./workflowGuards`, and reads the container's project from `project_id` of `apps/supabase/supabase/config.toml`. `vitest run --config infra/vitest.config.ts --reporter=verbose main-e2e-workflow.test.ts` exit 0, 5 of 5: no violation in the real file, the copy directly before `Start Supabase` and the log step directly after `Run E2E tests`, and each rule red on a mutated in-memory copy of the job's parsed steps (the copy step moved after `Start Supabase`; the log step's `if` dropped). The copies are of the parsed steps rather than the text because `main.yaml` holds six `Start Supabase` steps. The six dev-seed gates that read `main.yaml` (70 of 70) and `infra/scripts/workflows.test.ts` (29 of 29) still pass.
- **actionlint.** The pinned image of `scripts/lint-workflows.mjs` (`rhysd/actionlint@sha256:b1934ee5…`), run on `main.yaml` as it was at `15ff5a71c` (`git show`) and as it is now, each in a read-only mount of its own: both exit 1 with the same one finding, a pre-existing shellcheck SC2129 style note in another job. Compared without positions, 0 findings are new.
- **`STAGING_FUNCTION_SECRETS_IN_CODE=yes`.** `infra/modules/supabase/function-secrets.tf`: `supabase_edge_function_secrets.this` sets `PUBLIC_PROJECT_ID` from `public_project_id` and `SITE_URL` from `public_origin`, plus `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER` and `SMTP_PASS` when `smtp` is set; its count is 0 while `public_project_id` is null.
- **`STAGING_TFVARS_SETS_PROJECT_ID_AND_SMTP=yes`.** In `infra/envs/staging/supabase/terraform.tfvars`, `grep -cE '^\s*public_project_id\s*='` counts 1, `^\s*smtp\s*=` counts 1, `^\s*public_origin\s*=` counts 1, and `^\s*(smtp|public_project_id)\s*=\s*null` counts 0 (values not printed). The root's `main.tf` passes `public_origin`, `smtp`, `smtp_user`, `smtp_password` and `public_project_id` to the module.
- **`STAGING_FUNCTION_SECRET_NAMES_OBSERVED=2026-11-11`.** The Observations row of `infra/envs/staging/supabase/README.md` for the persistent project's settings apply: "The function secrets read back by name are exactly the seven the module sets." The throwaway project's row of 2026-11-09/10 names the seven.
- **`DEPLOY_WORKFLOW_SETS_FUNCTION_SECRETS=no`.** `.github/workflows/deploy.yml`'s `Deploy the functions` step runs `supabase functions deploy` and a read-back of the functions list; `grep -cE 'secrets (set|unset)'` over the file counts 0. A pipeline deploy keeps what the hand-applied root set.
- No Terraform was changed and no hosted read was made.

## Task 4: the gates on the final tree, the evidence commits, their builds and the green commit's scan

### The gates (2026-11-16)

```
GATES_HEAD=27ee4fcea49b699ba3d8246e58ecf290fb818473
lint:check exit=0
format:check exit=0
typecheck exit=0
test:unit exit=0
lint:workflows exit=0
INFRA_TESTS_PASSED=workflows.test.ts,infra-plan-workflow.test.ts,deploy-workflow.test.ts,destroy-workflow.test.ts,check-destroy-plan.test.ts,running-image-digest.test.ts,push-migrations.test.ts,bootstrap-tfvars.test.ts,build-push-image.test.ts,probe-hosted.test.ts,request-loop.test.ts,main-e2e-workflow.test.ts
GUARD_DEPLOYED_SMOKE=passed
TF_FMT_EXIT=0
TF_ROOTS_VALIDATED=8
TF_MODULES_TESTED=frontend-service,github-oidc
TF_EXAMPLE_PLANS=example/aws,example/dns-mail,example/supabase
SC4_LOCAL_GATE_DIFF=empty
PHASE_APP_DIFF=tests/README.md,tests/tests/utils/deployedTarget.test.ts
```

- **The repository gates.** `tmp/187-26/gates/run-gates.sh`, in the background, one gate after another with `TURBO_CACHE_DIR=tmp/187-26/turbo-cache` (new for this attempt), each status written by the command on the line after it. HEAD was `27ee4fcea` before and after. `lint:check` 08:22:31Z to 08:23:19Z (its turbo runs: 12 lint tasks and 23 typecheck tasks, 0 cached), `format:check` to 08:23:36Z, `typecheck` (23 of 23 tasks, all hits from `lint:check`'s typecheck run on the same tree in the same cache; `svelte-check found 0 errors and 0 warnings`), `test:unit` 08:23:36Z to 08:24:24Z (`Tasks: 25 successful, 25 total`; dev-seed 80 files and 1266 tests, `test:unit:tests` 323 of 323, `test:unit:infra` 12 files and 321 of 321), and `lint:workflows` (`actionlint found nothing in 3 workflows`). Every exit is 0, on the first run of each. No Terraform loop ran during them.
- **`INFRA_TESTS_PASSED`.** `vitest run --config infra/vitest.config.ts --reporter=verbose` exit 0, `Test Files 12 passed (12)`, `Tests 321 passed (321)`, no failed test. Passing lines per file: `probe-hosted` 96, `destroy-workflow` 53, `deploy-workflow` 41, `infra-plan-workflow` 33, `workflows` 29, `check-destroy-plan` 24, `push-migrations` 14, `running-image-digest` 13, `bootstrap-tfvars` 7, `main-e2e-workflow` 5, `build-push-image` 3, `request-loop` 3.
- **`GUARD_DEPLOYED_SMOKE=passed`.** `vitest run --config tests/vitest.config.ts --reporter=verbose` exit 0, `Tests 323 passed (323)`, with 16 lines `✓ tests/utils/deployedSmokeGuards.test.ts > …` and no failed test.
- **Terraform** (`tmp/187-26/gates/run-tf.sh`, after the gates, alone; `TF_PLUGIN_CACHE_DIR` set, a `TF_DATA_DIR` per root under the session scratch directory). `terraform fmt -check -recursive -diff infra` exit 0. The eight roots (`infra/bootstrap`, `infra/envs/example/{aws,dns-mail,supabase}`, `infra/envs/scratch/supabase`, `infra/envs/staging/{aws,dns-mail,supabase}`) each `init -backend=false -lockfile=readonly` and `validate` exit 0, each with `Success! The configuration is valid.`. `terraform test` of `frontend-service` `Success! 33 passed, 0 failed.` and of `github-oidc` `Success! 11 passed, 0 failed.`. `test -verbose` of the three example roots, each `Success! 1 passed, 0 failed.`. `git status --porcelain` afterwards lists only the untracked ledger.
- **`SC4_LOCAL_GATE_DIFF=empty`.** `git diff --quiet a7a4222a8 -- tests/playwright.config.ts tests/global-setup.ts tests/tests/support/preflight.ts` exit 0.
- **`PHASE_APP_DIFF`.** `git diff --name-only ee85b83a3..HEAD -- apps packages tests` lists `tests/README.md` and `tests/tests/utils/deployedTarget.test.ts`, the second being Task 1's fixture rewrite (the G-05 amendment the operator approved). Nothing under `apps/` or `packages/`.

### The evidence commits and the green commit's scan

```
GREEN_COMMIT_OF_RECORD=102202f7a162cb8a67d31cc50f7692a22e015ab7
RED_COMMIT_OF_RECORD=34d7b211db38003e988cd4600cc7b7283341733c
PUSH_SCAN_HEAD=102202f7a162cb8a67d31cc50f7692a22e015ab7
PUSH_SCAN_BASE=340a200708c28fb7ed078d452138712f3400c789
PUSH_SCAN_EXIT=0
PUSH_SCAN_RESULTS=0
```

- The green and red commits, their archive builds (green exit 0, red exit 1 at the frontend build naming the missing module) and the builder-cache prune are recorded in `187-12-evidence-commits.md` § Re-run 2026-11-16 (plan 187-26).
- **The scan.** Task 1's `tmp/187-26/scan.sh` with head `refs/evidence/187/green` and base `GREEN_PARENT`, in a fresh `git init` repository fetched from this checkout. The `--github-actions` run exit 0, `"verified_secrets": 0, "unverified_secrets": 0` over 3781 chunks, no annotation. The `--json` run exit 0 with no result; its mode-700 directory was deleted, and `tmp/187-26/scan/` removed.
