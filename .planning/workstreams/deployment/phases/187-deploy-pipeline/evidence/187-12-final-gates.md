# 187-12 evidence: the repository and infrastructure gates on the phase's final local tree

Recorded 2026-11-15 (UTC) by the plan executor, which ran every gate itself from this checkout. Logs are in `tmp/187-gates/187-12/` (ignored).

- **Commit:** `f1602487a0a466fa95925486d87b3d4361525945` (HEAD before and after every gate, `head-before.txt` and `head-after.txt`; `git status --porcelain` was empty before the gates and listed nothing after them)
- **Date:** 2026-11-15 (UTC), repository gates from 03:14:00Z to 03:16:33Z, Terraform gates in the same minutes
- **Node:** v24.21.0 (`$HOME/.nvm/versions/node/v24.21.0/bin` first on `PATH`); Terraform v1.16.5 with `TF_PLUGIN_CACHE_DIR=$HOME/.terraform.d/plugin-cache`
- **Turbo cache:** `TURBO_CACHE_DIR=tmp/187-gates/turbo-cache`, removed before the attempt so it held nothing from another worktree; the 11 cached tasks of `test:unit` are `build` tasks the same attempt's `lint:check` populated
- **Status reading:** each gate's status was written to its own `<gate>.status` file by the command right after the gate, and read from that file. No status was read through a pipe.
- **Precondition:** `git status --porcelain` empty; `yarn db:status` exit 0 (`db-status.log`), with `supabase_edge_runtime_openvaa-local` Up

## Final lines

```
lint:check exit=0
format:check exit=0
test:unit exit=0
lint:workflows exit=0
INFRA_TESTS_PASSED=workflows.test.ts,infra-plan-workflow.test.ts,deploy-workflow.test.ts,destroy-workflow.test.ts,check-destroy-plan.test.ts,running-image-digest.test.ts,push-migrations.test.ts,bootstrap-tfvars.test.ts,build-push-image.test.ts,probe-hosted.test.ts,request-loop.test.ts
GUARD_DEPLOYED_SMOKE=passed
TF_FMT_EXIT=0
TF_ROOTS_VALIDATED=8
TF_MODULES_TESTED=frontend-service,github-oidc
TF_EXAMPLE_PLANS=example/aws,example/dns-mail,example/supabase
SC4_LOCAL_GATE_DIFF=empty
PHASE_APP_DIFF=tests/README.md
```

## The repository gates

| Gate | Status | Start (UTC) | End (UTC) | Log | Note |
| --- | --- | --- | --- | --- | --- |
| `yarn lint:check` | `lint:check exit=0` | 03:14:00Z | 03:14:47Z | `lint-check.log` | `No-inline-IAM-policies guard — 58 .tf file(s) read under 'infra'; 0 finding(s).`; the hosted-settings parity guard: `every classified key holds` |
| `yarn format:check` | `format:check exit=0` | 03:14:47Z | 03:15:03Z | `format-check.log` | `All matched files use Prettier code style!` |
| `yarn test:unit` | `test:unit exit=0` | 03:15:03Z | 03:16:33Z | `test-unit.log` | turbo `Tasks: 25 successful, 25 total`; `test:unit:tests` `Test Files 12 passed (12)`, `Tests 323 passed (323)`; `test:unit:infra` `Test Files 11 passed (11)`, `Tests 302 passed (302)` |
| `yarn lint:workflows` | `lint:workflows exit=0` | 03:16:33Z | 03:16:33Z | `lint-workflows.log` | `lint-workflows: actionlint found nothing in 3 workflows` (actionlint 1.7.12 from its digest-pinned image) |

## The test files that ran

The default reporter writes only totals to a file, so each config was run once more, read-only, with the verbose reporter.

