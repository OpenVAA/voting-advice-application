---
phase: 190-multi-deployment-bootstrap
verified: 2026-11-27T09:39:22Z
status: human_needed
score: 11/14 must-haves verified
covered_files: [".github/workflows/deploy.yml",".github/workflows/destroy.yml",".github/workflows/infra-plan.yml",".gitignore",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-01-PLAN.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-01-SUMMARY.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-02-PLAN.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-02-SUMMARY.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-03-PLAN.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-03-SUMMARY.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-04-PLAN.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-04-SUMMARY.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-05-PLAN.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-05-SUMMARY.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-06-PLAN.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-06-SUMMARY.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-07-PLAN.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-07-SUMMARY.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-08-PLAN.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-08-SUMMARY.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-09-PLAN.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-09-SUMMARY.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-10-PLAN.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-10-SUMMARY.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-11-PLAN.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-11-SUMMARY.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-12-PLAN.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-12-SUMMARY.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-13-PLAN.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-13-SUMMARY.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-14-PLAN.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-14-SUMMARY.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/evidence/190-11-applies.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/evidence/190-12-observations.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/evidence/190-12-probe-workflow.yml",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/evidence/190-13-e2e.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/evidence/190-13-gates.md",".planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/evidence/190-14-pipeline.md","apps/docs/src/routes/(content)/developers-guide/deployment/+page.md","infra/README.md","infra/bootstrap/README.md","infra/bootstrap/deployments.auto.tfvars.json","infra/bootstrap/example-deployments.json","infra/bootstrap/example.tfvars","infra/bootstrap/main.tf","infra/bootstrap/moves.tf","infra/bootstrap/outputs.tf","infra/bootstrap/terraform.tfvars","infra/bootstrap/tests/deployments.tftest.hcl","infra/bootstrap/variables.tf","infra/envs/example/aws/main.tf","infra/envs/example/dns-mail/main.tf","infra/envs/example/supabase/main.tf","infra/modules/github-oidc-provider/main.tf","infra/modules/github-oidc-provider/outputs.tf","infra/modules/github-oidc/deploy-policies.tf","infra/modules/github-oidc/main.tf","infra/modules/github-oidc/outputs.tf","infra/modules/github-oidc/policies.tf","infra/modules/github-oidc/tests/github_oidc.tftest.hcl","infra/modules/github-oidc/variables.tf","infra/scripts/bootstrap-tfvars.test.ts","infra/scripts/check-bootstrap-moves.sh","infra/scripts/check-bootstrap-plan.sh","infra/scripts/check-bootstrap-plan.test.ts","infra/scripts/deploy-workflow.test.ts","infra/scripts/destroy-workflow.test.ts","infra/scripts/infra-plan-workflow.test.ts","infra/scripts/push-migrations.sh","infra/scripts/push-migrations.test.ts","infra/scripts/resolve-deployment.sh","infra/scripts/resolve-deployment.test.ts","infra/scripts/rootCopies.test.ts","infra/scripts/terraform-checks.sh","infra/scripts/terraform-checks.test.ts","infra/scripts/workflow-errexit.test.ts","infra/scripts/workflows.test.ts","scripts/tests/infraValidateJobGate.test.ts","tests/README.md","tests/deployed-global-setup.ts","tests/playwright.deployed.config.ts","tests/tests/deployed/contestant.smoke.ts","tests/tests/utils/deployedTarget.test.ts","tests/tests/utils/deployedTarget.ts"]
covered_digest: "v4:sha256:f272ee2d52e4ce02f3215c53c20dc738bb48441d36ec9de85f748aae82f21a37"
behavior_unverified: 2
overrides_applied: 0
behavior_unverified_items:
  - truth: "PIPE-13, last sentence: an entry with no GitHub Environment runs its jobs with none. This holds for destroy.yml's two jobs as well as deploy.yml's"
    test: "In a repository whose map entry has no destroy_environment (the downstream OpenVAA/deploy-nuortenvaalikone), run a job whose `environment:` is the scalar form `${{ needs.<job>.outputs.<empty> }}`, the form destroy.yml's plan-destroy and apply-destroy use. Alternatively, change destroy.yml to the object form `environment: { name: ... }` that the probe observed"
    expected: "The job starts with no environment, and its OIDC token carries the ref-based subject `...:ref:refs/heads/deploy-evidence/destroy-<key>`"
    why_human: "The 190-12 probe observed only the object form `{ name: <empty>, url: ... }`, which is deploy.yml's. destroy.yml uses the scalar form, and no run has exercised that form with an empty value. If GitHub rejects it, the result is safe: the destroy fails and destroys nothing. But a downstream without environments could not destroy through the workflow"
  - truth: "190-09: a same-repository pull request plans every deployment this repository owns, each with its own plan role, cluster, service and AWS root, as a matrix built by the credential-free resolve job"
    test: "Open or update a same-repository pull request that touches infra/ (for example the upstream PR of the deployment stack), and read the Infrastructure plan run's `plan (staging)` job"
    expected: "The job assumes arn:aws:iam::471112560111:role/openvaa/openvaa-plan from `matrix.deployment.plan_role_arn`, plans infra/envs/staging/aws without the lock and is green"
    why_human: "Every observed infra-plan run (45564561462, 45947196249, 45963033703) was a push, where the plan job is skipped. The push runs prove that the resolve job and the `fromJSON` matrix work (wrong-subject (staging) was green). They do not prove the plan job's role assumption: a wrong-subject refusal looks the same for a role that does not exist. The derived ARN is pinned by unit tests and equals the old AWS_PLAN_ROLE_ARN value, but no plan job has assumed it"
