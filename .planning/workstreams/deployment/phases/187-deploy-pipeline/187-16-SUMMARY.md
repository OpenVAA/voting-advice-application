---
phase: 187-deploy-pipeline
plan: "16"
subsystem: infra
tags: [bootstrap, iam, oidc, deploy-role, cloudtrail, policy-simulator]
status: complete

requires:
  - phase: 187-14
    provides: "the `staging` and `staging-destroy` environments, protected, whose subjects the deploy trust now names"
provides:
  - "`evidence/187-16-bootstrap-apply.md`: the tested tree (Task 1), the operator's Step 9 reply as stored (Task 2), and its check, item by item, with `STEP9_RESULT=applied` and three `STEP9_DEVIATION=` lines (Task 3)"
  - "AWS, by the operator's hand apply of `infra/bootstrap`: the nine `openvaa-deploy-*` policies attached to `openvaa-staging-deploy`, `ecr:DescribeImages` in `openvaa-ecr-push`, `repository_id` and `repository_owner_id` on both trusts, the `staging-destroy` subject, `openvaa-plan-lock` and its attachment removed"
  - "`infra/bootstrap/README.md` Step 9: runs in zsh; item 4 maps Application Auto Scaling, leaves out `sso:GetRoleCredentials`, and tells how to recognise another root's hand run; six dated § Observations rows"
affects: [187-18, 187-19, 187-21]

actuals:
  tokens: 9600
  tasks: 3
  commits: 2
plan_head_before: 14d497af16dd38cc81f36f29059f4595f65e7bfd
plan_head_after: c808126c3a7358cf533ccbbe57672a6e59108e77

tech-stack:
  added: []
  patterns:
    - "A CloudTrail event's IAM action is derived from its event source except where a service logs under another's source: Application Auto Scaling under `autoscaling.amazonaws.com`, mapped by event name"
    - "Shell blocks meant for zsh and bash brace every variable directly before a colon (`${A}:role`)"

key-files:
  created:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/187-16-SUMMARY.md
  modified:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-16-bootstrap-apply.md
    - infra/bootstrap/README.md

key-decisions:
  - "Step 9 was applied with s9c_uncovered_count=16, not 0: the operator ruled from the trail that none of the sixteen is a call of the staging AWS root (7 Application Auto Scaling actions logged under autoscaling.amazonaws.com and granted as application-autoscaling, 8 dns-mail root reads at 09:55Z on 2026-11-14, 1 SSO credential fetch); recorded as STEP9_DEVIATION, not as a 0"
  - "Item 4 of Step 9 now lets an uncovered line through only when every one of its events names another root's objects, recorded with a note: line; every other uncovered line still stops the step"

requirements-completed: []
requirements-advanced: [PIPE-01, PIPE-06, PIPE-08, INFRA-16, SUPA-08]

metrics:
  duration: "11h05min wall clock (2026-11-15T20:05Z to 2026-11-16T07:10Z), almost all of it the operator checkpoint overnight"
  completed: 2026-11-16
---

# Phase 187 Plan 16: The bootstrap hand apply of the deploy permissions Summary

```
STEP9_RESULT=applied
s9a_add=18
s9a_change=3
s9a_destroy=2
s9c_uncovered_count=16
```

**The operator applied Step 9 on 2026-11-16. The plan was exactly 18 to add, 3 to change and 2 to destroy, with the expected addresses. The simulator gave its seventeen decisions as the step expects. The apply and a second plan were clean. The read-back shows two plan policies, eleven deploy policies, both trusts with the two numeric ids, both environment subjects on the deploy trust, and the state bucket `AES256`, versioned and with all four public-access blocks. One check did not hold: the CloudTrail cross-check printed sixteen uncovered actions, where the plan requires none. The operator applied after ruling from the trail that none of them is a call of the AWS root the pipeline applies. That ruling is recorded as a deviation, and the count stays 16.**

## The deviations, as recorded

```
STEP9_DEVIATION=s9c_uncovered_count=16 where item 4 requires 0; applied on the operator's ruling that none is a call of the staging aws root: 7 Application Auto Scaling actions logged under autoscaling.amazonaws.com and granted as application-autoscaling in deploy_scaling, 8 iam/ses reads of the dns-mail root at 09:55:11Z-09:55:12Z on 2026-11-14, 1 sso:GetRoleCredentials of the admin session
STEP9_DEVIATION=item 3 cases pass_ecs, pass_lambda and tag_foreign_certificate first exited 254 (InvalidInput, ResourceNames are not in a valid ARN format) because zsh read $A:role and $A:certificate as the :r and :c modifiers, dropping the colon and the letter after it; rerun with ${A}, all three exited 0 with the expected decisions, seventeen decisions in all
STEP9_DEVIATION=a first item 2 ran with another alert address (s9a_change=4 incl. module.budget.aws_budgets_budget.monthly, s9a_addresses_match_exit=1); not applied; items 1 and 2 rerun clean
```

