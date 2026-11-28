---
phase: 187-deploy-pipeline
plan: "11"
subsystem: infra
tags: [github-actions, workflow-guards, actionlint, documentation, secret-scan]
status: complete

requires:
  - phase: 187-08
    provides: "`infra/scripts/workflowGuards.ts` (`parseWorkflow`, `workflowJobs`, `jobSteps`)"
  - phase: 187-09
    provides: "`.github/workflows/deploy.yml` (the gated job, the `smoke` and `served-build` steps)"
  - phase: 187-10
    provides: "`.github/workflows/destroy.yml` (two `staging-destroy` jobs)"
provides:
  - "`infra/scripts/workflows.test.ts`: 29 cross-workflow guards (apply-root, no-main-push, shared-concurrency, deploy-role-arn, environments), each with red copies"
  - "Root script `yarn lint:workflows` (`scripts/lint-workflows.mjs`): actionlint 1.7.12 by digest over infra-plan.yml, deploy.yml, destroy.yml; exit 0/1, 2 when docker cannot run it"
  - "`infra/README.md` § The deploy pipeline, the corrected Prerequisites bullet and § Order paragraph, four new Guards rows"
  - "`tests/README.md`: workstation SMOKE_EXPECTED_SHA from the tip of deploy/staging; § In the pipeline names the step, the removed output and the /api/health re-read"
  - "`.github/trufflehog-exclude-paths.txt`: two exact-path exclusions of run 43405262494"
affects: [187-13, 187-15, 187-17, 187-18, 187-23, 189]

actuals:
  tokens: 17100
  tasks: 3
  commits: 4
plan_head_before: b2d4fc644a8e13f120f727804782bb7fc4be5109
plan_head_after: 924b7f94942a23aa43335c17da8d767a7fb0aa88

tech-stack:
  added: []
  patterns:
    - "A cross-file workflow guard reads every file under .github/workflows/ and counts a Terraform command only where `terraform` is the command word of a piece of a logical line, so an echo naming one is not one"
    - "Every guard is a function over in-memory file texts, run green on the real files and red on a copy with one mutation that must change the text"
    - "The deploy role ARN is derived from the bootstrap tfvars (account, iam_path, name_prefix, deploy_environment), never restated"

key-files:
  created:
    - infra/scripts/workflows.test.ts
    - scripts/lint-workflows.mjs
  modified:
    - package.json
    - infra/README.md
    - tests/README.md
    - .github/trufflehog-exclude-paths.txt

key-decisions:
  - "apply-root scans every workflow, main.yaml and the claude workflows included, and also asserts the exact list of mutating commands it found (one apply in deploy.yml; two plan -destroy and one apply in destroy.yml), so the rule cannot pass vacuously"
  - "no-main-push also fails a push trigger with no branch filter, a `branches-ignore` filter or the bare `on: push` form, each of which matches main; negative `!` patterns are skipped because they only exclude"
  - "lint-workflows.mjs maps docker's own status 125 (the daemon could not run the container) to 2, like a docker that cannot start, so a daemon failure never reads as an actionlint finding"
  - "The workstation read uses `git ls-remote --exit-code`, so a missing deploy/staging is status 2 rather than an empty SHA; the README adds that after a deploy from a deploy-evidence/* branch that branch's tip is the one to read"
  - "The exclusion header records the two findings' lines (98 and 37) as lines of run 43405262494's tree; in this tree the fixtures sit a few lines earlier, and the exclusions are by path, so they hold either way"

patterns-established:
  - "Cross-workflow guards live in infra/scripts/workflows.test.ts; per-file rules stay in each workflow's own test"

requirements-completed: []

