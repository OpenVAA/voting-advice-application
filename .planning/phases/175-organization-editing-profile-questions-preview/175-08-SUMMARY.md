---
phase: 175-organization-editing-profile-questions-preview
plan: 08
subsystem: ui
tags: [app-settings, zod, contestant-context, svelte-runes, question-scope, voter-filter, colour, stored-css-injection, tdd, e2e]

requires:
  - phase: 175-organization-editing-profile-questions-preview (plan 02)
    provides: the database's lock, read from the app setting access.nominationsLocked
  - phase: 175-organization-editing-profile-questions-preview (plan 03)
    provides: the database's check of a stored colour on the four entity tables
  - phase: 175-organization-editing-profile-questions-preview (plan 04)
    provides: entityDescriptorOf and its identityFields, isNameEditable, requiredNameLocale, missingRequiredLocale
  - phase: 175-organization-editing-profile-questions-preview (plan 05)
    provides: the E2E dataset and the per-project baseline 175-05-close
  - phase: 175-organization-editing-profile-questions-preview (plan 07)
    provides: the store's saved entity data and its stored names by locale
provides:
  - "settings keys access.nominationsLocked and entities.hideIfMissingAnswers.organization, in DynamicSettings, StoredSettingsSchema and the shipped defaults (both false)"
  - "ContestantContext.nominationsLocked and ContestantContext.questionsReady, reactive accessors"
  - "the context's question scope is the loaded entity's type; the lists and blocks are empty while no entity is loaded"
  - "profileComplete with a third conjunct, the required name fields of the loaded entity's descriptor, while its name is editable"
  - "ContestantUserDataState.savedLocalizedNames"
  - "isBlankText in lib/utils/localizedText.ts"
  - "the organization arm of the voter-side hide-if-missing-answers filter"
  - "ensureColors returns a hex colour or the empty string; the list of the user's entities hands its colour on through it"
  - "the gate rows 175-08-close (9 rows at 0) and the full run 175-08-close (226 passed in 110 projects)"
affects: [175-09, 175-10, 175-11, 175-12, 175-13, 176, 177, 179]

actuals:
  tokens: 25958 # chars/4 over the twelve commits' diff outside .planning/ (103834 chars)
  tasks: 3 # plus the orchestrator's title rename
  commits: 12 # MEASURED: git rev-list --count 58aa86dc1..736d113f2, before this file's own commit
plan_head_before: 58aa86dc11e4368b005acfb566b17825b260a283
plan_head_after: 736d113f240f0102fcc4c42129ae979e7feb5a50

tech-stack:
  added: []
  patterns:
    - "A fact about loaded data is written by the effect run that writes the data, so a consumer never reads the two in disagreement"
    - "A rule that differs by entity type is read from the descriptor by field: the context names no type and no field"
    - "A stored colour is painted only after the reader parsed it: the util returns a hex colour or the empty string, never the text it was given"

key-files:
  created:
    - apps/frontend/src/lib/contexts/voter/nominationAndQuestionState.svelte.test.ts
    - apps/frontend/src/lib/utils/color/ensureColors.test.ts
  modified:
    - packages/app-shared/src/data/schemas/storedSettings.schema.ts
    - packages/app-shared/src/data/schemas/storedSettings.schema.test.ts
    - packages/app-shared/src/settings/dynamicSettings.type.ts
    - packages/app-shared/src/settings/dynamicSettings.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts
    - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts
    - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.type.ts
    - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts
    - apps/frontend/src/lib/contexts/utils/questionRollup.ts
    - apps/frontend/src/lib/contexts/utils/questionRollup.test.ts
    - apps/frontend/src/lib/contexts/voter/nominationAndQuestionState.svelte.ts
    - apps/frontend/src/lib/utils/color/ensureColors.ts
    - apps/frontend/src/lib/utils/localizedText.ts
    - apps/frontend/src/lib/utils/localizedText.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts
    - apps/frontend/src/lib/api/base/dataWriter.type.ts
    - .claude/skills/components/context-reactivity.md

key-decisions:
  - "The organization member of hideIfMissingAnswers is required in the settings type, as the candidate's is; no template had to state it, because the templates are typed loosely"
  - "The name clause is false while no entity is loaded: it never falls back to another type's descriptor"
  - "ensureColors refuses a member that is not a string and a result that is not '#' and six hex digits, beside a value the parser refuses"
  - "The listed entity's colour is left out, not handed on as an empty pair, when the stored value is not a colour"
  - "The widened page.params annotation is gone: the generated route types carry both params"
  - "An unrouted colour path outside this plan's scope (an election's colour) is reported and not changed: routing it would adjust election colours for contrast on the voter side"

patterns-established:
  - "questionsReady before an empty list: a page reads the list only once the fact says it was rolled up"

requirements-completed: []

