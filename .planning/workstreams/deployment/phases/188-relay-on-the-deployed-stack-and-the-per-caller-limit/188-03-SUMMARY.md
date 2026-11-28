---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "03"
subsystem: infra
tags: [terraform, wafv2, cloudfront, rate-limit, relay]

requires:
  - phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
    provides: 188-02, the roots' variables.tf and main.tf pass-through shape and the module-output pattern for root tests
  - phase: 187-deploy-pipeline
    provides: the frontend-service module with the aws.us_east_1 provider alias and aws_cloudfront_distribution.this
provides:
  - module variable relay_rate_limit (object of limit and window_seconds), default null, validated
  - aws_wafv2_web_acl.relay in infra/modules/frontend-service/waf.tf, count 0 unless relay_rate_limit is set
  - web_acl_id = one(aws_wafv2_web_acl.relay[*].arn) on the distribution, null by default
  - module outputs relay_web_acl_arn and distribution_web_acl_id
  - root variable relay_rate_limit in infra/envs/staging/aws and infra/envs/example/aws, default null, passed to module "frontend", set in no tfvars
  - module test runs relay_rate_limit_off, relay_rate_limit_on and three refusal runs; the example root's no-web-ACL assertion
affects: [188-17]

actuals:
  tokens: 3450
  tasks: 3
  commits: 3
plan_head_before: 137fe3487fa1aa4f1d200ab3d6a49394254ba854
plan_head_after: e7b168f8f5cc0afdf5d700b0e390ed629f9eecb2

tech-stack:
  added: []
  patterns:
    - "An optional module resource is count-gated on a nullable object variable, and the consuming argument takes one(resource[*].arn), which is null when the count is 0"

key-files:
  created:
    - infra/modules/frontend-service/waf.tf
  modified:
    - infra/modules/frontend-service/variables.tf
    - infra/modules/frontend-service/edge.tf
    - infra/modules/frontend-service/outputs.tf
    - infra/modules/frontend-service/tests/frontend_service.tftest.hcl
    - infra/envs/staging/aws/variables.tf
    - infra/envs/staging/aws/main.tf
    - infra/envs/example/aws/variables.tf
    - infra/envs/example/aws/main.tf
    - infra/envs/example/aws/tests/plan.tftest.hcl

key-decisions:
  - "relay_rate_limit's upper bound is 2000000000, the provider's own IntBetween(10, 2000000000) on rate_based_statement.limit, so the variable refuses nothing the provider would accept and accepts nothing it would refuse"
  - "The validation uses a conditional (null ? true : ...) rather than ||, so it never reads an attribute of a null object, whatever the Terraform version's short-circuit behaviour"
  - "The example root's no-web-ACL assertion reads two new module outputs, relay_web_acl_arn and distribution_web_acl_id, because a root's terraform test cannot reference module.frontend.aws_wafv2_web_acl.relay (measured: Unsupported attribute)"

patterns-established: []

requirements-completed: []

coverage:
  - id: D1
    description: "relay_rate_limit null creates no web ACL and leaves web_acl_id null; set, it creates one CLOUDFRONT web ACL through aws.us_east_1 with default allow and one rate rule on the source address, scoped to paths starting /api/usage after NORMALIZE_PATH, blocking with 429, named by the distribution"
    requirement: RELAY-09
    verification:
      - kind: other
        ref: "terraform -chdir=infra/modules/frontend-service test -no-color: run relay_rate_limit_off pass, run relay_rate_limit_on pass, Success! 38 passed, 0 failed"
        status: pass
    human_judgment: false
  - id: D2
    description: "The variable refuses a window outside 60/120/300/600, a limit below 10 and a fractional limit"
    requirement: RELAY-09
    verification:
      - kind: other
        ref: "terraform -chdir=infra/modules/frontend-service test -no-color: relay_rate_limit_refuses_a_window, relay_rate_limit_refuses_below_ten, relay_rate_limit_refuses_a_fraction, each pass"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both AWS roots declare relay_rate_limit (default null) and pass it to module \"frontend\"; neither tfvars sets it; the example root's plan has no web ACL"
    requirement: RELAY-09
    verification:
      - kind: other
        ref: "staging and example validate: Success! The configuration is valid.; example test: Success! 1 passed, 0 failed; red with -var 'relay_rate_limit={limit=300,window_seconds=300}' (Failure! 0 passed, 1 failed); grep relay_rate_limit in both terraform.tfvars: absent"
        status: pass
    human_judgment: false
  - id: D4
    description: "That a null web_acl_id leaves the live distribution unchanged, against real state"
    requirement: RELAY-09
    verification: []
    human_judgment: true
    rationale: "Mock tests cannot show the real plan; plan 188-17's unset plan of the staging root against real state proves it"

