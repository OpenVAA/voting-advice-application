---
phase: 176-contestant-home-task-state-nominations-view
plan: 02
subsystem: database
tags: [postgres, supabase, rpc, security-definer, pgtap, nominations, migration, generated-types]

requires:
  - phase: 176-contestant-home-task-state-nominations-view
    provides: "plan 176-01 — 176-BASE, the drivers, the baseline (41 pgTAP files / 1888 tests on a freshly reset database)"
  - phase: 175-organization-editing-profile-questions-preview
    provides: "the schema as of 4c930217c; private.caller_entity_ids; the one-migration workflow"
provides:
  - "public.get_entity_nominations (p_project_id uuid, p_entity_type public.entity_type, p_entity_id uuid) RETURNS jsonb — an entity's own nominations with the election's and constituency's names and the parent resolved; NULL for every refusal, an empty array for no nomination"
  - "pgTAP file 42-entity-nominations.test.sql, plan (69)"
  - "the authenticated census of 07-rpc-security.test.sql naming the function; the anon census unchanged"
  - "the regenerated migration (7859 lines) and the function's generated type"
affects: [176-05, 176-12, 176-19, 177]

actuals:
  tokens: 13400 # chars/4 over the realized diff of this plan's 5 files (53487 chars)
  tasks: 2
  commits: 8 # MEASURED: git rev-list --count 746714c56..3bd66ff39 when this file was written. The checkout is shared: 3 are this plan's (subjects carrying "(176-02)"), 5 are plan 176-03's. The commit of this file follows.
plan_head_before: 746714c56cbbf18b70848911969f2700ed4a86da
plan_head_after: 3bd66ff39695173826297a0e327f4f7fe089800f

tech-stack:
  added: []
  patterns:
    - "A definer read that refuses with NULL writes its gate as a positive match tested with IS NOT TRUE, so a NULL comparison refuses instead of falling through"
    - "A function that serves two of the four entity types names them in its gate; a type with a grant arm and no served arm is refused, not answered with an empty list"
    - "A new pgTAP file is checked against a draft of the function inside one rolled-back transaction, and against deliberately wrong drafts, before its red commit"

key-files:
  created:
    - apps/supabase/supabase/tests/database/42-entity-nominations.test.sql
  modified:
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
    - packages/supabase-types/src/database.ts

key-decisions:
  - "An unserved entity type (faction, alliance) is answered with NULL by an explicit served-type condition in the gate — a departure from the research's sketch, accepted by the orchestrator"
  - "The gate is fail-closed: (served type AND id among the caller's entities) IS NOT TRUE refuses — a departure from the sketch's NOT IN (SELECT …), accepted by the orchestrator"
  - "The entity is matched on the foreign key of its own type, one arm per served type, so an index on that key can serve the read"
  - "One extra reset before the red run, on the orchestrator's ruling (option A of the checkpoint)"

requirements-completed: [] # NOM-02 is served in its database half here; the view that completes it is plan 176-12's

duration: about 17 min from the first command to the closing verify, in two parts around one checkpoint; the reading before it was not timed
completed: 2026-10-09
status: complete
---

# Phase 176 Plan 02: An Entity's Own Nominations, with the Parent Resolved — Summary

**`public.get_entity_nominations` answers the editor of a candidate or an organization with that entity's nominations — confirmed or not, each with the election's and constituency's names and its parent as entity type, name and short name — and answers everyone else with NULL; 69 pgTAP cells hold it, red first; pgTAP is 42 files / 1957 tests green on a database reset from the regenerated migration, with the types drift-free and the SQL lint at 0 errors.**

Everything below was measured in this session unless it says "read" or "inferred".

## Read this first

