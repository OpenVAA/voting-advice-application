---
phase: 178-sign-in-email-code-registration
plan: 16
subsystem: auth
tags: [sveltekit, svelte5, registration, mode-selector, server-guard, app-gate, entry-routes, request-hook, form-actions, axe, contestant-app, vitest, playwright]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-08: listedRegistrationModes, the message keys and test ids of the registration page; plan 178-09: EmailField and RegistrationCodeField; plan 178-10: RegistrationModeSelector, holdEntryCode, sendEntryLink, checkInvitationCode on the contestant context; plan 178-12: the register page object, witnessPageRequest; plan 178-13: the sign-in screen and the email-sent screen; plan 178-14: the set-password view the mailed link lands on; plan 178-15: the two screens a checked code leads to, and the code sign-in action"
provides:
  - "The registration page at /contestant/register is the mode selector (C): the listed modes, one panel at a time, one Continue"
  - "lib/server/contestant/registrationGuard.ts: refuseUnlessRegistrationOffered(event, need) and isRegistrationOffered(event, need), with the type RegistrationNeed"
  - "Server loads for the registration page ('any'), the email entry ('code') and the code sign-in ('code'), and the same decision asked by the code sign-in action before anything else"
  - "AppGate.entryRoutes: the frozen list of route keys a signed-in caller is sent away from; the request hook tests membership"
  - "One Register item in the signed-out menu, shown when a mode is listed"
  - "tests/tests/utils/entryAxeScan.ts: declareEntryScans(entries), EntryAxeRoute, EntryScanMarker"
  - "Fixture steps: invitationFlow.expectNoPageRequest; contestantRegisterPage.openDirectly, .expectShown, .expectSingleMode; contestantLoginPage.openEntryDirectly, .openSignInDirectly"
  - "Deleted: the legacy register layout, its load, the code guard, the code page's ssr switch, the set-password page, their two test files, and the route key ContestantAppSetPassword"
affects: [178-17, 178-18, 178-19, 178-21, 178-22, 178-23, 178-24]

actuals:
  tokens: 46729
  tasks: 3
  commits: 3
plan_head_before: 2117537dd76cc6a442f653a64b543ef28f693445
plan_head_after: eefc962ee629e7e43682dc8a5b470784ed4d53d6

tech-stack:
  added: []
  patterns:
    - "A guard that a page load asks is a module function over the request, built from a decision function that returns a boolean: a load throws the guard's redirect, and a form action asks the decision and answers a refusal in its own form"
    - "A load runs to render a page and not before a form action: an action that must not answer where its page is not served asks the page's guard itself, first"
    - "A page whose panels are removed from the document with their mode holds what was typed in page state, and submits the open panel through a main button whose form attribute names that panel's form"
    - "A fixture step that chooses on a server-rendered screen waits for the screen's script first, by the main button that is natively disabled until the page has mounted"
    - "A test that must fail on its own in a red control is not placed in a serial describe behind a test that fails first"

key-files:
  created:
    - apps/frontend/src/lib/server/contestant/registrationGuard.ts
    - apps/frontend/src/lib/server/contestant/registrationGuard.test.ts
    - apps/frontend/src/routes/contestant/register/+page.server.ts
    - apps/frontend/src/routes/contestant/register/email/+page.server.ts
    - apps/frontend/src/routes/contestant/register/page.svelte.test.ts
    - tests/tests/utils/entryAxeScan.ts
  modified:
    - apps/frontend/src/routes/contestant/register/+page.svelte
    - apps/frontend/src/routes/contestant/register/sign-in/+page.server.ts
    - apps/frontend/src/routes/contestant/register/sign-in/page.server.test.ts
    - apps/frontend/src/lib/routes/appGates.ts
    - apps/frontend/src/lib/routes/appGates.test.ts
    - apps/frontend/src/lib/routes/route.ts
    - apps/frontend/src/hooks.server.ts
    - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte
    - apps/frontend/src/routes/contestant/+layout.svelte
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/contestantApp.register.json
    - tests/tests/fixtures/shared/invitationFlow.fixture.ts
    - tests/tests/fixtures/contestant/contestantRegisterPage.fixture.ts
    - tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts
    - tests/tests/specs/contestant/contestant-email-registration.spec.ts
    - tests/tests/specs/contestant/contestant-journey.spec.ts
    - tests/tests/specs/perm/perm-closed-project.spec.ts
    - tests/tests/specs/perm/perm-answers-locked.spec.ts
    - tests/tests/specs/a11y/contestant-a11y.spec.ts
    - apps/docs/src/routes/(content)/developers-guide/contestant-app/password-validation/+page.md
    - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/navigation/contestant/ContestantNav/+page.md
    - apps/docs/src/routes/(content)/developers-guide/frontend/routing/generated/+page.md
  deleted:
    - apps/frontend/src/routes/contestant/register/+layout.server.ts
    - apps/frontend/src/routes/contestant/register/layout.server.test.ts
    - apps/frontend/src/routes/contestant/register/+layout.svelte
    - apps/frontend/src/routes/contestant/register/+page.ts
    - apps/frontend/src/routes/contestant/register/registrationCodeGuard.ts
    - apps/frontend/src/routes/contestant/register/registrationCodeGuard.test.ts
    - apps/frontend/src/routes/contestant/register/password/+page.svelte

key-decisions:
  - "The code sign-in action asks the guard's decision before it reads the posted form, and answers a refusal with fail(400, { status: 400 }), the form of a wrong password. The server's code-sign-in operation does not refuse for a project whose code mode is off, so the action's check is the only line"
  - "The guard module exports the decision, isRegistrationOffered, beside the redirect built from it: an action cannot answer a thrown redirect as a refusal of its own form"
  - "The browser case for the answers lock is in perm-answers-locked.spec.ts, not in the closed-project spec the plan names: an anonymous visitor of a closed project does not read the stored lock until the provider copies the public configuration's fourth value (plan 178-18)"
  - "The validation test of the email spec has a describe of its own, so that the control reads it red independently of the registration walk"
  - "A panel's sentence is centred where one mode stands alone on the page and start-aligned inside an option's block; a field's error is kept when another mode is chosen and the first is chosen back, as what was typed is"
  - "The wiring gate's list was not edited: the gate did not name entryAxeScan.ts"

