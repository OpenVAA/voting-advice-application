---
phase: 177-define-nominations
plan: 02
subsystem: database-schema, dev-seed
tags: [nomination-shape, election-type, enum, column-default, census, dev-seed, pgtap]
status: complete
requires:
  - "177-01: 177-gates.sh, 177-e2e.sh, 177-verdict.mjs, 177-BASE, 177-BASELINE"
provides:
  - "public.nomination_shape has a fourth and last member, organization_list_and_independents, and elections.election_type defaults to it"
  - "the regenerated migration and the regenerated database types name the member"
  - "packages/dev-seed/tests/nominationShapeCensus.builtins.test.ts — the census over the registry of built-in templates, zero refused rows"
  - "every election row of every built-in template, the shared minimal helper and the synthetic-election generator state the new default"
  - "the full run tests/e2e-runs/177-e2e/177-02-close, the predecessor of 177-03-close"
affects: [177-03, 177-08, 177-10, 177-21]
tech-stack:
  added: []
  patterns:
    - "a census whose expected count is zero carries a control over planted rows, so that it is seen refusing"
key-files:
  created:
    - packages/dev-seed/tests/nominationShapeCensus.builtins.test.ts
  modified:
    - apps/supabase/supabase/schema/000-enums.sql
    - apps/supabase/supabase/schema/101-elections.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/15-visibility-flags.test.sql
    - packages/supabase-types/src/database.ts
    - packages/dev-seed/src/generators/ElectionsGenerator.ts
    - packages/dev-seed/src/templates/_helpers/buildMinimal.ts
    - packages/dev-seed/src/templates/default.ts
    - packages/dev-seed/src/templates/e2e/base.ts
    - packages/dev-seed/src/templates/e2e/perm/notLocated2e2cgShape.ts
    - packages/dev-seed/src/templates/e2e/perm/ (twelve perm templates, listed below)
    - packages/dev-seed/README.md
decisions:
  - "ElectionsGenerator emits organization_list_and_independents for synthetic elections (item P-14, the built option)"
  - "The README's example template is re-typed too: its generated candidate nominations name no party, so the coming rule would refuse it under organization_list"
requirements-completed: [NOM-04]
metrics:
  started: 2026-10-10T23:59:10Z
  completed: 2026-10-11T00:21:00Z
  duration: "22 minutes"
  tasks: 3
  files: 24
actuals:
  tokens: 9300
  tasks: 3
  commits: 5
plan_head_before: 5cbd309554cbbc1aac07672b4b4a6d8848eddf25
plan_head_after: 87e9f220328557d3f69deb3b53b0d8a190b419e8
---

# Phase 177 Plan 02: The Fourth Election Type as the Default, the Census and Every Template on It — Summary

`public.nomination_shape` gains `organization_list_and_independents` as its fourth member and the default of `elections.election_type`; a standing dev-seed test runs all 33 built-in templates through the pipeline and counts zero nominations their election's type refuses, committed red on six rows first; all 45 election rows the templates emit state the new type; and the full E2E suite is green on that tree with the baseline's projects and counts.

`requirements-completed` names NOM-04 because the plan's frontmatter does; this plan delivers the enum member, the default and the census. The rule itself is plan 177-03's, and `REQUIREMENTS.md` was not touched.

## Read this first

- **For plan 177-03: no row of any built-in template would still be refused.** Every one of the 45 election rows emitted by the 33 registered templates states `organization_list_and_independents`, which admits a nomination of each of the four entity types with or without a parent. The census counts 0 refused rows over 646 nominations.
- **The red census named exactly the six rows RESEARCH RQ-1 lists**, in the same three templates. No other row.
- **No dev-seed test pinned the generator's old value** (assumption A10 holds): nothing was changed under `packages/dev-seed/tests` but the new census file.
- **One file outside the plan's list was changed: `packages/dev-seed/README.md`.** Its example template stated `organization_list` beside `nominations: { count: 20 }`, which emits twenty party-less candidate nominations. See *Deviations*, 1.
- **Two sentences outside this plan's files are now false and were not edited**: see *Sentences the work made false*.

## Task Commits

