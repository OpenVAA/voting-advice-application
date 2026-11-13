---
phase: 179-identity-provider-registration-coverage-close
plan: 21
subsystem: contestant-app
tags: [reg-14, deletion, oidc, identity-provider, catalogue, cookies, e2e]
status: complete

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-06 CI2, the catalogue writer and the identity-provider namespace; 179-07 the authorize endpoint; 179-14 the creating callback and the gate, which made the legacy chain unreachable; 179-15 the server secret, which the legacy route never sent"
provides:
  - "The legacy pre-registration chain is gone from the frontend and the suite: 25 tracked files deleted through one pathspec list, and the writer methods, context members, ID-token cookie, route keys, pageview entries and lint allowlist entry that reached it"
  - "179-catalogue-removals.json and the writer's --list option, with `remove` and `removeNamespace` sections and a --check that refuses while a removed key or namespace is still named"
  - "The contestantApp.preregister namespace (37 keys) and contestantApp.error.registrationLocked are in no catalogue; TranslationKey holds 742 keys"
  - "No preregister address resolves: /contestant/preregister, /contestant/preregister/status, /api/contestant/preregister (GET and POST) and /api/oidc/token answer 404, as an unknown path does"
  - "The dev-seed template perm-bankauth-notloc and its registry entry are deleted"
affects: [179-22, 179-23, 179-24]

tech-stack:
  added: []
  patterns:
    - "Every whole-file deletion goes through one tracked pathspec list (179-deletion-set.txt) and one `git rm --pathspec-from-file`"
    - "A catalogue removal goes through the phase's catalogue writer, with its own list file and a --check that refuses while anything removed is still named"

key-files:
  created:
    - .planning/phases/179-identity-provider-registration-coverage-close/179-deletion-set.txt
    - .planning/phases/179-identity-provider-registration-coverage-close/179-catalogue-removals.json
  modified:
    - .planning/phases/179-identity-provider-registration-coverage-close/179-apply-catalogue.mjs
    - apps/frontend/src/lib/api/base/dataWriter.type.ts
    - apps/frontend/src/lib/api/base/universalDataWriter.ts
    - apps/frontend/src/lib/api/base/universalApiRoutes.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts
    - apps/frontend/src/lib/cookies/index.ts
    - apps/frontend/src/lib/routes/route.ts
    - apps/frontend/src/lib/analytics/pageviewRoutes.ts
    - apps/frontend/eslint.config.mjs
    - apps/frontend/project.inlang/settings.json
    - apps/frontend/src/lib/types/generated/translationKey.ts
    - apps/frontend/messages/*/contestantApp.error.json
    - apps/frontend/src/routes/README.md
    - apps/frontend/src/routes/contestant/README.md
    - tests/tests/utils/testIds.ts
    - tests/tests/utils/privacyAllowlists.ts
    - tests/tests/specs/perm/perm-closed-project.spec.ts
    - packages/dev-seed/src/templates/index.ts
  deleted:
    - "apps/frontend/src/routes/contestant/preregister/ (9 files)"
    - "apps/frontend/src/routes/api/contestant/preregister/ (2 files)"
    - apps/frontend/src/routes/api/oidc/token/+server.ts
    - apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts
    - apps/frontend/src/lib/contestant/utils/preregistrationError.ts
    - "apps/frontend/src/lib/contestant/components/preregisteredNotification/ (3 files)"
    - "apps/frontend/messages/*/contestantApp.preregister.json (7 files)"
    - tests/tests/fixtures/contestant/contestantPreregisterPage.fixture.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts

key-decisions:
  - "The concurrency test's #fetch vector now drives abortAllJobs(): one same-origin POST through the inherited fetch, the shape clearIdToken had"
  - "The callback test's 'no id_token cookie' check became 'no cookie the route set holds the ID token as its value', so it asserts the property without naming the deleted cookie"
  - "The boundary guard's 'de-allowlisted route' case now lints the identity-provider registration endpoint, a real API route off the allowlist, so it still fires and still lints a real file"
  - "TermsOfUseForm keeps its section attributes: the gate is its one consumer, and the pass-through is the component library's convention, not something carried for the deleted page"
  - "No E2E test was removed; the closed-project and entry-scan specs lost legacy steps inside existing tests, so the held run needed no --except"

