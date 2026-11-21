---
phase: 173-multi-entity-grants-entity-selection
plan: 03
subsystem: frontend-data-writer
tags: [supabase, data-writer, svelte5, runes, store, server-load, zod, integration-test, multi-entity, rls]

requires:
  - phase: 173-multi-entity-grants-entity-selection
    provides: "173-02: get_user_entities and get_entity_user_data, parseUserEntities, the interim single-candidate reader, the nine pgTAP write refusals"
  - phase: 171-project-settings-served-entity-types-registration-mode-matri
    provides: "getServedEntityTypes and SERVED_ENTITY_TYPES in @openvaa/app-shared"
  - phase: 172-terms-of-use-per-user-and-project
    provides: "The five-stage protected load with its gate list"
provides:
  - "getUserEntities() and getEntityUserData({ type, id }) on the DataWriter interface, the base class and the Supabase adapter, for a candidate and an organization alike"
  - "ENTITY_TABLES: one map from served entity type to table, read by every entity write, upload path and parse-report label; any other type throws naming it"
  - "ContestantUserData.entity, a union discriminated by type; store members savedEntityData and reloadEntityData"
  - "The protected load filtering the user's entities once through getServedEntityTypes and reading the one entity of either type; new load member entities"
  - "A gated adapter-level integration test: one organization save and six refused writes through the real writer against the local database"
  - "Stage 2 part 1 closed green: gates 173-03-writer-r5 (twelve rows at 0) and E2E 173-03-writer-r4 (180 of 180) on tree 43385c089"
affects: [173-04, 173-05, 173-07, 173-08, 173-09, 173-10, 173-13, 174, 175]

estimate:
  tokens: 100000
actuals:
  tokens: 37949
  tasks: 6
  commits: 10
plan_head_before: 517e800c396b4429890f69d2676837b26503fff5
plan_head_after: 842be2c48739600a9e949e0847eb2ae53b53c0b4

tech-stack:
  added: []
  patterns:
    - "One const map over ServedEntityType gives the table, the storage folder and the report label; a lookup helper narrows EntityType and throws by name"
    - "A one-entity read resolves undefined for no row and rejects for a failed read; the two are never the same value"
    - "A store method that writes what it read must read it untracked, or an effect that calls it reruns on its own result"
    - "An effect that needs the loaded entity depends on a derived string of its type and id, not on the saved data"
    - "A page part is left out for a known organization, never shown only for a known candidate, so the server-rendered page is unchanged"
    - "A gated integration test throws at import when it is declared required and its URL is unset"

key-files:
  created:
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts
    - apps/frontend/src/lib/api/utils/translateLocalizedEntity.ts
  modified:
    - apps/frontend/src/lib/api/base/dataWriter.type.ts
    - apps/frontend/src/lib/api/base/universalDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.concurrency.test.ts
    - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts
    - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.type.ts
    - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
    - apps/frontend/src/routes/contestant/(protected)/+layout.server.ts
    - apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts
    - apps/frontend/src/routes/contestant/(protected)/+layout.svelte
    - apps/frontend/src/routes/contestant/(protected)/+page.svelte
    - apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte
    - apps/frontend/src/routes/contestant/(protected)/questions/+page.svelte
    - apps/frontend/src/routes/contestant/(protected)/questions/[questionId]/+page.svelte
    - apps/frontend/src/routes/contestant/(protected)/preview/+page.svelte
    - apps/frontend/src/routes/contestant/(protected)/termsOfUseLayout.svelte.test.ts
    - .planning/phases/173-multi-entity-grants-entity-selection/173-NAME-MAP.md
  deleted:
    - apps/frontend/src/lib/api/utils/translateLocalizedCandidate.ts

key-decisions:
  - "A failed settings read in the protected load is treated as the preregister load treats it: logged and answered with empty settings, which the accessor reads as the shipped default of served types"
  - "The role check stays after the one-entity read, so the order of the load's outcomes is unchanged"
  - "reloadEntityData reads the loaded entity untracked; the preview's effect depends on the entity's type and id as one derived string"
  - "The profile's name fields are left out for a known organization and otherwise rendered as before, so the server-rendered page of a candidate is unchanged"
  - "The integration test creates one question of its own, because stored answers are validated against the project's questions, and each refusal asserts its reason as well as the rejection"
  - "The store merges the property setter's image by name instead of spreading its return value, which is declared as candidate data"