patterns-established:
  - "declareEntryScans: the signed-out scan declarer — a reach function, a marker with an optional state attribute, further markers, the route whose address the state is at; a light test and a dark twin born dark"

requirements-completed: [REG-03]

coverage:
  - id: C1
    description: "The registration page lists the modes the list function names, in order, with nothing chosen on arrival and one Continue; with one mode its panel is shown directly; the email and the code mode never ask for an entity type"
    requirement: REG-03
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/register/page.svelte.test.ts — new; red first (tests/e2e-runs/178-unit/178-16-t1-unit-red.log, exit 1)"
        status: pass
      - kind: e2e
        ref: "contestant-email-registration: 'register: …' (two modes listed, none chosen, the email mode chosen with the keyboard); perm-closed-project: the code mode alone and the provider's mode alone shown directly"
        status: pass
    human_judgment: true
    rationale: "Nobody has looked at the rendered page. Its phone widths are plan 178-22's, and the two remaining scan entries of the page (two options with none chosen, the email panel open, a code not confirmed) are plan 178-21's."
  - id: C2
    description: "Continue per mode: the provider's opens the pre-registration start; the email mode asks for one link with the trimmed address and opens the email-sent screen on settlement; the code mode holds a valid or a used code and leads to the email entry or the code sign-in, and shows one sentence for every other answer and for a failed check, with the code left as typed"
    requirement: REG-09
    verification:
      - kind: unit
        ref: "page.svelte.test.ts — describes 'the email mode', 'the code mode', \"the provider's mode\""
        status: pass
      - kind: e2e
        ref: "the email path: 'register: …', with the witness reading 'sent' and the home reached; the provider's path: perm-closed-project, Continue ends on the pre-registration start"
        status: pass
    human_judgment: true
    rationale: "The code path has no browser case in this plan: valid, used and unconfirmed are unit cases in jsdom. Plan 178-17's code spec is its first walk."
  - id: C3
    description: "Continue validates on a press: nothing sent with no mode chosen (the group's error, named as its description, focus on the first radio) and with the open panel's field empty or unusable (the field's error, focus on the field)"
    requirement: REG-03
    verification:
      - kind: unit
        ref: "page.svelte.test.ts — 'several modes', 'the email mode', 'the code mode'"
        status: pass
      - kind: e2e
        ref: "contestant-email-registration: 'validation: …' — three presses, each inside expectNoPageRequest; red in the control on the page's frame"
        status: pass
    human_judgment: false
  - id: C4
    description: "Each panel that has a field is a form of its own declared as a post and holding one field, the radios are in none, Continue's form attribute names the open form, and the main button is natively disabled until the page has mounted"
    requirement: REG-03
    verification:
      - kind: unit
        ref: "page.svelte.test.ts — 'the forms', 'before the script of the page has loaded'"
        status: pass
    human_judgment: false
  - id: C5
    description: "The guard of the registration addresses is on the server and fails closed: the registration page leads to the login page when nothing is listed, the two code screens when the code mode is not listed; a settings read that fails lists nothing; the redirect carries no parameter"
    requirement: REG-03
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/server/contestant/registrationGuard.test.ts — new; register/sign-in/page.server.test.ts — describe 'the load'"
        status: pass
      - kind: e2e
        ref: "perm-closed-project: an empty matrix, a row for an unserved type, the provider's mode for organizations alone (the registration page and both code screens end on the login page), the provider's mode alone (both code screens end there); perm-answers-locked: all three addresses end on the login page under the lock"
        status: pass
    human_judgment: false
  - id: C6
    description: "The code sign-in action is refused where registration does not offer the code mode — mode off, answers locked, settings unreadable — before the helper is called, in the form of every other refusal"
    requirement: REG-09
    verification:
      - kind: unit
        ref: "register/sign-in/page.server.test.ts — describe 'the guard over the action'"
        status: pass
    human_judgment: false
  - id: C7
    description: "Every entry route sends a signed-in caller to the app root with no parameter: the gate table lists six route keys, frozen, and the hook tests membership; forgot-password and password-reset are not listed"
    requirement: REG-03
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/routes/appGates.test.ts — describe 'the entry routes — every route a signed-in caller is sent away from', and the two extended cases"
        status: pass
      - kind: e2e
        ref: "'register: …': signed in, the login screen, the sign-in screen, the registration page and the email-sent screen opened by address each end on the candidate's home"
        status: pass
    human_judgment: false
  - id: C8
    description: "The signed-out menu has one Register item, leading to the registration page and shown when the list is not empty"
    requirement: REG-03
    verification:
      - kind: unit
        ref: "ContestantNav.svelte.test.ts — the existing signed-out case, unchanged and green: its settings allow the code mode"
        status: pass
      - kind: e2e
        ref: "contestant-journey step 2.5: the signed-out menu's items in order, the third now 'Register'"
        status: pass
    human_judgment: true
    rationale: "No case mounts the menu over settings that list nothing: the absence of the item is covered by the list function's own unit cases and by the one-line condition, not by a case of the menu."
  - id: C9
    description: "Two states of the registration page are scanned in both themes: the code mode alone, and three options with the provider's panel open"
    requirement: REG-03
    verification:
      - kind: e2e
        ref: "perm-closed-project: 'axe accessibility scan — contestant-register-single-mode' and '… (dark)', 'axe accessibility scan — contestant-register-identity-provider' and '… (dark)'; no finding"
        status: pass
    human_judgment: false
  - id: C10
    description: "The committed suite is green on the tree that holds the selector, the guard and the gate table's list"
    requirement: REG-03
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/178-e2e/178-16-close — see 'The E2E runs'"
        status: pass
    human_judgment: false