coverage:
  - id: D1
    description: "The two settings keys parse, are typed and ship as false; a stored nominations lock of a readable row comes back from the provider"
    requirement: GEN-03
    verification:
      - kind: unit
        ref: "storedSettings.schema.test.ts (7 new cases, all red at 849cdea17) and supabaseDataProvider.test.ts (2 new cases, both red at 849cdea17); green at 01422275a"
        status: pass
    human_judgment: false
  - id: D2
    description: "nominationsLocked follows access.nominationsLocked and no other key, reactively"
    requirement: GEN-03
    verification:
      - kind: unit
        ref: "contestantContext.svelte.test.ts, 'the nominations lock' (5 cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The question scope is the loaded entity's type; with none loaded the lists and blocks are empty and no lookup is made"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "contestantContext.svelte.test.ts, \"the question scope is the loaded entity's type\" (6 cases); questionRollup.test.ts (3 new cases)"
        status: pass
    human_judgment: false
  - id: D4
    description: "questionsReady is true only after a rollup for a loaded entity with a selected election, and never disagrees with the lists in what a consumer reads"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "contestantContext.svelte.test.ts, 'questionsReady' (6 cases)"
        status: pass
    human_judgment: false
  - id: D5
    description: "profileComplete counts a required name field only while the name is editable, by the descriptor's rule"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "contestantContext.svelte.test.ts, 'profileComplete and the required name fields' (15 cases); contestantUserDataState.svelte.test.ts (1 case for savedLocalizedNames)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The voter filter hides an organization with a missing answer when its key is on, and the candidate key decides as it did"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "nominationAndQuestionState.svelte.test.ts (10 cases; 3 red at cd767c93f, green at e2c69ee54)"
        status: pass
    human_judgment: false
  - id: D7
    description: "ensureColors returns a hex colour or nothing, and the list of the user's entities hands its colour on through it"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "ensureColors.test.ts (43 cases; 35 red at 19fbab045, green at 3298f5931); supabaseDataWriter.test.ts (5 new cases, red on the working tree, green at f50405ab8)"
        status: pass
    human_judgment: false
  - id: D8
    description: "The gate rows and one full default E2E run on this tree, every project at its total in the plan-05 run"
    verification:
      - kind: other
        ref: "175-verdict.mjs gates 175-08-close --rows … (exit 0)"
        status: pass
      - kind: e2e
        ref: "175-verdict.mjs e2e 175-08-close --same-projects-as 175-05-close … (exit 0; 226 passed, 110 projects compared, 0 not as expected)"
        status: pass
    human_judgment: false
  - id: D9
    description: "An organization asked its own questions, the neutral page for a known zero, and the hidden-for-missing-answers sentence, as a browser shows them"
    verification: []
    human_judgment: true

duration: 29min
completed: 2026-10-08
status: complete
---

# Phase 175 Plan 08: What the Pages Read from the Settings and the Context, and the Reader Half of the Colour Mitigation — Summary

**The frontend now holds the two settings keys the database and the UI contract name (`access.nominationsLocked`, `entities.hideIfMissingAnswers.organization`); the contestant context exposes `nominationsLocked` and `questionsReady`, asks each entity the questions of its own type and counts a missing required name in `profileComplete` only while the name can be edited; the voter filter has an organization arm; and `ensureColors` returns a hex colour or nothing. Each was shown red first. The nine gate rows are at 0 and the full run is 226 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run in 110 projects, each at its total in `175-05-close` — the first full-browser proof of plans 06, 07 and this one. No page reads the new accessors yet, and one colour path outside this plan's scope is reported open.**

## Performance

- **Duration:** about 29 min (17:43Z → 18:12Z)
- **Tasks:** 3 of 3, plus the orchestrator's title rename
- **Files:** 2 created, 22 modified (1428 lines added, 125 removed)

## Commits

