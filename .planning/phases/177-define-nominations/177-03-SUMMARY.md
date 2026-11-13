---
phase: 177-define-nominations
plan: 03
subsystem: database-schema
tags: [nomination-shape, election-type, validate-nomination, constraint-trigger, deferred, pgtap]
status: complete
requires:
  - "177-02: the fourth election type as the default, every built-in template on it, the full run 177-02-close"
  - "177-01: 177-gates.sh, 177-e2e.sh, 177-verdict.mjs, 177-A2-FINDING.md"
provides:
  - "public.nomination_shape_rule (public.nomination_shape, public.entity_type) RETURNS text — the matrix, IMMUTABLE, reads no table"
  - "the row rule in public.validate_nomination: SQLSTATE 23514, message start 'Nomination shape refused: '"
  - "public.validate_nomination_parent_required () and the constraint trigger nominations_parent_required (AFTER INSERT OR UPDATE, DEFERRABLE INITIALLY DEFERRED): SQLSTATE 23514, message start 'Nomination parent required: '"
  - "section 12 of 08-triggers.test.sql: the sixteen cells, the roles, the deferred rule forced and restored"
  - "the full run tests/e2e-runs/177-e2e/177-03-close, the predecessor of 177-07-close"
affects: [177-05, 177-06, 177-07, 177-08, 177-10, 177-21]
tech-stack:
  added: []
  patterns:
    - "the project's first constraint trigger: a deferred rule whose function re-reads the row by id"
    - "a pgTAP string that lives forces the deferred rule by name and puts it back in the same string; a refusal is restored by the rolled-back subtransaction of throws_ok"
    - "a probe asked after every forced assertion says whether the constraint is deferred again, with a control that shows it can answer no"
key-files:
  created: []
  modified:
    - apps/supabase/supabase/schema/011-validation-functions.sql
    - apps/supabase/supabase/schema/104-nominations.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/08-triggers.test.sql
    - packages/supabase-types/src/database.ts
decisions:
  - "The refusal's message takes the article its entity type needs ('an organization', 'an alliance'); the pinned start is unchanged"
  - "The deferred function declares scalar variables, not a row of the table's type: its file is applied before the table exists"
  - "pgTAP forces the rule by name where the statements live, and with SET CONSTRAINTS ALL IMMEDIATE where they are refused"
requirements-completed: [NOM-04]
metrics:
  started: "2026-10-11T00:34:56Z (the first recorded time, at the red commit; the reading before it was not timed)"
  completed: 2026-10-11T00:55:00Z
  duration: "20 minutes from the first recorded time"
  tasks: 3
  files: 5
actuals:
  tokens: 14200
  tasks: 3
  commits: 4 # git rev-list --count 89a8a9899..32b6d5daa; ..HEAD says 6, two being another agent's planning commits 57d2d3cf6 and ab845726d
plan_head_before: 89a8a989967fc7aa9a22624c727efd34e0f648dc
plan_head_after: 32b6d5daa565da5be4c7a49ec71e0c9dac406831
---

# Phase 177 Plan 03: The Election-Type Rule in the Database — Summary

`public.nomination_shape_rule` states the election type by entity type matrix once in SQL; `validate_nomination` refuses, for every writer and at the statement, a nomination whose entity type the election's type does not admit; the project's first constraint trigger refuses, at the end of the transaction, a candidate's nomination in an `organization_list` election that has neither a parent nor a typed party name; 79 pgTAP assertions hold all of it; and the full E2E suite is green under the rule with the projects and counts of `177-02-close`.

`requirements-completed` names NOM-04 because the plan's frontmatter does. `REQUIREMENTS.md`, `STATE.md` and `ROADMAP.md` were not touched.

## Read this first

