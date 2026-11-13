---
phase: 175-organization-editing-profile-questions-preview
plan: 03
subsystem: database
tags: [postgres, supabase, pgtap, triggers, validation, bulk-import, dev-seed, css-injection, migration]

requires:
  - phase: 175-organization-editing-profile-questions-preview
    provides: "plan 175-02 — the schema as of d33eccbca and a pgTAP estate of 39 files / 1740 tests"
provides:
  - "public.validate_entity_type_list () on question_categories and questions (BEFORE INSERT OR UPDATE OF entity_type): null, an empty array or an array of entity_type enum values, for every writer"
  - "bulk_import carries entity_type on question_categories and questions; nominations still skips it; the skip_columns declaration is byte-identical to 175-BASE"
  - "public.validate_entity_color () on organizations, candidates, factions and alliances (BEFORE INSERT OR UPDATE OF color): null, or an object of normal/dark, each null or # plus three or six hex digits"
  - "dev-seed: DENIED_BY_TABLE names nominations alone; entity_type on a questions / question_categories row is typed as a list of entity types; two negative-control fixtures on a nominations row"
  - "pgTAP files 40 (69 assertions) and 41 (79 assertions)"
affects: [175-05, 175-07, 175-08, 175-13, 176, 179]

actuals:
  tokens: 27400 # chars/4 over the realized diff of this plan's 19 files (109637 chars)
  tasks: 3
  commits: 13 # MEASURED: git rev-list --count 68d6da5eb..2c3b8a89c. The checkout is shared: 8 are this plan's (subjects carrying "(175-03)"), 4 are plan 175-04's and 1 is a Phase 176 docs commit.
plan_head_before: 68d6da5eb0ca0851158ace179ae0e945adaa88d1
plan_head_after: 2c3b8a89ce23fb3018182f5a13559a4da033863c

tech-stack:
  added: []
  patterns:
    - "A JSON column's shape is held by a BEFORE INSERT OR UPDATE OF <column> row trigger whose function is SECURITY INVOKER with an empty search_path, reads no role, and raises a stable prefix naming table, row and member"
    - "A pgTAP file for a validation trigger pairs every refused value with an accepted one per table, verb and session, and pins the registration by its catalogue definition text"
    - "A pgTAP assertion that counts rows is scoped to the fixture's two projects: the database a run finds may hold seeded entities"
    - "A dev-seed row type narrows a JSON column through NarrowedColumns, with a @ts-expect-error control in strictRowTypes.type-test.ts"

key-files:
  created:
    - apps/supabase/supabase/tests/database/40-entity-type-list.test.sql
    - apps/supabase/supabase/tests/database/41-entity-color.test.sql
    - packages/dev-seed/tests/fixtures/negctl-nominations-entity-type.ts
    - packages/dev-seed/tests/fixtures/negctl-nominations-entity-type-camel.ts
  modified:
    - apps/supabase/supabase/schema/011-validation-functions.sql
    - apps/supabase/supabase/schema/102-entities.sql
    - apps/supabase/supabase/schema/103-questions.sql
    - apps/supabase/supabase/schema/501-bulk-operations.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/19-entity-immutability.test.sql
    - packages/dev-seed/src/template/permittedKeys.ts
    - packages/dev-seed/src/template/types.ts
    - packages/dev-seed/README.md
    - packages/dev-seed/tests/assertKnownRowProps.test.ts
    - packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts
    - packages/dev-seed/tests/template/permittedKeys.test.ts
    - packages/dev-seed/tests/template/strictRowTypes.type-test.ts
  deleted:
    - packages/dev-seed/tests/fixtures/negctl-questions-entity-type.ts
    - packages/dev-seed/tests/fixtures/negctl-questions-entity-type-camel.ts

key-decisions:
  - "A whole-value JSON null is refused on both columns; only SQL null is the empty value. No API path produces a JSON null there (PostgREST and bulk_import both write SQL NULL)"
  - "The colour grammar is exactly # plus three or six hex digits, matched whole: no bare hex, no rgb(), no empty string, no trailing character. It was not widened"
  - "Both new triggers carry the function's own name on every table: validate_entity_type_list and validate_entity_color"
  - "The row typing lives in permittedKeys.ts, where FixedRow is declared; types.ts gained a doc sentence only"
  - "The entity tables' BEFORE UPDATE trigger census in file 19 counts the four colour registrations (20 to 24)"

patterns-established:
  - "Refusal prefixes: 'Invalid entity type list:' and 'Invalid entity color:', SQLSTATE P0001"

requirements-completed: [GEN-01]