patterns-established:
  - "Evidence for the gated integration test: a JSON report plus a .head file naming the tree it ran on, earlier reports kept as -attemptN"

requirements-completed: [GEN-02]

coverage:
  - id: D1
    description: "The writer has one generic entity path: getUserEntities and getEntityUserData for a candidate and an organization alike; no row resolves undefined and a failed read rejects; a malformed list rejects"
    requirement: GEN-02
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts — describe 'the generic entity path' and 'getEntityUserData for a candidate'"
        status: pass
      - kind: integration
        ref: "supabaseDataWriter.integration.test.ts — the organization's editor lists and reads its organization (tests/e2e-runs/173-gates/173-03-integration.json)"
        status: pass
    human_judgment: false
  - id: D2
    description: "updateAnswers, updateEntityProperties and the upload helper dispatch through one map; an organization is written to organizations and uploaded under <project>/organizations/<id>/; a type the map does not hold throws naming it"
    requirement: GEN-02
    verification:
      - kind: unit
        ref: "supabaseDataWriter.test.ts — 'updateAnswers for an organization…', 'updateEntityProperties for an organization…', and three '%s rejects a target of a type the application does not serve' cases"
        status: pass
      - kind: other
        ref: "git grep -n -F '/candidates/' on the adapter and git grep -n -F 'Unsupported entity type for setting answers' on apps/frontend/src: each exit 1; yarn assert:project-scoped-queries and yarn assert:adapter-casts exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "The user-data type's member is entity, a union discriminated by type; the store, the context and every page of the protected tree read it without a cast narrowing the union; the old names are gone"
    requirement: GEN-02
    verification:
      - kind: other
        ref: "git grep -n -e getContestantUserData -e savedCandidateData -e reloadCandidateData -e ContestantUserDataWithCandidate -- apps tests packages: exit 1; gate rows typecheck and check-frontend of 173-03-writer-r5 at 0"
        status: pass
      - kind: unit
        ref: "contestantUserDataState.svelte.test.ts — describe 'contestantUserDataState, an entity of either served type'"
        status: pass
    human_judgment: false
  - id: D4
    description: "The served-types filter is applied once, in the protected server load, through getServedEntityTypes; a user with exactly one served entity is served it; zero or several still end in the loginFailed sign-out"
    requirement: GEN-02
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts — describe 'the entity types the project serves' and 'the entity step cannot be read'"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/173-e2e/173-03-writer-r4: 180 of 180 over 100 projects, every project's total equal to the baseline's"
        status: pass
    human_judgment: true
    rationale: "PROH-173-08 is verified by judgment, and the outcome for zero or several entities is by the plan's ruling 5 not pinned by any test. The load's code sends a filtered list whose length is not 1 to loginFailed; no test asserts it."
  - id: D5
    description: "The real writer saves an organization's answers against the local database and the row read back holds them"
    requirement: GEN-02
    verification:
      - kind: integration
        ref: "supabaseDataWriter.integration.test.ts — 'saves an organization's answers through its editor's own session, and the stored row holds them'; report 173-03-integration.json: 7 passed, 0 failed, 0 pending, on tree 43385c089"
        status: pass
    human_judgment: false
  - id: D6
    description: "Through the real writer a caller cannot write an entity it holds no editor grant on: an answer save and an image update are each refused, with row and folder unchanged, for three pairings"
    requirement: GEN-02
    verification:
      - kind: integration
        ref: "supabaseDataWriter.integration.test.ts — three describe.each pairings by two cases; each asserts the rejection's reason and the unchanged state"
        status: pass
    human_judgment: false
  - id: D7
    description: "Home greets a candidate by first name and an organization by its name; the context's question scope still names ENTITY_TYPE.Candidate"
    verification:
      - kind: other
        ref: "git grep -n -F 'const entityType = ENTITY_TYPE.Candidate' on contestantContext.svelte.ts finds the line; svelte-check 0 errors"
        status: pass
    human_judgment: true
    rationale: "No test renders home for an organization: before 173-05 an organization editor cannot pass the login form. The greeting is read from the code (entityName in the home page)."
  - id: D8
    description: "The gate set and the full E2E suite are green on one tree"
    verification:
      - kind: other
        ref: "173-verdict.mjs gates 173-03-writer, exit 0 (resolves 173-03-writer-r5); no Sleep entry in the window"
        status: pass
      - kind: e2e
        ref: "173-verdict.mjs e2e 173-03-writer --min-total-of 173-01-baseline, exit 0 (resolves 173-03-writer-r4); --same-projects-as 173-01-baseline, exit 0"
        status: pass
    human_judgment: false
  - id: D9
    description: "PROH-173-10: no reactive context accessor is destructured and dataRoot is never bound to a read alias; userData stays a stable reference"
    verification: []
    human_judgment: true
    rationale: "Marked verification: judgment in the plan. Every read added by this plan is userData.current?.entity or userData.savedEntityData inside a $derived or a template; the preview still reads ctx.dataRoot past its await, as before."

