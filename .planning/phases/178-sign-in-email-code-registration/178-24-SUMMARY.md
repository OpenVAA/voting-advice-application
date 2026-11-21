---
phase: 178-sign-in-email-code-registration
plan: 24
subsystem: closing-gate
tags: [closing-gate, e2e, bank-auth, review, searches]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-23: the predecessor run 178-23-close (530 tests, 123 projects) and the legacy path removed; plans 178-01 to 178-22: everything the closing gate judges"
provides:
  - "the closing evidence of Phase 178 on one head (062127cae): seventeen gate rows, one full run (178-24-final, 530 of 530 in 123 projects), the two bank-auth projects, the restored stack"
  - "the requirement-to-test map, the operator's round as built, the flagged assumptions, the residuals and the notes for Phase 179"
affects: [179]

actuals:
  tokens: 11700
  tasks: 3
  commits: 0
plan_head_before: 062127caeb27a490f3f4bc4ba8d9272e90401749
plan_head_after: 062127caeb27a490f3f4bc4ba8d9272e90401749

tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - .planning/phases/178-sign-in-email-code-registration/178-24-SUMMARY.md
  modified: []

key-decisions:
  - "The review of the whole phase difference found no defect; no code commit was made, so every closing run is of head 062127cae"
  - "Task 1's registrationKey stage was restated with ':!*.test.ts' (the execution rules' negative-search form, as 178-23 did); both statuses recorded"
  - "Task 2's baseline comparison was restated with --except perm-answers-locked=1: plan 178-16 moved the answers-lock case into perm-answers-locked.spec.ts (4 to 5 tests), a move the orchestrator accepted and the plan's list of sums omits. Ruling 4 makes this the signal; the orchestrator decides"
  - "The pgTAP row ran on the pg_prove image the orchestrator pulled from Docker Hub and tagged under the ECR name; no pull was attempted"

requirements-completed: [REG-01, REG-02, REG-03, REG-09, REG-10, REG-11, REG-13, FIX-01]

duration: "2026-10-16 13:40Z to 14:30Z"
completed: 2026-10-16
status: complete
---

# Phase 178 Plan 24: The Closing Gate — Summary

**On one head, `062127cae`, every gate row is green (seventeen of seventeen, pgTAP 45 files and 2435 tests), the closing run
`178-24-final` is green (530 of 530 in 123 projects, equal project by project to `178-23-close`), both opt-in bank-auth projects
are green each alone, and the stack is back on the repository's configuration. The review of the whole difference found nothing to
fix. Two verify stages were restated, each for a figure the plan could not have known; both statuses are below.**

## Read this first

- **Complete.** Three tasks; no code commit (the review found no defect); this summary is the plan's one commit.
- **Task 1, restated stage:** the `registrationKey` search as written exits 1 on `registrationGuard.test.ts`, the test file 178-23
  kept on purpose. Restated with `':!*.test.ts'`, it exits 0.
- **Task 2, restated stage — for the orchestrator's decision (ruling 4):** the baseline comparison as written fails on
  `perm-answers-locked`: 5 tests in `178-24-final` against 4 in the baseline. Plan **178-16** moved the answers-lock case of the
  registration addresses into `perm-answers-locked.spec.ts` ("4 -> 5 tests", item 14 of the open items below; accepted by the
  orchestrator in "After 178-16"), and the plan's list of sums has no entry for it. With `--except perm-answers-locked=1` added the
  chain exits 0 and every one of the 123 projects holds. The figure was not edited to fit; it is reported.
- **The pgTAP image** came from Docker Hub (`supabase/pg_prove:3.36`, image id `637dc4f340fe`, tagged
  `public.ecr.aws/supabase/pg_prove:3.36` by the orchestrator). The pgTAP row's log names no pull. Its identity with the ECR image
  is assumed, not compared.
- **No run was void; no run was red.** No Sleep entry fell inside any run window.

## Task 1: the whole phase read once

`git diff 06d81c75e..062127cae` outside `.planning/`: 287 files, 23,910 insertions, 2,709 deletions. Read by directory: the schema
and `config.toml` whole; the Edge Function whole (contract, index, link issue, link builder); the server side of the frontend whole
(hooks, the gate table, route keys, the registration guard, the callback, every new `+page.server.ts`, the protected layout's load,
the session admission module, the adapter-boundary allowlist); the sign-in, code sign-in, forgot-password and password-reset pages
whole; the rest of the components, contexts, catalogues and tests by targeted search.