coverage:
  - id: D1
    description: "entity_type on questions and question_categories is null, an empty array or an array of entity_type enum values, for the project admin, the fixture owner and the service role, by insert and by update"
    requirement: GEN-01
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/40-entity-type-list.test.sql (sections 1-3, 6) — yarn workspace @openvaa/supabase test:db"
        status: pass
    human_judgment: false
  - id: D2
    description: "bulk_import stores the list on the two question tables, raises and stores nothing on an unknown member, and still skips the key on nominations"
    requirement: GEN-01
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/40-entity-type-list.test.sql (sections 4-5); yarn db:seed of a scratch template stored and refused as asserted"
        status: pass
    human_judgment: false
  - id: D3
    description: "dev-seed permits the key on the two question tables in both spellings, denies it on nominations alone, and its denied set still equals the SQL's skip list in both directions"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/assertKnownRowProps.test.ts, tests/template/permittedKeys.test.ts, tests/assertKnownRowProps.builtins.test.ts (red 4 failed at 766798c47, green 1034 passed at f2c11b9f5)"
        status: pass
      - kind: other
        ref: "packages/dev-seed/tests/template/strictRowTypes.type-test.ts through tsc --noEmit (red: 3 x TS2578 at 766798c47; green: exit 0 at f2c11b9f5)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A stored color on the four entity tables is null or an object of normal/dark hex colours, for the entity's own editor, the fixture owner, the service role and bulk_import"
    requirement: GEN-01
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/41-entity-color.test.sql — yarn workspace @openvaa/supabase test:db"
        status: pass
    human_judgment: false
  - id: D5
    description: "The shipped seed data stores under both checks"
    verification:
      - kind: integration
        ref: "yarn db:seed:default on the rebuilt database (exit 0, 752 rows); dev-seed's default-template integration test; an offline survey of every colour the 31 built-in templates emit (75 rows, none outside the grammar)"
        status: pass
    human_judgment: false

duration: 58min
completed: 2026-10-08
status: complete
---

# Phase 175 Plan 03: The Entity Type Filter and the Stored Colour, Validated for Every Writer — Summary

**Two validation triggers bind every writer — `validate_entity_type_list` on the two question tables, whose key `bulk_import` now carries there, and `validate_entity_color` on the four entity tables, closing the database half of a stored-CSS-injection path that the red run observed live — with dev-seed's deny map reduced to `nominations` alone; pgTAP 39 files / 1740 tests → 41 files / 1888 tests, each new cell red on the applied schema first.**

## Performance

- **Duration:** about 58 min (12:17Z → 13:15Z)
- **Completed:** 2026-10-08
- **Tasks:** 3 of 3
- **Files:** 19 — 4 created, 13 modified, 2 deleted. Two of them are not on the plan's list (see *Files touched that the plan did not list*); two the plan listed were not changed (`07-rpc-security.test.sql`, `packages/supabase-types/src/database.ts`).

## Accomplishments

- A question or a category can be addressed to one entity type by a seed or an import, and no writer can store a list that would hide it from everyone: the unknown member is refused by table, row and member.
- `_bulk_upsert_record` carries `entity_type` on `question_categories` and `questions` through a condition in the loop. The `skip_columns` declaration is byte-identical to the one at `175-BASE`, so dev-seed's parity test still reads the array it parses.
- An entity's stored colour is a hex colour or nothing. Before the change, the organization's own editor stored `#ff0000; background: url(//evil.example/x)` on a **confirmed** organization through an ordinary update — file 41's red run shows it; after it, the same statement raises for the editor, the fixture owner, the service role and `bulk_import`.
- dev-seed's key gate, its row types, its README and its negative controls state the rule as it is: the key is carried on two tables and refused by name on the one where the column is generated.
- The migration was regenerated in both schema commits; parity held at each.

## Task Commits

1. **Task 1 — red:** `65620e64e` `test[db](175-03): entity_type is validated and carried by bulk_import on the question tables`
2. **Task 1 — schema:** `9b96c63df` `feat[db](175-03): entity_type is validated on the question tables and carried by bulk_import`
3. **Task 2 — red:** `766798c47` `test(175-03): dev-seed denies entity_type on nominations alone`
4. **Task 2 — green:** `f2c11b9f5` `feat(175-03): dev-seed permits entity_type on the question tables`
5. **Task 3 — red:** `2c882eeb4` `test[db](175-03): a stored colour is a hex colour on the four entity tables`
6. **Task 3 — schema:** `b19a9beda` `feat[db](175-03): the stored colour of an entity is validated for every writer`
7. **Task 3 — census:** `72d71e0da` `test[db](175-03): the entity tables' BEFORE UPDATE trigger census counts the four colour validations` (deviation 1)
8. **Task 3 — comment:** `2c3b8a89c` `docs[db](175-03): the accepted and refused lists of the two new pgTAP headers are sentences` (deviation 2)

Every commit that touches `apps/supabase/supabase` carries `[db]`; the two dev-seed commits carry none, as ruling 8 says. Each was made by pathspec; four commits of plan 175-04 and one Phase 176 docs commit are interleaved.

## Gates, with their real exit statuses

Evidence is under `tests/e2e-runs/175-unit/` (gitignored), as `175-03-<name>.log` / `.exit` / `.json` / `.head`.