duration: 53min
completed: 2026-10-13
status: complete
---

# Phase 178 Plan 16: The Registration Page Is the Mode Selector, Over a Guard That Decides on the Server from the Same List; the Legacy Register Tree Goes; Every Entry Route Turns a Signed-in User Away — Summary

**The registration page lists what the project offers and leads each mode where it must; one server module decides whether a registration address is served, for three page loads and for the code sign-in action; the legacy register tree is deleted without a shim; and the request hook sends a signed-in caller away from all six entry screens.**

## Read this first

- **The ruling on the code sign-in action is built.** Read first, as asked: the server's `code-sign-in` operation **does not refuse** for a project whose code mode is off, nor while answers are locked (see *What the server's `code-sign-in` does where the code mode is off*). The action now asks the guard's decision before it reads the posted form and answers a refusal with `fail(400, { status: 400 })`, the form of a wrong password. It fitted the plan's shape with no structural change: one exported function more in the guard module.
- **One named E2E case is in another spec than the plan says, and it moves a third project's total.** The plan puts "answers locked ends on the login screen" in the closed-project spec. An anonymous visitor of a closed project does not read the stored lock until the provider copies the public configuration's fourth value, which is plan 178-18's edit. The case is in `perm-answers-locked.spec.ts` instead, where the lock is the one thing that closes the addresses. `perm-answers-locked` therefore holds 5 tests, one more than in `178-15-close`, and **the verify blocks of Tasks 2 and 3 exit 1 as written at that one stage**; with `--except perm-answers-locked=1` added, each exits 0. See *Deviations* 1.
- **A gap that follows from the same fact, for plan 178-18:** in a closed project whose answers are locked, the registration addresses are served today, because the guard, like the page, reads the lock as its default. It closes when the provider copies the fourth value.
- **Two runs before the green ones are kept as red runs**, each with a cause in a test, not in the screen: the first control (`178-16-control`) and the first full run of the held tree (`178-16-precommit`). See *The E2E runs*.
- **This was the first time a browser reached the registration page.** D1 and D2 were reached only as addresses with nothing held; nobody has walked a code through C to either. That is plan 178-17's.

## Performance

- **Duration:** 53min
- **Started:** 2026-10-12T23:55Z
- **Completed:** 2026-10-13T00:48Z
- **Tasks:** 3
- **Files:** 40 outside `.planning/` (6 created, 27 modified, 7 deleted)

## Task Commits

Task 1 has no commit of its own: the plan holds its tests uncommitted until Task 2's change exists and a full run of the held tree is green (*What this plan's commits do to committed specs*, and ruling 9).

1. **Task 1: The unit cases and the E2E tests, written first** — held; committed with Task 2.
2. **Task 2: The selector, the guard, the deletions, the gate table and the menu** — after the green full run of the held tree, back to back with nothing run between them:
   - `6cdbb7995` (feat) — the seven catalogue files
   - `c884a602e` (feat) — everything else of the held set, 30 files
   - `eefc962ee` (docs) — a docs page that linked to the deleted set-password page, and two regenerated docs pages (see *Deviations* 4)
3. **Task 3: The gate rows and the full E2E run of the committed tree** — runs and their evidence; this summary.

## Each task's verify command, with its real exit status

Each block was written to `tests/e2e-runs/178-unit/178-16-t<N>-verify.sh` byte for byte from the plan and run with `bash`; the log and the head are beside it.

| Task | As written | With its stage restated | The stage, and why |
|---|---|---|---|
| 1 | **1** | **0** (`178-16-t1-verify-intent.sh`) | The node check finds `expect.soft` in the email spec: the header's rigidity line names it. Restated over the code with comments removed. The control label read is `178-16-control-r2` (*The E2E runs*). |
| 2 | **1** | **0** (`178-16-t2-verify-intent.sh`) | The last stage: `perm-answers-locked` has total 5, expected 4. Restated with `--except perm-answers-locked=1`. Every other stage of the block passed as written, the scope check included. |
| 3 | **1** | **0** (`178-16-t3-verify-intent.sh`) | The last stage, for the same total. |

## What the server's `code-sign-in` does where the code mode is off

Read from source, not run:

- `functions/account-access/index.ts`, `codeSignIn`: it asks `invitation_code_claimant_email (p_project_id, p_code)` as the service role, and with the address that answers it calls `signInWithPassword` on a client of its own.
- `schema/506-invitation-rpcs.sql`, `invitation_code_claimant_email`: it reads the **claimed** row of the project with that code hash whose claimant still exists, takes the code's attempt slot (ten in fifteen minutes) and returns the claimant's address. It does not ask `private.invitation_mode_allowed`, and reads no settings row.
- `private.invitation_mode_allowed`'s own header says why: its three callers "ask it of open rows only, so a claimed row is never judged: a registration that is finished stays as it is whatever the matrix says later" (item J3a, built so by plan 178-05).

So the server signs in the claimant of a used code with the right password **whatever the matrix says and whether or not answers are locked**. That is consistent with what the code check answers for such a code (`used`), and it means the action's check is the first and the only line, not a second one.

## The guard as built

`apps/frontend/src/lib/server/contestant/registrationGuard.ts`:

```ts
export type RegistrationNeed = 'any' | 'code';
export async function isRegistrationOffered({ fetch }, need: RegistrationNeed): Promise<boolean>;
export async function refuseUnlessRegistrationOffered(event, need: RegistrationNeed): Promise<void>;
```

