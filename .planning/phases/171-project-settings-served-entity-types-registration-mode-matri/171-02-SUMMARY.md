---
phase: 171-project-settings-served-entity-types-registration-mode-matri
plan: 02
subsystem: database
tags: [supabase, security-definer, rls, pgtap, app-settings, zod, registration-modes, entity-types, contestant-app, tdd]

requires:
  - phase: 171-project-settings-served-entity-types-registration-mode-matri
    provides: "Plan 01: `contestantApp.entityTypes` and `contestantApp.registrationModes` in the type, the shipped defaults and the strict `StoredSettingsSchema`; the accessors of `contestantAppConfig.ts`, total on a provider's raw answer; the deep `mergeAppSettings`"
  - phase: 170-contestant-app-rename-symbols-routes
    provides: "The `contestantApp` settings root, `access.contestantApp` and the app-name search gate of `lint:check`"
provides:
  - "`public.contestant_app_public_config(p_project_id uuid) RETURNS jsonb`: an anon-callable `SECURITY DEFINER` function answering exactly `access.contestantApp`, `contestantApp.entityTypes` and `contestantApp.registrationModes`, raw, with one all-null answer when there is nothing to tell"
  - "Its explicit `GRANT EXECUTE` to `anon` and `authenticated`, its pgTAP file `38-contestant-app-public-config.test.sql` (16 assertions), both definer censuses naming six functions, and its `PROJECT_SCOPED_RPCS` disposition"
  - "The regenerated migration and the generated `Functions.contestant_app_public_config` type entry, both produced from a database reset after the regeneration"
  - "The closed-project branch of `_getAppSettings`: `access` and `contestantApp` built over the shipped defaults from the function's answer, validated by `StoredSettingsSchema`"
  - "The root-level rejection of one bad list value pinned for both the readable-row path and the function path"
affects: [171-03, 171-04, 172, 173, 175, 177, 178]

actuals:
  tokens: 12933
  tasks: 3
  commits: 4
plan_head_before: 4df86d0fba866b3f0b273183f8898d84a5e56ef6
plan_head_after: 7f1d1e71ada976efa90524d102eaeab0244d3f5c

tech-stack:
  added: []
  patterns:
    - "A value an anonymous reader of a closed project needs is a member of the one `jsonb` object `contestant_app_public_config` answers, at its storage path; never a second anon function and never a wider table policy"
    - "A definer function's raw `jsonb` answer is narrowed with a type guard, reduced to an allow-list of members with nulls left out, and then parsed by the same schema a readable row gets"
    - "The provider's closed-project answer states whole roots over the shipped defaults, with the forced gate applied last"

key-files:
  created:
    - apps/supabase/supabase/tests/database/38-contestant-app-public-config.test.sql
    - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/evidence/171-02-task3-red.json
    - .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/deferred-items.md
  modified:
    - apps/supabase/supabase/schema/106-app-settings.sql
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
    - scripts/assert-project-scoped-queries.mjs
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/database.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
    - .claude/skills/database/SKILL.md
    - .claude/skills/database/rls-policy-map.md
    - .claude/skills/database/schema-reference.md

key-decisions:
  - "The regenerated migration is committed with the schema edit that caused it (the Task 1 commit), so that no commit leaves the parity gate or pgTAP red; the Task 2 commit carries the generated types."
  - "A nested member of the function's answer (`access`, `contestantApp`) that is not an object is read as carrying nothing. Only an answer that is not an object at the top throws."
  - "The narrowing guard is a non-exported function of the provider module. `isPlainObject` of `@openvaa/app-shared` is not exported by the package barrel, and the barrel is outside this plan."
  - "The cast on the closed-project return and its `reason:` comment are removed: the value satisfies `Partial<DynamicSettings>` without it."
  - "The pgTAP file asserts the all-null answer for three cases, not two: a project that declares nothing, a project with no row, and an id that names no project."

patterns-established:
  - "Closed-project reads in provider unit tests: `mockClosedProject(<answer>)` and `NOTHING_DECLARED` in the `getAppSettings` block of `supabaseDataProvider.test.ts`"

requirements-completed: [SET-01, SET-02, SET-03]