| Gate | Exit | Numbers |
|---|---|---|
| `yarn db:status` (Task 1 step 0) | 0 | — |
| Task 1 red (`typelist-red`) | **1** | Files=40, Tests=1809; 34 failed, all in file 40; the other 39 files green |
| `yarn assert:schema-migration-parity` after `9b96c63df` | 0 | 29 schema files → 7712 lines |
| `yarn db:reset` 1 | 0 | in-flight status 0 |
| `yarn db:types` after reset 1 (`types1`) | 0 | no diff |
| Task 1 green (`typelist-green`) | **0** | Files=40, Tests=1809, PASS |
| `yarn db:lint:sql` after Task 1 | 0 | 0 errors, 3 warnings (three foreign keys without an index, none on a table this plan touches) |
| **Task 1 `<automated>` verify, verbatim** (`verify1`) | **0** | declaration identical to `175-BASE`, two registrations, commit order, red/green exits, parity, types without drift, Files=40 Tests=1809 PASS, lint 0 errors |
| dev-seed `tsc --noEmit` at `766798c47` (`devseed-typecheck-red`) | 2 | three `TS2578` unused directives in the type test |
| Task 2 red (`devseed-red.json`, head `766798c47`) | **1** | 68 files, 1034 tests: 4 failed, 1030 passed |
| dev-seed `tsc --noEmit` · `eslint src/` at `f2c11b9f5` | 0 · 0 | 0 lint errors (15 warnings, all in generator files this plan does not touch) |
| Task 2 green (`devseed-green.json`, head `f2c11b9f5`) | **0** | 68 files, 1034 tests, 0 failed |
| **Task 2 `<automated>` verify, verbatim** (`verify2`) | **0** | old pair untracked and unnamed, new pair tracked, one denied table, red head before the map's commit, report counts, 1034 passed |
| `yarn db:seed --template` of each new fixture (`negctl`, `negctl-camel`) | 1 · 1 | the deny message names the key, `nominations` and `negctl-nomtype-nom-1`; nothing written |
| Task 3 red (`color-red`) | **1** | Files=41, Tests=1888; 34 failed, all in file 41 |
| `yarn assert:schema-migration-parity` after `b19a9beda` | 0 | 29 schema files → 7786 lines |
| `yarn db:reset` 2 | 0 | in-flight status 0 |
| `yarn db:types` after reset 2 (`types2`) | 0 | `git diff --exit-code HEAD -- packages/supabase-types/src/database.ts` exits 0 |
| Task 3 applied (`color-applied`) | 1 | Files=41, Tests=1888; 1 failed — file 19 test 77, the trigger census; file 41 green (deviation 1) |
| Task 3 green (`color-green`) | **0** | Files=41, Tests=1888, PASS |
| `yarn db:lint:sql` after Task 3 | 0 | 0 errors, 3 warnings |
| `yarn db:seed:default` on the rebuilt database (`seed-default`) | **0** | 752 rows: 8 organizations and 2 alliances, each storing `{dark, normal}` |
| `yarn assert:comment-hygiene`, first run | **1** | two rule-2 findings, files 40 and 41 line 7 (deviation 2) |
| `yarn assert:comment-hygiene` at `2c3b8a89c` (`hygiene-close`) | **0** | 1903 files scanned, 0 findings |
| `yarn assert:rpc-nullability` · `yarn assert:grant-permission-enum` | 0 · 0 | — |
| `prettier --check` on every file this plan touched | 0 | — |
| **Task 3 `<automated>` verify, verbatim** (`verify3`, at `2c3b8a89c`) | **0** | four registrations parsed, commit order, red/green/seed exits, parity, types without drift, Files=41 Tests=1888 PASS, lint 0 errors, dev-seed 1034 passed, every database commit tagged |
| Task 1 and Task 2 verifies again on the closing tree (`verify1-close`, `verify2-close`) | 0 · 0 | Files=41 Tests=1888 PASS; 1034 passed |
| dev-seed `tsc --noEmit` on the closing tree | 0 | — |
| `yarn workspace @openvaa/supabase test:unit` | 0 | 18 files, 462 tests |

Not run, as the plan rules: `yarn lint:check`, `yarn typecheck`, `yarn build`, any E2E run. Plan 175-05 runs them on the tree of waves 1 and 2.

### The estate's totals

| Point | Files | Tests in a run | Sum of `plan (N)` |
|---|---|---|---|
| Before this plan | 39 | 1740 | 1731 over 38 files |
| After Task 1 | 40 | 1809 | 1800 over 39 files |
| After Task 3 — **the close of this plan** | **41** | **1888** | **1879 over 40 files** |

`00-helpers` runs 9 under `no_plan ()`. Per file: 40 `plan (69)`, 41 `plan (79)`, 19 `plan (90)` unchanged (one count inside it moved, deviation 1).

## Task 1 — the type list

### The cases of file 40, by name

| Section | Assertions | What it holds |
|---|---|---|
| 1 accepted | 32 | on `question_categories` and `questions`, by insert and by update, as the project admin: SQL null, `[]`, `["organization"]`, all four entity types — each a write and a read-back |
| 2 refused | 20 | same grid: `"organization"` (a JSON string), `{"organization": true}`, JSON `null`, `["organization", 7]`, `["candidate", "candidates"]` — each naming the table's column and what was found |
| 3 not a property of a role | 8 | `["organisation"]` refused for the fixture owner on both tables by both verbs; `"candidate"` refused for the service role on both; both fixture rows still hold the last accepted list |
| 4 import carries | 5 | `bulk_import` of a category and a question with lists succeeds and both are read back; an import whose question holds `"organisation"` raises naming `public.questions.entity_type` and the member, and neither the question nor the valid category beside it is stored |
| 5 nominations | 2 | `bulk_import` of a nomination stating `entity_type: 'organization'` on a candidate nomination succeeds; the row holds the generated `candidate` |
| 6 catalogue | 2 | the trigger is registered `BEFORE INSERT OR UPDATE OF entity_type … FOR EACH ROW` on exactly the two question tables; the function is invoker-rights with `search_path=""` |