duration: 80min
completed: 2026-10-06
status: complete
---

# Phase 173 Plan 03: The Generic Entity Path in the Writer, the Types and the Store Summary

**The data writer reads the user's entity list and one entity of either served type and writes to either table through one map; the user data's member is `entity`; the protected load filters by the served types once and reads the one entity left; the real writer has saved an organization's answers against the local database and been refused six writes; and tree `43385c089` is green on twelve gate rows and on the full E2E suite (180 of 180), after three red E2E attempts that each found a real defect of this plan.**

## Read First

1. **Three E2E attempts were red before the green one, and none was void.** Each ran on AC power with no Sleep entry in its window. Each was diagnosed from its trace and fixed at its cause, then both instruments were made again. Two of the three defects are a rule later plans must keep: see "What the Three Red Runs Found".
2. **The outcome for zero or several served entities is in the code and in no test,** as the plan rules. It is the existing `loginFailed` sign-out.
3. **Nothing a signed-in user can see changed for a candidate.** An organization editor still cannot pass the login form (173-05), so every organization path here is proven by unit tests and by the integration test, not by a browser.
4. **Where the handover and the plan could have disagreed, they did not.** The plan was followed; its departures are listed under "Deviations from Plan".

## Performance

- **Duration:** about 80 min; the first commit is 10:37Z and the name-map commit 11:36Z. The start time was not recorded before Task 1, so the figure is approximate.
- **Tasks:** 6 of 6
- **Files changed:** 22 (21 outside `.planning/`; two new, one deleted by rename)
- **Start revision:** `517e800c3`. **The tree both closing instruments and the integration report describe:** `43385c089`.

## Task Commits

1. **Task 1: the generic entity path beside the interim reader** — `6f774ec14` `feat(173-03): read the user's entity list and one entity of either served type through one map from entity type to table`
2. **Task 2: the entity member in the types and the store, old names still served** — `2393b5dd4` `refactor(173-03): name the user data's entity member and the store's saved-data and reload members by entity`
3. **Task 3: the load, the context and the pages** — `43239de1d` `feat(173-03): filter the user's entities by the served types in the protected load and read the one entity of either type`
4. **Task 4: the old names go** — `98c809347` `refactor(173-03): delete the single-candidate reader, the transitional user-data type and the store's two candidate-named delegates`
5. **Task 5: the integration test** — `9ed92ce58` `test(173-03): save an organization's answers and refuse six writes through the real writer against the local database`
6. **Task 6: the close** — four fixes found by the gate set and the suite, then `842be2c48` `docs(173-03): record the green close of the writer, types and store stage of multi-entity grants in the name map`
   - `c921d473e` `fix(173-03): join a forced line break in the integration test's docblock and drop a test helper left without a caller`
   - `b1ec2b99f` `fix(173-03): read the loaded entity untracked when a reload starts, so an effect that reloads does not rerun on its own result`
   - `cafcdba51` `fix(173-03): start the preview's reload once the entity is loaded, and again only when another entity is`
   - `43385c089` `fix(173-03): render the profile's name fields unless the entity is an organization, as the server-rendered page did`

`git rev-list --count 517e800c3..842be2c48` is 10. The commit that carries this file follows them. The frontend's svelte-check run exited 0 on the tree of each of the nine source commits before it was committed (`yarn workspace @openvaa/frontend typecheck`, or the workspace's `check` for `cafcdba51` and `43385c089`); the tenth commit changes the name map alone. The one exception lasted seconds and is recorded under "Departures from the plan's letter": the rename-only commit that was amended.

## Gate and E2E Results

Every exit status was read from the command itself or from a marker file, never through a pipe.

