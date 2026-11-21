---
phase: 178-sign-in-email-code-registration
plan: 14
subsystem: auth
tags: [sveltekit, svelte5, gates, set-password, auth-callback, mailed-link, invalidateAll, playwright, tracer, contestant-app, vitest]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-04: BasicUserData.passwordSet on every read; plan 178-08: the message keys and test ids of the set-password view, Button's form attribute; plan 178-10: clearEntryFlow; plan 178-11: PasswordSetter with validate(); plan 178-12: createRegistrationTest, witnessPageRequest, the gate's page object; plan 178-13: the sign-in screen and the email-sent screen with their opening steps"
provides:
  - "Gate id 'setPassword', the first entry of CONTESTANT_GATES, asked before the terms of use, on BasicUserData.passwordSet === false"
  - "SetPasswordGate.svelte, GATE_VIEWS.setPassword: the view the protected layout renders in place of every page for a user with no password"
  - "The protected layout's load signs a user out with loginFailed when the user-level data does not hold passwordSet as a boolean"
  - "The auth callback lands every sign-in link on the validated next path or the app root, and refuses the types invite, signup and email unverified"
  - "E2E project contestant-email-registration with the test 'tracer: …', named in the anchor of data-setup-perm-1e1cg1co"
  - "Fixture steps: contestantSetPasswordGate.openProtectedPageDirectly, .expectShownInPlaceOfPage, .expectTitle, .expectGone; contestantTermsOfUsePage.expectShown; contestantEntityHomePage.reload; the gate's page object in the journey and localisation composition roots"
affects: [178-15, 178-16, 178-17, 178-18, 178-19, 178-21, 178-22, 178-23, 178-24]

actuals:
  tokens: 26638
  tasks: 3
  commits: 4
plan_head_before: 6be83fcd7f52e54eb30e9388b86be112fa2b377b
plan_head_after: 3a9e37b491b40ecf18720a5876afbc1ad72ed3eb

tech-stack:
  added: []
  patterns:
    - "A gate view passes by saving and then awaiting invalidateAll(): the view holds no flag that removes it, and its main button keeps its saving state until the rerun has finished"
    - "A view whose main button is disabled while a save runs remembers document.activeElement at the submit and gives focus back after a failure only when the browser has dropped it to the body"
    - "A step that asserts a view is shown in place of a page asserts the page's address too: an absent container alone also holds when the user was sent somewhere else"
    - "A leaf E2E project that writes on a dataset row and reads the settings row is named in the first perm setup's dependencies, so its order is stated and not inherited"

key-files:
  created:
    - apps/frontend/src/lib/contestant/gates/SetPasswordGate.svelte
    - apps/frontend/src/routes/contestant/(protected)/setPasswordLayout.svelte.test.ts
    - tests/tests/specs/contestant/contestant-email-registration.spec.ts
  modified:
    - apps/frontend/src/lib/contestant/gates/gates.ts
    - apps/frontend/src/lib/contestant/gates/gateViews.ts
    - apps/frontend/src/lib/contestant/gates/gates.test.ts
    - apps/frontend/src/routes/contestant/(protected)/+layout.server.ts
    - apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts
    - apps/frontend/src/routes/api/auth/callback/+server.ts
    - apps/frontend/src/routes/api/auth/callback/server.test.ts
    - tests/playwright.config.ts
    - tests/tests/specs/contestant/contestant-journey.spec.ts
    - tests/tests/specs/perm/perm-localisation-positive.spec.ts
    - tests/tests/fixtures/contestant/contestantSetPasswordGate.fixture.ts
    - tests/tests/fixtures/contestant/contestantTermsOfUsePage.fixture.ts
    - tests/tests/fixtures/contestant/contestantEntityHomePage.fixture.ts
    - tests/tests/fixtures/contestant/contestant-journey.ts
    - tests/tests/fixtures/contestant/perm-l10n.ts

key-decisions:
  - "The set-password gate is passed by a rerun of the loads with no session refresh and no full page load: probe row P4's first branch, now also seen in a browser"
  - "The step that expects the set-password view in place of a protected page asserts the unchanged profile address: the reserved candidate has no nomination, so its profile is never rendered and the absent container alone would hold with no gate at all"
  - "The tracer's project is named in the dependencies of the first perm setup, because its walk needs the reserved candidate and a settings row that lets candidates register by email"
  - "A user whose password fact is absent or not a boolean is signed out before the gate list is asked, whatever their terms acceptance: the terms view is not shown to them"
  - "The set-password view clears the entry flow after a saved password and puts focus back after a failed save when the browser dropped it"
  - "No case was added to the invitation landing spec: it has no user made by a link, and a further test would have moved a project's total the plan's verdicts hold equal"

