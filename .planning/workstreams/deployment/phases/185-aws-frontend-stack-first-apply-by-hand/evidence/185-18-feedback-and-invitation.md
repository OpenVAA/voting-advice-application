# 185-18: the feedback limit by client, and one invitation mail (runbook Steps 13 and 14)

Recorded 2026-11-13 (UTC). Run in the operator's administrator session (`AWS_PROFILE=openvaa-admin`,
the key variables unset, region `eu-north-1`); the account check read `471112560111` before every
AWS call (`account_read_exit=0`, `account_match_exit=0`). Page bodies, answers and error files stayed
in a `umask 077` directory outside the repository (`$L`), which was removed at the end
(`s13_logs_removed=yes`). The anon key was read from the served page into a variable, handed to
`curl` as a configuration on a file descriptor, never printed, and unset. No network address, mail
address, password, token or link is written here.

## Task 1: one insert as the browser makes it, and the invitation's prerequisites (15:59Z)

```
AGENT_INSERT_HTTP=201
AGENT_INSERT_UTC=2026-11-13T15:59:21Z
CANDIDATE_MODES=email,code
INVITE_TARGET_CANDIDATE=346191c2-42bc-4d6e-8dc9-9ff1a41299aa
```

- **Step 13, item 1, the page and its key.** `https://staging.openvaa.org/`, followed through its
  redirects: `s13_page_http=200`, curl exit 0. The page's inlined public environment carries the
  anon key (`s13_anon_key_found_exit=0`), which moves the "Not yet observed" row of item 1.
- **Step 13, item 2, the insert.** One `POST <PUBLIC_SUPABASE_URL>/rest/v1/feedback` over IPv4 with
  the anon key, `Origin: https://staging.openvaa.org` and the columns the voter app's
  `SupabaseFeedbackWriter` sends that the item gives (`project_id`, `description`, `url`, `date`),
  with the description `limit-check <UTC second of the insert>`: curl exit 0, `s13_probe_insert_http=201`,
  read at `s13_probe_insert_utc=2026-11-13T15:59:21Z`. No server route of the stack is on this path;
  the trigger `check_feedback_rate_limit` admitted it. The operator's
  block (item 3) starts no earlier than 16:04:21Z.
- **Step 14, item 1, the registration modes.** `rpc/contestant_app_public_config` with the project's
  id, anonymously: `s14_config_http=200`, curl exit 0, `s14_candidate_modes=email,code`. The project
  honours an email invitation for a candidate.
- **Step 14, item 1, the target candidate.** `candidates?select=id&project_id=eq.<project>&external_id=like.smoke_*&order=external_id&limit=1`,
  anonymously: `s14_candidate_http=200`, curl exit 0, `s14_candidate=346191c2-42bc-4d6e-8dc9-9ff1a41299aa`,
  the id of the first smoke candidate by external id (an id, not personal data).
- **Beside the items, read-only:**
  - `https://staging.openvaa.org/admin/login` and `/contestant/login/email` each answered a `GET`
    with 200 at their own address (curl exit 0), so item 2's login path is `/admin/login`.
  - `aws sesv2 get-account` exit 0: `ProductionAccessEnabled` `True`, `SendingEnabled` `True`. The
    mail identity is out of the sandbox, so the second mailbox needs no verification before Step 14.

## Task 3: the operator's sitting (2026-11-14, 08:42Z to 08:56Z)

The operator's reply was stored for attempt `20261113T160106Z.191d2a2ac` with `attempt.sh put 185-18-2`
(exit 0), `OPERATOR_REPLY=received attempt=20261113T160106Z.191d2a2ac plan=185-18 task=2` was
appended, and `attempt.sh bound 185-18-2 OPERATOR_REPLY plan=185-18 task=2` exits 0. Every account
line of the reply reads 0. The recipient is named here only as the operator's second mailbox.

### OBS-10: the feedback limit, by client (Step 13, items 3 to 6)

```
OBS10_ADMITTED_BEFORE_REFUSAL=5
OBS10_REFUSAL=400 P0001
OBS10_PHONE_ADMITTED=yes
OBS10_WORKSTATION_STILL_REFUSED=yes
```

- **The window.** `s13_block_started_utc=2026-11-14T08:42:46Z`, about 16 hours and 43 minutes after
  the agent's insert (`AGENT_INSERT_UTC=2026-11-13T15:59:21Z`). That is well past five minutes, so
  the block's first insert opened a fresh window for the workstation's bucket, which closes at
  08:47:46Z.
- **Item 3, the workstation.** `s13_insert_1_http=` to `s13_insert_5_http=` each `201`, then
  `s13_insert_6_http=400`, every curl exit 0, and `s13_refusal_code=P0001`. The loop stopped at the
  first refusal.
- **Item 4, the phone.** On mobile data with Wi-Fi off, the operator sent feedback through
  the voter app's feedback form, with the text `10.43 eet` (the time alone, not the
  `limit-check phone` the item asked for; corrected by plan 185-19, which read the row back), at `https://staging.openvaa.org`. The form thanked them:
  `answer_phone_feedback=accepted`, `answer_phone_feedback_utc=2026-11-14T08:43Z` (reported as 10.43
  EET). That is inside the workstation's window, while its bucket was full.
- **Item 5, the workstation again.** `s13_after_phone_http=400`, `s13_after_phone_code=P0001`, curl
  exit 0, at `s13_after_phone_utc=2026-11-14T08:44:18Z`, 92 seconds into the window and after the
  phone's admitted insert.
- **The reading.** One client was refused while another was admitted in the same window, so the
  trigger counts the two networks in separate buckets: on the persistent project it keys on the
  client address Cloudflare gives (`behind_cloudflare` true). The empty-address case (`unknown`) was
  not provoked, as the plan says.
