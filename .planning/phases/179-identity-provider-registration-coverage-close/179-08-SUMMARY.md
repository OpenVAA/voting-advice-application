---
phase: 179-identity-provider-registration-coverage-close
plan: 08
subsystem: identity-callback
tags: [edge-function, identity-provider, registration-matrix, contract, placeholder-address, vitest]
status: complete

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-07: the authorize endpoint's matrix check and the oidc_entity_type cookie; oidcErrorFromFunction already maps the function's result spellings"
provides:
  - "$IC/requestContract.ts: parseIdentityCallbackRequest, IDENTITY_CALLBACK_RESULT (nine results, frozen), IdentityCallbackRequest, IdentityCallbackResult, RequestedEntityType, resultStatus, resultBody"
  - "$IC/registrationMatrix.ts: SERVED_ENTITY_TYPES, ENTITY_TYPES, ServedEntityType, EntityTypeDecision, registrationModeAllowed, identityProviderEntityTypes, resolveEntityType"
  - "$IC/placeholderAddress.ts: PLACEHOLDER_EMAIL_DOMAIN, placeholderAddressFor, isPlaceholderAddress"
  - "$FN/placeholderAddress.ts: PLACEHOLDER_EMAIL_DOMAIN, isPlaceholderAddress"
  - "$F/lib/contestant/utils/identityProviderAccount.ts: PLACEHOLDER_EMAIL_DOMAIN, AddressState, AddressFacts, isPlaceholderAddress, addressStateOf"
affects: [179-09, 179-10, 179-11, 179-13, 179-14, 179-15]

tech-stack:
  added: []
  patterns:
    - "A third reader of the registration-mode truth table: the Deno copy parses the 32 MATRIX rows of 45-registration-mode-matrix.test.sql as text, with the dev-seed spec's pattern and guards"
    - "One constant per runtime, held equal by a conformance test that imports the function copies and reads all three files as text"

key-files:
  created:
    - apps/supabase/supabase/functions/identity-callback/requestContract.ts
    - apps/supabase/supabase/functions/identity-callback/requestContract.test.ts
    - apps/supabase/supabase/functions/identity-callback/registrationMatrix.ts
    - apps/supabase/supabase/functions/identity-callback/registrationMatrix.test.ts
    - apps/supabase/supabase/functions/identity-callback/placeholderAddress.ts
    - apps/supabase/supabase/functions/identity-callback/placeholderAddress.test.ts
    - apps/supabase/supabase/functions/account-access/placeholderAddress.ts
    - apps/frontend/src/lib/contestant/utils/identityProviderAccount.ts
    - apps/frontend/src/lib/contestant/utils/identityProviderAccount.test.ts
  modified: []

key-decisions:
  - "A null project_id or entity_type reads as absent, as account-access's isAbsent does; an empty string or any other non-member value makes the body malformed"
  - "resultStatus and resultBody answer a runtime value that is no result as unavailable (503), so no tenth answer can leave the function; a failure never carries a token even when one is passed"
  - "The Deno rule copies the SQL function directly (no shipped defaults): an unusable entity-type list serves candidates alone; an unusable matrix or row allows nothing; only own properties are read"
  - "requestContract reads ENTITY_TYPES from registrationMatrix, so the request's closed type set and the rule's are one list"
  - "An identity-provider account with no address at all reads as none (or pending when an address is pending), never proved"

patterns-established:
  - "A RED run is made against a stub module whose exports exist and answer wrongly, so it fails on assertions; captured with vitest's JUnit reporter and classified by gsd-tools check tdd-red-evidence"

requirements-completed: []

actuals:
  tokens: 10609
  tasks: 3
  commits: 5
plan_head_before: d90feb62ab61072cee11be57a8b4a1e305ddfa90
plan_head_after: f1f73268e05e99059c77a7af12a6f35290dc74e6

metrics:
  duration: "about 10 minutes (00:42 to 00:52 UTC, 2026-10-22)"
  completed: 2026-10-22
---

# Phase 179 Plan 08: The function's contract, its matrix copy and the placeholder constant Summary

The `identity-callback` function now has three tested pure modules that nothing calls yet. The first is a request parser: a token, a uuid project or none, and the entity type `candidate`, `organization` or none. It comes with nine closed results and their statuses, and a token goes out only with a success. The second is a Deno copy of the registration-mode rule, asserted against all 32 rows of the pgTAP truth table, with the entity-type decision built on it. The third is the placeholder domain, held as one constant in each of the two functions and the frontend; the frontend also gets `addressStateOf` (none, pending or proved).