requirements-completed: []

estimate:
  tokens: 100000
actuals:
  tokens: 60337
  tasks: 3
  commits: 1
plan_head_before: c5a5a10bf0f44b94fd5fce85e94129f18242fd5f
plan_head_after: c5d7da8fe48cf53e52004bfbde0aabdfb60a39a1

metrics:
  duration: "about 48 min (11:48Z to 12:37Z host clock, 2026-10-22), two full E2E runs included"
  completed: 2026-10-22
---

# Phase 179 Plan 21: The legacy pre-registration chain is removed Summary

**The `preregister/` chain is gone from the application and its suite, in one commit. The routes, API route, token endpoint, notification, error module, writer methods, context members, ID-token cookie, route keys, pageview entries, catalogue namespace and the one legacy error key are deleted, and every pin of them in the unit and E2E suites goes with them. `register/` is the one registration tree. A visit to any old `preregister` address answers 404, as an unknown path does. Both full runs were green at 613/613.**

`requirements-completed` is empty. REG-14 completes at 179-22, with its check.

## Task commits

| Task | Commit | What |
|---|---|---|
| 1–3 | c5d7da8fe | `refactor(179-21)`: the whole plan as one held set (84 files: 26 deleted, 58 modified). Committed after `179-21-held` was green, as the plan says |

## The inventory, derived at execution

