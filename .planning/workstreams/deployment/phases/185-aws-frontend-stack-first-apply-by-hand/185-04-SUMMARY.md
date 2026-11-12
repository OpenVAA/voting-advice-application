---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "04"
subsystem: infra
tags: [terraform, aws, ecs, fargate, alb, acm, route53, vpc, terraform-test, mock-provider]

requires:
  - phase: 185-02
    provides: "infra/modules/frontend-service/task-environment.json, the list the task environment is built from"
  - phase: 185-01
    provides: "the execution role in bootstrap (openvaa-staging-frontend-execution), passed in by ARN"
provides:
  - "infra/modules/frontend-service: network, security groups, origin certificate, load balancer with the origin lock, target group, listeners, origin record, cluster, log group, task definition and service"
  - "An offline terraform test of the module (23 runs, mock AWS providers)"
  - "The staging AWS root calling the module, with a us_east_1 alias, root variables, outputs and the staging values"
  - "hashicorp/random 3.9.1 in the staging AWS lock file for three platforms"
affects: [185-06, 185-11, 185-12, example-aws-root]

actuals:
  tokens: 13525
  tasks: 2
  commits: 2
plan_head_before: b4de394aa7c779f131c61e2065e825e4c9a07b94
plan_head_after: a94d4b0f161a6541db9b9635b07dfce04a0e45c5

tech-stack:
  added: [hashicorp/random 3.9.1]
  patterns:
    - "terraform test with mock_provider plus mock_resource ARN defaults, for arguments the provider checks as ARNs"
    - "Validation records keyed by the certificate's names, which are known at plan time, with contents read from domain_validation_options"
    - "Task environment preconditions computed as lists of offending names in locals, so a missing value is a named precondition failure rather than an index error"

key-files:
  created:
    - infra/modules/frontend-service/main.tf
    - infra/modules/frontend-service/origin.tf
    - infra/modules/frontend-service/service.tf
    - infra/modules/frontend-service/variables.tf
    - infra/modules/frontend-service/outputs.tf
    - infra/modules/frontend-service/tests/frontend_service.tftest.hcl
    - infra/envs/staging/aws/outputs.tf
  modified:
    - infra/envs/staging/aws/main.tf
    - infra/envs/staging/aws/variables.tf
    - infra/envs/staging/aws/terraform.tfvars
    - infra/envs/staging/aws/.terraform.lock.hcl

key-decisions:
  - "The origin certificate's validation records use for_each over the certificate's names (toset([origin domain])), with each record's name, type and value read from domain_validation_options. The keys are known at plan time whatever the provider reports"
  - "Every value entry not omitted must have a value, the optional ones included, because the staging tfvars sets all of them. An omitted value entry needs none"
  - "log_retention_days accepts only CloudWatch's finite retentions. 0 (never expire) is refused"
  - "hashicorp/random is locked at 3.9.1. Only that provider was locked, so hashicorp/aws stays at 6.68.0 with its hashes unchanged"

patterns-established:
  - "A module test sets mock ARNs for every resource whose ARN feeds an argument the provider checks (aws_lb, target group, listener, cluster, task definition, certificate and certificate validation)"

requirements-completed: [INFRA-02, INFRA-04, INFRA-05, INFRA-06, INFRA-08, INFRA-09, INFRA-10, INFRA-11]

coverage:
  - id: D1
    description: "The module's network, security groups, load balancer origin lock, listeners, target group, task definition and service, checked offline"
    requirement: INFRA-11
    verification:
      - kind: unit
        ref: "terraform -chdir=infra/modules/frontend-service test (23 passed, 0 failed)"
        status: pass
      - kind: other
        ref: "terraform -chdir=infra/modules/frontend-service validate; terraform fmt -check -recursive infra/modules/frontend-service"
        status: pass
    human_judgment: false
  - id: D2
    description: "The task environment split, omission, overrides and the three preconditions"
    requirement: INFRA-05
    verification:
      - kind: unit
        ref: "infra/modules/frontend-service/tests/frontend_service.tftest.hcl#environment_split, omit_removes_an_entry, omit_removes_a_parameter, override_wins, missing_value_fails, unknown_key_fails, unknown_omitted_name_fails, omitted_value_needs_no_value"
        status: pass
    human_judgment: false
  - id: D3
    description: "Variable validations: image_tag (empty, a name and upper case refused), debug_ingress_cidrs (/8 and IPv6 refused), execution_role_arn, parameter_path, log_retention_days, stop_timeout_seconds, task_floor"
    requirement: INFRA-04
    verification:
      - kind: unit
        ref: "infra/modules/frontend-service/tests/frontend_service.tftest.hcl#image_tag_refuses_empty and the other expect_failures runs"
        status: pass
    human_judgment: false
  - id: D4
    description: "The staging root initialises against its lock file, validates against aws 6.68.0, and its environment_values match the list name for name"
    requirement: INFRA-10
    verification:
      - kind: other
        ref: "terraform -chdir=infra/envs/staging/aws init -backend=false -lockfile=readonly && validate; node key-comparison of terraform.tfvars against task-environment.json"
        status: pass
    human_judgment: false
  - id: D5
    description: "No inline IAM policy and no non-local module source anywhere under infra/"
    verification:
      - kind: other
        ref: "node scripts/assert-no-inline-iam-policies.mjs (53 .tf files, 0 findings)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The stack behaves on AWS as tested: the origin lock answers 403 without the header, the rollback triggers, and the tasks reach the registry, the parameter store and Supabase"
    verification: []
    human_judgment: true
    rationale: "Nothing in this plan applies against AWS. Mock providers check the configuration, not the behaviour; the first apply and its observations are later plans' work."

