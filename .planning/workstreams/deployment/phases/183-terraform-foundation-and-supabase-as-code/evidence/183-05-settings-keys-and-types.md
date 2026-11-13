# Settings keys and types of the Supabase module (183-05)

Taken on 2026-10-18 with Terraform v1.14.7 and jq from the workstation, no credentials, no provider,
no state. Commit at which this plan started: c51d4daf58d73a40d5f3514978a29bdba5146aef. The module
files checked are the ones committed with this evidence (`infra/modules/supabase/settings.tf`,
`variables.tf`, `hosted-settings.json`).

## `check-settings-types.sh`: two red controls, then green

Each red control ran on a copy of the three module files in a directory under `$TMPDIR`. The setup
(copy plus a scripted edit that asserted exactly one match of the line it rewrote) was its own
command, and its status was read before the script ran. The script's run was a separate command with
its output redirected to a file, and its exit status was read on the next line, not through a pipe.

### Red 1: the hook filter rewritten to the trap form

Setup: `auth_hook = { for k, v in local.hosted.auth_hook : k => v if var.enable_access_token_hook }`
replaced by `auth_hook = var.enable_access_token_hook ? local.hosted.auth_hook : {}` in
`$TMPDIR/sst-red1/settings.tf`. Setup status: 0.

Run: `bash infra/scripts/check-settings-types.sh "$TMPDIR/sst-red1"`. **Exit status: 1.**

```
FINDING [defaults] hook_custom_access_token_enabled holds a quoted boolean or number
FINDING [defaults] hook_custom_access_token_enabled is not a bare boolean
FINDING [defaults] hook_custom_access_token_enabled of the JSON's auth_hook group is encoded with another value
FINDING [smtp] hook_custom_access_token_enabled holds a quoted boolean or number
check-settings-types: 4 finding(s) in /var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/sst-red1
```

The conditional with an empty-object branch turned the hook switch into the string `"true"`. The
merged result stayed an object (the other `merge` arguments are objects), so no `tomap(` was printed;
the quoted-value check and the JSON-value check caught it.

### Red 2: the JSON's auth group dropped from the `merge`

Setup: the line `    local.hosted.auth,` removed from the `merge` in `$TMPDIR/sst-red2/settings.tf`; the
hook filter is the module's `for` form (one match of `for k, v in local.hosted.auth_hook`). Setup
status: 0.

Run: `bash infra/scripts/check-settings-types.sh "$TMPDIR/sst-red2"`. **Exit status: 1.**

```
FINDING [defaults] jwt_exp is not a bare number
FINDING [defaults] disable_signup of the JSON's auth group is missing from the encoded settings
FINDING [defaults] external_anonymous_users_enabled of the JSON's auth group is missing from the encoded settings
FINDING [defaults] external_apple_enabled of the JSON's auth group is missing from the encoded settings
FINDING [defaults] external_email_enabled of the JSON's auth group is missing from the encoded settings
FINDING [defaults] external_phone_enabled of the JSON's auth group is missing from the encoded settings
FINDING [defaults] external_web3_solana_enabled of the JSON's auth group is missing from the encoded settings
FINDING [defaults] jwt_exp of the JSON's auth group is missing from the encoded settings
FINDING [defaults] mailer_autoconfirm of the JSON's auth group is missing from the encoded settings
FINDING [defaults] mailer_otp_exp of the JSON's auth group is missing from the encoded settings
FINDING [defaults] mailer_otp_length of the JSON's auth group is missing from the encoded settings
FINDING [defaults] mailer_secure_email_change_enabled of the JSON's auth group is missing from the encoded settings
FINDING [defaults] mfa_phone_enroll_enabled of the JSON's auth group is missing from the encoded settings
FINDING [defaults] mfa_phone_verify_enabled of the JSON's auth group is missing from the encoded settings
FINDING [defaults] mfa_totp_enroll_enabled of the JSON's auth group is missing from the encoded settings
FINDING [defaults] mfa_totp_verify_enabled of the JSON's auth group is missing from the encoded settings
FINDING [defaults] password_min_length of the JSON's auth group is missing from the encoded settings
FINDING [defaults] password_required_characters of the JSON's auth group is missing from the encoded settings
FINDING [defaults] refresh_token_rotation_enabled of the JSON's auth group is missing from the encoded settings
FINDING [defaults] security_manual_linking_enabled of the JSON's auth group is missing from the encoded settings
FINDING [defaults] security_refresh_token_reuse_interval of the JSON's auth group is missing from the encoded settings
FINDING [defaults] security_update_password_require_reauthentication of the JSON's auth group is missing from the encoded settings
FINDING [defaults] smtp_max_frequency of the JSON's auth group is missing from the encoded settings
check-settings-types: 23 finding(s) in /var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/sst-red2
```

Every one of the 22 keys of the JSON's auth group is named as missing; the extra `jwt_exp` line comes
from the type expectation of the default case.

### Green: the module as committed

Run: `bash infra/scripts/check-settings-types.sh`. **Exit status: 0.**

```
check-settings-types: three cases hold in /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/infra/modules/supabase (types kept, JSON groups encoded)
```

Usage control: `bash infra/scripts/check-settings-types.sh --bogus` printed the usage and exited 2.

## Key names looked up in the provider's generated client

The lookup was made. `https://raw.githubusercontent.com/supabase/cli/pkg/v1.2.3/pkg/api/types.gen.go`
(the client the provider 1.11.0 compiles against) was downloaded with `curl -fsSL` into `$TMPDIR`:
410147 bytes, sha256 `8b03df5c6543f8cd7d060f6dc2104ecbd36990a87d9f9f07f3deab1d5ef47ee5`.

