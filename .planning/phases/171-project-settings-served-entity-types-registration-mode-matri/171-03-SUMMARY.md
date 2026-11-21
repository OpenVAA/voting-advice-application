---
phase: 171-project-settings-served-entity-types-registration-mode-matri
plan: 03
subsystem: ui
tags: [svelte-5, sveltekit, i18n, paraglide, registration-modes, entity-types, contestant-app, route-guard, tdd, e2e-dataset]

requires:
  - phase: 171-project-settings-served-entity-types-registration-mode-matri
    provides: "Plan 01: the accessors of `contestantAppConfig.ts` (`getContestantAppNameKey`, `isRegistrationModeAllowedForAnyType`, `REGISTRATION_MODE`), total on a provider's raw answer and on `{}`; the three readers of the old switch already deriving `canPreregister`"
  - phase: 171-project-settings-served-entity-types-registration-mode-matri
    provides: "Plan 02: the provider's closed-project answer carrying whole `access` and `contestantApp` roots to an anonymous client, which the new guard reads"
  - phase: 170-contestant-app-rename-symbols-routes
    provides: "The `routes/contestant/` tree, `ContestantNav`, the `contestantApp.*` message namespaces and the app-name search gate of `lint:check`"
provides:
  - "`dynamic.contestantAppName.candidate`, `.candidateAndOrganization` and `.organization` in seven locales, and the regenerated key union"
  - "`getContestantAppName({ appSettings, t })` in `apps/frontend/src/lib/contestant/utils/contestantAppName.ts`, the one derivation of the shown name, with its five readers"
  - "The parameter `{contestantAppName}` in five sentences per locale, passed at every call site"
  - "The registration-code link on the login page and the registration item in the navigation, each rendered only when a served type allows the `code` mode"
  - "`routes/contestant/register/+layout.server.ts`: the server guard of the registration-code leg, with the invitation leg exempt before any settings read, and `isRegistrationCodeLeg` beside it"
  - "`BASE_APP_SETTINGS.contestantApp` stating the whole root (`['candidate']`, `candidate: ['email', 'code']`, `organization: []`), with its pin — brought forward from plan 04"
  - "A third entry in the app-name gate's exemption list, for the three shown names as whole quoted strings"
  - "The pending todo for the native-speaker review of the constructed names and sentences"
affects: [171-04, 173, 174, 178, 179]

actuals:
  tokens: 9608
  tasks: 3
  commits: 5
plan_head_before: 7c2e23de760a378f1952f4f69f6f48de3e3c79d0
plan_head_after: 77ca76ae53878c9bec9546bdff8bf98d444fc600

tech-stack:
  added: []
  patterns:
    - "The app's shown name is read through `getContestantAppName` inside `$derived` over the context's `appSettings`; no reader builds it from entity words or reads `contestantApp.entityTypes`"
    - "A sentence that names the app takes `{contestantAppName}` first, before a colon, so that the name is never inflected"
    - "A server guard under a registration tree decides which leg a request is on with a pure helper, and returns before any settings read for a leg no registration mode governs"
    - "A dataset declares a registration mode before the screen that asks for it is gated, so that no commit leaves a spec without the entry it asserts"

