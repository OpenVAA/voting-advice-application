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

## Task 2 — The operator's consenting journey and the approval of the sitting (2026-11-19)

Key `188-11-2`, current attempt `20261119T092846Z.e16a1b011`. The stored reply holds `answer_consent=accepted`, `answer_journey_start=2026-11-19T09:30:51Z`, `answer_journey_end=2026-11-19T09:31:12Z` and `answer_sitting=approve`. `bash "$A" bound 188-11-2 OPERATOR_REPLY plan=188-11 task=2` exit 0 and `bash "$A" has 188-11-2 '^answer_sitting=approve$'` exit 0, both read before anything was sent.

```
ATTEMPT=20261119T092846Z.e16a1b011
JOURNEY_START=2026-11-19T09:30:51Z
JOURNEY_END=2026-11-19T09:31:12Z
CONSENT=accepted
SITTING=approve
TRACK_EVENTS_BEFORE=false
TRACK_EVENTS_SET_AT=2026-11-19T09:30:36Z
TRACK_EVENTS_NOW=true
FIRST_ATTEMPT=20261119T092133Z.e16a1b011
FIRST_JOURNEY_EVENTS=7
FIRST_JOURNEY_PAGEVIEWS=7
FIRST_JOURNEY_OTHER_EVENTS=0
```

- **Note on `trackEvents`.** The first attempt, `20261119T092133Z.e16a1b011` (journey 2026-11-19T09:24:57Z to 09:25:39Z), showed no consent prompt: the staging project's `analytics.trackEvents` app setting was `false`, the shipped default, so the voter app sent only the identifier-free pageview. The operator set `trackEvents` to `true` on the hosted project (`app_settings` of project `…0001`, SQL editor); the orchestrator read it back through the public REST API, `updated_at` 2026-11-19T09:30:36Z. The operator then walked the second, consenting journey under the current attempt. Recorded in `188-CONTEXT.md` under B-03 (`eda544276`). The setting stays on for the rest of the phase.
- **The first journey, supporting only.** `posthog-read.sh --mode privacy --since 2026-11-19T09:23:57Z --until 2026-11-19T09:26:39Z` at 09:34:25Z, exit 0: 7 events, all 7 named `pageview`, none other, every presence count 0 and no person. This is what a deployment with `trackEvents=false` sends. B-03 is judged on the second journey below.

## Task 3 — The privacy read, the batch, the deployed refusals (2026-11-19)

Every PostHog read is `infra/scripts/posthog-read.sh --project 347462`, the read-only key read with `security find-generic-password -s openvaa-staging-posthog-read -w` into `POSTHOG_PERSONAL_API_KEY` inside the one command; the key was never printed. Each status was read on its own line. The relay posts were sent from this workstation between 09:33:35Z and 09:33:44Z; no other hosted service was called, `account-access` included.

### B-03 — one consenting journey, read over its window

Window: the journey widened by one minute each side, `--since 2026-11-19T09:29:51Z --until 2026-11-19T09:32:12Z`, `--mode privacy`.

| Read at (UTC) | Exit | `ph_events` |
| ------------- | ---- | ----------- |
| 09:33:13Z     | 0    | 11          |
| 09:35:21Z     | 0    | 11          |
| 09:42:38Z     | 0    | 12          |
| 09:44:58Z     | 0    | 12          |

The two-minute loop stopped after the second read because the count had not grown; a later read found one more event, the last journey event ingested late (the probe events below took about five minutes to become queryable), so two more reads were taken and the count held at 12. The lines are those of the last read; every presence count was 0 in all four reads.