human_verification:
  - test: "Destroy with no environment: run the scalar-form empty `environment:` once on the downstream, or switch destroy.yml to the object form (see behavior_unverified_items[0])"
    expected: "The job runs with no environment and gets the ref subject"
    why_human: "Needs a run in the private downstream repository"
  - test: "PR plan matrix: read the `plan (staging)` job of the first same-repository pull request touching infra/ (see behavior_unverified_items[1])"
    expected: "The plan role from the matrix is assumed, the AWS root plans, and the job is green"
    why_human: "Needs a pull request run on GitHub"
  - test: "Cross-deployment plan-role reads (190-06 truth 4, INFRA-23): decide whether to accept the thirteen ReadOnlyAccess reads in infra/README.md § Accepted risks as they stand, or to check the Service Authorization Reference now and add a tag-conditioned Deny to plan_deny for every action it confirms takes aws:ResourceTag"
    expected: "An operator ruling recorded in the phase directory: accepted as is, or a follow-up todo or plan for the SAR check"
    why_human: "190-06 could not reach docs.aws.amazon.com and took the plan's fallback: no Deny, all thirteen listed. Because the SAR was never read, nobody has established that IAM cannot scope these reads, which is what INFRA-23 allows to be listed. Among them, each deployment's plan role (assumable by any pull-request workflow of its repository) can read the other deployment's CloudFront origin-secret header"
---

# Phase 190: Multi-deployment bootstrap Verification Report

**Phase Goal:** `infra/bootstrap` takes a map of deployments, so a second OpenVAA instance can deploy from its own repository into the same AWS account (`471112560111`) without colliding with staging. The first consumer is the private downstream repository `OpenVAA/deploy-nuortenvaalikone`.
**Verified:** 2026-11-27T09:39:22Z
**Status:** human_needed
**Re-verification:** No. This is the initial verification.

