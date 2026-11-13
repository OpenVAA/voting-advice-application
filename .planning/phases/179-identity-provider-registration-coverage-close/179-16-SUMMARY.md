---
phase: 179-identity-provider-registration-coverage-close
plan: 16
subsystem: contestant-app
tags: [oidc, identity-provider, registration, organization, e2e, playwright, a11y]
status: complete

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-07 C's provider panel as a form and the authorize endpoint's matrix check; 179-12 IdentityProviderGate.svelte with CI1's name part; 179-13 identity-callback creating both types; 179-14 the tracer scenario, the new-candidate scan and the teardown of function-created entities; 179-15 the server credential"
provides:
  - "identityProviderEntityTypes(settings) in registrationOffer.ts: the served types whose row allows the provider's mode, candidate first; empty while answers are locked"
  - "listedRegistrationModes lists the provider's mode where any served type allows it"
  - "The authorize endpoint resolves the type through identityProviderEntityTypes (and so refuses every type while answers are locked)"
  - "C's type group: register-entity-types (fieldset), register-entity-type-input (data-entity-type), register-entity-types-error; the three intro keys in use"
  - "E2E: the organization scenario (@reg-idp @org-registration), the other-type scenario (@reg-idp), scan entries identity-provider-gate-new-organization, identity-provider-gate-invalid, identity-provider-gate-email-in-use, contestant-register-identity-provider (state changed), contestant-register-identity-provider-type-required; phone checks of CI1 V2 and of C's type group at 320 and 390 px"
  - "Fixture steps: contestantRegisterPage entityTypesOffered / chooseEntityType / chooseEntityTypeWithKeyboard / expectEntityTypesError (and expectIdentityProviderPanel asserting the group); contestantIdentityProviderGate giveNames / expandNameTranslations / expectNameError / expectEmailInUse; identityProviderFlow setIdentityProviderMatrix / organizationOf / addressAnotherAccountHolds, startIdentityProviderFlow with an entity type, expectOwnEntityHome with an entity type"
affects: [179-17, 179-18, 179-19, 179-21, 179-22, 179-24]

tech-stack:
  added: []
  patterns:
    - "One rule, two readers: what registration lists and which types the provider registers are two functions over the same settings argument, and the authorize endpoint asks the second"
    - "A spec that writes the project's one settings row runs its file in order in one worker (test.describe.configure({ mode: 'default' })), since the suite is fullyParallel"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contestant/utils/registrationOffer.ts
    - apps/frontend/src/lib/contestant/utils/registrationOffer.test.ts
    - apps/frontend/src/routes/contestant/register/+page.svelte
    - apps/frontend/src/routes/contestant/register/page.svelte.test.ts
    - apps/frontend/src/routes/api/oidc/authorize/+server.ts
    - apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts
    - apps/frontend/src/lib/server/contestant/registrationGuard.test.ts
    - apps/frontend/src/routes/contestant/login/page.svelte.test.ts
    - tests/tests/fixtures/contestant/contestantRegisterPage.fixture.ts
    - tests/tests/fixtures/contestant/contestantIdentityProviderGate.fixture.ts
    - tests/tests/fixtures/shared/identityProviderFlow.fixture.ts
    - tests/tests/utils/testIds.ts
    - tests/tests/specs/perm/perm-closed-project.spec.ts
    - tests/tests/specs/contestant/contestant-identity-provider.spec.ts

key-decisions:
  - "identityProviderEntityTypes reads the answers lock as listedRegistrationModes does, so the authorize endpoint, which now asks it, refuses every type while answers are locked"
  - "The type group's description (aria-describedby) names the error only while it is rendered, as RegistrationModeSelector does"
  - "Where the panel asks a type, startIdentityProviderFlow requires the test to name one: the fixture chooses no type by default"
  - "The identity-provider spec runs its tests in order in one worker, so the describe of both types may write the project's settings row in its beforeAll and write it back in its afterAll"
  - "setIdentityProviderMatrix reads the settings row and writes it back whole (replaceAppSettings) with the served types and both rows replaced"

requirements-completed: [REG-06, REG-07]

actuals:
  tokens: 14400
  tasks: 3
  commits: 1
plan_head_before: a71f819c02baa3003f9be5d5bbf62af3c213e73a
plan_head_after: 3f9b1ea933f24835426a89fd41ea4da64f521534

metrics:
  duration: "about 76 min (06:50Z to 08:06Z host clock, 2026-10-22), four full E2E runs included"
  completed: 2026-10-22
---

# Phase 179 Plan 16: A party registers with the identity provider; C asks the type when two are allowed Summary