patterns-established:
  - "A spec of the entry flow resets its reserved rows before all and after each, and asserts both kinds of leftover after all"
  - "A red control whose test fails on a thrown fixture error does not count: the cause is removed and the control made again under the next suffix"

requirements-completed: [REG-11]

coverage:
  - id: D1
    description: "The gate list holds the set-password gate and then the terms-of-use gate, frozen; the first is needed only for passwordSet === false and reads nothing else of the user; a user object without the password fact is not what the list takes"
    requirement: REG-11
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contestant/gates/gates.test.ts — 21 cases; red first (tests/e2e-runs/178-unit/178-14-t2-red.log, exit 1)"
        status: pass
      - kind: other
        ref: "svelte-check over the two type-level cases: gate row check-frontend of 178-14-close, exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The protected layout's load reads the user-level data with no argument, returns { gate: 'setPassword', user } for a user with no password without reading the entity list, and signs out with loginFailed a user whose data holds no boolean for the fact"
    requirement: REG-11
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts — 21 cases; layout.tracking.test.ts unchanged but for the user literal, passing"
        status: pass
    human_judgment: false
  - id: D3
    description: "The set-password view: rendered in place of the page, the page's own focusable heading, the address of the load data's user as text and in the form's user-name field, a submit button outside the form tied to it, a failed save shown with the form kept, a saved password followed by one rerun and by nothing else, Log Out calling the context's logout"
    requirement: REG-11
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/(protected)/setPasswordLayout.svelte.test.ts — 20 cases, new; red first"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/178-e2e/178-14-close — contestant-email-registration › tracer, passed"
        status: pass
    human_judgment: true
    rationale: "The view's look, its wrapping at phone widths and its axe scan are plans 178-21 and 178-22's; no scan and no width check of it was made here. The saving label, the failed-save sentence and the focus move after the gate is passed are held by unit cases and were not asserted in a browser."
  - id: D4
    description: "The auth callback lands a sign-in link's user on the validated next path or the app root whether or not the account has a password, and refuses invite, signup and email before any verification or claim"
    requirement: REG-11
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/api/auth/callback/server.test.ts — 17 cases"
        status: pass
    human_judgment: false
  - id: D5
    description: "The tracer: an invited candidate asks for a link on the sign-in screen, meets the email-sent screen, opens the mailed link as received, is shown the set-password view where the link lands and at the address of their own entity's profile, sets a password, accepts the terms and is on the candidate's home, still signed in after a reload"
    requirement: REG-11
    verification:
      - kind: e2e
        ref: "red first: 178-14-control-r2 (178-verdict control … --red 'tracer:': PASS, failed on expect(locator).toBeVisible() for the set-password view); green: 178-14-precommit (control --full --green --were-red-in: PASS) and 178-14-close (e2e: PASS)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The journey and the localisation spec register through the set-password view with no second sign-in; the committed suite is green with one more project and one more test"
    requirement: REG-11
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/178-e2e/178-14-close — 445 of 445 in 117 projects, head 3a9e37b49; equal per project to 178-11-close and to 178-13-close but for the new project's one test"
        status: pass
    human_judgment: false

duration: 51min
completed: 2026-10-13
status: complete
---

# Phase 178 Plan 14: The Tracer — a Link Asked For, Mailed and Opened, a Password Chosen in the Layout Before Anything Else, and the Home Reached and Kept — Summary

**The set-password gate as the first entry of the gate list with its view, the load's check of the password fact, the callback's landing on the app root with three link types refused, one new E2E project whose one test was red first and is green, two existing specs moved to the view, 37 new unit cases, six gate rows at 0 and a full run of 445 in 117 projects.**

## Read this first

- **All three tasks are done and committed; the tree is clean; nothing is held.** The one browser-observable commit is `3a9e37b49`; it followed a green full run of the uncommitted tree.
- **The path works end to end in a browser.** This was the first time a browser rendered the sign-in screen (B) and the email-sent screen (E), the first real use of `witnessPageRequest`, and the first observation of the browser half of probe row P4. Each is reported under *Observed in a browser for the first time*.
- **P4's first branch is what was built and what the browser showed**: the view saves and reruns the loads; `supabaseDataWriter.ts` is not edited and its `_setPassword` comment stands.
- **A finding about the deep-address step that the plan did not have.** The reserved candidate has no nomination, so its profile page is never rendered: with no gate at all, the group's load would send the user to the entity's home, and "the profile's container is not rendered" would still hold. The step therefore also asserts that the address is still the profile's, which is what tells the gate from a redirect. See *Deviations* 4.
- **The first control did not count and was made again**: my spec read the grants of an address that had no account yet, and the fixture throws there. `178-14-control-r2` is the control. See *Deviations* 1.
- **The invitation landing spec is unchanged**, although the plan lists it: it holds no user made by a link. One truth of the plan is therefore held by unit cases only — a first-time user with a project-scope grant and no password passing the view and reaching "nothing to edit". See *Not done, or not verified*.

