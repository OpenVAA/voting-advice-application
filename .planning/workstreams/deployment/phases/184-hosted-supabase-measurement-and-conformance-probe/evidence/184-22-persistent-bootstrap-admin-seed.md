# 184-22: the persistent project's logging gate, two bootstraps, the first administrator and the smoke dataset

Attempt: 184-22-2 20261111T205516Z.b9aeceb2a
Attempt: 184-22-3 20261111T210735Z.b9aeceb2a

- **Project:** the persistent project `cofbsatfrdysyphajsky` (`openvaa-staging`, `eu-north-1`), root `infra/envs/staging/supabase`, linked work directory `tmp/supabase-linked/cofbsatfrdysyphajsky` (present, kept). Nothing in this plan touched the throwaway project.
- **Who ran the sitting:** the orchestrator, under the operator's standing authorisation for the staging sittings and the operator's instruction to continue without stopping while away. The credentials came from the operator's macOS keychain. The executor held no credential and ran nothing hosted.
- **Dates (UTC):** 2026-11-11. Attempt `184-22-2` opened at 20:55:16Z. The sitting ran from **21:01:17Z** (`s0_started_at`) to **21:06:42Z** (`s22_seed_ended_at`), followed by the anonymous read and the cleanup.
- **How it was run:** seven numbered scripts, `00-start.sh` to `06-cleanup.sh`. Each ran in a fresh shell and sourced one prelude. All seven exited 0, and 06 ran last.
  - The prelude stops unless the ref is `cofbsatfrdysyphajsky` and the tfvars read the declared region, origin, project id, SMTP port and sender.
  - It sets the connection 184-20 measured: the session pooler of shard `aws-0` in `eu-north-1`, port 5432, user `postgres.<ref>`.
  - It unsets every credential a script does not name. The service-role key reached only 00 (where only its role claim and shape were read, locally), 01, 03 and 05. The administrator's address reached 00, 02, 03 and 04, and the password reached 00, 03 and 04.
  - Each script that changes the project first required its predecessor's result file to read `result=OK`: 01 needed 00, 03 needed 01 and 02's count of 0, 04 needed 03, and 05 needed 04.
- **How the record was written:** from the attempt files. `184-22-2` is stored under `OPERATOR_REPLY=received attempt=20261111T205516Z.b9aeceb2a plan=184-22 task=2 head=b9aeceb2a485d1a70d81398250f37499df5a8787`. The screen accepted it on the first `put`.
- **What is kept out:** no key, token, password, address, user id or IP. The token and the API bodies stayed in the log directory, which 06 removed (`s5_logs_removed=yes`), and the tracked tree had no diff (`s6_tree_diff_exit=0`).

## 1. The logging gate (D-10)

LOGGING_GATE=session-timeout

- **Applied by the orchestrator on 2026-11-11** under the operator's instruction to continue without stopping. The values are identical to the throwaway's, and the operator ruled those `session-timeout` on 2026-11-10 (184-15, attempt `184-15-1`). The orchestrator applied the plan's recommended option on the same values.
- **Basis:** the seven settings 184-20 read on this project before any bootstrap (attempt `184-20-2`) were `log_statement=ddl`, `log_parameter_max_length=-1`, `log_min_duration_statement=-1`, `pgaudit.log=none`, `pgaudit.log_parameter=off`, `auto_explain.log_min_duration=10s` and `auto_explain.log_parameter_max_length=-1`.

| Setting                                 | Throwaway (184-10) | Persistent (184-20) |
| --------------------------------------- | ------------------ | ------------------- |
| `log_statement`                         | `ddl`              | `ddl`               |
| `log_parameter_max_length`              | `-1`               | `-1`                |
| `log_min_duration_statement`            | `-1`               | `-1`                |
| `pgaudit.log`                           | `none`             | `none`              |
| `pgaudit.log_parameter`                 | `off`              | `off`               |
| `auto_explain.log_min_duration`         | `10s`              | `10s`               |
| `auto_explain.log_parameter_max_length` | `-1`               | `-1`                |

