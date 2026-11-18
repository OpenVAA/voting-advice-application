---
phase: 187-deploy-pipeline
verified: 2026-11-18T17:30:00Z
status: passed
score: 12/12 must-haves verified
covered_files:
  - ".github/workflows/deploy.yml"
  - ".github/workflows/destroy.yml"
  - ".github/workflows/infra-plan.yml"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-01-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-01-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-02-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-02-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-03-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-03-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-04-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-04-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-05-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-05-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-06-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-06-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-07-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-07-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-08-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-08-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-09-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-09-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-10-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-10-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-11-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-11-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-12-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-12-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-13-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-13-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-14-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-14-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-15-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-15-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-16-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-16-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-17-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-17-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-18-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-18-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-19-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-19-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-20-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-20-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-21-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-21-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-22-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-22-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-23-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-23-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-24-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-24-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-25-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-25-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-26-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-26-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-27-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-27-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-28-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-28-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-29-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-29-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-30-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-30-SUMMARY.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-31-PLAN.md"
  - ".planning/workstreams/deployment/phases/187-deploy-pipeline/187-31-SUMMARY.md"
  - "infra/modules/github-oidc/deploy-policies.tf"
  - "infra/scripts/build-push-image.sh"
  - "infra/scripts/check-destroy-plan.sh"
  - "infra/scripts/push-migrations.sh"
  - "infra/scripts/running-image-digest.sh"
  - "infra/scripts/workflowGuards.ts"
covered_digest: "v4:sha256:0024aecab94cbeace9bc7d37339a1f6aa3eadcf24661eeed7c6bb015bb63b802"
behavior_unverified: 0
overrides_applied: 0
---

# Phase 187: Deploy Pipeline Verification Report

**Phase Goal:** A push to the staging branch, a manual dispatch or an evidence push deploys the stack from GitHub Actions without stored keys, behind a gate and in a fixed order, and the run goes red when the build, the rollout or the smoke run fails.
**Verified:** 2026-11-18T17:30:00Z
**Status:** passed
**Re-verification:** No, initial verification

