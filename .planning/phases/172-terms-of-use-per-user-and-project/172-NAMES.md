# Phase 172 — Names and Baseline

**Written by:** plan 172-01, Task 1.
**Tree read:** `03b8a0524569558b034c72c55c9c1699be9ecf0d`, branch `feat/entity-signup-multi-grant` — the tree as Phases 170 and 171 left it (last commit outside `.planning/`: `45505e155`).
**Sources:** the four `170-*-SUMMARY.md` and the four `171-*-SUMMARY.md` files, `rename.map.mjs` of Phase 170, `172-CONTEXT.md` `<name_map>`, the `files_modified` lists of `172-02-PLAN.md` to `172-09-PLAN.md`, and the tree itself.

The nine plans of this phase were written before Phase 170 executed and cite every name in its post-170 form. This file confirms each of those names against the tree. **Where a plan and this file disagree, this file is the authority and no plan is edited.**

**Verdict:** every cited name resolves under the name the plans use. No row is marked DIFFERS. Four rows carry a note where the tree is more specific than a plan's wording. Every existing path in the `files_modified` lists of plans 02 to 09 is tracked; the paths that do not exist yet are the ones those plans create (`lib/contestant/gates/*`, `(protected)/layout.server.test.ts`, the pgTAP file of this plan, `todos/done/…`).

## Resolved names

`F` = `apps/frontend/src`, `T` = `tests/tests`, `P` = `apps/frontend/src/routes/contestant/(protected)`. Every command was run at the tree above from the repository root. `git grep -E` on this host does not understand `\b`; the commands use `-F` or `-P`. A pipeline through `grep -v test` drops every path under `contestant/` (the word contains `test`): filter test files with `grep -v '\.test\.ts'`.

