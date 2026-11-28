# 184-11: the throwaway's first settings apply, the first push, and the reads after it

Attempt: 184-11-1 20261109T093658Z.c8607274d
Attempt: 184-11-2 20261110T101613Z.47b7e7848

- **Project:** the throwaway `begckvkapaopoztbreqc` (`eu-west-1`), root `infra/envs/scratch/supabase`. Nothing in this plan touched the persistent project `cofbsatfrdysyphajsky`. Its ref appears only as the wrong ref the wrapper refused.
- **Dates (UTC):** the operator's sitting ran after attempt `184-11-1` opened at 2026-11-09T09:36:58Z. The orchestrator relayed the reply, and it was received at 2026-11-10T10:15Z. The sitting gave no times for single items, so every observation below is dated **2026-11-09/10**.
- **How the record was written:** from the attempt file of `184-11-1`, stored under `OPERATOR_REPLY=received attempt=20261109T093658Z.c8607274d plan=184-11 task=1 head=47b7e784898fdfef15fb061417e507757080b1aa sha256=9ea24b40…bf63e94`. The screen accepted it on the first `put`.
- **What is kept out:** no value of a secret, no key, no token, no IP address and no e-mail address other than the sender's.

## 1. The apply and the second plan

| Line | Value |
| ---- | ----- |
| `s1_plan_sha256` | `9ea24b40518b08b3487fe531606be51639e054bb489f403a2fdc50bd8bf63e94`, which equals plan 184-10's `PLAN_REVIEWED=ok` checksum |
| `s2_apply_exit` | **1** |
| `s2_progress` | `supabase_project.this: Import complete`; `supabase_edge_function_secrets.this[0]: Creation complete after 0s`; `supabase_settings.this: Still creating... [00m10s elapsed]` |
| `s2_error` | `Error: Client Error`, `with module.supabase.supabase_settings.this`, `Unable to update api settings, got status 500: {"message":"Postgrest config update did not succeed within the expected time frame. The intended change might not have been applied. Please contact support for more` |
| `s2_state` (exit 0) | `module.supabase.supabase_edge_function_secrets.this[0]`, `module.supabase.supabase_project.this` |
| `s2r_api` (GET `/postgrest`, 200) | `db_schema=public,graphql_public`, `db_extra_search_path=public, extensions`, `max_rows=50000`: the three values the module sends were already in place |
| `s2r_plan` (retry, exit 0) | `# module.supabase.supabase_settings.smtp_secret[0] will be created`, `# module.supabase.supabase_settings.this will be created`, `Plan: 2 to add, 0 to change, 0 to destroy.`, `s2r_stop_words=0`, `s2r_plan_sha256=84433c4535f8b87a5d45581af2b7713fec9ed43a9cfc2ec3393c6e2a02713273` |
| `s2b_apply_exit` | **0**: `Apply complete! Resources: 2 added, 0 changed, 0 destroyed.`, with the plan file removed |
| `s3_second_plan_exit` | **0**: `No changes. Your infrastructure matches the configuration.` |

**The reviewed plan was applied only partly.** The import and the function secrets went through. The first settings resource failed on the API half, with a 500 from the Management API's PostgREST update. Because Terraform stops after an error, the SMTP settings resource was not reached. The cause is UNCONFIRMED. The likeliest is a platform timeout while PostgREST restarts, since the values sent are the ordinary three and a GET right after showed them in place.

**The retry plan was reviewed by the orchestrator, not by this executor's Task 3 of 184-10.** It used the same stop rules: no destroy, no replacement, no project creation, no password line. The expected list was narrowed to the two resources that had not been applied, and the plan matches that list exactly. The operator applied that file, and the plan after it was empty.

**Two settings resources side by side.** Both now exist for one project, `supabase_settings.this` and `supabase_settings.smtp_secret[0]`, and the second plan shows no change. Each keeps its own keys: neither resource plans to take back a key the other wrote.

## 2. The hook-on, function-absent sign-in (between the settings apply and the push)

| Line | Value |
| ---- | ----- |
| `s3b_signin_http` | **500** |
| `s3b_signin_error_code` | `unexpected_failure` |
| `s3b_signin_msg` | `Error running hook URI: pg-functions://postgres/public/custom_access_token_hook` |
| `answer_hooks_state_after_apply` | Send Email hook ENABLED (Postgres function `public.send_email_hook`); Customize Access Token (JWT) Claims hook ENABLED (Postgres function `public.custom_access_token_hook`), from an operator screenshot of Authentication > Hooks |

The user and the method are the same as in 184-10, where the same sign-in answered 200 with no hook set. With the access-token hook on and its function absent, a password sign-in fails with **500 `unexpected_failure`** and the hook's URI in the message. No token is issued, so there is no `s3b_claim_names` line.

The window lasts from the settings apply to the migration push. Any project whose settings reach it before its migrations has no working sign-in during that window. This closes the F2 runtime half that 184-10 handed to this plan.

