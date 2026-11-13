---
phase: 179-identity-provider-registration-coverage-close
plan: 20
subsystem: testing
tags: [oidc, identity-provider, registration-matrix, type-cookie, entity-selection, e2e, playwright]
status: complete

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-07 the authorize endpoint and the httpOnly oidc_entity_type cookie; 179-13 identity-callback's own-entity resolution (record confirmed by a live grant); 179-16 identityProviderEntityTypes, setIdentityProviderMatrix and the serial spec; 179-17 authUserIdForIdentity and the teardown of function-created entities; 179-18/19 the pending address and the CI1 states"
provides:
  - "E2E scenario 7: a type cookie rewritten to organization while the browser is at the provider ends on CI2 noRetry with mode_not_allowed, and no account and no entity exist for the identity"
  - "E2E: the provider's mode switched off while C shows its panel; Continue ends on CI2 noRetry, mode_not_allowed, Return and no Try again; no account for the identity"
  - "E2E: an account given a second candidate by an administrator; the identity returns to its own candidate, no third is made, the profile selection lists both and the account edits exactly those two"
  - "Fixture steps: identityProviderFlow.forgeEntityType / entitiesOf / grantSecondCandidate, startIdentityProviderFlow's beforeContinue and atProvider hooks; contestantIdentityProviderError.expectCode / expectReturnWithoutTryAgain"
  - "SupabaseAdminClient.createCandidateEditedBy, over one private entity-grant insert (insertEntityEditorGrant) shared with grantEntity"
affects: [179-21, 179-22, 179-24]

tech-stack:
  added: []
  patterns:
    - "A step taken while the browser is at the provider: the navigation to the mock issuer's authorize endpoint is held by a one-shot page.route, the step runs, and the request is let through unchanged"
    - "A forged cookie overwrites the one the application set by copying it from the context and changing its value only, and the step asserts that exactly one cookie of that name holds the new value"

key-files:
  created: []
  modified:
    - tests/tests/specs/contestant/contestant-identity-provider.spec.ts
    - tests/tests/fixtures/shared/identityProviderFlow.fixture.ts
    - tests/tests/fixtures/contestant/contestantIdentityProviderError.fixture.ts
    - tests/tests/utils/supabaseAdminClient.ts

key-decisions:
  - "The type is forged while the browser is at the provider, in a one-shot route on the mock issuer's authorize request: after the authorize endpoint set the cookie and before the provider's redirect back reads it"
  - "The refusal describe writes the candidates-only matrix before its tests and again after each, so a switched-off mode never outlives its test; it sits after the both-types describe, whose afterAll leaves the same matrix"
  - "The second candidate is created with no external id and a live editor grant, so the project's teardown removes it with the account's other entities through that grant"

requirements-completed: [REG-06, REG-08]

estimate:
  tokens: 50000
actuals:
  tokens: 5200
  tasks: 2
  commits: 1
plan_head_before: 103f245393d1942b08800a59c951958e6d158fab
plan_head_after: d12a1b6577b45b796026c0253b626f51d7b0aa6b

metrics:
  duration: "about 36 min (11:09Z to 11:45Z host clock, 2026-10-22), two full E2E runs included"
  completed: 2026-10-22
---

# Phase 179 Plan 20: The refusals, proved in a browser Summary

**Three new browser scenarios cover the refusals and the two-candidate case.**

1. **A forged type.** Candidates alone may register with the provider. The flow is started for a candidate, and while the browser is at the provider the `oidc_entity_type` cookie is rewritten to `organization`. Back from the provider, the error screen shows its `noRetry` class with `mode_not_allowed` in its address, and the service role finds no account and no entity for the identity.
2. **A mode switched off.** C shows the provider's panel, then the settings stop allowing the provider's mode for any type. Continue lands on the same class, with Return and no Try again, and nothing is written.
3. **A second candidate.** An administrator gives an identity's account a second candidate. The identity comes back to its own candidate, no third one is made, and the profile selection lists both.

`requirements-completed`: this plan shows REG-06's refusal half and REG-08's `mode_not_allowed` class. Both requirements were completed in earlier plans.

## Task commits

| Task | Commit | What |
|---|---|---|
| 1 | d12a1b657 | `test(179-20)`: the three scenarios, their fixture steps and the admin helper. This is one held set, committed after `179-20-held` was green |
| 2 | — | The close run of the committed tree and `lint:check`. No file changed |

## What was built