- `isRegistrationOffered` builds a data provider on `createSupabaseAnonClient({ fetch })`, reads the app settings once per call, answers a rejected read with `{}` after `log.error`, and asks `listedRegistrationModes`: at least one mode for `'any'`, the code mode among them for `'code'`. It never rejects.
- `refuseUnlessRegistrationOffered` returns nothing where that is true and otherwise throws `redirect(303, buildRoute({ route: 'ContestantAppLogin', locale: event.locals.currentLocale }))`. It reads the request's fetch and locale and nothing else.
- Its callers: `register/+page.server.ts` (`'any'`), `register/email/+page.server.ts` (`'code'`, new file), the `load` of `register/sign-in/+page.server.ts` (`'code'`). Each load is `await refuseUnlessRegistrationOffered(event, …)` and returns nothing.
- The action of `register/sign-in/+page.server.ts` begins `if (!(await isRegistrationOffered({ fetch }, 'code'))) return fail(400, { status: 400 });`. No layout load exists under `register/` any more, and no load of the tree reads a `url` or `route` property.

## The registration page as built

- **The context.** `checkInvitationCode`, `getRoute`, `holdEntryCode`, `sendEntryLink` and `t` are destructured; `appSettings` is read as `contestantCtx.appSettings` inside two `$derived`s.
- **The list and the mode in play.** `listed` is `listedRegistrationModes(contestantCtx.appSettings)`. `mode` is the one listed mode, else the chosen one while it is listed. The root carries `data-modes` (`listed.join(' ')`), `data-mode-selected` (`mode ?? ''`) and `data-register-state` (`checking` while a code is checked, else `idle`).
- **The panels**, in the selector's `panel` snippet: the provider's is the paragraph through `sanitizeHtml`, with no form; the email's is a form with the sentence and `EmailField`; the code's is a form with the sentence and `RegistrationCodeField`. Each form has an id of its own, `method="POST"`, `novalidate` and a submit handler. The values and the errors are page state.
- **Continue** is a `type="submit"` button whose `form` is the open panel's form id, and a `type="button"` with a click handler while no form is open — nothing chosen, or the provider's panel. Both are natively `disabled` until `onMount`. The submit button is `loading` while a link request or a code check runs.
- **The email handler**: nothing while a request runs; an empty address shows `contestantApp.login.emailRequired`, one the control reports invalid `components.input.error.invalidEmail`, each with focus on the field; otherwise `await sendEntryLink({ origin: 'register', email })` with the trimmed address and `goto` the email-sent route. No `try`, nothing read of the request.
- **The code handler**: nothing while a request runs; an empty code shows `contestantApp.register.codeRequired` with the reason `required`; otherwise `checkInvitationCode({ code })` with the trimmed code, a rejection caught and read as no answer; `valid` and `used` are held with `holdEntryCode` **before** `goto` to the email entry or the code sign-in; every other answer shows `contestantApp.register.codeUnconfirmed` with the reason `unconfirmed`, the code untouched, and focus on the field after a `tick` (the main button was natively disabled during the check).
- **The links**: `register-login-link` leads to the sign-in screen, `register-return` to the login screen.
- No element carries a `view-transition-name`, no `<dialog>` is added, and the markup holds no numeric spacing class.

## The gate table and the hook

`AppGate` gains `entryRoutes: ReadonlyArray<Route>`. The Contestant App's row lists `ContestantAppLogin`, `ContestantAppSignIn`, `ContestantAppRegister`, `ContestantAppRegisterEmail`, `ContestantAppRegisterSignIn` and `ContestantAppEmailSent`, frozen and `satisfies ReadonlyArray<Route>`; the Admin App's lists `AdminAppLogin`. `whenAuthenticatedOnLogin` and its empty parameters are unchanged. The hook's test is `session && gate.entryRoutes.some((key) => ROUTE[key] === routeId)`. The module's docblocks describe the table as it is: the sentences on what the hook did before the table existed are gone, and a section says what an entry route is and why the forgot-password and password-reset pages are not listed.

## The unit cases

| File | Cases | |
|---|---|---|
| `lib/server/contestant/registrationGuard.test.ts` | 28 | new |
| `routes/contestant/register/page.svelte.test.ts` | 52 | new |
| `routes/contestant/register/sign-in/page.server.test.ts` | 30 (19 before) | the load, the guard over the action |
| `lib/routes/appGates.test.ts` | 47 (40 before) | one describe added, two cases extended |
| `register/layout.server.test.ts`, `register/registrationCodeGuard.test.ts` | — | deleted with what they tested |

Of the two deleted files' cases, those that still have a meaning are carried by the guard's test: an empty matrix, settings that declare nothing, a mode listed only for an unserved type, organizations as the one served type, a settings read that rejects (logged, and refused), a redirect that carries nothing of the request, and the anonymous client. The cases of the "invitation leg" — the set-password page served without a registration key — went with that page.

Red before green: `tests/e2e-runs/178-unit/178-16-t1-unit-red.log`, exit 1, four files failed. The failures of the new guard file are an import that does not resolve, and those of the page file run against the legacy page; the gate table's and the action's are type errors and expectations on the tree as it was. Green: `178-16-t2-unit-green-1.log`, 469 of 469 in the 17 files of the touched directories; the frontend's whole suite, 4852 passed and 31 skipped, 223 files passed and 1 skipped (`178-16-t2-unit-r1.log`). The four files' cases by title: `178-16-unit-cases.log`, 157 of 157.

## The E2E runs

Docker VM free space before each run, by `docker run --rm alpine df -k /` after the driver's own prune: 16.03 GiB (first control), 16.01 GiB (first full run), 15.97 GiB (second full run), 15.79 GiB (closing run). The host was on AC power throughout.

| Label | What | Result |
|---|---|---|
| `178-16-control` | the email project on the tree with Task 1 alone | **red, and not a counting control**: `register:` failed on the page's frame, and `validation:` ended **skipped** — it stood in the same serial describe. Verdict `FAIL (1)`. Kept. |
| `178-16-control-r2` | the same, with `validation:` in a describe of its own | **PASS as a red control**: 5 tests, 3 passed, exactly the two named tests failed, each on `expect(locator).toBeVisible()` for the page's frame. |
| `178-16-precommit` | a full run of the held tree | **red**: 2 failed, 318 did not run, 132 passed. Both failures were test-side (*Deviations* 3). Nothing was committed. Kept. |
| `178-16-precommit-r2` | a full run of the held tree after those two fixes | **PASS**: 452 of 452 in 117 projects, 11.5 min; both tests of the control "was red, now passed". |
| `178-16-close` | a full run of the committed tree | **PASS**: 452 of 452 in 117 projects, 0 failed, flaky, skipped or did not run; head `eefc962ee`; 11.6 min by the run's own count; no Sleep entry inside the run window; each of the two new scan entries is two passed tests. |