**The registration screen now lists the identity provider's mode wherever any served entity type allows it, and its panel registers the types `identityProviderEntityTypes` answers: one is named in the panel's sentence and sent without a question; two are asked as a native radio group with nothing chosen on arrival, and Continue with none chosen sends nothing, says so as the group's description and focuses the first type. The authorize endpoint accepts a type only from the same function. In the browser, a party is chosen by keyboard, identified at the mock issuer, named in the default locale on CI1 with its abbreviation, given an address, and found unconfirmed with the typed names; an identity that registered a candidate comes back choosing a party, is asked the party's name alone and meets the profile selection listing both.**

## Task commits

| Task | Commit | What |
|---|---|---|
| 1 + 2 | 3f9b1ea93 | `feat(179-16)`: the widened list, `identityProviderEntityTypes`, the authorize endpoint on it, C's type group, the unit cases, and the E2E fixtures, scenarios, scans and phone checks — one held set, committed after `179-16-held-r3` was green |
| 3 | — | the close run of the committed tree; no file changed |

## What was built

### The one list and the types (`registrationOffer.ts`)

- `listedRegistrationModes` lists `identity_provider` through `isRegistrationModeAllowedForAnyType`, as it lists email and code. The docblock no longer says the provider's mode is asked for candidates only.
- `identityProviderEntityTypes(settings)`: `[]` while answers are locked, else `getServedEntityTypes(settings)` filtered by `isRegistrationModeAllowed(settings, type, identity_provider)`; canonical order candidate, organization. A unit case holds the two functions to one rule: the provider's mode is listed exactly when the types are not empty, over every case of the list's table.

### The authorize endpoint

`resolveEntityType` takes its allowed list from `identityProviderEntityTypes`. A named type must be in it; an absent one is taken only when it holds one. Because the function reads the answers lock, the endpoint now refuses every type with 403 `mode_not_allowed` while answers are locked (unit cases for both types); C lists nothing then, so a user meets it only with a page left open across the lock.

### C's panel (`register/+page.svelte`)

