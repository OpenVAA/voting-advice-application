---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 16
subsystem: infra
tags: [infra, supabase, hosted, throwaway, smtp, ses, dkim, redirects, slot-release, observations]
status: complete

requires:
  - "184-15: the throwaway bootstrapped, the disposable administrator granted (s21_grant_exit=0), account-access served with verify_jwt false"
  - "184-11: the scratch root's smtp object applied with port 2587 and the function secrets set"
provides:
  - "SMTP_PORT_DELIVERS=2587: a link mail from the served account-access through SES arrived (2026-11-11)"
  - "DKIM pass (aligned, staging.openvaa.org), SPF pass (mail.staging.openvaa.org), DMARC pass (p=QUARANTINE)"
  - "The redirect allow list's five cases: anything on the site's origin admitted, the site's host on another port and a foreign origin refused; verify answers 303 with otp_expired either way"
  - "No mail from the auth service within ten minutes of a recovery request while the send-email hook is on"
  - "SLOT_PROOF=port-2465 (operator, 2026-11-11): a send on 2465 failed with ETIMEDOUT and gave its slot back (not-sent witness, zero throttle rows, the slot log line)"
  - "Port 587 is open from a hosted Edge Function (a 587 send was delivered), correcting the research premise"
  - "Runbook: five dated Observations rows plus two for the 2465 failure and the restore delay; a fault-step rule to re-read and replan before acting on a second plan"
affects: [184-17, 184-18, 184-20, 184-22, 185]

actuals:
  tokens: 24600
  tasks: 3
  commits: 2
plan_head_before: 73bbc7b47140a0e9f3773c192ac420d0fb15a556
plan_head_after: 155e67361005fc6d81a3e2d3bff798f4a453a9ad

tech-stack:
  added: []
  patterns:
    - "A mail's Authentication-Results read from a saved .eml by a local parser that prints only result words, domains and a redacted header, never the link or an address"
    - "A planned failed send on a port the transport cannot speak (2465 with secure false), instead of relying on a platform port block"

key-files:
  created:
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-16-throwaway-mail-redirects-slot.md
  modified:
    - infra/envs/staging/supabase/README.md
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/184-RESEARCH.md

key-decisions:
  - "SLOT_PROOF=port-2465, ruled by the operator on 2026-11-11: the failed send for OBS-05 was made on 2465, because the planned 587 send was delivered"
  - "SMTP_PORT_DELIVERS=2587 stands for plan 184-20; 587 also delivers from a function, against the research premise"
  - "MAIL_STOP=not-raised: the mail on 2587 arrived, so Task 2's decision did not apply"

requirements-completed: []  # SUPA-14 is "measured and used": 184-20 writes 2587 into the persistent root. OBS-05's refusing branches are seen in 184-18. OBS-02 is recorded, but its single-segment item could not be told apart on this configuration (see Issues)

duration: about 1h10m (08:58:40Z, the first attempt id, to the record; the sittings ran 08:59:52Z to 09:27:44Z and 09:53:08Z to 09:55:05Z)
completed: 2026-11-11
---

# Phase 184 Plan 16: The throwaway's mail, redirects and slot release Summary

**SMTP_PORT_DELIVERS=2587.**

**DKIM pass, SPF pass, DMARC pass.**

The sign-in link mail from the served `account-access` was sent through SES on port 2587 and arrived one second after the request. Its `Authentication-Results` read:
- `dkim=pass`, aligned on `staging.openvaa.org`, with a second signature from `amazonses.com`;
- `spf=pass` for `mail.staging.openvaa.org`;
- `dmarc=pass` under `p=QUARANTINE`.

The planned failed send on 587 was delivered instead. The operator ruled `SLOT_PROOF=port-2465`. On 2465 the send failed with `ETIMEDOUT` and gave its slot back, which also shows that port 587 is open from a hosted function.

## Performance

- **Sittings (UTC, 2026-11-11):** the first ran from 08:59:52Z to 09:27:44Z. The rerun for the failed send ran from 09:53:08Z to 09:55:05Z.
- **Completed:** 2026-11-11
- **Tasks:** 3. Task 1 was the sitting, run twice. Task 2 was not raised. Task 3 was the record.
- **Files modified:** 3

## Who ran the sittings

The orchestrator ran both sittings under the operator's authorisation of 2026-11-10, with credentials from the operator's keychain. The operator watched the mailbox and read the function's logs in the dashboard. I wrote the scripts, held no credential and ran nothing hosted. The scripts are a prelude, nine numbered scripts and a mail parser, all in the session scratchpad under `184-16/`.

The replies are stored, and the screen accepted each on the first `put`:
- `184-16-1`, attempt `20261111T085840Z.73bbc7b47`
- `184-16-4`, attempt `20261111T095209Z.69051638e`

## Accomplishments

- **Mail (SUPA-14, D-05, D-06).** The witness read `sent` after 10 s. The mail came from the sender, to the disposable administrator. Both copies of the link begin with `https://staging.openvaa.org/` and are the `en` callback.
- **Redirects (OBS-02).** All five reads answered 303 with `otp_expired`.
  - The root callback, `/en/` and `/en/x/` on the site's origin were admitted: the location begins with the candidate.
  - The site's host on port 8443, and a foreign origin, were refused: the location is the site URL.