### The red log (`175-03-typelist-red.log`, exit 1) — 34 failed, tests 33-60, 62-65, 68-69

- **33-52:** the twenty refusals of section 2, e.g. `question_categories, by insert, as the project admin: "organization" is refused, naming the table and what was found`, through `questions, by update, as the project admin: ["candidate", "candidates"] is refused, …`.
- **53-58:** the six refusals of section 3 (four as the fixture owner, two as the service role).
- **59, 60:** `<table>: after every refused update the fixture row still holds the last accepted list` — the refused values had been stored.
- **62, 63:** `bulk_import stored the list it was given on the question category` / `… on the question` — the key was skipped.
- **64, 65:** `bulk_import of a question whose list holds an unknown member raises, …` and `and that import stored neither its question nor the valid category imported before it`.
- **68, 69:** the two catalogue assertions.

Passed in red, as the plan predicts: the 32 acceptance assertions (1-32), the import's `lives_ok` (61) and the nominations pair (66, 67).

### Whether the types or a census changed

- **Generated types: no change.** `yarn db:types` after both resets left `database.ts` identical: trigger functions do not appear in the generated `Functions` map. No types commit exists.
- **`07-rpc-security.test.sql`: no change.** Its § 8c censuses cover `SECURITY DEFINER` functions and leave trigger functions out; both new functions are invoker-rights trigger functions.
- **`19-entity-immutability.test.sql`: one census moved**, in Task 3 (deviation 1).

### The migration diff of `9b96c63df`

56 lines added, 3 removed, mirroring the three schema files line for line: the header entry and the body of `public.validate_entity_type_list ()`; the header line of `103-questions.sql` and the two `CREATE TRIGGER validate_entity_type_list` statements with their comments; the comment and the two-line condition at the skip in `_bulk_upsert_record`. Nothing else.

## Task 2 — dev-seed

### The population of step 0

`git grep -n -e "entity_type" -e "entityType" -e "negctl-questions-entity-type" -- packages/dev-seed` printed 71 lines in 18 files at the commit before the task (`68d6da5eb`). Outside the task's files every line was read and none states the deny rule:

- `src/generators/FactionsGenerator.ts`, `NominationsGenerator.ts` (the generated column on nominations), `QuestionCategoriesGenerator.ts` ("JSONB filters default to NULL") — true as they stand.
- `src/templates/default.ts`, `e2e/base.ts`, `e2e/perm/shared.ts`, three `perm-*` headers, `tests/templates/*` — the app setting `contestantApp.entityTypes` or a route segment, a different thing.
- `tests/generators/NominationsGenerator.test.ts`, `tests/integration/default-template.integration.test.ts` — the nominations column, read.

Three facts the plan's text had differently:
- **`README.md` held no sentence about the key** (the plan and the research say it called the key denied on the question tables). A section *Scoping a question by entity type* was added under *Template shape reference*; the verify's `README.md` commit link is satisfied by it.
- **`tests/template/permittedKeys.test.ts` did not restate the map.** A `describe` of three cases on `DENIED_BY_TABLE` and `deniedKeys` was added.
- **The rows are typed in `permittedKeys.ts`** (`FixedRow`), not in `types.ts`. The narrowing went where the type is; `types.ts` gained two doc sentences.

### The cases that were red (`175-03-devseed-red.json`, exit 1, 4 of 1034)

- `assertKnownRowProps — entity_type is denied on nominations, … › PERMITS entity_type, in both spellings, on the two question tables, where the RPC carries it`
- `… › denies entity_type on nominations alone, the one table where the column is generated`
- `deniedKeys — entity_type, on the one table where the RPC discards it › declares one denied column on one table`
- `… › denies nothing on the two question tables, where the column is a filter list the RPC carries`

The parity case (`DENIED ∪ EXCLUDED equals the RPC’s skip_columns array, in BOTH directions`) was green on both sides with the SQL as Task 1 left it. The typecheck was red at the same commit on the three new `@ts-expect-error` controls and green after.

### The new fixtures

`negctl-nominations-entity-type.ts` and `-camel.ts`, prefix **`negctl-nomtype-`**, shared by the pair and by nothing else. Each states every collection: one election, one constituency group, one constituency, one organization and one organization nomination that names all three by their final prefixed ids, carrying `entity_type: 'organization'` (snake) or `entityType: 'organization'` (camel). The old pair was removed with `git rm`, not edited. Run through the CLI, each exits 1 before any write. A scratch copy without the denied key, with a typed category (`entity_type`) and a typed question (`entityType`), seeded with exit 0 and stored `["organization", "alliance"]` and `["organization"]`; a second copy with `['organisation']` exited 1 with `bulkImport failed: Invalid entity type list: column public.questions.entity_type on row … holds the member "organisation", …` and stored nothing. Both scratch files lived outside the repository and their rows were torn down.

