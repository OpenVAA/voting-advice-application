# 184-19: the revert of the batched break on the throwaway, and the green run after it

Attempt: 184-19-1 20261111T125155Z.f537e2a2f
Attempt: 184-19-2 20261111T130201Z.3da43eb0a

**Verdict: every fault of plan 184-18 is reverted, the probe passes all 22 checks and exits 0, and the drift check exits 0.** That gives the green, red, green sequence SUPA-07 asks for on one project: green in 184-17, red by every planted fault in 184-18, and green again here. Two reverts were added to the plan:
- **The OAuth server flags (script `01b`):** the module does not send them, so the replaced settings resource left them on.
- **The seven `storage.objects` policies of the `private-assets` bucket (script `02b`):** the first two drift runs found them missing; the probe did not.

- **Project:** the throwaway `begckvkapaopoztbreqc` (`eu-west-1`), root `infra/envs/scratch/supabase`. It started from the broken state 184-18 left. Script 00 read:
  - `s0_fault_in_state=1`;
  - `identity-callback` with `verify_jwt=true version=5`, and no `send-email`;
  - `s0_signup_pair=disable_signup=false mailer_autoconfirm=true` and `s0_redirect_class=refused`;
  - both OAuth flags `true` and both hooks `false`;
  - `smtp_port=2465`, `password_min_length=12`, `max_rows=500` and `db_schema=public`;
  - `s0_hook_function_count=0`, `s0_planted_function_count=1` and `s0_anon_timeout=3s`;
  - `s0_bucket_rows=1` and `s0_seed_domain_users=1`.
- **Connection:** `s15_connection=pooler` (`s15_direct_exit=2`, `s15_pooler_exit=0`).
- **The tree:** clean at `f537e2a2f` (`s0_tree_diff_exit=0`, `s0_config_diff_exit=0`, `s0_config_major=17`), with the keyless `identity-callback` calls in it (`s0_keyless_calls_in_tree_exit=0`).
- **Who ran the sitting:** the orchestrator, under the operator's authorisation of 2026-11-10, with the throwaway's credentials read from the operator's keychain. The orchestrator reviewed every script that changes the project before running it. The planted user was deleted by SQL, not in the dashboard. The executor held no credential and ran nothing against the hosted project.
- **When (UTC):** **2026-11-11**. The sitting started at 12:53:29Z. The probe ran at 12:55:24Z, the policies were restored at 13:00:26Z, and the clean drift check started at 13:00:28Z.
- **How the record was written:** from the attempt files.
  - `184-19-1` is stored under `OPERATOR_REPLY=received attempt=20261111T125155Z.f537e2a2f plan=184-19 task=1 head=f537e2a2fa2a2b93461cfc88e2846b271d1f7fca`, and `bound` exits 0 on it.
  - `02b`, the third drift run and the second cleanup ran at HEAD `3da43eb0a`. That commit differs from the attempt's commit only in this phase's `deferred-items.md`.
  - The first two drift runs are stored as `s7a_` and `s7b_`, and the first cleanup as `s8a_`, so that only the last run carries `s7_` and `s8_`.
  - `184-19-2` holds the executor's check.
- **What is kept out:** no key, token, password, address or IP. The planted user was matched by its domain in SQL, and only counts were printed. The log directory was removed (`s8_logs_removed=yes`).

## 1. The reverts

| Item | Revert | Lines | Status |
| ---- | ------ | ----- | ------ |
| 1 | The settings: `terraform plan -var fault_set=none -replace=module.supabase.supabase_settings.this`, applied only on the rule's lines | `s1_aws_session=yes`; `s1_plan_line=  # module.supabase.supabase_settings.this will be replaced, as requested`; `s1_plan_line=  # supabase_settings.faults[0] will be destroyed`; `s1_plan_line=Plan: 1 to add, 0 to change, 2 to destroy.`; `s1_plan_note=  # (because index [0] is out of range for count)`; `s1_plan_password_lines=0`; `s1_plan_matches_rule=yes`; `s1_apply_exit=0` (`1 added, 0 changed, 2 destroyed`); `s1_served_declared=yes` after 20 s (sign-up closed, autoconfirm off, `smtp_port=2587`, both hooks on, `password_min_length=8`, the site URL on the origin, 2 allow-list entries, none off the origin); `s1_served_max_rows=50000`; `s1_served_db_schema=public,graphql_public`; `s1_second_plan_first_exit=0` ("No changes"); `s1_second_plan_exit=0` | reverted |
| 1b | **Added:** the OAuth server flags, which the replaced resource left `true`. A Management API update of `/config/auth` sent both flags `false` and `oauth_server_authorization_path` | `s1b_served_before_oauth_server_enabled=true`; `s1b_patch_needed=yes`; `s1b_patch_http=200`; `s1b_served_oauth_off=yes` after 20 s; both `s1b_served_oauth_*=false`; `s1b_plan_exit=0` ("No changes") | reverted; the authorization path stays `/oauth/consent`, which no check reads |
| 2 | The `private-assets` bucket row, inserted with the migration's values | `s2_bucket_exit=0`; `s2_psql_line=INSERT 0 1`; `s2_bucket_rows=2`; `s2_bucket=private-assets public=false`; `s2_bucket=public-assets public=true` | reverted (the row) |
| 2b | **Added:** the seven policies on `storage.objects` that name `private-assets`, copied from the initial migration and run in one transaction | `s2b_migration_diff_exit=0`; `s2b_statements=7`; `s2b_statement_lines=148`; `s2b_bucket_present=1`; `s2b_objects_policies_before=8`; `s2b_named_policies_before=0`; `s2b_psql_exit=0`; one `SET` and seven `CREATE POLICY`; `s2b_applied=yes`; `s2b_named_policies=7`; `s2b_objects_policies=15` | reverted |
| 3 | Step 17: all three functions deployed from the linked work directory | `s3_linked_ref=begckvkapaopoztbreqc`; `s3_docker_exit=0`; `s17_deploy_exit=0`; `s17_function=account-access status=ACTIVE verify_jwt=false version=6`; `s17_function=identity-callback status=ACTIVE verify_jwt=false version=6`; `s17_function=send-email status=ACTIVE verify_jwt=true version=1`; `s3_keyless_get_http=405` at the first try; `s3_functions_as_declared=yes` | reverted; the fallback `03b` was not needed and did not run |
| 4 | The hook function renamed back, `anon` at `8s`, PostgREST reloaded | `s4_psql_exit=0`; `s4_hook_function_count=1`; `s4_planted_function_count=0`; `s4_anon_timeout=8s` | reverted |
| 5 | The planted user deleted by SQL, matched on the seed's domain | `s5_seed_domain_users_before=1`; `s5_seed_id_users=0`; `s5_delete_exit=0`; `s5_deleted_rows=1`; `s5_seed_domain_users=0`; `answer_planted_user=deleted` | reverted |