| Checklist item | Outcome |
|---|---|
| Solves what it set out to | Yes: each requirement is shown by named tests below |
| OWASP | No injection surface added (every SQL function `search_path = ''`, schema-qualified; no dynamic SQL); open-redirect: `redirectTo` validated once by `safeRedirectTarget` in the action, the login screen passes it on unread; credentials: the code travels in a hidden form field, never an address; the recovery operation answers before its work |
| Code style, no `any` | No `any` added in the files read; types are explicit |
| Repetition | The claim-and-refresh pair is written once (`claimAndRefresh`); the grant-holder test once (`private.email_holds_grant_in_project`); the mode condition once (`private.invitation_mode_allowed`); the link issue's order once (`issue()` with two `settle` callbacks) |
| Documented | Every new exported symbol and component read carries TSDoc or a component docblock; every new SQL function a header |
| Docs updated | By 178-23 (docs site, two READMEs, `tests/README.md`, two skills) |
| Tracking events | Not applicable: the phase adds no voter-facing action the analytics track |
| Svelte component guidelines | Runes, props from co-located `.type.ts`, `concatClass`; reactive accessors read as `contestantCtx.X` |
| Errors handled and logged | Each failure path logs by message only (`log.error('Failed to save the password', { err })`, the guard's read failure, the protected layout's missing fact); a refused sign-in is logged as "Invalid login credentials" with no address |
| Dependents not unduly affected | The full run: 530 of 530, every project equal to `178-23-close` |
| WCAG A/AA, keyboard and screen reader | Axe: 29 entry scans, 30 contestant scans (six new), three closed-project scans, both themes, all green; keyboard and screen-reader walk is a backstop, not made |
| Comment hygiene | `yarn assert:comment-hygiene` 0; `hygiene` verdict 0; a search of the added lines for plan ids, `.planning/` and history words found none in code comments (the hits were mail text and test titles that describe behaviour). The adapter-boundary allowlist's comment still names "Phase-158" dispositions and "158-HARD" labels; the phase shortened that comment and removed its `157-15`/`157-16` references, the rest predates it |
| Commit history, `[db]` tags | The history keeps fix-of-self pairs the phase recorded (`f7212f546`/`ff7c4d150`, `250e4215b`/`5ad63f88d`); squashing them is the branch's ship step, not this plan's |
| Supabase backend | New `SECURITY DEFINER` functions (`caller_password_set`, `user_password_set`, `registration_mode_allowed`, `recovery_link_request`) each set `search_path = ''`; grants: `caller_password_set` to `authenticated` alone, `recovery_link_request` to `service_role` alone, `send_email_hook` to `supabase_auth_admin` alone, the rest to no API role, each with its own `REVOKE` after the blanket grant. What a caller who is not entitled learns: nothing — the service-role functions are unreachable by an API role, `caller_password_set` answers for `auth.uid()` only. No new table, so no RLS or index item |
| Supabase adapter | `getBasicUserData` reads `password_set` from `get_user_entities` and throws on a non-boolean; `safeGetSession()` in the password-reset load and the hook |
| Edge Functions | `request-recovery` builds its answer before any work; the mint for a recovery creates no account; log lines carry an error's name and code only |
| D-09 (no answer tells whether an address has an account) | Link and recovery requests: 200 `{"accepted":true}` always; sign-in: one 400 for an unknown address, a wrong password and no password; code sign-in: one 400 for every refusal including a mode that is off; logs say "Invalid login credentials" with no address. The 403 "nothing to edit" needs a correct password |
| No code, token or password in a URL, storage, a log or an error | No `localStorage`, `sessionStorage`, cookie, `searchParams.set` or history-state write in the added frontend lines; the code is a hidden field of a POST body; the entry flow is a private `$state` field |
| No numeric spacing class | The one hit of a numeric-looking class in the added markup is `min-w-0` (a sizing utility); spacing uses `xs`–`xxl` |

**Findings: none.** No commit was made.

### The searches of D-24 (on `062127cae`, tracked files, outside `.planning/`)

| Name | Result |
|---|---|
| `toCallbackUrl`, `checkRegistrationKey`, `CheckRegistrationData`, `resetPasswordForEmail`, `ContestantAppSetPassword` | no hit anywhere, the spike-findings skill included |
| `newUserEmail` | two hits, both in the spike-findings skill's record (PL-25): `.claude/skills/spike-findings-voting-advice-application-gsd/references/consumer-migration-codemod.md:106` and `.../sources/009-store-codemod-feasibility/spike-009-store-codemod.mjs:73` |
| `registrationKey` | `apps/frontend/src/routes/contestant/preregister/(authenticated)/email/+page.svelte:30` (Phase 179's tree) and `apps/frontend/src/lib/server/contestant/registrationGuard.test.ts:185` (a test that the guard's redirect drops the parameter; kept by 178-23 as a test file outside a negative search) |

### Task 1's verify

| Run | Script | Head | Exit | Note |
|---|---|---|---|---|
| as written | `tests/e2e-runs/178-unit/178-24-t1-verify.sh` | `062127cae` | **1** | the `registrationKey` stage printed `registrationGuard.test.ts` |
| restated | `178-24-t1-verify-r2.sh` | `062127cae` | **0** | that stage with `":!*.test.ts"`; every other stage byte for byte. `scope` PASS, `hygiene` PASS (7 scripts, 24 plans, 0 hits), schema-migration parity 0 (8953 lines each), RPC nullability 0, comment hygiene 0 (2078 files), i18n namespaces 0 (738 keys) |

## Task 2: the closing gate on one tree

### The gate rows — `tests/e2e-runs/178-gates/178-24-final`, head `062127cae`, 13:54:46Z to 13:58:43Z

| Row | Status | Seconds | Numbers |
|---|---|---|---|
| typecheck | 0 | 20 | |
| lint (with the app-name and auth-configuration gates) | 0 | 47 | |
| db-reset | 0 | 29 | |
| types-regen | 0 | 2 | |
| types-clean | 0 | 0 | no difference in `database.ts` |
| pgtap | 0 | 6 | 45 files, 2435 tests, `Result: PASS`; no image pull |
| sql-lint | 0 | 4 | |
| integration | 0 | 4 | 31 of 31 |
| unit | 0 | 76 | frontend 4961 passed, 31 skipped (229 files, 1 skipped); supabase functions 678; dev-seed 1080; data 318; app-shared 148; matching 43; llm 49; argument-condensation 31; filters 22; question-info 22; core 8 |
| check-frontend | 0 | 10 | |
| build | 0 | 15 | |
| format | 0 | 20 | |
| docs-links | 0 | 1 | |
| name-gate-self-test | 0 | 1 | |
| auth-config | 0 | 0 | |
| auth-config-self-test | 0 | 0 | |
| stack | 0 | 2 | password length 8, `otp_expiry` 3600, the send-email hook enabled with its URI, `request-recovery` served, `SITE_URL`/`SMTP_*` equal to the template: every row EQUAL |

`node $P/178-verdict.mjs gates 178-24-final`: **PASS**, 17 of 17 rows, not stale, no Sleep entry. Power: AC, 82 % to 86 %.

### The full run — `tests/e2e-runs/178-e2e/178-24-final`