Worktree `planning/deployment-190` at HEAD `00049b2f9`. Outside `.planning/`, HEAD equals GATES_HEAD `80903cde1` (`git diff --stat 80903cde1 HEAD -- . ':!.planning'` is empty). The phase's base is `3d0df58a9`, the completed 189.1.1. Fifty files changed outside `.planning/`.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | INFRA-21: `infra/bootstrap` takes a map keyed by deployment name, committed as `deployments.auto.tfvars.json`. Each entry gets its own plan role, deploy role, deploy policies, execution role and image repository, named apart from every other entry's. The OIDC provider, state bucket and budget exist once per account | VERIFIED | `main.tf`: `for_each = var.deployments` on `registry`, `frontend_task_role` and `github_oidc`. `state_bucket`, `budget` and `github_oidc_provider` are single. `variables.tf` validations refuse a shared domain, a shared registry or IAM prefix (derived names included), a shared subject, a malformed or over-long key, non-digit ids and wildcard subjects. I ran `terraform test` in `infra/bootstrap`: 9 passed, 0 failed, including `second_entry_is_apart` (no role or policy name shared between two entries, separate registries) |
| 2 | INFRA-21: staging keeps every name it has | VERIFIED | The `staging_names` run pins `openvaa-plan`, `openvaa-staging-deploy`, the twelve policy names, `openvaa-staging-frontend-execution`, `openvaa-frontend` and `openvaa-monthly`. I ran the `github-oidc` module test: 18 passed, including `staging_names_unchanged`. The live apply 1 changed nothing (truth 3) |
| 3 | INFRA-22: staging moves with no destroy and no replace. The offline plan shows it, and so does the live plan through the guard (0/0/0) before apply | VERIFIED | I re-ran `check-bootstrap-moves.sh --base 46554181e` myself: delete 0, replace 0, create 0, unexpected create 0, moved 37, update 18 (the tightening, mock JSON), `bootstrap_plan_guard=pass`. Live (evidence/190-11-applies.md): `s11_plan_line=Plan: 0 to add, 0 to change, 0 to destroy.`, moved 37, guard pass, applied, second plan `No changes`. `moves.tf` holds the four `moved` blocks |
| 4 | INFRA-23: no deployment's deploy role can change another deployment's network, load balancer, CDN, certificates, DNS records, image repository or pipeline state | VERIFIED | `deploy-policies.tf`: `root_tags` adds `Environment = var.environment` to every EC2, ELB-create, CloudFront and ACM condition. ELB, ECS, logs, SNS and events are scoped by `<name_prefix>-<key>` names. DNS is limited to the entry's own zone, record types and names. `ecr_push` is limited to the entry's `registry_arn`. `tfstate_pipeline` allows only `pipeline/<key>/aws/terraform.tfstate` and its lock. Module tests `changes_carry_resource_environment`, `creates_carry_request_tags`, `edge_tag_scope`, `dns_scope` and `network_parent_scope` pass. Live apply 2: 4 in-place updates, guard pass, `No changes` afterwards, and the next staging deploy green |
| 5 | INFRA-23: no plan role can read another deployment's pipeline state | VERIFIED | `policies.tf` `DenyObjectReadsOutsidePipeline`: Deny `s3:GetObject*` on `not_resources = [own pipeline state]`, alongside the hand-state and `env:/` denies. Module test `plan_deny_object_reads` passes. Applied live in the catch-up apply and apply 2 |
| 6 | INFRA-23 / 190-06 truth 4: cross-deployment reads that ReadOnlyAccess allows are denied by tag where AWS allows it, and every remaining one is listed as an accepted risk | ? UNCERTAIN | All thirteen are listed in `infra/README.md` § Accepted risks, with the scaling, task-definition, tag, budget and no-reviewer risks. But no tag Deny was written, because the SAR was unreachable from the executor's session (190-06 SUMMARY, the plan's named fallback). Whether any of these reads could have been scoped is unestablished. Routed to a human decision |
| 7 | INFRA-24: `infra/README.md`, `infra/envs/example`, the bootstrap runbook and the deployment guide describe adding a deployment from a downstream: one map entry upstream, roots copied from `example` downstream | VERIFIED | `infra/README.md` § Adding a deployment (4 steps). `infra/bootstrap/README.md` Step 11 (map), Step 12 (Environment tag) and Step 13 (adding a deployment, guard with `--new-key`). The guide has § Adding a deployment from a downstream repository and line 9 says one account can host more than one deployment. No document claims one deployment per account (grep). The example roots carry `pipeline/example/aws`-shaped keys and four-platform lock files |
| 8 | PIPE-13: deploy, destroy and infra-plan read the deployment from the map by repository id and ref. No staging literal is left outside comments, and a downstream runs them unedited | VERIFIED | Each workflow's first job runs `resolve-deployment.sh` with `github.repository_id` and `github.ref_name`, credential-free. Every environment, role ARN, root, state key, topic, cluster, service, confirm text and smoke key comes from `needs.resolve.outputs.*` or `matrix.deployment.*`. `grep staging` hits comments only (1, 1, 2). Triggers are `deploy/*` and `deploy-evidence/**`, never a key. `yarn test:unit:infra`, my run: 24 files, 757 passed. Live: Deploy 45947196363 and 45963033722 green end to end |
| 9 | PIPE-13: a run that matches no entry, or more than one, fails before it names an environment or assumes a role | VERIFIED | Every credentialed job `needs: resolve`. My spot checks: foreign id 1468971368 gives `failed=no_owned_entry` (rc 1); `deploy/other` and `deploy-evidence/a/b` give `no_branch_match` (rc 1); `deploy-evidence/destroy-other` in destroy mode gives `no_branch_match`. `resolve-deployment.test.ts` covers `ambiguous` ("naming both"), bad keys, missing roots and broken maps. Live wrong-confirm dispatch 45958867533: resolve success, both destroy jobs skipped |
| 10 | PIPE-13: an entry with no GitHub Environment runs its jobs with none | PRESENT_BEHAVIOR_UNVERIFIED | The resolver prints `environment=` and `destroy_environment=` empty for such an entry (unit test "prints empty environments for an entry that names none"). deploy.yml's object form `{ name: <empty>, url }` was observed running without an environment on the private downstream (190-12 `EMPTY_ENVIRONMENT=runs-without`). destroy.yml's scalar form `environment: ${{ ...destroy_environment }}` has not been run with an empty value |
| 11 | PIPE-13: the migration push and the deployed smoke run take the resolved deployment | VERIFIED | `push-migrations.sh --deployment` checks `infra/envs/<key>/supabase/terraform.tfvars`, `GITHUB_REF` against `deploy/<key>` or `deploy-evidence/`, and `OPENVAA_DEPLOY_ENVIRONMENT`. deploy.yml passes `DEPLOYMENT_KEY` and `SMOKE_DEPLOYMENT: ${{ needs.resolve.outputs.key }}`. `deployedTarget.ts` exports `readSmokeDeployment` (default `staging`, refuses a malformed key), `dedicatedSupabaseTfvars` and `smokeBaseUrl`. `yarn test:unit:tests` (my run): 463 of 464, the one failure the known host-only `tcpForward` timing test. Live: `push_exit=0`, `smoke_exit=0` in both deploys. Workstation smoke `SMOKE_DEFAULT=passed`, `SMOKE_STAGING_KEY=passed` |
| 12 | 190-09: a same-repository pull request plans every owned deployment through a matrix, each with its own plan role | PRESENT_BEHAVIOR_UNVERIFIED | `infra-plan.yml` `plan` job: `matrix.deployment: fromJSON(needs.resolve.outputs.deployments)`, `role-to-assume: matrix.deployment.plan_role_arn`. Unit-tested as text. Only push runs have been observed, and the plan job is skipped on push |
| 13 | PIPE-14: every env root under `infra/envs/<name>/` is validated and held to staging's wiring, so a downstream's roots are checked with no upstream edit | VERIFIED | `terraform-checks.sh validate` loops `infra/envs/*/*/` and requires the listed roots, so it fails on a short glob. `rootCopies.test.ts` discovers families with `readdirSync`, puts staging first, and has a discovery test with invented `alpha` and `zeta` keys and a red copy (a dropped module input). `infraValidateJobGate.test.ts` checks each map key's backend key. All green in my `test:unit:infra` run |
| 14 | 190-13: every gate is green on one commit, and the one full E2E run on it is green with summed delta 0 | VERIFIED | evidence/190-13-gates.md: all eleven `GATE_*` are 0 on 80903cde1. E2E 747/747 on that tree, `TITLE_DIFF_EXIT=0`, `SUMMED_DELTA=0`, against `189.1.1-reviewfix-final-full` (recorded substitution for the absent 191-06-full). Checked at top level and not re-run, as instructed |