duration: 8min
completed: 2026-11-12
status: complete
---

# Phase 185 Plan 04: Frontend Module Serving Path and Staging Wiring Summary

**`infra/modules/frontend-service` now contains the serving path, written with explicit `aws_*` resources: a public VPC across two zones with no NAT gateway; a load balancer whose security group admits only CloudFront's origin-facing prefix list, which answers 403 to any request without the 48-character `x-origin-verify` secret and redirects 80 to HTTPS; and an ARM64 Fargate service with circuit-breaker rollback. The task environment is built from `task-environment.json` alone. A 23-run offline `terraform test` covers the module, the staging root calls it, and `hashicorp/random` 3.9.1 is in the root's lock file for three platforms.**

## Performance

- **Duration:** about 8 min
- **Started:** 2026-11-12T17:13:35Z
- **Completed:** 2026-11-12T17:21:25Z
- **Tasks:** 2
- **Files modified:** 11 (7 created, 4 modified)

## Accomplishments

- `main.tf`: the provider requirements (`aws ~> 6.60` with `configuration_aliases = [aws.us_east_1]`, `random ~> 3.9`) and the environment locals. The network is a VPC, an internet gateway, two public `/24` subnets in the first two available zones, and one route table. Two security groups have no inline rules. Five rule resources sit on them: 443 from the CloudFront prefix list (the only reference to the list), debug rules for each `/32` on 443 and 80, load balancer to tasks on 3000, tasks from the load balancer on 3000, and tasks out on 443.
- `origin.tf`: the zone is read by name. The `origin.<domain>` certificate is DNS-validated and its validation records are written by the module. The 48-character alphanumeric `random_password` is the origin secret. The load balancer drops invalid header fields, has a 60-second idle timeout and has deletion protection off. The target group checks `/api/health` with a 30-second deregistration delay. The 443 listener answers 403 by default, and a rule at priority 1 forwards only on the header. The 80 listener redirects with a 301. The origin record is an A alias.
- `service.tf`: the cluster, and the log group `/openvaa/<env>/frontend` with 90-day retention. The task definition is FARGATE and ARM64 with no task role. Its container has `stopTimeout` 30, a Node `fetch` health check of `/api/health`, and `awslogs` in non-blocking mode. Three preconditions check for an unknown key, a missing value and an unknown omitted name. The service has 100/200 deployment percentages, a grace period, `wait_for_steady_state`, tag propagation, ECS managed tags, rollback, a public IP and `ignore_changes = [desired_count]`.
- The staging root's backend block is unchanged. The `us_east_1` alias repeats `allowed_account_ids` and `default_tags`. Every input of `module "frontend"` comes from a root variable, and the root passes every module output through, with `origin_verify_header_value` marked sensitive. The tfvars sets every `value` entry of the list and nothing secret or personal.

## Task Commits

1. **Task 1: The module's serving path, network to service, with its offline test**: `c83592846` (feat). Tracer gate in auto mode: verify re-run, passed.
2. **Task 2: The staging root calls the module**: `a94d4b0f1` (feat)

## Files Created/Modified

- `infra/modules/frontend-service/main.tf`: provider requirements, environment locals, network and security groups
- `infra/modules/frontend-service/origin.tf`: certificate, validation, origin secret, load balancer, target group, listeners, records
- `infra/modules/frontend-service/service.tf`: cluster, log group, task definition with preconditions, service
- `infra/modules/frontend-service/variables.tf`: 22 variables, each with a description, type and the validations the plan names
- `infra/modules/frontend-service/outputs.tf`: 13 outputs, the origin secret sensitive
- `infra/modules/frontend-service/tests/frontend_service.tftest.hcl`: 23 runs with mock AWS providers and the real `random` provider
- `infra/envs/staging/aws/main.tf`: `random` requirement, `us_east_1` alias, module call
- `infra/envs/staging/aws/variables.tf`: 14 new variables
- `infra/envs/staging/aws/terraform.tfvars`: the staging values and the header on what is never set here
- `infra/envs/staging/aws/outputs.tf`: every module output passed through
- `infra/envs/staging/aws/.terraform.lock.hcl`: `hashicorp/random` 3.9.1 (linux_amd64, darwin_arm64, darwin_amd64)

## Decisions Made