| Head | Totals | Window | Docker VM free before | Power |
|---|---|---|---|---|
| `062127cae` | **530 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run; 123 projects | 13:59:08Z to 14:11:57Z (12.8 min) | 23.76 GiB | AC, 86 % to 95 %; no Sleep entry |

- **Against `178-23-close`:** 123 compared, 0 not as expected — **PASS**. The eight named projects present and green
  (`contestant-email-registration` 11/11, `contestant-code-registration` 6/6, `contestant-password-recovery` 4/4,
  `contestant-entry-scan` 29/29, `contestant-entry-phone` 20/20, `contestant-a11y-scan` 30/30, `perm-closed-project` 18/18,
  `contestant-journey` 1/1); each of the four title counts is 2, all passed.
- **Against the baseline `178-01-baseline` (444 in 116 projects), as written:** 123 compared, **1 not as expected** —
  `perm-answers-locked` 5 against 4. **FAIL.** The closed-project figure of the chain is 7 (`178-18-close` 18 less `178-14-close`
  11), and it holds.
- **Restated with `--except perm-answers-locked=1`:** 123 compared, 0 not as expected — **PASS**. The sum: 444 + 11 + 6 + 4 + 29 +
  20 + 6 + 1 + 1 + 7 + 1 = 530.
- **Skipped:** 0, equal to the baseline's 0.
- **Heads:** the gate run and the full run both record `062127cae`.

| Verify | Script | Exit |
|---|---|---|
| Task 2, as written | `tests/e2e-runs/178-unit/178-24-t2-verify.sh` | **1** (the baseline stage, `perm-answers-locked`) |
| Task 2, restated | `178-24-t2-verify-r2.sh` | **0** (that stage with `--except perm-answers-locked=1`; every other stage byte for byte) |

**The chain of closing runs**, read from each run's `summary.json` (no run failed, flaked, skipped or did not run a test):

| Run | Head | Total | Projects | Moved against the previous run |
|---|---|---|---|---|
| `178-01-baseline` | `89c842067` | 444 | 116 | |
| `178-03-close`, `178-05-close`, `178-07-close`, `178-11-close`, `178-13-close` | | 444 each | 116 | none |
| `178-14-close` | `3a9e37b49` | 445 | 117 | `contestant-email-registration` +1 |
| `178-15-close` | `2ebf42846` | 445 | 117 | none |
| `178-16-close` | `eefc962ee` | 452 | 117 | `contestant-email-registration` +2, **`perm-answers-locked` +1**, `perm-closed-project` +4 |
| `178-17-close` | `928f792da` | 464 | 118 | `contestant-code-registration` +6, `contestant-email-registration` +6 |
| `178-18-close` | `491f7bdde` | 469 | 118 | `contestant-email-registration` +2, `perm-closed-project` +3 |
| `178-19-close-r2` | `5ad63f88d` | 473 | 119 | `contestant-password-recovery` +4 |
| `178-20-close-r2` | `6c22aa9a1` | 473 | 119 | none |
| `178-21-close-r2` | `7a413bb2f` | 502 | 120 | `contestant-entry-scan` +29 |
| `178-22-close` | `4fe87f913` | 530 | 123 | `contestant-a11y-scan` +6, `contestant-entry-phone` +20, the passwordless setup and teardown +1 each |
| `178-23-close` | `397e2b0c3` | 530 | 123 | none |
| **`178-24-final`** | **`062127cae`** | **530** | **123** | **none** |

**The dev-server log** (pattern counts, same patterns for each run): Svelte compiler or plugin warnings 0 (baseline 0,
`178-23-close` 0). Error-pattern lines 187 (baseline 158, `178-23-close` 216), of which 120 (baseline 115) are the file
watcher's "requires a full rescan" notices and the rest are refusals and save failures the specs provoke (the nomination editor's,
"Contestant sign-in failed: Invalid login credentials" for the oracle and failed-sign-in scans, two "A DataProvider returned an
invalid result"). The standing `Input.svelte` "reading 'map'" error appears once, as in every run.

**The auth budget** (`178-18-auth-peaks.sh` over the run window): the suite's origin made 37 password sign-ins (30 × 200, 7 × 400),
**peak 25 in five minutes** of 30; 20 link verifications, peak 20. Unchanged from `178-23-close`.

## Task 3: the two bank-auth projects, the stack restored

`bash $P/178-bankauth.sh 178-24`, started at 14:12Z after the full run had ended, with ports 5273, 8777 and 9443 free and no run in
flight; host on AC (96 %). **Driver exit 0.**

