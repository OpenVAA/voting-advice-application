# 184-16: the throwaway's mail on 2587, its authentication, the redirect cases, the auth service's silence, the 587 trial and the failed send on 2465

Attempt: 184-16-1 20261111T085840Z.73bbc7b47
Attempt: 184-16-3 20261111T094545Z.73bbc7b47
Attempt: 184-16-4 20261111T095209Z.69051638e
Attempt: 184-16-5 20261111T095854Z.69051638e

SMTP_PORT_DELIVERS=2587
MAIL_STOP=not-raised
SLOT_PROOF=port-2465 (ruled by the operator on 2026-11-11)
SLOT_RELEASE_SHOWN=yes
PORT_587_SEND=delivered
PORT_2465_SEND=failed ETIMEDOUT

- **Project:** the throwaway `begckvkapaopoztbreqc` (`eu-west-1`), root `infra/envs/scratch/supabase`, linked work directory `tmp/supabase-linked/begckvkapaopoztbreqc`. Nothing in this plan touched the persistent project.
- **Who ran the sitting:** the orchestrator, under the operator's authorisation of 2026-11-10, with the throwaway's credentials read from the operator's keychain. The operator watched the mailbox and read the function's logs in the dashboard. The executor wrote nine scripts and a mail parser in the session scratchpad (`184-16/`), held no credential and ran nothing hosted.
- **When (UTC):** **2026-11-11**, in two sittings: the first from 08:59:52Z to 09:27:44Z (§ 1 to 8), and the rerun for the failed send from 09:53:08Z to 09:55:05Z (§ 9 and 10). Every observation falls in one of those windows unless another time is given.
- **How the record was written:** from the attempt files. `184-16-1` (the first sitting) is stored under `OPERATOR_REPLY=received attempt=20261111T085840Z.73bbc7b47 plan=184-16 task=1 head=73bbc7b47140a0e9f3773c192ac420d0fb15a556`, and `184-16-4` (the rerun) under `OPERATOR_REPLY=received attempt=20261111T095209Z.69051638e plan=184-16 task=1 head=69051638e4b8016cf3a0a14809ef6d79b154db4f`. The screen accepted each on the first `put`. The orchestrator relayed the lines on several lines each; they are stored one named line per field, with the prose as `note:` lines.
- **What is kept out:** no key, token, password, sign-in link, mail body, IP, or address other than the sender. The log directory, which held the saved mail, was removed (`s8_logs_removed=yes`).

## Outcome in one paragraph

The served `account-access` mailed a sign-in link through SES on port 2587, and it arrived with DKIM, SPF and DMARC all `pass`. The redirect cases, and the auth service's silence while the send-email hook is on, are recorded. The deliberate failed send planned on port 587 **did not fail**: with port 587 served and the function redeployed, the link was mailed and arrived (§ 6). The operator then ruled `SLOT_PROOF=port-2465` (2026-11-11). On port 2465, which the transport cannot speak, the send failed with `ETIMEDOUT`. Its slot was given back (`not-sent` witness, zero throttle rows, the slot line in the function's logs), and no mail arrived (§ 9). Because the same apply-and-redeploy sequence made the worker use 2465, the 587 send also went out over 587, so the premise that the platform blocks 587 from Edge Functions is contradicted (§ 10). Port 2587 was restored both times. After the second restore, a plan made straight after the apply still showed a change; a replan about a minute later read "No changes" (§ 9).

## 1. Starting state (script 01, 08:59:52Z)

- `s0_ref` and `s0_linked_ref` were both `begckvkapaopoztbreqc`. The project id was `00000000-0000-0000-0000-000000000001` and the origin `https://staging.openvaa.org`.
- The tracked port (`s0_tfvars_port=2587`) and the served port (`s0_served_smtp_port=2587`, read with status 200) agreed.
- The served `account-access`: `status=ACTIVE verify_jwt=false version=2`.
- Step 15: the direct connection exited 2 and the session pooler 0 (`s15_connection=pooler`), as in 184-11 to 184-15. `s0_throttle_rows=0`.

## 2. The redirect allow list (OBS-02, 08:59:54Z)

Each read was `GET /auth/v1/verify?token=probe&type=magiclink&redirect_to=<candidate>` with the publishable key as `apikey`, with no redirect followed. The served `site_url` is `https://staging.openvaa.org`, and the served allow list holds `https://staging.openvaa.org/api/auth/callback` and `https://staging.openvaa.org/*/api/auth/callback`.

