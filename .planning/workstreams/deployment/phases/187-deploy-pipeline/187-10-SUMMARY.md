---
phase: 187-deploy-pipeline
plan: "10"
subsystem: infra
tags: [github-actions, oidc, terraform-destroy, destroy-guard, environment-approval, state-isolation]
status: complete

requires:
  - phase: 187-05
    provides: "`infra/scripts/running-image-digest.sh`, the digest a non-deploy plan passes"
  - phase: 187-08
    provides: "`infra/scripts/workflowGuards.ts` (`sharedViolations`, `loadWorkflow`, `jobSteps`, `workflowJobs`, `parseWorkflow`)"
provides:
  - "`infra/scripts/check-destroy-plan.sh --plan-json <file> --state-list <file>`: the address and count guard of a destroy plan, lines destroy_planned=, destroy_state_resources=, destroy_outside_module=, destroy_other_actions=, destroy_guard=pass|fail; exit 0/1/2"
  - "`.github/workflows/destroy.yml`: jobs `plan-destroy` (30 min) and `apply-destroy` (45 min, needs plan-destroy), each `environment: staging-destroy`, `ubuntu-24.04`, contents read plus id-token write"
  - "Workflow lines supabase_root_init_status=, supabase_state_head_status=, supabase_root_refused=yes|no, destroy_state_after="
  - "`infra/scripts/destroy-workflow.test.ts`: 53 guards on triggers, environments, roots, secrets, order and the apply, with red copies"
affects: [187-13, 187-14, 187-23, 187-24, deploy.yml, staging-destroy environment]

actuals:
  tokens: 13015
  tasks: 2
  commits: 4
plan_head_before: 06e5c491ee9a3b70035532b450d797c00512f598
plan_head_after: 5daeba100b1ccbbf97980a58988925019e776a12

tech-stack:
  added: []
  patterns:
    - "A destroy is planned, exported as JSON under $RUNNER_TEMP with umask 077, guarded, and only then shown; the plan command's own output goes to a file and is printed only when it fails"
    - "Two jobs in one environment, each re-planning into its own $RUNNER_TEMP file, so each waits for its own approval and no plan crosses jobs"
    - "An environment with no setting: the role is named by its literal ARN and the alert address is a placeholder a destroy never applies"

key-files:
  created:
    - infra/scripts/check-destroy-plan.sh
    - infra/scripts/check-destroy-plan.test.ts
    - .github/workflows/destroy.yml
    - infra/scripts/destroy-workflow.test.ts
  modified: []

key-decisions:
  - "The guard counts a change outside module.frontend. among the managed changes that are not a no-op; a no-op passes the action check, and a resource it leaves behind fails the count instead"
  - "The state count drops data sources by address form (index keys removed, then `(module.<name>.)*data.`), so a `data.` inside an index key of a managed resource still counts"
  - "A plan file that is not a plan document prints `destroy_guard=fail` alone and exits 1, and jq's message is discarded so that no part of the plan reaches the log"
  - "Each job's `if` also pins the ref of a push to refs/heads/deploy-evidence/destroy-staging and the event of a dispatch, not only the event name and the typed confirmation"
  - "The refusal requires each read to fail and to name its refusal: the init log names `Error refreshing state` with `AccessDenied|403`, the head-object error names `Forbidden|AccessDenied|403`; both logs are removed in the step itself"
  - "`plan -destroy` writes its output to $RUNNER_TEMP/destroy-plan.log, so nothing of the plan is printed before the guard passes"
  - "destroy_state_after counts the state list's non-empty lines with awk and fails when the count cannot be read, so a missing file never reads as an empty state"

patterns-established:
  - "Destroy workflow: refusal proof, digest, init, state list, plan -destroy, export, guard, show, (apply, state-after), always-run cleanup"

requirements-completed: []

