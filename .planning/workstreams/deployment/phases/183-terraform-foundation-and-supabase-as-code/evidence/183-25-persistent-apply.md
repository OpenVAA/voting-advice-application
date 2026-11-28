# 183-25: The apply of the reviewed plan on the persistent project

**Applied and checked (2026-10-23).**

- **The plan file.** The operator applied, on the persistent project `cofbsatfrdysyphajsky`
  (`openvaa-staging`, `eu-north-1`), the plan file whose SHA-256 the 183-23 review names:
  `065a419e31ef13ae8f20b194178eb213fe053c643a7c9f5c74646a0872d43590`. The checksum printed before
  the apply was that one.
- **The apply** exited 0.
- **The second plan** exited 0 with no changes.
- **The read-back.** Every managed key the project serves equals its intended value: 37 of 37, none
  missing and none different.
- **The destroy plan** exited 1 and named the project resource as protected by `prevent_destroy`.
  `terraform destroy` was never run.
- **The state object** `hand/staging/supabase/terraform.tfstate` was read back from the bucket. It is
  encrypted with AES256 and versioned, and it holds the project and the settings resource.

Attempt: 25-1 20261023T110322Z.7f5e99d9d
Attempt: 25-2 20261023T114935Z.7f5e99d9d

Recorded: 2026-10-23T11:49Z (UTC).

- **When and where.** The operator ran the steps on 2026-10-23, in `infra/envs/staging/supabase`,
  at HEAD `7f5e99d9db66a954bf2b42e8d6f73502923735d3`.
- **Where the values come from.** Every value below is from the operator's named lines. They are
  stored in the attempt files named above, under `tmp/183-evidence/`, which Git ignores.
- **Secrets.** Neither the access token nor the database password was pasted, and neither is in any
  file.

## The checks before this record

Checked on 2026-10-23T11:49Z (UTC), at HEAD `7f5e99d9db66a954bf2b42e8d6f73502923735d3`.

| Check | Result |
| --- | --- |
| `field 23-3 PLAN_REVIEWED sha256` | `065a419e31ef13ae8f20b194178eb213fe053c643a7c9f5c74646a0872d43590`, 64 digits, for 23-3 attempt `20261023T105701Z.88053dd0f` |
| `field 23-3 PLAN_REVIEWED ref` | `cofbsatfrdysyphajsky` |
| `bound 23-3 PLAN_REVIEWED=ok sha256=<that> ref=<that>` | exit 0 |
| `bound 25-1 OPERATOR_APPLIED=yes sha256=<that> ref=<that>` | exit 0, for 25-1 attempt `20261023T110322Z.7f5e99d9d` |
| `has 25-1 ^s1_plan_sha256=<that>$` | exit 0: the applied plan is the reviewed one |

The reply passed `attempt.sh put` with no refusal. It is stored under these two lines:

```
OPERATOR_REPLY=received attempt=20261023T110322Z.7f5e99d9d plan=25 task=1 head=7f5e99d9db66a954bf2b42e8d6f73502923735d3
OPERATOR_APPLIED=yes attempt=20261023T110322Z.7f5e99d9d sha256=065a419e31ef13ae8f20b194178eb213fe053c643a7c9f5c74646a0872d43590 ref=cofbsatfrdysyphajsky head=7f5e99d9db66a954bf2b42e8d6f73502923735d3
```

**The variable file.** Since the review's head `88053dd0f`, one file under `infra/` and `scripts/`
has changed: `infra/envs/staging/supabase/terraform.tfvars`, in commit `b988931f3`. That commit
rewords its header comment and adds the three assignments the plan was made with, byte for byte. A
saved plan does not read the variable file again. The second plan read the committed file and found
no change.

## Step 0, the account (added by the orchestrator)

| Line | Value | Verdict |
| --- | --- | --- |
| `s0_account` | `471112560111` | seen: the state account |

## Steps 1 and 2: the checksum and the apply

| Line | Value | Verdict |
| --- | --- | --- |
| `s1_plan_sha256` | `065a419e31ef13ae8f20b194178eb213fe053c643a7c9f5c74646a0872d43590` | seen: equals the reviewed checksum |
| `s2_apply_exit` | `0` | seen |
| `s2_apply_line` | `Apply complete! Resources: 1 added, 0 changed, 0 destroyed.` | seen |
| `s2_plan_file_removed` | `yes` | seen |
| `answer_applied` | `yes` | seen |

`1 added` is the creation of `module.supabase.supabase_settings.this`, the plan's only resource
heading in 183-23. That creation is the provider's partial update of the keys the module sends. No
project was created, and nothing was destroyed.

## Step 3: the second plan

| Line | Value | Verdict |
| --- | --- | --- |
| `s3_second_plan_exit` | `0` | seen |
| `s3_plan_line` | `4:No changes. Your infrastructure matches the configuration.` | seen |

## Step 4: the read-back

Both reads answered: `s4_auth_http=200` and `s4_api_http=200`.