| Run | Head | Totals | Its project | Docker VM free before | Verdict |
|---|---|---|---|---|---|
| `178-e2e/178-24-bank-auth` | `062127cae` | 8 passed of 8, 0 failed, flaky, skipped or did not run; 3 projects; 6 s | `bank-auth` 6/6 | 23.68 GiB | `e2e 178-24-bank-auth --allow-slice --expect-project bank-auth`: **PASS** |
| `178-e2e/178-24-bank-auth-journey` | `062127cae` | 457 passed of 457, 0 failed, flaky, skipped or did not run; 107 projects (the journey's dependency chain); 10.8 min | `bank-auth-journey` 1/1 | 23.68 GiB | `e2e 178-24-bank-auth-journey --allow-slice --expect-project bank-auth-journey`: **PASS** |

- **The function environment per run** (`_drivers/178-24.bankauth.edge-env.txt`): `bank-auth` served `identity-callback` with the
  issuer `https://test-idp.example.com`; `bank-auth-journey` with `https://127.0.0.1:9443`; each answered OPTIONS 200 before its run.
- **No Sleep entry** in either window; neither run void.
- **What the three plans of ruling 2 changed, met by these runs:** neither spec opens the login screen or the selector. The journey
  enters through `preregister/` (Phase 179's tree), and its chain of 107 projects includes this phase's specs, which ran green
  under the bank-auth function environment; the seam spec posts to the function directly. Nothing to diagnose.
- **The restore** (`_drivers/178-24.bankauth.restore.txt`, 14:24:55Z to 14:25:26Z): `yarn db:stop` exit 0, `yarn db:start` exit 0,
  the edge-runtime container running, OPTIONS 200 for `account-access`, `identity-callback` and `send-email`, the restored
  container's issuer `https://openvaa.test.idura.broker` (neither of the driver's two; where the restored value is set was not
read), ports 5273, 8777 and 9443 free; then the stack probe:
  sign-up disabled and confirmations on (container, settings and two live probes `422 signup_disabled`), and every compared row
  EQUAL; probe exit 0. Docker was not restarted; only the `openvaa-local` containers were touched.
- **The restored stack's rows:** `bash $P/178-gates.sh 178-24-restored --rows auth-config,stack` exit 0;
  `gates 178-24-restored --rows auth-config,stack`: **PASS**, not stale, no Sleep entry.
- **Re-seeded:** `yarn db:seed:default` exit 0 (752 rows: 327 candidates, 8 organizations, 377 nominations, 26 questions, 2
  alliances, 5 constituencies, 1 election, 4 categories, 1 settings row). **What the local database then holds**, read by
  `psql` in the database container: the default project `…0001` with 328 candidates, 8 organizations, 377 nominations, 26 questions
  and no invitation; the E2E project `…00e2` and the project `…05c1` with none of these (the suite's teardowns ran); 2 users in
  `auth.users`; 67 rows in `private.invitation_link_witness`, so pgTAP file 39 test 238 is red until the next reset (the known
  finding).

**Every closing run is of one head:** the gate set `178-24-final`, the full run `178-24-final`, `178-24-bank-auth`,
`178-24-bank-auth-journey` and the restored rows `178-24-restored` all record `062127cae`, tree-equal to HEAD outside
`.planning/`. Nothing outside `.planning/` was committed during the plan.

| Verify | Script | Exit |
|---|---|---|
| Task 3, as written | `tests/e2e-runs/178-unit/178-24-t3-verify.sh` | **0** (both bank-auth verdicts, the heads, the restored rows, the final run against `178-23-close` once more, the summary's names) |

`commits: 0` is `git rev-list --count 062127cae..HEAD` when this summary was written: the plan made no code commit, and this
summary's own commit is the plan's one commit.

## The requirement-to-test map (titles from `178-24-final`, every one passed)

| Requirement | Project | Tests |
|---|---|---|
| **REG-01** the login screen's two entries | `contestant-email-registration` | "the login screen > entry: the login screen offers both entries, and "Sign in with email" carries a deep link's target"; "the login screen > notice: a mailed link opened a second time lands on the login screen with its sentence" |
| | `perm-closed-project` | "an empty matrix offers sign-in only, names the app for candidates and refuses every registration address"; "the code mode offers Register on the login screen, and the registration page shows the code field directly"; "the identity provider mode offers Register on the login screen, and the registration page leads to the pre-registration start"; "while answers are locked > the login screen says so to an anonymous visit" |
| | `perm-answers-locked` | "login: answersLocked surfaces login-answers-locked-info on /en/contestant"; "registration: every registration address leads to the login page while answers are locked" |
| **REG-02** the link button for a user with no password | `contestant-email-registration` | "tracer: an invited candidate asks for a link on the sign-in screen, opens the mailed link, sets a password and reaches the candidate's home"; "link button: with no usable address nothing is sent"; "oracle on sign-in: an unknown address, a wrong password and an account with no password get one sentence and one status" |
| | `contestant-code-registration` | "used code, link: "I have not set a password yet" mails the claimant, and the screen shows no address" |
| **REG-03** the selector and its single-mode form | `contestant-email-registration` | "register: an invited candidate registers by email through the mode selector"; "what the registration screen does not send > validation: Continue with no mode chosen, and with an empty or an unusable address, sends nothing" |
| | `perm-closed-project` | "the code mode offers Register on the login screen, and the registration page shows the code field directly"; the scans `contestant-register-single-mode` and `contestant-register-identity-provider`, light and dark |
| | `contestant-entry-scan` | `entry-register`, light and dark |
| **REG-09** the three outcomes of a code | `contestant-code-registration` | "register: an invited organization registers with a code" (valid); "used code: the same code leads to the password sign-in, and signs in" (used); "unconfirmed: a code no project holds is told one sentence, twice" (unknown); "asked again on the code path: a corrected address inside the count adds one sentence"; "reload: the two screens a code leads to, opened with nothing held, end on the registration page" |
| **REG-10** email registration, "email sent" and resend | `contestant-email-registration` | "register: an invited candidate registers by email through the mode selector"; "oracle: an invited and an uninvited address meet the same "email sent" screen, and only the invited one is mailed"; "resend: "Send again" is unavailable for the count, then repeats the request"; "asked again: the same address asked a second time inside the count adds one sentence"; "reload: the "email sent" screen reloaded ends on the login screen, and holds nothing of what was typed" |
| **REG-11** the set-password gate | `contestant-email-registration` | the tracer and "register: …" (each passes the gate) |
| | `contestant-password-recovery` | "first-time user: an address with an invitation only is mailed the sign-in link, and is asked to choose a password" |
| | `contestant-a11y-scan` | `contestant-set-password-gate` and `contestant-set-password-gate-invalid`, light and dark |
| | `contestant-entry-phone` | "with no password, 320px wide > phone 320: the set-password view does not overflow, and the address stays inside it" and its 390 px twin |
| **REG-13** the shared pieces and their autofill hints | gate row `unit` | `EmailField.svelte.test.ts` (19) "carries the name, the autocomplete token and the test id its caller gives, on the control"; `PasswordSignIn.svelte.test.ts` (15) "declares a required password control named `password` that holds the current password"; `PasswordSetter.svelte.test.ts` (33) "is the form's first control: a read-only user name that is no tab stop and is not rendered", "have different names and both ask for a new password", "state the rule list's own rules to the browser on the first field alone"; `RegistrationCodeField.svelte.test.ts` (15) "is a text control named `code` that a browser offers nothing for and does not correct"; `PasswordField.svelte.test.ts` (11); `EmailEntry.svelte.test.ts` (24); `RegistrationModeSelector.svelte.test.ts` (23); `EmailSentPanel.svelte.test.ts` |
| | `contestant-entry-scan` | the 28 entry scans (`entry-login`, `entry-sign-in`, `entry-sign-in-failed`, `entry-sign-in-email-required`, `entry-register`, `entry-register-email`, `entry-register-code-unconfirmed`, `entry-email-entry`, `entry-email-entry-mismatch`, `entry-code-sign-in`, `entry-email-sent`, `entry-email-sent-code`, `entry-email-sent-recovery`, `entry-forgot-password`, each light and dark) and "menu: a signed-out visitor is offered Sign in, Register and Forgot Password?" |
| **FIX-01** the recovery link opened in a browser that never asked for it | `contestant-password-recovery` | "recovery: a reset link asked for inside the app, opened in a browser that never asked for it, signs the user in and sets a new password"; "oracle: forgot-password for an address nobody holds meets the same screen and sends nothing"; "no session: the reset page opened without a session ends on the login screen" |
| | `contestant-a11y-scan` | `contestant-password-reset`, light and dark |

## The operator's round, as built

Read by the operator on 2026-10-11 (`178-OPERATOR-ROUND`: section H of `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md`;
`178-read-rulings.mjs` read 36 items, exit 0). **J1 is answered (b), PL-29 is answered (a) by name; every other item stands at its
recommended option.** No summary records an item answered since. The other option of each, and where it lands, as
`178-EXECUTION-RULES.md` states it:

| Item | Built | The other option lands in |
|---|---|---|
| J1 | (b) `password_set` on `get_user_entities`, filled on every `getBasicUserData` (operator's ruling) | (a) an optional setting of `getBasicUserData`: 178-04 Task 3, 178-14 Task 2's load; (c) a dedicated RPC: 178-04 Tasks 1–2 |
| J2 | (a) the gate on the stored password; `identity-callback` unchanged; `signup`/`email` refused like `invite` | (b) a marker column: **not a located change** — a new server operation; the phase would stop |
| J3a | open rows only judged | every row: one conjunct in each of three functions, 178-05 Task 2 |
| J3b | faction and alliance targets not judged | always refused: the `IN ('candidate','organization')` guard, 178-05 Task 2 |
| J3c | a disallowed row absent from the claim | reported as skipped: the claim's loop and the frontend enum, 178-05 and 178-04 |
| J3d | base dataset's organization row widened to email and code | left empty: 178-03 keeps it; 178-17's spec declares settings |
| J4 | `register/` the one tree; `register/identity-provider` reserved; `preregister/` not moved | a rename of `preregister/`: a plan of its own before 178-23 |
| J5 | (a) sign-in only with the locked sentence; `register/**` leads to the login screen; the fourth public value | (b) one line of `listedRegistrationModes`, 178-08; (c) 178-04 Task 2 and 178-18's provider edit |
| J6 | (a) the no-op mail hook, after probe row P6 | (b)/(c) 178-20 Task 2 goes, and row P6 |
| U-01 … U-30 | each at (a), the ★ | each in the plans the execution rules' table names (U-01 `Button.type.ts` and every screen plan; U-03 178-10 Task 3; U-04 178-08/178-10; U-05 178-13/15/16/19; U-06 178-11/13/14/19; U-07 178-11/14/19; U-08 to U-12 178-13/178-18; U-13 178-13/15/23; U-14 178-10; U-15 178-16; U-16 178-09; U-17 178-15; U-18 178-10/13; U-19, U-20 178-08/10; U-21 178-13/15; U-22 178-14; U-23 178-16; U-24 178-06; U-25 178-11; U-26 178-16/18/21/22; U-27 178-22; U-28 178-08/13; U-29 178-08/16/18; U-30 178-23); the block each alternative changes is tabled in `178-UI-SPEC.md` § PROPOSED for U-01 to U-07 and U-29 |
| PL-01 | dataset and fixtures before screens; tracer before A and C | D-23's letter: 178-12 behind 178-19, 178-14 behind 178-18 |
| PL-02 | one generated migration file, regenerated per schema commit | one commit for the schema block (178-04 to 178-06 uncommitted together) |
| PL-03 | bounced visitor lands on A, which passes `redirectTo` to B | on B: the gate row's redirect, 178-18 |
| PL-04 | as U-03 | as U-03 |
| PL-05 | 65 s from settlement | 60: the constant, 178-08 |
| PL-06 | a server load on `password-reset` | the browser's `goto`: 178-19 Task 2 |
| PL-07 | the claim-and-refresh pair extracted | left twice: one step of 178-15 Task 2 |
| PL-08 | a fact (the census gains `recovery_link_request` and `send_email_hook`) | — |
| PL-09 | the view reads `contestantCtx.user?.email` | the layout passes `data.user`: 178-14 |
| PL-10 | completion witness on the page's own request | a further witnessed request: one fixture step, 178-12 |
| PL-11 | one stored passwordless session written by a setup | a session per reading describe: 178-22 |
| PL-12 | a sibling declarer `declareEntryScans` | `declareScans` generalised: 178-12 Task 3 |
| PL-13 | `request-recovery`, `recovery_link_request`, `requestPasswordRecovery` | any other names: 178-06, 178-07, 178-19 |
| PL-14 | five reserved rows; each spec seeds and cleans in its own hooks | shared contract rows (178-03, 178-12), or D-21's setup and teardown projects per spec (178-14, 178-17, 178-19) |
| PL-15 | FIX-01 in a spec of its own | a third test of the email spec: 178-19 Task 1 |
| PL-16 | P7 nine attempts a case at the auth service | thirty each through B's action: a probe row after 178-13 |
| PL-17 | new keys in 178-08; rewordings with their screens; removals with the last reader | one task for all: 178-08 with a full run |
| PL-18 | D-17 and J6 in one plan, one restart | two plans, two restarts |
| PL-19 | B, D1, D2 as routes nothing linked to, two windows | 178-13 and 178-14 merged, or 178-16's gate-table half ahead of 178-13 |
| PL-20 | `control --full` for a change that reaches every stored session | one-project control: the verdict's `--full` form goes, 178-01 |
| PL-21 | the organization spec ends on the organization's home | — |
| PL-22 | phone checks in their own spec | inside the scan specs: 178-22 |
| PL-23 | D1/D2, then C, then helpers and A | A before C: 178-18 ahead of 178-16 |
| PL-24 | a guard module asked by each page load | one `register/+layout.server.ts` reading the route id: 178-16 Task 1 |
| PL-25 | searches stop outside `.planning/` and the spike skill; `registrationKey` allowed in Phase 179's tree | the skill's two files edited: one step of 178-23 Task 2 |
| PL-26 | bank-auth projects once, here | also at the close of 178-14, 178-16 and 178-20 |
| PL-27 | link lifetime pinned and compared, not waited out | a probe row that ages a link past its lifetime: 178-02 Task 1 |
| PL-28 | no timing equality at the code check for an off mode | the code check reads settings on every call: 178-05 Task 2 step 3 |
| PL-29 | (a) accepted by the operator: the gate is the Contestant App's; a passwordless admin-role session reaches the Admin App | (b) the gate in the Admin App: a plan of its own after 178-14; (c) handed to Phase 179 |

Every item but J2 (b), PL-08 and PL-21 has its other option as a located change; J2 (b) is not one.

## Flagged assumptions

| Assumption | What was built against it | What would show it wrong |
|---|---|---|
| **The edge probe's unclassified FIX-01 row.** The probe asked for a manual review. The planner's reading — FIX-01's edges are the link opened in another browser, opened a second time, opened after a later request, and requested for an address with no account — is an assumption, not the probe's classification | The first and the last are tests of `contestant-password-recovery` ("recovery: … opened in a browser that never asked for it …", "oracle: forgot-password for an address nobody holds …"); the second and third are probe rows P1 (single use) and P2 (a later link stops an earlier one), both `held` | An edge of FIX-01 none of the four names: e.g. a link opened while another user is signed in in the same browser |
| **The read after a saved password** (P4, N-5) | P4 `held`: no `refreshSession()` in `_setPassword`; the gate passes by `invalidateAll()`; the reset page leaves by a client navigation that reruns the loads | A browser client whose `updateUser` rotates the access token so the next load reads `password_set` false (the tracer observed the opposite in Chromium; no digest of the token was compared) |
| **65 seconds against the server's 60** | `RESEND_WAIT_SECONDS` 65 from settlement; specs advance the page's clock and give the slot back | A real-minute wait ending in the "asked again too soon" sentence or no second mail (todo `2026-10-16-178-sixty-five-seconds-against-the-servers-sixty.md`) |
| **A value filled before hydration** (N-1) | B reads the address and password from the posted form, not from bound state | A browser autofill that the posted form does not carry; not observed in any browser |
| **The lifetime of the stored passwordless session** | One setup writes it; its readers ran by about test 173 of 530 in `178-22-close` | A reader placed late in a run failing on an expired session |
| **The completion witness on a page's own request** (PL-10) | `witnessPageRequest` intercepts the page's link request and adds a witness; "no mail" is asserted only after it reads its outcome | A browser that does not expose the request body (the fixture then counts 0 for a request the page made) |
| **The `create_invitations` signature** | Two-argument form, recorded by 178-01 and still on the tree (`p_confirm_entity` 0 lines on `062127cae`) | Phase 177.1 landing: the one located change is the confirmation argument at each seeding step call (178-14, 16, 17, 19, 21, 22) and at the pgTAP calls of 178-05 and 178-06 |
| **An identity-provider account reads as having a password** (J2, P3-IDP `set`) | The gate reads the stored password; `identity-callback` unchanged; such an account never meets the set-password view | An identity-callback account created without a password hash |

## Backstops, not made

None of these was made by an executor, and none is claimed made.

| Backstop | Carried by | Todo |
|---|---|---|
| Password managers: sign in from a saved account, save on the set-password view and on the reset page under the right address, fill the code-reuse sign-in, nothing on the code field (N-6) | 178-24 | `2026-10-16-178-entry-screens-with-two-browsers-and-one-password-manager.md` |
| The whole flow by keyboard and with a screen reader, in `en` | 178-24 | `2026-10-16-178-the-entry-flow-by-keyboard-and-with-a-screen-reader.md` |
| The tab order of the sign-in screen | 178-09 | the keyboard todo above |
| A browser's suggested password against the rule list (N-7) | 178-11 | `2026-10-16-178-browser-suggested-passwords-against-the-rule-list.md` |
| The new strings at 320 px in six locales, and long text-button labels wrapping inside the button | 178-22 (two) | `2026-10-16-178-entry-flow-strings-at-320-px-in-six-locales.md` |

## Residuals, open

- **The auth service's own one-time-code endpoint tells a registered address** (`P6-OTP: distinguishes`: 200 for a registered
  address, 422 `otp_disabled` for an unknown one), reachable with the anon key whatever a screen does. Documented under Known
  residuals; todo held.
- **A mailed link a scanner can spend** (U-30): the link is verified when opened; the confirmation page is a todo
  (`2026-10-16-178-confirmation-page-between-a-mailed-link-and-its-verification.md`).
- **A signed-in session sets a password without the current one** (the recovery page and the set-password view rest on the
  session alone).
- **A hosted project's dashboard** must match: minimum length 8, `otp_expiry` 3600, the Send Email hook
  (`public.send_email_hook`), sign-up off, confirmations on. The repository cannot set or read it.
- **Probe row P7:** the auth service's password sign-in times differ by case (medians about 6 ms no account, 13 ms no password,
  65 ms wrong password; one status and one error code for all three). Todo `2026-10-15-178-check-whether-password-sign-in-timing-can-be-exploited.md`.
- **The lifetime of a mailed link** (PL-27): 3600 s pinned in the gate and compared with the running service (`stack` row EQUAL),
  never waited out.
- **The code check's extra read** (PL-28): an open, unexpired invitation whose mode is off costs one settings read that a code naming
  nothing does not; no timing equality is built or asserted.
- **What a passwordless session reaches outside the Contestant App's protected layout** (PL-29, accepted by the operator): the data
  API, and the Admin App where its grant gives it the admin role (a project-scope invitation claimed through a mailed link).
- **The server's `code-sign-in` operation asks neither the mode matrix nor the answers lock**: D2's form action is the only line; a
  direct call with a used code and the claimant's password signs in with the code mode off (gives nothing password sign-in does not).

## For Phase 179

- **An identity-provider account reads as password-set**, so the set-password gate never meets it. Whether such accounts become
  passwordless is Phase 179's (O-3 (i)).
- **`EmailEntry` is the component for its email step**; its interface knows nothing of invitations (O-3 (ii)).
- **The selector lists the provider's option for candidates only and leaves by the route key `ContestantAppPreregister`**: Phase
  179 changes a destination and a condition (O-3 (iii)).
- **`register/identity-provider` is reserved**; a page there must call `refuseUnlessRegistrationOffered` from
  `$lib/server/contestant/registrationGuard` in its server load, and a form action there must ask `isRegistrationOffered` first. A
  new entry screen adds its route key to `entryRoutes` in `appGates.ts` and to `appGates.test.ts`'s list (O-3 (iv)).
- **A returning provider user with no password is sent to the sign-in screen's link button**, which works only if the address
  they type is the account's sign-in address — Phase 179's decision, bounded by the rule that a claim trusts a confirmed address only
  (O-3 (v)).
- **Under the mail hook the auth service sends no mail of its own**: the confirmation of a pending address that flow needs must be
  sent by a function (O-3 (vi)).
- **The remaining hits of `registrationKey`:** `apps/frontend/src/routes/contestant/preregister/(authenticated)/email/+page.svelte`
  builds a mail template's `registrationUrl` as `ContestantAppRegister?registrationKey=<%= candidate.registrationKey %>`; the
  registration page reads no such parameter any more, so that link leads to the mode selector and the key is dropped. And
  `registrationGuard.test.ts:185`, a test that the guard drops it.
- `preregister/`, its route keys and `api/contestant/preregister` are Phase 179's to remove (D-19). The bank-auth journey enters
  through `preregister/` and is green on this tree (above).

## For the operator

### `CLAUDE.md`: the sentence this phase made false (not edited; from 178-23)

§ Backend (Supabase), the **Auth** bullet, as it reads:

> **Auth**: cookie-based sessions with PKCE; candidates authenticate via Supabase Auth; an invitation is a row of
> `public.invitations` that promises a grant — `create_invitations` creates it and sends nothing, the `account-access` Edge
> Function mails a sign-in link when one is asked for, and `claim_invitations` writes the promised grants for the signed-in user's
> own confirmed address; bank authentication via OpenID Connect (Signicat), IdP settings in `.env`, completed by the
> `identity-callback` Edge Function

Proposed replacement:

> **Auth**: cookie-based sessions; candidates authenticate via Supabase Auth, which sends no mail of its own (a no-op Send Email
> hook); an invitation is a row of `public.invitations` that promises a grant — `create_invitations` creates it and sends nothing,
> the `account-access` Edge Function mails a sign-in link or a recovery link when one is asked for, and `claim_invitations` writes
> the promised grants for the signed-in user's own confirmed address, for a candidate or organization invitation only under a
> registration mode the project allows for that type; a signed-in user with no password meets the Contestant App's set-password
> gate before any protected page; bank authentication via OpenID Connect (Signicat), IdP settings in `.env`, completed by the
> `identity-callback` Edge Function

### Todos filed by the phase

`2026-10-15-178-check-whether-password-sign-in-timing-can-be-exploited.md`, and the seven of 178-23:
`2026-10-16-178-confirmation-page-between-a-mailed-link-and-its-verification.md`,
`…-entry-screens-with-two-browsers-and-one-password-manager.md`, `…-browser-suggested-passwords-against-the-rule-list.md`,
`…-the-entry-flow-by-keyboard-and-with-a-screen-reader.md`, `…-entry-flow-strings-at-320-px-in-six-locales.md`,
`…-control-edge-contrast-on-the-shaded-page.md`, `…-sixty-five-seconds-against-the-servers-sixty.md`. 178-23 also closed ten and
updated five (identity-provider accounts, the first-time invitee with no contestant grant, the one-time-code endpoint, the hosted
settings, the native-speaker review).

### The operator's open items (from `178-PAUSE.md`, then 178-21 to 178-24)

1. (178-02) P7: the password sign-in's timing tells no account / no password / wrong password apart (6 / 13 / 65 ms). A residual.
2. (178-05) A project that stores no matrix honours no candidate or organization invitation; `seed.sql`'s default project stores `{}`.
3. (178-06) The lint and typecheck rows do not read the Edge Functions' source (Phase 180's).
4. (178-08) Swedish `common.login` reads "Registrera dig"; other catalogue oddities; the constructed translations are unreviewed.
5. (178-10) Commit `f7212f546` alone fails `svelte-check` (fixed by `ff7c4d150`); history not rewritten.
6. (178-12) A flow has exactly the reserved rows it names.
7. (178-13) **Interim ruling:** the adapter-boundary allowlist gained `login/email/+page.server.ts` (and 178-15 the code sign-in action); alternative a shared server module.
8. (178-13) **Interim ruling:** a refused sign-in posted without script does not keep the typed address.
9. (178-11) The main button's label is a whole sentence while the password is invalid; N-6/N-7 for a person.
10. (178-14) Not in a browser: a first-time user with no contestant grant passing the view and terms to "nothing to edit"; the saving label, the failed-save sentence, the focus move, Log Out from the view. Bank-auth: run here, green.
11. (178-15) **Interim ruling:** the registration guard also binds D2's form action (built by 178-16).
12. (178-15) `claimAndRefresh` takes a context; D2 clears the entry flow after applying the redirect.
13. (178-16) The server's `code-sign-in` asks neither the matrix nor the answers lock (a residual above).
14. (178-16) The answers-lock E2E case lives in `perm-answers-locked.spec.ts` (4 → 5 tests) — **the figure Task 2's baseline comparison as written lacks.**
15. (178-16) One red pre-commit run from two test-side causes, fixed; six keys without reader (removed by 178-23).
16. (178-17) Not walked in a browser: a switched-off mode; a true reload of D1/D2 with a code held; 65 s against 60.
17. (178-18) The a11y wiring gate was edited to read `entryAxeScan.ts` (said to relax nothing — worth a read); two expectations changed; footer placed last; the `?errorMessage=constructor` defect fixed.
18. (178-19) Commit `250e4215b` alone turns the journey red (fixed by `5ad63f88d`); the old reset page threw on the server for a visitor with no session.
19. (178-20) Local auth requires 8 characters and sends no mail of its own; under the hook a change of address gets no confirmation mail (Phase 179); `P6-OTP` an oracle (todo); the disk floor blocked once.
20. (178-21) `178-21-close` was void (clamshell sleep), made again as `-r2`; a `--red` verdict stage matches titles by substring.
21. (178-22) **Ruling noted:** "both of its fields in error" on the set-password view cannot be shown (`validate()` reports one field at a time); the confirmation's error is the marker.
22. (178-23) The `CLAUDE.md` Auth bullet (above); the authentication page's § Sessions still calls the callback "the callback for the PKCE exchange"; `isContestantAppRootPath` has only its unit test; `audit-skill-links.sh database` reports 30 dangling citations, all present at `178-BASE`.
23. (178-23/178-24) The `pg_prove:3.36` image was pulled from Docker Hub and tagged under the ECR name; its identity with the ECR image is assumed.
24. (178-24) The baseline comparison's missing `perm-answers-locked=1` (Task 2 above): the orchestrator decides.

### The list for a person

- N-6: which password managers pair the set-password view's not-rendered user-name field, in two browsers and one manager (the
  visible-field fallback is located in `PasswordSetter.svelte` alone).