"In file" is a `json:"<key>"` or `json:"<key>,` tag anywhere in the file. "In body struct" is the
same tag inside the struct the provider decodes the group into: `V1UpdatePostgrestConfigBody` for the
api group, `UpdateAuthConfigBody` for every auth key. The Go type is the field's type in that struct.

| Key | Owner | In file | In body struct | Go type |
| --- | --- | --- | --- | --- |
| `db_extra_search_path` | JSON api | yes | yes | `*string` |
| `db_schema` | JSON api | yes | yes | `*string` |
| `max_rows` | JSON api | yes | yes | `*int` |
| `disable_signup` | JSON auth | yes | yes | `nullable.Nullable[bool]` |
| `external_anonymous_users_enabled` | JSON auth | yes | yes | `nullable.Nullable[bool]` |
| `external_apple_enabled` | JSON auth | yes | yes | `nullable.Nullable[bool]` |
| `external_email_enabled` | JSON auth | yes | yes | `nullable.Nullable[bool]` |
| `external_phone_enabled` | JSON auth | yes | yes | `nullable.Nullable[bool]` |
| `external_web3_solana_enabled` | JSON auth | yes | yes | `nullable.Nullable[bool]` |
| `jwt_exp` | JSON auth | yes | yes | `nullable.Nullable[int]` |
| `mailer_autoconfirm` | JSON auth | yes | yes | `nullable.Nullable[bool]` |
| `mailer_otp_exp` | JSON auth | yes | yes | `*int` |
| `mailer_otp_length` | JSON auth | yes | yes | `nullable.Nullable[int]` |
| `mailer_secure_email_change_enabled` | JSON auth | yes | yes | `nullable.Nullable[bool]` |
| `mfa_phone_enroll_enabled` | JSON auth | yes | yes | `nullable.Nullable[bool]` |
| `mfa_phone_verify_enabled` | JSON auth | yes | yes | `nullable.Nullable[bool]` |
| `mfa_totp_enroll_enabled` | JSON auth | yes | yes | `nullable.Nullable[bool]` |
| `mfa_totp_verify_enabled` | JSON auth | yes | yes | `nullable.Nullable[bool]` |
| `password_min_length` | JSON auth | yes | yes | `nullable.Nullable[int]` |
| `password_required_characters` | JSON auth | yes | yes | `nullable.Nullable[UpdateAuthConfigBodyPasswordRequiredCharacters]` |
| `refresh_token_rotation_enabled` | JSON auth | yes | yes | `nullable.Nullable[bool]` |
| `security_manual_linking_enabled` | JSON auth | yes | yes | `nullable.Nullable[bool]` |
| `security_refresh_token_reuse_interval` | JSON auth | yes | yes | `nullable.Nullable[int]` |
| `security_update_password_require_reauthentication` | JSON auth | yes | yes | `nullable.Nullable[bool]` |
| `smtp_max_frequency` | JSON auth | yes | yes | `nullable.Nullable[int]` |
| `hook_custom_access_token_enabled` | JSON auth_hook | yes | yes | `nullable.Nullable[bool]` |
| `hook_custom_access_token_uri` | JSON auth_hook | yes | yes | `nullable.Nullable[string]` |
| `site_url` | HCL | yes | yes | `nullable.Nullable[string]` |
| `uri_allow_list` | HCL | yes | yes | `nullable.Nullable[string]` |
| `rate_limit_otp` | HCL | yes | yes | `nullable.Nullable[int]` |
| `rate_limit_verify` | HCL | yes | yes | `nullable.Nullable[int]` |
| `rate_limit_token_refresh` | HCL | yes | yes | `nullable.Nullable[int]` |
| `rate_limit_anonymous_users` | HCL | yes | yes | `nullable.Nullable[int]` |
| `rate_limit_sms_sent` | HCL | yes | yes | `nullable.Nullable[int]` |
| `rate_limit_web3` | HCL | yes | yes | `nullable.Nullable[int]` |
| `rate_limit_email_sent` | HCL | yes | yes | `nullable.Nullable[int]` |
| `smtp_host` | HCL | yes | yes | `nullable.Nullable[string]` |
| `smtp_port` | HCL | yes | yes | `nullable.Nullable[string]` |
| `smtp_user` | HCL | yes | yes | `nullable.Nullable[string]` |
| `smtp_admin_email` | HCL | yes | yes | `nullable.Nullable[openapi_types.Email]` |
| `smtp_sender_name` | HCL | yes | yes | `nullable.Nullable[string]` |
| `smtp_pass` | HCL | yes | yes | `nullable.Nullable[string]` |

42 keys looked up (3 api, 22 auth, 2 hook keys from the JSON; 15 owned by the HCL); every one has its
tag in the struct the provider decodes it into, so none is dropped before the request for a
misspelling. No key needed a respelling.

Types agree with what the module sends: the booleans are `bool`, the numbers `int`, `smtp_port` a
`string`, `smtp_admin_email` an email string. `password_required_characters` is an enum whose values
include `""` (`UpdateAuthConfigBodyPasswordRequiredCharactersEmpty`), the value the JSON sends.

What the lookup cannot show, and the throwaway import has to: the exact strings the hosted API
returns for `db_schema` and `uri_allow_list`, and whether the hosted API accepts
`rate_limit_email_sent` before SMTP is set (the module sends it only with SMTP).
