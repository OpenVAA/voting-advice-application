---
phase: 187-deploy-pipeline
plan: "07"
subsystem: infra
tags: [terraform-test, mock-provider, example-roots, template]
status: complete

requires:
  - phase: 187-02
    provides: the required `image_digest` input of the frontend-service module and both AWS roots
provides:
  - "`infra/envs/example/aws/tests/plan.tftest.hcl`: run `example_root_plans_production_shaped`, `command = plan`, two mock aws providers (default and `us_east_1`), `override_data` for the two availability zones; asserts `var.task_floor == 2`, `var.task_ceiling == 4`, `length(module.frontend.public_subnet_ids) == 2`"
  - "`infra/envs/example/dns-mail/tests/plan.tftest.hcl`: run `example_dns_mail_plans`, a mock aws provider with `mock_data \"aws_region\"`; asserts `module.dns_zone.domain == var.domain`"
  - "`infra/envs/example/supabase/tests/plan.tftest.hcl`: run `example_supabase_plans`, `mock_provider \"supabase\" {}`, `override_resource` for `module.supabase.supabase_project.this`; asserts the Edge Function secret names and auth keys that terraform.tfvars switches on"
affects: [187-08, infra-plan workflow]

actuals:
  tokens: 1575
  tasks: 2
  commits: 2
plan_head_before: 5a51bf6205747ad0168d167596e39d55b2d59246
plan_head_after: 5cde6be9e98587f2516b5fef29bc0df922937e50

tech-stack:
  added: []
  patterns:
    - "A pipeline/template root planned offline by `terraform test` with mock providers after `init -backend=false`; the root's own terraform.tfvars is loaded, so asserts read the template's values"

key-files:
  created:
    - infra/envs/example/aws/tests/plan.tftest.hcl
    - infra/envs/example/dns-mail/tests/plan.tftest.hcl
    - infra/envs/example/supabase/tests/plan.tftest.hcl
  modified: []

key-decisions:
  - "The Supabase test asserts on the module's name outputs (`managed_function_secret_names` holds PUBLIC_PROJECT_ID and SMTP_HOST, `managed_auth_keys` holds smtp_host) rather than on `project_ref`: the mock import's id is the override's stand-in, not the root's `project_ref`, so that comparison would fail by construction"
  - "No test overrides the account guard, the backend or the stand-in account id; a copied root still cannot be applied unedited"

patterns-established:
  - "Example roots carry a `tests/plan.tftest.hcl` whose only stubs are the ones the root needs to plan under mocks (zones, imported project, region data)"

requirements-completed: []

coverage:
  - id: D1
    description: "The AWS template root is planned in full offline and its production shape (floor 2, ceiling 4, two public subnets) is asserted from its own terraform.tfvars"
    requirement: INFRA-19
    verification:
      - kind: other
        ref: "terraform -chdir=infra/envs/example/aws test -verbose: Success! 1 passed, 0 failed; 40 planned addresses including module.frontend.aws_ecs_service.app; negative probe -var task_ceiling=3 fails with 'task_ceiling must be 4.'"
        status: pass
    human_judgment: false
  - id: D2
    description: "The dns-mail and Supabase template roots are each planned offline with one assert-bearing run"
    requirement: INFRA-19
    verification:
      - kind: other
        ref: "plan's Task 2 verify loop: example_dns-mail_test_exit=0, example_supabase_test_exit=0, example_aws_test_exit=0, each 'Success! 1 passed, 0 failed'; terraform fmt -check -recursive infra exit 0; validate exit 0 in all three roots; negative probe -var smtp=null fails both Supabase asserts"
        status: pass
    human_judgment: false
  - id: D3
    description: "The tests are ready for the no-credential pull-request job (the workflow loop is plan 187-08's); observed on the hosted pipeline only in plans 14-25"
    requirement: PIPE-02
    verification:
      - kind: other
        ref: "local only; not yet observed in CI"
        status: pending
    human_judgment: false

duration: 8min
completed: 2026-11-15
---

# Phase 187 Plan 07: Example roots planned with mock providers Summary

**Each `example` root (aws, dns-mail, supabase) now has a `terraform test` that plans the whole root offline with mock providers and no backend, and the AWS one asserts the production shape (floor 2, ceiling 4, two zones) from the template's own terraform.tfvars.**

