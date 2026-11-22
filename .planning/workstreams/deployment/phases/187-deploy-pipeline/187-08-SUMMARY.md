---
phase: 187-deploy-pipeline
plan: "08"
subsystem: infra
tags: [github-actions, oidc, workflow-guards, terraform-plan, actionlint]
status: complete

requires:
  - phase: 187-06
    provides: "`infra/scripts/running-image-digest.sh` and its `running_image_digest=` result line"
  - phase: 187-07
    provides: "`tests/plan.tftest.hcl` in each of the three example roots, planned offline with mock providers"
provides:
  - "`.github/workflows/infra-plan.yml`: jobs `checks` (credential-free), `plan` (same-repository pull requests, read-only role, `-lock=false`), `wrong-subject` (pushes, no environment)"
  - "`infra/scripts/workflowGuards.ts`: `SHARED_RULES`, `loadWorkflow`, `parseWorkflow`, `sharedViolations`, `workflowJobs`, `jobSteps`, `triggerEvents`, `RUNNER_LABELS`"
  - "`infra/scripts/infra-plan-workflow.test.ts`: one red copy per shared rule, and the guards on infra-plan.yml's three jobs"
  - "`js-yaml` (`catalog:`) in the root `devDependencies`"
affects: [187-09, 187-10, 187-18, 187-19, 187-20, deploy.yml, destroy.yml]

actuals:
  tokens: 9528
  tasks: 2
  commits: 2
plan_head_before: 76698892ce80e56032b42c6c0e67481f4c9448d0
plan_head_after: b8a587f9a0b7d4c3ad8576abc08e307bf9fa5f00

tech-stack:
  added: [js-yaml (root devDependency, existing catalog entry ^5.4.2, already in the lockfile)]
  patterns:
    - "A workflow is guarded by a unit test that shows each rule red on a mutated copy of the real file's text before the real file's empty violation list is trusted"
    - "Violations are strings `<rule-id>: <where and what>`, so a test asserts the specific rule that fired"

key-files:
  created:
    - .github/workflows/infra-plan.yml
    - infra/scripts/workflowGuards.ts
    - infra/scripts/infra-plan-workflow.test.ts
  modified:
    - package.json
    - yarn.lock

key-decisions:
  - "The run-script rule (`no-expression-in-run`) flags ANY `${{ }}` expression inside a `run:`, not only `secrets.*`: it enforces the prohibition on secret and event text in scripts in its strictest, simplest form; values reach scripts through `env`. deploy.yml and destroy.yml must route step outputs through `env` too"
  - "Each violation starts with a rule id from the exported `SHARED_RULES`, and the test fails if a rule has no red copy"
  - "The `terraform show -json` prohibition is asserted on infra-plan.yml only, not added to the shared rules: a later workflow may legitimately write a JSON plan into `$RUNNER_TEMP` for `jq`"
  - "The wrong-subject job fetches the OIDC token with `curl -o` into `$RUNNER_TEMP` and reads it with `jq` from the file (no pipe), removes the token, response and claims files through an EXIT trap, and fails closed when `AWS_PLAN_ROLE_ARN` is empty"

patterns-established:
  - "Infrastructure workflows: `permissions: {}` at the top, per-job permissions, actions pinned by SHA with a `# vX` comment, `ubuntu-24.04`/`ubuntu-24.04-arm` only, checkout with `persist-credentials: false`, plan files under `$RUNNER_TEMP`"

requirements-completed: []

coverage:
  - id: D1
    description: "The shared rules exist as a library and each is red on a mutated copy of infra-plan.yml"
    requirement: PIPE-03
    verification:
      - kind: unit
        ref: "vitest infra-plan-workflow: 12 `is red on <rule>` cases plus the no-with-block checkout case pass; `finds no violation in infra-plan.yml` passes; 32/32"
        status: pass
    human_judgment: false
  - id: D2
    description: "The checks job formats, validates every root, tests every module and mock-plans the three example roots, failing when one is not reached"
    requirement: INFRA-19
    verification:
      - kind: other
        ref: "the example step's loop run locally offline (scratch TF_DATA_DIR): 3 roots, each 'Success! 1 passed, 0 failed', exit 0; guard test asserts the required list"
        status: pass
    human_judgment: false
  - id: D3
    description: "The plan job runs only for a same-repository pull request, on the read-only role, with -lock=false and the running digest, and prints the plan with show -no-color to the log and step summary"
    requirement: PIPE-02
    verification:
      - kind: unit
        ref: "vitest infra-plan-workflow, describe 'the plan job of infra-plan.yml' (6 cases); actionlint 1.7.12 by digest: no finding"
        status: pass
    human_judgment: false
  - id: D4
    description: "The wrong-subject job asks STS for both roles with a branch subject and passes only when both refuse"
    requirement: PIPE-01
    verification:
      - kind: unit
        ref: "vitest infra-plan-workflow, describe 'the wrong-subject job of infra-plan.yml' (6 cases); the JWT decode and error-code extraction checked locally with a fabricated token"
        status: pass
    human_judgment: false
  - id: D5
    description: "The read-only plan role is used by the pull-request plan (SUPA-08 counterpart on the AWS root)"
    requirement: SUPA-08
    verification:
      - kind: other
        ref: "static only; observed on the hosted pipeline at plans 187-18..20"
        status: pending
    human_judgment: false

