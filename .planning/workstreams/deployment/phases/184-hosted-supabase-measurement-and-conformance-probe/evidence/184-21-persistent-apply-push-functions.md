# 184-21 evidence: the one-way gate, the staging apply, the first push and the functions on the persistent project

Attempt: 184-21-1 20261111T162209Z.0e6ba4f90
Attempt: 184-21-2 20261111T180327Z.0e6ba4f90
Attempt: 184-21-3 20261111T204920Z.0e6ba4f90

- **Project:** the persistent project `cofbsatfrdysyphajsky` (`openvaa-staging`, `eu-north-1`), root `infra/envs/staging/supabase`. The throwaway's ref `begckvkapaopoztbreqc` appears only as the wrong ref the wrapper refused.
- **Dates (UTC):** 2026-11-11. The gate was answered after 16:22:09Z, and the sitting ran from 19:34:36Z (`s0_started_at`) to 20:47:17Z (`s17_deploy_at`) plus the deploy and the reads after it.
- **How it was run:** the orchestrator ran the sitting under the operator's authorisation of 2026-11-11 for the staging sittings, with credentials from the operator's keychain.
  - The ten numbered scripts, `00-start.sh` to `09-cleanup.sh`, each ran in a fresh shell and sourced one prelude. The prelude stops unless the ref is `cofbsatfrdysyphajsky` and the tfvars read the declared region, origin, project id, port and sender. It unsets every credential a script does not name.
  - Every script that changes the project (01 apply, 05 push, 07 functions) and the link (03) first required the line `D01_GATE=proceed` in the current attempt file of `184-21-1`.
  - The operator approved the apply before 01 ran. The operator ran 05 in their own terminal and typed the ref; no terminal was faked.
- **Source of every value:** the reply as stored in the current attempt file of `184-21-2`, under `OPERATOR_REPLY=received attempt=20261111T180327Z.0e6ba4f90 plan=184-21 task=2 head=0e6ba4f902faa64e8393404a304e295d91c7105a sha256=caeebee2e4d8b206d3d41863d455c1c8cdee9a963eccd02c4c506922a539dc13`. The screen accepted it on the first `put`.
- **What is kept out:** no value of a secret, no key, no token, no IP address and no e-mail address other than the sender's.

## 1. The one-way gate (Task 1)

D01_GATE=proceed

- **Answer:** `answer_gate=proceed`, given by the operator explicitly on 2026-11-11, through the orchestrator, after being shown the four commitments, the rehearsal records and the two risks below. It is stored in the current attempt file of `184-21-1` under `OPERATOR_REPLY=received attempt=20261111T162209Z.0e6ba4f90 plan=184-21 task=1 head=0e6ba4f902faa64e8393404a304e295d91c7105a`.
- **The four commitments shown:**
  1. Apply exactly the reviewed staging plan, sha256 `caeebee2…dc13`.
  2. Link the CLI in `tmp/supabase-linked/cofbsatfrdysyphajsky`.
  3. Push migration `00001` (one-way: the version is recorded and never applied again, and the project cannot be recreated).
  4. Deploy the three functions.
- **The records shown, each present and as required:**

| Plan | Attempt | Record |
| ---- | ------- | ------ |
| 184-11 | 184-11-1 `20261109T093658Z.c8607274d` | The throwaway push: `s16_push_status=0`, `s16_drift_status=0`, `s16_push_exit=0`, drift check CLEAN. The first apply there needed a retry plan after a PostgREST 500. |
| 184-13 | 184-13-2 `20261110T132949Z.512ce3d9b` | Drift red with planted functions (`s4_drift_red_exit=1`), then green (`s7_drift_clean_exit=0`). Second push `s16_push_up_to_date=yes`, `s16_push_exit=0`. |
| 184-15 | 184-15-2 `20261110T214945Z.977bd5b13` | The bootstrap twice, `s20_boot1_exit=0` and `s20_boot2_exit=0`. |
| 184-16 | 184-16-1 `20261111T085840Z.73bbc7b47` | Mail delivered on port 2587, `answer_mail_arrived=yes`. |
| 184-17 | 184-17-2 `20261111T100618Z.9027d2fdc` | Probe green, `s23_probe_exit=0`. |
| 184-18 | 184-18-2 `20261111T102034Z.d6769ac3b` | Probe red, `s23_probe_exit=1`. |
| 184-19 | 184-19-1 `20261111T125155Z.f537e2a2f` | Probe green after the revert, `s23_probe_exit=0`, and drift `s7_drift_exit=0`. |
| 184-20 | 184-20-3 `20261111T161534Z.184cab73a` | `PLAN_REVIEWED=ok root=staging`, the checksum above, `ref=cofbsatfrdysyphajsky`. |

- **The two risks shown:**
  - The apply could fail with the PostgREST 500 seen on the throwaway; the plan then stops, and 184-20 makes a new plan.
  - Password sign-ins on staging fail with 500 until the push, because both hooks were already on and their functions absent.

