---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "15"
subsystem: infra
status: complete
tags: [aws, cloudfront, alb, x-forwarded-for, xff-depth, origin-lock, diagnostics, runbook]
requires:
  - phase: 185-14
    provides: the running staging AWS stack, read with no drift
provides:
  - Step 9 of the staging AWS runbook observed, on and off, with the stack restored
  - evidence/185-15-headers-and-locks.md
  - XFF_DEPTH=2 confirmed from the headers that reach the container
  - five Step 9 runbook rows moved from "Not yet observed" to dated Observations
affects: [185-16, 185-17, 185-19, 185-20]
tech-stack:
  added: []
  patterns:
    - "Each address in x-forwarded-for is printed by role (spoof, viewer, edge); the edge entry is checked against the CloudFront prefix list with python3 -I ipaddress, printing yes/no only"
    - "The workstation's address is re-read from checkip in each command and compared to a hash kept in $L, so a change of address between commands would show"
    - "After an ECS rollout apply, the service is read until it lists one COMPLETED deployment before an after-read is trusted"
key-files:
  created:
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-15-headers-and-locks.md
  modified:
    - infra/envs/staging/aws/README.md
key-decisions:
  - "DEPTH_VERDICT=2-confirmed: XFF_DEPTH stays \"2\" and terraform.tfvars is unchanged"
  - "The restore's 404 was re-read after the service reached a steady state, because the apply returned with the old deployment still listed"
requirements-completed: [OBS-04, INFRA-06, INFRA-11, INFRA-03]
duration: 10min
completed: 2026-11-13
estimate_ref:
  tokens: 24000
  tasks: 3
actuals:
  tokens: 8300
  tasks: 3
  commits: 3
plan_head_before: c1bb8542fbd8348e18391c4ef592a43b1a716743
plan_head_after: 6fb78aee4f876a663a910149c53772a6c60bd48d
---

# Phase 185 Plan 15: The forwarded headers, the proxy depth and both origin locks Summary

```
DEPTH_VERDICT=2-confirmed
```

Depth 2 is right, and the record shows it. With diagnostics on, `x-forwarded-for` reached the
container as `viewer,edge`. With a client-sent `X-Forwarded-For: 203.0.113.99` it read
`spoof,viewer,edge`, so the spoof stays first, where depth 2 never reads it. The resolved client
address was the workstation's both times. Through a temporary `/32`, the listener refused a request
with no origin header and one with a wrong value (403, its own fixed response). It admitted the right
value with 200, and its port 80 answered 301 to HTTPS. An apply with neither override then restored
the stack. Diagnostics answers 404, the load balancer's group holds one rule, a direct request gets
no answer, and a plan shows no changes. `XFF_DEPTH` was not changed.

## What was done

Every Bash call set `AWS_PROFILE=openvaa-admin` with the key variables unset, in `eu-north-1`, and
asserted account 471112560111 before each AWS and Terraform call. Raw plans, plan JSON, apply logs
and bodies stayed in a `umask 077` `$L`, which was removed at the end. The workstation's address and
the origin secret were held in variables only and never printed.

- **Task 1 (tracer), items 1 to 4.**
  - The saved plan with `environment_overrides={DEPLOYMENT_DIAGNOSTICS="true"}` and the `/32` read
    `Plan: 3 to add, 1 to change, 1 to destroy.` It held exactly the stop rule's four changes. In the
    plan JSON, the container's environment differed only by `DEPLOYMENT_DIAGNOSTICS=true`.
  - The apply exited 0, from 11:15:33Z to 11:17:16Z.
  - The record: `XFF_ENTRIES_PLAIN=2`, `XFF_ENTRIES_SPOOFED=3`, `SPOOF_ENTRY_FIRST=yes`, both
    `CLIENT_ADDRESS_IS_VIEWER_*=yes`, `VIEWER_ADDRESS_HEADER_IS_VIEWER=yes`, `AMZ_CF_ID=present`,
    `X_FORWARDED_PROTO=https`, `VIA=present` and `CLIENT_ADDRESS_ERROR=null`.
  - Also read: the `edge` entry is inside the CloudFront origin-facing prefix list, and `via` names
    CloudFront.
  - The tracer gate: the verify was re-run before Task 2 and exited 0.