| What | Command | Exit | Result |
|---|---|---|---|
| Task 1 | `yarn workspace @openvaa/frontend vitest run supabaseDataWriter`; `… typecheck`; `yarn assert:project-scoped-queries`; `yarn assert:adapter-casts` | 0; 0; 0; 0 | 85 tests in 1 file |
| Task 1 greps | `git grep -n -F "/candidates/" -- <adapter>`; `git grep -n -F "Unsupported entity type for setting answers" -- apps/frontend/src` | 1; 1 | no line |
| Task 2 | `… typecheck`; `… vitest run contestantUserDataState supabaseDataWriter` | 0; 0 | 99 tests in 2 files |
| Task 3 | `… typecheck`; `… check`; `… test:unit`; `… lint` | 0; 0; 0; 0 | 2211 tests in 138 files |
| Task 3 greps | the three-name grep over the routes and the context; the question-scope line | 1; 0 | no reader of an old name; the line stands |
| Task 4 | `… typecheck`; `… test:unit`; `… lint`; the two guards | 0; 0; 0; 0, 0 | 2203 tests in 138 files |
| Task 4 greps | `git grep -n -e getContestantUserData -e savedCandidateData -e reloadCandidateData -e ContestantUserDataWithCandidate -- apps tests packages` | 1 | no line |
| Task 5, skipped form | `… vitest run supabaseDataWriter.integration` with none of the variables | 0 | 1 file skipped, 7 tests skipped |
| **Task 5, executed** | the same with the three variables and `CONTESTANT_WRITER_INTEGRATION_REQUIRED=1` | **0** | **7 passed, 0 failed, 0 pending** on tree `43385c089` |
| Task 5 leftovers | a `psql` count by the run's identifiers over candidates, organizations, question categories, questions, users and stored objects | 0 | 0 |
| **Gate set** | `caffeinate -dimsu 173-gates.sh 173-03-writer-r5` | **0** | **twelve rows, every status 0** |
| Gate verdict | `173-verdict.mjs gates 173-03-writer` | 0 | resolves `-r5`; not stale; no Sleep entry |
| **E2E** | `caffeinate -dimsu 173-e2e.sh 173-03-writer-r4` | **0** | **180 / 180 / 0 failed / 0 flaky / 0 skipped / 0 did not run**; 100 projects |
| E2E verdict | `173-verdict.mjs e2e 173-03-writer --min-total-of 173-01-baseline` | 0 | resolves `-r4`; full suite; total 180 not below 180 |
| Per-project comparison | `… --same-projects-as 173-01-baseline` | 0 | every project's total equals the baseline's |
| Re-seed | `yarn db:seed:default` | 0 | 752 rows |

Both verdicts were taken again after the name-map commit and exit 0.

The twelve rows of `173-03-writer-r5`: typecheck 18 s, lint 41 s, types-regen 31 s, types-clean 0 s, sql-lint 3 s (104 policies, 20 tables, `0 error(s), 3 warning(s)`), pgtap 5 s (38 files, 1447 tests), unit 57 s (frontend 2204 passed and 7 skipped in 139 files; the other workspaces as at the close of 173-02), check-frontend 8 s (2658 files, 0 errors, 0 warnings), build 16 s, format 17 s, docs-links 1 s, name-gate-self-test 0 s.

### Every run directory of this plan

All on AC power, all with `sleep_entries_in_window: 0`. Nothing under `tests/e2e-runs/` was deleted.

| Directory | Tree | Counts | Verdict |
|---|---|---|---|
| `173-gates/173-03-writer` | `9ed92ce58` | `lint` 1, eleven rows 0 | red: comment hygiene |
| `173-gates/173-03-writer-r2` | `c921d473e` | twelve rows 0 | green, superseded |
| `173-e2e/173-03-writer` | `c921d473e` | 85 passed, 1 failed, 94 did not run | red: preview reload loop |
| `173-gates/173-03-writer-r3` | `b1ec2b99f` | twelve rows 0 | green, superseded |
| `173-e2e/173-03-writer-r2` | `b1ec2b99f` | 83 passed, 3 failed, 94 did not run | red: preview read before the store was loaded |
| `173-e2e/173-03-preview-probe` | `cafcdba51` | 5 of 5, `--project contestant-journey` | a slice |
| `173-gates/173-03-writer-r4` | `cafcdba51` | twelve rows 0 | green, superseded |
| `173-e2e/173-03-writer-r3` | `cafcdba51` | 124 passed, 1 failed, 55 did not run | red: profile name fields absent from the server-rendered page |
| `173-e2e/173-03-profile-probe` | `43385c089` | 78 of 78, `--project perm-answers-locked` | a slice |
| **`173-gates/173-03-writer-r5`** | `43385c089` | twelve rows 0 | **green, judged** |
| **`173-e2e/173-03-writer-r4`** | `43385c089` | 180 of 180 over 100 projects | **green, judged, the full default suite** |