Method: the three workflows and the cited scripts and policies were read in the tree; every run id the evidence cites was re-read from GitHub with `gh run view` (not taken from the evidence files); the evidence lines were cross-checked against each other and against the plans' amended text; `yarn lint:workflows` (exit 0, actionlint found nothing in 3 workflows) and `yarn test:unit:infra` (13 files, 389 tests, all passed) were run here.

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
| -- | ----- | ------ | -------- |
| 1  | Workflows reach AWS through OIDC with no stored keys, by a read-only plan role and a deploy role bound to this repository and the staging environments | VERIFIED (see note A) | `deploy.yml`, `destroy.yml`, `infra-plan.yml` use `aws-actions/configure-aws-credentials` with `role-to-assume` from `vars.AWS_*_ROLE_ARN` and `id-token: write`, top-level `permissions: {}`; no `AWS_ACCESS_KEY_ID` is ever set from a secret (the only matches are the steps that blank them). `evidence/187-16-bootstrap-apply.md` § Task 3: deploy trust holds `aud`, `repository_id 546467466`, `repository_owner_id 115159211` and the two environment subjects; plan policies 2, deploy policies 11. |
| 2  | A token with the wrong subject is seen refused | VERIFIED | `infra-plan.yml` job `wrong-subject`. Re-read live: run 44088753527 (`deploy-evidence/187-red-2`) `wrong-subject` success; evidence prints `token_subject=repo:OpenVAA/voting-advice-application:ref:refs/heads/deploy-evidence/187-red-2`, `deploy_role_error=AccessDenied`, `plan_role_error=AccessDenied`, both statuses 254. The step passes only on `AccessDenied` from both roles. |
| 3  | A pull request from a fork gets no cloud credentials and its credentialed job shows as skipped | VERIFIED | `plan` job `if` requires `head.repo.full_name == github.repository`; no `pull_request_target` anywhere. Re-read live: run 44124810789 (fork PR 906) jobs `checks` success, `plan` skipped, `wrong-subject` skipped; evidence `FORK_ASSUME_STEPS=0`, artifacts 0. Same-repository PR run 44104573552: `plan` success. |
| 4  | The access token, DB password and service-role key live only in the pipeline environment and in Terraform state; no plan is uploaded as an artifact | VERIFIED | `staging` environment holds exactly `ALERT_EMAIL`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` (+3 variables); `staging-destroy` holds no secret and no variable (`evidence/187-14-environments.md`). No `upload-artifact` in the three workflows. Live: artifacts `total_count` 0 for green run 44270824581. Plan files are removed by an `always()` step. State bucket `AES256`, versioning `Enabled`, 4 public-access blocks (`187-16` `s9e_bucket_*`; `infra/modules/state-bucket/main.tf`). Smoke gate prints `PASS service-role-key-absent`. |
| 5  | On a PR the Terraform is formatted, validated and planned, the plan readable in the run; `example` is validated and planned in the same run; no workflow can apply it | VERIFIED | `infra-plan.yml` `checks` (fmt, validate of every root with a required-roots list, module tests, three example roots planned with mock providers) and `plan` (step summary prints the plan). Run 44104573552 evidence: `PR_EXAMPLE_PLANS=aws:40,dns-mail:15,supabase:4`, `PR_PLAN_IN_SUMMARY=yes`, `PR_PLAN_SUMMARY=Plan: 1 to add, 1 to change, 1 to destroy.` No workflow references `envs/example` for init/apply (grep of deploy.yml and destroy.yml empty). |
| 6  | A push to `deploy/staging`, a manual dispatch and a `deploy-evidence/**` push deploy staging; a push to `main` deploys nothing | VERIFIED | `deploy.yml` triggers: `deploy/staging`, `deploy-evidence/**` (minus the destroy branch), `workflow_dispatch`; `deploy-workflow.test.ts:148` asserts no main trigger. Live: run 44276384977 (`push`, `deploy/staging`) success, both jobs; green run 44270824581 (`deploy-evidence/187-green-4`) success. `evidence/187-22`: `MAIN_TRIGGER_IN_DEPLOY=no`, `MAIN_PUSHED=no`. A real push to `main` cannot be observed before the workflow is merged; the trigger list and its test are the evidence. |
| 7  | Apply only behind the Environment gate; serialised, never cancelled; image built once and deployed by digest; steps in order: migrations, functions, rollout, wait until stable | VERIFIED | `deploy.yml`: `environment: staging` on the one job that holds every write, `concurrency: staging-aws, cancel-in-progress: false` (shared with `destroy.yml`), `build` -> `plan -var image_digest=$DIGEST` -> migrations -> functions -> `apply` of the saved plan -> bounded `stable` poll (60 x 15 s). Run 44270824581: `GATE_REVIEW=approved` (live `approvals` entry), 33 steps in order, `build_exit=0`, `BUILD_DIGEST` equals `RUNNING_IMAGE_DIGEST` read from ECS, `RUNNING_IMAGE_REFERENCE=digest`; run 44276384977 attempt 2: `build_exit=3`, same digest reused, whole stack created around it. |
| 8  | The smoke run is the last stage and a failing smoke run fails the pipeline | VERIFIED (see note B) | `smoke` step ends `exit 1` on `smoke_exit != 0`, followed only by the served-build re-read, cleanup and alert. Green runs: `SMOKE_PASSED=2 passed`, five `PASS` lines (origin, sha, ref, project-id, service-role-key-absent). `DEV_SEED_ALLOW_REMOTE` appears in no workflow (grep of `.github` empty). A red smoke was not observed; the red that was observed is at build (truth 9). |
| 9  | One green and one red run are observed and recorded, the red one from a build broken on purpose | VERIFIED | Green: run 44270824581 (live: success, `deploy-evidence/187-green-4`, 331b5db28). Red: run 44088753181 (live: `deploy` failure, `deploy-evidence/187-red-2`); `[UNLOADABLE_DEPENDENCY] Could not load src/lib/does-not-exist-187-red`, `failed=build`, `build_exit=1`, steps 5-24 skipped, nothing hosted written (`HOSTED_WRITE=none`, served build unchanged). An earlier red (44042442257) is recorded and its hidden lines closed by plan 187-29. |
| 10 | The operator is notified when a build fails and when a deployment fails or rolls back, and each alert has been seen firing | VERIFIED | `Alert the operator` step (`failure() || cancelled()`) publishes to the deployment topic naming the stage. Fired at `build` (runs 44042442257 and 44088753181, `RED_ALERT_MAIL=arrived`, `RED2_ALERT_MAIL=arrived`, mail body quoted), at `plan`, `migrations` and `stable` (187-21 attempts 1-3, message ids recorded). The ECS rollback rule's firing is phase 185's `185-16-rollout-alert-signal.md`. Topic recreated and subscription confirmed after the redeploy (`SUBSCRIPTION_CONFIRMED=yes`). |
| 11 | A guarded destroy path removes the AWS stack and is seen unable to reach the Supabase root | VERIFIED | `destroy.yml` (own environment with no secret; refusal step; `check-destroy-plan.sh` guard requiring the deleted set to equal the state's managed set). Live: run 44285713407 success; evidence 187-24: `supabase_root_init_status=1`, `supabase_state_head_status=254`, `supabase_root_refused=yes`, `destroy_planned=40` = `STATE_RESOURCES_BEFORE=40`, `40 destroyed`, state empty after, the three other state objects unchanged by VersionId/ETag. Attempt 1 of the run (187-23) was rejected at `apply-destroy` and left staging intact. Redeploy from nothing (187-25) created the same 40. |
| 12 | The earlier code review's critical finding (CR-01, CloudFront/ACM tag scope bypass) is resolved | VERIFIED | Fixed in `f0b2287f2`; `deploy-policies.tf` statement `TagOwnedEdge` now requires `aws:ResourceTag/Project` and `/Root` for `cloudfront:TagResource` and `acm:AddTagsToCertificate`; `edge_tag_scope` module test; Step 9 simulator cases. The fix was marked "requires human verification (IAM evaluation)". That is now observed: the redeploy from nothing (run 44276384977 attempt 2) created the distribution and both certificates with the root's tags under the deploy role and logged no refused call. WR-06 (blind single approval) was ruled by the operator 2026-11-15 and recorded under Accepted risks. |

**Score:** 12/12 truths verified (0 present, behavior-unverified)

### Notes on judgement calls

- **A. "one GitHub Environment" (PIPE-01, SC 1).** The deploy role trusts two environment subjects, `staging` and `staging-destroy`, not one. This is the phase CONTEXT's ruling (line 24: the destroy path gets its own gate and holds no secret, which is what keeps it away from Supabase), not drift. The intent, no branch-wide trust and nothing outside named, gated environments, holds, and the deploy trust is further pinned by `repository_id` and `repository_owner_id`. This reads as intentional. To record it, add:

  ```yaml
  overrides:
    - must_have: "deploy role bound to this repository and one GitHub Environment"
      reason: "Two environments by design: staging (secrets) and staging-destroy (no secrets), so the destroy path cannot reach Supabase"
      accepted_by: "<operator>"
      accepted_at: "<ISO timestamp>"
  ```

  I did not write it, because the acceptance is the operator's to give. It does not change the status.
- **B. Smoke red.** Code and test-guarded; not seen red. The roadmap asks for the red run to come from a broken build, which was observed.
- **Plan 187-24's amended text** (commit 763298632, `COST_WINDOW_RULING=short-window`): the plan now carries no 2026-11-23 floor (the only remaining mention explains its removal). Its evidence has `DATE_OK=yes`, `COST_READ_RECORDED=yes` pointing at `185-22-cost.md` (36.96 and 44.26 USD a month over 2026-11-15/16). Judged against that, 187-24 is met. Approval keys 187-24-2 and 187-25-2 are recorded in the evidence as bound (`attempt.sh bound` / `has` exit 0) and are git-ignored, so not re-read here.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `.github/workflows/deploy.yml` | gated deploy, 658 lines | VERIFIED | substantive, actionlint clean, run live 5+ times |
| `.github/workflows/destroy.yml` | guarded destroy, 364 lines | VERIFIED | run 44285713407 |
| `.github/workflows/infra-plan.yml` | PR checks, plan, wrong-subject, 304 lines | VERIFIED | runs 44104573552, 44124810789, 44088753527 |
| `infra/modules/github-oidc/deploy-policies.tf` | deploy role's customer-managed policies incl. `TagOwnedEdge` | VERIFIED | exercised by pipeline create and destroy |
| `infra/scripts/{build-push-image,push-migrations,running-image-digest,check-destroy-plan}.sh`, `workflowGuards.ts` | pipeline helpers with tests | VERIFIED | 389 infra unit tests pass; each script is called by a workflow step |

### Key Link Verification

| From | To | Via | Status |
| ---- | -- | --- | ------ |
| `deploy.yml` build step | `build-push-image.sh` | `--repository-url`, `image_digest=` line parsed | WIRED (runs: exit 0 and exit 3 both observed) |
| build digest | plan and ECS task | `-var image_digest=$DIGEST`; ECS digest equals build digest | WIRED (`RUNNING_IMAGE_DIGEST_EQUALS_BUILD=yes`) |
| migrations step | `push-migrations.sh --confirmed-ref` | env `OPENVAA_DEPLOY_ENVIRONMENT` | WIRED (push and drift check observed, `drift_status=0`) |
| failing step | alert topic | outcome map -> `aws sns publish` | WIRED (message ids and mails recorded) |
| `destroy.yml` | `check-destroy-plan.sh` | guard before apply | WIRED (`destroy_guard=pass`) |
| `deploy.yml` smoke step | `yarn test:e2e:deployed` (phase 186) | `SMOKE_EXPECTED_SHA` | WIRED (2 passed per run) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Workflow lint | `yarn lint:workflows` | actionlint found nothing in 3 workflows | PASS |
| Infra script and workflow guard tests | `yarn test:unit:infra` | 13 files, 389 tests passed | PASS |
| Cited runs exist and conclude as recorded | `gh run view <id>` for 44270824581, 44276384977, 44285713407, 44088753181, 44088753527, 44042442257, 44104573552, 44124810789 | all match the evidence | PASS |

### Requirements Coverage

Every ID in the phase's requirement list appears in at least one PLAN's frontmatter `requirements`, and REQUIREMENTS.md maps no further ID to phase 187 (no orphans).

| Requirement | Source plans | Status | Evidence |
| ----------- | ------------ | ------ | -------- |
| PIPE-01 | 01, 05, 08, 11, 16, 18, 19, 25, 29 | SATISFIED (note A) | truths 1, 2 |
| PIPE-02 | 05-08, 15, 18, 19, 26-29 | SATISFIED | truth 5; CI run 44033456141 (`ci-evidence/187-final-4`) green except the accepted `dependency-audit` |
| PIPE-03 | 08, 20 | SATISFIED | truth 3 |
| PIPE-04 | 09, 10, 14, 18, 21-23, 29 | SATISFIED | truth 7 |
| PIPE-05 | 01-03, 06, 09, 12, 21, 22, 29-31 | SATISFIED | truth 7 |
| PIPE-06 | 01, 04, 09, 16, 21, 25-31 | SATISFIED | truth 7 |
| PIPE-07 | 09, 11, 13, 17, 21, 29 | SATISFIED | truth 8 |
| PIPE-08 | 05, 06, 10, 14, 16, 23-25, 29 | SATISFIED | truth 11 |
| PIPE-09 | 12, 18, 21, 29-31 | SATISFIED | truth 9 |
| PIPE-10 | 09-11, 14, 21, 22 | SATISFIED | truth 6 |
| INFRA-16 | 01, 09, 16, 18, 25, 29-31 | SATISFIED | truth 10 |
| INFRA-19 | 07, 08, 11, 12, 18, 19, 29 | SATISFIED | truth 5 |
| SUPA-08 | 05, 08, 09, 11-17, 19, 21, 26-28 | SATISFIED | truth 4 |

### Anti-Patterns Found

None blocking. `TBD|FIXME|XXX` over the phase's workflows, scripts, policies and roots matches only `mktemp ...XXXXXX` templates. No `upload-artifact`, no stub step.

### Advisories (non-blocking)

| # | Item | Why advisory |
| - | ---- | ------------ |
| 1 | `REQUIREMENTS.md` still shows `[ ]` and "Pending" for PIPE-02, -03, -04, -05, -07, -09, -10, INFRA-19, SUPA-08 and ROADMAP line 81 shows phase 187 unticked | Bookkeeping to be updated when the phase is closed; the code and evidence satisfy them. |
| 2 | CI run 44033456141 had `dependency-audit` red (17 third-party advisory rows), accepted by the operator through the phase-189 todo `2026-11-15-dependency-audit-third-party-advisories.md` | Outside this phase's must-haves; tracked for phase 189. |
| 3 | `deferred-items.md`: a split row in `infra/envs/staging/aws/README.md` § Observations (a `\|` inside a code span, cause unconfirmed) | Cosmetic documentation defect, left open on purpose. |
| 4 | WR-06: the single `staging` approval is given before the plan and the pending migrations are in view | Ruled by the operator 2026-11-15 and recorded under Accepted risks in `infra/README.md`. |
| 5 | Full `main.yaml` CI was last run on the tree of `ci-evidence/187-final-4`; later commits (plans 29-31) changed workflows and scripts, covered since by the workflows' own `checks` jobs (369 then 389 infra tests) on every deploy run | No full-CI re-run after plans 29-31. |

### Human Verification Required

None outstanding. The items the review fix report marked "requires human verification" (IAM evaluation of the tag scopes, EC2 request context, the scaling and ECS grants) were exercised by the destroy and the redeploy from nothing with no refused call logged (`evidence/187-25-redeploy.md` § The records).

### Gaps Summary

No gaps. The phase goal is met: three triggers deploy staging through OIDC, behind the `staging` gate, in the fixed order and by digest; failures at build, plan, migrations and stable were each seen turning the run red and publishing an alert; a green deploy, a red deploy from a deliberately broken build, a fork PR with skipped credentialed jobs, a refused wrong-subject token, a guarded destroy that could not reach the Supabase root, and a redeploy from nothing are all recorded and agree with GitHub's live state.

---

_Verified: 2026-11-18T17:30:00Z_
_Verifier: Claude (gsd-verifier)_
