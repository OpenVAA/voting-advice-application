---
phase: 177-define-nominations
plan: 07
subsystem: database-schema
tags: [nominations, write-function, security-invoker, row-level-security, deferred-constraint, pgtap, e2e]
status: complete
requires:
  - "177-06: get_nomination_parent_options and parent.entity_id, pgTAP at Files=43 Tests=2182"
  - "177-05: private.nomination_id_in_contest, the parent policy paired by type, the cap's message"
  - "177-04: the symbol on the entity's own row, entity_delete_nominations"
  - "177-03: nomination_shape_rule, nominations_parent_required"
  - "177-01: 177-gates.sh, 177-e2e.sh, 177-verdict.mjs, the A2 finding"
provides:
  - "public.set_entity_nominations (p_entity_type public.entity_type, p_entity_id uuid, p_nominations jsonb) RETURNS jsonb: VOLATILE, SECURITY INVOKER, search_path = '', EXECUTE for authenticated (and service_role) and not for anon"
  - "the argument: a JSON array of {id?, election_id, constituency_id, election_symbol, parent}, parent = {kind: none | entity + entity_type, entity_id | other + name | keep}"
  - "the answer: {inserted, updated, deleted, unchanged, parents_created}, each an integer"
  - "refusals of its own: 22023 with a message that begins 'set_entity_nominations: ' and names p_nominations[<index>]; 42501 for a caller without nomination.edit on the entity; 42501 for a statement that affected fewer rows than it was meant to"
  - "pgTAP: 43-set-entity-nominations.test.sql (plan 128), sections CAT to ANON; the suite at Files=44, Tests=2310"
  - "generated types: Database['public']['Functions']['set_entity_nominations']"
  - "the full E2E run of the whole schema block: tests/e2e-runs/177-e2e/177-07-close, 341 of 341, 113 projects"
affects: [177-09, 177-17, 177-18, 177-21, 177.1]
tech-stack:
  added: []
  patterns:
    - "an INVOKER write function that validates its whole JSON argument into a plan before the first write, reads the rows it may write once with no locking clause, and raises on every UPDATE and DELETE that affected fewer rows than it named"
    - "a deferred constraint trigger forced and set back inside the function, so its refusal is raised in the call"
    - "one UPDATE per row, in seven static forms, each naming only the columns whose values differ"
    - "a pgTAP file whose every call is made from a string, so a database without the function fails each assertion and aborts nothing"
key-files:
  created:
    - apps/supabase/supabase/tests/database/43-set-entity-nominations.test.sql
  modified:
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/database.ts
decisions:
  - "the forcing is written inside the function (A2: held); 301-auth-functions.sql was not touched"
  - "a NULL argument and an unserved entity type are refused before the authority question; the array and its objects after it"
  - "an id that is a JSON null is refused; an absent election_symbol is no symbol"
  - "an object without an id must be the only object of its election, which also refuses one beside a move"
  - "the election of every object is read as the caller for its current round, and an election the caller cannot read is refused with 22023 by index"
  - "for entity, 'the parent differs' is asked of the id private.nomination_id_in_contest answers, as the plan lays out"
  - "the new row of a move carries the symbol and the parent the object states and nothing else of the old row"
  - "white space is the Unicode white-space characters and U+FEFF, stated as a character class, so the trim does not depend on the database's locale"
requirements-completed: [NOM-04, NOM-05, NOM-06, NOM-08]
metrics:
  started: "2026-10-11T02:00:25Z"
  completed: "2026-10-11T02:39:49Z"
  duration: "39 minutes"
  tasks: 3
  files: 4
actuals:
  tokens: 36794 # chars/4 over git diff 134975d8a..3e002a74f -- apps packages (147,177 characters, the generated migration included)
  tasks: 3
  commits: 3 # git rev-list --count 134975d8a..3e002a74f
plan_head_before: 134975d8a45cdd0a2af7c1f6bf5c23ae4bec7117
plan_head_after: 3e002a74f08ea029960685e97864a5f53c153ba3
---

# Phase 177 Plan 07: The Write Function, `set_entity_nominations`, and the Run That Closes the Schema Block — Summary

`public.set_entity_nominations` takes the whole set of nominations a candidate or an organization is to hold and, in one statement of the caller's transaction and under the caller's own row-level security, deletes, updates, inserts and links until the rows it may write equal that set: a new row at its election's current round, a listed party's or alliance's nomination linked or created, a typed name merged into the custom data, an unchanged row left unwritten and confirmed, a locked or vanished row raised and never answered as saved, and the end-of-transaction parent rule raised inside the call. 128 pgTAP assertions hold it, committed red (112 failing, each an expectation) before the schema that turns them green. The full E2E run of the tree with plans 177-04 to 177-07 applied is 341 of 341 in 113 projects, equal to `177-03-close`.

`requirements-completed` names NOM-04, NOM-05, NOM-06 and NOM-08 because the plan's frontmatter does; this plan delivers the database's write function and nothing a user can reach yet. `REQUIREMENTS.md`, `STATE.md` and `ROADMAP.md` were not touched.

## Read this first