**How the comparison was made.** It follows the method of plan 183-24.
- **The intended values** come from `infra/modules/supabase/hosted-settings.json` and the module's
  locals:
  - the `api` group;
  - the `auth`, `auth_hook` and `auth_send_email_hook` groups. Both hooks are applied, because the
    staging root sets `enable_access_token_hook = true` and `enable_send_email_hook = true`;
  - `site_url` and `uri_allow_list`, built from the root's `public_origin`
    (`https://staging.openvaa.org`) and the two redirect paths;
  - the six rate limits at the module's defaults. `rate_limit_email_sent` is sent only with SMTP,
    and `smtp` is null.
- **The method.** A Node one-off compared each intended value, as JSON, with its served named line
  in the 25-1 attempt file.
- **The result.** 37 keys compared (34 auth and 3 API): 37 equal, none different, none missing.
  - The step 4 auth filter printed 34 lines, one per key that `managed_auth_keys` names.
  - It printed no managed key beyond them.

| Key | Intended | Served | |
| --- | --- | --- | --- |
| `api.db_extra_search_path` | `"public, extensions"` | `"public, extensions"` | equal |
| `api.db_schema` | `"public,graphql_public"` | `"public,graphql_public"` | equal |
| `api.max_rows` | `50000` | `50000` | equal |
| `auth.disable_signup` | `true` | `true` | equal |
| `auth.external_anonymous_users_enabled` | `false` | `false` | equal |
| `auth.external_apple_enabled` | `false` | `false` | equal |
| `auth.external_email_enabled` | `true` | `true` | equal |
| `auth.external_phone_enabled` | `false` | `false` | equal |
| `auth.external_web3_solana_enabled` | `false` | `false` | equal |
| `auth.hook_custom_access_token_enabled` | `true` | `true` | equal |
| `auth.hook_custom_access_token_uri` | `"pg-functions://postgres/public/custom_access_token_hook"` | `"pg-functions://postgres/public/custom_access_token_hook"` | equal |
| `auth.hook_send_email_enabled` | `true` | `true` | equal |
| `auth.hook_send_email_uri` | `"pg-functions://postgres/public/send_email_hook"` | `"pg-functions://postgres/public/send_email_hook"` | equal |
| `auth.jwt_exp` | `3600` | `3600` | equal |
| `auth.mailer_autoconfirm` | `false` | `false` | equal |
| `auth.mailer_otp_exp` | `3600` | `3600` | equal |
| `auth.mailer_otp_length` | `6` | `6` | equal |
| `auth.mailer_secure_email_change_enabled` | `true` | `true` | equal |
| `auth.mfa_phone_enroll_enabled` | `false` | `false` | equal |
| `auth.mfa_phone_verify_enabled` | `false` | `false` | equal |
| `auth.mfa_totp_enroll_enabled` | `false` | `false` | equal |
| `auth.mfa_totp_verify_enabled` | `false` | `false` | equal |
| `auth.password_min_length` | `8` | `8` | equal |
| `auth.password_required_characters` | `""` | `""` | equal |
| `auth.rate_limit_anonymous_users` | `30` | `30` | equal |
| `auth.rate_limit_otp` | `30` | `30` | equal |
| `auth.rate_limit_sms_sent` | `30` | `30` | equal |
| `auth.rate_limit_token_refresh` | `150` | `150` | equal |
| `auth.rate_limit_verify` | `30` | `30` | equal |
| `auth.rate_limit_web3` | `30` | `30` | equal |
| `auth.refresh_token_rotation_enabled` | `true` | `true` | equal |
| `auth.security_manual_linking_enabled` | `false` | `false` | equal |
| `auth.security_refresh_token_reuse_interval` | `10` | `10` | equal |
| `auth.security_update_password_require_reauthentication` | `false` | `false` | equal |
| `auth.site_url` | `"https://staging.openvaa.org"` | `"https://staging.openvaa.org"` | equal |
| `auth.smtp_max_frequency` | `60` | `60` | equal |
| `auth.uri_allow_list` | `"https://staging.openvaa.org/api/auth/callback,https://staging.openvaa.org/*/api/auth/callback"` | `"https://staging.openvaa.org/api/auth/callback,https://staging.openvaa.org/*/api/auth/callback"` | equal |

The plan's second verify command compares every key of the JSON's `api` and `auth` groups with its
served line, and it exits 0.

## Step 5: the refused destroy

| Line | Value | Verdict |
| --- | --- | --- |
| `s5_destroy_plan_exit` | `1` | seen: not 0 |
| `s5_refusal_lines` | `3` | seen: at least 1 |

The matching lines, verbatim. The `s5_refusal_line` capture was added by the orchestrator, as in plan
183-24, and is not a line of the plan.

```
s5_refusal_line=Error: Instance cannot be destroyed
s5_refusal_line=Resource module.supabase.supabase_project.this has lifecycle.prevent_destroy
s5_refusal_line=error and continue with the plan, either disable lifecycle.prevent_destroy or
```