## 2. The starting state (item 0)

- The first run of `00-start.sh` exited 1 with `s0_aws_session=no` alone: the AWS sign-in session had expired. Nothing was changed. After the operator signed in again, the rerun printed `s0_ready=yes`.
- `s0_head=0e6ba4f90`, `s0_tree_diff_exit=0`, `s0_plan_file_present=yes`.
- `s0_plan_sha256=caeebee2e4d8b206d3d41863d455c1c8cdee9a963eccd02c4c506922a539dc13`, `s0_plan_sha256_is_reviewed=yes`, `s0_plan_lines_are_reviewed=yes`: `terraform show -no-color tfplan` gave the sorted lines 184-20 reviewed, byte for byte.
- `s0_docker_exit=0`, `s0_pg_path=pooler`, `s0_pooler_shard=aws-0`, `s0_workdir_present=no`, `s0_shared_dir_linked=no`, `s0_cache_before=1`, `s0_d01_gate=proceed`.

## 3. The apply and the second plan (item 1)

| Line | Value |
| ---- | ----- |
| `s1_plan_sha256` | `caeebee2e4d8b206d3d41863d455c1c8cdee9a963eccd02c4c506922a539dc13`, equal to 184-20's `PLAN_REVIEWED=ok` checksum (`s1_plan_sha256_is_reviewed=yes`) |
| `s1_plan_lines_are_reviewed` | `yes` |
| `s1_apply_at` | 2026-11-11T19:36:04Z |
| `s1_apply_exit` | **0** |
| `s1_apply_line` | `Apply complete! Resources: 2 added, 1 changed, 0 destroyed.` |
| `s1_progress` | `supabase_edge_function_secrets.this[0]`: Creation complete after 0s; `supabase_settings.this`: Modifications complete after 5s; `supabase_settings.smtp_secret[0]`: Creation complete after 3s |
| `s1_plan_file_removed` | yes |
| `answer_applied` | **yes** |
| `s1_second_plan_try` | 1, exit 0, at 19:36:59Z, 55 s after the apply began and after the script's 25 s wait |
| `s1_second_plan_exit` | **0** |

The reviewed plan was applied whole, on the first try. The PostgREST 500 of the throwaway's first apply did not occur. Its cause stays UNCONFIRMED. The second plan was empty on its first try, so the delayed read seen on the throwaway after an apply did not show here.

## 4. What the project serves after the apply (item 2, Step 18)

All three reads answered 200 (`s18_auth_http`, `s18_api_http`, `s18_secrets_http`), on the first auth read (`s18_auth_read_try=1`, 19:37:00Z).

| Field | Served | Declared in `infra/envs/staging/supabase/terraform.tfvars` `smtp` | Equal |
| ----- | ------ | ----------------------------------------------------------------- | ----- |
| host | `email-smtp.eu-north-1.amazonaws.com` | `email-smtp.eu-north-1.amazonaws.com` | yes |
| port | `2587` | `"2587"` | yes |
| admin_email | `noreply@staging.openvaa.org` | `noreply@staging.openvaa.org` | yes |
| sender_name | `OpenVAA` | `OpenVAA` | yes |
| smtp_user set | `yes` | given as `TF_VAR_smtp_user` | yes |

`s18_smtp_as_declared=yes`.

- **Other auth settings:** 34 lines `s18_auth.*` were printed, each with the value the module sends. Among them: `disable_signup=true`, `mailer_autoconfirm=false`, `site_url="https://staging.openvaa.org"`, `uri_allow_list="https://staging.openvaa.org/api/auth/callback,https://staging.openvaa.org/*/api/auth/callback"`, both hooks `true` with their two `pg-functions://` URIs, and `rate_limit_email_sent=100`.
- **Flags the module does not send:** `s18_served_oauth_server_enabled=false`, `s18_served_oauth_server_allow_dynamic_registration=false`, unchanged by the update in place. The hooks are both `true`.
- **API settings:** `db_schema="public,graphql_public"`, `max_rows=50000`, `db_extra_search_path="public, extensions"`.
- **Function secret names:** seven `s18_secret_name=` lines: `PUBLIC_PROJECT_ID`, `SITE_URL`, `SMTP_FROM`, `SMTP_HOST`, `SMTP_PASS`, `SMTP_PORT`, `SMTP_USER`. That equals the root's `managed_function_secret_names` output (`s18_secret_names_as_declared=yes`). No `s18_platform_secret_name=` line was printed, so `/secrets` listed no `SUPABASE_` name on this project either. No value or digest was printed.

## 5. The link and the connection (item 3, Steps 14 and 15)

| Line | Value |
| ---- | ----- |
| `s14_links` | 3 |
| `s14_link_exit` | 0 |
| `s14_linked_ref` | `cofbsatfrdysyphajsky` |
| `s14_shared_dir_linked` | `no` |
| `s15_connection` | `pooler`, `s15_pooler_shard=aws-0` (the session pooler of `eu-north-1`, port 5432, user `postgres.<ref>`, as 184-20 measured) |

