---
phase: 176-contestant-home-task-state-nominations-view
plan: 05
subsystem: api
tags: [supabase-adapter, rpc, zod, nominations, data-writer, contestant, integration-test, e2e]

requires:
  - phase: 176-contestant-home-task-state-nominations-view
    provides: "plan 176-02 — public.get_entity_nominations and its generated type; plan 176-01 — the drivers, 176-BASE and 176-BASELINE; plan 176-04 — the copy the profile block's description reads"
provides:
  - "parseEntityNominations(raw) and EntityNominationRow in lib/api/adapters/supabase/utils/entityNominations.ts"
  - "EntityNomination and EntityNominationParent in lib/api/base/dataWriter.type.ts; ContestantUserData<true>['nominations'] is Array<EntityNomination>"
  - "_getEntityUserData reads nominations through get_entity_nominations; the nominations table select is gone"
  - "the function's row in PROJECT_SCOPED_RPCS and the parse module's row in GUARDED_SOURCES"
  - "four integration cases whose titles begin `nominations:`"
  - "the full run 176-05-close, the first link of the phase's chain of full runs"
affects: [176-06, 176-10, 176-12, 176-13, 176-19]

actuals:
  tokens: 17610 # chars/4 over git diff 6ff741ad0..98d737bb3 (70438 chars)
  tasks: 3
  commits: 5 # MEASURED: git rev-list --count 6ff741ad0..HEAD when this file was written; the commit of this file follows
plan_head_before: 6ff741ad0cfcf78be8ddb7110e479a2c9a921541
plan_head_after: 98d737bb3bf39bf82f431ab8c6c5cd46273febee

tech-stack:
  added: []
  patterns:
    - "A definer read with three outcomes is narrowed in three: null is a refusal and is returned as null, an array is the list, anything else throws naming the refused paths"
    - "A browser-observable change that a plan calls behaviour-preserving is still run uncommitted through the wrapper before its commit"

key-files:
  created:
    - apps/frontend/src/lib/api/adapters/supabase/utils/entityNominations.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/entityNominations.test.ts
  modified:
    - apps/frontend/src/lib/api/base/dataWriter.type.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts
    - scripts/assert-project-scoped-queries.mjs
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts
    - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+layout.server.ts"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/layout.server.test.ts"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/layout.tracking.test.ts"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+layout.svelte"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/profile/+page.svelte"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/profile/page.svelte.test.ts"

key-decisions:
  - "Task 2 is one commit, not two: the type and the writer do not type-check without the readers"
  - "The uncommitted change was run through the whole E2E suite before its commit, which the plan does not order"
  - "The parse module is named in the scoped-query guard's source list, which the plan did not foresee"
  - "custom data is typed as a free-form object or null, and a stored value that is not an object reads as null"

requirements-completed: [] # NOM-02 is met when the view exists (plan 176-12)

duration: about 33 min
completed: 2026-10-09
status: complete
---

# Phase 176 Plan 05: One Read of an Entity's Nominations, End to End — Summary

**The Contestant App now reads an entity's nominations through `get_entity_nominations` alone, as a flat list of a contestant-side type with the names, the state and the parent on each element; a refusal, an empty list and a broken answer are three outcomes at the parse and at the writer; the read works over PostgREST for a candidate and for an organization; and the full E2E suite is at its baseline, 268 of 268 in 110 projects, on the uncommitted tree and again on the committed one.**

Everything below was measured in this session unless it says "read" or "inferred".

## Read this first

1. All three tasks are done. All three `<automated>` blocks exit **0**, run byte for byte from the plan.
2. **The closing run `176-05-close` passes the plan's verdict**: 268 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, 110 projects, every project at its baseline total. No void run, no red run, nothing retried.
3. **A finding for plans 176-06 and 176-12, not acted on here:** the entity-level load passes no `locale` to the entity read, so the names in the list it returns are in the adapter's default locale (`en`), whatever language the user reads in. Nothing a user sees reads those names yet. Its own heading is below.
4. **For three commits the lint chain was red.** `scripts/assert-project-scoped-queries.mjs` requires every source under the adapter directory to be in its source list; the new parse module was not in it from `595df3018` until `c23d8ce93` added it (deviation 1).
5. Task 2 is one commit instead of two, as the plan allows (deviation 2). One full E2E run more than the plan orders was made, on the uncommitted tree (deviation 3).