## Performance

- **Duration:** 51 min
- **Started:** 2026-10-12T22:08:21Z
- **Completed:** 2026-10-12T22:59Z (2026-10-13 local)
- **Tasks:** 3
- **Files:** 26 (3 created, 23 modified)

## Task Commits

| Task | Commit | What |
|---|---|---|
| 1 | `7164f249f` | `test(178-14)`: `openProtectedPageDirectly(entityType, entityId)` and `expectShownInPlaceOfPage()` on the gate's page object, committed alone as the plan lays out |
| 1 | `2e9ffdd59` | `test(178-14)`: `contestantTermsOfUsePage.expectShown()` and `contestantEntityHomePage.reload()` — steps the tracer's body needed so that it holds no locator |
| 2 | `7d0a39d23` | `test(178-14)`: `expectTitle(locale)` and `expectGone()` on the gate's page object, and the object in the composition roots of the journey and of the localisation specs |
| 1 and 2 | `3a9e37b49` | `feat(178-14)`: the gate entry, the view, the load's check, the callback's landing, the unit cases, the tracer's spec and project, and the two specs moved to the view — one commit, 21 files |

The three fixture commits are additive: no committed spec called any of those steps when they were committed.

## Each task's verify command, with its real exit status

Each block was written byte for byte from the plan to `tests/e2e-runs/178-unit/178-14-t<N>-verify.sh` and run with `bash`; its log, exit status and head are beside it.

| Task | Exit | On head | Note |
|---|---|---|---|
| 1, as written | **1** | `2e9ffdd59` with the spec and the config held | The stage that searches the spec for `expect.soft` hits the header's rigidity line, which is in the form every spec of the suite has. A defect of the stage, the one the dispatch names for fixtures |
| 1, its intent | 0 | the same | `178-14-t1-verify-intent.sh`: the same chain with the spec read without its comments and the control that counts, `178-14-control-r2`. One test, no locator, no soft expectation, no fixed wait; `P3: held`, `P3-IDP: set`; `yarn typecheck:tests` 0; the control's verdict PASS |
| 2 | 0 | `3a9e37b49` | The block's unit stage has the `--`, so it ran the whole frontend suite: 220 files, 4676 passed |
| 3 | 0 | `3a9e37b49` | |

The tracer feedback gate after Task 2 was the re-run of its verify on the committed tree: exit 0.

## Red before green

| Run | Exit | What was red |
|---|---|---|
| `178-14-control` | Playwright 1 | Did not count: the tracer's test failed on an error the fixture throws, not on an expectation (*Deviations* 1). `178-verdict control … --red`: FAIL |
| `178-14-control-r2` | Playwright 1 | Counts. 3 tests, 2 passed (the base setup and its teardown), the tracer's test failed on `expect(locator).toBeVisible()` for `contestant-set-password-gate` at the gate object's `expectShown()` — the link had landed on the legacy page. Everything before that step passed. `178-verdict control … --red "tracer:"`: PASS |
| `178-14-t2-red` (unit, three directories) | 1 | 37 failed, 629 passed. 32 are `AssertionError`; 5 are `TypeError: Cannot read properties of undefined (reading 'isNeeded')` in `gates.test.ts`, where a case looks the absent entry up before asserting on it. None is an import, compile or timeout failure |

## The three E2E runs

| Label | What | Verdict | Totals | Docker VM free before |
|---|---|---|---|---|
| `178-14-control-r2` | the tracer's project on the tree before Task 2 | `control --red "tracer:"`: PASS | 3 tests, 1 red | 16.04 GiB |
| `178-14-precommit` | a full run of the uncommitted tree of Task 2 | `control --full --same-projects-as 178-11-close --except contestant-email-registration=1 --green --were-red-in 178-14-control`: PASS (the label resolves to `-r2`; "was red, now passed") | 445 of 445, 117 projects | 16.04 GiB |
| `178-14-close` | a full run of the committed tree, head `3a9e37b49` | `e2e --same-projects-as 178-11-close --except contestant-email-registration=1 --expect-project contestant-email-registration`: PASS; the same against `178-13-close`: PASS | 445 of 445, 117 projects; 0 failed, flaky, skipped or did not run | 16.40 GiB |