## 6. The refusal of the throwaway's ref (item 4)

| Line | Value |
| ---- | ----- |
| `s4_workdir_linked_ref` | `cofbsatfrdysyphajsky` |
| `s4_wrong_ref_exit` | **2** |
| `s4_stdout_lines` | 0 |
| `s4_refusal_names_link` | `yes`: the message names the link to `cofbsatfrdysyphajsky` and `--ref` `begckvkapaopoztbreqc`, and ends `nothing was pushed` |
| `s4_log_dir_created` | `no`: the wrapper refused before it made its log directory |

## 7. The push and the second push (item 5, Step 16)

**First attempt.** Run through the session's `!` prefix, the wrapper found no terminal to confirm on. It printed `s16_push_exit=2` with the refusal `there is no terminal to confirm the push`, and pushed nothing. The operator ran the same block in a separate terminal, saw `The project cofbsatfrdysyphajsky lacks these migrations: 00001` and typed `cofbsatfrdysyphajsky`.

| Line | First push (20:46:04Z to 20:46:30Z) | Second push (from 20:47:02Z) |
| ---- | ------------------------------------ | ---------------------------- |
| `push_connection` | `unknown` | `unknown` |
| `push_pending` | `00001` | none |
| `push_up_to_date` | `no` | **`yes`** |
| `push_status` | **0** | not run (nothing pending) |
| `drift_status` | **0** | **0** |
| `push_exit` | **0** (`s16_push_exit`) | **0** (`s5_push_exit`) |
| report | `history: manifest: 00001`, `history: database: 00001`, `history: holds`, `schema: holds`, `CLEAN -- the history equals the manifest and the diff is empty` | the same five lines |

- **The frozen baseline `00001` is on the persistent project**, pushed by the same wrapper and commands as on the throwaway. The drift check after the push was clean, and the second run pushed nothing, asked nothing and exited 0.
- **How the five push lines were recorded.** The sitting's scripts 05 and 06 passed the wrapper's named lines through the prelude's `clean()`, which deletes `=`. So they arrived as, for example, `s16_push_status0`. The stored reply keeps each such line as a `note: raw` line. It restores it by inserting `=` after its fixed field name, and that is the only change. The statuses are borne out without that restore: `s16_push_exit=0` and `s5_push_exit=0`, which by the wrapper's contract mean the migrations are in place and there is no drift, and the `CLEAN` report lines, which `clean()` left intact. The two scripts were corrected for any later sitting.
- **`push_connection=unknown` again**, and `s16_cli_pooler_fallback_warning=no`: the CLI's IPv4-pooler fallback warning was not in the dry run's output either. Which path the CLI took to the database stays unknown. This is the gap in `deferred-items.md`, unchanged.

## 8. The functions (item 6, Step 17)

| Line | Value |
| ---- | ----- |
| `s17_linked_ref` | `cofbsatfrdysyphajsky` |
| `s17_docker_exit` | 0 |
| `s17_deploy_at` | 2026-11-11T20:47:17Z |
| `s17_deploy_exit` | **0** |
| `s17_function` | `account-access status=ACTIVE verify_jwt=false version=1` |
| `s17_function` | `identity-callback status=ACTIVE verify_jwt=false version=1` |
| `s17_function` | `send-email status=ACTIVE verify_jwt=true version=1` |
| `s17_keyless_get_http` | **405**, at the first try: a GET of `identity-callback` with no key reached the function itself |
| `s17_functions_as_declared` | yes |

The three functions are deployed and listed ACTIVE, with `verify_jwt` as `config.toml` declares it. The deploy came after the push, so both hooks' functions existed before any function ran.

## 9. The buckets (item 7)

| Line | Value |
| ---- | ----- |
| `s7_psql_exit` | 0 |
| `s7_bucket` | `private-assets:false`, `public-assets:true` |
| `s7_buckets_http` | 200 |
| `s7_api_bucket` | `private-assets public=false`, `public-assets public=true` |

Both buckets exist after the push, as the migration creates them. psql spells the booleans in full, because they are concatenated as text.

## 10. Cleanup (item 8)

`s8_plan_file_absent=yes`, `s8_tree_diff_exit=0`, `s8_logs_removed=yes`, `s8_cache_before=2`, `s8_cache_after=0`. The linked work directory `tmp/supabase-linked/cofbsatfrdysyphajsky` is kept for later sittings.

## Deviations recorded with this evidence

1. **The first `00-start.sh` run stopped on an expired AWS sign-in session.** Nothing changed, and the rerun after the sign-in was ready.
2. **The first push attempt had no terminal** through the session's `!` prefix. The wrapper refused with exit 2 and pushed nothing, and the operator then pushed from a separate terminal.
3. **The five push lines of 05 and 06 lost their `=`** to the scripts' `clean()`. They were restored in the stored reply as described in section 7, with the raw lines kept.
