---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "07"
subsystem: infra
tags: [terraform, aws, example-root, stand-ins, ci, terraform-test]
status: complete

requires:
  - phase: 185-06
    provides: "The staging AWS root's full wiring (both providers, the aws.us_east_1 alias, the frontend module call, all variables and outputs) and the module's 32-run offline test"
  - phase: 185-04
    provides: "The random 3.9.1 + aws 6.68.0 lock entries for three platforms in the staging AWS root"
provides:
  - "infra/envs/example/aws: the staging root's wiring behind the example's own header comment and backend, with stand-in values"
  - "infra/envs/example/aws/outputs.tf (new), and variables.tf, both byte-identical to staging's"
  - "infra/envs/example/aws/.terraform.lock.hcl, identical to staging's (now carries random 3.9.1)"
  - "CI step 'Test every Terraform module that has tests' in infra-validate"
affects: [185-08, 185-10, 187]

actuals:
  tokens: 3806
  tasks: 2
  commits: 2
plan_head_before: 5a10f15566852ae18df453b4f0806045e4f4db1c
plan_head_after: 4b27954cc7085252fbfb2bd1a96bcb3d35bf0299

tech-stack:
  added: []
  patterns:
    - "The example root is assembled from staging's main.tf: the example's header and backend, and every other line from staging's file"
    - "A CI loop over infra/modules/*/tests/ under shopt -s nullglob, so an empty match reaches the 'no module tested' error instead of a literal glob path"

key-files:
  created:
    - infra/envs/example/aws/outputs.tf
  modified:
    - infra/envs/example/aws/main.tf
    - infra/envs/example/aws/variables.tf
    - infra/envs/example/aws/terraform.tfvars
    - infra/envs/example/aws/.terraform.lock.hcl
    - .github/workflows/main.yaml

key-decisions:
  - "The example's tfvars header names environment_overrides, omit_environment and debug_ingress_cidrs as command-line-only, as staging's does, and says alert_email is given as TF_VAR_alert_email. No alert_email value is in any tracked file (ruling profile)"
  - "name_prefix, parameter_path, the task sizes and the timeouts are not marked as stand-ins. They are usable as they are; the plan marks only deployment-specific values"
  - "The XFF_DEPTH comment in the example keeps the two-proxy explanation and drops staging's sentence about the recorded headers, which refers to staging's own deployment"
  - "The CI module-test init has no -lockfile=readonly, as the plan specifies. The module directory's lock file is gitignored, so a read-only init has nothing to read. The constraints are the same pinned ones the roots lock"

patterns-established:
  - "An example root stays in step with staging through a comparison of the files: variables.tf and outputs.tf with cmp, and main.tf by diffing everything from the first provider block on"

requirements-completed: [INFRA-02, INFRA-10]

duration: 5min
completed: 2026-11-12
---

# Phase 185 Plan 07: The example AWS root and the module tests in CI Summary

**The example AWS root now has staging's providers, us-east-1 alias and frontend module call, with production-shaped stand-ins (account `000000000000`, floor 2, ceiling 4), and `infra-validate` runs `terraform test` in every module that has a `tests` directory.**

## Performance

- **Duration:** about 5 min
- **Started:** 2026-11-12T17:30:02Z
- **Completed:** 2026-11-12T17:34:07Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- `infra/envs/example/aws/main.tf` is the same as staging's apart from the header comment and the backend (`REPLACE-ME-tfstate`, `pipeline/example/aws/terraform.tfstate`). `diff` of everything from the first `provider` block on prints nothing.
- `variables.tf`, `outputs.tf` and `.terraform.lock.hcl` are byte-identical to staging's (`cmp` exit 0). The read-only init accepts the lock unchanged.
- `terraform.tfvars` keeps the three original lines and adds every input the module call needs. Each deployment-specific value is marked `# A stand-in.` and says what replaces it. `environment_values` has exactly the 14 `value` names of `task-environment.json`. The two `parameter` entries and `alert_email` are named in the header comment only.
- `infra-validate` gains one step, after "Validate every Terraform root" and with `if: ${{ !cancelled() }}`. Every existing step is unchanged.
- The job's commands all pass locally: `fmt -check -recursive`, read-only init and validate of all 8 roots, the frontend-service module test (32 passed, 0 failed) and `check-settings-types.sh`. `yarn test:unit:infra` passes 102/102.

## Task Commits

1. **Task 1: The example root with stand-ins, validated**: `c21b2dfbc` (feat). Tracer gate in auto mode: the verify was re-run end to end and passed, so work went on to Task 2.
2. **Task 2: The validation job runs the module tests, and every root validates as CI does**: `4b27954cc` (ci)

## Files Created/Modified

- `infra/envs/example/aws/main.tf`: the staging wiring behind the example's header and backend
- `infra/envs/example/aws/variables.tf`: copied from staging
- `infra/envs/example/aws/outputs.tf`: new, copied from staging
- `infra/envs/example/aws/terraform.tfvars`: the stand-in inputs
- `infra/envs/example/aws/.terraform.lock.hcl`: copied from staging, adding `random` 3.9.1
- `.github/workflows/main.yaml`: the step "Test every Terraform module that has tests"

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `shopt -s nullglob` in the CI test loop**
- **Found during:** Task 2
- **Issue:** without `nullglob`, bash leaves an unmatched glob as its literal text. The loop would then run `terraform -chdir="infra/modules/*"`, fail with a missing-directory error, and never reach the plan's "no module was tested" check.
- **Fix:** `shopt -s nullglob` before the loop, so an empty match reaches the `::error::` line that says no module was tested.
- **Files modified:** .github/workflows/main.yaml
- **Committed in:** 4b27954cc

### Verification adjustments (no code change)

- **Fresh data directories for the local root validation.** `infra/bootstrap`, `infra/envs/staging/dns-mail` and `infra/envs/staging/supabase` hold real backend records in their checkout `.terraform/`. The local run of the validate loop therefore gave each root its own scratch `TF_DATA_DIR`, as a fresh CI checkout would have, rather than touching those records. The commands were otherwise the job's own. Task 1's verify was run exactly as written, because `infra/envs/example/aws/.terraform` holds only providers.
- **The plan's `grep -q 'terraform -chdir="$module" test'`** fails through this session's `grep`, which is a wrapper around ugrep that reads a `$` in the middle of a pattern as an anchor. The same command with `/usr/bin/grep` (exit 0) and with `grep -F` both find line 829. The workflow is not at fault.

---

**Total deviations:** 1 auto-fixed (1 bug). **Impact on plan:** none on scope.

## Issues Encountered

None beyond the verification notes above.

## Known Stubs

None. The example's stand-ins are intended: the root is a template that CI validates and nothing applies. Each one is marked `# A stand-in.` and says what replaces it.

## Threat Flags

None. T-185-18: the account `000000000000` and the verify's refusal of real ids both hold, and a grep finds no staging account id, project reference, domain or `@` in the example's files. T-185-SC: the roots still init with `-lockfile=readonly`.

## User Setup Required

None. Nothing in this plan reaches AWS.

## Next Phase Readiness

- Plan 185-08 changes the README's "Guards" row to list the module tests. This plan does not touch `infra/README.md`.
- The example root is ready for 187 to validate and plan.

## Self-Check: PASSED
