---
phase: 177-define-nominations
plan: 05
subsystem: database-schema
tags: [nominations, row-level-security, parent-policy, pairing, cap, permission-matrix, pgtap]
status: complete
requires:
  - "177-04: the symbol rule and the entity delete policy, pgTAP at Files=42 Tests=2090"
  - "177-03: the election-type rule and the deferred parent rule"
  - "177-01: 177-gates.sh, 177-verdict.mjs"
provides:
  - "entity_insert_parent_nominations: admits an organization's row or an alliance's; guard 3 asked with the row's own entity_type and id; guard 5 asked for the caller types that stand under the row"
  - "public.grant_role_permissions: the organization editor's arm holds nomination.create_parent"
  - "private.caller_nominated_in_contest (uuid, uuid, integer, public.grant_permission, public.entity_type[]): the fifth parameter p_caller_types"
  - "private.caller_unconfirmed_originated_count and the cap branch of public.enforce_nomination_confirmation: organization and alliance rows counted together; message start 'A caller may originate at most ', SQLSTATE P0001"
  - "private.nomination_id_in_contest (public.entity_type, uuid, uuid, uuid, integer) RETURNS uuid: no parent first, then the oldest, then the lowest id; NULL for none"
  - "pgTAP: the PAIR, G1, G3, G5, CAP, PERM and ID additions of 23-nominations-write (117 -> 141), one probe in 25-matrix-conformance (40 -> 41), one expectation of 12-user-can"
affects: [177-06, 177-07, 177-09, 177-21]
tech-stack:
  added: []
  patterns:
    - "a policy guard paired by an array argument: the helper is asked for the caller types the row's type admits, and the array is chosen so that the type guard beside it stays load-bearing"
    - "a permission shown separately revocable by taking it out of the matrix inside the test transaction: the matrix function renamed, a function of its name answering the renamed one's set without the verb, then both put back"
    - "a lookup asserted through dynamic SQL in a pg_temp instrument, so a database without the function reports failed expectations and not an aborted file"
key-files:
  created: []
  modified:
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/schema/302-rls.sql
    - apps/supabase/supabase/schema/011-validation-functions.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/23-nominations-write.test.sql
    - apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql
    - apps/supabase/supabase/tests/database/12-user-can.test.sql
decisions:
  - "Guard 5's caller types are chosen by whether the row is an alliance's and by nothing else, so a candidate's or a faction's row is refused by guard 1 alone and guard 1 keeps a negative control of its own"
  - "The PERM section takes nomination.create_parent out of the matrix inside the transaction, because after this plan no entity role holds nomination.edit without it"
  - "The cap message's second sentence is unchanged: it names no entity type"
requirements-completed: [NOM-04]
metrics:
  started: "2026-10-11T01:16:30Z"
  completed: "2026-10-11T01:37:13Z"
  duration: "20 minutes"
  tasks: 2
  files: 7
actuals:
  tokens: 17760 # chars/4 over git diff 120c36c70..80d3f515f -- apps packages (71,046 characters, the generated migration included)
  tasks: 2
  commits: 2 # git rev-list --count 120c36c70..80d3f515f
plan_head_before: 120c36c70a754b2e15830e310dec37f50419a650
plan_head_after: 80d3f515f706917ae31198e94e4686fa0dda3ea2
---

# Phase 177 Plan 05: The Parent Policy Widened to an Alliance's Row, Paired by Type — Summary

`entity_insert_parent_nominations` now admits an alliance's row beside an organization's, the organization editor's role holds `nomination.create_parent`, and guard 5 is asked for the caller types the row's type admits — a candidate or a faction for an organization's row, an organization for an alliance's — so the two crossed pairings are refused; guard 3 is asked with the row's own type and id; the cap of 10 counts both parent types in the helper, the policy and the trigger under one reworded message; and `private.nomination_id_in_contest` answers which nomination an entity holds at a contest by a stated order. 26 new pgTAP assertions (25 in file 23, one in file 25), with one removed and two expectations changed, hold it, committed red (17 failing, each an expectation) before the schema that turns them green.

`requirements-completed` names NOM-04 because the plan's frontmatter does; this plan delivers the database half of an organization creating its alliance's nomination. `REQUIREMENTS.md`, `STATE.md` and `ROADMAP.md` were not touched.

## Read this first

