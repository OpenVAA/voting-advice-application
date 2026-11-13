---
phase: 178-sign-in-email-code-registration
plan: 19
subsystem: auth
tags: [sveltekit, svelte5, password-recovery, forgot-password, password-reset, server-load, supabase-adapter, playwright, e2e, fixtures, contestant-app]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-06/178-07: the request-recovery operation and its mail; plan 178-08/178-10: requestPasswordRecovery, the entry flow and sendEntryLink with the origin forgotPassword; plan 178-09/178-11: EmailField and PasswordSetter with username and validate(); plan 178-12/178-17: recoveryLinkToOpen, witnessPageRequest, freshVisitor, holdClockStill, shape; plan 178-14: the set-password gate; plan 178-18: the sign-in screen holds the forgot-password link"
provides:
  - "apps/frontend/src/routes/contestant/forgot-password/+page.svelte: the recovery request through sendEntryLink({ origin: 'forgotPassword' }), the shared email field, the \"email sent\" screen on settlement, no outcome shown"
  - "apps/frontend/src/routes/contestant/password-reset/+page.server.ts (new): a session or a 303 to the login route; returns { email } of the verified user and nothing else; reads no part of the URL"
  - "apps/frontend/src/routes/contestant/password-reset/+page.svelte: the session branch alone, the password setter with the account's address, a client-side navigation to the app root with the loads rerun after a save"
  - "Removed: requestForgotPasswordEmail and resetPassword from the writer contract, the universal writer, the Supabase adapter (with the auth service's own reset call), the auth context, the Admin context and the contestant context; toCallbackUrl; the test client's sendForgotPassword; RESET_EMAIL_SUBJECT_REGEX"
  - "E2E: contestant-password-recovery.spec.ts (4 tests) and its project; the journey's reset step through the forgot-password page and the mailed recovery link as received"
  - "Fixture steps: forgot-password open/submit/expectLedToEmailSent; a password-reset page object; the sign-in screen's followForgotPassword; freshVisitor carries the forgot-password page, the password-reset page and the entity home"
affects: [178-20, 178-21, 178-22, 178-23, 178-24]

actuals:
  tokens: 35960
  tasks: 3
  commits: 3
plan_head_before: dbae58b81561dc08c2bf72620ac25a77f9875f6d
plan_head_after: 5ad63f88d7b7eaeeeb17e925b5bdb065c98ce2b4

tech-stack:
  added: []
  patterns:
    - "A page that must not be shown without a session decides it in a server load, which redirects with 303 and returns the one value the page shows"
    - "A page that leads to the \"email sent\" screen sends through sendEntryLink and navigates on settlement, whatever it settled as, and reads nothing of the answer"
    - "A mailed link of a fixed address is read only after the page's request witness has read sent: the mail catcher keeps earlier runs' mails"

key-files:
  created:
    - apps/frontend/src/routes/contestant/password-reset/+page.server.ts
    - apps/frontend/src/routes/contestant/password-reset/page.server.test.ts
    - apps/frontend/src/routes/contestant/password-reset/page.svelte.test.ts
    - apps/frontend/src/routes/contestant/forgot-password/page.svelte.test.ts
    - tests/tests/specs/contestant/contestant-password-recovery.spec.ts
    - tests/tests/fixtures/contestant/contestantPasswordResetPage.fixture.ts
  modified:
    - apps/frontend/src/routes/contestant/forgot-password/+page.svelte
    - apps/frontend/src/routes/contestant/password-reset/+page.svelte
    - apps/frontend/src/lib/api/base/dataWriter.type.ts
    - apps/frontend/src/lib/api/base/universalDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
    - apps/frontend/src/lib/contexts/auth/authContext.svelte.ts
    - apps/frontend/src/lib/contexts/auth/authContext.type.ts
    - apps/frontend/src/lib/contexts/auth/authContext.svelte.test.ts
    - apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/afterSave.svelte.test.ts"
    - tests/playwright.config.ts
    - tests/README.md
    - tests/tests/fixtures/contestant/contestantForgotPasswordPage.fixture.ts
    - tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts
    - tests/tests/fixtures/contestant/contestant-registration.ts
    - tests/tests/fixtures/contestant/contestant-journey.ts
    - tests/tests/fixtures/shared/emailBucket.fixture.ts
    - tests/tests/fixtures/shared/invitationFlow.fixture.ts
    - tests/tests/specs/contestant/contestant-journey.spec.ts
    - tests/tests/utils/contestantJourneyConstants.ts
    - tests/tests/utils/supabaseAdminClient.ts
    - tests/tests/utils/testIds.ts

