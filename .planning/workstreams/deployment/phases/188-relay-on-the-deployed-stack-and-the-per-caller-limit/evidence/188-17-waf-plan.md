# 188-17 — The WAF rate rule: planned on, unchanged off, costed

Staging: `https://staging.openvaa.org`. Cluster `openvaa-staging`, service `openvaa-staging-frontend`, account `471112560111`, region `eu-north-1`; CloudFront distribution `E3V7BYRXOVAFII` (alias `staging.openvaa.org`). The observation (CONTEXT C-04, C-05): a hand plan of the staging root with `relay_rate_limit` unset reads `No changes.`, which also closes the hand applies of plans 188-12 to 188-15; a hand plan with `relay_rate_limit = { limit = 300, window_seconds = 300 }` shows one CLOUDFRONT web ACL to add and the distribution changed in place by its `web_acl_id` alone; neither plan is applied; the rule's cost is recorded with the date of the pricing pages; the deploy role holds no `wafv2` action.

## Task 1 — Readiness, read-only: the restored stack, the variable unset, the stop rules (2026-11-19)

Recorded 2026-11-19 (UTC) by the plan executor of plan 188-17, at 15:48:00Z to 15:48:42Z, from HEAD `8c7abc9cc`. Nothing was applied, planned, stopped or written on any hosted service, AWS resource or GitHub setting, no `terraform` command was run, and no attempt of `188-17-2` was opened. The reads were one GET of `https://staging.openvaa.org/api/health`; with `AWS_PROFILE=openvaa-admin` and `AWS_REGION=eu-north-1`, after `aws sts get-caller-identity --query Account` exit 0 and the account `471112560111`: `aws cloudfront list-distributions` (id, domain, status and `WebACLId` of the distribution aliased `staging.openvaa.org`), `aws cloudfront get-distribution-config` (its `WebACLId`, aliases and `Enabled` only), `aws ecs describe-services` (counts, status, the task definition and the rollout state only) and `aws wafv2 list-web-acls --scope CLOUDFRONT --region us-east-1` (names only); `gh run list --workflow deploy.yml` and `--workflow destroy.yml`, and the status-filtered `gh api` GETs of `actions/runs`; and `grep` and `git diff` of the staging tfvars. No secret value was read. Each status was read on its own line, never through a pipe; the outputs are in the session scratch directory.

```
READ_AT=2026-11-19T15:48:00Z
SERVED_BUILD=a7003b490b4ff92fc72bef5d225c593b222d6c4e
RUNNING_TASK_DEFINITION=openvaa-staging-frontend:20
RUNNING_TASKS=1
SERVICE_ROLLOUT=COMPLETED
NO_RUN_ACTIVE=yes
TFVARS_OVERRIDES=0
TFVARS_RELAY_RATE_LIMIT=unset
DISTRIBUTION_ID=E3V7BYRXOVAFII
DISTRIBUTION_WEB_ACL_BEFORE=none
CLOUDFRONT_WEB_ACLS_BEFORE=0
EXPECTED_UNSET=No changes.
EXPECTED_ON=create module.frontend.aws_wafv2_web_acl.relay[0]; update module.frontend.aws_cloudfront_distribution.this (web_acl_id)
```