`git grep -l -i preregist -- apps packages tests scripts` at c5a5a10bf: **65 files** (the planning day's census counted 78). By disposition:

- **Deleted through `179-deletion-set.txt` (25 tracked files, the planning day's 25):**
  - the nine route files under `contestant/preregister/`
  - `api/contestant/preregister/{+server.ts, preregisterUpstreamStatus.test.ts}`
  - `api/oidc/token/+server.ts` and `token-endpoint.test.ts`
  - `preregistrationError.ts` and the three `preregisteredNotification/` files
  - `contestantApp.preregister.json` ×7
  - `contestantPreregisterPage.fixture.ts`
- **Edited in the frontend:** `eslint.config.mjs`, `project.inlang/settings.json`, the boundary guard test, `pageviewRoutes.ts`, `dataWriter.type.ts`, `universalApiRoutes.ts`, `universalDataWriter.ts`, `dataProvider.ts`, `authorize-fail-closed.test.ts`, the components README, the context and its type, `contestantUserDataState.svelte.test.ts`, `route.ts`, `anon.ts`, `universal.ts`, `translationKey.ts`, `constants.ts`, the two layout server loads, the two route READMEs, and the login and register page tests.
- **Edited in the suite:** `contestant-a11y.spec.ts`, `contestant-entry-scan.spec.ts`, `perm-closed-project.spec.ts`, `privacyAllowlists.ts` and its test, `testIds.ts`.
- **Kept, by the research's rulings:**
  - `storedSettings.schema.test.ts`: a stored `preRegistration` key is rejected.
  - `scripts/assert-no-candidate-app-names.mjs` and its fixtures: another gate's vocabulary.
- **Left for 179-22** (the plan gives it the docs, the test tree's prose and the runbook):
  - `apps/docs/**`: nine pages
  - `tests/IDURA-TEST-RUNBOOK.md`
  - `tests/README.md` line 320, found by `pre-registration`

After the commit, `git grep -i preregist -- apps packages tests scripts ':!apps/docs'` names only the kept files and `tests/IDURA-TEST-RUNBOOK.md`. Under `tests/tests` the stem appears nowhere.

The `idToken` / `id_token` search also hits the provider modules' `getIdTokenClaims`, `IdTokenClaimsResult`, `decryptAndVerifyIdToken` and the function contract's `id_token` body field. Those name the token, not the cookie, and stay. Every pin of the **cookie** is gone:
- `COOKIE.idToken` and the cookie module's exact-names pin
- the admin layout test's registry pin
- the root layout test's planted cookie, now `oidc_state`
- `admin-access.spec.ts`'s httpOnly copy
- the privacy allowlist and its test
- the callback test's check

## Each removed key, searched (UI-SPEC § *Messages removed*)

- **The 37 keys of `contestantApp.preregister`** (listed from HEAD's `en` file):
  - Full key, over `apps packages tests scripts` minus the generated type: **0 readers** for each of the 37.
  - The namespace prefix `contestantApp.preregister`: one hit, the inlang settings line, now removed.
  - Last segments:
    - The distinctive ones (`constituencySelect`, `electionSelect`, `emailVerification`, `identifyYourselfButton`, `identifyYourselHelpText`, `passwordSelect`) and the distinctive intermediate segments (`candidateExistsError`, `loggedInError`, `strongIdentificationError`, `tokenExpiredError`, `isPreregisteredNotification`): **0 hits** each in `apps/frontend/src`, `tests/tests` and `packages`.
    - The generic ones (`content` 268 files, `title` 239, `text` 529, `html` 44, `subject` 65, `heroEmoji` 35, `identification` 8) have no reader through the namespace. A dynamic construction would need the prefix, and the prefix has none. The 8 `identification` hits are prose and the generated type.
- **`contestantApp.error.registrationLocked`:** the full key and the last segment `registrationLocked` are found only in the seven catalogues. Its one reader, the legacy layout, is deleted.

No reader outside the deleted files: no halt.

**Catalogue counts (carried item 2):**

| Measure | Before (c5a5a10bf) | After (c5d7da8fe) |
|---|---|---|
| `TranslationKey` union entries | 780 | **742** (−38 = 37 + 1) |
| Leaf strings per locale, all catalogue files | 892 | **854**, in each of `da en et fi fr lb sv` |
| Message files per locale | 52 | 51 |

UI-SPEC's "744 → 742" agrees with the 742 measured for `TranslationKey`.

## What was built

### Task 1: the deletions (D-18)

- **One pathspec list.** `179-deletion-set.txt` has 8 lines.
  - Before the removal it matched 25 tracked files, each one the inventory names. No inventory file was missing from it.
  - `git rm -r -q --pathspec-from-file=…` removed all 25 at once. Afterwards the list matches nothing.
- **The writer.**
  - `exchangeCodeForIdToken`, `preregisterWithIdToken` and `clearIdToken` are removed from `DataWriter` and `UniversalDataWriter`. No private method stood behind them.
  - `UNIVERSAL_API_ROUTES.preregister` and `.token` are removed.
  - `dataWriter.ts`'s docblock now names `logout` and the job methods as the users of the request-scoped fetch.
- **The context.**
  - Members removed: `preregister`, `preregistrationElectionIds`, `preregistrationConstituencyIds`, `preregistrationElections`, `preregistrationNominations`, `isPreregistered`, `idTokenClaims`, `exchangeCodeForIdToken` and `clearIdToken`.
  - Also removed: their private fields and their three storage keys (`contestantContext-isPreregistered` in localStorage, and `contestantContext-preselected{Election,Constituency}Ids` in sessionStorage).
  - The imports that only they used are dropped.
- **The cookie, the routes and the guards.**
  - `COOKIE.idToken` is removed.
  - The five route keys `ContestantAppPreregister{,Election,Constituency,Email,Status}` and the five pageview entries are removed.
  - The lint allowlist loses `src/routes/api/contestant/preregister/+server.ts`. Its group comment now counts six sites.
  - The boundary guard's case for an off-list route now lints `routes/api/contestant/identity-provider/+server.ts`.
- **Tests that named a removed piece now assert what the code does:**
  - **Callback:** no cookie the route set holds the token.
  - **Login:** no link leads to the forgot-password page. The preregister half is gone.
  - **Register:** the case "never opens the pre-registration start" is removed. The case above it already asserts `goto` is not called.
  - **Concurrency:** the case now runs `abortAllJobs()`.
  - **User-data store:** the "key outside the stem" is now `appContext-userPreferences`.
  - **Translations:** each locale has 51 message files.
- **The components README** loses the notification's row.

### Task 2: the catalogues, the comments and the READMEs

- **`179-apply-catalogue.mjs` gains `--list <file>`:**
  - `remove` deletes each key from every locale file that holds it, keeps the order and prunes emptied parents. It refuses a key that no locale holds.
  - `removeNamespace` deletes the settings line, line by line, and refuses while any of the namespace's files exists.
  - `--check` passes only when no removed key is in any locale and the settings name no removed namespace.
  - The plain additions `--check` still passes (36 added keys, 1 reworded).
- **The run:**
  1. `--check` before the write: exit 1. It named the key in all seven locales and the settings line.
  2. The write changed 8 files.
  3. Prettier ran on those files.
  4. `--check`: exit 0.
  5. `generate:translation-key-type` removed 38 lines.
- **Comments rewritten to describe the code as it is:**
  - `anon.ts` and `dataProvider.ts`: the anonymous client's callers are now the registration guard, the authorize and callback endpoints, and CI2's load.
  - `universal.ts` and the root and located layout loads list the real httpOnly cookies: `oidc_state`, `oidc_nonce`, `oidc_code_verifier`, `oidc_entity_type`, `identity_provider_arrival`.
  - `constants.ts`: the provider keyword has two callers.
  - `cookies/index.ts`: two paragraphs that told the module's history, and one that named the deleted client-side cookie write.
  - `oidcFailure.ts` and `decryptAndVerifyIdToken.ts`: one route logs.
  - `authorize-fail-closed.test.ts`: the relative-url defect now runs through the registration page.
- **The READMEs:**
  - `routes/README.md` lists the API tree as it is.
  - `routes/contestant/README.md`:
    - drops `preregister` from the pages that need no session
    - describes the identity provider's option on `register`
    - adds the CI2 row (`register/identity-provider/error`, `ContestantAppIdentityProviderError`)
    - adds a paragraph on the identity provider's flow
    - says the first seven rows are `entryRoutes`, as `appGates.ts` lists them

### Task 3: the suite

- **Ids and allowlists:**
  - `testIds.contestant.preregister` is removed, with its 13 ids. The selector ids it shared still live under the election selector's own block.
  - The privacy allowlist loses the three storage keys and `id_token`, and so does its test.
- **Spec steps removed inside existing tests:**
  - `perm-closed-project`: the three `PREREGISTER_ROUTE` steps.
  - `contestant-entry-scan`: the menu's preregister assertion.
- **Docblocks:** the a11y spec's route list now names `register/identity-provider/error` instead of the legacy steps. The entry-scan docblock is updated to match.
- **Carried item 1, the template:**
  - `perm-bankauth-notloc.ts`, its registry entry and its export are deleted.
  - No test lists it. A search over the tree minus `.planning` and `apps/docs` found only the registry, its own file and four comments.
  - The four comments are rewritten: the shape factory's, `perm-not-located-2e2cg`'s, the `identity-provider` template's, and the `playwright.config.ts` prefix-collision message.
  - The factory keeps its `labelToken` parameter, as a general option.
  - `base.setup.ts`'s comment on the `e2e-bankauth-` sweep now names the identity-provider dataset. It no longer names the deleted journey or `PLAYWRIGHT_BANK_AUTH`.

## Runs and gates

| Run / gate | Tree | Result |
|---|---|---|
| `yarn workspace @openvaa/frontend check` | held set | exit 0: 2316 files, 0 errors, 0 warnings (`179-unit/179-21-check`) |
| targeted frontend vitest (43 files) | held set | 1528 passed |
| `yarn lint:check` | held set | exit 0, twice (`179-21-lint`, and `179-21-lint-r2` after the last edits). The warnings are pre-existing: 15 in dev-seed, 1 in `mockOidcIssuerEntry.ts` |
| `yarn test:unit` (root: coverage assert, turbo test:unit including the frontend build, `test:unit:tests`) | held set | exit 0. Frontend: 265 files passed, 1 skipped; 6441 tests passed, 32 skipped. dev-seed: 77 files. `tests/`: 11 files, 208 tests (`179-21-unit`) |
| `yarn build --filter=@openvaa/frontend` | held set | exit 0 (`179-21-build`). The built manifest (`.svelte-kit/output/server/manifest*.js`) names no `preregister` route |
| **`179-e2e/179-21-held`** | held set at c5a5a10bf | **613/613**, wrapper exit 0, `restore: ok`, not void, on AC. `e2e-evidence`: 0 failed, 0 flaky, 0 did not run |
| **`179-e2e/179-21-close`** | committed c5d7da8fe | **613/613**, driver and wrapper exit 0, `restore: ok`, `sleep_entries_in_window: 0`, on AC |

**Verdicts:**
- **Held, as written:** `179-verdict control 179-21-held --full --same-projects-as 179-20-close --dirty-only apps/ --dirty-only tests/ --green` gives **FAIL**. The only cause is the five `packages/dev-seed/…` paths outside the `--dirty-only` list.
- **Held, restated** with `--dirty-only packages/` added: **PASS**. 128 projects compared, 0 not as expected; every project equals 179-20-close (`_drivers/179-21-held.verdict.log`, as-written log beside it).
- **No `--except`:** no E2E test was removed or added.
- **Close:** `179-verdict e2e 179-21-close --same-projects-as 179-21-held` gives **PASS**. 128 projects, 0 not as expected (`_drivers/179-21-close.verdict.log`).

Totals: 179-20-close 613 → held 613 → close 613.

The held copies are kept as `tests/e2e-runs/179-e2e/179-21-held.<path with / as __>.kept`: 58 files, each byte-identical (`cmp`) to what c5d7da8fe committed.

**The not-found page, observed.** While the held run's dev server was up, each legacy address was requested once with curl:
- `/contestant/preregister`, `/contestant/preregister/status`, `/api/contestant/preregister` (GET and POST) and `/api/oidc/token` each answered **404**.
- `/contestant/does-not-exist` and `/nothing-here` answered the same: 404, with the same page.
- `/contestant/register` answered 200.

## Verify blocks (`tests/e2e-runs/179-unit/179-21-t{1,2,3}-verify*`)

Each script is taken byte for byte from the plan's `<automated>` block. Each was run as written first, then restated, and both outcomes are kept.

- **Task 1, as written:** exit **0**, but vacuously.
  - This git (2.50.1) has no `--pathspec-from-file` for `git ls-files`. The command errors, its stdout is empty, and `test -z` passes.
  - Restated with `tr '\n' '\0' < list | xargs -0 git ls-files --`: exit **0**, both on the held set and at c5d7da8fe. Before the removal, the same form listed the 25 files.
- **Task 2, as written:** exit 1 at first, because the removal list was not yet tracked (`--error-unmatch`). After staging the list it is still exit 1, failing at `yarn -s`: Yarn 4.18.1 rejects `-s`.
  - Restated without `-s`: exit **0**, on the held set and at c5d7da8fe.
- **Task 3, as written:** exit 1, at `yarn -s`.
  - Restated without `-s`: exit **0** at c5d7da8fe. It covers both unit suites, `lint:check`, the held run's `results.json`, the close verdict and `git diff --quiet HEAD -- apps tests`.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Blocking] Tests and code outside the plan's list that pinned a removed piece.** Each now asserts what the code does:
- `supabaseAdapter.concurrency.test.ts` drove `clearIdToken()`. It now drives `abortAllJobs()`, and its comment is brought in line.
- `routes/admin/(protected)/layout.server.test.ts` and `routes/layout.server.test.ts` pinned or planted `id_token`.
- `tests/tests/specs/admin/admin-access.spec.ts` has an httpOnly cookie copy. This changes a spec's constant, not its tests.
- `lib/i18n/tests/translations.test.ts` checked the file count, 52 → 51.

**2. [Rule 1 - Stale] Comments made false by the deletions, in files the plan did not list.** Rewritten:
- `lib/api/dataWriter.ts`
- `lib/api/utils/auth/oidcFailure.ts` and `decryptAndVerifyIdToken.ts`
- `packages/dev-seed/src/templates/default.ts`, which said the login screen offers "pre-registration"
- the four template comments, `playwright.config.ts` and `base.setup.ts` (Task 3, carried item 1)

**3. [Rule 3 - Blocking] Verify blocks and verdict paths.**
- **Task 1's `git ls-files --pathspec-from-file`** is unsupported. Restated with `xargs`. As written, it passes vacuously.
- **`yarn -s`** is rejected by Yarn 4.18.1. Restated as `yarn <script> > /dev/null`.
- **The held verdict's `--dirty-only`** lacked `packages/`. Restated with it, because carried item 1 deletes a dev-seed template.

**4. Spec body changes.** The plan names both files. Each is listed here explicitly:
- `perm-closed-project.spec.ts`: three legacy steps are removed from three tests.
  - two `expectRefusedToLogin(page, PREREGISTER_ROUTE)` calls
  - one `goto` plus its visibility assertion of `preregister-start`
- `contestant-entry-scan.spec.ts`: one `expectNoItemLeadsTo(ContestantAppPreregister)`.
- No test was added or removed. The suite's totals per project are unchanged.

**5. [Rule 2 - Correctness] The sessionStorage keys `contestantContext-preselectedElectionIds` and `contestantContext-preselectedConstituencyIds`.** The deleted context fields wrote them. They leave the privacy allowlist, so a reappearance is reported.

**6. Removed unit tests.**
- `token-endpoint.test.ts` (deleted with its route).
- `preregisterUpstreamStatus.test.ts` (deleted with its route).
- One case of `register/page.svelte.test.ts`.
- No E2E test was removed.

**Files touched that the plan did not list:**
- frontend:
  - `lib/api/dataWriter.ts`
  - `lib/api/adapters/supabase/supabaseAdapter.concurrency.test.ts`
  - `lib/api/utils/auth/oidcFailure.ts`
  - `lib/api/utils/auth/decryptAndVerifyIdToken.ts`
  - `lib/i18n/tests/translations.test.ts`
  - `routes/admin/(protected)/layout.server.test.ts`
  - `routes/layout.server.test.ts`
- tests:
  - `tests/tests/specs/admin/admin-access.spec.ts`
  - `tests/tests/setup/shared/base.setup.ts`
- dev-seed:
  - `packages/dev-seed/src/templates/{index.ts, default.ts, e2e/perm/identity-provider.ts, e2e/perm/notLocated2e2cgShape.ts, e2e/perm/perm-not-located-2e2cg.ts}`
  - `packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts` (deleted)

**Listed by the plan but needing no change:** `routes/contestant/register/+page.svelte`. It names no legacy piece.

## Carried items

| Item | Outcome |
|---|---|
| 1 (179-14) `contestantPreregisterPage.fixture.ts`, the preregister route and its stale comment, template `perm-bankauth-notloc` | **Settled.** The fixture and route went in the deletion set. The template, its registry entry and its export are deleted; no test lists it (search above). |
| 2 (179-06) catalogue count | **Measured** (table above): `TranslationKey` 780 → **742**; 854 leaf strings in each of the seven locales. UI-SPEC not edited. |
| 3 (179-06) `sv` `contestantApp.login.title` "Registrera dig"; `sv` `questions.intro.start` lacks `{numQuestions}` | **Open, reported.** This plan's catalogue work touched neither key: only `contestantApp.error.json` and the deleted namespace. Both stay in the native-review todo. |
| 4 (179-15) the legacy route sends no server secret | **Closed.** The route is deleted; the address answers 404. |

## Code review checklist (`.agents/code-review-checklist.md`)

- **Solves the issue:** the flow of screens A–K is the only registration path. No legacy address resolves (observed 404), and no code, catalogue or test names the chain outside the docs and runbook left to 179-22.
- **OWASP:**
  - T-179-211: the dead API route that accepted an ID token, and the token endpoint, are deleted.
  - T-179-212: `COOKIE.idToken` is gone, and `assert:cookie-names` passed in `lint:check`.
- **`any`:** none added.
- **Repetition:** none added. The writer's two new sections reuse its locate and load helpers.
- **Documentation:** TSDoc on the one new test helper (`tokenWasSetInACookie`). The writer's header documents `--list`, `remove` and `removeNamespace`. The two route READMEs and the components README are updated.
- **Docs pages:** 179-22's (listed below).
- **Tracking events:** none; nothing user-facing was added.
- **Svelte components:** none added or changed. The context edits remove members only, and every remaining reactive accessor is read as before.
- **Errors:** no handling path changed in kept code.
- **Shared dependencies:** the frontend build and both unit suites are green. The adapter-boundary, cookie-name, i18n-namespace, comment-hygiene, a11y-scan-wiring and test-keys-scope gates all pass in `lint:check`.
- **WCAG:** no screen changed. The a11y scans are unchanged and green in both runs.
- **Comment hygiene:** `assert:comment-hygiene` passed in `lint:check` before the commit. Every rewritten comment describes the code as it is. Two docblocks I touched one sentence of still carry older planning references in other sentences; they are listed below.
- **Commits:** one `refactor` commit, linear, no `[db]` change.

## Items to report rather than edit

**For 179-22 (docs, the tests' prose, the runbook):** pages and lines this plan made false.
- `apps/docs/…/backend/edge-functions/+page.md`:
  - line 8 says `identity-callback` is called by the `/api/contestant/preregister` server route
  - lines 103 and 111 describe the "preregister route" exchanging the token
- `apps/docs/…/contestant-app/bank-authentication/+page.md` line 14: "Pre-registration is offered…".
- `apps/docs/…/contestant-app/pre-registration-and-invitation/+page.md`:
  - line 214: "it is still the pre-registration tree under …"
  - lines 212 and 224
- `apps/docs/…/frontend/components/generated/+page.md` lines 451 and 453, and the generated page `…/preregisteredNotification/PreregisteredNotification/+page.md`: the component is deleted. Regenerate with `generate:docs`.
- `apps/docs/…/frontend/routing/generated/+page.md` lines 48 and 81: the `preregister/` tree (regenerate).
- `apps/docs/…/frontend/contexts/+page.md` lines 26 and 52: the removed context members.
- `apps/docs/…/frontend/data-api-and-adapters/+page.md`:
  - line 59: the methods that call app routes
  - line 99: `contestant/preregister` among the API routes
- `apps/docs/…/publishers-guide/preparing/candidates-and-parties-data-be/+page.md` lines 33–45: "bank-authentication-based preregistration".
- `tests/README.md` line 320: "the registration page leads to the pre-registration start".
- `tests/IDURA-TEST-RUNBOOK.md` lines 19, 184, 231 and 232: the flow overview and the key-files table name the deleted route files.
- `apps/frontend/src/routes/contestant/README.md` line 5 links to the docs page `pre-registration-and-invitation`. That link stays as long as 179-22 keeps the page's address.

**For 179-24 or a code-review pass:**
- `tests/tests/setup/shared/assertTeardown.ts`'s docblock still names `bank-auth-journey.teardown.ts`, which is deleted (the 179-14 item). This plan settled the `base.setup.ts` half.
- `routes/admin/(protected)/layout.server.test.ts`'s docblock keeps phase ids (`phase 158`, `OB-1`, `D10`) and history. `eslint.config.mjs`'s allowlist comments keep `158-*` labels and "Phase 158". I changed one sentence in each and left the rest.
- **Pre-existing:** `apps/frontend/src/routes/contestant/register/page.svelte.test.ts` fails `prettier --check` at c5a5a10bf, on three lines this plan did not touch. I left them as they were.
- **Pre-existing, observed:** the not-found page's `<title>` reads "500 – Election Compass" while the status is 404. It reads the same for every unknown path.
- `.claude/skills/components/context-reactivity.md` and the spike-findings skill still mention the pre-registration members. The research rules them out of the D-18 scan.

**CLAUDE.md:** no sentence was made false by this plan. It names no preregister route.

## Statements observed and inferred

- **Observed:**
  - The 404 answers, by curl against the held run's server.
  - The built manifest's route list.
  - Both full runs: 613/613, with every project equal to 179-20-close.
  - Each search count in this summary.
  - The writer's `--check` failing before the write and passing after.
  - The kept copies byte-identical to the commit.
- **Inferred:** that the 404 for `/contestant/preregister` is SvelteKit's own not-found and not a hook's answer. The built manifest has no matching route and the page equals that of an invented path, but the hook's path for an unmatched route was not traced.

## Known Stubs

None.

## Threat Flags

None. The plan removes surface and adds none.

## Self-Check: PASSED

- c5d7da8fe is an ancestor of HEAD. `git rev-list --count c5a5a10bf..HEAD` = 1 before this summary's commit.
- `179-deletion-set.txt` and `179-catalogue-removals.json` are tracked. The xargs form of `git ls-files` over the list prints nothing, and no deleted path exists.
- `tests/e2e-runs/179-e2e/179-21-held/results.json` exists, and so does `179-21-close/restore.txt` (`restore: ok`). Both verdict logs end in PASS.
- `git status --short` shows only the operator's `CAND-APP-PLAN.md`.
- STATE.md, ROADMAP.md, REQUIREMENTS.md, CONTEXT, RESEARCH, PATTERNS, UI-SPEC and CLAUDE.md were not touched.
