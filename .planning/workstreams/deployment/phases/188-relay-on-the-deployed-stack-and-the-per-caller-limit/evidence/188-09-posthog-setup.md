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

## Task 3 — the operator's inputs and the read-back

**Attempt:** `20261118T201819Z.465a2d4ef`. `bash "$A" bound 188-09-2 OPERATOR_REPLY plan=188-09 task=2` exited 0
(re-run 2026-11-19 before the reads). The reply was given on 2026-11-18; its `note:` clarifications of 2026-11-19
override the raw answers where they differ.

### G1 — the project (A-01)

PH_REGION=eu
PH_DEDICATED=yes
PH_OWNER=yes
PH_PROJECT=347462

### G2 — the plan and the billing limit (A-02)

The raw answer was `answer_billing_limit=0 to 20`; the clarification of 2026-11-19 reads "the Product analytics
billing limit set is 20 USD". The plan asked for about 10; 20 is the operator's setting.

PH_PLAN=paid
BILLING_UPGRADE=not-needed
BILLING_LIMIT=20
BILLING_CURRENCY=USD
BILLING_SETTING_TEXT=multiple product limits shown; Product analytics limit 20 USD (operator reading)
BILLING_OTHER_PRODUCTS=operator-set
BILLING_TEXT=none found
BILLING_SET_ON=2026-11-18
BILLING_LIMIT_RECORDED=yes

note: the billing page carries no sentence about what happens at the limit; the operator found none (`answer_billing_text=none found`), recorded verbatim.
note: other products: "other products are not all off or at their lowest (0 USD); some are higher, a deliberate operator choice" (operator clarification, 2026-11-19). Raw answer: `low or lowest`. This overrules A-02's "every other product off or at the lowest amount", recorded in 188-CONTEXT.md A-02.

### G3 — addresses and GeoIP (B-02)

`answer_ip_discard=on` (to be read back through the API as `ph_anonymize_ips=true`; see the read-back below).

GEOIP_TRANSFORMATION=off

note: the project offers no GeoIP transformation (operator, 2026-11-19).

### G5 — the Supabase plan (D-06)

SUPABASE_PLAN=pro
SUPABASE_STEP_CAP=40
SUPABASE_NOTICE_NEEDED=no

Pro is neither Team nor Enterprise, so no two weeks' notice of heavy load testing is needed. The cap is the plan's
40 journeys per minute.

### The fill

FILL=unchanged

The fill stands as CONTEXT.md records it: A-02 overruled on 2026-11-17, and the operator's 2026-11-19 clarification
on other products' levels added to A-02. No other decision is overruled.

### G4 — the read key and the read-back (A-04)

note (2026-11-19, superseded): the first read, at 2026-11-19T06:48:26Z, ran with keychain item
`openvaa-staging-posthog-read` holding a project secret API key (prefix `phs_`, `answer_read_item=stored as project api
key, not user`). `--mode settings` exited 1 with `ph_query_status=401` (authentication, not a HogQL error), and the
other three modes were not run. The operator then replaced the item with a personal API key: query read and project
read, scoped to project 347462.

#### The read-back with the personal key (2026-11-19)

`bash "$A" bound 188-09-2 OPERATOR_REPLY plan=188-09 task=2` exited 0 again before these reads (attempt
`20261118T201819Z.465a2d4ef`). A prefix-only check of the replaced item, which printed no character of the key, found
the personal API key format `phx_`.

PH_READ_KEY_KIND=personal

Each read took the key from the keychain into the one command's environment; it was never printed. Window:
`--since 2026-11-19T07:09:48Z --until 2026-11-19T08:09:48Z` (the last hour); the settings read ran at
2026-11-19T08:09:36Z. Every read's stderr was empty.

`posthog-read.sh --project 347462 --mode settings` exited 0:

```
ph_anonymize_ips=true
```

`--mode window-count` exited 0:

```
ph_window_events=0
```

`--mode probe-count --probe p188none` exited 0:

```
ph_probe_events=0
```

`--mode privacy` exited 0:

```
ph_events=0
ph_ip_present=0
ph_geoip_present=0
ph_user_agent_present=0
ph_url_present=0
ph_referrer_present=0
ph_host_present=0
ph_person_profile_events=0
ph_persons=0
ph_pageviews=0
ph_pageview_session_id_present=0
ph_other_events=0
ph_other_session_id_present=0
```

Every count is 0, as expected: staging sends nothing (`STAGING_PROVIDER_TFVARS=none`). No HogQL error and no
`ph_result=unexpected_shape` was returned, so `posthog-read.sh` is unchanged.

PH_ANONYMIZE_IPS=true
READ_MODE_settings_EXIT=0
READ_MODE_window-count_EXIT=0
READ_MODE_window-count_COUNT=0
READ_MODE_probe-count_EXIT=0
READ_MODE_probe-count_COUNT=0
READ_MODE_privacy_EXIT=0
READ_MODE_privacy_EVENTS=0

### The plan's Task 3 verify (2026-11-19)

Run verbatim, it exits 1 at one check only: `^BILLING_OTHER_PRODUCTS=(off|lowest)$`, because the record holds
`BILLING_OTHER_PRODUCTS=operator-set` under the operator's 2026-11-19 overrule recorded in 188-CONTEXT.md A-02. The
verify is not edited. Every other check passes when run one by one: the eleven `grep -qx` lines, `PH_PROJECT`,
`SUPABASE_PLAN`, `SUPABASE_STEP_CAP`, `BILLING_SET_ON`, `BILLING_SETTING_TEXT`, `BILLING_TEXT`, the amount branch of
the billing check (`BILLING_LIMIT=20`, not zero, `BILLING_CURRENCY=USD`, `BILLING_UPGRADE=not-needed`), and
`yarn test:unit:infra posthog-read` (exit 0, 5 tests). `posthog-read.sh --self-test` exits 0 with
`self_test summary cases=19 failed=0`.