- **`INFRA_TESTS_PASSED`**: `node_modules/.bin/vitest run --config infra/vitest.config.ts --reporter=verbose` exit 0 (`unit-infra-files.status`, log `unit-infra-files.log`), `Test Files 11 passed (11)`, `Tests 302 passed (302)`, no failed line. Passing test lines per file: `workflows.test.ts` 29, `infra-plan-workflow.test.ts` 32, `deploy-workflow.test.ts` 37, `destroy-workflow.test.ts` 53, `check-destroy-plan.test.ts` 22, `running-image-digest.test.ts` 13, `push-migrations.test.ts` 7, `bootstrap-tfvars.test.ts` 7, `build-push-image.test.ts` 3, `probe-hosted.test.ts` 96, `request-loop.test.ts` 3. Every one of the nine files the plan names is among them.
- **`GUARD_DEPLOYED_SMOKE=passed`**: `node_modules/.bin/vitest run --config tests/vitest.config.ts --reporter=verbose` exit 0 (`unit-tests-files.status`), `Tests 323 passed (323)`; 16 lines `✓ tests/utils/deployedSmokeGuards.test.ts > …`, no failed line.

## The infrastructure gates (the `infra-validate` job, run locally)

Every `init` used a scratch `TF_DATA_DIR` per root or module (under the session scratch directory, `tf-data-root.txt` names it), so the checkout's `.terraform/` directories, some of them wired to real backends, were not touched. Nothing reached AWS, Supabase or GitHub; only providers came from the plugin cache.

- **`TF_FMT_EXIT=0`**: `terraform fmt -check -recursive -diff infra` (`tf-fmt.log`).
- **`TF_ROOTS_VALIDATED=8`**: `init -backend=false -input=false -lockfile=readonly` and `validate -no-color` of each root the job's glob reaches, every one exit 0 (`tf-roots.list`): `infra/bootstrap`, `infra/envs/example/aws`, `infra/envs/example/dns-mail`, `infra/envs/example/supabase`, `infra/envs/scratch/supabase`, `infra/envs/staging/aws`, `infra/envs/staging/dns-mail`, `infra/envs/staging/supabase`. The seven roots the job requires by name are all among them.
- **`TF_MODULES_TESTED=frontend-service,github-oidc`**: every module with a `tests/` directory, `init -backend=false -input=false` and `test -no-color`: `infra/modules/frontend-service` `Success! 33 passed, 0 failed.`, `infra/modules/github-oidc` `Success! 8 passed, 0 failed.` (`tf-modules.list`).
- **`TF_EXAMPLE_PLANS=example/aws,example/dns-mail,example/supabase`**: `terraform test -verbose` of each example root, with its mocks: each `Success! 1 passed, 0 failed.` (`tf-examples.list`).
- **The settings-types step:** `bash infra/scripts/check-settings-types.sh` exit 0 (`settings-types.status`): `four cases hold … (types kept, JSON groups encoded)`.

## The proofs

- **`SC4_LOCAL_GATE_DIFF=empty`**: `git diff --quiet a7a4222a8 -- tests/playwright.config.ts tests/global-setup.ts tests/tests/support/preflight.ts` exited 0.
- **`PHASE_APP_DIFF=tests/README.md`**: `git diff --name-only ee85b83a3..HEAD -- apps packages tests` printed the one path `tests/README.md`, as expected.

**Outcome:** at `f1602487a0a466fa95925486d87b3d4361525945` all four repository gates exit 0, the infra-validate steps and the three example mock plans pass, the local gate suite is unchanged across the phases, and the phase's only change under `apps`, `packages` and `tests` is `tests/README.md`.

## Re-run 2026-11-15 (after review fixes)

Recorded 2026-11-15 (UTC) by a plan executor that the orchestrator spawned to re-run plan 187-12, because plan 187-15 Task 1 found `PUSH_TREE_MATCHES_HEAD=no`. Sixteen commits after `54e79823b` changed source files under `.github/workflows/` and `infra/` only: the review fixes `49d8ec823` (WR-08) … `6bf28e0e1` (IN-04), `95d1d6ad5`, `d55a94b7a`, and the orchestrator's `1e10dff7f` (one line of `infra/bootstrap/README.md`). Nothing under `apps/`, `packages/` or `tests/` changed. The original readings above are kept. The lines below are the current ones. Logs are in `tmp/187-gates/187-12-rerun/` (ignored).