- **Both verify blocks exit 0 as written.** Neither searches SQL for a message with an apostrophe; the defect of plan 177-04's verify does not recur here.
- **The plan's `PERM:` caller does not exist.** The plan asks for a caller that "holds `nomination.edit` on an entity nominated at the contest and does not hold `nomination.create_parent` after this plan". `grant_role_permissions` has no such row: the candidate's, faction's and alliance's editors share one row that holds both, the organization's editor now holds both, the project and wider roles hold both, and an entity-scope `admin` grant holds neither. The section instead takes the verb out of the matrix inside the test transaction and puts it back. See *Deviations*, 1.
- **A faction's editor cannot create its own organization's row, before or after this plan.** `validate_nomination` requires a faction's nomination to stand under its own organization's nomination, so that organization is always nominated where the faction is, and guard 3 refuses a second row for it. The organization's row a faction's editor creates through this policy is always another organization's. Item P-04 is built as ruled (kept); this bears on the operator's reading of it. See *Deviations*, 2.
- **After this plan every entity editor role holds `nomination.create_parent`, and the alliance's editor can never use it**: no row's type admits an alliance as the caller's type. Nothing was changed on that; it is reported.
- **No types commit was needed.** `types-clean` was green on the first attempt: no function of `public` changed its signature and `private` is not in the generated types. `packages/supabase-types/src/database.ts` and `apps/supabase/scripts/lint-schema.mjs`, both in the plan's `files_modified`, are unchanged, and there is no `177-05-db-r2`.
- **No ratified list moved.** The SQL lint said 0 errors and the three warnings it had; no pgTAP file other than the three of Task 1 turned red.
- **No E2E run was made**, as the plan's ruling 6 says. The latest full run is still `tests/e2e-runs/177-e2e/177-03-close`.
- **pgTAP is `Files=42, Tests=2115`.** The next free file number is still 43.

## Task Commits

| Task | Commit | Subject | Files |
|---|---|---|---|
| 1 | `7bbc4e8d8` | test(177-05): an organization creates its alliance's nomination, paired by type, under the same guards and cap [db] | `23-nominations-write.test.sql`, `25-matrix-conformance.test.sql`, `12-user-can.test.sql` |
| 2 | `80d3f515f` | feat(177-05): an organization creates its alliance's nomination under the parent policy, paired by type [db] | `301-auth-functions.sql`, `302-rls.sql`, `011-validation-functions.sql`, `00001_initial_schema.sql` |

Head before the plan's first commit: `120c36c70`. Two commits, measured with `git rev-list --count 120c36c70..80d3f515f`. Seven files, 919 insertions, 76 deletions. (The plan was read at `245a2dc7a`; two commits of Phase 178's planning by another agent landed before the first commit of this plan.)

## Each task's verify command, with its real exit status

Each `<automated>` block was written byte for byte to `tests/e2e-runs/177-unit/177-05-t<N>-verify.sh` by `177-05-extract-verify.mjs`, which reads the plan, and run with `bash`. Log, status and head are beside each.

| Verify | Head | Exit |
|---|---|---|
| Task 1 | `7bbc4e8d8` | 0 |
| Task 1, again | `80d3f515f` | 0 |
| Task 2 | `80d3f515f` | 0 |

`177-verdict.mjs gates 177-05-db --rows db-reset,types-regen,types-clean,pgtap,sql-lint`: 0, PASS, not stale, no Sleep entry in the window. `177-verdict.mjs scope`: 0, PASS. `177-verdict.mjs hygiene`: 0, 0 hits, 0 advisory lines. `yarn assert:comment-hygiene` on the working tree before each commit: 0 and 0. `yarn assert:schema-migration-parity`: 0. `yarn assert:grant-permission-enum`: 0 (`grant_permission: 23 / 23 / 23`). `prettier --check` on the three test files and the three hand-edited schema files: 0.

## Task 1 — the assertions, red

### What the three files hold

**`23-nominations-write.test.sql`: plan 117 -> 141.** 25 assertions added and one removed (the old `PERM:`), counted by pgTAP itself. The new guard block sits between `ORIG` and the first `CAP` block, so no caller is at the cap when its guards are asserted; the second cap boundary follows the first; `PERM` and `ID` follow.

