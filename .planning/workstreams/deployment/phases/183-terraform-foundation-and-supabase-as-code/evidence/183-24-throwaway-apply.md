# 183-24: The apply of the reviewed plan on the throwaway project

**Rehearsal passed (second attempt, 2026-10-23).**

- **The plan file.** The operator applied the plan file whose SHA-256 the current 183-22 review
  names, `b194262f78c57d4a342c2c07a7716aec964b049c0ab6a2b53ada76bac3fe032e`. The checksum printed
  before the apply was that one.
- **The apply and the second plan.** The apply exited 0, and the second plan exited 0 with no
  changes.
- **The read-back.** Every managed key the project serves equals its intended value: 37 of 37, none
  missing and none different.
- **The destroy plan.** It exited 1 and named the project resource as protected by
  `prevent_destroy`.
- **The red control.** A plan with one variable changed exited 2.
- **The hooks.** The hosted API accepted both hooks before their functions exist.
- **The OAuth-server keys.** They are no longer sent, by commit `55802a1bc`, so they were not tried
  in this attempt.

The first attempt, on 2026-10-22, stopped on a 400 from the hosted API. Its record is kept below,
under "First attempt (stopped)".

Attempt: 24-1 20261023T060657Z.8f89f0e63
Attempt: 24-2 20261023T063404Z.8f89f0e63

## Second attempt (2026-10-23)

Recorded: 2026-10-23T06:35Z (UTC).

- **When and where.** The operator ran the seven steps on 2026-10-23, in
  `infra/envs/scratch/supabase`, against the throwaway project `suxeqyhafjueinxnojge`. The UTC
  times of the individual steps were not recorded.
- **Source of the values.** Every value below comes from the operator's named lines. They are
  stored in the attempt files named above, under `tmp/183-evidence/`, which Git ignores.
- **Secrets.** Neither the access token nor the database password was pasted, and neither is in
  any file.

### The checks before this record

| Check | Result |
| --- | --- |
| `field 22-2 PLAN_REVIEWED sha256` | `b194262f78c57d4a342c2c07a7716aec964b049c0ab6a2b53ada76bac3fe032e`, 64 digits, for 22-2 attempt `20261023T060339Z.dac5f0465` |
| `bound 22-2 PLAN_REVIEWED=ok sha256=<that>` | exit 0 |
| `bound 24-1 OPERATOR_APPLIED=yes sha256=<that>` | exit 0, for 24-1 attempt `20261023T060657Z.8f89f0e63` |
| `has 24-1 ^s1_plan_sha256=<that>$` | exit 0: the applied plan is the reviewed one |
| First word after `OPERATOR_APPLIED=` | `yes` |

The reply is stored under these two lines:

```
OPERATOR_REPLY=received attempt=20261023T060657Z.8f89f0e63 plan=24 task=1 head=8f89f0e63704ff70d691119bfd1a4ff7c94642f6
OPERATOR_APPLIED=yes attempt=20261023T060657Z.8f89f0e63 sha256=b194262f78c57d4a342c2c07a7716aec964b049c0ab6a2b53ada76bac3fe032e head=8f89f0e63704ff70d691119bfd1a4ff7c94642f6
```

### Step 1 and 2: the checksum and the apply

| Line | Value | Verdict |
| --- | --- | --- |
| `s1_plan_sha256` | `b194262f78c57d4a342c2c07a7716aec964b049c0ab6a2b53ada76bac3fe032e` | seen: equals the reviewed checksum |
| `s2_apply_exit` | `0` | seen |
| `s2_apply_line` | `Apply complete! Resources: 0 added, 1 changed, 0 destroyed.` | seen |
| `s2_plan_file_removed` | `yes` | seen |
| `answer_applied` | `yes` | seen, as relayed (see Provenance) |

### Step 3: the second plan

