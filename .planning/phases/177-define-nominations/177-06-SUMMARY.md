---
phase: 177-define-nominations
plan: 06
subsystem: database-schema
tags: [nominations, parent-options, security-definer, allow-list, definer-census, pgtap]
status: complete
requires:
  - "177-05: the parent policy widened to an alliance's row, pgTAP at Files=42 Tests=2115"
  - "177-01: 177-gates.sh, 177-verdict.mjs"
provides:
  - "public.get_nomination_parent_options (p_project_id uuid, p_entity_type public.entity_type, p_entity_id uuid, p_contests jsonb) RETURNS jsonb: STABLE, SECURITY DEFINER, search_path = '', EXECUTE for authenticated (and service_role) and not for anon"
  - "the answer: a jsonb array of {id, entity_type, name, short_name, color, image, nominated}, ordered by sort_order nulls last and then id; NULL for every refusal"
  - "public.get_entity_nominations: the parent object holds entity_id beside entity_type, name and short_name"
  - "pgTAP: 44-nomination-parent-options.test.sql (plan 66); 42-entity-nominations 69 -> 70; the authenticated definer census of 07-rpc-security at ten names"
  - "generated types: Database['public']['Functions']['get_nomination_parent_options']"
affects: [177-07, 177-09, 177-21]
tech-stack:
  added: []
  patterns:
    - "a function asked through a pg_temp instrument that uses dynamic SQL and answers a JSON string for a missing function and for a raise, so an IS NULL assertion is also the assertion that nothing was raised, and a database without the function reports failed expectations and not an aborted file"
    - "an argument of JSON validated member by member with pg_input_is_valid before any cast, so a malformed id is a NULL answer and never a raise"
key-files:
  created:
    - apps/supabase/supabase/tests/database/44-nomination-parent-options.test.sql
  modified:
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/42-entity-nominations.test.sql
    - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
    - packages/supabase-types/src/database.ts
decisions:
  - "nominated lists each asked contest once, in the order first asked; a key of a contest other than election_id and constituency_id is not read; a contest whose election is not one of the project is answered as not nominated, not refused"
  - "an id of p_contests is admitted when pg_input_is_valid says it reads as a uuid, and is answered in nominated as the uuid's canonical text"
  - "the new pgTAP file takes ordinal 44 and leaves 43 to the write function's file"
requirements-completed: [NOM-04]
metrics:
  started: "2026-10-11T01:42:24Z"
  completed: "2026-10-11T01:57:30Z"
  duration: "15 minutes"
  tasks: 2
  files: 6
actuals:
  tokens: 18757 # chars/4 over git diff c0249fc2a..59e9ffb6e -- apps packages (75,029 characters, the generated migration included)
  tasks: 2
  commits: 3 # git rev-list --count c0249fc2a..59e9ffb6e
plan_head_before: c0249fc2ac8d0a71afa6432a24c05b85c682605b
plan_head_after: 59e9ffb6ef156519e96a2971f53aaf679e9b6b84
---

# Phase 177 Plan 06: The Parent Options an Entity May Name, and the Parent's Id — Summary

`public.get_nomination_parent_options` answers the editor of one candidate or organization with the entities that entity may stand under — every confirmed organization of a candidate's project, every alliance of an organization's, confirmed or not — as seven allow-listed keys each, with the asked contests at which each option is nominated at the election's current round; it answers NULL, and never raises, for every caller and every argument it refuses. `get_entity_nominations` now returns the parent's entity id. 67 new pgTAP assertions (66 in a new file, one in file 42) and ten changed expectations hold both, committed red (71 failing, each an expectation) before the schema that turns them green.

`requirements-completed` names NOM-04 because the plan's frontmatter does; this plan delivers two database reads the editor needs and nothing a user can reach yet. `REQUIREMENTS.md`, `STATE.md` and `ROADMAP.md` were not touched.

## Read this first

- **Both verify blocks exit 0 as written.** Neither searches SQL for a message with an apostrophe.
- **Three commits, not the plan's two**: the generated types went red on `types-clean` in `177-06-db` and were committed alone from the driver's kept diff, as the dispatch said to expect; the run judged is `177-06-db-r2`.
- **File 42 changed in more places than the plan names.** Adding `entity_id` to the parent object makes seven exact-object expectations and one "the answer holds nowhere the parent's id" assertion false, besides the key-set assertion the plan names. All were brought in line; see *Deviations*, 1. The assertion that the parent's id is **absent** from the answer no longer exists, by the design of U-31.
- **The ordinal is 44**, as the plan read it: the files end at 42, the write function's file of plan 177-07 takes 43, and this file sorts after it. There is no file 43 on the tree until then.
- **pgTAP is `Files=43, Tests=2182`**; the definer census for `authenticated` holds ten names and `anon`'s six did not move; 108 policies; the SQL lint said 0 errors and the three warnings it had.
- **No E2E run was made**, by the plan's ruling 4. The latest full run is still `tests/e2e-runs/177-e2e/177-03-close`. The writer's integration test was run once against the changed read (20 of 20), because it is the one consumer of the answer that gained a member.
- **Four behaviours of `nominated` and `p_contests` are choices the plan did not state**; they are pinned and listed under *For later plans* for plan 177-09 and under *Deviations*, 6, for the reader of P-07.