- **Commit:** `1e10dff7f33c51e3e22e3853e3ec95f1a7e0087d` (HEAD before and after every gate, `head-before.txt`, `head-after.txt` and `test-unit-2.head`). `git status --porcelain` listed only the untracked `.planning/workstreams/deployment/.verification-ledger.json`, before and after.
- **Date:** 2026-11-15 (UTC): lint 20:07:51Z–20:08:41Z, format to 20:09:04Z, the first `test:unit` 20:09:04Z–20:09:57Z, `lint:workflows` 20:09:57Z–20:09:58Z, the second `test:unit` 20:11:06Z–20:12:37Z, Terraform from 20:07Z.
- **Node:** v24.21.0 first on `PATH`. Terraform v1.16.5, with `TF_PLUGIN_CACHE_DIR=$HOME/.terraform.d/plugin-cache` and a scratch `TF_DATA_DIR` per root and per module (`tf-data-root.txt`).
- **Turbo cache:** `TURBO_CACHE_DIR=tmp/187-gates/turbo-cache` was removed before the first attempt. The second `test:unit` used a new, empty `tmp/187-gates/turbo-cache-2`.
- **Status reading:** each status was written to its own `.status` file by the command right after the gate, and read from that file. No status was read through a pipe.
- **Precondition:** `git status --porcelain` lists nothing outside `.planning/`. `yarn db:status` exit 0 (`db-status.log`), every `supabase_*_openvaa-local` container Up, `supabase_edge_runtime_openvaa-local` among them.

### Final lines (re-run)

```
lint:check exit=0
format:check exit=0
test:unit exit=0
lint:workflows exit=0
INFRA_TESTS_PASSED=workflows.test.ts,infra-plan-workflow.test.ts,deploy-workflow.test.ts,destroy-workflow.test.ts,check-destroy-plan.test.ts,running-image-digest.test.ts,push-migrations.test.ts,bootstrap-tfvars.test.ts,build-push-image.test.ts,probe-hosted.test.ts,request-loop.test.ts
GUARD_DEPLOYED_SMOKE=passed
TF_FMT_EXIT=0
TF_ROOTS_VALIDATED=8
TF_MODULES_TESTED=frontend-service,github-oidc
TF_EXAMPLE_PLANS=example/aws,example/dns-mail,example/supabase
SC4_LOCAL_GATE_DIFF=empty
PHASE_APP_DIFF=tests/README.md
TEST_UNIT_FIRST_ATTEMPT=exit 1, one dev-seed test killed at its 15 s spawn timeout while Terraform ran alongside; see below
```

### The first `test:unit` attempt was red

- **Reading:** `yarn test:unit` exit 1 (`test-unit.status`, log `test-unit.log`). Turbo reported `Tasks: 22 successful, 24 total` and `Failed: @openvaa/dev-seed#test:unit`. The one failing test was `tests/checkDriftLinkedGuard.test.ts > check-drift.sh --target local is unchanged > still refuses a PGHOST that is not a loopback address, with its own message`, with `AssertionError: expected null to be 2` at line 248 after 15678 ms. A `null` status from `spawnSync` with `timeout: 15_000` means the child `bash infra/scripts/check-drift.sh` was killed at the timeout. The other 1265 dev-seed tests passed.
- **Not this phase's change:** `infra/scripts/check-drift.sh` was last changed in `b92cae268` (phase 184), and the test file in `7664464d4` (phase 184). `git diff --quiet 54e79823b HEAD -- packages scripts apps/supabase` exit 0, and no phase-187 commit touches `infra/scripts/check-drift.sh`.
- **The contention was the executor's:** the plan runs the four gates one after another. This executor also ran the Terraform loops (8 inits and validates, 2 module test suites and 3 example tests) in parallel with them, on top of turbo's own parallel builds and tests. The refused case does only shell work before its refusal: argument parsing, path resolution, a shimmed `docker info` and a TOML read.
- **In isolation:** `vitest run tests/checkDriftLinkedGuard.test.ts`, three times in a row (`isolate-checkdrift-{1,2,3}.{log,status}`): exit 0 each time, 13 of 13 tests, the refused case in 174, 181 and 160 ms.
- **The gate run again once, as the plan prescribes:** `yarn test:unit` alone, with nothing else running and a fresh turbo cache (`test-unit-2.{log,status}`), exit 0. That reading is `test:unit exit=0` above. Turbo reported `Tasks: 25 successful, 25 total`, dev-seed `80 passed (80)` files and `1266 passed (1266)` tests, `test:unit:tests` 323 of 323, and `test:unit:infra` 11 files with 314 of 314 tests. The gate was run again once, not retried until green.
- **Left open:** the test's 15 s spawn budget is exceeded when the host is heavily loaded. That is outside this phase's files, so it is recorded as a deferred item and not fixed here.