coverage:
  - id: E1
    description: "No workflow runs a Terraform apply, destroy or plan -destroy outside -chdir=infra/envs/staging/aws; red copies: deploy applies example/aws, destroy plans the Supabase root, a cd-then-apply in infra-plan.yml, a destroy loop in main.yaml"
    requirement: INFRA-19
    verification:
      - kind: unit
        ref: "vitest workflows.test.ts describe 'apply-root' (8 cases)"
        status: pass
    human_judgment: false
  - id: E2
    description: "No push branch pattern of deploy.yml or destroy.yml can match main (no main, no bare * or **, none starting with *, no unfiltered push); red copies for each"
    requirement: PIPE-10
    verification:
      - kind: unit
        ref: "vitest workflows.test.ts describe 'no-main-push' (7 cases)"
        status: pass
      - kind: other
        ref: "branch policy read back and no main trigger observed in the hosted plans"
        status: pending
    human_judgment: false
  - id: E3
    description: "deploy.yml and destroy.yml share concurrency group staging-aws with cancel-in-progress false"
    requirement: PIPE-07
    verification:
      - kind: unit
        ref: "vitest workflows.test.ts describe 'shared-concurrency' (4 cases)"
        status: pass
    human_judgment: false
  - id: E4
    description: "The literal deploy role ARN of infra-plan.yml and destroy.yml equals the one the bootstrap tfvars imply; red copies for another role, another account and a changed deploy_environment"
    requirement: PIPE-01
    verification:
      - kind: unit
        ref: "vitest workflows.test.ts describe 'deploy-role-arn' (6 cases)"
        status: pass
      - kind: other
        ref: "the deploy job assumes the same role on the same push (187-18)"
        status: pending
    human_judgment: false
  - id: E5
    description: "staging named by deploy.yml only, staging-destroy by destroy.yml only, none by infra-plan.yml"
    requirement: PIPE-10
    verification:
      - kind: unit
        ref: "vitest workflows.test.ts describe 'environments' (4 cases)"
        status: pass
    human_judgment: false
  - id: G4
    description: "yarn lint:workflows runs actionlint 1.7.12 by digest on exactly the three pipeline workflows"
    requirement: PIPE-10
    verification:
      - kind: other
        ref: "yarn lint:workflows exit 0, 'actionlint found nothing in 3 workflows'; `-version` of the pinned image prints 1.7.12; a planted bad workflow in the scratchpad gave exit 1 with two file:line:col findings"
        status: pass
    human_judgment: false
  - id: G3
    description: "Secret scan excludes exactly the two measured false positives of run 43405262494 by exact path"
    requirement: SUPA-08
    verification:
      - kind: other
        ref: "grep -qxF of both lines passes; scan observed green at 187-15"
        status: pending
    human_judgment: false
  - id: G5
    description: "infra/README.md documents the pipeline (triggers, order, environments and all eight staging settings, PR and destroy workflows, digest, red runs, recovery, evidence branches, accepted risks); tests/README.md matches the digest and served-build model"
    requirement: PIPE-10
    verification:
      - kind: other
        ref: "prettier --check clean; heading count 1; 'default branch only' 0; 'shows no change' 0; lint:workflows 2; image_tag in tests/README.md 0; refs/heads/deploy/staging 1"
        status: pass
    human_judgment: true

duration: 8min
completed: 2026-11-15
---

# Phase 187 Plan 11: Cross-workflow guards, the workflow lint and the pipeline's documentation Summary

**`yarn lint:workflows` exits 0: actionlint 1.7.12, pinned by digest and with its shellcheck, finds nothing in `infra-plan.yml`, `deploy.yml` and `destroy.yml`. `infra/scripts/workflows.test.ts` adds five cross-workflow guards (29 cases, every rule shown red on a mutated copy). `infra/README.md` now documents the whole pipeline, `tests/README.md` reads the workstation SHA from `deploy/staging`, and the secret scan excludes its two measured fixtures by exact path.**

## The guard list

| Rule | What fails it | Red copies |
| --- | --- | --- |
| `apply-root` | Any `terraform` `apply`, `destroy` or `plan -destroy` in any file under `.github/workflows/` without `-chdir=infra/envs/staging/aws` | deploy applies `infra/envs/example/aws`; destroy plans `-destroy` of `infra/envs/staging/supabase`; `cd infra/envs/example/aws && terraform apply` in infra-plan.yml; `terraform -chdir="$root" destroy` in main.yaml |
| `no-main-push` | A push pattern of deploy.yml or destroy.yml containing `main`, equal to `*` or `**`, or starting with `*`; a push with no branch filter, with `branches-ignore`, or as bare `on: push` | `main` added to each; `**`; `*/staging`; destroy.yml's filter removed |
| `shared-concurrency` | deploy.yml or destroy.yml not in group `staging-aws`, or `cancel-in-progress` other than `false` | `cancel-in-progress: true`; a group of its own |
| `deploy-role-arn` | A literal role ARN in infra-plan.yml or destroy.yml other than `arn:aws:iam::<aws_account_id>:role<iam_path><name_prefix>-<deploy_environment>-deploy` from `infra/bootstrap/terraform.tfvars`, or no literal ARN at all | `openvaa-staging-deployer`; another account; tfvars `deploy_environment = "prod"` |
| `environments` | deploy.yml naming anything but `staging`, destroy.yml anything but `staging-destroy`, infra-plan.yml any environment | plan job names `staging`; destroy's apply job names `staging`; deploy names `staging-destroy` |

The guard also checks that it is not vacuous. It lists the mutating commands it found: one apply in deploy.yml, then two `plan -destroy` and one apply in destroy.yml. An `echo "::error::terraform apply exited …"` is not counted as a command.

## Performance

- **Duration:** about 8 min
- **Started:** 2026-11-15T03:03:51Z
- **Completed:** 2026-11-15T03:11:14Z
- **Tasks:** 3
- **Files modified:** 6 (2 created)

## Accomplishments
- Verification:
  - Task 1: `vitest run --config infra/vitest.config.ts workflows` passes 29/29, `yarn lint:workflows` exits 0, and Prettier is clean. A strict `tsc --noEmit` of the test (bundler resolution) is clean.
  - The whole `yarn test:unit:infra` suite passes 302/302 in 11 files.
  - `assert-comment-hygiene` and `assert-unit-test-coverage` exit 0.