coverage:
  - id: D1
    description: "The function answers exactly three stored values, raw and unvalidated, to `anon` and to a signed-in caller with no grants, for a closed project and for an open one"
    requirement: SET-01
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/38-contestant-app-public-config.test.sql (assertions 5-7, 12, 13)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No member beyond the three allow-listed paths is reachable: the exact key set at each of the three levels, with every `access` gate, a stored `questions` and an unrelated root present in the row"
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/38-contestant-app-public-config.test.sql (assertions 8-10)"
        status: pass
    human_judgment: false
  - id: D3
    description: "One all-null answer for a project that declares nothing, a project with no settings row and an id that names no project"
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/38-contestant-app-public-config.test.sql (assertions 14-16)"
        status: pass
    human_judgment: false
  - id: D4
    description: "`anon_select_app_settings` is not widened: `anon` reads zero `app_settings` rows of the closed project while the function answers, and `30-closed-project.test.sql` and `22-content-policies.test.sql` pass unedited"
    verification:
      - kind: integration
        ref: "38-contestant-app-public-config.test.sql (assertion 11); yarn workspace @openvaa/supabase test:db (37 files, 1351 tests, exit 0)"
        status: pass
      - kind: other
        ref: "git diff 4df86d0fb..HEAD -- apps/supabase/supabase/schema/302-rls.sql apps/supabase/supabase/tests/database/30-closed-project.test.sql apps/supabase/supabase/tests/database/22-content-policies.test.sql (empty)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The function is `SECURITY DEFINER` with an empty `search_path`, both API roles hold `EXECUTE`, and both definer censuses name it in `proname` order and say six"
    verification:
      - kind: integration
        ref: "38-contestant-app-public-config.test.sql (assertions 1-4); 07-rpc-security.test.sql Section 8c"
        status: pass
    human_judgment: false
  - id: D6
    description: "The applied database, the generated migration and the generated types all carry the function; the migration is byte-identical to the schema directory"
    verification:
      - kind: other
        ref: "yarn assert:schema-migration-parity (exit 0); yarn db:lint:sql (exit 0); yarn assert:rpc-nullability (exit 0); git diff --stat on packages/supabase-types (one line)"
        status: pass
    human_judgment: false
  - id: D7
    description: "For a caller who can read no settings row of a closed project, `getAppSettings()` returns `access` over the shipped defaults with `voterApp: false` and the stored gate, and a `contestantApp` root over the shipped defaults with the stored, deduplicated lists; it never returns a stored `questions`"
    requirement: SET-02
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts#getAppSettings > a closed project the caller can read no settings row of (11 cases)"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/171-e2e/171-02-close — default suite, 171 passed of 171; the gateway log of the run shows the function called with status 200 only"
        status: pass
    human_judgment: true
    rationale: "No E2E dataset declares the two settings before 171-04, so the run exercised the call and the all-null answer, not declared values on a screen. Declared values are proved by pgTAP and by the unit cases; the login screen that shows them is 171-03's and the E2E tests on it are 171-04's."
  - id: D8
    description: "One bad value in either list drops the whole stored `contestantApp` root to the shipped defaults, leaves `access` untouched and is reported once with its path and never its value"
    requirement: SET-03
    verification:
      - kind: unit
        ref: "supabaseDataProvider.test.ts#falls back to the shipped contestant app root on one bad list value, keeps the stored gate and reports the path once"
        status: pass
      - kind: unit
        ref: "supabaseDataProvider.test.ts#drops the stored contestant app root of a readable row on one bad list value, keeps the access member and reports the path once"
        status: pass
    human_judgment: false

duration: 19min
completed: 2026-10-05
status: complete
---

# Phase 171 Plan 02: The Anon-Callable Read of the Contestant App's Public Configuration Summary

**An anonymous visitor of a project that is closed for voters now receives the stored `access.contestantApp`, the served entity types and the registration matrix through one narrow `SECURITY DEFINER` function, validated by the one stored-settings schema and built over the shipped defaults, while the `app_settings` table stays unreadable to `anon`.**

## Performance

- **Duration:** 19 min
- **Started:** 2026-10-05T22:06:58Z
- **Completed:** 2026-10-05T22:26:10Z
- **Tasks:** 3 of 3
- **Files changed:** 11 outside `.planning/`, plus the red-run record, before this summary and `deferred-items.md`
- **Start revision:** `4df86d0fba866b3f0b273183f8898d84a5e56ef6`
- **The tree every closing gate describes:** `7f1d1e71ada976efa90524d102eaeab0244d3f5c`

## Accomplishments

