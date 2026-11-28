# 184-20 evidence: the persistent project read before any change, and its first staging plan reviewed

Attempt: 184-20-2 20261111T160625Z.184cab73a
Attempt: 184-20-3 20261111T161534Z.184cab73a

- **Project:** the persistent project `cofbsatfrdysyphajsky` (`openvaa-staging`, `eu-north-1`). It is the first sitting on it in this phase, after the throwaway's rehearsal (184-15 to 184-19) was complete.
- **Nothing was applied, pushed, written or bootstrapped.** Every script read the project, except item 4, which made and saved a plan.
- **Source of every value:** the operator's reply as stored in the current attempt file of `184-20-2`, under `OPERATOR_REPLY=received attempt=20261111T160625Z.184cab73a plan=184-20 task=2 head=184cab73aef21025b3659590b0f5c564e9b7dd6a sha256=caeebee2e4d8b206d3d41863d455c1c8cdee9a963eccd02c4c506922a539dc13`.
- **How it was run:** the orchestrator ran the sitting under the operator's authorisation of 2026-11-11 for the staging sittings, with credentials from the operator's keychain.
  - Six numbered scripts, `00-start.sh` to `05-cleanup.sh`, each in a fresh shell, each sourcing one prelude.
  - The prelude loads the staging credentials and stops unless the ref is `cofbsatfrdysyphajsky`. It also stops unless the tfvars read region `eu-north-1`, the canonical project id and port `2587`.
  - It unsets every credential a script does not name. Only `s<n>_` lines were printed.
  - All six scripts exited 0.
- **The dashboard answers** come from the operator's screenshots of the API keys page, 2026-11-11.
- **When (UTC):** 2026-11-11, from 16:07:39Z (`s0_started_at`) to 16:07:44Z (`s4_started_at`) plus the plan's run time. The review was at 16:15:34Z, when attempt `184-20-3` opened.

## Starting state (item 0)

- `s0_head=184cab73a`, `s0_tree_diff_exit=0`: the tree was the committed one, with the staging tfvars of Task 1 (`s0_tfvars_smtp_blocks=1`, `s0_tfvars_project_id_lines=1`).
- `s0_plan_file_present=no`: no plan file was left in the root from an earlier sitting.
- `s0_aws_session=yes`.

## Item 1: the connection psql uses (Step 15)

| Line | Staging, 2026-11-11 | Throwaway |
| --- | --- | --- |
| `s15_direct_exit` | `2`, `s15_direct_failure=name-not-resolved` | `0` on 2026-11-08/09 (184-10); name not resolved on 2026-11-09/10 (184-11); `0` on 2026-11-11 (184-15) |
| `s15_pooler_config_http` | `200` | not read; host given by the orchestrator |
| `s15_pooler_host_source` | `api` | — |
| `s15_pooler_shard`, `s15_pooler_region` | `aws-0`, `eu-north-1` | `aws-0`, `eu-west-1` |
| `s15_pooler_exit` | `0` | `0` |
| `s15_connection` | **pooler** | pooler from 184-11 on |

- **The direct host did not resolve from the workstation.** psql reported that it could not translate the name. Why is UNCONFIRMED. On the throwaway, the same failure went with an IPv6-only name (184-11).
- **The session pooler host came from the Management API.** `GET /v1/projects/<ref>/config/database/pooler` answered 200 with a `db_host` of the session-pooler form `aws-0-eu-north-1.pooler.supabase.com`. It was accepted only because it has the form `aws-<n>-<region>.pooler.supabase.com` for the region in the root's tfvars. psql connected through it on port 5432 as `postgres.<ref>`.
- Port 6543 was not used.

## Item 2: the seven logging settings (Step 19)

`s19_connection=pooler`, `s19_psql_exit=0`. Seven lines, before any bootstrap of the persistent project:

| Setting | Staging, 2026-11-11 | Throwaway, 2026-11-08/09 (184-10) | Same |
| --- | --- | --- | --- |
| `log_statement` | `ddl` | `ddl` | yes |
| `log_parameter_max_length` | `-1` | `-1` | yes |
| `log_min_duration_statement` | `-1` | `-1` | yes |
| `pgaudit.log` | `none` | `none` | yes |
| `pgaudit.log_parameter` | `off` | `off` | yes |
| `auto_explain.log_min_duration` | `10s` | `10s` | yes |
| `auto_explain.log_parameter_max_length` | `-1` | `-1` | yes |

**No setting differs from the throwaway's.** By the runbook's table of Step 19:
- **Successful statements:** none is logged with its parameters. `log_statement` is `ddl` and the bootstrap's statements are `mod`; `log_min_duration_statement` is `-1`; pgaudit is off.
- **Slow statements:** a statement slower than 10 s **would be logged with its whole parameters**, through the pair `auto_explain.log_min_duration=10s` and `auto_explain.log_parameter_max_length=-1`.
- **Not settled by this read:** whether `auto_explain` is loaded in the bootstrap's session. `current_setting(..., true)` also returns a value for a placeholder of a module that is not loaded.
- **Who decides:** plan 184-22 decides the gate for this project.