- A statement that succeeds is not logged with its parameters. A statement slower than 10 s would be, through the `auto_explain` pair. Only a duration threshold is unsafe, so the session statement timeout of 5 s applies.
- **Read again in the sitting:** 00 and 01 compared the seven values with the ruled list and printed `s0_settings_as_ruled=yes` and `s20_settings_as_ruled=yes` before anything was written.
- The gate's line was in the current attempt file of `184-22-2` (`s0_logging_gate=session-timeout`, `s1_logging_gate=session-timeout`) before 01 ran.

## 2. Readiness (00, read-only)

- `s0_service_role_role=service_role` with two dots, and `s0_anon_is_publishable=yes`: the keychain held the full legacy service-role key and the publishable key.
- `s0_counts_before=0,0,0,0,1`. That is no account, project, settings row or `storage_config` row yet. The one `deployment_settings` row is the default row (`behind_cloudflare` false) that `00001_initial_schema.sql` inserts.
- `s0_auth_users_total=0`, `s0_grants_total=0`.
- The anonymous read of the nominations answered `s0_read_http=200` with `s0_rows_range=*/0`.

## 3. The bootstrap, twice (D-08, SUPA-06)

- **Connection (Step 15):** the path 184-20 measured, the session pooler (`s15_pooler_exit=0`, `s15_connection=pooler`). The direct host does not resolve from a workstation for this project (184-20).
- **As deployed:**
  - `BOOTSTRAP_BEHIND_CLOUDFLARE=true`, from 184-13's `BEHIND_CLOUDFLARE=true`. The gateway is the platform's, so the throwaway stands for this project (D-19).
  - `BOOTSTRAP_OPEN_FOR_VOTERS=true`, from the operator's ruling of 2026-10-26 for 184-08 (hosted projects are opened at each hosted bootstrap).
  - `PUBLIC_PROJECT_ID` was the canonical id, and `BOOTSTRAP_STORAGE_URL` was the project's own URL.
- **The timeout:** set inside the bootstrap's own session by the wrapper Step 20 describes (`SET statement_timeout = '5s'`, checked with `\if`, then `\i infra/scripts/bootstrap.sql`), because the session pooler drops `PGOPTIONS`.

| Line                          | Run 1       | Run 2       |
| ----------------------------- | ----------- | ----------- |
| `s20_boot<k>_exit`            | **0**       | **0**       |
| `s20_boot<k>_session_timeout` | `5s`        | `5s`        |
| `s20_counts<k>`               | `1,1,1,2,1` | `1,1,1,2,1` |
| `s20_open_for_voters<k>`      | `true`      | `true`      |
| `s20_behind_cloudflare<k>`    | `true`      | `true`      |

The counts are, in order: `accounts`, `projects`, `app_settings`, `storage_config` and `deployment_settings`.

**The two runs leave the same rows on the persistent project**, the same as on the throwaway in 184-15. That is one account, one project, one settings row, the two `storage_config` rows and one `deployment_settings` row, with `open_for_voters` and `behind_cloudflare` both `true`. The bootstrap overwrote the migration's default `behind_cloudflare=false`. Both runs took about one second together (21:01:19Z to 21:01:20Z).

**The seed check:** `s20_check_seed_exit=0`, with no finding, run with the service-role key unset. There is no seed user, no local address and no demo key on the project.

## 4. The first administrator (D-11, SUPA-02)

### Creation: a deviation from Step 21 item 1

answer_admin_created=yes