Per project, `178-14-close` equals `178-13-close` and `178-11-close` in 116 projects and has one more project with one test. No run was void; no Sleep entry lies inside a run's window; the host was on AC power throughout. `178-14-close` took 12 min 29 s by the wrapper's own markers; the tracer's test 5.3 s in it, the journey 32.5 s, the localisation walk 9.3 s.

The dev-server log of `178-14-close` holds the standing `TypeError … (reading 'map')` once, and the same two aborted view transitions ("Viewport size changed") and nine interrupted `play()` calls as `178-11-close`, `178-13-close` and `178-14-precommit` hold. It holds no line of the view's failed save and no line of the load's missing-fact sign-out.

## The gate rows — `tests/e2e-runs/178-gates/178-14-close`, head `3a9e37b49`

| Row | Exit | Seconds |
|---|---|---|
| typecheck | 0 | 23 |
| lint | 0 | 52 |
| unit | 0 | 81 |
| check-frontend | 0 | 10 |
| build | 0 | 18 |
| format | 0 | 21 |

`178-verdict gates 178-14-close --rows typecheck,lint,unit,check-frontend,build,format`: PASS, not stale.

## Observed in a browser for the first time

1. **B, the sign-in screen.** Opened by its address, it rendered its frame and the link button. The address was typed as soon as the field was editable; the press, which Playwright makes only once the button is available, sent that address. **N-1 is observed only so far**: the typed address was the one the request carried and E showed. Whether the fill came before hydration was not measured.
2. **`witnessPageRequest`.** The interception gave the page's one request the witness and its outcome read `sent`. The fallback step of ruling 7 was not taken.
3. **E, the email-sent screen.** It opened in its sign-in wording with the typed address shown, and the address was in none of the address bar, the two storages, the readable cookies and the history state.
4. **The mailed link**, opened as received, landed on the app root, where the set-password view was shown with the address under "Signed in as" and in the form's hidden user-name field.
5. **The deep address.** The passwordless user entered the profile address of their own candidate. The response was the set-password view at that address: the address bar still held the profile's path, and the profile's identity section was not in the document.
6. **The browser half of P4.** A password saved in the view was followed by the terms of use with no navigation by the user, then by the candidate's home, then by the home again after a reload. The auth service's log for the tracer's user in `178-14-precommit` holds, in order, the link's verification, the callback's one refresh after the claim, the password update, and the user's removal by the spec's hook — **no token refresh after the password update**. The session the browser held was used as it was. *Inferred, not observed*: that the access token's bytes were unchanged; no digest was compared in the browser, and the absence of a refresh grant is what the statement rests on. The redacted event list is `tests/e2e-runs/178-unit/178-14-precommit-auth-events.raw`.
7. **`<Button type="submit" form="…">`.** The view's main button stands outside the form; the press saved the password, so the attribute reaches the element and submits the form in a browser.

## The gate as built

- **`gates.ts`.** `ContestantGateId = 'setPassword' | 'termsOfUse'`; a frozen entry prepended with `isNeeded: (user) => user.passwordSet === false`. The predicates and `firstNeededGate` take `BasicUserData`. The header's second point now says the data carries the fact on every read.
- **`gateViews.ts`.** `setPassword: SetPasswordGate`.
- **`SetPasswordGate.svelte`.** `clearEntryFlow`, `logout`, `setPassword` and `t` are destructured; the address is read as `contestantCtx.user?.email` in the markup. `MainContent` with the title `contestantApp.setPassword.title`, the test id and `data-set-password-state`; the sentence `contestantApp.setPassword.why`; the address block under `contestantApp.nothingToEdit.signedInAs`; `PasswordSetter` with a form id, the address as `username`, the password bound and the handler; after a failed save `ErrorMessage inline role="alert" class="my-md"` with `contestantApp.setPassword.error`; the main button `type="submit"` tied to the form, `disabled` until `onMount`, `loading` with `common.saving`; Log Out, `color="warning"`. No hero, no dialog, no transition name, no numeric spacing class.
- **The handler.** Prevents the default; returns while a save runs; clears a shown failure; returns when `validate()` is false; saves; on anything but a success logs, shows the failure and gives focus back if the browser dropped it; on a success calls `clearEntryFlow()` and awaits `invalidateAll()`, the button keeping its saving state until the rerun has finished. A rerun that rejects is logged and the view returns to idle.
- **The load.** After the user-level read, a user whose `passwordSet` is not a boolean is logged and signed out with `loginFailed`; only then is the gate list asked. Nothing else changed: `getBasicUserData()` with no argument, the two params, no `url` and no `route`.
- **The callback.** `REFUSED_TYPES` is `invite`, `signup`, `email`; the arms for the last two and the helper that built the legacy page's address are gone; the sign-in arm sends every user to `landingRoute`. The claim still runs before every arm, and a failed claim on the sign-in arm still drops the session.