| Role | Name these plans use | Name before Phase 170 | Name found on the tree | Command that found it |
|---|---|---|---|---|
| Protected layout, server load (holds `handleError` and `safeGetSession`) | `routes/contestant/(protected)/+layout.server.ts` | `routes/candidate/(protected)/+layout.server.ts` | `P/+layout.server.ts` | `git grep -l -F "handleError" -- "$P"` and `git grep -l -F "safeGetSession" -- "$P"` (one file, the same) |
| Protected layout component (holds `layoutState`) | `routes/contestant/(protected)/+layout.svelte` | `routes/candidate/(protected)/+layout.svelte` | `P/+layout.svelte` | `git grep -l -F "layoutState" -- apps/frontend/src` (this file and its test) |
| Layout unit test | `termsOfUseLayout.svelte.test.ts` | the same file under `candidate/` | `P/termsOfUseLayout.svelte.test.ts` | `git ls-files -- '*termsOfUseLayout.svelte.test.ts'` |
| Context module and getter | `getContestantContext` in `lib/contexts/contestant/` | `getCandidateContext` in `lib/contexts/candidate/` | `getContestantContext` in `F/lib/contexts/contestant/contestantContext.svelte.ts` | `git grep -n -F "export function getContestantContext" -- apps/frontend/src` |
| Context type file (holds `logout: () => Promise<void>;`) | `contestantContext.type.ts` | `candidateContext.type.ts` | `F/lib/contexts/contestant/contestantContext.type.ts`. Note: the same line also stands in `F/lib/contexts/auth/authContext.type.ts`; the contestant context's own type file is the first | `git grep -n -F "logout: () => Promise<void>;" -- apps/frontend/src` |
| User-data state store (holds `#editedTermsOfUseAccepted`) | `contestantUserDataState.svelte.ts` | `candidateUserDataState.svelte.ts` | `F/lib/contexts/contestant/contestantUserDataState.svelte.ts` | `git grep -l -F "editedTermsOfUseAccepted" -- apps/frontend/src` |
| Its type file (declares `setTermsOfUseAccepted`) | `contestantUserDataState.type.ts` | `candidateUserDataState.type.ts` | `F/lib/contexts/contestant/contestantUserDataState.type.ts` | `git grep -l -F "setTermsOfUseAccepted" -- apps/frontend/src` |
| Its test | `contestantUserDataState.svelte.test.ts` | `candidateUserDataState.svelte.test.ts` | `F/lib/contexts/contestant/contestantUserDataState.svelte.test.ts` | same two commands |
| Writer's entity read method | `getContestantUserData` | `getCandidateUserData` | `getContestantUserData` in `F/lib/api/base/universalDataWriter.ts`, declared on the writer type in `F/lib/api/base/dataWriter.type.ts` | `git grep -n -P "\b_?getContestantUserData\b" -- apps/frontend/src/lib/api` |
| Its adapter implementation | `_getContestantUserData` | `_getCandidateUserData` | `_getContestantUserData` in `F/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` (abstract in `universalDataWriter.ts`); it calls `_getBasicUserData` first, then the RPC | same command |
| Basic user data read | `_getBasicUserData`, `BasicUserData` | the same | `_getBasicUserData` in `supabaseDataWriter.ts`; `export interface BasicUserData` in `F/lib/api/base/dataWriter.type.ts` | `git grep -n -i -F "UserData(" -- apps/frontend/src/lib/api`; `git grep -n -P "export (type\|interface) (BasicUserData\|SetPropertiesOptions)\b" -- apps/frontend/src` |
| Entity data type (an entity word Phase 170 leaves) | `LocalizedCandidateData` | `LocalizedCandidateData` | `export type LocalizedCandidateData` in `F/lib/api/base/dataWriter.type.ts` | `git grep -n -P "export (type\|interface) LocalizedCandidateData\b" -- apps/frontend/src` |
| User-data type | `ContestantUserData` | `CandidateUserData` | `export type ContestantUserData` in `F/lib/api/base/dataWriter.type.ts` | `git grep -n -P "export (type\|interface) ContestantUserData\b" -- apps/frontend/src` |
| Properties option type | `SetPropertiesOptions` | the same | `export type SetPropertiesOptions` in `F/lib/api/base/dataWriter.type.ts` | as for `BasicUserData` |
| Key under which the protected load returns the user data | `contestantUserData` | `candidateUserData` | `contestantUserData: userData` in `P/+layout.server.ts` | `git grep -n -F "contestantUserData" -- "$P/+layout.server.ts"` |
| Login-error type and its import path | `ContestantLoginError` | `CandidateLoginError` | `export type ContestantLoginError` in `F/lib/contestant/utils/loginError.ts`, imported as `$contestant/utils/loginError` | `git grep -n -P "ContestantLoginError\b" -- apps/frontend/src` |
| User-data RPC (keeps its name under a named exemption) | `get_candidate_user_data` | `get_candidate_user_data` | `public.get_candidate_user_data (uuid, public.entity_type)` in `apps/supabase/supabase/schema/503-entity-rpcs.sql`; called once, in `supabaseDataWriter.ts` | `git grep -n -F "get_candidate_user_data" -- apps/frontend/src apps/supabase/supabase/schema scripts/assert-no-candidate-app-names.mjs` |
| Alias | `$contestant` | `$candidate` | `$contestant: path.resolve('./src/lib/contestant')` in `apps/frontend/svelte.config.js` | `git grep -n -F "contestant" -- apps/frontend/svelte.config.js` |
| Terms-of-use component directory | `lib/contestant/components/termsOfUse/` | `lib/candidate/components/termsOfUse/` | `F/lib/contestant/components/termsOfUse/` — `TermsOfUse.svelte`, `TermsOfUseForm.svelte`, `TermsOfUseForm.type.ts`, `index.ts` | `git ls-files -- apps/frontend/src/lib/contestant/components/termsOfUse` |
| Route keys, login and home | `ContestantAppLogin`, `ContestantAppHome` | `CandAppLogin`, `CandAppHome` | both in `F/lib/routes/route.ts` | `git grep -n -P "\b(ContestantAppLogin\|ContestantAppHome\|AuthCallback\|AuthLogout)\b\s*[:=]" -- apps/frontend/src/lib/routes/route.ts` |
| Auth route keys | `AuthCallback`, `AuthLogout` | `CandAppAuthCallback`, `CandAppLogout` | both in `F/lib/routes/route.ts` | same command |
| Message keys, consent | `dynamic.contestantAppPrivacy.consent.title`, `.heroEmoji` | `dynamic.candidateAppPrivacy.consent.*` | both present in `apps/frontend/messages/<locale>/dynamic.json` for all seven locales, with `.ingress` and `.acceptLabel` beside them. Note: the file's one top-level key is `dynamic` | a `node -e` walk of the seven `dynamic.json` files; `git grep -n -F "contestantAppPrivacy.consent" -- apps/frontend/src` |
| Message key, save failure | `contestantApp.error.saveFailed` | `candidateApp.error.saveFailed` | `saveFailed` under the top-level key `"contestantApp.error"` of `apps/frontend/messages/<locale>/contestantApp.error.json`, all seven locales | `git grep -c -F '"saveFailed"' -- 'apps/frontend/messages/*/contestantApp.error.json'` (seven files, one line each) |
| E2E spec, fixture and setup directories | `specs/contestant/`, `fixtures/contestant/`, `setup/contestant/` | the same three under `candidate/` | `T/specs/contestant/`, `T/fixtures/contestant/`, `T/setup/contestant/` | `ls -d tests/tests/specs/contestant tests/tests/fixtures/contestant tests/tests/setup/contestant` |
| Axe spec | `contestant-a11y.spec.ts` | `candidate-a11y.spec.ts` | `T/specs/a11y/contestant-a11y.spec.ts` | `git ls-files -- tests/tests/specs/a11y/contestant-a11y.spec.ts` |
| Journey spec | `contestant-journey.spec.ts` | `candidate-journey.spec.ts` | `T/specs/contestant/contestant-journey.spec.ts` | `git ls-files` on the path |
| Journey constants | `contestantJourneyConstants.ts` | `candidateJourneyConstants.ts` | `T/utils/contestantJourneyConstants.ts` | `git ls-files` on the path |
| Playwright projects | `contestant-journey`, `contestant-a11y-scan`, `cold-entry-dataroot-contestant`, `auth-setup` | `candidate-journey`, `candidate-a11y-scan`, `cold-entry-dataroot-candidate`, `auth-setup` | all four, under those names, in `tests/playwright.config.ts` | `git grep -n -P "name: '(contestant-journey\|contestant-a11y-scan\|cold-entry-dataroot-contestant\|auth-setup)'" -- tests/playwright.config.ts` |
| Terms test ids | `testIds.contestant.terms` (the object holding `submit: 'terms-of-use-submit'`) | `testIds.candidate.terms` | `testIds.contestant.terms` in `T/utils/testIds.ts`: `checkbox: 'terms-checkbox'`, `submit: 'terms-of-use-submit'`. Note: `tou-save-error` is not in the registry; it is a literal in `P/+layout.svelte` and in the layout unit test | `git grep -n -F "terms-of-use-submit" -- tests apps/frontend/src`; `git grep -n -P "^  [a-zA-Z]+: \{" -- tests/tests/utils/testIds.ts` (roots: `contestant`, `voter`, `shared`) |
| Home-logout test id | the home-logout test id | `candidate-home-logout` | `testIds.contestant.home.logout` = `'contestant-home-logout'`, set on the `LogoutButton` of `P/+page.svelte`. Note: the gate view's own Logout button carries no test id | `git grep -n -i -P "logout" -- tests/tests/utils/testIds.ts`; `git grep -n -F "contestant-home-logout" -- apps/frontend/src` |
| Terms-of-use page fixture | `contestantTermsOfUsePage.fixture.ts` | `candidateTermsOfUsePage.fixture.ts` | `T/fixtures/contestant/contestantTermsOfUsePage.fixture.ts` | `git ls-files` on the path |
| E2E admin client | `tests/tests/utils/supabaseAdminClient.ts` (`forceRegister`, `unregisterCandidate`) | the same | `T/utils/supabaseAdminClient.ts` | `git ls-files` on the path |
| Credentials, auth setup, closed-project setup, scan core | `testCredentials.ts`, `auth.setup.ts`, `perm-closed-project.setup.ts`, `axeScan.ts` | the same | `T/utils/testCredentials.ts`, `T/setup/shared/auth.setup.ts`, `T/setup/perm/perm-closed-project.setup.ts`, `T/utils/axeScan.ts` | `git ls-files` on the four paths |
| Docs registration page | the registration page under `developers-guide/contestant-app/` | `developers-guide/candidate-app/registration` | `apps/docs/src/routes/(content)/developers-guide/contestant-app/registration/+page.md` | `git ls-files -- 'apps/docs/src/routes/(content)/developers-guide/contestant-app'`; `git grep -l -F "terms_of_use" -- apps/docs` |
| Docs authentication page | `backend/authentication` | the same | `apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md` | `git grep -l -F "terms_of_use" -- apps/docs` |
| Phase 170's name gate in `lint:check` | `assert:no-candidate-app-names` | (did not exist) | root script `assert:no-candidate-app-names` = `node scripts/assert-no-candidate-app-names.mjs`, a link of `lint:check` | the `lint:check` line of root `package.json` |
| File holding its exemption list | the gate's own source | (did not exist) | `const EXEMPT = [...]` in `scripts/assert-no-candidate-app-names.mjs`, three entries: `get_candidate_user_data` (see phase 173), `invite-candidate` (see phase 174), the three shown names as whole quoted strings (see phase 171). This phase adds none and removes none | `git grep -n -F "EXEMPT" -- scripts/assert-no-candidate-app-names.mjs` |
| Legacy preregister email page (imports `TermsOfUseForm`, declares `let termsAccepted = $state(false)`) | identified by content | `routes/candidate/preregister/(authenticated)/email/+page.svelte` | `F/routes/contestant/preregister/(authenticated)/email/+page.svelte`. `TermsOfUseForm` has exactly two consumers: this page and `P/+layout.svelte` | `git grep -l -F 'let termsAccepted = $state(false)' -- apps/frontend/src`; `git grep -l -F "TermsOfUseForm" -- apps/frontend/src` |
| Auth callback path the E2E admin client redirects to | the neutral callback | `/en/api/candidate/auth/callback` | `/en/api/auth/callback`, at two `redirectTo` sites of `T/utils/supabaseAdminClient.ts`; the route is `F/routes/api/auth/callback/+server.ts` | `git grep -n -P "api/auth/callback\|redirectTo" -- tests/tests/utils/supabaseAdminClient.ts` |