### Spec (`contestant-identity-provider.spec.ts`)

Two describes were added at the end of the file. The file runs serially, in one worker.

**Describe "what the type cookie and the matrix refuse".** Its `beforeAll` writes the candidates-only matrix (`setIdentityProviderMatrix(['candidate'])`). Its `afterEach` writes the same matrix back after every test, so a test that fails with the mode switched off leaves no later test without it.

- **A forged type** (`@reg-idp`):
  - The test mints an identity and starts the flow for a candidate with `atProvider: () => forgeEntityType(context, 'organization')`.
  - CI2 shows `noRetry`, and `expectCode('mode_not_allowed')` holds.
  - Try again is offered, because the mode is still listed (U-03 ★). Return is offered too.
  - `expectNoAccountFor(sub)` holds, and `entitiesOf(sub)` equals `{ candidate: [], organization: [] }`.
- **A mode switched off** (`@reg-idp`):
  - The test mints an identity and calls `beforeContinue`. That hook asserts C's one-type provider panel (`expectIdentityProviderPanel(['candidate'])`) and then writes `setIdentityProviderMatrix([])`, which leaves candidates with email and code, and organizations with nothing.
  - On Continue, the authorize endpoint answers 403. CI2 shows `noRetry`, `mode_not_allowed` is in the address, and `expectReturnWithoutTryAgain()` holds.
  - No account exists, and `entitiesOf` is empty.

**Describe "an account given a second candidate"** (`@reg-idp`):
- `registerWithIdentityProvider` runs with a fresh address, and `entitiesOf` then lists exactly one candidate.
- The user signs out. `grantSecondCandidate(sub)` creates the second candidate and its grant.
- The identity identifies again. CI1 shows `returning`, `pending` and `asks=""`, then the user presses Continue.
- The selection screen has one `candidate` group with two cards.
- `entitiesOf(sub)` equals the registered candidate and the granted one, and no organization.

**Docblock:** the coverage list, "What it writes" and the verification count are updated.

### Fixture steps

`identityProviderFlow`:
- **`forgeEntityType(context, type)`**
  - The type cookie's wire name is the literal `oidc_entity_type`. The docblock names `COOKIE.oidcEntityType` in `apps/frontend/src/lib/cookies/index.ts`.
  - The step asserts that the flow left exactly one such cookie and that it is httpOnly.
  - It re-adds that cookie with only the value changed, which keeps the host, path, `secure`, `sameSite` and expiry.
  - It then asserts that exactly one cookie of that name holds the forged value. A duplicate domain cookie would fail here, not silently lose to the original.
- **`startIdentityProviderFlow` gains two optional hooks:**
  - `beforeContinue` runs after the type is chosen and before Continue.
  - `atProvider` is a one-shot `page.route` matching the mock issuer's origin and the path `/oauth2/authorize`. It runs the step, then calls `route.continue()`.
- **`entitiesOf(sub)`** returns the account's sorted candidate and organization ids, read through its editor grants. With no account, both lists are empty.
- **`grantSecondCandidate(sub)`** creates the candidate through `SupabaseAdminClient.createCandidateEditedBy`.

`contestantIdentityProviderError`:
- `expectCode(code)` polls the `error` search parameter of the address.
- `expectReturnWithoutTryAgain()` composes `expectTryAgain(false)` and `expectReturn()`.

`SupabaseAdminClient`:
- `createCandidateEditedBy(userId, names)` inserts a confirmed candidate with no external id in the client's project, then the editor grant. If the grant fails, it removes the candidate again.
- The grant insert now lives in one private method, `insertEntityEditorGrant`, used by both `grantEntityToUser` and the new helper. This keeps the docblock's "the one place in this file that inserts an entity grant" true.

## Runs

| Run | Tree | Result | Verdict |
|---|---|---|---|
| `179-unit/179-20-typecheck-tests` | held set | `yarn typecheck:tests` exit 0 | — |
| `179-unit/179-20-eslint` | held set | exit 0, 1 warning (`prefer-to-have-length` in `forgeEntityType`), fixed. After the fix: exit 0, no warning. Prettier clean, `assert:comment-hygiene` 0, `assert:cookie-names` 0 | — |
| `179-e2e/179-20-held` | held set at 103f24539 | **613/613**, wrapper exit 0, `restore: ok`, not void, AC at 100 % | `179-verdict control 179-20-held --full --same-projects-as 179-19-close --except contestant-identity-provider=3 --dirty-only tests/ --green`: **PASS**. 128 projects; `contestant-identity-provider` 37 → 40 (`37+3 = 40 holds`); all others equal (`_drivers/179-20-held.verdict.log`) |
| `179-e2e/179-20-close` | committed d12a1b657 | **613/613**, driver and wrapper exit 0, `restore: ok`, `sleep_entries_in_window: 0`, AC at 100 % | `179-verdict e2e 179-20-close --same-projects-as 179-20-held`: **PASS**, 128 projects, 0 not as expected (`_drivers/179-20-close.verdict.log`) |
| `179-unit/179-20-close-lint` (`.log`, `.exit`, `.head`) | committed d12a1b657 | `yarn lint:check` exit **0** | — |