- N-7: each browser's suggested password against the rule list.
- N-8: a control's edge against 3:1 on the shaded page, light and dark.
- The whole flow by keyboard and with a screen reader, in `en`.
- The six other locales at 320 px; long text buttons wrapping inside the button.
- U-30: the confirmation page between a mailed link and its verification.
- 65 seconds of wall clock against the server's 60.
- The identity-provider panel of the selector at phone width (not in the base dataset).
- A passwordless project-scope user passing the gate; whether a stored link session lasts a whole run.
- The access token's bytes after `updateUser` in a browser (no digest compared).
- From 178-09 to 178-19, on rendered screens: `ErrorMessage inline` centred under start-aligned labels; the forgot-password link
  announced as a button; the setter's 50-character main-button label at 320 px; D2's long refusal sentence; the login screen's
  footer placement; the reset page's support button under the main button; E, D1 and D2 with no document title for the moment before
  they leave with nothing held.
- A hosted project's dashboard settings.
- The constructed translations, by a native speaker (the review todo lists them by locale).

## Deviations from Plan

**1. [Rule 1 - Defect of a verify stage] Task 1's `registrationKey` stage was restated** with `":!*.test.ts"`, the form the
execution rules give a negative search; the as-written stage exits 1 on `registrationGuard.test.ts`, which 178-23 kept. Both
statuses recorded (1 and 0).