## The unit cases

| File | Cases now | Before | New or changed |
|---|---|---|---|
| `gates.test.ts` | 21 | 13 | the list's content and order, the set-password predicate (exactly `false`, reads one member), three shipped-list cases, two type-level cases |
| `layout.server.test.ts` | 21 | 14 | the set-password gate with the list read set up to reject (two users), the call with no argument, four cases of user-level data with no boolean for the fact |
| `setPasswordLayout.svelte.test.ts` | 20 | — | new |
| `callback/server.test.ts` | 17 | 15 | a passwordless user to the app root and to a validated `next`; `invite`, `signup` and `email` each refused; the case on the email arm is gone |

The frontend suite is 220 files and 4676 passed, from 219 and 4639.

**Eight test files gained `passwordSet: true` on their user literal**, as the dispatch foresaw: the six `*.tracking.test.ts` files under `routes/contestant/(protected)/`, `gateFocus.svelte.test.ts` and `termsOfUseLayout.svelte.test.ts`. The protected layout's tracked-read test passes with nothing else changed.

## Every spec and fixture the search named, and what changed in each

The search of the plan's `<read_first>` (`ContestantAppSetPassword`, `passwordSetSuccesfully`, `register/password` under `tests/tests`) names two files, neither of them one the plan lists:

| File | Reads | Changed |
|---|---|---|
| `specs/a11y/contestant-a11y.spec.ts` | a comment that lists `register/password` among the routes scanned signed out | no: the page is still on the tree until plan 178-16 |
| `specs/perm/perm-closed-project.spec.ts` | opens the legacy page by its address as a signed-in user | no: the same |

The specs that reached the legacy page did so through the callback's redirect, which no search of those three strings finds. They were found by reading the callers of the mailed-link steps:

| File | Changed |
|---|---|
| `specs/contestant/contestant-journey.spec.ts` | step 4 expects the set-password view with the user's address and sets the password there; step 5 expects the terms view and the set-password view gone, with no sign-in between; the helper that signed in again after the legacy page and its unused import are gone |
| `specs/perm/perm-localisation-positive.spec.ts` | expects the view, its title in `en` read from the English catalogue — the locale the link was asked for in — sets the password and expects the view gone |
| `specs/contestant/invitation-landing.spec.ts` | **no**: its three users are created with a password, so none meets the view; see *Not done, or not verified* |
| `fixtures/contestant/contestantPasswordSetter.fixture.ts` | no: `setPassword` still presses `set-password-submit`, which the view keeps |

## What the gate covers, and what it does not

It is a server-decided view gate over every page of the Contestant App's protected layout, and nothing else.

- **Not a database control** (T-178-154, accepted): a passwordless signed-in user can call the data API with their own token, as a user who has not accepted the terms can. Row-level security and the grant decide what the token may touch.
- **Not in the Admin App** (T-178-153, accepted; ruling 9): a passwordless link session whose grant gives it the admin role — a project-scope invitation claimed through a mailed link — reaches the Admin App's protected pages, its two form actions and its six job endpoints. No Admin gate was built. Plan 178-23 states it on the authentication page.

## Items built at their options

- **J1** at option (b), by the operator's ruling of 2026-10-11 (decision H1): `passwordSet` is a required boolean on `BasicUserData`, the gates take `BasicUserData`, and the load calls `getBasicUserData()` with no argument.
- **PL-29** at option (a), by the operator's explicit acceptance of the same day (decision H38 (a)).
- **J2, U-22, PL-01, PL-09, PL-10, PL-14**: read by the operator on 2026-10-11 and standing at their recommended options; built so. J2: the stored password decides and the callback refuses `signup` and `email`. U-22: the terms view's plain Log Out button. PL-09: the view reads the address from the contestant context. PL-10: the witness on the page's own request. PL-14: the spec seeds and cleans in its own hooks, with no setup or teardown project.

## Decisions Made

1. **The deep-address step asserts the address** (*Deviations* 4).
2. **The tracer's project is in the anchor of the first perm setup.** Every perm setup replaces the settings row and the first one's pre-clear deletes the reserved candidate; the walk needs both. `contestant-terms-gate-phone` is named there for the same reason.
3. **A user with no boolean for the fact is signed out even when the terms gate would have applied.** The check stands before the gate list is asked at all, so no gate is decided on a user whose fact was not read.
4. **The view clears the entry flow after the save**, as the dispatch lays out for a screen that completes a sign-in.
5. **No test was added to the invitation landing spec.** The plan's verdicts hold every project's total but the new one's equal to the predecessor's.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The first control failed on a thrown error, not on an expectation**
- **Found during:** Task 1, step 4
- **Issue:** The spec read `grantRowsOf(address)` straight after seeding. The fixture throws when no account holds the address, and seeding creates none.
- **Fix:** The read was removed; the grant is asserted once, after the home is reached. The control was made again as `178-14-control-r2`. `178-14-control` is kept.
- **Files modified:** `tests/tests/specs/contestant/contestant-email-registration.spec.ts`
- **Commit:** `3a9e37b49`

