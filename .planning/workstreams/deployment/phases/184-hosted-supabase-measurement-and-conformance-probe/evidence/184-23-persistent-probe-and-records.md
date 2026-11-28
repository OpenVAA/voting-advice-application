# 184-23: the persistent project's conformance probe and served-settings read-back

Attempt: 184-23-1 20261111T211326Z.197b4c91d
Attempt: 184-23-2 20261111T211657Z.197b4c91d

- **Project:** the persistent project `cofbsatfrdysyphajsky` (`openvaa-staging`, `eu-north-1`), root `infra/envs/staging/supabase`. Nothing in this plan touched the throwaway project, and nothing was written to the persistent one: every call was a read.
- **Who ran the sitting:** the orchestrator, under the operator's standing authorisation for the staging sittings and the operator's instruction to continue without stopping while away. The credentials came from the operator's macOS keychain. The executor held no credential and ran nothing hosted.
- **Dates (UTC):** 2026-11-11. Attempt `184-23-1` opened at 21:13:26Z. The sitting ran from **21:16:04Z** (`s1_started_at`) to **21:16:13Z** (`s2_ended_at`), followed by the cleanup.
- **How it was run:** three numbered scripts, `01-probe.sh`, `02-readback.sh` and `03-cleanup.sh`. Each ran in a fresh shell and sourced one prelude. All three exited 0, and 03 ran last.
  - The prelude stops unless the ref is `cofbsatfrdysyphajsky` and the tfvars read the declared region, origin, project id, SMTP port and sender.
  - It unsets every credential a script does not name. The service-role key was named by none, and 01 checked it absent (`s1_service_role_unset=yes`).
  - It checks the AWS session quietly. Every script printed `s<N>_aws_session=yes`, and only 02 depended on it, for the state bucket that `terraform output` reads.
- **How the record was written:** from the attempt files. `184-23-1` is stored under `OPERATOR_REPLY=received attempt=20261111T211326Z.197b4c91d plan=184-23 task=1 head=197b4c91d3b167b272a1ceaa701cd4b1644a92c1`. The screen accepted it on the first `put`. The executor's checks are in `184-23-2`.
- **What is kept out:** no key, token, password, address other than the sender, user id or IP. The probe's output and the API answers stayed in the log directory, which 03 removed (`s3_logs_removed=yes`), and the tracked tree had no diff (`s1_tree_diff_exit=0`, `s3_tree_diff_exit=0`). No line was withheld by the scripts' screen (`s1_probe_lines_withheld=0`, `s2_auth_lines_withheld=0`, `s2_api_lines_withheld=0`).

## Green run

Runbook Step 23, `node infra/scripts/probe-hosted.mjs --root infra/envs/staging/supabase`, at 2026-11-11T21:16:04Z, from HEAD `197b4c91d` with no diff and the keyless `identity-callback` calls in the tree (`s1_keyless_calls_in_tree_exit=0`).

CATALOG_ROLE=postgres

- **Inputs:** the access token; the publishable key as `SUPABASE_ANON_KEY` (`s1_anon_kind=publishable`), as the operator ruled on 2026-11-09; the catalog connection of Step 15, the session pooler (`s1_pg_path=pooler`, port 5432) as `postgres.<ref>` with the database password, the role ruled in 184-17; Node 24. A `select 1` through that connection answered first (`s1_select_exit=0`).
- **Status:** `s23_probe_exit=0`.
- **Counts:** `s1_pass_lines=22`, `s1_fail_lines=0`, `s1_could_not_run_lines=0`. The probe wrote one line to its standard error (`s1_probe_stderr_lines=1`). It was not pasted and went with the log directory; with the status 0 and every check passing, it changed no verdict.

The twenty-two lines and the note, as printed:

```text
s23_probe=PASS api.max-rows
s23_probe=PASS auth.access-token-hook
s23_probe=PASS auth.send-email-hook
s23_probe=PASS auth.site-url
s23_probe=PASS auth.redirects
s23_probe=PASS auth.signup-closed
s23_probe=PASS auth.email-confirm
s23_probe=PASS auth.smtp
s23_probe=PASS auth.oauth-server
s23_probe=PASS auth.other-settings
s23_probe=PASS api.schemas
s23_probe=PASS functions.deployed
s23_probe=PASS functions.verify-jwt
s23_probe=PASS auth.public-settings
s23_probe=PASS rows.read-whole
s23_probe=PASS functions.served
s23_probe=PASS functions.identity-callback-unverified
s23_probe=PASS storage.buckets
s23_probe=PASS db.hook-functions
s23_probe=PASS db.anon-timeout
s23_probe=PASS db.postgres-major
s23_probe=PASS no-seed
s23_probe=NOTE key-model: issued legacy/anon, legacy/service_role, publishable/default, secret/default; legacy keys enabled
```

- `no-seed` passed with the `smoke` dataset on the project. The seed check looks for the local seed only: a user in the `openvaa.test` domain or with one of the seed's two ids, a local `supabase_url` in `storage_config`, or the local demo key; the `smoke` template writes no auth user and no `storage_config` row.
- `rows.read-whole` passed on the 1001 nominations 184-22 seeded, so the anonymous read returns more than 1000 rows in one request.
- `functions.identity-callback-unverified` passed with both calls carrying no key.

## Served settings

Runbook Step 12's read-back, at 2026-11-11T21:16:11Z, about an hour and a half after the last apply (184-21, shortly before its second plan at 19:36:59Z), so the lag of about 20 s after an apply played no part.