Beside them: `173-03-integration.json` with `173-03-integration.head` and the six earlier reports `-attempt1` to `-attempt6`, and the traces of the three red E2E attempts in `173-03-writer-diagnosis/`, `-r2-diagnosis/` and `-r3-diagnosis/`.

## What the Three Red Runs Found

| Run | Symptom | Measured | Cause | Fix |
|---|---|---|---|---|
| `173-03-writer` | `contestant-journey` step 21: the preview's Opinions tab never held its question | 198 `get_entity_user_data` requests in the one test's trace | `reloadEntityData` read `#savedData` before its first await. Called from the preview's `$effect`, that read made the effect depend on what the reload writes when it settles, so every result started another reload and reset the tabs | `untrack` around that read; a store case that starts a reload inside an effect and asserts one run and one read. The case failed before the fix (6 runs) and passes after |
| `173-03-writer-r2` | the preview showed "Profile not found" in three tests | 0 `get_entity_user_data` requests; `Cannot reload entity data before user data is loaded` logged twice in the trace | the layout loads the store in an `$effect`, which runs after the page's own effect on mount. With the read untracked, the page's effect ran once, found no entity and never ran again | the effect reads `loadedEntityKey`, a `$derived` string of the loaded entity's type and id, and returns while it is undefined. A reload's result does not change the string, so the effect does not rerun on it |
| `173-03-writer-r3` | `perm-answers-locked`: "profile page must render at least one visible input", 0 found | the page snapshot holds an empty Personal Information group and an empty Nominations section: the store was not loaded when the inputs were counted | Task 3 put the two name fields under `{#if candidate}`. On the server and on first paint the store holds nothing, so the fields were absent until hydration; before, they were rendered empty | the fields are left out only when the entity is known to be an organization |

The first two are one hazard seen from both sides, and the third is its neighbour. Both are recorded as items 16 and 17 of the name map's last section.

## The Final Names

| Role | Name |
|---|---|
| The list reader | `getUserEntities(opts?: GetUserEntitiesOptions)` → `Array<UserEntity>`; base `_getUserEntities` |
| The one-entity reader | `getEntityUserData<TNominations>(opts: GetEntityUserDataOptions<TNominations>)` → `ContestantUserData<TNominations> \| undefined`; base `_getEntityUserData` |
| The list item | `UserEntity`: `{ type: 'candidate', id, firstName, lastName, shortName?, image?, color?, confirmed }` or `{ type: 'organization', id, name, shortName?, image?, color?, confirmed }` |
| The entity data | `LocalizedCandidateData` (kept), `LocalizedOrganizationData`, and the union `LocalizedEntityData` |
| The user data's member | `ContestantUserData.entity` |
| The map and its helpers | `ENTITY_TABLES`, `EntityTable`, `servedEntityType(type)`, `entityTableOf(type)` in `supabaseDataWriter.ts`; the message is `Unsupported entity type: <type>` |
| The upload helper | `#uploadEntityFile({ projectId, table, id, file })` |
| The store | `savedEntityData`, `reloadEntityData`; private `#updateEntityData`, `#mergeEntityAnswers`, `#savedEntityData` |
| The translate helper | `translateLocalizedEntity`, in `translateLocalizedEntity.ts` (file renamed from `translateLocalizedCandidate.ts`) |
| The load | `loadEntity()` returns `{ entities, userData, electionId }`; the load returns `{ gate: null, user, entities, questionData, contestantUserData }` |
| The preview's key | `loadedEntityKey` in the preview page |
| The environment variable | `CONTESTANT_WRITER_INTEGRATION_REQUIRED` |