**2. [Rule 3 - Blocking] Four fixture steps the tracer and the two moved specs needed did not exist**
- **Found during:** Tasks 1 and 2
- **Issue:** The terms page object had no step that expects the view without opening it; the entity home had no reload; the gate object could assert neither its title nor its absence; the journey and localisation roots did not hold the gate object.
- **Fix:** Each added to its fixture and committed before any spec called it (`2e9ffdd59`, `7d0a39d23`). The pre-commit verdict's `--dirty-only` paths hold no fixture path, so they could not have been held.

**3. [Rule 2 - Missing critical] Focus after a failed save, and a rerun that rejects**
- **Found during:** Task 2
- **Issue:** The contract keeps focus on the main button after a failed save, and `Button`'s loading state disables the button natively, after which a browser may drop focus. And a rejected `invalidateAll()` would have left the button saving for good.
- **Fix:** The handler gives focus back when it has fallen to the body, as the sign-in screen does; a rejected rerun is logged and the view returns to idle. A unit case holds the first.
- **Commit:** `3a9e37b49`

### Other departures, none of them a fix

4. **`expectShownInPlaceOfPage()` asserts three things, not the plan's two**: the view is visible, the address is the profile's, the profile's identity section is not rendered. Without the middle one the step would hold for an un-nominated candidate with no gate.
5. **`tests/playwright.config.ts` also names the project in `data-setup-perm-1e1cg1co`'s dependencies**, with a paragraph of the anchor's comment and a line in the file's closing list of projects.
6. **`invitation-landing.spec.ts` and `supabaseDataWriter.ts` are in the plan's `files_modified` and were not changed**: the first has nothing to move, the second is edited only under a P4 fallback.
7. **Eight test files outside `files_modified` gained one member on a literal**, by the dispatch.
8. **The load logs one error line** when the fact is missing, which the plan does not lay out; the sign-out is what the plan lays out.
9. **`isContestantAppRootPath` of `tests/tests/utils/contestantEntityUrl.ts` is now called by its own unit test only**: the journey's sign-in-again helper was its last caller. Left in place.
10. **Ruling 6's sentence "nothing leads to it after this commit" holds for the callback and not for the legacy register page**, whose code flow still builds `ContestantAppSetPassword`. That page goes with its tree in plan 178-16.
11. **`git stash list` was run once**, by mistake, inside a counting command. It reads and changes nothing; no other stash command was run.

**Total deviations:** 3 auto-fixed (1 bug in my own spec, 1 blocking, 1 missing critical), 8 other departures. **Impact:** none on the committed suite; the deep-address finding makes the tracer's proof stronger than the plan's step would have been.

## Issues Encountered

None beyond the deviations.

## The code-review checklist

| Item | Outcome |
|---|---|
| Solves the issue | Yes: the path works in a browser and is held by a test that was red first |
| OWASP top 10 | The gate is decided on the server on a fact read from the database; nothing the browser sends removes the view; `next` passes `safeRedirectTarget`; three link types are refused unverified. No password, token, link or address is logged: the view logs the thrown error of a failed save, the load a fixed sentence |
| Code style guide | Followed; `func-style`, import order and formatting are in the lint and format rows |
| `any` | None |
| Repeated code | Two repetitions, both copied on purpose: the address block's markup from `NothingToEdit.svelte`, as the pattern map lays out, and the focus-after-refusal lines from the sign-in screen. A third user of either is the time to extract |
| New entities documented | The view's `@component` docblock; TSDoc on every new fixture step |
| Repo documentation | Not edited; what is now out of date is listed for plan 178-23 under *For later plans* |
| Tracking events | None added. The terms gate, its sibling, emits none either |
| Svelte component guidelines | Runes only, no props, so no type file, as `TermsOfUseGate.svelte` has none; reactive accessors read as `contestantCtx.X` |
| Errors handled and logged | A failed save and a rejected rerun are caught and logged; a missing fact is logged before the sign-out |
| Failing checks | None: six gate rows at 0 |
| Shared dependencies | The gate list is read by the layout's load alone; the callback is every mailed link's end, and the full run is green over it. The opt-in bank-auth projects were not run (item PL-26: at the closing gate) |
| WCAG A and AA | **Not scanned here.** The view's axe entry and its phone widths are plans 178-21 and 178-22's. Held by unit cases: a focusable first-level heading, labelled fields from the setter, an alert for a failed save, a real submit button |
| Keyboard and screen reader | Enter in a field submits the form; Log Out is a button. Not tried in a browser by hand |
| Documentation where necessary | As above |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before each commit, with new files staged; every touched comment read. The journey spec's header keeps its numbered steps |
| Commit history | Four commits, none a fix of another |
| Formatting-only commits | None |
| `[db]` | No database change |

