---
phase: 173-multi-entity-grants-entity-selection
plan: 02
subsystem: database
tags: [postgres, supabase, rpc, rls, pgtap, zod, name-gate, multi-entity, stale-token]

requires:
  - phase: 173-multi-entity-grants-entity-selection
    provides: "173-01: the name map, the three drivers and the green baseline (gates 173-01-baseline, E2E 173-01-baseline-r2)"
  - phase: 172-terms-of-use-per-user-and-project
    provides: "The 13-column user-data function with the terms column already removed"
  - phase: 166
    provides: "private.caller_entity_ids, the editor grant as the only link from a user to an entity, idx_grants_one_candidate_editor"
provides:
  - "public.get_user_entities(p_project_id) RETURNS jsonb: one object whose entities array lists every candidate and organization the caller edits in the project; one row with an empty array for a caller with none"
  - "public.get_entity_user_data(p_project_id, p_entity_type, p_entity_id): the editable row of one such entity, or no row; never a raise"
  - "The deletion of get_candidate_user_data and of its ERR_ENTITY_IDENTITY_AMBIGUOUS raise from every file outside .planning"
  - "userEntities.ts: UserEntitiesSchema, UserEntityEntry, parseUserEntities — the zod narrowing of the list's jsonb answer"
  - "The adapter's interim reader over the pair, with unchanged behaviour for every user"
  - "pgTAP: the list, the one-entity read, their agreement under a stale token, and a nine-cell write-refusal matrix"
  - "The name gate with exactly two exemptions and /contestant/candidate/… admitted"
  - "Stage 1 closed green: gates 173-02-schema (twelve rows at 0) and E2E 173-02-schema (180 of 180)"
affects: [173-03, 173-04, 173-07, 173-08, 173-13, 174, 175, 178, 179]

estimate:
  tokens: 95000
actuals:
  tokens: 36141
  tasks: 5
  commits: 5
plan_head_before: b8b0ac27f57040f580d850a919e0333db3b2f786
plan_head_after: 247cf07d2ebeafe1c7bfc268d27d02f29b535ac0

tech-stack:
  added: []
  patterns:
    - "A user-level RPC returns one jsonb object, so a caller with nothing still gets one row and a per-user fact can be added at the top level without changing signature or cardinality"
    - "A refusal is an empty result: each is asserted in pgTAP as lives_ok plus a zero count, so a raise fails the case"
    - "A malformed jsonb answer is a failed read (the narrowing throws), never an empty list"
    - "A pgTAP file that numbers its assertions in its headings gains new assertions as a new last section, never in the middle"

key-files:
  created:
    - apps/frontend/src/lib/api/adapters/supabase/utils/userEntities.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/userEntities.test.ts
  modified:
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/schema/300-auth-tables.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/database.ts
    - packages/supabase-types/src/database.overrides.ts
    - packages/supabase-types/RPC-NULLABILITY.md
    - scripts/assert-project-scoped-queries.mjs
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
    - apps/supabase/supabase/tests/database/36-entity-identity.test.sql
    - apps/supabase/supabase/tests/database/21-entity-organization.test.sql
    - apps/supabase/supabase/tests/database/18-entity-policies.test.sql
    - apps/supabase/supabase/tests/database/10-schema-migrations.test.sql
    - apps/supabase/supabase/tests/database/20-storage-authority.test.sql
    - scripts/assert-no-candidate-app-names.mjs
    - scripts/fixtures/assert-no-candidate-app-names.input.ts
    - .claude/skills/database/SKILL.md
    - .claude/skills/database/schema-reference.md
    - apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md
    - .planning/phases/173-multi-entity-grants-entity-selection/173-NAME-MAP.md

key-decisions:
  - "A grant the token predates is pinned in three cases, not two: not served for an entity that is not publicly visible, served at once (but not writable) for one that is, and no longer served once removed from the table"
  - "The same-project upsert_answers refusal between two candidates is added rather than cited: the assertion the plan cites targets a candidate of another project"
  - "The name gate's exemption list holds exactly two entries, not one, as the name map of 173-01 measured"
  - "userEntities.ts is declared in GUARDED_SOURCES of the project-scoping guard, which requires every adapter source to be declared"
  - "The two new name-map sections are inserted before 'What differs and which plan it touches', so that list stays the file's last section"