key-files:
  created:
    - apps/frontend/src/lib/contestant/utils/contestantAppName.ts
    - apps/frontend/src/lib/contestant/utils/contestantAppName.test.ts
    - apps/frontend/src/routes/contestant/register/+layout.server.ts
    - apps/frontend/src/routes/contestant/register/layout.server.test.ts
    - apps/frontend/src/routes/contestant/register/registrationCodeGuard.ts
    - apps/frontend/src/routes/contestant/register/registrationCodeGuard.test.ts
    - .planning/todos/pending/2026-10-05-native-speaker-review-contestant-app-names.md
    - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/evidence/171-03-task1-red.json
    - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/evidence/171-03-task3-red.json
  modified:
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/dynamic.json
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/contestantApp.notSupported.json
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/contestantApp.help.json
    - apps/frontend/src/lib/types/generated/translationKey.ts
    - apps/frontend/src/lib/i18n/tests/translations.test.ts
    - apps/frontend/src/routes/contestant/+layout.svelte
    - apps/frontend/src/routes/contestant/login/+page.svelte
    - apps/frontend/src/routes/contestant/register/+page.svelte
    - apps/frontend/src/routes/contestant/forgot-password/+page.svelte
    - apps/frontend/src/routes/contestant/password-reset/+page.svelte
    - apps/frontend/src/routes/contestant/help/+page.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte
    - packages/dev-seed/src/templates/e2e/base.ts
    - packages/dev-seed/tests/templates/base-app-settings.test.ts
    - scripts/assert-no-candidate-app-names.mjs
    - scripts/fixtures/assert-no-candidate-app-names.input.ts
    - scripts/fixtures/assert-no-candidate-app-names.expected.ts.violations

key-decisions:
  - "The base E2E dataset declares the served types and the registration matrix inside this plan, one commit ahead of the gate, by the coordinator's decision at the checkpoint. Without it the navigation gate turns `contestant-journey` red, and the perm chain depends on that project."
  - "The app-name gate masks the three shown names only where one of them is a whole quoted string. The phrase anywhere else is still reported."
  - "The five sentence calls pass the name in shorthand, `{ contestantAppName }`. The longhand was not written to satisfy a grep."
  - "The set-password route id is a constant of the layout's server file, compared with the typed `route.id`, so a wrong id is a type error."
  - "Task 3 has a `test` commit before its `feat` commit. At the `test` commit the load is a placeholder that does nothing, so the routes behave as before and the frontend typechecks."

patterns-established:
  - "Readers of the app's name: `$derived(getContestantAppName({ appSettings: <ctx>.appSettings, t }))`"
  - "Readers of the code mode: `$derived(isRegistrationModeAllowedForAnyType(appSettings, REGISTRATION_MODE.Code))`, named `canRegisterWithCode`"

requirements-completed: [SET-03, NAME-03]