Totals: 179-19-close 610 → held 613 → close 613.

The held copies are kept as `tests/e2e-runs/179-e2e/179-20-held.<path with / as __>.kept`. Each is byte-identical (`cmp`) to what d12a1b657 committed.

## Verify blocks (`tests/e2e-runs/179-unit/179-20-t{1,2}-verify.{sh,log,exit,head}`)

Both scripts are byte-identical (`cmp`) to the plan's `<automated>` blocks. This plan's blocks need no restatement: the `--dirty-only tests/` path already has its slash, and no `yarn -s` is used.

- **Task 1**, as written: exit **0** at d12a1b657, and again at the final head (`179-20-t1-verify-final.log`).
- **Task 2**, as written: exit **0** at d12a1b657.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Blocking] The admin client.** `grantSecondCandidate` needs a service-role insert of a candidate with no external id and of its grant. `SupabaseAdminClient` could write a grant only for an entity named by its external id (`grantEntityToUser` is private and resolves `externalId`). I added `createCandidateEditedBy`, and moved the grant insert into the shared private `insertEntityEditorGrant`. `grantEntity`'s behaviour is unchanged.
- **File not on the plan's list:** `tests/tests/utils/supabaseAdminClient.ts`.

**2. [Rule 3 - Blocking] The hooks of the start step.** Both of these need a step between the parts of `startIdentityProviderFlow`:
- The plan's "before the provider returns" forgery.
- "C is shown with the provider's mode; the matrix is changed; Continue".

The step gained two optional hooks, `beforeContinue` and `atProvider`, instead of being split. Existing callers are unchanged.

**3. [Rule 1 - Lint] `prefer-to-have-length`** on the first draft of `forgeEntityType`. Fixed before the held run.

**Spec body:** two new describes holding the plan's three scenarios. No existing test changed. The refusal describe's `beforeAll` and `afterEach` matrix writes are part of the plan's switched-off scenario: the dispatch says such a scenario "must restore it".

**Files touched that the plan did not list:** `tests/tests/utils/supabaseAdminClient.ts` (Deviation 1).

## What the scenarios observe about the OIDC callback (dispatch question)

- **Observed:** with candidates alone allowed, a type cookie forged to `organization` ends on CI2 with `mode_not_allowed`, and no account exists for the identity. This held in both full runs. The dev server's log holds exactly one `[oidc/callback] Registration through identity-callback failed: mode_not_allowed` in the held run.
- **Inferred, not observed:** that the refusal comes from the SvelteKit callback's own type check, before `identity-callback` is invoked.
  - In `resolveEntityType` (`routes/api/oidc/callback/+server.ts`), `organization` is served (`setIdentityProviderMatrix` serves both types) but its row lacks the provider's mode, so the callback answers `mode_not_allowed` without calling the function.
  - The callback's `failed()` logs the same line for its own refusal and for the function's, so the log cannot tell the two apart.
  - `idp-functions.log` records worker starts, not requests.
  - The function's own refusal of a forbidden type is proved by the direct-call spec (179-13), as the plan's ruling 1 says.
- **The callback still checks the matrix itself** (`getServedEntityTypes` filtered by `isRegistrationModeAllowed`), not through `identityProviderEntityTypes`, and reads no answers lock. No scenario of this plan reaches the lock: the switched-off scenario is refused earlier, at the authorize endpoint, which does read it through `identityProviderEntityTypes`. The code-review item from 179-16 stands.

## Statements observed and inferred

