---
phase: 178-sign-in-email-code-registration
plan: 12
subsystem: testing
tags: [playwright, e2e, fixtures, page-objects, mailed-link, completion-witness, route-interception, page-clock, invitation-flow, contestant-app]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-03: the five reserved rows of the base dataset, their external-id constants and the address prefixes; plan 178-07: the recovery operation's wire, its mail and its link; plan 178-08: the 53 test ids of the registry and the flow's constant RESEND_WAIT_SECONDS; plan 178-10: how the count reads the clock; plan 178-11: the setter's test ids and the fixture step expectFieldError; plan 178-01: the gate driver, the wrapper's control form and the verdict script"
provides:
  - "assertSignInLinkShape(link, { locale, type }) with the exported type MailedLinkType = 'magiclink' | 'recovery'; magiclink when no type is given"
  - "createInvitationFlow(admin, { addressPrefix, dedicatedRows }) and the exported type DedicatedRowIds; every step that names a reserved row reads the flow's own rows"
  - "Invitation fixture steps recoveryLinkToOpen, witnessPageRequest and expectNoMailAfter"
  - "TEST_PASSWORDLESS_EMAIL and PASSWORDLESS_STORAGE_STATE"
  - "Fourteen new steps of createContestantLoginPage, for the login screen and the sign-in screen"
  - "createContestantRegisterPage, createContestantEmailSentPage, createContestantSetPasswordGate"
  - "expectShown and expectEmailError of createContestantForgotPasswordPage"
  - "createRegistrationTest({ addressPrefix, dedicatedRows }) and createFlowState(page) with expectNothingOutsideMemory"
affects: [178-13, 178-14, 178-15, 178-16, 178-17, 178-18, 178-19, 178-21, 178-22, 178-23]

actuals:
  tokens: 23907
  tasks: 2
  commits: 2
plan_head_before: fff98736bf57eadbba23128e40dbbf10ddd19bd5
plan_head_after: 9ae4f8ae77099831b3a51ff9f610c1ec7ea0480c

tech-stack:
  added: []
  patterns:
    - "A request a page makes is given a completion witness on its way out by page.route: the first link request is continued with its own body plus one member, every other request falls through untouched, and the step fails on a count when no such request was made or when a second one carried no witness"
    - "A count on a screen is moved by the page clock installed before the navigation and jumped by the application's own constant, imported from the application's module"
    - "A flow's reserved rows are an option of the flow, and a kind of row the flow was not given fails the step that asks for it"
    - "A step that looks for values that must not be kept anywhere reports the places that hold one and never the value"

key-files:
  created:
    - tests/tests/fixtures/contestant/contestantRegisterPage.fixture.ts
    - tests/tests/fixtures/contestant/contestantEmailSentPage.fixture.ts
    - tests/tests/fixtures/contestant/contestantSetPasswordGate.fixture.ts
    - tests/tests/fixtures/contestant/contestant-registration.ts
  modified:
    - tests/tests/utils/mailedLink.ts
    - tests/tests/utils/mailedLink.test.ts
    - tests/tests/utils/testCredentials.ts
    - tests/tests/fixtures/shared/invitationFlow.fixture.ts
    - tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts
    - tests/tests/fixtures/contestant/contestantForgotPasswordPage.fixture.ts

key-decisions:
  - "With dedicatedRows a flow has exactly the rows it was given: a step asked for the other kind throws, and resetDedicatedRows and leftovers reach the flow's own rows alone. The plan's step 3 words the option as each key defaulting to the contract spec's row; that form lets a spec that names one row delete the contract spec's invitations on the other while both run"
  - "witnessPageRequest waits for the page's request with expect.poll instead of reading the count the moment the action resolves: a press resolves before the request it causes has left"
  - "witnessPageRequest also fails when the action made a second link request, which would carry no witness"
  - "assertSignInLinkShape throws for a type outside the two when one is forced through a cast"
  - "The existing step of the forgot-password page object, with its three literal test ids, is not changed, as the plan's step 5 lays out"

patterns-established:
  - "A verify stage that searches a fixture for forbidden forms reads the code with its comments removed: every fixture's header states the rigidity rule in the forbidden words"
  - "A mechanism a later plan will rest on is measured against listeners of the executor's own under tests/e2e-runs, with no stack and no dev server, when no screen exists to carry it yet"

requirements-completed: [REG-09, REG-10, REG-11, FIX-01]

coverage:
  - id: D1
    description: "A mailed link's shape is asserted for one of two types: asked for recovery the helper accepts a callback link whose only parameters are the token and type=recovery and refuses a magiclink link; asked for magiclink, or for nothing, it refuses a recovery link; a third parameter, another path and a third type are refused for both"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "tests/tests/utils/mailedLink.test.ts — describe 'assertSignInLinkShape, asked for one of the two link types', 13 cases; red first with 6 expectation failures (tests/e2e-runs/178-unit/178-12-t1-red.log, exit 1)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The invitation flow takes its reserved rows as an option and the contract spec does not notice: with no option it writes on the contract spec's two rows as before"
    requirement: REG-09
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/178-e2e/178-12-precommit — invitation-contract on the uncommitted helpers, 17 of 17 with its setup; 178-verdict control … --green: PASS"
        status: pass
      - kind: other
        ref: "tests/e2e-runs/178-unit/178-12-t1-verify-intent.sh — exit 0 (the plan's chain with the comment-blind search restated; as written, exit 1 on the header's rigidity line)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A request a page makes to the function is continued with its own body plus the member witness, every other request is passed on as it is, and the step fails on a count when no link request was made or a second one was"
    requirement: REG-10
    verification:
      - kind: other
        ref: "tests/e2e-runs/178-unit/178-12-mechanics-probe.mts — Chromium against two listeners of its own, 12 rows on the step, all PASS (exit 0)"
        status: pass
    human_judgment: true
    rationale: "The measurement ran the committed step in Chromium against a stand-in for the function and a stub for the admin client. That the application's own request, made through the Supabase client, is carried the same way, and that the function reads the member and finishes the witness, is first observed by the tracer's test in plan 178-14."
  - id: D4
    description: "The page clock, installed before the navigation, moves a one-second count past the wait in one jump by the application's constant"
    requirement: REG-10
    verification:
      - kind: other
        ref: "tests/e2e-runs/178-unit/178-12-mechanics-probe.mts — rows 'clock before navigation', 3 PASS; a clock installed after the count began left the count at 65"
        status: pass
    human_judgment: true
    rationale: "Measured on a page of the probe's own that counts as the application's class does. No screen of the flow exists, so the step has not moved the real count; the first spec that presses Send again does."
  - id: D5
    description: "One page object per screen of the flow, every locator read from the registry, every step named for what a user does or sees; a composition root that builds a spec's test over its own address prefix and reserved rows, with the step that fails when a value of the flow is kept outside memory"
    requirement: REG-11
    verification:
      - kind: other
        ref: "tests/e2e-runs/178-unit/178-12-t2-verify-intent-r2.sh — exit 0 (the plan's chain with the search stage restated; as written, exit 1)"
        status: pass
      - kind: other
        ref: "tests/e2e-runs/178-gates/178-12-close — typecheck, lint, unit, format all 0; 178-verdict gates: PASS"
        status: pass
    human_judgment: true
    rationale: "The steps are type-checked and linted, and no spec calls them: no screen they assert exists. Each is first run by the plan that builds its screen, which writes its spec in these steps and sees it red."