## Task Commits

| Task | Commit | Subject | Files |
|---|---|---|---|
| 1 | `fd6e610eb` | test(177-06): the parent options an entity may name, and the parent's id in an entity's nominations [db] | `44-nomination-parent-options.test.sql` (new), `42-entity-nominations.test.sql`, `07-rpc-security.test.sql` |
| 2 | `082d60b31` | feat(177-06): the parent options an entity may name, and the parent's id in an entity's nominations [db] | `503-entity-rpcs.sql`, `00001_initial_schema.sql` |
| 2 | `59e9ffb6e` | chore(177-06): the generated database types for the parent-options function [db] | `packages/supabase-types/src/database.ts` |

Head before the plan's first commit: `c0249fc2a`. Three commits, measured with `git rev-list --count c0249fc2a..59e9ffb6e`. Six files, 1,797 insertions, 26 deletions. No commit of another agent landed in between.

## Each task's verify command, with its real exit status

Each `<automated>` block was written byte for byte to `tests/e2e-runs/177-unit/177-06-t<N>-verify.sh` by `177-06-extract-verify.mjs`, which reads the plan, and run with `bash`. Log, status and head are beside each.

| Verify | Head | Exit |
|---|---|---|
| Task 1 | `fd6e610eb` | 0 |
| Task 1, again | `59e9ffb6e` | 0 |
| Task 2 | `59e9ffb6e` | 0 |

`177-verdict.mjs gates 177-06-db --rows db-reset,types-regen,types-clean,pgtap,sql-lint,typecheck` (it reads the newest attempt, `177-06-db-r2`): 0, PASS, not stale, no Sleep entry in the window. `177-verdict.mjs scope`: 0, PASS. `177-verdict.mjs hygiene`: 0, 0 hits, 0 advisory lines. `yarn assert:comment-hygiene` on the working tree before each of the first two commits: 0 and 0. `yarn assert:schema-migration-parity`: 0. `yarn assert:rpc-nullability`: 0 (it reads `RETURNS TABLE` functions; this one returns `jsonb` and adds no row). `prettier --check` on the three test files and the schema file: 0.

## Task 1 — the assertions, red

### What the new file holds

**`44-nomination-parent-options.test.sql`: plan 66**, counted by pgTAP itself. Every impersonation passes an empty grant array; the header says so. Fixture of the file's own, all in the `44444444-…` range: in project A an unconfirmed organization (`…b1`), two confirmed ones (`…b4`, which carries every answered and every withheld column, and `…b5`, which carries a name and an order), an unconfirmed alliance (`…b3`), a second constituency (`…c1`) and a second election at its round 2 (`…e1`); in project B a confirmed organization (`…b2`); six nominations (`…0101` to `…0106`); editor grants for organization_a on faction_a and alliance_a. The shared fixture gives the faction, the confirmed alliance and project B's unconfirmed organization and alliance.