- **All three verify blocks exit 0 as written.** None searches SQL for a message with an apostrophe.
- **The forcing is inside the function**, on the line `A2: held` of `177-A2-FINDING.md`. `301-auth-functions.sql` was not touched and no helper was added.
- **The SQL lint said nothing about the function**: `No schema errors found`, `{"results":[],"message":"db lint"}`, the three foreign-key warnings it had and the same census line (108 policies). So the finding of plan 177-01 holds on the real function. A direct `plpgsql_check` with every class of warning on found one warning and five performance notes in the first draft (*Deviations*, 6); the committed body answers 0 rows.
- **Three commits, not the plan's two**: the generated types went red on `types-clean` in `177-07-db` and were committed alone from the driver's kept diff; the run judged is `177-07-db-r2`.
- **The ordinal is 43**, the plan is 128, and pgTAP is `Files=44, Tests=2310` (2301 planned in 43 files, and the 9 of `00-helpers`).
- **Five behaviours are choices the contract did not state.** They are pinned in pgTAP and listed under *Deviations*, 2, and for plan 177-09 under *For later plans*.
- **One observed behaviour bears on plan 177-17's prefill**: `entity` on a row whose stored parent is another nomination of that same party repoints the row and unconfirms it; `keep` does not. *For later plans*, and *Observed beyond the plan's assertions*.
- **The draft of the function existed before the red commit**, in a gitignored scratch file, so that the test file could be shown green before it was committed red. The committed order is the plan's: red test, then schema. *Deviations*, 4.

## Task Commits

| Task | Commit | Subject | Files |
|---|---|---|---|
| 1 | `a56d57b0c` | test(177-07): an entity's whole set of nominations written in one transaction under the caller's own rights [db] | `43-set-entity-nominations.test.sql` (new) |
| 2 | `489b14248` | feat(177-07): set_entity_nominations writes an entity's whole set of nominations in one transaction under the caller's own rights [db] | `503-entity-rpcs.sql`, `00001_initial_schema.sql` |
| 2 | `3e002a74f` | chore(177-07): the generated database types for set_entity_nominations [db] | `packages/supabase-types/src/database.ts` |

Head before the plan's first commit: `134975d8a`. Three commits, measured with `git rev-list --count 134975d8a..3e002a74f`. Four files, 4,547 insertions, no deletion. No commit of another agent landed in between.

## Each task's verify command, with its real exit status

Each `<automated>` block was written byte for byte to `tests/e2e-runs/177-unit/177-07-t<N>-verify.sh` by `177-07-extract-verify.mjs`, which reads the plan, and run with `bash`. Log, status and head are beside each.

| Verify | Head | Exit |
|---|---|---|
| Task 1 | `a56d57b0c` | 0 |
| Task 2 | `3e002a74f` | 0 |
| Task 3 | `3e002a74f` | 0 |

`177-verdict.mjs gates 177-07-db --rows db-reset,types-regen,types-clean,pgtap,sql-lint,typecheck` (it reads the newest attempt, `177-07-db-r2`): 0, PASS. `177-verdict.mjs gates 177-07-close --rows typecheck,lint,unit,build,format`: 0, PASS. `177-verdict.mjs e2e 177-07-close --same-projects-as 177-03-close`: 0, PASS. `177-verdict.mjs scope`: 0, PASS. `177-verdict.mjs hygiene`: 0, 0 hits. `yarn assert:comment-hygiene` before each of the first two commits: 0 and 0 (the first attempt at the test file was 1; *Deviations*, 7). `yarn assert:schema-migration-parity`: 0. `yarn assert:rpc-nullability`: 0 (it reads `RETURNS TABLE` functions; this one returns `jsonb`). `prettier --check` on the test file, the schema file and the migration: 0.

## Task 1 — the assertions, red

### What the file holds

`43-set-entity-nominations.test.sql`, 3,617 lines, `plan (128)`: one fixture assertion and 127 in nineteen tagged sections.

