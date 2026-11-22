# 183-21: The throwaway project's import, as the provider read it

**Managed keys the import did not return: three, all SETTLED (2026-10-22).**
`password_required_characters`, `hook_custom_access_token_uri` and `hook_send_email_uri` were not in
the imported settings. A read-only Management API read of the project's auth configuration (status
200) returned each of the three names with the value `null`. So the API knows each name, the value is
null on a new project, and the import left them out because the provider stores only keys whose
value is not null. This was observed on 2026-10-22; it is no longer an inference. No name was
respelled. These keys do not block the first plan of plan 183-22. That plan is expected to show a
change for each of them (see "What the module sends for the three keys").

Attempt: 21-1 20261022T090423Z.e3450fcff
Attempt: 21-2 20261022T160614Z.e3450fcff
Attempt: 21-3 20261022T160633Z.e3450fcff

Recorded: 2026-10-22T16:09Z (UTC). The operator ran the import on 2026-10-22, and the settlement read
later that day. Every value below comes from the operator's named lines in the attempt files named
above, which are under `tmp/183-evidence/` and ignored by Git. Neither the access token nor the
database password was pasted, and neither is in any file.

## The project and the import

| Item | Value |
| --- | --- |
| Organisation, as named | `OpenVAA` (`answer_org`) |
| Token holder, as named | `kaljarv` (`answer_token_holder`, a name, not an address) |
| Token kind | Unconfirmed. Not stated in this sitting; an earlier operator record says an organisation token with full access |
| Project ref (tracked on purpose) | `suxeqyhafjueinxnojge` (`answer_ref` and `s7_project_ref` agree) |
| Organisation slug from the dashboard | `gulgrbzofwnwepdnrgrl` (`answer_slug`) |
| Region | `eu-north-1` (`answer_region` and `s7_region` agree) |
| `eu-north-1` offered | `yes`, inferred from the choice of `eu-north-1`. The operator made no separate statement. The provider read this region on import |
| `s4_init_exit` | `0` |
| `s5_import_project_exit` | `0` |
| `s6_import_settings_exit` | `0` |
| `s9_logs_removed` | `yes` |

Both imports succeeded with the token given in the environment variable that the provider reads. The
provider therefore accepted that token (observed), whichever kind it is.

### The project's attributes as the provider read them (step 7)

| Attribute | Value read |
| --- | --- |
| `id` | `suxeqyhafjueinxnojge` |
| `organization_id` | `gulgrbzofwnwepdnrgrl` |
| `name` | `openvaa-scratch` |
| `region` | `eu-north-1` |
| password in state | `false` (`s7_password_in_state`) |

The organisation id the provider read **equals** the slug in the dashboard's address. The scratch
root's `terraform.tfvars` now holds `organization_id = "gulgrbzofwnwepdnrgrl"`,
`project_name = "openvaa-scratch"` and `region = "eu-north-1"`, which are the read values.

## The imported settings (step 8)

### `api`, as returned

| Key | Value returned (verbatim) |
| --- | --- |
| `db_extra_search_path` | `"public, extensions"` |
| `db_schema` | `"public,graphql_public"` |
| `max_rows` | `1000` |

`db_pool` was not returned.

### auth_keys: the auth setting names returned

139 names. The filter of step 8 dropped every name ending in a secret word before printing, so no such
name is listed here.

