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
