---
phase: 187-deploy-pipeline
plan: "05"
subsystem: infra
tags: [terraform, aws-iam, github-oidc, trust-policy, runbook, simulator, cloudtrail, vitest]
status: complete

requires:
  - phase: 187-01
    provides: "The nine openvaa-deploy-* policies and ecr:DescribeImages in the github-oidc module, written but not applied"
provides:
  - "infra/bootstrap/terraform.tfvars: github_repository_id 546467466, github_repository_owner_id 115159211, and deploy_subjects with environment:staging and environment:staging-destroy"
  - "The plan_lock document, policy and attachment removed: the plan role holds ReadOnlyAccess and openvaa-plan-deny only; the deploy role's StateLock statement and local.pipeline_lock_arn unchanged"
  - "infra/scripts/bootstrap-tfvars.test.ts: seven cases guarding the ids, both subject lists, the absence of plan_lock and of a workflow pin, the plan role's two attachments and the deploy role's lock statement"
  - "infra/bootstrap/README.md Step 9: the hand-apply procedure of plan 187-16, its paste-back note, Step 4/5 after-Step-9 expectations, and the not-yet-observed rows"
affects: [187-08 pull-request plans with -lock=false, 187-16 hand apply of bootstrap, 187-18 first workflow run]

actuals:
  tokens: 8000
  tasks: 2
  commits: 3
plan_head_before: 383e083a1e0e1497f71dd4a7cdb3dbd8090a536c
plan_head_after: 34d603ddf9d651665ecb710cfedd97ddf8664b2f

tech-stack:
  added: []
  patterns:
    - "A tfvars guard that reads the file as text with comment lines dropped, and parses list values with a regular expression over the bracketed value"
    - "Runbook simulator cases through simulate-custom-policy --cli-input-json, built by jq from the saved plan's after values, every case given the role's whole policy set"
    - "CloudTrail cross-check: Terraform-user-agent events reduced to <service>:<eventName> and matched against the rendered Allow actions, a trailing * as a prefix"

key-files:
  created:
    - infra/scripts/bootstrap-tfvars.test.ts
  modified:
    - infra/bootstrap/terraform.tfvars
    - infra/modules/github-oidc/policies.tf
    - infra/bootstrap/README.md
    - infra/bootstrap/example.tfvars

key-decisions:
  - "Step 9's CloudTrail destroy window opens at 09:47Z, not 09:40Z: the read-only dns-mail plan ran at 09:46Z, and its calls are not the AWS root's, so they would have shown as false uncovered actions"
  - "Step 9 runs every simulator case against all eleven policies the deploy role will hold, so a refused case is refused by the whole set"
  - "Step 9 adds a second plan after the apply (s9d_second_plan_exit=0) and the plan trust's conditions (s9e_plan_condition=), because plan 187-16 requires the no-change plan and the ids are set on both trusts"
  - "The tfvars comment says the ids stay the same through a rename while the name-based subjects do not, so it does not claim that the trusts survive a rename"

patterns-established:
  - "A runbook stop rule that compares the saved plan's action-and-address set with an expected list using cmp, instead of reading 23 lines by eye"

requirements-completed: []