duration: 23min
completed: 2026-10-12
status: complete
---

# Phase 178 Plan 12: The Fixtures and the Semantic Steps of the Entry Flow, Before Any of Its Screens — Summary

**A mailed link's shape for both types, reserved rows of a spec's own, a completion witness for a request a page makes, a page object for every screen of the flow and the registration specs' composition root — ten test files, no spec, no screen, and the contract spec green on the uncommitted helpers.**

## Read this first

- **Both tasks are done and committed; the tree is clean; nothing is left held.** No full E2E run was made: the plan lays none out, and the predecessor label for the next full run is still `178-11-close`.
- **Both verify commands exit 1 as written, and 0 with one stage restated.** Each searches the fixtures for `expect.soft` and `.catch(() => null)`, and every fixture's header states the rigidity rule in those words — the model's header does, and the plan asks each new file for that line. Task 2's also finds `getByTestId('` in the forgot-password page object's existing step, which the plan's step 5 says is not changed here. Nothing was bent to the search. See *Each task's verify command*.
- **One deviation from the plan's letter, to keep its threat mitigation:** with `dedicatedRows` a flow has exactly the rows it was given. The plan's step 3 has each key default to the contract spec's row. See *Deviations* 1.
- **Two mechanisms were measured that the plan left to later plans**, in Chromium against listeners of the executor's own: the witness step carries its member, and the page clock moves a count. Neither has met a real screen. See *The mechanics measurement*.
- **Not measured:** that 65 seconds from settlement outlasts the server's 60-second slot. No step of this plan reaches a screen.

## Performance

- **Duration:** 23 min
- **Started:** 2026-10-12T20:59:12Z
- **Completed:** 2026-10-12T21:22:34Z
- **Tasks:** 2 of 2
- **Files modified:** 10 (4 created, 6 modified), +1,329 −54

## Task Commits

1. **Task 1: The link's shape for both types, rows of a spec's own, the recovery link and the witness on a page's request** — `2a1268b4b` (test)
2. **Task 2: The page objects of A, B, C, D1, D2, E and F, and the registration specs' composition root** — `9ae4f8ae7` (test)

Each commit names its files by pathspec. Task 1's four files were held through the control and committed only on its green verdict, after a byte comparison with the copies kept beside the run.

## Each task's verify command, with its real exit status

Each `<automated>` block was written to a script byte for byte from the plan and run with `bash`; statuses are read from the command itself.

| Script | Exit | |
|---|---|---|
| `tests/e2e-runs/178-unit/178-12-t1-verify.sh` | **1** | the node stage prints `in the fixture: expect.soft` |
| `…/178-12-t1-verify-intent.sh` | **0** | the same chain; the search reads the fixture with its comments removed |
| `…/178-12-t2-verify.sh` | **1** | the node stage names all six files for `expect.soft, .catch(() => null)`, and the forgot-password file for `getByTestId('` as well |
| `…/178-12-t2-verify-intent.sh` | **1** | comments removed only: one line left, `contestantForgotPasswordPage.fixture.ts: getByTestId('` |
| `…/178-12-t2-verify-intent-r2.sh` | **0** | comments removed, and the forgot-password file searched over the lines added since `fff98736b` alone |

**The two defects of the stage.**

1. *It reads comments.* `invitationFlow.fixture.ts` has held "**Rigidity contract**: NO `expect.soft`, NO `try/catch` wrapping `expect(...)`" in its header since before this plan, and so has every page object; the plan's own step 7 asks each new file for "the rigidity line". The stage cannot pass on a file that states the rule it checks.
2. *It reads a step the plan says not to change.* `fillEmailAndAdvance` holds `getByTestId('forgot-password-email')`, `('forgot-password-submit')` and `('forgot-password-success')`. The first two have registry keys; the third has none, in the registry or in the UI contract's block, because the message goes when plan 178-19 rebuilds the page. The plan's step 5: "Its existing success step is not changed here: it changes with the page, in plan 178-19." So the acceptance criterion "no fixture of this task holds a literal `data-testid` string" holds for everything this plan wrote and not for that one inherited step.

Every other stage of both chains passed as written: the names, the exports, the tracked files, the red-first status, the clean tree, `yarn test:unit:tests`, `yarn typecheck:tests`, the control's verdict and the gates' verdict.

## Red before green

`tests/e2e-runs/178-unit/178-12-t1-red.{log,exit,head}` — `yarn vitest run --config tests/vitest.config.ts mailedLink` at head `fff98736b` with the new cases and the unchanged helper: **exit 1, 6 failed, 29 passed**, every failure an `AssertionError`:

- asked for recovery, accepts a callback link whose only parameters are the token and type=recovery
- asked for recovery, accepts the parameters in either order
- asked for recovery, refuses a magiclink link
- asked for recovery, refuses a third type
- refuses to assert a type outside the two, even for a link of that type
- never puts the token of a recovery link into an error message

Seven of the thirteen new cases passed against the old helper: they pin what it already did (a recovery link refused when magiclink is asked for or nothing is, a third parameter and another path refused). After the change: 35 of 35 in the file, 117 of 117 in the harness's eight unit files.

## The link helper

`assertSignInLinkShape(link, { locale, type })`. `type` is `MailedLinkType`, `'magiclink' | 'recovery'`, and `'magiclink'` when absent, so every existing caller asserts what it asserted. The link's `type` must equal the one asked for; the error is `the type is not <asked>`. A type outside the two, forced through a cast, throws `can assert only the types [magiclink, recovery]` before the link is read. `toRunOrigin` and `runOriginFromEnv` are unchanged. The constant `SIGN_IN_LINK_TYPE` is gone; `SIGN_IN_LINK_PARAMETERS` stays. The header says what the function asserts now.

## The invitation fixture

### The option

`createInvitationFlow(admin, { addressPrefix, dedicatedRows })`. `dedicatedRows` is `DedicatedRowIds` — `Readonly<Partial<Record<'candidate' | 'organization', string>>>`, each value an `external_id` of the dataset. Absent, it is the contract spec's pair, as before. Given, the flow has exactly the rows named.

The module constant `DEDICATED_ROWS` is replaced by `CONTRACT_SPEC_ROWS` (the default) and a closure function `dedicatedRowOf(target)`, which answers the row's table and external id and throws `invitationFlow: this flow has no reserved <kind> row` for a kind the flow was not given.

**Steps whose body now reads the rows option** — every one that named `DEDICATED_ROWS`, none with a changed signature:

| Step | Reads |
|---|---|
| `readDedicatedRow(target)` | the row's table and external id |
| `seedEmailInvitation(target, email)` | the external id it seeds for |
| `seedCodeInvitation(target)` | the external id it seeds for |
| `inviteAndAskForLink(target, email, locale?)` | the external id it invites on |
| `invitationsFor(target)` | through `readDedicatedRow` |
| `createUserWithPassword({ editorOf })` | the external id of the row the user is made editor of |
| `resetDedicatedRows()` | every row the flow has: removes the invitations on them and makes each unconfirmed |
| `leftovers()` | every row the flow has; `0` invitations for a flow with no row |

`promisedGrant(target, row)` takes the row it is given and reads no option. `seedProjectInvitation`, `removeEverythingUnderPrefix` and `leftoversUnderPrefix` name no reserved row.

### The new steps

| Step | What it does |
|---|---|
| `recoveryLinkToOpen(address, { locale = 'en', subject = RECOVERY_LINK_EMAIL_SUBJECT })` → `Promise<string>` | Waits for the mail with that subject, asserts as a number that it holds exactly one link, asserts the recovery shape for the locale, returns the link on the run's origin and otherwise as received. A sign-in link is refused. |
| `witnessPageRequest(page, action)` → `Promise<'sent' \| 'not-sent'>` | See below. |
| `expectNoMailAfter(outcome, { address, mails = 0, noAccount = false })` | In this order: the outcome is `not-sent`; the catcher holds exactly `mails` mails for the address; with `noAccount`, no auth user holds it. `expectNothingSent` now calls the same inner function with its request's outcome. |

### How the witness step intercepts, and what it asserts

1. It opens a witness with the service role (`admin.openLinkWitness()`).
2. It routes `**/functions/v1/account-access` on the page. For each request: when it is a `POST` whose body parses as a JSON object naming the operation `request-link` or `request-recovery`, and no request has been given the witness yet, it is continued with `postData` = the same object plus `witness`. A later link request is counted and falls through. Everything else — a preflight, a `check-code`, a `code-sign-in`, a body that is not JSON — falls through with `route.fallback()`, untouched.
3. It runs `action`.
4. It asserts, with `expect.poll` on a number, that exactly one request was given the witness. This is the step's failure when the page made no request: it waits the expectation timeout and fails on `0`.
5. It removes the route, and asserts on a number that no further link request was made.
6. It awaits the witness and returns its outcome.

Nothing else of the request is touched: not its address, its headers or another member. The step's doc comment says what it changes, that the answer does not depend on it, and that its outcome is the only thing a "no mail" assertion may follow.

### The form of the seeding steps the tree held

The two-argument form: `admin.createInvitations([...])` calls `rpc('create_invitations', { p_project_id, p_invitations })`, and no schema file names `p_confirm_entity`. Phase 177.1 is not on the tree. The seeding steps take no confirmation argument and none was added.

## The constants

- `TEST_PASSWORDLESS_EMAIL` — `PASSWORDLESS_SESSION_ADDRESS_PREFIX` filled up with the letter `x` to a local part of exactly 64 characters, `@test.openvaa.local`, lower-case. Checked by a one-off script: length 64, equal to its lower-case form.
- `PASSWORDLESS_STORAGE_STATE` — `tests/playwright/.auth/user-passwordless.json`, which `tests/.gitignore` ignores (`playwright*/`).

`testCredentials.ts` now imports the prefix from `invitationConstants.ts`, a plain module with no import of its own.

## Every step of every page object

No spec calls any of these. "Frame" is the element that carries the screen's own test id.

### `createContestantLoginPage(page)` — the login screen (A) and the sign-in screen (B)

`goToPage`, `enterEmail`, `enterPassword`, `submit`, `login`, `getSubmitButton` and `expectErrorMessage` are unchanged in what they do. `goToPage()` still opens `ContestantAppLogin` and waits for `login.email`.

| Step | Reads |
|---|---|
| `expectEntryShown()` | `login.page` is visible |
| `expectRegisterOffered(offered: boolean)` | the frame's `data-register-offered`; `login.registerLink` visible, or count 0 |
| `expectAnswersLocked(locked: boolean)` | the frame's `data-answers-locked`; `login.answersLockedInfo` visible, or count 0 |
| `followSignIn()` | presses `login.signInLink` |
| `followRegister()` | presses `login.registerLink` |
| `expectNotice(reason: 'loginFailed' \| 'authError')` | `login.notice` is visible, with `data-reason` |
| `expectNoNotice()` | the frame is visible and `login.notice` has count 0 |
| `expectSignInShown()` | `login.signInPage` is visible |
| `expectLinkButton(offered: boolean)` | the frame is visible; `login.requestLink` visible, or count 0 |
| `typeEmail(address)` | fills `login.email` once it is editable |
| `pressRequestLink()` | presses `login.requestLink` |
| `expectEmailError()` | `login.emailError` is visible; `login.email` is `aria-invalid="true"` and focused |
| `expectFailure(status: 400 \| 403 \| 500)` | `login.errorMessage` is visible, with `data-status` |
| `expectInputAttributes()` | `login.email`: `type=email`, `name=email`, `autocomplete=username`; `password.field`: `name=password`, `autocomplete=current-password` |

Exports the types `ContestantLoginNoticeReason` and `ContestantSignInFailureStatus`.

### `createContestantRegisterPage(page)` — the registration screen (C), the address screen (D1), the used-code sign-in (D2)

| Step | Reads |
|---|---|
| `open()` | goes to `ContestantAppRegister` in `en`; `register.page` is visible |
| `expectListedModes(modes: ReadonlyArray<RegistrationMode>)` | the frame's `data-modes` equals the modes joined by a space |
| `expectSelectedMode(mode: RegistrationMode \| null)` | the frame's `data-mode-selected`; `null` asserts the empty string |
| `chooseMode(mode)` | `check()` on the radio (`register.modeInput`) inside the option block with that `data-mode` |
| `chooseModeWithKeyboard(mode)` | reads the mode's place in `data-modes` (throws when not listed); focuses the first radio; Space for the first mode, else that many ArrowDown; the mode's radio is checked and focused |
| `expectPanelOpen(mode)` | exactly one `register.modePanel` in the document, with that `data-mode`, visible |
| `typeEmail(address)` | fills `register.email` once editable |
| `typeCode(code)` | fills `register.code` once editable; never asserts on the code |
| `pressContinue()` | presses `register.submit` |
| `expectModesError()` | `register.modesError` is visible; the first radio is focused |
| `expectFieldError(field, reason)` | `'email'` with `'required' \| 'invalid'`: `register.emailError` is visible and its text equals the catalogue's `contestantApp.login.emailRequired` or `components.input.error.invalidEmail`. `'code'` with `'required' \| 'unconfirmed'`: `register.codeError` is visible with `data-reason`. Both: the control is `aria-invalid="true"` and focused |
| `expectCodeUnconfirmed()` | `register.codeError` visible with `data-reason="unconfirmed"`; `register.code` does not have the empty value; it is focused |
| `expectCodeInputAttributes()` | `register.code`: `type=text`, `name=code`, `autocomplete=off` |
| `expectEmailEntryShown()` | `register.emailEntryPage` is visible |
| `typeEmails(email, confirmation)` | fills `emailEntry.email` and `emailEntry.confirmation` |
| `leaveConfirmation()` | presses Tab on `emailEntry.confirmation` |
| `expectMismatch()` | `emailEntry.confirmationError` is visible; the confirmation is `aria-invalid="true"` |
| `pressEmailEntryContinue()` | presses `register.emailEntrySubmit` |
| `followEmailEntryReturn()` | presses `register.emailEntryReturn` |
| `expectCodeSignInShown()` | `register.signInPage` is visible |
| `typePassword(password)` | fills `password.field` once editable |
| `pressSignIn()` | presses `register.signInSubmit` |
| `expectRefusal()` | the frame's `data-sign-in-state="failed"`; `register.signInError` is visible |
| `pressRequestLink()` | presses `register.signInRequestLink` |
| `expectNoAddressField()` | the frame is visible; no `input` that is `type=email`, `name=email`, `autocomplete=email` or `autocomplete=username` |

Exports the types `ContestantRegisterField` and `ContestantRegisterFieldReason`. `RegistrationMode` is the application's own, imported as a type from `@openvaa/app-shared`.

### `createContestantEmailSentPage(page, admin)` — "email sent" (E)

| Step | Reads |
|---|---|
| `installClock()` | `page.clock.install()`; to be called before the navigation that leads to E |
| `expectShown({ wording, address? })` | `emailSent.page` visible with `data-wording`; with an address `data-address="shown"` and `emailSent.address` has exactly that text; without, `data-address="none"` and `emailSent.address` and `emailSent.changeAddress` have count 0 |
| `expectAskedAgain(shown: boolean)` | `emailSent.askedAgain` visible, or count 0 |
| `expectResendWaiting()` | the frame's `data-resend="waiting"`; `emailSent.resend` is `aria-disabled="true"`; `emailSent.countdown` is visible, has an `id`, and that id is one of the control's `aria-describedby`; the control takes focus |
| `advancePastTheWait()` | `page.clock.fastForward(RESEND_WAIT_SECONDS * 1000)`, the constant imported from `apps/frontend/src/lib/contestant/entryFlow/entryFlow` |
| `expectResendReady()` | the frame's `data-resend="ready"`; `emailSent.countdown` has count 0; the control is not `aria-disabled="true"` |
| `pressResend(address, { code }?)` | `admin.releaseLinkSlot(address, code)`, then presses `emailSent.resend`; the control is still focused |
| `expectStatus(which: 'requested' \| 'ready')` | `emailSent.status` has the text of `contestantApp.emailSent.resendRequested` or `.resendReady`, read from the English catalogue file |
| `followChangeAddress()` | presses `emailSent.changeAddress` |
| `followReturn()` | presses `emailSent.return` |

`wording` is the application's `EntryWording`. Exports the type `ContestantEmailSentStatus`.

### `createContestantSetPasswordGate(page)` — the set-password view (F)

| Step | Reads |
|---|---|
| `expectShown()` | `setPasswordGate.container` is visible |
| `expectAddress(address)` | `setPasswordGate.email` has exactly that text |
| `setPassword(password)` | fills `password.field` inside `passwordSetter.password` and inside `passwordSetter.confirm` with the password, presses `password.submit` |
| `submit(password, confirmation)` | the same with two values |
| `expectSaving()` | the container's `data-set-password-state="saving"` |
| `expectSaveFailure()` | the container's `data-set-password-state="failed"`; `setPasswordGate.error` is visible |
| `expectUsernameField(address)` | exactly one `form input[name="username"]`; it holds the address, is `readonly` and is hidden |
| `logOut()` | presses `setPasswordGate.logout` |
| `expectNoHorizontalOverflow()` | through `createPageGeometry(page)` |

### `createContestantForgotPasswordPage(page)`

| Step | Reads |
|---|---|
| `expectShown()` | `forgotPassword.page` is visible |
| `expectEmailError()` | `forgotPassword.emailError` is visible; `forgotPassword.email` is `aria-invalid="true"` and focused |

`fillEmailAndAdvance(email)` is unchanged.

### `contestant-registration.ts`

`createRegistrationTest({ addressPrefix, dedicatedRows })` — both required — returns Playwright's `test` extended with:

- `invitationFlow`, worker-scoped, built with that prefix and those rows;
- test-scoped `contestantLoginPage`, `contestantRegisterPage`, `contestantEmailSentPage`, `contestantSetPasswordGate`, `contestantPasswordSetter`, `contestantTermsOfUsePage`, `contestantForgotPasswordPage`, `contestantEntityHomePage` and `contestantHomePage`;
- test-scoped `flowState`.

`createFlowState(page)` has one step, `expectNothingOutsideMemory(values: ReadonlyArray<string>)`. It reads, in the page, the address bar (`location.href`), both web storages as their entries, `document.cookie` and `history.state`; in the test process it searches each place as it is and with its percent escapes resolved, for each value as it is and percent-escaped, without regard to case; and it asserts that the list of places holding a value is empty. A failure names places, never a value. It throws when given no value or an empty one.

The module exports `expect`, and the types `FlowStateFixture` and `RegistrationTest`.

## The control's verdict

`tests/e2e-runs/178-e2e/178-12-precommit`, head `fff98736b` with the four files of Task 1 uncommitted, through `tests/scripts/e2e-run.sh --no-db-reset --project invitation-contract`: wrapper exit 0; 17 total, 17 passed, 0 failed, flaky, skipped or did not run; `invitation-contract` 15 of 15, in 10.2 s of tests.

`node $P/178-verdict.mjs control 178-12-precommit --project invitation-contract --setup data-setup-base --dirty-only tests/tests/utils/ --dirty-only tests/tests/fixtures/shared/invitationFlow.fixture.ts --green` → **PASS**, exit 0.

Before the run: nothing in flight, port 5273 free, AC power at 100 %, the Docker VM 16.27 GiB free (floor 13.8). A copy of each held file is kept beside the run (`178-12-precommit.tests__tests__….kept`), and the commit script compared each file with its copy before committing.

## The gate rows — `tests/e2e-runs/178-gates/178-12-close`, head `9ae4f8ae7`

| Row | Exit | Seconds |
|---|---|---|
| typecheck | 0 | 27 |
| lint | 0 | 58 |
| unit | 0 | 88 |
| format | 0 | 21 |

`node $P/178-verdict.mjs gates 178-12-close --rows typecheck,lint,unit,format` → **PASS**: four rows expected and recorded, not stale, no Sleep entry inside the run window. AC power at 100 %.

## The mechanics measurement

`tests/e2e-runs/178-unit/178-12-mechanics-probe.mts`, run with `tsx`, exit 0, log beside it. It is no test of the suite and is not in the tree. It starts two listeners of its own — one stands in for the application's origin, one for the function, on another origin so that the request is preflighted — and a stub admin client whose witness reads `sent`, and runs **the committed step** and the clock calls in headless Chromium.

| Row | Result |
|---|---|
| a `request-link` body reaches the function as the page's own plus `witness` | PASS |
| its `Content-Length` is that of the body sent | PASS |
| the page reads the function's answer | PASS |
| a `check-code` before a `request-recovery`: the first passes as it was, the second is given the witness | PASS |
| a request the page sends 400 ms after the action resolved is still given the witness | PASS |
| no request: the step fails, on the count of witnessed requests | PASS |
| two link requests in one action: the step fails on the one with no witness | PASS |
| the clock installed before the navigation: the count starts at 65, one `fastForward` by the constant brings it to 0, and the page's timer fired once | PASS |
| the clock installed after the count began | the count still reads 65 after the jump (recorded, required neither way) |

## Decisions Made

1. **`dedicatedRows` names the flow's rows exactly.** *Deviations* 1.
2. **`witnessPageRequest` polls for its count.** A press resolves when the click is done, and the request it causes leaves after the handler's first `await`. A count read at once would fail a correct spec. `expect.poll` is a hard assertion on a number with the expectation timeout as its ceiling; it is not a fixed wait.
3. **A second link request in one action fails the step.** It would go out with no witness, and a "no mail" assertion after the first one's `not-sent` would say nothing about it. Stricter than the plan's "exactly one request was given the witness", and it serves that sentence's purpose.
4. **`expectSelectedMode` takes `null` for no mode**, and asserts the empty string. A step says what a user sees; the attribute's encoding stays in the fixture.
5. **The email field's reason on C is read from its sentence**, compared with the catalogue: the registry gives `register.emailError` no `data-reason`, where `register.codeError` has one.
6. **Three raw selectors, each with a `// reason:` line and the lint rule switched off for that line**, as the nomination editor's fixture does: an option block by its `data-mode`; the absence of any address control on D2; the user-name field of F, which is not rendered and has no test id.
7. **The composition root offers both home page objects**: `contestantEntityHomePage` (which entity's home the user landed on) and `contestantHomePage` (its tasks).
8. **The filler of the passwordless address is the letter `x`**, with no hyphen or dot, so that nothing in it offers a line break to a screen that shows it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — the mitigation of T-178-71] With `dedicatedRows`, a flow has exactly the rows it was given**

- **Found during:** Task 1, step 3.
- **Issue:** The plan's step 3 words the option as "a record from `candidate` and `organization` to an external id, each optional and each defaulting to the contract spec's row". The specs that will use it name one kind each: plan 178-14 the registration candidate, plan 178-17 the registration organization, plan 178-19 the recovery candidate. Under a default per key, each of those flows would also hold the contract spec's row of the other kind, and its `resetDedicatedRows()` — which plan 178-21 names in its hooks — would delete every invitation on that row and make it unconfirmed while the contract spec runs beside it. That is the threat the plan's own register mitigates ("one spec deleting another's invitations", T-178-71), and it would show as an intermittent failure of the contract spec.
- **Fix:** The default is the whole option: absent, the contract spec's pair, as before. Given, the flow has the rows named and no others; a step asked for the other kind throws `invitationFlow: this flow has no reserved <kind> row`; `resetDedicatedRows` and `leftovers` work through the flow's own rows. This agrees with the plan's truth ("takes the two reserved rows as an option, the contract spec's by default") and its behaviour line ("with `dedicatedRows` it writes on the rows it was given").
- **The plan's letter, should it be wanted:** one line — `dedicatedRows[target] ?? CONTRACT_SPEC_ROWS[target]` in `dedicatedRowOf`, and the same in `readEveryDedicatedRow`.
- **Files modified:** `tests/tests/fixtures/shared/invitationFlow.fixture.ts`
- **Verification:** the control (the contract spec, which passes no option) is green.
- **Commit:** `2a1268b4b`

**Total deviations:** 1 auto-fixed (Rule 2). **Impact:** a spec cannot write on, or clean, a row it did not name.

### Other departures, none of them a fix

2. **Both verify commands exit 1 as written.** Above. Each was run by its intent, both statuses recorded.
3. **`expect.poll` in `witnessPageRequest`, and its second assertion.** *Decisions* 2 and 3. The plan's order — action, count, route removed, witness awaited — is kept.
4. **Additive parameters the plan does not list:** `mails` on `expectNoMailAfter` (as `expectNothingSent` has it — plan 178-17's third pass asks about an address that already holds one mail); `subject` on `recoveryLinkToOpen` (as `signInLinkToOpen` has it, for another locale's mail); `{ code }` on `pressResend` (the admin client's `releaseLinkSlot` takes a code, and D2's request is made with one).
5. **A runtime guard on the link type** (a cast to a third type throws), with a unit case.
6. **A measurement the plan does not lay out**, kept under `tests/e2e-runs/178-unit/`. It changed no tree file.
7. **`createFlowState` is exported** beside the root, so that a setup or another root can use the step without the whole `test`.

## Issues Encountered

- `tsx` wraps a named inner function of a `page.evaluate` callback in a helper the page does not have (`__name is not defined`). It met the probe script alone; the script passes its page code as text. Playwright's own transform, which runs the fixtures, adds no such helper.
- `eslint tests` prints one warning in `tests/tests/support/mockOidcIssuerEntry.ts` (an unused `eslint-disable` for `no-console`). Older than this plan, not in its files, not changed.

## The code-review checklist

This plan adds no application code: ten files under `tests/`. The items that apply to test code were walked: no `any` (one `as never` in the probe script, outside the tree); every exported symbol and step has TSDoc; no sensitive value in a log, a title or an expectation's subject; `yarn assert:comment-hygiene` 0 with the new files staged, before each commit; `eslint tests` 0 errors; `prettier --check` 0.

## Prohibitions

- **PROH-178-34** — no step takes a link, a token, a code or a password as the subject of an expectation, prints one or titles a step with one. `recoveryLinkToOpen` asserts the count of links as a number and returns the link; `typeCode` and `typePassword` fill and assert nothing; `expectCodeUnconfirmed` asserts the field is not empty; `expectNothingOutsideMemory` reports places. An **address** is the subject of `expectShown`, `expectAddress` and `expectUsernameField`, as the plan lays them out. Held, by reading.
- **PROH-178-35** — no step repairs what it reads. A link of the other type throws; a mail with two links fails on the count; no request, or a second one, fails the witness step; a mode the screen does not list throws. Held, by reading and by the unit cases and the probe's rows.
- **PROH-178-36** — no fixed wait, no `expect.soft`, no `try`/`catch` around an expectation, no `.catch(() => null)` on an assertion. The two `try` blocks added wrap `JSON.parse` and `decodeURIComponent`, neither an expectation. Held; the restated search stage confirms it for code.

## Observed, and inferred

**Observed:** the unit cases, red then green; the contract spec green on the uncommitted helpers; the four gate rows; in Chromium against stand-ins — the witness member carried, the other request untouched, the two failures on a count, the clock moving a count when installed before the navigation and not after.

**Inferred, not observed:**

- That the application's own request is intercepted the same way. It is made by the Supabase client's `functions.invoke` with a JSON string body, which is what the probe's `fetch` sends; a body the browser does not expose to `postData()` would fail the step on a count of 0.
- That the function reads the added member and finishes the witness for a request a page made. The contract test of the function holds that a witness changes no answer.
- That each page object's locators meet the screens: none exists. The ids and attributes are the registry's and the UI contract's.
- That `page.clock` and the application's `ResendCountdown` meet as the probe's count does.

## Not done, or not verified

- **No full E2E run** — the plan lays none out. The two existing fixtures Task 2 touched (`contestantLoginPage`, `contestantForgotPasswordPage`) gained steps and kept theirs; the type check, the lint and the unit rows passed over them, and no browser ran them after the change. The login page object's existing steps now read the registry through a local alias `ids`, with the same ids.
- **That 65 seconds from settlement outlasts the server's 60-second slot** — not measured; no step reaches a screen.
- **The four steps that open B, D1, D2 and E by their own address** — not here, as the plan's last truth says: plans 178-13 and 178-15, with the route keys.
- **The signed-out scan declarer** — plan 178-21.
- **The stored session of the passwordless user** — nothing writes `PASSWORDLESS_STORAGE_STATE` yet: plan 178-22.
- **Items PL-10 and PL-14** were read by the operator on 2026-10-11 and stand at their recommended options; both are built so. PL-10's other option — a further witnessed request for the same address made after the page's — is not built; it would be one more step of this fixture.

## The state the local stack is left in

The stack is up (13 `openvaa-local` containers) and was not restarted. The database was not reset by this plan. It is as the control left it: the base dataset reseeded by `data-setup-base`, and whatever the contract spec's own cleanup leaves — which includes rows of `private.invitation_link_witness`, the known finding behind pgTAP file 39's test 238 on a database an E2E run has touched. Nothing is in flight, port 5273 is free, and no dev server of this plan is running.

## For later plans

**Predecessor label for the next full run: still `178-11-close`.**

### The fixture steps, by name and signature

```ts
// tests/tests/utils/mailedLink.ts
type MailedLinkType = 'magiclink' | 'recovery';
assertSignInLinkShape(link: string, { locale, type = 'magiclink' }: { locale: string; type?: MailedLinkType }): string

// tests/tests/utils/testCredentials.ts
TEST_PASSWORDLESS_EMAIL: string        // 64-character local part under passwordless-session-
PASSWORDLESS_STORAGE_STATE: string     // tests/playwright/.auth/user-passwordless.json

// tests/tests/fixtures/shared/invitationFlow.fixture.ts
type DedicatedRowIds = Readonly<Partial<Record<'candidate' | 'organization', string>>>;
createInvitationFlow(admin?, { addressPrefix?, dedicatedRows? }: { addressPrefix?: string; dedicatedRows?: DedicatedRowIds })
  .recoveryLinkToOpen(address: string, { locale?, subject? }?): Promise<string>
  .witnessPageRequest(page: Page, action: () => Promise<void>): Promise<'sent' | 'not-sent'>
  .expectNoMailAfter(outcome: 'sent' | 'not-sent', { address, mails?, noAccount? }): Promise<void>

// tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts — createContestantLoginPage(page)
expectEntryShown(); expectRegisterOffered(offered: boolean); expectAnswersLocked(locked: boolean);
followSignIn(); followRegister(); expectNotice(reason: 'loginFailed' | 'authError'); expectNoNotice();
expectSignInShown(); expectLinkButton(offered: boolean); typeEmail(address: string); pressRequestLink();
expectEmailError(); expectFailure(status: 400 | 403 | 500); expectInputAttributes();

// contestantRegisterPage.fixture.ts — createContestantRegisterPage(page)
open(); expectListedModes(modes: ReadonlyArray<RegistrationMode>); expectSelectedMode(mode: RegistrationMode | null);
chooseMode(mode); chooseModeWithKeyboard(mode); expectPanelOpen(mode);
typeEmail(address); typeCode(code); pressContinue(); expectModesError();
expectFieldError('email', 'required' | 'invalid'); expectFieldError('code', 'required' | 'unconfirmed');
expectCodeUnconfirmed(); expectCodeInputAttributes();
expectEmailEntryShown(); typeEmails(email, confirmation); leaveConfirmation(); expectMismatch();
pressEmailEntryContinue(); followEmailEntryReturn();
expectCodeSignInShown(); typePassword(password); pressSignIn(); expectRefusal(); pressRequestLink(); expectNoAddressField();

// contestantEmailSentPage.fixture.ts — createContestantEmailSentPage(page, admin: SupabaseAdminClient)
installClock(); expectShown({ wording: 'signIn' | 'recovery' | 'code', address?: string }); expectAskedAgain(shown: boolean);
expectResendWaiting(); advancePastTheWait(); expectResendReady(); pressResend(address: string, { code }?: { code?: string });
expectStatus(which: 'requested' | 'ready'); followChangeAddress(); followReturn();

// contestantSetPasswordGate.fixture.ts — createContestantSetPasswordGate(page)
expectShown(); expectAddress(address); setPassword(password); submit(password, confirmation);
expectSaving(); expectSaveFailure(); expectUsernameField(address); logOut(); expectNoHorizontalOverflow();

// contestantForgotPasswordPage.fixture.ts — createContestantForgotPasswordPage(page)
expectShown(); expectEmailError();

// contestant-registration.ts
createRegistrationTest({ addressPrefix: string, dedicatedRows: DedicatedRowIds })   // returns `test`
createFlowState(page).expectNothingOutsideMemory(values: ReadonlyArray<string>): Promise<void>
export { expect }
```

Every step returns `Promise<void>` unless a return is shown.

### What each plan should know

- **Every spec plan — a spec's `test`:** `const test = createRegistrationTest({ addressPrefix: EMAIL_REGISTRATION_ADDRESS_PREFIX, dedicatedRows: { candidate: REGISTRATION_CANDIDATE_EXTERNAL_ID } });` and `import { expect } from '…/contestant-registration'`. Both options are required.
- **A flow has only the rows it names.** `seedCodeInvitation('organization')` on a flow built with a candidate alone throws. `resetDedicatedRows()` and `leftovers()` reach the flow's own rows; `removeEverythingUnderPrefix()` reaches the prefix.
- **An invitation a step seeds is honoured only for a mode the project's stored matrix allows for that entity type** (the fixture's header says so). This plan did not read which modes the base dataset allows a candidate: read the template before writing a seeding step.
- **178-21 — two scan candidates:** the option names at most one row of each kind. A spec that reserves two candidates builds a second flow (`createInvitationFlow(new SupabaseAdminClient(), { addressPrefix, dedicatedRows: { candidate: … } })`) or widens the option; the root builds one flow.
- **178-13 — the login page object:** `goToPage()` still opens `ContestantAppLogin` and waits for `login.email`; re-point it with B's route key. The steps for A and B exist; the step that opens B by its address does not. `typeEmail` is `enterEmail` behind a wait for the field to be editable. The header's first sentence describes two screens; today one page is both.
- **178-13, 178-15 — the four opening steps** (B, D1, D2, E by address) are added with their route keys. `tests/tests/utils/buildRoute.ts` types `route` by the application's map, so a key that does not exist yet does not compile.
- **178-14 — the witness's first real use:** `const outcome = await invitationFlow.witnessPageRequest(page, async () => { await contestantLoginPage.pressRequestLink(); });`. The step waits for the request up to the expectation timeout, so the action need not wait for E. One link request per call: a press and a resend are two calls. If the count comes out 0 for a request the page did make, the browser did not expose its body — that is the case the plan's ruling 2 names, and the fallback is a further witnessed request after the page's.
- **178-14, 178-17, 178-19 — "no mail":** `await invitationFlow.expectNoMailAfter(outcome, { address, noAccount: true })`; with `mails: 1` for an address an earlier request mailed.
- **178-16 — `expectNoPageRequest`:** the fixture module holds `ACCOUNT_ACCESS_ROUTE` (`**/functions/v1/account-access`), `WITNESSED_OPERATIONS` and `jsonObjectOf(body)`, none exported; the new step can read them.
- **178-16 — a single mode:** `expectPanelOpen` asserts exactly one `register-mode-panel`. Whether the selector renders that element when one mode is listed was not read; with one mode assert the field instead, or check the component.
- **178-16 — the email field's error on C** is told by its text. If the screen gives `register-email-error` a `data-reason`, the step should read that instead, as the code field's does.
- **178-13 (E), every spec with a resend:** call `installClock()` before the navigation that leads to E — measured: a clock installed after the count began does not move it. `advancePastTheWait()` then `expectResendReady()`; `pressResend(address)` gives the server's slot back first. For D2's request, made with a code, pass `{ code }`.
- **E's markup the steps rest on:** `email-sent-resend` is on the element that carries `aria-disabled` and `aria-describedby`; `email-sent-countdown` has an `id`. Plan 178-10's component renders both so.
- **F's markup the steps rest on:** the `input[name="username"]` is inside a `<form>`; the main button keeps `set-password-submit`; the two fields keep `password-setter-password` and `password-setter-confirmation` around `password-field`.
- **`expectNothingOutsideMemory` reads `document.cookie`**, so not a cookie the page cannot read. After a sign-in the session cookie holds the user's address by design; the step is for the signed-out screens of the flow.
- **178-19 — the forgot-password page object:** `fillEmailAndAdvance` still holds three literal ids and asserts `forgot-password-success`; it changes with the page. A recovery request for an address with only an open invitation is sent the sign-in mail, so that case reads `signInLinkToOpen`, and `recoveryLinkToOpen` refuses its link.
- **178-22 — the passwordless session:** the two constants exist; the setup that writes the file and the projects do not.
- **Any plan whose verify searches a fixture for `expect.soft` or `.catch(() => null)`** will meet the header's rigidity line. Run the intent with comments removed and record both statuses; `178-12-t2-verify-intent-r2.sh` is the form.
- **A script run with `tsx` that passes a function with a named inner function to `page.evaluate`** fails with `__name is not defined`. Pass the page code as text.
- **Timing on this host today:** the link helper's unit file 0.1 s and the harness's unit suite 2.9 s, by vitest's own count; the control 22 s from the wrapper's start to its end, 10.2 s of them tests; the four gate rows 3 min 14 s. `yarn typecheck:tests` was not timed.