## Prohibitions

| Id | How it is held |
|---|---|
| PROH-178-40 | The view has no "Not now" and no dismissal: a unit case reads its actions as exactly the main button and Log Out, and another that a saved password leaves the view mounted until the load data changes. Log Out calls `logout` at once, also after a failed save |
| PROH-178-41 | The predicate reads `passwordSet` of the user-level data and nothing else (a unit case records the reads); the load reads it from `getBasicUserData()`; the callback no longer reads the claim's `passwordSet` for the landing; nothing reads the link's `type` for the gate |
| PROH-178-42 | The address is the load data's user's, as text (two unit cases, one with another user); the form holds two new-password fields and no current-password field; the sentence says how the user signed in |
| PROH-178-43 | The callback's line and the gate are in one commit, `3a9e37b49` |

## Observed, and inferred

- **Observed:** everything under *Observed in a browser for the first time* but the two statements marked there; the three runs' verdicts; the gate rows; the unit counts.
- **Inferred:** that the access token is byte-identical after `updateUser` in a browser (from the auth log holding no refresh); that B's fill preceded hydration.
- **Not observed in a browser:** the saving label; the failed-save sentence and the focus after it; the focus move to the next view's heading when the gate is passed; Log Out from the view; a document request for the view with the script blocked.

## Not done, or not verified

- **The truth "a first-time user whose claim produced no contestant grant passes F and the terms and reaches the app root, which shows 'nothing to edit'" has no browser case.** The gate's order and the root's view are each held by unit cases; the landing spec's first case is a returning user with a password. A case for it adds a test to `invitation-landing`, which this plan's verdicts do not allow.
- **No axe scan and no width check of the view** (plans 178-21, 178-22).
- **The opt-in bank-auth projects were not run** (PL-26). The gate changes what an identity-provider account meets only if its account read "no password", which probe row P3-IDP says it does not.
- **`.planning/WINDOWS.md` was not appended to**: the deviations are recorded here, and the dispatch keeps an executor's writes to its own summary.

## The state the local stack is left in

The stack is up and was not restarted. The database is as the closing run left it: the suite's projects seeded and torn down by its own setups, no `db:reset` made by this plan. No user and no invitation under the prefix `email-registration-` is left: the spec's `afterAll` asserts it. Nothing listens on the E2E port.

## For later plans

