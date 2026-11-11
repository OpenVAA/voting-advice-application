# 184-18: the batched break of the throwaway, the probe's red run and both refusals of `account-access`

Attempt: 184-18-2 20261111T102034Z.d6769ac3b
Attempt: 184-18-3 20261111T122939Z.d6769ac3b

MAJOR_RED=expectation-override

**Verdict: the red run does not count in full.** The probe exited 1 with 21 `FAIL` lines, 1 `PASS` line and no `COULD NOT RUN` line. `functions.identity-callback-unverified` passed although `identity-callback` was listed with `verify_jwt` true. So 21 of the 22 checks were seen failing by their own planted fault, and one was not seen failing. Both refusals of `account-access` were seen on the served function, each with a `not-sent` witness.

- **Project:** the throwaway `begckvkapaopoztbreqc` (`eu-west-1`), root `infra/envs/scratch/supabase`. It started from the green state of plan 184-17. Script 00 read `s0_config_diff_exit=0`, `s0_fault_in_state=0`, the three functions `ACTIVE` with their declared `verify_jwt`, `s0_signup_pair=disable_signup=true mailer_autoconfirm=false` and `s0_redirect_class=candidate`. The connection was `s15_connection=pooler` (`s15_direct_exit=2`, `s15_pooler_exit=0`).
- **Who ran the sitting:** the orchestrator, under the operator's authorisation of 2026-11-10, with the throwaway's credentials read from the operator's keychain. The operator did the two dashboard blocks. The executor held no credential and ran nothing against the hosted project.
- **When (UTC):** **2026-11-11**. The sitting started at 10:37:10Z. The probe ran at 11:12:08Z, and the last request was made at 11:12:29Z.
- **How the record was written:** from the attempt files. `184-18-2` is stored under `OPERATOR_REPLY=received attempt=20261111T102034Z.d6769ac3b plan=184-18 task=2 head=d6769ac3b26b8ec861bf8d1fc0b4a442e4c22504`, and `bound` exits 0 on it. `184-18-3` holds the executor's check.
- **What is kept out:** no key, token, password, address or IP. The planted user's address and the disposable administrator's address appear nowhere. The log directory was removed (`s10_logs_removed=yes`).

## 1. The rulings (2026-11-11, by the operator via the orchestrator)

- **`MAJOR_RED=expectation-override`.** This was the plan's recommended option. A project's major version cannot be planted, so the fault is on the expectation side. While the probe ran, `[db] major_version` of the working tree's `apps/supabase/supabase/config.toml` read 16. Script 08 made that edit and put it back with an EXIT trap:
  - `s8_config_clean_before_exit=0` and `s8_tree_clean_before_exit=0` were read before the edit.
  - During the run: `s8_override_numstat=1,1`, `s8_override_files=1`, `s8_override_line=major_version = 16`.
  - After it: `s8_override_reverted_diff_exit=0`.
  - Script 10 read `s10_config_diff_exit=0`. The override was never committed.
- **`answer_rule2=module-refresh`.** This is the rule lines of item 2. The read-only replan right after the redirect fault (`s1_replan_exit=2`) showed `module.supabase.supabase_settings.this will be updated in-place`. So the operator ruled that the fault plan of item 2 may carry exactly the module settings resource and the fault resource, both updated in place, with `Plan: 0 to add, 2 to change, 0 to destroy.` Nothing else was allowed.

## 2. The redirect fault and the redirect refusal (item 1)

| Line                         | Value                                                              |
| ---------------------------- | ------------------------------------------------------------------ |
| `s1_plant_at`                | `2026-11-11T10:37:17Z`                                             |
| `s1_plan_line`               | `  # supabase_settings.faults[0] will be created`                  |
| `s1_plan_line`               | `Plan: 1 to add, 0 to change, 0 to destroy.`                       |
| `s1_plan_matches_rule`       | `yes`                                                              |
| `s1_apply_exit`              | `0` (`Apply complete! Resources: 1 added, 0 changed, 0 destroyed.`) |
| `s1_served_site_url`         | `planted`, after 20 s                                              |
| `s1_redirect_class`          | `refused`, at once                                                 |
| `s1_replan_exit`             | `2`: the module settings resource updated in place                 |
| `s1_redeploy_exit`           | `0` (`account-access` listed at version 6, `verify_jwt=false`)     |
| `s1_signup_pair`             | `disable_signup=true mailer_autoconfirm=false`                     |
| `s1_requested_at`            | `2026-11-11T10:37:48Z` (`s1_http=200`, `s1_answer=accepted`)       |
| `s1_witness`                 | **`not-sent`**, after 10 s                                         |
| `s1_throttle_rows`           | `0`                                                                |
| `answer_redirect_refusal_seen` | **`yes`**                                                        |

