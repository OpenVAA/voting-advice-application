# 187-25 — The redeploy of the staging AWS stack from nothing through the pipeline

Repository: `OpenVAA/voting-advice-application`. Staging: `https://staging.openvaa.org`.

## Task 1 — Readiness, read-only (2026-11-18)

Recorded 2026-11-18 (UTC) by the plan executor of plan 187-25, from HEAD `adf4df14160557badf72823951a3050351c65338`, at 14:07:26Z to 14:09Z. Nothing was pushed, no workflow was started or re-run, no review was approved or rejected, and no hosted service, AWS resource or GitHub setting was written. With `AWS_PROFILE=openvaa-admin` (the key variables unset; the session was valid, the executor did not sign in) the reads were `aws sts get-caller-identity`, one `terraform -chdir=infra/envs/staging/aws state list` on the already-initialised root, and one `aws sns get-topic-attributes` of the alert topic, queried for `Attributes.TopicArn` only. The other remote reads were one `git ls-remote origin refs/heads/deploy/staging`, `gh api` GETs of `actions/runs` (status-filtered, the latest 100, and the latest one), and two `gh run view 44276384977 --json …`. Every status was read on its own line, never through a pipe; the outputs are under `tmp/187-25/t1/` (ignored).

```
STATE_EMPTY=yes
TOPIC_ABSENT=yes
REDEPLOY_FROM_RUN=https://github.com/OpenVAA/voting-advice-application/actions/runs/44276384977
DEPLOY_STAGING_COMMIT=331b5db28058a1f8bc4ef88a3841080a4610efa2
NO_RUN_ACTIVE=yes
```

- **`STATE_EMPTY=yes`.** `aws sts get-caller-identity` exit 0, account `471112560111`. `terraform -chdir=infra/envs/staging/aws state list` exit 0, no line on stdout and nothing on stderr: the same empty state plan 187-24 read after its destroy (`STATE_LIST_AFTER=0`).
- **`TOPIC_ABSENT=yes`.** `aws sns get-topic-attributes --topic-arn arn:aws:sns:eu-north-1:471112560111:openvaa-staging-frontend-deployments --region eu-north-1` exit 254, `An error occurred (NotFound) when calling the GetTopicAttributes operation: Topic does not exist`. The topic and its e-mail subscription went with the destroy; the redeploy creates both again and the subscription must be confirmed anew.
- **`REDEPLOY_FROM_RUN=`.** `STAGING_RUN_URL=` of `evidence/187-22-deploy-staging.md`. `gh run view 44276384977 --json status,conclusion,attempt,headSha` exit 0: `{"attempt":1,"conclusion":"success","headSha":"331b5db28058a1f8bc4ef88a3841080a4610efa2","status":"completed"}`; a second `gh run view` gave workflow `Deploy staging`, event `push`, branch `deploy/staging`, created `2026-11-18T09:29:26Z`. The run is complete, has not been re-run, and is inside GitHub's 30-day re-run window, so `gh run rerun 44276384977` is offered; it was not attempted. Its head SHA equals `DEPLOY_STAGING_COMMIT=`.
- **`DEPLOY_STAGING_COMMIT=`.** `git ls-remote origin refs/heads/deploy/staging` exit 0, `331b5db28058a1f8bc4ef88a3841080a4610efa2`: the commit plan 187-22 pushed and served, and the destroy run's head (`DESTROY_RUN_HEAD=` of plan 187-24).
- **`NO_RUN_ACTIVE=yes`.** The status-filtered counts of `actions/runs` are 0 for `queued`, `in_progress`, `waiting`, `requested` and `pending`, and none of the latest 100 runs is other than `completed`. The latest is plan 187-24's destroy run `44285713407` (`Destroy staging AWS`, `completed`, `success`).

## Task 3 — The redeploy from nothing (2026-11-18)