- **The rule refused no seeded row.** Every `data-setup-*` project of the full run passed, `yarn db:seed:default` imported 752 rows under it, and the logs of the run hold no line beginning `Nomination shape refused: ` or `Nomination parent required: `. Plan 177-02's census stands.
- **No pgTAP file other than `08-triggers` turned red.** `Files=42, Tests=2037`, `Result: PASS` on a freshly reset database. No fixture was re-typed and none was given a parent.
- **The first schema commit, `a5f4229d9`, holds a migration that does not apply to a fresh database.** The gate's reset row found it; `d3981551e` fixes it. See *Deviations*, 1. A checkout of `a5f4229d9` alone cannot be reset.
- **Assumption A5 held.** pgTAP's `throws_ok` and `lives_ok` both take a string of several statements. The file uses that form everywhere; no assertion of the rule goes through a `pg_temp` function.
- **For plan 177-07, the statement pair as pgTAP ran it on the real table:** `SET CONSTRAINTS public.nominations_parent_required IMMEDIATE; SET CONSTRAINTS public.nominations_parent_required DEFERRED`. See *For later plans*.

## Task Commits

| Task | Commit | Subject | Files |
|---|---|---|---|
| 1 | `96072136d` | test(177-03): the election-type grid and the end-of-transaction parent rule [db] | `08-triggers.test.sql` |
| 2 | `a5f4229d9` | feat(177-03): the election-type rule binds every nomination write, with the parent requirement checked at the end of the transaction [db] | `011-validation-functions.sql`, `104-nominations.sql`, `00001_initial_schema.sql` |
| 2 | `d3981551e` | fix(177-03): the parent rule's function declares no variable of the nominations row type [db] | `011-validation-functions.sql`, `00001_initial_schema.sql` |
| 2 | `32b6d5daa` | chore(177-03): the generated database types for the nomination-shape matrix function [db] | `packages/supabase-types/src/database.ts` |

Head before the plan: `89a8a9899`. Four commits, measured with `git rev-list --count 89a8a9899..32b6d5daa`. Five files, 1,438 insertions, 6 deletions. Task 3 makes runs and this file only.

**Two commits sit on top and are not this plan's:** `57d2d3cf6` ("docs(178): the phase's plans …") and `ab845726d` ("docs(decisions): section H …"), made by the agent planning Phase 178 while this plan's full run was being judged. They change files under `.planning/` only, none of them in this phase's directory; `git diff --quiet 32b6d5daa ab845726d -- . ':(exclude).planning'` exits 0, so every gate row and the full run are of the tree HEAD holds. `git rev-list --count 89a8a9899..HEAD` therefore says 6 before this summary's own commit.

## Each task's verify command, with its real exit status

Each `<automated>` block was written byte for byte to `tests/e2e-runs/177-unit/177-03-t<N>-verify.sh` by `177-03-extract-verify.mjs`, which reads the plan, and run with `bash`. Log, status and head are beside each.

| Verify | Head | Exit |
|---|---|---|
| Task 1 | `a5f4229d9` | 0 |
| Task 2 | `32b6d5daa` | 0 |
| Task 3 | `32b6d5daa` | 0 |

All three were run again after another agent's planning commits moved HEAD (see *Task Commits*): 0, 0 and 0, the last two at `ab845726d`.

`177-verdict.mjs scope` at the final head: 0, PASS. `177-verdict.mjs hygiene`: 0, 0 hits, 0 advisory lines. `yarn assert:comment-hygiene` on the working tree before each of the three commits that touch a comment: 0 at the commit (it was 1 once before the schema commit; see *Deviations*, 7).

## Task 1 — the grid and the deferred rule's assertions, red

### What section 12 of `08-triggers.test.sql` holds

The file's plan went from **34 to 113**: 79 assertions added, counted by pgTAP itself (a run with a wrong plan says so).

