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
