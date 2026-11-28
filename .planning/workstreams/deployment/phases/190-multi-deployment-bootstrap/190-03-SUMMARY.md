---
phase: 190-multi-deployment-bootstrap
plan: "03"
subsystem: infra
tags: [push-migrations, deployed-smoke, deployment-key, PIPE-13]

requires:
  - phase: 190
    provides: "190-02 baseline (infra 608 passed / 6 failed)"
provides:
  - "infra/scripts/push-migrations.sh --deployment <key>: required with --confirmed-ref; key form and length, infra/envs/<key>/supabase/terraform.tfvars, its project_ref = --ref, OPENVAA_DEPLOY_ENVIRONMENT = key, GITHUB_REF = refs/heads/deploy/<key> or deploy-evidence/?*"
  - "tests/tests/utils/deployedTarget.ts: DEFAULT_SMOKE_DEPLOYMENT, readSmokeDeployment, dedicatedSupabaseTfvars, smokeBaseUrl; the gate and requireCredentialOrigin keyed by deployment"
affects: [190-07, 190-12, 190-13]

actuals:
  tasks: 2
  commits: 4
plan_head_before: 1b1ae4965
plan_head_after: f61508ad0

tech-stack:
  added: []
  patterns:
    - "deployment key validated by ^[a-z][a-z0-9-]*$ and length <= 15 before it is used in a path, in bash and in TypeScript alike"

key-files:
  created: []
  modified:
    - infra/scripts/push-migrations.sh
    - infra/scripts/push-migrations.test.ts
    - tests/tests/utils/deployedTarget.ts
    - tests/tests/utils/deployedTarget.test.ts
    - tests/playwright.deployed.config.ts
    - tests/deployed-global-setup.ts
    - tests/tests/deployed/contestant.smoke.ts

key-decisions:
  - "190-03: push-migrations.sh --deployment is validated (form, length, tfvars present) in the typed form too, so a typo is never ignored; the project_ref/environment/ref checks apply only with --confirmed-ref"
  - "190-03: deployedTarget readers take the tfvars path as a required argument (readDedicatedTarget, readPublicOrigin) and requireCredentialOrigin takes the deployment key as a required third argument; runDeployedGate takes an optional deployment that defaults to readSmokeDeployment(env), and global setup passes it explicitly"
  - "190-03: a missing deployment tfvars throws naming its repository-relative path (with the read error as cause)"

requirements-completed: []

duration: 10min
completed: 2026-11-24
---

# Phase 190 Plan 03: push-migrations --deployment and the smoke gate keyed by SMOKE_DEPLOYMENT Summary

**The migration push's confirmed form and the deployed smoke gate now resolve their deployment from a validated key and that key's committed Supabase tfvars, with staging the default and its behaviour unchanged.**

## Performance

- Started: 2026-11-24T15:10Z
- Completed: 2026-11-24T15:20Z
- Tasks: 2, both TDD (RED commit, then GREEN)

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 RED | 1fa60b58f | test(190-03): add failing tests for push-migrations --deployment |
| 1 GREEN | d4f51e340 | feat(190-03): key the migration push's confirmed form by --deployment |
| 2 RED | 703f4a9e6 | test(190-03): add failing tests for the smoke gate keyed by SMOKE_DEPLOYMENT |
| 2 GREEN | f61508ad0 | feat(190-03): key the deployed smoke gate by SMOKE_DEPLOYMENT |

## What was built

**Task 1.** `CONFIRMING_ENVIRONMENT="staging"` is gone; `--deployment <key>` is parsed like `--confirmed-ref`. With `--confirmed-ref` it is required ("--confirmed-ref requires --deployment"), and the script requires the key to match `^[a-z][a-z0-9-]*$` and be at most 15 characters, `$REPO_ROOT/infra/envs/<key>/supabase/terraform.tfvars` to be a readable file whose `project_ref` (read with sed) equals `--ref`, `OPENVAA_DEPLOY_ENVIRONMENT` to equal the key, and `GITHUB_REF` to equal `refs/heads/deploy/<key>` (string comparison) or match `refs/heads/deploy-evidence/?*`. Each refusal is exit 2 "...; nothing was pushed" naming the values. The header describes the confirmed form for any deployment, the environment approval for a deployment with its own GitHub Environment, and the no-environment case as an accepted risk listed in infra/README.md. The test tree holds staging's and a second deployment `other`'s tfvars with distinct refs; 12 new cases (other passes; no --deployment; Bad_Key / 16 chars / missing tfvars in both forms; mismatched environment; another deployment's branch; ref not the tfvars' project_ref; --help).

RED: 19 failed / 19 passed. GREEN: 38 passed.