1. Both tasks are done and both verify blocks exit **0**, run byte for byte from the plan.
2. The plan stopped once, at Task 1 step 4, and went on after the orchestrator's ruling. The first red run showed a third red file caused by the database's contents. **One reset was added before the red run** (deviation 1): three resets, not two.
3. **Two departures from the research's sketch of the function**, both ruled on: an unserved type is refused in the gate, and the gate is fail-closed (deviations 2 and 3).
4. **A finding for the closing plan**: a pgTAP assertion reads `private.invitation_link_witness` whole and goes red on any database an E2E run with invitation links has touched (its own heading below).
5. The database is left with the `default` dataset and **with the pgTAP helper functions in `public`**, as the plan's verify order leaves it. `yarn db:types` is valid there only after a reset.

## Task Commits

| # | Commit | Subject | Task |
|---|---|---|---|
| 1 | `437bac4b1` | `test[db](176-02): an entity's own nominations with the parent resolved, and the census naming the function` | 1 |
| 2 | `1119638e1` | `feat[db](176-02): get_entity_nominations returns an entity's own nominations with the parent resolved` | 2 |
| 3 | `3bd66ff39` | `chore[db](176-02): generated types with get_entity_nominations` | 2 |

Each was made by pathspec on `feat/entity-signup-multi-grant`. Plan 176-03's five commits lie between and after them.

## The function

```sql
public.get_entity_nominations (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS jsonb  -- LANGUAGE plpgsql STABLE SECURITY DEFINER, SET search_path = ''
```

In `apps/supabase/supabase/schema/503-entity-rpcs.sql`, after `get_entity_user_data`, with a line in the file's header list. No parameter has a default. Read back from the applied database: `prosecdef` true, `provolatile` `s`, `proconfig` `{search_path=""}`.

**Gate.** The function returns NULL unless all three parameters are stated, the type is `candidate` or `organization`, and `p_entity_id` is among `private.caller_entity_ids (p_project_id, p_entity_type)`. `user_can` is not called. It raises for no refusal.

