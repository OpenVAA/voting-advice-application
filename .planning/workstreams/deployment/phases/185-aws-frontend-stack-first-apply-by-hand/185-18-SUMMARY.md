---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "18"
subsystem: infra
status: complete
tags: [supabase, feedback, rate-limit, cloudflare, invitations, ses, cloudfront, runbook]
requires:
  - phase: 185-17
    provides: the staging AWS stack in its plain shape (revision 5, one task, bounds 1,2)
provides:
  - OBS-10 seen on the persistent project. The feedback limit admits five and refuses the sixth per
    client, and a phone on another network is admitted in the same window.
  - OBS-06 seen. The admin signs in through CloudFront with 303, one email invitation is created
    with p_confirm_entity false, and its sign-in link mail carries the staging origin and signs the
    recipient in.
  - D-09 recorded. The auth-cookie answer carries a private no-store cache-control, and CloudFront
    misses it.
  - Step 14 item 2 corrected to write the form body with `jq -j`
affects: [185-19, 185-20]
tech-stack:
  added: []
  patterns:
    - "A form body piped to `curl --data-binary @-` is written with `jq -j` (or `printf '%s'`), never `jq -r`, whose trailing newline becomes part of the last field"
key-files:
  created:
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-18-feedback-and-invitation.md
  modified:
    - infra/envs/staging/aws/README.md
key-decisions:
  - "`s14_entity_confirmed=true` with `p_confirm_entity` false matches what the plan expects. The field is the entity's confirmation after the call, not the flag. The smoke candidate was already confirmed, which the anonymous read of Task 1 proves, because anon sees only confirmed candidates. No schema change."
  - "The admin form post's two 400s were a runbook defect (Rule 1), not a credentials or stack fault: `jq -rn` appended a newline to the password. Step 14 item 2 now gives `jq -jn`. No other form post in the runbooks or infra/local/check-proxy-topology.sh has this shape."
requirements-completed: [OBS-10, OBS-06, INFRA-14]
duration: about 17 h wall clock (2026-11-13 15:57Z to 2026-11-14), almost all of it waiting for the operator's sitting; about 30 min of agent work
completed: 2026-11-14
estimate_ref:
  tokens: 24000
  tasks: 3
actuals:
  tokens: 7400
  tasks: 3
  commits: 2
plan_head_before: 45b7fbeb12a3880ceb7455cc8db9a291afe7a1f8
plan_head_after: 64b3254f1c1a4458eb456e5ea9a5372c784f9372
---

# Phase 185 Plan 18: The feedback limit by client, and one invitation mail Summary

```
AGENT_INSERT_HTTP=201
OBS10_ADMITTED_BEFORE_REFUSAL=5
OBS10_REFUSAL=400 P0001
OBS10_PHONE_ADMITTED=yes
OBS10_WORKSTATION_STILL_REFUSED=yes
OBS06_ADMIN_SIGNIN_HTTP=303
AUTH_COOKIE_RESPONSE_CACHE_CONTROL=private, no-cache, no-store, must-revalidate, max-age=0
AUTH_COOKIE_RESPONSE_X_CACHE=Miss from cloudfront
OBS06_INVITATION_ID=af0f3920-a124-4528-88f3-3af53c5faa22
OBS06_ENTITY_CONFIRMED=true
OBS06_MAIL_ARRIVED=yes
OBS06_LINK_ORIGIN=https://staging.openvaa.org
OBS06_SIGNED_IN=yes
OBS06_LANDING=set-password
```

**The feedback limit on the hosted project separates clients by network.** The browser writes
feedback straight to PostgREST, so the limit is the database trigger's.
- From the workstation, five inserts were admitted in one window and the sixth was refused with 400
  and `P0001`.
- The operator's phone, on mobile data, sent feedback through the voter app's form in the same
  window and was admitted.
- The workstation's next insert was still refused.

**One invitation mail completed its round trip.**
- The first administrator signed in through the Admin App's form via CloudFront with 303.
- The answer that sets the auth cookie carries `private, no-cache, no-store, must-revalidate,
  max-age=0`, and CloudFront missed it.
- One email invitation was created with `p_confirm_entity` false.
- The sign-in link mail arrived through SES from the project's own sender. Its link has the origin
  `https://staging.openvaa.org` and the path `/en/api/auth/callback`.
- Following the link landed on the set-password screen.

## What was done