## Baseline

Snapshots for later comparison, never targets. Each line is `key: value`, with the command beside it.

base_rev: `03b8a0524569558b034c72c55c9c1699be9ecf0d` — `git rev-parse HEAD`

phase_171_executed: yes — `ls .planning/phases/171-*/171-0?-SUMMARY.md` lists four files; its schema edit (`contestant_app_public_config`) is on the tree and regenerated

phase_170_executed: yes — four `170-0?-SUMMARY.md` files; `apps/frontend/src/routes/contestant/(protected)/+layout.server.ts` exists

column_census_files: 44 — `git grep -c -F "terms_of_use_accepted" -- . ':!.planning' | wc -l`

column_census_lines: 159 — `git grep -n -F "terms_of_use_accepted" -- . ':!.planning' | wc -l`

pgtap_highest_file_number: 38 — `ls apps/supabase/supabase/tests/database/` (37 files: `00` to `36`, and `38`; number 37 is free)

pgtap_planned_assertions: 1342 — in the tests directory, `grep -h -o -E "plan\s*\(\s*[0-9]+\s*\)" *.sql | grep -o -E "[0-9]+" | paste -sd+ - | bc` (36 files declare a plan; `00-helpers` declares none). The runner reports `Files=37, Tests=1351`

schema_file_count: 26 — `ls apps/supabase/supabase/schema | wc -l`; the parity guard reports `26 schema file(s) -> 6399 line(s)`

