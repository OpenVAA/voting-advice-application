---
phase: 175-organization-editing-profile-questions-preview
plan: 02
subsystem: database
tags: [postgres, supabase, rls, pgtap, triggers, app-settings, migration]

requires:
  - phase: 174-contestant-app-foundation
    provides: the one-migration schema workflow, the pgTAP estate of 39 files, the entity confirmation trigger
provides:
  - "private.project_nominations_locked (uuid) reads app_settings.settings at access, nominationsLocked (JSON boolean true locks; a missing project is locked; a missing row or key is unlocked)"
  - "public.projects without the lock column, in the schema, the UPDATE grant, the migration, the generated types and the dev-seed key list"
  - "short_name in the UPDATE OF list and the arguments of the four enforce_entity_immutability registrations"
  - "pgTAP: the lock in both directions for three entity-user policies, ten lock-source cases, the project-editor case, three short_name cells on each of four entity tables"
affects: [175-03, 175-05, 175-07, 175-08, 175-13, 176, 177]

actuals:
  tokens: 21400 # chars/4 over the realized diff of this plan's 18 files (85714 chars)
  tasks: 2
  commits: 11 # MEASURED: git rev-list --count 0c2263f70..548fc75b9. The checkout is shared: 7 of the 11 are this plan's (subjects carrying "(175-02)"), 3 are plan 175-01's and 1 is a Phase 176 docs commit.
plan_head_before: 0c2263f7094578324a3ca27e631c7cf9cddf41c8
plan_head_after: 548fc75b924c9721200b51828a0b6b1893c8fc77

tech-stack:
  added: []
  patterns:
    - "A policy conjunct that reads a stored setting goes through a SECURITY DEFINER helper with a two-level COALESCE: the outer level fails closed on what cannot be read, the inner level defaults open on what is not set"
    - "A JSON setting a policy reads is compared as jsonb (`#> path = 'true'::jsonb`), never as extracted text"
    - "A trigger registration protects a column only when the column is in both its UPDATE OF list and its argument list; pgTAP pins both lists by catalogue census"

key-files:
  created: []
  modified:
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/schema/100-tenancy.sql
    - apps/supabase/supabase/schema/102-entities.sql
    - apps/supabase/supabase/schema/302-rls.sql
    - apps/supabase/supabase/schema/303-column-grants.sql
    - apps/supabase/supabase/schema/011-validation-functions.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/23-nominations-write.test.sql
    - apps/supabase/supabase/tests/database/22-content-policies.test.sql
    - apps/supabase/supabase/tests/database/19-entity-immutability.test.sql
    - apps/supabase/supabase/tests/database/15-visibility-flags.test.sql
    - packages/supabase-types/src/database.ts
    - packages/dev-seed/src/template/permittedKeys.ts

key-decisions:
  - "The project-editor case lives in file 22 (section 3b), which builds the only project-editor identity of the estate; it asserts both directions under the editor's own writes"
  - "File 15 asserts the column's absence without naming it: no column of projects matches '%nomination%', with a floor term proving the query reached the table"
  - "The two censuses of the trigger registrations in file 19 were re-expressed with the cells, so they were red with them"
  - "In file 09 section 4 the displaced organization assertion writes custom_data, because the section's next assertion already writes info on the same row"

patterns-established:
  - "Lock write in pgTAP: jsonb_recursive_merge (settings, '{\"access\":{\"nominationsLocked\":true}}') as the fixture owner — one key merged, nothing restated"

requirements-completed: [GEN-03]