## Performance

- **Duration:** about 33 min (01:14Z → 01:47Z)
- **Tasks:** 3 of 3
- **Files:** 2 created, 14 modified — the sixteen the plan lists, and no other
- **Power:** AC, 100 %, before each long run

## Task Commits

| # | Commit | Subject | Task |
|---|---|---|---|
| 1 | `595df3018` | `test(176-05): narrowing the answer of get_entity_nominations` | 1 (red) |
| 2 | `fab21508d` | `feat(176-05): the answer of get_entity_nominations is narrowed, and a refusal is not an empty list` | 1 (green) |
| 3 | `81ba18e5e` | `test(176-05): the writer reads an entity's nominations through one function` | 2 (red) |
| 4 | `c23d8ce93` | `feat(176-05): an entity's nominations are read through get_entity_nominations, as a flat list of their own type` | 2 (green) |
| 5 | `98d737bb3` | `test(176-05): an entity's nominations through the writer, against the running stack` | 3 |

Each was made by pathspec on `feat/entity-signup-multi-grant`. No commit of another agent lies between them.

## Each verify, with its real exit status

The three blocks were written to script files by a script that reads the plan file. Evidence: `tests/e2e-runs/176-unit/176-05-t<N>-verify.sh` / `.log` / `.exit` / `.head`.

| Verify | Head | Exit |
|---|---|---|
| Task 1, as written | `fab21508d` | **0** |
| Task 2, as written (in the background; the integration test file was modified and uncommitted in the working tree, which no stage of the block reads for cleanliness) | `c23d8ce93` | **0** |
| Task 3, as written | `98d737bb3` | **0** |
| Task 1, as written, again at this plan's last commit | `98d737bb3` | **0** |
| Task 2, as written, again at this plan's last commit, on a clean tree | `98d737bb3` | **0** |
| `176-verdict.mjs gates 176-05-close --rows …` | `98d737bb3` | **0** — PASS |
| `176-verdict.mjs e2e 176-05-close --same-projects-as <baseline> …` | `98d737bb3` | **0** — PASS |
| `176-verdict.mjs scope` | `98d737bb3` | 0 |
| `176-verdict.mjs hygiene` | `98d737bb3` | 0 — 0 hits |

## Red and green

| File | Red: head, total, failed | Green: head, total, failed |
|---|---|---|
| `entityNominations.test.ts` | `595df3018` · 18 · **17** | `fab21508d` · 18 · **0** |
| `supabaseDataWriter.test.ts` | `81ba18e5e` · 163 · **15** | `c23d8ce93` · 163 · **0** |

Every red failure is an `AssertionError` or a vitest `expect` error on an expectation; none is an import or a type error at run time. The one parse case that passes on the stub is the empty array. The writer's file went from 149 cases to 163.

Frontend unit suite at the closing head: 185 files passed and 1 skipped; **3370 passed**, 20 skipped (3390). It was 3338 at the last plan's head: 18 parse cases and 14 more writer cases. The four more skipped are the new integration cases, which skip where no stack is declared.

## The type, as declared

In `apps/frontend/src/lib/api/base/dataWriter.type.ts`:

```ts
export type EntityNominationParent = {
  entityType: EntityType; // from @openvaa/data
  name: string;           // one locale; empty when no locale holds a name
  shortName?: string;     // one locale; left out when it has none
};

export type EntityNomination = {
  id: Id;
  electionId: Id;
  electionName: string;     // one locale; empty when no locale holds a name
  constituencyId: Id;
  constituencyName: string; // one locale; empty when no locale holds a name
  electionRound: number;    // 1 when none is stored
  electionSymbol: string;   // empty when it has none
  confirmed: boolean;
  customData: Record<string, unknown> | null; // as stored; null when none, or when the stored value is not an object
  parent?: EntityNominationParent;            // left out for a nomination with no parent
};

// ContestantUserData<TNominations>:
nominations: TNominations extends true ? Array<EntityNomination> : undefined;
```