| Tag | Assertions | What it pins |
|---|---|---|
| `CAT` | 2 | not a definer function, `search_path=""`, volatile, `jsonb`, the three identity arguments, no default; `authenticated` may execute and `anon` may not |
| `ARG` | 33 | 31 refusals, each `22023` with its whole message; the well-formed object alone lives; no refused set changed a row |
| `WHO` | 3 | another candidate's editor and an id that names no candidate: `42501` and the function's message; nothing written |
| `NEW` | 5 | one insert; unconfirmed, the election's current round (2 where it is 2), the symbol trimmed, a blank symbol NULL, the caller as creator |
| `OTHER` | 7 | the name trimmed under the key, no parent, the fixture's own key kept; a later `entity` and a later `none` each remove the key and keep the other |
| `LINK` | 11 | a nominated party linked with no parent created; a party and an alliance with no nomination given one that is unconfirmed, at the current round, created by the caller and carrying nothing else |
| `REQ` | 6 | `none` in the `organization_list` election: `23514` and the parent rule's message start, nothing stored; `other` and `entity` live |
| `SKIP` | 5 | the stored values, the stored symbol untrimmed and `keep` each count the row unchanged; `confirmed` and `updated_at` of a confirmed row as before; a set twice |
| `EDIT` | 3 | a changed symbol is one update, the row unconfirmed, `updated_at` moved |
| `KEEP` | 4 | `keep` under a faction's nomination: not written; beside a changed symbol: the parent stays |
| `DEL` | 7 | a row left out deleted; `[]` deletes the rest; the row at another round and the row in the election whose type now refuses a candidate untouched, never counted, and refused when named |
| `MOVE` | 6 | one delete and one insert, the new row unconfirmed with the object's symbol; an organization's row with a candidate under it: `23503` and the constraint's whole message, both rows as before |
| `U02` | 5 | two objects with `id` live; a third without, two without, and one without beside one with are refused, the object without an `id` named |
| `LOCK` | 6 | a symbol-only set and a removal-only set raise the function's `42501`; a set with a new row raises the policy's; an unchanged set is answered; nothing changed; with the lock off the same set is one update |
| `ATOM` | 5 | a set refused at validation and a set refused when its last object is written (`23514`, `Nomination shape refused: `) each leave nothing; the set without its last object lives |
| `CAP` | 5 | the caller's tenth parent is created; the eleventh raises `P0001` with `A caller may originate at most `; the candidate's row inserted before it is not stored |
| `ENC` | 9 | a name of spaces, a tab, U+00A0 and U+3000 refused; 100 characters outside the basic plane live and 101 are refused; a symbol of 50 lives, counted after the trim, and 51 is refused; a difference in case and a difference in normalisation are each a change |
| `MODE` | 4 | a party-less candidate insert alone raises nothing after a call that raised and after one that lived; its control with the constraint immediate raises; the control left the mode deferred |
| `ANON` | 1 | `42501` and `permission denied for function set_entity_nominations` |

Fixture, local to the file, ids `43434343-4343-4343-4343-…`: four elections of project A (the default type; `organization_list`; one at `current_round` 2; one whose type is changed to `organization_only` after its nomination is stored), one constituency group of two constituencies, four organizations, two alliances, fourteen candidates — one per section — and sixteen nominations. Every fixture row is inserted before the first impersonation, so none names a creator. The header says that every impersonation passes an empty grant array; the user of the fixture's `candidate_a` edits twelve of the file's candidates and the user of `organization_a` both of its organizations, by rows the file writes.

A refusal the function words is asserted with `throws_ok` on its SQLSTATE and its **whole** message; a refusal a guard words is asserted on its SQLSTATE and, with `throws_like`, on its message start. A call that must live goes through `pg_temp.save`, an INVOKER instrument that answers the function's answer or an object naming what was raised; rows are then read as the owner.

### The red run

Commit `a56d57b0c`, through the gate driver (`177-gates.sh 177-07-pgtap-red --rows db-reset,pgtap`), kept as `tests/e2e-runs/177-unit/177-07-pgtap-red.{log,exit,head}`: db-reset 0, pgtap **1**; `Files=44, Tests=2310`, `Result: FAIL`. One file failed and did not abort: `43-set-entity-nominations.test.sql (Wstat: 0 Tests: 128 Failed: 112)`. By reason: 50 `caught: 42883` (a `throws_ok` or `throws_like` that met "function does not exist" where another refusal was wanted), 35 `have: {"raised": "42883", …}` (a call that should have lived), 14 `have: NULL` (a row that was not written), and 13 others: the two catalogue assertions, three `throws_like` that met the missing function's message where a guard's was wanted, and eight reads of rows the missing calls did not change. Every one is an expectation. No `died`, no parse error. The 16 that passed are the two fixture assertions (the elections; the nine rows of the cap), the four mode probes and ten reads of rows that a database without the function also satisfies — "nothing was written", "as before" and one comparison of two absent ids.

## Task 2 — the function

### What the schema holds

`public.set_entity_nominations`, at the end of `503-entity-rpcs.sql` and in the file's list of functions; `LANGUAGE plpgsql SECURITY INVOKER`, `search_path = ''`, every name schema-qualified; `REVOKE EXECUTE … FROM PUBLIC, anon` and `GRANT EXECUTE … TO authenticated`.

1. A NULL argument and an entity type other than `candidate` or `organization`: `22023`.
2. The authority question, once, through `public.user_can ('entity', p_entity_id, 'nomination.edit', p_entity_type)`, with the entity's project read from `private.entity_project_id`: `42501` when the entity does not exist or the caller does not hold the permission.
3. `p_nominations` must be an array: `22023`.
4. The reach, read once as the caller with no locking clause: the entity's nominations joined to their election where `election_round IS NOT DISTINCT FROM current_round` and `public.nomination_shape_rule (election_type, p_entity_type)` is `admitted` or `parent_required`.
5. Every object is validated, in order, before anything is written, and noted as a plan: kept (an `id` at its stored constituency) or new (no `id`, or an `id` at another constituency).
6. An object without an `id` must be the only object of its election.
7. One `DELETE` of the rows in reach that are not kept — the ones the set leaves out and the stored row of every move — with the row count read and compared.
8. The kept objects and then the new ones, each in the order of the set. A new one: `INSERT` of the caller's own row with no parent, `RETURNING id`. Then for both: what the row is to hold; for `entity` the parent's id from `private.nomination_id_in_contest`, and where it answers NULL an `INSERT` of the parent's row (project, the organization or the alliance id, election, constituency, round) with no `RETURNING`, and the lookup again. Then one `UPDATE` naming only the columns that differ — seven static forms — and `IF NOT FOUND` raises.
9. `SET CONSTRAINTS public.nominations_parent_required IMMEDIATE;` and `… DEFERRED;`, then the answer.