| Group | Assertions | What |
|---|---|---|
| fixture | 1 | every entity whose absence is asserted exists, in the named project, with the named confirmation; the two elections are at rounds 1 and 2 |
| catalogue | 2 | `SECURITY DEFINER`, `search_path=""`, `STABLE`, no default, returns `jsonb`, the four identity arguments; `authenticated` may execute and `anon` may not |
| a candidate's editor: who is listed | 10 | through the tables the candidate cannot read a confirmed organization with no confirmed nomination; the answer is an array; the list is the three confirmed organizations in order (the order discriminates `sort_order` from `id` and nulls last from nulls first); absent, each by its own assertion: the unconfirmed organization, the faction, the confirmed alliance, the unconfirmed alliance, project B's confirmed organization, project B's unconfirmed organization; every option's type is `organization` |
| keys and values | 4 | every element holds exactly `color,entity_type,id,image,name,nominated,short_name`; one option equals a whole object with a colour and an image; one equals a whole object with JSON nulls for the three absent columns; every member of `nominated` holds exactly `constituency_id,election_id` |
| `nominated` | 9 | the two asked contests at the current round and not the one at another round; a round-3 nomination of an election at round 1 does not count where a round-2 nomination of an election at round 2 does; none → `[]`; the order asked; asked twice → once; not asked → not answered; another key of a contest neither refused nor answered; an empty array of contests → `[]` on every option, and the same options listed; an election that names nothing and one of another project → not nominated, not refused |
| withheld | 1 | the answer is an array that holds nowhere the description, the custom data, the external id, the subtype, a question id of the answers, the id of a nomination or the id of the user who created one |
| refusals, the gate | 8 | NULL for a NULL project, a NULL type, a NULL id, another editor's candidate, another editor's organization, an id that names nothing, the caller's own id under another type, the caller's own candidate under project B |
| refusals, the contests | 13 | NULL for a NULL, a JSON null, an object outside an array, a JSON string, `[1]`, `[[]]`, no constituency, no election, an election that is no uuid, a constituency that is a number, an election that is a JSON null, a valid contest beside a number; and asked directly, without the instrument, malformed ids raise nothing |
| the closed project | 4 | through the tables its candidate cannot read its confirmed organization; the candidate's editor is answered with that one organization and none of project A's; NULL under project A for its own candidate and for project A's; with that organization's confirmation withdrawn, `[]` — an answer, where the same caller's refusals were NULL |
| an organization's editor | 7 | through the tables it cannot read the unconfirmed alliance; the list is both alliances of the project, the unconfirmed one first by id; every option's type is `alliance`; project B's alliance absent; the unconfirmed alliance equals a whole object; the confirmed alliance's `nominated`; the same seven keys |
| other callers | 6 | the parent organization's editor → NULL for its child candidate; control that the grant lookup names the faction and the alliance the caller edits; NULL for its own faction; NULL for its own alliance; a project admin → NULL; `anon` → `42501` |

**The instrument.** `pg_temp.options` asks the function through dynamic SQL and answers the JSON string `"no such function"` where it does not exist and `"raised <SQLSTATE>"` where it raises. So `ok (… IS NULL)` fails on a raise as well as on any other answer, and each refusal is one assertion instead of a `lives_ok` and an `IS NULL`. The derived instruments (`listed`, `lists`, `option`, `option_keys`, `nominated_keys`, `nominated_values`, `listed_types`) answer NULL for anything that is not an array, so an absence assertion (`is (pg_temp.lists (…), false, …)`) cannot pass on a refusal.

### What files 42 and 07 hold

**`42-entity-nominations.test.sql`: plan 69 -> 70.** The `pg_temp.parent_keys` assertion expects `entity_id,entity_type,name,short_name`; one new assertion reads `parent.entity_id` of the fixture's candidate nomination as org_a's id; the seven expectations that compare a parent, or an element holding one, with a whole object gain `entity_id` (an organization, a faction and an alliance among them, so each arm of the coalesce is read); the assertion that the answer holds nowhere the parent's id lost that conjunct and keeps the description, the parent nomination's id, label and custom data; the header's two sentences on the parent name four keys.

**`07-rpc-security.test.sql`: plan 39, unchanged.** The census string for `authenticated` holds `…get_entity_nominations,get_nomination_parent_options,project_open_for_voters…` and its description names the function. The string for `anon` was not touched.

### The red run

Commit `fd6e610eb`, through the gate driver (`177-gates.sh 177-06-pgtap-red --rows db-reset,pgtap`), kept as `tests/e2e-runs/177-unit/177-06-pgtap-red.{log,exit,head}`: db-reset 0, pgtap **1**; `Files=43, Tests=2182`, `Result: FAIL`. Three files failed, none aborted (`Wstat: 0` on each):

- `07-rpc-security` — 1 of 39: test 20, the census.
- `42-entity-nominations` — 9 of 70: tests 15-19, 24, 43-44, 52 — the eight whole-object and key-set expectations and the new `entity_id` read.
- `44-nomination-parent-options` — 61 of 66: tests 2-3, 5-49, 51-53, 55-61, 63-66. Each is an expectation: `have: "no such function"` or NULL where a value is wanted, `died: 42883` on the one direct `lives_ok`, and `caught: 42883`, `wanted: 42501` on `anon`.

The five of file 44 that passed are the fixture, the three "through the tables" controls and the grant-lookup control: statements about the database as it was.

## Task 2 — the function and the parent's id

### What the schema holds