patterns-established:
  - "Listed exactly when readable: both functions are 'the table says the caller edits it' and 'the caller's row-level security admits the row'"

requirements-completed: [ENT-03, GEN-02]

coverage:
  - id: D1
    description: "Two SECURITY INVOKER functions over private.caller_entity_ids replace the user-data function; the old one is deleted, not aliased"
    requirement: ENT-03
    verification:
      - kind: other
        ref: "catalogue query through psql on the applied database: get_entity_user_data:false:0:false:true,get_user_entities:false:0:false:true (invoker, no parameter default, refused to anon, granted to authenticated; the old function absent)"
        status: pass
      - kind: other
        ref: "yarn assert:schema-migration-parity, yarn assert:rpc-nullability, yarn assert:project-scoped-queries, yarn assert:adapter-casts, yarn db:lint:sql — each exit 0; gate rows lint, types-clean, sql-lint of 173-02-schema"
        status: pass
      - kind: other
        ref: "git grep -n -e get_candidate_user_data -- ':!.planning' and git grep -n -F ERR_ENTITY_IDENTITY_AMBIGUOUS -- ':!.planning': each exit 1, no line"
        status: pass
    human_judgment: false
  - id: D2
    description: "A caller who edits several entities in one project is listed with every one of them and nothing raises; a caller with none gets one row with an empty array; only editor grants on candidates and organizations of the asked project are listed"
    requirement: ENT-03
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/36-entity-identity.test.sql — section 'The list' and 'Callers that hold authority without being an entity' (plan 61, all passing)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The one-entity read returns the caller's own candidate or organization (with its name) and no row, never a raise, for every other entity; anon is refused both functions by privilege"
    requirement: GEN-02
    verification:
      - kind: integration
        ref: "36-entity-identity.test.sql — sections 'The one-entity read' and 'anon'; 21-entity-organization.test.sql — the output-shape pins and Section 8 (plan 23)"
        status: pass
    human_judgment: false
  - id: D4
    description: "An entity is listed exactly when the one-entity read returns it, under a token older than a grant and under a token that outlives one"
    requirement: ENT-03
    verification:
      - kind: integration
        ref: "36-entity-identity.test.sql — section 'A token older than a grant, and a token that outlives one', with a rebuilt-token control and a direct-read control"
        status: pass
    human_judgment: true
    rationale: "The plan's truth says a grant the token predates 'is neither listed nor readable'. Measured, that holds only for an entity that is not publicly visible; a publicly visible one is listed and readable at once and not writable. The agreement of list and read holds in every case and is what is pinned. Whether the refined statement is accepted as meeting the truth is the operator's call."
  - id: D5
    description: "A caller cannot write an entity it holds no editor grant on, by row update, upsert_answers or upload: nine same-project cells, each refused"
    requirement: GEN-02
    verification:
      - kind: integration
        ref: "18-entity-policies.test.sql Section 11 (plan 70), 10-schema-migrations.test.sql upsert_answers section (plan 89), 20-storage-authority.test.sql items 46-47 (plan 47); 173-NAME-MAP.md § Write refusals, nine rows, each description found in its file"
        status: pass
    human_judgment: false
  - id: D6
    description: "The application behaves as before for every user: the adapter's interim reader serves exactly one candidate and fails the read for zero or several"
    requirement: GEN-02
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts — describe 'getContestantUserData' and 'project scoping'; utils/userEntities.test.ts (79 tests in the two files)"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/173-e2e/173-02-schema: 180 of 180 over 100 projects, every project's total equal to the baseline's"
        status: pass
    human_judgment: false
  - id: D7
    description: "The name gate declares exactly two exemptions, admits the literal /contestant/candidate/…, and its self-test passes"
    verification:
      - kind: other
        ref: "node scripts/assert-no-candidate-app-names.mjs --self-test (82 of 82), the tree scan (0 findings), 173-verdict.mjs exemptions — each exit 0"
        status: pass
    human_judgment: true
    rationale: "PROH-173-04 is verified by judgment: the one pattern change (the alternative `contestant` in one lookbehind) loosens a standing gate on purpose and is stated here for the operator's eye."
  - id: D8
    description: "Stage 1 closes green on one tree: twelve gate rows and the full E2E suite with at least the baseline's test count"
    verification:
      - kind: other
        ref: "173-verdict.mjs gates 173-02-schema, exit 0; no Sleep entry in the window"
        status: pass
      - kind: e2e
        ref: "173-verdict.mjs e2e 173-02-schema --min-total-of 173-01-baseline, exit 0; no Sleep entry in the window"
        status: pass
    human_judgment: false
  - id: D9
    description: "PROH-173-05 and PROH-173-03: the migration and the types are regenerated, never hand-edited; neither function reveals whether an entity id exists"
    verification: []
    human_judgment: true
    rationale: "Both are marked verification: judgment in the plan. The migration came from yarn schema:regenerate and the types from yarn db:types after yarn db:reset; parity and types-clean are green. Neither function contains a RAISE and every refusal is asserted as an empty result."