Created and deleted inside this plan: `ContestantUserDataWithCandidate` (Task 2 to Task 4, under the plan's suggested name), the store's two deprecated delegates, and `EntityUserData`, an interim return type of Task 1 that Task 2 folded into `ContestantUserData`.

Assumption A9 holds: `scopedFrom` with a union of the two table names typechecks through the update chain, so there is no two-arm method.

## What Each Page Shows for an Organization

| Page | For an organization |
|---|---|
| Home | the greeting uses the organization's `name`; everything else is as for a candidate |
| Profile | no first-name or last-name field; the locked and editable info questions, the nominations list and the image field render as for a candidate. The image field's label is still the message "candidate portrait", and the questions are candidate-scoped |
| Questions and the question editor | unchanged code paths: the saved and current answers are read from `entity`. The questions listed are the candidate-scoped ones, because the context's question scope still names `ENTITY_TYPE.Candidate` |
| Preview | the organization is provided to the `DataRoot` and read back with `getEntity(type, id)`, and `EntityDetails` renders it |
| Settings | unchanged; it reads `userData.current?.user.email` |

None of this was rendered in a browser for an organization. It compiles for both arms under svelte-check with no cast narrowing the union.

## How a Failed Settings Read Is Treated in the Load

As `preregister/+layout.server.ts` treats it: the error is logged, the settings are taken as empty, and `getServedEntityTypes({})` answers with the shipped default of served types. On a project that serves organizations, a failed settings read therefore drops the user's organizations for that request. Pinned by the load case "reads a failed settings read as the shipped default of served types, and logs it".

## For Phase 175: Saving an Organization's `name` and `short_name`

`updateEntityProperties` is the method. It already takes the table from the target's type and runs `scopedFrom(table).update(updateFields).eq('id', id)`, but `EditableEntityProps` holds only `image`, so today it can write nothing else. Phase 175 widens `EditableEntityProps` and the `updateFields` it builds; the read-back column list (`'image'`) and the declared return type (`LocalizedCandidateData`, wrong for both arms, as the adapter's own comment says) change with it. Whether row-level security and any column guard let an organization editor update `name` and `short_name` was not measured here.

## The Integration Test

- **File:** `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts`, with `// @vitest-environment node` so that the upload hands a `File` to the platform's own `fetch`.
- **Invocation, with the stack up:** `SUPABASE_URL=… SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… CONTESTANT_WRITER_INTEGRATION_REQUIRED=1 yarn workspace @openvaa/frontend vitest run supabaseDataWriter.integration --reporter=default --reporter=json --outputFile.json=<absolute path>`. The values are `API_URL`, `ANON_KEY` and `SERVICE_ROLE_KEY` of `supabase status -o env` (run in `apps/supabase`), read into shell variables and never printed. 173-13 re-runs it this way.
- **Counts:** 7 passed, 0 failed, 0 pending, in `tests/e2e-runs/173-gates/173-03-integration.json`, made on tree `43385c089`.
- **Gating:** `describe.skipIf(!process.env.SUPABASE_URL)`; with the variable `=1` and no URL the file throws at import. No CI job runs it. Without the variables it reports 7 skipped and exits 0, which is what the default unit run shows.
- **Fixture, in the default project:** one organization, two candidates, one question with its category, two users each holding one editor grant and each signed in by password on a client of its own.
- **The refusals assert their reason:** `/access denied/` for the answer save and `/^Image upload failed: /` for the image update, then the unchanged answers, the empty folder and the unchanged image, each read with the service-role client.
- **Teardown:** in `afterAll`, whether or not an assertion failed; it throws if a grant, user, question, category, entity row or stored object is left.
- **Not as in pgTAP:** the target rows are unconfirmed and not nominated, so a refusal here does not say whether the read policy or the write policy made it. The pgTAP cells of 173-02 say that.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The reload read what it writes, inside the caller's effect**
- **Found during:** Task 6, E2E `173-03-writer`
- **Issue:** see the first row of "What the Three Red Runs Found".
- **Fix:** `untrack` in `reloadEntityData`; one store case.
- **Files modified:** `contestantUserDataState.svelte.ts`, `contestantUserDataState.svelte.test.ts`
- **Commit:** `b1ec2b99f`

**2. [Rule 1 - Bug] The preview's reload ran before the store was loaded**
- **Found during:** Task 6, E2E `173-03-writer-r2`
- **Fix:** the effect depends on `loadedEntityKey` and waits for it.
- **Files modified:** `preview/+page.svelte`
- **Commit:** `cafcdba51`

**3. [Rule 1 - Bug] The profile's name fields left the server-rendered page**
- **Found during:** Task 6, E2E `173-03-writer-r3`
- **Fix:** `{#if !isOrganization}` in place of `{#if candidate}`.
- **Files modified:** `profile/+page.svelte`
- **Commit:** `43385c089`

**4. [Rule 3 - Blocking] A forced line break in the new test's docblock, and a helper without a caller**
- **Found during:** Task 6, gate row `lint` of `173-03-writer`
- **Fix:** the run instruction is one comment line; `contestantRow` is removed from the writer's test file.
- **Commit:** `c921d473e`