| # | Commit | Subject |
|---|---|---|
| 0 | `da910b4d3` | `test(175-08): the refusal measurement's title names no assumption id` (the orchestrator's extra task) |
| 1 | `849cdea17` | `test(175-08): the stored settings hold the nominations lock and the organization key` (Task 1, red) |
| 2 | `01422275a` | `feat(175-08): access.nominationsLocked and entities.hideIfMissingAnswers.organization in the shared settings` (Task 1, green) |
| 3 | `ed9256ccc` | `test(175-08): the contestant context scopes questions by the loaded entity's type and knows when they are loaded` (Task 2, red) |
| 4 | `2c97f01b8` | `feat(175-08): the contestant context exposes the nominations lock, scopes questions by entity type and knows when they are loaded` (Task 2, green) |
| 5 | `cd767c93f` | `test(175-08): the voter filter hides an organization with missing answers when its key is on` (Task 3 step 1, red) |
| 6 | `e2c69ee54` | `feat(175-08): the hide-if-missing-answers filter has an organization arm` (Task 3 step 1, green — the U-19 step) |
| 7 | `19fbab045` | `test(175-08): ensureColors returns a parsed colour or nothing` (Task 3 step 2, red) |
| 8 | `168af7abe` | `fix(175-08): ensureColors no longer passes through a colour it cannot parse` (Task 3 step 2, green) |
| 9 | `3298f5931` | `test(175-08): the contrast helper of the ensureColors cases takes a member as the util types it` (deviation 6) |
| 10 | `f50405ab8` | `fix(175-08): ensureColors no longer passes through a colour it cannot parse — every read path` (Task 3 step 3) |
| 11 | `736d113f2` | `refactor(175-08): one definition of a blank text for the name helpers and the context's name clause` (the checklist's finding) |

Each was made by pathspec. No other agent's commit sits between them.

## Each task's verify command, with its real exit status

The three `<automated>` blocks were written to script files by a script that reads the plan file, not retyped: `tests/e2e-runs/175-unit/175-08-t<N>-verify.sh` / `.log` / `.exit` / `.head`.

| Verify | Head | Exit | What it showed |
|---|---|---|---|
| **The title rename** (the test file, as the gate's `integration` row runs it) | working tree on `58aa86dc1` | **0** | 16 passed of 16 against the local stack (`175-08-rename-integration.json`) |
| **Task 1, as written** | `01422275a` | **0** | the four searches; red head `849cdea17` before the schema's commit; both red reports hold a failed case; the shared package builds; shared unit; the provider's test directory; dev-seed typecheck; `check` 2761 files, 0 errors, 0 warnings |
| **Task 2, as written** | `2c97f01b8` | **0** | the nine searches and the one negative search; red head `ed9256ccc` before the context's commit; red 22 failed of 59, green 0 failed of 59; the frontend's whole unit suite; `check` 0 / 0; ESLint on the two context directories; comment hygiene |
| **Task 3, as written** | `736d113f2` | **0** | two reads of the candidate key in the voter module; both red heads before their modules' commits; both pairs of reports; the colour and voter-context tests; comment hygiene; `gates 175-08-close --rows …` PASS; `e2e 175-08-close --same-projects-as 175-05-close …` PASS |

No verify stage had a defect, and no check was edited.

## Gates and runs

**Gate rows `175-08-close`** — `tests/e2e-runs/175-gates/175-08-close`, head `736d113f2`, driver exit 0, on AC power, no Sleep entry in the window.

| Row | Exit | Seconds | Numbers |
|---|---|---|---|
| typecheck | 0 | 18 | |
| lint | 0 | 44 | `yarn lint:check`, every link |
| integration | 0 | 3 | **16 cases: 16 passed, 0 failed, 0 skipped** (`integration.json`) |
| unit | 0 | 35 | frontend **174 files passed, 1 skipped; 3021 tests passed, 16 skipped** (2919 at `175-07-close`, +102); app-shared 10 files; dev-seed 68 files; the harness's own 7 files / 102 tests |
| check-frontend | 0 | 9 | |
| build | 0 | 15 | |
| format | 0 | 18 | |
| docs-links | 0 | 2 | |
| name-gate-self-test | 0 | 0 | |

- `node 175-verdict.mjs gates 175-08-close --rows typecheck,lint,integration,unit,check-frontend,build,format,docs-links,name-gate-self-test` → **exit 0, PASS** (`175-08-close.verdict.txt`): every row 0; "not stale: head 736d113f2 is tree-equal to HEAD outside .planning/".
- The same without `--rows` → **exit 1**, "not the full gate set of 14" (`175-08-close.refusal-full-set.txt`).
- `175-verdict.mjs scope` and `… hygiene` both exit 0 at `736d113f2`.

**Full run `175-08-close`** — `tests/e2e-runs/175-e2e/175-08-close`, head `736d113f2`, through `175-e2e.sh 175-08-close --require-project perm-organization-editing`, driver exit 0, wrapper exit 0, 18:05:31Z → 18:11:32Z.

- **226 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 110 projects**; Playwright 5.3 min.
- Preflight 1 success, 0 failures; no void marker; largest heartbeat lateness 114 ms; no Sleep entry in the window; on AC power at both ends; the dev-server log holds no Svelte warning; Docker VM 14.55 GiB free.
- Required project `perm-organization-editing`: 4 of 4.
- **Against `175-05-close`:** `node 175-verdict.mjs e2e 175-08-close --same-projects-as 175-05-close --expect-project perm-organization-editing --expect-project contestant-journey --expect-project contestant-a11y-scan` → **exit 0, PASS** (`175-08-close.verdict.txt`): one line per project, **110 compared, 0 not as expected** — every project at its total in the plan-05 run.

No run was void and none was red. One full run was made, on the first attempt.

**What the run is the first browser proof of:** plan 06's `Input` attributes on every contestant page; plan 07's store and writer under the profile and question pages of both entity types; this plan's question scope for every organization and candidate session of the suite, and the voter context with the widened setting.

## What was built — every name

### The settings (`@openvaa/app-shared`)

| Where | What |
|---|---|
| `StoredSettingsSchema` | `access` gains `nominationsLocked: z.boolean().optional()`; `entities.hideIfMissingAnswers` is `z.strictObject({ candidate: z.boolean().optional(), organization: z.boolean().optional() })`. Both objects still reject an unknown key |
| `DynamicSettings` | `access.nominationsLocked?: boolean` — "an entity's own users can no longer add or change that entity's nominations. A project admin still can. The database enforces the lock from this same stored key, so the app only reads it to say so". `entities.hideIfMissingAnswers[ENTITY_TYPE.Organization]: boolean` — required, as the candidate's member is. The sentence that said the setting is supported for candidates alone now says each served type has a key of its own |
| `dynamicSettings` (the shipped defaults) | `access.nominationsLocked: false`, `entities.hideIfMissingAnswers.organization: false`. The candidate default stays `true` |

A stored `access.nominationsLocked: true` now survives the provider's parse and is returned; before, the strict parse refused the key and reported it, and the lock read as its default.

**The templates read against the widened schema** (`git grep -n -e "hideIfMissingAnswers" -e "answersLocked" -- packages/dev-seed/src tests/tests`): `default.ts`, `e2e/base.ts`, `e2e/perm/shared.ts`, `e2e/perm/perm-answers-locked.ts`, `e2e/perm/perm-hide-if-missing-answers.ts`, `e2e/perm/perm-organization-editing.ts` and `_helpers/buildMinimal.test.ts`. **None changed**: `yarn workspace @openvaa/dev-seed typecheck` exits 0 and its unit suite is 1037 of 1037 with the organization member required, because the templates' settings are typed loosely. The phase's dataset still states `candidate: false` and no `organization` key; the default it merges over is `false`.

### The contestant context (`contestantContext.svelte.ts`, `.type.ts`)

```ts
// ContestantContext — both are reactive accessors: read ctx.X, never destructure
nominationsLocked: boolean;
questionsReady: boolean;
```

- **`nominationsLocked`** — `#nominationsLocked = $derived(!!this.#appSettings.access.nominationsLocked)` beside `#answersLocked`, with a prototype getter beside `get answersLocked()`. The context reads the key for this accessor and nowhere else. No surface of this phase reads it.
- **The type scope** — `#loadedEntityType = $derived(this.#userData.savedEntityData?.type)`, declared after `#userData`, which it reads. The rollup effect takes it in place of the hard-coded candidate type. With no loaded entity it writes four empty lists and empty blocks and returns: no `appliesTo` and no `getApplicableQuestions` call is made, scoped or unscoped. With one it rolls up as before, and builds the blocks, with that type. `dataRoot` is still read inside the effect and passed by value.
- **`questionsReady`** — `#questionsReady = $state(false)`, written in every run of the rollup effect, in the block that writes the lists: `false` on the no-entity path, and `elections.length > 0` after a rollup. So it is `true` exactly when the run had a loaded entity's type and at least one selected election — whether that rollup produced questions or none.
- **The name clause** — `#requiredNameMissing`, a `$derived.by`:
  1. `false` unless `isNameEditable(this.#selectedEntity, this.#answersLocked)`;
  2. `false` while the store holds no entity;
  3. otherwise, over `entityDescriptorOf(loadedEntityType).identityFields`, true when some field's rule is unmet by the **saved** value: `'requiredLocale'` → `missingRequiredLocale(savedLocalizedNames[property], requiredNameLocale())`; `'always'` → `isBlankText(savedEntityData[property])`; `'never'` → nothing.

  `#profileComplete` is `unansweredRequiredInfoQuestions.length === 0 && unansweredOpinionQuestions.length === 0 && !#requiredNameMissing`. The clause names no entity type and no field: each is read from the descriptor by `property`.
- **The annotation of ruling 7 is gone.** `const { entityType, entityId } = page.params;` type-checks without the widened `Record<string, string | undefined>`: `.svelte-kit/non-ambient.d.ts` now carries both params on the routes below `[entityType=servedEntityType]/[entityId=uuid]` and as optional members above them, and `check` is at 0 errors.
- `questionRollup.ts`'s header says what the contestant app passes: the type of the entity it has loaded, and no call while it has none.

### The store (`contestantUserDataState.svelte.ts`, `.type.ts`)

```ts
/** The saved name and short name of the loaded entity by locale, without unsaved edits.
 *  undefined while no entity is loaded and for an entity type whose names are not stored by locale. */
readonly savedLocalizedNames: LocalizedEntityNames | undefined;
```

A `$derived` over the saved data beside `savedEntityData`, with a prototype getter. It is the read plan 175-07 foresaw.

### The text helper (`lib/utils/localizedText.ts`)

```ts
export function isBlankText(value: unknown): boolean;   // true unless a string with something other than whitespace
```

`missingRequiredLocale` is now `isBlankText(value?.[locale])`, so "blank" has one definition for a single text and for one locale's entry.

### The voter filter (`nominationAndQuestionState.svelte.ts`)

One statement beside the candidate arm, before the existing organization branch:

```ts
if (entityType === ENTITY_TYPE.Organization && hideIfMissing?.organization) {
  nominations = nominations.filter((n) => opinionQuestions.every((q) => n.entity.getAnswer(q) != null));
}
```

`opinionQuestions` is the election's opinion questions for the organization type, as the candidate arm takes a candidate's. The two reads of `hideIfMissing?.candidate` — the candidate arm, and the removal of candidates from an organization's children with the drop of an organization left with none — are untouched (2 at the base, 2 now). The documentation of the factory moved from the dependency type, where it sat, onto the factory, and each getter of the dependency type has a line.

**This is the U-19 step, and it is one commit** (`e2c69ee54`, with its test in `cd767c93f`): dropping it is a revert of those two, plus items (b) to (d) of the plan's ruling 2.

### The reader (`lib/utils/color/ensureColors.ts`)

```ts
export function ensureColors({ normal, dark }: Partial<Colors>): WithRequired<Colors, 'dark'>;
```

Each member goes through one helper, `adjustedOrNothing(color, background)`: the empty string unless the value is a non-empty string, `adjustContrast` reads it, and the adjusted result is `#` and six lowercase hex digits. `normal` is that; `dark` is the given dark colour through the same helper, or else the ensured normal colour adjusted for the dark background, or else the empty string. Nothing that was passed in is ever returned as it was passed.

### Every read path of a stored colour (Task 3 step 3)

Derived with `git grep -n -E "([^A-Za-z]|^)color([^A-Za-z]|$)" -- apps/frontend/src/lib/api apps/frontend/src/lib/contestant/utils apps/frontend/src/lib/contexts` (the plan's `\b` form prints nothing on this host), and a search of every component that writes a colour into a `style`.

| Path | Through the util? |
|---|---|
| Voter app, entities: `UniversalDataProvider.getNominationData` and `getEntityData` → `this.ensureColors` → `Avatar`, `EntityTag`, the statistics page | yes, as before |
| Voter app, question categories: `getQuestionData` → `CategoryTag`, `ScoreGauge` | yes, as before |
| The admin app's `loadElectionData`, the server-side local adapter | yes: both extend the same base |
| **Contestant app, the listed entities**: `_getUserEntities` → `UserEntity.color` → `userEntityData` → the `DataRoot` of the selection screen | **was not; routed in `f50405ab8`.** The stored JSON is parsed by `parseColorColumn`, passed through `ensureColors`, and left out when it yields no colour. The cast `entry.color as Colors \| null` is gone. A malformed column is reported once, with its column and row and never its value |
| Contestant app, the entity read: `_getEntityUserData` → `entity.color` (through `toDataObject`, unparsed) → the store → the profile page and the preview | **no, recorded for plans 175-09 and 175-11.** The profile's colour `Input` parses what it shows (plan 175-06). The preview hands the entity to a `DataRoot`, which is plan 175-11's read to route |
| The writer's read-back after a save: `colorOf(parseColorColumn(…))` | validated as hex by its schema; reaches the same store |
| The entity layout's `dr.provideEntityData(ud.nominations.entities)` | holds no entity: the entity read answers `entities: {}` |
| A nomination's own `color` (`nomRow.color` in the provider) | not through the util, and painted by no component found: `Avatar` and `EntityTag` unwrap to the entity |
| **An election's `color` → `ElectionTag`'s `style`** | **no — outside this plan's scope, reported under Threat Flags** |

## Task 1 — the cases

**Red at `849cdea17`:** app-shared 148 cases, **7 failed** (all seven new ones: the two acceptances, the two wrong-typed leaves, the two "still rejects an unknown key" cases — which named the new key among the unknown ones — and the shipped defaults); the provider's file 110 cases, **2 failed** (a stored nominations lock, a stored organization key). **Green at `01422275a`.**

## Task 2 — the cases, and what was rewritten

**Red at `ed9256ccc`** (`175-08-context-red.json`, exit 1): 59 cases over the two files, **22 failed, 37 passed**, every failure an `AssertionError`. The store's file beside it: 66 cases, 1 failed (`175-08-store-red.json`). **Green at `2c97f01b8`:** 59 of 59 and 66 of 66. All three test files are identical at the two heads.

- **The describe that pinned the candidate scope is rewritten, title included**: "contestantContext — the question scope is the loaded entity's type". It asserts the loaded type on every `appliesTo` and every `getApplicableQuestions` call for both types, the lists and blocks by type, empty lists and no lookup at all with no entity, and the lists following the store from one type to the other and to none.
- **The harness changed with it.** The shared spy and the stub `{ current: undefined }` of the store are gone. The app context's settings and data root and the store's data are read anew on every access from a box a test fills, with a plain value or with a getter over a `$state.raw`, so a change reaches the provider as a change of the real collaborator does. Fake categories answer a lookup as the data model does: a question addressed to one type for that type and for an unscoped lookup.
- **The describe of the user-level accessors is as it was**, but for its harness lines: its `afterEach` resets the boxes, and the line that primed the removed spy is gone. No expectation of it changed.
- **Controls that passed in red:** the candidate half of each scope case; `profileComplete` for a confirmed organization, a confirmed candidate, the answers lock, an entity with its name, and the two "as before" cases; the rollup's three new cases, which the rollup already satisfied.

## Task 3 — the cases

- **The voter filter**, red at `cd767c93f`: 10 cases, **3 failed** (the key on; the question set an organization must have answered; both keys on). The 7 that passed are the controls: the key off, absent, absent with the whole setting; no opinion question for organizations; the organization key on with the candidate key off leaves candidates and children alone; and the two cases that pin the candidate key's existing behaviour, on and off. **Green at `e2c69ee54`.**
- **`ensureColors`**, red at `19fbab045`: 43 cases, **35 failed**. Observed live in the red run: `'#fff; background: url(x)'` and `'expression(alert(1))'` were returned as given, and a member that is not a string threw (`color.reduce is not a function`). **Green at `3298f5931`** (deviation 6).
- **The listed colour**, red on the working tree before the adapter changed (`175-08-listed-red.json`, 5 failed of 149: the stored injection string was handed on as stored); **green at `f50405ab8`**, 149 of 149.

## The code review checklist

Over the three tasks; § *Supabase Adapter* applies because step 3 routed the listed-entity read. Recorded before the gate rows; the one finding was fixed before them.

| Item | Outcome |
|---|---|
| Solves the issue | yes for what the pages will read; no page reads the new accessors yet |
| OWASP top 10 | T-175-38: the reader returns a hex colour or nothing, with the injection shapes red first; the listed-entity path is routed. T-175-39: the key parses and a stored `true` comes back. T-175-40: no unscoped call and no fallback to candidates, asserted. **One path found open and not changed: an election's colour**, under Threat Flags |
| Code style guide | `Array<T>`, explicit return types, TSDoc on every export and helper; the caller above the helper in `ensureColors.ts` and `localizedText.ts`; module helpers above the class in the context, as the file has them |
| No `any` | none. Test fixtures use `as unknown as`, as their siblings do |
| No repetition | **Finding, fixed in `736d113f2`:** the name clause carried its own "blank text" predicate beside the one inside `missingRequiredLocale`; it is `isBlankText` once. The hex form `ensureColors` returns (`#` and six lowercase digits) is its own constant: `STORED_HEX_COLOR` is the stored grammar, three or six digits in either case |
| New entities documented | both accessors and the store's getter in their `.type.ts`; the settings members; `isBlankText`; the voter factory and its dependencies; `UserEntity.color` |
| Repo markdown | `.claude/skills/components/context-reactivity.md` § 1b names both accessors and says the lists are scoped. The docs site is plan 175-13's (below) |
| Tracking events | none: a settings key, an accessor and a filter arm add nothing a user reaches by itself |
| New Svelte components | none |
| Errors handled and logged | a malformed listed colour is reported at `error` by the shared parse; a colour the reader drops on the voter side is logged at `debug` by the parser, as before |
| Failing checks | `yarn workspace @openvaa/frontend check` was at 1 error for two commits (deviation 6) |
| Parts sharing the dependency | every consumer of the lists is under a selected entity (the entity routes, `ContestantNav`'s entity items, `LogoutButton`); the full run holds every project at its total. `UserEntity.color` is read by `userEntityData` alone |
| Supabase adapter: mixin · row mapping · auth | unchanged; `assert:adapter-casts` and `assert:project-scoped-queries` exit 0; one cast removed |
| WCAG, keyboard, screen reader | no markup |
| Comment hygiene | every added or changed comment read; `yarn assert:comment-hygiene` exit 0 before each commit. The rewritten test header lost a line-number reference and a sentence of history |
| Commit history | linear. **Finding, not fixable without rewriting history:** `3298f5931` is a fix of `19fbab045` |
| `[db]` tag | no database change |

## Deviations from Plan

**1. The orchestrator's extra task came first, as its own commit** (`da910b4d3`). The title of the refusal measurement no longer begins "A2: ". Plan 175-07's Task 3 verify read that prefix among its five prescribed titles; that plan is complete and nothing was re-run against it. The integration file was run against the local stack before the commit: 16 of 16.

**2. The organization member is required in the settings type**, as the candidate's is, and no template states it. The plan foresaw a template that would no longer typecheck; none did.

**3. `contestantUserDataState.svelte.test.ts` gained one case**, a file the plan does not list, for the getter the plan asks a unit case for. Its red and green reports are `175-08-store-red.json` and `-green.json`.

**4. The name clause is false while the store holds no entity.** The plan's text goes from "name editable" straight to "the descriptor of the loaded entity's type"; with no loaded entity `entityDescriptorOf` would answer with the candidate's descriptor, and a signed-in user on a page with a selected entity and a store not yet filled would read "incomplete" for a candidate's name fields. The two question terms are vacuously true in that state, so the clause follows them.

**5. `ensureColors` refuses more than "does not parse".** A member that is not a string, and an adjusted result that is not `#` and six hex digits, are nothing too. The parser accepts functional notation with channels out of range, from which `rgbToHex` builds five digits. Without the first, a stored non-string threw inside the luminance calculation.

**6. Two commits sit in the history with one svelte-check error, in a test file.** The red commit of the colour cases, `19fbab045`, passed the util's `dark` member (typed `string | null`) to a helper that took `string`. I ran `check` before the fix's commit and chained the commit after it with `;`, so `168af7abe` was made with `check` at exit 1, on that one line. Corrected in the next commit, `3298f5931`, before anything else was built on it. At `19fbab045` and `168af7abe`, `yarn workspace @openvaa/frontend check` exits 1 and the unit suite passes; from `3298f5931` on both are 0. The green report was taken again at `3298f5931`; the one taken at `168af7abe` is kept as `175-08-colors-green.at-168af7abe.json`. **Cost: one fix of itself in the history.**

**7. The listed colour's cases were shown red on the working tree, not in a commit of their own.** The plan asks for one commit for step 3; the red report names its head and says the adapter was unchanged.

**8. `dataWriter.type.ts` gained a doc line on `UserEntity.color`**, a file the plan does not list: the member now holds the shown colours, not the stored value, and a page must not read the editable colour from it.

**9. A twelfth commit, `736d113f2`**, for the checklist's finding, as Task 3's step 5 allows. It touches `localizedText.ts` and its test, which the plan does not list.

**10. A listed entity whose stored colour is not a colour has no `color` member**, where the voter side holds `{ normal: '', dark: '' }` for the same case. Both render as "no colour".

**11. The green reports were taken on the commits that hold the code**, after each commit, so that each `.head` names a tree with it; each suite had passed on the working tree first.

**12. The voter module's documentation moved** from the dependency type onto the factory it describes, with a line per dependency. The plan asks that the parameter's doc line and the header say what the module does.

**Not recorded in `.planning/WINDOWS.md`:** there is no stub, no skipped test and no verify left unrun.

## What was not done or not verified

- **No spec asserts the new behaviour in a browser**, by the plan: no test was added to the suite. The full run shows that nothing regressed over the new scope, the new filter arm and the new reader; that an organization is asked its own questions on a page, that a known zero shows the neutral page and that the hidden-for-missing-answers sentence is true are plans 175-09, 175-10 and 175-12's to show.
- **An election's colour is painted unparsed** (Threat Flags). Not changed.
- **The entity read still hands `color` on unparsed** to the store. The preview's read is plan 175-11's.
- **The U-19 fallback was not exercised.**
- **`CLAUDE.md` § *Context Destructuring Rule* does not name the two accessors.** The research's Pattern 4 says a new accessor joins that list; the file is the orchestrator's.
- **The docs site is stale** on both settings and on the context's accessor list (below, for plan 175-13).
- **On the sign-in pages of a closed project**, for a caller who can read no settings row, `access.nominationsLocked` reads the shipped `false`, as `access.answersLocked` does: the provider's public configuration honours three stored values and this is not one.
- **`parseColorString` has a defect this plan did not touch**, logged in `deferred-items.md`.
- **`GEN-01` and `GEN-03` are not completed by this plan**: it supplies what the pages read. `requirements-completed` is empty on purpose.

## What the next plans should know

**175-09 (profile).**
- `ctx.profileComplete` is now false for an unconfirmed entity whose required name is not saved, even with every question answered. The page that says "not done" should be able to say why.
- `userData.savedLocalizedNames` is the saved names by locale; `userData.current?.localizedNames` includes unsaved edits.
- **Do not read the editable colour from `ctx.selectedEntity.color` or `ctx.entities`**: it is adjusted for contrast and has a derived dark member. The stored colour is `userData.current?.entity.color?.normal`.
- The setting is read as `appSettings.entities?.hideIfMissingAnswers?.[key]` with `key = entityDescriptorOf(type).hideIfMissingAnswersKey`; both keys are members of the type now.
- `isBlankText` is exported from `$lib/utils/localizedText`.

**175-10 (questions, home, nav).**
- Three states, in this order: `!ctx.questionsReady` → loading; `ctx.questionsReady && ctx.opinionQuestions.length === 0` → the known zero; otherwise the page. While `questionsReady` is false the lists may hold a rollup made with no election and mean nothing.
- On the phase's dataset: organization A is asked the three organization opinion questions (two answered) and two info questions; organization B the same with none answered and `profileComplete` false also for its name, which has no `en` entry; **the candidate is asked no opinion question** (`qu-info-cand` alone, not required), so it is the known-zero case with `questionsReady` true and `profileComplete` true. Before this plan each organization was asked the candidate's question.
- `LogoutButton` and the home, profile and questions pages still read `hideIfMissingAnswers?.candidate` for every type.

**175-11 (preview).** `userData.current.entity.color` is the stored value, unparsed. Pass it through `ensureColors` before it reaches a `DataRoot`; for a value that is not a colour the util answers `{ normal: '', dark: '' }`, which `Avatar` renders as no colour.

**175-12 (E2E).** A stored `access.nominationsLocked: true` no longer breaks the frontend's settings parse, so a setup may write it: `SupabaseAdminClient.updateAppSettings({ access: { nominationsLocked: true } })`. With `entities.hideIfMissingAnswers.organization: true`, organization A (one opinion answer missing) leaves the voter's results. With `candidate: true`, every organization of this dataset leaves them, having no candidate.

**175-13 (docs and close).** Sentences on the two settings and the accessors, from `git grep -n -e "hideIfMissingAnswers" -e "answersLocked" -- apps/docs/src`:
- `developers-guide/configuration/app-settings/+page.md` — the table has `entities.hideIfMissingAnswers.candidate` and no `.organization` row (default `false`), and `access.answersLocked` and no `access.nominationsLocked` row; the "No row" paragraph lists what stays at its default for a closed project.
- `publishers-guide/app-settings/+page.md` — "`hideIfMissingAnswers`: … This is currently only supported for candidates." is no longer true; `answersLocked` is listed under `access` and `nominationsLocked` is not.
- `developers-guide/frontend/contexts/+page.md` — the paragraph that lists the reactive accessors does not name `nominationsLocked` and `questionsReady`.
- `developers-guide/frontend/components/generated/contestant/components/logoutButton/LogoutButton/+page.md` and the four route docstrings that say "`entities.hideIfMissingAnswers.candidate`: Affects message shown" follow plans 175-09 and 175-10.
- `developers-guide/contestant-app/registration/+page.md` names `access.answersLocked` and needs nothing.
- `.claude/skills/components/context-reactivity.md` is updated; `CLAUDE.md` is not.

**Phase 176 (nominations).**
- **The lock is `ctx.nominationsLocked`**, a reactive accessor: read it on the context, never destructure it. It is `!!appSettings.access.nominationsLocked`. The database locks on the JSON boolean `true` alone, and the schema refuses any stored value that is not a boolean, so the two agree.
- **`questionsReady` stays false for an entity with no selected election** — one whose election cannot be resolved, and one with no nomination at all. Today the entity layout's server load signs such an entity out before a page renders. Once that sign-out goes, the questions pages would show their loading state for good. "This entity has no nomination" must be decided from the entity's own nominations (`userData.current?.nominations.nominations`), before `questionsReady` is consulted; `questionsReady` cannot tell "not loaded yet" from "nothing to load questions for".
- The selected-elections effect answers an unresolvable election by logging and selecting none, which reads the same way.

**Phase 177** reads the same accessor. **Phase 179** can import `isBlankText`.

**Orchestrator.** Nothing in `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` or `CLAUDE.md` was edited; `CAND-APP-PLAN.md` stays untracked; nothing under `tests/e2e-runs/` was deleted; nothing under `.planning/phases/176-*` was touched. Two points are open for a ruling: the election colour (Threat Flags) and whether `CLAUDE.md`'s rule should name the two accessors.

## The state the local database is left in

Unchanged in kind from plan 175-07's close. No reset was run; no schema file changed. Read with `psql` after the full run:

- Schema: the tree's. pgTAP's helpers are still in `public`, so `yarn db:types` is valid only after another reset.
- Data: `seed.sql` plus the `default` dataset in the default project (1 election, 328 candidates, 8 organizations), which the gate's `unit` row writes again.
- The E2E project `…00e2` exists and holds no election, candidate or organization: every teardown of the full run passed. The empty project `…05c1` exists.
- Auth users: 2, those of `seed.sql`.
- The integration test ran twice against the default project (once for the rename, once in the gate); each run's teardown assertion passed.
- The Supabase stack and Docker were never restarted; `docker builder prune -af` ran once, inside the E2E driver.

## Files touched that the plan did not list

- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts` (the orchestrator's task)
- `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts` (deviation 3)
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` (the unit cases step 3 asks for)
- `apps/frontend/src/lib/api/base/dataWriter.type.ts` (deviation 8)
- `apps/frontend/src/lib/utils/localizedText.ts`, `localizedText.test.ts` (deviation 9)
- `.planning/phases/175-organization-editing-profile-questions-preview/deferred-items.md` (new)

Gitignored evidence: under `tests/e2e-runs/175-unit/`, `175-08-settings-red-shared`, `-settings-red-frontend`, `-context-red`, `-context-green`, `-store-red`, `-store-green`, `-voter-red`, `-voter-green`, `-colors-red`, `-colors-green` (and `.at-168af7abe`), `-listed-red`, `-listed-green`, each with `.json`, `.log`, `.exit` and `.head`; `175-08-rename-integration.*`; `175-08-t1-verify.*`, `-t2-verify.*`, `-t3-verify.*`. Under `tests/e2e-runs/175-gates/`, `175-08-close` with its `.log`, `.exit`, `.launched`, `.verdict.txt`, `.refusal-full-set.txt`, `.scope.txt` and `.hygiene.txt`. Under `tests/e2e-runs/175-e2e/`, `175-08-close` with its `.log`, `.exit`, `.launched` and `.verdict.txt`.

## Known Stubs

None.

## Threat Flags

No file of this plan adds a network endpoint, an auth path, a file access or a schema change. One existing path was found by Task 3's derivation and is outside the plan's register, which covers a stored **entity** colour:

| Flag | File | Description |
|------|------|-------------|
| threat_flag: stored-css-injection (existing, not introduced here) | `apps/frontend/src/lib/components/electionTag/ElectionTag.svelte`; `apps/frontend/src/lib/api/base/universalDataProvider.ts` (`getElectionData`) | An election's `color` is interpolated into `style` (`--tag-color: ${election.color.normal}`) and elections do not pass through `ensureColors`. The column is written by a project admin or `bulk_import`, and plan 175-03's trigger does not bind the `elections` table. Routing `getElectionData` through the util would close it in one line and would also adjust election colours for contrast, a second voter-side change this plan was not ruled to make. Constituencies, questions and nominations carry a colour too, which no component found paints |

## Self-Check: PASSED

Checked after writing:

- The two created test files and the twenty-two modified files exist; `git diff --name-only 58aa86dc1 736d113f2` lists exactly those twenty-four paths.
- The twelve commits of the table are ancestors of `HEAD`; `git rev-list --count 58aa86dc1..736d113f2` is 12.
- `175-08-t1-verify.exit`, `-t2-verify.exit` and `-t3-verify.exit` hold 0; `tests/e2e-runs/175-gates/175-08-close.exit` and `tests/e2e-runs/175-e2e/175-08-close.exit` hold 0; both verdict files end in PASS; the run directory holds no void marker.
- The red and green reports and their `.head` files exist under `tests/e2e-runs/175-unit/`; the case counts in this file were read from them.
- `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` are unchanged since `58aa86dc1`.