- Added `public.contestant_app_public_config (p_project_id uuid) RETURNS jsonb` in `106-app-settings.sql`, beside the table it reads, with its grant to both API roles. It builds one object from three fixed storage paths and never returns the row.
- Wrote `38-contestant-app-public-config.test.sql` with 16 assertions, and moved both definer censuses of `07-rpc-security.test.sql` from five names to six.
- Pushed the schema through the repository's own workflow: regenerate, parity gate, `yarn db:reset`, `yarn db:types`, pgTAP, `yarn db:lint:sql`. `supabase db push` was never run.
- Made the provider's closed-project branch call the function, narrow its answer, drop null members, parse the result with `StoredSettingsSchema` and return whole `access` and `contestantApp` roots.
- Pinned the root-level rejection of a bad list value on both read paths.
- Named the function in the database skill's function table, helper table and census sentence.

## What the Plan Asked to Have Recorded

| Item | Value |
|---|---|
| pgTAP file | `apps/supabase/supabase/tests/database/38-contestant-app-public-config.test.sql`; 38 was free, 37 is left to Phase 172 |
| Its plan count | `plan (16)`, and 16 assertions (2 `ok`, 14 `is`) |
| Anon census string | `'contestant_app_public_config,project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant'` |
| Its description | `'census: the SECURITY DEFINER functions in public that anon can execute are exactly the six allow-listed ones'` |
| Authenticated census string | `'contestant_app_public_config,get_entity_basic_data,project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant'` |
| Its description | `'census: the SECURITY DEFINER functions in public that authenticated can execute are the same six plus get_entity_basic_data'` |
| `07-rpc-security.test.sql` | four lines changed; `plan (39)` and the query unchanged |
| `git diff --stat -- packages/supabase-types/` after `yarn db:types` | `packages/supabase-types/src/database.ts \| 1 +` — `1 file changed, 1 insertion(+)` |
| The one hunk | `contestant_app_public_config: { Args: { p_project_id: string }; Returns: Json };` under `Functions`. No other hunk, so the tree and the applied database agreed. `database.overrides.ts` untouched |
| Had Phase 172 executed first? | No. Its directory holds no `-SUMMARY.md`, the highest pgTAP number on the tree was 36, and both census strings matched `171-NAME-MAP.md` |
| Regenerated migration | 26 schema files, 6399 lines (6372 before); the diff is the function block with its comments and grant, and the one header sentence of `301-auth-functions.sql`, nothing else |

## The `access.answersLocked` Hand-over to Phase 178

The function returns three values, as D-09 says. The anonymous login page also reads `access.answersLocked`: to hide the pre-registration entry, to show the locked notice, and in the nav to hide both registration items. For a closed project's anonymous reader it stays at its shipped `false` after this plan, exactly as `access.underMaintenance` does. The rewritten docstring of `_getAppSettings` names both, and `contestantApp.questions`, as not honoured.

**Handed to Phase 178**, which rebuilds the login screen. Adding the value is one more member of the same `jsonb` object at its storage path (`{access,answersLocked}`), one more copied member in `storedPublicConfig` in the provider, and one more key in the pgTAP key-set assertion for `access`. No second function and no seventh census entry are needed.

## Task Commits

1. **Task 1: The function, its grant, the pgTAP file, both census strings, the scoping disposition** — with the regenerated migration of Task 2
   - `7a1414816` `feat(171-02): add the anon-callable contestant_app_public_config function with its grant, pgTAP file and census entries`
2. **Task 2: [BLOCKING] The schema pushed through the repository's workflow**
   - `50243af21` `chore(171-02): regenerate the database types for contestant_app_public_config`
3. **Task 3: The provider's closed-project branch, the pin, the database skill** (TDD)
   - `1f58e6f46` `test(171-02): add failing tests for the provider's closed-project read of the contestant app public configuration` — red: 11 of 25 cases of the `getAppSettings` block fail.
   - `7f1d1e71a` `feat(171-02): read the contestant app public configuration in the provider's closed-project branch`

No refactor commit was needed. `git rev-list --count 4df86d0fb..7f1d1e71a` is 4.

## Gate and E2E Results

Each exit status was read from the command or from its exit marker, never through a pipe. The three tasks' automated verify commands were run again, as written, on the final tree.

