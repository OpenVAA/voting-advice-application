# 184-10 evidence: the throwaway project read before any change, and its first scratch plan reviewed

Attempt: 184-10-1 20261108T190840Z.b6efa7d00
Attempt: 184-10-2 20261108T193057Z.b047f448b
Attempt: 184-10-3 20261109T092844Z.033621371

Superseded and never run: attempt `184-10-2 20261108T192033Z.b6efa7d00`. It was issued for the old throwaway ref. Its file carries a `note: superseded ... not run` line, and the pointer moved to the attempt above.

The throwaway project is `begckvkapaopoztbreqc` (`openvaa-scratch`). The persistent project `cofbsatfrdysyphajsky` was not touched. Every value below comes from the operator's reply as stored in the current attempt file of `184-10-2` (`OPERATOR_REPLY=received attempt=20261108T193057Z.b047f448b plan=184-10 task=2 head=033621371bdc622e0799d5cf51193242525ccf30 sha256=9ea24b40518b08b3487fe531606be51639e054bb489f403a2fdc50bd8bf63e94`).

**Dates.** The sitting ran between 2026-11-08T19:30:57Z, when attempt `184-10-2` was opened, and 2026-11-09T09:28:44Z, when the reply was recorded and attempt `184-10-3` opened. The reply does not give a time for each item, so items 1 to 6 are dated "2026-11-08/09" below. Item 7, the plan, was made on 2026-11-09, after commit `033621371` (2026-11-09T06:45:40Z) set the region it reads.

## The throwaway project was replaced (operator-reported, 2026-11-08)

- **The old project was gone.** The operator found the original throwaway project `suxeqyhafjueinxnojge` already deleted, and created `openvaa-scratch`, ref `begckvkapaopoztbreqc`, in the staging organisation. Commit `b047f448b` points the scratch root's `project_ref` at the new ref.
- **Its region differs from staging's.** The first plan of this sitting proposed `~ region = "eu-west-1" -> "eu-north-1"` on `module.supabase.supabase_project.this` (`Plan: 1 to import, 3 to add, 1 to change, 0 to destroy.`, sha256 `35345ac30924787f24eefd0d793f95ab6c448c4da3a192a438c425cd6b4a2569`). That plan was stopped, never applied, and its `tfplan` removed (`s7_old_plan_removed=yes`). The recreated project is in `eu-west-1`; staging stays in `eu-north-1`.
- **The plan reviewed below comes from the corrected tree.** Commit `033621371` sets the scratch `region` to `eu-west-1`, the value the provider reads. The plan reviewed below was made on that tree. The attempt id still names `b047f448b`, the HEAD when the attempt was opened.

## Task 1: how the scratch root gets its state back

- **Ruling:** `reimport`, chosen by the operator on 2026-11-08 and relayed by the orchestrator (`answer_state_restore=reimport`, attempt `20261108T190840Z.b6efa7d00`).
- **Before the ruling:** the root had one `import {` block and no `terraform.tfstate`. The ruling stands for the recreated project.
- **Item 1:** `s1_state_copied=no`.

## Item 2: the connection psql uses (2026-11-08/09)

- `s15_direct_exit=0`, `s15_connection=direct`, `s15_logs_removed=yes`.
- **psql reached the throwaway's database directly**, at `db.<ref>.supabase.co:5432` as `postgres`, from the operator's workstation. The session pooler was not needed and not tried.

## Item 3: the seven logging settings (2026-11-08/09, before any bootstrap)

`s19_psql_exit=0`. Seven lines, as served:

| Setting | Served value | Alone, by the runbook's table | Partner |
| --- | --- | --- | --- |
| `log_statement` | `ddl` | safe (the bootstrap's statements are `mod`) | — |
| `log_parameter_max_length` | `-1` | would log, but only with a partner | `log_statement` (`ddl`, safe) and `log_min_duration_statement` (`-1`, safe): no partner |
| `log_min_duration_statement` | `-1` | safe | — |
| `pgaudit.log` | `none` | safe | — |
| `pgaudit.log_parameter` | `off` | safe | — |
| `auto_explain.log_min_duration` | `10s` | **would log** | `auto_explain.log_parameter_max_length` = `-1`, not `0` |
| `auto_explain.log_parameter_max_length` | `-1` | **would log** | `auto_explain.log_min_duration` = `10s` |

**Verdict under RESEARCH Item 6.**
- **Successful statements:** no statement that succeeds is logged with its parameters. `log_statement` is `ddl`, `log_min_duration_statement` is `-1`, and pgaudit is off.
- **Slow statements:** a statement slower than 10 s **would be logged with its whole parameters**, through the pair `auto_explain.log_min_duration=10s` and `auto_explain.log_parameter_max_length=-1`.
- **Nearly the same as locally:** the local stack reads `ddl, -1, -1, <empty>, off, 10000, -1`. The only difference is that `pgaudit.log` is `none` here, where it is empty locally.
- **What this read does not settle:** whether `auto_explain` is loaded in the bootstrap's session. `current_setting(..., true)` returns a value also for a placeholder setting of a module that is not loaded.
- **Who decides:** plan 184-15 decides the D-10 gate on these values, as the research predicted.

## Item 4: the key model (2026-11-08/09)

| Line | Value |
| --- | --- |
| `s4_list_http` | `200` |
| `s4_issued` | `legacy/anon` |
| `s4_issued` | `legacy/service_role` |
| `s4_issued` | `publishable/default` |
| `s4_issued` | `secret/default` |
| `s4_legacy_http` | `200` |
| `s4_legacy_enabled` | `true` |

Dashboard (from the operator's screenshots of the API Keys and legacy API keys pages):

- `answer_legacy_state=legacy anon and service_role keys enabled; the page offers "Disable JWT-based API keys"`
- `answer_legacy_retirement=early 2027`
- `answer_publishable_issued=yes`

**Both key models are live on the new project.** It issues the legacy JWT keys, enabled, together with a publishable and a secret key. The dashboard gives "early 2027" as the retirement of the legacy keys. The legacy-keys endpoint still answers (200, not 404). No field of the reply was null.

The operator put the **publishable** key into `SUPABASE_ANON_KEY` for this sitting (`answer_anon_kind=publishable`), even though a legacy `anon` key exists. Item 6's sign-in therefore ran with the publishable key as `apikey`.

## Item 5: the dashboard's switches (2026-11-08/09)

The labels as the dashboard shows them (from screenshots of User Signups and Auth Hooks):

- `answer_signup_switch_name=Allow new users to sign up`
- `answer_confirm_switch_name=Confirm email`
- `answer_switch_page=Authentication > Sign In / Providers (User Signups panel; /dashboard/project/<ref>/auth/providers)`
- `answer_switch_states=Allow new users to sign up on; Confirm email on (Allow manual linking off; Allow anonymous sign-ins off)`
- `answer_hooks_state=none (Authentication > Hooks lists no hook)`

These states are a new project's platform defaults. No settings resource had been applied to this project.

## Item 6: one password sign-in (2026-11-08/09)

- `answer_disposable_user=created`, then `s6_signin_http=200` and `s6_signin_error_code=none`. The reply holds a token, which stayed in `$L` and was removed by item 8.
- **An earlier try failed.** The first try of item 6 returned 400 `invalid_credentials`. A retry with the same user and the password from the password manager returned 200. The cause of the 400 is UNCONFIRMED, probably a mistyped password at the prompt. It was not tested in isolation.
- **The publishable key works for sign-in.** The auth endpoint accepted it as `apikey` for a password sign-in.

**What this says about F2's runtime half: nothing.** The recreated project has no hook set (`answer_hooks_state=none`), so this was a sign-in with the hook off. The observation "a token issued while the access-token hook is on and its function absent" is not made here. That window now exists only between the first settings apply, which turns both hooks on, and the first migration push, which creates their functions. Both happen in the next sitting (plan 184-11).

## Item 7: the first scratch plan, and its review

`s7_init_exit=0`, `s7_plan_exit=0`. The plan lines, in the order pasted:

```
  # module.supabase.supabase_edge_function_secrets.this[0] will be created
  # module.supabase.supabase_project.this will be imported
  # module.supabase.supabase_settings.smtp_secret[0] will be created
  # module.supabase.supabase_settings.this will be created
Plan: 1 to import, 3 to add, 0 to change, 0 to destroy.
```

`s7_plan_sha256=9ea24b40518b08b3487fe531606be51639e054bb489f403a2fdc50bd8bf63e94`. Item 8: `s8_logs_removed=yes`. The operator keeps `tfplan`.

**Review (2026-11-09).**
- **What was compared:** the five lines, sorted, were compared with the exact list expected under `reimport` (`diff` exit 0). That list is: the project imported, `supabase_settings.this`, `supabase_settings.smtp_secret[0]` and `supabase_edge_function_secrets.this[0]` created, and `Plan: 1 to import, 3 to add, 0 to change, 0 to destroy.`.
- **What was ruled out:** there is no other address, no destroy, no replacement and no project creation. The project's heading reads "will be imported", with no update, and the summary counts 0 to change, so no password change is planned.

Review line, in the attempt file of `184-10-3`:

```
PLAN_REVIEWED=ok attempt=20261109T092844Z.033621371 root=scratch sha256=9ea24b40518b08b3487fe531606be51639e054bb489f403a2fdc50bd8bf63e94 ref=begckvkapaopoztbreqc
```

**Plan 184-11 applies only the file with this checksum.**