## Threat register

| Threat | Disposition | As built |
|---|---|---|
| T-178-67 a credential in a report | mitigate | counts and shapes as numbers and booleans; a link is returned for `page.goto` alone; the memory step names places; no console print in a fixture |
| T-178-68 a "no mail" that passes early or on no request | mitigate | `expectNoMailAfter` takes the witness's outcome first; the witness step fails on a count of 0 and on a second request; both observed in the probe |
| T-178-69 the witness changing what the application does | mitigate | one member added, every other request falls through; observed: a `check-code` passed byte for byte and the page read the function's answer |
| T-178-70 a helper that repairs a link | mitigate | the other type, a further parameter, another path and a third type each throw: unit cases |
| T-178-71 one spec deleting another's rows | mitigate | rows as an option, exact when given (*Deviations* 1); one prefix per spec; the contract spec keeps its own by default and was the control |
| T-178-72 a real minute waited | mitigate | the page clock by the application's constant, the slot released by the admin client; no fixed wait in any fixture |
| T-178-SC installs | accept | no package installed |

## Threat Flags

None. The plan adds test helpers only and no surface of the application.

## Known Stubs

None.

## Next Phase Readiness

Ready for 178-13. The steps a screen's spec is written in exist for every screen of the flow; each screen's plan writes its spec first in them and sees it red.

## Self-Check: PASSED

- The ten files of `key-files` exist; the four new ones are tracked.
- Commits `2a1268b4b` and `9ae4f8ae7` are ancestors of HEAD; `git rev-list --count fff98736b..HEAD` was 2 when this file was written.
- `tests/e2e-runs/178-unit/178-12-t1-red.{log,exit}`, `tests/e2e-runs/178-e2e/178-12-precommit/results.json`, `tests/e2e-runs/178-gates/178-12-close/summary.tsv` and `tests/e2e-runs/178-unit/178-12-mechanics-probe.log` exist.