| Part | Assertions | What |
|---|---|---|
| 12a | 23 | `nomination_shape_rule` for each of the sixteen cells and for a NULL election type and a NULL entity type (18); the three functions exist and none names the caller; the matrix function is IMMUTABLE, not a definer and pins its `search_path`; the trigger is AFTER INSERT OR UPDATE, for each row, deferrable and initially deferred; no trigger on `public.elections` asks a nomination rule; the fixture's election takes the default type |
| 12b | 17 | one write per cell as the owner of the tables — eleven that live, five refused with `23514` and the whole message — and an UPDATE that moves a stored candidate row into an `organization_only` election, refused |
| 12c | 18 | the five refused cells, an admitted one and a refused UPDATE as a project administrator; a refused cell, an admitted one, a refused UPDATE and the deferred refusal (code, then message) as a candidate's own editor; a refused and an admitted cell as an organization's own editor; two refused cells, an admitted one and the deferred refusal as the service role |
| 12d | 18 | the deferred rule (below) |
| 12e | 3 | an election holding candidate nominations can be changed to `organization_only`; the stored nomination is still there; a later write of that row is refused |

Fixture: three elections of project A, each stating a type (`organization_list`, `candidate_only`, `organization_only`), each linked to the fixture's constituency group, with ids of the file's own range (`eeeeeeee-…-0000000004xx`). The fixture's own election states none. No row of `create_test_data ()` was changed.

**The matrix has five refused cells, ten admitted and one `parent_required`.** A faction's row in the `organization_only` election names the nomination of its own organization at the same contest; in the `candidate_only` election no organization nomination can exist, and the faction's row is refused with the election type's message before the hierarchy is asked — the assertion pins the message, so a hierarchy refusal (`P0001`) cannot pass it.

**Every refusal of the row rule is asserted with its SQLSTATE and its whole message**, in every role: `23514` is also the code of the two tenancy refusals in the same function, so the code alone would not say which rule spoke.

### The deferred rule, and which form the assertions use

A5 held, so every assertion is a string of statements handed to `throws_ok` or `lives_ok`:

| Plan step | Assertion | Forcing |
|---|---|---|
| (a) | a lone candidate row with no parent in the `organization_list` election raises `23514`, the message naming the row and the election | `…; SET CONSTRAINTS ALL IMMEDIATE` |
| (a), by name | the same lone row raises when the constraint is forced by name | the named pair |
| (b) | own row, then the parent organization's row, then the repoint: lives | the named pair |
| (c) | a lone row whose custom data holds `requestedParentOrganization`: lives | the named pair |
| (d) | a lone row in the default-type election: lives | the named pair |
| (e) | an UPDATE that clears the parent of a stored candidate row raises `23514` | `…; SET CONSTRAINTS ALL IMMEDIATE` |
| (f) | a lone row inserted and deleted before the forcing: lives | the named pair |
| (g) | after all of them, a lone insert alone lives at its own statement | none |
| control of (g) | `SET CONSTRAINTS ALL IMMEDIATE; INSERT …` raises `23514` at the insert | — |

"The named pair" is `; SET CONSTRAINTS public.nominations_parent_required IMMEDIATE; SET CONSTRAINTS public.nominations_parent_required DEFERRED`, appended by the helper `pg_temp.forced`. A string that lives must put the mode back itself, because `lives_ok` releases its subtransaction and the mode would stay immediate; a string that raises is restored by the rollback of `throws_ok`'s subtransaction.

After each of the seven forced assertions, and once more at the end, `pg_temp.parent_rule_is_deferred ()` is asserted true: it inserts a lone party-less row and deletes it in one block and answers false when the insert raises. Its control, `pg_temp.parent_rule_probe_while_immediate ()`, is the one function of the file that holds `SET CONSTRAINTS`: it sets the constraint immediate, asks the probe, puts the constraint back and is asserted to answer false. No statement of the file leaves the mode immediate outside an asserted string or that function.

### The red run

Commit `96072136d`, through the gate driver (`177-gates.sh 177-03-pgtap-red --rows db-reset,pgtap`), kept as `tests/e2e-runs/177-unit/177-03-pgtap-red.{log,exit,head}`: status 1, `Files=42, Tests=2037`, `Result: FAIL`. One file failed, `08-triggers.test.sql` (`Wstat: 0 Tests: 113 Failed: 51`): 51 assertions, none an abort. By reason: 18 `have: (no such function)`; 24 refusals that caught something other than `23514` — 9 no exception, 13 a `23505` (a write that should have been refused had been stored by the assertion before it) and 2 the hierarchy's `P0001`; 1 message that did not match; 4 `died: 42704: constraint "nominations_parent_required" does not exist`; 4 others (three catalogue assertions and the probe's control). The 62 that passed are the 34 of the file as it was and the 28 that a database without the rule also satisfies.