coverage:
  - id: D1
    description: "The tfvars carry both numeric ids and exactly the staging and staging-destroy deploy subjects; the plan subject is unchanged"
    requirement: PIPE-01
    verification:
      - kind: unit
        ref: "infra/scripts/bootstrap-tfvars.test.ts#assigns the numeric ids of the repository and of its owner; #lets the deploy role trust the staging and staging-destroy environments and nothing else; #lets the plan role trust pull requests and nothing else"
        status: pass
    human_judgment: false
  - id: D2
    description: "No .tf file of the github-oidc module names plan_lock or job_workflow_ref; the plan role has exactly the ReadOnlyAccess and plan_deny attachments; the deploy role's StateLock statement still names the lock object"
    requirement: PIPE-02
    verification:
      - kind: unit
        ref: "infra/scripts/bootstrap-tfvars.test.ts#gives the plan role no policy that names the state lock; #pins neither trust to a workflow; #attaches to the plan role the read-only policy and its deny, and nothing else; #keeps the deploy role's lock statement on the pipeline's lock object"
        status: pass
      - kind: other
        ref: "terraform -chdir=infra/modules/github-oidc test (8 passed); bootstrap validate with a scratch TF_DATA_DIR; terraform fmt -check -recursive infra; node scripts/assert-no-inline-iam-policies.mjs (0 findings)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Step 9 is written with every named line, formatted, and its jq and shell code run under bash and zsh against an offline-rendered plan of the module with a stubbed aws CLI"
    requirement: PIPE-08
    verification:
      - kind: other
        ref: "node_modules/.bin/prettier --check infra/bootstrap/README.md; the plan's grep for s9a_add= .. s9e_bucket_public_blocks="
        status: pass
    human_judgment: false
  - id: D4
    description: "The hand apply itself: plan 18/3/2, simulator decisions, s9c_uncovered_count=0, the apply and the read-back (SUPA-08 bucket clause)"
    requirement: SUPA-08
    verification: []
    human_judgment: true
    rationale: "Nothing is applied in this plan; the operator runs Step 9 against AWS in plan 187-16"

duration: 11min
completed: 2026-11-15
---

# Phase 187 Plan 05: Trust inputs, the plan role's lock, and bootstrap Step 9 Summary

**Expected plan line of Step 9: `Plan: 18 to add, 3 to change, 2 to destroy.`**

- The 18 added are the nine `aws_iam_policy.deploy_*` and their nine `aws_iam_role_policy_attachment.deploy_*`.
- The 3 changed in place are `aws_iam_role.plan`, `aws_iam_role.deploy` and `aws_iam_policy.ecr_push`.
- The 2 destroyed are `aws_iam_policy.plan_lock` and its attachment.
- Every address is under `module.github_oidc`.

**Both trusts now require the numeric ids of `OpenVAA/voting-advice-application` (546467466) and of its owner (115159211). The deploy trust also admits the `staging-destroy` environment. The plan role has lost its lock write and is read-only: `ReadOnlyAccess` plus its explicit deny. A seven-case unit guard holds all of this. Runbook Step 9 gives plan 187-16 a procedure that proves the permission set before any of it is applied. Nothing was applied, and no AWS call was made.**

## Performance

- **Duration:** about 11 min
- **Started:** 2026-11-15T02:04:59Z
- **Completed:** 2026-11-15T02:16:31Z
- **Tasks:** 2
- **Files modified:** 5 (1 created)

## Accomplishments