Each member has a TSDoc line in the file. The import of `DPDataType` is gone from this file: nothing else in it used the provider's types. `DPDataType` itself was not opened.

**The provider's type and its readers are untouched.** `git diff --stat "$(cat $P/176-BASE)" HEAD -- apps/frontend/src/lib/api/base/dataTypes.ts 'apps/frontend/src/routes/(voters)' apps/frontend/src/lib/admin` prints nothing. `git grep -F "DPDataType['nominations']" -- apps/frontend/src` still finds its six users: `lib/admin/utils/loadElectionData.ts`, the two `_getNominationData` adapters and their abstract declaration, and the two voter layouts.

## The parse module

`apps/frontend/src/lib/api/adapters/supabase/utils/entityNominations.ts` exports `EntityNominationRowSchema`, `EntityNominationRow` (its inferred type) and:

```ts
export function parseEntityNominations(raw: Json | undefined): Array<EntityNominationRow> | null
```

The schema is one element in the database's column names: `id`, `election_id`, `constituency_id` non-empty strings; `election_name`, `constituency_name`, `custom_data` kept as JSON; `election_round` an integer or null; `election_symbol` a string or null; `confirmed` a boolean; `parent` null or `{ entity_type, name, short_name }`, with `entity_type` one of the database's four entity types (read from the generated `Constants`) and both names kept as JSON. Unknown members are dropped, in an element and in its parent. A missing member is refused, the `parent` member included: the function always states all ten.

## The three outcomes of the read, and where each is decided

| The function answers | At the parse | At the writer | At the entity-level load |
|---|---|---|---|
| `null` (refused) | returns `null` | `_getEntityUserData` returns `undefined`, as for a missing entity row | `if (!userData) redirect(307, appRoot)` |
| an array, empty or not | returns the rows | the entity with a list, empty or not | an empty list is still signed out with `candidateNoNomination` (until plan 176-06) |
| anything else, `undefined` included | throws `The answer of get_entity_nominations did not match its schema at: <paths>` | rejects | `signOutToLogin(…, 'loginFailed')` |
| a call error | — | throws `Failed to load nominations: <message>` | the same |

No stored value is in a thrown message: one parse case and one writer case plant a marker value and assert its absence.

## The writer

`_getEntityUserData`'s signature is unchanged. With `loadNominations`, after the entity read, it calls

```ts
this.supabase.rpc('get_entity_nominations', { p_project_id: this.projectId, p_entity_type: served, p_entity_id: entityRow.id })
```

narrows the answer with `parseEntityNominations`, and maps each row with a module-level `entityNominationOf(row, locale, defaultLocale)`: the two names and the parent's two through `localizeRow`, as `_getUserEntities` does. The table select, its `{ nominations, entities }` wrapper and the cast on it are deleted. When the entity read answers with no row, no nominations call is made. Without `loadNominations` no nominations call is made and `nominations` is `undefined`.

The invariant of the plan's delta block is held by the case `issues no query on the nominations table, or on any table, when it loads an entity with its nominations`.

## The guard

`scripts/assert-project-scoped-queries.mjs`: `get_entity_nominations: 'requires p_project_id'` in `PROJECT_SCOPED_RPCS`, a paragraph above the map in its neighbours' form, and `utils/entityNominations.ts` in `GUARDED_SOURCES` (deviation 1). The guard's line at the closing head: 19 guarded sources, 19 adapter sources on disk, 11 raw client calls examined, 0 violations.

## Every reader, as derived

Derived with `git grep -n -E "nominations\.(nominations|entities)|\.nominations\?\.nominations" -- apps/frontend/src` and `git grep -n -F "ContestantUserData<" -- apps/frontend/src` at `fab21508d`; the first search finds nothing at the closing head.