**2. [Ruling 4 signal] Task 2's baseline stage was restated** with `--except perm-answers-locked=1`. The as-written stage exits 1
because plan 178-16 moved one test into `perm-answers-locked` and the plan's sums omit it. Both statuses recorded (1 and 0). The
figure is reported to the orchestrator, not settled here.

**Total deviations:** two restated verify stages. **Impact:** none on the tree; no code commit.

## Not done, or not verified

- `CLAUDE.md` not edited; the manual checks not made (ruling 6).
- The `170-allowlist-probe.sh` redirect allow-list probe was not run after the restore (the driver runs only the stack probe; the
  plan does not ask for the other).
- The identity of the Docker Hub `pg_prove` image with the ECR one was not compared.

## Observed, and inferred

- **Observed:** every status, count, head, window and verdict above, read from the run directories and the logs; the absence of
  any pull in the pgTAP row's log; the titles of the requirement map from `178-24-final`'s `results.json`.
- **Inferred:** that the restated baseline figure is the right one (it is the chain's own `178-16-close` move, and the totals sum to
  530); the review's "no finding" rests on reading, as every review does.

## Known Stubs

None.

## Threat Flags

None. The plan adds no surface.

## Self-Check: PASSED

- Found: `tests/e2e-runs/178-gates/178-24-final`, `tests/e2e-runs/178-gates/178-24-restored`, `tests/e2e-runs/178-e2e/178-24-final`,
  `tests/e2e-runs/178-e2e/178-24-bank-auth`, `tests/e2e-runs/178-e2e/178-24-bank-auth-journey`, this summary.
- Verify exits on disk: `178-24-t1-verify.exit` 1 and `-r2` 0; `178-24-t2-verify.exit` 1 and `-r2` 0; `178-24-t3-verify.exit` 0,
  as recorded above. No commit hash to check: the plan made none before this summary.