## Task 3 — the colour

### The survey (step 0), every form found

Command: `git grep -n -E "color\s*:|faker\.color|'color'|\"color\"" -- packages/dev-seed/src packages/dev-seed/tests tests/tests apps/supabase/supabase/seed.sql apps/supabase/supabase/tests`.

| Where | Form | Stored? |
|---|---|---|
| `templates/default.ts` (8 organizations), `defaults/alliances-override.ts` (2), `e2e/base.ts` (9), `perm-analytics-tracking.ts`, `perm-org-matching.ts`, `perm/shared.ts` (2 each) | `{ normal: '#rrggbb', dark: '#rrggbb' }`, lower-case | yes — inside the grammar |
| `generators/OrganizationsGenerator.ts` | `{ normal: faker.color.rgb(), dark: faker.color.rgb() }`; faker 10.6.0 returns `#rrggbb` lower-case (5000 samples, all matching) | yes — inside the grammar |
| `template/types.ts` (a doc example) | the same pair | not a writer |
| `permittedKeys.ts` (ten key lists), `36-entity-identity.test.sql` (two key names) | the key's name only | not a value |
| `seed.sql`, `tests/tests`, `00-helpers.test.sql` | no colour at all | — |
| **`tests/determinism.test.ts`, `tests/locales.test.ts`** | **a bare string, `color: '#111111'` / `'#1a4d8f'`, on an organization row** | **no** — both feed in-memory rows to `runPipeline` / `fanOutLocales` and never reach a client |

An offline pass over the output of all 31 built-in templates found 75 colour-bearing rows (71 organizations, 4 alliances), every one `{dark, normal}` in hex, none outside the grammar. **No stored form lies outside the grammar, and the grammar was not widened.** The two bare strings are reported, not changed: they are outside the grammar's form but are never stored, and a bare string could not have been stored through `bulk_import` before this plan either (it is quoted as text and the JSON cast fails).

### The cases of file 41, by name

| Section | Assertions | What it holds |
|---|---|---|
| 0 fixture | 1 | the fixture's two projects store no colour on any entity |
| 1 accepted on `organizations` | 36 | as the organization's own editor by update, and as the fixture owner by insert and by update: SQL null, `{}`, `{"normal": "#1f4ea0"}`, `{"normal": "#abc", "dark": "#A1B2C3"}`, `{"normal": "#1f4ea0", "dark": null}`, `{"normal": "#2546a8", "dark": "#6b8dd6"}` — each a write and a read-back |
| 2 refused on `organizations` | 27 | twelve values as the editor by update and as the fixture owner by insert: a JSON string, a JSON array, JSON `null`, `"red"`, `"#ff0000; background: url(//evil.example/x)"`, the number `16711680`, `"#ff000"`, `"rgb(255, 0, 0)"`, a `light` key, a `dark` of `"red"` beside a valid `normal`, `"#ff0000\n"`, `""`; two of them as the service role; the fixture row still holds the last accepted colour |
| 3 the other three tables | 9 | `candidates` as the candidate's own editor, `factions` and `alliances` as the project admin: the CSS-carrying value refused, the shipped pair stored and read back |
| 4 `bulk_import` | 4 | as the service role: an organization with a hex pair is stored; an import whose second organization carries CSS raises and stores neither organization |
| 5 catalogue | 2 | the trigger is registered `BEFORE INSERT OR UPDATE OF color … FOR EACH ROW` on exactly the four entity tables; the function is invoker-rights with `search_path=""` |

### The red log (`175-03-color-red.log`, exit 1) — 34 failed, tests 38-65, 68-69, 76-79