- **Item 6.** `s13_logs_removed=yes`.

### OBS-06 and D-09: the administrator's sign-in, the invitation and its mail (Step 14)

```
OBS06_ADMIN_SIGNIN_HTTP=303
AUTH_COOKIE_RESPONSE_CACHE_CONTROL=private, no-cache, no-store, must-revalidate, max-age=0
AUTH_COOKIE_RESPONSE_X_CACHE=Miss from cloudfront
AUTH_COOKIE_RESPONSE_COOKIE_NAMES=sb-cofbsatfrdysyphajsky-auth-token
OBS06_INVITATION_ID=af0f3920-a124-4528-88f3-3af53c5faa22
OBS06_ENTITY_CONFIRMED=true
OBS06_MAIL_ARRIVED=yes
OBS06_MAIL_UTC=2026-11-14T08:55Z
OBS06_LINK_ORIGIN=https://staging.openvaa.org
OBS06_LINK_PATH=/en/api/auth/callback
OBS06_SIGNED_IN=yes
OBS06_LANDING=set-password
OBS06_RECIPIENT=operator's second mailbox
```

- **Item 1, again in the operator's shell.** `s14_candidate_modes=email,code` and
  `s14_candidate=346191c2-42bc-4d6e-8dc9-9ff1a41299aa`, the same as Task 1.
- **Item 2, the Admin App's login form through CloudFront.**
  - `s14_login_path=/admin/login`. The first two posts answered 400, with `x-cache`
    `Error from cloudfront` and no `location` or cookie. The orchestrator read the application's
    log group `/openvaa/staging/frontend`, which held `Admin login failed: Invalid login credentials`.
    The cause was the runbook's command: `jq -rn` ends its output with a newline, and
    `curl --data-binary @-` sends it unchanged, so the last form field, the password, arrived with a
    trailing newline. The operator confirmed the credentials signed in from the phone.
  - With the body written by `jq -jn`, the post answered `s14_admin_signin_http=303`, curl exit 0,
    `s14_signin_location=https://staging.openvaa.org/admin` (the Admin App on the public origin, not
    the origin host).
  - The answer that sets the auth cookie carried `cache-control` `private, no-cache, no-store,
    must-revalidate, max-age=0` from the origin, and `x-cache` `Miss from cloudfront`, so the edge did
    not answer it from its cache (D-09). The cookie names are recorded, never the values. The name
    carries the project's reference, which the tracked `PUBLIC_SUPABASE_URL` already publishes.
  - The runbook now gives `jq -jn` (see the deviation in the summary). No other form post in the
    runbooks or `infra/local/check-proxy-topology.sh` has this shape: Step 7 item 5 posts a literal
    with `--data`, the script writes its bodies with `printf '%s'` or `--data-urlencode`, and Step
    14 items 3 and 4 post JSON, which a trailing newline does not change.
- **Item 3, the token.** `s14_token_http=200`, `s14_token_read_exit=0`. It was read twice, the second
  time for item 4's re-run below; both reads answered 200.
- **Item 4, the invitation.** The first run created nothing. The operator's paste dropped the line
  that opens the `jq` read of the answer, zsh stopped with a parse error before `curl` ran, and no
  `s14-invite.json` existed. The token had already been unset, so the operator ran item 3 again for
  a new token (200), then item 4: `s14_invite_http=200`,
  `s14_invitation_id=af0f3920-a124-4528-88f3-3af53c5faa22`, `s14_invitation_code=none` (an email
  invitation has no code), `s14_entity_confirmed=true`. One invitation exists.
- **`entity_confirmed` is `true` with `p_confirm_entity` false, as expected.**
  - Per its definition in `apps/supabase/supabase/schema/506-invitation-rpcs.sql`, the field is "the
    invited entity's confirmation after the item as the caller reads it", not an echo of the flag.
  - With `p_confirm_entity` false the function runs no confirming `UPDATE`.
  - The candidate was already confirmed before the call. The `anon_select_candidates` policy admits a
    candidate only when it is confirmed, with a confirmed nomination, in a project open for voters, and
    the agent read this candidate's id anonymously in Task 1, before the invitation existed.
  - So the call changed neither the candidate's confirmation nor what voters see.
- **Item 5, the mail and the sign-in.**
  - The operator asked for a link at `https://staging.openvaa.org/contestant/login/email` with "I have
    not set a password yet".
  - The mail reached the second mailbox at 08:55Z. It came from the project's own sender, `noreply`
    on the staging mail domain, which the client showed as verified by `staging.openvaa.org`, with
    the subject `Sign-in link for the voting advice application`.
  - Its link, read without opening it: the origin `https://staging.openvaa.org`, the function's
    `SITE_URL` and not an origin taken from the request (T-185-41), the path `/en/api/auth/callback`,
    and the query's type `magiclink`. No query value was copied.
  - Following it signed the recipient in. It landed on the screen that asks a user with no password
    to set one (`answer_landing_screen=set-password`), and no password was set. "Signs in" is read as
    that signed-in screen, as the plan's assumption states; the recipient's later actions were not
    observed.
- **Item 6.** `s14_logs_removed=yes`.

### Left on the persistent project for plan 185-19

- Feedback rows described `limit-check <time>`: the agent's one, the workstation's five admitted
  inserts and the phone's row. That row reads `10.43 eet`, the operator's own text, not
  `limit-check phone` (corrected by plan 185-19, which read it back and deleted it by that text).
- The invitation `af0f3920-a124-4528-88f3-3af53c5faa22`, the invitee's auth user, which the
  recipient signed in as, and the grant the sign-in's claim writes. Whether the claim ran was not read
  here; plan 185-19 reads the rows before it removes them. Nothing else was written.