## Tasks

| Task | Commit | What |
|---|---|---|
| 1 | a2491cffd | `requestContract.ts` + test (59 cases) |
| 2 | f90fa7321 | `registrationMatrix.ts` + test (40 cases; 32 table rows) |
| 3 | 0764ed0f8 | the three placeholder modules, the conformance test (37 cases) and the frontend test (28 cases) |
| (cleanup) | 5cc38f649 | `refactor`: the request's entity types come from `registrationMatrix.ENTITY_TYPES` instead of a second list |
| (cleanup) | f1f73268e | `docs`: two module headers say what the module is, not what calls it (nothing calls it yet) |

## Red runs (under `tests/e2e-runs/179-unit/`)

Each red run was made against a stub module whose exports existed and gave wrong answers, so every failure was an assertion, not an import error. Each was classified with `gsd-tools check tdd-red-evidence`.

| Run | Head | Exit | Failed / total | Classifier | Target |
|---|---|---|---|---|---|
| `179-08-t1-red` (TAP, `.log`) | d90feb62a | 1 | 33 / 59 | INVALID_RED `invalid_record`: vitest's TAP puts multi-line YAML in the report | parses a token and a project, with no entity type |
| `179-08-t1-red-junit` (`.junit.xml`) | d90feb62a | 1 | 33 / 59 | **RED_EVIDENCE_OK** | same |
| `179-08-t2-red` (`.junit.xml`) | a2491cffd | 1 | 11 / 40 | **RED_EVIDENCE_OK** | answers every row as the table states |
| `179-08-t3-red` (supabase, `.junit.xml`) | f90fa7321 | 1 | 11 / 37 | **RED_EVIDENCE_OK** | is the domain identity-callback builds the address on |
| `179-08-t3-red-frontend` (`.junit.xml`) | f90fa7321 | 1 | 12 / 28 | **RED_EVIDENCE_OK** | reads an account no identity provider made, on a real address |

Semantic check: in every run, the cases that failed were the ones the stub answered wrongly ("expected null to deeply equal …", "expected '' to be 'bank-auth.placeholder'", "expected false to be true"). The cases that passed check for refusals or for an empty result, and an always-refusing stub satisfies those. That is expected.

**The truth table as parsed:** one file (`45-registration-mode-matrix.test.sql`), **32 rows**, 32 calls, `plan (32)`, 32 unique titles. Every row agrees with `registrationModeAllowed`.

## Verification

- **The verify blocks, byte for byte:** `179-08-t{1,2,3}-verify.sh`. Each exited 1 at the `yarn -s` stage ("Unsupported option name (-s)").
- **Restated** (`yarn -s … > /dev/null` → `yarn … > /dev/null`): `-verify-restated.sh`, exit 0 for all three. Re-run at the final head f1f73268e as `-verify-final-r2`: exit 0, 0, 0.
- `yarn workspace @openvaa/supabase test:unit`: 19 → 22 files, 737 → 814 tests, green.
- `yarn workspace @openvaa/frontend test:unit` (`179-08-t3-frontend-suite`): 262 passed, 1 skipped files; 6145 passed, 31 skipped tests. Exit 0.
- `yarn lint:check` (`179-08-lint`, at 0764ed0f8): exit 0. The two later commits change only Edge Function files, which no eslint or typecheck covers. They were checked by prettier, comment hygiene and the supabase suite.
- `yarn assert:comment-hygiene`: 0 violations before every commit.
- **No E2E run.** The plan names none, and none of its commits changes anything a browser or a committed spec can reach. `index.ts` imports none of the new modules, and nothing in the frontend imports `identityProviderAccount.ts`. A `git grep` outside test files finds only each module's own header. The rules' "a plan that changes a function closes on a full run" is read here as not applying to files the function does not load. The orchestrator may judge that differently.

## Code review checklist (`.agents/code-review-checklist.md`)