| Tag | Assertions | What |
|---|---|---|
| `G1: ` | 2 | organization_a, whose organization is nominated at round 70, creates the nomination of an alliance that has none there; read as the owner the row is `false/<organization_a>` |
| `G1-neg: ` | 1 new, 1 reworded | a faction's row (a second faction of organization A, with its organization's nomination as parent) from candidate_a at round 70: `42501`; the existing candidate-row control keeps its statement and has a description that names both admitted types |
| `PAIR-neg: ` | 3 | organization_a refused another organization's row at round 70, where its own organization and a faction under it are nominated; candidate_a refused an alliance's row at round 70; the faction's editor refused an alliance's row at round 70 |
| `PAIR: ` | 2 | candidate_a at round 70 creates an organization's row; the faction's editor at round 70 creates an organization's row |
| `G3: ` | 2 | an alliance already nominated at round 70 gets no second row from organization_a (`42501`); the same insert for an alliance with none lives |
| `G5-neg: ` | 1 | organization_a refused an alliance's row at round 81, where organization A holds no nomination |
| `CAP: ` | 1 changed, 4 new | the existing boundary's pattern is `%at most 10 unconfirmed parent nominations%`; second boundary for organization_a with nine rows recorded — three of other organizations, two of its own organization, four of alliances: the count helper answers 9, the tenth (an alliance's row) lives, the eleventh is refused with the pattern, and again with `P0001` and the whole message |
| `PERM: ` | 3 (replacing 1) | with the verb out of the matrix candidate_a2 still holds `nomination.edit` on its own entity and not `nomination.create_parent` (`true/false`); it is refused an organization's row at round 4, where it holds a nomination; with the matrix put back the same statement lives |
| `ID: ` | 7 | the lookup is `STABLE`, `SECURITY DEFINER`, `search_path = ''`, in `private`, executable by `authenticated`; nominated once -> that id; none -> NULL; another type than the entity's -> NULL; no parent beats older and lower id; of two with a parent the older beats the lower id; of two of one age the lower id |

Fixtures of the file's own, all in the `12121212-…` range: thirteen alliances (`…54NN`), twelve organizations (`…55NN`), a second faction of organization A (`…5701`), a faction editor (`…5601`, an `auth.users` row and its grant), nominations `…7001` and `…8001` to `…8009`. Rounds 70 to 81 are taken in that file, beside those plan 177-04 listed.

**Which caller `PERM:` uses, and why:** candidate_a2, the caller of the file's `G5` pair, at round 4 where it holds a nomination and has already created an organization's row. No caller of the shipped matrix holds `nomination.edit` without `nomination.create_parent`, so the section's negative control is the same caller with that one verb withheld: `public.grant_role_permissions` is renamed to `grant_role_permissions_whole` and a function of the original name answers `array_remove (<the whole set>, 'nomination.create_parent')`; afterwards the wrapper is dropped and the name put back, and the third assertion shows the same statement admitted. All of it is inside the file's rolled-back transaction.

**`25-matrix-conformance.test.sql`: plan 40 -> 41.** The grid records the target each row was probed at (a `probe` column), the probe list gains `ARRAY['nomination.create_parent', 'entity', 'org_a', 'organization']`, the existing row is read `AND probe = 'alliance_a'` and keeps `'TTTTfffTff'`, and the new assertion reads the probe at `org_a` and expects `'TTTTfTffff'`, with a comment that states each of the ten identities.