- **`public.get_entity_nominations`**: the parent object gains `'entity_id', COALESCE(p.organization_id, p.faction_id, p.alliance_id)`; the header's sentence names four keys. Nothing else of it changed.
- **`public.get_nomination_parent_options`**, directly after it in `503-entity-rpcs.sql`, `LANGUAGE plpgsql STABLE SECURITY DEFINER`, `search_path = ''`, no parameter default:
  1. the gate of `get_entity_nominations`, in the same form: NULL unless the three arguments are stated, the type is `candidate` or `organization`, and the id is among `private.caller_entity_ids (p_project_id, p_entity_type)`;
  2. NULL unless `jsonb_typeof (p_contests)` is `array`;
  3. NULL when a member is not an object whose `election_id` and `constituency_id` are JSON strings for which `pg_input_is_valid (…, 'uuid')` is true — asked before any cast, so nothing raises;
  4. the asked contests, joined to `public.elections` on the id **and** `project_id = p_project_id`, grouped to one row each with the election's `current_round` and the place first asked;
  5. the options: `public.organizations` where the type asked is `candidate`, the project is `p_project_id` and `confirmed`; `public.alliances` where the type asked is `organization` and the project is `p_project_id`;
  6. each as `jsonb_build_object ('id', 'entity_type', 'name', 'short_name', 'color', 'image', 'nominated')`, `nominated` being the asked contests for which `private.nomination_exists_in_contest (<option's type>, <option's id>, election, constituency, current_round)` answers true, in the order asked, `[]` for none;
  7. ordered by `sort_order NULLS LAST, id`; `'[]'::jsonb` when nothing is listed.
  `REVOKE EXECUTE … FROM PUBLIC, anon` and `GRANT EXECUTE … TO authenticated`, in the form beside it. The header has the six paragraphs the plan lists; the file's list of functions names it.

`yarn schema:regenerate`: 0, 8,215 lines. The 108 changed lines of the migration were compared by command with the changed lines of the schema file: identical.

**What `private.caller_entity_ids` admits, as read:** the `target_id` of the caller's own rows of `public.grants` — `user_id = auth.uid ()`, `scope = 'entity'`, `role = 'editor'`, `target_type` the type asked — whose entity lies in the project asked, probed by one `EXISTS` on that type's table. It reads the table and not the token, calls no `user_can`, and an entity-scope `admin` row is not read. So the project argument can only select among the caller's own editor grants.

### The database rows

| Run | Head | typecheck | db-reset | types-regen | types-clean | pgtap | sql-lint | Driver |
|---|---|---|---|---|---|---|---|---|
| `177-gates/177-06-pgtap-red` | `fd6e610eb` | — | 0 | — | — | **1** | — | 1 |
| `177-gates/177-06-db` | `082d60b31` | 0 | 0 | 0 | **1** | 0 | 0 | 1 |
| `177-gates/177-06-db-r2` | `59e9ffb6e` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `177-gates/177-06-integration` | `59e9ffb6e` | integration 0 (20 of 20) | | | | | | 0 |

- `177-06-db` was red on `types-clean` alone: the regenerated file held the new function. The driver put the file back and kept `db-types-drift.diff` (nine added lines); that diff was applied and committed alone as `59e9ffb6e`.
- pgTAP in `177-06-db` and in `177-06-db-r2`: `Files=43, Tests=2182`, `Result: PASS` — 2115 and 67.
- **What the SQL lint said:** `No schema errors found`; `Summary: 0 error(s), 3 warning(s)` — the three unindexed foreign keys it had; the census line reads `policies examined: 108, tables partitioned: 21, permission members: 23 (row-level-security tables in public+storage: 31)`, as in plan 177-05's run. No entry of a ratified list was added, moved or removed.
- Before each run: AC power, 100 %; Docker VM free space 17.73 GiB (18,589,932 KiB) before the red run, 17.79 GiB (18,654,868 KiB) before `177-06-db`, 17.81 GiB (18,676,496 KiB) before `177-06-db-r2`; no E2E run in flight. No Sleep entry in any window.
- Read from the applied database after `177-06-db-r2`: the function is `prosecdef`, `provolatile = s`, `proconfig = {search_path=""}`, no default, returns `jsonb`, with the four identity arguments; `authenticated` and `service_role` hold EXECUTE and `anon` does not; the census query answers the ten names for `authenticated` and the six for `anon`; 108 policies.

## For later plans

**For plan 177-09 — the call and its answer, exactly as written.**

```
public.get_nomination_parent_options (
  p_project_id uuid,
  p_entity_type public.entity_type,   -- 'candidate' | 'organization'; anything else -> NULL
  p_entity_id uuid,
  p_contests jsonb                     -- [{"election_id": "<uuid>", "constituency_id": "<uuid>"}, …]; [] is admitted
) RETURNS jsonb
```

The generated type: `Args: { p_contests: Json; p_entity_id: string; p_entity_type: Database['public']['Enums']['entity_type']; p_project_id: string }`, `Returns: Json`. All four are required; none has a default.