The header states each thing the plan lists, in the form of the headers beside it. The body holds no `SECURITY DEFINER`, no locking clause, no `RETURNING` on a parent's insert and no `UPDATE` of `election_id`, `constituency_id` or `election_round`.

`yarn schema:regenerate`: 0, 8,678 lines. The 463 changed lines of the migration were compared by command with the changed lines of the schema file: identical.

### The database rows

| Run | Head | typecheck | db-reset | types-regen | types-clean | pgtap | sql-lint | Driver |
|---|---|---|---|---|---|---|---|---|
| `177-gates/177-07-pgtap-red` | `a56d57b0c` | — | 0 | — | — | **1** | — | 1 |
| `177-gates/177-07-db` | `489b14248` | 0 | 0 | 0 | **1** | 0 | 0 | 1 |
| `177-gates/177-07-db-r2` | `3e002a74f` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

- `177-07-db` was red on `types-clean` alone: the regenerated file held the new function (four added lines). The driver put the file back and kept `db-types-drift.diff`, which was applied with `git apply` and committed alone as `3e002a74f`.
- pgTAP in `177-07-db` and in `177-07-db-r2`: `Files=44, Tests=2310`, `Result: PASS` — 2182 and 128. No other file turned red, the definer census of `07-rpc-security` among them: the function is not a definer function and joins neither list.
- **What the SQL lint said about the function:** `No schema errors found` and `{"results":[],"message":"db lint"}`; `Summary: 0 error(s), 3 warning(s)` — the three unindexed foreign keys it had; the census line reads `policies examined: 108, tables partitioned: 21, permission members: 23 (row-level-security tables in public+storage: 31)`, as in plan 177-06's run. The linter reads this function (`plpgsql`, not a trigger function), so this 0 is its answer about the body and about both `SET CONSTRAINTS` statements.
- Before each run: AC power, 100 %; Docker VM free space 17.55 GiB (18,407,020 KiB) before the red run, 17.62 GiB (18,471,392 KiB) before `177-07-db`, 17.61 GiB (18,470,528 KiB) before `177-07-db-r2`; no E2E run in flight. No Sleep entry in any window.
- Read from the applied database after `177-07-db-r2`: one function of the name; `prosecdef` false, `provolatile = v`, `proconfig = {search_path=""}`, no default, returns `jsonb`, identity arguments `p_entity_type entity_type, p_entity_id uuid, p_nominations jsonb`; `authenticated` and `service_role` hold EXECUTE and `anon` does not; 108 policies.

## Task 3 — the gate rows and the full run

### Gate rows

`177-gates/177-07-close`, head `3e002a74f`:

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 20 |
| lint | 0 | 49 |
| unit | 0 | 68 |
| build | 0 | 17 |
| format | 0 | 19 |

`177-verdict.mjs gates 177-07-close --rows typecheck,lint,unit,build,format`: PASS, not stale, no Sleep entry in the window. Unit, from the row's log: frontend `Test Files 194 passed | 1 skipped (195)`, `Tests 3575 passed | 20 skipped (3595)`; dev-seed 69 files and 1046 tests — the numbers of `177-03-close`.

### The full run

`tests/e2e-runs/177-e2e/177-07-close`, head `3e002a74f`, started `2026-10-11T02:29:24Z`, ended `02:38:12Z`.

- Before it: AC power, 100 %; the Docker VM's free space 17.43 GiB (18,281,264 KiB) by my own reading and 17.43 GiB by the driver's after its prune; nothing listening on port 5273 or 5173; no gate row running; no run in flight.
- The driver's and the wrapper's status: 0. Not void: no `VOID-host-suspend.txt`, 0 Sleep entries in the window, AC power at both ends.
- **Counts: total 341, passed 341, failed 0, flaky 0, skipped 0, did not run 0; 113 projects.**
- `177-verdict.mjs e2e 177-07-close --same-projects-as 177-03-close`: **PASS** — 113 projects compared, 0 not as expected: every project of `177-03-close` is in the run with its count, and no other project.

It is the first full run of the tree with the schema of plans 177-04, 177-05, 177-06 and 177-07. Nothing moved, so there was no red test to attribute. `stdout.log`, `devserver.log` and `wrapper.log` hold no line with `Nomination shape refused`, `Nomination parent required`, `A caller may originate`, `set_entity_nominations` or `server connection lost`. No axe finding and no overflow was reported by any test.

## For later plans

### For plan 177-09 — the call, exactly as written

```
public.set_entity_nominations (
  p_entity_type public.entity_type,   -- 'candidate' | 'organization'
  p_entity_id uuid,
  p_nominations jsonb                  -- an array; [] is a valid set
) RETURNS jsonb
```

The generated type: `Args: { p_entity_id: string; p_entity_type: Database['public']['Enums']['entity_type']; p_nominations: Json }`, `Returns: Json`. No parameter has a default. The function is volatile.

**One object of `p_nominations`:**