**5. [Rule 3 - Blocking] The answers column refuses a question id the project does not hold**
- **Found during:** Task 5, the first draft's run (`173-03-integration-attempt1.json`)
- **Fix:** the plan's own fallback: the test creates one question with its category and deletes both.
- **Commit:** `9ed92ce58`

### Departures from the plan's letter

- **Task 1 added one interim type, `EntityUserData`,** as the return type of the one-entity read while `ContestantUserData` still held `candidate`. Task 2 replaced it with `ContestantUserData`.
- **Task 1 changed two messages of the interim reader:** `Failed to load entity data: <message>` and the `getEntityUserData:` prefix of the project-mismatch message, as step 4 words them for an entity. Two existing cases were re-pointed.
- **Task 2 changed seven files, not six:** `universalDataWriter.ts` names the interim reader's return type.
- **Task 3 changed `termsOfUseLayout.svelte.test.ts`,** which the plan does not list: it builds the load's data with the old member. It did not change `contestantContext.type.ts`, which the plan lists: that file names none of the old members.
- **Task 3's commit was amended once.** `git add` aborted on the path the rename had deleted, so the first commit (`5417f65b4`) held the rename alone and did not typecheck. It was amended at once into `43239de1d`; nothing had been built on it.
- **Task 3, the `entityTypes` check:** the diff adds two lines containing `entityTypes` that are not a call of the accessor. Both are in `layout.server.test.ts`, in the helper that builds the settings a case hands to the mocked provider. No source file reads the key.
- **Task 3, load cases beyond the three listed:** a failed settings read; a failed list read; the one-entity read rejecting and answering with no entity. None asserts the outcome for zero or several entities.
- **Task 4 removed six writer cases** that existed for the interim reader's rule or duplicated a case of the generic path, and re-pointed the rest.
- **Task 5:** the refusal cases assert the reason of each rejection, and the test runs in the Node environment. The recorded report was made again after each later commit, so that it names the judged tree.
- **Task 6 took four fixes and five gate attempts.** Two one-project probes were made after two of the fixes, before the full pair; each is read as a slice.
- **The E2E label and the gate label differ by one attempt** (`-r4` and `-r5`), because the first gate attempt was red before any E2E run existed. The plain label resolves to both.

### Departures in procedure

- **A hook refused a command that would have read the root `.env`** for the names of its variables. The file was not read. The keys came from `supabase status -o env`, as the plan's Task 5 says, into shell variables; they were never printed, and the JSON report holds no key (a count of key-shaped strings in it is 0).
- **The commit-time worktree check of the executor's protocol was not applied,** as in 173-01 and 173-02: this checkout is a permanent linked worktree on `feat/entity-signup-multi-grant`.
- **The broken-windows ledger was not appended to.** The deviations are here and in the name map.
- **Reading.** Read: the standing notes, the plan, `173-02-SUMMARY.md`, of the name map the names, facts, G-1 to G-9, the baseline, both 173-02 sections and the last section, of the research R-5.2 to R-5.4, of the context D-18 and D-19, and the drivers' headers. Not opened: `PROJECT.md`, `STATE.md`, `config.json`, the components skill and `context-reactivity.md`, the workflow references, `173-UI-SPEC.md`, `173-VALIDATION.md` and the rest of the research and the context. The Context Destructuring Rule was applied from `CLAUDE.md`.

## Deferred Issues

