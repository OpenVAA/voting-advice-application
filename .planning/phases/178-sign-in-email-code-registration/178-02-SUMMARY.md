---
phase: 178-sign-in-email-code-registration
plan: 02
subsystem: auth
tags: [probe, gotrue, recovery-link, magiclink, password-set, timing, supabase-auth, planning-drivers]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-01: the verdict script's hygiene scan, the base commit, and a stack that the baseline run left up and unreset"
  - phase: 174-invitations-grants-defined-in-advance
    provides: "174-fn-probe.mjs, the probe this one is modelled on, and private.user_password_set with the password_set member of claim_invitations"
provides:
  - "178-probe.mjs — rows p1, p2, p3, p4 and p7 as numbered steps on the local auth service; p5 and p6 are named and have no steps yet"
  - "178-PROBE-FINDINGS.md — one verdict line per row, every step as printed, and for each row what was observed and what is still inferred"
  - "P1: held — a recovery link verifies as recovery, stores no password, is single use; an unknown address gets 404 and no user"
  - "P2: held — a later link of either kind stops an unopened earlier one of the other kind, in both orders"
  - "P3: held, P3-IDP: set — the two-call recipe leaves an empty password through the first sign-in; an identity-provider-shaped account stores one"
  - "P4: held — after updateUser on a link session the earlier access token still reads password_set true; the token is not rotated"
  - "P7: difference — one status and one error code, three timings that do not overlap (6, 13 and 65 ms medians)"
affects: [178-04, 178-06, 178-07, 178-12, 178-13, 178-14, 178-19, 178-20, 178-22, 178-23]

actuals:
  tokens: 14706
  tasks: 2
  commits: 2
plan_head_before: a71b397c4d87186d04095a7c430f7ba984891eb6
plan_head_after: 518f5fc32cf2faa3e40bee8183828c5f169913c4

tech-stack:
  added: []
  patterns:
    - "A probe row is a measurement: PASS says a step was made and what was seen, FAIL that it could not be made; the verdict is a line of its own and a row that is not held still exits 0"
    - "A stored secret is compared by a digest the database computes and the script never prints, beside the boolean a later plan reads"

key-files:
  created:
    - .planning/phases/178-sign-in-email-code-registration/178-probe.mjs
    - .planning/phases/178-sign-in-email-code-registration/178-PROBE-FINDINGS.md
  modified: []

key-decisions:
  - "The probe prints no address at all: the plan admits addresses under its prefix, the execution rules admit none in a log line, and printing none satisfies both"
  - "P1 and P3-RECOVERY require the stored value itself to be unchanged, by a database-side digest, and not only the boolean fact"
  - "Every verdict line stands alone on its line; what differed is printed on a line of its own (P1-DIFFERED, P2-ACCEPTED, P7-ANSWERS)"
  - "The probe also refuses when a process listens on the E2E server's port: the stack is shared with another worktree whose runs are not under this tree"

patterns-established:
  - "Refusals of a script that reads tests/e2e-runs/ are seen on a scratch copy whose repository root is a scratch directory, so that no marker is written under the real one"

requirements-completed: []

coverage:
  - id: D1
    description: "The probe script: five rows of numbered steps, its usage errors and refusals, nothing that is a secret in its output"
    verification:
      - kind: other
        ref: "bash tests/e2e-runs/178-unit/178-02-t1-verify.sh (Task 1's automated block, byte for byte) — exit 0 at head ffd376a1c"
        status: pass
      - kind: other
        ref: "six refusal cases on a scratch copy: no run directory, a started with no ended two levels down, a listener on the port, a budget over its limit, and the two that go on — each as expected"
        status: pass
    human_judgment: false
  - id: D2
    description: "The five rows run once on the local stack, exit 0, with their verdict lines and observed-or-inferred sentences committed"
    verification:
      - kind: other
        ref: "node 178-probe.mjs p1,p2,p3,p4,p7 — exit 0; tests/e2e-runs/178-unit/178-02-probe.log"
        status: pass
      - kind: other
        ref: "bash tests/e2e-runs/178-unit/178-02-t2-verify.sh (Task 2's automated block, byte for byte) — exit 0 at head 518f5fc32"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-10-12
status: complete
---

# Phase 178 Plan 02: The First Probe — Recovery Links, Two Link Kinds, an Account with No Password and a Password Set on a Link Session — Summary

