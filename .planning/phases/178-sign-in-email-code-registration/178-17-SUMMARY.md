---
phase: 178-sign-in-email-code-registration
plan: 17
subsystem: testing
tags: [playwright, e2e, registration, registration-code, email-link, oracle, resend, page-clock, fixtures, contestant-app]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-03: the reserved rows and the widened matrix of the base dataset; plan 178-12: createRegistrationTest, the page objects, witnessPageRequest, expectNoMailAfter, installClock; plan 178-13: the sign-in screen and the email-sent screen; plan 178-14: the tracer and the set-password view; plan 178-15: the address screen and the used code's sign-in; plan 178-16: the mode selector, the guard, expectNoPageRequest"
provides:
  - "contestant-email-registration.spec.ts: nine tests (six added) — the email-sent oracle, the sign-in oracle, the link button, resend on the page's clock, asked again, reload"
  - "contestant-code-registration.spec.ts: six tests, and the project contestant-code-registration, a base leaf named in the first perm setup's dependencies"
  - "tests/tests/fixtures/shared/screenShape.fixture.ts: readScreenShape(root, masked), ScreenShape, ControlShape"
  - "Fixture steps: freshVisitor; flowState.expectNothingShown; invitationFlow.seedUsedCode, .unknownCode, .expectMailCount; contestantEmailSentPage.holdClockStill, .reload, .shape; contestantLoginPage.signInScriptLoaded, .expectWrongCredentials, .expectEmailKept, .refusalShape, .expectEndedOnEntry; contestantRegisterPage.expectEmailInputAttributes, .expectEmailEntryInputAttributes, .expectCodeSignInInputAttributes, .followCodeSignInReturn; contestantSetPasswordGate.expectInputAttributes"
affects: [178-18, 178-19, 178-21, 178-22, 178-23, 178-24]

actuals:
  tokens: 20830
  tasks: 3
  commits: 3
plan_head_before: 913512bb01306cbbdfd363f03cc01e92ce3e109c
plan_head_after: 928f792daa5ea94142bbe0a811b4e545afceb951

tech-stack:
  added: []
  patterns:
    - "An oracle is shown absent by reading each case's screen as data — the root's state attributes, its lines of text, its controls — with what was typed replaced, and comparing the readings with toEqual"
    - "Two visits can show the same count only on a clock that stands still: page.clock.setFixedTime fixes Date and leaves the timers running, so the page still hydrates, navigates and settles"
    - "A second visitor is a browser context of its own built by a test-scoped fixture, with page objects bound to its page; the test's own page is not reused, so the tab's memory is empty"
    - "A used code is made without a page, through the function, the mail and the user's own session, so each test begins from a state it makes itself and the spec's afterEach can remove everything"
    - "A mail a finished request's `sent` outcome promised is waited for with a poll; a count that must not grow is asserted once, after the witness"

key-files:
  created:
    - tests/tests/specs/contestant/contestant-code-registration.spec.ts
    - tests/tests/fixtures/shared/screenShape.fixture.ts
  modified:
    - tests/tests/specs/contestant/contestant-email-registration.spec.ts
    - tests/playwright.config.ts
    - tests/tests/fixtures/shared/invitationFlow.fixture.ts
    - tests/tests/fixtures/contestant/contestant-registration.ts
    - tests/tests/fixtures/contestant/contestantEmailSentPage.fixture.ts
    - tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts
    - tests/tests/fixtures/contestant/contestantRegisterPage.fixture.ts
    - tests/tests/fixtures/contestant/contestantSetPasswordGate.fixture.ts

key-decisions:
  - "Each test makes its own state: the used code of the two used-code tests comes from invitationFlow.seedUsedCode, not from the code the first test registered, because the spec keeps the email spec's afterEach, which removes every user and invitation"
  - "The oracle tests compare the cases with each other as data (readScreenShape) on top of asserting each by the same steps, and the email-sent oracle holds the page's clock still so that the count is part of the comparison"
  - "The reload test of the code spec is titled without the UI contract's screen letters, which read as decision ids in this tree; the plan's verify stage that searches for the letters fails as written"
  - "The login screen is anchored by its bare address and its help link, because it has no root marker until plan 178-18"

patterns-established:
  - "readScreenShape(root, masked) for any screen that must look the same whatever the server knows about what was typed"
  - "freshVisitor() for a request that must come from a tab that has asked for nothing"

requirements-completed: [REG-09, REG-10]

duration: 28min
completed: 2026-10-13
status: complete
---