| Key | Value | Notes |
|---|---|---|
| `id` | a uuid string, or the key absent | **a JSON null is refused**, so the key is left out for a new nomination |
| `election_id` | a uuid string | required |
| `constituency_id` | a uuid string | required; with `id`, another value than the stored one is a move |
| `election_symbol` | a string, or null, or the key absent | absent and null are both "no symbol" |
| `parent` | `{"kind":"none"}` \| `{"kind":"entity","entity_type":"organization"\|"alliance","entity_id":"<uuid>"}` \| `{"kind":"other","name":"<text>"}` \| `{"kind":"keep"}` | required; a candidate names `organization`, an organization `alliance` |

Any other key, of an object or of a parent, is not read.

**The answer:** `{"inserted": n, "updated": n, "deleted": n, "unchanged": n, "parents_created": n}`, each a JSON number. A move counts once under `deleted` and once under `inserted`. A row that is inserted and then linked counts once, under `inserted`. A kept row counts under `updated` or `unchanged`.

**The function's own refusals, as PostgreSQL reports them** (each matched whole by `throws_ok`; `<i>` is the object's index from zero):

| SQLSTATE | Message |
|---|---|
| `22023` | `set_entity_nominations: p_entity_type, p_entity_id and p_nominations must each be stated` |
| `22023` | `set_entity_nominations: p_entity_type must be candidate or organization` |
| `42501` | `set_entity_nominations: the caller does not hold nomination.edit on the named entity` |
| `22023` | `set_entity_nominations: p_nominations must be a JSON array` |
| `22023` | `set_entity_nominations: p_nominations[<i>] must be a JSON object` |
| `22023` | `set_entity_nominations: p_nominations[<i>] needs an election_id that is a uuid` |
| `22023` | `set_entity_nominations: p_nominations[<i>] needs a constituency_id that is a uuid` |
| `22023` | `set_entity_nominations: p_nominations[<i>] has an id that is not a uuid` |
| `22023` | `set_entity_nominations: p_nominations[<i>] names an id that another object of the set names` |
| `22023` | `set_entity_nominations: p_nominations[<i>] names an id that is no nomination of the entity this function may write` |
| `22023` | `set_entity_nominations: p_nominations[<i>] names an election_id other than its nomination's` |
| `22023` | `set_entity_nominations: p_nominations[<i>] names an election_id that is no election the caller can read` |
| `22023` | `set_entity_nominations: p_nominations[<i>] has an election_symbol that is neither a string nor null` |
| `22023` | `set_entity_nominations: p_nominations[<i>] has an election_symbol longer than 50 characters` |
| `22023` | `set_entity_nominations: p_nominations[<i>] needs a parent that is a JSON object` |
| `22023` | `set_entity_nominations: p_nominations[<i>] has a parent whose kind is not none, entity, other or keep` |
| `22023` | `set_entity_nominations: p_nominations[<i>] names a parent whose entity_type is not organization` (for an organization: `… is not alliance`) |
| `22023` | `set_entity_nominations: p_nominations[<i>] names a parent whose entity_id is not a uuid` |
| `22023` | `set_entity_nominations: p_nominations[<i>] names a parent whose name is not a string` |
| `22023` | `set_entity_nominations: p_nominations[<i>] names a parent whose name is blank` |
| `22023` | `set_entity_nominations: p_nominations[<i>] names a parent whose name is longer than 100 characters` |
| `22023` | `set_entity_nominations: p_nominations[<i>] keeps a parent, which only an object that names an id and does not change its constituency may` |
| `22023` | `set_entity_nominations: p_nominations[<i>] is a new nomination in an election for which the set holds another object` |
| `42501` | `set_entity_nominations: a nomination could not be written; nominations are locked or the rows are no longer the caller's` |

They are raised in that order: the first two before the authority question, the array after it, then each object in the order of the table, then the last `22023` over the whole set, and the last `42501` while writing. Every `22023` begins `set_entity_nominations: `.

**What passes through, each raised by a guard that already exists:**

| What | SQLSTATE | Message | Asserted here |
|---|---|---|---|
| A candidate left with neither a parent nor a typed name where the election's type requires one | `23514` | begins `Nomination parent required: ` | yes |
| An entity type the election's type refuses, met at an insert | `23514` | begins `Nomination shape refused: ` | yes |
| A removed or moved nomination with a nomination listed under it | `23503` | `update or delete on table "nominations" violates foreign key constraint "nominations_parent_nomination_id_fkey" on table "nominations"` | yes, whole |
| The parent that would be the caller's eleventh unconfirmed one | `P0001` | begins `A caller may originate at most ` | yes |
| An insert a policy refuses: the lock, a parent's `entity_id` that names no entity of the project | `42501` | `new row violates row-level security policy for table "nominations"` | the lock: yes, whole |
| `anon` | `42501` | `permission denied for function set_entity_nominations` | yes, whole |
| Another caller creating the same parent's nomination at the same moment | `23505` | names `nominations_entity_parent_contest_key` | no |
| An election or a constituency of another project; a hierarchy refusal | `23514`; `P0001` | `validate_nomination`'s | no |