| Line | Value | Verdict |
| --- | --- | --- |
| `s3_second_plan_exit` | `0` | seen |
| `s3_plan_line` | `4:No changes. Your infrastructure matches the configuration.` | seen |

The second plan is empty with the two schema lists, the redirect list and `password_required_characters = ""` all as sent. So no string the API rewrote keeps the plan from emptying.

### Step 4: the read-back

Both reads answered: `s4_auth_http=200` and `s4_api_http=200`. **Verdict: seen.**

How the comparison was made:
- **The intended values.** They are built from `infra/modules/supabase/hosted-settings.json` and the
  module's locals:
  - the `api` group;
  - the `auth`, `auth_hook` and `auth_send_email_hook` groups (both hooks were applied);
  - `site_url` and `uri_allow_list`, from the scratch root's `public_origin`
    (`https://staging.openvaa.org`) and the two redirect paths;
  - the six rate limits at the module's defaults. `rate_limit_email_sent` is sent only with SMTP,
    which is null.
- **The method.** A Node one-off compared each intended value, as JSON, with the served line, over
  two temporary files.
- **The result.** 37 compared (34 auth, 3 API), 0 different, 0 missing. The read-back printed no
  served managed key that the module does not send.

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

Settled here:
- **`password_required_characters`** is served as `""`, an empty string, not as null. On import the
  API had returned it as null.
- **The redirect list** comes back exactly as sent: two addresses joined by a comma, with no space,
  in the order sent.
- **The two MFA TOTP switches** (`false`) and **`mailer_otp_length`** (`6`) equal the module's
  values.

The plan's second verify command, which compares every key of the JSON's `api` and `auth` groups
with its served line, exits 0.

### Step 5: the refused destroy

| Line | Value | Verdict |
| --- | --- | --- |
| `s5_destroy_plan_exit` | `1` | seen: not 0 |
| `s5_refusal_lines` | `3` | seen: at least 1 |

The matching lines, verbatim. The `s5_refusal_line` capture was added by the orchestrator and is not
a line of the plan.

```
s5_refusal_line=Error: Instance cannot be destroyed
s5_refusal_line=Resource module.supabase.supabase_project.this has lifecycle.prevent_destroy
s5_refusal_line=error and continue with the plan, either disable lifecycle.prevent_destroy or
```

The refusal names the project resource, `module.supabase.supabase_project.this`, and
`prevent_destroy`.

### Step 6: the red control

`s6_red_plan_exit=2`: a plan with `-var enable_access_token_hook=false` reports a change. So the
empty second plan of Step 3 is a plan that could have said otherwise. **Verdict: seen.**

### Step 7: removal

`s7_logs_removed=yes`. The plan file had been removed in step 2 (`s2_plan_file_removed=yes`).

### The hooks

**Seen (2026-10-23).** The hosted API accepted both hooks on a project that has no
`public.custom_access_token_hook` and no `public.send_email_hook` function (no migration has been
applied to it). The apply did not fail, and the read-back serves:
- `hook_custom_access_token_enabled=true`, with its `pg-functions://` address;
- `hook_send_email_enabled=true`, with its `pg-functions://` address.

So the persistent root applies with both hook switches on, and no `hook off until` assignment is
needed in either variable file.

**Not observed:** how the auth service behaves on this project when a token is issued or a mail is
sent while the functions are missing. No sign-in was made.

### The OAuth-server keys

Commit `55802a1bc` removed them from the module after the first attempt, so this attempt neither
sent nor read them.

### Provenance

- **The reply was relayed by the orchestrator,** with the shell's prompt and echo lines removed.
- **The operator typed `answer_applied=ye`.** The orchestrator read that as a typo for `yes` and
  relayed `answer_applied=yes`. `s2_apply_exit=0` and the `Apply complete!` line agree with that
  reading.