coverage:
  - id: D1
    description: "check-destroy-plan.sh passes only managed deletes under module.frontend. whose number equals the state's managed resources; fails outside addresses, count mismatches and any other action; exit 2 on a missing file or flag"
    requirement: PIPE-08
    verification:
      - kind: unit
        ref: "vitest check-destroy-plan 22/22 (the six behavior cases plus data sources, keyed addresses, a lookalike module name, replacement, forget, no-op, non-JSON input, six usage errors, --help); `bash infra/scripts/check-destroy-plan.sh --plan-json /nonexistent --state-list /nonexistent` prints s=2; shellcheck 0.11.0 clean"
        status: pass
    human_judgment: false
  - id: D2
    description: "Triggers: push to deploy-evidence/destroy-staging only and workflow_dispatch with the required string confirm; no pull-request trigger; concurrency staging-aws, cancel-in-progress false, the same as deploy.yml's"
    requirement: PIPE-10
    verification:
      - kind: unit
        ref: "vitest destroy-workflow describe 'the triggers and the concurrency of destroy.yml' (5 cases) and the red copy 'sees a pull-request trigger'"
        status: pass
      - kind: other
        ref: "hosted observation at 187-23"
        status: pending
    human_judgment: false
  - id: D3
    description: "Two jobs, plan-destroy and apply-destroy (needs the first), each environment staging-destroy with contents read and id-token write, each admitting a push of the one branch or the typed confirmation"
    requirement: PIPE-04
    verification:
      - kind: unit
        ref: "vitest destroy-workflow describe 'the jobs of destroy.yml' (9 cases) and the red copy 'sees the apply job in another environment'; grep -c 'environment: staging-destroy' = 2"
        status: pass
      - kind: other
        ref: "plan approved, apply rejected at 187-23; both approved at 187-24"
        status: pending
    human_judgment: true
  - id: D4
    description: "plan-destroy shows the Supabase root out of reach first: one init of that root and one head-object of its state key, both refused, else the step fails"
    requirement: PIPE-08
    verification:
      - kind: unit
        ref: "vitest destroy-workflow describe 'the Supabase root is shown out of reach in plan-destroy' (6 cases)"
        status: pass
      - kind: other
        ref: "supabase_root_refused=yes observed at 187-23"
        status: pending
    human_judgment: false
  - id: D5
    description: "No secret and no setting named; no root but the AWS root, apart from the refused init; the guard before the show in each job; the apply of the job's own saved plan; destroy_state_after=0 required"
    requirement: PIPE-08
    verification:
      - kind: unit
        ref: "vitest destroy-workflow describes 'the roots destroy.yml reaches', 'the steps of plan-destroy/apply-destroy' (2 x 8 cases), 'the apply of apply-destroy' and the red copies for a secret, a Supabase plan, a second Supabase command and the guard moved after the show; grep -c 'secrets\\.' = 0; actionlint 1.7.12 by digest with shellcheck: no finding"
        status: pass
      - kind: other
        ref: "real destroy at 187-24"
        status: pending
    human_judgment: false

duration: 7min
completed: 2026-11-15
---

# Phase 187 Plan 10: The guarded destroy of the staging AWS stack Summary

**`destroy.yml`: two `staging-destroy` jobs that each wait for their own approval. The first shows the Supabase root's state refused to the deploy role, then plans `-destroy` of the AWS root and passes it through `check-destroy-plan.sh` before showing it. The second plans again, guards that plan, applies it, and fails unless the state is then empty. The file names no secret and no setting.**

## Step ids, in order

**`plan-destroy`:** `checkout`, `terraform`, `credentials`, `supabase-root-refused`, `digest`, `init`, `state`, `plan`, `export`, `guard`, `show`, `cleanup`

**`apply-destroy`:** `checkout`, `terraform`, `credentials`, `digest`, `init`, `state`, `plan`, `export`, `guard`, `show`, `apply`, `state-after`, `cleanup`

What each one does:

- **credentials**: `aws-actions/configure-aws-credentials` with the literal `arn:aws:iam::471112560111:role/openvaa/openvaa-staging-deploy`, `eu-north-1`, `allowed-account-ids: "471112560111"`, session `destroy-plan-${{ github.run_id }}` / `destroy-apply-${{ github.run_id }}`.
- **supabase-root-refused** (plan job only): `terraform -chdir=infra/envs/staging/supabase init -input=false -no-color` into `$RUNNER_TEMP/supabase-init.log`, then `aws s3api head-object --bucket openvaa-tfstate-471112560111 --key hand/staging/supabase/terraform.tfstate > /dev/null`. It prints `supabase_root_init_status=`, `supabase_state_head_status=` and `supabase_root_refused=yes|no`. It fails unless both reads failed, the init log names `Error refreshing state` with `AccessDenied|403`, and the head error names `Forbidden|AccessDenied|403`.
- **digest**: `running-image-digest.sh --cluster openvaa-staging --service openvaa-staging-frontend`, passed out as `digest`.
- **init / state**: `init -input=false -no-color -lockfile=readonly`, then `state list > "$RUNNER_TEMP/state.txt"`.
- **plan**: `plan -destroy -input=false -no-color -var "image_digest=$DIGEST" -out="$RUNNER_TEMP/destroy.tfplan"`, run with `TF_VAR_alert_email: destroy-plan@example.invalid`. Its output goes to `$RUNNER_TEMP/destroy-plan.log`, which is printed only if the plan fails.
- **export**: `umask 077`, then `show -json` into `$RUNNER_TEMP/destroy.json`. That file is never printed.
- **guard**: `infra/scripts/check-destroy-plan.sh --plan-json "$RUNNER_TEMP/destroy.json" --state-list "$RUNNER_TEMP/state.txt"`.
- **show**: `show -no-color`, written to the log and to `$GITHUB_STEP_SUMMARY`.
- **apply** (apply job only): `apply -input=false -no-color "$RUNNER_TEMP/destroy.tfplan"`.
- **state-after** (apply job only): `state list`, then prints `destroy_state_after=<count>`. It fails unless the count is 0, and also fails if the count cannot be read.
- **cleanup**: runs `if: always()` and removes the plan, its JSON, the plan log and text, the state lists and the digest file.