## Planned addresses per root (from the `-verbose` logs)

| Root | Planned addresses | Plan line |
| --- | --- | --- |
| `infra/envs/example/aws` | 40 | `Plan: 40 to add, 0 to change, 0 to destroy.` |
| `infra/envs/example/dns-mail` | 16 (15 resources and 1 data source read during apply) | `Plan: 15 to add, 0 to change, 0 to destroy.` |
| `infra/envs/example/supabase` | 4 | `Plan: 1 to import, 3 to add, 0 to change, 0 to destroy.` |

The research probe counted 17 addresses for dns-mail. Today's root plans 16. The count is reported as measured.

## Performance

- **Duration:** about 8 min
- **Completed:** 2026-11-15
- **Tasks:** 2/2
- **Files created:** 3

## Accomplishments

- AWS: the two `mock_provider "aws"` blocks, copied with their ARN defaults from the frontend-service module test. An `override_data` gives `module.frontend.data.aws_availability_zones.available` the zones `eu-north-1a` and `eu-north-1b`. The `variables` block holds only the two inputs the shell gives: `alert_email` and a stand-in `image_digest` (`sha256:` followed by 64 zeros), since 187-02 made that input required. The run has three asserts, and each error message names its setting.
- dns-mail: a mock aws provider whose `aws_region` data returns `eu-north-1`, because the mail module's region precondition otherwise sees a random string. It asserts that the zone is planned for `var.domain`.
- Supabase: a mock supabase provider and an `override_resource` that gives the imported project an id, because a mock cannot import. Non-secret stand-ins are supplied for `database_password`, `smtp_user` and `smtp_password`. It asserts the Edge Function secrets and the SMTP auth key that the template's `public_project_id` and `smtp` turn on.
- Each assert was checked to bite. `-var task_ceiling=3` fails the AWS run, and `-var smtp=null` fails both Supabase asserts.

## Task Commits

1. **Task 1: The AWS template planned with mocks and asserted production-shaped** - `9c71e8d29` (test)
2. **Task 2: The dns-mail and Supabase templates planned with mocks** - `5cde6be9e` (test)

## Files Created/Modified

- `infra/envs/example/aws/tests/plan.tftest.hcl` - the production-shaped mock plan
- `infra/envs/example/dns-mail/tests/plan.tftest.hcl` - the zone and mail mock plan
- `infra/envs/example/supabase/tests/plan.tftest.hcl` - the Supabase template's mock plan

## Decisions Made

- The Supabase assert is not "planned project ref equals `project_ref`". Under the mock import, the project's id is the override's stand-in `abcdefghijklmnopqrst`, and the root's `project_ref` is `replace-with-your-project-ref`, so that equality fails by construction. The plan allowed "another attribute the module sets from a variable". The test asserts the module's name outputs, which `public_project_id` and `smtp` in terraform.tfvars decide.

## Deviations from Plan

None. The plan was executed as written; the Supabase assert target was the plan's stated alternative. The verify logs were written to `${TMPDIR}` as the plan's commands direct, and copies are kept in the session scratchpad.

## Issues Encountered

None. Every example root's `.terraform/` held only `modules` and `providers`, with no backend state, so the roots were initialised in place with `-backend=false` and no scratch `TF_DATA_DIR` was needed.

## Threat Surface

T-187-15 is mitigated as planned. The tests use mocks only. There is no backend override and no apply path, and the stand-in account id and the `REPLACE-ME-tfstate` bucket stay. T-187-SC: no package was installed.

## Next Phase Readiness

- Plan 187-08 can loop over `infra/envs/example/{aws,dns-mail,supabase}`, running `init -backend=false -input=false -lockfile=readonly` and then `test -verbose` with no credential. infra-validate's module loop does not reach these roots.
- No requirement was marked complete, per the operator notes. INFRA-19 and PIPE-02 close only when observed on the hosted pipeline.

## Self-Check: PASSED

- FOUND: infra/envs/example/aws/tests/plan.tftest.hcl
- FOUND: infra/envs/example/dns-mail/tests/plan.tftest.hcl
- FOUND: infra/envs/example/supabase/tests/plan.tftest.hcl
- FOUND: 9c71e8d29 (ancestor of HEAD)
- FOUND: 5cde6be9e (ancestor of HEAD)
