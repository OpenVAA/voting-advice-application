---
phase: 173-multi-entity-grants-entity-selection
plan: 12
subsystem: testing
tags: [e2e, playwright, contestant-app, entity-selection, fixtures, supabase-admin-client, stored-sessions, drafts]

requires:
  - phase: 173-11
    provides: "`e2e/base` serving both entity types, and the three unconfirmed selection rows no identity edits"
  - phase: 173-10
    provides: the root's three outcomes, the profile selection screen, the "nothing to edit" view and the menu's switch item
  - phase: 173-06
    provides: "the tests-side entity URL helper (`contestantEntityUrl.ts`) and route builder"
  - phase: 173-04
    provides: "drafts keyed by entity (`contestantContext-userData-editedAnswers-<type>-<id>`)"
provides:
  - "`grantEntity`, `revokeEntityGrant`, `entityGrantCountForUser` and `forceRegisterUser` on the E2E admin client, with one code path writing every entity grant"
  - "`registerAndStoreSession` in a plain, importable module, taking a list of entity grants"
  - "three identities (multi, none, logout) and two read-only stored sessions (`MULTI_ENTITY_STORAGE_STATE`, `NO_ENTITY_STORAGE_STATE`)"
  - "Playwright projects `data-setup-entity-selection`, `data-teardown-entity-selection`, `contestant-entity-selection`, the last in the first perm setup's dependencies"
  - "page fixtures for the selection screen and the nothing-to-edit view, entity-group and switch-item members on the nav-menu fixture, and the composition root `contestant-entity-selection.ts`"
  - "the selection-and-switch spec: eight tests in seven groups, green in the default suite (roadmap criterion 5)"
  - the stage-5 harness-and-spec close on one tree (twelve gate rows at 0; 192 of 192 E2E in 103 projects, every pre-existing project at its `173-11-base` total)
affects: [173-13, 174, 175, 176, 177]

actuals:
  tokens: 31174 # chars/4 over the realized diff outside .planning/ (124695 chars, 14 files)
  tasks: 4
  commits: 5
plan_head_before: 34ea841bfe28c68113ec2153d93548cfd39a8532
plan_head_after: 416b1a2f4f811986841e630ee6affc6e99e67d91

tech-stack:
  added: []
  patterns:
    - "a stored session is read-only: a case that signs out registers an identity of its own and signs it in through the login form"
    - "a zero-entity stored session is made by storing the session of a one-grant user and then deleting the grant: the list reads the table, not the token"
    - "state carried between the steps of one test, never between tests: each test starts from the stored session, whose storage holds no draft"
    - "a recorder fixture for native dialogs (`nativeDialogs`) so a spec asserts exactly which dialogs a step raised"
    - "English UI strings a spec asserts are read from the message source, not copied"

key-files:
  created:
    - tests/tests/setup/shared/registerAndStoreSession.ts
    - tests/tests/setup/contestant/entity-selection.setup.ts
    - tests/tests/setup/contestant/entity-selection.teardown.ts
    - tests/tests/fixtures/contestant/contestantEntitySelectionPage.fixture.ts
    - tests/tests/fixtures/contestant/contestantNothingToEditPage.fixture.ts
    - tests/tests/fixtures/contestant/contestant-entity-selection.ts
    - tests/tests/specs/contestant/contestant-entity-selection.spec.ts
  modified:
    - tests/tests/utils/supabaseAdminClient.ts
    - tests/tests/utils/testCredentials.ts
    - tests/tests/setup/shared/auth.setup.ts
    - tests/playwright.config.ts
    - tests/tests/fixtures/shared/navMenu.fixture.ts
    - tests/tests/fixtures/contestant/contestantQuestionPage.fixture.ts
    - tests/README.md
    - .planning/phases/173-multi-entity-grants-entity-selection/173-NAME-MAP.md
    - .planning/phases/173-multi-entity-grants-entity-selection/deferred-items.md

key-decisions:
  - "Every entity grant in the admin client is inserted by one private method that takes a user id; `grantEntity(email, …)` resolves the email and calls it, and `forceRegister`, `forceRegisterUser` and `sendEmail` call it directly, so registration does not depend on a paged user listing."
  - "The base candidate's session path stays declared in `playwright.config.ts`; the spec imports `STORAGE_STATE` from the config, as the visual spec does."
  - "Draft persistence is asserted by three facts that need no locale: the choice the page shows, the draft key in `localStorage`, and the row read with the service role."
  - "The second entity's data after a switch is reached by links inside the application (home, opinions, the question), so the store that held another entity is the one under test."
  - "Focus on the selection's heading is asserted after the switch item, a client-side navigation, and not on the first document load."
  - "The stored no-entity session gets one read-only case of its own, so 173-13 inherits a session a committed test has already shown on the view."