One element of the answer, as pgTAP compares it whole (key order is not significant in `jsonb`):

```json
{
  "id": "44444444-4444-4444-4444-0000000000b4",
  "entity_type": "organization",
  "name": {"en": "Second Party", "fi": "Toinen puolue"},
  "short_name": {"en": "SP"},
  "color": {"normal": "#112233", "dark": "#aabbcc"},
  "image": {"path": "<project id>/organizations/<entity id>/<file id>.png", "alt": "Logo of the second party"},
  "nominated": [{"election_id": "<uuid>", "constituency_id": "<uuid>"}]
}
```

- **An entity with an image** is answered with the `image` column as stored: the whole stored-image object (`path`, and `pathDark`, `alt`, `width`, `height`, `focalPoint` where stored). The function builds no URL and reads nothing from storage. An entity without one carries `"image": null`. The same holds for `color` (`{normal?, dark?}` or null) and `short_name`; `name` and `short_name` are the localized objects as stored, not localized by the function.
- `entity_type` is the string `organization` for a candidate's options and `alliance` for an organization's; the two never mix in one answer.
- **Three outcomes, as with `get_entity_nominations`:** NULL is a refusal, `[]` says the project lists nothing the entity may name, and an array is the options. A parser must keep NULL apart from `[]` (T-177-29).
- **`nominated`** holds members of exactly `election_id` and `constituency_id`. It lists each asked contest at most once, in the order first asked. A contest the caller did not ask about is never in it, so an option nominated elsewhere and at none of the asked contests carries `[]`. The ids are the uuids' canonical lower-case text (*inferred from the cast, not asserted*: no test asks with upper-case ids).
- **What refuses the whole call with NULL:** a `p_contests` that is NULL, a JSON null, not an array, or holds one member that is not an object with both ids as uuid strings. One bad member refuses everything; there is no partial answer. Another key in a member is not read and is not a refusal.
- **What is answered and not refused:** a well-formed contest whose election names nothing, or names an election of another project — it is simply never in `nominated`.
- "Nominated" is asked at `elections.current_round`, compared with `IS NOT DISTINCT FROM`, so an election whose `current_round` is NULL matches nominations whose round is NULL.
- **`get_entity_nominations` → `parent.entity_id`** is the id of the organization, faction or alliance the parent nomination nominates, beside `entity_type`. The frontend's `ParentSchema` (`entityNominations.ts`) drops it today; the writer's integration test passed unchanged against the widened answer (20 of 20).
- The data writer's `rpc(` call needs an entry in `PROJECT_SCOPED_RPCS` of `scripts/assert-project-scoped-queries.mjs` (`177-RESEARCH.md` RQ-2); this plan adds no call site and no entry.

**For plan 177-07.**

- The next free pgTAP ordinal is **43**; file 44 exists. A run now reports `Files=43, Tests=2182`; the planned sum over the 42 planning files is 2173 and `00-helpers` runs 9.
- File 44's fixture takes the ids `44444444-4444-4444-4444-0000000000b1` to `…b5`, `…c1`, `…e1`, `…f1` and `…0101` to `…0106`. Files do not share a transaction, so nothing collides; the range is free to reuse.
- The dynamic-SQL instrument of file 44 (`pg_temp.options`) is a form the write function's file can take for its own red run.
- The census string of `07-rpc-security.test.sql` is at ten names. `set_entity_nominations` is planned as `SECURITY INVOKER` and joins neither list.

**For plan 177-21 — see *Sentences the work made false*.**

## Observed beyond the plan's assertions

**Fifteen planted defects** (scratch runs in rolled-back transactions, not evidence of the suite; *Deviations*, 2). Each ran file 44, or file 42 for the last, against the function with one thing altered:

| Planted | Red |
|---|---|
| unconfirmed organizations listed | 5: the list, the unconfirmed organization's absence, the second listing, the closed project's list and its empty array |
| organizations of every project listed | 5: the list, project B's organization's absence, the second listing, both closed-project assertions |
| alliances of every project listed | 2: the list, project B's alliance's absence |
| alliances listed only when confirmed | 2: the list, the unconfirmed alliance's whole object |
| the gate asking `user_can ('entity', …, 'nomination.read', …)` | 4: the candidate under project B, the other project's editor, the parent organization's editor, the project admin |
| the gate without the type condition | 2: the faction's and the alliance's own editor |
| a nomination at any round counted | 5 |
| a key outside the allow-list (`sort_order`) | 5: both key sets and the three whole objects |
| the uuid check removed | 2: the election that is no uuid, the direct call |
| the member check removed | 9: every malformed-member assertion |
| ordered by id alone | 2: both listings |
| ordered with nulls first | 2: both listings |
| EXECUTE granted to `anon` | 2: the privilege twin and the `anon` refusal |
| the parent's `entity_id` read from the organization column alone (file 42) | 2: the faction parent and the alliance parent |
| **the election not held to the project** (the join without `project_id = p_project_id`) | **0** — see *Not done, or not verified* |

