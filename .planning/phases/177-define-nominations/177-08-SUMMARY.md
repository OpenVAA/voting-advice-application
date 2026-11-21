---
phase: 177-define-nominations
plan: 08
subsystem: data-model
tags: [nominations, nomination-shape, data-package, supabase-adapter, comparison-table, unit-tests]
status: complete
requires:
  - "177-07: the schema block complete (pgTAP Files=44, Tests=2310); the full run 177-07-close"
  - "177-03: public.nomination_shape_rule, the matrix this package's functions agree with cell for cell"
  - "177-02: the fourth election type, organization_list_and_independents, as the column default"
  - "177-01: 177-gates.sh, 177-verdict.mjs"
provides:
  - "packages/data/src/objects/election/nominationShape.ts: NOMINATION_SHAPE, NominationShape, DEFAULT_NOMINATION_SHAPE, AllowedParentTypes, isNominableInShape, allowedParentTypes"
  - "the six names in the package's public exports: import { … } from '@openvaa/data'"
  - "ElectionData.nominationShape (optional, nullable) and the getter Election.nominationShape, defaulting to organization_list_and_independents"
  - "the Supabase adapter maps elections.election_type to nominationShape in _getElectionData"
  - "packages/data/README.md § 'Nomination rules: the data model and the database': nine rules, each with where the model and the database state it and which test holds each side"
  - "the gate run tests/e2e-runs/177-gates/177-08-close, five rows green at f5296c50f"
affects: [177-09, 177-13, 177-14, 177-15, 177-17, 177-21]
tech-stack:
  added: []
  patterns:
    - "a pure rule module in the data package: a const object used as an enum, and functions that read ENTITY_TYPE inside their bodies only, because the barrel loads the module before the entity types"
    - "a grid test whose shapes are written as the database's stored values, so the grid does not read the module it tests"
    - "one adapter case per member of the generated enum (Constants.public.Enums.nomination_shape), and one case that holds the package's list equal to it"
key-files:
  created:
    - packages/data/src/objects/election/nominationShape.ts
    - packages/data/src/objects/election/nominationShape.test.ts
  modified:
    - packages/data/src/objects/election/election.ts
    - packages/data/src/objects/election/election.type.ts
    - packages/data/src/objects/election/election.test.ts
    - packages/data/src/internal.ts
    - packages/data/src/index.ts
    - packages/data/README.md
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
decisions:
  - "packages/data/src/index.ts gained the six names: the package's index exports by an explicit list, so the barrel export the plan names does not reach a consumer on its own"
  - "a shape or an entity type that is not one of the known values admits nothing: isNominableInShape answers false, allowedParentTypes the empty answer"
  - "the two adapter-test comments above the extended cases were rewritten to describe the cases as they are; they carried history and a decision id"
  - "the comparison table says 'None' where no test holds a rule on the model's side; no test was added for the model's two constructor refusals"
requirements-completed: [NOM-03, NOM-04]
metrics:
  started: "2026-10-11T02:45:42Z"
  completed: "2026-10-11T02:57:00Z"
  duration: "12 minutes"
  tasks: 2
  files: 10
actuals:
  tokens: 8730 # chars/4 over git diff 1843b7ed3..f5296c50f -- apps packages (34,920 characters)
  tasks: 2
  commits: 4 # git rev-list --count 1843b7ed3..f5296c50f
plan_head_before: 1843b7ed34506668f40bf7934a1480e8302e7d04
plan_head_after: f5296c50f3b7ccc792d6ca86be03a57a3c8254c7
---

# Phase 177 Plan 08: `Election.nominationShape`, `allowedParentTypes`, the Adapter's Mapping and the Comparison Table — Summary

An election's nomination shape is now a property of the data model, with one function that says whether an entity type may be nominated in a shape and one that says which parent types it may name and whether one is required; every cell of the four-by-four matrix is tested for each function, the Supabase adapter maps the `election_type` column to the property, and `packages/data/README.md` compares the nomination rules of the model and of the database rule by rule.

`requirements-completed` names NOM-03 and NOM-04 because the plan's frontmatter does; nothing a user can reach reads the shape until plan 177-13. `REQUIREMENTS.md`, `STATE.md` and `ROADMAP.md` were not touched.

## Read this first

