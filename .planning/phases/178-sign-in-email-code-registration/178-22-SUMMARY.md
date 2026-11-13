---
phase: 178-sign-in-email-code-registration
plan: 22
subsystem: testing
tags: [playwright, axe, wcag, a11y, e2e, contestant-app, phone-width, stored-session]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-21: contestant-entry-scan, its two reserved candidates and ENTRY_SCAN_ADDRESS_PREFIX, the predecessor run 178-21-close-r2 (502 tests, 120 projects); plan 178-14: the set-password view and its page object; plan 178-19: the password-reset page and its page object; plan 178-12: the invitation flow's seeding, link and cleanup steps"
provides:
  - "data-setup-passwordless-session / data-teardown-passwordless-session: the stored session of a user with no password at PASSWORDLESS_STORAGE_STATE, made through a mailed link"
  - "contestant-a11y-scan: three more entries (contestant-set-password-gate, contestant-set-password-gate-invalid, contestant-password-reset), each in both themes: 24 to 30 tests"
  - "contestant-entry-phone: twenty phone-width checks, ten screens at 320 and 390 px"
  - "page-object steps: contestantSetPasswordGate.open(), .expectAddressInsideView(); contestantEmailSentPage.expectAddressInsideScreen()"
affects: [178-23, 178-24]

actuals:
  tokens: 10958
  tasks: 3
  commits: 2
plan_head_before: 86c9f6a5db26f4888a1bfdba089836f83b9390f0
plan_head_after: 4fe87f913189d6a0a0c1a095be7506598d83b3b8

tech-stack:
  added: []
  patterns:
    - "A stored session of a user with no password is made through the application's own pipeline: seedProjectInvitation, askForLink with its witness read 'sent', signInLinkToOpen, page.goto, then storageState"
    - "A spec that may hold no locator reaches an element's geometry through a page-object step that hands the element to the geometry fixture"

key-files:
  created:
    - tests/tests/setup/contestant/passwordless-session.setup.ts
    - tests/tests/setup/contestant/passwordless-session.teardown.ts
    - tests/tests/specs/contestant/contestant-entry-phone.spec.ts
  modified:
    - tests/tests/specs/a11y/contestant-a11y.spec.ts
    - tests/playwright.config.ts
    - tests/tests/fixtures/contestant/contestantSetPasswordGate.fixture.ts
    - tests/tests/fixtures/contestant/contestantEmailSentPage.fixture.ts

key-decisions:
  - "The seeded promise is project scope with the role 'editor'. That shape is in neither ADMIN_GRANTS nor CONTESTANT_GRANTS, so the coarse role is null and the Admin App's protected layout (role !== 'admin') refuses the session. Read from source, not observed in a browser"
  - "The invalid-state entry types a password the form accepts and a different confirmation. PasswordSetter.validate() reports one field at a time, so the state scanned has the confirmation in error, not both fields"
  - "contestantAxeScan.ts was not edited: an entry's reach step already runs after the page is opened and before the marker is asserted"
  - "U-26, U-27, PL-11 and PL-22 were read by the operator on 2026-10-11 and stand at their recommended options; they are built so"

requirements-completed: [REG-11, REG-13, FIX-01, REG-01, REG-03]

coverage:
  - id: T1
    description: "The set-password view is scanned by axe in both themes, as it opens and with its confirmation in error, under the stored session of a user made through a mailed link; the reset page is scanned as it opens under the project's session"
    requirement: REG-11
    verification:
      - kind: e2e
        ref: "tests/tests/specs/a11y/contestant-a11y.spec.ts (project contestant-a11y-scan) in tests/e2e-runs/178-e2e/178-22-close"
        status: pass
    human_judgment: false
  - id: T2
    description: "Ten screens of the entry flow are no wider than the viewport at 320 and 390 px; the longest address stays inside the 'email sent' screen and the set-password view"
    verification:
      - kind: e2e
        ref: "tests/tests/specs/contestant/contestant-entry-phone.spec.ts (project contestant-entry-phone) in tests/e2e-runs/178-e2e/178-22-close"
        status: pass
    human_judgment: false
  - id: T3
    description: "The new sentences and labels in the six other locales at 320 px, and the long text buttons wrapping inside the button in each locale"
    verification:
      - kind: manual
        ref: "backstop truths, for plan 178-24 to file for a person"
        status: not-run
    human_judgment: true