```
B03_EVENTS=12
B03_IP_PRESENT=0
B03_GEOIP_PRESENT=0
B03_USER_AGENT_PRESENT=0
B03_URL_PRESENT=0
B03_REFERRER_PRESENT=0
B03_HOST_PRESENT=0
B03_PERSON_PROFILE_EVENTS=0
B03_PERSONS=0
B03_PAGEVIEWS=7
B03_PAGEVIEW_SESSION_ID_PRESENT=0
B03_OTHER_EVENTS=5
B03_OTHER_SESSION_ID_PRESENT=5
B03_REGION_PROVEN=eu
B03_DISTINCT_ID_PLACEMENT=top-level, per posthog.com/docs/api/capture read 2026-11-19
```

- **`B03_REGION_PROVEN=eu`.** The events were read from project 347462 through `https://eu.posthog.com`, the only host the script accepts; the relay's project key therefore delivers to the EU region.
- **The visit id.** All five non-pageview events carry `$session_id` and none of the seven pageviews does: the visit-id mode is on and the pageview stays unlinked.
- **`B03_DISTINCT_ID_PLACEMENT=`.** The capture reference, read 2026-11-19, says: put `distinct_id` at the top level of the event; PostHog also reads `properties.distinct_id` when the top level does not have it, and the top level wins if both are set. The provider writes the same value in both places, so the top-level one is the one read and the duplicate is inert.

### B-08 — one request of five events

`POST https://staging.openvaa.org/api/usage` at 09:33:35Z with `Content-Type: application/json`, `Sec-Fetch-Site: same-origin` and `Origin: https://staging.openvaa.org`, one envelope (route `/(voters)`, locale `en`) of five `answer` events, each `ago` 0 and question id `p188b0820261119T093335Z`. `curl` exit 0. `--mode probe-count --probe p188b0820261119T093335Z --since 2026-11-19T09:33:00Z --until 2026-11-19T10:30:00Z`: 0 at 09:36:06Z and 09:38:08Z, 5 at 09:40:12Z, 09:42:17Z and 09:44:58Z, each read exit 0.

```
B08_PROBE=p188b0820261119T093335Z
B08_STATUS=204
B08_EVENTS=5
```

### C-01 — the nine refusals with the provider on

`infra/scripts/relay-refusals.sh --base-url https://staging.openvaa.org --probe p188c0120261119T093342Z`, 09:33:42Z to 09:33:44Z:

```
c01_cross_site status=403 expected=403 result=PASS
c01_foreign_origin status=403 expected=403 result=PASS
c01_declared_33k status=413 expected=413 result=PASS
c01_chunked_33k status=413 expected=413 result=PASS
c01_envelope_destination status=400 expected=400 result=PASS
c01_envelope_host status=400 expected=400 result=PASS
c01_event_url status=204 expected=204 result=PASS
c01_event_host status=204 expected=204 result=PASS
c01_control status=204 expected=204 result=PASS
c01_summary cases=9 failed=0
```

Probe counts over `--since 2026-11-19T09:33:00Z --until 2026-11-19T10:30:00Z`, the same reads as B-08: the control `p188c0120261119T093342Z` 1 from 09:40:12Z on, and 0 in every read for the `u` and `h` ids. The four refused cases' ids (`c`, `o`, `d`, `e`) were read too and are 0 in every read.

```
C01_PROBE=p188c0120261119T093342Z
C01_EXIT=0
C01_CONTROL_EVENTS=1
C01_URL_EVENTS=0
C01_HOST_EVENTS=0
C01_REFUSED_CASE_EVENTS=0
C01_CHUNKED_NOTE=CloudFront may buffer a chunked body and forward it with a Content-Length, so the chunked case's 413 may come from the declared-length check; the line does not prove the streaming path, which the relay's unit tests hold
```

- **The window after the posts, supporting only.** `--mode privacy --since 2026-11-19T09:33:00Z --until 2026-11-19T10:30:00Z` at 09:42Z, exit 0: 7 events (the six probe events and one pageview, which the read cannot attribute: the operator's open tab or another visit), every presence count 0, no person, no `$session_id` on any event.
- **Last hosted call.** The last relay POST at 09:33:44Z; the last PostHog read at 2026-11-19T09:45:42Z.