- **`42501` is four things through this function**: the caller does not edit the entity; a row could not be written (the lock on an update or a delete, or a row that vanished); an insert a policy refused (the lock on an insert); and a privilege refusal. The first two begin `set_entity_nominations: `. A writer that tells "locked" from "not yours" reads the message, as the name refusal is read today.
- **`23514` is two starts**, as plan 177-03 recorded.
- **Under the lock**: a set equal to what is stored is answered, all `unchanged`; every set that would write raises.
- **An unchanged row is one whose trimmed symbol, parent and typed name equal what is stored.** The comparison is exact text equality after the trim: no case folding, no normalisation.
- **`entity` compares by nomination id, not by entity.** "The parent differs" is asked of the id `private.nomination_id_in_contest` answers for the named entity (no parent first, then the oldest, then the lowest id). Where the named entity holds one nomination at the contest that is the row's stored parent or it is not, and the answer is what a reader expects. Where it holds several and the row stands under another of them, `entity` repoints the row to the first by that order and the row is unconfirmed (*observed*, below). **`keep` is the one way to leave a stored link as it is**, so an editor that has not changed a listed parent sends `keep`, not `entity`. This is plan 177-17's prefill.
- **A move** deletes the stored row and inserts a new one that carries the symbol and the parent the object states. `keep` is refused on a move. Other keys of the old row's custom data are not carried.
- **A set that leaves a stored row out and holds an object without an `id` in that row's election** is a delete and an insert, not a refusal: the object is the only object of its election.
- **The writer's `rpc(` call needs an entry in `PROJECT_SCOPED_RPCS`** of `scripts/assert-project-scoped-queries.mjs`; the function takes no project and is scoped by the entity, as `upsert_answers` is. This plan adds no call site and no entry.
- **Nothing was run through PostgREST.** The status column of `177-RESEARCH.md` RQ-3 is still the documentation's; the writer's integration test is the first place a refusal of this function crosses the API.

### For Phase 177.1

The keys of one object above are this phase's and become `create_invitations (… p_nominations)`'s: `id` (not meaningful for an invitation, which only adds), `election_id`, `constituency_id`, `election_symbol`, `parent` with its four kinds. The trim (the Unicode white-space characters and U+FEFF), the caps (50 and 100 characters, counted with `char_length`) and the key `requestedParentOrganization` are in the function's body and nowhere else in SQL; a second writer of the same shape repeats them or the function is split.

### For plan 177-21

See *Sentences the work made false* and *Threat Flags*.

- **pgTAP now:** `Files=44, Tests=2310`; file 43 plans 128. The next free ordinal is 45.
- The cap's todo (the plan's ruling 6): a move leaves behind the nomination an earlier call created for the parent at the old contest; it is not the caller's row, the caller may not delete it, and it counts against the caller's cap while it is unconfirmed. The function's header says so.

## Observed beyond the plan's assertions

- **Twenty planted defects, each seen caught** (scratch runs in rolled-back transactions against the draft, not evidence of the suite; *Deviations*, 4):

| Planted | Red |
|---|---|
| no raise after the UPDATE | 1: `LOCK:` the symbol-only set |
| no raise after the DELETE | 1: `LOCK:` the removal-only set |
| no comparison before the update | 22: every answer that counts a row unchanged |
| `SECURITY DEFINER` | 12: `CAT:`, the unconfirming of `EDIT:` and `KEEP:`, every `LOCK:` raise and more |
| no forcing | 4: the `REQ:` refusal, its message, and the two that follow |
| the mode not set back | 5: three `MODE:` probes and the `REQ:` calls after them |
| a trim of ASCII white space only | 4: `OTHER:` the trimmed name, three `ENC:` |
| the reach at any round | 17 |
| the reach in any election type | 3: `DEL:` |
| the custom data replaced, not merged | 4: `OTHER:` |
| the key not removed | 3: `OTHER:` |
| no authority question | 2: `WHO:` (the policy refuses instead, in other words) |
| round 1 written for every new row | 15 |
| EXECUTE granted to `anon` | 2: `CAT:` and `ANON:` |
| the name measured in bytes | 6: `ENC:` |
| no rule on objects without an `id` | 4: `U02:` |
| the symbol not trimmed | 8: `NEW:`, `SKIP:` and more |
| a move made in place | 5: `MOVE:` and `ARG:` keep on a move |
| `keep` admitted on a move | 2 |
| a value set on the parent's row | 1: `LINK:` the party's new nomination carries nothing else |

- **`entity` over a stored link to another nomination of the same party** (`177-07-scratch/probe-other-nomination.{sql,log}`, one rolled-back transaction after the full run): the fixture's organization is given a second nomination at its contest, under the alliance's, and the fixture's candidate is pointed at it, confirmed. `keep` answers `unchanged: 1`. `entity` naming that organization answers `updated: 1`, and the row then stands under the organization's nomination that has no parent and is unconfirmed.
- **`plpgsql_check` asked directly** about the committed body, in a transaction that created the extension and was rolled back, with the other, extra, performance and security warnings on: 0 rows. Afterwards the extension was not installed.
- **The seed under the changed schema:** `yarn db:seed:default` after the full run, exit 0, 752 rows, 377 nominations.

## Deviations from Plan

### Auto-fixed Issues

None in committed code. Two defects of the draft were corrected before the schema commit; see 6 below.

### Other deviations

**1. Three commits, not two.** The generated types were committed alone from the driver's kept diff after `types-clean` went red, as the dispatch said to expect.