duration: "2026-10-15 21:09Z to 21:45Z"
completed: 2026-10-15
status: complete
---

# Phase 178 Plan 22: The Set-password View and the Reset Page Scanned Under Real Sessions, and Every Entry Screen Measured at Phone Width — Summary

**The set-password view is scanned by axe in both themes, as it opens and with its confirmation in error. It is
scanned under the stored session of a user whose account was made by the application's own link request. The
reset page is scanned under the project's session. Ten screens of the entry flow are measured at 320 and 390 px.
The closing run `178-22-close` is green: 530 of 530 in 123 projects. That is exactly the four stated differences
from `178-21-close-r2`.**

## Read this first

- **Complete.** Three tasks, two code commits, all runs green on the first attempt. No run was void.
- **No axe violation and no overflow** was found on any screen. No screen was corrected.
- **Two verify stages had defects and were restated** (Task 2), both recorded below. Task 1's and Task 3's verifies
  pass as written.
- **Deviation:** two page objects outside `files_modified` gained steps, because the phone spec may hold no locator.

## Performance

- Plan start 2026-10-15T21:09:13Z; closing run 21:26:19Z to 21:39:19Z (13 min 0 s).
- Tasks: 3 of 3. Files: 3 created, 4 modified.

## Task Commits

| # | Commit | Subject | Files |
|---|---|---|---|
| 1 | `5c65bbdfd` | test(178-22): the set-password view and the reset page are scanned by axe, under the session of a user with no password | `passwordless-session.setup.ts` (new), `passwordless-session.teardown.ts` (new), `contestant-a11y.spec.ts`, `playwright.config.ts` |
| 2 | `4fe87f913` | test(178-22): no screen of the entry flow overflows at 320 or 390 pixels | `contestant-entry-phone.spec.ts` (new), `contestantSetPasswordGate.fixture.ts`, `contestantEmailSentPage.fixture.ts`, `playwright.config.ts` |
| 3 | — | runs and this summary only | — |

`commits: 2` is measured as `git rev-list --count 86c9f6a5d..HEAD` before this summary's commit.

Each held set was run on the uncommitted tree before its commit. The kept copies of the run are beside it:
`tests/e2e-runs/178-e2e/178-22-scan.<path>.kept` and `178-22-phone.<path>.kept`. Nothing was edited between a
run and its commit, apart from the summary.

## How the session was made, and whether it lasted

`passwordless-session.setup.ts` does the following:

1. It removes everything under `passwordless-session-` and gives the address's link slot back.
2. It seeds a project-scope invitation with the role `editor` for `TEST_PASSWORDLESS_EMAIL` through
   `seedProjectInvitation`.
3. It asks for a link through `askForLink` and asserts the witness reads `sent`.
4. It opens `signInLinkToOpen(...)` in the page as received.
5. It waits for the set-password view and asserts the view names that address.
6. It stores `page.context().storageState` at `PASSWORDLESS_STORAGE_STATE`.

The setup calls no helper that stores a password, and neither does anything else.

- **Observed:** the setup passed in all three runs (`178-22-scan`, `178-22-phone`, `178-22-close`). In
  `178-22-close` it ran as test 68 of 530. Its readers ran as tests 140 to 143 (the four set-password scans) and
  159 and 173 (the phone checks of the view). All six passed, and each reach step asserted the view and the
  address before its scan or measure.
- **Not measured:** whether the session would last all 13 minutes of a run. Every reader had finished by test 173,
  about the first third of the run. Ruling 1's fallback (a session per describe) was not needed.