| Task | Commit | Subject | Files |
|---|---|---|---|
| 1 | `e1af66765` | test(177-02): the nomination-shape enum has four members and the new one is the default [db] | `15-visibility-flags.test.sql` |
| 1 | `c3ff530c6` | feat(177-02): a fourth election type, organization_list_and_independents, as the default [db] | `000-enums.sql`, `101-elections.sql`, `00001_initial_schema.sql` |
| 1 | `25ee1429e` | chore(177-02): the generated database types for the fourth election type [db] | `packages/supabase-types/src/database.ts` |
| 2 | `a01a67b37` | test(177-02): no built-in template seeds a nomination its election's type refuses | `nominationShapeCensus.builtins.test.ts` |
| 2 | `87e9f2203` | feat(177-02): every seed template and the election generator state the new default election type | 16 template files, `ElectionsGenerator.ts`, `README.md` |

Head before the plan: `5cbd30955`. Five commits, measured with `git rev-list --count 5cbd30955..HEAD`. 24 files changed, 321 insertions, 44 deletions.

## Each task's verify command, with its real exit status

Each `<automated>` block was written byte for byte to `tests/e2e-runs/177-unit/177-02-t<N>-verify.sh` by `177-02-extract-verify.mjs`, which reads the plan, and run with `bash`. Log, status and head are beside each.

| Verify | Head | Exit |
|---|---|---|
| Task 1 | `25ee1429e` | 0 |
| Task 2 | `87e9f2203` | 0 |
| Task 3 | `87e9f2203` | 0 |

`177-verdict.mjs scope` at the final head: 0, PASS. `177-verdict.mjs hygiene`: 0, 0 hits, 0 advisory lines.

## Task 1 — the enum, the default, the migration and the types

### The pinned assertion, red first

`15-visibility-flags.test.sql`: the sorted array holds four members and its description reads "exactly the four ratified members and no fifth"; one assertion was added beside it, on the column's default; the file's plan went from 30 to 31. The default is read from `information_schema.columns.column_default` through `split_part(column_default, '::', 1)`, because the cast's schema qualification follows the search path (observed: `'organization_list'::nomination_shape` under the file's own search path).

The red run, on commit `e1af66765`, through the gate driver (`177-gates.sh 177-02-pgtap-red --rows db-reset,pgtap`), kept as `tests/e2e-runs/177-unit/177-02-pgtap-red.{log,exit,head}`: status 1, `Files=42, Tests=1958`, `Result: FAIL`, two failures and no other, both expectations:

```
# Failed test 27: "The nomination-shape enum has exactly the four ratified members and no fifth"
#         have: {candidate_only,organization_list,organization_only}
#         want: {candidate_only,organization_list,organization_list_and_independents,organization_only}
# Failed test 28: "An election that states no type takes organization_list_and_independents, the column default"
#         have: 'organization_list'
#         want: 'organization_list_and_independents'
```

### The schema and the regenerated migration

- `000-enums.sql`: the member added fourth and last; the header line and the type's comment say four flows, and one sentence says what the new one is.
- `101-elections.sql`: `DEFAULT 'organization_list_and_independents'`; the column's comment says four flows and what an election that states none takes.
- `yarn schema:regenerate`, exit 0; the regenerated diff was read: the header line, the type's comment, the member, the column's comment and the default, and nothing else (15 lines of the migration). `yarn assert:schema-migration-parity`: 0.

### The database rows

| Run | Head | db-reset | types-regen | types-clean | pgtap | sql-lint | Driver |
|---|---|---|---|---|---|---|---|
| `177-gates/177-02-db` | `c3ff530c6` | 0 | 0 | **1** | 0 | 0 | 1 |
| `177-gates/177-02-db-r2` | `25ee1429e` | 0 | 0 | 0 | 0 | 0 | 0 |

`types-clean` was red on the first attempt for `packages/supabase-types/src/database.ts` alone, as the plan expects: the enum's union and the `Constants` array each gained the member (10 lines). The driver restores the committed file and keeps the generator's output as `db-types-drift.diff`; that diff was applied with `git apply` and committed. The file was not edited by hand, and the second attempt regenerated it on a freshly reset database and found it equal to the committed one.

