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
