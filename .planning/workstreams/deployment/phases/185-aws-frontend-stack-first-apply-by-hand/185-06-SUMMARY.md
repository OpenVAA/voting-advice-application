---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "06"
subsystem: infra
tags: [terraform, aws, cloudfront, acm, route53, application-auto-scaling, eventbridge, sns, terraform-test, mock-provider]

requires:
  - phase: 185-04
    provides: "infra/modules/frontend-service serving path (origin certificate, origin lock, service), the aws.us_east_1 alias in the staging root"
  - phase: 185-01
    provides: "RULING_ALERT_ADDRESS=profile: alert_email comes from TF_VAR_alert_email, never from tracked files"
provides:
  - "infra/modules/frontend-service/edge.tf: viewer certificate in us-east-1, the CloudFront distribution with two behaviours, A and AAAA apex aliases"
  - "infra/modules/frontend-service/scaling.tf: scalable target, CPU target tracking, scheduled floor changes"
  - "infra/modules/frontend-service/alerts.tf: EventBridge rule for SERVICE_DEPLOYMENT_FAILED, SNS topic with a resource policy, email subscription"
  - "Module variables price_class, task_ceiling, cpu_target_percent, scheduled_floor_changes, schedule_timezone, alert_email (sensitive)"
  - "Outputs url, distribution_id, distribution_domain_name, viewer_certificate_arn, origin_certificate_arn, deployment_alert_topic_arn, passed through the staging root"
  - "The offline module test grown from 23 to 32 runs"
affects: [185-11, 185-12, 185-14, 185-15, 185-16, example-aws-root]

actuals:
  tokens: 6829
  tasks: 2
  commits: 2
plan_head_before: dba77e567bb328f3dc8e85a497fab2e82f1bd030
plan_head_after: d7938b3295ec37f422e262cd95a9270f11b5cd6a

tech-stack:
  added: []
  patterns:
    - "A second mock_provider block for the aws.us_east_1 alias, with its own ARN and validation-option defaults for the viewer certificate"
    - "Custom error responses built with a dynamic block over a local list of the eleven codes CloudFront accepts"
    - "Scheduled actions keyed by a name the variable's validation keeps distinct"

key-files:
  created:
    - infra/modules/frontend-service/edge.tf
    - infra/modules/frontend-service/scaling.tf
    - infra/modules/frontend-service/alerts.tf
  modified:
    - infra/modules/frontend-service/variables.tf
    - infra/modules/frontend-service/outputs.tf
    - infra/modules/frontend-service/tests/frontend_service.tftest.hcl
    - infra/envs/staging/aws/main.tf
    - infra/envs/staging/aws/variables.tf
    - infra/envs/staging/aws/terraform.tfvars
    - infra/envs/staging/aws/outputs.tf

key-decisions:
  - "The viewer certificate and its validation use provider = aws.us_east_1, as the plan requires. The per-resource region argument was not used, so the certificate keeps the alias's account guard and tags"
  - "The managed CloudFront policies are read by name (Managed-CachingOptimized, Managed-CachingDisabled, Managed-AllViewerExceptHostHeader). A comment in edge.tf gives the documented ids as the fallback; whether the names match is settled by the first real plan"
  - "The default behaviour also sets compress = true. Compression changes no caching under CachingDisabled"
  - "Validations beyond the plan's list: price_class must be one of the three classes, cpu_target_percent must be in (0, 100], scheduled change names must be distinct and made of letters, digits and hyphens, and alert_email must have the shape of an address"
  - "The staging root's alert_email has no default, so a plan without TF_VAR_alert_email asks for it. No alert_email line is in terraform.tfvars, per RULING_ALERT_ADDRESS=profile"
  - "No log group, log driver or metric filter was changed. The deferred multi-line logger item from 185-03 is unaffected"

patterns-established:
  - "A module that uses a configuration_aliases provider in a resource is validated through a root that passes the alias, and by terraform test with a mock for the alias. A standalone validate of the module directory cannot do it"

requirements-completed: [INFRA-03, INFRA-07, INFRA-12, INFRA-13, INFRA-14]

