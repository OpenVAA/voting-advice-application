---
phase: 177-define-nominations
plan: 10
subsystem: e2e-harness
tags: [e2e, dev-seed, dataset, fixtures, state-steps, playwright-projects, perm-chain, nominations]
status: complete
requires:
  - "177-02: every template on the new default election type; the census test, which now reads this template too"
  - "177-03 to 177-07: the election-type rule and the parent-required rule, which bind the seed pipeline and the service role"
  - "177-09: the gate run 177-09-close (frontend unit 3687 passed and 30 skipped)"
  - "177-01: 177-gates.sh, 177-e2e.sh, 177-verdict.mjs; the chain's tail (data-setup-perm-analytics-tracking depended on perm-no-nomination)"
provides:
  - "dev-seed template perm-contestant-nominations (prefix e2e-perm-contestant-nominations-), its registry entry and its family row"
  - "tests/tests/utils/permContestantNominationsData.ts: the prefix, every external id a test names, the seven seeded nominations, four editors (grant, address, storage state)"
  - "tests/tests/fixtures/contestant/perm-contestant-nominations.ts: test, expect, contestantNominationsPagesOf; state steps setNominations, addNomination, clearWrittenNominations, setNominationsLocked, setAnswersLocked, setElectionType, setEntityConfirmed, setAnswers; readers nominationsOf, electionTypeOf, entityConfirmedOf"
  - "Playwright projects data-setup-perm-contestant-nominations, data-teardown-perm-contestant-nominations, perm-contestant-nominations, between perm-no-nomination and data-setup-perm-analytics-tracking"
  - "tests/tests/specs/perm/contestant-nominations.spec.ts with three dataset: tests and a file-level afterAll that clears the rows the application wrote"
  - "scripts/assert-a11y-scan-wiring.mjs names the spec among the files that build no axe gate of their own"
  - "the full run tests/e2e-runs/177-e2e/177-10-close: 346 of 346, 116 projects, at 8abaf9146"
affects: [177-11, 177-13, 177-15, 177-16, 177-17, 177-18, 177-19, 177-20, 177-21]
tech-stack:
  added: []
  patterns:
    - "a state step that restores seeded rows imports each row whole, with an explicit null for every member the row does not have, so a symbol, a parent, a typed party name or a confirmation the application changed is put back by one upsert"
    - "a nomination is deleted only once nothing stands under it: the set to delete is closed over what stands under it, and its leaves are deleted first"
    - "a step that must also run after the dataset is gone looks its entities up by a list of external ids and passes on none found"
key-files:
  created:
    - packages/dev-seed/src/templates/e2e/perm/perm-contestant-nominations.ts
    - tests/tests/utils/permContestantNominationsData.ts
    - tests/tests/fixtures/contestant/perm-contestant-nominations.ts
    - tests/tests/setup/perm/perm-contestant-nominations.setup.ts
    - tests/tests/setup/perm/perm-contestant-nominations.teardown.ts
    - tests/tests/specs/perm/contestant-nominations.spec.ts
  modified:
    - packages/dev-seed/src/templates/index.ts
    - packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts
    - tests/playwright.config.ts
    - scripts/assert-a11y-scan-wiring.mjs
decisions:
  - "every seeded nomination states a sort_order: get_entity_nominations orders by sort_order and then by the generated id, so without one the order of a party's two cards is not fixed"
  - "the spec clears the application's rows in a file-level afterAll, and clearWrittenNominations passes on a dataset that is already gone: the next link's setup deletes this dataset by prefix before this dataset's own teardown runs"
  - "a state step relies on the database for the election-type rule and rethrows its refusal under the step's own name; no copy of the matrix is written in the harness"
  - "setNominations(entity, 'seeded') writes a missing parent row as seeded and leaves a present one as it is, so a test's own state of the parent is not overwritten"
  - "setAnswers names the answered opinion questions by external id, because the dataset's opinion questions are asked per election"
  - "the fixture module also exports three readers (nominationsOf, electionTypeOf, entityConfirmedOf), so a spec asserts what a step or a save stored without holding a query"
requirements-completed: []
metrics:
  started: "2026-10-11T03:26:00Z"
  completed: "2026-10-11T04:12:00Z"
  duration: "46 minutes"
  tasks: 3
  files: 10
actuals:
  tokens: 26061 # chars/4 over git diff 532d7482f..8abaf9146 outside .planning (104,243 characters)
  tasks: 3
  commits: 4 # git rev-list --count 532d7482f..8abaf9146
plan_head_before: 532d7482fa5014c023db8b6e9e6a8720a94e57d0
plan_head_after: 8abaf91467ba2de44e46baeb3a52a04324435d49
---

# Phase 177 Plan 10: The `perm-contestant-nominations` Dataset, its State Steps, its Place in the Chain and the Spec's First Three Tests — Summary