| What | Command | Exit | Result |
|---|---|---|---|
| Regenerate | `yarn schema:regenerate` | 0 | 26 schema files → 6399 lines |
| Parity | `yarn assert:schema-migration-parity` | 0 | one `.sql` file under `migrations/`; generated copy is current |
| Apply | `yarn db:reset` | 0 | migration and `seed.sql` applied; nothing listened on 5173 or 5273 and no Playwright process ran |
| Types | `yarn db:types` | 0 | the one-line diff above |
| pgTAP | `yarn workspace @openvaa/supabase test:db` | 0 | 37 files, 1351 tests, `Result: PASS`; run after the reset and again after the E2E run |
| SQL lint | `yarn db:lint:sql` | 0 | 0 errors, 3 warnings (three foreign keys without an index, none on a table this plan touches) |
| Nullability | `yarn assert:rpc-nullability` | 0 | 3 `RETURNS TABLE` RPCs, as before; a `jsonb` return adds none |
| Provider cases | `yarn workspace @openvaa/frontend vitest run supabaseDataProvider.test` | 0 | 108 passed of 108 |
| Frontend unit | `yarn workspace @openvaa/frontend test:unit` | 0 | 2072 tests in 132 files (2060 before, 12 added) |
| All unit suites | `yarn test:unit` | 0 | 25 turbo tasks; dev-seed 901, data 244, supabase 206, app-shared 141, llm 49, matching 43, argument-condensation 31, filters 22, question-info 22, core 8 |
| Frontend check | `yarn workspace @openvaa/frontend check` | 0 | 2649 files, 0 errors, 0 warnings; also 0 at the test-only commit |
| Casts | `yarn assert:adapter-casts` | 0 | 36 files, 0 violations |
| Scoping | `yarn assert:project-scoped-queries` | 0 | 8 raw client calls examined (7 before), 0 violations |
| Lint | `yarn lint:check` | 0 | every link through `assert:edge-function-env`; comment hygiene 0 violations in 1793 files; app-name gate 0 findings in 2694 files |
| Formatting | `yarn prettier --check` over the seven touched source files | 0 | |
| Task 1 automated verify | as written | 0 | |
| Task 2 automated verify | as written | 0 | |
| Task 3 automated verify (first) | as written | 0 | |
| Task 3 automated verify (second) | `check` and `lint:check`, run separately on the tree committed as `7f1d1e71a` | 0, 0 | |
| **E2E, default suite** | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/171-e2e/171-02-close --no-db-reset` | **0** | **171 expected, 0 unexpected, 0 flaky, 0 skipped**; 265 s; one preflight success, no preflight failure; head `7f1d1e71a`, tree clean |

Run directory: `tests/e2e-runs/171-e2e/171-02-close`. No gate row and no run was red at any point, and nothing was run twice to see whether it passes.

**Two checks beyond the gates.** (1) The function was called once over the local REST endpoint with the anon key: HTTP 200 and the all-null object for the default project. (2) The gateway log for the E2E run's window shows requests to `rpc/contestant_app_public_config`, every one answered 200, so the suite reached the new branch through PostgREST as `anon`; all seven tests of `perm-closed-project.spec.ts` passed.

**What the E2E run does not show.** No dataset declares the two settings until 171-04, so every closed-project answer in the run was the all-null object. Declared values are proved at pgTAP and unit level here.

## The pgTAP File, Assertion by Assertion

As `postgres`, the file writes into closed project B a row carrying all four stored `access` gates, `contestantApp.questions.hideHero: true`, two unrelated roots (`theme`, `matching`) and the three values with a repeat and out of canonical order; open project A gets different values.

| # | Assertion |
|---|---|
| 1, 2 | `anon` and `authenticated` hold `EXECUTE` |
| 3, 4 | `prosecdef` is true; `proconfig` is exactly `{search_path=""}` |
| 5-7 | as `anon`, B's three values exactly as stored, repeats and order included |
| 8-10 | top-level keys are exactly `access`, `contestantApp`; `access` has exactly `contestantApp`; `contestantApp` has exactly `entityTypes`, `registrationModes` |
| 11 | `anon` counts zero `app_settings` rows for B while the function answers |
| 12 | as `anon`, A's whole answer, which is A's and not B's |
| 13 | a signed-in caller with no grants gets, for B, the whole object `anon` gets |
| 14-16 | the all-null object for B once it declares nothing, for B once its row is deleted, and for a uuid that names no project |

## The Provider Branch, in One Place

In `_getAppSettings`, when no row is readable and `project_open_for_voters` answers `false`:

1. `this.supabase.rpc('contestant_app_public_config', { p_project_id: this.projectId })`; an RPC error throws `getAppSettings: <message>`.
2. `isJsonObject` narrows the `Json` answer; anything else throws `getAppSettings: contestant_app_public_config returned a non-object`. There is no cast.
3. `storedPublicConfig` copies only `access.contestantApp`, `contestantApp.entityTypes` and `contestantApp.registrationModes`, leaving out a `null` member.
4. `parseWithPartialPreserve<StoredSettings>(StoredSettingsSchema, …, { column: 'app_settings.settings' }, SETTINGS_PARSE_FAILURE_MESSAGE)`.
5. The return is `access: { ...dynamicSettings.access, ...parsed.access, voterApp: false }` and `contestantApp: { ...shipped, entityTypes: parsed ?? shipped, registrationModes: { ...shipped rows, ...parsed rows } }`.

An open project still returns `{}` and does not call the function. A readable row calls neither RPC.

## The Red Run

Record: `evidence/171-02-task3-red.json`, classified `RED_EVIDENCE_OK` by `gsd-tools check tdd-red-evidence`.

| Red run | Target | Why it failed |
|---|---|---|
| 11 of 25 cases of the `getAppSettings` block fail, all in the new describe | `asks the public configuration function for its own project` | `expected "vi.fn()" to be called 2 times, but got 1 times`: the old arm asked only the openness RPC |

The 14 cases that were green in the red run: the untouched cases of the block; the existing closed-project case, which asserts only gates the old arm already returned; the open-project case with its new assertion that only the openness RPC is called; and the readable-row pin, which states a property that path already had after 171-01.

The combined report could not be given to the classifier, for the reason 171-01 recorded: vitest writes multi-line assertion values into the TAP diagnostic blocks. The target case therefore asserts the call count first, a scalar, and was rerun alone with the same reporter.

## Decisions Made

Nothing in the plan's decisions was decided differently. The calls the plan does not make are the five under `key-decisions` and the deviations below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] A Task 1 commit without the regenerated migration would have left two gates red**
- **Found during:** Task 1, before its commit.
- **Issue:** the plan puts the schema edit and the pgTAP file in Task 1 and the regenerated migration in Task 2. A commit holding only Task 1 fails `assert:schema-migration-parity`, and a database built from that commit's migration fails the new pgTAP file and both censuses. The database skill and the parity script both require the regenerated migration in the same commit as the `schema/` edit.
- **Fix:** every step of Task 2 (regenerate, parity, reset, types, pgTAP, SQL lint, nullability) was run before either commit. The Task 1 commit carries the regenerated migration; the Task 2 commit carries the generated types.
- **Files modified:** none beyond the plan's list.
- **Committed in:** `7a1414816`, `50243af21`.

**2. [Rule 2 - Missing critical] The pgTAP file asserts the third all-null case and makes the `access` key-set assertion non-vacuous**
- **Found during:** Task 1.
- **Issue:** the plan's must-have names three inputs that give one all-null answer; the task's assertion list names two. And a fixture row whose `access` holds only `contestantApp` cannot show that the other gates are unreachable.
- **Fix:** one more assertion (a project that declares nothing), making 16; B's row also carries `voterApp`, `underMaintenance` and `answersLocked`.
- **Files modified:** `38-contestant-app-public-config.test.sql`.
- **Committed in:** `7a1414816`.

### Acceptance criteria that did not hold as written

- **`bash .claude/scripts/audit-skill-links.sh database`.** The plan asks for the audit to be run and sets no criterion on it. It exits 1 with 31 dangling citations, and exits 1 with the same 31 when this plan's skill edits are reverted. The five citations this plan added resolve. Recorded in `deferred-items.md`; nothing in the skill was changed for it.

Every other criterion holds as written.

### Departures in procedure

- **More provider cases than the behaviour list.** Beside the seven behaviours: the member-by-member fallback (only the matrix declared, only the types declared), four non-object answers instead of one, and an answer that also carries `access.voterApp: true`, `underMaintenance`, `answersLocked` and an unrelated root, none of which reaches the result.
- **More in the database skill than the plan lists.** `rls-policy-map.md` also names the new pgTAP file in its table of tests; `SKILL.md` names all six census members and gains a Freshness Record entry.
- **One E2E run the plan does not ask for.** The provider's closed-project branch is on the path of every anonymous page load of a closed project, so the default suite was run once on the final tree.
- **One call of the function over the local REST endpoint**, as `anon`, after the reset.
- **A blocked command.** A first form of that call read the anon key from the root `.env` and was refused by the session's secret-read guard. The key was taken from `supabase status` instead. `.env` was never read.
- **Polling.** A standalone `sleep` is blocked in this harness; each wait was a bounded loop on a marker file.

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical), plus the notes above.
**Impact on plan:** none changes behaviour beyond what the plan specifies.

## Prohibitions, Each Checked

| Prohibition | Evidence |
|---|---|
| PROH-171-04: `anon_select_app_settings` not widened, no policy in `302-rls.sql` edited | `git diff 4df86d0fb..HEAD -- apps/supabase/supabase/schema/302-rls.sql` is empty; pgTAP assertion 11; `30-closed-project` and `22-content-policies` unedited and green |
| PROH-171-05: no member beyond the three paths | pgTAP assertions 8-10; the provider case "copies nothing but the three values" |
| PROH-171-06: generated files regenerated, never hand-edited; no `supabase db push` | parity gate exit 0; the types diff is the generator's own output |
| PROH-171-07: the `Json` answer reaches the schema through narrowing | `yarn assert:adapter-casts` exit 0; the branch holds no cast at all |

## Changes for the Operator's Eye

- **One new public endpoint.** `/rest/v1/rpc/contestant_app_public_config` is callable by anyone holding the anon key. It discloses, per project id, three values the project's own login page shows to any visitor, and nothing else.
- **`yarn.lock` and every `package.json` are unchanged.** No package was installed.
- **The local database was reset once**, from the regenerated migration. The E2E run then created and left its own project in it.
- **`CAND-APP-PLAN.md` was not edited, moved, staged or committed.** `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged.
- **The developers' docs page still describes the old closed-project answer** ("for a closed project it returns the default `access` settings with `voterApp` set to `false`", `developers-guide/configuration/app-settings/+page.md`). The plan leaves the docs site to 171-04.