api_max_request_duration, custom_oauth_enabled, db_max_pool_size, db_max_pool_size_unit,
disable_signup, external_anonymous_users_enabled, external_apple_email_optional,
external_apple_enabled, external_azure_email_optional, external_azure_enabled,
external_bitbucket_email_optional, external_bitbucket_enabled, external_discord_email_optional,
external_discord_enabled, external_email_enabled, external_facebook_email_optional,
external_facebook_enabled, external_figma_email_optional, external_figma_enabled,
external_github_email_optional, external_github_enabled, external_gitlab_email_optional,
external_gitlab_enabled, external_google_email_optional, external_google_enabled,
external_kakao_email_optional, external_kakao_enabled, external_keycloak_email_optional,
external_keycloak_enabled, external_linkedin_oidc_email_optional, external_linkedin_oidc_enabled,
external_notion_email_optional, external_notion_enabled, external_phone_enabled,
external_slack_email_optional, external_slack_enabled, external_slack_oidc_email_optional,
external_slack_oidc_enabled, external_spotify_email_optional, external_spotify_enabled,
external_twitch_email_optional, external_twitch_enabled, external_twitter_email_optional,
external_twitter_enabled, external_web3_ethereum_enabled, external_web3_solana_enabled,
external_workos_enabled, external_x_email_optional, external_x_enabled, external_zoom_email_optional,
external_zoom_enabled, hook_after_user_created_enabled, hook_before_user_created_enabled,
hook_custom_access_token_enabled, hook_mfa_verification_attempt_enabled,
hook_password_verification_attempt_enabled, hook_send_email_enabled, hook_send_sms_enabled, jwt_exp,
mailer_allow_unverified_email_sign_ins, mailer_autoconfirm, mailer_notifications_email_changed_enabled,
mailer_notifications_identity_linked_enabled, mailer_notifications_identity_unlinked_enabled,
mailer_notifications_mfa_factor_enrolled_enabled, mailer_notifications_mfa_factor_unenrolled_enabled,
mailer_notifications_password_changed_enabled, mailer_notifications_phone_changed_enabled,
mailer_otp_exp, mailer_otp_length, mailer_secure_email_change_enabled, mailer_subjects_confirmation,
mailer_subjects_email_change, mailer_subjects_email_changed_notification,
mailer_subjects_identity_linked_notification, mailer_subjects_identity_unlinked_notification,
mailer_subjects_invite, mailer_subjects_magic_link, mailer_subjects_mfa_factor_enrolled_notification,
mailer_subjects_mfa_factor_unenrolled_notification, mailer_subjects_password_changed_notification,
mailer_subjects_phone_changed_notification, mailer_subjects_reauthentication, mailer_subjects_recovery,
mailer_templates_confirmation_content, mailer_templates_email_change_content,
mailer_templates_email_changed_notification_content,
mailer_templates_identity_linked_notification_content,
mailer_templates_identity_unlinked_notification_content, mailer_templates_invite_content,
mailer_templates_magic_link_content, mailer_templates_mfa_factor_enrolled_notification_content,
mailer_templates_mfa_factor_unenrolled_notification_content,
mailer_templates_password_changed_notification_content,
mailer_templates_phone_changed_notification_content, mailer_templates_reauthentication_content,
mailer_templates_recovery_content, mfa_max_enrolled_factors, mfa_phone_enroll_enabled,
mfa_phone_max_frequency, mfa_phone_otp_length, mfa_phone_template, mfa_phone_verify_enabled,
mfa_totp_enroll_enabled, mfa_totp_verify_enabled, mfa_web_authn_enroll_enabled,
mfa_web_authn_verify_enabled, oauth_server_allow_dynamic_registration, oauth_server_enabled,
passkey_enabled, password_hibp_enabled, password_min_length, rate_limit_anonymous_users,
rate_limit_email_sent, rate_limit_otp, rate_limit_sms_sent, rate_limit_token_refresh,
rate_limit_verify, rate_limit_web3, refresh_token_rotation_enabled, saml_enabled,
security_captcha_enabled, security_captcha_provider, security_manual_linking_enabled,
security_refresh_token_reuse_interval, security_sb_forwarded_for_enabled,
security_update_password_require_reauthentication, sessions_inactivity_timeout,
sessions_single_per_user, sessions_timebox, site_url, sms_autoconfirm, sms_max_frequency, sms_otp_exp,
sms_otp_length, sms_provider, sms_template, smtp_max_frequency, uri_allow_list

### Selected auth values: the platform's defaults for a new project on 2026-10-22