- **Both verify blocks exit 0 as written**, and the gate run `177-08-close` is PASS on the final head.
- **One file outside the plan's list was changed: `packages/data/src/index.ts`.** The package's public index exports by an explicit list, not `export *`. With the barrel export alone, `import { NOMINATION_SHAPE } from '@openvaa/data'` is `undefined` in the frontend — observed in the adapter's first red run. *Deviations*, 1.
- **Four commits, not the plan's three**: the public exports are a commit of their own.
- **The data package's red run fails 69 of its 73 cases with `TypeError: … is not a function`, not on an expectation.** The functions did not exist; a call to an absent function is neither an expectation failure nor an import or compile failure (every case ran and failed alone). An expectation-only control was run as well, on a skeleton module. *Task 1*, and *Deviations*, 2.
- **The comparison table records two gaps it found, as they are**: no test of the data package holds the model's two constructor refusals (parent type and id together; a faction's nomination has a parent), and in pgTAP only the election half of "a child shares its parent's election, constituency and round" has an assertion that names it. Neither was fixed here. *For later plans*.
- **No E2E run** closes this plan, by the plan's ruling 2. The database was not touched.

## Task Commits

| Task | Commit | Subject |
|---|---|---|
| 1 (tests, red) | `69bcbd416` | `test(177-08): which entity type an election's shape admits, and which parent it may name` |
| 1 | `8ace4918d` | `feat(177-08): Election.nominationShape, and the one function for the parent types a shape allows` |
| 1 (deviation 1) | `f974c8d2d` | `feat(177-08): the nomination-shape names in the data package's public exports` |
| 2 | `f5296c50f` | `feat(177-08): the adapter maps an election's nomination shape; the nomination rules of the model and the database compared` |

## Each task's verify command, with its real exit status

Each `<automated>` block was written byte for byte to a script and run with `bash`.

| Block | Script | Exit | Head |
|---|---|---|---|
| Task 1 | `tests/e2e-runs/177-unit/177-08-t1-verify.sh` | 0 | `8ace4918d`; again 0 at `f5296c50f` (`177-08-t1-verify-r2.log`) |
| Task 2 | `tests/e2e-runs/177-unit/177-08-t2-verify.sh` | 0 | `f5296c50f` |

No stage of either block had a defect.

## Task 1 — the matrix in TypeScript and `Election.nominationShape`

### The two functions, as written

```ts
export function isNominableInShape(shape: NominationShape, entityType: EntityType): boolean;
export function allowedParentTypes(shape: NominationShape, entityType: EntityType): AllowedParentTypes;

export type AllowedParentTypes = { types: ReadonlyArray<EntityType>; required: boolean };
export type NominationShape = (typeof NOMINATION_SHAPE)[keyof typeof NOMINATION_SHAPE];
export const NOMINATION_SHAPE = {
  OrganizationOnly: 'organization_only',
  CandidateOnly: 'candidate_only',
  OrganizationList: 'organization_list',
  OrganizationListAndIndependents: 'organization_list_and_independents'
} as const;
export const DEFAULT_NOMINATION_SHAPE: NominationShape = NOMINATION_SHAPE.OrganizationListAndIndependents;
```

What they answer, cell by cell, is the table of the plan's `<the_functions>` and nothing else. Two things the plan does not state and the module decides:

- **An unknown value admits nothing.** A shape outside the four names makes `isNominableInShape` false (the `default` of its `switch`); in the two shapes that admit every entity type the answer is `isEntityType(entityType)`, so an unknown entity type is refused too. `allowedParentTypes` asks `isNominableInShape` first and gives the empty answer where it is false. This is the mitigation of T-177-38 on the TypeScript side.
- **`ENTITY_TYPE` is read inside the function bodies only.** `internal.ts` exports the module before `./objects/entities/base/entityTypes`, as the plan's ordering rule has it, so a read of `ENTITY_TYPE` at module load would meet an uninitialised binding. The module's header says so. `NOMINATION_SHAPE` and `DEFAULT_NOMINATION_SHAPE` are the module's own and are read freely.

The getter: `get nominationShape(): NominationShape { return this.data.nominationShape ?? DEFAULT_NOMINATION_SHAPE; }`. The data member: `nominationShape?: NominationShape | null`.

### The tests

`nominationShape.test.ts` holds 72 cases: one that the grid holds sixteen distinct cells; two for the names and the default; sixteen for `isNominableInShape`; and for `allowedParentTypes` sixteen for the answer, sixteen that no answer holds a faction, five for the empty answer of the cells that are not nominable, and sixteen that each call returns a fresh object. The shapes in the grid are written as the database's stored values, typed `NominationShape`, so the grid does not read them from the module under test. `election.test.ts` gained two cases for the getter (none and null give the default; each of the four stated values is returned). The package went from 244 to 318 tests.

