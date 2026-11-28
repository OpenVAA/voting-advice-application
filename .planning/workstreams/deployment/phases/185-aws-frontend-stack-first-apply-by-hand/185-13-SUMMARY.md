---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "13"
subsystem: infra
status: complete
tags: [aws, terraform, first-apply, cloudfront, ecs, security-groups, sns, cost-allocation-tags, runbook]
requires:
  - phase: 185-11
    provides: the two parameters and the execution role, read back
  - phase: 185-12
    provides: the image 712947a1bd44a735f66ee8f51610f4748d76cd30 and image_tag pinned
provides:
  - the running staging AWS stack (every resource of module.frontend), state at pipeline/staging/aws/terraform.tfstate
  - https://staging.openvaa.org/api/health answering 200 through CloudFront with build 712947a1bd44a735f66ee8f51610f4748d76cd30
  - the confirmed SNS subscription of the deployment alert
  - an offline module test of EC2's description character set for every security group and rule
  - evidence/185-13-first-apply.md
affects: [185-14, 185-19, 185-20]
tech-stack:
  added: []
  patterns:
    - "Mock-provider module tests cannot see a provider API's own input validation; a description's character set is asserted with can(regex()) in the module's tftest"
    - "A partial apply is completed by a new saved plan whose expected shape is exactly the missing creates, never by -target or a state edit"
key-files:
  created:
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-13-first-apply.md
  modified:
    - infra/modules/frontend-service/main.tf
    - infra/modules/frontend-service/tests/frontend_service.tftest.hcl
    - infra/envs/staging/aws/README.md
    - infra/README.md
key-decisions:
  - "Operator ruling (2026-11-13, option 'Fix and re-apply'): after the first apply stopped at 39 of 40 on the CloudFront ingress rule's description, the description was fixed with an offline test, and a new saved plan of exactly that one create was applied; no destroy, -target or state edit"
  - "The evidence records FIRST_APPLY_EXIT=1 and FOLLOWUP_APPLY_EXIT=0; the plan's FIRST_APPLY_EXIT=0 line is not written, by the same ruling"
  - "'One apply brings up the whole stack' stays under the runbook's 'Not yet observed', now also checked by Step 17, the re-apply after the destroy"
  - "The cost-allocation tags were activated before this plan's apply (Cost Explorer LastUpdatedDate 2026-11-13T08:23:36Z), not at it; Election, also Active, is recorded on its own line as operator-initiated"
requirements-completed: [INFRA-01, INFRA-02, INFRA-03, INFRA-05, INFRA-10, INFRA-13]
duration: 84min
completed: 2026-11-13
estimate_ref:
  tokens: 24000
  tasks: 3
actuals:
  tokens: 8600
  tasks: 3
  commits: 3
plan_head_before: 4a88e2922310b924083ef2b7663416a39e0dea04
plan_head_after: 446ba786d207dfd6337b254b91f38b3acd6582a7
---

# Phase 185 Plan 13: The first apply of the staging AWS root Summary

```
FIRST_APPLY_EXIT=1
FOLLOWUP_APPLY_EXIT=0
HEALTH_BUILD=712947a1bd44a735f66ee8f51610f4748d76cd30
```

The staging AWS stack runs and answers `https://staging.openvaa.org/api/health` with 200 through
CloudFront, with the image's commit id as `build`. It took two applies, not one. The first plan held
40 creates and nothing else, all under `module.frontend`. Its apply created 39 of them and stopped on
the CloudFront ingress rule, because EC2 refuses an apostrophe in a rule description. After a fix
commit, which also added an offline test of the character set, a new saved plan of exactly that one
create was applied. A `-detailed-exitcode` plan then exited 0. The alert's subscription reads
confirmed, and `Project`, `Environment` and `Root` (and `Election`) read `Active`.

**The single from-nothing apply is still to be seen.** It is the re-apply after the destroy, in
plans 185-19/20 (runbook Step 17).

## What was done

- **Task 1 (tracer):** Step 5 of the staging AWS runbook. `AWS_PROFILE=openvaa-admin` in
  `eu-north-1`, the account asserted 471112560111 before every call, and `TF_VAR_alert_email`
  checked with `test -n` only.
  - `init -lockfile=readonly` exit 0.
  - First plan: `Plan: 40 to add, 0 to change, 0 to destroy.`, with `planned_create=40` and
    `outside_module=0`.
  - Apply 09:42:30Z to 09:47:12Z, exit 1, 39 creates. `Error: creating VPC Security Group Rule` on
    `load_balancer_from_cloudfront`, `InvalidParameterValue: Invalid rule description`.
  - Fix commit f80f94c74. Follow-up saved plan: `Plan: 1 to add, 0 to change, 0 to destroy.`, that
    rule only. Its apply exited 0 (10:10:02Z to 10:10:08Z).
  - No-change plan exit 0. State object `AES256`, versioned.
  - Health 200, `x-cache: Miss from cloudfront`, `build` equal to the tag.
  - The tracer gate: the verify was re-run end-to-end after the follow-up apply, with the
    substitution below, and passed before expanding to Task 2.
- **Task 2 (checkpoint, blocking-human):** attempt `20261113T101336Z.daff992e1`. Before any reply,
  the agent read the subscription as `email confirmed` and the four tags as `Active`. The operator
  answered yes to both ("about an hour ago", at 10:58Z).