The matrix function is called through `pg_temp.answer ($$SELECT public.nomination_shape_rule(…)$$)`, which answers a sentinel for a function the database does not have. A direct call would have aborted the file at its first cell, and the red run would have been a parse failure, not 51 expectations.

## Task 2 — the matrix function, the row rule, the deferred function and the trigger

### What the schema holds

- **`public.nomination_shape_rule`** (`011-validation-functions.sql`, above `validate_nomination`): `LANGUAGE sql IMMUTABLE`, `search_path = ''`, one `SELECT CASE` with one line per cell and no `ELSE`, so a NULL argument and an unnamed pair answer NULL.
- **`public.validate_nomination`**: directly after the tenancy block and before the early return, it reads the election's type, asks the matrix with the entity type derived from the four foreign keys, and raises `Nomination shape refused: <a|an> <entity type> cannot be nominated in an election of type <type> (election <id>)` with `check_violation` unless the answer is `admitted` or `parent_required`. The header says it binds every writer and that nothing re-checks a stored nomination when an election's type changes.
- **`public.validate_nomination_parent_required`**: `SECURITY DEFINER`, `search_path = ''`. It reads four columns of the row again by `NEW.id`, returns when the row is gone, is not a candidate's, has a parent or carries the key, and raises `Nomination parent required: candidate nomination <id> in election <id> has neither a parent nomination nor a requested parent organization` with `check_violation` when the matrix answers `parent_required` for a candidate.
- **`nominations_parent_required`** (`104-nominations.sql`): `CREATE CONSTRAINT TRIGGER … AFTER INSERT OR UPDATE ON public.nominations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW WHEN (NEW.candidate_id IS NOT NULL AND NEW.parent_nomination_id IS NULL)`.
- No trigger on `public.elections`. Neither function reads a role, a claim or a grant; a pgTAP assertion reads the three function bodies for it.

`yarn schema:regenerate`: 0. The regenerated diff was read and compared by command with the schema diff: the changed lines of the migration are the changed lines of the two schema files and nothing else. `yarn assert:schema-migration-parity`: 0.

### The database rows

| Run | Head | db-reset | types-regen | types-clean | pgtap | sql-lint | Driver |
|---|---|---|---|---|---|---|---|
| `177-gates/177-03-db` | `a5f4229d9` | **1** | 0 | 1 | 1 | 1 | 1 |
| `177-gates/177-03-db-r2` | `d3981551e` | 0 | 0 | **1** | 0 | 0 | 1 |
| `177-gates/177-03-db-r3` | `32b6d5daa` | 0 | 0 | 0 | 0 | 0 | 0 |

- `177-03-db`: the reset stopped at `ERROR: relation "public.nominations" does not exist (SQLSTATE 42P01)`, at the statement that creates `validate_nomination_parent_required`. The three rows after it ran on a database with an empty `public` schema and say nothing. *Deviations*, 1.
- `177-03-db-r2`: `types-clean` red for `packages/supabase-types/src/database.ts` alone, as the plan expects: `Functions` gained `nomination_shape_rule` (7 lines). The driver's kept `db-types-drift.diff` was applied with `git apply` and committed; the file was not edited by hand.
- `177-03-db-r3`: `node 177-verdict.mjs gates 177-03-db --rows db-reset,types-regen,types-clean,pgtap,sql-lint` read it as the newest attempt: PASS, not stale, no Sleep entry in the window.

pgTAP in `r2` and `r3`: `Files=42, Tests=2037`, `Result: PASS` — 1958 and the 79 added. SQL lint: 0 errors, 3 warnings, the 9001 census line unchanged (107 policies, 21 tables, 23 members, 31 row-level-security tables). The linter reads neither a trigger function nor a `LANGUAGE sql` function (177-A2-FINDING), so its 0 says nothing about the three functions this plan wrote or changed; pgTAP is what holds them.