- **Observed in a browser, in two full runs:**
  - The forged type: CI2 `noRetry`, `mode_not_allowed` in the address, Try again and Return. Through the service role: no account, no entity.
  - The switched-off mode: CI2 `noRetry`, `mode_not_allowed`, Return and no Try again (CI2's own anonymous read no longer lists the mode). Through the service role: no account.
  - The second candidate: the returning identity sees CI1 V4 (`returning`, `pending`) once, with no error screen and no throw. The profile selection shows one candidate group with two cards. Through the service role, the account edits exactly the registered candidate and the granted one, and no organization.
- **Observed by the step's own assertion:** the forged cookie replaced the application's one. After the forgery, exactly one `oidc_entity_type` cookie holds `organization`.
- **Inferred:**
  - Which layer refused the forged type (above).
  - That the project's teardown removes the granted candidate. It has no external id and is found through the account's editor grant, under the `e2e-idp-` placeholder address. The teardown ran green in both runs; its count was not read.

## Carried items

| Item | Outcome |
|---|---|
| (179-19) Hydration race in `contestantIdentityProviderGate.logOut()` | **Left for 179-24.** No scenario of this plan uses CI1's Log Out. The one press on a freshly loaded identity-provider page is CI1's Continue in the two-candidate scenario (`pressContinue`). That button is natively `disabled={!mounted}`, and Playwright's click waits for an enabled element, so the press already waits for the view's script. `logOut()`'s button has no such witness and is unchanged. |
| (179-10 / 179-17..19) Pacing of `/auth/v1/verify` | No fixed-wait pacing was built. This plan adds **3** verifications: the two-candidate scenario's registration (2: the callback's sign-in, and the operation's check of the current address; the mailed link is not opened) and its return (1). The two refusal scenarios verify none, because no flow reaches a sign-in. The spec now makes **about 95** per run; its docblock says so. Both full runs passed with no 429. |

## Code review checklist (`.agents/code-review-checklist.md`, test-tree change)

- **Solves the issue:** each of the plan's three truths holds end to end, and each also asserts through the service role what was written (PROH-179-29).
- **Threat register:**
  - T-179-201: the forged-type scenario asserts CI2 and that no account or entity was written.
  - T-179-202: the two-candidate scenario asserts exactly two candidates and no error.
  - T-179-SC: no package installed.
- **`any`:** none.
- **Secrets:** no expectation or title takes a `sub`, a token or an address. The cookie expectations carry the type value only.
- **Repetition:** the grant insert has one site again. The forgery copies the application's cookie and changes no attribute.
- **Documentation:** TSDoc on every new step, hook, helper and the private insert. The fixture header lists the steps. The spec docblock covers coverage, writes and the verification count. The CI2 fixture's surface list is updated.
- **Comment hygiene:** `assert:comment-hygiene` exit 0 before the commit. No ids or history in comments or titles.
- **Rigidity:** hard assertions only, no locator in the spec body, no fixed wait. The route hook is in the fixture.
- **Shared state:** the matrix writes are bracketed by the describe's `beforeAll` and `afterEach` in the serial file, at the tail of the perm chain, the same placement as 179-16's describe. Both full runs were green with `admin-auth` sharing the phase.
- **Commits:** one test commit, linear; no `[db]` change.

## Items to report rather than edit

- **The OIDC callback's own matrix check** (above): it is still a second copy of the type resolution, without the answers lock. This is a code-review item, carried since 179-16.
- **`contestantIdentityProviderGate.logOut()`** is not waited for hydration (179-24).
- **`tests/README.md` § the auth budget:** the 179-17/18/19 item stands. The spec now verifies about 95 tokens per run.
- **CLAUDE.md:** I found no sentence made false by this plan.

## Known Stubs

None.

## Threat Flags

None. `createCandidateEditedBy` is a test-tree service-role helper under the existing admin client.

## Self-Check: PASSED

- Commit d12a1b657 is an ancestor of HEAD. `git rev-list --count 103f24539..HEAD` = 1 before this summary's commit.
- The four modified files exist. `tests/e2e-runs/179-e2e/179-20-held/results.json` and `179-20-close/restore.txt` (`restore: ok`) exist. `_drivers/179-20-held.verdict.log` and `_drivers/179-20-close.verdict.log` end in PASS.
- `tests/e2e-runs/179-unit/179-20-t1-verify.exit`, `179-20-t2-verify.exit` and `179-20-close-lint.exit` are 0.
- `git status` shows nothing outside `.planning/` but the operator's `CAND-APP-PLAN.md`.
- STATE.md, ROADMAP.md, REQUIREMENTS.md, CONTEXT, RESEARCH, PATTERNS, UI-SPEC and CLAUDE.md were not touched.