Per project against `178-15-close` (445 tests, 117 projects): `contestant-email-registration` 1 → 3, `perm-closed-project` 11 → 15, `perm-answers-locked` 4 → 5; the other 114 projects equal. 445 + 2 + 4 + 1 = 452.

**The closed-project spec's total: 11 before, 15 after.** One test went with the set-password page, one came (the provider's mode for organizations alone), and the two scan entries are four tests.

No axe finding and no width overflow was met on the registration page in either theme.

## The gate rows — `tests/e2e-runs/178-gates/178-16-close`, head `eefc962ee`

| Row | Exit |
|---|---|
| typecheck | 0 |
| lint | 0 |
| unit | 0 |
| check-frontend | 0 |
| build | 0 |
| format | 0 |
| docs-links | 0 |

`178-verdict gates 178-16-close --rows …`: PASS, seven rows recorded, not stale, no Sleep entry inside the run window.

Before the commit, on the held tree: the frontend's unit suite, `svelte-check` (0 errors, 0 warnings in 2254 files), `yarn typecheck:tests`, `yarn assert:i18n-catalog-namespaces`, `yarn assert:comment-hygiene`, `yarn assert:a11y-scan-wiring`, `eslint` on the touched files and the frontend's production build each exited 0; `prettier --check` exited 1 on two new files, which were formatted, and then 0.

## Every spec and fixture the search named, and what changed in each

The plan's search (`ContestantAppSetPassword`, `register.code`, `registerLink`, `registrationLocked`, `preregister` under `tests/tests`) named ten files:

| File | Change |
|---|---|
| `specs/perm/perm-closed-project.spec.ts` | its last describe rewritten (below); the three titles that carried decision ids reworded; the header brought in line |
| `specs/a11y/contestant-a11y.spec.ts` | the comment that listed `register/password` among the unscanned routes lists the routes as they are, and says which two pages the closed-project spec scans |
| `specs/contestant/contestant-journey.spec.ts` | not named for a change by the search (it reads `login.registerLink`, which stays), but its step 2.5 reads the signed-out menu by its items' names: `Registration` → `Register`, in the list, in the absence assertion and in a comment. **Found by the first full run, not by the search** |
| `fixtures/contestant/contestantLoginPage.fixture.ts` | two steps added: `openEntryDirectly`, `openSignInDirectly` |
| `utils/testIds.ts` | none: `register.code`, `register.submit` and `register.loginLink` are the ids the new page renders |
| the three bank-auth files, `contestantPreregisterPage.fixture.ts`, `bankAuthJourneyConstants.ts` | none: they read the pre-registration pages, which are not touched |

Beside them: `fixtures/shared/invitationFlow.fixture.ts` (`expectNoPageRequest`), `fixtures/contestant/contestantRegisterPage.fixture.ts` (`openDirectly`, `expectShown`, `expectSingleMode`; the two choosing steps wait for the screen's script; the email field's error is looked for inside the alert), `utils/entryAxeScan.ts` (new), `specs/contestant/contestant-email-registration.spec.ts` (two tests), `specs/perm/perm-answers-locked.spec.ts` (one test).

**The closed-project spec's last describe**, test by test:

| Before | After |
|---|---|
| an empty matrix: sign-in only, refuses `register`, `preregister` and the set-password page with a registration key | sign-in only; refuses `register`, `register/email`, `register/sign-in` and `preregister` |
| a signed-in user reaches the set-password page without a registration key | removed with the page |
| the code mode: the registration link, the code-entry page opens | the registration link; the registration page shows the code field directly; each of the two code screens leads a visitor who holds no code to the registration page |
| the identity provider's mode: pre-registration beside a collapsed form; `register` refused | the same on the login page; the registration page lists that mode alone and Continue ends on the pre-registration start; the two code screens are refused |
| — | the identity provider's mode for organizations alone: no entry on the login page, and all three registration addresses refused |
| the heading; a row for an unserved type | unchanged |
| — | `contestant-register-single-mode` and `contestant-register-identity-provider`, each a light and a dark test, through `declareEntryScans` |

Its four scans of the login page are untouched.

## Every reader of a deleted name, and what became of it