# Phase 178 Plan 17: The Two Registration Specs, Completed — the Email Mode's Oracle, Resend and Reload Cases, and the Whole Code Mode for an Organization — Summary

**Twelve browser tests show that the email-sent screen and the sign-in screen tell an outsider nothing, that the count follows the page's clock, that nothing typed survives a reload or leaves memory, and that a registration code walks from the selector through the address screen and the used code's sign-in to an organization's home. The first browser walk of a code found no defect of the application.**

## Read this first

- **No application file was changed.** Every one of the twelve tests was green on its first run. PROH-178-51 was never called on.
- **Three commits, not two.** The plan names the two specs and the configuration. The tests needed eighteen fixture steps that did not exist, and one new fixture file; they are a commit of their own before the specs, as the operator's standing instruction lays out.
- **Two verify stages fail as written**, for reasons this file states under *Each task's verify command*: the header's rigidity line (both specs), and a search for the title `reload: D1 and D2` (the code spec), whose title I wrote without the screen letters.
- **The full run is 464 of 464 in 118 projects**, twelve more tests than `178-16-close`, in the two projects.

## Performance

- **Duration:** 28 min from the first edit to the full run's verdict (00:59:13Z to 01:27:08Z). The reading before it was not timed.
- **Tasks:** 3
- **Files modified:** 10 (2 created)

## Task Commits

| # | Commit | What |
|---|---|---|
| — | `e8c4be62f` | `test(178-17): steps for comparing two visits to a screen, a second visitor, a used code and what a reload leaves` — seven fixture files; no committed spec called a new step |
| 1 | `3518f522f` | `test(178-17): the email registration's oracle, resend, repeated-request and reload cases` |
| 2 | `928f792da` | `test(178-17): registration with a code, for an organization — a valid code, a used code, the claimant's link, an unconfirmed code` — the spec and `tests/playwright.config.ts` |
| 3 | — | The gate rows and the full run; evidence only |

## Each task's verify command, with its real exit status

Each block was taken from the plan by a script, byte for byte, into `tests/e2e-runs/178-unit/178-17-t<N>-verify.sh` and run with `bash`.

| Task | As written | Why | The intent | Status |
|---|---|---|---|---|
| 1 | **1** | the search for `expect.soft` finds the header's rigidity line | `178-17-t1-verify-intent.sh`: the same chain with the search made over the code with comments removed | **0** |
| 2 | **1** | the title search for `reload: D1 and D2` | `178-17-t2-verify-title-only.sh`: that one stage restated to `reload: the two screens a code leads to` — then **1**, at the header's rigidity line; `178-17-t2-verify-intent.sh`: both restated | **0** |
| 3 | **0** | — | — | — |

The spec bodies hold no `getByTestId`, `getByRole`, `locator(`, `expect.soft` or `waitForTimeout`; the email spec holds nine tests and the code spec six, counted by the plan's own script in the intent runs.

## The tests, with what each showed

### `contestant-email-registration.spec.ts` — six added, nine in all

| Test | What a browser showed |
|---|---|
| `oracle: an invited and an uninvited address meet the same "email sent" screen, and only the invited one is mailed` | Three visitors, each in a browser context of its own, registered by email: the invited address, an uninvited one, the invited one again. Each met the screen in its sign-in wording with its address, the resend control waiting and described by its line, and no asked-again sentence. The three readings of the screen were equal: `data-wording`, `data-address`, `data-resend`, fourteen lines of text with "You can ask for a new email in 65 seconds." and four controls. The witnesses read `sent`, `not-sent`, `not-sent`; after them the catcher held one mail for the invited address and none for the other, which had no account. |
| `oracle on sign-in: an unknown address, a wrong password and an account with no password get one sentence and one status` | Three sign-ins on a hydrated sign-in screen, each refused with `data-status="400"` and the catalogue's `error.wrongEmailOrPassword`, the address still in its field. The three readings of the screen were equal: its state, eleven lines of text, eight controls. The sign-in form's input attributes were asserted. |
| `link button: with no usable address nothing is sent` | An empty field and `not-an-address` each made no request to the function; the email field showed its error, was marked invalid and had focus. |
| `resend: "Send again" is unavailable for the count, then repeats the request` | The control waiting, focusable and described; the page's clock moved past the wait; the control ready, its line gone, the status region holding the ready message; a press, after the slot was given back, whose witness read `sent`, with two mails in the catcher; the status region holding the requested message; the control waiting again with focus on it. The registration screen's email input attributes were asserted. |
| `asked again: the same address asked a second time inside the count adds one sentence` | "Use another email address" led back to the registration screen; the same address again led to the screen with the asked-again sentence; the second witness read `not-sent` and the address still held one mail. |
| `reload: the "email sent" screen reloaded ends on the login screen, and holds nothing of what was typed` | After a reload, and after a visit to the screen's address, the visitor was on the login screen's bare address with no notice and no error; the address was in no text, no field, and none of the five places outside memory. |