Recorded 2026-11-18 (UTC) by the plan executor of plan 187-25, from HEAD `eae60bf26`, at 15:50Z to 15:58Z, after the run had completed. The run was started by the orchestrator at top level, not by this executor: after the binding (attempt `20261118T140849Z.eae60bf26` of key `187-25-2`; `attempt.sh bound 187-25-2 OPERATOR_REPLY plan=187-25 task=2` exit 0 and `attempt.sh has 187-25-2 '^answer_redeploy=approve$'` exit 0), `gh run rerun 44276384977` exit 0 made attempt 2 of plan 187-22's run (the tag exists, so nothing was pushed and no new commit was needed). The operator approved the `staging` review in the web interface and clicked the subscription's confirmation link in the mail. The executor checked the binding again before any read: `bound` exit 0, `has '^answer_redeploy=approve$'` exit 0, `has '^s25a_supabase_plan=No changes$'` exit 0, `has '^s25b_probe_exit=0$'` exit 0. It made only reads: `gh run view 44276384977 --attempt 2 --json …`, GETs of the two jobs, of the run, of its approvals (each entry's `state` and environment names only) and of its artifacts, `gh run view 44276384977 --log --job 134894736878` to a file, one `git ls-remote origin` of `deploy/staging` and `main`, and one GET of `https://staging.openvaa.org/api/health`. No POST, no push, no re-run, no AWS write. Every status was read on its own line, never through a pipe; the outputs are under `tmp/187-25/t3/` (ignored). The lines below are copied from the log without their timestamps and colour codes; none holds an address or a token.

### The Supabase root and the probe, from the operator's terminal

```
SUPABASE_ROOT_PLAN=no-changes
PROBE_EXIT=0
```

- Copied from the reply bound to attempt `20261118T140849Z.eae60bf26`: `s25a_supabase_plan=No changes` (the Supabase root's read-only plan, init and plan exit 0) and `s25b_probe_exit=0` (`node infra/scripts/probe-hosted.mjs --root infra/envs/staging/supabase`: 22 `PASS` lines, no `FAIL` and no `COULD NOT RUN`, over the pooler connection). Both were stored before the redeploy started, so the destroy of plan 187-24 reached nothing outside the AWS root.

### The run

```
REDEPLOY_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44276384977/attempts/2
REDEPLOY_RUN_ATTEMPT=2
REDEPLOY_RUN_HEAD=331b5db28058a1f8bc4ef88a3841080a4610efa2
REDEPLOY_RUN_STARTED=2026-11-18T15:00:46Z
REDEPLOY_RUN_REVIEWS=approved
REDEPLOY_CHECKS_JOB=success
REDEPLOY_CHECKS_JOB_ID=134893855415
REDEPLOY_DEPLOY_JOB_ID=134894736878
REDEPLOY_GATE_APPROVED_BETWEEN=2026-11-18T15:02:07Z..2026-11-18T15:06:22Z
REDEPLOY_DEPLOY_JOB_RUNNER=ubuntu-24.04-arm
REDEPLOY_DEPLOY_JOB_STARTED=2026-11-18T15:06:22Z
REDEPLOY_DEPLOY_JOB_COMPLETED=2026-11-18T15:14:57Z
```

- `gh run view 44276384977 --attempt 2` exit 0: attempt 2, event `push`, branch `deploy/staging`, head `331b5db28058a1f8bc4ef88a3841080a4610efa2` (Task 1's `DEPLOY_STAGING_COMMIT=`), `completed`, `success`, updated 15:14:58Z.
- **`checks`** (job `134893855415`, `ubuntu-24.04`): `success`, 15:00:53Z to 15:02:06Z (73 s); its eleven steps each `success` (format check, validation of the staging AWS root, the unit tests of the infrastructure scripts among them).
- **The gate.** The `deploy` job was created waiting at 15:02:07Z and started at 15:06:22Z, so the operator approved between those two moments. `actions/runs/44276384977/approvals` (GET, exit 0) holds one entry, `state` `approved`, environment `staging`. The executor approved nothing.

### The deploy job: built nothing, created the whole stack

```
DEPLOY_STEPS=33
STEP=Set up job conclusion=success seconds=2
STEP=Checkout source code conclusion=success seconds=3
STEP=Assume the deploy role conclusion=success seconds=1
STEP=Build and push the image conclusion=success seconds=3
STEP=Drop the build credentials conclusion=success seconds=0
STEP=Setup Node.js 24.21.0 conclusion=success seconds=6
STEP=Setup Yarn 4.18 conclusion=success seconds=27
STEP=Install psql conclusion=success seconds=16
STEP=Setup Terraform 1.16.5 conclusion=success seconds=1
STEP=Assume the deploy role for the plan conclusion=success seconds=1
STEP=Initialise the staging AWS root conclusion=success seconds=9
STEP=Plan the staging AWS root with the built digest conclusion=success seconds=6
STEP=Show the plan conclusion=success seconds=3
STEP=Drop the plan credentials conclusion=success seconds=0
STEP=Link a work directory to the Supabase project conclusion=success seconds=4
STEP=Push the migrations conclusion=success seconds=118
STEP=Deploy the functions conclusion=success seconds=4
STEP=Assume the deploy role again for the apply conclusion=success seconds=1
STEP=Apply the saved plan conclusion=success seconds=257
STEP=Check the rollout is stable conclusion=success seconds=8
STEP=Drop the rollout credentials conclusion=success seconds=0
STEP=Install Playwright's Chromium conclusion=success seconds=19
STEP=Run the deployed smoke entry conclusion=success seconds=21
STEP=Read the served build again conclusion=success seconds=0
STEP=Remove the plan, the smoke output and the step files conclusion=success seconds=0
STEP=Assume the deploy role again for the alert conclusion=skipped seconds=0
STEP=Alert the operator conclusion=skipped seconds=0
STEP=Post Assume the deploy role again for the apply conclusion=success seconds=0
STEP=Post Assume the deploy role for the plan conclusion=success seconds=0
STEP=Post Setup Node.js 24.21.0 conclusion=success seconds=1
STEP=Post Assume the deploy role conclusion=success seconds=0
STEP=Post Checkout source code conclusion=success seconds=0
STEP=Complete job conclusion=success seconds=0
REDEPLOY_JOB_MINUTES=8.6
REDEPLOY_JOB_LIMIT_MINUTES=60
BUILD_EXIT=3
BUILD_TAG_EXISTS=yes
BUILD_DIGEST_THIS_RUN=sha256:b4a14b890f132c8c2c1150ad3a2355f389fba7304e7b7c1ce0d8804152c195d4
BUILD_DIGEST_SAME=yes
REDEPLOY_PLAN_SUMMARY=Plan: 40 to add, 0 to change, 0 to destroy.
REDEPLOY_PLAN_ADD=40
REDEPLOY_PLAN_ADDRESSES=40
REDEPLOY_PLAN_OTHER_ACTIONS=0
plan_exit=0
links=3
link_exit=0
linked_ref=cofbsatfrdysyphajsky
push_connection=unknown
push_up_to_date=yes
drift_status=0
push_exit=0
MIGRATIONS_PUSHED=none
DRIFT_HISTORY=00001..00022
functions_deploy_exit=0
functions_list_http=200
function=account-access status=ACTIVE verify_jwt=false expected_verify_jwt=false
function=identity-callback status=ACTIVE verify_jwt=false expected_verify_jwt=false
function=send-email status=ACTIVE verify_jwt=true expected_verify_jwt=true
functions_expected=account-access identity-callback send-email
functions_served=account-access identity-callback send-email
REDEPLOY_APPLY_LINE=Apply complete! Resources: 40 added, 0 changed, 0 destroyed.
REDEPLOY_APPLY_CREATED=40
apply_exit=0
stable_poll=1
stable_describe_exit=0
stable_task_definition_matches=yes
stable_rollout_state=COMPLETED
stable_running=1
stable_desired=1
PASS service-role-key-absent
PASS origin
PASS sha
PASS ref
PASS project-id
SMOKE_GATE=DEPLOYED SMOKE GATE OK build=331b5db28058a1f8bc4ef88a3841080a4610efa2 ref=cofbsatfrdysyphajsky project=00000000-0000-0000-0000-000000000001
SMOKE_PASSED=2 passed (20.0s)
smoke_exit=0
served_build_after_smoke=331b5db28058a1f8bc4ef88a3841080a4610efa2
ALERT_STEP=skipped
REDEPLOY_ARTIFACTS=0
REDEPLOY_RUN_CONCLUSION=success
SERVED_BUILD_AFTER=331b5db28058a1f8bc4ef88a3841080a4610efa2
DEPLOY_STAGING_AT_END=331b5db28058a1f8bc4ef88a3841080a4610efa2
MAIN_AT_END=340a200708c28fb7ed078d452138712f3400c789
```

- **Every step succeeded, in the workflow's order** (`DEPLOY_STEPS=33`, one `STEP=` line each from the job GET, the same 33 steps as plan 187-22's attempt 1). The job ran on `ubuntu-24.04-arm` from 15:06:22Z to 15:14:57Z, 515 s: `REDEPLOY_JOB_MINUTES=8.6` against the 60-minute limit (4.0 for plan 187-22's attempt 1, which changed nothing). Only the two alert steps were skipped, as their `if: failure() || cancelled()` conditions require on a green job.
- **`BUILD_EXIT=3`: nothing built.** The build step printed `tag_exists=yes image_digest=sha256:b4a14b890f132c8c2c1150ad3a2355f389fba7304e7b7c1ce0d8804152c195d4` and `build_exit=3` in 3 s; the digest equals plan 187-22's `BUILD_DIGEST_THIS_RUN=`. The ECR repository is outside the staging AWS root and survived the destroy, so the stack was rebuilt around the same image by digest.
- **`REDEPLOY_PLAN_SUMMARY=`, `REDEPLOY_PLAN_ADD=40`: the whole root created from an empty state.** The plan step printed `Plan: 40 to add, 0 to change, 0 to destroy.` and `plan_exit=0`, and the show step printed the same summary. The plan step names 40 distinct addresses, every one `will be created` (`REDEPLOY_PLAN_ADDRESSES=40`) and none `will be updated`, `will be destroyed`, `must be replaced` or `will be read` (`REDEPLOY_PLAN_OTHER_ACTIONS=0`); all are under `module.frontend` (the VPC, its subnets, route table and gateway, both security groups and their rules, the load balancer with its listeners, rule and target group, the cluster, task definition, service and scaling, the log group, both certificates with their validations and validation records, the distribution and its records, the alert topic, its policy and the e-mail subscription, the deployment-failed event rule and target, and the origin-verify secret). 40 equals plan 187-24's `STATE_RESOURCES_BEFORE=40` and its `destroy_planned=40`: the pipeline created exactly what it destroyed.
- **The link and the migrations.** `link_exit=0` on `cofbsatfrdysyphajsky`. The dry run found nothing to push (`push_up_to_date=yes`; no `push_pending=` and no `push_confirmation=` line, `grep -c` 0). The drift check read manifest and history each `00001` to `00022`, `history: holds`, `schema: holds`, `CLEAN`, `drift_status=0`. No migration was pushed. The pooler host is not copied here.
- **The functions** were deployed again from the same commit, each `ACTIVE` with `verify_jwt` as `config.toml` sets it, as on every run.
- **`REDEPLOY_APPLY_LINE=`.** `Apply complete! Resources: 40 added, 0 changed, 0 destroyed.`, `apply_exit=0`, 257 s; the log holds 40 `Creation complete` lines. The longest were the CloudFront distribution (2 min 50 s), the load balancer (2 min 14 s) and the ECS service (1 min 45 s, created with `wait_for_steady_state`); the Route 53 records each took about 30 s, and both certificate validations completed within a second of their records.
- **The stable step** passed on its first poll (8 s): the primary deployment on the applied task definition, `COMPLETED`, 1 of 1 running, since the service's create had already waited for steady state.
- **The smoke run.** The deployed smoke gate printed its five `PASS` lines and `DEPLOYED SMOKE GATE OK` for the branch's commit, ref `cofbsatfrdysyphajsky` and project `00000000-0000-0000-0000-000000000001`; both specs passed, `2 passed (20.0s)`, `smoke_exit=0`.
- **The re-read.** `served_build_after_smoke=331b5db28058a1f8bc4ef88a3841080a4610efa2`, equal to the run's head and to `DEPLOY_STAGING_COMMIT=`.
- **Nothing uploaded, no alert.** `actions/runs/44276384977/artifacts` exit 0, `total_count` 0; the alert steps were skipped.
- **From the workstation.** `/api/health` at 15:57:25Z: `curl` exit 0, HTTP 200, body `{"status":"ok","build":"331b5db28058a1f8bc4ef88a3841080a4610efa2"}`. `git ls-remote origin` exit 0: `deploy/staging` at `331b5db28…`, `main` at `340a20070…`, as before; nothing was pushed.
- **Runner warnings, not acted on.** The same kinds of `##[warning]` lines as plan 187-22's run (Yarn's peer-dependency and disabled build-script notes, the Node 20 deprecation of `threeal/setup-yarn-action`, and the Yarn cache unavailable because GitHub's cache service answered 400 and then "Our services aren't available right now"). No `##[error]` line (`grep -c` 0). No step failed.

### The subscription

```
SUBSCRIPTION_READ_AT=2026-11-18T16:04:27Z
SUBSCRIPTION_COUNT=1
SUBSCRIPTION_PROTOCOL=email
SUBSCRIPTION_ARN=arn:aws:sns:eu-north-1:471112560111:openvaa-staging-frontend-deployments:cb4d2018-8028-451a-be4f-2d4a21f373a4
SUBSCRIPTION_CONFIRMED=yes
```

- **A first read blocked at an authentication gate.** At 15:57:11Z, with `AWS_PROFILE=openvaa-admin` and the key variables unset, `aws sts get-caller-identity` exit 255 and the subscription read exit 255, both `Error when retrieving token from sso: Token has expired and refresh failed`. The executor did not sign in and read nothing from the topic; the run record above was committed and the gate returned to the orchestrator. The operator signed in again in their own terminal, and the orchestrator read the account `471112560111` at top level.
- **`SUBSCRIPTION_CONFIRMED=yes`.** At 16:04:27Z, same profile, key variables unset: `aws sts get-caller-identity --query Account` exit 0, `471112560111`. `aws sns list-subscriptions-by-topic --topic-arn arn:aws:sns:eu-north-1:471112560111:openvaa-staging-frontend-deployments --region eu-north-1 --query 'Subscriptions[].{SubscriptionArn:SubscriptionArn,Protocol:Protocol}'` exit 0: one subscription, protocol `email`, whose `SubscriptionArn` is a full subscription ARN under the new topic, not `PendingConfirmation`. The operator had clicked the confirmation link in the mail while the run proceeded, so the poll's first read, at its first minute of the 30-minute bound, already found it confirmed; no second read was needed. Only `SubscriptionArn` and `Protocol` were read; the endpoint was not queried and no address is in this file. Both alerts, the workflow's alert step and the deployment-failed event rule, publish to this topic again.

### The records

- `infra/envs/staging/aws/README.md` § Observations: a 2026-11-18 row for the redeploy from nothing, with its counts, minutes and the confirmed subscription.
- `infra/bootstrap/README.md`: the § Not yet observed rows "The deploy role's policies hold every call a pipeline plan, apply and destroy of the AWS root makes" and "A distribution or certificate created with the root's tags passes the edge tag calls' `aws:ResourceTag` test" (whose checker is "The first pipeline deploy from nothing, after the real destroy", this run) moved to § Observations as two 2026-11-18 rows: the deploy role's policies of Step 9 held every call of the plan and apply of run 44270824581 (plan 187-21), the destroy of run 44285713407 attempt 2 (plan 187-24) and the create of this run, with no refused call in their logs; and the distribution and both certificates were created with the root's tags. The created resources' `tags_all` in the plan carry `Project=openvaa`, `Root=aws`, `Environment=staging` and `ManagedBy=terraform`.
- Both runbooks pass `prettier --check`.