The first run of "ordered by id alone" was also 0: the fixture's order did not tell `sort_order` from `id`. The fixture's two orders were changed so that it does, before the red commit; the row above is the second run.

**On seeded data, as an editor** (scratch, one rolled-back transaction after the re-seed: an editor grant on a seeded candidate written and rolled back): eight options, each an organization with its stored colour and a JSON null image, each `nominated` at the candidate's one contest; and `get_entity_nominations` for the same candidate answers a parent of `entity_type`, `entity_id`, `name` and `short_name`. No seeded organization has an image, so the image's shape was observed in pgTAP alone.

**The seed under the changed schema:** `yarn db:seed:default` after the gate runs, exit 0, 752 rows, 377 nominations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The first form of the fixture could not tell the ordering by `sort_order` from an ordering by id.**
- **Found during:** Task 1, in the planted-defect dry run, before any commit.
- **Issue:** the two own organizations had `sort_order` 1 and NULL in the order of their ids, so the listing was the same under `ORDER BY id`.
- **Fix:** they carry 2 and 1 against their ids; the listing expectation follows, and a planted `ORDER BY id` and a planted `NULLS FIRST` each turn both listing assertions red.
- **Files modified:** `44-nomination-parent-options.test.sql`. **Commit:** `fd6e610eb` (the corrected form is the only one committed).

### Other deviations

**1. File 42 changed in more places than the two the plan names.** The plan: the `parent_keys` expectation, and "one assertion more". An `entity_id` in the parent also falsifies every expectation that compares a parent with a whole object — seven of them, in four of which the literal was rewritten and in three of which it became a `jsonb_build_object` so that the id comes from `test_id` — and the assertion `'the answer holds neither the parent's id nor its description, …'`, whose first conjunct searched the answer for the parent's entity id. That conjunct is removed and the description reworded; the other three conjuncts stand. Without these the schema commit could not have been green. The header's two sentences were brought in line.

**2. Scratch runs through `psql`, outside the gate driver.** Before the red commit the three test files were run against the live database in rolled-back transactions: without the change (71 red across the three, no abort), with the two functions created inside the transaction (66, 70 and 39 green), and with the fifteen planted defects above; after the gate runs, the one read on seeded data. The dispatch says pgTAP runs only through the gate driver; these runs are not evidence, and no number of this summary comes from them except the planted-defect counts and the seeded-data reading. Nothing was stored: after the batches the database held no `pgtap` extension, no `get_nomination_parent_options`, and its 377 nominations and two grants. The schema edit was kept as `177-06-schema.patch`, the schema file put back with `git checkout --` on that one path before the red commit, and the patch applied again with `git apply` after the red run; the applied file was compared byte for byte with the copy the dry runs used. No E2E run was in flight (no `started` marker younger than forty minutes, nothing listening on 5173 or 5273). The scratch logs are kept under `177-unit/177-06-scratch/`.

**3. The red pgTAP run was made through the gate driver under a label of its own** (`177-06-pgtap-red`), as the dispatch asked, and its pgTAP row copied to `$U/177-06-pgtap-red.{log,exit}`.

**4. A third commit and a second gate attempt**, for the generated types (*Read this first*). The plan's step 3 provides for it.

**5. Two runs the plan does not name:** the `integration` row alone (`177-06-integration`), because the writer's integration test is the one consumer of the answer that gained a member and no E2E run closes this plan; and `yarn db:seed:default` after the gate runs, as plans 177-02 to 177-05 did.

**6. Four behaviours the plan's text leaves open, built and pinned** (each bears on item P-07, "the pairs are an argument"):
   - a contest asked twice is answered once, at the place first asked;
   - `nominated` follows the order asked;
   - a key of a contest other than the two ids is ignored, not refused;
   - a well-formed contest whose election is not one of the project is answered as "not nominated", not refused. The alternative, a NULL, would make one stale id in the caller's list refuse the whole read.

**7. "Read as ids" is `pg_input_is_valid (text, 'uuid')`**, a PostgreSQL 16 function, used so that the check is PostgreSQL's own reading and cannot disagree with the cast after it. The applied database is 17.6 and the project targets 17. It admits every form PostgreSQL's uuid input admits (upper case, braces, no hyphens), not the hyphenated lower-case form alone.

**8. Each refusal is one assertion through the instrument, not a `lives_ok` and an `IS NULL`** as file 42 has them; one direct `lives_ok` stands beside them. See *The instrument*.