- **The commands were handed out in five blocks:** setup with steps 1 and 2; step 3; step 4; steps
  5 and 6; step 7.
  - The `cd` of the sitting used the absolute path of the repository.
  - These were built in shell variables, each checked byte-identical to the plan: the long filters,
    the two addresses (`U=…/projects/$REF`), the header `printf` and the step 5 ERE.
  - The step 4 auth output had 34 lines.
- **Not observed separately:** whether `max_rows` reached 50000 in the failed apply of 2026-10-22 or
  in this one. It is served as 50000 now.
- **Changes made by this task:**
  - The runbook's observations (commit `a9418645d`).
  - Nothing in `hosted-settings.json`, the guard, the fixture or the two variable files.
- **The plan's verify commands all exit 0 on this tree:** 1 and 2 on the attempt files; 3 on the
  guard, its self-test, the types check, the guard's spec and Prettier; 4 on fmt, validate and this
  file's `Attempt: 24-2` line.

## First attempt (stopped)

Kept as it was recorded on 2026-10-23T05:35Z. Its 22-2 review is no longer the current one. The items
it lists as open were settled by the second attempt above.

**Stopped: the apply failed.** The hosted API refused the auth update with status 400. Plans 183-22
and 183-24 run again from their first task, with a new plan, a new checksum and a new review.

- The applied file was the reviewed one: the checksum the operator printed before applying is
  `35d762b21b217cc2cd232fcdc347e8da13604ed69ec2cb60d4db0da92a1289c8`, the checksum that plan
  183-22's `PLAN_REVIEWED=ok` line names.
- The apply failed and the plan file was removed. Steps 3 to 6 were not run, so there was no second
  plan, read-back, destroy plan or red control.
- The correction is commit `55802a1bc3380915b55357c7afebc742c21e6171`. The module no longer sends
  `oauth_server_enabled` and `oauth_server_allow_dynamic_registration`.

Earlier attempt (stopped): 24-1 20261022T170532Z.258e9fc5f
Earlier attempt (stopped): 24-2 20261023T053522Z.55802a1bc

Recorded: 2026-10-23T05:35Z (UTC).

- **The apply.** The checkpoint was raised at 2026-10-22T17:05Z. The operator applied on 2026-10-22
  in `infra/envs/scratch/supabase`, against the throwaway project `suxeqyhafjueinxnojge`. The UTC
  time of the apply was not recorded.
- **Where the values come from.** Every value below is from the operator's named lines, which are
  stored in the attempt files named above. Those files are under `tmp/183-evidence/`, which Git
  ignores.
- **Secrets.** Neither the access token nor the database password was pasted, and neither is in any
  file.

### The checks before this record

| Check | Result |
| --- | --- |
| `field 22-2 PLAN_REVIEWED sha256` | `35d762b21b217cc2cd232fcdc347e8da13604ed69ec2cb60d4db0da92a1289c8`, 64 digits |
| `bound 22-2 PLAN_REVIEWED=ok sha256=<that>` | exit 0 |
| `bound 24-1 OPERATOR_APPLIED sha256=<that>` | exit 0, for attempt `20261022T170532Z.258e9fc5f` |
| First word after `OPERATOR_APPLIED=` | `error` |

### What the operator pasted

| Line | Value | Verdict |
| --- | --- | --- |
| `s1_plan_sha256` | `35d762b21b217cc2cd232fcdc347e8da13604ed69ec2cb60d4db0da92a1289c8` | seen: equals the reviewed checksum |
| `s2_apply_exit` | `1` | seen: the apply failed |
| `s2_error` | `Error: Client Error` | seen |
| `s2_plan_file_removed` | `yes` | seen |
| `answer_applied` | `error` | seen |
| `s7_logs_removed` | `yes` | seen |

`s2_apply_line` was not printed: the log held no `Apply complete!` line.

#### Two diagnostics the orchestrator added

These are not steps of the plan. The orchestrator asked for them while `$L` still held the apply
log.

`s2_error_detail` takes the lines that follow the first `Error: ` line. In it, address shapes and
runs of 24 or more `[[:alnum:]_-]` characters are redacted to `<long>`. Its lines:

```
s2_error_detail=  with module.supabase.supabase_settings.this,
s2_error_detail=  on ../../../modules/supabase/main.tf line 39, in resource "supabase_settings" "this":
s2_error_detail=Unable to update auth settings, got status 400: {"message":"Both
s2_error_detail=OAUTH_SERVER_ENABLED and <long> must be provided
s2_error_detail=together when updating OAuth configuration"}
```

`s2_oauth_name` takes the `OAUTH_SERVER_` names in the same log:

```
s2_oauth_name=OAUTH_SERVER_AUTHORIZATION_PATH
s2_oauth_name=OAUTH_SERVER_ENABLED
```

So the API's message read: "Both OAUTH_SERVER_ENABLED and OAUTH_SERVER_AUTHORIZATION_PATH must be
provided together when updating OAuth configuration". The operator chose the fix with the line
`fix=A`. It is stored as `answer_fix=A`, because the screen accepts only named and answer lines.

### The cause

**Observed (2026-10-22).** The hosted API refused the auth update of the settings resource with
status 400.

**Read from the source, not observed.**

What the request carried. I read three sources: the provider at v1.11.0 (`settings_resource.go`),
the API types it compiles against (`supabase/cli` `pkg/v1.2.3`, `pkg/api/types.gen.go`), and
`oapi-codegen/nullable`. From them:
- The provider's update sends the whole planned `auth` JSON whenever it differs from state.
- Both OAuth-server switches are typed `nullable.Nullable[bool]` with `omitempty`, and a JSON
  `false` is serialised. So the request carried `oauth_server_enabled: false` and
  `oauth_server_allow_dynamic_registration: false`.
- The module sends no `oauth_server_authorization_path`, so the request did not carry it.

The CLI sends none of the three keys. Its source says the feature "is behind a feature flag in the
remote API".

**Not observed.**
- **The API settings.** The provider updates them before the auth settings, so the change of
  `max_rows` may have reached the project before the auth update failed. On an error, state is not
  saved. If the change did land, the next plan reads it on refresh, and only the auth update remains.
- **The hooks.** Whether the hosted API accepts the two hooks before their functions exist did not
  show: the API stopped at the OAuth-server check. The next apply shows it.

### The correction (commit `55802a1bc`)

The operator approved this as fix A. It follows Task 2's rule for a key the API rejected, and its
bullet on the OAuth-server keys.

- **`hosted-settings.json` and its fixture:** `oauth_server_enabled` and
  `oauth_server_allow_dynamic_registration` are removed.
- **The parity guard:**
  - The two local keys (`[auth.oauth_server] enabled` and `allow_dynamic_registration`) are back in
    "not compared". The reason given is that the hosted API refused an auth update that held them
    without `authorization_url_path` on 2026-10-22.
  - Their embedded case is removed.
  - `authorization_url_path` stays not compared.
  - The census reads: must agree 24, hosted may be stricter 5, differs by design 2, not compared 35.
  - The self-test passes with 66 cases.
- **The runbook:** the row on the OAuth-server keys moves from "Not yet observed" to "Observations",
  with the API's message.

The checks on the corrected tree all exit 0:
- the parity guard and its self-test;
- `check-settings-types.sh`;
- the guard's spec (9 of 9);
- Prettier;
- `terraform fmt -check`;
- `validate` of the staging root.

### What remains open

- **The rehearsal.** Every item it was to show is still to be seen, on the next plan and apply:
  - the second plan with status 0;
  - the read-back;
  - the refused destroy plan and its text;
  - the red control;
  - the hooks' outcome.
- **Not compared now.** The module no longer sends the OAuth-server switches, so no plan shows a
  change to them. The hosted value stays at the platform default, `false`, as the import showed.
  Reading it is passed to phase 184's conformance probe (see `deferred-items.md`).