| n | Candidate | Status | Location | Error | Error code |
|---|-----------|--------|----------|-------|------------|
| 1 | `https://staging.openvaa.org/api/auth/callback` (the root callback) | 303 | candidate | yes | `otp_expired` |
| 2 | `https://staging.openvaa.org/en/api/auth/callback` (one locale segment) | 303 | candidate | yes | `otp_expired` |
| 3 | `https://staging.openvaa.org/en/x/api/auth/callback` (two segments) | 303 | candidate | yes | `otp_expired` |
| 4 | `https://staging.openvaa.org:8443/en/api/auth/callback` (the site's host, another port) | 303 | site | yes | `otp_expired` |
| 5 | `https://refused.invalid/en/api/auth/callback` (a foreign origin) | 303 | site | yes | `otp_expired` |

`s2_curl_errors=no`.

- **The single-segment pattern.** Case 3 was admitted although `*` would match one segment only. Every candidate on the site URL's own scheme, host and port was admitted, so these reads cannot tell the allow list's single-segment glob from the site-URL rule (an address on the site URL's origin is admitted whatever its path). What they show is that, on this project, any path on `https://staging.openvaa.org` is an admitted redirect.
- **The other port.** The site's host on port 8443 was refused: the port is part of the comparison, and no allow-list entry matches another port.
- **What the verify endpoint returns.** For an unknown token it answers 303 in both cases, with `error_code=otp_expired` in the location. When the target is admitted, the location begins with the candidate. When it is refused, the location is the site URL. Both carry the error, so the error says nothing about the redirect; only where the location begins does.

## 3. The mail on port 2587 (SUPA-14, D-05)

- **The request (script 03):** a witness was opened as `postgres` (`s3_witness_opened=yes`). The `request-link` was sent at **09:00:16Z** (`s3_http=200`, `s3_answer=accepted`). The witness read `sent` after 10 s, and `s3_throttle_rows=1`.
- **Arrival:** `answer_mail_arrived=yes`. The mail's `Date` header reads 09:00:17 +0000, sent through SES `eu-north-1`.
- **Who it was from and to (script 04):** `s4_from_is_sender=yes` (the sender `noreply@staging.openvaa.org`), `s4_from_domain=staging.openvaa.org`, `s4_to_is_recipient=yes`. The mail held one `Authentication-Results` header.

## 4. The mail's authentication (D-06, 2026-11-11)

- **DKIM:** `pass`. The aligned signature is from `staging.openvaa.org`. Both signatures pass: `s4_dkim_entries=staging.openvaa.org=pass amazonses.com=pass`.
- **SPF:** `pass`, for the envelope domain `mail.staging.openvaa.org` (the custom MAIL FROM domain).
- **DMARC:** `pass`, with the published policy `p=QUARANTINE sp=QUARANTINE`.
- **`Authentication-Results`, verbatim as pasted** (every address shown as `<address>`, every IP as `<ip>`, `header.b` cut to 8 characters):

  ```
  mx.google.com; dkim=pass header.i=<address> header.s=ehvyibk54e4sxpv6s435nycysywzrovo header.b=DD5ENs99; dkim=pass header.i=<address> header.s=ejx2vwln25gytu6sovwgn6br34bly4ut header.b=bQC69cCz; spf=pass (google.com: domain of <address> designates <ip> as permitted sender) smtp.mailfrom=<address>; dmarc=pass (p=QUARANTINE sp=QUARANTINE dis=NONE) header.from=staging.openvaa.org
  ```

- **`Received-SPF`:**

  ```
  pass (google.com: domain of <address> designates <ip> as permitted sender) client-ip=<ip>;
  ```

- **The sign-in link:** the mail holds it twice (text and HTML, `s4_link_count=2`). Both copies begin with the staging origin (`s4_link_origin_is_site=yes`) and are the locale callback (`s4_link_is_callback=yes`), with `type=magiclink`. The link itself is not recorded.

## 5. The auth service's own mail while the send-email hook is on (D-07)

- **The request (script 05):** `POST /auth/v1/recover` at **09:02:04Z** answered 200 (`s5_recover_error_code=none`).
- **No mail:** `answer_auth_mail_arrived=no`. The operator checked the mailbox after 09:12Z, ten minutes after the request.
- **Two earlier tries were refused.** 05 was first run at 09:00:38Z and 09:00:50Z, 22 s and 34 s after the link mail, and both answered 429 with `over_email_send_rate_limit`. A likely cause is the per-user minimum gap between mails, which the module sends as `smtp_max_frequency = 60` (UNCONFIRMED). The measured request is the third, 108 s after the link.

## 6. The 587 trial (OBS-05, D-05 amendment)

**The trial plan (script 06, 09:24:33Z).** The account check printed `471112560111`, and the SMTP credentials were read from the dns-mail root without being printed. The trial variable file was written into the log directory only. The plan exited 0 with exactly the fault-step rule's lines:

```
s6_plan_line=  # module.supabase.supabase_edge_function_secrets.this[0] will be updated in-place
s6_plan_line=  # module.supabase.supabase_settings.this will be updated in-place
s6_plan_line=Plan: 0 to add, 2 to change, 0 to destroy.
```

`s6_plan_matches_rule=yes`, so the script applied it: `s6_apply_exit=0`, `Apply complete! Resources: 0 added, 2 changed, 0 destroyed.` The served auth port then read `587`. `account-access` was redeployed alone (`s6_redeploy_exit=0`) and listed as `ACTIVE`, `verify_jwt=false`, version 3.

**The send (script 07, 09:24:52Z).**
- The link throttle rows were cleared (`s6_throttle_cleared=yes`, `s6_throttle_rows_before=0`), a second witness was opened, and the request was accepted (`s6_http=200`, `s6_answer=accepted`).
- **It did not fail:** the witness read `sent` after 10 s, and `s6_throttle_rows=1` (the slot stayed taken, as for a sent mail).
- The operator saw a second sign-in mail arrive at about 09:24:52Z (`answer_second_mail_arrived=yes`).

**The logs.**
- The Management API's logs endpoint (`/analytics/endpoints/logs.all`) answered **410** on all six tries, so it read nothing. The endpoint looks retired (UNCONFIRMED).
- The operator read all six rows of the function's dashboard logs. Converted from UTC+2: 09:00:16Z booted, 09:00:16Z POST 200, 09:00:18Z shutdown, 09:24:54Z booted, 09:24:54Z POST 200, 09:26:02Z shutdown.
- There is no slot-given-back line and no error line (`answer_slot_log_seen=no`, `answer_failure_name=none`).

**What this shows and what it does not.**
- **Shown:** with port 587 served in the auth settings and in the function secrets, and `account-access` redeployed (version 3), a link request was mailed and the mail arrived. The worker that served it was booted at 09:24:54Z, after both the apply and the redeploy.
- **Not shown by this trial alone:** that this worker connected on 587. No log line names the port, and the secret's served value was not read. The 2465 rerun settles it (§ 10).
- **Not demonstrated here:** a failed send, the slot given back, or a `not-sent` witness. The plan's truth as worded ("one deliberate send on port 587 failed") is **not met**; its purpose, a failed send that gives its slot back, is met on 2465 instead (§ 9).

## 7. The restore of 2587 (script 08, 09:27:23Z)

- The restore plan exited 0 with the same three lines (`s7_plan_matches_rule=yes`) and was applied: `s7_apply_exit=0`, `Apply complete! Resources: 0 added, 2 changed, 0 destroyed.`
- **The second plan exited 0:** "No changes. Your infrastructure matches the configuration."
- The served auth port reads `2587` again. `account-access` was redeployed (`s7_redeploy_exit=0`) and is `ACTIVE`, `verify_jwt=false`, version 4.
- The logs were removed (`s8_logs_removed=yes`).

## 8. A live link in the chat transcript

- **What happened:** the operator pasted the first mail's "Show original" text into the chat instead of downloading it. The orchestrator saved it verbatim into the log directory (mode 600), ran script 04 on it, and script 09 removed it.
- **What the transcript holds:** the sign-in link of the throwaway's disposable administrator, mailed at 09:00:16Z. It was never clicked.
- **How long it stays usable:** the module sends `mailer_otp_exp = 3600`, so the link expires an hour after it was issued, by 10:00:16Z on 2026-11-11.
- **Superseded?** 07's later request minted a newer magic-link token for the same user, which probably replaces the older one (UNCONFIRMED).
- **No other copy:** this record holds no part of the link.

## 9. The failed send on port 2465 (OBS-05, rerun, 2026-11-11)

**The ruling.** `SLOT_PROOF=port-2465`, ruled by the operator on 2026-11-11, from three options: `port-2465` (recommended), `closed-port` and `defer`. The reason: the transport is built with `secure: false`, which waits for a plain greeting, while SES on 2465 expects TLS first, so a send there fails by construction.

**Starting state (01, 09:53:08Z).** The served port was 2587 and `account-access` was at version 4. The direct connection exited 2 and the pooler 0. `s0_throttle_rows=1`, the slot left by the 09:24 send.

**The trial (06, 09:53:15Z).**
- The plan exited 0 with exactly the rule's lines (the two in-place updates and `Plan: 0 to add, 2 to change, 0 to destroy.`), so `s6_plan_matches_rule=yes`.
- Applied: `s6_apply_exit=0`, `Apply complete! Resources: 0 added, 2 changed, 0 destroyed.`
- The served auth port then read `2465`. `account-access` was redeployed alone (`s6_redeploy_exit=0`) and listed `ACTIVE`, `verify_jwt=false`, version 5.

**The send (07, 09:53:34Z).**
- 07 first checked that the served port was 2465 (`s6_trial_port_served=yes`), cleared the link throttle rows, and opened a witness. The request answered `s6_http=200`, `s6_answer=accepted`.
- **The send failed:**
  - the witness read `not-sent` after 10 s;
  - `s6_throttle_rows=0`, so the slot was given back;
  - no mail arrived (`answer_third_mail_arrived=no`).
- **The function's log line,** read by the operator in the dashboard: `account-access: a link could not be issued or mailed; its slot is given back {"name":"Error","code":"ETIMEDOUT"}` (`answer_slot_log_seen=yes`, `answer_failure_name=Error ETIMEDOUT`).

**The restore (08, 09:54:06Z).**
- The restore plan exited 0 with the rule's lines (`s7_plan_matches_rule=yes`), and the apply exited 0 with `Apply complete! Resources: 0 added, 2 changed, 0 destroyed.`
- **A change still showed straight after the apply:**
  - the served auth port read `2465`;
  - the second plan exited **2**, with `# module.supabase.supabase_settings.this will be updated in-place` and `Plan: 0 to add, 1 to change, 0 to destroy.`
  - `account-access` was redeployed (`s7_redeploy_exit=0`), version 6.
- **What the orchestrator did next:**
  - it did not apply that plan;
  - at 09:54:26Z it read the auth config through the Management API, which gave `smtp_port` 2587;
  - at 09:55:05Z it made a read-only replan (`08b-replan.sh`), which exited 0 with "No changes. Your infrastructure matches the configuration.", the served port reading `2587`.
- **Why (UNCONFIRMED, seen once):** the auth settings write took effect after a delay, so the read and plan made straight after the apply saw the old value. The restore of 09:27 did not show this.
- **The project ends clean on 2587.** The log folder was removed (`s8_logs_removed=yes`).

## 10. What the two trials show together (D-05 amendment, corrects the research's premise)

- **The redeployed worker reads the changed port.** The same sequence (apply the port change to the auth settings and the function secrets, then redeploy `account-access` alone) made the next send fail with `ETIMEDOUT` on 2465. So the worker serving that send used the new `SMTP_PORT`.
- **Port 587 is open from a hosted Edge Function.** The 09:24 send ran under the same sequence with 587, and SES accepted and delivered it, so that send went out over 587. The research premise "587 and 25 are blocked [CITED: functions/limits]" is contradicted for 587 on 2026-11-11 (25 was not tried). Pitfall 4's other half, that 465 and 2465 cannot work with `secure: false`, is confirmed for 2465.
- **Which port to use:** `SMTP_PORT_DELIVERS=2587` stands, because that port was measured and used for the first mail. 587 delivered as well.

## Task 3's verify, against the two attempts

Task 3's first automated verify reads `184-16-1` only, so it exits 1 at `missing: ^s6_witness=not-sent$`. That attempt is the 587 trial, which did not fail. The same checks were run with each field taken from the attempt that measured it:
- the redirect cases, the mail answer and the three authentication results, from `184-16-1`;
- the failed send, the slot release and the logs-removed line, from `184-16-4`: `s6_apply_exit=0`, `s6_witness=not-sent`, `s6_throttle_rows=0`, `answer_slot_log_seen=yes`, `s7_apply_exit=0` and `s8_logs_removed=yes`.

Every one of those passes. `s7_second_plan_exit=0` is in `184-16-1` but not in `184-16-4`: there the second plan exited 2 and a replan exited 0 (`s7_replan_exit=0`), as § 9 records. The second verify (the port line, this attempt, no address, Prettier) passes as written.