- **38-49:** the twelve refusals as the organization's own editor, e.g. `organizations, by update, as the organization's own editor: {"normal": "#ff0000; background: url(//evil.example/x)"} is refused, naming the table, the member and what was found`.
- **50-61:** the same twelve as the fixture owner by insert. **62, 63:** the two as the service role.
- **64:** `organizations: after every refused update the fixture row still holds the last accepted colour`.
- **65, 68, 69:** the refusal on `candidates`, `factions` and `alliances`.
- **76, 77:** `bulk_import of an organization whose colour carries further CSS raises, …` and `and that import stored neither its organization nor the valid one imported before it`.
- **78, 79:** the two catalogue assertions.

Every acceptance passed in red (1-37, 66-67, 70-75). A first draft of the file had one more failure and is kept as `175-03-color-red-draft1.log` (deviation 3).

### The migration diff of `b19a9beda`

78 lines added, 4 removed, mirroring the two schema files: the header entry and the body of `public.validate_entity_color ()`; in `102-entities.sql` the four `CREATE TRIGGER validate_entity_color` statements with their comments, and the comment on each table's `color` column, which now states the validated shape. Nothing else.

## Every reset made, with the in-flight check

The check lists listeners on `:5273`, every `started` marker without an `ended` beside it at any depth under `tests/e2e-runs/` (of any age, and those younger than ten minutes), and any Playwright, `e2e-run.sh` or determinism-batch process. Its output is kept as `175-03-reset<N>.inflight`.

| Reset | When (UTC) | Check output | `yarn db:reset` | Why |
|---|---|---|---|---|
| 1 | 12:55:54 | no listener on :5273 · started-without-ended: total=0 younger-than-600s=0 · no process · status 0 | exit 0 | Task 1 step 3 |
| 2 | 13:07:20 | the same four lines, status 0 | exit 0 | Task 3 step 3 |

No reset failed, so nothing was retried. Docker and the stack were never restarted; `supabase db push` was never run; the migration and the generated types were never hand-edited.

## Decisions Made

- **A whole-value JSON null is refused on both columns.** The plan says "a null value passes; otherwise the value must be a JSON array / object". SQL null is that value; `'null'::jsonb` is neither an array nor an object. One cell per column pins it, so it is a rule and not an accident. No shipped path writes one: PostgREST and `bulk_import` both turn a JSON null into SQL NULL.
- **The colour grammar is stricter than the frontend's parser** (`parseColorString` also reads a bare hex and `rgb(r,g,b)`, and strips whitespace). The empty string and a trailing line break are refused and pinned. Nothing was widened (PROH-175-19).
- **Messages.** `Invalid entity type list: column public.<t>.entity_type on row <id> must be null or a JSON array of entity types, got a JSON <type>` / `… holds the member <json>, which is not one of the entity types {candidate,organization,faction,alliance}`; `Invalid entity color: column public.<t>.color on row <id> must be null or a JSON object holding normal and dark, got a JSON <type>` / `… holds the member <key>, and a color holds only normal and dark` / `… holds <json> as its member <normal|dark>, which must be null or # followed by three or six hexadecimal digits`. A member is cut at 64 characters, a colour value and a key at 32; the full value is never echoed.
- **Who runs the import cells.** File 40's as the project admin (the question tables have no column grant, so the API role can import them); file 41's as the service role, the seeder's role, since the entity tables' column grants withhold the import key from `authenticated`.
- **`EntityTypeList` is exported from `permittedKeys.ts` and not from the package barrels**, which are outside the plan's files; `QuestionsFixedRow['entity_type']` reaches the same type.

## Deviations from Plan

### 1. [Rule 1 — a census this plan's triggers move] File 19's trigger census was extended; the plan named file 07

- **Found during:** Task 3 step 3 (`175-03-color-applied.log`, exit 1).
- **Issue:** `19-entity-immutability.test.sql` test 77 bounds the row-level BEFORE UPDATE trigger population of the four entity tables at 20; the four `validate_entity_color` registrations make it 24. The plan foresaw a census of `public`'s functions in file 07 and says any other red assertion is a finding to report — so it is reported here. File 07 did not move.
- **Fix:** the count is 24 and the description names the colour validation, adding that it raises or returns the row as it received it — the census exists to stop a BEFORE trigger from changing a protected column unnoticed, and this one changes none. Commit `72d71e0da`, with a subject that says so.
- **For the orchestrator:** this is an edit of an existing assertion's expected value. It was made because the census is a deliberate tripwire for exactly this event; if you would rather rule on it, the alternative is to revert `72d71e0da`, which leaves the estate red by that one test.

### 2. The comment hygiene guard was red on files 40 and 41 between `65620e64e` and `2c3b8a89c`

- **Issue:** rule 2 reads two adjacent comment lines without terminal punctuation as one broken sentence; the `accepted` / `refused` lists of both new headers were written that way. I ran the guard only at the close of Task 3, so file 40 sat in the tree with the finding for five commits, and `yarn lint:check` — which includes the guard — was red over that span. Plan 175-04's executor met it and the orchestrator relayed it; the fix had been committed by then.
- **Fix:** each list line ends with a full stop (`2c3b8a89c`, comment only). `yarn assert:comment-hygiene` exits **0** at `2c3b8a89c`, read from the command itself.
- **Cost:** the history holds a second commit on each of the two files' headers, which the checklist's "no fixes of itself" item counts against the branch. Commits were not rewritten in a shared checkout.

### 3. File 41's first red draft had one failure of the wrong kind; the assertion was scoped before the commit

Section 0 first counted colour-bearing entities over whole tables and read the seeded organizations of the default project (`175-03-color-red-draft1.log`, test 1). It now counts over the fixture's two projects. The kept red log is the second one, with no acceptance failing. The cause is the next item.

### 4. The database this plan started on was not "`seed.sql` only"

Plan 175-02's summary says the database held only `seed.sql` after its last reset. It held the `default` dataset (26 questions, `seed_`-prefixed) and a second project row: `yarn workspace @openvaa/dev-seed test:unit` runs `tests/integration/default-template.integration.test.ts` whenever the stack is up, which tears down the `seed_` rows and writes the default template again, and `ensureProject.test.ts` creates project `…00e2`. Consequences here: Task 1's red run was made on that state (only file 40 was red, so no extra reset was needed), and Task 3's verify ran pgTAP on a database holding the default dataset, as the plan's own order implies — green.