- Each function declares its `verify_jwt` in `apps/supabase/supabase/config.toml`: `[functions.identity-callback]` and `[functions.account-access]` set it `false`, and `send-email` has no block there, so it keeps the default, `true`.
- `account-access` stayed at version 6 through the deploy of all three. Why is UNCONFIRMED; the CLI may skip a bundle that has not changed.

## Green run

`s6_probe_at=2026-11-11T12:55:24Z`. The inputs:
- `s6_head=f537e2a2f`, `s6_tree_diff_exit=0` and `s6_keyless_calls_in_tree_exit=0`;
- `s6_anon_kind=publishable`, `s6_service_role_unset=yes` and `s6_catalog_role=postgres`;
- `s6_seed_domain_users=0` and `s6_node_major=24`.

No major-version override was made, so `db.postgres-major` was judged as declared. This is the first green run with the keyless `identity-callback` calls.

`s23_probe_exit=0`, `s6_pass_lines=22`, `s6_fail_lines=0`, `s6_could_not_run_lines=0`, `s6_probe_lines_withheld=0`:

```text
PASS api.max-rows
PASS auth.access-token-hook
PASS auth.send-email-hook
PASS auth.site-url
PASS auth.redirects
PASS auth.signup-closed
PASS auth.email-confirm
PASS auth.smtp
PASS auth.oauth-server
PASS auth.other-settings
PASS api.schemas
PASS functions.deployed
PASS functions.verify-jwt
PASS auth.public-settings
PASS rows.read-whole
PASS functions.served
PASS functions.identity-callback-unverified
PASS storage.buckets
PASS db.hook-functions
PASS db.anon-timeout
PASS db.postgres-major
PASS no-seed
NOTE key-model: issued legacy/anon, legacy/service_role, publishable/default, secret/default; legacy keys enabled
```

`s6_check_no_seed=PASS` and `s6_check_functions_identity_callback_unverified=PASS`.

**The probe ran before the policy restore (item 2b).** This run stands as the green run without a rerun, for three reasons:
- No source of the probe reads a storage policy. `probe-hosted.mjs`, `probe/*.mjs` and `check-seed.sql` contain no match of `polic`, `storage.objects` or `pg_policies` (checked in attempt `184-19-2`).
- 02b changed only those policies.
- So none of the 22 verdicts depends on them. The project the probe saw differs from the final one only in those seven policies.

## 2. The drift check

| Run | When (UTC) | Lines |
| --- | --- | --- |
| `s7a_` (after item 5) | 12:55:49Z | `s7a_drift_exit=1`; history holds (`00001` on both sides); `SCHEMA DRIFT`; `s7a_diff_bytes=488` |
| `s7b_` (a rerun, after the first cleanup had removed the first diff) | 12:56:37Z | `s7b_drift_exit=1`; history holds; `SCHEMA DRIFT`; `s7b_diff_bytes=488` |
| `s7_` (after item 2b) | 13:00:28Z | `s7_docker_exit=0`; `s7_drift_exit=0`; `s7_report=history: holds`; `s7_report=schema: holds`; `s7_report=CLEAN -- the history equals the manifest and the diff is empty`; `s7_diff_bytes=0` |

The orchestrator read the diff of the second red run. It was exactly seven statements, `drop policy "<name>" on "storage"."objects"`, one for each policy of `00001_initial_schema.sql` that names `private-assets`:
- `authenticated_select_private_assets`;
- `entity_insert_private_assets`, `entity_update_private_assets` and `entity_delete_private_assets`;
- `project_insert_private_assets`, `project_update_private_assets` and `project_delete_private_assets`.

The diff states what would make the migrations' schema equal the database, so the database lacked the seven policies.

- **The likely cause, UNCONFIRMED:** deleting the bucket in the dashboard in 184-18 dropped the `storage.objects` policies that name it, and inserting the row again in item 2 did not bring them back. It was not measured on its own.
- **The lesson** is now in the runbook's "Fault steps on the throwaway project": a bucket fault's revert also restores the bucket's policies from the migration, and is checked with the drift check.
- **The coverage gap** (no probe check of the storage policies) is recorded in `deferred-items.md`.

## 3. Cleanup

`s8a_tree_diff_exit=0`, `s8a_logs_removed=yes` after the second run, and `s8_tree_diff_exit=0`, `s8_logs_removed=yes` last.