## Performance

- **Duration:** about 7 min
- **Started:** 2026-11-15T02:53:51Z
- **Completed:** 2026-11-15T03:00:50Z
- **Tasks:** 2
- **Files modified:** 4 (all created)

## Accomplishments
- `check-destroy-plan.sh`: its header gives what a destroy of the AWS root may contain and why the count is compared with the state, followed by the usage line, exit codes 0/1/2 and `-h`. A single `jq` call produces the three counts of the plan and its status is read directly; `awk` counts the managed resources in the state list.
- Verification:
  - vitest `check-destroy-plan` passes 22/22 and `destroy-workflow` passes 53/53.
  - The whole `infra/vitest.config.ts` suite passes 273/273 in 10 files.
  - actionlint 1.7.12 (by digest, with its bundled shellcheck) reports no finding on `destroy.yml`, and shellcheck 0.11.0 reports none on the script.
  - `deployedSmokeGuards` passes 16/16, and Prettier and ESLint are clean on both tests.
- Acceptance greps: `secrets\.` = 0, `environment: staging-destroy` = 2. `--plan-json /nonexistent --state-list /nonexistent` exits 2.

## Task Commits

1. **Task 1 (tracer): the destroy-plan guard.** RED `8e910b26f` (22 cases failing, because the script did not exist yet), then GREEN `69b7b670b`. The tracer gate re-ran `<verify>` end to end and it passed (vitest exit 0, prettier exit 0).
2. **Task 2: destroy.yml and its guards.** RED `5a9e9fac5` (the suite fails because the workflow does not exist), then GREEN `5daeba100`.

## Files Created/Modified
- `infra/scripts/check-destroy-plan.sh`: the address and count guard of a destroy plan (mode 100755)
- `infra/scripts/check-destroy-plan.test.ts`: fixture plans and state lists written into a `mkdtemp` directory, run with `spawnSync`
- `.github/workflows/destroy.yml`: the guarded destroy of the AWS stack (jobs `plan-destroy`, `apply-destroy`)
- `infra/scripts/destroy-workflow.test.ts`: guards on destroy.yml, plus cross-checks against deploy.yml (the shared concurrency group and the excluded branch)

## Decisions Made
See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Critical] The plan's own output is kept out of the log until the guard passes**
- **Found during:** Task 2
- **Issue:** `terraform plan` prints the whole diff to standard output. The threat register (T-187-28) requires the guard to run "before the plan is shown or applied".
- **Fix:** The plan step redirects its output to `$RUNNER_TEMP/destroy-plan.log` and prints it only when the plan fails. The `show` after the guard is the first place the diff is printed. The cleanup removes the log.
- **Files modified:** .github/workflows/destroy.yml
- **Commit:** 5daeba100

**2. [Rule 2 - Critical] The JSON plan is written with umask 077**
- **Found during:** Task 2
- **Issue:** `show -json` writes sensitive values in the clear (for example the origin-verify password).
- **Fix:** The export step sets `umask 077`, and the test asserts it.
- **Commit:** 5daeba100

**3. [Rule 1 - Bug] A test regex corrected in the GREEN commit**
- **Found during:** Task 2
- **Issue:** The RED test's verdict regex expected indentation after each newline, but a parsed `run:` block has none.
- **Fix:** Changed `\n\s+` to `\n` in that one assertion. No assertion was loosened.
- **Commit:** 5daeba100

**Total deviations:** 3 auto-fixed. **Impact:** none on scope. The first two harden the threat-register mitigations.

## Issues Encountered
- A push of `deploy-evidence/destroy-staging` also starts `infra-plan.yml`, because it triggers on `deploy-evidence/**`. That runs its credential-free checks and the wrong-subject job, which are harmless and change nothing. Recorded here for plan 187-23's reading of the runs.

## Requirements
No requirement is marked complete; the operator notes reserve that for the hosted plans 14–25. Coverage is listed in the `coverage` frontmatter. PIPE-08, PIPE-04 and PIPE-10 are unit-proven here and still need a hosted observation (187-23 plan-only, 187-24 real destroy).

## User Setup Required
None in this plan. Plan 187-14 creates the `staging-destroy` environment with a reviewer, a branch policy for `deploy/staging` and `deploy-evidence/destroy-staging`, and no secret and no variable.

## Next Phase Readiness
- The destroy path is ready for the plan-only evidence run of 187-23 (approve `plan-destroy`, reject `apply-destroy`) and the real destroy of 187-24.
- Assumption carried from the research and not verified here: `terraform init` refreshes state before installing providers, so a refused GetObject fails init with `Error refreshing state`. The `supabase_root_refused=yes` line of 187-23 is its first observation.

## Self-Check: PASSED
- FOUND: infra/scripts/check-destroy-plan.sh, infra/scripts/check-destroy-plan.test.ts, .github/workflows/destroy.yml, infra/scripts/destroy-workflow.test.ts
- FOUND: 8e910b26f, 69b7b670b, 5a9e9fac5, 5daeba100 (ancestors of HEAD)