The phase's E2E dataset exists and is seeded, torn down and exercised in the permutation chain: three elections of three types, parties and alliances with and without a nomination, a candidate and a party with no nomination row, a candidate and a party with nominations, four editors with stored sessions, state steps that write each situation by name with the service role, and a spec whose three `dataset:` tests pass on the tree as it stands. The full run with the three new projects is 346 of 346 over 116 projects, every one of the predecessor's 113 projects at its count.

`requirements-completed` is empty on purpose. The plan's frontmatter names NOM-03, NOM-04, NOM-06 and NOM-08, and this plan builds the dataset and fixtures their tests will read; no behaviour a user meets is delivered by it. `REQUIREMENTS.md`, `STATE.md` and `ROADMAP.md` were not touched.

## Read this first

- **The chain is re-linked and green.** `177-10-close`: 346 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, 116 projects, head `8abaf9146`, not void. The verdict against `177-07-close` holds for all 116 projects: 113 equal, three new.
- **Two verify stages of the plan have a defect; the code was not bent.** Task 2's search for three titles in single quotes finds two, because one of the plan's own titles holds an apostrophe and Prettier writes it in double quotes. Task 3's `control` call hands five paths to one `--dirty-only`, and `177-verdict.mjs` takes one path per flag (usage refusal, status 2); the plan's step 1 command has the same form. Each chain was run as written and with that one stage restated; both statuses are below. *Deviations*, 3 and 4.
- **For plans 177-15 to 177-19 — the teardown is not the first prefix delete to meet this dataset's rows.** Observed in `177-10-close` and in `177-07-close`: a setup's teardown project runs when the whole chain has finished, so `data-setup-perm-analytics-tracking`, which clears `e2e-perm-` before it seeds, ran at 04:07:44 and `data-teardown-perm-contestant-nominations` at 04:08:08. A nomination the application wrote (no external id) that still stands under a seeded nomination when the spec ends would refuse that setup's delete, not this dataset's teardown. The spec therefore clears the application's rows in a file-level `afterAll`, and `clearWrittenNominations` passes on a dataset that is already gone. Item P-12's built option, "before each teardown's prefix delete", does not by itself cover this. *Task 2*, *Deviations*, 2.
- **An interrupted run is not covered.** A run killed after the application wrote such a row leaves it in the database, and the next run's first permutation setup would be refused by the same foreign key. Nothing in this plan's tests writes such a row yet. *Inferred from the schema, not observed.* *For later plans*.
- **Four commits, not three.** One small commit gives every seeded nomination a `sort_order`: without it the order of a party's two cards follows generated ids and the second `dataset:` test would pass or fail by chance. *Deviations*, 1.
- **Several state steps are written and not yet exercised by a test.** Which were run and which were not is under *Not done, or not verified*.
- **`tests/README.md` now holds stale sentences** about the chain; reported under *Sentences the work made false*, not edited.

## Task Commits

| Task | Commit | Subject |
|---|---|---|
| 1 | `108dbee31` | `feat(177-10): the perm-contestant-nominations dataset and its constants` |
| 1 (correction, found in Task 2) | `2975099b6` | `fix(177-10): the seeded nominations of perm-contestant-nominations state their order` |
| 2 | `fea789263` | `test(177-10): the state steps of the perm-contestant-nominations dataset` |
| 3 | `8abaf9146` | `test(177-10): contestant-nominations.spec.ts on its own dataset, in the permutation chain` |

## Each task's verify command, with its real exit status

Each `<automated>` block was written byte for byte to `tests/e2e-runs/177-unit/177-10-t<N>-verify.sh` and run with `bash`; its log, status and head are kept beside it.

| Block | As written | Restated | Head |
|---|---|---|---|
| Task 1 | **0** | — | `108dbee31`; again **0** at `8abaf9146` (`177-10-t1-verify-final.*`) |
| Task 2 | **1** — the stage `test "$(grep -c -E "^\s*test\('dataset: " $Q)" = "3"` counts 2 | **0** with that stage reading `test\(['\"]dataset: ` (counts 3) | `fea789263`; the same two statuses at `8abaf9146` |
| Task 3 | **2** — `177-verdict.mjs control … --dirty-only <five paths>`: `unexpected argument`, usage | **0** with `--dirty-only` before each of the five paths | `8abaf9146` |

Every other stage of the two chains passed as written, the second count of Task 2 (`^\s*test\(` = 3) and the no-locator search among them.

## Task 1 — the dataset

Template `perm-contestant-nominations`, `packages/dev-seed/src/templates/e2e/perm/perm-contestant-nominations.ts`, prefix `e2e-perm-contestant-nominations-`, `seed: 42`, `generateTranslationsForAllLocales: false`, every collection `count: 0`. Row external ids below are bare; the stored id is the prefix plus the slug.