**Grants.** `REVOKE EXECUTE … FROM PUBLIC, anon`; `GRANT EXECUTE … TO authenticated`. Read back: `anon` false, `authenticated` true, `service_role` true (the stack's default privilege; nothing revokes it and nothing in the plan asks for that).

**Return shape.** NULL, or a JSON array ordered by `sort_order` nulls last and then `id`. Each element holds exactly these ten keys:

| Key | Value |
|---|---|
| `id` | the nomination's id |
| `election_id` | uuid |
| `election_name` | the election's localized `name` object, as stored |
| `constituency_id` | uuid |
| `constituency_name` | the constituency's localized `name` object, as stored |
| `election_round` | integer |
| `election_symbol` | text, or JSON null |
| `confirmed` | boolean |
| `custom_data` | the stored object, or JSON null |
| `parent` | JSON null, or an object of exactly `entity_type`, `name`, `short_name` |

`parent.name` and `parent.short_name` are the localized objects of the organization, faction or alliance the parent nomination nominates; `short_name` is JSON null when none is stored. Not returned: `created_by`, any other column of the parent entity, any column of the parent's nomination (its id included).

**The entity is matched on the foreign key of its type** — `candidate_id` for a candidate, `organization_id` for an organization — within `p_project_id`.

## For plan 176-05

- **Keys of an element:** `id`, `election_id`, `election_name`, `constituency_id`, `constituency_name`, `election_round`, `election_symbol`, `confirmed`, `custom_data`, `parent`. **Keys of `parent`:** `entity_type`, `name`, `short_name`. Every key is always present; "nothing stored" is a JSON null, never a missing key.
- **`NULL`** (PostgREST: `null`) means refused: not the caller's entity, no such id, the id under another type or another project, a NULL argument, or a faction or alliance. It does not say which.
- **`[]`** means the entity is the caller's and has no nomination row in that project.
- The two names are unparsed localized objects (`{"en": "…", "fi": "…"}`); the client picks the locale.
- `election_round` can be JSON null in principle (the column is nullable with default 1); no cell stores one.
- A type outside the enum is refused by PostgREST before the function runs (an invalid enum value); the adapter passes a served type only.
- The gate reads `public.grants`, not the token: a grant written after the token was issued already counts here.
- The generated type is `Args: { p_entity_id: string; p_entity_type: …['entity_type']; p_project_id: string }`, `Returns: Json`, so the adapter narrows the answer with its own parser.
- The registry row in `scripts/assert-project-scoped-queries.mjs` is still to be added, as the plan rules.

## For plan 176-12

- A parent is resolved for every nomination that has one, whether or not the caller could read it through the tables. A nomination without a parent has `parent: null`.
- `custom_data.requestedParentOrganization` is carried as stored (cell 20), for the free text of a party not in the system.
- The order is the database's: `sort_order` nulls last, then `id`.

## The pgTAP file

`apps/supabase/supabase/tests/database/42-entity-nominations.test.sql` — number 42, derived as one above the highest existing prefix (41). `plan (69)`, 1410 lines. One transaction on `create_test_data ()`; every impersonation passes an empty grant array; editor rows come from `test_seed_identity_grants`; readers live in `pg_temp`.

**Fixture added inside the transaction:** an unconfirmed organization and an unconfirmed alliance in project A (open), a confirmed organization in project B (closed), and an organization sharing `candidate_a`'s uuid in project A; their nominations; three more nominations of `candidate_a` (under the unconfirmed organization, under `faction_a`, with no parent), one of `candidate_b` under the closed project's confirmed organization, one of `org_a` under the alliance.

| Cells | What they show | Expectation |
|---|---|---|
| 1–2 | the fixture's polarity; a stored row names its creator | as built |
| 3–4 | the catalogue: jsonb, STABLE, definer, empty search_path, no default; `authenticated` may execute, `anon` may not | true |
| 5–6 | through the tables `candidate_a` reads neither its unconfirmed parent's nomination nor that organization | 0 and 0 |
| 7–8 | control: the same reads for its confirmed parent in the open project | 1 and 1 |
| 9–12 | own candidate: raises nothing; an array; 4 elements; ordered, and without the nomination of the organization sharing the id | as stated |
| 13–15 | `confirmed` true and false; one element compared whole | equal |
| 16–19 | the parent: the refused unconfirmed organization, the confirmed organization (short name null), a faction, and JSON null for none | resolved |
| 20–21 | `custom_data` carried; nothing stored is JSON null | as stated |
| 22–25 | the ten keys on every element; the three keys on every parent; no `created_by` key and no creator id; nothing else of the parent or of its nomination | exact |
| 26–33 | refusals, each as "raises nothing" plus `IS NULL`: another user's candidate, another user's organization, an id that names nothing, the caller's own id under another type | NULL |
| 34 | those answers are one and the same | equal |
| 35–37 | own candidate under another project; a NULL project, type or id | NULL |
| 38–39 | through the tables `candidate_b` (closed project) reads neither the confirmed nomination of its confirmed parent nor that organization | 0 and 0 |
| 40–44 | its own answer: both nominations; both parents resolved; the closed project's election and constituency named | resolved |
| 45–46 | an editor of another project asking for `candidate_a`, under either project | NULL |
| 47–48 | through the tables `organization_a` reads neither its unconfirmed parent alliance's nomination nor the alliance | 0 and 0 |
| 49–53 | own organization: both nominations; the alliance resolved; the parentless one confirmed with `parent: null`; the ten keys | as stated |
| 54 | the editor of the organization sharing a candidate's id gets that organization's nomination alone | 1 id |
| 55–57 | the parent organization's editor holds `nomination.read` on its child (control) and is answered NULL for it | NULL |
| 58–60 | the grant lookup names the faction the caller edits (control); its editor is answered NULL, not `[]` | NULL |
| 61–62 | a candidate with no nomination, asked by its editor | `[]` |
| 63–65 | a project admin reads the 4 rows through the tables (control) and is answered NULL | NULL |
| 66 | an admin-role grant on the entity itself changes nothing | NULL |
| 67–68 | a global admin | NULL |
| 69 | `anon` | `42501` |

**The census** (`07-rpc-security.test.sql`, test 20): the `authenticated` string holds `get_entity_nominations` between `get_entity_basic_data` and `project_open_for_voters`, and the description names it. The `anon` string is untouched.

### The cells were checked before the red commit

Inside one transaction that was rolled back (pgTAP loaded in it, the draft function created in it), the file ran against a draft: **69 of 69 ok**. Six deliberately wrong drafts each turned named cells red:

| Wrong draft | Red cells |
|---|---|
| gate by `user_can (… 'nomination.read' …)` | 36, 57, 60, 65, 66, 68 |
| entity matched across all four foreign keys | 11, 12, 54 |
| no served-type condition | 60 |
| `created_by` projected | 15, 22, 24, 53 |
| the parent's id projected | 15, 16, 17, 18, 23, 25, 42, 43, 51 |
| gate asked under the entity's own project, not the named one | 36, 50, 51, 52, 53 |

Nothing persisted: the function and the extension were absent afterwards (read). Logs: `tests/e2e-runs/176-unit/176-02-kept/`.

## The red log

`tests/e2e-runs/176-unit/176-02-pgtap-red.log`, exit **1**, head `8a7716fff`, on a freshly reset database with the schema unchanged. `Files=42, Tests=1892, Result: FAIL`; 40 files ok, two red:

```
07-rpc-security.test.sql
# Failed test 20: "census: the SECURITY DEFINER functions in public that authenticated can execute are the same six plus claim_invitations, get_entity_basic_data and get_entity_nominations"
#         have: claim_invitations,contestant_app_public_config,get_entity_basic_data,project_open_for_voters,…
#         want: claim_invitations,contestant_app_public_config,get_entity_basic_data,get_entity_nominations,project_open_for_voters,…

42-entity-nominations.test.sql:371: ERROR:  function public.get_entity_nominations(uuid, entity_type, uuid) does not exist
# Failed test 3: "get_entity_nominations (project, type, id) returns jsonb, is STABLE and SECURITY DEFINER with an empty search_path, and no parameter carries a default"
# Failed test 4: "authenticated may execute get_entity_nominations and anon may not"
  Parse errors: Bad plan.  You planned 69 tests but ran 4.
```

File 42 stops at the first reader that names the function: cells 1 and 2 pass, 3 and 4 fail by themselves, and 65 do not run. The head is an ancestor of the schema's commit `1119638e1` and is not that commit.

## Gates, with their real exit statuses

Evidence: `tests/e2e-runs/176-unit/176-02-*` (gitignored).

| Gate | Exit | Numbers |
|---|---|---|
| pgTAP on the database as found (`pgtap-red-draft1`) | 1 | Files=42, Tests=1892; three red files — 07, 42 and **39 test 238**; the stop |
| `yarn db:reset` 0 (ruled) | 0 | — |
| Task 1 red (`pgtap-red`) | **1** | Files=42, Tests=1892; red: 07 test 20 and file 42; 40 files ok |
| `yarn assert:comment-hygiene` with file 42 staged, before commit 1 | 0 | 1936 files, 0 violations |
| **Task 1 `<automated>` verify, verbatim** (`t1-verify`, head `437bac4b1`) | **0** | — |
| `yarn schema:regenerate` | 0 | 29 schema files → 7859 lines |
| `yarn assert:schema-migration-parity` before commit 2 | 0 | generated copy is current |
| `yarn db:reset` 1 | 0 | — |
| `yarn db:types` on the reset database, before pgTAP (`types1`) | 0 | 4 lines added, none removed: the function's `Args` and `Returns` |
| pgTAP green (`pgtap-green1`) | **0** | **Files=42, Tests=1957, Result: PASS** |
| `yarn db:lint:sql` (`lint1`) | 0 | `No schema errors found`; `Summary: 0 error(s), 3 warning(s)` |
| `yarn assert:rpc-nullability` (`nullability1`) | 0 | 3 `RETURNS TABLE` RPCs, unchanged (this function returns jsonb) |
| **Task 2 `<automated>` verify, verbatim** (`t2-verify`, head `3bd66ff39`) | **0** | parity; no in-flight marker; reset 2; types with no diff; Files=42 Tests=1957 PASS; lint 0 errors; nullability; default seed 752 rows |
| `yarn assert:comment-hygiene` on the closing tree | 0 | 1936 files, 0 violations |
| `prettier --check` on the four touched source files | 0 | — |

Not run, as the plan rules (PROH-176-08): `yarn lint:check`, `yarn typecheck`, `yarn test:unit`, svelte-check, any dev server, any E2E run.

**The SQL lint's three warnings** are the three it reported at the close of Phase 175, none on an object this plan touches: foreign keys without an index on `constituency_group_constituencies.constituency_id`, `election_constituency_groups.constituency_group_id` and `nominations.created_by`. Census line: `policies examined: 107, tables partitioned: 21, permission members: 23`.

### pgTAP totals

| Point | Files | Tests in a run | Sum of `plan (N)` |
|---|---|---|---|
| Before this plan (Phase 175's closing gate run, read) | 41 | 1888 | 1879 over 40 files |
| After this plan, on a freshly reset database | **42** | **1957** | **1948 over 41 files** |

## Every reset made, with the in-flight check

The check (`176-02-inflight.sh`) refuses when it cannot look. It lists every `started` marker without an `ended` beside it at any depth under `tests/e2e-runs/`, listeners on the wrapper's port `:5273`, and any Playwright, wrapper or batch process. Port `:5173` is not read: a Docker sibling holds it on this host.

| Reset | Checked (UTC) | Check output | `yarn db:reset` | Why |
|---|---|---|---|---|
| 0 | 00:46:38 | 0 of 334 markers open · no listener on :5273 · no process · status 0 | exit 0 | the orchestrator's ruling — deviation 1 |
| 1 | 00:48:47 | the same, status 0 | exit 0 | Task 2 step 3 |
| 2 | 00:50:18 | the same, status 0 | exit 0 (inside the verify) | Task 2's verify block, which also makes its own marker check |

No reset failed and none was retried. Docker and the stack were never restarted; `supabase db push` was never run; the migration and the types were regenerated, never edited. Docker VM free: 19.6 GiB before the first reset, 19.5 GiB after the last; nothing pruned.

## The objects in the migration's diff

`1119638e1`: 73 lines added to each of the schema file and the migration, none removed, in two hunks — the one line of the header list of `503-entity-rpcs.sql`, and the block after `get_entity_user_data`'s grant: the function's header comment, its body, the `REVOKE` and the `GRANT`. Nothing else. The parity gate holds the two byte-identical.

## Deviations from Plan

### 1. [Ruled — option A] One reset before the red run: three resets, not two

- **Found during:** Task 1 step 4.
- **Issue:** the red run on the database as found exited 1 with three red files. The third, `39-invitations.test.sql` test 238, read 6 records where it wants 2: the database held four `private.invitation_link_witness` rows left by E2E runs made without a reset, and the test counts the table whole. Two rows were written inside Phase 175's determinism `run-03` (23:19 and 23:20Z on 2026-10-08), two inside plan 176-01's D9 reading run (00:03 and 00:04Z on 2026-10-09).
- **What I did:** stopped as the plan orders and reported. The orchestrator ruled option A: the in-flight check, `yarn db:reset` on the unchanged schema, then the red run. On the reset database the red log shows the two predicted files and nothing else.
- **Cost:** the `default` dataset was absent from 00:46Z until the verify's seed at about 00:51Z. Plan 176-03 uses no database.
- **Not done, as ruled:** the rows were not deleted by hand; test 238 and the E2E teardowns were not changed.
- **Evidence:** `176-02-pgtap-red-draft1.*`, `176-02-reset0.*`.

### 2. [Departure from the research's sketch, accepted] An unserved entity type is refused in the gate

`private.caller_entity_ids` has faction and alliance arms, so the sketch's body lets a faction's editor through the gate and answers `[]` — "yours, no nominations" — for a faction that has nominations. The plan says an unserved type yields NULL. The gate therefore names the two served types. **Held by cells 58–60**: the lookup names the faction (control), the call raises nothing, the answer is NULL and not an empty array.

### 3. [Departure from the research's sketch, accepted] The gate is fail-closed

The sketch's `p_entity_id NOT IN (SELECT …)` is NULL when the lookup returns a NULL id and no match, and a NULL condition falls through to the branch that answers. The lookup cannot return one today. The gate is written as `(served type AND p_entity_id IN (…)) IS NOT TRUE`, so anything but a positive match refuses. **Held by cell 37** (a NULL project, type or id each answered NULL) together with every refusal cell; no cell can plant a NULL id in the lookup.

### 4. The entity match is one arm per type, not a `CASE` over the columns

The sketch compares `CASE p_entity_type WHEN … THEN n.candidate_id … END` with the id. The function writes `(type = 'candidate' AND n.candidate_id = id) OR (type = 'organization' AND n.organization_id = id)`: the same rows, in a form an index on the key can serve. Held by cells 11, 12, 33 and 54.

### 5. Cells beyond the plan's `<behavior>`

Added because the function reads them and nothing else would pin them: the catalogue pair (3–4), a faction parent (18), a parentless nomination's JSON null (19), nulls for nothing stored (21), nothing else of the parent or its nomination by value (25), the own entity under another project (35–36), NULL arguments (37), an editor of another project (45–46), the organization sharing an id (54), the faction editor (58–60), the admin-role entity grant (66), a global admin (67–68).

### 6. The cells were run against a draft function before the red commit

Not in the plan. Done in rolled-back transactions while the plan was stopped, so that no cell needed correcting after its red commit; none did.

### 7. HEAD is on `feat/entity-signup-multi-grant`

The branch the orchestrator named for this checkout, not a per-agent branch.

**Total:** one ruled reset, two ruled departures from the sketch, four recorded differences. No prohibition was broken and no locked decision contradicted.

## Finding for the closing plan: a pgTAP assertion that reads `private.invitation_link_witness` whole

`39-invitations.test.sql` test 238 ("the table holds exactly the two records the service role opened, each completed once") aggregates over every row of `private.invitation_link_witness`. An E2E run that sends an invitation link leaves rows there, and **no teardown removes them** — four were present after two runs. The assertion is therefore red on any database such a run has touched, and green only after a reset.

- Every step of this phase that runs pgTAP without a reset immediately before it meets this. `176-gates.sh` resets before its pgTAP row and is not affected.
- Nothing was changed here, as ruled. The two places a fix could go are the assertion (scope it to the rows the file opens) and the E2E teardown (remove the rows a run wrote).
- The same class was recorded in Phase 175 for another file (175-03: "a pgTAP assertion that counts rows is scoped to the fixture's two projects").

## Code review checklist — § Supabase Backend and the general items

| Item | Outcome |
|---|---|
| New content tables carry the common columns | n/a — no table |
| RLS enabled with the standard policies on new tables | n/a |
| Policies use scalar subqueries for `auth.uid()` / `auth.jwt()` | n/a — no policy added or edited |
| Policies name `TO anon` / `TO authenticated` | n/a |
| `SECURITY DEFINER` functions set `search_path = ''` and qualify names | pass — `SET search_path = ''`; `public.` and `private.` on every table and function; read back from `pg_proc` |
| B-tree indexes on `project_id` and foreign keys | pass — no table; the read filters on `nominations.candidate_id` / `organization_id`, and the lint reports neither as unindexed |
| Trigger naming | n/a |
| pgTAP inside BEGIN/ROLLBACK with `create_test_data ()` | pass |
| pgTAP assertion patterns | pass — `is` / `ok` for answers, `lives_ok` plus `IS NULL` for each silent refusal, `throws_ok` with `42501` for `anon` |
| Solves the issue | pass for the database half: the child reads its parent's name where the tables refuse it (cells 5–6, 16, 38–39, 42, 47–48, 51) |
| OWASP: access control, injection | pass — the gate runs before any read and is fail-closed; no dynamic SQL; the projection is an allow-list. The definer function calls one definer helper once per call, not per row |
| `any`; repeated code | pass — no TypeScript written; the body composes the forms of three functions of the same file |
| New entities documented | pass — the header comment and the header-list line |
| Repo markdown and guides updated | deferred to plan 176-19; the list is below |
| Tracking events, Svelte, accessibility, keyboard | n/a |
| Errors handled | pass — the function raises for no refusal, by design |
| Parts sharing dependencies not unduly affected | not verified here — the types change is additive (4 lines); no workspace typecheck was run (PROH-176-08); plan 176-05's gate rows are the proof |
| Comment hygiene | pass — the guard exits 0 with the new file tracked; the added comments were read for history words and planning ids: none |
| Commit history; no fixes of itself | pass — three commits, each on its own files, none correcting another |
| Formatting in its own commit | pass — none needed |
| Every database commit carries `[db]` | pass — held by a stage of Task 2's verify |

No finding needed a further commit.

## For plan 176-19: what this plan made false or left incomplete

Found with `git grep` over `.claude/skills/database`, `apps/supabase/README.md` and `apps/docs/src`; nothing was edited here.

**Counts the database skill states that this plan changed:**

| Statement | Was | Is now | Command |
|---|---|---|---|
| pgTAP files | 41 | **42** | `git ls-files 'apps/supabase/supabase/tests/database/*.test.sql' \| wc -l` |
| pgTAP assertions in a run | 1888 | **1957** | the `Files=42, Tests=1957` line of `yarn workspace @openvaa/supabase test:db` on a freshly reset database |
| planned assertions | 1879 in 40 files | **1948 in 41 files** | the sum of `plan (N)` over the files |
| lines of the pgTAP files | 37,275 | **38,685** | `cat` of the 42 files piped to `wc -l` |
| definer functions of `public` that `authenticated` can execute | 8 | **9** | the list in § 8c of `07-rpc-security.test.sql` |
| the `anon` list | 6 | 6 | the same |

Where they stand: `SKILL.md` — the frontmatter description ("a 1888-assertion pgTAP estate"), § *Backend Overview*, RLS and Auth Patterns § 4 ("for `authenticated`, eight: the same six plus `claim_invitations` and `get_entity_basic_data`"), § *pgTAP Testing Conventions* item 1 ("**41** files … `00` to `41`", "**40** declare plans summing to **1879**", "`Files=41, Tests=1888`"), § *Key Source Locations* ("41 files, `00-helpers` through `41-entity-color`"), and the § *Freshness Record* rows.

**True but incomplete:**
- `SKILL.md` RLS and Auth Patterns § 9 describes `get_user_entities` and `get_entity_user_data` and not the third entity-scoped read, which is the one definer function among them.
- `schema-reference.md`'s function table has no row for `get_entity_nominations (uuid, entity_type, uuid)` (`503`, SECURITY DEFINER, `authenticated` only).
- `rls-policy-map.md`'s test table has no row for `42-entity-nominations.test.sql`.
- `apps/docs/…/developers-guide/backend/authentication/+page.md` and `…/contestant-app/entity-selection/+page.md` list the two sibling functions; the application does not call the new one until plan 176-05.

## The state the local database is left in

Read with `psql` after the closing verify:

- **Applied schema:** the tree's, with `get_entity_nominations`.
- **Data:** the `default` dataset, seeded by the verify's last stage (752 rows): 1 election, 328 candidates, 8 organizations, 377 nominations, 26 questions. 2 auth users.
- **Projects:** 1 — the default project. **The E2E project row `…00e2` no longer exists**; the reset removed it, and the suite creates its own project.
- **pgTAP helpers in `public`: 12 functions**, because the verify runs pgTAP after its reset. The pgTAP extension itself is not installed. `yarn db:types` on this database is valid only after a reset.
- `private.invitation_link_witness`: 0 rows.
- The stack is up and was never restarted.

## Files touched that the plan did not list

None in the repository. `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` have no difference between `746714c56` and HEAD. `CAND-APP-PLAN.md` stays untracked. Nothing under `tests/e2e-runs/` was deleted.

Gitignored evidence under `tests/e2e-runs/176-unit/`: `176-02-pgtap-red.*`, `176-02-pgtap-red-draft1.*`, `176-02-t1-verify.*`, `176-02-t2-verify.*`, `176-02-inflight.sh`, `176-02-reset{0,1,2}.*`, `176-02-apply.sh` and `176-02-apply1.*`, `176-02-types1.*`, `176-02-pgtap-green1.*`, `176-02-lint1.*`, `176-02-nullability1.*`, `176-02-hygiene-close.log`, `176-02-prettier-close.log`, and `176-02-kept/` (the draft, the dry run, the six mutation logs, the two files as kept at the checkpoint).

## Not done, or not verified

- **No workspace gate ran** (PROH-176-08): the additive types change is unproven against the frontend's typecheck until plan 176-05.
- **No caller exists yet.** The function was exercised through pgTAP and not through PostgREST; the JSON a client receives was not read over HTTP.
- **A NULL `election_round`** is not pinned by a cell.
- **`service_role` can execute the function** and gets NULL (it has no `auth.uid()`); not pinned by a cell, and nothing asks for it.
- **The database skill, `apps/supabase/README.md` and the docs site were not edited**; the list above is for plan 176-19.
- **Nothing was appended to `.planning/WINDOWS.md`**: no stub, no skipped test, no verify left unrun.
- The registry row for the function in `scripts/assert-project-scoped-queries.mjs` is plan 176-05's, as the plan rules.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register. Its mitigations as built:

| Threat | Held by |
|---|---|
| T-176-04 any signed-in user reading any entity's nominations | the gate before any read; cells 26–37, 45–46, 63–68 |
| T-176-05 the parent's unpublished columns or its nomination's | the key-by-key projection; cells 15, 22, 23, 25, 53 |
| T-176-06 a parent's editor learning another party through its child | the gate on `private.caller_entity_ids`; cells 55–57 |
| T-176-07 "does not exist" told from "not yours" | NULL for both; cells 30–34 |
| T-176-08 `created_by` leaving | not projected; cells 2 and 24 |
| T-176-09 `anon` executing a definer function | the `REVOKE`; cells 4 and 69; the unchanged `anon` census |
| T-176-10 a reset under a run in flight | the check before each of the three resets, recorded |

## Self-Check: PASSED

Checked after writing:

- `apps/supabase/supabase/tests/database/42-entity-nominations.test.sql` exists and is tracked; the four modified files each name `get_entity_nominations`.
- `437bac4b1`, `1119638e1` and `3bd66ff39` are ancestors of HEAD; `git rev-list --count 746714c56..3bd66ff39` is 8, of which 3 carry `(176-02)`.
- `176-02-t1-verify.exit` and `176-02-t2-verify.exit` hold 0; `176-02-pgtap-red.exit` holds 1; `176-02-pgtap-green1.exit` holds 0.
- `git status --short` shows the operator's untracked `CAND-APP-PLAN.md` and nothing of this plan's.