| Key | Default |
| --- | --- |
| disable_signup | false |
| external_anonymous_users_enabled | false |
| external_apple_enabled | false |
| external_azure_enabled | false |
| external_bitbucket_enabled | false |
| external_discord_enabled | false |
| external_email_enabled | true |
| external_facebook_enabled | false |
| external_figma_enabled | false |
| external_github_enabled | false |
| external_gitlab_enabled | false |
| external_google_enabled | false |
| external_kakao_enabled | false |
| external_keycloak_enabled | false |
| external_linkedin_oidc_enabled | false |
| external_notion_enabled | false |
| external_phone_enabled | false |
| external_slack_enabled | false |
| external_slack_oidc_enabled | false |
| external_spotify_enabled | false |
| external_twitch_enabled | false |
| external_twitter_enabled | false |
| external_web3_ethereum_enabled | false |
| external_web3_solana_enabled | false |
| external_workos_enabled | false |
| external_x_enabled | false |
| external_zoom_enabled | false |
| hook_custom_access_token_enabled | false |
| jwt_exp | 3600 |
| mailer_autoconfirm | false |
| mailer_otp_exp | 3600 |
| mailer_otp_length | 8 |
| mailer_secure_email_change_enabled | true |
| mfa_max_enrolled_factors | 10 |
| mfa_phone_enroll_enabled | false |
| mfa_phone_max_frequency | 5 |
| mfa_phone_otp_length | 6 |
| mfa_phone_template | "Your code is {{ .Code }}" |
| mfa_phone_verify_enabled | false |
| mfa_totp_enroll_enabled | true |
| mfa_totp_verify_enabled | true |
| mfa_web_authn_enroll_enabled | false |
| mfa_web_authn_verify_enabled | false |
| oauth_server_allow_dynamic_registration | false |
| oauth_server_enabled | false |
| password_min_length | 6 |
| rate_limit_anonymous_users | 30 |
| rate_limit_email_sent | 2 |
| rate_limit_otp | 30 |
| rate_limit_sms_sent | 30 |
| rate_limit_token_refresh | 150 |
| rate_limit_verify | 30 |
| rate_limit_web3 | 30 |
| refresh_token_rotation_enabled | true |
| security_manual_linking_enabled | false |
| security_refresh_token_reuse_interval | 10 |
| security_sb_forwarded_for_enabled | false |
| security_update_password_require_reauthentication | false |
| site_url | "http://localhost:3000" |
| smtp_max_frequency | 60 |
| uri_allow_list | "" |

`hook_send_email_enabled` is not on the filter's allow-list, so only its name was printed.

## Per-key check: does the hosted API return each name the module sends?

The keys are the JSON's `api`, `auth`, `auth_hook` and `auth_send_email_hook` groups, plus `site_url`,
`uri_allow_list` and the seven rate limits the module writes. The plan names three groups; the
`auth_send_email_hook` group was checked as well because the module sends it and step 8 printed its
names. The two OAuth-server keys this plan adds are included.

| Group | Key | Returned on import | Note |
| --- | --- | --- | --- |
| api | db_schema | yes | |
| api | db_extra_search_path | yes | |
| api | max_rows | yes | |
| auth | disable_signup | yes | |
| auth | mailer_autoconfirm | yes | |
| auth | external_email_enabled | yes | |
| auth | external_phone_enabled | yes | |
| auth | external_anonymous_users_enabled | yes | |
| auth | security_manual_linking_enabled | yes | |
| auth | jwt_exp | yes | |
| auth | refresh_token_rotation_enabled | yes | |
| auth | security_refresh_token_reuse_interval | yes | |
| auth | password_min_length | yes | |
| auth | password_required_characters | **no** | SETTLED: the name is known to the API, value null (attempt 21-3) |
| auth | mailer_secure_email_change_enabled | yes | |
| auth | security_update_password_require_reauthentication | yes | |
| auth | mailer_otp_length | yes | |
| auth | mailer_otp_exp | yes | |
| auth | smtp_max_frequency | yes | |
| auth | mfa_totp_enroll_enabled | yes | |
| auth | mfa_totp_verify_enabled | yes | |
| auth | mfa_phone_enroll_enabled | yes | |
| auth | mfa_phone_verify_enabled | yes | |
| auth | external_apple_enabled | yes | |
| auth | external_web3_solana_enabled | yes | |
| auth | oauth_server_enabled | yes | added to the JSON by this plan |
| auth | oauth_server_allow_dynamic_registration | yes | added to the JSON by this plan |
| auth_hook | hook_custom_access_token_enabled | yes | |
| auth_hook | hook_custom_access_token_uri | **no** | SETTLED: the name is known to the API, value null (attempt 21-3) |
| auth_send_email_hook | hook_send_email_enabled | yes | name only |
| auth_send_email_hook | hook_send_email_uri | **no** | SETTLED: the name is known to the API, value null (attempt 21-3) |
| HCL | site_url | yes | |
| HCL | uri_allow_list | yes | |
| HCL | rate_limit_email_sent | yes | sent only with SMTP |
| HCL | rate_limit_sms_sent | yes | |
| HCL | rate_limit_anonymous_users | yes | |
| HCL | rate_limit_token_refresh | yes | |
| HCL | rate_limit_otp | yes | |
| HCL | rate_limit_verify | yes | |
| HCL | rate_limit_web3 | yes | |

### OAuth-server keys

- `oauth_server_enabled`: returned, `false`.
- `oauth_server_allow_dynamic_registration`: returned, `false`.
- `oauth_server_authorization_path`: **not** returned.