- **The role's reach:** project scope `editor` is in neither `ADMIN_GRANTS` nor `CONTESTANT_GRANTS`
  (`apps/frontend/src/lib/auth/roles.ts`). So `getBasicUserData` gives the role `null`, and
  `routes/admin/(protected)/+layout.ts` refuses it (`userData.role !== 'admin'`). The stored session therefore
  reaches no Admin App page. This was read from source, not observed. The Contestant App's protected layout gates
  on `passwordSet` before it reads any entity. So the view is shown whatever the grant, and the callback asks
  for no grant (read from source).

## The scan entries

The scan project had **24 tests before** this plan (12 entries) and **30 after** (15 entries).

| Entry | Session | Reach, marker | `178-22-scan` | `178-22-close` |
|---|---|---|---|---|
| `contestant-set-password-gate` | `PASSWORDLESS_STORAGE_STATE` | home route; view shown and names `TEST_PASSWORDLESS_EMAIL`; anchor and marker `setPasswordGate.container` | 2 passed | 2 passed |
| `contestant-set-password-gate-invalid` | the same | the same, then `submit(password, a different confirmation)` and `expectFieldError('confirmation')`; marker `passwordSetter.confirmationError` | 2 passed | 2 passed |
| `contestant-password-reset` | project's (`STORAGE_STATE`) | `ContestantAppResetPassword`; page shown and names `TEST_CANDIDATE_EMAIL`; anchor `passwordReset.email`, marker `passwordReset.page` | 2 passed | 2 passed |

With the fourteen entries of `contestant-entry-scan` and the three of the closed-project spec, the twenty entries
of the UI contract are on the tree.

The spec's header was brought in line with these entries:

- the counts (fifteen surfaces, 30 scans);
- the fifth stored session;
- the "fifteen dark twins" divergence;
- the paragraph on routes outside the family. It said `password-reset` needs no authentication, which is false.
  It also said that nothing scans the signed-out entry screens, which `contestant-entry-scan` now does.

## The phone-width checks

Twenty tests in `contestant-entry-phone`, titled `phone 320: …` and `phone 390: …`. The screens are:

- the login screen;
- the sign-in screen;
- the registration screen with the email option open, and with the code option open;
- the screen that asks for the address of a valid code;
- the screen that signs in the holder of a used code;
- the "email sent" screen, with an address of a 64-character local part;
- forgot-password;
- the set-password view, under the passwordless session, whose address also has a 64-character local part;
- the reset page, under the project's session.

Each test reaches its screen through page-object steps that assert the screen's frame, then asserts
`expectNoHorizontalOverflow()`. On the "email sent" screen and the set-password view, the address is also asserted
inside the screen's root, and its text inside its own box (`expectShowsWholeText`). This is done at **both** widths;
the plan asks for 320 only on the "email sent" screen (see Deviations).

Result: 20 of 20 passed in `178-22-phone` and in `178-22-close`. No overflow was found.

## Each task's verify command, with its real exit status

| Task | Script | Head | Exit | Note |
|---|---|---|---|---|
| 1, as written | `tests/e2e-runs/178-unit/178-22-t1-verify.sh` | `5c65bbdfd` | **0** | |
| 2, as written | `178-22-t2-verify.sh` | `4fe87f913` | **1** | stage `git grep -q -F "phone 320:"` |
| 2, restated (dirty-only only) | `178-22-t2-verify-r2.sh` | `4fe87f913` | **1** | the same stage |
| 2, restated (both stages) | `178-22-t2-verify-r3.sh` | `4fe87f913` | **0** | |
| 3, as written | `178-22-t3-verify.sh` | `4fe87f913` | **0** | |

**The two defects in Task 2's verify:**

1. **The title search reads the source.** The titles are built in a loop over the widths
   (`` `phone ${width}: …` ``), so the literal `phone 320:` never appears in the file. Repeating twenty literal
   titles would bend the code to the search. The restated stage `178-22-t2-titles.sh` asks Playwright for the
   project's collected titles (`--list --no-deps`) and requires exactly ten beginning `phone 320: `, ten beginning
   `phone 390: `, and twenty in the project. It reads `phone 320: 10; phone 390: 10; in the project: 20`, exit 0.