- **`terraform.tfvars`:**
  - `deploy_subjects` lists two environment subjects, `staging` and `staging-destroy` (the destroy workflow's environment, which holds no secret).
  - `github_repository_id = "546467466"` and `github_repository_owner_id = "115159211"` turn on the module's dynamic `repository_id` and `repository_owner_id` conditions in both trust documents.
  - `plan_subjects` is unchanged. Neither trust is pinned to a workflow.
- **`policies.tf`:**
  - `data.aws_iam_policy_document.plan_lock`, `aws_iam_policy.plan_lock` and `aws_iam_role_policy_attachment.plan_lock` are gone.
  - The file's opening comment and the attachment comment now say that the plan role is read-only and plans without the lock.
  - `local.pipeline_lock_arn` and the deploy role's `StateLock` statement are untouched.
- **`bootstrap-tfvars.test.ts`** has seven cases: the two ids, the deploy subject list, the plan subject list, no `job_workflow_ref`, no `plan_lock`, the plan role's attachments (exactly `ReadOnlyAccess` and `plan_deny`), and the deploy role's lock statement and local.
- **Runbook Step 9**, seven items:
  1. The opening lines: `AWS_PROFILE=openvaa-admin`, the account check, `printenv TF_VAR_alert_email`.
  2. The saved plan and its JSON. Prints `s9a_add/change/destroy/replace`, the three address lists, and `s9a_addresses_match_exit`, a `cmp` against the expected set.
  3. `simulate-custom-policy` on the eleven rendered policies. Nine cases print `s9b_decision=<action> <resource> <decision>`: a tagged and an untagged VPC create, an A and an MX record, PassRole to ECS tasks and to Lambda, Publish on the deployment topic and on another topic, and a GetObject of the `hand/` Supabase state.
  4. A CloudTrail `lookup-events` read in both regions for both windows. Prints `s9c_events`, `s9c_uncovered=` and `s9c_uncovered_count`.
  5. The apply of the saved plan, then a second plan.
  6. The read-back: the attached policies of both roles (2 and 11), both trusts' conditions, the bucket's encryption, versioning and public-access blocks (SUPA-08), and both inventory asserts.
  7. `$L` removed.
- **Elsewhere in the runbook:**
  - § Flow overview has a Step 9 line, and § What you paste back names Step 9's line prefixes.
  - Steps 4 and 5 state what their lines read after Step 9.
  - Two not-yet-observed rows now point at the first deploy workflow run. A new row covers the deploy policies holding every pipeline call; no row was removed.
- **`example.tfvars`** already carried the `deploy_hosted_zone_id` and `deploy_domain` stand-ins, added by 187-01. Its commented id lines now say where a fork reads the ids: `gh api repos/<owner>/<repo> --jq '.id, .owner.id'`.

## Task Commits

1. **Task 1 RED: failing guard** - `31ff63de6` (test)
2. **Task 1 GREEN: ids, destroy subject, plan_lock removed** - `bf14876cd` (feat)
3. **Task 2: Step 9, runbook rows, template comment** - `34d603ddf` (docs)

## TDD Gate Compliance

- **RED:** `node_modules/.bin/vitest run --config infra/vitest.config.ts bootstrap-tfvars --reporter=tap-flat -t "assigns the numeric ids"` exited 1.
  - The target test, "assigns the numeric ids of the repository and of its owner", failed on its assertion: `expected undefined to be '546467466'`.
  - `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`, tap format, 1 fail of 7, the other six skipped by the filter).
  - Semantic assessment: the failure has the intended cause. The id was not assigned in the tfvars, so the parser returned `undefined`. The file loaded, the test was discovered and the error was an assertion.
  - In the unfiltered run, 4 cases failed (ids, deploy subjects, `plan_lock` present, three plan attachments). The 3 that passed (plan subject, no workflow pin, deploy `StateLock`) guard behaviour that must not change.
- **Tracer gate:** after GREEN, the task's automated verify passed end to end: vitest 7/7, module `init` and `test` 8/8, bootstrap `validate` (scratch `TF_DATA_DIR`), `fmt -check`, and the inline-policy guard (0 findings).
- **REFACTOR:** none needed.

## Files Created/Modified

- `infra/scripts/bootstrap-tfvars.test.ts`: the guard.
- `infra/bootstrap/terraform.tfvars`: the ids and the second deploy subject.
- `infra/modules/github-oidc/policies.tf`: `plan_lock` removed, comments.
- `infra/bootstrap/README.md`:
  - Step 9.
  - The flow line and the paste-back bullet.
  - The after-Step-9 notes in Steps 4 and 5.
  - The not-yet-observed rows.
- `infra/bootstrap/example.tfvars`: where a fork reads the two ids.

## Decisions Made

See `key-decisions` above. The CloudTrail window is the one with consequences. If the dns-mail root's plan ran past 09:47Z, its calls can still appear as `s9c_uncovered=` lines. Such a line stops the step, so the error is in the safe direction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Accuracy] The tfvars comment does not claim the trusts survive a rename**
- **Found during:** Task 1
- **Issue:** The planned comment said that both trusts "survive a rename". The `sub` condition is name-based (module `main.tf`), so a rename still breaks both roles.
- **Fix:** The comment says the ids stay the same through a rename or transfer, and the name-based subjects do not.
- **Files modified:** infra/bootstrap/terraform.tfvars
- **Commit:** bf14876cd