The operator read this line in the function's logs: `account-access: SITE_URL is not admitted by the auth redirect allowlist; no link issued`. Sign-up was still closed at this point, so the redirect check was the one that refused.

## 3. The rest of the break (items 2 to 7)

| Item | Fault                                                       | Lines                                                                                                                                         |
| ---- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 2    | every settings fault, `-var fault_set=all`                  | plan lines `faults[0]` and `module.supabase.supabase_settings.this` updated in place, `Plan: 0 to add, 2 to change, 0 to destroy.`; `s2_plan_matches_rule=yes` under `rule_all_module`; `s2_apply_exit=0` (`0 added, 2 changed`); `s2_served_auth_faults=yes` after 20 s; `s2_served_max_rows=500`; `s2_served_db_schema=public`; `s2_replan_exit=2` (the module resource again) |
| 3    | the empty bucket `private-assets` deleted in the dashboard  | `answer_bucket_deleted=yes`; script 07: `s7_bucket=public-assets public=true` is the only bucket                                              |
| 4    | `send-email` deleted                                        | `s4_delete_exit=0`; two functions listed, no `send-email`                                                                                     |
| 5    | `identity-callback` with `verify_jwt` on, by the Management API PATCH | `s5_patch_http=200`; `s5_function=identity-callback status=ACTIVE verify_jwt=true version=5`                                         |
| 6    | the hook function renamed, `anon` at 3 s, PostgREST reload  | `s6_psql_exit=0`, `s6_hook_function_count=0`, `s6_planted_function_count=1`, `s6_anon_timeout=3s`                                            |
| 7    | a seed-shaped user added in the dashboard, auto-confirmed   | `answer_planted_user=created`; script 07: `s7_seed_domain_users=1`                                                                            |

The 2 to 7 order became 2, 4, 5, 6, then the operator's two dashboard steps (items 3 and 7) together, before the probe.

## Red run

`s8_probe_at=2026-11-11T11:12:08Z`, `s23_probe_exit=1`, `s8_fail_lines=21`, `s8_pass_lines=1`, `s8_could_not_run_lines=0`, `s8_probe_lines_withheld=0`. The catalog role was `postgres`, with the publishable key as the anon key (`s8_anon_kind=publishable`) and the service-role key unset. No source preflight failed.

| Check                                    | Planted fault                                         | Finding, as printed                                                                                                                                         | By its own cause |
| ---------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `api.max-rows`                           | `max_rows = 500`                                      | the served max_rows is 500, not the 50000 that hosted-settings.json and pageSize give                                                                       | yes              |
| `auth.access-token-hook`                 | `hook_custom_access_token_enabled = false`            | hook_custom_access_token_enabled is false, expected true from hosted-settings.json                                                                          | yes              |
| `auth.send-email-hook`                   | `hook_send_email_enabled = false`                     | hook_send_email_enabled is false, expected true from hosted-settings.json                                                                                   | yes              |
| `auth.site-url`                          | `site_url = "https://planted.invalid"`                | site_url is "https://planted.invalid", expected "https://staging.openvaa.org" from the root's public_origin                                                 | yes              |
| `auth.redirects`                         | `uri_allow_list` with the one planted entry           | uri_allow_list holds 1 entry, expected the 2 of the list the module builds from public_origin and redirect_callback_paths                                   | yes, by count (the finding names no value) |
| `auth.signup-closed`                     | `disable_signup = false`                              | disable_signup is false, expected true from hosted-settings.json                                                                                            | yes              |
| `auth.email-confirm`                     | `mailer_autoconfirm = true`                           | mailer_autoconfirm is true, expected false from hosted-settings.json                                                                                        | yes              |
| `auth.smtp`                              | `smtp_port = "2465"`                                  | smtp_port is "2465", expected "2587" from the root's smtp.port                                                                                              | yes              |
| `auth.oauth-server`                      | both OAuth server flags true, with the path           | oauth_server_enabled is true, expected false …; oauth_server_allow_dynamic_registration is true, expected false …                                          | yes              |
| `auth.other-settings`                    | `password_min_length = 12`                            | password_min_length is 12, expected 8 from hosted-settings.json                                                                                             | yes              |
| `api.schemas`                            | `db_schema = "public"`                                | db_schema is "public", expected "public,graphql_public" from hosted-settings.json                                                                           | yes              |
| `functions.deployed`                     | `send-email` deleted                                  | not deployed: send-email                                                                                                                                    | yes              |
| `functions.verify-jwt`                   | `identity-callback` PATCHed to `verify_jwt` true      | verify_jwt of identity-callback is true, expected false from config.toml                                                                                    | yes              |
| `auth.public-settings`                   | `disable_signup = false`, `mailer_autoconfirm = true` | disable_signup is false, expected true …; mailer_autoconfirm is true, expected false …                                                                      | yes              |
| `rows.read-whole`                        | `max_rows = 500`                                      | the nominations read returned rows 0-499 of 1001 (Content-Range 0-499/1001): 500 of 1001 rows, truncated by a page limit                                    | yes              |
| `functions.served`                       | `send-email` deleted                                  | send-email answered 404 with another body than the function writes, expected 405 with its own method-not-allowed body                                       | yes              |
| `functions.identity-callback-unverified` | `identity-callback` PATCHed to `verify_jwt` true      | **PASS**: no finding; expected one naming `answered 401`                                                                                                    | **no**           |
| `storage.buckets`                        | `private-assets` deleted                              | not served: private-assets                                                                                                                                  | yes              |
| `db.hook-functions`                      | `custom_access_token_hook` renamed                    | public.custom_access_token_hook(jsonb) is not in the database                                                                                               | yes              |
| `db.anon-timeout`                        | `ALTER ROLE anon SET statement_timeout = '3s'`        | the anon role's statement_timeout is "3s", expected "8s" from the last ALTER ROLE anon of the migrations                                                    | yes              |
| `db.postgres-major`                      | expectation override `major_version = 16`             | the server major version is 17, expected 16 from config.toml [db] major_version                                                                             | yes (expectation side) |
| `no-seed`                                | a user in `openvaa.test`                              | check-seed reported 1 finding(s) of the local seed: seed user                                                                                               | yes              |

