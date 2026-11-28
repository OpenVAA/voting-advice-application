---
phase: 190-multi-deployment-bootstrap
plan: "02"
subsystem: infra
tags: [deployment-map, resolver, workflows, jq]

requires:
  - phase: 190
    provides: "190-01 baseline (557 passed / 6 failed after 190-01)"
provides:
  - "infra/bootstrap/deployments.auto.tfvars.json: the deployment map, staging's entry only"
  - "infra/scripts/resolve-deployment.sh: modes deploy, destroy, plan; the eighteen-line contract and deployments= JSON for plan mode"
  - "infra/scripts/resolve-deployment.test.ts: 51 cases, real-map staging pin"
affects: [190-04, 190-07, 190-08, 190-09]

actuals:
  tasks: 2
  commits: 3
plan_head_before: 3bd4a2239
plan_head_after: a4209b4dd

tech-stack:
  added: []
  patterns:
    - "refusal line written to fd 3 (dup of stdout), so a refuse() inside a command substitution still reaches the caller and set -e ends the script"

key-files:
  created:
    - infra/bootstrap/deployments.auto.tfvars.json
    - infra/scripts/resolve-deployment.sh
    - infra/scripts/resolve-deployment.test.ts
  modified:
    - .gitignore

key-decisions:
  - "190-02: .gitignore gains one negation, !infra/bootstrap/deployments.auto.tfvars.json, right after *.auto.tfvars.json; every other auto-loaded variable file and all state stay ignored"
  - "190-02: destroy mode on push matches only deploy-evidence/destroy-<owned key>; on workflow_dispatch it matches exactly as deploy mode (destroy-prefixed refs never match)"
  - "190-02: plan mode refuses --ref and --event, deploy mode refuses --event (usage error, exit 2)"
  - "190-02: every owned key is checked for form (bad_key) before any branch match; keys are read as JSON strings so a key holding a newline cannot split into two lines"
  - "190-02: a map field that would be printed (environment, destroy_environment, domain, iam_name_prefix) holding a newline or CR is bad_map, so no value can inject a second GITHUB_OUTPUT line"
  - "190-02: an ambiguous match names the keys on standard error; stdout carries only failed=ambiguous"

requirements-completed: []

duration: 15min
completed: 2026-11-24
---

# Phase 190 Plan 02: Deployment map and resolver Summary

**The committed deployment map with staging's entry, and a credential-free bash + jq resolver that names exactly one owned deployment from repository id and ref (or lists the owned ones for plans) and derives every staging literal the three workflows hard-code today.**

## Performance

- Started: 2026-11-24T15:00Z (approx.)
- Completed: 2026-11-24T15:15Z
- Tasks: 2 (Task 2 TDD: RED commit, then GREEN)

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | f943bfc05 | feat(190-02): add the deployment map with staging's entry |
| 2 (RED) | e469a01bf | test(190-02): add failing tests for the deployment resolver |
| 2 (GREEN) | a4209b4dd | feat(190-02): resolve a run's deployment from the map |

## Records

- RED: 51/51 failing (script absent). GREEN: `yarn test:unit:infra resolve-deployment` 51 passed.
- Real map: `--mode deploy --repository-id 546467466 --ref deploy/staging` prints the eighteen lines, pinned with `toBe` (deploy role `arn:aws:iam::471112560111:role/openvaa/openvaa-staging-deploy`, plan role `.../openvaa-plan`, topic `arn:aws:sns:eu-north-1:471112560111:openvaa-staging-frontend-deployments`, cluster `openvaa-staging`, service `openvaa-staging-frontend`, `destroy_confirm=destroy staging aws`); the destroy push from `deploy-evidence/destroy-staging` prints the same lines.
- `--repository-id 1468971368 --ref deploy/nuorten-2027`: exit 1, `failed=no_owned_entry`. Plan mode on the real map: `deployments=` array of length 1.
- `yarn test:unit:infra`: 608 passed / 6 failed (557 + 51; the same six host-only `workflow-errexit.test.ts` failures as the baseline).
- `yarn format:check` green; `eslint` on the test file clean; `bash -n` clean; no `set -x`.

**E2E:** no local E2E project's spec, fixture, route or helper touched; no targeted run due; project deltas 0 against `tests/e2e-runs/191-06-full` (742 passed).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The map file was ignored by .gitignore**
- **Found during:** Task 1
- **Issue:** `.gitignore` ignores `*.auto.tfvars.json` (local/secret variable files), so `git add` refused the map.
- **Fix:** one negation line `!infra/bootstrap/deployments.auto.tfvars.json` (with a one-line comment) directly after the pattern. Checked: `x.auto.tfvars.json` and `terraform.tfstate` under `infra/bootstrap` stay ignored.
- **Files modified:** .gitignore
- **Commit:** f943bfc05

**2. [Rule 1 - Bug] Refusals inside command substitutions were swallowed (found in GREEN)**
- **Issue:** `refuse` printed `failed=` to stdout, which `$(...)` captured (owned-key and tfvars reads).
- **Fix:** `exec 3>&1` and `refuse` writes to fd 3; the subshell's exit 1 fails the assignment and `set -e` ends the script with 1.
- **Commit:** a4209b4dd

**3. [Lint] func-style:** the test's argument helpers became function declarations (eslint `func-style`).

Not added: the `DEPLOY_ENVIRONMENT` comparison mentioned in PATTERNS; the plan's interface contract does not include it, so it is left to the workflow plans.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: infra/bootstrap/deployments.auto.tfvars.json, infra/scripts/resolve-deployment.sh, infra/scripts/resolve-deployment.test.ts
- FOUND commits: f943bfc05, e469a01bf, a4209b4dd