- **`SERVED_BUILD=`.** `curl -sS --max-time 20 https://staging.openvaa.org/api/health` exit 0, HTTP 200, body `{"status":"ok","build":"a7003b490b4ff92fc72bef5d225c593b222d6c4e"}`, equal to `DEPLOY_COMMIT=` of `evidence/188-10-rollout.md` and to `RESTORE_SERVED_BUILD=` of `evidence/188-15-provider-none.md`.
- **`RUNNING_TASK_DEFINITION=openvaa-staging-frontend:20`.** `aws ecs describe-services` exit 0: status `ACTIVE`, running 1, desired 1, one deployment, `COMPLETED`, on `:20`, which is `RESTORE_TASK_DEFINITION=` of `evidence/188-15-provider-none.md`. 188-15's restore holds, and that plan's after-restore plan read `No changes.` (`RESTORE_PLAN_AFTER_LINE=`).
- **`NO_RUN_ACTIVE=yes`.** `gh run list --workflow deploy.yml` exit 0, 8 runs, all `completed`; the newest `44491292876` (created 2026-11-19T08:52:17Z, head `a7003b490…`, `success`), plan 188-10's, as 188-15 recorded before and after. `gh run list --workflow destroy.yml` exit 0, one run, `completed`. The status-filtered counts of `actions/runs` are 0 for `queued`, `in_progress`, `waiting`, `requested` and `pending`, each GET exit 0. Task 3 reads this again before the first plan: a plan run while the pipeline holds the state lock would wait on it, and a plan read across a pipeline apply would describe neither state.
- **`TFVARS_OVERRIDES=0`.** `grep -cE '^ *environment_overrides *=' infra/envs/staging/aws/terraform.tfvars` counts 0, and `git diff --quiet` of the file exit 0. `terraform.tfvars` is the root's only tfvars file (`find -name '*.tfvars*'`), so no `*.auto.tfvars` adds a value.
- **`TFVARS_RELAY_RATE_LIMIT=unset`.** `grep -cE 'relay_rate_limit' infra/envs/staging/aws/terraform.tfvars` counts 0, and no `TF_VAR_relay_rate_limit` is in this shell's environment (`env` count 0). The root's variable has `default = null` and `nullable = true` (`infra/envs/staging/aws/variables.tf`) and is passed to `module "frontend"` as `relay_rate_limit = var.relay_rate_limit` (`main.tf`); the module counts `aws_wafv2_web_acl.relay` at 0 when it is null (`infra/modules/frontend-service/waf.tf`) and sets the distribution's `web_acl_id = one(aws_wafv2_web_acl.relay[*].arn)` (`edge.tf`), which is null then.
- **`DISTRIBUTION_WEB_ACL_BEFORE=none`.** `aws cloudfront list-distributions` exit 0 names one distribution aliased `staging.openvaa.org`, `E3V7BYRXOVAFII` (`d1hkrv2gk2hkh9.cloudfront.net`, `Deployed`), with an empty `WebACLId`; `aws cloudfront get-distribution-config --id E3V7BYRXOVAFII` exit 0 reads `WebACLId` `""`, aliases `staging.openvaa.org`, `Enabled` true. A null `web_acl_id` in configuration therefore matches the live distribution.
- **`CLOUDFRONT_WEB_ACLS_BEFORE=0`.** `aws wafv2 list-web-acls --scope CLOUDFRONT --region us-east-1` exit 0 lists no web ACL in the account, so the on plan's ACL would be new and nothing named `openvaa-staging-relay` exists to collide with.
- **The stop rules, written before any plan is made.**
  - The unset plan, with the running digest only (`-var "image_digest=$DIGEST"`, the digest read on the day with `infra/scripts/running-image-digest.sh`), must read `EXPECTED_UNSET=`: `No changes.` Any change at all is a stop, recorded as found: it would mean a hand apply of 188-12 to 188-15 was not restored, or that a null `web_acl_id` does not match the live distribution, and the on plan is not made until the cause is named.
  - The on plan, with the digest and `-var 'relay_rate_limit={limit=300,window_seconds=300}'`, must read exactly the two changes of `EXPECTED_ON=` and `Plan: 1 to add, 1 to change, 0 to destroy.`: the web ACL created, in scope `CLOUDFRONT`, through the `us-east-1` provider, its rule a rate rule of limit 300 over 300 seconds on the source address, scoped down to paths starting `/api/usage` after `NORMALIZE_PATH`, blocking with 429; and the distribution updated in place with `web_acl_id` the one argument whose before and after differ (after unknown until the ACL exists, so read from the union of `before` and `after` keys and `after_unknown`, as 188-15 read the service's `task_definition`). Any other address, a replace of the distribution, or any change to the task definition, the service or the scaling is a stop.
  - Neither plan is applied. Both are saved with `-out` under the session's `$L` only, read with `terraform show -json` through `jq` selecting addresses, actions and the rule's named arguments, and removed at the end; no plan output is copied here.

## Task 3 — Stopped: the first rule-on plan failed (2026-11-19, attempt 20261119T155002Z.8a7a4188d)

Recorded 2026-11-19 (UTC) by the continuation executor of plan 188-17, from 16:06Z. Key `188-17-2`, attempt `20261119T155002Z.8a7a4188d`. Before the first plan, `bash "$A" bound 188-17-2 OPERATOR_REPLY plan=188-17 task=2` exit 0 and `bash "$A" has 188-17-2 '^answer_sitting=approve$'` exit 0. Every command ran under `caffeinate -i` with `AWS_PROFILE=openvaa-admin` after the account check (exit 0, match exit 0), `TF_VAR_alert_email` checked with `test -n` only (exit 0), and `TF_DATA_DIR` at a fresh directory under the session scratch directory against the root's S3 backend (`init -lockfile=readonly` exit 0). Plans were saved under `$L` (`mktemp -d "${TMPDIR}/openvaa-aws.XXXXXX"`, mode 700) and read through `jq` only. No `apply` was run.

The task stopped at its step (2): the first plan with the rule on exited 1. This section records what was read up to the stop, and the steps that did not depend on a plan. It is not Task 3's record. The lines Task 3's verify checks are left out on purpose, so the verify fails until a sitting completes.

```
T3_PRE_PLAN_ACTIVE_RUNS=0 (16:07:34Z)
T3_DIGEST=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a
T3_UNSET_PLAN_EXIT=0
T3_UNSET_PLAN_LINE=No changes. Your infrastructure matches the configuration.
T3_UNSET_CHANGES=none
T3_ON_PLAN_1_EXIT=1 (16:07:49Z..16:09:43Z)
T3_ON_PLAN_1_CAUSE=unknown: the log was removed with $L before it was read
T3_ON_PLAN_1_ACL_PROVIDER_CONFIG_KEY=aws.us_east_1
T3_ON_PLAN_2_ACTIVE_RUNS=0 (16:10:28Z)
T3_ON_PLAN_2_EXIT=0 (16:10:28Z..16:10:42Z)
T3_ON_PLAN_2_LINE=Plan: 1 to add, 1 to change, 0 to destroy.
T3_ON_PLAN_2_CHANGES=not read: the plan file was removed before its JSON was read
T3_PLAN_FILES_LEFT=0
T3_APPLIED=no
T3_DISTRIBUTION_WEB_ACL_AFTER=none (16:11:08Z)
T3_CLOUDFRONT_WEB_ACLS_AFTER=0
DEPLOY_ROLE_WAFV2_ACTIONS=0
CF_REQUESTS_30D=3888
WAF_COST_READ_ON=2026-11-19
WAF_ACL_USD_MONTH=5.00
WAF_RULE_USD_MONTH=1.00
WAF_USD_PER_MILLION=0.60
WAF_INSPECTED=every request to the distribution
WAF_COST_ESTIMATE_USD_MONTH=6.00
FLAT_RATE_ALTERNATIVE=CloudFront flat-rate Free plan, 0 USD a month per distribution with no overage charges, including CloudFront, AWS WAF and DDoS protection, subscribed in the CloudFront console; not adopted
```

- **`T3_UNSET_PLAN_LINE=`.** A plan with `-var "image_digest=$DIGEST"` alone, where the digest is the one `running-image-digest.sh` read (exit 0) on `:20`. Plan exit 0, `show -json` exit 0, and no change other than `no-op` and `read`. This matches `EXPECTED_UNSET=`. The live stack equals the configuration with `relay_rate_limit` unset, and the hand applies of 188-12 to 188-15 are all restored. This is RELAY-09's "off by default changes nothing", read against real state (188-03's D4).
- **`T3_ON_PLAN_1_EXIT=1`.** The first plan with the rule on (the digest, plus `-var 'relay_rate_limit={limit=300,window_seconds=300}'`) exited 1 after about 114 seconds. The unset plan took about 15. The script removed `$L`, the plan log with it, without first reading the log's diagnostics, so the cause is not known.
  - `terraform show -json` of the saved file exited 0. Terraform 1.16.5 saves an errored plan to `-out`. The file's `resource_changes` gave no change line, and its configuration names the ACL's provider `aws.us_east_1`.
  - Both of that plan's files were removed with `$L`.
  - A stale state lock from this run is ruled out: the next plan took the lock and finished.