### 5. The red sets are wider than the plan's wording, in the same kind

The plan lists the refusals and the import cases. Also red, by construction: the two "nothing was stored" read-backs of each file and the two catalogue assertions of each file, which I added so that a registration on the wrong verb or column cannot pass. No acceptance was red in either kept log.

### 6. Two more values are refused than the plan's `<behavior>` lists

A whole-value JSON null (both columns), and for the colour an empty string, a trailing line break and a non-colour `dark` beside a valid `normal`. Each follows from the plan's grammar; each has a cell.

### 7. A file the plan listed for Task 2 was not the place, and one it did not list was

See *The population of step 0*: the row typing is in `permittedKeys.ts`; `strictRowTypes.type-test.ts` gained the type-layer controls for "a bare string does not typecheck", which no vitest case can assert.

**Total:** one census extended (reported for a ruling), one guard finding fixed late, five recorded differences from the plan's text. No prohibition was broken and no locked decision contradicted.

## Code review checklist — § Supabase Backend and the general items

| Item | Outcome |
|---|---|
| Solves the issue | pass — D-18 / RQ-2 and ruling 3's database half, each observed red then green |
| OWASP: injection, access control | pass — the stored-CSS path is closed for every writer of the four entity tables; both functions read only `NEW` and an enum and build no SQL. The unquoted item key in `_bulk_upsert_record` is unchanged (T-175-17, accepted, plan 175-13 files it) |
| New content tables carry the common columns · RLS and the five policies · indexes | n/a — no table, policy or foreign key added |
| Policies use scalar subqueries and name a role | n/a — no policy edited |
| `SECURITY DEFINER` functions set `search_path = ''` and qualify names | pass, and beyond — both new functions are `SECURITY INVOKER`, set `search_path = ''` and name `public.entity_type` with its schema; pinned by a catalogue assertion in each file |
| Trigger naming | pass — six triggers named `validate_entity_type_list` / `validate_entity_color` |
| pgTAP inside BEGIN/ROLLBACK with `create_test_data()` | pass — files 40 and 41 open a transaction, call the shared fixture and roll back; their instruments live in `pg_temp` and their two value tables are `ON COMMIT DROP` |
| pgTAP assertion patterns | pass — `throws_like` for every expected refusal, because each asserts that the message names the table and the member; `lives_ok` with a read-back `is` for every acceptance; `is` over a count for "stored nothing" |
| Every database commit carries `[db]` | pass — the last link of Task 3's verify |
| Code style, no `any`, no repetition | pass — no `any`; the two fixtures differ by one key's spelling by design; Prettier clean on every touched file |
| New entities documented | pass — both functions carry header comments, `EntityTypeList`, `NarrowedColumns` and `ColumnsFor` carry TSDoc |
| Repo markdown updated | pass for `packages/dev-seed/README.md`; the database skill, `apps/supabase/README.md` and the docs site are deferred to plan 175-13 (list below) |
| Errors handled | pass — each refusal is a named exception; dev-seed surfaces it as `bulkImport failed: …` |
| Parts sharing the dependency | pass — the default seed, the dev-seed suite (1034) and the Supabase unit suite (462) are green; all 31 built-in templates' colours surveyed |
| Comment hygiene | pass at the close — `yarn assert:comment-hygiene` exit 0; added lines scanned for history words and planning references: none. **Was red mid-plan** (deviation 2) |
| No fixes of itself in the history | **finding, not fixed** — `2c3b8a89c` follows `65620e64e` and `2c882eeb4` on one header line each |
| Formatting changes in their own commit | pass — none |
| Tracking events, Svelte, accessibility, adapter, Edge Functions | n/a |

## For plan 175-13: what this plan made false or left incomplete

Found with `git grep -n -e "skip_columns" -e "entity_type" -e "validate_" -- .claude/skills/database apps/docs/src apps/supabase/README.md`; nothing was edited here.

**False now:**
- `.claude/skills/database/SKILL.md` — every statement of the estate's size: the description's "a 1706-assertion pgTAP estate"; § *Backend Overview* "1706 pgTAP assertions in 39 files: 38 files declare plans summing to 1697"; § *pgTAP Testing Conventions* item 1 ("**39** files … `00` to `39`", "summing to **1697**", "`Files=39, Tests=1706`"); § *Key Source Locations* "39 files, `00-helpers` through `39-invitations`"; the § *Freshness Record* rows. Measured at the close of this plan: **41 files, `Files=41, Tests=1888`, 40 plans summing to 1879**.

**True but incomplete:**
- `.claude/skills/database/schema-reference.md` § *Triggers* — no row for `validate_entity_type_list` (question_categories, questions; BEFORE INSERT/UPDATE OF entity_type) or `validate_entity_color` (the four entity tables; BEFORE INSERT/UPDATE OF color); § functions table — no row for either function (both `011`, SECURITY INVOKER, `search_path = ''`); the `entity_type: jsonb` and `color: jsonb` column lines say nothing of the validated shape.
- `.claude/skills/database/SKILL.md` § *Schema Conventions* item 1 (`color`, `image` (jsonb)) and item 8 (the trigger list) — neither names the two validations; § *Service Patterns* item 2 (`bulk_import`) does not say which keys the helper skips, or that `entity_type` is carried on the two question tables and skipped on `nominations`.
- `apps/docs/src/routes/(content)/developers-guide/backend/data-import-and-deletion/+page.md` — describes `bulk_import` and says nothing of skipped keys, of `entity_type` or of the two validations an import now meets.
- `apps/supabase/README.md` — the command printed no line for it; it names neither function.