2. **The control's `--dirty-only` list omits the two page objects** that this plan's deviation edits. As written,
   the verdict reads `FAIL (2)`, naming exactly those two files (`178-22-phone.verdict.log`, exit 1). The same run
   with the two files added reads `PASS` (`178-22-phone.verdict-r2.log`, exit 0).

## The gate rows

| Run | Head | Rows | Verdict |
|---|---|---|---|
| `178-gates/178-22-close` | `4fe87f913` | lint 0 (47 s), unit 0 (76 s), format 0 (19 s) | `gates --rows lint,unit,format`: PASS, not stale, no Sleep entry in the window |

No screen was corrected, so the three-row form applies. Ad hoc before each commit:

- `yarn typecheck:tests` 0;
- `eslint` on the changed files 0 (one "file ignored" warning for `playwright.config.ts`);
- `yarn assert:a11y-scan-wiring` 0, with 0 violations;
- `yarn assert:comment-hygiene` 0, with 0 violations.

## The runs

| Run | Tree | Totals | Against its predecessor | Docker VM free before | Verdict |
|---|---|---|---|---|---|
| `178-e2e/178-22-scan` | uncommitted, head `86c9f6a5d`, `--project contestant-a11y-scan` | 40 passed | scan project 30 of 30 | 23.95 GiB | `control … --green`: PASS |
| `178-e2e/178-22-phone` | uncommitted, head `5c65bbdfd`, `--project contestant-entry-phone` | 55 passed | phone project 20 of 20 | 23.95 GiB | as written FAIL (the stage's defect); restated PASS |
| `178-e2e/178-22-close` | head `4fe87f913` | **530 passed**, 0 failed, flaky, skipped or did not run | 123 compared, 0 not as expected: `contestant-a11y-scan` 24+6, `contestant-entry-phone` 0+20, `data-setup-passwordless-session` 0+1, `data-teardown-passwordless-session` 0+1, every other project equal | 23.89 GiB (after the driver's prune) | `e2e … --same-projects-as 178-21-close` (read as `-r2`) with the four `--except` values and both title counts: **PASS**, not stale, no Sleep entry in the window |

**Power:** on battery for every run.

- The closing run went from 85 % to 78 %, discharging.
- No run started below 30 %.
- `sleep_entries_in_window: 0`.

### The auth budget

Counted with `tests/e2e-runs/178-unit/178-18-auth-peaks.sh` over each run's `started` to `ended`. Origin 2 is the
suite's.

| Run | Password sign-ins, total | Most in five minutes | Link verifications (most in five minutes) |
|---|---|---|---|
| `178-21-close-r2` (for reference) | 37 (30 × 200, 7 × 400) | 25 | 18 (18) |
| `178-22-close` | 37 (30 × 200, 7 × 400) | **25** | 20 (20) |
| `178-22-scan` | 4 | 4 | 1 |
| `178-22-phone` | 4 | 4 | 3 |

The plan adds **no password sign-in**. It adds two link verifications: the setup's link, and the phone spec's
seeding of a used code. The password peak stays at 25 of 30, under the stop line at 27. Link verifications peak at
20 of 30.

## Decisions Made

- **The seeded promise is project scope, role `editor`.** It names no entity, and its reach is the Contestant
  App's set-password view alone (see above).
- **The invalid state has the confirmation in error.** `PasswordSetter.validate()` stops at the first failing
  field. So "both of its fields in error" (the plan's first truth) is not a state the form can show. The task's own
  step (two different passwords, marker `passwordSetter.confirmationError`) is what was built. The first password
  satisfies the form's rules, so the refusal lands on the confirmation. Nothing is sent, because `validate()`
  returns before the save.
- **The declarer was not extended**: `reach` already runs before the marker.
- **The "content column" is the screen's root**, the element that carries the screen's test id. The step asserts
  the address's box inside it and the address's text inside its own box. The inner `max-w-xl` column has no test
  id, so it was not targeted.
- U-26, U-27, PL-11 and PL-22 were read by the operator on 2026-10-11. They stand at their recommended options and
  are built so.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Blocking] Two page objects gained steps, outside `files_modified`.**

- **Found during:** Task 2, step 1.
- **Issue:** the spec may hold no locator. The set-password view's page object had no step that opens the view, and
  neither page object could hand its address element to the geometry fixture.
- **Fix:**
  - `contestantSetPasswordGate.open()`: home route, then wait for the view.
  - `contestantSetPasswordGate.expectAddressInsideView()`.
  - `contestantEmailSentPage.expectAddressInsideScreen()`.
  - Each address step calls `expectInside` and `expectShowsWholeText` of `pageGeometry.fixture.ts`.
- **Commit:** `4fe87f913`.

**2. [Rule 1 - Defect of a verify stage] Task 2's title search and `--dirty-only` list were restated.** See the
verify table. Both statuses are recorded.

**3. The address check runs at both widths on the "email sent" screen**, not only at 320 px. This keeps every test
body free of a width branch, and it only adds an assertion.

**4. The scan spec's header** was corrected beyond the entries: the `password-reset` sentence, and the coverage
paragraph on the signed-out screens. These are comments only.

**Total deviations:** 1 blocking fix in the test layer, 1 restated verify stage, 2 departures that only add
evidence or correct comments. **Impact:** no application code changed. No scan was narrowed, excluded or skipped.

## Prohibitions

- **PROH-178-64:** the setup names neither `forceRegister`, `createUserWithPassword`, `registerAndStoreSession` nor
  `setPassword(`, and Task 1's verify checks this. No test under the session saves a password. The invalid entry's
  pair is refused by the form, and the closing run reads each set-password entry exactly twice, all passed.
- **PROH-178-65:** nothing was found, so nothing was corrected. No viewport, assertion, element or rule was changed.

## Threat register

- **T-178-138:** mitigated. The account is made by the link request, and the setup names no password helper. Both
  entries assert the view's own elements and the account's address.
- **T-178-139:** mitigated. No reader saves a password. The readers of the session all passed in the full run.
- **T-178-140:** mitigated. `tests/playwright/.auth/user-passwordless.json` is ignored by git
  (`tests/.gitignore: playwright*/`). The setup prints nothing of the link, and no test title or log holds it.
- **T-178-141:** mitigated. There are twenty width checks and two address checks, each at both widths.
- **T-178-142:** mitigated. Every phone test asserts its screen's frame (or, for D1 and D2, the screen's own
  `expect…Shown`) before it measures.

## Observed, and inferred

- **Observed:**
  - the runs, verdicts and counts above;
  - the auth counts;
  - the order of the session's readers in the closing run;
  - no Sleep entry in any run's window.
- **Inferred (from source):**
  - the Admin App refuses the session's role;
  - the protected layout gates on `passwordSet` before it reads entities.

## For a person (plan 178-24 to file)

The two backstop truths were not tested by any automated step:

1. **The new sentences and labels in the six other locales at 320 px.** Every new sentence, label, option name and
   button label renders without clipping or overlap in `da`, `et`, `fi`, `fr`, `lb` and `sv`. The phone spec
   measures `en` only.
2. **A text button's long label at 320 px.** "I have not set a password yet" and "Use another email address" wrap
   inside the button in each locale, and the page does not widen.

Also still for a person: the "to look at on rendered screens" items that 178-09 to 178-19 handed to 178-21 and
178-22. They were scanned by axe and measured for overflow only; nobody has looked at them:

- the centring of `ErrorMessage inline` under start-aligned labels;
- the forgot-password link announced as a button;
- the setter's 50-character main-button label at 320 px (N-2: no overflow was measured, and the wrap was not looked
  at);