**One run of `178-probe.mjs` on the local stack (GoTrue v2.197.0), exit 0: P1, P2, P3 and P4 are held, an identity-provider-shaped account stores a password, and the password sign-in answers one status and one error code in three timings that do not overlap — about 6 ms for an unknown address, 13 ms for an account with no password and 65 ms for a wrong password.**

## Read this first

- **`P3: held` and `P3-IDP: set`.** The phase goes on, and plan 178-14 is not stopped before its Task 2.
- **`P7: difference`.** The body tells nothing; the timing tells all three cases apart on this host. Assumption A9 did not hold. Plan 178-23 writes the fourth item under `Known residuals`; nothing else changes. Details under "For later plans".
- **Nothing of the application was built.** Both commits are in the phase directory; `git diff --quiet $(cat 178-BASE) HEAD -- . ':(exclude).planning'` exits 0.
- **The run was made once.** No row was run again; no user of the probe remains.

## Performance

- **Duration:** about 12 min
- **Started:** about 2026-10-12T16:19Z (not recorded at the first step; the dispatch base commit is 16:17:47Z)
- **Completed:** 2026-10-12T16:31Z
- **Tasks:** 2 of 2
- **Files created:** 2, both in the phase directory; none modified

## Task Commits

1. **Task 1: the probe script** — `ffd376a1c` (chore): `178-probe.mjs`
2. **Task 2: the five rows run, and their verdicts** — `518f5fc32` (docs): `178-PROBE-FINDINGS.md`

Measured: `git rev-list --count a71b397c4..HEAD` was 2 when this file was written.

## Each task's verify command, with its real exit status

Each `<automated>` block was written byte for byte to a script file by a command that reads the plan, and run with `bash`; log, exit status and head are kept beside it under `tests/e2e-runs/178-unit/`.

| Verify | Run | Head | Exit |
|---|---|---|---|
| Task 1 (`178-02-t1-verify.sh`) | with `178-probe.mjs` staged, before its commit | `a71b397c4` | **0** |
| Task 1 | on the committed tree | `ffd376a1c` | **0** |
| Task 2 (`178-02-t2-verify.sh`) | on the committed tree | `518f5fc32` | **0** |

No stage of either block had a defect. Task 2's block cannot run before its commit (it requires the findings file to equal `HEAD`), so the forms of its seven verdict lines were counted by a command of my own beforehand: one line of each, and no `P4-FALLBACK` line.

**One thing the hygiene scan does not show.** Task 1's criterion reads "the script holds no `console.log` of a variable named for a key, a token, a link or a password: the hygiene scan exits 0". The scan exits 0, and it looks for environment-file and container forms, not for that. That the probe prints no secret rests on its construction — every line is built from statuses, sanitised error codes, booleans, counts and times — and on a search of the 66 lines it printed for an address, a JWT, a token-hash parameter or a URL, which found none.

## The verdict lines, as the script printed them

```
P1: held
P1-EXPIRY: 3600 s configured; not observed
P2: held
P2-TYPE: interchangeable
P3: held
P3-IDP: set
P3-RECOVERY: unchanged
P4: held
P7: difference
P7-ANSWERS: one status: true; one error code: true; each median inside the other two ranges: false
```

No `P4-FALLBACK` line exists: it is printed only when P4 is not held.

## Each row: what was observed, and what is still inferred

| Row | Observed on the running stack | Still inferred |
|---|---|---|
| P1 | For an account with a password and for a recipe account that had never signed in: a recovery link from the service role verifies as `recovery` to a session; the password fact and the stored value are the same before and after; a second presentation of each recovery token and of a sign-in token is refused, 403 `otp_expired`; a recovery link asked for an unknown address answers 404 `user_not_found` and leaves no user | The lifetime of a link (3600 is read from `config.toml`; nothing aged a link or compared the running service); a recipe account that *has* signed in; a recovery link opened in a browser through the callback |
| P2 | A later link of either kind stops an unopened earlier one of the other kind, in both orders; the later link still works; a sign-in token is accepted with the type `recovery` | That *opening* one link stops the other: step (iii) cannot tell it from (i), because the token it presents second was already superseded when the later link was issued. The single token slot as the cause is the research's reading of source, consistent with every step and shown by none |
| P3 | All six states: the recipe's account false before and after its first verification and true after `updateUser`; created with a password true; identity-provider-shaped true; a recipe account after a recovery verification false with the stored value unchanged | That an account `identity-callback` itself creates reads the same (the probe made the same `createUser` without the two metadata arguments and did not invoke the function); an `invite`-verified account and a helper-registered one, which stand on the research's citation |
| P4 | `updateUser` with a password answers 200 on a link session; the client's access token is the same token afterwards; `claim_invitations` with the token exactly as it was answers 200 with `password_set` true, nothing claimed or skipped | The cookie-level behaviour in a browser, until the tracer's test runs; the behaviour under `secure_password_change = true` |
| P7 | 27 answers, one status (400) and one error code (`invalid_credentials`); the nine times of each case lie wholly outside the ranges of the other two | The cause (a hash comparison only when the account stores one); that the difference survives a network; that the sign-in screen's action shows it (the action does not exist yet); a recipe account that has signed in |