**2. Five behaviours the contract did not state**, each pinned by an `ARG:` or `U02:` assertion:
- **The order of the first refusals.** The contract says a caller without `nomination.edit` "is refused first". A NULL argument and an unserved entity type are refused before that question, because it cannot be asked without a type and an id; "not an array" and every refusal of an object come after it.
- **An `id` that is a JSON null is refused** as an id that is not a uuid. The contract says "a uuid, or absent".
- **An absent `election_symbol` is no symbol.** The contract refuses a value that is "neither a string nor null" and does not name an absent key.
- **An object without an `id` must be the only object of its election.** The contract names two cases (two without an `id`; one without beside one whose row stays). The rule built also refuses one without an `id` beside a move in the same election, which the plan's truth "several rows of one election are accepted only where each names an existing row by `id`" covers and the contract's list does not.
- **A refusal that is not in the contract's list:** the election of every object is read as the caller, for its `current_round`, and an election the caller cannot read is refused with `22023` by index (`… names an election_id that is no election the caller can read`). Without it a new row in an unreadable election would be written at a NULL round wherever the tenancy check of `validate_nomination` let it through. For a caller that passed the authority question no election of the entity's own project is unreadable, so the refusal meets an id that names no election and an election of a closed project the caller holds nothing in.

**3. The function's own refusals are asserted whole, not by `throws_like` on their start.** The plan asks for the SQLSTATE and, where the contract names a message start, `throws_like`. `throws_ok` with the code and the whole message asserts both in one assertion and pins the words plan 177-09 reads. `throws_like` is used where a guard words the message and it carries ids (`Nomination parent required: `, `Nomination shape refused: `, `A caller may originate at most `).

**4. The function was drafted before the red commit, and scratch runs were made.** The draft lived in `tests/e2e-runs/177-unit/177-07-scratch/ddl.sql` (gitignored); the test file was run against it and without it in rolled-back `psql` transactions (128 of 128, and 112 red), and twenty planted defects were run the same way. None is evidence of the suite: the red run and both green runs are the gate driver's. The schema file was written from the draft after the red run.

**5. `MODE:` has a control and a fourth probe**, beyond the plan's two: the same insert with the constraint immediate raises, so the probe can tell, and a probe after the control shows the control left the mode deferred.

**6. Two corrections of the draft, before the schema commit.** `plpgsql_check` reported one warning (`v_parent_type` assigned a `text` CASE: "does not have an assignment cast") and five performance notes (integer zeros initialising `bigint` counters). The CASE branches are cast to the enum and the counters are `integer`. And the first write of the draft and of the test file turned several four-digit Unicode escapes into the characters themselves — the white-space class of the function and three strings of the test file; they were restored by script and both committed files were read for any character above U+007E: none.

**7. The test file's header lists its tags one per line, each ending in a full stop.** `yarn assert:comment-hygiene` refused the first form (rule 2, a comment line that ends without punctuation above a continuing line), 18 lines; the stops were added and the guard is 0. The tag `U02` is the plan's own.