### The red runs

| Run | Tree | Exit | Result |
|---|---|---|---|
| `177-08-data-red` | the tests, no module (head `1843b7ed3`) | 1 | 73 failed, 245 passed. 4 fail on an expectation (the two getter cases, the names, the default: `expected undefined to …`); 69 fail with `TypeError: isNominableInShape is not a function` or `allowedParentTypes is not a function` |
| `177-08-data-red-skeleton` | the tests committed, and an uncommitted module whose two functions answer `false` and the empty answer (kept as `177-08-data-red-skeleton.nominationShape.ts.kept`), no getter | 1 | 20 failed, 298 passed; every failure an `AssertionError`: the eleven nominable cells, the seven cells with a parent type, the two getter cases |
| `177-08-data-green` | the module and the getter | 0 | 318 passed |

Observed, not inferred: the counts and the error classes above are read from the kept logs. The skeleton run is the control for the dispatch's rule that a red report counts only on expectations; a skeleton that answers nothing necessarily answers the "nothing" cells right, so it cannot turn all 72 red.

## Task 2 — the adapter and the comparison table

### The adapter

`_getElectionData` maps `nominationShape: row.election_type` beside `round`; the comment above `subtype` is unchanged. The method's TSDoc lists the new member.

`supabaseDataProvider.test.ts`:

- the two existing cases that name `election_type` each expect the new member too (`organization_list` with subtype `presidential`; `candidate_only` with no subtype);
- `it.each(Constants.public.Enums.nomination_shape)`: four cases, one per member of the generated enum, each with a subtype (`municipal`) that must come through unchanged;
- one case holds `Object.values(NOMINATION_SHAPE)` equal, as a set, to the generated enum's members.

| Run | Tree | Exit | Result |
|---|---|---|---|
| `177-08-adapter-red` | the tests; the data package built without the public exports (head `8ace4918d`) | 1 | 7 failed, 108 passed: six on an expectation (`expected undefined to be '<shape>'`), and the enum comparison with `TypeError: Cannot convert undefined or null to object` — `NOMINATION_SHAPE` was `undefined` from `@openvaa/data`. This is what showed deviation 1 |
| `177-08-adapter-red-r2` | the same tests; the data package built with the public exports (head `8ace4918d`, `index.ts` uncommitted) | 1 | 6 failed, 109 passed; every failure an `AssertionError` |
| `177-08-adapter-green-r2` | the mapping | 0 | 115 passed |

The enum comparison is green as soon as both lists exist, so it has no red run of its own beyond the first one above.

### Where the data model states each rule of the table, as found

Read from the source, not from the plan:

| Rule | Where the model states it | The model's test |
|---|---|---|
| Parent type and id together | the constructor of `Nomination`, `nominations/base/nomination.ts`: `DataProvisionError` | none |
| A faction's nomination has a parent | the constructor of `FactionNomination`, `nominations/variants/factionNomination.ts`: `DataProvisionError`; both members non-optional in `FactionNominationData` | none of the refusal |
| Which entity type a parent may be | the type parameters of the four `…NominationData` interfaces (candidate: faction or organization; faction: organization; organization: alliance; alliance: none); nothing at run time | none at run time |
| A child shares its parent's election, constituency and round | `Nomination.getInheritableData`: nested data inherits the three; a nomination provided on its own with a `parentNominationId` is not checked | none of its own |
| Uniqueness at a contest under one parent | not stated | none |
| Which entity type a shape admits | `isNominableInShape`, with `Election.nominationShape`; advisory — providing a nomination the shape does not admit is not refused | `nominationShape.test.ts` |
| A candidate's parent required in a closed list, unless a name was typed | `allowedParentTypes(…).required`; the typed name (`requestedParentOrganization`) is not known to the package | `nominationShape.test.ts` |
| The round | `Nomination.electionRound`, default 1; `Election.getNominations` reads the election's own round; no lower bound | `election.test.ts` |
| The confirmed state | not stated | none |

The database side of each row (function, trigger or constraint by name, and the pgTAP file) is in the README's table. Below it, a subsection states how the two functions correspond to `nomination_shape_rule`'s three answers, the one difference (the database admits a faction's nomination as a candidate's parent; `allowedParentTypes` never offers one), and the tests that hold the two matrices and the two lists of names together. The `election/` entry of the README's source-file list names the new module.

### Gate rows