P7's three triples: an address with no account 5.3 / 6.1 / 8.0 ms; a wrong password for an account that has one 62.7 / 65.1 / 67.9 ms; an account with no password 11.7 / 13.0 / 15.3 ms (least / median / greatest, nine each, interleaved, loopback).

## Which branch each later plan therefore takes

| Row | Plan | Builds |
|---|---|---|
| P1 held | 178-06 | `recovery_link_request` answers `recovery` for a grant-holder whether or not the account has a password |
| P1 held | 178-07 | the recovery arm mints with the type `recovery`; `mintRecoveryToken` is a dependency. The 404 for an unknown address that the plan calls a free second check was observed |
| P1 held | 178-19 | the callback is not edited |
| P1-EXPIRY 3600 | 178-20, 178-23 | the gate pins 3600 under `[auth.email]` and the stack probe compares the running service; the docs name it among the hosted settings |
| P2 held | 178-06, 178-10 | the shared slot and "only the newest" — built either way, and accurate |
| P3 held, P3-IDP set | 178-04, 178-12, 178-14, 178-22 | as planned; 178-14 is not stopped; J2 (a) stands |
| P4 held | 178-14 | the set-password gate is passed by a rerun of the loads; no `refreshSession()`, no full page load; `supabaseDataWriter.ts` is not edited for the fallback |
| P4 held | 178-19 | the reset page leaves by a client-side navigation that reruns the loads |
| P7 difference | 178-23 | a fourth item under `Known residuals`, with the three triples |

## The run's numbers

- **Password sign-ins:** 27, all of row p7 — the limit is 30 in five minutes, budgeted at 28.
- **Link verifications:** 14, in rows p1 to p4 (6, 5, 2, 1) — a separate limit of 30 in five minutes, budgeted at 28. The two were never summed.
- The script announced 27 and 14 before its first step and counted 27 and 14 calls made (`PASS count`).
- **The configured lifetime of a link:** `P1-EXPIRY: 3600 s configured; not observed`.
- **Cleanup:** `PASS cleanup — 14 user(s) of the probe found; 0 removal(s) refused; 0 left; 0 invitation(s) naming an address of the probe`. A read of the database afterwards agrees: 2 users, as before the run; 0 with the probe's prefix; 0 invitations, as before.
- **Battery:** 75 % before the run, 74 % after.

**Items PL-16 and PL-27 are unanswered by the operator and were built at their recommended options:** P7 is measured at the auth service's own password sign-in with nine attempts a case, not through the sign-in screen's action; and the lifetime of a link is read and recorded, to be pinned by plan 178-20, not waited out.

## Decisions Made

- **Client library for the auth calls, raw requests for what is timed or token-bound.** `generateLink`, `createUser`, `verifyOtp`, `updateUser` and `getSession` go through `@supabase/supabase-js` 2.117.2, each presentation on a client of its own with an in-memory session, because P4 asks what that client does with its token. The password sign-ins of p7 and both reads of `claim_invitations` are plain requests: the first so that the time is the service's, the second so that the token sent is unambiguously the earlier one.
- **Rows run in the order p1, p2, p3, p4, p7 whatever order they are named in**; a row named twice is a usage error.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] The stored value is compared, not only the boolean**
- **Found during:** Task 1
- **Issue:** The plan reads the fact "through `private.user_password_set`, one boolean per read", and its truth for P1 says "the stored password is the same before and after". For an account that has a password the boolean is true before and after whatever a recovery verification writes, so the boolean alone cannot show the truth (threat T-178-08).
- **Fix:** Beside each boolean the database computes an eight-character digest of the stored value; the script compares the two digests and prints only "the stored value is unchanged: true|false". `P1: held` and `P3-RECOVERY: unchanged` require both the fact and the stored value to be unchanged. The digest never leaves the process.
- **Files modified:** `178-probe.mjs`
- **Commit:** `ffd376a1c`