- **Auth service silence (D-07).** A recovery request at 09:02:04Z answered 200, and no mail came within ten minutes.
- **Slot release (OBS-05's failed-send half).**
  - With 2465 served and the function redeployed (version 5), the request was accepted.
  - The witness read `not-sent` after 10 s, and the throttle rows read 0.
  - The dashboard showed `…its slot is given back {"name":"Error","code":"ETIMEDOUT"}`, and no mail arrived.
- **Port 587.** The same apply-and-redeploy sequence produced the 2465 failure, so the delivered 587 send really used 587. The research premise is corrected in Pitfall 4 and Item 9.
- **Restores.** Both restores applied on the rule's exact lines. The second restore's immediate re-plan exited 2 on a stale read. The read-only replan a minute later read "No changes", with 2587 served.

## Task Commits

1. **Task 1: the sitting.** Human-action checkpoint, run twice by the orchestrator. No repository change.
2. **Task 2: no mail on 2587.** Not raised (`MAIL_STOP=not-raised`).
3. **Task 3: the record.**
   - `69051638e` (docs): the first sitting's evidence and the runbook rows.
   - `155e67361` (docs): the 2465 failed send, the 587 correction, the runbook rows and fault-step rule, and the research correction.

**Plan metadata:** the commit that follows this SUMMARY (docs: complete plan).

## Decisions Made

- **`SLOT_PROOF=port-2465`**, ruled by the operator on 2026-11-11. The options were `port-2465` (recommended), `closed-port` and `defer`.
- **`SMTP_PORT_DELIVERS=2587`** is what plan 184-20 writes into the persistent root.

## Deviations from Plan

### Found in the sittings

**1. [Rule 4 - Architectural/premise] The send on 587 was delivered, not refused**
- **Found during:** Task 1, script 07, 09:24:52Z
- **Issue:** the plan rested on the platform blocking 587, but the witness read `sent`, a throttle row was taken and the mail arrived. The truth "one deliberate send on port 587 failed" could not be met as worded.
- **Fix:** I raised a new decision checkpoint. The operator ruled `port-2465`, and the rerun on 2465 failed as designed. The evidence states the gap and how it was closed.
- **Commits:** `69051638e`, `155e67361`

**2. [Rule 1 - Bug] The Management API logs endpoint answered 410**
- **Found during:** the first sitting's 07
- **Fix:** I dropped the read from 07 in the rerun. The dashboard read (Operator C) was the primary source for the slot line.

**3. Recovery requests too soon after a link were refused with 429**
- **Found during:** the first sitting's 05, run early by the orchestrator. Requests 22 s and 34 s after the link answered 429 `over_email_send_rate_limit`.
- **Cause:** probably `smtp_max_frequency = 60` (UNCONFIRMED).
- **Fix:** the measured request was the third, 108 s after the link. The runbook row says to wait more than 60 s.

**4. The mail's source was pasted into the chat**
- **What happened:** the operator pasted it instead of downloading it, so the chat transcript holds the throwaway administrator's live link, issued 09:00:16Z.
- **Exposure:** the link was never clicked, and it expired by 10:00:16Z (`mailer_otp_exp = 3600`). That the later link superseded it is UNCONFIRMED. The record holds no part of it.

**5. A stale read straight after the second restore's apply**
- **What happened:** the served port read 2465, and the immediate plan exited 2 with one in-place change.
- **What the orchestrator did:** it applied nothing. It read the port again (2587 at 09:54:26Z) and made a read-only replan, which exited 0 with "No changes".
- **Cause:** the settings write took effect after a delay (UNCONFIRMED as a mechanism, seen once).
- **Fix:** a fault-step rule in the runbook to re-read and replan before acting on such a plan.

### Executor adjustments

**6. Task 3's first automated verify reads `184-16-1` only**
- **Issue:** it exits 1 at `missing: ^s6_witness=not-sent$`, because that attempt is the 587 trial.
- **What I ran instead:** the same checks with each field taken from the attempt that measured it.
  - The redirects, the mail and the three results, from `184-16-1`.
  - The failed send, the slot release, the restore apply and the logs removal, from `184-16-4`.
  - `s7_replan_exit=0` in place of `s7_second_plan_exit=0`, for the reason in item 5.
- **Result:** exit 0. The second verify passes as written.

**7. Script details (sitting mode)**
- **The address:** it came from `DU_EMAIL`, not from `read`.
- **The witness:** polled every 10 s, up to 150 s.
- **Throttle rows:** cleared just before the failure request.
- **Extra named lines:** preconditions, served-port and function-version read-backs, a served-port guard in the rerun's 07, the redirect error code, and the mail parser's sender, recipient and callback checks.

## Issues Encountered

- **OBS-02's single-segment item.** The single-segment pattern could not be told apart from the site-URL rule. Every candidate on the site's own origin is admitted whatever its path, `/en/x/` included, and both allow-list entries are on that origin.
  - The behaviour is recorded. Whether OBS-02 counts as closed on that record is left to the verifier.
  - No other plan of this phase carries OBS-02.
  - Telling the two rules apart would take an allow-list entry on an origin other than the site URL's.
- **The orchestrator's `.out` files** for the sittings are in the scratchpad folder. They are not repository files.

## Deferred Issues

None.

## User Setup Required

None.

## Next Phase Readiness

- **184-20** writes `smtp.port = "2587"` into the staging root, from `SMTP_PORT_DELIVERS=2587`.
- **184-18 (the batched break)** shows OBS-05's refusing branches. The failed-send half is now on record from this plan.
- **The throwaway is left clean:** 2587 is served, the plan reads "No changes", and `account-access` is at version 6 with `verify_jwt` false.

## Self-Check: PASSED

- FOUND: `.planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-16-throwaway-mail-redirects-slot.md`
- FOUND: `infra/envs/staging/supabase/README.md` (Prettier check exit 0)
- FOUND: `.planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/184-RESEARCH.md`
- FOUND: commits `69051638e` and `155e67361`, both ancestors of HEAD
- Verifies: the adapted Task 3 verify exits 0, and the second verify exits 0.