duration: 7min
completed: 2026-11-15
---

# Phase 187 Plan 08: The pull-request workflow and the shared workflow guards Summary

**`infra-plan.yml` with a credential-free checks job that mock-plans the three example roots, a fork-skipping lock-free plan job on the read-only role, and a wrong-subject STS proof on evidence pushes, all guarded by twelve shared rules each shown red before trusted green.**

## Shared rules and their red cases

`sharedViolations(doc, text)` in `infra/scripts/workflowGuards.ts` returns `<rule-id>: <message>` strings. Each rule's red case in `infra/scripts/infra-plan-workflow.test.ts` mutates the real file's text (the mutation helper throws if nothing was replaced, so no red case is a no-op):

| Rule id | Kind | Red case (mutation of infra-plan.yml) |
|---|---|---|
| `top-level-permissions-empty` | structural | the `permissions: {}` line removed |
| `job-permissions-explicit` | structural | the checks job's `permissions:` block removed |
| `action-pinned-by-sha` | structural | `actions/checkout@<sha>` becomes `actions/checkout@v7` |
| `action-tag-comment` | text | the ` # v7` comment removed from a `uses:` line |
| `no-pull-request-target` | structural | `pull_request:` becomes `pull_request_target:` |
| `no-artifact-upload` | structural | a step using `actions/upload-artifact@<sha>` inserted |
| `no-privileged-key-name` | text | a comment naming a service-role key appended |
| `no-expression-in-run` | structural | a `run:` holding `${{ secrets.ALERT_EMAIL }}` |
| `id-token-only-where-assumed` | structural | `id-token: write` added to the checks job (no assume step) |
| `checkout-no-persisted-credentials` | structural | `persist-credentials: true`; second case: the `with:` block removed |
| `runner-label` | structural | `runs-on: ubuntu-latest` |
| `plan-file-in-runner-temp` | text | a `run:` writing `-out=tfplan` |

A test also fails when a rule in `SHARED_RULES` has no red copy. The real file yields `[]`. That covers the `id-token` exemptions (the plan job's credentials action, and the wrong-subject script reading `ACTIONS_ID_TOKEN_REQUEST_URL`) and the `-out="$RUNNER_TEMP/tfplan"` prefix.

## Performance

- **Duration:** about 7 min
- **Started:** 2026-11-15T02:33:45Z
- **Completed:** 2026-11-15T02:40:54Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- `checks` (`ubuntu-24.04`, `contents: read`, 20 min): fmt check, the root validation loop and module test loop copied from `infra-validate`, and the example step running `init -backend=false -input=false -lockfile=readonly` and `test -verbose -no-color` for each `infra/envs/example/*/tests/`, failing with `::error::` when aws, dns-mail or supabase is missing.
- `plan`: `if` on `pull_request` and `head.repo.full_name == github.repository`; `contents: read` plus `id-token: write`; configure-aws-credentials v6.3.0 with `vars.AWS_PLAN_ROLE_ARN`, `allowed-account-ids: "471112560111"`, session `pr-plan-${{ github.run_id }}`; the `digest` step running `running-image-digest.sh` into `$RUNNER_TEMP`; `init -lockfile=readonly`; a plan with `-lock=false -detailed-exitcode -var "image_digest=$DIGEST" -out="$RUNNER_TEMP/tfplan"` that prints `plan_exit=` and accepts 0 or 2 (`TF_VAR_alert_email` comes from `secrets.ALERT_EMAIL` via `env`); `show -no-color` to the log and to a fenced block in `$GITHUB_STEP_SUMMARY`; an `if: always()` cleanup step.
- `wrong-subject`: runs only on `push`, has no environment, no checkout and only `id-token: write`. It masks the token and keeps it in a `$RUNNER_TEMP` file, which is removed. It prints `token_subject=`, `deploy_role_assume_status=`, `deploy_role_error=`, `plan_role_assume_status=` and `plan_role_error=`, and passes only when both statuses are non-zero with named codes.
- actionlint 1.7.12 (container by digest, bundled shellcheck) has no finding on infra-plan.yml. The deployed-smoke guard (16/16) finds no remote-seed switch under `.github/`, and the whole infra unit suite passes (161/161).

## Task Commits

1. **Task 1 (tracer): guard library, js-yaml at the root, the checks job.** Commit `07690d24d`. The tracer gate re-ran `<verify>` end to end and it passed: verify=0.
2. **Task 2: the plan job and the wrong-subject job.** Commit `b8a587f9a`.

## Files Created/Modified
- `.github/workflows/infra-plan.yml`: the pull-request workflow (jobs checks, plan, wrong-subject)
- `infra/scripts/workflowGuards.ts`: the shared rules as a violation list
- `infra/scripts/infra-plan-workflow.test.ts`: the red cases and the guards on the three jobs
- `package.json`, `yarn.lock`: `js-yaml: catalog:` in the root devDependencies (one lockfile line, `yarn install --immutable` clean)

## Decisions Made
See `key-decisions` in the frontmatter. The one later plans must know about is `no-expression-in-run`: no `${{ }}` may appear inside any `run:`, including step outputs, so 187-09 and 187-10 route every value through `env`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Critical] The run-script rule is wider than "a secret expression"**
- **Found during:** Task 1
- **Issue:** The prohibition covers secret and event text in scripts. A rule matching `secrets.` alone would let `${{ github.event.pull_request.title }}` through.
- **Fix:** `no-expression-in-run` flags any `${{ }}` inside a `run:`. Its red case still uses a secret expression, as the behavior list asks.
- **Files modified:** infra/scripts/workflowGuards.ts
- **Commit:** 07690d24d

