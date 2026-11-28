# 184-15: the throwaway's logging gate, two bootstraps, the first administrator and the smoke dataset

Attempt: 184-15-1 20261110T214945Z.977bd5b13
Attempt: 184-15-2 20261110T214945Z.977bd5b13
Attempt: 184-15-3 20261111T083427Z.977bd5b13

- **Project:** the throwaway `begckvkapaopoztbreqc` (`eu-west-1`), root `infra/envs/scratch/supabase`, linked work directory `tmp/supabase-linked/begckvkapaopoztbreqc`. Nothing in this plan touched the persistent project.
- **Who ran the sitting:** the orchestrator, under the operator's authorisation of 2026-11-10, with the throwaway's credentials read from the operator's macOS keychain (service `openvaa-184-scratch`). The executor held no credential and ran nothing hosted.
- **Dates (UTC):** attempts `184-15-1` and `184-15-2` opened at 2026-11-10T21:49:45Z (both in the same second, so they share an id). The sitting ran on **2026-11-11**: a first attempt started at 06:27:33Z and was discarded (see "Run 1"). The full rerun started at **08:17:37Z** and the sitting ended at **08:32:58Z**. Every observation below comes from the rerun and falls in that window.
- **How it was run:** six numbered scripts, `01-redeploy.sh` to `06-cleanup.sh`, each in a fresh shell, each sourcing one prelude. The prelude loads the credentials, enters the repository root, refuses any ref but the throwaway's, sets the session pooler variables (`aws-0-eu-west-1.pooler.supabase.com:5432`, user `postgres.<ref>`) and a fixed log directory, and unsets every credential the script does not name. As a result, the service-role key reached only 01 (where only its role claim was decoded, locally), 03 and 05, and the disposable user's address and password reached only 04. Only `s<n>_` lines were printed.
- **How the record was written:** from the attempt files. `184-15-1` is stored under `OPERATOR_REPLY=received attempt=20261110T214945Z.977bd5b13 plan=184-15 task=1 head=977bd5b13f3f44c5d18791f48bbd12feab6f0dc5`. `184-15-2` is stored under the same line with `task=2`. The screen accepted both on the first `put`.
- **What is kept out:** no key, token, password, address or IP. The token stayed in the log directory, which 06 removed (`s6_logs_removed=yes`).

## Run 1, discarded (2026-11-11, from 06:27:33Z)

- **What went wrong:** the keychain copies of the legacy `anon` and `service_role` keys had been cut off at 128 characters, with one dot. 128 characters is the limit of the `security` password prompt. Run 1's `s0_legacy_anon_role=` and `s0_service_role_role=` lines were therefore empty, and its two `account-access` shapes sent an invalid JWT. The orchestrator discarded the whole run.
- **The fix:** both keys were stored again, in full, from the Management API, by a script the operator approved that prints only shape lines. The anon key is 208 characters and the service-role key 219, each with two dots, the right role, and the ref matching.
- **What run 1 wrote:** nothing.
  - 03 did not run its bootstrap in run 1.
  - The first 03 of the rerun stopped at its guard before writing (§ 3).
  - The rerun's first wrapper version failed before any bootstrap statement (§ 3).

## 1. The logging gate (D-10)

LOGGING_GATE=session-timeout

- **Ruled by the operator on 2026-11-10** (`answer_logging_gate=session-timeout`, attempt `184-15-1`), and relayed by the orchestrator.
- **Basis:** the seven settings recorded in 184-10 (2026-11-08/09) were `log_statement=ddl`, `log_parameter_max_length=-1`, `log_min_duration_statement=-1`, `pgaudit.log=none`, `pgaudit.log_parameter=off`, `auto_explain.log_min_duration=10s` and `auto_explain.log_parameter_max_length=-1`.
  - A statement that succeeds is not logged with its parameters.
  - A statement slower than 10 s would be, through the `auto_explain` pair. That covers the bootstrap's bound service-role key.
  - Only a duration threshold was unsafe, so the recommended option applied: a session statement timeout below 10 s.