## 3. The served SMTP fields and the function secrets (Step 18 read-back)

All three reads answered 200 (`s18_auth_http`, `s18_api_http`, `s18_secrets_http`).

| Field | Served | Declared in `infra/envs/scratch/supabase/terraform.tfvars` `smtp` | Equal |
| ----- | ------ | ------------------------------------------------------------------ | ----- |
| host | `email-smtp.eu-north-1.amazonaws.com` | `email-smtp.eu-north-1.amazonaws.com` | yes |
| port | `2587` | `"2587"` | yes |
| admin_email | `noreply@staging.openvaa.org` | `noreply@staging.openvaa.org` | yes |
| sender_name | `OpenVAA` | `OpenVAA` | yes |
| smtp_user set | `yes` | given as `TF_VAR_smtp_user` | yes |

**The first SMTP enablement was accepted.** The hosted API accepted the user name and the password sent by the second settings resource (`smtp_secret[0]`, created with exit 0 in `s2b`). The four fields are served as declared.

Of the other auth settings, 34 were printed, with both hooks on and their two `pg-functions://` URIs. The API settings were served as sent: `db_schema="public,graphql_public"`, `max_rows=50000`, `db_extra_search_path="public, extensions"`.

**Function secret names.** `s18_secret_name` printed exactly seven names: `PUBLIC_PROJECT_ID`, `SITE_URL`, `SMTP_FROM`, `SMTP_HOST`, `SMTP_PASS`, `SMTP_PORT`, `SMTP_USER`. That is the module's `managed_function_secret_names` list (`infra/modules/supabase/function-secrets.tf`, `local.function_secret_names`), sorted, name for name. No value or digest was printed.

No `s18_platform_secret_name=` line came back, so the `/secrets` answer listed no name beginning `SUPABASE_` on this project. That contradicts runbook Step 18's statement that the list "also holds the names the platform sets itself". UNCONFIRMED: the reply does not show whether that command printed nothing or was not run.

## 4. The link, the connection paths, the refusal and the push