coverage:
  - id: D1
    description: "Three whole names per locale under `dynamic.contestantAppName`, in all seven locales, with the English values the operator's literal terms"
    requirement: NAME-03
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/i18n/tests/translations.test.ts#contestant app names — <locale> (7 cases) and #the contestant app names in 'en' are the three literal terms"
        status: pass
    human_judgment: true
    rationale: "The eighteen names of da, et, fi, fr, lb and sv are constructed and not reviewed by a native speaker. Filed as a pending todo; it does not block the phase."
  - id: D2
    description: "`getContestantAppName` picks one of the three keys through the name-key accessor and returns what the translation function returns"
    requirement: NAME-03
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contestant/utils/contestantAppName.test.ts (8 cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The login heading, the pre-heading on register, forgot-password and password-reset, and the help page's mail subject read the name from the helper, reactively"
    requirement: NAME-03
    verification:
      - kind: other
        ref: "git grep -F \"t('dynamic.contestantAppName')\" -- apps/frontend/src (nothing found); git grep -F getContestantAppName -- apps/frontend/src/routes (the five readers and the root layout); yarn workspace @openvaa/frontend check (exit 0)"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/171-e2e/171-03-close — default suite, 171 of 171"
        status: pass
    human_judgment: true
    rationale: "No E2E assertion reads the heading text yet; plan 04 adds it. The run shows that the pages render and that nothing depended on the old name."
  - id: D4
    description: "Five sentences per locale take `{contestantAppName}` and every call site passes it"
    requirement: NAME-03
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/i18n/tests/translations.test.ts#sentences that name the contestant app — <locale> (35 cases)"
        status: pass
      - kind: other
        ref: "git grep -F \"{ contestantAppName }\" -- apps/frontend/src/routes (five calls); the population command of Task 2 shows no bare call"
        status: pass
    human_judgment: true
    rationale: "The thirty non-English sentences are constructed and not reviewed by a native speaker. Same pending todo as D1."
  - id: D5
    description: "The registration-code link and the navigation's registration item render exactly when a served type allows `code`; with an empty effective matrix neither registration entry renders and the sign-in form is not collapsed"
    requirement: SET-03
    verification:
      - kind: other
        ref: "git grep -F isRegistrationModeAllowedForAnyType -- apps/frontend/src (the login page, the nav and the guard); yarn workspace @openvaa/frontend check (exit 0)"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/171-e2e/171-03-close — contestant-journey step 2.5: ten logged-out items with Registration third, on a base dataset that allows code; tests/e2e-runs/171-e2e/171-03-probe-nav-gate-uncommitted — nine items on a dataset that allows no mode"
        status: pass
    human_judgment: true
    rationale: "No component test renders the login page or the nav. The two states were seen in E2E runs through the nav; the login page's link in both states is asserted by plan 04's specs."
  - id: D6
    description: "A direct request on the registration-code leg is redirected to the login route when no served type allows `code`, and when the settings read fails"
    requirement: SET-03
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/register/layout.server.test.ts#the registration-code leg (9 cases)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The invitation leg (the set-password page without a registration key) is served under every matrix and the load reads no setting to decide it"
    requirement: SET-03
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/register/layout.server.test.ts#the invitation leg (4 cases); registrationCodeGuard.test.ts (4 cases)"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/171-e2e/171-03-close — contestant-journey and perm-localisation-positive both land an invitation on the set-password page"
        status: pass
    human_judgment: false
  - id: D8
    description: "The base E2E dataset declares the whole `contestantApp` root, pinned by its dev-seed test"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/templates/base-app-settings.test.ts#contestantApp block states the whole root"
        status: pass
    human_judgment: false

duration: 27min
completed: 2026-10-05
status: complete
---

# Phase 171 Plan 03: The Contestant App's Name and the Registration Entries on Screen Summary

**The contestant app names itself from the served entity types in seven locales through one helper, five sentences take that name as a parameter, the registration-code link and its navigation item appear only where a served type allows the `code` mode, and a server guard refuses the registration-code leg by URL in the same case while an invitation still lands under every matrix.**

## Performance

- **Duration:** 27 min, with one stop at a decision checkpoint
- **Started:** 2026-10-05T22:32:30Z
- **Completed:** 2026-10-05T22:59:17Z
- **Tasks:** 3 of 3, plus one step the coordinator added ahead of Task 3
- **Files changed:** 44 (41 outside `.planning/`), before this summary
- **Start revision:** `7c2e23de760a378f1952f4f69f6f48de3e3c79d0`
- **The tree every closing gate describes:** `77ca76ae53878c9bec9546bdff8bf98d444fc600`

## Accomplishments

- Turned the leaf message `dynamic.contestantAppName` into a group of three whole names in each of the seven locales and regenerated the key union.
- Wrote `getContestantAppName` and moved the five readers of the old leaf to it. Each derives the name inside `$derived` over its context's `appSettings`. The help page's mail link is derived with it.
- Rewrote five sentences per locale so that the name is the parameter `{contestantAppName}`, first and before a colon, and passed it at the four calls of the route root layout and at the help page's ingress.
- Gated the login page's registration-code link and the navigation's registration item on `isRegistrationModeAllowedForAnyType(…, 'code')`.
- Added the server guard of the `register/` tree and the pure decision `isRegistrationCodeLeg` it uses.
- Declared the two settings in the base E2E dataset one commit ahead of the gate.
- Filed the native-speaker review of eighteen names and thirty sentences as a pending todo.

## What the Plan Asked to Have Recorded

| Item | Value |
|---|---|
| Catalogue values changed from the plan's tables | None. All 21 names and all 35 sentences are the plan's values, character for character. The French sentences use a plain space before the colon, as the plan writes them and as `fr/dynamic.json` already does. |
| The route id the guard compares against | `/contestant/register/password`. Measured in the generated `apps/frontend/.svelte-kit/types/src/routes/contestant/register/$types.d.ts`, whose route-id union for this layout is `"/contestant/register" \| "/contestant/register/password"`, and equal to `ContestantAppSetPassword` in `lib/routes/route.ts`. It is the constant `SET_PASSWORD_ROUTE_ID` of `+layout.server.ts`; `route.id` is typed by that union, so a wrong id fails the typecheck. |
| The deferred native-speaker review | `.planning/todos/pending/2026-10-05-native-speaker-review-contestant-app-names.md`. It lists the eighteen names and the thirty sentences, says they were constructed from each catalogue's existing terms and not reviewed, and names the review as the open step. Non-blocking. |

## Task Commits

1. **Task 1: Three names in seven locales, the key union, the name helper and its five readers** (TDD, one commit as the plan requires)
   - `13d211873` `feat(171-03): name the contestant app from the served entity types in seven locales`
2. **Task 2: The five sentences take the name as a parameter; the review todo**
   - `5876b2712` `feat(171-03): pass the contestant app's name to the five sentences that embed it`
3. **Added at the checkpoint: the base dataset declares the two settings**
   - `38c2a2f1a` `test[e2e](171-03): declare the served entity types and the registration modes in the E2E base dataset`
4. **Task 3: Gate the registration-code entry, guard the registration-code leg** (TDD)
   - `da84ec133` `test(171-03): add failing tests for the registration-code guard and its leg decision` — red: 12 of 17 cases fail.
   - `77ca76ae5` `feat(171-03): offer the registration-code entry only where a served type allows the code mode`

No refactor commit was needed. `git rev-list --count 7c2e23de7..77ca76ae5` is 5.

## The Checkpoint

The plan was stopped after Task 2 and resumed on the coordinator's decision.

**What was found.** `tests/tests/specs/contestant/contestant-journey.spec.ts`, step 2.5, asserts the exact logged-out navigation list `CONTESTANT_NAV_LOGGED_OUT`: ten items, the third `/^Registration$/`. That item is the one Task 3 gates. `BASE_APP_SETTINGS.contestantApp` declared only `questions`, so its effective matrix was `{"candidate":[]}` and the `code` mode was not allowed. `data-setup-perm-1e1cg1co` depends on `contestant-journey`, so a red journey leaves the perm chain unrun. No plan of the phase mentions that list; plan 04 was to declare the matrix in the datasets.

**What was measured.** With only Task 3's navigation `{#if}` applied, uncommitted, the one project was run: `tests/e2e-runs/171-e2e/171-03-probe-nav-gate-uncommitted`, wrapper exit 1, 1 failed and 4 passed, the failure at step 2.5 in `navMenu.fixture.ts` on `toHaveCount` — expected 10, received 9. The edit was then discarded with `git checkout --` on that one file.

**What was decided.** Option A: declare the base dataset inside this plan, one commit ahead of Task 3. Leaving the suite red between two plans was refused, and so was editing the journey's list to fit an interim state.

## Gate and E2E Results

Each exit status was read from the command or from its exit marker, never through a pipe. The plan gate ran on the working tree that was then committed unchanged as `77ca76ae5`.

| What | Command | Exit | Result |
|---|---|---|---|
| Frontend check, Task 1 tree | `yarn workspace @openvaa/frontend check` | 0 | 0 errors, 0 warnings |
| Frontend check, Task 2 tree | same | 0 | 0 errors, 0 warnings |
| Frontend check, Task 3 `test` commit tree | same | 0 | 0 errors, 0 warnings |
| Frontend check, final tree | same | 0 | 0 errors, 0 warnings |
| Frontend unit, final tree | `yarn workspace @openvaa/frontend test:unit` | 0 | 2140 tests in 135 files (2072 in 132 before; 68 added: 8 helper, 43 catalogue, 17 guard) |
| Lint, final tree | `yarn lint:check` | 0 | every link through `assert:edge-function-env`; comment hygiene 0 violations in 1799 files; app-name gate 0 findings in 2700 files; no-session-in-loads 13 modules, 0 violations |
| Lint, Task 2 tree | same | 0 | |
| Dev-seed unit | `yarn workspace @openvaa/dev-seed test:unit` | 0 | 902 tests in 66 files (901 before) |
| Dev-seed typecheck | `yarn workspace @openvaa/dev-seed typecheck` | 0 | |
| Catalogue tests | `vitest run src/lib/i18n/tests/translations.test.ts` | 0 | 354 cases, both standing parity tests among them |
| Namespace gate | `yarn assert:i18n-catalog-namespaces` | 0 | 597 keys, 0 violations |
| Key-type regeneration after Task 2 | `generate:translation-key-type`, then `git status --porcelain` on the file | 0 | prints nothing: the union is unchanged by Task 2 |
| App-name gate self-test | `node scripts/assert-no-candidate-app-names.mjs --self-test` | 0 | 82 findings, 82 expected (81 before) |
| Task 1 automated verify | link by link | 0 | every link |
| Task 2 automated verify | link by link | one link 1 | the `contestantAppName:` grep; see below |
| Task 3 automated verify (both) | link by link | 0 | every link |
| E2E, after Task 2 | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/171-e2e/171-03-after-task2 --no-db-reset` | 0 | 171 expected, 0 unexpected, 0 flaky, 0 skipped; head `5876b2712`, tree clean |
| E2E probe, one project, uncommitted edit | `… --run-dir tests/e2e-runs/171-e2e/171-03-probe-nav-gate-uncommitted --no-db-reset --project contestant-journey` | 1 | red by design: 1 failed (step 2.5, expected 10 items, received 9), 4 passed |
| **E2E, closing run** | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/171-e2e/171-03-close --no-db-reset` | **0** | **171 expected, 0 unexpected, 0 flaky, 0 skipped, 0 tests without a result**; 268 s; one preflight success, no preflight failure; head `77ca76ae5`, tree clean |

Closing run directory: `tests/e2e-runs/171-e2e/171-03-close`. In it the journey's step 2.5 passed on the unedited spec, so the logged-out menu still shows ten items with "Registration" third. `git diff 7c2e23de7..77ca76ae5 -- tests` is empty: no spec, fixture or setup was edited. No run was repeated to see whether it passes.

## The Red Runs

Records: `evidence/171-03-task1-red.json` and `evidence/171-03-task3-red.json`, both classified `RED_EVIDENCE_OK` by `gsd-tools check tdd-red-evidence`.

| Task | Red run | Target | Why it failed |
|---|---|---|---|
| 1 | 16 of 327 cases fail: the seven per-locale name cases and the English literal-terms case on the leaf value, the eight helper cases on a skeleton | `contestant app names — en > holds exactly the three names, each a non-empty string` | `expected 'Election Compass for Candidates' to be type of 'object'` |
| 3 | 12 of 17 cases fail: eight load cases on a load that does nothing, four leg-decision cases on a skeleton | `redirects to the login route whatever the request carries` | `expected undefined to be '/contestant/login'` |

**Green in Task 3's red run, by design:** the four invitation-leg cases and the organizations-only case. Each states that the load resolves, which a load that does nothing also does. They guard the implementation against refusing the invitation leg.

Task 1 is one commit, so its skeleton was never committed. Task 3's `test` commit carries a load that does nothing and a leg decision that throws and that nothing calls; the routes behave as before at that commit and the frontend typechecks.

The first target chosen for Task 3 was rejected by the classifier as `invalid_record`, because vitest writes a multi-line expected value into the TAP diagnostic block. A case whose assertion compares two scalars was used instead, as plans 01 and 02 did.

## The Guard, in One Place

`routes/contestant/register/+layout.server.ts`, `load({ fetch, locals, route, url })`:

1. `isRegistrationCodeLeg({ isSetPasswordRoute: route.id === '/contestant/register/password', hasRegistrationKey: !!url.searchParams.get('registrationKey') })`. When it is false the load returns at once. No provider is built and no setting is read.
2. Otherwise `createDataProvider({ fetch, client: createSupabaseAnonClient({ fetch }) }).getAppSettings()`, with a `.catch` that logs through `log.error` under the label `[Contestant App register layout]` and returns `{}`.
3. `isRegistrationModeAllowedForAnyType(appSettings, REGISTRATION_MODE.Code)` on the raw answer. When it is false, `redirect(303, buildRoute({ route: 'ContestantAppLogin', locale: locals.currentLocale }))`.

Nothing from the request enters the redirect target. The file imports no Supabase package and reads no `locals.supabase`; it is not on the ESLint allow-list of grandfathered route files, so the adapter-boundary rule holds it like any other route. Neither page's `ssr` setting was changed: the code-entry page keeps `ssr = false`, so its refusal arrives through the client's data request.

## Decisions Made

Nothing in the plan's decisions was decided differently. The calls the plan does not make are the five under `key-decisions` and the deviations below.

## Deviations from Plan

### Directed by the coordinator at the checkpoint

**1. The base dataset's declaration moved from 171-04 Task 1 into this plan**
- **Why:** the navigation gate would otherwise turn `contestant-journey` red, and with it the perm chain, from Task 3's commit until plan 04's seed task. The E2E hard rule forbids a red suite between plans.
- **What:** `BASE_APP_SETTINGS.contestantApp` in `packages/dev-seed/src/templates/e2e/base.ts` now states the whole root: `questions: { hideHero: false, hideVideo: false }`, `entityTypes: ['candidate']`, `registrationModes: { candidate: ['email', 'code'], organization: [] }`. Plain arrays under `satisfies Json`, no `as const`, no literal `undefined`, both rows stated, canonical order. `base-app-settings.test.ts` gained one pin of the root's three members by `toEqual`; its top-level key list is unchanged.
- **Not touched:** `MINIMAL_BASE_APP_SETTINGS`, the `default` template, every perm template, the bank-auth override, `seed.sql`.
- **Evidence:** the probe run `tests/e2e-runs/171-e2e/171-03-probe-nav-gate-uncommitted` (expected 10, received 9) before the declaration; the closing run (step 2.5 green, unedited spec) after it.
- **Committed in:** `38c2a2f1a`, with its own red run first: the new pin failed on `expected { Object (questions) } to deeply equal …`.

### Provided for by the plan

**2. The app-name search gate gained one exemption entry (the plan's deviation 8)**
- **Found during:** Task 1. The gate reported `apps/frontend/src/lib/i18n/tests/translations.test.ts`, where the English name is pinned as a literal. Catalogue values are outside the phrase pattern's path scope and were never reported.
- **The line added to `EXEMPT` in `scripts/assert-no-candidate-app-names.mjs`, verbatim:**

  ```js
  /(?<=['"])(?:Candidate app|Party app|Candidate and party app)(?=['"])/g // the three shown names of the app, as whole quoted strings — see phase 171
  ```

- **The declared exemption list is now three entries:** the two names owed to Phases 173 and 174 (`get_candidate_user_data`, `invite-candidate`), and the three shown names as whole quoted strings. The header comment and the list's own comment, which both said "exactly two", say three.
- **Fixture:** one negative line (the three names as quoted literals, not reported) and one positive line (a quoted name beside the bare phrase, still reported), and one line in the expected-findings file. Two fixture comments that said "the two exempt names" say "the exempt names".
- **No product string was renamed and the gate was not loosened otherwise.** The phrase outside a whole quoted name is still a finding, in any file.
- **Committed in:** `13d211873`.

### Acceptance criteria that did not hold as written

- **Task 2's verify link `git grep -q -F "contestantAppName:" -- apps/frontend/src/routes` exits 1.** The five calls pass the parameter in shorthand, `{ contestantAppName }`, because the derived value carries the parameter's name. `git grep -F "{ contestantAppName }"` finds all five, and the task's population command shows no bare call. The frontend has no longhand of this form anywhere; it was not written to satisfy the grep.
- **"Add one test that loops the seven locales" (Task 1).** The name test is a `describe.each` over the seven locales plus one English-literals test. The assertions are the ones the plan lists.
- **The run is judged from `results.json`, not from a `summary.json`.** The wrapper's run directory holds no file of that name. The verdict above is the `stats` object of `results.json` together with a walk of every test in it: 171 tests, every one `expected`, none without a result.

Every other criterion holds as written.

### Departures in procedure

- **Two E2E runs beyond the closing one:** the full suite after Task 2, on the tree where the plan stopped, and the one-project probe on an uncommitted edit, which was red by design.
- **More load cases than the behaviour list.** Beside the seven behaviours: an empty `registrationKey=` reads as no key; the invitation leg is served when the read would fail; settings that declare nothing redirect; organizations-only with `code` is served; the redirect target ignores `redirectTo` and `next`; the provider is built on the anonymous client and the request's `fetch`.
- **One more helper case:** the code-entry page reached with a registration key.
- **The login page's docblock** also names `contestantApp.entityTypes`, which decides the heading and which rows count.
- **The todo** carries `severity` and `source` in its frontmatter and a short list of points for the reviewer.
- **The help page's context comment and the forgot-password page's context read were restated** to the form the rule requires; the forgot-password page now keeps its context object.
- **Polling.** A standalone `sleep` is blocked in this harness; each wait was a bounded loop on a marker file.

---

**Total deviations:** 1 directed by the coordinator, 1 provided for by the plan, plus the notes above.
**Impact on plan:** the base dataset is declared one plan early. Nothing else changes behaviour beyond what the plan specifies.

## Prohibitions, Each Checked

| Prohibition | Evidence |
|---|---|
| PROH-171-08: no "provider is configured" flag, no start-up check | The diff adds no server-computed flag and touches no start-up file; the guard and both screens read the setting alone |
| PROH-171-09: the guard never refuses the set-password page without a registration key | `isRegistrationCodeLeg` case 4; the four invitation-leg load cases, each asserting that `getAppSettings` is not called; both invitation E2E journeys green |
| PROH-171-10: no reader concatenates entity words | every reader calls `getContestantAppName`; `git grep -F "contestantApp.entityTypes" -- apps/frontend/src/routes apps/frontend/src/lib/dynamic-components` finds only the login page's docblock line |
| PROH-171-11: no route server file under the registration trees touches Supabase | `grep -n -F -e "@supabase/" -e "locals.supabase"` on both guards prints no line; `assert:no-session-in-loads` and the adapter-boundary lint rule green |

## Changes for the Operator's Eye

- **The login heading now reads "Candidate app"** (or the locale's `candidate` name) on every project that serves candidates only, where it read "Election Compass for Candidates". The same name is the pre-heading on three more pages and the end of the help page's mail subject.
- **A translation override stored at the old key `dynamic.contestantAppName` is no longer read by anything.** The three keys under it are what to override. Nothing is deployed.
- **With the shipped defaults a project shows no registration entry at all**: no code link, no pre-registration button, no registration item in the menu, and `/contestant/register` redirects to the login page. A project has to declare a mode to offer it. An invitation still lands.
- **A project that allows only `email`** shows no registration entry until Phase 178, because no entry exists for that mode yet (the plan's deviation 6).
- **The wording in six locales is constructed and unreviewed.** See the pending todo.
- **`yarn.lock` and every `package.json` are unchanged.** No package was installed.
- **`CAND-APP-PLAN.md` was not edited, moved, staged or committed.** `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged.
- **The stack was neither restarted nor reset.** Nothing listens on 5173 or 5273. The Vite server on 5199 and `my-redis` were left alone.

## Deferred Issues

None fixed, all outside this plan:

1. `node_modules/.bin/eslint scripts/assert-no-candidate-app-names.mjs` reports 13 errors (function style, regex escapes, `console.log`), all on lines this plan did not write. `scripts/` is not in the scope of `lint:check`. They predate the plan.
2. The comment above `contestantCtx` on the password-reset page tells how the destructure came to be changed. This plan did not touch that comment.
3. The login page's link to the code-entry page is not hidden when answers are locked, while the navigation's item is. That asymmetry predates the plan; Phase 178 rebuilds the screen.

The cross-phase defect ledger (`.planning/WINDOWS.md`) was not appended to: there is no stub, no skipped test and no verification of this plan that was not run.

## Issues Encountered

None beyond the checkpoint and the deviations above. No gate step was red at any point, and the only red E2E run was the probe that was made to be red.

## Known Stubs

None. The two skeletons of the red runs are replaced by their implementations; `git grep "Not implemented"` in the new modules finds nothing.

## User Setup Required

None - no external service configuration required.

## Next Plan Readiness — What 171-04 Must Know

- **The base dataset is already declared, and its pinned test already updated.** `BASE_APP_SETTINGS.contestantApp` holds exactly the value 171-04 Task 1 specifies for `e2e/base.ts`, and `base-app-settings.test.ts` already has the `toEqual` pin of the root's three members with an unchanged top-level key list. That task covers the remaining templates only: `MINIMAL_BASE_APP_SETTINGS`, `default.ts` and the new `built-in-templates-contestant-app.test.ts`. It must not add the members to `base.ts` a second time, and its "run them red" step will find the base pin green.
- **Compare against:** E2E `tests/e2e-runs/171-e2e/171-03-close` (171 / 171 / 0 skipped, head `77ca76ae5`). Frontend unit: 2140 tests in 135 files. Dev-seed: 902 in 66. App-shared and pgTAP are unchanged from 171-02 (141 in 10; 37 files, 1351 tests).
- **The perm datasets declare nothing yet**, so on every perm project the effective matrix is empty: no code link, no registration item in the menu, and the code-entry page redirects. No perm spec asserts any of those today. The closed-project tests 171-04 adds write their own matrix first, as that plan says.
- **The journey's logged-out menu list is unchanged and green** because the base dataset allows `code`. The three assertions 171-04 adds on the login page (code link visible, pre-registration button hidden, the heading reading the `candidate` name) hold on today's tree: the base row is `['email', 'code']` and the English name is "Candidate app".
- **Test ids are unchanged:** `login-register-link`, `login-preregister`, `login-show`, `register-code`. None is in `testIds.ts` yet.
- **The refusal on the code-entry page arrives through the client's data request** (`ssr = false`), so an E2E assertion waits on the URL. The set-password page with a key gets a real 303.
- **The app-name gate has three exemption entries.** A new literal of a shown name in a spec or a docs page is masked only where it is a whole quoted string; the phrase in running prose outside `apps/frontend/messages/` and outside a `publishers-guide` directory is still a finding.
- **The bank-auth override and both opt-in bank-auth projects are still unexercised** since 171-01 changed the setup. Their first run is 171-04's closing gate.
- **The docs still describe the old name and the old switch**, as 171-01 and 171-02 recorded. The publishers' page should say that the three name keys are what to override.
- **Stack state:** up and healthy, not restarted, not reset; the database holds what the last E2E run left in its own project.

## Self-Check: PASSED

- Every file under `key-files.created` exists, and every path under `key-files.modified` is in `git diff --name-only 7c2e23de7..77ca76ae5`.
- All five commits (`13d211873`, `5876b2712`, `38c2a2f1a`, `da84ec133`, `77ca76ae5`) are ancestors of HEAD; `git rev-list --count 7c2e23de7..HEAD` was 5 when this file was written.
- The plan gate (frontend unit, frontend check, `lint:check`) and the closing E2E run describe the tree at `77ca76ae5`.
- `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged since the start revision; `CAND-APP-PLAN.md` is untracked and untouched.