`tests/e2e-runs/177-gates/177-08-close`, head `f5296c50f3b7ccc792d6ca86be03a57a3c8254c7`, `177-verdict.mjs gates … --rows typecheck,lint,unit,build,format`: **PASS** (exit 0; not stale; no Sleep entry in the window; AC power, 100 %).

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 21 |
| lint | 0 | 48 |
| unit | 0 | 68 |
| build | 0 | 17 |
| format | 0 | 20 |

Unit totals in that run: frontend 3580 passed, 20 skipped (3575 before; the five new adapter cases); data 318; dev-seed 1046 (unchanged); supabase 462; app-shared 148.

The Docker VM had 17.4 GiB free before the run; none of the five rows uses it.

## For later plans

### For plan 177-13 (and 177-14, 177-15, 177-17) — the import path and the exact names

```ts
import { allowedParentTypes, DEFAULT_NOMINATION_SHAPE, isNominableInShape, NOMINATION_SHAPE } from '@openvaa/data';
import type { AllowedParentTypes, NominationShape } from '@openvaa/data';
```

- `election.nominationShape` is always a `NominationShape`, never `undefined`: ask `isNominableInShape(election.nominationShape, entityType)` and `allowedParentTypes(election.nominationShape, entityType)`.
- `allowedParentTypes` answers `{ types, required }`; "no parent is asked" is `types.length === 0`, and `required` is then always `false`. A faction is never in `types`.
- For a cell that is not nominable the answer is the empty one, so a caller that shows a parent selector from `allowedParentTypes` alone shows none there; whether the election is offered at all is `isNominableInShape`.
- Each call returns a fresh object; `types` is typed `ReadonlyArray`.
- Inside `packages/data` the import is from `'../../internal'` (or the file's own depth), never from the index.
- The frontend sees a change to `packages/data` only after the package is built (`yarn build --filter=@openvaa/data`); the adapter's first red run met exactly that.

### For plan 177-09

The generated enum is reachable as `Constants.public.Enums.nomination_shape` from `@openvaa/supabase-types`, and its type as `Database['public']['Enums']['nomination_shape']`; both are the same four strings as `NominationShape`, held by the adapter's test.

### For plan 177-21

- **`.claude/skills/database/schema-reference.md`**, the `election_type` line of the column map: "the frontend adapter no longer maps this column onto any application property" is now false — the adapter maps it to `ElectionData.nominationShape`. The line's other half (`subtype` is fed by `elections.subtype` alone) still holds. `177-21-INPUTS.md` already names this file's `election_type` row.
- **The data skill** (`.claude/skills/data/`) does not know `nominationShape`, the module `nominationShape.ts` or the README's new section; its *Key Source Locations* and `object-model.md` are candidates for one line each.
- **Two gaps the comparison table states and nothing closes:** the data package has no test of the `Nomination` constructor's "both or neither" refusal nor of `FactionNomination`'s "must have a parent" refusal; and in pgTAP, a search of the test files for the three "must match parent" messages and for "mismatch" finds one assertion, for the election (`08-triggers.test.sql`, "Nomination with mismatched election_id rejected"), and none that names the constituency or the round. The second statement is from searches, not from reading every assertion: an assertion that reaches those branches without naming them would not have been found.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The six names were not reachable from `@openvaa/data`**
- **Found during:** Task 2, step 1 (the adapter's first red run)
- **Issue:** `packages/data/src/index.ts` exports by an explicit list. The plan adds the module to `internal.ts` only, so `NOMINATION_SHAPE` imported from `@openvaa/data` was `undefined` in the frontend, and the adapter case that compares it with the generated enum failed with a `TypeError` instead of comparing anything. Plan 177-13 imports the same names.
- **Fix:** the two types and the four values added to `index.ts`, each in its list's alphabetical place; the package rebuilt.
- **Files modified:** `packages/data/src/index.ts` (outside the plan's `files_modified`)
- **Commit:** `f974c8d2d`

### Other deviations

**2. A second red run of the data package, on a skeleton.** The plan asks for one red run; the dispatch counts a red report only when every failure is an expectation. The plan's red run fails mostly by calling a function that does not exist. Rather than bend the tests (an optional call would stay in the committed file), a control was run on an uncommitted skeleton module and kept beside the first: 20 failures, all expectations. The skeleton was never committed; the committed order is the plan's — tests alone, then the module.

**3. The adapter's red run was made twice** (`177-08-adapter-red`, then `-r2`): the first is the one that exposed deviation 1 and holds one non-expectation failure; the second, after the exports, is all expectations. Both are kept; nothing was overwritten.

**4. Two comments in `supabaseDataProvider.test.ts` were rewritten.** The cases they sit above were extended, and both comments told the mapping's history and cited a decision id and plan numbers. Each now says what its case's fixture is for. No assertion of either case was removed or loosened.

**5. The README's `election/` line in *Source file organisation* names the new module** — one line beyond the new section.

**6. The adapter's tests and its mapping are one commit**, as the plan's step 3 says ("commit the three files"); the red run was made on the uncommitted test file.

## Code review checklist

| Item | Outcome |
|---|---|
| Solves the issue | Yes: the shape is in the model, the matrix is stated once in TypeScript, the adapter maps the column, the rules are compared |
| OWASP top 10 | Nothing reaches a trust boundary: two pure functions and one mapped column. The functions advise the screens; the database re-checks every write. An unknown shape or entity type admits nothing |
| Code style guide | Followed: `internal.ts` imports only, no `.js` extensions, const object as enum in the form of `ENTITY_TYPE` |
| No `any` | None |
| No repeated code | The matrix is stated once in TypeScript; `isEntityType` is reused rather than a second guard written |
| New entities documented | TSDoc on every export of the module, on the data member and on the getter (`@defaultValue`) |
| Repo markdown updated | `packages/data/README.md`; stale sentences elsewhere are reported for plan 177-21, not edited |
| Tracking events | Not applicable: nothing user-facing |
| Svelte component guidelines | Not applicable: no component |
| Errors handled and logged | Not applicable: the functions are total and throw nothing |
| Failing checks | None: five gate rows green |
| Dependents not unduly affected | `ElectionData` gains an optional member; `yarn typecheck`, `yarn build` and every workspace's unit tests are green. The server-side local adapter's elections read the default through the getter |
| WCAG / keyboard and screen reader | Not applicable: no rendered surface |
| Developers' and Publishers' Guides | Not changed: nothing a publisher or an integrator can use yet; reported for 177-21 |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before each commit that touched a comment; the touched comments were read. Two historical comments were brought in line (*Deviations*, 4) |
| Commit history | Four commits, each one thing; no fix of an earlier commit of the plan |
| Formatting-only changes | None |
| `[db]` tag | Not applicable: no schema, migration or generated-types change |
| Supabase adapter: mixin, `safeGetSession` | Untouched |
| Supabase adapter: row mapping through `COLUMN_MAP` | `_getElectionData` maps `date`, `round` and `subtype` by hand beside `toDataObject`; the new member follows them, as the plan directs. `COLUMN_MAP` has `election_type → electionType`, which no application property reads |

## Prohibitions

- **PROH-177-22** (no code outside the data package re-derives the matrix): nothing calls the functions yet and nothing else in `apps/` or `packages/` branches on a nomination shape; judged by reading the diff, which adds no such branch.

## Threat Flags

None. No endpoint, auth path, file access or schema change.

## Sentences the work made false, reported and not edited

See *For plan 177-21*: one line of `.claude/skills/database/schema-reference.md`.

## Not done, or not verified

- No E2E run (the plan's ruling 2). The latest full run stays `tests/e2e-runs/177-e2e/177-07-close`.
- No test was added for the model's two constructor refusals; the table says "None" for them.
- The local adapter's static elections were not exercised with a shape; ruling 3 rests on the getter's default, which `election.test.ts` holds.

## The state the local stack is left in

Untouched by this plan: no reset, no seed, no pgTAP, no E2E run. It is as plan 177-07 left it.

## Known Stubs

None.

## Evidence (gitignored)

`tests/e2e-runs/177-unit/177-08-*`: `data-red.{log,exit,head}`, `data-red-skeleton.{log,exit,head}` with the kept skeleton, `data-green.{log,exit}`, `adapter-red.{log,exit,head}`, `adapter-red-r2.{log,exit,head}`, `adapter-green.{log,exit}`, `adapter-green-r2.{log,exit}`, `t1-verify.{sh,log,exit,head}`, `t2-verify.{sh,log,exit,head}`, `gates.{log,exit}`, `pre-typecheck.{log,exit}`. `tests/e2e-runs/177-gates/177-08-close/`.

## Self-Check: PASSED

- Files: `packages/data/src/objects/election/nominationShape.ts` and `nominationShape.test.ts` exist; the README holds the section.
- Commits `69bcbd416`, `8ace4918d`, `f974c8d2d`, `f5296c50f` are ancestors of `HEAD`.
- `git status --short` shows only the operator's untracked `CAND-APP-PLAN.md`.