duration: 41min
completed: 2026-10-06
status: complete
---

# Phase 173 Plan 02: The Entity List and the One-Entity Read Summary

**`get_user_entities` and `get_entity_user_data` replace the single-entity user-data function and its ambiguity raise; everything generated from the schema is regenerated; the adapter reads through the pair with unchanged behaviour; pgTAP proves the list, the read, their agreement under a stale token and nine write refusals; the name gate holds two exemptions; and tree `89acaff82` is green on twelve gate rows and on the full E2E suite (180 of 180), both on the first attempt.**

## Read First

1. **One of the plan's truths holds only in part, and the difference matters to Phase 174.** A grant written after the token was issued is not served until the token refreshes **only when its entity is not publicly visible**. For a confirmed, nominated entity of an open project it is listed and readable at once, and every write is refused until the refresh. Measured, pinned in pgTAP, nothing was built to defeat it. Details under "The Stale Token, Measured".
2. **Every one of the nine write refusals holds.** No policy defect was found. The matrix is three cited and six added, not four and five: the assertion the plan cites for `upsert_answers` between two candidates targets a candidate of another project.
3. **One pattern of the name gate was loosened, on purpose.** See "The Gate's Pattern Change".
4. **Where the handover and the plan disagreed, the plan was followed, except where the name map overrules the plan.** The exemption list holds two entries after this plan, as the name map and the handover say, not one as the plan's truth and Task 4 say.

## Performance

- **Duration:** about 41 min, 09:50Z to 10:31Z. The host slept from 12:52:37 to 13:00:20 local (lid closed, on battery) while Task 1 was being written; no run was in flight, and every result of that task was established again by the closing gate set.
- **Tasks:** 5 of 5
- **Files changed:** 23 (21 outside `.planning/`, two of them new)
- **Start revision:** `b8b0ac27f`. **The tree both closing instruments describe:** `89acaff82`.

## Task Commits