key-decisions:
  - "P1: held — the callback is not edited; its recovery arm already claims and refreshes before it lands on the reset page"
  - "P4: held — the reset page leaves after a save by goto(ContestantAppHome, { invalidateAll: true }), with no refreshSession() and no full page load"
  - "The reset page's address and failed-save message carry ids of their own (password-reset-email, password-reset-error) in the registry; the dead registry id password-reset-submit is removed; the main button keeps set-password-submit"
  - "The recovery spec's describe is not serial: each of its four tests makes its own state, so each could be red on its own in the control"
  - "The reset page does not call clearEntryFlow(): it is reached only by the callback's full page load, which empties the flow"

patterns-established:
  - "Read a mailed link after the request's witness reads sent — for a fixed address always, since the mail catcher holds earlier runs' mails"

requirements-completed: [FIX-01, REG-13, REG-10]

coverage:
  - deliverable: "A reset link asked for in the app completes in a browser that never asked for it, leaves the user signed in with the new password, and the old password is refused"
    human_judgment: false
    verification:
      - kind: e2e
        ref: "tests/tests/specs/contestant/contestant-password-recovery.spec.ts#recovery: a reset link asked for inside the app, opened in a browser that never asked for it, signs the user in and sets a new password"
        status: pass
      - kind: e2e
        ref: "tests/tests/specs/contestant/contestant-journey.spec.ts#full candidate journey end-to-end (step 8)"
        status: pass
  - deliverable: "Forgot-password tells an outsider nothing: the same screen for an address with an account, with neither, and with an invitation only"
    human_judgment: false
    verification:
      - kind: e2e
        ref: "tests/tests/specs/contestant/contestant-password-recovery.spec.ts#oracle: forgot-password for an address nobody holds meets the same screen and sends nothing"
        status: pass
      - kind: e2e
        ref: "tests/tests/specs/contestant/contestant-password-recovery.spec.ts#first-time user: an address with an invitation only is mailed the sign-in link, and is asked to choose a password"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/forgot-password/page.svelte.test.ts (19 cases)"
        status: pass
  - deliverable: "The reset page is decided by the session alone on the server, reads no URL, and is the setter with the account's address"
    human_judgment: false
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/password-reset/page.server.test.ts (14 cases)"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/password-reset/page.svelte.test.ts (21 cases)"
        status: pass
      - kind: e2e
        ref: "tests/tests/specs/contestant/contestant-password-recovery.spec.ts#no session: the reset page opened without a session ends on the login screen"
        status: pass
  - deliverable: "How the two pages look and read: layout, the reset page's support block, the two pages with a screen reader and at phone widths"
    human_judgment: true
    rationale: "No test asserts a layout, and neither page is scanned by axe or checked at a phone width yet (plans 178-21 and 178-22)."

duration: "about 71 min of work in two sessions (2026-10-13 02:46Z–03:35Z; 2026-10-14 about 20:13Z–20:35Z), interrupted by an API spend limit"
completed: 2026-10-14
status: complete
---

# Phase 178 Plan 19: Forgot-Password and Password-Reset on the Shared Pieces — FIX-01 Summary

**The forgot-password page asks the `account-access` function for a recovery link through the entry flow and always leads to the "email sent" screen; the password-reset page is decided by a new server load (session or a 303 to the login screen) and is the password setter with the account's address; the auth service's own reset call, the two writer contracts behind it and the hand-built callback helper are gone; FIX-01 is a spec of four tests, and the full suite is green at 473 in 119 projects.**

## Read this first