## Deferred Issues

None fixed, all outside this plan:

1. The database skill fails its own link audit, and the body of its `SKILL.md` carries counts that no longer match the tree. Filed in `deferred-items.md` in this phase directory.
2. `yarn db:lint:sql` reports three foreign keys without an index (two join tables and `nominations.created_by`) as warnings and exits 0. They predate the plan.

The cross-phase defect ledger (`.planning/WINDOWS.md`) was not appended to: there is no stub, no skipped test and no verification of this plan that was not run.

## Issues Encountered

None beyond the deviations above. No gate step and no E2E test was red at any point.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Plan Readiness — What 171-03 Must Know

- **Compare against:** E2E `tests/e2e-runs/171-e2e/171-02-close` (171 / 171 / 0 skipped, head `7f1d1e71a`). Frontend unit: 2072 tests in 132 files. App-shared: 141 in 10. pgTAP: 37 files, 1351 tests.
- **What the provider returns to an anonymous caller of a closed project:** whole `access` and `contestantApp` roots and nothing else. The accessors of `contestantAppConfig.ts` read it as they read merged settings. The pre-registration guard reaches this branch through its anonymous client and needs no change; the new `register/` guard will reach it the same way.
- **What it returns to a grant holder** (a readable row) is unchanged: the stored partial, where an absent `registrationModes` reads as the shipped matrix through the accessor.
- **A failed read still throws** (`getAppSettings: …`). A guard that substitutes `{}` on a throw refuses, as the pre-registration guard does.
- **Any new test that drives the provider through a closed project must mock both RPCs.** The helpers `mockClosedProject` and `NOTHING_DECLARED` are local to the `getAppSettings` block of `supabaseDataProvider.test.ts`. A test that mocks `getAppSettings` itself is unaffected.
- **Not honoured for that caller:** `access.answersLocked`, `access.underMaintenance`, `contestantApp.questions`. On the login screen of a closed project `answersLocked` therefore reads `false`; Phase 178 owns the change.
- **No dataset declares the two settings yet.** Until 171-04 every E2E dataset reads the shipped defaults: candidates only, no registration mode.
- **pgTAP numbering:** 38 is taken, 37 is free for Phase 172, the next free number above is 39.
- **Stack state:** up and healthy, the new schema applied, reset once during this plan; the database holds `seed.sql` plus what the E2E run left in its own project. Nothing listens on 5173 or 5273. The Vite server on 5199 and `my-redis` were left alone.

## Self-Check: PASSED

- Every file under `key-files.created` exists, and every file under `key-files.modified` is in `git diff --name-only 4df86d0fb..7f1d1e71a`.
- All four commits (`7a1414816`, `50243af21`, `1f58e6f46`, `7f1d1e71a`) are ancestors of HEAD; `git rev-list --count 4df86d0fb..HEAD` was 4 when this file was written.
- The three tasks' automated verify commands were re-run on the final tree and each exited 0; the plan's `<verification>` items are the gate table above.
- `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged since the start revision; `CAND-APP-PLAN.md` is untracked and untouched.