coverage:
  - id: D1
    description: "The nominations lock is enforced from the app setting access.nominationsLocked for the entity user's update, parent insert and own insert, in both directions, and not for a project admin"
    requirement: GEN-03
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/23-nominations-write.test.sql (section 3, G4, OWN) — yarn workspace @openvaa/supabase test:db"
        status: pass
    human_judgment: false
  - id: D2
    description: "Which stored values lock: a missing project locked; no row, no access member, no key, false, the string, the number, JSON null and an array access unlocked; JSON true locked"
    requirement: GEN-03
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/23-nominations-write.test.sql (section 10, ten SOURCE cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A project editor turns the lock on and off through app_settings and the entity user's write follows it"
    requirement: GEN-03
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/22-content-policies.test.sql (section 3b, four assertions)"
        status: pass
    human_judgment: false
  - id: D4
    description: "public.projects has no lock column; nothing in the tree outside .planning names the old column"
    requirement: GEN-03
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/15-visibility-flags.test.sql (section 2); git grep of the old name exits 1"
        status: pass
    human_judgment: false
  - id: D5
    description: "short_name is frozen on confirmation on organizations, candidates, factions and alliances, correctable by a holder of entity.edit_immutable, editable while unconfirmed"
    requirement: GEN-03
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/19-entity-immutability.test.sql (cells 1, 2, 3 of short_name on four tables; the two registration censuses)"
        status: pass
    human_judgment: false

duration: 22min
completed: 2026-10-08
status: complete
---

# Phase 175 Plan 02: The Nominations Lock as an App Setting, and short_name Frozen on Confirmation — Summary

**`private.project_nominations_locked` reads `app_settings.settings` at `access`, `nominationsLocked` with JSONB equality and `projects` loses its lock column; the four `enforce_entity_immutability` registrations protect `short_name`; both pinned by pgTAP cells that were red on the applied schema first (39 files, 1706 → 1740 tests).**

## Performance

- **Duration:** about 22 min
- **Completed:** 2026-10-08
- **Tasks:** 2 of 2
- **Files modified:** 18, exactly the plan's list; no file outside it

## Accomplishments

- One stored value decides whether an entity user can write a nomination. The helper keeps its signature, `STABLE SECURITY DEFINER` and `SET search_path = ''`; its four call sites in `302-rls.sql` are untouched (4 at `175-BASE`, 4 now, counted on the form `private.project_nominations_locked (project_id)`).
- The lock is asserted in both directions for `entity_update_nominations`, `entity_insert_parent_nominations` and, new, `entity_insert_nominations`; a project admin's edit under the lock is asserted to succeed.
- A project editor sets the key and the entity user's update follows it, on then off (T-175-08 observed, not assumed); the comment above `admin_update_app_settings` says so.
- `short_name` is in both lists of all four registrations. The function body is byte-identical to `175-BASE`, comment lines aside (PROH-175-08): no lock condition entered it.
- The migration was regenerated in each of the four schema commits; parity held at every one.

## Task Commits

1. **Task 1 — red:** `2b13364b0` `test[db](175-02): the nominations lock read from the app setting`
2. **Task 1 — schema:** `5e54b29b5` `feat[db](175-02): the nominations lock is the app setting access.nominationsLocked`
3. **Task 1 — types:** `c4b65bcab` `chore[db](175-02): generated types and the dev-seed key list without the lock column`
4. **Task 1 — comment:** `1105f7e3e` `docs[db](175-02): the app-settings policy comment names the lock by its setting` (deviation 4)
5. **Task 2 — red:** `0fdca48ea` `test[db](175-02): short_name is frozen on confirmation on four entity tables`
6. **Task 2 — schema:** `d33eccbca` `feat[db](175-02): short_name joins the columns frozen on confirmation`
7. **Task 2 — displaced:** `ffc14254b` `test[db](175-02): the grant assertions that wrote short_name write an unfrozen column`

Every one carries `[db]`. Plan 175-01's commits and one Phase 176 docs commit are interleaved in the shared checkout; each of the above was made by pathspec.

## Gates, with their real exit statuses

Evidence is under `tests/e2e-runs/175-unit/` (gitignored), each as `175-02-<name>.log` and `.exit`.

| Gate | Exit | Numbers |
|---|---|---|
| pgTAP on the database as found (`baseline-unreset`) | 1 | 39 files, 1706 tests, 1 failed — file 39 test 238; see deviation 1 |
| pgTAP baseline on a freshly reset database, old schema (`baseline`) | 0 | Files=39, Tests=1706, PASS |
| `yarn db:types` on that reset database, before pgTAP | 0 | no diff — the regeneration is drift-free at the base |
| Task 1 red (`lock-red`) | 1 | Files=39, Tests=1720; 8 failed in files 15, 22, 23 |
| `yarn assert:schema-migration-parity` after each of the four schema commits | 0 | 29 schema files → 7655 lines (Task 1), 7659 lines (Task 2) |
| `yarn db:types` after reset 1 | 0 | three lines removed, none added |
| dev-seed `typecheck` · `lint` · `test:unit` (after the types) | 0 · 0 · 0 | 68 files, 1030 tests |
| Task 1 green (`lock-green`) | 0 | Files=39, Tests=1720, PASS |
| `yarn db:lint:sql` after Task 1 | 0 | 0 errors, 3 warnings (three foreign keys without an index, none on a file this plan touches) |
| **Task 1 `<automated>` verify, verbatim**, first run (`verify1-first`) | **1** | stopped at the call-site count link; deviation 4 |
| **Task 1 `<automated>` verify, verbatim**, after `1105f7e3e` (`verify1`) | **0** | parity, types without drift, Files=39 Tests=1720 PASS, SQL lint 0 errors |
| Task 2 red (`shortname-red`) | 1 | Files=39, Tests=1740; 6 failed, all in file 19 |
| `yarn db:types` after reset 2 | 0 | `git diff --exit-code HEAD -- packages/supabase-types/src/database.ts` exits 0 |
| Task 2 applied (`shortname-applied`) | 1 | Files=39, Tests=1740; 6 failed in files 05, 09, 20; file 19 green |
| Task 2 green (`shortname-green`) | 0 | Files=39, Tests=1740, PASS |
| **Task 2 `<automated>` verify, verbatim** (`verify2`) | **0** | registrations parsed, body unchanged, parity, Files=39 Tests=1740 PASS, SQL lint 0 errors, every database commit tagged |
| Task 1 verify again on the closing tree (`verify1-close`) | 0 | Files=39, Tests=1740, PASS |
| dev-seed `typecheck` · `test:unit` on the closing tree | 0 · 0 | 68 files, 1030 tests |
| `yarn workspace @openvaa/supabase test:unit` | 0 | 18 files, 462 tests |
| `yarn assert:comment-hygiene` · `assert:rpc-nullability` · `assert:grant-permission-enum` | 0 · 0 · 0 | 1895 files scanned, 0 violations |
| `prettier --check` on every SQL and TS file touched | 0 | — |

Not run, as the plan rules: `yarn lint:check`, `yarn typecheck`, `yarn build`, any E2E run. Plan 175-05 runs them on the tree of waves 1 and 2.

### The estate's totals

| Point | Files | Tests in a run | Sum of `plan (N)` over 38 files |
|---|---|---|---|
| Before this plan (`175-BASE`, fresh reset) | 39 | 1706 | 1697 |
| After Task 1 | 39 | 1720 | 1711 |
| After Task 2 — **the close of this plan** | 39 | **1740** | **1731** |

Per file: 15 `plan (33)` → `(30)`; 22 `(68)` → `(72)`; 23 `(51)` → `(64)`; 19 `(70)` → `(90)`; 05 `(21)`, 09 `(32)`, 20 `(47)` unchanged.

## The red logs

### Task 1 (`175-02-lock-red.log`, exit 1) — eight failed assertions

| File | Test | Description | Why |
|---|---|---|---|
| 15 | 4 | No column of projects names nominations: … | have `1/true`, want `0/true` |
| 22 | 13 | and with the editor's lock ON candidate_a, the owning entity user, CANNOT update its own nomination | have 1, want 0 |
| 23 | 8 | with the project nomination lock ON, the owning entity user affects zero rows … | have 1, want 0 |
| 23 | 22 | G4-neg: guard 4 -- with the project nomination lock ON the parent insert is refused … | no exception, wanted 42501 |
| 23 | 23 | OWN-neg: with the project nomination lock ON an entity user's insert of its OWN nomination is refused | no exception, wanted 42501 |
| 23 | 24 | G4: with the lock OFF the SAME statement succeeds … | 42501 — the row G4-neg failed to refuse now exists, so guard 3 refuses the repeat |
| 23 | 25 | OWN: with the lock OFF the SAME statement succeeds … | 23505 — the row OWN-neg failed to refuse now exists |
| 23 | 56 | SOURCE: the JSON boolean true is LOCKED … | have false, want true |

Every file parsed. Each failure is the setting not being read by the applied helper. See deviation 2 for how this differs from the plan's prediction.

### Task 2 (`175-02-shortname-red.log`, exit 1) — six failed assertions, all in file 19

- tests 6, 20, 30, 40: `<table> cell 1 (short_name): an entity grantee changing the short name of a CONFIRMED entity is refused, and the refusal names the column` for candidates, organizations, factions and alliances — each `'(no exception)'`, because the update was allowed.
- test 73: `each registration is restricted to exactly that table's protected columns plus the confirmation column …` — the `UPDATE OF` census.
- test 74: `the ARGUMENT list of each registration is that table's protected columns …` — the argument census.

Cells 2 and 3 of `short_name` passed on all four tables. See deviation 3 for tests 73 and 74.

## The objects in each migration diff

- **`5e54b29b5`:** `public.projects` without `lock_nominations` and its comment; the body and header comment of `private.project_nominations_locked`; the header of `301-auth-functions.sql` (its `Depends on` line names `106-app-settings.sql`) and the sentence in `user_can`'s comment that named the column; the comment above `admin_update_app_settings`; the `projects` UPDATE grant without the column and its comment. Prettier reflowed that grant onto one line, since three columns fit. Nothing else.
- **`1105f7e3e`:** one comment line (above `admin_update_app_settings`).
- **`d33eccbca`:** the four `CREATE TRIGGER enforce_entity_immutability` statements, each with `short_name` in `UPDATE OF` and in the arguments, and the comment above each; four comment lines of `011-validation-functions.sql` (no line of the function body); four comment lines of `303-column-grants.sql`.

## The displaced assertions (A6: prediction beside measurement)

Derived from `175-02-shortname-applied.log`: with the registrations applied, file 19 was green and these six assertions were red. The research predicted four assertions and two dependent read-backs; the measurement is the same six.

| File | Test | Description | Predicted | Now writes |
|---|---|---|---|---|
| 05 | 3 | `organization_admin can UPDATE short_name on own organization` | yes | `info`; the description says `info` |
| 05 | 4 | `organization_admin UPDATE on own organization actually changed data` (its read-back) | yes | reads `info ->> 'en'` |
| 09 | 21 | `Organization admin can update short_name on own organization` | yes | `custom_data`; the description says `custom_data` (deviation 6) |
| 09 | 25 | `Candidate can still update a permitted column while holding no privilege on updated_at` | yes | `info`; the description names no column and is unchanged |
| 09 | 26 | `The set_updated_at trigger advanced updated_at although the caller cannot name that column` (depends on 25) | yes | unchanged; green once 25 writes |
| 20 | 1 | `table: an entity grantee UPDATEs its own candidates row (entity.edit_answers, affected rows = 1)` | yes | `info` |

No count was lowered and no assertion deleted. The three `short_name` writes the research called unaffected stayed green and were not touched: file 05's update of `org_b`, file 20's deny half on `candidate_a2` and file 20's `table_write_org`. Each still detects the failure it guards: under a policy that wrongly admitted the row, the write would either land (read-back fails) or reach the trigger and raise (the tracer returns −1, not 0).

## Every reset made, with the in-flight check

The check lists listeners on `:5273`, every `started` marker without an `ended` beside it at any depth under `tests/e2e-runs/` (the wrapper's marker names are `started` and `ended`), and any Playwright, `e2e-run.sh` or determinism-batch process. Its output is kept as `175-02-reset<N>.inflight`.

| Reset | When (UTC) | Check output | `yarn db:reset` | Why |
|---|---|---|---|---|
| 0 | 11:56:47 | no listener on :5273 · started-without-ended: total=0 · no process · status 0 | exit 0 | not in the plan — deviation 1 |
| 1 | 12:02:20 | the same four lines, status 0 | exit 0 | Task 1 step 3 |
| 2 | 12:08:00 | the same four lines, status 0 | exit 0 | Task 2 step 3 |

No reset failed, so nothing was retried. Docker and the stack were never restarted; `supabase db push` was never run; the migration and the generated types were never hand-edited.

## Decisions Made

- **Where the project-editor case lives:** `22-content-policies.test.sql`, section 3b. The shared helpers hold no project-editor identity; file 22 builds one. Four assertions: the editor turns the lock on (one row), `candidate_a`'s update of its own nomination affects zero rows, the editor turns it off (one row), the same statement affects one row.
- **Ten lock-source cases, not eight.** The plan's eight, plus a JSON `null` and an `access` object without the key. All through one instrument, `pg_temp.locked_with_access`, which is not `SECURITY DEFINER`.
- **An admin control under the lock** was added in file 23's section 3, because the plan's `<behavior>` states it and no assertion held it.
- **The lock write in pgTAP** is `jsonb_recursive_merge (settings, '{"access":{"nominationsLocked":…}}')` as the fixture owner (ruling 4: one key, nothing restated). The editor's own statement in file 22 uses `jsonb_set` over the stored `access`, since it runs as `authenticated`.

## Deviations from Plan

### 1. [Rule 3 — blocking] One reset the plan did not list, before the red run

- **Found during:** Task 1 step 0.
- **Issue:** the pgTAP run on the database as found exited 1: `39-invitations.test.sql` test 238, "the table holds exactly the two records the service role opened, each completed once", read 43 records where it wants 2. The database held rows from earlier E2E runs; the suite is measured on a freshly reset database only. A red log taken there could not have shown "nothing else is red".
- **Fix:** the in-flight check, then `yarn db:reset` on the unchanged schema, then `yarn db:types` (no diff) and the baseline run: Files=39, Tests=1706, PASS. Three resets were made instead of two. The local data, the `default` dataset included, was destroyed about six minutes earlier than the plan's first reset would have destroyed it.
- **Evidence:** `175-02-baseline-unreset.log`, `175-02-reset0.*`, `175-02-baseline.log`.

### 2. Task 1's red set is wider than the plan predicted, in the same kind

The plan expected the "lock on" halves and the helper's `true` case in file 23 and the column's absence in file 15, "and nothing else". Measured: those, plus three more.
- **File 22 test 13** — the deny half of the project-editor case. The plan itself sends that case to file 22 when the helpers hold no editor identity.
- **File 23 tests 24 and 25** — the allow halves of the G4 and OWN pairs. Each pair runs the same statement in both halves by design; when the deny half is not refused, its row is inserted and the allow half then collides with it (guard 3, or the uniqueness key). They are consequences of the two deny halves, not independent failures, and both are green once the helper reads the setting.

Nothing was changed to narrow the red set: the pairs keep their same-statement shape, as the plan requires.

### 3. Task 2's red set includes the two registration censuses of file 19

The plan expected the four new cell-1 rows and nothing else, and "File 19 is green" once the registrations are applied. File 19's section 7 holds two existing assertions that compare each registration's `UPDATE OF` list and argument list with literals. Those literals had to name `short_name` for the file to be green afterwards, so they were re-expressed with the cells and were red with them (tests 73, 74). The two population censuses of section 8 were re-expressed too (5 → 9 protected columns); they measure columns and grants, so they are green on both sides.

### 4. The first run of Task 1's verify exited 1; a comment I had written was reworded

- **Issue:** the verify compares `git grep -c -F "private.project_nominations_locked"` on `302-rls.sql` at `175-BASE` and now, as its measure of the call sites. My corrected comment above `admin_update_app_settings` named the helper, so the line count was 5 against 4. The call sites themselves were 4 and 4.
- **Fix:** the comment says which key the nomination policies read without naming the helper (`1105f7e3e`, comment only, migration regenerated). Naming the helper there was my wording and nothing in the plan prescribed it, so this is not a correct implementation bent to a search; the check was not edited. The verify then exited 0.
- **Cost:** the history holds two commits on that comment line, which the code review checklist's "no fixes of itself" item counts against the branch. Commits were not rewritten in a shared checkout.

### 5. File 15 asserts the column's absence without naming the column

The acceptance criterion forbids the old name anywhere outside `.planning/`, so a `hasnt_column` naming it was not available. The assertion is: no column of `projects` matches `'%nomination%'`, joined with a floor term (`open_for_voters` was seen) so the zero is a measurement. Red on the old schema (`1/true`), green on the new (`0/true`).

### 6. In file 09 section 4 the displaced row writes `custom_data`, not `info`

The plan says each displaced statement writes `info`. In that section the very next assertion already writes `info` on the same row under the same session, so `info` would have made two identical assertions. PROH-175-17 asks for "another granted, unfrozen column"; `custom_data` is one, and the description names it. The grant on `organizations.short_name` itself is still observed behaviourally: file 19's cell 2 writes it on the unconfirmed row and reads it back.

### 7. Formatter consequences

Prettier rewrote two lists onto one line once each lost a member: the `projects` UPDATE grant in `303-column-grants.sql` and the `projects` key list in `permittedKeys.ts`. Both are in the same commits as the content change.

**Total:** one blocking fix (a reset), six recorded differences from the plan's text. No prohibition was broken and no locked decision contradicted.

## Code review checklist — § Supabase Backend and the general items

| Item | Outcome |
|---|---|
| New content tables carry the common columns | n/a — no table added |
| RLS enabled with the standard policies on new tables | n/a |
| Policies use `(SELECT auth.uid())` / `(SELECT auth.jwt())` | pass — no policy edited; the four callers are untouched |
| Policies name `TO anon` / `TO authenticated` | n/a — no policy added |
| `SECURITY DEFINER` functions set `search_path = ''` and qualify names | pass — the helper keeps both; `public.app_settings` and `public.projects` are qualified |
| B-tree indexes on `project_id` and foreign keys | n/a — the helper's lookup rides `app_settings.project_id`, which is UNIQUE |
| Trigger naming | pass — `enforce_entity_immutability` keeps its name on all four tables |
| pgTAP inside BEGIN/ROLLBACK with `create_test_data()` | pass — every new cell sits in its file's transaction on the shared fixture; instruments live in `pg_temp` or are the file's own |
| pgTAP assertion patterns | pass — `throws_ok` for the expected refusals (OWN-neg, G4-neg), `lives_ok` with a read-back `is` for the allows, `is` over an affected-row count for the silent denials through each file's own instrument; cell 1 of `short_name` is `matches` over the file's `capture_refusal`, because it asserts the text names the column |
| Every database commit carries `[db]` | pass — verified by the last link of Task 2's verify |
| OWASP: access control, injection | pass — the lock stays a policy conjunct; the helper takes one uuid and builds no SQL |
| `any`, repeated code, new entities documented | pass — no TypeScript logic added; the helper's and the registrations' comments describe them |
| Comment hygiene | pass — the added lines were scanned for history words and planning references: none; `yarn assert:comment-hygiene` exits 0 |
| Docs and skills updated | deferred to plan 175-13 by ruling 7; the list is below |
| No fixes of itself in the history | **finding, not fixed** — `1105f7e3e` follows `5e54b29b5` on one comment line (deviation 4) |
| Formatting changes in their own commit | noted — two formatter reflows ride their content commits (deviation 7) |
| Tracking events, Svelte, accessibility | n/a — no user-facing function, no component |

## For plan 175-13: what this plan made false or left incomplete

`git grep -n -e "lock_nominations" -e "nomination lock" -e "nominations lock" -- .claude/skills apps/docs/src apps/supabase/README.md` prints nothing: no sentence names the column or the lock.

**False now:**
- `.claude/skills/database/SKILL.md` — the description's "a 1706-assertion pgTAP estate"; § *Backend Overview* "1706 pgTAP assertions in 39 files: 38 files declare plans summing to 1697"; § *pgTAP Testing Conventions* item 1 ("summing to **1697**", "`Files=39, Tests=1706`"); the § *Freshness Record* row "pgTAP assertions". At the close of this plan the run reports `Files=39, Tests=1740` and the plans sum to 1731. Plan 175-03 adds files 40 and 41, so the numbers to write are 175-13's own measurement.

**True but incomplete:**
- `.claude/skills/database/rls-policy-map.md` — the cells "own, unless locked" and the row listing `project_nominations_locked(uuid)` say nothing of where the lock is stored or who may set it; "`confirmed` appears in the grant list and is nonetheless guarded" is equally true of `name`, `first_name`, `last_name` and now `short_name`.
- `.claude/skills/database/SKILL.md` § *Schema Conventions* item 8 lists the trigger conventions without `enforce_entity_immutability` or its protected columns.
- `apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md` — "For candidates the updatable columns are `short_name`, … Rules that depend on the row's state, such as who may change `confirmed`, are enforced by the trigger function" does not say that `short_name` and the name columns freeze on confirmation.
- `apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md` — the settings table has `access.answersLocked` and no `access.nominationsLocked`; "Inserting and updating the row needs the `project.edit_app_settings` permission" now also means a project editor can lock and unlock nominations.
- `apps/docs/src/routes/(content)/publishers-guide/app-settings/+page.md` — lists `answersLocked` under `access`, not `nominationsLocked`.

`git grep -n -e "enforce_entity_immutability" -e "immutable once confirmed"` over the same paths finds `extension-patterns.md` and three lines of `rls-policy-map.md`, all still true.

## What the next plans should know

- **175-03** resets again; it starts from a database on which pgTAP has run, so `yarn db:types` there is valid only after its own reset.
- **175-07** (writer): the refusal for `short_name` on a confirmed row reads `Entity name is immutable once confirmed: column public.<table>.short_name on row …` — the prefix says "name" for every protected column. A refused `short_name` and a refused `name` share one prefix and differ in the column segment.
- **175-08** (settings key): the stored path is `access.nominationsLocked`, and only the JSON boolean `true` locks. `StoredSettingsSchema`'s strict `access` object does not hold the key yet, so a stored `true` is rejected by the frontend's parse until 175-08 adds it, while the database already enforces it.
- **Any template or test that sets the lock** writes one key; `SupabaseAdminClient.updateAppSettings({ access: { nominationsLocked: true } })` merges member by member.
- **A full default E2E run was not made here.** No file under `apps/frontend/src`, `packages/app-shared/src` or `tests/tests` named the column (searched), and the generated types lost three lines; 175-05's gates and full run are the boundary proof.

## The state the local database is left in

- Applied schema: the tree's (`d33eccbca`; later commits changed only test files and frontend files).
- Reset three times; after the last reset only `seed.sql` has run: the default account, the default project (open for voters) and its empty settings row. **No `default` dataset and no E2E data**; not re-seeded, as the plan rules.
- pgTAP has run on it since the last reset, so the helper functions of `00-helpers.test.sql` are in `public` until the next reset. Every other test write was rolled back.
- The Supabase stack is up and was never restarted.

## Not done, or not verified

- The database skill, `apps/supabase/README.md` and the docs site were not edited (ruling 7).
- The helper's answer for a `settings` value that is a JSON scalar is not pinned by a cell; the research measured it as unlocked and the plan's behaviour does not list it.
- No entry was appended to `.planning/WINDOWS.md`: there is no stub, no skipped test and no verify left unrun.
- `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` were not touched; `CAND-APP-PLAN.md` stays untracked; nothing under `tests/e2e-runs/` was deleted.

## Known Stubs

None.

## Self-Check: PASSED

- The seven commits are ancestors of `HEAD`: `2b13364b0`, `5e54b29b5`, `c4b65bcab`, `1105f7e3e`, `0fdca48ea`, `d33eccbca`, `ffc14254b`.
- The evidence files named above exist under `tests/e2e-runs/175-unit/`; `175-02-lock-red.exit` and `175-02-shortname-red.exit` hold 1, `175-02-lock-green.exit`, `175-02-shortname-green.exit`, `175-02-verify1.exit` and `175-02-verify2.exit` hold 0.
- `git diff --name-only 0c2263f70..HEAD -- apps/supabase packages/dev-seed packages/supabase-types` lists the plan's 18 files and no other.