- `infra/README.md`:
  - The new § The deploy pipeline covers:
    - what starts a deploy (and that a push to `main` does not);
    - the push of `deploy-evidence/destroy-staging`, which also starts `infra-plan.yml`, harmlessly;
    - the gated order (build by digest, saved and printed plan, migrations, functions, apply, stable check, smoke run, `/api/health` re-read, failure alert);
    - an environment table with all eight `staging` settings by name, stating that `staging-destroy` holds none;
    - the repository variable and secret, and that the environments must exist before any push that names them;
    - the pull-request workflow (`checks`, `plan` with `-lock=false` and the fork skip, `wrong-subject`) and the destroy workflow's two approvals;
    - hand plans through `running-image-digest.sh`;
    - a table of what to read for each alert stage;
    - recovery (`force-unlock`, no hand apply while a run waits or runs, waiting runs replaced, fix forward);
    - source-only evidence branches;
    - the five accepted risks.
  - § Prerequisites now names `deploy/staging` and `deploy-evidence/*` for both environments.
  - § Order describes the first digest plan, a rollout of the same image.
  - § Guards gains four rows: the deploy-role policies, the example mock plans, the workflow guards and `yarn lint:workflows`.
  - § Example environment says the pull-request workflow plans the template with mock providers and that no workflow applies it.
- `tests/README.md`:
  - The `SMOKE_EXPECTED_SHA` row and workstation item 1 now read the tip of `deploy/staging` with `git ls-remote --exit-code`, printing `ls_remote_exit=`. `image_tag` is gone.
  - § In the pipeline names the `smoke` step, its `$RUNNER_TEMP/smoke-output` and that directory's removal, that nothing is uploaded, and the `/api/health` re-read that follows.

## Task Commits

1. **Task 1 (tracer): cross-workflow guards and `yarn lint:workflows`.** `0d13a1108` (test), then `013775349` (feat). The tracer gate re-ran `<verify>` end to end and it passed.
2. **Task 2: `infra/README.md`.** `d10890314`
3. **Task 3: `tests/README.md` and the secret-scan exclusions.** `924b7f949`

## Files Created/Modified
- `infra/scripts/workflows.test.ts`: the cross-workflow guards
- `scripts/lint-workflows.mjs`: the pinned actionlint run (read-only mount, inherited stdio)
- `package.json`: `"lint:workflows": "node scripts/lint-workflows.mjs"`
- `infra/README.md`: § The deploy pipeline and the corrected sections
- `tests/README.md`: the SHA row, workstation item 1, § In the pipeline
- `.github/trufflehog-exclude-paths.txt`: two entries and the extended header

## Decisions Made
See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Critical] The guards also fail the forms of a push trigger that match every branch**
- **Found during:** Task 1
- **Issue:** The plan's behavior list checks only the patterns that are present. A push with no `branches` filter, a `branches-ignore` filter, or the bare `on: push` form also matches `main`, and a pattern check alone would pass them.
- **Fix:** `mainPushViolations` reports each of these forms, and a red copy with destroy.yml's filter removed proves it.
- **Commit:** 0d13a1108

**2. [Rule 2 - Critical] `lint-workflows.mjs` maps docker's status 125 to 2**
- **Issue:** When the docker CLI starts but the daemon cannot run the container, docker exits 125. Passed through unchanged, that status would read as an actionlint result.
- **Fix:** Status 125 exits 2, the same as a docker that cannot start, and the header documents it.
- **Commit:** 013775349

**Total deviations:** 2 auto-fixed. **Impact:** both make the guard and the lint stricter. Scope is unchanged.

## Issues Encountered
- The research cites the two trufflehog findings at lines 98 and 37. In this tree the localhost callback fixtures sit a few lines earlier, around 95-96 of `mailedLink.test.ts`. The exclusions are by exact path, so they do not depend on the line, and the header records the lines as lines of run 43405262494's tree. Plan 187-15 observes the scan.
- `tests/README.md` changed, which moves the tree past plan 186-08's reference run. Plan 187-13 records that handoff.

## Requirements
No requirement is marked complete, because the operator notes reserve that for the hosted plans 14–25. The `coverage` frontmatter lists what this plan proves by unit test or document for PIPE-10, INFRA-19, PIPE-07, PIPE-01 and SUPA-08. The hosted observations are still pending.

## User Setup Required
None. `yarn lint:workflows` needs Docker locally.

## Next Phase Readiness
- Plan 187-13's full gate can add `yarn lint:workflows` to its chain.
- Nothing was pushed. No GitHub, AWS or Supabase API was called, and no requirement checkbox changed.

## Self-Check: PASSED

All six files exist and the four task commits (0d13a1108, 013775349, d10890314, 924b7f949) are ancestors of HEAD.