- **`updateEntityProperties` is declared to return `LocalizedCandidateData`** and returns the image alone, for either type (pre-existing; the adapter's comment names it). Phase 175 changes the method anyway.
- **The interface's section comment in `dataWriter.type.ts`** still says the property setter "returns the whole updated `LocalizedCandidateData`" (pre-existing).
- **`contestantContext.svelte.test.ts` has an unused variable** reported as a lint warning (pre-existing, not this plan's file).
- **`perm-answers-locked` counts the profile's inputs without waiting for hydration.** It passed before and passes now because the inputs are in the server-rendered page; the spec was not changed.
- Carried from 173-01 and 173-02 and unchanged: the stale scan counts, the header logout button that is never rendered, the stale line citations of `RPC-NULLABILITY.md` § 2, the database skill's stale counts.

## Known Stubs

None. The interim single-entity rule in the load (exactly one served entity or `loginFailed`) is the plan's stated state until 173-10.

## Threat Model, Each Disposition

| Threat | Disposition | Where it stands |
|---|---|---|
| T-173-10 a writer call with an unserved type reaching another table | mitigate | `ENTITY_TABLES` over `ServedEntityType`; `entityTableOf` throws naming the type before anything is sent, asserted for `updateAnswers`, `overwriteAnswers` and `updateEntityProperties` with no upload, RPC or table access |
| T-173-11 saving one entity's answers to another | mitigate | `save()` takes `type` and `id` from the loaded entity; store cases for an organization and a candidate; refused by the database in the integration test |
| T-173-57 a target naming an entity the caller does not edit | mitigate | six integration cases, each with the rejection's reason and the unchanged row and folder; the nine pgTAP cells of 173-02 in the gate set |
| T-173-12 a malformed list read as "no entities" | mitigate | `parseUserEntities` throws; `getUserEntities` rejects (unit); the load turns a rejected list into `loginFailed` and reads no entity (unit); `assert:adapter-casts` exit 0 |
| T-173-13 a storage path from caller-controlled text | mitigate | the segment is a value of `ENTITY_TABLES`, the file name a random uuid with an extension from the allow-list |
| T-173-14 the integration test's keys or rows leaking | mitigate | keys held in shell variables, not printed, not in the report; default project, unique identifiers, a teardown that fails the run on a leftover; an independent count of 0 |
| T-173-SC package installs | accept | no package was installed |

No new security-relevant surface beyond the plan's threat model. The one new environment variable is read by a test file only.

## What the Next Plan and Later Phases Must Know

- **Read `173-NAME-MAP.md` first:** `## After 173-03` and the last section, which now has eighteen items.
- **Compare against** gates `173-03-writer` and E2E `173-03-writer`: 180 tests, 100 projects; pgTAP 38 files, 1447 tests; frontend unit 2204 passed and 7 skipped in 139 files.
- **173-04 (the store keyed by entity):** the store reads `entity` everywhere and `save()` targets the loaded entity. `reloadEntityData` reads the loaded entity untracked on purpose. The draft key is still the fixed `ContestantContext-contestantUserDataStore-editedAnswers`.
- **173-05:** the role check in the load still requires `user.role === 'candidate'`, read from the user-level data, so an organization editor who passed the login form would be signed out with `userNotAuthorized` there.
- **173-07 to 173-10:** the load already returns `entities`, the served-filtered list; nothing reads it yet. The exactly-one rule is the three lines after the filter in `loadEntity()`. `userNoCandidate` is no longer raised by the load; its code, map entry, messages and docs mention remain for 173-10.
- **Any page of the protected tree:** the store is loaded in the layout's effect, after the page's own effects on mount and never on the server. Do not show a part only when a candidate is loaded, and do not start a reload from an effect without a dependency on which entity is loaded.
- **173-13:** re-run the integration test as written under "The Integration Test"; the report must show at least 7 passed and none pending.
- **Phase 174:** unchanged from 173-02: a save can be refused for a listed entity while the token predates its grant. The writer surfaces the refusal and does not refresh.
- **Phase 175:** see "For Phase 175" above; the question scope, the profile's person fields, the image label and the preview are still candidate-shaped.

**Host state:** the stack is up (`yarn db:status` 0) with the schema of the tree applied by the last gate set; it was not restarted and no Edge Function was served with an env file. The database holds what the closing E2E run left in its own project, the pgTAP helper functions, and the `default` dataset (752 rows seeded). Nothing listens on 5173 or 5273 and no dev server of this plan runs. The host is on AC power. `CAND-APP-PLAN.md` is untracked and untouched. `.planning/STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `PROJECT.md` are unchanged.

## Self-Check: PASSED

- The two created files, this summary, the integration report with its `.head` file and both judged run directories exist; the renamed-away file is gone. The three `head` records name `43385c089`.
- Commits `6f774ec14`, `2393b5dd4`, `43239de1d`, `98c809347`, `9ed92ce58`, `c921d473e`, `b1ec2b99f`, `cafcdba51`, `43385c089` and `842be2c48` are ancestors of HEAD; `git rev-list --count 517e800c3..842be2c48` is 10.
- The plan's verification items hold: frontend typecheck and unit suite at exit 0 (gate rows of `173-03-writer-r5`); the integration report counts 7 passed, 0 failed, 0 pending; `gates 173-03-writer` and `e2e 173-03-writer --min-total-of 173-01-baseline` exit 0, re-taken after the last commit outside this file.
- `.planning/STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `PROJECT.md` are unchanged since the start revision (a diff of 0 lines). Nothing listens on 5173 or 5273.