| Collection | Rows as written |
|---|---|
| constituency groups | `cg-regions` (→ `co-north`, `co-south`), `cg-nation` (→ `co-nation`) |
| constituencies | `co-north` "[CO-NORTH] Northern Region", `co-south` "[CO-SOUTH] Southern Region", `co-nation` "[CO-NATION] Whole Country"; each with a Finnish name too |
| elections, each `current_round: 1` | `el-list` — `organization_list`, over `cg-regions`, English name 89 characters ("[EL-LIST] Regional Assembly Election of the Northern and Southern Regions for Party Lists"), `sort_order` 0 · `el-open` — `organization_list_and_independents`, over `cg-nation`, `sort_order` 1 · `el-cand` — `candidate_only`, over `cg-nation`, `sort_order` 2 |
| organizations | `or-new` (confirmed, no nomination, an editor) · `or-edit` (confirmed, an editor) · `or-green` (confirmed) · `or-long` (confirmed, no nomination, a 92-character English name and no other locale) · `or-pending` (`confirmed: false`, no nomination) |
| alliances | `al-coast` (confirmed) · `al-inland` (`confirmed: false`, no nomination) |
| candidates | `ca-new` (no nomination, an editor) · `ca-edit` (an editor) · `ca-child` (no editor) |
| nominations, all on the seed's confirmed default, `sort_order` in this order from 0 | `nom-or-green-list-north` · `nom-or-green-open` · `nom-al-coast-open` · `nom-or-edit-list-north` · `nom-or-edit-open` (symbol `21`) · `nom-ca-child-list-north` (under `nom-or-edit-list-north`) · `nom-ca-edit-list-north` (symbol `34`, under `nom-or-green-list-north`) |
| question categories | `qc-info` (info) · `qc-opin-all` (opinion, names no election) · `qc-opin-list` (opinion, `_elections` → `el-list`) · `qc-opin-open` (opinion, `_elections` → `el-open`) |
| questions | `qu-info-req` (text, required) · `qu-opin-all` · `qu-opin-list` · `qu-opin-open` (each a five-step scale, required, no open comment); none states an entity type |
| settings | `MINIMAL_BASE_APP_SETTINGS` with the `contestantApp` root restated whole: `entityTypes: ['candidate', 'organization']`, candidates by email and code, organizations by none. `access.answersLocked` is stated off; `access.nominationsLocked` is not stated |

- **What the pipeline does with `qc-info` and `qc-opin-all`:** a category that declares no election is fanned out to every election of the template (`pipeline.ts`), so both end with all three election ids. *Read in the pipeline, not read back from the database.*
- **The census counts no refused row.** `yarn workspace @openvaa/dev-seed test:unit`: 69 files, 1050 tests passed (1046 before: three cases of the family test for the new template and one new registry case). Two candidates stand in the closed-list election, each under a party's nomination there.
- **Colours.** Every party and alliance has a pair. `Avatar` writes `primary-content` on the entity's colour, which is white in the light theme and black in the dark one, so the pair's normal colour must carry white and its dark colour black. Computed with a scratch script (WCAG relative luminance), lowest first: white on normal 5.93 (`or-pending`) to 9.44; black on dark 6.41 (`or-edit`) to 12.22. Each colour is also above 4.55 against its theme's `base-300`, so `ensureColors` returns it unchanged. *Computed, not scanned: no page of this plan renders an avatar of this dataset.*
- **"Longer than a 320 px viewport is wide" is a character count, not a measurement**: 89 and 92 characters, each a single string with no soft hyphen. Plan 177-11 or the first phone test measures it.
- **Registry and family test:** three lines in `templates/index.ts`; in `built-in-templates-contestant-app.test.ts` a family row, a term of `familyOf`, and one case that the registry holds exactly one template of the family.

## Task 2 — the state steps, the pair, the link and the spec

### The state steps' signatures (`tests/tests/fixtures/contestant/perm-contestant-nominations.ts`)

```ts
export type NominationsState = 'none' | 'seeded';
export type AddedNominationParent = { kind: 'nomination'; externalId: string } | { kind: 'other'; name: string };
export interface AddedNomination { externalId: string; confirmed?: boolean; electionSymbol?: string; parent?: AddedNominationParent }
export interface AnswersState { requiredInfo: boolean; opinions: ReadonlyArray<string> }   // opinion questions by external id
export interface StoredNomination {
  externalId: string | null; contest: NominationContestTarget; electionSymbol: string | null;
  confirmed: boolean; parentEntityExternalId: string | null; requestedParent: string | null;
}

export async function setNominations(entity: NominationEntityTarget, state: NominationsState): Promise<void>
export async function addNomination(entity: NominationEntityTarget, contest: NominationContestTarget, nomination: AddedNomination): Promise<void>
export async function clearWrittenNominations(): Promise<void>
export async function setNominationsLocked(on: boolean): Promise<void>
export async function setAnswersLocked(on: boolean): Promise<void>
export async function setElectionType(electionExternalId: string, type: ElectionTypeName): Promise<void>
export async function setEntityConfirmed(entity: NominationEntityTarget, on: boolean): Promise<void>
export async function setAnswers(entity: NominationEntityTarget, answers: AnswersState): Promise<void>

export async function nominationsOf(entity: NominationEntityTarget): Promise<Array<StoredNomination>>   // by election, constituency, external id
export async function electionTypeOf(electionExternalId: string): Promise<string>
export async function entityConfirmedOf(entity: NominationEntityTarget): Promise<boolean>

export const test            // + contestantEntityHomePage, contestantEntityPages, contestantHomePage, contestantNominationsPage, notEditableNote, pageGeometry
export { expect }
export function contestantNominationsPagesOf(page: Page)   // { contestantEntityPages, contestantHomePage, contestantNominationsPage }
```