coverage:
  - id: D1
    description: "CDN: immutable behaviour on CachingOptimized, default behaviour on CachingDisabled plus AllViewerExceptHostHeader with seven methods, one HTTPS origin with x-origin-verify set to the origin secret, eleven error responses with TTL 0, viewer certificate for <domain>, A and AAAA apex aliases"
    requirement: INFRA-14
    verification:
      - kind: unit
        ref: "infra/modules/frontend-service/tests/frontend_service.tftest.hcl#cdn, price_class_refuses_an_unknown_class"
        status: pass
    human_judgment: false
  - id: D2
    description: "Viewer certificate and its validation through aws.us_east_1 (two provider lines); every other resource on the default provider"
    requirement: INFRA-13
    verification:
      - kind: other
        ref: "grep -c 'provider *= *aws.us_east_1' infra/modules/frontend-service/edge.tf = 2; terraform -chdir=infra/envs/staging/aws validate (aws 6.68.0, lock file read-only)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Scaling between floor 1 and ceiling 2 at 60 % CPU, no scheduled action by default and two from a two-entry list, with the time zone; ceiling below floor, min above max and a repeated name are refused"
    requirement: INFRA-07
    verification:
      - kind: unit
        ref: "infra/modules/frontend-service/tests/frontend_service.tftest.hcl#scaling, two_scheduled_changes_make_two_actions, task_ceiling_refuses_below_the_floor, scheduled_change_refuses_min_above_max, scheduled_change_refuses_a_repeated_name"
        status: pass
    human_judgment: false
  - id: D4
    description: "Deployment alert: the rule matches SERVICE_DEPLOYMENT_FAILED for this service's ARN, the target is the unencrypted topic, the topic policy admits only events.amazonaws.com with aws:SourceArn equal to the rule's ARN, the subscription mails alert_email"
    verification:
      - kind: unit
        ref: "infra/modules/frontend-service/tests/frontend_service.tftest.hcl#deployment_alert, alert_email_refuses_a_non_address"
        status: pass
    human_judgment: false
  - id: D5
    description: "No inline IAM policy under infra/; task_ceiling = 2 in the staging tfvars; no alert_email line in tfvars; no route-level cache-control added to the application (7 before, 7 after)"
    verification:
      - kind: other
        ref: "node scripts/assert-no-inline-iam-policies.mjs (56 .tf files, 0 findings); greps from the plan's acceptance criteria"
        status: pass
    human_judgment: false
  - id: D6
    description: "Infra unit suite"
    verification:
      - kind: unit
        ref: "yarn test:unit:infra (3 files, 102 tests passed)"
        status: pass
    human_judgment: false
  - id: D7
    description: "On AWS: the managed policy names resolve, the edge caches only immutable assets (misses on pages), HTTP gets CloudFront's 301, and a failed rollout mails the operator"
    verification: []
    human_judgment: true
    rationale: "Nothing in this plan plans or applies against AWS. Mock providers check the configuration, not AWS's behaviour; those observations belong to later plans in the phase."

duration: 5min
completed: 2026-11-12
status: complete
---

# Phase 185 Plan 06: CDN, Scaling and Deployment Alert Summary

**The frontend module is now complete. A CloudFront distribution serves `<domain>` (A and AAAA aliases) with a DNS-validated viewer certificate in us-east-1, issued through the `aws.us_east_1` alias. Its only origin is `origin.<domain>` over HTTPS, and it sends the 48-character `x-origin-verify` secret. Only `/_app/immutable/*` is cached (CachingOptimized). Everything else goes through CachingDisabled with AllViewerExceptHostHeader and all seven methods allowed, and the eleven error codes have an error-caching TTL of 0. Application Auto Scaling keeps the service between 1 and 2 tasks at 60 % CPU, and optional scheduled actions can change those bounds. An EventBridge rule on this service's failed deployments publishes to an SNS topic, which mails `alert_email` (a sensitive variable). The offline test now has 32 runs.**

## Performance

- **Duration:** about 5 min
- **Started:** 2026-11-12T17:24:25Z
- **Completed:** 2026-11-12T17:29:00Z
- **Tasks:** 2
- **Files modified:** 10 (3 created, 7 modified)

## Accomplishments

- `edge.tf`:
  - `aws_acm_certificate.viewer` and `aws_acm_certificate_validation.viewer` are created through `aws.us_east_1`. The validation records sit in the zone `origin.tf` reads, keyed by name in the same way as the origin's.
  - Three data sources read the managed policies by name. The documented ids are in a comment, as the fallback.
  - The distribution has IPv6 on and `http2and3`, `aliases = [var.domain]`, `price_class = var.price_class` and `wait_for_deployment = true`. Its one origin is `load-balancer` (`https-only`, `TLSv1.2`, with the secret header). There are two behaviours, both `redirect-to-https`. A dynamic `custom_error_response` sets TTL 0 for each of the eleven codes. The certificate is used as `sni-only` with `TLSv1.2_2021`, and there is no geo restriction.
  - `aws_route53_record.apex` holds the A and AAAA alias records.
- `scaling.tf`: the scalable target on `service/<cluster>/<service>`, the CPU target-tracking policy (scale-in cooldown 300 s, scale-out 60 s), and `aws_appautoscaling_scheduled_action.floor[<name>]`. A comment warns that a plan between a raising action and a lowering action shows drift.
- `alerts.tf`:
  - The topic `<name>-frontend-deployments` has no server-side encryption, and a comment explains why.
  - The rule `<name>-frontend-deployment-failed` matches `aws.ecs`, `ECS Deployment State Change` and `SERVICE_DEPLOYMENT_FAILED`, with `resources = [aws_ecs_service.app.id]`.
  - The event target is the topic. The topic policy is a resource policy built with `jsonencode`, and it admits only that rule.
  - The email subscription carries a comment that it stays pending until confirmed.