## Item 3: the key model

| Line | Staging, 2026-11-11 | Throwaway, 2026-11-08/09 (184-10) |
| --- | --- | --- |
| `s3_list_http` | `200` | `200` |
| `s3_issued` | `legacy/anon`, `legacy/service_role`, `publishable/default`, `secret/default` | the same four |
| `s3_legacy_http` | `200` | `200` |
| `s3_legacy_enabled` | `true` | `true` |
| `answer_legacy_state` | active, shown under "View legacy API keys" with a note to prefer publishable and secret keys; a "Disable JWT-based API keys" control is offered | legacy anon and service_role keys enabled; the page offers "Disable JWT-based API keys" |
| `answer_legacy_retirement` | early 2027 (banner: "Legacy API keys will be retired in early 2027") | early 2027 |
| `answer_publishable_issued` | yes | yes |

**Both projects have the same key model.** Each issues the legacy JWT keys, enabled, together with one publishable and one secret key named `default`. The dashboard gives the legacy keys' retirement as early 2027. The list was read with `reveal=false`, and no key value was printed or stored.

Plan 184-23 records the key model in the FUT-02 todo (D-12).

## Item 6, an added read: served auth flags before any change

The module does not send the two OAuth flags, so no plan shows them. The hooks and the SMTP port are what the first apply changes or relies on. All five were read before that apply:

| Line | Value |
| --- | --- |
| `s6_auth_read_http` | `200` |
| `s6_served_oauth_server_enabled` | `false` |
| `s6_served_oauth_server_allow_dynamic_registration` | `false` |
| `s6_served_hook_custom_access_token_enabled` | `true` |
| `s6_served_hook_send_email_enabled` | `true` |
| `s6_served_smtp_port` | `null` |

- **The OAuth server is off,** so the module's not sending those flags leaves nothing on to revert. On the throwaway they were on only because a fault planted them (184-18).
- **Both hooks were already on,** from the settings apply of 2026-10-23.
- **No SMTP port was served yet,** so the plan's update in place and its creation of `smtp_secret[0]` are what set SMTP on this project.
- **Not read:** whether the hooks' database functions exist yet. This read does not show it. It matters only once someone signs in, and the migrations come first (runbook "Traps", "A hook switched on before its function exists").

## Item 4: the first staging plan, and its review

`s4_aws_session=yes`, `s4_smtp_credentials_read=yes`, `s4_init_exit=0`, `s4_plan_exit=0`. The plan lines, as printed:

```
  # module.supabase.supabase_edge_function_secrets.this[0] will be created
  # module.supabase.supabase_settings.smtp_secret[0] will be created
  # module.supabase.supabase_settings.this will be updated in-place
Plan: 2 to add, 1 to change, 0 to destroy.
```

Also printed:
- `s4_plan_password_lines=0`;
- `s4_plan_stop_lines=0`, meaning no line says imported, replaced, must be replaced, forces replacement or destroyed;
- no `s4_plan_note=` line;
- `s4_plan_matches_rule=yes`, `s4_plan_file_kept=yes`;
- `s4_plan_sha256=caeebee2e4d8b206d3d41863d455c1c8cdee9a963eccd02c4c506922a539dc13`.

Item 5: `s5_tree_diff_exit=0`, `s5_plan_file_kept=yes`, `s5_logs_removed=yes`.

**Review (2026-11-11, attempt 184-20-3).**
- **What was compared:** the four lines, sorted, against the exact expected list. They matched (`cmp` exit 0) twice: in the sitting's script, and again by the executor from the stored reply. The list is:
  - `module.supabase.supabase_settings.this` updated in place;
  - `module.supabase.supabase_settings.smtp_secret[0]` and `module.supabase.supabase_edge_function_secrets.this[0]` created;
  - `Plan: 2 to add, 1 to change, 0 to destroy.`
- **What was ruled out:**
  - no other address;
  - no import line, so the root's `import` block planned nothing with the project in state;
  - no destroy and no replacement;
  - no line naming the database password;
  - no change to the project resource.
- **The kept plan file:** the file in the root has the reviewed checksum. The sitting's `plan.lines` beside the scripts equals the reviewed lines. `infra/envs/staging/supabase/tfplan` is ignored by Git (`.gitignore`, pattern `tfplan`).

Review line, in the attempt file of `184-20-3`:

```
PLAN_REVIEWED=ok attempt=20261111T161534Z.184cab73a root=staging sha256=caeebee2e4d8b206d3d41863d455c1c8cdee9a963eccd02c4c506922a539dc13 ref=cofbsatfrdysyphajsky
```

**Plan 184-21 applies only the file with this checksum,** and only after the operator's go-ahead and the D01_GATE.