The refusal names the project resource, `module.supabase.supabase_project.this`, and
`prevent_destroy`. A destroy plan applies nothing, and `terraform destroy` was not run.

## Step 6: the state list and the state object

| Line | Value | Verdict |
| --- | --- | --- |
| `s6_state_list_exit` | `0` | seen |
| `s6_state_address` | `module.supabase.supabase_project.this` | seen |
| `s6_state_address` | `module.supabase.supabase_settings.this` | seen |
| `s6_head_exit` | `0` | seen: the object `hand/staging/supabase/terraform.tfstate` exists in `openvaa-tfstate-471112560111` |
| `s6_state_sse` | `AES256` | seen |
| `s6_state_versioned` | `true` | seen: the object has a version id, which was not printed |

**What the state holds.** It holds the two addresses of this root and nothing else. The state key is
this root's own, `hand/staging/supabase/terraform.tfstate`. It is literal in the root's backend block,
and no other root names it.

## Step 7: removal

`s7_logs_removed=yes`. The plan file had been removed in step 2 (`s2_plan_file_removed=yes`).

## The hooks

Both hooks are applied. The read-back serves both:
- `hook_custom_access_token_enabled=true`, with its `pg-functions://` address;
- `hook_send_email_enabled=true`, with its `pg-functions://` address.

No migration has been pushed to the persistent project yet, so both point at functions that do not
exist there yet. Push the migrations before anyone signs in. That is phase 184's work. How the auth
service behaves while the functions are missing was not observed.

## Criterion 5, Supabase clauses

| Clause | Supporting line | Verdict |
| --- | --- | --- |
| The project is imported into a root with its own state file | 183-23: `s4_import_project_exit=0` and `Clause C5.1 import: seen`. Here: `s6_state_address=module.supabase.supabase_project.this`, `s6_head_exit=0`, `s6_state_sse=AES256` for `hand/staging/supabase/terraform.tfstate` | seen |
| The block carries `prevent_destroy` | `s5_refusal_line=Resource module.supabase.supabase_project.this has lifecycle.prevent_destroy` | seen |
| A destroy of that root is refused | `s5_destroy_plan_exit=1`, `s5_refusal_lines=3`, `s5_refusal_line=Error: Instance cannot be destroyed` | seen |
| The hosted API and auth settings are applied | `s2_apply_exit=0`, `s2_apply_line=Apply complete! Resources: 1 added, 0 changed, 0 destroyed.`, `s4_auth_http=200`, `s4_api_http=200`, 37 of 37 managed keys served as intended | seen |
| A second plan is empty | `s3_second_plan_exit=0`, `s3_plan_line=4:No changes. Your infrastructure matches the configuration.` | seen |

Clause C5.1 state: seen
Clause C5.2: seen
Clause C5.3: seen

**The hooks in criterion 5.** Both hook variables are `true` in the staging root, so both hooks are
applied, and no hook is left for a later phase to switch on.

**Clauses recorded later.** Plan 183-27 records the remaining clauses of criterion 5 on the final
tree:
- the configuration push is used nowhere;
- `yarn lint:check` fails on a disagreeing key;
- the validation job is seen in a run.

## What this observes, and what it does not

**Observed (2026-10-23):**
- the apply of the reviewed plan on the persistent project;
- the empty second plan;
- the read-back of every managed key;
- the refused destroy plan and its text;
- the state's two addresses and the encrypted, versioned state object.

**Not observed:**
- how the auth service behaves on a sign-in or a mail while the two hook functions are missing;
- the SMTP settings, which are written and not applied;
- whether two settings resources work side by side for one project.

## Provenance

- **The reply** was relayed by the orchestrator, with the shell's prompts and echo lines removed.
  It passed `attempt.sh put` with no refusal, together with five `note:` lines.
- **Orchestrator-added lines.** `s0_account` and `s5_refusal_line` were added by the orchestrator.
- **The account line.** `s0_account` was first run in the setup block, and its line was not pasted.
  After the checksum matched, the operator ran the `s0` echo again at the head of the apply block,
  account first and the apply only on a match. In the paste, `s0` came after the apply lines.
- **The first try of step 4 sent nothing.**
  - The sub-block that sets `U`, `F1` and `F2` had not been run. So curl rejected the URL, with
    `s4_api_http=000`, and jq gave a compile error. Nothing reached the API.
  - The operator then set the variables and confirmed their lengths: `U` 57, `F1` 184 and `F2` 93,
    as the orchestrator had computed. Then both reads ran again.
  - The `s4` lines above are from that second run.
- **Delivery.**
  - The commands went out in blocks.
  - The filters and the step 6 commands were built in variables or wrapped, and each was checked
    byte-identical to the plan. The step 6 jq filter was built as `G`.
  - `U` is `https://api.supabase.com/v1/projects/$REF`, so `"$U/config/auth"` and
    `"$U/postgrest"` are the plan's URLs.
- **The token** went to curl on standard input, as in the plan's commands. No header file was made,
  although the plan's execution rules mention one.
- **Not recorded:** the UTC times of the individual steps.