### pgTAP files other than `08-triggers` that the rule turned red

None. No named decision was needed.

## Task 3 — the gate rows and the full run

### Gate rows

`177-gates/177-03-close`, head `32b6d5daa`:

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 21 |
| lint | 0 | 49 |
| unit | 0 | 68 |
| build | 0 | 17 |
| format | 0 | 19 |

`177-verdict.mjs gates 177-03-close --rows typecheck,lint,unit,build,format`: PASS, not stale, no Sleep entry in the window. Unit, from the row's log: frontend `Test Files 194 passed | 1 skipped (195)`, `Tests 3575 passed | 20 skipped (3595)`; dev-seed 69 files and 1046 tests — the numbers of `177-02-close`.

### The full run

`tests/e2e-runs/177-e2e/177-03-close`, head `32b6d5daa`, started `2026-10-11T00:43:44Z`, ended `00:52:33Z`.

- Before it: AC power, 100 %; the Docker VM's free space 18.14 GiB (19,024,260 KiB) by my own reading, and 18.14 GiB by the driver's after its prune; nothing listening on port 5273; no gate row running; no run in flight.
- The driver's and the wrapper's status: 0. Not void: no `VOID-host-suspend.txt`, `void: null`, 0 Sleep entries in the window, AC power at both ends.
- **Counts: total 341, passed 341, failed 0, flaky 0, skipped 0, did not run 0; 113 projects.**
- `177-verdict.mjs e2e 177-03-close --same-projects-as 177-02-close`: **PASS** — 113 projects compared, 0 not as expected: every project of `177-02-close` is in the run with its count, and no other project.

What the run showed about a dataset or a spec: nothing moved. `stdout.log`, `devserver.log` and `wrapper.log` hold no line with either refusal's message start. No axe finding and no overflow was reported by any test.

## Observed beyond the plan's assertions

- **The rule at a real COMMIT, on the real table** (`177-03-commit-probe.{sql,log}`, after the full run and the re-seed): in one transaction, an `organization_list` election inserted into the default project and a lone candidate nomination inserted into it — both `INSERT 0 1` — then `COMMIT` fails with `ERROR: 23514: Nomination parent required: candidate nomination … in election …`, raised by `validate_nomination_parent_required() line 27 at RAISE`. Afterwards the election is not there and the nomination count is the 377 it was. pgTAP cannot see a commit; this is the one observation of it.
- **Four planted defects, each seen caught** (scratch runs, not evidence of the suite; see *Deviations*, 2): a deferred function that judges the queued row (7 assertions red and the file stops); the row rule made conditional on the role (19 red); one cell flipped (2 red); the trigger made initially immediate (5 red and more).
- **The census's matrix and the SQL matrix agree on all sixteen cells**, read side by side (`packages/dev-seed/tests/nominationShapeCensus.builtins.test.ts`, `EXPECTED`). Each is pinned by its own test; nothing compares them mechanically.

## For later plans