lint_schema_census: `[9001] census: policies examined: 102, tables partitioned: 19, permission members: 23 (row-level-security tables in public+storage: 29)`; `Summary: 0 error(s), 3 warning(s)` — `yarn db:lint:sql` on the freshly reset database

auth_allowlist: `https://127.0.0.1:3000,http://localhost:5173/api/auth/callback,http://localhost:5173/*/api/auth/callback` — `docker exec supabase_auth_openvaa-local printenv GOTRUE_URI_ALLOW_LIST`; it holds the neutral callback and no `candidate` path, and `170-allowlist-probe.sh after` exits 0 with ten rows OK. The stack was not restarted

unit_counts: frontend 2140 tests in 135 files, dev-seed 997 in 67, app-shared 141 in 10 — the `06-unit.log` of the baseline gate run

baseline_gates_verdict: green, exit 0 — `bash PD/172-gates.sh --judge 172-01-baseline`; `tests/e2e-runs/172-gates/172-01-baseline/summary.tsv` holds nine rows, every status 0 (lint 42 s, types-regen 31 s, types-clean 0 s, sql-lint 3 s, pgtap 4 s, unit 53 s, svelte-check 8 s, build 15 s, format 16 s); head `03b8a0524`; pgTAP `Files=37, Tests=1351, Result: PASS`; svelte-check 2650 files, 0 errors, 0 warnings

