---
phase: 179-identity-provider-registration-coverage-close
plan: 02
subsystem: auth
tags: [probe, gotrue, email-change, passwordless, app-metadata, edge-runtime, wave-0]

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-01: the drivers (179-stack-probe.sh, 179-verdict.mjs hygiene, 179-bankauth.sh's Edge-file generation), 179-BASE and 179-BASELINE"
provides:
  - "179-probe.mjs: rows p1 to p9 against the running local stack, prefix r179-probe-, cleanup in every case"
  - "179-PROBE-FINDINGS.md: one verdict line per row, as printed, and the branch each selects (## What follows)"
affects: [179-05, 179-09, 179-10, 179-13, 179-14, 179-19]

actuals:
  tokens: 18240
  tasks: 2
  commits: 2
plan_head_before: f6b8423d5fab3e4f7e70874e69795aee6545cf65
plan_head_after: 978ba1ced9a6afda2fd6aaeedd5dcf6788580b22

tech-stack:
  added: []
  patterns:
    - "A probe row prints PASS/FAIL per step with an (as assumed)/(NOT as assumed) suffix, then its verdict lines alone; the findings copy both verbatim and a line-for-line check confirms it"

key-files:
  created:
    - .planning/phases/179-identity-provider-registration-coverage-close/179-probe.mjs
    - .planning/phases/179-identity-provider-registration-coverage-close/179-PROBE-FINDINGS.md
  modified: []

key-decisions:
  - "P1 held and P5 held: the phase does not stop; the three-call email-change recipe and the invite recipe are the mechanisms"
  - "P8 stop-start-needed: yarn db:start alone leaves no edge runtime after a functions serve ends; the wrapper (179-05) restores by yarn db:stop then yarn db:start (29 s on this host)"
  - "P4-DISTINGUISHABLE yes: the race of two pending accounts answers 500 (body code 23505, no error_code) against 403 otp_expired for an invalid token, so 179-19 builds A's emailTaken branch; reading a 500 as 'taken' is inferred and flagged"
  - "P9 null-removes: PL-09's strip of hetu and birthdate is built (179-09, 179-13)"

patterns-established:
  - "A row that restarts the shared stack (p8) is refused beside any other row"

requirements-completed: []

duration: about 18 min (19:39Z to 19:57Z)
completed: 2026-10-21
status: complete
---

# Phase 179 Plan 02: The probe of the auth service and the edge runtime Summary

**Every GoTrue v2.197.0 behaviour this phase builds on was observed once on the running local stack. P1 is held: the three-call email-change recipe completes on the new-address click, with a session and no mail. P5 is held: the invite recipe leaves no password hash. P8 shows the edge runtime comes back only by stop then start. The phase goes on.**

## Performance

- **Duration:** about 18 min (19:39Z to 19:57Z).
- **Completed:** 2026-10-21
- **Tasks:** 2 of 2
- **Files:** 2 created in the phase directory, and nothing outside `.planning/`.

## Verdict lines and the branch each selects

| Row | Verdict as printed | Plans | Branch |
|---|---|---|---|
| P1 | `P1: held` | 179-10, 179-14, 179-19 | The three-call recipe. 179-10 mails the new-address link. No fallback, no stop. |
| P2 | `P2: single-confirm`, `P2-VERIFYOTP: no-error no-session` | 179-19 | The guard: a verified `email_change` with no session is a failure. |
| P3 | `P3: first-refused` (`P3-SECOND: accepted`) | 179-10 | The third mail keeps "only the newest link works". A resend repeats all three calls. |
| P4 | `P4-ISSUE: 422 email_exists`, `P4-ISSUE-NEW: 422 email_exists`, `P4-RACE: 500 none`, `P4-INVALID: 403 otp_expired`, `P4-DISTINGUISHABLE: yes` | 179-10, 179-19 | 179-10 answers `in-use` on 422 `email_exists` at issue. 179-19 shows A's `emailTaken` without a session (PL-13). |
| P5 | `P5: held`, `P5-CONFIRMED: yes` | 179-13 | The invite recipe (J2). No stop. |
| P6 | `P6: action-link-token` | 179-10 | It mails the `action_link`'s `token`, never `hashed_token`. |
| P7 | `P7: survives` | 179-14, 179-19 | Recorded as a residual. No code change. |
| P8 | `P8: stop-start-needed`, `P8-SERVE: 2 s`, `P8-RESTORE: 29 s` | 179-05 | The wrapper restores by `yarn db:stop` then `yarn db:start`. |
| P9 | `P9: null-removes` | 179-09, 179-13 | PL-09's strip is built: `hetu: null` and `birthdate: null` on each sign-in. |

## Observed vs inferred

- **Observed** (every line in the two logs):
  - Each status, code, boolean, count and time.
  - P1:
    - The current token single-confirms: 200 with no session, the address unchanged.
    - The new token then completes the change with a session.
    - `email` becomes the typed address, `new_email` is empty and `email_confirmed_at` is unchanged.
    - No mail reaches either address within 3 s.
  - P4:
    - The race body's numeric `code` 23505.
  - P8:
    - The edge container is absent after the serve stops.
    - `yarn db:start` alone lists the edge runtime among "Stopped services", and the functions answer 503.
    - After stop and start, every function answers 200.
- **Inferred:**
  - P1: the browser-level landing of the mailed confirmation link through the frontend callback, until plan
    179-14's test runs.
  - P1: no late mail after the 3 s wait, which rests on the no-op hook.
  - P2: how the callback treats the single-confirm answer.
  - P3: the same result for later triples, and the link's lifetime.
  - P4: that a 500 from an `email_change` verification means "taken" and nothing else. Also what supabase-js
    surfaces as `error.code` for the race, which was presented raw.
  - P5: the invite call with `data` metadata.
  - P7: the frontend cookie session.
  - P8: the times on another host.

## Accomplishments

- **Precondition (both tasks):** checked read-only before work began.
  - The stack answered on 54321, 54322 and the mail catcher on 54324.
  - Every container was Up, the edge runtime included.
  - No `started` file was without its `ended` under `tests/e2e-runs/`.
  - Ports 5273, 8777 and 9443 were free.
  - The host was on AC power at 57 % and at 74 %, so the battery override was not needed.
- **Task 1:** `179-probe.mjs` is modelled on `178-probe.mjs`.
  - Usage and refusals:
    - It exits 2 with no argument, with `p10`, with p8 beside another row, while a run is in flight and above 28
      verifications.
  - Account helpers: placeholder as today, placeholder by the invite recipe, and real.
  - Tokens:
    - The new-address token is the `action_link`'s `token` parameter.
    - Verifications go through raw `POST /auth/v1/verify` or supabase-js `verifyOtp`, as each row says.
    - The password fact is read through `private.user_password_set` with `psql`.
  - Run `179-02-probe`:
    - Exit 0, every step made.
    - 20 link verifications, as announced.
    - Cleanup: 12 users found, 0 left.
- **Task 2:** the p8 row, run `179-02-p8`.
  - It generates the Edge file in a `mktemp` directory under `$TMPDIR` from `testKeys.ts`, the tracked template's
    SMTP keys and `DEFAULT_TOKEN_OPTS`. The directory was removed afterwards (0 left).
  - It serves `identity-callback`, which was ready after 2 s once the issuer was read back by name and OPTIONS
    answered 200.
  - Both db commands are filtered through `withhold-stack-keys.mjs`. The three db logs hold 0 key-shaped
    strings.
  - The run exited 0.
  - Then `179-stack-probe.sh` exited 0 ("every row OK or EQUAL"), with every container Up.
  - `179-PROBE-FINDINGS.md` holds the steps and verdict lines of each row, copied verbatim. A line-for-line check
    of its 95 step and verdict lines against the logs is clean both ways. It also holds the observed/inferred
    statement and `## What follows`.

## Task Commits

1. **a95211e60** `chore(179-02)`: a probe of the email-change, passwordless-creation and metadata recipes on the local stack (Task 1; the whole script, p8 included)
2. **978ba1ced** `docs(179-02)`: what the auth service does with an email change for a placeholder account, a passwordless recipe and the edge runtime's restore (Task 2; the findings)

## Verification

- **Task 1 `<automated>`:** `tests/e2e-runs/179-unit/179-02-t1-verify.sh`, taken byte for byte from the plan and
  confirmed by a fixed-string match against the plan.
  - Exit 0 with the script staged.
  - Run again at a95211e60: exit 0. Log, exit and head are kept beside it.
- **Task 2 `<automated>`:** `tests/e2e-runs/179-unit/179-02-t2-verify.sh`, byte for byte.
  - Exit 0 at 978ba1ced. That run includes a second `179-stack-probe.sh`, also 0.
  - The findings' verdict regexes each match exactly once, and P1 and P5 are `held`.
- **`179-verdict.mjs hygiene`:** PASS, 0 hits.

## Deviations from Plan

**1. The p8 row was committed with Task 1's commit**
- The whole script, the p8 row included, was written before the first run and committed in a95211e60. So Task
  2's commit holds the findings alone, and no p8 correction was needed.
- The p8 row was not run before Task 1's commit, and it ran unchanged in Task 2.

**2. [Rule 2 - Safety] p8 refuses to run beside another row**
- The row restarts the shared stack. A run that names p8 with any other row now exits 2, so no row's
  measurements can be split by a restart.
- The plan's usage line does not name this refusal.

**3. Extra summary lines beside the required ones**
- The probe also prints `P3-SECOND`, `P4-ISSUE-NEW`, `P4-INVALID` (named in the plan), and `P1-DIFFERED` and
  `P7-FAILED` (printed only when not held).
- None repeats a required form. The verify's exactly-one check passed.

**4. A slip caught before commit**
- The first write of the findings file carried a wrong P8 verdict line (`db-start-restores`).
- It was corrected to the printed `P8: stop-start-needed` before anything was staged. The line-for-line check
  against the logs then confirmed every step and verdict line.

**Total deviations:** 4 (1 commit composition, 1 Rule 2 refusal, 2 procedural). **Impact:** none on any
verdict. No row was run twice, and no measurement was re-taken.

## Threat Flags

None. The probe adds no application surface. Its logs and the findings hold no key, token, link, address or
claim value; a grep of the logs for key shapes counts 0.

## Items to report rather than edit

- `179-RESEARCH.md` § *RQ-1* says the race of two pending accounts gives "500 'Error confirm email' — not a
  distinguishable code". The probe observed 500 with no `error_code`. That is distinguishable from an invalid
  token's 403 `otp_expired`, and the raw body carries the numeric `code` 23505. The research file was not edited.
- `179-RESEARCH.md` § *Validation Architecture* → *Wave 0* names the prefix `rq179_`. The plan and the script use
  `r179-probe-`, as the plan states.
- The battery override was not used: both runs were on AC power.

## Next Phase Readiness

- No stop: P1 and P5 are held.
- Plans 179-05, 179-09, 179-10, 179-13 and 179-19 have their verdict lines in `179-PROBE-FINDINGS.md`.
- The stack is up on the repository's configuration: the stack probe exited 0 after p8 and again inside the
  Task 2 verify. No probe account remains.

## Self-Check: PASSED

- The files exist: `179-probe.mjs`, `179-PROBE-FINDINGS.md`, and the logs `179-02-probe.{log,exit}`,
  `179-02-p8.{log,exit}` and `179-02-stack-probe.{log,exit}` under `tests/e2e-runs/179-unit/`.
- Both commits are ancestors of HEAD: a95211e60 and 978ba1ced.