- **The control was red in four tests, not three.** The fourth, `no session:`, was red because the page as it was threw on the server for a visitor with no session: `Error: Cannot call goto(...) on the server` at `password-reset/+page.svelte:46`, in the control run's own dev-server log. The plan expected that test to pass "on the page as it is" (a reading of the source; 178-18's summary said the same). The new server load fixes it at its root. The verdict as written (three `--red`) exits 1; restated with the fourth named it exits 0.
- **The first closing run (`178-19-close`) was red**: the journey's new reset step opened a recovery link of the *pre-commit run*, whose token was spent, and landed on the login screen. Cause observed, not inferred: the journey's address is the same in every run; the page's request was posted at 03:19:16.840Z, the step read "the newest mail with the recovery subject" and opened its link at 03:19:16.902Z, and this run's mail arrived at 03:19:16.919Z (the earlier one at 03:02:03.241Z). No Sleep entry in the window. Fixed in the test (commit `5ad63f88d`): the step gives the page's request a completion witness and reads the link only after it reads `sent`, as the walk's registration step already does. The journey alone was then green on the uncommitted fix with two stale recovery mails in the catcher, the full pre-commit run `178-19-precommit-r2` was green, and the closing run `178-19-close-r2` was green.

## Performance

- Started 2026-10-13T02:46:23Z; first session ended about 03:35Z; resumed 2026-10-14 about 20:13Z; ended 20:35Z.
- Tasks: 3. Commits: 3 (plus this summary). Files: 30 changed, 1484 insertions, 393 deletions.

## Task Commits

1. **Task 1 (steps first, no spec yet)** — `de374738c` test(178-19): steps for the forgot-password page, the password-reset page and a second visitor who ends signed in
2. **Task 2 (the one held commit)** — `250e4215b` fix(178-19): a password-reset link is issued by the server and completes in any browser; the reset page keeps its session branch only
3. **Task 3 (found by the closing run)** — `5ad63f88d` test(178-19): the journey's reset step reads the recovery link once its request's mail was handed over

## Each task's verify command, with its real exit status

| Verify | As written | Restated (intent) |
|---|---|---|
| Task 1 (`178-unit/178-19-t1-verify.sh`) | **1** — the spec search finds `expect.soft` in the header's rigidity line | **0** (`178-19-t1-verify-intent.sh`): the search over the code with comments removed, and the control judged with `--red "no session:"` added |
| Task 2 (`178-19-t2-verify.sh`, head `250e4215b`) | **0** | — |
| Task 3 (`178-19-t3-verify.sh`, head `5ad63f88d`) | **0** (reads `178-19-close-r2`, the highest `-rN`) | — |

Corrected values for the hand-over: the control is judged with `--red "recovery:" --red "oracle:" --red "first-time user:" --red "no session:"`. The `--except contestant-password-recovery=4` of the closing verdict is right as written.

## Red before green

- **Unit** (`178-unit/178-19-t1-unit-red.{log,exit,head}`, head `dbae58b81`): 54 cases in three files, 52 failed, every failure an `AssertionError`; the server test ran over a stand-in load that decides nothing (never committed). Eight unhandled rejections came with it — `requestForgotPasswordEmail is not a function` — the page as it was calling a context member the fake context does not offer. Reported, not counted as failures.
- **E2E control** `178-19-control` (head `de374738c`, the spec, config and unit files uncommitted): 6 tests, 2 passed (setups), 4 failed. The three named tests each on `getByTestId('contestant-email-sent')` not visible (`expectLedToEmailSent`) — "the email sent screen does not open"; the fourth as above.
- **The journey's defect**: red in `178-19-close` (head `250e4215b`), green in `178-19-journey-fix` and `178-19-precommit-r2` (`--were-red-in 178-19-close`: PASS).

## The runs