- **`setNominations(entity, 'none')`** deletes every nomination of the entity and, first, everything that stands under one of them, however deep. Removing a party's nominations removes those of the candidates listed under it; a test that needs those again calls `setNominations(<that candidate>, 'seeded')`.
- **`setNominations(entity, 'seeded')`** deletes every nomination of the entity that is not one of its seeded rows (the application's and `addNomination`'s alike), then imports the seeded rows whole: confirmed, with the seeded symbol, order and parent, `custom_data` null. A seeded parent row of another entity is written as seeded when it is missing and left alone when it is there.
- **`addNomination`** writes through the import under an external id that must be under the prefix and must not be a seeded row's; `confirmed` defaults to false; a typed party name with `confirmed: true` throws before any write (the database refuses it too).
- **Every step** accepts the dataset's ten entities and three elections and nothing else, and throws as `<step>: …`. A row the election's type refuses is refused by the database and rethrown under the step's name with the database's text; the harness holds no copy of the matrix.
- **`setElectionType`** says in its doc comment that a nomination stored under the old type is not checked again, and that the caller restores the type in a `finally`.

### The order in which `bulk_delete` walks the tables, and rows with no external id

`apps/supabase/supabase/schema/501-bulk-operations.sql`, `delete_order`: `nominations`, `questions`, `question_categories`, `candidates`, `factions`, `alliances`, `organizations`, `constituencies`, `constituency_groups`, `elections`, `app_settings`. One `DELETE … WHERE external_id LIKE prefix%` per table, all in one transaction. The four entity foreign keys of `nominations` are `ON DELETE CASCADE`; `parent_nomination_id` is `ON DELETE NO ACTION`, checked at the end of each statement.

What that means for a nomination the application wrote, which no prefix names — **read from the schema; no refusal was provoked**:

- It goes with its entity by cascade, when the walk reaches `candidates` (fourth), `alliances` (sixth) or `organizations` (seventh).
- **Refused, case 1:** it stands under a nomination that has an external id. The first statement deletes that parent while the child still points at it; the statement fails and the whole call with it, so nothing under the prefix is deleted.
- **Refused, case 2:** it is an organization's nomination under a placeholder the application wrote for an alliance. `alliances` is deleted before `organizations`, the alliance's cascade removes the placeholder, and the organization's row still points at it.
- **Admitted:** it stands under nothing; or it is a candidate's nomination under a placeholder written for a party (the candidate's cascade removes it before the party's removes the placeholder).

So the cascade alone would not do, and the step stays, as the plan ruled. `clearWrittenNominations` deletes the rows of the dataset's entities that carry no external id, and first whatever stands under one of them — **whatever that row carries**: a seeded row the application re-pointed at a placeholder parent keeps its external id, and the placeholder cannot be deleted while it stands there. `setNominations(…, 'seeded')` writes such a row again.

### The setup, the teardown and the link

- Setup: `setupFromTemplate('perm-contestant-nominations', { extraTeardownPrefix: ['test-', 'e2e-perm-'] })`, then four `registerAndStoreSession` calls, each in a browser context of its own, with a grant on one entity, terms accepted, and the home's status message as the settled marker. No identity is created by sign-up.
- Teardown: the prefix as a plain literal held equal to the data module's; `clearWrittenNominations()`; four `unregisterCandidate`; `runTeardownAsserted`; the four storage-state files removed.
- `tests/playwright.config.ts`: the trio after the `perm-no-nomination` trio — `data-setup-perm-contestant-nominations` (depends on `perm-no-nomination`), `data-teardown-perm-contestant-nominations` (`retries: 0`), `perm-contestant-nominations` (`testMatch: /contestant-nominations\.spec\.ts/`, not fully parallel, no stored session on the project). `data-setup-perm-analytics-tracking` now depends on `perm-contestant-nominations`. The chain's comment, the analytics project's comment and the file header's paragraph on the perm family say so.
- **Position in the chain:** … → `perm-organization-editing` → `perm-no-nomination` → **`perm-contestant-nominations`** → `voter-prefs-tracking` (the tail). `perm-startfromcg` still precedes `perm-no-nomination`.
- `scripts/assert-a11y-scan-wiring.mjs`: the spec is read, fails the guard closed when it cannot be read, and is one more entry of check 4a with no required import; the header's counts follow (seven files of check 4a, nine files read).