- `providerEntityTypes = $derived(identityProviderEntityTypes(contestantCtx.appSettings))`; `data-entity-types` space-separated; the intro sentence `intro.candidate`, `intro.organization` or `intro.both`.
- With two types: `<fieldset data-testid="register-entity-types">` inside the form, its `<legend>` (`types.legend`, aligned as the panel's sentence), one `<label class="min-h-touch …">` per type around a native radio (`name="entityType"`, `data-testid="register-entity-type-input"`, `data-entity-type`), none checked on arrival. The chosen type is page state bound with `bind:group`, so it survives the panel's removal when another mode is chosen and comes back with the provider's.
- Continue with two types and none chosen: nothing is sent, `ErrorMessage inline role="alert"` (`register-entity-types-error`, `types.required`) appears and the fieldset's `aria-describedby` names it while it is rendered, focus moves to the first radio. Choosing a type clears the error. Continue with a type posts `{ entityType }`; with one type it posts that type.
- No `view-transition-name`, no `<dialog>`, no numeric spacing class; `appSettings` read as `contestantCtx.appSettings` inside `$derived`.

### The E2E

- `contestant-identity-provider.spec.ts`, describe "both entity types registered with the provider", whose `beforeAll` writes the both-types matrix (`setIdentityProviderMatrix(['candidate', 'organization'])`) and whose `afterAll` writes the candidates-only one back:
  - **Scenario 2** (`@reg-idp @org-registration`): "A party" chosen by keyboard → mock issuer → CI1 V2 (`new` / `none` / `name email`), heading focused → name and abbreviation in `en` → a fresh address twice → Continue → G → the party's home (the one organization the account edits) → the organization: `confirmed` false, `name.en` and `short_name.en` as typed.
  - **The other-type scenario** (`@reg-idp`): candidate chosen → CI1 V1 → address → G → candidate home → log out (no dialog: the candidate has no nomination, so its tasks are blocked) → the same identity chooses "A party" → CI1 V6 (`new` / `pending` / `name`) → the name → Continue → the profile selection with a candidate group and an organization group, one card each, the party's card titled with the typed name.
  - **Scans** 7 `identity-provider-gate-new-organization` (V2), 8 `identity-provider-gate-invalid` (V2 after Continue with every field empty; marker the name error, which the step also asserts describes the `en` control and holds focus), 9 `identity-provider-gate-email-in-use` (V1 with an address another account holds; marker `email-entry-email-error`, the step asserting `data-reason="in-use"`, the sentence and focus). Each twin mints its own identity; entry 9's twin also makes its own account holding a fresh address under `identity-provider-`.
  - **Phone**: CI1 V2 with every locale's name and abbreviation field open, at 320 and 390 px, `en`.
  - The file now runs its tests in order in one worker (`test.describe.configure({ mode: 'default' })`; see Deviation 2).
- `perm-closed-project.spec.ts`: the organizations-alone test now expects Register offered, C in its one-type state with the panel naming the party, and the two code screens refused; entry 4 (`contestant-register-identity-provider`, name kept) reaches the two-type group with none chosen (marker `register-entity-types`); entry 5 `contestant-register-identity-provider-type-required` presses Continue and asserts the group's error, description and focus (marker `register-entity-types-error`); phone: C with the group at 320 and 390 px.
- Fixtures: `contestantRegisterPage` (`expectIdentityProviderPanel` asserts the group, its accessible name, the radios' order, labels and unchecked state for two types and its absence for one; `entityTypesOffered`, `chooseEntityType`, `chooseEntityTypeWithKeyboard`, `expectEntityTypesError`); `contestantIdentityProviderGate` (`giveNames`, `expandNameTranslations`, `expectNameError`, `expectEmailInUse`, sentences read from the catalogue); `identityProviderFlow` (`startIdentityProviderFlow(page, { entityType, byKeyboard })`, which throws when the panel asks and no type is named, so the fixture chooses no type by default; `setIdentityProviderMatrix` reading the row and writing it back whole through `replaceAppSettings`; `organizationOf`; `addressAnotherAccountHolds`; `expectOwnEntityHome(page, sub, entityType)`); `testIds.contestant.register` gains the three ids.

## Runs

| Run | Tree | Result | Verdict |
|---|---|---|---|
| `179-unit/179-16-t1-red` (`.log`, `.exit`, `.junit.xml`, `.head`) | Task 1's cases against HEAD a71f819c0 | exit 1: 25 failed, 138 passed (every new list, types, type-group and authorize case; the two changed list rows) — expectation failures and the missing export | red as required |
| `179-unit/179-16-t1-green3` | the three files with the implementation | exit 0, 163 passed | — |
| `179-unit/179-16-t1-frontend-unit` | Task 1 tree | exit 1: 2 failed — `registrationGuard.test.ts` and `login/page.svelte.test.ts` expected the organizations-alone matrix to offer nothing | Deviation 1 |
| `179-unit/179-16-t1-frontend-unit2` | after Deviation 1 | exit 0: 265 files passed, 1 skipped; 6415 tests passed, 32 skipped | — |
| `179-unit/179-16-t2-lint` | the held set | `yarn lint:check` exit 0 | — |
| `179-e2e/179-16-held` | held set at a71f819c0 | **VOID**: wrapper exit 8, `VOID-host-suspend.txt`, a 232 s gap from 07:09:37Z. `pmset -g log`: `Entering Sleep state due to 'Clamshell Sleep' … Using Batt` at 10:09:36 local. Kept, not diagnosed. Its `restore.txt` ends `restore: FAILED` (`port 9443: STILL HELD`; see Items to report) | — |
| `179-e2e/179-16-held-r2` | held set | **red, not void**: 559 passed, 6 failed, 23 did not run (`perm-closed-project` 22 and its setup, cascaded). The six were in `contestant-identity-provider`: the five existing tests failed in the fixture with "the panel asks which entity type to register, and the test named none", and the other-type scenario with "the panel registers candidate, not organization" | diagnosed (Deviation 2), kept |
| `179-e2e/179-16-held-r3` | held set with Deviation 2 | **588/588**, wrapper exit 0, `restore: ok`, not void | plan's form **FAIL** at the slash-less `--dirty-only apps/frontend/src` alone (eight "outside the --dirty-only paths" lines); restated with `apps/frontend/src/`: **PASS**, `contestant-identity-provider` 5 → 15 (`5+10 = 15 holds`), `perm-closed-project` 18 → 22 (`18+4 = 22 holds`), every other project equal to `179-15-close` (`_drivers/179-16-held.verdict-{plan,restated}.log`) |
| `179-e2e/179-16-close` | committed 3f9b1ea93 | **588/588**, driver and wrapper exit 0, `restore: ok`, `sleep_entries_in_window: 0`, on AC | `179-verdict e2e 179-16-close --same-projects-as 179-16-held`: **PASS**, 128 projects, 0 not as expected (read against `179-16-held-r3`) |

Totals: 179-15-close 574 → held 588 (identity-provider +10, closed project +4) → close 588.

Held copies: the 14 held files are kept as `tests/e2e-runs/179-e2e/179-16-held-r3.<path with / as __>.kept`, each byte-identical (`cmp`) to what 3f9b1ea93 committed (the copies taken for the void run are kept as `179-16-held.<…>.kept`).

## Verify blocks (`tests/e2e-runs/179-unit/179-16-t{1,2,3}-verify*.{sh,log,exit,head}`)

- **Task 1** as written: exit **0** (before the commit).
- **Task 2** as written: exit 1 at the held verdict (the slash-less `--dirty-only apps/frontend/src`, carried item 179-06). Restated with `apps/frontend/src/` and `yarn` for `yarn -s`: exit **0** at 3f9b1ea93 (it includes the frontend unit suite and `git diff --quiet HEAD -- apps tests`).
- **Task 3** as written: exit 1 at `yarn -s lint:check` (Yarn 4.18.1: `Unsupported option name ("-s")`, `179-16-yarn-s.log`); the close verdict stage passed. Restated with `yarn lint:check`: exit **0** at 3f9b1ea93.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Tests made false by the widened list] Two unit files not on the plan's list.**
- `apps/frontend/src/lib/server/contestant/registrationGuard.test.ts`: the organizations-alone matrix moved from the redirect table to the table of matrices that offer registration.
- `apps/frontend/src/routes/contestant/login/page.svelte.test.ts`: "offers no Register where the identity provider's mode is allowed for organizations alone" became "offers Register …", asserting the link to the registration route.
- Both are the plan's own change seen from the guard and from A; committed in 3f9b1ea93.

**2. [Rule 1 - Bug] The describe's matrix reached the file's other tests (red run `179-16-held-r2`).**
- **Found during:** the held run. The suite is `fullyParallel: true` with six workers, so the identity-provider spec's tests ran side by side: the describe's `beforeAll` wrote the both-types matrix while the tracer, the two failure tests and the new-candidate scan twins ran in other workers (their fixture step refused to choose a type for them), and one worker's `afterAll` wrote the candidates-only matrix back while the other-type scenario was still running in another. Observed from the six error messages and their start times (all at 07:28:16Z on six workers); the fix was then re-tested in the full run `179-16-held-r3`.
- **Fix:** `test.describe.configure({ mode: 'default' })` at the top of the spec, so the file's tests run in order in one worker and the describe's hooks bracket its own tests only; the docblock says why. This is a spec-body change the plan did not foresee. The plan's shape (a describe whose `beforeAll` allows both types) is kept. The project's 15 tests now take about a minute of serial time at the tail of the perm chain (the full run took 14.9 and 16.2 minutes).

**3. [Rule 3 - Recurring] `yarn -s`** refused by Yarn 4.18.1, and the slash-less `--dirty-only` (carried item 179-06); both forms of each verify block are kept.

**Files touched that the plan did not list:** `apps/frontend/src/lib/server/contestant/registrationGuard.test.ts`, `apps/frontend/src/routes/contestant/login/page.svelte.test.ts` (Deviation 1).

## Statements observed and inferred

- **Observed:** every count, exit status and verdict above; that a party registered through the provider is unconfirmed and holds the typed name and abbreviation under `en`; that an identity with a candidate and a pending address, choosing a party, is shown CI1 with `data-asks="name"` and `data-address-state="pending"`, and after the name the profile selection with both entities; that **CI1's `in-use` arm is served** (scan 9's twins: the endpoint answered `in-use`, the view showed the sentence at the field with `data-reason="in-use"` and focus there; 179-14 left this inferred); that the name error describes the default-locale control and takes focus; the type group's error, description and focus in a real browser (entry 5's twins).
- **Inferred, not observed:** that the authorize endpoint's refusal under the answers lock is reached by a user (unit-tested only; C lists nothing then); that the arrival marker was cleared by CI1's save in the other-type scenario (with `created` it adds no gate either way); that the candidate created by the function has no nomination, which is why its home logs out without a dialog (the step asserts the direct logout and passed).