- **Predecessor label for the next full run: `178-14-close`** (445 tests, 117 projects, head `3a9e37b49`). A verdict that compares with an earlier label needs `--except contestant-email-registration=1`.
- **Every plan — a passwordless user now meets the set-password view on every protected page**, before the terms. A spec that brings a user in through a mailed link and expects a page must set a password first: `contestantSetPasswordGate.expectShown()`, `.setPassword(password)`, then `.expectGone()` or the next view. The callback sends nobody to `register/password` any more.
- **The gate object's steps now:** `expectShown()`, `openProtectedPageDirectly(entityType, entityId)`, `expectShownInPlaceOfPage()`, `expectTitle(locale)`, `expectGone()`, `expectAddress(address)`, `setPassword(password)`, `submit(password, confirmation)`, `expectSaving()`, `expectSaveFailure()`, `expectUsernameField(address)`, `logOut()`, `expectNoHorizontalOverflow()`. It is in `createRegistrationTest`, in `contestant-journey.ts` and in `perm-l10n.ts`.
- **`contestantTermsOfUsePage.expectShown()`** opens nothing; **`contestantEntityHomePage.reload()`** reloads at the page's own address.
- **A step that asserts "this view in place of that page" should assert the address.** An un-nominated entity's profile, questions and preview are never rendered: the group's load sends such an entity home. Plans 178-21 and 178-22 will meet this with the reserved scan candidates.
- **`grantRowsOf(address)` throws for an address with no account.** Read grants only after the account exists — after the link request, not after the seeding.
- **A spec that writes on a base-dataset row or reads its settings row** (178-17, 178-19, 178-21, 178-22): name its project in the dependencies of `data-setup-perm-1e1cg1co`, with a paragraph in the anchor's comment, as `contestant-email-registration` is.
- **178-15, 178-16, 178-17 — a sign-in that completes through D2 or a code** lands a user who may have no password on the view; `clearEntryFlow()` is called by the view after the save, and a screen that signs the user in still makes its own call.
- **178-16 — deleting the legacy set-password page:** nothing of the callback names it now. Still naming `ContestantAppSetPassword` or `register/password`: `lib/routes/route.ts`, `routes/contestant/+layout.svelte`, `routes/contestant/register/+layout.server.ts` with its test, `routes/contestant/register/+page.svelte`, `perm-closed-project.spec.ts` (which opens the page by address) and the comment in `contestant-a11y.spec.ts`. The message `contestantApp.setPassword.passwordSetSuccesfully` is read by that page.
- **178-19 — the reset page:** the handler's form is the one to follow — `event.preventDefault()`, `validate()`, save, `invalidateAll()` or a client-side navigation. A browser session was not refreshed after `updateUser` and served every load that followed; P4 holds in a browser.
- **178-21, 178-22 — to look at on the rendered view:** the view was never looked at by a person or scanned. The main button's label while saving is "Saving…"; the failed-save alert sits between the form and the actions with `my-md`; the address block is `NothingToEdit`'s. The passwordless session of 178-22 will be the first stored session that meets the view.
- **178-22 — a first-time user with a project-scope grant and no password** (the plan's truth on "nothing to edit") has no browser case; the passwordless session's user is the natural one to walk it with, if that user holds no entity.
- **178-23 — documentation now out of date:** `developers-guide/backend/authentication` (the callback's arms and refused types, the gate, what it does not cover — T-178-153 and T-178-154); `developers-guide/contestant-app/registration`, `login-and-password-reset`, `pre-registration-and-invitation` and `password-validation` (each names the legacy set-password page or the callback's landing); `tests/README.md` (no row or paragraph for `contestant-email-registration`, no mention of the gate object's steps, and its sentences on where a mailed link lands); the todo `2026-10-07-174-callback-keeps-signup-and-email-arms.md` is closable.
- **178-24 — for the person's list:** the view in a real browser with a password manager (N-6, N-7), and the access token's bytes after `updateUser`, which this plan inferred from the auth log.
- **Reading the auth service's log for one test's user:** `docker logs --since <window> supabase_auth_openvaa-local`, filtered on the spec's address prefix, gives the user's events in order (`user_signedup`, `token_revoked` for a refresh, `user_modified`, `user_deleted`). Keep the events, not the lines: the lines hold the address.
- **Timing on this host today:** the tracer's project alone 30 s from the wrapper's start to its end; the three directories' unit tests under 3 s; `svelte-check` 10 s; the six gate rows 3 min 25 s; a full E2E run 11 min 48 s and 12 min 29 s.

## Threat register

| Id | Disposition | Where it stands |
|---|---|---|
| T-178-80 | mitigate | The layout test's "keeps the view until the load data changes"; the server test with the list read set up to reject; the tracer's deep-address step with the unchanged address |
| T-178-81 | mitigate | The two type-level cases; the load's four cases of a missing or non-boolean fact; the existing rejected-read case |
| T-178-82 | mitigate | Three refused types, each a unit case that verifies and claims nothing |
| T-178-83 | accept | Unchanged: recorded |
| T-178-84 | accept | No route that sets a password was added |
| T-178-85 | mitigate | `landingRoute` unchanged; unit cases for a validated and a refused `next`, for users with and without a password |
| T-178-86 | mitigate | Log Out rendered always, also after a failed save; a second press saves again — unit cases |
| T-178-87 | mitigate | The tracer: terms after the save, home, home after a reload |
| T-178-88 | mitigate | The address is the load data's user's, as text; a case with another user |
| T-178-89 | mitigate | `flowState.expectNothingOutsideMemory([address])` on E in the tracer |
| T-178-153 | accept | Not built; for the authentication page (178-23) |
| T-178-154 | accept | Not built |

## Threat Flags

None: the commit adds no endpoint, no auth path and no schema change beyond the plan's register.

## Known Stubs

None.

## Next Phase Readiness

Ready for 178-15. The architecture's two risky seams — a link request whose outcome no screen reads, and a server-decided gate passed by a password set in the browser and a rerun of the loads — both hold in a browser.

## Self-Check: PASSED

- Created files exist: `SetPasswordGate.svelte`, `setPasswordLayout.svelte.test.ts`, `contestant-email-registration.spec.ts`.
- Commits are ancestors of HEAD: `7164f249f`, `2e9ffdd59`, `7d0a39d23`, `3a9e37b49`.
- `git rev-list --count 6be83fcd7..HEAD` before this summary's commit: 4.
- Task verifies: 1 (as written 1, intent 0), 2 (0), 3 (0).