- **What Step 21 item 1 says:** create the user in the dashboard (Authentication, Users, Add user) with the address confirmed at creation, never by an invitation.
- **What was done instead:** the operator was away, so the dashboard step could not be done. The orchestrator ran its Auth Admin API equivalent: one `POST /auth/v1/admin/users` with the legacy service-role key, body `{email, password, email_confirm: true}`. The body was built by `jq` from the environment and given on standard input, with the headers on a `curl -K` configuration on a file descriptor. It sends no mail.
- **Before:** `s21_admin_users=0` (02, read-only, the address as a bound parameter under a 5 s timeout). 03 refused to run on any other count.
- **Result:** `s21_admin_create_http=200`, `s21_admin_create_error_code=none`.
- **After:** `s21_admin_after_users=1`, `s21_admin_after_confirmed=1`, `s21_admin_after_invited=0`. **The same effect as the dashboard step: one user with the address, confirmed at creation, and no invitation.**
- The address and the password are the operator's, read from the keychain. Neither was printed or written to any file of this record.
- Step 21 itself is unchanged; the deviation is recorded here and in the runbook's "Observations".

### Grant, sign-in, claims

| Item                 | Throwaway (184-15)                                                                                              | Persistent (184-22)                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `s21_grant_exit`     | `0`                                                                                                             | `0`                                                                                                             |
| grants on project    | `1`                                                                                                             | `1`                                                                                                             |
| `s21_signin_http`    | `200`                                                                                                           | `200`                                                                                                           |
| sign-in error code   | `none`                                                                                                          | `none`                                                                                                          |
| claim names          | `aal,amr,app_metadata,aud,email,exp,grants,iat,is_anonymous,iss,phone,role,session_id,sub,user_metadata`        | `aal,amr,app_metadata,aud,email,exp,grants,iat,is_anonymous,iss,phone,role,session_id,sub,user_metadata`        |
| `s21_claim_grants`   | `[{"role":"admin","scope":"project","target_id":"00000000-0000-0000-0000-000000000001","target_type":null}]` | `[{"role":"admin","scope":"project","target_id":"00000000-0000-0000-0000-000000000001","target_type":null}]` |

- **The grant** ran `infra/scripts/grant-project-admin.sql` through a wrapper that set a 5 s statement timeout in its own session first (`s21_grant_session_timeout=5s`). The script binds the address as a parameter, so the same gate protects it.
- **The sign-in** was a password grant with the publishable key as `apikey`.
- **The claims** are the auth service's own and the one claim `custom_access_token_hook` adds, `grants`. It holds exactly one object: the project-scope `admin` grant on the canonical project, with `target_type` null as a project grant has. `s21_claim_admin_grant_present=yes`.
- **The session was ended** after the claims were read: `POST /auth/v1/logout` with the token on a file descriptor answered `s21_signout_http=204`. The token file was deleted, and the log directory after it.

## 5. The smoke dataset (D-18, OBS-07)

- **Before:** the anonymous read reported no nomination (`s22_before_rows_range=*/0`, `s22_seeded_before=no`), so the dataset was seeded once.
- **The seed:** `yarn db:seed --template smoke --allow-remote` with the legacy service-role key and `SUPABASE_URL` exported to the persistent project's URL (`s22_seed_host_is_staging=yes`). The result was `s22_seed_exit=0`, from 21:01:39Z to 21:06:42Z, **about 5 minutes**; the throwaway's took about 15. The repository's `.env` was neither read nor probed.
- **The anonymous read:** with the publishable key, `s22_read_http=206` and `s22_rows_range=0-0/1001`.

**More than 1000 nominations are readable anonymously on the persistent project: 1001.** This is the dataset phases 185 and 186 reuse.

## 6. Runbook changes

- **Observations:** dated rows were added for the twice-run bootstrap and `behind_cloudflare` as deployed, the first administrator's creation through the Auth Admin API (the deviation from Step 21 item 1), the token's claims, and the smoke dataset with its row total and duration.
- **Not yet observed:** the row "The first administrator's token carries the claims the access-token hook adds" moved to "Observations". The table is now empty.
- Steps 20, 21 and 22 are unchanged.