| Name | Readers on the base tree | Now |
|---|---|---|
| `ContestantAppSetPassword` | `route.ts`; `register/+page.svelte` (the legacy code flow's target); `perm-closed-project.spec.ts` | the key is removed; the page is rewritten; the spec's constant and its two uses are gone |
| `registrationCodeGuard`, `isRegistrationCodeLeg` | `register/+layout.server.ts` and the guard's own test | both deleted |
| `/contestant/register/password` as text | a comment in `routes/contestant/+layout.svelte`; a comment in `contestant-a11y.spec.ts`; two docs pages | both comments reworded; `password-validation/+page.md` names the set-password view (its link was a docs-links finding); `contestant-app/registration/+page.md` still describes the deleted page in prose — plan 178-23's |
| `register/+layout.svelte`'s "registration locked" frame | nothing else | deleted; `contestantApp.error.registrationLocked` is still read by `preregister/+layout.svelte` |
| `register/+page.ts` (`ssr = false`) | nothing else | deleted: the registration page is server-rendered |

**`contestantApp.setPassword.passwordSetSuccesfully` is read by `login/+page.svelte`, not by the deleted page** (the dispatch notes say "by that page alone"). The deleted page was the only writer of `newUserEmail`, which is what makes the login page show that heading; the login page's branch is now unreachable and goes with the page's rewrite in plan 178-18.

**Message keys with no reader left on the tree**, kept in the catalogues until plan 178-23 (ruling 8): `contestantApp.register.codePlaceholder`, `.goToLoginLabel`, `.loggedInWarning`, `.titleWithPreregistration`, `.wrongRegistrationCode`, and `contestantApp.setPassword.registrationError`. The context members `checkRegistrationKey` and `register` have no caller, and `newUserEmail` no writer.

## Items built at their options

- **PL-24 (H33), where the guard of the registration pages lives.** Read by the operator on 2026-10-11 and standing at its recommended option, which is what is built: a module asked by each registration page's own server load. The other option, D-19's letter: one `register/+layout.server.ts` that reads the route id to tell the three pages apart, as the legacy one did, and no page loads. The built form is a departure from D-19's letter, not an amendment of it.
- **J4, J5, U-05, U-14, U-15, U-23, U-29, PL-12 and PL-23** were read by the operator on 2026-10-11 and stand at their recommended options; each is built so. U-29 and J5 are in the list function this plan reads and does not change.
- **The orchestrator's ruling after 178-15** (the guard binds the code sign-in action): built, with unit cases for mode off, answers locked and an unreadable settings row. It is put to the operator at the phase's close by the orchestrator.

## Decisions Made

- **The action's refusal is `fail(400, { status: 400 })` and not the guard's redirect.** The ruling asks for "the status alone", the form of a wrong password; a redirect would tell a caller which of the two it met.
- **The decision is asked before the form is read.** The action touches nothing of the request where its screen would not be served.
- **`isRegistrationOffered` takes the request's fetch alone.** The action has no use for the locale, and the function decides nothing from it.
- **A field's error stays when another mode is chosen and the first is chosen back.** The field still holds what the error is about; the contract says what was typed is kept and says nothing of the error.
- **The Register item of the menu takes the icon the pre-registration item had** (`create`).
- **The closed-project spec drives the registration page through its page object** and keeps its own locators for the login page it already read: its header says so.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The answers-lock case cannot pass where the plan puts it**
- **Found during:** Task 1, before writing the case
- **Issue:** The plan's step 5 adds "answers locked ends on the login screen" to the closed-project spec. For an anonymous visitor of a closed project the settings come from `contestant_app_public_config` through `storedPublicConfig`, which copies three values; `access.answersLocked` is the fourth, and copying it is plan 178-18's step. The guard, which reads with the anonymous client, would not see the lock there.
- **Fix:** The case is one test in `perm-answers-locked.spec.ts`: an open project whose dataset allows candidates the email and the code mode and locks answers, so the lock is the one thing that closes the three registration addresses. No setting is written.
- **Consequence:** `perm-answers-locked` has 5 tests, not 4. The verdict commands of Tasks 2 and 3 need `--except perm-answers-locked=1`; as written they fail at that stage.
- **Files modified:** `tests/tests/specs/perm/perm-answers-locked.spec.ts`
- **Commit:** `c884a602e`

**2. [Rule 1 - Bug] The validation test could not fail on its own**
- **Found during:** Task 1, the first control
- **Issue:** Placed in the email spec's serial describe after the registration walk, it ended skipped when that walk failed, so the control did not count.
- **Fix:** A describe of its own; it seeds nothing and reads no reserved row. Second control under `178-16-control-r2`.
- **Files modified:** `tests/tests/specs/contestant/contestant-email-registration.spec.ts`
- **Commit:** `c884a602e`

**3. [Rule 1 - Bug] Two test-side defects met by the first full run of the held tree**
- **Found during:** Task 2, step 10
- **Issue (a):** `contestantRegisterPage.expectFieldError('email', …)` compared the alert's whole text with the message, and the alert shows an emoji before it. The step had never run in a browser. **Fix:** the sentence is looked for inside the alert.
- **Issue (b):** the journey's step 2.5 expected the signed-out menu's third item to read "Registration". The menu's one item reads "Register" by the UI contract (U-23). The plan's search does not find a test that reads the menu by its items' names. **Fix:** the expectation, the absence assertion beside it and a comment.
- **Files modified:** `tests/tests/fixtures/contestant/contestantRegisterPage.fixture.ts`, `tests/tests/specs/contestant/contestant-journey.spec.ts`
- **Commit:** `c884a602e`

**4. [Rule 3 - Blocking] The docs linked to a deleted file**
- **Found during:** after Task 2's commit, regenerating the component docs for the menu's changed docstring
- **Issue:** `developers-guide/contestant-app/password-validation/+page.md` linked to `register/password/+page.svelte` on GitHub; the link validator, which is the `docs-links` gate row, refuses a path that is not tracked.
- **Fix:** The page names `SetPasswordGate.svelte` where it named the deleted page, and its step 4 no longer names the deleted page's `register` branch. `generate:docs` then regenerated the menu's page and the route tree (which also caught up with the routes plans 178-13 and 178-15 added).
- **Files modified:** three under `apps/docs/`
- **Commit:** `eefc962ee`

### Other departures, none of them a fix

- **Files outside the plan's `files_modified`:** `routes/contestant/+layout.svelte` (a comment that named the deleted page), `tests/tests/specs/a11y/contestant-a11y.spec.ts` (a comment), `tests/tests/specs/contestant/contestant-journey.spec.ts`, `tests/tests/specs/perm/perm-answers-locked.spec.ts`, the login and register page objects, and the three docs files.
- **Files in `files_modified` that were not edited:** `scripts/assert-a11y-scan-wiring.mjs` (the gate exited 0 and did not name `entryAxeScan.ts`, so by the plan's step 8 its list is unchanged) and `register/password/+page.svelte` beyond its deletion.
- **`route.ts` gained a doc comment on `ContestantAppRegister`**, beside the removal of the legacy key.
- **The email spec's verify stage** searches the spec for `expect.soft` and meets the header's rigidity line, as plans 178-12 and 178-14 recorded.
- **`git rm` was used for the seven deletions**, which stages them; they were committed by pathspec with the rest.

## The code-review checklist

| Item | Outcome |
|---|---|
| The changes solve the issue | Yes: the page lists what the project offers, each mode leads where it must, the guard decides on the server, the legacy tree is gone, signed-in callers are turned away |
| OWASP top 10 | Access control: the guard is server-side, reads with an anonymous client and fails closed, and the action asks it. No open redirect: both redirects are a route key and the locale. Injection: the one `{@html}` goes through `sanitizeHtml`; every other string is text. The code and the address are in no address, storage or log |
| Code style guide | Followed; exported symbols have TSDoc |
| No `any` | None added |
| No repeated code | The three loads share the guard; the action shares its decision. The page's handlers follow the forms of the sign-in screen and the email entry and repeat no function |
| New entities documented | The guard module, both its functions and its type; `AppGate.entryRoutes`; the page's `@component` block; every fixture step; `declareEntryScans` and its types |
| Repo documentation updated | One docs page repaired and two regenerated; the rest is plan 178-23's (see *For later plans*) |
| Tracking events | None added, as on the screens of plans 178-13 and 178-15; not asked for by the contract |
| Svelte component guidelines | No new component; the page reads reactive accessors as `contestantCtx.X` |
| Errors handled and logged | A failed settings read is logged and fails closed. A failed code check is read as a code not confirmed, by design, and is not logged by the page; the alert it shows is logged by `ErrorMessage` |
| Failing checks | None on the committed tree |
| Parts sharing dependencies | The Admin App's row lists its one login route, and its behaviour is unchanged; the full run is green |
| WCAG A and AA | Two states scanned in both themes with no finding; the other states are plan 178-21's |
| Keyboard and screen reader | The email mode is chosen with the keyboard in a browser, focus staying on the radio; the group's error is its description and focus goes to the first radio; a field's error is an alert and focus goes to the field. Not tried with a screen reader |
| Docs added | As above |
| Comment hygiene | `yarn assert:comment-hygiene` exit 0 before each commit; the touched comments were read. Three test titles and two file headers that carried decision ids or history were brought in line |
| Commit history | Three commits: the catalogues, the held set, the docs |
| No fixes of itself | The two test-side fixes were made in the held set before anything was committed |
| Formatting separate | No formatting-only change |
| `[db]` | No database change |

## Prohibitions

| Id | Statement | Outcome |
|---|---|---|
| PROH-178-47 | The selector never offers a mode the server will refuse for every type, never offers the provider's flow to a project that allows it for organizations alone, and never tells a visitor why a code was not confirmed | Held: the page reads `listedRegistrationModes` and nothing else; the organizations-alone matrix ends on the login page in a browser; four unit cases show one sentence and one reason for an unknown code, a rejected check, an unknown answer and no answer |
| PROH-178-48 | No route, redirect, link, menu item or shim leads to the legacy pages or their URL parameters; no file under `preregister/` or `api/contestant/` is edited | Held: the seven files are deleted, no reader of their names is left under `apps/frontend/src`, the page reads no search parameter, and `git diff $(cat 178-BASE) HEAD` is empty for both trees |
| PROH-178-49 | The signed-in bounce and the guard's redirect carry no parameter and take no target from the request | Held: unit cases for both, each with a request that carries targets |

## Observed, and inferred

**Observed:** the unit cases; the two controls and the two full runs of the held tree; the gate rows; the closing run. In a browser: the registration page server-rendered and hydrated; two modes listed with none chosen; a mode chosen with the keyboard without focus leaving the radio; a main button tied to a panel's form by its `form` attribute submitting it; the email path to the home; a signed-in user sent from four entry screens to their home; the page's three validation presses sending nothing; the page with one mode; the provider's Continue; every refusal of the registration addresses named above; two scanned states in both themes.

**Inferred, not run:** what the server's `code-sign-in` does where the code mode is off (read from the function and the schema); that a post to the code sign-in action is refused in a browser (the unit cases drive the action directly); that a signed-in user is sent away from the two code screens (the list holds their keys; the browser case covers the other four).

## Not done, or not verified

- **The code path of the page has no browser case**: valid to the email entry, used to the code sign-in, and the one sentence. Plan 178-17.
- **The guard over the action has no browser case.** With the code mode off the screen's own load leads away before a form exists, so only a direct post reaches the action.
- **The answers lock for an anonymous visitor of a closed project is not honoured** by the guard or by the page until plan 178-18 copies the public configuration's fourth value.
- **The menu has no unit case over settings that list nothing.**
- **Nobody has looked at the rendered page**, and it was not opened at a phone width. The other three scan entries of the page are plan 178-21's.
- **`entryAxeScan.ts` is in no list of the wiring gate.** The gate's check 4a covers files it names; the declarer imports `assertAxeScan` and builds no gate of its own, and nothing asserts that it keeps doing so.
- **The two opt-in bank-auth projects were not run** (item PL-26: once, at the closing gate).

## Threat Flags

None beyond the plan's register. What the plan's register does not name and this plan closes: the code sign-in action answering where the code mode is not offered (plan 178-15's flag `guard-bypass`).

## Known Stubs

None. The provider's Continue leads to the legacy pre-registration start by its route key, which is the plan's truth until Phase 179 changes the destination.

## The state the local stack is left in

The stack is up and was not restarted. The database is as the closing full run's teardowns left it: `private.invitation_link_witness` holds the rows of the link requests the runs made, so pgTAP file 39's test 238 is red on it until a reset (the known finding). No dev server is running and nothing listens on the E2E port.

## For later plans

- **Predecessor label for the next full run: `178-16-close`** (452 tests, 117 projects, head `eefc962ee`). A comparison with `178-15-close` needs `--except contestant-email-registration=2 --except perm-closed-project=4 --except perm-answers-locked=1`.
- **178-17 (the code spec) — the registration page's steps.** `contestantRegisterPage.open()`, `chooseMode('code')` or `chooseModeWithKeyboard('code')` (both wait for the page's script), `typeCode(code)`, `pressContinue()`, then `expectEmailEntryShown()` or `expectCodeSignInShown()`, or `expectCodeUnconfirmed()`. On the base dataset the page lists `email` and `code`. The code check is one request to `account-access` with the operation `check-code`: `witnessPageRequest` does not count it, and `expectNoPageRequest` does.
- **178-17 — the page's markers:** `contestant-register` with `data-modes`, `data-mode-selected` and `data-register-state` (`idle`, `checking`); `register-code-error` with `data-reason` (`required`, `unconfirmed`); `register-email-error` has no `data-reason` and is told by its text, which follows an emoji inside the alert — assert with a containing match, as the step does.
- **178-17 — the code sign-in action refuses with 400 where the code mode is not listed or answers are locked.** A spec that switches the code mode off and posts through the screen will not get as far as a form: the screen's load leads to the login page first.
- **178-17, 178-21 — a single mode:** `expectSingleMode(mode)` asserts the page's two attributes, no radio and no panel block, and the field where the mode has one. `expectPanelOpen` is for several modes.
- **178-18 (A) — the login page:** its registration link (`login.registerLink`) leads to C and is still shown only for the code mode, by the old condition; its pre-registration button stays. `listedRegistrationModes` is the condition A's Register takes. The page's `newUserEmail` branch and its `passwordSetSuccesfully` heading are unreachable now. **When `storedPublicConfig` copies `access.answersLocked`, the guard honours the lock for an anonymous visitor of a closed project with no further change**, and the closed-project spec is then the place for that case: `expectRefusedToLogin(page, REGISTER_ROUTE)` after a settings write with `access: { answersLocked: true }`.
- **178-18 — the closed-project spec** still holds `loginScan` and its four scans of the old login page, and reads `login.showLogin`, `login.preregister` and `login.registerLink`. Its last describe's title and the file's header were rewritten here; the top-level describe is now `a project that is not open for voters`.
- **178-18, 178-21 — `declareEntryScans(entries)`** from `tests/tests/utils/entryAxeScan.ts`. An entry: `{ name, routeId, reach: async (page) => …, marker: { testId, attribute?, value? }, alsoShown?: [...] }`. `reach` is handed a page that has opened nothing and does everything, a settings write included. The reach proof asserts each marker and that the settled path is the route's, in English, so an entry whose state is under a redirect names the route it ends at. Titles are `axe accessibility scan — <name>` and the same with ` (dark)`: `--expect-title-count "<project>::<name>=2"` reads both.
- **178-21 — the wiring gate.** `scripts/assert-a11y-scan-wiring.mjs` names neither `entryAxeScan.ts` nor the new scan spec. The plan that adds the spec to check 4a's list should add the declarer in the form of `contestantAxeScan.ts`'s entry (`from './axeScan'`, `assertAxeScan`).
- **178-19 (forgot-password):** the gate table does not list it or the password-reset page; a signed-in user reaches both.
- **Any plan that adds an entry screen** adds its route key to the Contestant App's `entryRoutes` and to the case "lists exactly the six screens" of `appGates.test.ts`.
- **Any plan that adds a registration address** gives its page a server load that calls `refuseUnlessRegistrationOffered(event, need)`, and a form action there asks `isRegistrationOffered({ fetch }, need)` first and answers its own refusal.
- **A test meant to be red on its own in a control is not placed in a serial describe behind another red test**: the second ends skipped and the control does not count.
- **A change of a menu item's text is not found by a search for test ids**: `contestant-journey.spec.ts` reads both menus by their items' accessible names (`CONTESTANT_NAV_LOGGED_OUT`, `CONTESTANT_NAV_LOGGED_IN`).
- **Deleting a file the docs link to on GitHub turns the `docs-links` row red**: `yarn workspace @openvaa/docs validate:links --check` before the commit finds it. `generate:docs` exits 1 on such a finding **before** it formats, and leaves some fifty generated pages rewritten unformatted; discard them, repair the link and run it again.
- **178-21, 178-22 — to look at on the rendered page:** a panel's sentence is centred with one mode and start-aligned inside an option's block; with one mode the code field's hint sits directly on the shaded page (scanned, no finding in either theme); the provider's paragraph is the catalogue's markup inside a `div`; a field's error is kept when another mode is chosen and the first chosen back; Continue is one of two button elements, a submit button while a panel with a form is open and a plain button otherwise.
- **178-23 — documentation now out of date:** `developers-guide/contestant-app/registration` (it describes the deleted set-password page and the registration-key parameters), `login-and-password-reset`, `pre-registration-and-invitation`; `backend/authentication` (the guard, the entry routes, the action's check); wherever the docs describe the app-gate table or the request hook; `tests/README.md` (the declarer, the new steps, the email project's two more tests); the comment of the `contestant-email-registration` project in `tests/playwright.config.ts`, which says the walk starts on the sign-in screen; the six message keys with no reader listed above, with `checkRegistrationKey`, `register` and `newUserEmail`; the constructed strings of this plan for the native-speaker review — `contestantApp.register.enterCode` in `da`, `et`, `fi`, `fr`, `lb` and `sv` (each shortened from the locale's own sentence) and the capitalised `contestantApp.register.code` in `da`, `fr` and `sv`.
- **Timing on this host today:** the email project alone 36 s and 39 s from the wrapper's start to its end; a full run 11 min 42 s (the held tree) and 12 min 38 s (the committed tree); the seven gate rows 3 min 28 s; the frontend's production build 49 s.

## Self-Check: PASSED

- The six created files exist, the seven deleted files are gone, and the closing run's and the gate set's records exist.
- The commits `6cdbb7995`, `c884a602e` and `eefc962ee` are ancestors of HEAD; `git rev-list --count 2117537dd..HEAD` is 3.