**Task 2.** `DEDICATED_SUPABASE_TFVARS` and `DEFAULT_SMOKE_BASE_URL` are replaced by `DEFAULT_SMOKE_DEPLOYMENT = 'staging'`, `readSmokeDeployment(env)`, `dedicatedSupabaseTfvars(key)` and `smokeBaseUrl(env, repoRoot)`. The tfvars readers and every error text name the path of the key in use. `playwright.deployed.config.ts` sets `baseURL: smokeBaseUrl(process.env, repoRoot)`; global setup and `contestant.smoke.ts` derive the key from `readSmokeDeployment(process.env)`. The module still reads no process environment of its own. `caller-limit.smoke.ts` reads no tfvars and needed no change; `deployedSmokeGuards.test.ts` imports no renamed export and needed no change (its `requireCredentialOrigin(baseURL, ` pin still holds).

RED: 32 failed / 139 passed. GREEN: 171 passed (baseline 132 + the new cases).

## Verification

- `yarn test:unit:infra push-migrations`: 38 passed.
- `yarn test:unit:infra`: 620 passed / 6 failed; the six are the baseline workflow-errexit host-only failures (608 + 12 new).
- `yarn test:unit:tests deployedTarget deployedSmokeGuards`: 171 passed.
- `yarn test:unit:tests`: 459 passed / 1 failed. The failure is `tcpForward.test.ts` "gives up on an unreachable upstream in BOUNDED time" (409 ms against a 550 ms floor), host-only, independent of the touched files, logged in deferred-items.md.
- `grep -c CONFIRMING_ENVIRONMENT infra/scripts/push-migrations.sh` = 0; `grep -v '^#' ... | grep -c deploy/staging` = 0; `bash infra/scripts/push-migrations.sh --help` exits 0 and names `--deployment <key>`.
- No staging tfvars path or URL outside comments in deployedTarget.ts, the deployed config, global setup or the deployed specs.
- Deployed config list with an empty environment: `env -i PATH="$PATH" HOME="$HOME" npx playwright test --config tests/playwright.deployed.config.ts --list` prints the three smoke tests (caller-limit, contestant, voter), `Total: 3 tests in 3 files`. With `SMOKE_DEPLOYMENT=nosuchkey` the config refuses to load naming `infra/envs/nosuchkey/supabase/terraform.tfvars`.
- `yarn format:check`: pass. `yarn lint:check`: exit 1, only on 11 comment-hygiene violations in `infra/scripts/resolve-deployment.sh` (plan 190-02's file); no file of this plan is flagged. Logged in deferred-items.md.

## E2E

Consumers of `deployedTarget` (`grep -rl deployedTarget tests --include=*.ts | grep -v e2e-runs`): `tests/playwright.deployed.config.ts`, `tests/deployed-global-setup.ts`, `tests/tests/deployed/caller-limit.smoke.ts`, `tests/tests/deployed/contestant.smoke.ts`, `tests/tests/utils/deployedTarget.test.ts`, `tests/tests/utils/deployedSmokeGuards.test.ts`. No local E2E project of `tests/playwright.config.ts` imports the changed files, so no targeted run is due.

E2E delta: 0 tests in every project against `tests/e2e-runs/191-06-full` (742 passed); no title changed. The phase-end full run covers the tree; the deployed smoke run itself is exercised by the operator in plan 190-12.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] lint `preserve-caught-error` on the new tfvars reader**
- **Found during:** Task 2
- **Fix:** the rethrown error naming the missing tfvars carries the read error as `cause`.
- **Files modified:** tests/tests/utils/deployedTarget.ts
- **Commit:** f61508ad0

### Scope notes

- `caller-limit.smoke.ts` and `deployedSmokeGuards.test.ts` are listed in the plan's files but needed no change (see Task 2).
- `.github/workflows/deploy.yml` still calls the confirmed form without `--deployment`; the script now refuses that with exit 2. The plan's interface assigns the workflow change to 190-07; a staging deploy would stop at the migration step until then. Logged in deferred-items.md.
- `tests/README.md` still documents the staging default without `SMOKE_DEPLOYMENT`; left for the docs plan. Logged in deferred-items.md.

## Threat Flags

None beyond the plan's register: T-190-10 and T-190-13 are mitigated by the key regex and length check (no `/` or `.`) before any path use, tfvars existence under the repository root, and the project_ref, environment and branch checks; T-190-12 by the validated key and the base URL defaulting to the tfvars' public_origin, with the credential-origin check still requiring it.

## Self-Check: PASSED

- Files: all seven modified files exist; 190-03-SUMMARY.md and deferred-items.md exist.
- Commits: 1fa60b58f, d4f51e340, 703f4a9e6, f61508ad0 present in `git log`.