### The spec's three tests

`tests/tests/specs/perm/contestant-nominations.spec.ts`, no locator, hard assertions only:

1. `dataset: a candidate with no nomination is on its home with the nomination task open` — `ca-new`'s session; `setNominationsLocked(false)`, `setNominations(…, 'none')`; the home has landed for that entity, the task list reads nomination incomplete and the others blocked, the main action leads to the nomination; the nominations view is empty with no card.
2. `dataset: a party's seeded nominations are listed as confirmed` — `or-edit`'s session; `setNominationsLocked(false)`, `setNominations(…, 'seeded')`; two cards, the closed-list election in the northern region first and the open election with symbol `21` second, each confirmed.
3. `dataset: the state steps write and restore what they are given` — no page; `el-cand`'s type flipped to `organization_only`, read back, restored in a `finally`, read back; `or-pending` confirmed, read back, restored in a `finally`, read back; `ca-edit` given a second nomination in the closed-list election with a typed party name, both rows read back, then `setNominations(…, 'seeded')` and the one seeded row read back with its symbol, its confirmation and its parent.

## Task 3 — the runs

### The pre-commit control

`tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/177-e2e/177-10-precommit --no-db-reset --project perm-contestant-nominations`, then `e2e-evidence.mjs`.

- Head `fea789263`, which holds the fixture module and not the spec. Uncommitted, as the wrapper recorded: exactly the five files of `<uncommitted_changes>`. A copy of each is kept as `177-10-precommit.<file name>.kept`, and each was byte-equal to the working tree when it was committed.
- 272 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 94 projects; wrapper status 0; started 03:47:15Z, ended 03:55:20Z; AC power; Docker VM 17.2 GiB free before it.
- `perm-contestant-nominations`: 3 of 3; its setup 4.7 s, its teardown passed. In this slice the teardown ran straight after the spec, on a dataset that was still there.
- Verdict (with `--dirty-only` before each path): `177-verdict control 177-10-precommit --green: PASS`, status 0. First attempt; there is no `-r2`.

### Gate rows — `tests/e2e-runs/177-gates/177-10-close`, head `8abaf9146`

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 22 |
| lint | 0 | 49 |
| unit | 0 | 68 |
| build | 0 | 17 |
| format | 0 | 19 |

`177-verdict gates 177-10-close --rows typecheck,lint,unit,build,format`: PASS, not stale, no Sleep entry in the window. Unit totals: dev-seed 1050 passed; frontend 3687 passed and 30 skipped, as in `177-09-close`; data 318; supabase 462; app-shared 148.

### The full run — `tests/e2e-runs/177-e2e/177-10-close`, head `8abaf9146`