- **Task 1 (2026-11-13, 15:59Z).**
  - The account check read 471112560111 before the AWS call.
  - The served page carries the anon key.
  - One browser-shaped insert from the workstation answered 201 at 15:59:21Z.
  - Two anonymous reads: the candidates' registration modes read `email,code`, and the first smoke
    candidate's id is `346191c2-…`.
  - Read-only checks beyond the plan:
    - Both login pages answer `GET` with 200.
    - SES `ProductionAccessEnabled` is true, so the second mailbox needed no sandbox verification.
- **Task 2 (checkpoint).** Attempt `20261113T160106Z.191d2a2ac` was created, and the operator's
  instructions were returned. The operator's sitting ran on 2026-11-14 from 08:42Z to 08:56Z.
- **Task 3.**
  - Stored the reply: `attempt.sh put` exit 0, `OPERATOR_REPLY=received …` appended, and `bound`
    exit 0.
  - Checked every verification of the plan against the reply.
  - Wrote the OBS-10, OBS-06 and D-09 record lines into the evidence.
  - In the runbook:
    - Fixed Step 14 item 2.
    - Moved seven "Not yet observed" rows to eight dated Observations rows.
    - Prettier is clean.

## Commits

| Task | Commit | Message |
| ---- | ------ | ------- |
| 1 | 191d2a2ac | docs(185-18): record the browser-shaped feedback insert and the invitation's prerequisites |
| 3 | 64b3254f1 | docs(185-18): record the feedback limit by client and the invitation mail round trip |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Step 14 item 2 sent the password with a trailing newline**
- **Found during:** Task 2, the operator's sitting. The cause was found by the orchestrator.
- **Issue:**
  - The first two admin form posts answered 400 with `Error from cloudfront` and no cookies.
  - The application's log held `Admin login failed: Invalid login credentials`.
  - `jq -rn` ends its output with a newline, and `curl --data-binary @-` sends it unchanged, so the
    newline was appended to the password, the last field.
- **Fix:**
  - The step now writes the body with `jq -jn` and says why.
  - Its expectation now also accepts `https://staging.openvaa.org/admin` as the location, the form
    the 303 actually gave, and names the 400 symptom.
  - With `-j`, the post answered 303.
  - The other form posts were checked and do not have this shape:
    - Step 7 item 5 posts a literal with `--data`.
    - `infra/local/check-proxy-topology.sh` writes its bodies with `printf '%s'` or
      `--data-urlencode`.
    - Step 14's items 3 and 4 post JSON.
- **Files modified:** infra/envs/staging/aws/README.md
- **Commit:** 64b3254f1

### Operator-side events (not runbook defects)

- **The first run of Step 14 item 4 created nothing.** A pasted line was dropped, and zsh stopped with
  a parse error before `curl` ran. The operator signed in again for a new token (200) and re-ran the
  item (200). Only one invitation exists, `af0f3920-…`.
- **Two re-run lines were not reported separately:** the second token status and a file check. The
  values recorded are the final ones.

## Observations beyond the plan

- The 303's `location` is the absolute `https://staging.openvaa.org/admin`, on the public origin and
  not the origin host.
- The auth cookie is one cookie, `sb-<project ref>-auth-token`.
- The mail client showed the mail as verified by `staging.openvaa.org`. Its subject is `Sign-in link
  for the voting advice application`, and its link's type is `magiclink`.

## Rows left for plan 185-19

- Feedback rows `limit-check <time>`: the agent's 1 and the workstation's 5, plus the phone's
  `limit-check phone` row.
- The invitation `af0f3920-a124-4528-88f3-3af53c5faa22`.
- The invitee's auth user, and the grant its claim writes. Whether the claim ran was not read here.

## Known Stubs

None.

## Threat Flags

None. No new surface. T-185-40 held: no address, password, token or link query is in the evidence or
the runbook, and the verify's grep passes. T-185-41 held: the link's origin equals `SITE_URL`.
T-185-42 held: `p_confirm_entity` false, and the candidate's confirmation is unchanged.

## Next Phase Readiness

The AWS stack was not changed. Plan 185-19 can remove the observation rows and the user, using the
invitation id above.

## Self-Check: PASSED

- FOUND: .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-18-feedback-and-invitation.md
- FOUND: infra/envs/staging/aws/README.md
- FOUND: 191d2a2ac
- FOUND: 64b3254f1