**8. The WINDOWS ledger, `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not written**, by the dispatch.

## Code review checklist

Walked for the Supabase backend section and the general items that apply to SQL.

| Item | Outcome |
|---|---|
| Solves the issue | yes: one call writes an entity's whole set of nominations or nothing, under the caller's own rights |
| OWASP | broken access control is the subject: the function is INVOKER and adds one authority question, asked through `user_can`; `WHO:`, `LOCK:`, `CAP:` and `ANON:` show the guards refusing through it, and a planted definer header turns twelve assertions red. Injection: no argument is concatenated into SQL and the body holds no dynamic statement; every id is checked with `pg_input_is_valid` before it is cast. Input: the symbol and the name are trimmed and capped and stored as text. See *Threat Flags* for what the function does not hold |
| No repeated code | the reach's two conditions are stated once; the matrix is asked of `nomination_shape_rule` and the parent's id of `nomination_id_in_contest`; the UPDATE is seven static statements by the design of "only the columns that differ" |
| Documented | the header states what the function applies, why it is INVOKER, the keys, the reach, the order, the row-count rule, the forcing, the answer, what a move leaves behind and the pgTAP file |
| Repo documentation | **not updated**: see *Sentences the work made false* |
| Comment hygiene | the guard is 0 and `177-verdict.mjs hygiene` is 0 hits; every comment and test title added was read for history and ids |
| `[db]` tag | on all three commits |
| RLS policies | none added or changed; 108 before and after |
| New definer functions | none |
| pgTAP boundary and patterns | the file's own `BEGIN`/`ROLLBACK` and `create_test_data ()`; `is` and `ok` for values, `throws_ok` and `throws_like` for refusals, `lives_ok` for the mode probes; a silent zero-row statement is asserted as the function's raise and then the unchanged row read as the owner |
| New tables, indexes, triggers | none |

## Threat Flags

| Flag | File | Description |
|---|---|---|
| threat_flag: unbounded-input | `apps/supabase/supabase/schema/503-entity-rpcs.sql` | `p_nominations` has no length bound: each object costs a read of its election and up to four statements, and each new parent a definer lookup twice. Not measured, no cap built. The role's statement timeout is the only limit |
| threat_flag: unlisted-parent | `apps/supabase/supabase/schema/503-entity-rpcs.sql` | `entity` is not held to the options `get_nomination_parent_options` lists: a candidate that knows the id of an unconfirmed organization of its project can have that organization's nomination created and stand under it. The parent policy alone already admits the same direct insert; the function adds no rule and removes none. *Inferred from the policy and the body, not asserted* |

T-177-30 to T-177-35 are mitigated as the plan lays out and each has its section (`ATOM:` and `REQ:`; `CAT:`, `WHO:`, `LOCK:`, `CAP:`; `LOCK:`; `ARG:`, `WHO:`, `DEL:`; `NEW:`, `ENC:`; `MODE:`). T-177-36 is accepted and not tested.

## Sentences the work made false, reported and not edited

- `.claude/skills/database/SKILL.md`, `schema-reference.md`, `rls-policy-map.md`: the pgTAP file and test counts (now 44 and 2310); no paragraph or row for `set_entity_nominations`; no row for pgTAP file 43.
- `apps/supabase/supabase/schema/104-nominations.sql`, the comment of `custom_data` ("marks a candidate waiting for a party that is not in the system"), and `011-validation-functions.sql`, rule 1 of `enforce_nomination_confirmation` and its message ("a candidate who asked for a party"): an organization's nomination carries the same key once its editor names an alliance that is not listed. Neither file is this plan's.
- `177-07-PLAN.md`, `<the_contract>`: its list of refusals lacks the unreadable election, and its two cases of the rule on objects without an `id` are one wider rule in the function. Planning record: note, do not rewrite.

## Not done, or not verified

- **Nothing through PostgREST.** Every call was made in SQL.
- **Two saves in parallel** (the plan's backstop truth, T-177-36): not provable in one session, not tested. *Inferred:* the uniqueness key refuses the second whole.
- **`other` for an organization** (an alliance that is not listed): no assertion. *Inferred from the body:* the branch is the candidate's.
- **`none` on a kept candidate row in an `organization_list` election:** no assertion. *Inferred:* the UPDATE queues the constraint's event and the forcing raises.
- **A project admin, a project editor and the service role as callers:** no assertion. *Inferred:* the first two pass the authority question and write through the admin policies; the service role holds EXECUTE by default privileges, carries no grants claim and is refused at the authority question.
- **A parent's nomination created for a kept row under the lock:** no assertion; the insert policy refuses it.
- **A move of a row whose custom data holds another key:** the new row does not carry it, by the body; the `MOVE:` fixture's row holds none.
- **The `entity_id` of a parent that names no entity, or one of another project:** no assertion. *Inferred:* the parent policy's project agreement refuses the insert, `42501`.

## The state the local stack is left in

- The stack is up and was not restarted. The database was reset three times by the gate driver (`177-07-pgtap-red`, `177-07-db`, `177-07-db-r2`), then held one full E2E run, then `yarn db:seed:default` (exit 0): 3 projects and 377 nominations before and after the re-seed. It holds `set_entity_nominations` and the pgTAP helper functions the last suite run committed into `public`; `plpgsql_check` is not installed.
- On this database `39-invitations.test.sql` test 238 would be red until the next reset, as the dispatch says: `private.invitation_link_witness` holds 13 rows.
- Docker VM free space at the end: 17.36 GiB (18,199,844 KiB).
- `git status --short`: `?? CAND-APP-PLAN.md`, the operator's.

## Known Stubs

None.

## Evidence (gitignored)

- `tests/e2e-runs/177-gates/`: `177-07-pgtap-red`, `177-07-db` (with `db-types-drift.diff`), `177-07-db-r2`, `177-07-close`.
- `tests/e2e-runs/177-e2e/177-07-close`.
- `tests/e2e-runs/177-unit/177-07-*`: `pgtap-red.{log,exit,head}`; `t1-verify`, `t2-verify`, `t3-verify` (`.sh`, `.log`, `.exit`, `.head`); `extract-verify.mjs`; `commit-t1.sh`, `commit-t2.sh`, `commit-types.sh`; the drivers' launch logs and statuses (`pgtap-red-driver`, `db-driver`, `db-r2-driver`, `close-gates-driver`, `close-e2e-driver`); `close-gates-verdict.log`, `close-e2e-verdict.log`, `scope.log`, `hygiene-verdict.log`, `hygiene-t1.log`, `hygiene-t2.log`, `prettier-t2.log`; `schema-lines.txt`, `migration-lines.txt`, `schema-regenerate.log`, `parity.log`, `rpc-nullability.log`; `df-before-red.txt`, `df-before-db.txt`, `df-before-db-r2.txt`, `df-before-e2e.txt`, `batt-before-red.txt`, `batt-before-e2e.txt`; `seed-default.{log,exit}`; `plan-start.txt`; `scratch/` (the draft, the dry-run, planted-defect, `plpgsql_check` and probe logs and the SQL they ran).

## Self-Check: PASSED

The four files the plan created or modified, this summary, the red run's log, both green database runs, the closing gate run and the full run's summary are on disk; `a56d57b0c`, `489b14248` and `3e002a74f` are ancestors of HEAD; the function is named in the schema file, in the migration (30 lines) and in the generated types.