duration: 10min
completed: 2026-11-18
status: complete
---

# Phase 188 Plan 03: The opt-in WAF rate rule on /api/usage, off by default Summary

**A nullable `relay_rate_limit` module variable that, only when set, creates one CLOUDFRONT-scope `aws_wafv2_web_acl` answering 429 to a viewer address exceeding the limit on `/api/usage`; both AWS roots pass it through unset and nothing is applied.**

## Provider argument values confirmed (Task 1)

Provider `hashicorp/aws` 6.73.0 (the version `init` selected under the module's `~> 6.60`), from `terraform providers schema -json`, the provider's resource documentation at tag v6.73.0 (`website/docs/r/wafv2_web_acl.html.markdown`), its validation source (`internal/service/wafv2/schemas.go`) and the AWS SDK enums (`service/wafv2/types/enums.go`):

| Argument | Confirmed |
|----------|-----------|
| `rule.statement.rate_based_statement.limit` | number, required; `validation.IntBetween(10, 2000000000)` |
| `rate_based_statement.evaluation_window_sec` | number, optional, default 300; `validation.IntInSlice([]int{60, 120, 300, 600})` |
| `rate_based_statement.aggregate_key_type` | string, optional; `CONSTANT`, `CUSTOM_KEYS`, `FORWARDED_IP`, `IP` (default `IP`) |
| `rate_based_statement.scope_down_statement.byte_match_statement` | block present, with `search_string` (required, at most 50 bytes), `positional_constraint` (required), `field_to_match`, `text_transformation` |
| `byte_match_statement.positional_constraint` | `EXACTLY`, `STARTS_WITH`, `ENDS_WITH`, `CONTAINS`, `CONTAINS_WORD` |
| `text_transformation` | `priority` and `type`, both required; `NORMALIZE_PATH` is `TextTransformationTypeNormalizePath` in the SDK enum |
| `field_to_match.uri_path` | block present |
| `rule.action.block.custom_response.response_code` | required; `validation.IntBetween(200, 600)` |
| `scope` | `CLOUDFRONT` requires the `us-east-1` provider |
| `aws_cloudfront_distribution.web_acl_id` | string, optional, not computed, so null is known at plan time |

## Performance

- **Duration:** about 10 min
- **Started:** 2026-11-18T19:36Z
- **Completed:** 2026-11-18T19:46Z
- **Tasks:** 3
- **Files modified:** 10 (1 created)

## Accomplishments

- `infra/modules/frontend-service/waf.tf`: `aws_wafv2_web_acl.relay`, count 0 unless `relay_rate_limit` is set; when set, name `${local.name}-relay`, scope `CLOUDFRONT` through `aws.us_east_1`, default allow, one rule `relay-rate` (priority 0) that rate-limits on `IP` with the variable's limit and window, scoped down to a `STARTS_WITH` `/api/usage` byte match on the URI path after `NORMALIZE_PATH`, blocking with 429; metrics on, sampled requests off. No managed rule group, no site-wide rule.
- The distribution's `web_acl_id = one(aws_wafv2_web_acl.relay[*].arn)`, null by default.
- The variable's description states that switching it on needs `wafv2` actions on the deploy role first and costs about 6 US dollars a month plus 0.60 per million requests, every distribution request being inspected. No `wafv2` action was added anywhere; nothing under `infra/modules/github-oidc/` changed.
- Module tests: 33 to 38 runs, all pass. Both roots validate; the example root's plan test asserts the rule is off.

## Task Commits

1. **Task 1: The variable to the distribution: off makes nothing, on makes one rule on `/api/usage`** - `45cc52e78` (feat)
2. **Task 2: The bounds refused, and the staging root passing the variable through unset** - `287782127` (feat)
3. **Task 3: The example root passes it through unset, and its plan has no web ACL** - `e7b168f8f` (feat)

## Files Created/Modified

- `infra/modules/frontend-service/waf.tf` - the count-gated web ACL
- `infra/modules/frontend-service/variables.tf` - `relay_rate_limit` with its validation and description
- `infra/modules/frontend-service/edge.tf` - `web_acl_id` on the distribution
- `infra/modules/frontend-service/outputs.tf` - `relay_web_acl_arn`, `distribution_web_acl_id`
- `infra/modules/frontend-service/tests/frontend_service.tftest.hcl` - the `aws_wafv2_web_acl` mock with a `global/webacl` ARN, and five runs
- `infra/envs/staging/aws/variables.tf`, `main.tf` - the root variable and pass-through
- `infra/envs/example/aws/variables.tf`, `main.tf`, `tests/plan.tftest.hcl` - the same, and the off assertion

## Test-count deltas

- Module `terraform test`: 33 to 38 (`relay_rate_limit_off`, `relay_rate_limit_on`, `relay_rate_limit_refuses_a_window`, `relay_rate_limit_refuses_below_ten`, `relay_rate_limit_refuses_a_fraction`).
- Example root `terraform test`: 1 run, unchanged in count; one assertion added.
- No E2E project is affected: nothing under `apps/`, `packages/` or `tests/` changed, and no route or helper is served by this change, so no targeted E2E run is required.

## Decisions Made

See `key-decisions` in the frontmatter: the 2000000000 upper bound is the provider's; the validation is written as a conditional; the example assertion reads module outputs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The module's own `terraform validate` fails at HEAD, so Task 1's `<verify>` chain could not exit 0 as written**
- **Found during:** Task 1
- **Issue:** `terraform -chdir=infra/modules/frontend-service validate` prints `Error: Provider configuration not present` for the first `aws.us_east_1` resource, because the module declares `configuration_aliases` and is being validated as a root. The same error appears on a `git archive HEAD` copy of the module at 137fe3487, before any change of this plan.
- **Fix:** the module was validated through both roots' `validate` (which validates the module call) and through the module's `terraform test`; every other step of each `<verify>` ran as written. Recorded in `deferred-items.md` § From 188-03.
- **Files modified:** none for the fix itself
- **Commit:** n/a

**2. [Rule 3 - Blocking] Two module outputs added for the example root's assertion (`outputs.tf` was not in the plan's files)**
- **Found during:** Task 3
- **Issue:** `length(module.frontend.aws_wafv2_web_acl.relay) == 0` in the example root test fails with `This object does not have an attribute named "aws_wafv2_web_acl"`: a root test cannot reference a module's resources.
- **Fix:** module outputs `relay_web_acl_arn` (`one(aws_wafv2_web_acl.relay[*].arn)`) and `distribution_web_acl_id` (the distribution's `web_acl_id`); the example test asserts both are null, with a comment naming `module.frontend.aws_wafv2_web_acl.relay`. The module's off and on runs pin both outputs. Red check: the example test with `-var 'relay_rate_limit={limit=300,window_seconds=300}'` fails.
- **Files modified:** `infra/modules/frontend-service/outputs.tf`, `infra/modules/frontend-service/tests/frontend_service.tftest.hcl`, `infra/envs/example/aws/tests/plan.tftest.hcl`
- **Commit:** `e7b168f8f`

## Verification run

- All `terraform` commands ran with `TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"` and `TF_DATA_DIR` in the session scratchpad (`tfdata-188-03-module`, `-staging`, `-example`), `init -backend=false -input=false`, `-lockfile=readonly` for the roots. The operator's `.terraform/` directories were not touched. No AWS call was made and nothing was applied.
- Module test: `Success! 38 passed, 0 failed.` Staging `validate` and example `validate`: `Success! The configuration is valid.` Example test: `Success! 1 passed, 0 failed.` `terraform fmt -check -recursive` on the module and both roots: exit 0, no file printed. `grep relay_rate_limit` in both `terraform.tfvars`: absent.
- Tracer gate (auto mode active): Task 1's `<verify>` re-run after the commit, with the validate step through the staging root, passed before expansion.

## Known Stubs

None.

## Threat Flags

None. The only new surface is the opt-in web ACL, which is in the plan's threat model (T-188-06, T-188-07).

## Next Phase Readiness

Plan 188-17 can plan the staging root with `-var 'relay_rate_limit={limit=...,window_seconds=...}'` against real state to record the resource list and cost, and with the variable unset to show the distribution unchanged.

## Self-Check: PASSED

- `infra/modules/frontend-service/waf.tf` exists; commits `45cc52e78`, `287782127`, `e7b168f8f` are ancestors of HEAD.