**`12-user-can.test.sql`: plan 45, unchanged.** Of the population (`git grep -n "nomination.create_parent"`: nine sites, none of them the organization editor's), the one case that asks the organization editor about its own organization is the answer vector at `pg_temp.allowed ('entity', test_id ('org_a'), 'organization')`; it gains `nomination.create_parent` as its last member. Section 11 asks that editor about its child nominee, not its own organization, and is unchanged.

### The red run

Commit `7bbc4e8d8`, through the gate driver (`177-gates.sh 177-05-pgtap-red --rows db-reset,pgtap`), kept as `tests/e2e-runs/177-unit/177-05-pgtap-red.{log,exit,head}`: db-reset 0, pgtap **1**; `Files=42, Tests=2115`, `Result: FAIL`. Three files failed, none aborted (`Wstat: 0` on each):

- `12-user-can` — 1 of 45: test 16, the organization editor's vector without its last member.
- `25-matrix-conformance` — 1 of 41: test 27, `have: TTTTffffff`, `want: TTTTfTffff`.
- `23-nominations-write` — 15 of 141: tests 31-32, 35, 43-47, 51-57. Three inserts `died: 42501` (31, 35, 45); two values differ (32 `NULL`, 44 `5` where `9` is wanted); 43 caught the old message and 46 the row-level-security message, neither matching the pattern; 47 `caught: 42501`, `wanted: P0001` with the whole message; 51 `NULL`; 52 to 57 `have: no such function`.

The 126 of file 23 that passed are 115 of the 116 kept of the file as it was (the 116th is test 43, the first cap boundary's pattern) and the eleven new controls a database without the change also satisfies: the six refusals of the pairing block (three `PAIR-neg:`, `G3:`, `G5-neg:`, the faction `G1-neg:`), the two `PAIR:` positives, and the three `PERM:` assertions.

## Task 2 — the role, the helpers, the trigger and the policy

### What the schema holds

- **`public.grant_role_permissions`**: the organization editor's arm ends `'nomination.read', 'nomination.create_parent'`; its comment says an organization creates the nomination of the alliance it stands under. The comment of the shared arm adds that which row a holder may create is the parent policy's question, and that no row's type admits an alliance's editor.
- **`private.nomination_id_in_contest (p_entity_type public.entity_type, p_entity_id uuid, p_election_id uuid, p_constituency_id uuid, p_election_round integer) RETURNS uuid`**, `LANGUAGE sql STABLE SECURITY DEFINER`, `search_path = ''`, directly after `nomination_exists_in_contest` and above `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private`. The match of `nomination_exists_in_contest`; `ORDER BY (n.parent_nomination_id IS NOT NULL), n.created_at, n.id LIMIT 1`. Its header states what it answers, why it is a definer function, NULL for none, the order and the pgTAP file.
- **`private.caller_nominated_in_contest`**: fifth parameter `p_caller_types public.entity_type[]` and the conjunct `n.entity_type = ANY (p_caller_types)`. The header states the question as it is, the three statements a child writes and that `validate_nomination_parent_required` judges the first row when the transaction ends.
- **`private.caller_unconfirmed_originated_count`**: `(n.organization_id IS NOT NULL OR n.alliance_id IS NOT NULL)`. Its header says whose entity a row nominates is not asked.
- **`public.enforce_nomination_confirmation`**, the cap branch: `(NEW.organization_id IS NOT NULL OR NEW.alliance_id IS NOT NULL)`; the message is `A caller may originate at most 10 unconfirmed parent nominations; this caller already holds %. An administrator must confirm or reject some before more can be created.`; no `ERRCODE`, so `P0001`.
- **`entity_insert_parent_nominations`**: guard 1 `(organization_id IS NOT NULL OR alliance_id IS NOT NULL)`; guard 3 `private.nomination_exists_in_contest (entity_type, COALESCE(organization_id, alliance_id), …)`; guard 5 `private.caller_nominated_in_contest (…, 'nomination.create_parent', CASE WHEN alliance_id IS NOT NULL THEN ARRAY['organization']::public.entity_type[] ELSE ARRAY['candidate', 'faction']::public.entity_type[] END)`; the unconfirmed conjunct, the lock, the cap conjunct and the project agreement as they were. The comment is rewritten guard by guard and names the pairing and the faction's case.

`yarn schema:regenerate`: 0, 8,108 lines. The 86 changed lines of the migration were compared by command with the changed lines of the three schema files: identical.

### The database rows

| Run | Head | db-reset | types-regen | types-clean | pgtap | sql-lint | Driver |
|---|---|---|---|---|---|---|---|
| `177-gates/177-05-pgtap-red` | `7bbc4e8d8` | 0 | — | — | **1** | — | 1 |
| `177-gates/177-05-db` | `80d3f515f` | 0 | 0 | 0 | 0 | 0 | 0 |

- pgTAP in `177-05-db`: `Files=42, Tests=2115`, `Result: PASS` — 2090 and a net 25 (file 23: 25 added and one removed; file 25: one added).
- **What the SQL lint said:** `No schema errors found`; `Summary: 0 error(s), 3 warning(s)` — the three unindexed foreign keys it had (`constituency_group_constituencies.constituency_id`, `election_constituency_groups.constituency_group_id`, `nominations.created_by`); the 9001 census line reads `policies examined: 108, tables partitioned: 21, permission members: 23 (row-level-security tables in public+storage: 31)`, as in plan 177-04's run. No entry of `SAME_PERMISSION_ALLOW`, `MECHANISM_HELPERS` or `REACHES_NEITHER_ALLOW` was added, moved or removed, and neither was `m17_unenforced_ratified` in file 25.
- Before each run: AC power, 100 %; Docker VM free space 17.90 GiB (18,772,784 KiB) before the red run and 17.96 GiB (18,836,548 KiB) before `177-05-db`; no E2E run in flight. No Sleep entry in either window.
- Read from the applied database after the run: `private.caller_nominated_in_contest` exists once, with five parameters; all four nomination helpers are definer functions executable by `anon`, `authenticated` and `service_role`; the policy's stored `with_check` holds the three changed guards; the organization editor's set ends in `nomination.create_parent`.

## For later plans

**For plan 177-07 — the lookup, as written:**

```sql
private.nomination_id_in_contest (
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_election_id uuid,
  p_constituency_id uuid,
  p_election_round integer
) RETURNS uuid  -- LANGUAGE sql STABLE SECURITY DEFINER, search_path = ''
-- ORDER BY (n.parent_nomination_id IS NOT NULL), n.created_at, n.id LIMIT 1
```

NULL where the entity holds no nomination at the contest, and where the type asked is not the entity's. `election_round` is matched with `IS NOT DISTINCT FROM`. It is not in the generated types (`private`), so a function of `public` calls it qualified.

**For plan 177-09 — the cap refusal, as PostgreSQL reports it** (matched whole by `throws_ok`):

| What | SQLSTATE | Message |
|---|---|---|
| The eleventh unconfirmed organization or alliance row a caller originates | `P0001` | `A caller may originate at most 10 unconfirmed parent nominations; this caller already holds 10. An administrator must confirm or reject some before more can be created.` |

The start `A caller may originate at most ` and the pattern `at most 10 unconfirmed parent nominations` are both in it; the number after "holds" is the caller's count, which is 10 at the boundary and can be higher for a caller whose rows were recorded by another path.

- **The cap now binds an alliance's row whoever it belongs to** (177-07, 177-17): an unconfirmed alliance row inserted by an `authenticated` caller without `project.edit_nominations` meets the cap branch, the alliance's own editor inserting its own alliance's nomination included. *Inferred from the code, not asserted:* no test impersonates an alliance's editor.
- **A caller's own organization's unconfirmed rows count** — asserted: two of the nine rows of the second boundary are organization A's own, created by its editor. Option (b) of item P-03 would change that boundary and the count assertion beside it.
- **A placeholder for an alliance with a symbol** meets the column rule of plan 177-04 before the cap, as an organization's does: the row is not the caller's own. *Inferred from the trigger order plan 177-03 recorded, not asserted for an alliance.*
- **The helper has one signature.** A `CREATE OR REPLACE` with five parameters beside a database that still holds the four-parameter function makes an overload; on a reset database there is one. Only the gate's reset row shows that.
- **pgTAP now:** `Files=42, Tests=2115`; `23-nominations-write` plans 141, `25-matrix-conformance` 41; the next free file number is 43.
- **`created_by` of a row the owner inserts in a pgTAP file — observed, no longer inferred.** In a rolled-back transaction (`177-05-created-by-probe`, scratch): a row the owner inserts before any impersonation has `created_by` NULL; after `set_test_user ('authenticated', candidate_a, …)` and `reset_role ()` it has candidate_a's id, and `auth.uid ()` still answers candidate_a's id while `current_user` is `postgres`; after `set_test_user ('anon')` and `reset_role ()` it is NULL again. `reset_role ()` changes the role and leaves the claims; `set_test_user ('anon')` clears them. Both cap blocks of file 23 clear their caller's authorship and state `created_by` on the rows they record, so neither reading is relied on.

## Observed beyond the plan's assertions

**Fifteen planted defects, each seen caught** (scratch runs in rolled-back transactions, not evidence of the suite; *Deviations*, 4). Each ran file 23 against the changed functions and policy with one thing altered:

| Planted | Red |
|---|---|
| guard 1 removed | 2: both `G1-neg:` (the candidate's row, the faction's row) |
| guard 1 admitting an organization's row only | 6: the alliance positives and the second cap boundary |
| guard 3 with the literal `'organization'` and `organization_id` | 1: `G3:` the alliance already nominated |
| guard 5 without the caller-type conjunct | 3: the three `PAIR-neg:` |
| an alliance's row also admitting candidate and faction callers | 2: the candidate's and the faction editor's `PAIR-neg:` |
| an organization's row also admitting an organization caller | 1: the organization editor's `PAIR-neg:` |
| an organization's row admitting a candidate caller only (the other option of item P-04) | 1: the faction editor's `PAIR:` |
| guard 5 asking `nomination.edit` | 2: `PERM:` the refusal and its twin |
| guard 5 removed | 9: `G5-neg`, `G5`, `G5-scope`, the alliance `G5-neg:`, the three `PAIR-neg:`, two `PERM:` |
| the count helper counting organization rows only | 3: the count, the eleventh twice |
| the trigger's branch for organization rows only | 2: the eleventh twice (refused by the policy with `42501`, not the named message) |
| the organization role without the permission | 6 |
| the lookup's order without "no parent first" | 1 |
| the lookup's order without `created_at` | 1 |
| the lookup's order with the id descending | 1 |

**The seed under the changed schema:** `yarn db:seed:default` after the gate run, exit 0, 752 rows, 377 nominations.

**The two dev-seed tests that read the migration file** (`allowedTeardownTables`, `permittedKeys`): 35 of 35 passed on `80d3f515f`. The unit row of the gate set was not run; the plan names five database rows.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The first form of the alliance `G5-neg:` control stood at a contest where organization A is nominated.**
- **Found during:** Task 1, in the dry run against the changed schema, before any commit.
- **Issue:** the control used round 7, the file's "candidate_a holds no nomination" contest. Section 5 of the file stores a nomination of organization A at round 7, so the organization's editor satisfied guard 5 there and the insert lived.
- **Fix:** the control stands at round 81, where nothing is nominated; the section header's list of contests says so.
- **Files modified:** `23-nominations-write.test.sql`. **Commit:** `7bbc4e8d8` (the corrected form is the only one committed).

### Other deviations

**1. `PERM:` is not built with the caller the plan describes, because no such caller exists.** See *Read this first*. The plan: "its caller is one that holds `nomination.edit` on an entity nominated at the contest and does not hold `nomination.create_parent` after this plan — read `grant_role_permissions` for which entity role that is". Read: none. What was built instead shows the same thing — the verb is separately revocable — on the shipped policy: the verb is withdrawn from every row of the matrix inside the transaction, the caller is shown to keep `nomination.edit` and lose `nomination.create_parent`, the insert is refused `42501`, and with the matrix back the same statement lives. It asserts against a matrix the tree does not ship for three statements; the alternative, a structural assertion that the policy text names the literal, would not have caught guard 5 asking `nomination.edit` behaviourally (the planted defect above did: 2 red). Whether the alliance's editor should keep a permission it cannot use is not this plan's to decide; if it lost it, an alliance's editor would be the caller the plan describes.

**2. "A faction's editor creates its organization's row" is asserted as "an organization's row".** The plan's `PAIR:` text and item P-04 say "its organization's row". That row cannot be created through this policy by a faction's editor: the faction's nomination must stand under its own organization's nomination (`validate_nomination`, "Faction nomination parent must be the nomination of the faction's OWN organization"), so the organization is nominated wherever the faction is and guard 3 refuses. What the kept pairing admits is a faction's editor creating **another** organization's placeholder at a contest where its faction stands. The assertion's description and the policy's comment say that. Item P-04 was built as ruled; the other option is one array in the policy, and the planted defect for it turned exactly the faction's `PAIR:` red.

**3. Guard 5's array is chosen by `alliance_id IS NOT NULL` with an `ELSE`, not by a two-armed `CASE` on both row types.** For an organization's row and an alliance's row it passes exactly what the plan states. For a candidate's or a faction's row — which guard 1 refuses — it passes the candidate-and-faction array rather than NULL. With a NULL there, guard 5 would refuse those rows too and removing guard 1 would redden nothing; with the `ELSE`, the planted removal of guard 1 turned both `G1-neg:` assertions red. This follows the policy's own stated rule for the project-agreement conjunct ("so it does not silently do guard 1's job and mask guard 1's removal") and PROH-177-14's "left without its own negative control". The cost: were guard 1 ever removed, the policy would admit a candidate's or a faction's row from a candidate's or faction's editor, as it would have before this plan.

**4. Scratch runs through `psql`, outside the gate driver.** Before the red commit the three test files were run against the live database in rolled-back transactions: without the change (17 red across the three files, no abort), with the changed functions and policy created inside the transaction (141, 41 and 45 green), with the fifteen planted defects above, and the `created_by` probe. The dispatch says pgTAP runs only through the gate driver; these runs are not evidence, and no number of this summary comes from them except the planted-defect counts and the probe's three readings. Nothing was stored: after each batch the database held no `pgtap` extension, one `grant_role_permissions`, the four-parameter helper and its 377 nominations. The schema edits were kept as `177-05-schema.patch`, the three schema files put back with `git checkout --` on those three paths before the red commit, and the patch applied again with `git apply` after the red run. No E2E run was in flight (no `started` marker younger than thirty minutes, nothing listening on 5273 or 5173).

**5. The red pgTAP run was made through the gate driver under a label of its own** (`177-05-pgtap-red`), as the dispatch asked, and its pgTAP row copied to `$U/177-05-pgtap-red.{log,exit}`.

**6. More assertions than the plan's steps list, none left out**: the alliance `G5-neg:`, the owner read of the alliance row, the count helper read directly at 9, the eleventh asserted a second time with `P0001` and the whole message, three `PERM:` assertions for one, and for `ID:` the function's shape, the type control and the lowest-id step of the order.

**7. Existing statements changed, not only added to.** The old `PERM:` assertion and its fixture row (organization A at round 9) are gone; the first `CAP:` pattern is the new one; the candidate `G1-neg:` has a description and comment that name both admitted row types; the statement at the head of the `SYM` section that clears candidate_a's authorship now clears organization_a's too, because the second cap boundary leaves that caller at the cap and the `SYM` section has it insert an organization's row. In file 25 the grid table has a fourth column and the existing `nomination.create_parent` row a second filter; its string is unchanged.

**8. The cap message's second sentence was not reworded.** The plan says "with its remaining sentence brought in line"; `An administrator must confirm or reject some before more can be created.` names no entity type and is as it was.

**9. No types commit, no `-r2` run and no edit of `lint-schema.mjs`**, because `types-clean` and the SQL lint were green (*Read this first*).

**10. `yarn db:seed:default` was run after the gate run** (exit 0, 752 rows), as plans 177-02 to 177-04 did.

**11. HEAD is on `feat/entity-signup-multi-grant`**, the branch the orchestrator named, not on a per-agent branch. `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not updated, on the orchestrator's instruction. Nothing was appended to `.planning/WINDOWS.md`.

## Code review checklist

Walked for the Supabase backend section and the general items that apply to SQL.

| Item | Outcome |
|---|---|
| Solves the issue | yes: an organization's editor can create the nomination of an alliance that has none at its contest, and nothing wider |
| OWASP | broken access control is the subject: both crossed pairings are refused and each guard has a control that a planted removal turned red; the helper answers false for a NULL or empty type array; the lookup is in `private`, which PostgREST does not expose, and answers one uuid or NULL |
| No repeated code | the lookup repeats the six-line match of `nomination_exists_in_contest` — by the pattern file's direction, and a definer function calling another is never inlined; the cap's condition is written in the helper and in the trigger, as before |
| Documented | every changed function's header and the policy's numbered comment state the code as it is |
| Repo documentation | **not updated**: see *Sentences the work made false* |
| Comment hygiene | the guard is 0 and `177-verdict.mjs hygiene` is 0 hits; every comment added or changed was read for history and ids |
| `[db]` tag | on both commits |
| RLS policies specify the role; scalar-subquery form | `TO authenticated`; every helper call is a `(SELECT …)` |
| New definer functions | one, `private.nomination_id_in_contest`: `search_path = ''`, every name qualified, asserted by pgTAP |
| Trigger naming | unchanged |
| pgTAP boundary and patterns | the files' own `BEGIN`/`ROLLBACK`; `throws_ok` and `throws_like` for refusals, `lives_ok` then an owner read for a row the caller cannot read |
| New tables, indexes | none |

## Threat Flags

None beyond the plan's register. T-177-22, accepted there, as observed: the lookup is executable by `anon` as well as `authenticated` and `service_role`, as every function of `private` defined above the grant is.

## Sentences the work made false, reported and not edited

- `apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md`, the role table: the row "entity `editor` of an organization" lists no `nomination.create_parent`. A published docs page.
- `.claude/skills/database/rls-policy-map.md`: the matrix row `nomination.create_parent` has "—" in the organization editor's column; the two mentions of `caller_nominated_in_contest` describe four arguments; the list of nomination write guards has no `nomination_id_in_contest`.
- `.claude/skills/database/SKILL.md`: the list of `private` helpers under RLS and Auth Patterns § 4 has no `nomination_id_in_contest` (it is not policy-only: the write function of plan 177-07 calls it); the pgTAP counts (a run now reports `Files=42, Tests=2115`).
- `177-04-SUMMARY.md`: "pgTAP is `Files=42, Tests=2090`" and "`23-nominations-write` plans 117" describe the tree before this plan.
- `177-CONTEXT.md`, facts 9 and 10 of its baseline, and the sentence that a faction's editor "may create its organization's row" (item P-04 of the execution rules): the first two describe what this plan changed, by design; the third is not what the policy admits (*Deviations*, 2).
- The header of section 7 of `23-nominations-write.test.sql` still says "the five guards" and carries older ids and history; only its list of contests was extended.

## Not done, or not verified

- **Nothing was observed through PostgREST.** The cap message is PostgreSQL's, matched in pgTAP; that it arrives unchanged in a client's `error.message` is plan 177-09's integration test to show.
- **Roles not impersonated:** an alliance's own editor (the cap on its own row is inferred), and a project editor. A faction's editor is impersonated, for the first time in this file.
- **Guards 2 and 4 and the project agreement have no control of their own for an alliance's row.** They are the same conjuncts for both row types and their controls use organization rows.
- **Two simultaneous placeholders for one alliance** were not exercised; the uniqueness key is unchanged.
- **No E2E run**, by the plan's ruling 6; no axe scan and no overflow check apply. The integration, unit, lint, typecheck, build and format rows did not run: the plan names five database rows. `prettier --check` was run on the six hand-edited SQL files only, and two dev-seed test files were run by hand.
- **`pmset -g log` was not read by hand**: nothing was red that was not meant to be; the driver's readings say no Sleep entry in either window.

## The state the local stack is left in

Read with `psql` after the gate run and the re-seed:

- **The change:** `entity_insert_parent_nominations` holds the three changed guards; `private.nomination_id_in_contest` exists; `private.caller_nominated_in_contest` has five parameters; 108 policies in `public` and `storage`.
- **Data:** 1 project; 1 election; 328 candidates; 377 nominations; 2 auth users; 0 rows in `private.invitation_link_witness`. No project is locked.
- **pgTAP's helper functions** are in `public` since the gate run's pgTAP row, until the next reset. The `pgtap` extension is not installed.
- **The stack:** up; neither it nor Docker was restarted. Two resets were made, each by the gate driver after its in-flight check. Nothing was pruned. Nothing listens on port 5273. AC power, 100 %. Docker VM free space after everything: 17.79 GiB (18,649,804 KiB).
- **The working tree:** clean but for the operator's untracked `CAND-APP-PLAN.md`. Phase 178's planning files were not touched or staged.

## Known Stubs

None.

## Evidence (gitignored)

- `tests/e2e-runs/177-gates/`: `177-05-pgtap-red`, `177-05-db`.
- `tests/e2e-runs/177-unit/177-05-*`: `pgtap-red.{log,exit,head}`; `t1-verify.{sh,log,exit,head}`, `t1-verify-at-t2.log`, `t2-verify.{sh,log,exit,head}`; `extract-verify.mjs`; `commit-t1.sh`, `commit-t2.sh`; the drivers' launch logs and statuses (`pgtap-red-driver`, `db-driver`); `db-verdict.log`, `scope.log`, `hygiene-verdict.log`, `hygiene-wip.log`, `hygiene-t2.log`; `schema.patch`, `schema-lines.txt`, `migration-lines.txt`, `schema-regenerate.log`, `parity.log`, `grant-enum.log`; `df-before-red.txt`, `df-before-db.txt`; `seed-default.{log,exit}`; `devseed-sql-readers.log`; `plan-start.txt`. The scratch dry runs, the planted-defect logs and the `created_by` probe are in the session's scratch directory and are not kept.

## Self-Check: PASSED

The seven changed files exist and are tracked; both commits are ancestors of HEAD; both verify blocks exit 0 as written on a HEAD that is tree-equal to the plan's last commit outside `.planning/`.
