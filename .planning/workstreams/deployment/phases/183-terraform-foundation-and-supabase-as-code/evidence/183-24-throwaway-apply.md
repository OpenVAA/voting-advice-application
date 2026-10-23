# 183-24: The apply of the reviewed plan on the throwaway project

**Stopped: the apply failed.** The hosted API refused the auth update with status 400. Plans 183-22
and 183-24 run again from their first task, with a new plan, a new checksum and a new review.

- The applied file was the reviewed one: the checksum the operator printed before applying is
  `35d762b21b217cc2cd232fcdc347e8da13604ed69ec2cb60d4db0da92a1289c8`, the checksum that plan
  183-22's `PLAN_REVIEWED=ok` line names.
- The apply failed and the plan file was removed. Steps 3 to 6 were not run, so there was no second
  plan, read-back, destroy plan or red control.
- The correction is commit `55802a1bc3380915b55357c7afebc742c21e6171`. The module no longer sends
  `oauth_server_enabled` and `oauth_server_allow_dynamic_registration`.

Attempt: 24-1 20261022T170532Z.258e9fc5f
Attempt: 24-2 20261023T053522Z.55802a1bc

Recorded: 2026-10-23T05:35Z (UTC).

- **The apply.** The checkpoint was raised at 2026-10-22T17:05Z. The operator applied on 2026-10-22
  in `infra/envs/scratch/supabase`, against the throwaway project `suxeqyhafjueinxnojge`. The UTC
  time of the apply was not recorded.
- **Where the values come from.** Every value below is from the operator's named lines, which are
  stored in the attempt files named above. Those files are under `tmp/183-evidence/`, which Git
  ignores.
- **Secrets.** Neither the access token nor the database password was pasted, and neither is in any
  file.

## The checks before this record

| Check | Result |
| --- | --- |
| `field 22-2 PLAN_REVIEWED sha256` | `35d762b21b217cc2cd232fcdc347e8da13604ed69ec2cb60d4db0da92a1289c8`, 64 digits |
| `bound 22-2 PLAN_REVIEWED=ok sha256=<that>` | exit 0 |
| `bound 24-1 OPERATOR_APPLIED sha256=<that>` | exit 0, for attempt `20261022T170532Z.258e9fc5f` |
| First word after `OPERATOR_APPLIED=` | `error` |

## What the operator pasted

| Line | Value | Verdict |
| --- | --- | --- |
| `s1_plan_sha256` | `35d762b21b217cc2cd232fcdc347e8da13604ed69ec2cb60d4db0da92a1289c8` | seen: equals the reviewed checksum |
| `s2_apply_exit` | `1` | seen: the apply failed |
| `s2_error` | `Error: Client Error` | seen |
| `s2_plan_file_removed` | `yes` | seen |
| `answer_applied` | `error` | seen |
| `s7_logs_removed` | `yes` | seen |

`s2_apply_line` was not printed: the log held no `Apply complete!` line.

### Two diagnostics the orchestrator added

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

## The cause

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

## The correction (commit `55802a1bc`)

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

## What remains open

- **The rehearsal.** Every item it was to show is still to be seen, on the next plan and apply:
  - the second plan with status 0;
  - the read-back;
  - the refused destroy plan and its text;
  - the red control;
  - the hooks' outcome.
- **Not compared now.** The module no longer sends the OAuth-server switches, so no plan shows a
  change to them. The hosted value stays at the platform default, `false`, as the import showed.
  Reading it is passed to phase 184's conformance probe (see `deferred-items.md`).