- **Read again in the sitting (2026-11-11, 02 and 03):** the same seven values, `s19_psql_exit=0`. 03 compared them with the ruled list and printed `s20_settings_as_ruled=yes` before it wrote anything.

## 2. `account-access` redeployed and the two shapes again (D-09, 2026-11-11)

- **Preconditions (`s0_` lines):**
  - `s0_ref` and `s0_linked_ref` were both `begckvkapaopoztbreqc`.
  - The project id was `00000000-0000-0000-0000-000000000001`, with all three links in place.
  - The token shape was `sbp`, and `SUPABASE_ANON_KEY` was the publishable key.
  - The legacy anon key's role claim was `anon`, and the service-role key's was `service_role`.
  - `s0_docker_exit=0`.
- **The deploy:** Step 17 deployed all three functions from the linked work directory (`s17_deploy_exit=0`). Since 184-12 only `config.toml` had changed, so the other two functions were redeployed unchanged. Then `s17_list_http=200`:

| Function            | Status   | `verify_jwt` |
| ------------------- | -------- | ------------ |
| `account-access`    | `ACTIVE` | **`false`**  |
| `identity-callback` | `ACTIVE` | `false`      |
| `send-email`        | `ACTIVE` | `true`       |

- **The shapes:** both are a `check-code` POST to `account-access`, with the legacy anon key.

| Shape                       | Status | Tries | Who answered                         |
| --------------------------- | ------ | ----- | ------------------------------------ |
| (a) `apikey` only           | 200    | 1     | the function, `{"status":"unknown"}` |
| (b) `apikey` + `Bearer`     | 200    | 1     | the function, `{"status":"unknown"}` |

`s1_curl_errors=no`.

**`account-access` now answers the `apikey`-only shape itself.** In 184-12 the gateway refused that shape with 401 `UNAUTHORIZED_NO_AUTH_HEADER`. With `verify_jwt` false, as deployed from `config.toml`, the call reaches the function. Shape (b), the one supabase-js sends without a session, still reaches it.

## 3. The bootstrap, twice (D-08, SUPA-06, 2026-11-11)

- **Connection (Step 15):** `s15_direct_exit=0`. The direct host resolved this time, unlike in 184-11. `s15_pooler_exit=0`. The sitting's variables gave `s15_connection=pooler`, so the bootstrap ran through the session pooler on port 5432.
- **As deployed:**
  - `BOOTSTRAP_BEHIND_CLOUDFLARE=true`, from 184-13's `BEHIND_CLOUDFLARE=true`.
  - `BOOTSTRAP_OPEN_FOR_VOTERS=true`, from the operator's ruling of 2026-10-26 for 184-08.
  - `PUBLIC_PROJECT_ID` was the canonical id, and `BOOTSTRAP_STORAGE_URL` was the project's own URL.

**The session pooler drops `PGOPTIONS`.** With `PGOPTIONS='-c statement_timeout=5s'` exported, `show statement_timeout` through the session pooler returned `2min`, not `5s`. 03's guard stopped the script there, before anything was written (`s20_session_timeout=2min`). The startup option does not reach the server through the pooler.

- **How the timeout was set instead:** the orchestrator changed 03 to run the bootstrap through a psql wrapper in the same session. The wrapper runs `SET statement_timeout = '5s'`, then checks with `\if` that the session reports `5s`, and only then runs `\i infra/scripts/bootstrap.sql`. Otherwise it stops.
- **A failed first version:** it put the guard in a `CASE … 1/0` expression. PostgreSQL folds that constant while planning, so the version failed (exit 3) before any bootstrap statement ran.
- **The ruling still holds:** every bootstrap statement ran under a 5 s statement timeout, below `auto_explain`'s 10 s.