### The repository gates (re-run)

| Gate | Status | Log | Note |
| --- | --- | --- | --- |
| `yarn lint:check` | `lint:check exit=0` | `lint-check.log` | `No-inline-IAM-policies guard — 58 .tf file(s) read under 'infra'; 0 finding(s).`; the hosted-settings parity guard: `every classified key holds` |
| `yarn format:check` | `format:check exit=0` | `format-check.log` | `All matched files use Prettier code style!` |
| `yarn test:unit` | `test:unit exit=0` (second attempt) | `test-unit-2.log` | turbo `Tasks: 25 successful, 25 total` |
| `yarn lint:workflows` | `lint:workflows exit=0` | `lint-workflows.log` | `lint-workflows: actionlint found nothing in 3 workflows` |

### The test files that ran (re-run)

- **`INFRA_TESTS_PASSED`:** `node_modules/.bin/vitest run --config infra/vitest.config.ts --reporter=verbose` exit 0 (`unit-infra-files.status`), `Test Files 11 passed (11)`, `Tests 314 passed (314)`, no failed test. Passing test lines per file: `workflows.test.ts` 29, `infra-plan-workflow.test.ts` 33, `deploy-workflow.test.ts` 41, `destroy-workflow.test.ts` 53, `check-destroy-plan.test.ts` 24, `running-image-digest.test.ts` 13, `push-migrations.test.ts` 12, `bootstrap-tfvars.test.ts` 7, `build-push-image.test.ts` 3, `probe-hosted.test.ts` 96, `request-loop.test.ts` 3. The nine files the plan names are all among them.
- **`GUARD_DEPLOYED_SMOKE=passed`:** `node_modules/.bin/vitest run --config tests/vitest.config.ts --reporter=verbose` exit 0 (`unit-tests-files.status`), `Tests 323 passed (323)`, with 16 lines `✓ tests/utils/deployedSmokeGuards.test.ts > …`.

### The infrastructure gates (re-run)

- **`TF_FMT_EXIT=0`:** `terraform fmt -check -recursive -diff infra` (`tf-fmt.log`).
- **`TF_ROOTS_VALIDATED=8`:** `init -backend=false -input=false -lockfile=readonly` and `validate -no-color`, each exit 0 (`tf-roots.list`), for `infra/bootstrap`, `infra/envs/example/aws`, `infra/envs/example/dns-mail`, `infra/envs/example/supabase`, `infra/envs/scratch/supabase`, `infra/envs/staging/aws`, `infra/envs/staging/dns-mail` and `infra/envs/staging/supabase`.
- **`TF_MODULES_TESTED=frontend-service,github-oidc`:** `infra/modules/frontend-service` `Success! 33 passed, 0 failed.` and `infra/modules/github-oidc` `Success! 11 passed, 0 failed.`. The review fixes added 3 cases to github-oidc, which had 8.
- **`TF_EXAMPLE_PLANS=example/aws,example/dns-mail,example/supabase`:** `terraform test -verbose` with mocks, each `Success! 1 passed, 0 failed.`.
- **The settings-types step:** `bash infra/scripts/check-settings-types.sh` exit 0: `four cases hold … (types kept, JSON groups encoded)`.

### The proofs (re-run)

- **`SC4_LOCAL_GATE_DIFF=empty`:** `git diff --quiet a7a4222a8 -- tests/playwright.config.ts tests/global-setup.ts tests/tests/support/preflight.ts` exit 0.
- **`PHASE_APP_DIFF=tests/README.md`:** `git diff --name-only ee85b83a3..HEAD -- apps packages tests` printed the one path `tests/README.md`.

**Outcome (re-run):** at `1e10dff7f33c51e3e22e3853e3ec95f1a7e0087d` all four repository gates exit 0 (`test:unit` on its second run, the first having timed out under load the executor added). The infra-validate steps and the three example mock plans pass, the local gate suite is unchanged, and the phase's only change under `apps`, `packages` and `tests` is still `tests/README.md`.