- Solves the plan's issues: yes, all three modules and their tests.
- OWASP: the parser bounds the token at 16384 characters, accepts only a uuid project and a closed type set, and is strict about types. Answers are closed (T-179-081, T-179-083). The rule copy fails closed and reads only own properties, so `Object.prototype` is never read as a row (T-179-082).
- Code style / TSDoc: every export is documented. No `any`.
- Repetition: the domain and `isPlaceholderAddress` exist in three runtimes on purpose, because no runtime can import another's module. The conformance test holds the domain equal, and the two function copies are checked against one shared set of cases. The duplicate entity-type list inside `identity-callback` was removed (5cc38f649).
- Docs: no repo documentation describes these modules yet. The bank-authentication guide describes index.ts, which is unchanged.
- Tracking events, Svelte, WCAG and keyboard: not applicable (no UI).
- Error handling: pure modules, nothing thrown. "Descriptive error messages" deliberately do not apply: the coarse result is the security requirement.
- Comment hygiene: no ids, no history. Two headers were reworded so they do not describe callers that do not exist yet.
- Commit history: five commits, linear, no `[db]` (no schema change).
- Edge Functions section: these modules hold no authority question and no client.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `yarn -s` rejected by Yarn 4.18.1 in all three verify blocks**
- **Found during:** Tasks 1–3 verify.
- **Fix:** both forms were kept. The block as written exits 1 at that stage. The restated block (`yarn workspace … test:unit > /dev/null`) exits 0.

**2. [Rule 3 - Blocking] The RED evidence format**
- **Issue:** a red run against a missing module fails on the import, which `tdd.md` rejects as INVALID_RED. Vitest's TAP report is also rejected by the classifier as malformed.
- **Fix:** each red run was made against a stub module with wrong answers and captured with `--reporter=junit`. The plan only required a non-zero exit, which every red run has.

**3. [Rule 2 - Quality] Duplicate entity-type list removed (5cc38f649).** No behaviour change.

**4. [Rule 2 - Comment hygiene] Two module headers reworded (f1f73268e).** They now say what the module is rather than describing the function as already calling it.

### Judgement calls within the plan's text

- `addressStateOf`: the plan's "proved when … its address is not on the placeholder domain" assumes the account has an address. An identity-provider account with no address at all reads as `none` (or `pending`), never `proved`, so a missing address cannot skip the gate.
- `isPlaceholderAddress`: the domain part is what follows the last `@`, and the part before it must not be empty. Subdomains and suffixes of the domain are not placeholders.
- `registrationMatrix.test.ts` adds two checks the plan did not ask for. `SERVED_ENTITY_TYPES` must equal the list in `packages/app-shared/src/settings/contestantAppConfig.ts`, read as text. The request must accept exactly `ENTITY_TYPES`.
- The plan's `<artifacts_produced>` lists `placeholderAddressFor` for `$FN/placeholderAddress.ts` too. Task 3's action gives that module only the constant and `isPlaceholderAddress`, and the task was followed.

**Files touched that the plan did not list:** none. Evidence files under `tests/e2e-runs/179-unit/` are gitignored.

## Items to report rather than edit

- **A fourth and fifth copy of the domain sit in the test tree, outside the conformance test.** `tests/tests/fixtures/shared/identityProviderFlow.fixture.ts` declares `const PLACEHOLDER_EMAIL_DOMAIN = 'bank-auth.placeholder'`. `tests/tests/utils/bankAuthJourneyConstants.ts` has the literal in a template. The conformance test's pattern `PLACEHOLDER_EMAIL_DOMAIN = '…'` covers the three runtimes the plan names. The fixture could be added to `COPIES` later. Settle in 179-14 or 179-24.
- `$IC/index.ts` still builds the placeholder with an inline template literal. 179-13 wires `placeholderAddressFor` in.
- `179-EXECUTION-RULES.md` lists `registrationMatrix.ts` as exporting `SERVED_ENTITY_TYPES, identityProviderEntityTypes, resolveEntityType`. This plan also exports `ENTITY_TYPES` and `registrationModeAllowed`. The rules file only adds names, and nothing in it is false.

## Statements observed and inferred

- **Observed:** every red and green run above, both unit suites, lint:check, the table's row count, and that no non-test file imports the new modules.
- **Inferred:** that the function and the frontend behave exactly as before. This follows from nothing importing the modules; no E2E run was made.

## Known Stubs

None.

## Self-Check: PASSED

- All nine files listed under key-files.created exist.
- Commits a2491cffd, f90fa7321, 0764ed0f8, 5cc38f649 and f1f73268e are ancestors of HEAD.