### `contestant-code-registration.spec.ts` — six, new

| Test | What a browser showed |
|---|---|
| `register: an invited organization registers with a code` | The code typed in lower case without its separators led to the address screen; two different addresses were told so when the confirmation was left; the same address twice made one link request, `sent`; the mailed link, opened as received, led to the set-password view naming the account, then the terms, then the organization's home, with the promised grant in `public.grants`. The code field's, the address screen's and the set-password form's input attributes were asserted. Neither form of the code nor the address was outside memory at any step. |
| `used code: the same code leads to the password sign-in, and signs in` | A used code led to the password sign-in, which holds no address field; entered again after Return, it led there again. A wrong password was refused on the same screen; the claimant's password landed on the organization's home. The screen's input attributes were asserted, and the claimant's address was on no screen and in no place a browser keeps. |
| `used code, link: "I have not set a password yet" mails the claimant, and the screen shows no address` | The link button made one request, `sent`; the screen that followed was in its code wording with no address and no change link; the claimant's address was nowhere on it; the catcher held two mails for the claimant; the newest link, opened as received, landed on the home with no set-password view. |
| `asked again on the code path: a corrected address inside the count adds one sentence` | "Use another email address" led back to the address screen, which still held the code; a second address led to the screen with the asked-again sentence; the second witness read `not-sent`, and the corrected address had no mail and no account. |
| `unconfirmed: a code no project holds is told one sentence, twice` | A well-formed random code was told the catalogue's `contestantApp.register.codeUnconfirmed` twice, the code still in its field and focus back on the field each time; the visitor stayed on the registration screen with the code mode chosen. |
| `reload: the two screens a code leads to, opened with nothing held, end on the registration page` | Each of the two addresses, opened in a tab that holds no code, ended on the registration screen with no mode chosen. |

## Whether the page's clock drove the count

**Yes.** `installClock()` before the first navigation, `advancePastTheWait()` on the email-sent screen, and the screen read `data-resend="ready"` with the counting line gone. The resend test took 2.0 s in its control and 1.9 s in the full run; no test waits a minute. The fallback of Task 1 step 3 was not needed.

`holdClockStill()` (`page.clock.setFixedTime`) is a second use of the page's clock, for the oracle alone: the count is computed from `Date.now()`, so on a clock that stands still each of the three screens read 65. The timers keep running, and the page hydrated, navigated and settled as usual. It is not combined with `advancePastTheWait()`.

## The form of the seeding steps

The two-argument form: `seedEmailInvitation(target, email)` and `seedCodeInvitation(target)`, with no confirmation argument. Phase 177.1 is not on the tree (`178-BASELINE-FACTS.md`: `create_invitations: two-argument form`). `seedUsedCode(target, { acceptTermsOfUse })` is new and takes the same form inside.

## What the two specs ask of the auth service

Counted from the auth service's own log (`supabase_auth_openvaa-local`), in the window of each control run, by path, grant type and status; `tests/e2e-runs/178-unit/178-17-auth-counts.sh` prints counts and no line of the log.

| Spec | Link verifications (`POST /verify` 200) | Password sign-ins (`POST /token`, `password`) | Token refreshes |
|---|---|---|---|
| email (9 tests) | 2 | 3, all refused with 400 | 2 |
| code (6 tests) | 4 | 2: one 200, one 400 | 1 |
| both | **6** | **5** | 3 |

Fewer than a dozen of each, as T-178-111 requires. The code window also holds one `GET /verify` answered 303 with "One-time token not found": that is the function's own question whether the callback is an admitted redirect target, asked with a token no user holds (`REDIRECT_QUESTION_TOKEN` in `account-access/index.ts`), and not a verification by a spec.

In the full run `178-17-close`, from the host's address: 32 password sign-ins with at most **22 in any five minutes**, and 13 verifications, all inside one five-minute span. The service admits thirty of each. From the function's address: 4 password sign-ins and 2 `GET /verify`.

## The runs