| Line | Value |
| ---- | ----- |
| `s14_links` | 3 |
| `s14_link_exit` | 0 |
| `s14_linked_ref` | `begckvkapaopoztbreqc` |
| `s14_shared_dir_linked` | `no` |
| `s15_direct_exit` / `s15_retry_exit` | **2** / **2**, `s15_cause=could not translate host name` |
| `s15_a_records` / `s15_aaaa_records` / `s15_v6_route` | 0 / 1 / yes |
| `s15_pooler_exit` | 0 |
| `s15_connection` | **pooler** (session pooler `aws-0-eu-west-1.pooler.supabase.com`, port 5432, user `postgres.<ref>`, per the orchestrator's note) |
| `s7_wrong_ref_exit` | **2** |
| `s7_refusal` | `the work directory is linked to the project 'begckvkapaopoztbreqc', and --ref is 'cofbsatfrdysyphajsky'; nothing was pushed` |
| `s7_stdout_lines` | 0 |
| `s16_push_connection` | **unknown** |
| `s16_push_pending` | `00001` |
| `s16_push_up_to_date` | `no` |
| `s16_push_status` | **0** |
| `s16_drift_status` | **0** |
| `s16_push_exit` | 0 |
| `s16_report` | `history: manifest: 00001`, `history: database: 00001`, `history: holds`, `schema: holds`, `CLEAN -- the history equals the manifest and the diff is empty` |

- **The psql connection changed between the two sittings.** On 2026-11-08/09 (184-10) psql reached `db.<ref>.supabase.co` directly. On 2026-11-09/10 psql could not resolve the same name: `dig` found one AAAA record and no A record, and the workstation has an IPv6 default route. The cause is UNCONFIRMED, probably the system resolver and `dig` treating an IPv6-only name differently. The session pooler on port 5432 worked, and items 7 to 11 ran over it. The operator ran item 12 once when the direct connection failed, which removed the first `$L`, and then made a fresh one.
- **The CLI's path is not known.** The wrapper printed `push_connection=unknown`. It prints `direct` only when the dry run's output holds `Resolved DNS`, and `pooler` only when it holds `Using connection pooler`. The CLI does not use psql's `PG*` variables: it dials the linked project itself. So `unknown` says only that neither marker was printed, not which path the CLI took.
  - **This is a gap in `infra/scripts/push-migrations.sh`**, found on 2026-11-10 by a local read of the installed CLI. Neither literal occurs anywhere in the Supabase CLI 2.118.0 bundle (`node_modules/@supabase/cli-darwin-arm64/bin/supabase`; a byte search finds 0 of each).
  - The bundle's fallback message is a stderr warning: `Warning: Direct connection to <host> is unavailable because this environment does not support IPv6. Retrying via the IPv4 connection pooler.` No direct-path marker was found.
  - With this CLI version the wrapper therefore prints `unknown` on every path. It is logged in `deferred-items.md`.
  - The script is left as it is in this plan. Its file is not in this plan's scope, and the fallback text has not been seen in a real log: `$L` held one, and item 12 removed it.
- **The wrapper's refusal held.** Run against the persistent project's ref with the throwaway's linked work directory, it refused with exit 2, wrote nothing to standard output and pushed nothing.
- **The CLI followed the linked directory's symbolic links on a push.** The dry run listed `00001` from `tmp/supabase-linked/begckvkapaopoztbreqc/supabase/migrations`, a symbolic link to `apps/supabase/supabase/migrations`, and the push applied it. Whether a functions deploy follows them is for Step 17.
- **The push.** The frozen baseline `00001` was pushed with status 0. The rerun (`s16b_`) was not made, because the first push was clean.
- **The drift check after the push was CLEAN.** The history equals the manifest, and the CLI's default schema set gave an empty diff. Item 9 was not run, because `s16_drift_status=0`.

## 5. Reads of the pushed database

| Line | Value |
| ---- | ----- |
| `s10_owner_exit` | 0 |
| `s10_owner` | `accounts:postgres`, `app_settings:postgres`, `deployment_settings:postgres`, `projects:postgres`, `storage_config:postgres` |
| `s10_auth_users_exit` | 0 |
| `s10_bucket` | `private-assets:false`, `public-assets:true` |
| `s11_postgres_bypassrls` | **t** |
| `s11_login_role_http` | 201 |
| `s11_readonly_role` | `cli_login_supabase_read_only_user` |
| `s11_readonly_query_exit` | 0 |
| `s11_readonly_bypassrls` | **f** |
| `s11_readonly_count_exit` | **1** |
| `s11_restored_user` | `postgres` |
| `s12_logs_removed` | yes (also once earlier in the sitting, see section 4) |

- **Owners and `auth.users`.** `postgres` owns all five bootstrap tables. Over the session pooler, as `postgres`, `select count(*) >= 0 from auth.users` succeeds, so `postgres` may read `auth.users`.
- **The buckets** exist after the push: `private-assets` is not public and `public-assets` is public. The migration's `insert into storage.buckets` therefore ran under the role that applies migrations on Supabase Cloud. The CLI was given `SUPABASE_DB_PASSWORD`, and by the wrapper's prerequisite 4 it then signs in as `postgres`, not as a temporary login role. The role was not read during the push itself. psql printed the booleans as `false`/`true`, not `f`/`t`, because concatenating a boolean as text gives its full spelling. The meaning is the same.
- **Bypass readings, 2026-11-09/10:**
  - `postgres` on Supabase Cloud has `rolbypassrls = true`.
  - The CLI's read-only login role, `cli_login_supabase_read_only_user`, created by `POST /v1/projects/<ref>/cli/login-role` with `{"read_only":true}` (answer 201), connects over the pooler as `cli_login_supabase_read_only_user.<ref>` and has `rolbypassrls = false`.
  - As that role, `select count(*) from storage.buckets` **failed** (exit 1). Its error text was removed with `$L`, so the cause is UNCONFIRMED; a permission denial on `storage.buckets` is likely.
  - Finding for plan 184-17: a catalog role built on the CLI's read-only login role neither bypasses row-level security nor reads `storage.buckets`.
- **The login-role call ran more than once.** Item 11b was repeated because of a paste mishap. The first call answered 201, and a later repeat printed no status line. Item 11c used the role answer present at that moment, and the role connected.

## 6. The drift check's schema set (Task 3)

On a clean hosted database holding only the migrations, the drift check's default schema set gave an empty diff (`s16_drift_status=0`, `schema: holds`), dated 2026-11-09/10. `infra/scripts/check-drift.sh` is therefore not narrowed, and no file changed under Task 3. The planted-function check of plan 184-13 runs against the default set.

## Deviations recorded with this evidence

1. **The first apply failed** with a 500 on the API settings update. The import and the function secrets were applied first. Cause UNCONFIRMED (section 1).
2. **A retry plan** of the two unapplied resources was made, reviewed by the orchestrator against the 184-10 stop rules and applied, sha256 `84433c45…3273`. So the `s2_apply_exit=0` line the plan's check names does not exist: the first apply's status is 1 and the retry's is 0.
3. **psql fell back from the direct connection** to the session pooler, although the direct connection worked in 184-10. Item 12 ran once mid-sitting (section 4).
4. **`s16_push_connection=unknown`** over a session-pooler workstation. The wrapper's markers have not been seen in CLI 2.118.0's output (section 4, `deferred-items.md`).
5. **Item 11b ran more than once.** The read-only role could not count `storage.buckets` (section 5).
6. **The bucket booleans read `false`/`true`**, not `f`/`t`. The check pattern was widened to accept both.
7. **The hooks answer** comes from a screenshot. No `s3b_claim_names` line came back, because the sign-in was not 200.
8. **No `s18_platform_secret_name` line** came back (section 3).