baseline_e2e_verdict: green, exit 0 — `bash PD/172-e2e.sh --judge 172-01-baseline`; `tests/e2e-runs/172/172-01-baseline/summary.json`

baseline_e2e_counts: total 177, passed 177, failed 0, flaky 0, skipped 0, didNotRun 0 — the full default suite, 100 projects, 4.7 min, one preflight success, no preflight failure, head `03b8a0524`

database_state_after_baseline: migrations plus `seed.sql`, the pgTAP helper functions in `public` (row 05 of the gate set), and what the E2E run left in its own project; the `default` dataset Phase 171's close seeded is gone with the reset

schema_file: `apps/supabase/supabase/schema/304-terms-of-use-acceptances.sql` — `ls apps/supabase/supabase/schema | grep terms-of-use`; 304 was the next free `30x` number. After it: 27 schema files, a 6466-line migration, and the linter census `policies examined: 104, tables partitioned: 20, permission members: 23 (row-level-security tables in public+storage: 30)`

pgtap_file: `apps/supabase/supabase/tests/database/37-terms-of-use-acceptances.test.sql` — `ls apps/supabase/supabase/tests/database/*-terms-of-use-acceptances.test.sql`; 37 was the free number. `plan (41)`, five numbered sections: the catalogue, a signed-in user, another user and anon, project scope, the user cascade. After it the runner reports `Files=38, Tests=1392`

## The two helpers

`PD` = `.planning/phases/172-terms-of-use-per-user-and-project`. Both are started in the background and polled; neither is ever awaited in the foreground.

| | Run | Poll | Verdict | Where |
|---|---|---|---|---|
| Static gates | `bash PD/172-gates.sh <label>` | `bash PD/172-gates.sh --status <label>` → `absent`, `running`, `done <exit status>` | `bash PD/172-gates.sh --judge <label>` (nine rows, every status 0) | `bash PD/172-gates.sh --path <label>` → `tests/e2e-runs/172-gates/<label>[-rN]` |
| E2E | `bash PD/172-e2e.sh <label> [--project <name>]` | `bash PD/172-e2e.sh --status <label>` | `bash PD/172-e2e.sh --judge <label> [--allow-slice]` | `bash PD/172-e2e.sh --path <label>` → `tests/e2e-runs/172/<label>[-rN]` |

What a later plan must know about them:

- **The gate set resets the local database.** Row `02-types-regen` is `yarn db:reset` followed by `yarn db:types`, because the pgTAP suite's first file commits its helper functions into `public`: on a database where pgTAP has run since the last reset, the regenerated types gain 18 lines of test helpers and row `03-types-clean` is red on a correct tree (measured on the tree above before the first run). The reset also makes rows `04-sql-lint` and `05-pgtap` judge the schema of the tree. Local data is gone after every gate run; the next E2E run's global setup recreates the E2E project.
- **The gate set refuses to start while an E2E run is in flight** (a listener on the wrapper's port, or a run directory that started within ten minutes and has not ended): exit 2, with `done` written.
- **Row `03-types-clean` compares the regenerated file with the index**, so the generated types must be committed (or at least staged) before a gate run that is meant to be green. On a drift the diff is kept as `db-types-drift.diff` in the attempt's directory.
- **Order at a plan's close:** the gate set first, then the E2E run. The E2E run leaves the database as it finds it (`--no-db-reset`).
- **A rerun keeps its label.** A second run under a label lands in `<label>-r2`, a third in `<label>-r3`; `--status`, `--judge` and `--path` read the newest. Nothing under `tests/e2e-runs/` is ever deleted.
- **The E2E verdict** is red on a failed, flaky or did-not-run test, on an empty run, on a non-zero wrapper status, on a missing preflight success, on a project slice judged without `--allow-slice`, and on a full-suite run whose total is below the baseline's.
- **An early refusal still leaves an attempt directory** holding only `done` (and `wrapper.log` when the wrapper started). The next run under the label takes the next `-rN`.