| Label | What | Verdict |
|---|---|---|
| `178-17-dev-email`, `178-17-dev-email-shapes`, `178-17-dev-code` | development runs of one project each on the working tree, fixtures uncommitted; the second logged the six shapes read, through a line added to `readScreenShape` for that run and removed after | 11 of 11, 11 of 11, 8 of 8; not controls, and judged by nothing |
| `178-17-email` | the Task 1 control, head `e8c4be62f`, only the email spec uncommitted | `control --green`: **PASS** — 11 tests, 9 of 9 in the project; 42 s from the wrapper's start to its end |
| `178-17-code` | the Task 2 control, head `3518f522f`, only the code spec and the configuration uncommitted | `control --green`: **PASS** — 8 tests, 6 of 6 in the project; 34 s |
| `178-gates/178-17-close` | `lint`, `unit`, `format` on head `928f792da` | `gates --rows lint,unit,format`: **PASS** — 0, 0, 0 (54 s, 86 s, 23 s) |
| `178-17-close` | the full default run of head `928f792da` | `e2e`: **PASS** — 464 passed, 0 failed, flaky, skipped or did not run, 118 projects; 12 min 37 s; no Sleep entry in its window; AC power |

Per project against `178-16-close`: 118 compared, 0 not as expected. `contestant-email-registration` 9 against 3 (+6), `contestant-code-registration` 6 against 0 (+6), every other project equal. The Docker VM had 16.1 GiB free before the full run and 16.0 GiB after.

For the Task 1 control the code spec and the configuration, already written, were moved out of the tree to the session's scratch directory and put back afterwards, so that the email spec alone was uncommitted. The copies each control ran are kept beside the runs as `178-17-email.*.kept` and `178-17-code.*.kept`.

The standing `TypeError: Cannot read properties of undefined (reading 'map')` is once in the full run's dev-server log, as in every full run.

## Decisions Made

- **Each test makes its own state.** The plan's wording ("the same code", "the invited address of the first test", "a second code invitation") reads as one chain through the serial describe; it also asks for the email spec's hooks, whose `afterEach` removes every user and invitation. The hooks were kept. The used code of the two used-code tests comes from `seedUsedCode`, which registers a fresh address with a fresh code through the function, the mail, the user's session and the claim, sets a password, and gives the address's slot back. "The same code" in the second test is the code entered twice in that test, which is REG-09's idempotency in a browser. A code registered in a browser and then entered again in the same browser is not walked; the server state the second test starts from is the one the first test ends in, made by the same function and the same claim.
- **The oracle is a comparison of data.** On top of the same steps for each case, `readScreenShape` reads the root's `data-` attributes, the lines of text and every link, button and form control with its `type`, `name`, `autocomplete`, `href`, text and four booleans, with the typed address replaced. Ids are left out because they are generated per render; a control's value is read as filled or empty.
- **The title of the code spec's reload test.** Written as `reload: the two screens a code leads to, opened with nothing held, end on the registration page`. In this tree `D1` and `D2` are decision ids of earlier phases (`apps/frontend/eslint.config.mjs`), no test or fixture of this phase uses the UI contract's screen letters, and the rules ask a title to read cold.
- **"Ends on the login screen".** `expectEndedOnEntry()` asserts the login screen's bare address with no search parameter, the screen's help link, and no notice and no refused sign-in's message. The login page has no root marker until 178-18.
- **A sign-in that must keep the address is made on a hydrated page.** `signInScriptLoaded()` waits for the link button to be enabled; a sign-in posted before the script has loaded is answered with a new page that does not keep the address, by plan 178-13's ruling.
- **The reload test types an address nobody invited**, so it seeds nothing; its witness reads `not-sent`.

## Deviations from Plan

### Auto-fixed Issues

None. No test found a defect, and no fixture step needed a correction after its first run.

### Other departures, none of them a fix

1. **A commit before Task 1 for fixture steps** (`e8c4be62f`), and seven fixture files outside the plan's `files_modified`. The plan expects the composition root to hold every step; it did not hold a second visitor, a screen comparison, a clock that stands still, a reload of the email-sent screen, the refusal's sentence, the kept address, an anchor for the login screen, the input attributes of four screens, the used code's way back, a used code, an unknown code or a wait for a promised mail.
2. **`expectCodeUnconfirmed()` now also asserts the sentence**, read from the catalogue. No committed spec called the step before this plan.
3. **Development runs before the controls** (three, listed above), because the controls allow only the spec to be uncommitted and the steps were new. They are not evidence of anything in this summary except the six shapes quoted.
4. **The title of one test** differs from the plan's, as decided above.
5. **The plan's truth "D1 and D2 reloaded"** is shown as the plan's own task words it: each opened by its address with no code held. A reload of the address screen while it holds a valid code was not walked.