### Other departures, none of them a fix

2. **No address is printed.** PROH-178-05 admits "addresses under its own prefix"; `178-EXECUTION-RULES.md` § *Comments, titles and logs* admits no address in a log line or a file under the phase directory. The two differ; printing none satisfies both, so I did not stop. Accounts are named by their kind.
3. **The access token's digest is compared and not printed.** The plan says to record a short digest; the line states whether it differs.
4. **What differed is on a line of its own.** The plan writes "`P1: not held` with the step that differed" and "`P7: difference` with the three triples"; Task 2's verify needs each verdict line alone on its line. The script therefore prints `P1-DIFFERED:`, `P2-ACCEPTED:` and `P7-ANSWERS:` as separate lines, and the triples as p7's step lines. A row with a step that could not be made prints `<row>: not measured`, which matches no verdict form.
5. **One more refusal.** Beside the `started`-without-`ended` search the plan names, the probe refuses when a process listens on the E2E server's port (`FRONTEND_PORT`, default 5273), as the gate driver does: the stack is shared with another worktree whose run markers are not under this tree, and 27 sign-ins from one address of origin could turn its run red.
6. **The in-flight search has no age limit**, as the plan words it; the gate driver's has ten minutes. No orphan marker is on the tree today. A void or interrupted run that leaves a `started` with no `ended` would make the probe refuse until someone looks — plan 178-20 runs it again.

## Issues Encountered

None. The first run exited 0; the script was not corrected after its commit.

## Not done, or not verified