- **`random` version:** the staging lock file holds `hashicorp/random` **3.9.1** (`constraints = "~> 3.9"`). `hashicorp/aws` stays at 6.68.0 because `providers lock` was run for `hashicorp/random` only.
- Validation records are keyed by the certificate's names (see Deviations).
- An optional `value` entry still needs a value unless it is omitted. The plan's precondition says "every kept `value` name has a merged value", and the staging tfvars sets all fourteen.
- Extra validations beyond the plan's list: `aws_account_id` must be 12 digits, `registry_url` must not carry a tag or digest, and `vpc_cidr` must hold two subnets eight bits longer. Each one makes a mistyped input fail the plan with a named error.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Validation records keyed by name, not by the validation-option set**
- **Found during:** Task 1 (first `terraform test` run)
- **Issue:** a mock certificate has no `domain_validation_options` until apply, so a `for_each` built from that set has unknown keys at plan time. Setting the options with `override_during = plan` made every other generated attribute of the certificate differ between plan and apply ("Provider produced inconsistent final plan").
- **Fix:** `for_each = toset([local.origin_domain])`, with the record's name, type and value read from a map of `domain_validation_options` by domain name. Each record still takes its contents from the certificate's validation options, as the plan asks. The key set is now known at plan time on the real provider as well.
- **Files modified:** infra/modules/frontend-service/origin.tf
- **Committed in:** c83592846

**2. [Rule 3 - Blocking] Mock ARNs for arguments the provider checks**
- **Found during:** Task 1
- **Issue:** at apply, the provider checks `load_balancer_arn` (and similar arguments) as ARNs, and the mock's random strings fail that check.
- **Fix:** the test's `mock_provider "aws"` gives ARN-shaped defaults to `aws_lb`, `aws_lb_target_group`, `aws_lb_listener`, `aws_ecs_cluster`, `aws_ecs_task_definition`, `aws_acm_certificate` (with one validation option) and `aws_acm_certificate_validation`, and a zone id to `data.aws_route53_zone`.
- **Files modified:** infra/modules/frontend-service/tests/frontend_service.tftest.hcl
- **Committed in:** c83592846

**3. [Rule 1 - Bug] The `XFF_DEPTH` comment states nothing that has not been observed**
- **Found during:** Task 2
- **Issue:** the plan's wording, "checked against the recorded headers", describes a check that has not happened yet, since nothing is deployed.
- **Fix:** the comment names the two proxies and says that the forwarding headers recorded on the running deployment are what confirm the number.
- **Files modified:** infra/envs/staging/aws/terraform.tfvars
- **Committed in:** a94d4b0f1

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug). **Impact on plan:** none on scope. The first deviation changes the shape of the validation-record `for_each` but not what it creates.

## Issues Encountered

- The module directory resolves `aws` to 6.73.0 (its lock file is ignored), while the staging root pins 6.68.0. The staging root's `validate` against 6.68.0 passed, so every attribute the module uses exists in the pinned version.
- Terraform `==` is false between a `list` and a `tuple`, so the test compares `sort(...)` results with `tolist([...])`. Sensitive comparisons are wrapped in `nonsensitive(...)`.
- A mutation check run in a scratch copy confirmed that the tests do catch breakage: `special = true`, `assign_public_ip = false` and a dropped omission filter each failed the runs that cover them.
- The offline init of `infra/envs/staging/aws` needed no `TF_DATA_DIR`, because its checkout `.terraform/` holds only providers and no backend record. The lock was still written from a scratch data directory. The plan's exact verify was then run against the checkout directory, and it passed.

## Known Stubs

None. `image_tag` has no value in `terraform.tfvars` on purpose: it is set once an image of the commit has been pushed, and until then a plan asks for it.

## Threat Flags

None. The surface this plan adds is the one the threat model lists: T-185-09/10 (prefix list plus header rule plus 403 default), T-185-11 (sensitive output), T-185-12 (`/32` validation, empty default, absent from tfvars) and T-185-SC (signed `hashicorp/random`, locked for three platforms, `-lockfile=readonly` in the verify).

## User Setup Required

None. Nothing in this plan reaches AWS.

## Next Phase Readiness

- Plan 185-06 can add the CDN to the same module. `aws.us_east_1` is already declared and passed, and the origin outputs are `origin_domain`, `origin_verify_header_name` and `origin_verify_header_value`.
- The example AWS root does not call the module yet. When it does, it needs the same `random` lock entry.
- Verification: the module validate, test (23/0) and fmt, the staging root's readonly init and validate, the tfvars key match, the inline-IAM guard (0 findings) and `yarn test:unit:infra` (102/102) all pass.

## Self-Check: PASSED

- FOUND: infra/modules/frontend-service/{main,origin,service,variables,outputs}.tf
- FOUND: infra/modules/frontend-service/tests/frontend_service.tftest.hcl
- FOUND: infra/envs/staging/aws/outputs.tf
- FOUND: c83592846, a94d4b0f1 (ancestors of HEAD)
- Acceptance: grep sum of `aws_iam_|aws_ssm_parameter|nat_gateway` = 0; `prefix_list_id` in main.tf = 1; `ignore_changes = [desired_count]` = 1; `run "` = 23; backend key line = 1; `alias = "us_east_1"` = 1; `allowed_account_ids` = 2; forbidden tfvars keys = 0

---
*Phase: 185-aws-frontend-stack-first-apply-by-hand*
*Completed: 2026-11-12*