- `terraform output -json managed_auth_keys` named 39 keys (`s2_output_exit=0`, `s2_managed_auth_keys_count=39`).
- `GET /v1/projects/<ref>/config/auth` answered `s4_auth_http=200`. The runbook's filter printed 39 lines (`s2_auth_lines_total=39`): every managed key, and none was dropped as ending in a secret word. `smtp_user` is not among the managed keys (`s2_smtp_user_managed=no`): the module sends it with the password through a settings resource of its own. The project holds one (`s2_smtp_user_set=yes`), and its value was not printed.
- `GET /v1/projects/<ref>/postgrest` answered `s4_api_http=200`, with the three API settings `hosted-settings.json` names.
- The four SMTP fields equal the root's `smtp` object (`s2_smtp_as_declared=yes`), and no managed key was missing from the answer.
- `oauth_server_enabled` and `oauth_server_allow_dynamic_registration`, which the module does not send, are both served `false`.

**Every managed setting is served as declared: 39 auth settings and 3 API settings, read key by key, with no difference.** The declared value is the module's: `hosted-settings.json` (its `auth`, the two hook groups, both on in the tfvars), the rate limits (the module's defaults; the root sets none), the site address and the redirect list built from `public_origin`, and the SMTP settings from the tfvars' `smtp` object.

### Auth settings

| Key | Declared | Served |
| --- | --- | --- |
| `disable_signup` | `true` | `true` |
| `external_anonymous_users_enabled` | `false` | `false` |
| `external_apple_enabled` | `false` | `false` |
| `external_email_enabled` | `true` | `true` |
| `external_phone_enabled` | `false` | `false` |
| `external_web3_solana_enabled` | `false` | `false` |
| `hook_custom_access_token_enabled` | `true` | `true` |
| `hook_custom_access_token_uri` | `"pg-functions://postgres/public/custom_access_token_hook"` | `"pg-functions://postgres/public/custom_access_token_hook"` |
| `hook_send_email_enabled` | `true` | `true` |
| `hook_send_email_uri` | `"pg-functions://postgres/public/send_email_hook"` | `"pg-functions://postgres/public/send_email_hook"` |
| `jwt_exp` | `3600` | `3600` |
| `mailer_autoconfirm` | `false` | `false` |
| `mailer_otp_exp` | `3600` | `3600` |
| `mailer_otp_length` | `6` | `6` |
| `mailer_secure_email_change_enabled` | `true` | `true` |
| `mfa_phone_enroll_enabled` | `false` | `false` |
| `mfa_phone_verify_enabled` | `false` | `false` |
| `mfa_totp_enroll_enabled` | `false` | `false` |
| `mfa_totp_verify_enabled` | `false` | `false` |
| `password_min_length` | `8` | `8` |
| `password_required_characters` | `""` | `""` |
| `rate_limit_anonymous_users` | `30` | `30` |
| `rate_limit_email_sent` | `100` | `100` |
| `rate_limit_otp` | `30` | `30` |
| `rate_limit_sms_sent` | `30` | `30` |
| `rate_limit_token_refresh` | `150` | `150` |
| `rate_limit_verify` | `30` | `30` |
| `rate_limit_web3` | `30` | `30` |
| `refresh_token_rotation_enabled` | `true` | `true` |
| `security_manual_linking_enabled` | `false` | `false` |
| `security_refresh_token_reuse_interval` | `10` | `10` |
| `security_update_password_require_reauthentication` | `false` | `false` |
| `site_url` | `"https://staging.openvaa.org"` | `"https://staging.openvaa.org"` |
| `smtp_admin_email` | `"noreply@staging.openvaa.org"` | `"noreply@staging.openvaa.org"` |
| `smtp_host` | `"email-smtp.eu-north-1.amazonaws.com"` | `"email-smtp.eu-north-1.amazonaws.com"` |
| `smtp_max_frequency` | `60` | `60` |
| `smtp_port` | `"2587"` | `"2587"` |
| `smtp_sender_name` | `"OpenVAA"` | `"OpenVAA"` |
| `uri_allow_list` | `"https://staging.openvaa.org/api/auth/callback,https://staging.openvaa.org/*/api/auth/callback"` | `"https://staging.openvaa.org/api/auth/callback,https://staging.openvaa.org/*/api/auth/callback"` |

### API settings

| Key | Declared | Served |
| --- | --- | --- |
| `db_schema` | `"public,graphql_public"` | `"public,graphql_public"` |
| `db_extra_search_path` | `"public, extensions"` | `"public, extensions"` |
| `max_rows` | `50000` | `50000` |

### The dashboard's two switches

The two auth settings the dashboard shows as switches, as plan 184-10 recorded their labels (Authentication > Sign In / Providers, User Signups panel):

- **Allow new users to sign up**: the inverse of `disable_signup`, which is served `true`, so the switch corresponds to off.
- **Confirm email**: the inverse of `mailer_autoconfirm`, which is served `false`, so the switch corresponds to on.

The dashboard was not looked at in this sitting; the switch states follow from the served values.

## Checks of the executor (184-23-2)

- `CHECK_BOUND=ok`: the reply is bound to attempt `20261111T211326Z.197b4c91d` of `184-23-1`.
- `CHECK_PROBE=green`: exit 0, 22 PASS, 0 FAIL, 0 COULD NOT RUN.
- `CHECK_HTTP=ok`: both reads answered 200.
- `CHECK_SETTINGS=as-declared`: 39 auth and 3 API settings, no difference. The plan's own check also passed: every `api` and `auth` entry of `hosted-settings.json` is served with its declared value.
- `CHECK_LOGS=removed`.