1. **Task 1: the two functions, the regenerated migration, types and satellites, the adapter's interim reader** — `6b637ee81` `feat[db](173-02): list the caller's entities and read one of them in place of the single-entity user-data function`
2. **Task 2: `36-entity-identity` rewritten, `21-entity-organization` re-pointed** — `68ba71af2` `test[db](173-02): prove the entity list, the one-entity read and their agreement under a stale token in pgTAP`
3. **Task 3: the write-refusal matrix** — `cb5e93b1b` `test[db](173-02): refuse every write to an entity the caller does not edit, by row update, upsert_answers and upload`
4. **Task 4: the name gate, the database skill, the authentication docs** — `89acaff82` `chore(173-02): drop the name gate's exemption for the deleted function and admit an entity type after the app's prefix`
5. **Task 5: the close** — `247cf07d2` `docs(173-02): record the green close of the schema stage of multi-entity grants in the name map`

`git rev-list --count b8b0ac27f..247cf07d2` is 5. The commit that carries this file follows them. pgTAP was red on files 21 and 36 between commits 1 and 2, as the plan states; nothing was gated between them.

## Gate and E2E Results

Every exit status was read from the command itself or from a marker file, never through a pipe.

| What | Command | Exit | Result |
|---|---|---|---|
| Parity before any edit | `yarn assert:schema-migration-parity` | 0 | |
| Regenerate, parity | `yarn schema:regenerate`; `yarn assert:schema-migration-parity` | 0; 0 | the migration's diff holds this task's six hunks and nothing else |
| Apply, types | `yarn db:reset`; `yarn db:types` | 0; 0 | no listener on 5273 and no run in flight |
| Task 1 guards | `yarn assert:rpc-nullability`, `assert:project-scoped-queries`, `assert:adapter-casts`, `db:lint:sql` | 0, 0, 0, 0 | the scoping guard was 1 once, before the new file was declared (below) |
| Task 1 catalogue | `psql … -Atc "select string_agg(…)"` (`psql` is on `PATH`; no substitute was needed) | 0 | `get_entity_user_data:false:0:false:true,get_user_entities:false:0:false:true` |
| Task 1 frontend | `yarn workspace @openvaa/frontend typecheck`; `… vitest run supabaseDataWriter userEntities` | 0; 0 | 2067 files, 0 errors; 79 tests in 2 files |
| pgTAP after Task 2 | `yarn workspace @openvaa/supabase test:db` | 0 | 38 files, 1428 tests |
| pgTAP after Task 3 | the same | 0 | 38 files, 1447 tests |
| Name gate | `--self-test`; the tree scan; `173-verdict.mjs exemptions` | 0; 0; 0 | 82 of 82; 0 findings in 2710 files; two entries |
| Retired names | the two `git grep` commands of Task 4 | 1; 1 | no line |
| Skill links | `bash .claude/scripts/audit-skill-links.sh` before and after | 1; 1 | `Dangling: 222` before, `Dangling: 222` after (the script exits 1 on any dangling citation; none is new) |
| Docs | `yarn workspace @openvaa/docs validate:links`; `… format:check` | 0; 0 | 0 findings |
| **Gate set** | `caffeinate -dimsu 173-gates.sh 173-02-schema` | **0** | **twelve rows, every status 0** |
| Gate verdict | `173-verdict.mjs gates 173-02-schema` | 0 | not stale; no Sleep entry in the window |
| **E2E** | `caffeinate -dimsu 173-e2e.sh 173-02-schema` | **0** | **180 / 180 / 0 failed / 0 flaky / 0 skipped / 0 did not run**; 100 projects; no retry |
| E2E verdict | `173-verdict.mjs e2e 173-02-schema --min-total-of 173-01-baseline` | 0 | full suite; one preflight success; total 180 not below the baseline's 180 |
| Per-project comparison | `… --same-projects-as 173-01-baseline` | 0 | every project's total equals the baseline's |
| Re-seed | `yarn db:seed:default` | 0 | 752 rows |

The twelve rows of `173-02-schema`: typecheck 18 s, lint 43 s, types-regen 34 s, types-clean 0 s, sql-lint 2 s (104 policies, 20 tables, `0 error(s), 3 warning(s)`), pgtap 5 s (38 files, 1447 tests), unit 65 s (frontend 2185 in 138, dev-seed 996 in 67, supabase 206 in 15, app-shared 141 in 10, data 244 in 47), check-frontend 8 s (2657 files, 0 errors, 0 warnings), build 15 s, format 17 s, docs-links 1 s, name-gate-self-test 0 s (82 of 82).

### Every run directory of this plan

| Directory | Head | Power | Counts | Verdict |
|---|---|---|---|---|
| `tests/e2e-runs/173-gates/173-02-schema` | `89acaff82`, clean | AC; 13:18:26 to 13:21:55 local; 0 Sleep entries | twelve rows, all `0` | green |
| `tests/e2e-runs/173-e2e/173-02-schema` | `89acaff82`, clean | AC; 13:22:13 to 13:28:30 local; 0 Sleep entries | 180 of 180 over 100 projects | **green, the full default suite** |

Both are first attempts; no run was made twice and no label carries an `-r2`. Beside them: the `.exit` markers and `.log` files of the label. Nothing under `tests/e2e-runs/` was deleted. The power record of each run was read, and `pmset -g log` read again for its window, before its result.

## The Column List of `get_entity_user_data`

Thirteen columns, the deleted function's list in the same order and with the same types:

`id uuid, project_id uuid, name jsonb, short_name jsonb, info jsonb, color jsonb, image jsonb, sort_order integer, subtype text, custom_data jsonb, answers jsonb, first_name text, last_name text`

`name` is `NULL::jsonb` on the candidates arm; `first_name` and `last_name` are `NULL::text` on the organizations arm. The override member keeps the four nullable columns the tree held: `first_name`, `last_name`, `subtype`, `sort_order`.

`get_user_entities` entries: `entity_type`, `id`, `short_name`, `image`, `color`, `confirmed`, and `first_name` with `last_name` (candidate) or `name` (organization). **An entry does not carry the keys of the other type**; the plan's artifact list writes the union, and pgTAP pins the exact key set per type.

## pgTAP `plan (N)`, Before and After

| File | Before | After | What moved |
|---|---|---|---|
| `36-entity-identity.test.sql` | 20 | 61 | "Who the caller is" replaced by the list, the one-entity read, the stale-token cases and anon; two catalog assertions for one; the ambiguity assertions deleted |
| `21-entity-organization.test.sql` | 21 | 23 | re-pointed; one no-default assertion per new function |
| `18-entity-policies.test.sql` | 59 | 70 | Section 11, the image column across types |
| `10-schema-migrations.test.sql` | 83 | 89 | three refusals and three read-backs in the `upsert_answers` section |
| `20-storage-authority.test.sql` | 45 | 47 | items 46 and 47 |

Suite: 38 files, 1385 tests at the baseline, 1447 now. `07-rpc-security.test.sql` is unchanged (`git diff --stat 6b637ee81..HEAD` on it prints nothing) and passes: the definer censuses did not move. `00-helpers.test.sql` is listed in the plan's files and was **not** changed: this file's own fixture carries every added row.

## The Stale Token, Measured

Both functions are "the table says the caller edits it" and "the caller's row-level security admits the row". Row-level security admits an entity row to an authenticated caller on any of three grounds: project authority, public visibility (the project is open for voters, the entity is confirmed and has a confirmed nomination), or entity authority through the token's claim. So:

| Case | Listed | Readable | Writable | Pinned in `36-entity-identity.test.sql` as |
|---|---|---|---|---|
| Grant in the table, token predates it, entity **not** publicly visible | no | no | no | `an editor grant written after the token was issued is not listed while the token predates it`, with `once the token is rebuilt the same grant is listed` as the control |
| Grant in the table, token predates it, entity **publicly visible** | **yes** | **yes** | no | `an editor grant the token predates is listed at once when its candidate is publicly visible`, `…readable, so the list and the read still agree`, `but writing it is refused until the token carries the grant` |
| Grant removed from the table, token still carries it | no | no | still yes, by a direct write, until the token refreshes | `a grant removed from the table is not listed although the token still carries it`, with `control: the token that outlives the grant still reads the candidate row directly` |

- **Observed** (a rolled-back transaction on the applied database, then pgTAP): for the publicly visible candidate the list returned the entry and the read returned one row; `UPDATE … SET image` affected 0 rows and `upsert_answers` raised `Entity not found or access denied`.
- **What does not change:** an entity is listed exactly when the read returns it, in every case. No more is disclosed than the caller could already read: the select policy admits the whole row of a publicly visible entity to any authenticated caller.
- **Not built:** nothing lists an entity the read refuses (no join outward from the helper's ids), as the research's row 8 and the handover say.
- **The last row is threat T-173-08, accepted by the plan:** a revoked editor can still write the row directly until the token refreshes. The functions stop serving it at once, so the application stops offering it.

## The Nine Write Refusals

`173-NAME-MAP.md` § *Write refusals* holds the table with each assertion's description as it stands in its file. In short:

| Cell | Path and pairing | File | Cited or added |
|---|---|---|---|
| (a)(i) | row update, candidate editor to organization | `18-entity-policies` | added |
| (a)(ii) | row update, candidate editor to another candidate | `18-entity-policies` | cited (it writes `subtype`; the `image` form is added beside it) |
| (a)(iii) | row update, organization editor to candidate | `18-entity-policies` | added |
| (b)(i) | `upsert_answers`, candidate editor to organization | `10-schema-migrations` | added |
| (b)(ii) | `upsert_answers`, candidate editor to another candidate | `10-schema-migrations` | **added** (the cited assertion is cross-project) |
| (b)(iii) | `upsert_answers`, organization editor to candidate | `10-schema-migrations` | added |
| (c)(i) | upload, candidate editor to an organization's folder | `20-storage-authority` | cited |
| (c)(ii) | upload, candidate editor to another candidate's folder | `20-storage-authority` | cited |
| (c)(iii) | upload, organization editor to a candidate's folder | `20-storage-authority` | added |

Every target row is one the caller can see, so each refusal is the write policy's. Each added row-update and `upsert_answers` refusal has its value read back as `postgres`, and each session opens with an allowed write as the control. No schema file changed in Task 3 and no pgTAP file was added (38 before and after).

## The Gate's Pattern Change

**For the operator, in one line:** in `scripts/assert-no-candidate-app-names.mjs` the `/candidate URL` lookbehind gains the alternative `contestant`, so `/contestant/candidate/<id>/…` is read as an entity-typed form and not reported; no other pattern changed, and fixture line `n38` (`'/contestant/candidate/123/profile'`) carries it.

The exemption for the deleted function is gone; `EXEMPT` holds exactly two entries (`invite-candidate`, the three shown names of the app) and both sentences that state the count say "exactly two". Fixture: `e02` keeps its finding beside `invite-candidate`, `n10` names `get_entity_user_data`, one line is appended (135 lines to 136), and the `.violations` file is unchanged because no finding's line moved.

## Files in the Two Retired-Name Populations Beyond Those the Plan Lists

None. After Tasks 1 to 3 the two populations held exactly the three files Task 4 names (`.claude/skills/database/SKILL.md`, `.claude/skills/database/schema-reference.md`, the authentication docs page). Both greps are now empty outside `.planning/`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The new narrowing file had to be declared to the project-scoping guard**
- **Found during:** Task 1
- **Issue:** `yarn assert:project-scoped-queries` exited 1: every source under the adapter directory must be in `GUARDED_SOURCES` or `DEFERRED_SOURCES`, and `utils/userEntities.ts` was in neither.
- **Fix:** one entry added to `GUARDED_SOURCES`, beside the plan's two `PROJECT_SCOPED_RPCS` entries. `DEFERRED_SOURCES` stays empty.
- **Files modified:** `scripts/assert-project-scoped-queries.mjs`
- **Commit:** `6b637ee81`

**2. [Rule 1 - Bug] The cited `upsert_answers` cell does not prove its pairing**
- **Found during:** Task 3
- **Issue:** the plan cites `candidate_a cannot call upsert_answers for candidate_b (throws error)` for cell (b)(ii), "inside one project". `candidate_b` belongs to project B, and the assertion accepts any error and reads nothing back.
- **Fix:** the same-project cell was added (`candidate_a2`, SQLSTATE `P0001`, the exact message, answers read back). The matrix is three cited and six added.
- **Files modified:** `10-schema-migrations.test.sql`, `173-NAME-MAP.md`
- **Commit:** `cb5e93b1b`

**3. [Rule 2 - Missing critical] The stale-token truth was pinned as measured, with its exception**
- **Found during:** Task 2
- **Issue:** the plan's truth 6 says a grant the token predates "is neither listed nor readable". On the applied database that is false for a publicly visible entity.
- **Fix:** three assertions pin the exception (listed, readable, not writable) beside the plan's two directions; the file's header, the skill and the docs page state it. No function was changed.
- **Files modified:** `36-entity-identity.test.sql`, `.claude/skills/database/SKILL.md`, the authentication docs page
- **Commits:** `68ba71af2`, `89acaff82`

### Acceptance criteria that did not hold as written

- **Truth 12 and Task 4: "the name gate declares exactly one exemption".** It declares two. The name map of 173-01 (item 1) is the authority; `173-verdict.mjs exemptions` passes on exactly those two.
- **Task 3: "four of the nine cases are proven by existing assertions … and five are added".** Three and six; see deviation 2.
- **Task 4 step 7: "a dangling count no higher than before".** Holds: 222 and 222. The audit script itself exits 1 on this tree, before and after.
- **Task 2: "Keep unchanged … the fixture frame".** The five users and the file's shape are kept; the fixture gained one candidate, one organization (in project B, sharing a candidate's uuid) and four grant rows for the multi-grant user, as step 2 asks.

### Additions beyond the plan

- **pgTAP beyond the listed cases:** the exact key set of a candidate entry and of an organization entry (the contract the zod schema depends on); a project admin and an entity-admin holder listed with nothing; two organization editors' grants listed; the type/id mismatch asked in both projects (the uuid names a candidate in one and an organization in the other); a faction asked of the read; a rebuilt-token control and a direct-read control for the two stale directions; the `image` form of the cited same-type row-update cell; an allowed write per session as the control of each refusal.
- **Writer tests beyond the five listed:** the list read failing, both RPC calls naming the project, the one-entity read failing with an error.
- **`userEntities.test.ts` beyond the five listed:** unknown members dropped, an absent answer, and that the error names paths and never a stored value.
- **A change-log paragraph** in the database skill for this plan, and the earlier paragraph reworded so that it no longer names the deleted function or its hint.
- **Two name-map sections inserted before the last one**, and three items (13 to 15) appended to "What differs and which plan it touches".

### Departures in procedure

- **The commit-time worktree check of the executor's protocol was not applied.** It requires an `agent-*` branch inside a linked worktree; this checkout is a permanent linked worktree on `feat/entity-signup-multi-grant`, and the standing notes say to commit there normally. The branch is not a protected one.
- **Section 2 of `RPC-NULLABILITY.md` was not touched.** Its hand-written line citations for `get_nominations` were already stale before this plan (it says `:9` where the derived region says `:13`) and are one line further off now. The rewritten section 3 cites by content, not by line.
- **The broken-windows ledger was not appended to**, as in 173-01. The deviations are recorded here and in the name map.
- **Reading.** The plan, the standing notes, `173-01-SUMMARY.md`, the name map's names, facts, P-1 to P-3, baseline and last section, and of `173-RESEARCH.md` R-1 whole, R-2.9, R-6.6, R-7.1, R-7.2 and pitfalls P-13 and P-16 were read; of `173-CONTEXT.md` D-01 to D-06, D-22, D-23 and the cross-phase notes. The database skill was read at the passages it rewrites, not whole. `PROJECT.md`, `STATE.md`, `config.json`, `173-UI-SPEC.md`, `173-VALIDATION.md`, the workflow references and the rest of the research were not opened.

## Deferred Issues

- **`RPC-NULLABILITY.md` § 2 cites stale line numbers** (pre-existing; the gate does not read them).
- **The database skill's description line states counts that predate several phases** ("17-table", "102 RLS policies", "1086-assertion pgTAP estate"); out of this plan's scope.
- Carried from 173-01 and unchanged: the stale scan counts and the header logout button that is never rendered.

## Known Stubs

None. The adapter's interim reader (exactly one candidate or a failed read) is the plan's stated interim state and lasts until 173-03.

## Threat Model, Each Disposition

| Threat | Disposition | Where it stands |
|---|---|---|
| T-173-03 IDOR on the one-entity read | mitigate | both arms require `id IN (SELECT private.caller_entity_ids (…))` and run as invoker; pgTAP "a candidate the caller holds no grant on returns no row, publicly visible though it is" |
| T-173-04 telling "not yours" from "does not exist" | mitigate | no `RAISE` in either function; six refusals each asserted as `lives_ok` plus a zero count |
| T-173-05 `anon` executing either function | mitigate | `REVOKE … FROM PUBLIC, anon`; `42501` for both in pgTAP; the catalogue line |
| T-173-06 an `admin`-role or faction grant making an entity selectable | mitigate | the helper reads `role = 'editor'`; two arms only; both excluded in pgTAP |
| T-173-07 another project's entity through a forged `p_project_id` | mitigate | both arms filter the project; pgTAP in both directions, including the shared-uuid organization; the adapter keeps its project comparison; the scoping guard requires `p_project_id` at both call sites |
| T-173-08 a revoked editor acting on a token that still carries the grant | accept | unchanged; the functions stop serving the entity at once, asserted, with the direct read as its control |
| T-173-09 widening the name gate to pass | mitigate | the list shrank by one; one lookbehind alternative with a fixture line; `--self-test` and the `exemptions` verdict pass |
| T-173-54, -55, -56 writing an entity the caller does not edit | mitigate | the nine cells above |
| T-173-SC package installs | accept | no package was installed |

No new security-relevant surface beyond the plan's threat model: the two functions are the only new endpoints, and both are in it.

## What the Next Plan and Later Phases Must Know

- **Read `173-NAME-MAP.md` first,** its last section, which now has fifteen items; `## After 173-02` holds the names this plan put on the tree.
- **Compare against** gates `173-02-schema` and E2E `173-02-schema` as well as the baseline: 180 tests, 100 projects; pgTAP 38 files, 1447 tests; frontend unit 2185 in 138.
- **173-03:** the reader to generalise is `_getContestantUserData` in `supabaseDataWriter.ts`; `parseUserEntities` already returns organization entries, and the reader drops them. `mockEntityRpcs` in the writer's test file stubs both RPCs by name. The three write paths are refused for an entity the caller does not edit, in pgTAP, for both types. A save can be refused for a **listed** entity while the token predates its grant.
- **173-07 and 173-08:** the list and the read agree in every measured case, so an entity the root redirects to is one the entity-level load can read.
- **Obligation to Phase 174:** a grant written after the token was issued is not listed until the token refreshes, unless its entity is publicly visible, in which case it is listed and readable at once and every write is refused until the refresh. Refresh the session after a claim, before the first read or write. This corrects the sentence of `173-CONTEXT.md` that says such a grant "is listed at once".
- **Phase 178:** `get_user_entities` returns one object for every caller; a per-user fact goes at its top level, and `UserEntitiesSchema` drops members it does not know, so adding one does not fail the read.
- **Phase 179:** `findExistingCandidate` in `identity-callback` still ends in `.maybeSingle()` and throws for a user holding two candidate grants in one project (fact F14). Not touched here.
- **A full gate run resets the database.** Gate set, then E2E, then `yarn db:seed:default`.