- **Task 3:**
  - The reply was stored with `attempt.sh put`, `OPERATOR_REPLY=received …` was appended, and
    `bound` exits 0.
  - The Step 6 read was repeated at 10:59Z with the same result.
  - Seven dated rows moved to the runbook's Observations (five for Step 5, two for Step 6).
  - The Roots table's "Ever applied" for `envs/staging/aws` reads "Yes, first on 2026-11-13".
  - Prettier is clean. `$L` and both saved plan files were removed.

## Verification

| Check | Exit |
| --- | --- |
| Task 1 verify, literal (plan text) | 1: `missing: FIRST_APPLY_EXIT=0`; every other line passes |
| Task 1 verify, `FIRST_APPLY_EXIT=0` replaced by `FIRST_APPLY_EXIT=1` + `FOLLOWUP_APPLY_EXIT=0` | 0 |
| Task 2 verify, literal (`grep -qx 'FIRST_APPLY_EXIT=0'`) | 1 |
| Task 2 verify, substituted | 0 |
| Task 3 verify (`SUBSCRIPTION_CONFIRMED=yes`, `COST_TAGS_ACTIVE=Project,Environment,Root`, Prettier on both READMEs) | 0 |
| `terraform test` of `infra/modules/frontend-service`: before the fix 32 passed, 1 failed; after it 33 passed | 0 |
| `terraform fmt -check -recursive infra` | 0 |
| `terraform validate` of `envs/staging/aws` and `envs/example/aws` | 0 |
| Acceptance: `git status --porcelain` after each task lists only the plan's files; no plan file or log in the repository | clean |

## Deviations from Plan

### Operator-ruled override

**1. [Operator ruling, option "Fix and re-apply", 2026-11-13] The first apply failed and was completed by a one-create follow-up apply**
- **Found during:** Task 1, item 5.
- **Issue:** EC2 refused the description `HTTPS from CloudFront's origin-facing addresses.`. The
  apostrophe lies outside `a-zA-Z0-9. _-:/()#,@[]+=&;{}!$*`. The apply exited 1 after 39 of its
  40 creates.
- **Ruling:**
  - Fix the description, and add an offline test that checks every security group and rule
    description against EC2's set.
  - Re-plan with the same inputs, expecting exactly 1 to add; stop on anything else.
  - Apply that saved plan.
  - Record `FIRST_APPLY_EXIT=1`, and never write anything implying the first apply succeeded.
- **Consequence for the plan's gates:** the literal verify of Tasks 1 and 2 looks for
  `FIRST_APPLY_EXIT=0`, which is not written. Both literal runs exit 1 on that line alone. With it
  replaced by `FIRST_APPLY_EXIT=1` and `FOLLOWUP_APPLY_EXIT=0`, both exit 0.
- **Must-have truth not met as worded:** "made one plan … and applied that saved plan" is not true
  as worded: there were two saved plans and two applies. The certificate validations did complete
  inside the first apply.
- **Commits:** f80f94c74 (fix and test), daff992e1 (evidence).

### Auto-fixed Issues

**2. [Rule 1 - Bug] Security-group rule description outside EC2's character set**
- **Found during:** Task 1
- **Fix:** the description now reads `HTTPS from the CloudFront origin-facing prefix list.`. The
  module's other six descriptions were checked and already lay inside the set. The new run
  `descriptions_use_the_ec2_character_set` asserts all eight: two groups, four rules and the two
  debug rules, which exist because one debug address is set.
- **Files modified:** infra/modules/frontend-service/main.tf, infra/modules/frontend-service/tests/frontend_service.tftest.hcl
- **Commit:** f80f94c74

### Scope notes

**3. [Scope] Step 5 runbook rows moved in Task 1, Step 6 rows in Task 3**
- Each row moved when its observation was seen.
- The "Not yet observed" opening sentence ("This root has not been applied yet.") now says the root
  was first applied on 2026-11-13, in two applies.
- The row "One apply brings up the whole stack" stays, and now also names Step 17.

**4. [Fact differs from the plan's wording] The cost tags were activated before the apply, not at it**
- Cost Explorer's `LastUpdatedDate` for all four tags is 2026-11-13T08:23:36Z. That fits the
  operator's report before the first dispatch (about 08:26Z), and it is earlier than the operator's
  later "about an hour ago" (about 09:58Z). Both facts are recorded and no precise minute is
  invented.
- Billing offered the tags because the bootstrap and `dns-mail` resources carried them
  (`LastUsedDate` 2026-11-01).

**5. [Process] The first executor run stopped on a Claude API error after the apply**
- The orchestrator checked the disk before resuming. No terraform process was running, there were no
  commits and the tree was clean. The plan file was removed before any new plan.

## Known Stubs

None.

## Threat Flags

None beyond the plan's threat model. The site is public from this apply on (T-185 boundary
"internet → staging.openvaa.org"). No plan file, log or `terraform show` output entered the
repository. The alert address appears in no command, transcript or tracked file.

## Self-Check: PASSED

- FOUND: evidence/185-13-first-apply.md with `FIRST_APPLY_EXIT=1`, `FOLLOWUP_APPLY_EXIT=0`, `SECOND_PLAN_EXIT=0`, `HEALTH_BUILD=712947a1bd44a735f66ee8f51610f4748d76cd30`, `SUBSCRIPTION_CONFIRMED=yes`, `COST_TAGS_ACTIVE=Project,Environment,Root`, `COST_TAGS_ALSO_ACTIVE=Election`
- FOUND: commits f80f94c74, daff992e1, 446ba786d on HEAD
- FOUND: infra/README.md Roots row `envs/staging/aws` "Yes, first on 2026-11-13"