## Code review checklist (`.agents/code-review-checklist.md`)

- **Solves the issue:** REG-06 (the type is asked exactly when two are allowed, named when one) and REG-07 (a party registered with the identity provider is named on CI1 and waits unconfirmed) hold end to end; E2E-02's organization registration is tagged `@org-registration`. `requirements-completed: [REG-06, REG-07]`.
- **OWASP / threat register:** T-179-161 (the scenario asserts `confirmed` false); T-179-162 / PROH-179-25 (no type chosen on arrival — unit case and the scan of entry 4; Continue with none sends nothing — unit case and entry 5; nothing a user can choose escapes the matrix: the authorize endpoint accepts only `identityProviderEntityTypes`' list, the callback and the function re-check); T-179-163 (names are written by 179-11's endpoint to the identity's own recorded, unconfirmed organization only — unchanged here); T-179-164 (the other-type scenario shows the second entity is of the other type, and the profile selection lists one of each).
- **`any`:** none added. The fixture's `findData` rows are narrowed by `String(...)` and a typed cast of `name` / `short_name`.
- **Repetition:** the type resolution now lives in `identityProviderEntityTypes`, read by C and the authorize endpoint; the OIDC callback still filters `getServedEntityTypes` itself (see Items to report). `readEnglishMessages` is repeated in a third fixture (the register fixture and others carry the same five lines).
- **Documentation:** TSDoc on `identityProviderEntityTypes`, the rewritten list docblock, the endpoint header, the page's `@component` docblock, every new fixture step and the spec docblocks. The registration guide's sentence on the provider's mode is false now (Items to report).
- **Tracking:** no new user-facing function; the type group is part of C's existing start.
- **Svelte guidelines / context rule:** the page reads `contestantCtx.appSettings` inside `$derived`; nothing reactive destructured; no new component (the group is the page's markup, mirroring `RegistrationModeSelector`).
- **Errors:** a missing type is a field error with focus; the endpoint's refusals keep their closed codes.
- **Shared dependencies:** the guard, A's Register and the menu change only through the widened list; the two unit files that pinned the old behaviour are updated, and the full suite is green twice at 588.
- **WCAG / keyboard:** native radios in a `fieldset` named by its `legend`, one tab stop, arrow keys (scenario 2 chooses by keyboard and asserts focus stays on the radio), 44 px rows, the error as the group's description; entries 4, 5, 7, 8, 9 pass axe in both themes; no overflow at 320 and 390 px for C with the group and CI1 V2 with three locales per name.
- **Comment hygiene:** `assert:comment-hygiene` exit 0 before the commit; no ids or history in touched comments.
- **Commits:** one code commit, linear; no `[db]` change.

## Components skill re-check

No component was added, removed or moved: the type group is markup of `register/+page.svelte`, which is a route, not one of the three libraries. `SKILL.md` and `context-reactivity.md` make no claim this plan invalidated; `generate:docs` was not needed (no `@component` docstring of a library component changed).

## Carried items

- **(179-07) "Authorize endpoint does not check the answers lock"** — settled for the authorize endpoint: it now refuses every type while answers are locked, through `identityProviderEntityTypes`. The callback still does not read the lock (below).
- **(179-11 / 179-14) "the endpoint's `in-use` arm behaves as unit-tested when served"** — now observed (scan 9).

## Items to report rather than edit

- **`apps/docs/src/routes/(content)/developers-guide/contestant-app/registration/+page.md`** line 29: "`identity_provider` is listed when it is allowed for candidates, because registering through the provider creates a candidate." is false now; it is listed when any served type allows it, and the panel asks the type when two do. 179-22 lists that guide.
- **The OIDC callback's type resolution** (`apps/frontend/src/routes/api/oidc/callback/+server.ts`) still filters `getServedEntityTypes` by `isRegistrationModeAllowed` itself instead of asking `identityProviderEntityTypes`, and reads no answers lock. The two differ only while answers are locked, when the authorize endpoint has already refused; a shared resolution is a code-review item (carried since 179-07/14).
- **Harness gap after a void run:** when the wrapper ended `179-16-held` as void, the mock OIDC issuer Playwright had spawned (`npm exec tsx …/mockOidcIssuerEntry.ts`, parent pid 1) kept listening on 127.0.0.1:9443, so the restore check wrote `port 9443: STILL HELD` and `restore: FAILED` (the run still exited 8, void). I stopped that process (this run's own, 14 minutes old) before `-r2`; the next restores were `ok`. The wrapper's void teardown does not reach the webServer's children. Operator / harness fix.
- **`179-CARRIED-ITEMS.md`** carried an uncommitted one-line change during this plan that is not mine; it was left untouched and is not in any commit of this plan.
- **CLAUDE.md** (no-edit): no sentence made false by this plan that I found.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register.

## Self-Check: PASSED

- Commit 3f9b1ea93 is an ancestor of HEAD; `git rev-list --count a71f819c0..HEAD` = 1 before this summary's commit.
- `tests/e2e-runs/179-e2e/179-16-held-r3/results.json` and `179-16-close/restore.txt` (`restore: ok`) exist; `179-16-close`'s verdict log is `_drivers/179-16-close.verdict.log` (PASS).
- `git status` shows no change outside `.planning/` other than the operator's `CAND-APP-PLAN.md`.
- STATE.md, ROADMAP.md, REQUIREMENTS.md, CONTEXT, RESEARCH, PATTERNS, UI-SPEC and CLAUDE.md were not touched.