## Issues Encountered

- One `GET /verify` answered 303 in the code control's window looked like a failed verification by a spec. Read from the log's own fields (the function's address, the callback as referer, before the two `generate_link` calls) and from the function's source, it is the function's redirect question. Observed, and no finding.

## The code-review checklist

Not walked: the plan adds no application code. The fixture and spec files were type-checked (`yarn typecheck:tests`, 0), linted (`eslint`, 0) and formatted (`prettier --check`, 0) before each commit, and `yarn assert:comment-hygiene` ran at 0 with the new files staged. No comment or title names a decision, a plan or a screen letter.

## Prohibitions

| Id | Held | How |
|---|---|---|
| PROH-178-50 | yes | every "no mail" and "no account" follows `witnessPageRequest`'s outcome through `expectNoMailAfter`; a press that must send nothing runs inside `expectNoPageRequest`; no step infers an end from elapsed time |
| PROH-178-51 | not called on | no test found a defect |
| PROH-178-52 | yes | no title holds a code, a link, an address or a password; codes and passwords go to fields and to `page.goto` alone; the shape comparison replaces the address; cleanup is asserted in `afterAll` of both specs, claimed invitations included |

## Threat register

| Threat | Disposition | What stands |
|---|---|---|
| T-178-105 | mitigated | the two oracle tests compare readings of the screens with `toEqual`; the mail and the account are read after the witnesses |
| T-178-106 | mitigated | as PROH-178-50 |
| T-178-107 | mitigated | `expectNothingOutsideMemory` after the steps that type or hold an address or a code, in both specs; it names places, never values |
| T-178-108 | mitigated | `expectNoAddressField`, `expectShown({ wording: 'code' })` and `expectNothingShown([claimant's address])` on both screens, while the mail is found at the claimant's address |
| T-178-109 | mitigated | as PROH-178-52 |
| T-178-110 | mitigated | nothing was loosened, retried or waited for |
| T-178-111 | mitigated | 6 verifications and 5 password sign-ins, measured |
| T-178-SC | accepted | no package installed |

## Observed, and inferred

- **Observed in a browser:** everything in the two tables of tests; that `page.clock.setFixedTime` leaves the application working; that a code walks the selector to the address screen and to the used code's sign-in; that the used code's sign-in action signs in and refuses; that "Use another email address" on the code path leads back to an address screen that still holds the code.
- **Observed in the auth log:** the counts above.
- **Inferred, not observed:** that the third pass of the email-sent oracle is always inside the server's minute. The whole test took 4.3 s here; a runner four times slower would take about 19 s, against 60. That the second request on the code path is refused by the code's binding interval and not by something else: read from `invitation_link_request`'s source, and the witness read `not-sent`.

## Not done, or not verified

- **A switched-off mode is not walked in a browser** (the plan's ruling 4).
- **Timing is asserted nowhere** (item PL-28 at its recommended option; probe row P7 stands: the sign-in screen's timing is not uniform, and no test or text here claims it is).
- **The assumption of ruling 5 is still unresolved:** every press that must send is made after the server's slot was given back through the admin client, so no test shows that 65 seconds of wall clock from settlement outlast the server's 60. What is shown is that the page's clock drives the count. The margin stays reasoned from the function's source; plan 178-23 files the check a person can make.
- **A reload of the address screen or of the used code's sign-in while a code is held** was not walked; each was opened by its address with nothing held.
- **A code registered in a browser and entered again in the same run** was not walked; see *Decisions Made*.
- `tests/README.md` and the comment of the `contestant-email-registration` project were not edited.

## Threat Flags

None: no application surface was added or changed.

## Known Stubs

None.

## The state the local stack is left in

As a full E2E run leaves it: the base dataset torn down by the suite's own teardowns, no user and no invitation under `email-registration-` or `code-registration-` (asserted by each spec's `afterAll` in the full run), and the rows of `private.invitation_link_witness` that no teardown removes, so `39-invitations.test.sql` test 238 is red until the next reset. No reset and no restart was made by this plan. Nothing listens on the E2E port and no run is in flight.

## For later plans

- **Predecessor label for the next full run: `178-17-close`** (464 tests, 118 projects, head `928f792da`). A comparison with `178-16-close` needs `--except contestant-email-registration=6 --except contestant-code-registration=6`.
- **The new steps, by name and signature:**

  ```ts
  // tests/tests/fixtures/shared/screenShape.fixture.ts
  readScreenShape(root: Locator, masked: ReadonlyArray<string>): Promise<ScreenShape>
  // ScreenShape = { state: Record<string, string>; text: Array<string>; controls: Array<ControlShape> }

  // contestant-registration.ts — fixtures of createRegistrationTest
  freshVisitor(): Promise<EntryVisitor>   // { page, contestantLoginPage, contestantRegisterPage, contestantEmailSentPage, flowState }
  flowState.expectNothingShown(values: ReadonlyArray<string>): Promise<void>

  // invitationFlow.fixture.ts
  seedUsedCode(target, { acceptTermsOfUse = false }?): Promise<{ code: string; claimant: PasswordUser }>
  unknownCode(): string
  expectMailCount(address: string, count: number): Promise<void>

  // contestantEmailSentPage.fixture.ts
  holdClockStill(); reload(); shape(address?: string): Promise<ScreenShape>

  // contestantLoginPage.fixture.ts
  expectEndedOnEntry(); signInScriptLoaded(); expectWrongCredentials(); expectEmailKept(address); refusalShape(address): Promise<ScreenShape>

  // contestantRegisterPage.fixture.ts
  expectEmailInputAttributes(); expectEmailEntryInputAttributes(); expectCodeSignInInputAttributes(); followCodeSignInReturn()
  // expectCodeUnconfirmed() now also asserts the catalogue's sentence

  // contestantSetPasswordGate.fixture.ts
  expectInputAttributes()
  ```

- **178-18 (the login screen) — two steps of the email spec's reload test rest on today's login page.** `expectEndedOnEntry()` asserts the bare address of `ContestantAppLogin`, `login-help-link` visible, and no `login-notice` and no `login-errorMessage`. If the new screen keeps `login-help-link`, as the registry's comment says, the step holds as it is; give it the root marker's assertion when `login.page` exists. It is called twice by `reload: the "email sent" screen reloaded…`. The pre-commit run of 178-18's held set will show it.
- **178-18 — `signInScriptLoaded()`** reads `login-request-link` enabled, so it is for a sign-in screen that offers the link button. The sign-in oracle calls it three times.
- **178-19 (recovery) — the recovery oracle** can be written as the email-sent oracle is: `freshVisitor()`, `holdClockStill()` before the navigation, the same steps for each case, `shape(address)` and `toEqual`. `expectMailCount` waits for a promised mail; `expectNoMailAfter` stays the only "no mail".
- **178-21 (the scans) — a used code for a scan entry** is `seedUsedCode('candidate')` on a flow that names the candidate; it mails a fresh address under the flow's prefix, verifies one link and sets a password, and `unknownCode()` gives a code that names nothing.
- **Any spec with several passes inside the server's minute** states the assumption; the email-sent oracle's three passes took 4.3 s here.
- **The auth service's budget in a full run now:** at most 22 password sign-ins in any five minutes from the host's address, and 13 link verifications, against thirty of each. A plan that adds sign-ins to a base leaf reads `tests/e2e-runs/178-unit/178-17-auth-counts.sh` for the form of the count.
- **A `GET /verify` answered 303 in the auth log** is the function's redirect question, not a spec's failed link.
- **A verify stage that searches a spec for `expect.soft`** hits the header's rigidity line, as before: `178-17-t1-verify-intent.sh` is the form.
- **178-23 — documentation now out of date:** `tests/README.md` has no row or paragraph for `contestant-code-registration`, and none of the new steps; the comment of the `contestant-email-registration` project in `tests/playwright.config.ts` describes the tracer alone, where the spec now holds nine tests and writes several invitations and users.
- **Timing on this host today:** the email project alone 42 s and the code project 34 s from the wrapper's start to its end; the three gate rows 54 s, 86 s and 23 s; the full run 12 min 37 s.

## Next Phase Readiness

Plan 178-18 can start: the tree is clean, the committed suite is green, and both registration modes have a browser on them from the selector to the home.

## Self-Check: PASSED

The two specs, the fixture file, the configuration, this summary and the evidence of the five runs judged here were found on disk; the commits `e8c4be62f`, `3518f522f` and `928f792da` are ancestors of HEAD; the specs hold nine and six tests.