| Reader | Change |
|---|---|
| `contestantContext.svelte.ts`, the two election effects | `current.nominations.map(…)` in place of `current.nominations.nominations.map(…)`. They still read the store's `current` |
| `$ENTITY/+layout.server.ts`, stage 4 | `const { nominations } = userData;`. The sign-out of an empty list is unchanged. The header's line for stage 3 now says a refused nominations read leads to the app root too |
| `$ENTITY/+layout.svelte` | `validity` returns `nominations: ud.nominations`; the `entities` member and the `dr.provideEntityData(snapshot.entities)` call are gone (the collection was always `{}`, which `provideData` returns on at once); the component doc and the comment beside the data-root update say what the layout does now |
| `$ENTITY/profile/+page.svelte` | the block iterates `userData.current?.nominations ?? []`; `parseNomination` takes an `EntityNomination`; the import follows; three comments that the new list made false were reworded (deviation 4). Its lookups on the data root, its `catch` with the log line, `organization: undefined` and `unconfirmed: false` are as they were |
| `universalDataWriter.ts`, `app.d.ts`, `contestantUserDataState.svelte.ts` and its `.type.ts` | read: they name `ContestantUserData<…>` and never the nominations' shape; not edited |
| fixtures | `entityDataFor` (`layout.server.test.ts`), `ENTITY_DATA` (`layout.tracking.test.ts`), the context test's `FakeUserData` and its builder, the store test's `makeUserData` (its cast is gone), and the profile page test's two builders now build the flat list |

## The integration cases, and what the first PostgREST call showed

`supabaseDataWriter.integration.test.ts`, in the first describe. The fixture, added to its `beforeAll` under the run's own identifiers: an election (English and Finnish names) and a constituency (English only) in the default project, a confirmed nomination of the file's confirmed organization with custom data, and a nomination of candidate A under it with the symbol `7`. The teardown removes the two nominations (the child first), the election and the constituency, and fails when one is left.

| Case | Outcome |
|---|---|
| `nominations: a candidate's editor reads its own nominations, with the party it stands for` | passed — one element, compared whole: the election's Finnish name, the constituency's English name by fallback, round 1, symbol `7`, `confirmed: false`, `customData: null`, `parent: { entityType: 'organization', name: <the Finnish name>, shortName: 'WIC' }` |
| `nominations: an organization's editor reads its own nominations` | passed — one element, `confirmed: true`, the custom data carried, an empty symbol, no `parent` member |
| `nominations: an entity with no nomination has an empty list` | passed — the entity returned, the list `[]` |
| `nominations: another user's entity is not read` | passed — the writer resolves `undefined` for another candidate and for the organization whose nomination the caller's own stands under |

**What the first call over PostgREST showed.** The last case also calls the function through the editor's own client, past the writer: for an entity the caller does not edit, and for its own parent organization, the client receives `data: null` with `error: null`; for its own entity an array. So a refusal arrives as a JSON `null`, not as an error and not as an empty body, which is what the parse and the writer were built on. The whole file: 20 passed of 20, on the working tree before the writer's commit and again in the gate run.

Note for the case "another user's entity": through the writer it is the entity read that answers with no row first, so the writer never reaches the nominations call there. The function's own refusal is what the direct calls show.

## Gates and runs

### The gate rows — the first through this phase's drivers

`tests/e2e-runs/176-gates/176-05-close`, head `98d737bb3`, started 01:35:28Z, ended 01:38:22Z, `TURBO_FORCE: true`, no Sleep entry in its window. Verdict: PASS.

| Row | Exit | Seconds | Numbers |
|---|---|---|---|
| typecheck | 0 | 19 | — |
| lint | 0 | 44 | — |
| integration | 0 | 3 | 20 passed of 20; the four `nominations:` cases each passed |
| unit | 0 | 67 | frontend 3370 passed, 20 skipped; dev-seed 1037; supabase 462; data 244; app-shared 148; llm 49; matching 43; argument-condensation 31; filters 22; question-info 22; core 8; and one run of 102 in 7 files |
| check-frontend | 0 | 8 | `COMPLETED 2798 FILES 0 ERRORS 0 WARNINGS` |
| build | 0 | 15 | — |
| format | 0 | 18 | — |

No row resets the database, and none was reset by this plan. This is the first typecheck, lint, svelte-check and whole unit suite over plans 176-02, 176-03 and 176-04: the regenerated types hold under the frontend's typecheck.

### The pre-commit run (not ordered by the plan)