- `bash 177-e2e.sh 177-10-close --require-project perm-contestant-nominations`, status 0. Docker VM 17.10 GiB free before it (the driver's own record), 17.0 after. AC power at both ends. Started 03:59:30Z, ended 04:08:21Z. Six workers, no retries, one preflight success, no preflight failure, no void marker.
- **346 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 116 projects.** It is the first full run with the changes of plans 177-08 and 177-09.
- Verdict, as the plan writes it: `--same-projects-as 177-07-close` with the three `--except …=+`, `--expect-project perm-contestant-nominations`, `--expect-title-count "perm-contestant-nominations::dataset:=3"` — **PASS**, status 0: `per project: 116 compared, 0 not as expected`.
- **Per project against `177-07-close`:** 113 projects equal to their count there (`perm-no-nomination` 68, `perm-organization-editing` 46, `voter-prefs-tracking` 3, `data-setup-perm-analytics-tracking` 1 among them); `data-setup-perm-contestant-nominations` 1 against 0, `data-teardown-perm-contestant-nominations` 1 against 0, `perm-contestant-nominations` 3 against 0. 341 + 5 = 346.
- **Order observed:** `perm-no-nomination` 04:06:20 → `data-setup-perm-contestant-nominations` 04:07:37 → `perm-contestant-nominations` 04:07:42 → `data-setup-perm-analytics-tracking` 04:07:44 → `voter-prefs-tracking` 04:07:45 → `data-teardown-perm-analytics-tracking` 04:08:08 → `data-teardown-perm-contestant-nominations` 04:08:08 → `data-teardown-perm-no-nomination` 04:08:09. This dataset's teardown ran after the analytics setup had already cleared `e2e-perm-`, and passed.
- No void, no red run, no axe finding and no overflow in either run. No test was retried.

## For later plans

### For plans 177-11 and 177-15 to 177-20 — the four sessions

All from `tests/tests/utils/permContestantNominationsData.ts`. Password: `CONTESTANT_NOMINATIONS_PASSWORD` (the suite's shared test password). Each editor edits one entity, so the app's root leads to that entity's home.

| Who | Grant (`EntityGrantTarget`) | Address | Storage state |
|---|---|---|---|
| the candidate with no nomination, `ca-new` | `NEW_CANDIDATE_GRANT` | `NEW_CANDIDATE_EDITOR_EMAIL` | `NEW_CANDIDATE_STORAGE_STATE` (`playwright/.auth/perm-contestant-nominations-candidate-new.json`) |
| the party with no nomination, `or-new` | `NEW_ORGANIZATION_GRANT` | `NEW_ORGANIZATION_EDITOR_EMAIL` | `NEW_ORGANIZATION_STORAGE_STATE` (`…-organization-new.json`) |
| the candidate under `or-green`, `ca-edit` | `EDIT_CANDIDATE_GRANT` | `EDIT_CANDIDATE_EDITOR_EMAIL` | `EDIT_CANDIDATE_STORAGE_STATE` (`…-candidate-edit.json`) |
| the party with two nominations, `or-edit` | `EDIT_ORGANIZATION_GRANT` | `EDIT_ORGANIZATION_EDITOR_EMAIL` | `EDIT_ORGANIZATION_STORAGE_STATE` (`…-organization-edit.json`) |

### Every constant a test will read

- **Prefix and types:** `CONTESTANT_NOMINATIONS_PREFIX`; `NominationEntityTarget` (`{ entityType: 'candidate' | 'organization' | 'alliance'; externalId }` — an `EntityGrantTarget` is one); `NominationContestTarget` (`{ electionExternalId, constituencyExternalId }`); `ElectionTypeName`; `NOMINATION_ELECTION_ROUND`.
- **Elections:** `LIST_ELECTION_EXTERNAL_ID` / `LIST_ELECTION_NAME`, `OPEN_ELECTION_EXTERNAL_ID` / `OPEN_ELECTION_NAME`, `CANDIDATE_ONLY_ELECTION_EXTERNAL_ID` / `CANDIDATE_ONLY_ELECTION_NAME` (names by locale, `en` and `fi`); `SEEDED_ELECTION_TYPES` (external id → seeded type, what a `finally` restores).
- **Constituencies:** `NORTH_CONSTITUENCY_EXTERNAL_ID` / `_NAME`, `SOUTH_…`, `NATION_…`.
- **Contests:** `LIST_NORTH_CONTEST`, `LIST_SOUTH_CONTEST` (no seeded nomination), `OPEN_NATION_CONTEST`, `CANDIDATE_ONLY_NATION_CONTEST` (no seeded nomination).
- **The edited entities:** `NEW_CANDIDATE_EXTERNAL_ID` / `NEW_CANDIDATE_NAME`; `NEW_ORGANIZATION_EXTERNAL_ID` / `NEW_ORGANIZATION_NAME`; `EDIT_CANDIDATE_EXTERNAL_ID` / `EDIT_CANDIDATE_NAME`, `EDIT_CANDIDATE_NOMINATION_EXTERNAL_ID`, `EDIT_CANDIDATE_ELECTION_SYMBOL` (`'34'`), `EDIT_CANDIDATE_SECOND_NOMINATION_EXTERNAL_ID` (the id `addNomination` writes for a second nomination in the closed-list election; not seeded); `EDIT_ORGANIZATION_EXTERNAL_ID` / `EDIT_ORGANIZATION_NAME`, `EDIT_ORGANIZATION_OPEN_NOMINATION_EXTERNAL_ID`, `EDIT_ORGANIZATION_ELECTION_SYMBOL` (`'21'`), `EDIT_ORGANIZATION_LIST_NOMINATION_EXTERNAL_ID`.
- **The entities no user edits**, each a `NominationEntityTarget` with a `_NAME` beside it: `GREEN_ORGANIZATION` (+ `GREEN_ORGANIZATION_LIST_NOMINATION_EXTERNAL_ID`, `GREEN_ORGANIZATION_OPEN_NOMINATION_EXTERNAL_ID`), `LONG_ORGANIZATION`, `PENDING_ORGANIZATION`, `COAST_ALLIANCE` (+ `COAST_ALLIANCE_OPEN_NOMINATION_EXTERNAL_ID`), `INLAND_ALLIANCE`, `CHILD_CANDIDATE` (+ `CHILD_CANDIDATE_NOMINATION_EXTERNAL_ID`); `SEEDED_UNCONFIRMED_ENTITY_EXTERNAL_IDS`.
- **Lists:** `SEEDED_NOMINATIONS` (the seven rows: external id, entity, contest, `sortOrder`, symbol, parent), `NOMINATION_ENTITIES` (the ten entities).
- **Questions:** `REQUIRED_INFO_QUESTION_EXTERNAL_ID` / `_LABEL`; `SHARED_OPINION_QUESTION_EXTERNAL_ID` / `_LABEL`, `LIST_OPINION_QUESTION_…`, `OPEN_OPINION_QUESTION_…`; `OPINION_QUESTION_EXTERNAL_IDS`.

### What a test of the editor needs to know

- **Which situation is where.** A required parent: a candidate in `el-list`. "Independent / no party": a candidate in `el-open`. A listed party with no nomination at the pair: `or-new`, `or-long`, and `or-edit` or `or-green` at `LIST_SOUTH_CONTEST`. A party that is not listed: `or-pending` (flip with `setEntityConfirmed`, restore in a `finally`). An alliance with no nomination at a pair: `al-coast` anywhere but `OPEN_NATION_CONTEST`; `al-inland` is unconfirmed. A nomination with a candidate under it: `nom-or-edit-list-north` (`ca-child`). One admissible election with several constituencies: `el-list` is the only election with two. A party's admissible elections are `el-list` and `el-open`; a candidate's are all three. Questions that follow a nomination: `qu-opin-list` and `qu-opin-open`.
- **Card order.** `get_entity_nominations` orders by `sort_order` nulls last, then by id. The seeded rows state an order; a row the application writes has none and sorts after them, among themselves by generated id. A test that asserts cards by index after a save of two new rows needs an order of its own, or plan 177-13's ordering.
- **`keep`, `entity` and the seeded rows.** `ca-edit`'s seeded row stands under `or-green`'s nomination, and `or-green` holds one nomination at that contest, so `entity` naming `or-green` is `unchanged` there (177-09's finding).
- **Leave no written row behind.** The spec's `afterAll` runs `clearWrittenNominations()`. A test that saves through the editor need not clean up for the next test (each begins with its own state steps), but plans 177-16 and 177-19, whose specs will also write through the editor on other datasets, need the same `afterAll` in their spec, not only the call in their teardown — see *Read this first*.
- **An interrupted run.** Not covered by anything here: a killed run that left a written row under a seeded one makes the next run's first `e2e-perm-` clear fail on `nominations_parent_nomination_id_fkey`. The remedy then is one call of `clearWrittenNominations()` (it reads only this dataset's entities), or a database reset through the gate driver. A lasting fix would be in the shared clear and is not this plan's to make: a todo for the orchestrator.
- **`contestantNominationsPagesOf(page)`** is the bundle for a scan entry's `reach`; plan 177-11's editor fixture joins it and the `test` object there.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The order of an entity's seeded nominations was not fixed**
- **Found during:** Task 2, while writing the second `dataset:` test.
- **Issue:** `get_entity_nominations` orders by `sort_order NULLS LAST, id`, and the template of `108dbee31` stated no order, so `or-edit`'s two cards would have come in the order of two generated ids. A test asserting them by index would have been intermittent.
- **Fix:** every seeded nomination states `sort_order` 0 to 6, a party's row in the closed-list election before its row in the open one; the data module repeats it and `setNominations(…, 'seeded')` restores it.
- **Files modified:** the template, `permContestantNominationsData.ts`.
- **Commit:** `2975099b6`.

**2. [Rule 2 - Missing critical functionality] The teardown is not the first prefix delete**
- **Found during:** Task 2, reading the order of projects in `177-07-close/results.json`; observed again in `177-10-close`.
- **Issue:** threat T-177-45's mitigation is the teardown's call. The next link's setup deletes `e2e-perm-` rows before this dataset's teardown runs, and the teardown then meets a dataset that is gone.
- **Fix:** a file-level `test.afterAll` in the spec calls `clearWrittenNominations()`, and the step looks the dataset's entities up by a list of external ids and passes when none is found. The teardown's call stays, as the plan asks.
- **Files modified:** the spec, the fixture module.
- **Commits:** `fea789263`, `8abaf9146`.

### Other deviations

3. **Task 2's verify, the stage that counts titles in single quotes.** One of the plan's three titles is `dataset: a party's seeded nominations are listed as confirmed`; with an apostrophe in it Prettier writes the string in double quotes, and the `format` row requires that. The title was kept as the plan writes it. As written: status 1. With the stage reading either quote: status 0.
4. **Task 3's verify and step 1, the `control` call.** `--dirty-only A B C D E` is refused by `177-verdict.mjs` (`unexpected argument`, status 2); its usage is one path per flag. As written: status 2. With the flag before each path: status 0, `PASS`.
5. **Exports beyond the plan's list.** Three readers (`nominationsOf`, `electionTypeOf`, `entityConfirmedOf`), which the third test needs to "read back" without holding a query; the type `NominationEntityTarget` in the data module, because `EntityGrantTarget` admits no alliance and `setEntityConfirmed` takes one; `contestantHomePage` among the `test` fixtures, which the first test's "nomination task open" reads.
6. **`setAnswers` is not the analog's shape.** `opinions` is a list of external ids, not `'none' | 'allButLast' | 'all'`: the dataset's opinion questions are asked per election, so "all but the last" names nothing a test would mean.
7. **Tests 1 and 2 begin with `setNominationsLocked(false)`** beside the plan's `setNominations`: each asserts `locked: false`, and a test writes what it reads.
8. **`scripts/assert-a11y-scan-wiring.mjs`'s header** lost the word "three" ("the helper module the three Contestant App specs declare their scans through"): the new spec declares no scan yet, and the count would have been wrong either way.
9. **The start time is approximate** (03:26Z, from the first commands' output); it was not recorded when the plan began.

## Prohibitions

- **PROH-177-25** (judgment): held. Each of the three tests begins with its state steps; the two flips of the third test are restored in a `finally`; no step writes past the election-type rule, because the database applies it to the service role and the step rethrows.
- **PROH-177-26** (explicit): held. `git diff 532d7482f..8abaf9146 --stat` names no other template and no other dataset's files; the full run's 113 earlier projects keep their counts.
- **PROH-177-27** (judgment): held. The four identities are created by `registerAndStoreSession` with entity grants; no title holds an address or a password; this plan adds no log line.

## Threat Flags

None. No endpoint, auth path or schema object was added. T-177-44 to T-177-47 are mitigated as the plan lays out, with T-177-45 widened as *Deviations*, 2 says.

## Sentences the work made false, reported and not edited

All in `tests/README.md`, for plan 177-21:

- "**The no-nomination link, `perm-no-nomination`.** It sits in the chain after `perm-organization-editing` and before `data-setup-perm-analytics-tracking`" — it is now before `data-setup-perm-contestant-nominations`.
- "**The organization-editing link** … it is one of the two permutation datasets whose settings serve organizations as well" — there are three.
- The project tables beside those two paragraphs hold no row for the new trio, and there is no paragraph for the new link.
- The list under "`tests/tests/fixtures/contestant/`" names `perm-organization-editing.ts` and `perm-no-nomination.ts` as the composition roots; `perm-contestant-nominations.ts` is a third.
- Any statement of the suite's size as 341 tests or 113 projects is now 346 and 116. None was found in `tests/README.md`, `CLAUDE.md`, the skills or the docs by a search for those figures.

## Not done, or not verified

- **State steps written and not run by any test:** `setAnswers`, `setAnswersLocked`, `setNominationsLocked(true)`, `addNomination` with a parent nomination, with a symbol or confirmed. **Run only on an empty set:** `setNominations(…, 'none')` (the candidate had no nomination), `clearWrittenNominations` (no written row existed; it ran in the `afterAll` and in the teardown, once on a present dataset and once on a deleted one). **Run with rows:** `setNominations(…, 'seeded')` for `or-edit` and `ca-edit`, including the removal of one row that is not seeded; `addNomination` with a typed party name; `setElectionType`; `setEntityConfirmed`; the three readers.
- **The deletion of a nomination with others under it** (`deleteWithDescendants` past its first level) has run on no data.
- **No refusal was provoked**: neither the parent foreign key's on a prefix delete nor the election-type rule's through a state step. Both are read from the schema and from 177-07's and 177-09's observations.
- **The colours were computed, not scanned**, and the long names were counted, not measured.
- **The category fan-out** for `qc-info` and `qc-opin-all` was read in the pipeline, not read back from the database.
- **No check of `.agents/code-review-checklist.md`**: the plan adds no application code and has no checklist step.

## The state the local stack is left in

- Supabase running, never restarted; no database reset by this plan (the gate rows were typecheck, lint, unit, build, format). The default project holds what it held after plan 177-09.
- The suite's own project: each teardown of `177-10-close` passed its accounting, so no row under `e2e-perm-contestant-nominations-` is left; the four editors were unregistered; `tests/playwright/.auth/` holds no `perm-contestant-nominations-*` file.
- `39-invitations.test.sql` test 238 will be red on this database until the next reset, as after every full run (the known finding).
- Nothing listens on port 5273. No run is in flight. Docker VM: 17.0 GiB free.

## Known Stubs

None.

## Evidence (gitignored)

- `tests/e2e-runs/177-e2e/177-10-precommit/` and the five `177-10-precommit.<file name>.kept` beside it; `tests/e2e-runs/177-gates/177-10-close/`; `tests/e2e-runs/177-e2e/177-10-close/`.
- `tests/e2e-runs/177-unit/`: `177-10-t{1,2,3}-verify.{sh,log,exit,head}`, `177-10-t{2,3}-verify-restated.{sh,log,exit,head}`, `177-10-t1-verify-final.*`, `177-10-t2-verify-final.*`, `177-10-t2-verify-restated-final.*`, `177-10-t1-devseed.{log,exit}`, `177-10-t2-checks.log`, `177-10-close-e2e.verdict.log`, the three `*.launch.{log,exit}` markers.

## Self-Check: PASSED

- Created files found on disk and tracked: the template, the data module, the fixture module, the setup, the teardown, the spec (`git ls-files --error-unmatch`, status 0).
- Commits found as ancestors of HEAD: `108dbee31`, `2975099b6`, `fea789263`, `8abaf9146`.
- `git status --short` before this file was written: `?? CAND-APP-PLAN.md` and nothing else.