**9. More assertions than the plan's step 2 lists, none left out**: the closed project (four), the project admin, the parent organization's editor, the id that names nothing and the caller's own id under another type, the two whole-object comparisons, the withheld-values search, the key set of `nominated`'s members, and the three "through the tables" controls that show why the function is a definer function.

**10. The function calls one definer function from inside another** — `private.nomination_exists_in_contest` once per option and asked contest, beside `private.caller_entity_ids` in the gate. The plan states it, and `get_entity_nominations` does the same for its gate; the database skill's rule against nesting is about policy quals evaluated per row of a table scan. The cost here is options × asked contests per call and was not measured.

**11. HEAD is on `feat/entity-signup-multi-grant`**, the branch the orchestrator named, not on a per-agent branch. `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not updated, on the orchestrator's instruction. Nothing was appended to `.planning/WINDOWS.md`.

## Code review checklist

Walked for the Supabase backend section and the general items that apply to SQL.

| Item | Outcome |
|---|---|
| Solves the issue | yes: an entity's editor can read the parties or alliances it may name, basic data alone, of its own project alone; the nominations read tells which entity a parent is |
| OWASP | broken access control and information disclosure are the subject: the gate is asked before any read and has a control for another editor, another project, both unserved types, the parent's editor and an admin; the projection is built key by key and a planted extra key turns five assertions red; no argument is concatenated into SQL; malformed input is a NULL and never an error message |
| No repeated code | the gate repeats the six lines of `get_entity_nominations`' gate, by the plan's direction ("word for word in form"); the existence question is asked of the one helper that defines it |
| Documented | the function's header states what it returns, the gate, the absence of defaults, the allow-list with the withheld columns, the NULL contract and why it is a definer function; `get_entity_nominations`' header names four parent keys |
| Repo documentation | **not updated**: see *Sentences the work made false* |
| Comment hygiene | the guard is 0 and `177-verdict.mjs hygiene` is 0 hits; every comment and test title added or changed was read for history and ids |
| `[db]` tag | on all three commits |
| RLS policies | none added or changed; 108 before and after |
| New definer functions | one: `search_path = ''`, every name schema-qualified, EXECUTE revoked from `PUBLIC` and `anon` by name, asserted by the catalogue assertion, the privilege twin and the census |
| pgTAP boundary and patterns | the file's own `BEGIN`/`ROLLBACK` and `create_test_data ()`; `is` and `ok` for values, `throws_ok` for the privilege refusal, `lives_ok` for the direct call |
| New tables, indexes, triggers | none |

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: resource | `apps/supabase/supabase/schema/503-entity-rpcs.sql` | `p_contests` has no upper bound on its length. Each asked contest costs one call of a definer helper per listed option, so a signed-in entity editor can ask for options × N existence probes in one call. The caller must hold an editor grant in the project and PostgREST's statement timeout bounds a call; nothing was measured and no cap was built, because the plan states none. Not in the plan's register. |

T-177-25 to T-177-29, as observed: the key set is pinned over every element for both caller types (25); another editor's entity and the caller's own entity under another project are NULL (26); the unconfirmed organization's absence is its own assertion (27); the census and the privilege twin hold the function, and `anon` is refused `42501` (28); NULL and `[]` are asserted as different answers for one caller (29). `service_role` keeps EXECUTE, as on `get_entity_nominations`; a service-role caller has no `auth.uid ()` and is answered NULL (read as the owner with no claims: NULL).

## Sentences the work made false, reported and not edited

- `.claude/skills/database/SKILL.md`: RLS and Auth Patterns § 4, "for `authenticated`, nine: the same six plus `claim_invitations`, `get_entity_basic_data` and `get_entity_nominations`" — ten, with `get_nomination_parent_options`; § 9, `parent` is "a JSON null, or exactly `entity_type`, `name` and `short_name`" — four keys, with `entity_id`; § 9 has no paragraph for the new function, and "It is the one SECURITY DEFINER function of the three" is now one of two definer reads beside two invoker ones; pgTAP § 1 and Key Source Locations, "42 files … `00` to `42`; there is no file `13`" and `Files=42, Tests=1957` — a run reports `Files=43, Tests=2182`, the files are `00` to `44`, and there is no file `13` and, until plan 177-07, no file `43`.
- `.claude/skills/database/schema-reference.md`: the row of `get_entity_nominations` states the parent as `entity_type`, `name`, `short_name`; there is no row for `get_nomination_parent_options`.
- `.claude/skills/database/rls-policy-map.md`: "the function returns the parent as an allow-list of `entity_type`, `name` and `short_name` and nothing else of it"; its test table has no row for `44-nomination-parent-options.test.sql`.
- `apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md`: "`parent` is `null` or an object of `entity_type`, `name` and `short_name`"; the page does not name the new function. A published docs page.
- `177-CONTEXT.md` D-09: "gated on the caller holding `nomination.edit` on an entity in that project". The gate built, as the plan states it, is the caller's editor grant on **the named entity**, read through `private.caller_entity_ids`; `user_can` is not asked. For an entity's editor the two agree; a project admin, who holds `nomination.edit` through `user_can`, is refused.
- `177-05-SUMMARY.md`: "pgTAP is `Files=42, Tests=2115`" and "the next free file number is still 43" describe the tree before this plan; the second is still true.
- `apps/frontend/src/lib/api/adapters/supabase/utils/entityNominations.ts`, the comment on `ParentSchema` ("its type and its two names") is still true of what the parser keeps and is plan 177-09's to change.

## Not done, or not verified

- **The election's project condition has no negative control.** The join `e.project_id = p_project_id` keeps the function from reading the `current_round` of another project's election, and the planted removal reddened nothing: `validate_nomination` refuses a nomination whose election is of another project, so no fixture the triggers admit can hold an option nominated at one. The header's sentence "A contest whose election is not one of p_project_id is never among them" is held by two layers and asserted through one of them (the other-project contest is answered as not nominated). *Inferred, not observed:* that the condition alone would hold it.
- **Nothing was observed through PostgREST** for the new function: no client calls it. That the answer arrives as written in a client's `data`, and that NULL arrives as `null`, is plan 177-09's integration test to show.
- **Not impersonated:** a project editor, a global admin, an organization with two editors, a user who edits two candidates of one project. An alliance's and a faction's own editor are impersonated, for the refusal alone.
- **`current_round` NULL** is not exercised: the two fixture elections are at rounds 1 and 2.
- **Cost** of a call with many contests was not measured (*Threat Flags*).
- **No E2E run**, by the plan's ruling 4; no axe scan and no overflow check apply. The unit, lint, check-frontend, build, format and docs-links rows did not run: the plan names six rows, and the integration row was added. `prettier --check` was run on the four hand-edited SQL files only.
- **`pmset -g log` was not read by hand**: nothing was red that was not meant to be; the driver's readings say no Sleep entry in any of the four windows.

## The state the local stack is left in

Read with `psql` after the gate runs and the re-seed:

- **The change:** `public.get_nomination_parent_options` exists with the properties above; the definer census is ten names for `authenticated` and six for `anon`; 108 policies in `public` and `storage`.
- **Data:** 1 project; 1 election; 328 candidates; 8 organizations; 2 alliances; 377 nominations; 2 auth users; 2 grants; 0 rows in `private.invitation_link_witness`. No project is locked.
- **pgTAP's helper functions** are in `public` since `177-06-db-r2`'s pgTAP row, until the next reset. The `pgtap` extension is not installed.
- **The stack:** up; neither it nor Docker was restarted. Three resets were made, each by the gate driver after its in-flight check. Nothing was pruned. AC power, 100 %. Docker VM free space after everything: 17.63 GiB (18,491,408 KiB).
- **The working tree:** clean but for the operator's untracked `CAND-APP-PLAN.md`. Phase 178's planning files were not touched or staged.

## Known Stubs

None.

## Evidence (gitignored)

- `tests/e2e-runs/177-gates/`: `177-06-pgtap-red`, `177-06-db` (with `db-types-drift.diff`), `177-06-db-r2`, `177-06-integration`.
- `tests/e2e-runs/177-unit/177-06-*`: `pgtap-red.{log,exit,head}`; `t1-verify.{sh,log,exit,head}`, `t1-verify-at-t2.log`, `t2-verify.{sh,log,exit,head}`; `extract-verify.mjs`; `commit-t1.sh`, `commit-t2.sh`, `commit-types.sh`; the drivers' launch logs and statuses (`pgtap-red-driver`, `db-driver`, `db-r2-driver`, `integration-driver`); `scope.log`, `hygiene-verdict.log`, `hygiene-t1.log`, `hygiene-t2.log`, `prettier-t2.log`; `schema.patch`, `schema-lines.txt`, `migration-lines.txt`, `schema-regenerate.log`, `parity.log`; `df-before-red.txt`, `df-before-db.txt`, `df-before-db-r2.txt`; `seed-default.{log,exit}`; `plan-start.txt`; `scratch/` (the dry-run and planted-defect logs and the DDL they ran).

## Self-Check: PASSED

The six changed files exist and are tracked; the three commits are ancestors of HEAD; both verify blocks exit 0 as written on a HEAD that is tree-equal to the plan's last commit outside `.planning/`.