- D2's long refusal sentence;
- the login screen's footer placement;
- the reset page's support button directly under the main button.

## Not done, or not verified

- The selector's identity-provider panel at phone width (ruling 4): the base dataset does not allow that mode.
- A first-time user with a project-scope grant and no password who **passes** the gate ("nothing to edit" after
  it): no test of this plan reaches it, by PROH-178-64.
- The saving label, the failed-save sentence, the focus move after the gate, and Log Out from the view in a browser
  (178-14's list): not asserted here.
- Whether a stored link session lasts a whole run: its readers finished in the first third.

## Known Stubs

None.

## Threat Flags

None. No new surface: test files only.

## The state the local stack is left in

- Up, not restarted.
- The database holds what the closing run's teardowns leave; the passwordless user and invitation are removed by
  their teardown. The run used `--no-db-reset`, so pgTAP test 238 of file 39 is red on it until the next reset (the
  known finding).
- Nothing listens on 5273, and no run is in flight.
- Docker VM: 23.78 GiB free after the run (`df -k` in an alpine container: 24934908 KiB).
- Power: on battery, 78 %, discharging.

## For later plans

- **Predecessor label for the next full run: `178-22-close`.** 530 tests, 123 projects, head `4fe87f913`. A
  comparison with `178-21-close-r2` needs:
  `--except contestant-a11y-scan=6 --except contestant-entry-phone=20 --except data-setup-passwordless-session=1 --except data-teardown-passwordless-session=1`.
- **The passwordless session:**
  - It is at `PASSWORDLESS_STORAGE_STATE`, written by `data-setup-passwordless-session`.
  - A new reader names that setup in its project's dependencies, and never saves a password or signs out under it.
  - The user's address is `TEST_PASSWORDLESS_EMAIL` (64-character local part). The user holds a project-scope
    `editor` grant and no entity.
- **New page-object steps:**
  - `contestantSetPasswordGate.open()` opens the home route and waits for the view;
  - `.expectAddressInsideView()`;
  - `contestantEmailSentPage.expectAddressInsideScreen()`.
- **`contestant-entry-phone`** runs after `contestant-entry-scan` on the same two candidates and prefix. It seeds and
  removes its own codes, and its `afterAll` asserts nothing is left. It is in the dependencies of
  `data-setup-perm-1e1cg1co`. A plan that adds a screen to the entry flow adds two tests there, one per width.
- **A verify stage that searches a spec for a title built in a loop** finds nothing. Read titles from
  `playwright test --list --no-deps --project <name>` instead (`178-22-t2-titles.sh` is the form).
- **The auth budget:** a full run peaks at 25 of 30 password sign-ins in five minutes (37 in all, unchanged) and 20
  link verifications. The stop line is still 27.
- **For 178-23:**
  - `tests/README.md`: no row for `contestant-entry-phone`, `data-setup-passwordless-session` or its teardown;
    nothing on the passwordless session or the three new steps.
  - The components skill's convention 6 (the scan family) does not name the new entries.
  - The `auth-setup` comment in `playwright.config.ts` lists the readers of the base candidate's session and does
    not name `contestant-entry-phone`.
- **For 178-24:** the two backstop truths and the list for a person above.
- **Timing on this host today:**
  - the scan control 21 s of tests;
  - the phone control 1.0 min of tests;
  - the three gate rows 2 min 22 s;
  - the closing full run 13 min 0 s, on battery.

## Self-Check: PASSED

- `tests/tests/setup/contestant/passwordless-session.setup.ts`, `.teardown.ts` and
  `tests/tests/specs/contestant/contestant-entry-phone.spec.ts` exist. `git merge-base --is-ancestor` holds for
  `5c65bbdfd` and `4fe87f913`.
- `tests/e2e-runs/178-e2e/178-22-close` reads 530 passed. `178-22-t1-verify.exit`, `178-22-t2-verify-r3.exit` and
  `178-22-t3-verify.exit` are 0.