**2. [Rule 2 - Critical] The wrong-subject script fails closed and never pipes the token**
- **Found during:** Task 2
- **Issue:** The research example piped `curl` into `jq` and held the token in a shell variable. The execution rules also say a status is never read through a pipe.
- **Fix:** The token response goes to a `$RUNNER_TEMP` file and `jq -j` writes the token file from it. An EXIT trap removes the response, token and claims files. The script stops with `::error::` when `AWS_PLAN_ROLE_ARN` is empty, or when the token or its claims cannot be read.
- **Files modified:** .github/workflows/infra-plan.yml
- **Commit:** b8a587f9a

**3. [Additive] More exports and test cases than the plan names**
- `SHARED_RULES`, `parseWorkflow`, `workflowJobs`, `jobSteps`, `triggerEvents` and `RUNNER_LABELS` are exported next to `loadWorkflow` and `sharedViolations`, for reuse by 187-09 and 187-10.
- The test adds a second checkout red case (no `with:` block) and an infra-plan.yml-only assertion that no `show -json` appears.

**4. [Rule 3 - Blocking] ESLint findings fixed before the first commit:** an inline type import was split into `import type`, and an arrow `report` was changed to a function declaration (`func-style`).

---

**Total deviations:** 4, none architectural.

## Issues Encountered
- In Task 2, the test's first lookup of the plan step matched the digest step (" plan " appears in its error text). It now matches `terraform -chdir=infra/envs/staging/aws plan `.

## Open items
- No action SHA was missing: checkout, setup-terraform and configure-aws-credentials all come from 187-RESEARCH.md § Standard Stack, and no GitHub API call was made.
- The plan job and the wrong-subject job have not run. They are observed on the hosted pipeline at plans 187-18..20, which need the repository variable `AWS_PLAN_ROLE_ARN` and the secret `ALERT_EMAIL` (created at 187-14).
- The `AccessDenied` code STS returns for a refused subject is still an assumption. The job accepts any named code and prints it.
- REQUIREMENTS.md is unchanged, per the operator notes.

## Next Phase Readiness
- 187-09 and 187-10 can import `sharedViolations` and `loadWorkflow` from `infra/scripts/workflowGuards.ts`, and should add their files to the same actionlint command.

## Self-Check: PASSED
- FOUND: .github/workflows/infra-plan.yml, infra/scripts/workflowGuards.ts, infra/scripts/infra-plan-workflow.test.ts
- FOUND: 07690d24d, b8a587f9a (ancestors of HEAD)
- Acceptance greps: `"js-yaml": "catalog:"` = 1, `^permissions: {}$` = 1, `head.repo.full_name == github.repository` = 1, `GITHUB_STEP_SUMMARY` = 1