- **Task 2, item 5.** `LOCK2_NO_HEADER=403`, `LOCK2_WRONG_HEADER=403` and `LOCK2_RIGHT_HEADER=200`
  (health `ok`, the image tag as `build`). The 403 carries `server: awselb/2.0` and an empty
  `text/plain` body, the listener's `fixed_response`. Also `ALB_HTTP_REDIRECT=301
  location=https://origin.staging.openvaa.org:443/` and `ALB_SG_RULES_DURING=3`. The service ran
  revision 2, one task, `COMPLETED`.
- **Task 3, item 6.**
  - The restoring plan read `Plan: 1 to add, 1 to change, 3 to destroy.`, exactly the four stop-rule
    changes, with `DEPLOYMENT_DIAGNOSTICS=false` the only difference in the environment.
  - Recorded: `RESTORE_APPLY_EXIT=0`, `DIAGNOSTICS_AFTER=404`, `ALB_SG_RULES_AFTER=1` (prefix list
    on 443), `LOCK1_DIRECT_AFTER=no-answer` (curl 28, HTTP `000`) and `PLAN_AFTER_EXIT=0`.
  - The service now runs revision 3, with `DEPLOYMENT_DIAGNOSTICS=false` and `XFF_DEPTH=2`.
  - Five Step 9 rows moved to dated Observations, and the runbook is Prettier-clean.

## Verification

| Check                                                                                   | Exit |
| --------------------------------------------------------------------------------------- | ---- |
| Task 1 verify (record lines, verdict, no IPv4 outside the spoof and VPC ranges)         | 0    |
| Task 2 verify (both locks, the right header, the redirect)                              | 0    |
| Task 3 verify 1 (restore lines; no override in the tfvars; diagnostics `false` there)   | 0    |
| Task 3 verify 2: `prettier --check infra/envs/staging/aws/README.md`                    | 0    |
| Tasks 1 and 2 verifies re-run on the final tree                                         | 0    |
| `git diff --quiet HEAD -- infra/envs/staging/aws/terraform.tfvars`                      | 0    |
| `terraform plan -detailed-exitcode` after the restore                                   | 0    |

## Deviations from Plan

None. The plan was executed as written, and the verdict was `2-confirmed`, so the tfvars change that
Task 3 makes conditional was not needed.

### Scope notes

**1. [Beyond the runbook item] The restore's 404 re-read after the rollout settled**
- The restore apply returned at 11:21:48Z. At the first after-read, at 11:22:09Z, the service still
  listed two deployments, the new one `IN_PROGRESS`.
- The service's events show that the old target was already deregistered at 11:21:26Z, so that first
  404 was the new revision's.
- The service was read until it listed one `COMPLETED` deployment (11:22:38Z). Then five more
  requests to `/api/diagnostics` all answered 404.
- The runbook's item 6 reads straight after the apply. That read was sound here, and the
  Observations row records the timing. Step 11 will look at this same order (stop, then deregister).

**2. [Beyond the runbook item] Read by role from the same bodies**
- The seven allow-listed headers that arrived are recorded. `forwarded` and `x-forwarded-host` did
  not reach the container.
- `host` was `origin.staging.openvaa.org`, and the resolved origin was `ORIGIN`.
- The edge entry was checked against the prefix list.
- None of this changes the verdict.

### Plan assumptions, as flagged

- **OBS-04:** every address is named by role (`viewer`, `edge`, `spoof`) and never by value. The
  evidence holds no IPv4 literal except `203.0.113.99`.
- **INFRA-06:** depth 2 holds only while every request passes CloudFront and then the load balancer.
  This plan saw both locks refuse. A change to either lock re-opens this record.

## Known Stubs

None.

## Threat Flags

None.
- **T-185-33:** `DIAGNOSTICS_AFTER=404`, re-read five times after the steady state.
- **T-185-34:** `ALB_SG_RULES_AFTER=1`, and the tfvars hold no `debug_ingress_cidrs`.
- **T-185-35:** the origin secret went to `curl` through `-K <(...)` and was unset after use. The
  workstation's address was compared only by hash. The IPv4 scans of the evidence exit 0.
- **T-185-SC:** `init` ran with `-lockfile=readonly`, and nothing was installed.

## Self-Check: PASSED

- FOUND: evidence/185-15-headers-and-locks.md with every record line of Tasks 1 to 3, including `DEPTH_VERDICT=2-confirmed`
- FOUND: commits 1540dfdad, ca73ea556, 6fb78aee4 on HEAD
- FOUND: five dated Step 9 rows in the runbook's Observations, and no Step 9 row left in "Not yet observed"
- No STATE.md or ROADMAP.md edit; terraform.tfvars equals its pre-plan content