- **"Whether opening one stops the other" (the plan's truth for P2) is not separately measured, and cannot be on this service.** Step (iii) ran as written and its second presentation was refused, but (i) already explains that refusal. No plan rests on the difference: the shared slot and "only the newest" hold either way.
- **The reverse of p2 (iv)** — a recovery token presented as `magiclink` — was not a step of the row and was not made.
- **Whether the two limits bind on the local stack** was not observed: no call was answered 429.
- **The `started`-without-`ended` refusal and the unsearchable-directory refusal were seen on a scratch copy**, not on this tree, because nothing may be written and removed under `tests/e2e-runs/`. The listener refusal was seen on this tree, with `FRONTEND_PORT` pointed at a port that is in use.
- **The budget refusal was seen on a scratch copy with the limit lowered to five**; no combination of today's rows passes 28.
- **`.planning/WINDOWS.md` was not written to.** There is no stub, no skipped test and no verify that was not run; the departures above are recorded here only.

## The state the local stack is left in

Not reset and not restarted. No E2E run in flight; nothing listens on port 5273. `auth.users` holds 2 rows, as before the run, none with the probe's prefix; `public.invitations` holds 0, as before. The database is otherwise what the baseline's `--no-db-reset` full run left (pgTAP test 238 of `39-invitations.test.sql` would be red on it until the next reset, the known finding). The auth service received 27 password sign-ins and 14 link verifications between 16:26:43Z and 16:26:48Z; the five-minute windows that hold them end at 16:31:48Z, before any later plan's first run.

## For later plans

- **178-23 — `P7: difference`; assumption A9 did not hold.** The execution rules' probe table assumed that "the password sign-in's timing does not tell an unknown address from a wrong password or an account with no password". It tells all three apart here: medians of 6.1, 13.0 and 65.1 ms with ranges that do not overlap. The plan's conditional fourth item under `Known residuals` is therefore written, with the three triples from `178-PROBE-FINDINGS.md` § *Row P7*. Say what was measured and where: nine attempts a case, interleaved, on the loopback interface of one host, at the service's own endpoint. The smaller gap — an account with no password against an unknown address, about 7 ms — is the one most likely to vanish behind a network; the larger is not.
- **178-13 — the sentence in its `must_haves` stands, and now has a content.** "What an outsider can learn from its status, body or timing is what the service itself tells" is true, and what the service tells by timing is which of the three cases an address is in. The unit case that pins "no step before the service's sign-in" is the right guard; a test or a text that claims the sign-in screen's timing is uniform would be false.
- **178-14 and 178-19 — `P4: held`; take the first branch.** No `refreshSession()` in `_setPassword`, no full page load. What is still inferred is the cookie half: the probe's client kept its session in memory. The tracer's test is the first observation of the browser.
- **178-04, 178-08, 178-14, 178-19, 178-23 — a comment in `supabaseDataWriter.ts` that the probe contradicts.** Above the `return` of `_setPassword` a comment says "`auth.updateUser({ password })` rotates the access token". The probe saw the opposite on a Node client with an in-memory session against GoTrue v2.197.0: the client's access token was the same token after the update, and the earlier token was still answered. Each of those five plans lists the file; the first that touches that comment should bring it in line with what was measured, or say that a browser client was observed to differ. I did not edit it: the file is outside this plan.
- **178-06 and 178-07 — `P1: held`.** A grant-holder with no password who asks for recovery is sent a recovery link, lands on the reset page with a session and still has no password until the page sets one (`P3-RECOVERY: unchanged`): if that user leaves the reset page without saving, the set-password gate still meets them. A recovery link for an address with no account is refused by the service itself, 404 `user_not_found`, and creates no user.
- **178-06, 178-10 — a superseded token and a spent token are refused alike**, 403 `otp_expired`. A screen cannot tell "this link was replaced by a newer one" from "this link was already used" by the service's answer.
- **178-19 — `P2-TYPE: interchangeable`.** The service accepts a sign-in token presented with the type `recovery`. With the callback verifying a link "as its own type", the `type` parameter of a link's address decides the landing and is not checked against how the token was minted: whoever holds a sign-in link can land on the reset page by rewriting it. That gives them nothing the link did not already give — a session of the same account, which can set a password without the current one under `secure_password_change = false`, the residual plan 178-23 already lists — but the reset page's load should not read "arrived with `type=recovery`" as "asked for a recovery". Observed: the service's acceptance. Inferred: the consequence for the callback, which the probe did not drive.
- **178-20 — adding rows p5 and p6.** `ROWS` in `178-probe.mjs` maps a row to `{ signIns, verifications, run }`; `p5: null` and `p6: null` are what makes naming them a usage error, and Task 1's verify of this plan (`node 178-probe.mjs p5` exits 2) stops holding the moment they are written. A row prints its steps through `recorder(row)` — `act(text, made)` for a step with no assumption, `observe(text, made, asAssumed)` for one set against an assumption — and its verdict with `console.log`. Declare a new row's sign-ins and verifications truthfully: the closing `count` step fails the run when the calls made differ from the calls announced. The cleanup deletes every user whose address begins with `r178-probe-`, which includes the stack probe's `r178-probe-stack-` users; a row that must keep an account across two runs (the plan's `p5pre`) needs an address outside that prefix or a cleanup that spares it.
- **178-20 — `P1-EXPIRY` is 3600**, read from `[auth.email]` by `configuredOtpExpiry()`; the running service's value has not been compared with it by anything yet.
- **Any plan that runs the probe again:** it refuses while a `started` file without an `ended` exists anywhere under `tests/e2e-runs/`, at any age, and while anything listens on the E2E port. Run it between E2E runs, not beside one.
- **Power:** 74 % and discharging when this plan ended; one full E2E run costs about 13 points.

## Prohibitions

- **PROH-178-05:** held — the 66 lines the probe printed hold no key, token, token hash, link, password or address; the access token is compared by a digest that is not printed; `hygiene` exits 0 over the seven scripts.
- **PROH-178-06:** held — no row was skipped or softened; `P7: difference` is written as measured; no fallback of a later plan was taken up; the one truth that the steps cannot show (opening against issuing, P2) is written as not measured.
- **PROH-178-07:** held — the probe ran with no E2E run in flight and nothing on the E2E port; 27 sign-ins and 14 verifications, each under its own limit of 30.

## Threat Flags

None. No file outside `.planning/` changed.

## Known Stubs

None.

## Next Phase Readiness

Ready for plan 178-03. Every claim about the auth service that a later plan builds on has a verdict line on the tree; no row stops the phase; one residual (P7) is handed to plan 178-23 as its plan already provides.

## Self-Check: PASSED

- FOUND: `.planning/phases/178-sign-in-email-code-registration/178-probe.mjs`
- FOUND: `.planning/phases/178-sign-in-email-code-registration/178-PROBE-FINDINGS.md`
- FOUND: `ffd376a1c`, `518f5fc32` (both ancestors of `HEAD`)
- The four kept exit statuses read 0: the probe's run, Task 1's verify staged and committed, Task 2's verify.