| Label | Tree | Totals | Verdict | Docker VM free before |
|---|---|---|---|---|
| `178-19-control` | uncommitted spec + config + unit files | 6: 2 passed, 4 failed | `control --red` as written 1; restated 0 | 15.88 GiB |
| `178-19-precommit` | the held set, uncommitted | 473 passed of 473, 119 projects | `control --full --green --were-red-in 178-19-control`: PASS | 15.88 GiB |
| `178-19-close` | `250e4215b` | 151 passed, 1 failed (journey), 321 did not run | red — cause above | 15.67 GiB |
| `178-19-journey-fix` | the fix, uncommitted, journey slice | 5 passed of 5 | `control --green`: PASS | 15.63 GiB |
| `178-19-precommit-r2` | the fix, uncommitted | 473 passed of 473 | `--were-red-in 178-19-control` PASS; `--were-red-in 178-19-close` PASS | 15.61 GiB |
| `178-19-close-r2` | `5ad63f88d` | 473 passed of 473, 119 projects | `e2e … --same-projects-as 178-18-close --except contestant-password-recovery=4 --expect-project contestant-password-recovery`: PASS, 119 compared, 0 not as expected | 15.75 GiB |

No run was void; `pmset -g log` had no Sleep entry in any window. The standing `Input.svelte` `reading 'map'` error appears once in the close-r2 dev-server log, as in every run.