**Score:** 11/14 truths verified (2 present, behavior-unverified; 1 uncertain).

### Required Artifacts

`verify.artifacts` passes for all 14 plans (29 of 29 artifacts exist and are substantive). By hand:

| Artifact | Status | Details |
| --- | --- | --- |
| `infra/bootstrap/deployments.auto.tfvars.json` | VERIFIED | Staging is the only entry; Terraform auto-loads it and the resolver reads it |
| `infra/bootstrap/{main,variables,moves,outputs}.tf` | VERIFIED | `for_each`, 11 validations, 4 `moved` blocks, a per-deployment `deployments` output |
| `infra/modules/github-oidc-provider/` | VERIFIED | Holds the one `aws_iam_openid_connect_provider.github` |
| `infra/modules/github-oidc/{main,policies,deploy-policies}.tf` | VERIFIED | Id-pinned trusts, Environment-tagged scopes, plan deny scoped to the entry's own key |
| `infra/scripts/resolve-deployment.sh` (+ test) | VERIFIED | Three modes, six named refusals, used by three workflows |
| `infra/scripts/check-bootstrap-plan.sh`, `check-bootstrap-moves.sh` | VERIFIED | Guard and harness; I re-ran the harness green |
| `infra/scripts/push-migrations.sh` (`--deployment`) | VERIFIED | Wired from deploy.yml `DEPLOYMENT_KEY` |
| `tests/tests/utils/deployedTarget.ts` | VERIFIED | Wired from `playwright.deployed.config.ts` and deploy.yml `SMOKE_DEPLOYMENT` |
| `infra/scripts/rootCopies.test.ts` | VERIFIED | Discovers families from `infra/envs/` |
| `infra/bootstrap/tests/deployments.tftest.hcl` | VERIFIED | Run by `terraform-checks.sh test-bootstrap`, which infra-plan.yml's checks job runs with `if: ${{ !cancelled() }}` |
| Evidence files (190-11, 190-12, 190-13, 190-14) | VERIFIED | Each carries the lines the plans require |