patterns-established:
  - "Close the navigation drawer through its close item (`navMenu.closeNav()`); the Escape key does not close it."
  - "Give a new test identity a candidate no other identity of the run edits; `grantEntity` refuses a candidate with an editor by name."

requirements-completed: []

duration: 30min
completed: 2026-10-06
status: complete
---

# Phase 173 Plan 12: The Multi-Grant Harness and the Selection-and-Switch Spec Summary

**A user holding editor grants on two candidates and an organization now signs in, chooses, switches and saves to the selected entity only in a committed E2E spec, on a harness that can grant any entity to any test identity through one code path; the full suite is green at 192 of 192 with every pre-existing project at its earlier total.**

## Performance

- **Duration:** about 30 min
- **Completed:** 2026-10-06
- **Tasks:** 4
- **Files modified:** 16 (14 outside `.planning/`)

## Accomplishments

- The E2E admin client grants and revokes entity grants by email, type and external id, refuses by name a candidate that already has an editor, and registers a user with any list of grants inside the registration's rollback.
- The session helper left `auth.setup.ts` for a plain module and takes a list of entity grants; the two existing setup tests keep their titles and behaviour.
- A dedicated setup project builds three users on the three selection rows and stores two sessions; its teardown removes the three users.
- The selection-and-switch spec covers roadmap criterion 5 and, as the only browser proof of ruling O-Q5, drafts kept per entity through a reload.
- No product defect was found: every assertion about the product passed the first time it executed. The three failures of the first slice were one wrong assumption in a new fixture method, and the steps behind it in those three tests first executed, and passed, in the second slice.

## Task Commits

1. **Task 1: `grantEntity`, the session helper in a plain module, the three identities** - `36597bc3e` (feat)
2. **Task 2: the setup and teardown, and the three projects with their edges** - `08547a4d1` (feat)
3. **Task 3: the page fixtures and the spec** - `b56f0ae7c` (test)
4. **Task 4: the slice, the gate set and the full suite**
   - `b6897fd31` (fix) the nav-menu fixture's `closeNav`, after the first slice
   - `416b1a2f4` (docs) `## After 173-12` in the name map

**Plan metadata:** the commit that adds this file and the deferred item.

## Helper names

| Role | Name |
|---|---|
| Grant an entity to an existing user | `SupabaseAdminClient.grantEntity(email, { entityType, externalId })`, type `EntityGrantTarget` |
| Its inverse, idempotent | `revokeEntityGrant(email, { entityType, externalId })` |
| A user's entity-grant count | `entityGrantCountForUser(email)` |
| Register a user with a list of grants, or none | `forceRegisterUser(email, password, { entityGrants?, acceptTermsOfUse? })` |
| Unchanged signature | `forceRegister(candidateExternalId, email, password, { acceptTermsOfUse? })` |
| The session helper | `registerAndStoreSession(page, identity)` and `StoredSessionIdentity` in `tests/tests/setup/shared/registerAndStoreSession.ts`; `externalId` optional, `entityGrants` a list |

The free-candidate check is at run time, against the suite's project, in the one private method that inserts an entity grant (`grantEntityToUser`): for a candidate it reads the existing editor through `userIdForCandidate` and throws naming the candidate.

## The project graph as built

```
data-setup-base ──► data-setup-entity-selection ──┐          (teardown: data-teardown-entity-selection, retries 0)
data-setup-base ──► auth-setup ───────────────────┴──► contestant-entity-selection ──► data-setup-perm-1e1cg1co ──► …
```

- `contestant-entity-selection`: `testDir` the contestant specs, `testMatch` the one spec file, Desktop Chrome, `storageState: MULTI_ENTITY_STORAGE_STATE`, `fullyParallel: false`.
- It is named in the dependencies of `data-setup-perm-1e1cg1co`, with the reason in the comment above that list: it asserts UI that depends on the served entity types, and the perm head both replaces the settings row and deletes the `test-` rows.
- `--list --project contestant-entity-selection` names the spec's eight tests under that project and under no other; the whole-suite list names them once.
- `scripts/assert-a11y-scan-wiring.mjs` is unmodified and exits 0.

## The identities and the stored sessions

| Identity | Email | Grants | Stored session | Loaded by |
|---|---|---|---|---|
| multi | `entity-selection-multi@test.openvaa.local` | `test-e2e-base-ca-sel-a`, `test-e2e-base-ca-sel-b`, `test-e2e-base-or-sel` | `MULTI_ENTITY_STORAGE_STATE` (`tests/playwright/.auth/user-multi-entity.json`) | the `contestant-entity-selection` project |
| none | `entity-selection-none@test.openvaa.local` | `test-e2e-base-or-sel` at sign-in, removed once the session is stored | `NO_ENTITY_STORAGE_STATE` (`tests/playwright/.auth/user-no-entity.json`) | one `describe` of the spec |
| logout | `entity-selection-logout@test.openvaa.local` | `test-e2e-base-or-sel` until the spec removes it | none | signed in through the login form |

