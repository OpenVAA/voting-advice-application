---
phase: 178-sign-in-email-code-registration
plan: 21
subsystem: testing
tags: [playwright, axe, wcag, a11y, e2e, contestant-app, dark-mode]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-16: declareEntryScans and the wiring gate's reading of entryAxeScan.ts; plan 178-17: seedUsedCode, unknownCode and the registration page object's steps; plan 178-18: the login screen's markers and page object; plan 178-19: the forgot-password page object; plan 178-20: the predecessor run 178-20-close-r2 (473 tests, 119 projects)"
provides:
  - "tests/tests/specs/contestant/contestant-entry-scan.spec.ts: fourteen signed-out entry states scanned by axe through declareEntryScans, each in light and in a context created dark (28 tests), and one menu test (29 tests in all)"
  - "Playwright project contestant-entry-scan: a leaf after data-setup-base, empty stored session, fullyParallel false, named in the dependencies of data-setup-perm-1e1cg1co"
  - "scripts/assert-a11y-scan-wiring.mjs: the new spec among the files that may declare scans, its gate declareEntryScans from '../../utils/entryAxeScan'"
  - "navMenu fixture: expectItemLeadsTo(name, path) and expectNoItemLeadsTo(path)"
affects: [178-22, 178-23, 178-24]

actuals:
  tokens: 8250
  tasks: 2
  commits: 4
plan_head_before: 6e5dd70fa2bc8e8df3eb180f3ee5ff0832e51209
plan_head_after: 7a413bb2fb839c2200e76d5f5c9c193fe37f45c5

tech-stack:
  added: []
  patterns:
    - "Two reserved rows of one kind take two invitation flows under one address prefix: a flow names at most one row per kind"
    - "A negative control's verdict that names an entry whose name is a prefix of another entry's is judged by exact title"

key-files:
  created:
    - tests/tests/specs/contestant/contestant-entry-scan.spec.ts
  modified:
    - tests/playwright.config.ts
    - scripts/assert-a11y-scan-wiring.mjs
    - tests/tests/fixtures/shared/navMenu.fixture.ts

key-decisions:
  - "U-26 built at (a): the fourteen signed-out entries live in a spec and project of their own, a declared departure from D-22's letter. U-26 was read by the operator on 2026-10-11 and stands at its recommended option"
  - "The declarer was not extended: every entry fits { name, routeId, reach, marker, alsoShown }"
  - "The spec builds two invitation flows (createInvitationFlow) under ENTRY_SCAN_ADDRESS_PREFIX instead of one createRegistrationTest, because a flow names one row per kind and the two scan candidates are both candidates"

requirements-completed: [REG-01, REG-02, REG-03, REG-09, REG-10, REG-13, FIX-01]

coverage:
  - id: D1
    description: "Fourteen signed-out entry states pass axe in light and dark, each behind a reach marker only its state renders"
    requirement: REG-13
    verification:
      - kind: e2e
        ref: "tests/tests/specs/contestant/contestant-entry-scan.spec.ts (project contestant-entry-scan) in tests/e2e-runs/178-e2e/178-21-close-r2"
        status: pass
    human_judgment: false
  - id: D2
    description: "A scan cannot pass against a state it did not reach: the negative control is red in exactly entry-email-entry's two tests, on its marker"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/178-e2e/178-21-control judged by tests/e2e-runs/178-unit/178-21-control-intent.mjs"
        status: pass
    human_judgment: false
  - id: D3
    description: "The menu a signed-out visitor is offered: Sign in, Register, Forgot Password?, Help, each leading to its screen; no item to pre-registration or the code screens"
    requirement: REG-01
    verification:
      - kind: e2e
        ref: "contestant-entry-scan.spec.ts#menu: a signed-out visitor is offered Sign in, Register and Forgot Password?"
        status: pass
    human_judgment: false
  - id: D4
    description: "The a11y wiring gate lists the new spec"
    verification:
      - kind: other
        ref: "yarn assert:a11y-scan-wiring (inside tests/e2e-runs/178-unit/178-21-t1-verify-r2-at-head.log)"
        status: pass
    human_judgment: false