- **The forcing pair (177-07).** As pgTAP ran it, as the owner, on the real table and trigger: the write statements, then `SET CONSTRAINTS public.nominations_parent_required IMMEDIATE; SET CONSTRAINTS public.nominations_parent_required DEFERRED`. A lone party-less row raises `23514` at the first of the two; the three-statement order, the key, the default type and a deleted row pass both; and after each the probe says the mode is deferred. `SET CONSTRAINTS ALL IMMEDIATE` was run as `authenticated` (a candidate's editor) and as `service_role` and refuses the same way. The database has no other deferrable constraint (`pg_constraint.condeferrable` is true for none), so `ALL` and the name reach the same one today.
- **A forcing statement fires every pending event of the transaction.** In a pgTAP file that is the whole file so far: a party-less candidate row left in an `organization_list` election by an earlier statement raises inside a later, unrelated assertion that forces the rule. Fixture elections take the default type, so files `43` and `44` meet this only where they make such an election.
- **`lives_ok` does not roll back; `throws_ok` rolls back only when something is thrown.** A statement that should have been refused and was not is stored for the rest of the file (the `23505`s of the red run).
- **`23514` is three things in `validate_nomination` and its companion**: the tenancy refusals, `Nomination shape refused: ` and `Nomination parent required: `. A client or a test tells them apart by the message start.
- **Trigger order on `public.nominations`.** BEFORE triggers run by name: `enforce_nomination_columns…`, `enforce_nomination_confirmation…`, `set_updated_at`, `validate_nomination…`. So an entity user who sets a presentation column gets that trigger's `42501` before the election type is asked, and every BEFORE trigger runs before the row-level-security check. That is why an editor's forbidden cell is `23514` and never a policy's `42501`.
- **A function in a file applied before its table cannot declare `%ROWTYPE` or `%TYPE` of that table.** `177-RESEARCH.md`'s sketch of the deferred function does, and it does not create. A function body may name the table; a declaration may not. `503-entity-rpcs.sql` is after the tables, so `set_entity_nominations` is not bound by this.
- **pgTAP now:** `Files=42, Tests=2037`; `08-triggers` plans 113; the next free file number is still 43.
- **The generated types** hold `Database['public']['Functions']['nomination_shape_rule']` (`Args: { p_entity_type, p_shape }`, `Returns: string`).
- **A dry run of a pgTAP file against uncommitted DDL** is possible in one rolled-back `psql` transaction (`CREATE EXTENSION pgtap`, the DDL, the file without its `BEGIN` and `ROLLBACK`). It does not show whether the migration applies in file order — that is what it missed here. Applying the whole generated migration inside `BEGIN … ROLLBACK` on a database whose `public` schema is empty does show it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The first schema commit's migration does not apply to a fresh database.**
- **Found during:** Task 2, by the `db-reset` row of `177-gates/177-03-db` (status 1).
- **Issue:** `validate_nomination_parent_required` declared `v_row public.nominations%ROWTYPE`, as the research's sketch does. `011-validation-functions.sql` is applied before `104-nominations.sql`, and a declaration is resolved when the function is created: `relation "public.nominations" does not exist (SQLSTATE 42P01)`.
- **Why the dry run did not see it:** it created the functions on a database that already held the table.
- **Fix:** the re-read selects `candidate_id`, `parent_nomination_id`, `custom_data` and `election_id` into scalar variables; a comment in the body says why. Commit `d3981551e`.
- **Confirmed in isolation, not inferred:** the whole generated migration applied inside `BEGIN … ROLLBACK` to the database the failed reset left (0 tables in `public`) exits 0 for the fixed file and 3, with the same error, for the migration of `a5f4229d9`. Then the driver's reset: 0 in `r2` and `r3`.
- **What it left:** between the failed reset and `r2`'s reset, about three minutes, the local database had an empty `public` schema. The stack was up throughout and nothing was restarted by hand. `a5f4229d9` stays in history as a commit that cannot be reset; the checklist's "no fixes of itself" item says the two are squashed when the branch is shipped.

### Other deviations

**2. Scratch runs through `psql`, outside the gate driver.** Before the red commit the test file was run against the uncommitted DDL in a rolled-back transaction, with and without the rule and with four planted defects, to learn whether A5 held and what the file's plan is before anything was committed. The dispatch says pgTAP runs only through the gate driver; these runs are not evidence and no number in this summary comes from them except the four mutation counts above. Nothing was stored: after them the database held no `pgtap` extension, neither new function, no such trigger and the 377 nominations it had. The schema edits were kept as `177-03-schema.patch`, the two schema files put back with `git checkout --` on those two paths, and the patch applied again with `git apply` after the red run.

**3. The red pgTAP run was made through the gate driver, under a label of its own** (`177-03-pgtap-red`), as plan 177-02 did, and its pgTAP row copied to `$U/177-03-pgtap-red.{log,exit}`.

**4. Three attempts of the database rows, not two.** `177-03-db` (the reset red), `-r2` (the types red, as expected), `-r3` (green). The plan names `-r2` as the closing one.

**5. More assertions than the plan's steps list.** The service role's cases (the plan's must-have names the role; its step 3 does not); the lone row refused by the named pair as well; the probe after each forced assertion and its control; the five catalogue assertions; the three on an election whose type changes. Nothing the steps list was left out.

**6. The refusal's message takes an article.** The plan's text is `a <entity type> cannot be nominated…`; the function writes `an organization` and `an alliance`, `a candidate` and `a faction`, and `a row that names no entity` for a row with no entity key. The pinned start, `Nomination shape refused: `, is as planned. The other option is one `CASE` back to a bare `a`.

**7. The matrix function's header holds no table.** A first draft drew the sixteen cells as a comment table; `yarn assert:comment-hygiene` refused its rows (the forced-line-break rule), so the header says the `CASE` is the table and the `CASE` is laid out as one. The header also says "a function that writes nominations and needs the answer asks it too" where the plan says "the write function": that function does not exist until plan 177-07, and a comment describes the code as it is.

**8. The refused cells are asserted with the whole message, not the start alone**, for the reason given under Task 1.

**9. The regenerated types were committed from the driver's kept diff**, as plan 177-02 did.

**10. `yarn db:seed:default` was run after the full run** (exit 0, 752 rows), as plan 177-02 did, so the default project holds its dataset again; it is also an import of 377 nominations under the rule in a committed transaction.

**11. `git stash list` was run once**, by mistake, in a compound command. It reads and changes nothing; no stash was made, applied or dropped.

**12. HEAD is on `feat/entity-signup-multi-grant`**, the branch the orchestrator named, not on a per-agent branch. Nothing was appended to `.planning/WINDOWS.md`.

## Code review checklist

Walked for the Supabase backend section and the general items that apply to SQL.

| Item | Outcome |
|---|---|
| Solves the issue | yes: NOM-04's last sentence, for every writer |
| OWASP | the rule reads no role and no claim; both definer trigger functions pin `search_path = ''` and qualify every name; messages disclose an election id and a nomination id the writer supplied or just wrote |
| No repeated code | the matrix is one function; the entity-type `CASE` of `validate_nomination` is reused, not copied |
| Documented | each function has a header; the trigger a comment line |
| Repo documentation | **not updated**: see *Sentences the work made false* |
| Errors handled | named refusals with a SQLSTATE and a stable start |
| Parts sharing dependencies | the full pgTAP suite and the full E2E run |
| Comment hygiene | the guard is 0; every comment added was read for history and ids |
| No fixes of itself | **not met**: `d3981551e` fixes `a5f4229d9` (*Deviations*, 1) |
| `[db]` tag | on all four commits |
| New definer functions pin `search_path` and qualify calls | yes |
| Trigger naming | the function is `validate_…`; the trigger's name is the one the execution rules fix |
| pgTAP boundary and patterns | the file's own `BEGIN`/`ROLLBACK`; `throws_ok` for refusals, `lives_ok` for admitted writes |
| New tables, policies, indexes | none |

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: new RPC endpoint | `apps/supabase/supabase/schema/011-validation-functions.sql` | `public.nomination_shape_rule` is in an exposed schema with the default EXECUTE, so `anon` and `authenticated` can call it over PostgREST. It reads no table and answers only the matrix, as `public.grant_role_permissions` does. Not a definer function, so the census of `07-rpc-security.test.sql` does not count it, and that file is green. |

## Sentences the work made false, reported and not edited

- `.claude/skills/database/SKILL.md`: the pgTAP counts (a run now reports `Files=42, Tests=2037`; the planned sum is 2028); Schema Conventions § 7, which says `validate_nomination()` "enforces parent-child type rules and election/constituency consistency"; § 8's trigger list, which has no constraint trigger and no `nominations_parent_required`. With the two sentences plan 177-02 reported, these are plan 177-21's.
- `.claude/skills/database/schema-reference.md`: not read; by its description it lists functions and triggers and holds neither new function nor the trigger.
- `177-RESEARCH.md` § *Code Examples*: the sketch's `v_row public.nominations%ROWTYPE` cannot be created in file 011.
- `177-02-SUMMARY.md`: "pgTAP now `Files=42, Tests=1958`" describes the tree before this plan.
- The header of `private.caller_nominated_in_contest` ("which `validate_nomination` admits") is plan 177-05's, as ruling 4 of the plan says; not touched.

## Not done, or not verified

- **A direct PostgREST insert of a lone party-less row** was not made. That such a failure at the request's COMMIT comes back as an ordinary error body is still assumed; the COMMIT itself was observed through `psql`.
- **Roles not impersonated:** a faction's or an alliance's own editor (the fixture has none), a project editor, an account administrator and the root administrator. The functions read no role, and an assertion reads their bodies for that. *Inferred from it, not observed:* that those roles are refused alike.
- **An UPDATE as the service role** is not asserted; INSERT is. UPDATE is asserted as the owner, as a project administrator and as a candidate's editor.
- **The integration row, `check-frontend`, `docs-links` and `name-gate-self-test` did not run**: the plan names five rows for the database and five for the close.
- **`pmset -g log` was not read by hand**: no E2E run was red, and the one red gate row that was not expected had its cause in its own log. The drivers' readings say 0 Sleep entries in each window.
- **The start of the plan was not timed**; the first recorded time is at the red commit.

## The state the local stack is left in

Read with `psql` after the full run, `yarn db:seed:default` and the commit probe:

- **The rule:** `nominations_parent_required` is on `public.nominations`, deferrable and initially deferred; both functions exist. A query over every stored nomination finds 0 that the matrix refuses or that needs a parent and has neither a parent nor the key.
- **Data:** 3 projects; 1 election, in the default project, of type `organization_list_and_independents`; 328 candidates; 377 nominations; 2 auth users. 13 rows in `private.invitation_link_witness`, left by the full run — the known cause of `39-invitations.test.sql` test 238 being red on a database a full run has touched, until the next reset.
- **pgTAP's helper functions** are in `public` since the last gate run's pgTAP row, until the next reset. The `pgtap` extension is not installed.
- **The stack:** up; neither it nor Docker was restarted by hand. Four resets were made, each by the gate driver after its in-flight check; one of them failed and left `public` empty until the next (*Deviations*, 1). Only the E2E driver's own `docker builder prune -af` pruned anything. Nothing listens on port 5273. AC power, 100 %. Docker VM free space after everything: 18.07 GiB.
- **The working tree:** clean outside `.planning/` but for the operator's untracked `CAND-APP-PLAN.md`. Phase 178's planning files, untracked, were not touched or staged.

## Known Stubs

None.

## Evidence (gitignored)

- `tests/e2e-runs/177-gates/`: `177-03-pgtap-red`, `177-03-db`, `177-03-db-r2`, `177-03-db-r3`, `177-03-close`.
- `tests/e2e-runs/177-e2e/177-03-close`.
- `tests/e2e-runs/177-unit/177-03-*`: `pgtap-red.{log,exit,head}`; `t1`/`t2`/`t3-verify.{sh,log,exit,head}`; `extract-verify.mjs`; the drivers' launch logs and statuses (`pgtap-red-driver`, `db-driver`, `db-r2-driver`, `db-r3-driver`, `close-gates-driver`, `close-e2e-driver`); the verdict logs (`db-verdict`, `close-gates-verdict`, `close-e2e-verdict`, `scope`, `hygiene-verdict`); `schema.patch`, `migration.diff`, `schema-final.diff`; `seed-default.{log,exit}`; `commit-probe.{sql,log}`. The scratch dry runs are in the session's scratch directory and are not kept.

## Self-Check: PASSED

The five changed files exist and are tracked; the four commits are ancestors of HEAD; the three verifies exit 0 on a HEAD that is tree-equal to the plan's last commit outside `.planning/`.
