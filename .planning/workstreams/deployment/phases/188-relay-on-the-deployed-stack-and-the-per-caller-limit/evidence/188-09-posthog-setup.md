# 188-09 — the PostHog project, its billing limit and the read-back

## Task 1 — readiness, read-only (A-01)

**Date (UTC):** 2026-11-18, read at 2026-11-18T20:17Z
**Reads:** AWS metadata only, behind the runbook's prelude (`AWS_PROFILE=openvaa-admin`, region `eu-north-1`); one
GET of staging's health route; the read script's self-test, which answers from stand-ins and calls nothing.
Nothing was sent to staging or PostHog, and no parameter value or key was read.

### The stored key's metadata

Prelude: `s1_account_read_exit=0`, `s1_account_match_exit=0` (account `471112560111`).

`aws ssm describe-parameters --parameter-filters "Key=Name,Option=Equals,Values=/openvaa/staging/frontend/ANALYTICS_POSTHOG_KEY"`,
querying `Type`, `Version` and `LastModifiedDate` only (exit 0):

```
SecureString	1	2026-11-12T21:36:16.802000+02:00
```

The CLI prints the time in the workstation's zone; in UTC it is 2026-11-12T19:36:16.802Z, which is the version and the
time 185-11 recorded for `ANALYTICS_POSTHOG_KEY` (version 1 at 19:36:16.802Z, `answer_posthog_kind=real`).

KEY_PARAMETER_TYPE=SecureString
KEY_PARAMETER_VERSION=1
KEY_PARAMETER_MODIFIED=2026-11-12T19:36:16.802Z
KEY_PARAMETER_MATCHES_185=yes

### Staging's analytics state

`infra/envs/staging/aws/terraform.tfvars` sets `ANALYTICS_PROVIDER = "none"`, so staging sends no event.

STAGING_PROVIDER_TFVARS=none

`curl -s -o /dev/null -w '%{http_code}' https://staging.openvaa.org/api/health` (curl exit 0):

HEALTH_STATUS=200

### The read script

`bash infra/scripts/posthog-read.sh --self-test` exited 0 with `self_test summary cases=19 failed=0`.

READ_SCRIPT_SELF_TEST=pass
