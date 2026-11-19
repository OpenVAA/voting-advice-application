# 188-11 — Anonymous capture, batching and the deployed refusals

Staging: `https://staging.openvaa.org`. PostHog project: `347462` (EU, per `evidence/188-09-posthog-setup.md`). Running service: `openvaa-staging-frontend` in cluster `openvaa-staging`, account `471112560111`, `eu-north-1`.

## Task 1 — Readiness, read-only: staging serves the phase's commit with the provider on (2026-11-19)

Recorded 2026-11-19 (UTC) by the plan executor of plan 188-11, at 09:15:39Z to 09:17Z, from HEAD `73d30e0be0009ed578d8d5c7ed476541cd4b3647`. Nothing was sent to the relay, nothing was read from PostHog, and no AWS resource, hosted service or GitHub setting was written. The remote reads were one GET of `https://staging.openvaa.org/api/health`; `gh run list --workflow deploy.yml` and `--workflow destroy.yml` and the status-filtered `gh api` GETs of `actions/runs`; and, after the AWS runbook's prelude (`AWS_PROFILE=openvaa-admin`, `AWS_REGION=eu-north-1`, the key-pair variables unset), `aws sts get-caller-identity --query Account`, `aws ecs describe-services` (the service's task definition and its deployments' status fields) and one `aws ecs describe-task-definition` whose `--query` selects the `ANALYTICS_PROVIDER` value alone. No secret value was read. Every status was read on its own line, never through a pipe; the outputs are in the session scratch directory.

```
READ_AT=2026-11-19T09:15:39Z
DEPLOY_COMMIT=a7003b490b4ff92fc72bef5d225c593b222d6c4e
SERVED_BUILD=a7003b490b4ff92fc72bef5d225c593b222d6c4e
E2E_TREE_SHA=d523abcd51e725b99bd2b277dd9e0781d8ed4834
TREE_SINCE_CLOSING_RUN=unchanged
RUNNING_TASK_DEFINITION=arn:aws:ecs:eu-north-1:471112560111:task-definition/openvaa-staging-frontend:10
RUNNING_PROVIDER=posthog
NO_RUN_ACTIVE=yes
REFUSAL_SELF_TEST=pass
READ_SELF_TEST=pass
C01_NONE_CONTROL=204
```

- **`SERVED_BUILD=`.** `curl -sS --max-time 20 https://staging.openvaa.org/api/health` exit 0 at 09:15:39Z, HTTP 200, body `{"status":"ok","build":"a7003b490b4ff92fc72bef5d225c593b222d6c4e"}`, equal to `DEPLOY_COMMIT=` of `evidence/188-10-rollout.md`.
- **`TREE_SINCE_CLOSING_RUN=unchanged`.** `E2E_TREE_SHA=` is the current line of `evidence/188-08-closing-e2e.md`. `git diff --quiet d523abcd51e725b99bd2b277dd9e0781d8ed4834..HEAD -- apps packages tests` exit 0.
- **`RUNNING_PROVIDER=posthog`.** The account read exit 0 and the match against `471112560111` exit 0. `describe-services` exit 0: the service runs task definition `:10`, one deployment, `PRIMARY`, `COMPLETED`, 1 of 1 running. `describe-task-definition` of `:10` exit 0: `ANALYTICS_PROVIDER` reads `posthog`, as `TD_ANALYTICS_PROVIDER=` of 188-10 recorded.
- **`NO_RUN_ACTIVE=yes`.** `gh run list --workflow deploy.yml` exit 0: every run `completed`, the latest `44491292876` (188-10's rollout), `success`. `gh run list --workflow destroy.yml` exit 0: one run, `44285713407`, `completed`, `success`. The status-filtered counts of `actions/runs` are 0 for `queued`, `in_progress`, `waiting`, `requested` and `pending`, each GET exit 0.
- **`REFUSAL_SELF_TEST=pass`.** `infra/scripts/relay-refusals.sh --self-test` exit 0, its last line `self_test summary cases=21 failed=0`. It runs against loopback servers only.
- **`READ_SELF_TEST=pass`.** `infra/scripts/posthog-read.sh --self-test` exit 0, its last line `self_test summary cases=19 failed=0`. It runs against a loopback stand-in only; no key was read from the keychain.
- **`C01_NONE_CONTROL=204`.** On 2026-11-15, while staging's provider was `none`, a cross-origin POST (`Origin: https://evil.example`) to staging's `/api/usage` was answered 204, because with provider `none` the relay returns 204 before reading any header (`188-DISCUSSION-POINTS.md`, baseline). It is the recorded control of C-01: the refusals can be seen only with a provider active, which `RUNNING_PROVIDER=posthog` now shows.