## What the next plans should know

- **175-05 (the dataset):** a template states `entity_type: ['organization']` on a `questions` or `question_categories` row, in snake or camel form (`entityType`). On a row literal typed by `QuestionsFixedRow` a bare string or an unknown member is a compile error; a row built through an intermediate variable (as `buildMinimal.ts` does) is outside the type layer, where a bare string fails in the RPC with a JSON syntax error and an unknown member with `bulkImport failed: Invalid entity type list: …`. `EntityTypeList` is importable from `src/template/permittedKeys` only.
- **175-07 (the writer):** the database accepts `null` (clear the colour by sending `null`), `{}`, and `normal` / `dark` each absent, `null` or `#` plus three or six hex digits in either case. It refuses a bare hex without `#`, `rgb(…)`, the empty string and any surrounding whitespace, so send `{ normal: '#rrggbb' }`. A refusal is SQLSTATE `P0001` with the prefix `Invalid entity color:`; the page shows its own sentence, never the raised text.
- **175-08 (the reader):** only the four entity tables are validated. `nominations.color` and the colours of elections, constituencies, questions and categories are not, so `ensureColors` must still drop what it cannot parse. Rows stored before this schema is applied are not re-checked by a trigger; nothing is deployed, so none exist.
- **Any plan that adds a BEFORE UPDATE trigger to an entity table** moves file 19's census (now 24).
- **Any plan that runs pgTAP after `dev-seed test:unit`** runs it on a database holding the default dataset; an assertion that counts rows must scope itself to the fixture's projects.
- **A full default E2E run was not made here.** No frontend file was touched; 175-05's gates and full run are the boundary proof.

## The state the local database is left in

- Applied schema: the tree's (`b19a9beda`; later commits changed only test files).
- Reset twice; after the last reset `yarn db:seed:default` ran (exit 0), then the dev-seed unit suite twice more, whose integration test tears the `seed_` rows down and writes the default template again. It holds **`seed.sql` plus the `default` dataset** — 8 organizations, 2 alliances, 328 candidates (327 of them `seed_`-prefixed), 26 questions, 377 nominations — and the project row `00000000-0000-0000-0000-0000000000e2` that dev-seed's tests create. No E2E data.
- pgTAP has run on it since the last reset, so the helper functions of `00-helpers.test.sql` are in `public` until the next reset; `yarn db:types` is valid only after one. Every other test write was rolled back.
- The Supabase stack is up and was never restarted.

## Not done, or not verified

- The database skill, `apps/supabase/README.md` and the docs site were not edited (plan 175-13).
- `packages/data`'s `Colors` type and the frontend's parser, reader and writer are untouched: plans 175-07 and 175-08.
- The two dev-seed unit tests that carry a bare-string colour were left as they are (they never store).
- `yarn lint:check`, `yarn typecheck`, `yarn build` and E2E were not run, as the plan rules.
- No entry was appended to `.planning/WINDOWS.md`: there is no stub, no skipped test and no verify left unrun.
- `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` were not touched; `CAND-APP-PLAN.md` stays untracked; nothing under `tests/e2e-runs/` was deleted.

## Files touched that the plan did not list

- `apps/supabase/supabase/tests/database/19-entity-immutability.test.sql` — one census count and its description (deviation 1).
- `packages/dev-seed/tests/template/strictRowTypes.type-test.ts` — the type-layer controls (deviation 7).

Listed by the plan and not changed: `apps/supabase/supabase/tests/database/07-rpc-security.test.sql`, `packages/supabase-types/src/database.ts`. A scratch survey script was created in `packages/dev-seed/`, run once and removed; it was never staged.

## Known Stubs

None.

## Threat Flags

None. The plan's register covers every surface this plan changed: the two triggers add refusals, and the import's one new carried key is validated by the first of them.

## Self-Check: PASSED

- The eight commits are ancestors of `HEAD`: `65620e64e`, `9b96c63df`, `766798c47`, `f2c11b9f5`, `2c882eeb4`, `b19a9beda`, `72d71e0da`, `2c3b8a89c`.
- The four created files exist and the two deleted fixtures are untracked.
- The evidence files named above exist under `tests/e2e-runs/175-unit/`; `175-03-typelist-red.exit`, `175-03-devseed-red.exit` and `175-03-color-red.exit` hold 1, and `175-03-typelist-green.exit`, `175-03-devseed-green.exit`, `175-03-color-green.exit`, `175-03-seed-default.exit`, `175-03-verify1.exit`, `175-03-verify2.exit`, `175-03-verify3.exit` and `175-03-hygiene-close.exit` hold 0.