Both stored sessions are read-only: nothing signs either out. The one case that logs out uses the logout identity under an empty storage state (PROH-173-07). Each identity has the acceptance row, so none stops at the terms-of-use view.

## The spec, group by group

| Group | What it proves |
|---|---|
| 1. Choosing | The root lists three cards in two headed groups, candidates first, A before B, each with its type label and no alert; each card links to its own entity's home; picking A lands on A's home, the selection list is gone, the menu's group title is the catalogue's "{entityType}: {name}" for A, and the switch item is the group's last link and leads to the app root. |
| 2. Never the previous one's | A and B start from the seeded `'3'` and `'5'`. An unsaved answer of A is under A's key in `localStorage`, is shown after a reload while A's row still holds `'3'`; B shows its own answer and has no draft; back on A the edit is still shown; saving raises no dialog, lands on A's overview, sets A's row to `'1'`, leaves B's at `'5'` and empties A's draft. |
| 3. Switching | From A's home the switch item lands on the selection with focus on its heading; the organization's home heading holds its name and the menu names it with its type; after a second switch, B's editor, reached by links alone, shows B's answer. |
| 4. The prompt | With an unsaved edit on A's editor the switch item raises exactly one native `confirm`; dismissed, the editor, the edit and the draft remain; the page's Cancel then discards the draft with no dialog. |
| 5. Refusals | The URL of a candidate the user does not edit, and A's id under `organization`, each land on the selection with a view equal to a plain visit's. |
| 6. One entity | Under the base candidate's session the root is answered by a server redirect to that candidate's home; the selection list is absent and the menu has no switch item. |
| 7. Nothing to edit | An editor of one organization signs in and lands on the organization's home; with the grant removed the root shows the view with the email and the support button; Logout raises no modal and no native dialog and ends on the login page. A second case shows the same view under the stored no-entity session, from the root and from the organization's URL. |

The spec holds no locator, no navigation call, no skip, no retry and no fixed wait of its own, and no soft assertion, so `SOFT_ASSERTION_BUDGETS` is unchanged.

## Gates

| Instrument | Label and directory | Result |
|---|---|---|
| E2E slice | `tests/e2e-runs/173-e2e/173-12-slice` | RED, kept: 16 tests, 13 passed, 3 failed; window 21:31:08 to 21:31:59, no Sleep entry |
| E2E slice | `tests/e2e-runs/173-e2e/173-12-slice-r2` | exit 0: 16 of 16; verdict with `--allow-slice --expect-project contestant-entity-selection --expect-project data-setup-entity-selection` exits 0 |
| Gate set | `tests/e2e-runs/173-gates/173-12-spec` | exit 0: twelve rows, every status 0; verdict exits 0; window 21:33:53 to 21:37:17, `sleep_entries_in_window: 0` |
| Full E2E | `tests/e2e-runs/173-e2e/173-12-spec` | exit 0: total 192, passed 192, failed 0, flaky 0, skipped 0, didNotRun 0; 103 projects; window 21:37:34 to 21:43:22, `sleep_entries_in_window: 0` |

- The E2E verdict in the plan's exact form (`--same-projects-as 173-11-base`, three `--except …=+`, two `--expect-project`) exits 0: 103 projects compared, 0 not as expected. New projects: setup 3 of 3, teardown 1 of 1, spec 8 of 8.
- Expected total stated before the run by `--list`: 192 = 180 + 3 + 1 + 8.
- Both closing instruments record head `b6897fd31`, the last commit outside `.planning/`. All four runs were on battery power under `caffeinate -dimsu`; the host's last Sleep entry is at 20:32:17, before all of them.
- `173-12-slice-r2` is a re-make after a fix, not a re-run after a host sleep. No run of this plan was void.
- From the gate set's logs: frontend unit tests 2546 passed and 7 skipped, dev-seed 1015 in 67 files, pgTAP 38 files and 1447 tests. The tests' utility suite count was not re-read.

## Acceptance criteria as observed