The `NOTE key-model:` line was the same as in the green run: `issued legacy/anon, legacy/service_role, publishable/default, secret/default; legacy keys enabled`.

No finding names a cascade, such as an unreachable source or a missing body. The one gap is a check that passed.

### The check that passed: `functions.identity-callback-unverified`

- **What the check does:** it calls the served `identity-callback` twice without an `Authorization` header, with only `apikey: <anon key>`: a `GET`, expecting the function's own 405, and a `POST {}`, expecting its own 500. The spec's red case is both calls answered 401 by the gateway. In this run both calls reached the function, so the gateway did not refuse the header-less calls.
- **What was served:** the Management API listed `identity-callback` with `verify_jwt=true` straight after the PATCH (`s5_`) and again 29 minutes later (`s9_`), still at version 5. The PATCH changed the listed metadata and deployed nothing.
- **What 184-12 measured:** the gateway answering 401 `UNAUTHORIZED_NO_AUTH_HEADER` to an `apikey`-only call was seen with the **legacy anon key** on functions deployed with `verify_jwt` true. The **publishable key** in `apikey` alone was never measured. The probe uses the publishable key, as ruled on 2026-11-09.
- **Possible causes, both UNCONFIRMED and not yet told apart:**
  1. The gateway admits a publishable key in `apikey` alone on a `verify_jwt` function. Then the check cannot fail with the key the probe is ruled to use.
  2. The PATCH of `verify_jwt` reaches the listing but not the serving gateway, or not without a deploy.
- **The measurement that tells them apart:** call the same `GET` while the fault is still planted, once with the legacy anon key in `apikey` alone and once with the publishable key in `apikey` alone. If the legacy call gets 401 and the publishable call gets 405, cause 1 holds. If both get 405, cause 2 holds, and the fault is planted again by deploying `identity-callback` with `verify_jwt` true, and the run is made again.

## 4. The sign-up refusal (item 9)

| Line                         | Value                                                         |
| ---------------------------- | ------------------------------------------------------------- |
| `s9_redeploy_at`             | `2026-11-11T11:12:26Z` (`s9_redeploy_exit=0`)                 |
| `s9_signup_pair`             | `disable_signup=false mailer_autoconfirm=true`, at once       |
| `s9_requested_at`            | `2026-11-11T11:12:29Z` (`s9_http=200`, `s9_answer=accepted`)  |
| `s9_witness`                 | **`not-sent`**, after 10 s                                    |
| `s9_throttle_rows`           | `0`                                                           |
| `answer_signup_refusal_seen` | **`yes`**                                                     |

The operator read this line in the function's logs: `account-access: public sign-up is not disabled on this deployment; no link issued`. The sign-up check runs before the redirect check, so with both faults planted the sign-up check refused.

## 5. Every plant's status, left in place for plan 184-19

- `supabase_settings.faults[0]` holds `fault_set=all`: the site URL and redirect list on `planted.invalid`, both hooks off, sign-up open, autoconfirm on, SMTP port `2465`, the OAuth server on, `password_min_length` 12, `max_rows` 500 and `db_schema` `public`. The module settings resource plans an in-place update (`s2_replan_exit=2`).
- The `private-assets` bucket is deleted.
- The `send-email` function is deleted.
- `identity-callback` is listed with `verify_jwt` true.
- `public.custom_access_token_hook(jsonb)` is renamed to `custom_access_token_hook_planted`.
- `anon` has `statement_timeout` `3s`.
- One user in the `openvaa.test` domain exists.
- The working tree's `config.toml` is unchanged.