I checked the operator's ruling on the sixteen against the tree, without calling AWS:

- **Seven `autoscaling:` actions.** `deploy_scaling` in `infra/modules/github-oidc/deploy-policies.tf` grants all seven under `application-autoscaling:`. They were uncovered because item 4 derived the prefix from the event source, not because a policy lacks them.
- **Eight `iam:`/`ses:` reads.** IAM users and SES resources are declared only in `infra/modules/mail-ses`, which is the dns-mail root's module. Neither `infra/envs/staging/aws` nor its one module, `frontend-service`, declares an IAM user, an `aws_iam_policy` or an SES resource (grep exit 1). The 09:55Z time and the object names are the operator's reading of the trail. I could not see the trail myself.
- **`sso:GetRoleCredentials`.** This call is how the SSO portal hands out credentials, and it needs no IAM permission. The pipeline's OIDC credentials never make it.

The plan's prohibition "MUST NOT apply when ... an uncovered call is listed" was not met as written. The apply rests on the operator's ruling, and this plan records that ruling. It does not set the prohibition aside.

## Which HEAD was applied

`APPLY_COMMIT=b2a3c5dbd` was recorded at Task 1. The reply names no commit, so the evidence records `RUN_HEAD` as the checkout's current HEAD, `14d497af1`, and says so. Between the two commits, `infra/` changed only in `infra/bootstrap/README.md`, through `1e10dff7f`, which prints the hosted zone id apart. The reply's Route 53 decision lines are in that new form, so the operator ran a runbook at or after `1e10dff7f`. `git diff --quiet 1e10dff7f HEAD -- infra` exits 0, so the Terraform code applied is that of `APPLY_COMMIT`.

## Task commits

| Task | Commit | What |
|---|---|---|
| 1 | `81f16e2ae` (earlier agent) | The tested tree and the screen's DNS refusal |
| — | `1e10dff7f` (orchestrator, between Tasks 1 and 2) | Hosted zone id printed apart in the simulator lines |
| 2 | — | Operator checkpoint; reply stored by `attempt.sh put 187-16-2` (attempt `20261115T200552Z.81f16e2ae`), `bound` exit 0 |
| 3 | `e60443792` | Step 9 runs in zsh, item 4 reads the trail as the sitting did, six Observations rows |
| 3 | `c808126c3` | The Step 9 sitting recorded, checked item by item, with its three deviations |

The `commits: 2` value is measured from the ledger this continuation wrote at `14d497af1`. Task 1's commit and `1e10dff7f` come before it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Step 9's shell blocks failed in zsh**
- **Found during:** Task 2 (the operator's item 3)
- **Issue:** `$A:role` and `$A:certificate` are zsh history modifiers. I reproduced it locally: zsh prints `471112560111ole/x`.
- **Fix:** every variable directly before a colon in item 3 is now braced, including the `$R:` ones and `$A:distribution`, which happened to work. A sentence in the Step 9 preamble explains why.
- **Files modified:** `infra/bootstrap/README.md`
- **Commit:** `e60443792`

**2. [Rule 1 - Bug] Item 4 reported granted and permission-free calls as uncovered**
- **Found during:** Task 2 (the operator's item 4)
- **Issue:** Application Auto Scaling logs under `autoscaling.amazonaws.com`. `sso:GetRoleCredentials` needs no IAM permission. A hand run of another root inside the windows was not explained.
- **Fix:** the jq maps 13 Application Auto Scaling event names to `application-autoscaling`, `sso:GetRoleCredentials` is dropped along with `sts:GetCallerIdentity`, and new prose plus a read-only `jq` show how to recognise another root's lines. I tested this on a synthetic trail. On the 2026-11-14 trail it should print only the eight dns-mail lines, but that has not been rerun against the account.
- **Files modified:** `infra/bootstrap/README.md`
- **Commit:** `e60443792`

**3. Plan-level: `s9c_uncovered_count=0` not met.** See "The deviations, as recorded" above. The plan's Task 3 automated verify fails on exactly this one line (`grep -qx s9c_uncovered_count=0` exit 1). Every other line it checks is present, the runbook passes Prettier and the evidence contains no address. The `must_haves.artifacts` `contains: "s9c_uncovered_count=0"` is not met either.

## Known Stubs

None.

## Threat Flags

None. The apply changed IAM as the threat model registers (T-187-42, T-187-43). The evidence contains no address and no credential.

## Not yet observed (kept)

These are observed by plan 187-18's first workflow run: assuming the plan and deploy roles, refusal of a token with the wrong subject, and AWS's evaluation of `repository_id` and `repository_owner_id`. The pipeline's first deploy and destroy will show whether the policies hold every call they make.

## Self-Check: PASSED

- FOUND: `.planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-16-bootstrap-apply.md`
- FOUND: `infra/bootstrap/README.md` (Prettier check exit 0)
- FOUND: `81f16e2ae`, `1e10dff7f`, `e60443792`, `c808126c3` (ancestors of HEAD)