- Task 1: `grantEntity` and `revokeEntityGrant` present; the candidate-has-an-editor check with its message present; `git grep -F "setup("` on the helper module prints nothing (exit 1); each new session path declared once; `yarn typecheck:tests` 0; ESLint 0.
- Task 2: three projects declared; the spec project in the perm head's dependencies; three setup tests with no `if`; the second revokes after the session is stored and confirms a grant count of 0; `yarn assert:a11y-scan-wiring` 0 with the script unmodified; the teardown unregisters all three.
- Task 3: the spec imports `test` from the composition root; its own text holds none of `getByTestId`, `locator(`, `page.goto(`, `test.skip`, `test.fixme`, `retries`; `storageState` appears for the base session, an empty state and the no-entity session; the list command exits 0; ESLint and the name gate 0.
- Task 4: both verdicts exit 0 as above.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The nav-menu fixture's new `closeNav` assumed Escape closes the drawer**
- **Found during:** Task 4, the first slice (`173-12-slice`)
- **Issue:** three cases failed at the same fixture line: the menu was still visible five seconds after Escape. The application has no key handler for it.
- **Fix:** `closeNav` clicks the drawer's close item, the menu's first item, and then asserts the menu hidden. The product is unchanged; the observation is filed as deferred item 4.
- **Files modified:** `tests/tests/fixtures/shared/navMenu.fixture.ts`
- **Commit:** `b6897fd31`

### Departures from the plan's text

**2. `forceRegister` writes its grant through the private `grantEntityToUser`, not through the public `grantEntity`.** The public method resolves the user by email from a paged listing; registration already holds the user id. One method still inserts every entity grant, and `sendEmail`'s invite path was routed through it as well, which the plan did not ask for.

**3. The session helper was not moved unchanged.** It now registers through `forceRegisterUser` with the identity's list of grants. An identity that states a single candidate reaches the same private path as before; the error prefix it would print is `forceRegisterUser`.

**4. Two fixture files outside the plan's list were edited or used.** `contestantQuestionPage.fixture.ts` gained `expectSelectedChoice` and `clickCancel`; the existing `contestantQuestionsOverviewPage` fixture is composed into the spec's `test`.

**5. Focus on the selection's heading is asserted after the switch, not on the first visit.** The plan's Choosing step also asks for it on the first visit, which is a document load; that was neither asserted nor measured.

**6. The "single-entity" group proves "never attached" by the server redirect.** The fixture asserts that the document the browser ended on was reached through a redirect from the app root, then that the list is absent.

**7. The spec holds eight tests, one more than the seven groups:** the stored no-entity session has a read-only case of its own.

**8. The home heading is asserted for the organization only.** A candidate's home greets by name only while something is left to answer; candidates are named through the menu's group title and the URL.

**9. `-r2` on the slice label marks a re-make after a fix.** The run notes ask for a new label after a fix and the verdict resolves `-rN` from the plain label, so the judged slice is `173-12-slice-r2`.

## Deferred Issues

- `deferred-items.md` item 4: the Escape key does not close the navigation drawer. Measured, not judged, product unchanged.
- The two known defects of the terms-of-use view (390px overflow, focus on `<body>` after the gate) were not touched and not tripped: every identity accepts the terms at registration and the spec runs at the project's desktop viewport.

## Known Stubs

None.

## Threat model

| Threat | Disposition as built |
|---|---|
| T-173-46 | `grantEntity` looks the entity up in the client's own project and refuses a candidate with an editor by name before the insert; the index refuses it regardless. The helper is under `tests/`. |
| T-173-47 | The only logout in the spec is the logout identity's, signed in under an empty storage state. The full run shows no did-not-run in the scan or perm families. |
| T-173-48 | The spec saves one answer, of `test-e2e-base-ca-sel-a`, which is unconfirmed. Every voter project is at its `173-11-base` total and green. |
| T-173-49 | The verdict requires both new projects in the run with every test passed, and the list command shows the spec under one project. |

No new network endpoint, auth path or schema surface was added.

## What 173-13 and later phases must know

- **Sessions to reuse for the axe scans:** `MULTI_ENTITY_STORAGE_STATE` (the selection screen at the app root, and the multi-entity menu on an entity home) and `NO_ENTITY_STORAGE_STATE` (the "nothing to edit" view at the app root). Both are written by `data-setup-entity-selection`, so a project that loads either must depend on it; `contestant-a11y-scan` depends on `data-setup-base` and `auth-setup` only today.
- **Order:** a reader of either session belongs before the perm chain. The perm head's pre-clear deletes the three rows, and the teardown that removes the users runs only at the end of the suite.
- **Read-only:** a scan must not sign either session out, and must not save on the multi identity's entities other than what this spec already does to candidate A (its answer to `test-e2e-base-qu-opin-base-1-likert5` is `'1'` after this spec, `'3'` before).
- **Fixtures to reuse:** `createContestantEntitySelectionPage(page).open()` waits for a card, which the scan needs before it reads; `createContestantNothingToEditPage(page).open()`; `navMenu.openMobileNav()`, `expectSwitchEntityItem()` and `closeNav()`.
- **The drawer does not close on Escape** (name-map item 73).
- **Name-map items 73 to 79** hold the rest: the base session path's declaration, how a full navigation treats a draft, when the home heading names the entity, where focus was asserted, and when the teardown runs.

## Self-Check: PASSED