`node 177-verdict.mjs gates 177-02-db --rows db-reset,types-regen,types-clean,pgtap,sql-lint` read the newest attempt, `177-02-db-r2`: PASS, not stale, no Sleep entry in the window. pgTAP there: `Files=42, Tests=1958`, `Result: PASS` (the baseline's 1957 and the one assertion added). SQL lint: 0 errors, 3 warnings, the 9001 census line unchanged (107 policies, 21 tables, 23 members).

## Task 2 — the census, red first, and the re-typing

### The census test

`packages/dev-seed/tests/nominationShapeCensus.builtins.test.ts`, five cases:

1. the registry is iterated with `Object.keys(BUILT_IN_TEMPLATES)` and holds at least 30 templates;
2. the corpus is substantial: at least one election per template and at least 500 nominations;
3. every election row states a type the generated enum knows;
4. no template emits a nomination its election's type refuses — compared as an array of lines, each naming the template, the collection, the row's `external_id` and the offence;
5. a control: thirteen planted rows, of which exactly the eight that must be refused are (a party-less candidate in a list election; a candidate and a faction in an organizations-only election; an organization, an alliance and a faction in a candidates-only election; a row that names no entity; a row whose election is not emitted), and five are admitted (a list candidate with a parent, one with the `requestedParentOrganization` key, a party-less candidate under the new type, an alliance in an organizations-only election, a candidate in a candidates-only election).

The classifier's matrix is written out in the file for the four entity types in each of the four election types. It imports `runPipeline` and the registry from the package and the two enums from the generated database types, and nothing from the application. `EXPECTED` is typed by the generated enums, so a fifth member is a compile error until the matrix names it.

Measured over the registry at the final head (a scratch script, not committed): 33 templates, 45 election rows, 646 nomination rows — 452 candidates with a parent, 6 without, 123 organizations without a parent, 46 with, 19 alliances.

### The rows the red census named, by template

Kept as `tests/e2e-runs/177-unit/177-02-census-red.{log,exit,head}`: status 1, head `25ee1429e` (the test file uncommitted on it), `Test Files 1 failed | 68 passed (69)`, `Tests 1 failed | 1045 passed (1046)`. The one failure is case 4, an expectation. Each row is a candidate in an `organization_list` election with no parent nomination and no `requestedParentOrganization` key.

| Template | Row | Election |
|---|---|---|
| `e2e/base` | `test-e2e-base-nom-reg-n-ca-independent` | `test-e2e-base-el-reg` |
| `e2e/base` | `test-e2e-base-nom-reg-n-ca-sel-a` | `test-e2e-base-el-reg` |
| `e2e/base` | `test-e2e-base-nom-reg-n-ca-sel-b` | `test-e2e-base-el-reg` |
| `e2e/base` | `test-e2e-base-nom-mun-nw-ca-independent` | `test-e2e-base-el-mun` |
| `perm-organization-editing` | `e2e-perm-organization-editing-nom-ca-unconfirmed` | `e2e-perm-organization-editing-el-1` |
| `perm-no-nomination` | `e2e-perm-no-nomination-nom-ca-nominated` | `e2e-perm-no-nomination-el-1` |

Six rows in three templates, the same six RESEARCH RQ-1 lists. No row of a cell rule (a wrong entity type for the election) was named.

A first red run was made on a draft of the test before four arrow functions were rewritten as declarations for the lint rule `func-style`; it named the same six rows and is kept as `177-02-census-red-draft.{log,exit,head}`.

### The population, and every file changed

`git grep -n "election_type" -- packages/dev-seed/src` at the start: 26 lines in 18 files, as `177-BASELINE-FACTS.md` records.

| File | Lines changed | In the plan's frontmatter |
|---|---|---|
| `generators/ElectionsGenerator.ts` | 1 value (`candidate_only` → the new default) and its comment | yes |
| `template/permittedKeys.ts` | 0 — it holds the key's own name, no literal | — |
| `templates/_helpers/buildMinimal.ts` | 1 | yes |
| `templates/default.ts` | 1 | yes |
| `templates/e2e/base.ts` | 2 | yes |
| `templates/e2e/perm/notLocated2e2cgShape.ts` | 2 | yes |
| `templates/e2e/perm/perm-no-nomination.ts` | 1 | yes |
| `templates/e2e/perm/perm-organization-editing.ts` | 1 | yes |
| `templates/e2e/perm/perm-startfromcg.ts` | 2 | yes |
| `templates/e2e/perm/perm-2e-asymmetric.ts` | 2 | **no** |
| `templates/e2e/perm/perm-2e-shared.ts` | 2 | **no** |
| `templates/e2e/perm/perm-analytics-tracking.ts` | 1 | **no** |
| `templates/e2e/perm/perm-disable-election-1co.ts` | 2 | **no** |
| `templates/e2e/perm/perm-disable-election-2co.ts` | 2 | **no** |
| `templates/e2e/perm/perm-disjoint-1co.ts` | 2 | **no** |
| `templates/e2e/perm/perm-interactive-info.ts` | 1 | **no** |
| `templates/e2e/perm/perm-org-matching.ts` | 1 | **no** |
| `templates/e2e/perm/perm-question-video.ts` | 1 | **no** |

Nine template files the search found are not in the plan's frontmatter; each was changed, as ruling 4 says. 24 template lines in 16 files, one generator value, one generator comment. Outside the search's directory: `packages/dev-seed/README.md`, one line (*Deviations*, 1).

After the change the search finds the new default on 25 lines and the key's name in `permittedKeys.ts`; no line under `packages/dev-seed/src` states `organization_list` or `candidate_only`. No template's header or comment named the type, so none was reworded. The diff of the commit is the 27 changed lines and nothing else: no row, no parent and no count moved.

### The dev-seed tests that pinned the old generator value

None. `git grep -n -e "candidate_only" -e "organization_list" -- packages/dev-seed/tests` finds the census file alone, and the package's suite was green at once after the change: `Test Files 69 passed (69)`, `Tests 1046 passed (1046)`, kept as `177-02-census-green.{log,exit}`.

## Task 3 — the gate rows and the full run

### Gate rows

`177-gates/177-02-close`, head `87e9f2203`:

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 20 |
| lint | 0 | 49 |
| unit | 0 | 70 |
| build | 0 | 17 |
| format | 0 | 19 |

`177-verdict.mjs gates 177-02-close --rows typecheck,lint,unit,build,format`: PASS, not stale, no Sleep entry in the window. Unit, from the row's log: frontend `Test Files 194 passed | 1 skipped (195)`, `Tests 3575 passed | 20 skipped (3595)`, the baseline's numbers; dev-seed 69 files and 1046 tests.

### The full run

`tests/e2e-runs/177-e2e/177-02-close`, head `87e9f2203`, started `2026-10-11T00:11:03Z`, ended `00:19:47Z`.

- Before it: AC power, 100 %; the Docker VM's free space 18.22 GiB (19,106,356 KiB) by my own reading, and 18.22 GiB by the driver's after its prune; nothing listening on port 5273; no gate row running.
- The driver's and the wrapper's status: 0. Not void: no `VOID-host-suspend.txt`, 0 Sleep entries in the window, AC power at both ends.
- **Counts: total 341, passed 341, failed 0, flaky 0, skipped 0, did not run 0; 113 projects.**
- `177-verdict.mjs e2e 177-02-close --same-projects-as tests/e2e-runs/176-e2e/261011-vj-final`: **PASS** — 113 projects compared, 0 not as expected: every project of the baseline is in the run with the baseline's count, and no other project.

What the run showed about a dataset or a spec: nothing. Every `data-setup-*` project passed, the three whose templates held a refused row among them (`data-setup-base`, `data-setup-perm-organization-editing`, `data-setup-perm-no-nomination`), and no spec read a value the re-typing moved. No axe finding and no overflow was reported by any test.

## Deviations from Plan

**1. [Rule 2] `packages/dev-seed/README.md` is re-typed, outside the plan's file list and outside the population search.** Its example template under "Authoring a custom template" stated `election_type: 'organization_list'` with `nominations: { count: 20 }`, and the generator's `count` branch emits candidate nominations with no parent. From plan 177-03 on, a reader who copies that example would have its import refused. The one line now states the new default. It is in commit `87e9f2203`. The other option is one literal back.

**2. The red pgTAP run was made through the gate driver, under a label of its own.** The plan says "run the database tests in the background"; the dispatch says pgTAP runs only through the gate driver, which resets first. So: `177-gates.sh 177-02-pgtap-red --rows db-reset,pgtap`, and the pgTAP row's log and status copied to `$U/177-02-pgtap-red.{log,exit}`. This adds the directory `tests/e2e-runs/177-gates/177-02-pgtap-red` to the artifacts the plan lists.

**3. The regenerated types were committed from the driver's kept diff.** The driver's `types-clean` row puts the committed file back and keeps the generator's output as a diff; by then pgTAP had run on the database, so a second `yarn db:types` by hand would have described the helper functions too. The diff was applied with `git apply`. The second attempt's `types-clean`, on a fresh reset, is the proof that the committed file is the generator's.

**4. The census has a fifth case the plan's `<behavior>` does not list**: the control over planted rows. With every template on a type that admits everything, the zero of case 4 would otherwise not show that the classifier can refuse.

**5. A second red census run.** The first was made on a draft; the test file was then changed for a lint rule, so the red run was made again on the file as committed. Both are kept.

**6. The enum's comment says what the new flow is and does not describe the other three.** A first draft listed all four with what each admits; that would have stated rules the database does not hold until plan 177-03, so it was cut back before the commit.

**7. `yarn db:seed:default` was run after the full run** (exit 0, 752 rows), as Phase 176's executors did and as the gate driver's header says, so that the default project holds its dataset again after the resets. The plan does not ask for it. It also shows the `default` template importing under the new type.

**8. `PATTERNS.md` § B4 says the pinned array moves "in the same commit as the enum".** The plan and the execution rules say the assertion is committed red and alone first. The plan was followed.

**9. HEAD is on `feat/entity-signup-multi-grant`**, the branch the orchestrator named, not on a per-agent branch. `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not updated and nothing was appended to `.planning/WINDOWS.md`, on the dispatch's instruction.

## Sentences the work made false, reported and not edited

- `.claude/skills/database/schema-reference.md`, the `election_type` row: "`NOT NULL DEFAULT 'organization_list'`" and "which of the three nomination flows an election runs: organization_only / candidate_only / organization_list".
- `.claude/skills/database/SKILL.md`: "1957 pgTAP assertions in 42 files: 41 files declare plans summing to 1948" and "`Files=42, Tests=1957`" — a run now reports 1958, the planned sum 1949.
- `177-BASELINE-FACTS.md` § *Lines stating an election type under `packages/dev-seed/src`* describes the tree before this plan, as a baseline does.
- `packages/dev-seed/src/generators/NominationsGenerator.ts`'s header was read and not changed: it does not name an election type.

Untouched and still true: `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` states `election_type: 'candidate_only'` in an adapter fixture, which is not a seed template.

## Not done, or not verified

- **The code review checklist was not walked**: the plan adds no application code and has no checklist step.
- **The integration row, `check-frontend`, `docs-links` and `name-gate-self-test` did not run**: the plan names five rows for the database and five for the close.
- **Nothing was asked of the rule itself**: no trigger exists yet, so that the six rows are admitted under the new type is the census's statement and the matrix's, not the database's. *Inferred, not observed:* that plan 177-03's SQL matrix will agree with the census's on every cell.
- **The README's example was not run** through the pipeline or imported; the census covers the registry only.
- **`pmset -g log` was not read by hand**: no run was red; the drivers' own readings say 0 Sleep entries in each window.

## The state the local stack is left in

Read with `psql` after `yarn db:seed:default`:

- **The enum:** `{organization_only, candidate_only, organization_list, organization_list_and_independents}`; the column's default `'organization_list_and_independents'::nomination_shape`.
- **Data:** 3 projects; 1 election, in the default project, of the new type; 328 candidates; 377 nominations (327 candidates with a parent, 40 organizations, 10 alliances); 2 auth users. 13 rows in `private.invitation_link_witness`, left by the full run — the known cause of `39-invitations.test.sql` test 238 being red on a database a full run has touched, until the next reset.
- **pgTAP's helper functions** are in `public` since the last gate run's pgTAP row, until the next reset.
- **The stack:** up; neither it nor Docker was restarted. Three resets were made, each by the gate driver after its in-flight check. Only the E2E driver's own `docker builder prune -af` pruned anything. Nothing listens on port 5273. AC power, 100 %. Docker VM free space after everything: 18.15 GiB.
- **The working tree:** clean outside `.planning/` but for the operator's untracked `CAND-APP-PLAN.md`. Phase 178's planning files, untracked, were not touched or staged.

## Known Stubs

None.

## Evidence (gitignored)

- `tests/e2e-runs/177-gates/`: `177-02-pgtap-red`, `177-02-db`, `177-02-db-r2`, `177-02-close`.
- `tests/e2e-runs/177-e2e/177-02-close`.
- `tests/e2e-runs/177-unit/177-02-*`: `pgtap-red.{log,exit,head}`; `census-red.{log,exit,head}`, `census-red-draft.{log,exit,head}`, `census-green.{log,exit}`; `t1`/`t2`/`t3-verify.{sh,log,exit,head}`; `extract-verify.mjs`; the drivers' launch logs and statuses (`pgtap-red-driver`, `db-driver`, `db-r2-driver`, `close-gates-driver`, `close-e2e-driver`); `seed-default.{log,exit}`.

## Self-Check: PASSED

The census file exists and is tracked; the five commits are ancestors of HEAD; the three verifies exit 0, Tasks 2 and 3 at the final head.