**2. [Rule 1 - Correctness] CloudTrail destroy window starts at 09:47Z**
- **Found during:** Task 2
- **Issue:** 185-19 records a read-only `dns-mail` Terraform plan at 09:46Z, inside the planned 09:40Z to 10:00Z window. Its calls (Route 53 and mail reads) would print as uncovered and stop the sitting for nothing.
- **Fix:** The window is 09:47Z to 10:00Z, and the step says why.
  - The destroy started at 09:49:11Z.
  - The read calls of the destroy plan's refresh are also made by the re-apply's read-back and second plan in the 18:00Z to 18:20Z window.
- **Files modified:** infra/bootstrap/README.md
- **Commit:** 34d603ddf

**3. [Rule 2 - Completeness] Step 9 additions beyond the item list**
- **Found during:** Task 2
- **Issue:** Plan 187-16 requires a second no-change plan after the apply. The ids also apply to the plan trust, and Steps 4 and 5 still expected `openvaa-plan-lock` and three `allowed` lock decisions for the plan role.
- **Fix:**
  - Step 9 has `s9d_second_plan_exit`, `s9e_plan_condition=` lines, `s9e_assert_no_inline_exit` (`--assert-no-inline-under /openvaa/`), per-read `_exit` lines and `s9a_addresses_match_exit`.
  - Steps 4 and 5 each have a sentence stating their lines after Step 9.
  - `sts:GetCallerIdentity`, which needs no permission, is excluded from the cross-check, and CloudWatch's `monitoring` event source maps to the `cloudwatch` prefix.
- **Files modified:** infra/bootstrap/README.md
- **Commit:** 34d603ddf

**4. [Rule 3 - Already done] example.tfvars stand-ins**
- **Found during:** Task 2
- **Issue:** `deploy_hosted_zone_id` and `deploy_domain` stand-ins and the commented id lines were already present, added by 187-01.
- **Fix:** Only the comment saying where a fork reads the ids was added.
- **Commit:** 34d603ddf

---

**Total deviations:** 4 (2 Rule 1, 1 Rule 2, 1 Rule 3). **Impact:** each one makes a written claim or check accurate. No module or permission scope changed beyond the plan.

## Issues Encountered

- macOS has no `timeout`, so the full infra unit run went to the background: 5 files, 116 tests passed.
- `terraform console` in the bootstrap root refuses to run without an S3 backend init. The tfvars values were therefore checked by the guard and `fmt`, not by evaluation.
- Step 9's jq and shell code was exercised offline:
  - The test plan came from a scratch configuration that called the module with fake keys (`Plan: 30 to add`). It confirms that all 21 expected create and update addresses exist.
  - The `aws` CLI was a stub. The code ran under bash and zsh. A first version of the uncovered-action filter had a jq scoping bug that printed nothing; it was caught there and fixed before the README was written.

## Requirements

- PIPE-01, PIPE-02, PIPE-08 and SUPA-08 are covered here by the written inputs, the guard and the procedure.
- Per the operator notes, REQUIREMENTS.md was not changed. Those requirements are closed only when they are observed on the hosted pipeline, in plans 187-14 to 187-25.

## Threat Flags

None. The change narrows the plan role and adds trust conditions; it adds no new surface.

## User Setup Required

None in this plan. The operator runs Step 9 in plan 187-16.

## Next Phase Readiness

- Plan 187-08's pull-request plans must run with `-lock=false`, because the plan role can no longer write the lock.
- Plan 187-16 runs Step 9 at the commit it records as `APPLY_COMMIT`.

## Self-Check: PASSED

- All five files exist.
- Commits 31ff63de6, bf14876cd and 34d603ddf are ancestors of HEAD.
- Acceptance re-run:
  - `grep -c plan_lock policies.tf` = 0.
  - `grep -c environment:staging-destroy terraform.tfvars` = 1.
  - The plan-role attachment count is 2.
  - Step 9 heading count is 1, and Prettier passes.
  - All nine named lines are present, and both template stand-ins are present.