duration: "Task 1 and the gate set by the first executor on 2026-10-15 morning (about 08:40Z to 09:11Z); this executor 20:50Z to 21:10Z"
completed: 2026-10-15
status: complete
---

# Phase 178 Plan 21: Every Signed-out Screen of the Entry Flow Scanned by Axe, in Both Themes — Summary

**Fourteen states of the login, sign-in, registration, code, "email sent" and forgot-password screens pass axe in
light and dark behind proven reach markers, with a menu test beside them. They sit in a new project,
`contestant-entry-scan`, which the a11y wiring gate knows. The closing run `178-21-close-r2` is green: 502 of
502, 120 projects, exactly the new project's 29 tests more than `178-20-close-r2`.**

## Read this first

- **Complete.** Two executors did this plan:
  - The first committed Task 1 (`9b7b74c9f`), ran the gate rows (PASS) and made the closing run `178-21-close`.
    That run was **VOID**: exit 8, `VOID-host-suspend.txt`, a gap of 570 s. Its session then ended on a network
    error (ENOTFOUND).
  - This executor re-established Task 1's verify, confirmed the gate set is current, made the closing run again
    as **`178-21-close-r2`** (green), and wrote this summary.
- **Cause of the void, read from `pmset -g log`:** at 11:19:11 +0200 (09:19:11Z) the host logged
  `Entering DarkWake state due to 'Clamshell Sleep'`, on AC power. The lid was closed during the run.
  `caffeinate` does not hold off a clamshell sleep. The void directory is kept. It is not evidence in either
  direction and was not diagnosed.
- **No axe finding and no overflow** in any run. No component was corrected. The declarer was not extended.
- **Not a defect of the tree:** Task 1's verify, as written, exits 1 because of a defect in its own verdict stage
  (below). Its intent, restated, exits 0.

## Performance

- First executor: Task 1 and its runs 2026-10-15 about 08:40Z to 09:11Z; the void run 09:13Z to 09:28Z.
- This executor: 2026-10-15 20:50Z to about 21:10Z.
- The closing full run: 20:51:49Z to 21:04:04Z (12 min 15 s).
- Tasks: 2 of 2. Files changed by the plan's code commit: 4.

## Task Commits

| # | Commit | Subject | Files |
|---|---|---|---|
| 1 | `9b7b74c9f` | test(178-21): every signed-out screen of the entry flow is scanned by axe, in both themes | `contestant-entry-scan.spec.ts` (new), `playwright.config.ts`, `assert-a11y-scan-wiring.mjs`, `navMenu.fixture.ts` |
| 2 | — | Task 2 holds runs and this summary only | — |

`commits: 4` is measured as `git rev-list --count 6e5dd70fa..HEAD` before this summary's commit. Of those four,
one is this plan's code commit. The other three are the orchestrator's `.planning` commits made during the pause:
`f1c0c0f24`, `ca87620eb` and `7a413bb2f`.

The kept copies `tests/e2e-runs/178-e2e/178-21-precommit.<path>.kept` of the four held files are byte for byte
equal to HEAD. This was compared with `cmp` by this executor.

## Each task's verify command, with its real exit status

| Task | Script | Head | Exit | Note |
|---|---|---|---|---|
| 1, as written | `tests/e2e-runs/178-unit/178-21-t1-verify.sh` (byte for byte from the plan) | `9b7b74c9f` | **1** | see below |
| 1, restated | `178-21-t1-verify-r2.sh` | `9b7b74c9f` | **0** | |
| 1, as written, again | `178-21-t1-verify.sh` → `178-21-t1-verify-at-head.*` | `7a413bb2f` | **1** | the same single failure |
| 1, restated, again | `178-21-t1-verify-r2.sh` → `178-21-t1-verify-r2-at-head.*` | `7a413bb2f` | **0** | every stage PASS |
| 2, as written | `178-21-t2-verify.sh` (byte for byte from the plan) → `178-21-t2-verify.{log,exit,head}` | `7a413bb2f` | **0** | see below |