### Key Link Verification

`verify.key-links` passes the links with file sources (01 to 06, and 07's first). The rest are descriptive and were checked by hand:

| From | To | Via | Status |
| --- | --- | --- | --- |
| deploy job | `needs.resolve.outputs` | environment name, role-to-assume, AWS_ROOT, SUPABASE_ROOT | WIRED |
| deploy.yml "Push the migrations" | `push-migrations.sh --deployment` | `DEPLOYMENT_KEY` env | WIRED |
| deploy.yml smoke step | `readSmokeDeployment` | `SMOKE_DEPLOYMENT: ${{ needs.resolve.outputs.key }}` (line 669) | WIRED |
| infra-plan.yml plan job | `matrix.deployment.plan_role_arn` | `role-to-assume` (line 139) | WIRED (behavior unobserved, truth 12) |
| guide | infra/README.md, bootstrap/README.md | absolute `github.com/OpenVAA/voting-advice-application/blob/main/infra` links | WIRED |
| operator live plan | `check-bootstrap-plan.sh --pure-move` | evidence/190-11 guard lines | WIRED |
| probe environment | deploy.yml environment shape | object form with empty `name` | WIRED for deploy.yml. destroy.yml uses the scalar form (truth 10) |
| 190-13-full | reference run | title-set comparison | WIRED against `189.1.1-reviewfix-final-full` (recorded deviation) |
| deploy-evidence/190-final push | deploy.yml resolve job | id 546467466 + `deploy-evidence/*` | WIRED (`key=staging` in both deploy runs) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Map isolation, staging pins and validations | `terraform test` in `infra/bootstrap` (TF 1.16.5 arm64) | 9 passed, 0 failed | PASS |
| Deploy-role and plan-role scopes | `terraform test` in `infra/modules/github-oidc` | 18 passed, 0 failed | PASS |
| Offline move proof vs base | `bash infra/scripts/check-bootstrap-moves.sh --base 46554181e` | delete 0, replace 0, create 0, moved 37, guard pass | PASS |
| Infra unit suite | `yarn test:unit:infra` | 24 files, 757 passed | PASS |
| Tests unit suite | `yarn test:unit:tests` | 463/464; the failure is `tcpForward` "BOUNDED time" (409 ms < 550 ms floor), host-only, already in deferred-items.md, and it imports no phase-190 file | PASS (host-only failure) |
| Resolver: staging, foreign id, unlisted ref, nested evidence ref, foreign destroy branch, plan mode | `resolve-deployment.sh` × 6 | rc 0 / 1 no_owned_entry / 1 no_branch_match / 1 / 1 / 0 with the staging list | PASS |

My first move-proof attempt failed to start the provider with `TMPDIR` set to the scratchpad. The scratchpad path is too long for the plugin's unix socket. With the default `TMPDIR` the run was green. That was my environment, not the code.

### Probe Execution

The phase declares no `scripts/*/tests/probe-*.sh`. Its live probes (190-12 token probe, 190-14 pipeline runs) are operator observations on GitHub and AWS, read from the evidence files and not re-run, as instructed.

### Requirements Coverage

| Requirement | Source Plans | Status | Evidence |
| --- | --- | --- | --- |
| INFRA-21 | 02, 04, 05, 13 | SATISFIED | Truths 1, 2 |
| INFRA-22 | 01, 04, 11, 13 | SATISFIED | Truth 3 |
| INFRA-23 | 06, 10, 11, 13 | SATISFIED, one human decision | Truths 4, 5; truth 6 needs a ruling |
| INFRA-24 | 10, 11, 13 | SATISFIED | Truth 7 |
| PIPE-13 | 02, 03, 07, 08, 09, 12, 14, 13 | SATISFIED for staging; two behaviors unobserved | Truths 8, 9, 11 verified; 10 and 12 present, behavior unverified |
| PIPE-14 | 10, 13 | SATISFIED | Truth 13 |

No orphaned requirement: REQUIREMENTS.md maps exactly these six to Phase 190. Renumbering check: no phase-190 file names INFRA-20 or PIPE-12. Every INFRA-21..24 and PIPE-13..14 reference in the 14 PLANs, 14 SUMMARYs, VALIDATION, RESEARCH and the evidence carries the new meaning (map, move, isolation, docs, workflows, env roots). Nothing outside `.planning/` cites these ids.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| (50 changed files) | — | TBD / FIXME / XXX / TODO / HACK / PLACEHOLDER | — | None found |
| `tests/README.md` | 206, 221, 382 | Stale documentation | WARNING | The Deployed smoke run inputs table has no `SMOKE_DEPLOYMENT` row. Line 221 says `project_ref`, `public_project_id` and `public_origin` come from `infra/envs/staging/supabase/terraform.tfvars` "and from no input", and that no variable can widen the dedicated project. Now `SMOKE_DEPLOYMENT` picks the tfvars. Line 382 names the `staging` environment's secrets. deferred-items.md assigned this item to 190-13, and 190-13 did not close it (HANDOFF still lists it as open). It is not one of INFRA-24's four documents, so it does not gate, but fix it before the stack ships |
| `.planning/.../ROADMAP.md`, `REQUIREMENTS.md` | Phase 190 plan list, PIPE-13/14 | Bookkeeping | INFO | 190-12, 190-14 and 190-13 are still unticked in ROADMAP, and PIPE-13 and PIPE-14 are still `[ ]` / Pending in REQUIREMENTS. Expected to be updated by the orchestrator after this verification |
| GitHub repository variable `AWS_PLAN_ROLE_ARN` | — | Operator chore | INFO | Nothing reads it anymore (HANDOFF). Confirm it named `openvaa-plan`, then delete it |

### Human Verification Required

#### 1. destroy.yml with no environment

**Test:** Run a job on the downstream whose `environment:` is the scalar form with an empty value, as destroy.yml's `plan-destroy` and `apply-destroy` use it. Alternatively, change those two jobs to the object form `environment: { name: ${{ needs.resolve.outputs.destroy_environment }} }`, which the 190-12 probe observed.
**Expected:** The job runs with no environment, and its token carries `...:ref:refs/heads/deploy-evidence/destroy-<key>`.
**Why human:** This needs a run in the private downstream. Only the object form was probed.

#### 2. The pull-request plan matrix

**Test:** On the first same-repository pull request that touches `infra/`, read the `plan (staging)` job of Infrastructure plan.
**Expected:** `openvaa-plan` is assumed from the matrix, `infra/envs/staging/aws` plans, and the job is green.
**Why human:** Every observed run was a push, where this job is skipped.

#### 3. Ruling on the cross-deployment plan-role reads

**Test:** Accept the thirteen listed reads (including the other deployment's origin-secret header) as recorded, or have the Service Authorization Reference checked and add a tag-conditioned Deny for each action it confirms.
**Expected:** A recorded ruling, or a follow-up todo or plan.
**Why human:** The SAR was unreachable when 190-06 ran, so "IAM cannot scope it" was assumed rather than established.

### Gaps Summary

No blocking gap. The goal is achieved for the deployment that exists. The bootstrap takes a map, staging moved onto it live with nothing destroyed or replaced, the deploy-role scopes carry the deployment's Environment tag, and the plan role reads only its own pipeline state. The three workflows resolve the deployment by repository id and ref and ran green on staging end to end, including a rejected destroy and a wrong-confirm dispatch. Every env root is validated and compared with staging's.

Three items stop short of `passed`, all on paths that only a second deployment will exercise. Two are behaviors nobody has observed: destroy.yml's scalar empty `environment:`, and the PR plan job's matrix role assumption. The third is the unreached SAR check behind the cross-deployment read risks. Separately, `tests/README.md` still documents the staging-only smoke inputs (warning, non-gating).

---

_Verified: 2026-11-27T09:39:22Z_
_Verifier: Claude (gsd-verifier)_