**Auth budget** (`178-18-auth-peaks.sh` over each full run's window): password sign-ins 35 in a run, at most **25** in five minutes (was 23); link verifications **17** (was 15). Below 27 of each. No 429 in the auth log.

## The gate rows

`178-gates/178-19-close` (head `250e4215b`) and `178-gates/178-19-close-r2` (head `5ad63f88d`): typecheck, lint, unit, check-frontend, build, format all 0 in both. Verdict on the second: PASS, not stale.

## Which branches of the probe rows were built

- **P1: held** — the callback and its test are not edited. Its recovery arm claims and refreshes through the shared function, then redirects to the reset page.
- **P4: held** — after a save the reset page calls `goto(getRoute.current('ContestantAppHome'), { invalidateAll: true })`; no `refreshSession()`, no full page load. Observed in a browser: the first test lands on the candidate's home and stays signed in after a reload.
- **P2-TYPE: interchangeable** — the reset page's load reads the session and nothing of the URL; a unit case passes `type=recovery`, `type=magiclink`, `code` and `token_hash` and asserts the same answer and zero reads of `url`, `route` or `request`.

## What the reset page's load returns

`{ email: user.email }` of the user `safeGetSession()` verified; with no session or no verified user, `redirect(303, buildRoute({ route: 'ContestantAppLogin', locale: locals.currentLocale }))`. Nothing of the session. `yarn assert:no-session-in-loads`: 21 modules, 0 violations.

## Every reader of the two removed contracts, and what became of it

| Reader | Now |
|---|---|
| `forgot-password/+page.svelte` (`requestForgotPasswordEmail`) | `sendEntryLink({ origin: 'forgotPassword', email })` |
| `password-reset/+page.svelte` (`resetPassword` with `code`) | the branch is gone; `setPassword` only |
| `dataWriter.type.ts`, `universalDataWriter.ts` (public methods and abstract `_` methods) | removed |
| `supabaseDataWriter.ts` `_requestForgotPasswordEmail` (`auth.resetPasswordForEmail` with a `redirectTo`) and `_resetPassword` | removed, with the now unused `buildRoute` import |
| `supabaseDataWriter.test.ts` (two describes, the `resetPasswordForEmail` stub) | removed |
| `authContext.svelte.ts` wrappers, `authContext.type.ts` members | removed; the docstrings say two wrappers |
| `authContext.svelte.test.ts` | the four-wrapper cases now name two; two cases added (setPassword forwards the password; the instance has exactly `isAuthenticated`, `logout`, `setPassword`) |
| `adminContext.svelte.ts` (two forwards and the docstring's audit) | removed; no Admin route called either (svelte-check 0) |
| `contestantContext.svelte.ts` (two declarations) | removed; `contestantContext.type.ts` names neither and is not edited |
| `afterSave.svelte.test.ts` (a typed fake of the auth context) | the two members removed (outside the plan's list; the verify's search covers it) |
| Tests: `toCallbackUrl`, `sendForgotPassword` with its `SUPABASE_URL` constant, `RESET_EMAIL_SUBJECT_REGEX`, `fillEmailAndAdvance` | removed |

## Decisions Made

See frontmatter `key-decisions`. Items PL-06, PL-13, PL-15, U-04, U-06, U-07 and U-30 were read by the operator on 2026-10-11 and stand at their recommended options; each is built so.

## Accepted properties, as stated

- **A stolen session becomes a stolen account** (T-178-120): the reset page and the set-password gate change a password for any signed-in session without the current one; a recovery cannot know it. No route that sets a password was added; one contract that claimed to (`resetPassword` with an ignored `code`) is gone.
- **A recovery link opened by someone other than the addressee** (T-178-119): bounded by single use (P1) and by the link's lifetime (3600 s configured, pinned by 178-20); a scanner that opens it first spends it (U-30, filed by 178-23).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The password-reset page threw on the server for a visitor with no session**
- Found during: Task 1's control. The page called `goto` during SSR (`Cannot call goto(...) on the server`). Fixed at its root by the plan's own server load (Task 2). Commit `250e4215b`.

**2. [Rule 1 - Bug] The journey's reset step opened an earlier run's spent recovery link**
- Found during: Task 3's closing run. Fixed by reading the link after the request's witness reads `sent`; `recoveryLinkToOpen`'s TSDoc and `tests/README.md` say when the link may be read. Commit `5ad63f88d`. This is a fix of a commit of this plan; the history keeps both (no rebase in this flow).

### Other departures, none of them a fix

1. **A fixture commit before the held one** (`de374738c`), as the dispatch asks for steps a spec will call: forgot-password `open`/`submit`/`expectLedToEmailSent`, a new `contestantPasswordResetPage.fixture.ts`, `followForgotPassword` on the login page object, `freshVisitor` widened, the reset page object in both roots, the registry. Six files, four of them outside the plan's list.
2. **Not one serial describe**: one describe in default mode (the project is `fullyParallel: false`), so each test could be red on its own in the control (178-16's lesson).
3. **The witness's action includes `expectLedToEmailSent`**, so the control's red is "the email sent screen does not open".
4. **The oracle compares two addresses** (a grant holder's and nobody's) as the plan's test describes; the invitation-only address meets the same screen in its own test (`expectLedToEmailSent` in the recovery wording), not by a shape comparison — seeding an invitation on a candidate that already has an editor was not tried.
5. **The journey's step releases the address's link slot first**: the walk mailed a sign-in link to the same address minutes earlier, and the two kinds share one slot a minute.
6. **Registry**: `passwordReset.email` and `.error` added, `.submit` (`password-reset-submit`, rendered and read by nothing) removed — the UI contract lists only `page`.
7. **The reset page's support block** is `ContactSupport variant="normal"` with no lead-in sentence; the old page's `password-reset-help-link` is gone.
8. **The plan's frontmatter `requirements`** are copied as given (FIX-01, REG-13, REG-10); the plan's output section names FIX-01 alone as completed.

**Total deviations:** 2 auto-fixed bugs (Rule 1), 8 recorded departures. **Impact:** none on scope; the second bug would have reddened every later full run.

## The code-review checklist

| Item | Outcome |
|---|---|
| Solves what it sets out to | Yes: FIX-01 observed in a browser context that never asked for the link |
| OWASP top 10 | No request carries a redirect target (the auth service's reset call with `redirectTo` is gone from the frontend and the tests); no page shows or branches on the request's outcome; the reset load reads no URL and returns no session; no address is logged |
| Code style guide | Followed; exported symbols and fixture steps have TSDoc |
| No `any` | None added |
| No repeated code | The reset page's handler follows the gate's; the reset page object delegates to the setter's steps |
| New entities documented | Page docstrings rewritten; the load, the page object and every step documented |
| Repo documentation updated | `tests/README.md`; the `apps/docs` pages are 178-23's (listed below) |
| Tracking events | No function is added for a user |
| Svelte component guidelines | No component added; context reads follow the destructuring rule |
| Errors handled and logged | A failed save is logged and shown as an alert; a failed navigation is logged |
| Failing checks | None on the committed tree |
| Parts that share dependencies | The Admin context and its type check; the settings page's change-password form is untouched |
| WCAG A and AA | Focusable `<h1>`, labelled fields, errors tied to their fields, an alert for a failed save; neither page is scanned yet (178-21) |
| Keyboard and screen reader | The main buttons submit their forms, so Enter works; not walked with a screen reader |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before each commit; every touched comment read |
| Commits | Three, each by pathspec; no `[db]` |

The Supabase adapter items: no row mapping changed; the only auth call removed is `resetPasswordForEmail`.

## Observed, and inferred

Observed: every run and gate above; the SSR throw of the old page; the stale-mail timings; P4's browser half again on the reset page. Inferred: that a recovery for a grant holder with no password (P1's second case) behaves in a browser as the probe saw — no browser case walks it here.

## Not done, or not verified

- A mail's body is not asserted (the subject and the link's shape are).
- The reset page's failed save, its saving label and its focus handling are unit cases only.
- Neither page is scanned by axe or checked at phone widths (178-21, 178-22).
- N-6, N-7 (password managers on the reset page) — for 178-24's list.

## Threat Flags

None beyond the plan's register: the one new server surface is the reset page's load, which reads the session and returns one address.

## Known Stubs

None.

## The state the local stack is left in

The stack is up, as the closing run left it; the recovery spec's hooks leave nothing under `password-recovery-`. The mail catcher holds the journey address's recovery mails of four runs. Nothing is in flight; port 5273 is free. The host was on battery at 73–76% during the resumed session, charging at its end.

## For later plans

- **Predecessor label for the next full run: `178-19-close`** (the verdict reads `178-19-close-r2`): 473 tests, 119 projects, head `5ad63f88d`. A comparison with `178-18-close` needs `--except contestant-password-recovery=4`.
- **Read a mailed link only after the request's witness reads `sent`** — for a fixed address always (the journey's, the passwordless session's of 178-22): Mailpit keeps earlier runs' mails, and "the newest mail with the subject" before that moment is an earlier run's spent link.
- **The auth budget now:** at most 25 password sign-ins in five minutes in a full run (35 in all), 17 link verifications. 178-21 and 178-22 have two sign-ins of room before 27.
- **Steps:** `contestantForgotPasswordPage.open() / submit(address) / expectLedToEmailSent(address) / expectShown() / expectEmailError()`; `contestantPasswordResetPage.openDirectly() / expectShown() / expectAddress(address) / expectUsernameField(address) / setPassword(password) / expectSaveFailure()`; `contestantLoginPage.followForgotPassword()`; `freshVisitor()` now also gives `contestantForgotPasswordPage`, `contestantPasswordResetPage`, `contestantEntityHomePage`.
- **178-21 — scans:** the forgot-password page needs no setup; the reset page needs a session (a mailed recovery link, or any signed-in user). The header of `contestant-a11y.spec.ts` lists `password-reset` among routes "none needing authentication" — no longer true.
- **178-22 — to look at on the rendered pages:** the reset page's support button directly under the main button with no lead-in; the forgot-password page's Return now leads to the sign-in screen.
- **178-23 — keys with no reader:** `contestantApp.resetPassword.emailSentText`, `.error`, `.failed`. **Docs out of date:** `developers-guide/backend/email` (row "Password recovery … `resetPasswordForEmail`"), `contestant-app/login-and-password-reset` (step 1 names `requestForgotPasswordEmail`), `frontend/contexts` (the `AuthContext` members). **Todos closable:** `2026-09-02-forgot-password-pkce-code-not-exchanged.md`, `2026-06-07-hide-forgot-password-email-input-after-submitting.md`, `password-reset-code-method.md`, `2026-10-07-174-tocallbackurl-leaves-with-the-recovery-mail.md`.
- **Timing on this host:** the control 63 s; a full run 11 min 58 s to 13 min 7 s; the six gate rows 3 min 33 s and 5 min 52 s (the second on battery).

## Self-Check: PASSED

- Created files exist: the load, three unit files, the spec, the page object.
- Commits on the branch: `de374738c`, `250e4215b`, `5ad63f88d`.