`tests/e2e-runs/176-e2e/176-05-precommit`, directly through the wrapper, of head `81ba18e5e` with Task 2's twelve files and the integration test file uncommitted. Started 01:26:10Z, ended 01:33:33Z. Wrapper exit 0, no void marker, 1 preflight success and 0 failures. **268 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, 110 projects; every project's total equal to the baseline's** (compared with a script of mine over the two `summary.json` files, not with the verdict script, whose `control` form needs a `--project`). Docker VM free before it: 19.46 GiB, read and nothing pruned. The working tree's difference from HEAD as the run ran it is kept as `176-05-precommit.diff` beside the run.

### The closing run — the first full run of the phase

`tests/e2e-runs/176-e2e/176-05-close`, through `176-e2e.sh`, head `98d737bb3`. Started 01:38:36Z, ended 01:45:53Z. Wrapper exit 0, Playwright exit 0, no void marker, no Sleep entry in its window. Docker VM free before it: **19.37 GiB** (after the driver's build-cache prune); 19.33 GiB after. Bank auth unset, as in the baseline.

```
counts: total 268, passed 268, failed 0, flaky 0, skipped 0, didNotRun 0; 110 project(s)
scope: the full default suite
not stale: head 98d737bb3 is tree-equal to HEAD outside .planning/
project contestant-journey: 1/1 passed
project contestant-a11y-scan: 22/22 passed
project contestant-entity-selection: 8/8 passed
project perm-organization-editing: 46/46 passed
project perm-localisation-positive: 2/2 passed
compared with: tests/e2e-runs/175-e2e/175-13-final
per project: 110 compared, 0 not as expected
176-verdict e2e 176-05-close: PASS
```

It is the first browser proof of plans 176-02 to 176-05 together. The reworded `basicInfo.requiredInfo` sentence and the re-pointed nominations description turned no test red.

**The profile's nominations block renders what it rendered.** The dev-server log of each of the two runs holds the line `Error formatting nomination` 47 times, the number Phase 175's closing run holds: the block still formats before the data root has its elections, exactly as often.

## Deviations from Plan

### 1. [Rule 3 — blocking] The parse module had to be named in the scoped-query guard, and the lint chain was red until it was

- **Found during:** Task 2, step 3, on the first run of `yarn assert:project-scoped-queries`.
- **Issue:** the guard's check 5 fails on any source under the adapter directory that is in neither `GUARDED_SOURCES` nor `DEFERRED_SOURCES`. The plan and the pattern map name the RPC's row and not this list. `packages/dev-seed/tests/projectScopingGate.test.ts` asserts the same from outside.
- **Fix:** `utils/entityNominations.ts` added to `GUARDED_SOURCES`, in `c23d8ce93` with the RPC's row.
- **What it left:** at `595df3018`, `fab21508d` and `81ba18e5e` the guard — a link of `yarn lint:check` — exits 1 (measured on the working tree before the entry was added), and the dev-seed spec is red there too (inferred from its text; run only after the fix: 121 passed). Task 1's verify does not run that guard, so it exited 0. No E2E test reads the guard.

### 2. [The plan's allowance] Task 2 is one commit, not two

The type and the writer were not committed apart from the readers: with `nominations` an array, `current.nominations.nominations` in the context does not type-check (read, not measured on a partial tree). The one commit carries the first of the two subjects.

### 3. A full E2E run of the uncommitted tree before Task 2's commit

The plan calls its commits behaviour-preserving and orders none. The execution rules keep a change to a load, a layout and a page in the working tree until a run of that tree has passed, and this plan's change is the first call of the function from the application. I ran the whole suite through the wrapper first (above) and ran the integration cases on the same uncommitted tree, then committed. Cost: one run of about seven minutes.

### 4. [CLAUDE.md — comment hygiene] Three comments of the profile page were reworded, beyond the two lines the plan names

The comment above the block and the one inside `parseNomination` said the nominations are "raw partial data" that carry neither a parent nor a state; both are false of the new list. They and the function's doc line now describe the code as it is. No behaviour changed: the block still shows no parent and still says "confirmed" for every nomination. The unused import of `AnyNominationVariantPublicData` went with the parameter type.

### 5. The red commit of the writer's test does not type-check alone

`81ba18e5e` holds assertions that read `result?.nominations` as a list, which the type gives from `c23d8ce93` on (read, not measured). The plan orders that test committed before the type. Vitest does not type-check, so the red report is of expectations.

### 6. Cases beyond the plan's `<behavior>`

Parse: a parent of each of the four entity types; a round that is not stored and a parent with no short name; a parent of a type the database does not have; an element without its `parent` member; every refused path of one answer named. Writer: the order kept; no short name stated for a parent that stores none; an answer that is not a list; no nominations call when the entity read answers with no row; `loadNominations` left out as well as false. Integration: the direct calls of the function in the fourth case.

### 7. A removal the harness refused, and one that ran on nothing

I began two background launches with `rm -f` of the launch's own `.exit` marker. The first ran before the marker had ever been written, so it removed nothing. The second was refused by the harness's safety check and was not attempted again in any form; every later marker has a name of its own. Nothing under `tests/e2e-runs/` was deleted.

### 8. HEAD is on `feat/entity-signup-multi-grant`

The branch the orchestrator named for this checkout, not a per-agent branch.

**Total:** one blocking fix, one allowance taken, one run added, one hygiene correction, four recorded differences. No prohibition was broken: `DPDataType['nominations']`, the voter routes and the admin directory are byte-equal to the base commit; the profile block keeps its lookups and its log; the sign-out stays.

## Finding for plans 176-06 and 176-12: the list's names are in the adapter's default locale

- `$ENTITY/+layout.server.ts` calls `dataWriter.getEntityUserData({ type: listed.type, id: listed.id, loadNominations: true })` with no `locale`, on a writer built by `createDataWriter({ fetch, locals })`, which sets no locale either.
- `_getEntityUserData` reads `locale ?? this.defaultLocale`, and the mixin's default is `'en'`. So `electionName`, `constituencyName` and the parent's `name` and `shortName` in the page data are the English entries, or empty where a row has none, whatever language the user reads in. The same has always been true of an organization's `entity.name` from this read.
- Nothing shown to a user reads those four names yet: the profile block resolves its names on the data root. **The nominations view of plan 176-12 will read them.** For its cards to be in the user's language the load has to pass `locale: lang` (it already holds `lang`), which also changes the locale of `entity.name` in the page data and in the store.
- Not changed here: it is outside this plan's files' stated changes and it alters what a later page shows. The writer itself is correct for a given locale: the unit cases and the first integration case read in Finnish with the default locale as fallback.
- No plan of the phase names a locale for this read (searched plans 06, 08, 10 and 12 by string).

## For plan 176-06

- The load reads the list in stage 4: `const { nominations } = userData;`, then the election and constituency ids, then `if (!electionId.length || !constituencyId.length) return await signOutToLogin(locals, lang, 'candidateNoNomination');`. That line is the sign-out to remove.
- A refused nominations read never reaches stage 4: the writer resolves `undefined` and the load redirects to the app root at `if (!userData)`.
- `page.data.contestantUserData.nominations` is `Array<EntityNomination>`; `hasNomination` of plan 176-03 takes it as it is.
- The store's `reloadEntityData` reads with `loadNominations: false` and replaces the entity alone, so the list in the store is the one `init` was given.
- The debug record's caution stands: `userData.current` is a JSON clone, replaced whenever a draft or a staged property changes and once more under the answers lock, so its `nominations` array is a new array each time. The two election effects still read it.
- The entity layout no longer calls `provideEntityData`; it gives the data root the questions alone.
- The locale finding above.

## For plan 176-10

- The profile block is still rendered and still reads `userData.current?.nominations`; `contestant-profile-nominations` and the `nomination-constituency` field are in the DOM as before, and the block's cards still say "confirmed" whatever the nomination's state.

## For plan 176-12

- The members a card renders: `electionName`, `constituencyName`, `electionSymbol` (an empty string when none), `confirmed`, and `parent?.name`, `parent?.shortName`, `parent?.entityType`. `electionRound` is always a number. Names are empty strings, never `undefined`, when no locale holds one.
- `customData` is `Record<string, unknown> | null`: `requestedParentOrganization` is carried as stored and has to be narrowed to a string where it is read.
- `parent` is absent, not `null`, for a nomination with none; the store's JSON clone keeps that.
- The order is the function's: `sort_order` nulls last, then `id`.
- The locale finding above.

## For plan 176-13

- When the block goes, `EntityNomination` loses its last reader in the profile page; the import line there holds `EditableEntityProps` beside it.
- The line `Error formatting nomination` was logged 47 times in each full run of this plan, as in the baseline.

## For plan 176-19: what this plan made false or left incomplete

Not edited here; found by reading the files this plan touched, not by a search of the docs site.

- The guard's own counts in any document that states them: 19 guarded sources (was 18).
- `apps/docs` and the database skill describe the Contestant App's reads; the application now calls a third entity-scoped function. Plan 176-02's list for this plan names the pages.

## Code review checklist

| Item | Outcome |
|---|---|
| Solves the issue | pass — one read under one authority; the table select is gone; three outcomes kept apart |
| OWASP | pass — the call passes the adapter's project and the guard holds its row (T-176-18); a refusal is never an empty list (T-176-16); thrown messages name paths and no stored value (T-176-17); arguments go as RPC parameters |
| Code style guide | pass by the linters: ESLint and Prettier exit 0 on every changed file under `apps/`; the guide itself was not re-read |
| `any` | pass — none added (searched the added lines outside test files) |
| No repeated code | one note — `issue.path.join('.') || '(root)'` now stands in three parse modules (`userEntities`, `invitationAccess`, `entityNominations`), as the pattern map prescribes; not extracted, since that touches two files outside this plan |
| New entities documented | pass — TSDoc on the schema, the row type, the parse function, both types and every member, and `entityNominationOf` |
| Repo markdown updated | deferred to plan 176-19 (above) |
| Tracking events | n/a — nothing a user can perform is added |
| Svelte component guidelines | n/a — no component created; two `.svelte` files edited in their script and one comment. `Skill("components")` was not loaded: no context read was added or changed, and the reads touched are of `userData`, a stable reference, and of page data |
| Errors handled and logged | pass — a call error and a malformed answer throw to the load, which logs and signs out; a refusal is a value, not an error |
| Failing checks | none at the closing head; three intermediate heads fail the scoped-query guard (deviation 1) |
| Parts sharing dependencies | pass — the provider's type, the voter routes and the admin directory are unchanged; the full suite is at its baseline |
| WCAG, keyboard | n/a — no markup changed; both a11y projects are at their totals |
| Documentation | deferred to plan 176-19 |
| Comment hygiene | pass — the guard exits 0; every added or changed comment was read for history words and planning ids: none |
| Commit history | five commits, each on its own files. `c23d8ce93` carries a guard entry that `fab21508d` should have carried (deviation 1); nothing else corrects an earlier commit |
| Formatting in its own commit | n/a — Prettier joined two lines of the context file that the edit shortened, inside that edit |
| `[db]` tag | n/a — no schema, migration or generated-types change |
| § Supabase Adapter: the mixin with `init({ fetch })` | n/a — no adapter class added |
| § Supabase Adapter: COLUMN_MAP / PROPERTY_MAP for row mapping | not used, as in `_getUserEntities`: the function's answer is its own JSON whose members (`election_name`, `constituency_name`, `parent`) are not table columns, so each member is mapped by name |
| § Supabase Adapter: `safeGetSession()` for route guards | n/a — no route guard touched |

No finding needed a commit before the gate rows.

## Not done, or not verified

- **The locale of the list's names** is as found, not changed (its heading above).
- **Neither intermediate red state was measured at its own commit**: that the guard and the dev-seed spec are red at the three heads of deviation 1, and that `81ba18e5e` does not type-check, are read from the working tree and the code.
- **The integration cases were not shown red.** They compare whole elements, so a wrong member would fail them; no mutation of the writer was run against them.
- **A `null` answer reaching the load in a browser** is not exercised by any E2E test: the entity read refuses first for every entity a user does not edit. It is held by unit cases at the parse and the writer and by the load's existing case for no user data.
- **svelte-check counted 2798 files in three runs and 2149 in two**; 0 errors and 0 warnings in all five. The two are the two runs of Task 2's verify block, where svelte-check follows the frontend's unit suite directly; the three are a run on its own, the working-tree checks before the commit and the gate row. Why the count differs was not looked into.
- **`yarn eslint` on `scripts/assert-project-scoped-queries.mjs` reports 8 errors** on lines this plan did not touch (quotes, function style, `console`). The root lint chain does not lint `scripts/`, and the lint row is 0. Not fixed: out of scope.
- **Nothing was appended to `.planning/WINDOWS.md`**: no stub, no skipped test, no verify left unrun.
- The database skill, the docs site and `apps/supabase/README.md` were not edited.

## The state the local database is left in

Read with `psql` after the closing run:

- **Applied schema:** the tree's, with `get_entity_nominations`. No reset was made by this plan.
- **Default project:** 1 election, 328 candidates, 8 organizations, 377 nominations, 26 questions — the `default` dataset. No row of the integration test is left (0 elections, constituencies, organizations or candidates under its identifiers).
- **Projects:** 3 — the default project, the E2E project `…00e2` and `…05c1`, the last two with no election, candidate or nomination: every teardown of the run passed.
- **Auth users:** 2. **Grants:** 2.
- **`private.invitation_link_witness`: 26 rows**, left by the two full runs. `39-invitations.test.sql` test 238 is red on this database without a reset, which is plan 176-02's known finding; pgTAP was not run here.
- **pgTAP helper functions are in `public`** (left by plan 176-02's verify), so `yarn db:types` is valid only after a reset.
- The stack is up; neither it nor Docker was restarted; nothing was pruned but the build cache, by the driver. Nothing listens on the wrapper's port. Docker VM free: 19.33 GiB.

## Files touched that the plan did not list

None in the repository. `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` were not edited. `CAND-APP-PLAN.md` stays untracked.

Gitignored evidence:

- `tests/e2e-runs/176-gates/176-05-close/`; `tests/e2e-runs/176-e2e/176-05-close/`; `tests/e2e-runs/176-e2e/176-05-precommit/` with `176-05-precommit.diff`, `.head`, `.status` and the power and time records beside it.
- `tests/e2e-runs/176-unit/`: `176-05-t1-verify.*` to `176-05-t3-verify.*`; `176-05-parse-red.*`, `176-05-parse-green.*`, `176-05-writer-red.*`, `176-05-writer-green.*`; `176-05-t2-work.sh` and `176-05-t2-work-r1.*` (the working-tree checks before the commit); `176-05-integration-work.sh` and `176-05-integration-work-r1.*`; `176-05-precommit-run.*`; `176-05-t2-commit.*`; `176-05-gates-close.*`, `176-05-gates-verdict.log`; `176-05-e2e-close.*`, `176-05-e2e-verdict.log`; `176-05-scope-final.txt`, `176-05-hygiene-final.txt`.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register. Its mitigations as built:

| Threat | Held by |
|---|---|
| T-176-16 a refused or failed read mapped to an empty list | the parse's `null` and its throw; the writer cases "resolves to no user data for a refused nominations read", "rejects when the nominations call fails", "rejects a malformed nominations answer"; the fourth integration case |
| T-176-17 a stored value in an error message | the parse case and the writer case that plant a marker value |
| T-176-18 an RPC called without its project | `p_project_id: this.projectId`; the guard's row; the project-scoping case for the nominations read |
| T-176-19 the provider's type changed | not opened; the stage of Task 2's verify that compares it, the voter routes and the admin directory with the base commit |

## Self-Check: PASSED

Checked after writing:

- The two created files exist and are tracked; the fourteen modified files each differ from `6ff741ad0`; `git diff --stat 6ff741ad0 HEAD` lists sixteen files.
- `595df3018`, `fab21508d`, `81ba18e5e`, `c23d8ce93` and `98d737bb3` are ancestors of HEAD; `git rev-list --count 6ff741ad0..98d737bb3` is 5.
- `176-05-t1-verify.exit`, `176-05-t2-verify.exit`, `176-05-t3-verify.exit` and the two `-final.exit` files hold 0; the gate run's seven rows are 0; the closing run's `exit` holds 0 and its directory holds no void marker.
- `git status --short` shows the operator's untracked `CAND-APP-PLAN.md` and nothing of this plan's.