**Host state:** the stack is up and healthy with the new schema applied (`yarn db:status` 0, `OPTIONS` 200 on the three functions, the allowlist probe 0, both new functions and not the old one in `pg_proc`); it was not restarted. The database carries what the closing E2E run left in its own project, the pgTAP helper functions, and the `default` dataset (752 rows seeded). Nothing listens on 5173 or 5273 and no dev server of this plan runs. The host is on AC power. `CAND-APP-PLAN.md` is untracked and untouched. `.planning/STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `PROJECT.md` are unchanged.

## Self-Check: PASSED

- The two created files and this summary exist; both run directories exist with the statuses stated, and both record head `89acaff82`.
- Commits `6b637ee81`, `68ba71af2`, `cb5e93b1b`, `89acaff82` and `247cf07d2` are ancestors of HEAD; `git rev-list --count b8b0ac27f..247cf07d2` is 5.
- The plan's verification items hold: parity, the SQL lint and pgTAP at exit 0 (gate rows of `173-02-schema`); nine rows under `## Write refusals`, each description found in its file; `types-clean` at 0 after the gate's regeneration; `gates 173-02-schema` and `e2e 173-02-schema --min-total-of 173-01-baseline` at exit 0, re-taken against the last commit; `exemptions` at exit 0.
- `.planning/STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `PROJECT.md` are unchanged since the start revision.
