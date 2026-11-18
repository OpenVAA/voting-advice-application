# 187-24 — The destroy of the staging AWS stack through the pipeline

Repository: `OpenVAA/voting-advice-application`. Staging: `https://staging.openvaa.org`.

## Task 1 — Readiness, read-only (2026-11-18)

Recorded 2026-11-18 (UTC) by the plan executor of plan 187-24, from HEAD `7632986327d939caf551652006fdd3ba5141a60b`, at 12:00:24Z to 12:01Z. Nothing was pushed, no workflow was started or re-run, no review was approved or rejected, and no hosted service, AWS resource or GitHub setting was written. With `AWS_PROFILE=openvaa-admin` (the key variables unset; the session was valid, the executor did not sign in) the reads were `aws sts get-caller-identity`, one `terraform -chdir=infra/envs/staging/aws state list` on the already-initialised root, and four `aws s3api head-object` of the state bucket `openvaa-tfstate-471112560111`. The other remote reads were one GET of `https://staging.openvaa.org/api/health`, `gh api` GETs of `actions/runs` (status-filtered, and the latest 100) and of `actions/workflows`, one `gh run view 44285713407 --json status,conclusion,attempt,headSha,event,headBranch`, and one `git ls-remote origin refs/heads/deploy-evidence/destroy-staging`. Every status was read on its own line, never through a pipe; the outputs are under `tmp/187-24/t1/` (ignored).

```
DATE_OK=yes
COST_READ_RECORDED=yes
SERVED_BUILD_BEFORE=331b5db28058a1f8bc4ef88a3841080a4610efa2
STATE_ADDRESSES_BEFORE=46
STATE_RESOURCES_BEFORE=40
STATE_OUTSIDE_MODULE_BEFORE=0
OTHER_STATE_OBJECTS=hand/staging/supabase/terraform.tfstate 2026-11-17T20:00:57+00:00; hand/staging/dns-mail/terraform.tfstate 2026-10-21T20:15:16+00:00; hand/bootstrap/terraform.tfstate 2026-11-16T06:58:40+00:00
AWS_STATE_OBJECT_BEFORE=pipeline/staging/aws/terraform.tfstate 2026-11-18T10:06:00+00:00 dRZaY0mVP_HIj5Hj2Rwi2Pf75d6cI.25
NO_RUN_ACTIVE=yes
DESTROY_RUN_ID=44285713407
DESTROY_RUN_RERUN_OFFERED=yes
```

- **`DATE_OK=yes`, on the operator's ruling `COST_WINDOW_RULING=short-window` (2026-11-18, commit `763298632`).** The date floor this check once carried, 2026-11-23, came from the cost-read todo's seven-day window rule. The ruling took the read over a two-day window and lifted the floor with it, and the same commit amended this plan to drop it. No other date condition applies, so the date is not a precondition any more.
- **`COST_READ_RECORDED=yes`.** INFRA-13's measured estimate is in `.planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-22-cost.md`, section "The measured figure, over a two-day window (operator ruling, 2026-11-18)": `COST_MEASURED_USD_MONTH=36.96`, `COST_MEASURED_WITH_UNTAGGED_IPV4_USD_MONTH=44.26`, window 2026-11-15 and 2026-11-16, read `2026-11-18T11:58Z`. The runbook rows are `infra/envs/staging/aws/README.md` § Observations, the two `2026-11-18` rows "Step 18, item 3" (1.22 USD a day, 36.96 a month by the tag) and "Step 18, item 5" (the load balancer's two untagged addresses, 44.26 a month). The todo `2026-11-14-measure-the-staging-aws-stack-monthly-cost.md` is under `.planning/todos/completed/`. The read was made by the orchestrator at top level, as the plan's action says; this plan only checks it.
- **`SERVED_BUILD_BEFORE=`.** `/api/health` exit 0, HTTP 200, body `{"status":"ok","build":"331b5db28058a1f8bc4ef88a3841080a4610efa2"}`: the commit of plan 187-22's deploy and of the destroy branch, the same as plan 187-23 read.
- **`STATE_RESOURCES_BEFORE=40`.** `aws sts get-caller-identity` exit 0, account `471112560111`. `terraform state list` exit 0: 46 addresses, every one under `module.frontend.` (`STATE_OUTSIDE_MODULE_BEFORE=0`), six of them data sources (`module.frontend.data.…`), leaving 40 managed resources, the count `infra/scripts/check-destroy-plan.sh` compares. Plan 187-23 read the same 46 and 40, and its `plan-destroy` guard printed `destroy_planned=40`. Task 3's verify requires `destroy_planned=` to equal this line.
- **`OTHER_STATE_OBJECTS=`.** `head-object` exit 0 for each of the three keys the destroy must not touch; their `VersionId` and `ETag` are recorded beside the timestamps for Task 3's comparison:

  | Key                                       | `LastModified`            | `VersionId`                        | `ETag`                             |
  | ----------------------------------------- | ------------------------- | ---------------------------------- | ---------------------------------- |
  | `hand/staging/supabase/terraform.tfstate` | 2026-11-17T20:00:57+00:00 | `G0EV1sOKwa7C8gN0Bf8WczDFvtNGyjsZ` | `5afbcebab0e64bc79773d5dcde5d1b48` |
  | `hand/staging/dns-mail/terraform.tfstate` | 2026-10-21T20:15:16+00:00 | `oUmMpR4iyJT1T3E2KYWUSIN025HeIQJn` | `aefa837b65261ec43b531f4623bbe10f` |
  | `hand/bootstrap/terraform.tfstate`        | 2026-11-16T06:58:40+00:00 | `vUhlmek0D3t.Kcr11STBxTj0S5Pk9u4o` | `c4d275dcfe72aeb1e855ece1698c0b13` |

  The AWS root's own state object, `pipeline/staging/aws/terraform.tfstate`, was read too (`AWS_STATE_OBJECT_BEFORE=`), for the record only: the destroy writes it.
- **`NO_RUN_ACTIVE=yes`.** The status-filtered counts of `actions/runs` are 0 for `queued`, `in_progress`, `waiting`, `requested` and `pending`, and none of the latest 100 runs is other than `completed`. The latest is plan 187-23's destroy run `44285713407`.
- **`DESTROY_RUN_ID=44285713407`, `DESTROY_RUN_RERUN_OFFERED=yes`.** From `DESTROY_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44285713407` in `evidence/187-23-destroy-plan.md`. `gh run view` exit 0: `completed`, `failure`, attempt 1, event `push`, branch `deploy-evidence/destroy-staging`, head `331b5db28058a1f8bc4ef88a3841080a4610efa2`. The run is complete, was created today (10:28:18Z) and has not been re-run, so it is inside GitHub's 30-day re-run window and a `gh run rerun 44285713407` is offered; it was not attempted. A re-run takes the same commit's `destroy.yml`, and both jobs again wait for their `staging-destroy` reviews. `actions/workflows` now lists `.github/workflows/destroy.yml` as `active`, registered by plan 187-23's push. The destroy branch still points at `331b5db28058a1f8bc4ef88a3841080a4610efa2` (`git ls-remote` exit 0), so the new-commit path of Task 2's context is the fallback only if the re-run is refused.