**The defect in Task 1's verify.** The stage `control 178-21-control … --red "entry-email-entry"` matches titles
by substring. `entry-email-entry` is a prefix of `entry-email-entry-mismatch`, so the stage names four tests. It
then fails because the two mismatch tests passed, which they must: `FAIL (2)`, "ended passed, not failed".

The restated script replaces only that stage with `178-21-control-intent.mjs`. That script requires, for the same
run:

- exactly the two tests titled `axe accessibility scan — entry-email-entry` and `… (dark)` ended `failed`, on an
  expectation;
- every other test passed;
- Playwright exited 1.

It reads `tests 31; red 2; others 29`, `intent: PASS`. Every other stage of the chain is unchanged and passes in
both scripts:

- the fourteen entry names, the `menu:` title and `declareEntryScans` are in the spec;
- none of the forbidden constructs (`AxeBuilder`, `getByTestId`, `getByRole`, `locator(`, `expect.soft`,
  `waitForTimeout`, `.exclude(`, `disableRules`) is in the spec;
- the project and the gate name the spec;
- the tree is clean;
- `assert:a11y-scan-wiring` reports 0 violations;
- `typecheck:tests` passes;
- the pre-commit control is `--green --were-red-in 178-21-control`: PASS.

**Task 2's verify as written exits 0 on the new label.** The verdict reads a label's newest `-rN`, so
`e2e 178-21-close` read `178-21-close-r2`, and `--same-projects-as 178-20-close` read `178-20-close-r2`. Its
three stages:

- the tree is clean outside `.planning/`;
- `gates 178-21-close --rows lint,unit,format`: PASS, not stale (head `9b7b74c9f` is tree-equal to HEAD outside
  `.planning/`);
- `e2e`: PASS, below.

## The entries, their markers and their verdicts

The control columns are for the uncommitted tree, run through the wrapper. Every entry is two tests (light and
dark), and every scan runs through `declareEntryScans`, which calls `assertAxeScan`.