| Line                                      | Run 1       | Run 2       |
| ----------------------------------------- | ----------- | ----------- |
| `s20_boot<k>_exit`                        | **0**       | **0**       |
| `s20_boot<k>_session_timeout`             | `5s`        | `5s`        |
| `s20_counts<k>`                           | `1,1,1,2,1` | `1,1,1,2,1` |
| `s20_open_for_voters<k>`                  | `true`      | `true`      |
| `s20_behind_cloudflare<k>`                | `true`      | `true`      |

The counts are, in order: `accounts`, `projects`, `app_settings`, `storage_config` and `deployment_settings`.

**The two runs leave the same rows.** That means one account, one project, one settings row, the two `storage_config` rows and one `deployment_settings` row, with the same two booleans. This is SUPA-06's twice-run equality on a hosted database. The raw boot lines printed as `s20_boot1_s20_session_timeout5s`, because the scripts' character filter drops `=`. The orchestrator relayed them as above.

**The seed check:** `s20_check_seed_exit=0`, with no finding. There is no seed user, no local address and no demo key on the project.

## 4. The first administrator (D-11, SUPA-02, 2026-11-11)

- **The grant:** this is the disposable user created in 184-10. It already existed, so the dashboard item was skipped, and `ADMIN_EMAIL` was set from the keychain. Results: `s21_grant_exit=0`, `s21_grants_on_project=1`.
- **The sign-in:** a password sign-in with the publishable key as `apikey` returned `s21_signin_http=200` and `s21_signin_error_code=none`. With the hook function present (pushed in 184-11), a sign-in works again.
- **Claim names:** `aal,amr,app_metadata,aud,email,exp,grants,iat,is_anonymous,iss,phone,role,session_id,sub,user_metadata`.
- **The grants array:** `[{"role":"admin","scope":"project","target_id":"00000000-0000-0000-0000-000000000001","target_type":null}]`.

**The claims match what the hook adds.** `custom_access_token_hook` in `00001_initial_schema.sql` adds one claim, `grants`: an array of objects with `scope`, `target_type`, `target_id` and `role`, one per row of `public.grants` for the user. The token carries `grants` with exactly one object. It is the project-scope `admin` grant on the canonical project, with `target_type` null as a project grant has. The other names are the auth service's own claims.

## 5. The smoke dataset (D-18, OBS-07, 2026-11-11)

- **The seed:** `s22_seed_exit=0`, run with the legacy service-role key and `--allow-remote`. The orchestrator reports that it wrote 2017 rows with no error line, and took about 15 minutes. Nearly all of that was portrait uploads, at about 2 per second for 1001 candidates.
- **The anonymous read:** with the publishable key, `s22_read_http=206` and `s22_rows_range=0-0/1001`.

**More than 1000 nominations are readable anonymously: 1001.**

- **One line that did not print:** `s22_seed_host_is_throwaway=` printed nothing usable. In bash 3.2, the closing parenthesis of a `case` pattern inside `$( … )` is misparsed. The seed used the prelude's fixed throwaway URL all the same, and the script now keeps the `case` statement outside a command substitution.

## 6. The service-role key (D-12)

D12_SERVICE_ROLE=works

The legacy service-role key was the stored key of both bootstrap runs, which exited 0 and wrote the two `storage_config` rows. It was also the key of dev-seed's writes, which exited 0. Plan 184-14's key-model checkpoint is not raised again.

## 7. Runbook changes

- **Step 17:** the expected function list now gives `verify_jwt=false` for `account-access` and `identity-callback`.
- **Step 20:** the session timeout is set inside the bootstrap's session by a wrapper that checks it, because the session pooler drops `PGOPTIONS`.
- **Step 22:** the seed's duration is stated.
- **Observations:** dated rows were added for the twice-run bootstrap, `behind_cloudflare` as deployed, the administrator's claims, the smoke dataset, `PGOPTIONS` through the pooler, and `account-access` answering the `apikey`-only shape.
- **Not yet observed:** the row "The first administrator's token carries the claims the access-token hook adds" now names only the persistent project.