- The staging root passes `task_ceiling`, `scheduled_floor_changes` and `alert_email` to the module, and declares them. `alert_email` is sensitive and has no default. The tfvars sets `task_ceiling = 2`, and its header says that `alert_email` comes from `TF_VAR_alert_email`. All six new module outputs are passed through.

## Task Commits

1. **Task 1: The CDN, from the viewer certificate to the apex records**: `84fa903ac` (feat). Tracer gate in auto mode: the verify was re-run and passed, apart from the module-directory `validate` (see Deviations), so work went on to Task 2.
2. **Task 2: Scaling and the deployment alert, and the root's inputs**: `d7938b329` (feat)

## Files Created/Modified

- `infra/modules/frontend-service/edge.tf`: viewer certificate, validation, managed-policy lookups, distribution, apex records
- `infra/modules/frontend-service/scaling.tf`: scalable target, CPU policy, scheduled actions
- `infra/modules/frontend-service/alerts.tf`: topic, rule, target, topic policy, subscription
- `infra/modules/frontend-service/variables.tf`: `price_class`, `task_ceiling`, `cpu_target_percent`, `scheduled_floor_changes`, `schedule_timezone`, `alert_email`
- `infra/modules/frontend-service/outputs.tf`: `url`, `distribution_id`, `distribution_domain_name`, `viewer_certificate_arn`, `origin_certificate_arn`, `deployment_alert_topic_arn`
- `infra/modules/frontend-service/tests/frontend_service.tftest.hcl`:
  - mock defaults added: the us-east-1 certificate and validation, the ECS service id, the SNS topic and the event rule ARNs
  - `alert_email` added to the shared variables
  - 9 new runs: `cdn`, `price_class_refuses_an_unknown_class`, `scaling`, `two_scheduled_changes_make_two_actions`, `deployment_alert`, `task_ceiling_refuses_below_the_floor`, `scheduled_change_refuses_min_above_max`, `scheduled_change_refuses_a_repeated_name`, `alert_email_refuses_a_non_address`
- `infra/envs/staging/aws/main.tf`, `variables.tf`, `terraform.tfvars`, `outputs.tf`: the new inputs and outputs

## Decisions Made

See `key-decisions` in the frontmatter. The main ones:
- The plan's alias design is kept as written.
- The managed policies are looked up by name.
- The extra validations make a mistyped input fail the plan with a named error.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The module-directory `terraform validate` step cannot pass while a resource uses the configuration alias**
- **Found during:** Task 1 verify
- **Issue:** `terraform -chdir=infra/modules/frontend-service validate` fails with "Provider configuration not present ... provider[\"registry.terraform.io/hashicorp/aws\"].us_east_1". Terraform 1.16.5 cannot validate a module directory on its own when one of its resources uses a `configuration_aliases` provider, because only a caller supplies that configuration. In 185-04 the same step passed because no resource used the alias yet. The plan requires `provider = aws.us_east_1` (its acceptance grep counts 2), so moving to the per-resource `region` argument would have broken the plan's contract.
- **Fix:** the alias stays. The module's configuration is validated in two other ways:
  - `terraform -chdir=infra/envs/staging/aws validate`, which passes the alias and runs against the locked aws 6.68.0. CI's `infra-validate` job validates only roots, and this root is one of them.
  - `terraform test` in the module directory, which validates, plans and applies every run against mocks of both providers.
  Every other step of both verify commands ran as written and passed.
- **Files modified:** none (a verify-step substitution)
- **Commit:** 84fa903ac

---

**Total deviations:** 1 (blocking, in the verify only). **Impact on plan:** none on scope or on what is built.

## Issues Encountered

- The module directory resolves aws 6.73.0 from the plugin cache, while the staging root is locked at 6.68.0. The staging root's validate passed, so every argument the new files use exists in the pinned version.
- In aws 6.x, `scalable_target_action.min_capacity` is a string attribute, so the test compares it with `"2"` and `"1"`.

## Known Stubs

None.

## Threat Flags

None. The new surface is what the threat model lists:
- T-185-15: CachingDisabled on the default behaviour, and error TTL 0.
- T-185-16: CloudFront overwrites a header of the same name sent by a viewer. A comment in `edge.tf` says so.
- T-185-17: `alert_email` is sensitive, has no tracked value, and the root variable has no default.
- T-185-SC: no new provider, and the root's `init` used `-lockfile=readonly`.

## User Setup Required

Before the first plan of the staging root, `TF_VAR_alert_email` must be visible in the agent's shells (`RULING_ALERT_ADDRESS=profile`). Without it the plan asks for the value. After each apply that creates the subscription, the owner of the address confirms it from the AWS mail.

## Next Phase Readiness

- The whole AWS frontend stack now exists as tested Terraform in one module, ready for its first plan.
- The first real plan will show whether the `Managed-*` policy names resolve. If they do not, switch the three lookups to the ids given in the `edge.tf` comment.

## Self-Check: PASSED

- FOUND: infra/modules/frontend-service/edge.tf, scaling.tf, alerts.tf
- FOUND: 84fa903ac, d7938b329 (both ancestors of HEAD)