| Entry | Reach marker (and `alsoShown`) | `178-21-control` | `178-21-precommit` | `178-21-precommit-full` | `178-21-close-r2` |
|---|---|---|---|---|---|
| `entry-login` | `login.registerLink`; `login.page[data-register-offered=true]` | 2 passed | 2 passed | 2 passed | 2 passed |
| `entry-sign-in` | `login.requestLink` | 2 passed | 2 passed | 2 passed | 2 passed |
| `entry-sign-in-failed` | `login.errorMessage`; `login.signInPage[data-sign-in-state=failed]` | 2 passed | 2 passed | 2 passed | 2 passed |
| `entry-sign-in-email-required` | `login.emailError` | 2 passed | 2 passed | 2 passed | 2 passed |
| `entry-register` | `register.modeOption`; `register.page[data-mode-selected=""]` | 2 passed | 2 passed | 2 passed | 2 passed |
| `entry-register-email` | `register.modePanel[data-mode=email]` | 2 passed | 2 passed | 2 passed | 2 passed |
| `entry-register-code-unconfirmed` | `register.codeError[data-reason=unconfirmed]` | 2 passed | 2 passed | 2 passed | 2 passed |
| `entry-email-entry` | `register.emailEntryPage` | **2 red on the marker** (state replaced by a bare visit of D1's address) | 2 passed | 2 passed | 2 passed |
| `entry-email-entry-mismatch` | `emailEntry.confirmationError` | 2 passed | 2 passed | 2 passed | 2 passed |
| `entry-code-sign-in` | `register.signInPage` | 2 passed | 2 passed | 2 passed | 2 passed |
| `entry-email-sent` | `emailSent.countdown`; `emailSent.page[data-wording=signIn]`, `[data-address=shown]` | 2 passed | 2 passed | 2 passed | 2 passed |
| `entry-email-sent-code` | `emailSent.page[data-address=none]`; `[data-wording=code]` | 2 passed | 2 passed | 2 passed | 2 passed |
| `entry-email-sent-recovery` | `emailSent.page[data-wording=recovery]` | 2 passed | 2 passed | 2 passed | 2 passed |
| `entry-forgot-password` | `forgotPassword.email` | 2 passed | 2 passed | 2 passed | 2 passed |
| `menu: a signed-out visitor is offered Sign in, Register and Forgot Password?` | — | passed | passed | passed | passed |

The red message in the control was:
`"entry-email-entry" does not show contestant-register-email, which only the scanned state renders`
(and the same for `-dark`).

## The runs

| Run | Tree | Totals | Against its predecessor | Docker VM free before | Verdict |
|---|---|---|---|---|---|
| `178-e2e/178-21-control` | uncommitted, head `6e5dd70fa`, `--project contestant-entry-scan` | 31: 29 passed, 2 failed | — | — | as written FAIL (the stage's defect); intent PASS |
| `178-e2e/178-21-precommit` | the same, restored | 31 passed | — | — | `control --green --were-red-in 178-21-control`: PASS |
| `178-e2e/178-21-precommit-full` | the same, full default suite | 502 passed, 0 failed, flaky, skipped or did not run | 120 compared, 0 not as expected | — | `control --full --green`: PASS |
| `178-gates/178-21-close` | head `9b7b74c9f` | lint 0 (49 s), unit 0 (78 s), format 0 (20 s) | — | — | `gates --rows lint,unit,format`: PASS, not stale at `7a413bb2f`, no Sleep in the window |
| `178-e2e/178-21-close` | head `9b7b74c9f` | **VOID** (exit 8; 287 passed, 1 failed, 1 skipped, 213 did not run before the wrapper ended it) | — | 23.86 GiB | not evidence; kept |
| `178-e2e/178-21-close-r2` | head `7a413bb2f` (tree-equal to `9b7b74c9f` outside `.planning/`) | **502 passed**, 0 failed, flaky, skipped or did not run | 120 compared, 0 not as expected; `contestant-entry-scan` 29 against 0, expected 0+29 | 24.00 GiB (after the driver's prune) | `e2e … --same-projects-as 178-20-close-r2 --except contestant-entry-scan=29 --expect-project contestant-entry-scan --expect-title-count "contestant-entry-scan::entry-email-sent-recovery=2"`: **PASS**, not stale, no Sleep entry in the window |

**Power for `178-21-close-r2`:** on battery, 99 % at the start and 91 % at the end, discharging. It was started
above the 30 % floor and launched under `caffeinate -dimsu`.

### The auth budget

Counted with `tests/e2e-runs/178-unit/178-18-auth-peaks.sh` over each run's `started` to `ended`. Origin 2 is the
suite's.

| Run | Password sign-ins, total | Most in five minutes | Link verifications |
|---|---|---|---|
| `178-19-close-r2` (for reference) | 35 (30 × 200, 5 × 400) | 25 | 17 |
| `178-21-precommit-full` | 37 (30 × 200, 7 × 400) | **25** | 18 |
| `178-21-close-r2` | 37 (30 × 200, 7 × 400) | **25** | 18 |

The spec adds two refused password sign-ins (`entry-sign-in-failed`, light and dark) and one link verification
(the seeding of the used code). The five-minute peak is unchanged at 25 of 30, under the stop line at 27. Logs:
`178-21-precommit-full-auth-peaks.log` and `178-21-close-r2-auth-peaks.log`.

## Decisions Made

- **U-26 built at (a).** The fourteen entries live in a spec and project of their own. The departure from D-22's
  letter is declared in the plan's truths. U-26 was read by the operator on 2026-10-11 and stands at its
  recommended option.
- **The declarer was not extended.** Two attributes were not needed on one marker: each entry has one marker and
  takes the second fact as an `alsoShown`.
- **Two flows, not one `createRegistrationTest`.** See Deviation 1.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Blocking] Two invitation flows instead of `createRegistrationTest` with two candidates.**

- **Found during:** Task 1, step 1.
- **Issue:** a flow names at most one row per kind (the dispatch "After 178-12": "two scan candidates (178-21)
  need a second flow or a widened option"). Both scan rows are candidates.
- **Fix:** the spec builds two `createInvitationFlow` flows under `ENTRY_SCAN_ADDRESS_PREFIX`, one per candidate,
  and uses `test` from `@playwright/test` with its own page objects. The fixture was not widened.
- **Files:** `contestant-entry-scan.spec.ts`.
- **Commit:** `9b7b74c9f`.

**2. [Rule 3 - Blocking] `navMenu.fixture.ts` gained two steps, outside `files_modified`.**

- **Found during:** Task 1, step 3.
- **Issue:** the menu test needs "an item of this name leads to this path" and "no item leads to this path".
  A spec holds no locator, so the steps belong in the fixture.
- **Fix:** `expectItemLeadsTo(name, path)` and `expectNoItemLeadsTo(path)`.
- **Files:** `tests/tests/fixtures/shared/navMenu.fixture.ts`.
- **Commit:** `9b7b74c9f`.

**3. [Rule 1 - Defect of a verify stage] Task 1's negative-control verdict was restated.** See "Each task's verify
command". Both statuses are recorded: 1 as written, 0 restated. Each was run twice, at `9b7b74c9f` and at
`7a413bb2f`.

**4. A full run of the uncommitted tree was made before the commit** (`178-21-precommit-full`, 502 of 502),
beyond the plan's one-project pre-commit control. It adds evidence and changes nothing.

**5. The closing run's label is `178-21-close-r2`**, after the void of `178-21-close`. Task 2's verify reads it as
written, through the verdict's newest-attempt rule.

**Total deviations:** 2 blocking fixes in the test layer, 1 restated verify stage, 2 departures that only add
evidence. **Impact:** no application code changed. No scan was narrowed, excluded or skipped.

## Prohibitions

- **PROH-178-62:** no violation was found, so none was corrected. No exclusion, disabled rule, narrower region or
  changed marker exists; the verify's forbidden-construct stage passes.
- **PROH-178-63:** no axe builder in the spec. Every scan goes through `declareEntryScans` → `assertAxeScan`. An
  unreached state fails its entry, as the control shows.

## Threat register

- **T-178-133:** mitigated. Every entry asserts a marker and its route before scanning, and the control showed
  one entry red on its marker.
- **T-178-134:** mitigated. The wiring gate lists the spec, and the closing verdict expects the project and a
  title count.
- **T-178-135:** mitigated. Fourteen states are scanned in two themes.
- **T-178-136:** mitigated. The codes are held in memory and never asserted on, and no file holds one.
- **T-178-137:** mitigated. The spec has its own rows and prefix. `afterAll` asserts no leftovers under the
  prefix or on either row.

## Observed, and inferred

- **Observed:**
  - the runs and verdicts above;
  - the auth counts;
  - the clamshell sleep in the void window;
  - the kept copies equal to HEAD.
- **Inferred:** that the first executor ran `yarn assert:comment-hygiene` before its commit. Its logs do not show
  it. This executor ran it on HEAD: exit 0, 0 violations (`178-21-hygiene-at-head.{log,exit}`).

## Not done, or not verified

- The UI contract's states not scanned (ruling 4): the locked and notice states of the login screen, the
  no-profile sentence, a group error, the count ended, and the transient states. None is scanned here.
- The phone widths are 178-22's.
- No visual review of the rendered screens was made. The "to look at on rendered screens" items that 178-09 to
  178-19 handed to 178-21 and 178-22 were scanned by axe only, with no finding. A person's look at them remains
  for 178-22 or 178-24.

## Known Stubs

None.

## Threat Flags

None. No new surface: test files only.

## The state the local stack is left in

- Up, not restarted.
- The database holds what the closing run's teardowns leave. The run used `--no-db-reset`, so pgTAP test 238 of
  file 39 is red on it until the next reset (the known finding).
- Nothing listens on 5273. 494 `started` markers, each with an `ended`.
- Docker VM: 25.1 GB free after the run (`df -k` in an alpine container).
- Power: on battery, 91 %, discharging.

## For later plans

- **Predecessor label for the next full run: `178-21-close-r2`.** 502 tests, 120 projects, head `7a413bb2f`
  (tree-equal to `9b7b74c9f` outside `.planning/`). `178-21-close` is a void run: never name it as a predecessor.
  The verdict's newest-attempt rule makes the bare label `178-21-close` read `-r2`.
- **A comparison with `178-20-close-r2`** needs `--except contestant-entry-scan=29`.
- **A `--red` verdict stage matches titles by substring.** An entry name that is a prefix of another
  (`entry-email-entry` / `entry-email-entry-mismatch`) needs a name that is no prefix of another, or an
  exact-title judgement. `tests/e2e-runs/178-unit/178-21-control-intent.mjs` is the form.
- **For 178-22 — the phone spec `contestant-entry-phone`** depends on `contestant-entry-scan` and uses its two
  reserved candidates and `ENTRY_SCAN_ADDRESS_PREFIX`, one after the other (the execution rules' names table).
  This spec's `afterAll` removes every user under the prefix and every invitation on both candidates, and resets
  both rows, so the phone spec seeds its own.
  - A used code: `seedUsedCode('candidate')` on a flow that names `ENTRY_SCAN_USED_CODE_CANDIDATE_EXTERNAL_ID`.
  - An open code: `seedCodeInvitation('candidate')` on the other.
  - Two flows, because one flow names one row per kind.
- **Menu steps:** `navMenu.expectItemLeadsTo(name, path)` asserts exactly one item of that accessible name, and
  that it links to the path. `expectNoItemLeadsTo(path)` asserts no item links to the path in any locale. Build
  the path with `buildRoute({ route, locale: 'en' })`.
- **The auth budget:** a full run peaks at 25 of 30 password sign-ins in five minutes (37 in all), with 18 link
  verifications. 178-22 still has about two sign-ins of room before the stop line at 27, and reaches signed-in
  states by stored sessions or seeded users.
- **Host power:** a closed lid sleeps the host whatever `caffeinate` holds (`Clamshell Sleep` in `pmset -g log`).
  Keep the lid open for a full run.
- **For 178-23:**
  - `tests/README.md` has no row for `contestant-entry-scan` and no word of `expectItemLeadsTo` or
    `expectNoItemLeadsTo`.
  - The header of `scripts/assert-a11y-scan-wiring.mjs` now counts "eleven source files" and "none of the nine",
    so a doc that quotes the old counts is out of date.
  - The components skill's convention 6 (the scan family) does not name the new project.
- **Timing on this host today:** the closing full run took 12 min 15 s, on battery. The three gate rows took
  2 min 27 s.

## Self-Check: PASSED

- `tests/tests/specs/contestant/contestant-entry-scan.spec.ts` exists. `git merge-base --is-ancestor 9b7b74c9f
  HEAD` holds.
- `tests/e2e-runs/178-e2e/178-21-close-r2/summary.json` reads 502 passed. `178-21-t2-verify.exit` is 0, and
  `178-21-t1-verify-r2-at-head.exit` is 0.