Both of the first two were returned. As the plan prescribes, both went into the JSON's `auth` group
with the local value `false`, and into the fixture. In the parity guard, `auth.oauth_server/enabled`
and `auth.oauth_server/allow_dynamic_registration` moved from "not compared" to "must agree", and one
embedded case was added that switches both on and expects both findings. The guard's known list
already held both hosted names, so nothing was added to it. `auth.oauth_server/authorization_url_path`
stays "not compared". The apply of plan 183-24 shows whether the hosted API accepts the two keys
when they are sent.

## String forms

- `db_schema` was returned as `"public,graphql_public"`, with no space after the comma. The JSON
  already had that form, so it is unchanged.
- `db_extra_search_path` was returned as `"public, extensions"`, with a space after the comma. The
  JSON had `"public,extensions"`. The JSON's string was changed to `"public, extensions"`. The set and
  order are this project's own (`config.toml`: `["public", "extensions"]`), and they happen to equal
  the platform default here. The fixture got the same change.
- `uri_allow_list` was returned as `""`. Its form for a non-empty value was not seen, so the module's
  `join(",", ...)` is unchanged.
- The two returned forms differ from each other. This suggests the API stores what was set rather
  than normalising it, but that was not observed. Whether a second plan is empty with these strings
  is shown by Step 6 of the rehearsal.

The parity guard splits a hosted list at commas and trims each part, so the space changes nothing in
the comparison with `config.toml`. The guard stays green.

## What the module sends for the three keys (for plan 183-22)

| Key | Imported (null on a new project) | The module sends | Expected in 183-22's first plan |
| --- | --- | --- | --- |
| `password_required_characters` | absent from state | `""` (JSON `auth` group, always sent) | a change, null to `""` |
| `hook_custom_access_token_uri` | absent from state | `"pg-functions://postgres/public/custom_access_token_hook"`, sent while `enable_access_token_hook` is true, which it is in the scratch root | a change, null to the function address |
| `hook_send_email_uri` | absent from state | `"pg-functions://postgres/public/send_email_hook"`, sent while `enable_send_email_hook` is true, which it is in the scratch root | a change, null to the function address |

Open, and not observed: whether the API returns `""` for `password_required_characters` after it has
been sent, or null again. If it returns null, the plan would never empty (the string-form trap). Step 6
of the rehearsal (the second plan) shows which.

## The settlement read (attempt 21-3)

The operator ran it on 2026-10-22, after Task 2 had started. It was a GET of the project's auth
configuration from the Management API, and nothing was planned or applied. The orchestrator wrapped
the executor's proposed commands for the operator. The address was built in a shell variable, the jq
filter was kept in a variable, the token reached `curl` on its standard input through `printf`, and
the token was unset afterwards.

| Line | Value |
| --- | --- |
| `s1_auth_http` | `200` |
| `s2_has.password_required_characters` | `true` |
| `s2_null.password_required_characters` | `true` |
| `s2_has.hook_custom_access_token_uri` | `true` |
| `s2_null.hook_custom_access_token_uri` | `true` |
| `s2_has.hook_send_email_uri` | `true` |
| `s2_null.hook_send_email_uri` | `true` |
| `s3_logs_removed` | `yes` |

The command was handed out before attempt 21-3 existed, so the operator's reply carried no
`answer_attempt` line. The orchestrator relayed the eight named lines. The executor created attempt
21-3 on receipt and wrote its `answer_attempt` line itself, and the stored reply says so in a `note:`
line.

## Provenance and deviations

- **Short-form answers.** The operator answered steps 1 and 2 as "1. OpenVAA / kaljarv" and
  "2. suxeqyhafjueinxnojge / gulgrbzofwnwepdnrgrl / eu-north-1". The orchestrator mapped these to the
  `answer_` lines in the order asked and showed the mapping back. The operator raised no correction
  and went on.
- **The two secrets** of step 3 were entered with the runbook's no-echo `read -rs` lines.
- **Steps 7 and 8 were wrapped for display only.** The plan's jq filters were split across shell
  variables to wrap at about 60 characters: F7 by string appends, F8 by a quoted heredoc that joins the
  two regular expressions with jq string concatenation. The orchestrator checked on synthetic
  `terraform show` documents that both split filters print output byte-identical to the plan's
  one-line filters (`diff` empty).
- **The local state is kept.** The scratch root's `terraform.tfstate` stays for plan 183-22. Git
  ignores it. The operator was told that it holds the project's auth settings in clear text and that
  it is deleted with the project when the rehearsal is over.
- **The screen.** The reply passed `attempt.sh put` with no refusal. No line named a setting ending
  in a secret word.