- **`T3_ON_PLAN_2_EXIT=0`.** One identical re-run was made only to read the first one's error, which made it a third plan beyond the approved two. No run was active (0) when it started. Its plan file and log were both removed before its JSON was read, so only the `Plan:` line is on record.
  - The line equals the expected `Plan: 1 to add, 1 to change, 0 to destroy.`
  - Not read: the change lines, the distribution's changed key, and the rule's arguments.
  - The first plan's failure did not recur. That makes it consistent with a transient read failure, but the cause is unconfirmed.
- **`T3_DISTRIBUTION_WEB_ACL_AFTER=none`.** `aws cloudfront get-distribution-config --id E3V7BYRXOVAFII` exit 0, `WebACLId` empty. `aws wafv2 list-web-acls --scope CLOUDFRONT --region us-east-1` exit 0, 0 ACLs. `find "$TMPDIR" -maxdepth 2 -path '*openvaa-aws.*' -name '*.tfplan'` counts 0. The one `openvaa-aws.*` directory left in `$TMPDIR` is empty and dates from 2026-11-18T01:35Z, before this plan.
- **`DEPLOY_ROLE_WAFV2_ACTIONS=0`.** `aws iam list-attached-role-policies --role-name openvaa-staging-deploy` exit 0 lists 11 attached policies, and `list-role-policies` exit 0 lists no inline policy. The `get-policy` and `get-policy-version` GETs of each default version all exited 0. In the `Allow` statements there are 0 actions starting `wafv2:`, 0 matching `waf*` or `*`, and no `NotAction` statement.
- **`CF_REQUESTS_30D=3888`.** `aws cloudwatch get-metric-statistics --region us-east-1 --namespace AWS/CloudFront --metric-name Requests`, dimensions `DistributionId=E3V7BYRXOVAFII` and `Region=Global`, `Sum` over one 30-day period from 2026-10-20T16:00Z to 2026-11-19T16:00Z, exit 0: 3888. The daily sums over 2026-10-20 to 2026-11-19 have one datapoint, 1118 on 2026-11-18.
- **The cost, read on 2026-11-19.**
  - **Sources.** `aws pricing get-products --service-code awswaf` (us-east-1 endpoint, exit 0, publication date 2026-09-14), location `Any`: `Global-WebACLV2` 5.00 USD a month per web ACL, `Global-RuleV2` 1.00 USD a month per rule (both prorated hourly), and `Global-RequestV2-Tier1` 0.60 USD per million requests processed. The WAF pricing page (`https://aws.amazon.com/waf/pricing/`, HTTP 200, read 16:10:40Z) says: "You will be charged for each web ACL that you create and each rule that you create per web ACL. In addition, you will be charged for the number of web requests processed by the web ACL." Its worked example uses 5.00, 1.00 and 0.60 per million. A web ACL on a distribution processes every request to it.
  - **Estimate.** 6.00 plus 0.60 × 3888 / 1,000,000 = 6.0023, so 6.00 USD a month at staging's traffic.
  - **Alternative.** The CloudFront pricing page (`https://aws.amazon.com/cloudfront/pricing/`, HTTP 200) offers flat-rate plans that "include … AWS WAF and DDoS protection" for a monthly price "with no overage charges". The Free plan is "$0/month" per distribution, and "Plans can be configured through the CloudFront Console". Its request allowance was not in the text this read extracted. The research's 1M requests a month (page read 2026-11-15) is not re-confirmed here.
- **Not done.** The `ON_*` change lines and rule arguments, `PLAN_FILES_REMOVED=` and `APPLIED=` for a complete sitting, and the runbook's Observations row. All wait for one more rule-on plan, which the operator has not approved.
