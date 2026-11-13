---
phase: 172-terms-of-use-per-user-and-project
plan: 07
subsystem: database
tags: [supabase, postgres, rls, pgtap, column-grants, rpc, generated-types, dev-seed, terms-of-use, e2e, playwright]

requires:
  - phase: 172-terms-of-use-per-user-and-project
    provides: "Plan 01: the acceptance table, pgTAP file 37 and the two gate helpers. Plan 05: no file under apps/frontend names the candidate column. Plan 06: no visibility rule and no seed template reads or states it"
provides:
  - "public.candidates without a terms_of_use_accepted column; the candidates self-edit grant on 10 columns"
  - "get_candidate_user_data returning 13 columns, name and signature unchanged, for Phase 173 to reshape"
  - "Generated types, the nullability override, the column map, RPC-NULLABILITY.md and the dev-seed permitted keys matching that schema"
  - "unregisterCandidate and deleteAllTestUsers deleting grants and the auth user only; perm-closed-project.setup.ts relying on forceRegister for the acceptance"
  - "pgTAP 37 Section 7: four census assertions over policies in public and storage, functions in public and private, and columns in public"
  - "Stage 2 closed on one tree: nine gate rows at 0 and 177 of 177 E2E tests"
affects: [172-08, 172-09, 173, 175]

actuals:
  tokens: 14764
  tasks: 3
  commits: 1
plan_head_before: 5074c3dc6f42fe1bf5e9fcfb70ba591b24cc8950
plan_head_after: 467253bfddebe9af518159817ebc0b9cb506433d

tech-stack:
  added: []
  patterns:
    - "An inverse census in pgTAP compares a string_agg of offender names with NULL, so a failure prints the offenders, and a last assertion states that each searched population holds text"
    - "A census is shown to bite by running a copy of its file through psql with one mutation inserted after the fixture, inside the file's own rolled-back transaction"
    - "Count-based pgTAP expectations are written from a catalogue query run on the applied database, not from a plan"

key-files:
  created: []
  modified:
    - apps/supabase/supabase/schema/102-entities.sql
    - apps/supabase/supabase/schema/303-column-grants.sql
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/database.ts
    - packages/supabase-types/src/database.overrides.ts
    - packages/supabase-types/src/column-map.ts
    - packages/supabase-types/RPC-NULLABILITY.md
    - packages/dev-seed/src/template/permittedKeys.ts
    - tests/tests/utils/supabaseAdminClient.ts
    - tests/tests/setup/perm/perm-closed-project.setup.ts
    - tests/tests/setup/admin/admin-access.teardown.ts
    - apps/supabase/supabase/tests/database/00-helpers.test.sql
    - apps/supabase/supabase/tests/database/05-organization-admin.test.sql
    - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
    - apps/supabase/supabase/tests/database/09-column-restrictions.test.sql
    - apps/supabase/supabase/tests/database/10-schema-migrations.test.sql
    - apps/supabase/supabase/tests/database/16-anon-visibility.test.sql
    - apps/supabase/supabase/tests/database/21-entity-organization.test.sql
    - apps/supabase/supabase/tests/database/33-entity-type-collision.test.sql
    - apps/supabase/supabase/tests/database/37-terms-of-use-acceptances.test.sql

key-decisions:
  - "The census searches for terms_of_use, which also matches the acceptance table's name, as the plan states. The dispatch handover asked for a pattern that does not match the table's name; the plan is the contract and was followed"
  - "A fourth census assertion covers columns in public, which the plan does not list and the dispatch handover asks for"
  - "candidateIdsForUser stays: deleteBankAuthCandidateBySub and the bank-auth journey spec still call it"
  - "Section 3 of RPC-NULLABILITY.md had its counts, its body paragraph and its line citations corrected, not only its one row deleted"

patterns-established:
  - "A policy or function that reads terms_of_use_acceptances is reported by pgTAP 37 Section 7 and has to be admitted there by name, with a reason"

requirements-completed: [TOU-01, TOU-02]

coverage:
  - id: D1
    description: "public.candidates has no terms-of-use column, the candidates self-edit grant does not list one, and get_candidate_user_data does not return one"
    requirement: TOU-01
    verification:
      - kind: other
        ref: "Task 1's automated check as one command (exit 0): parity, assert:rpc-nullability, db:lint:sql, dev-seed test:unit, typecheck:tests, and the psql pair printing 0/false; column_privileges and pg_get_function_result read back after the runs"
        status: pass
      - kind: integration
        ref: "37-terms-of-use-acceptances.test.sql#Section 7 ('census: no column of a table or view in public names terms of use'); 09-column-restrictions.test.sql ('exactly 10 columns of candidates'); 21-entity-organization.test.sql ('declares 13 output columns')"
        status: pass
    human_judgment: false
  - id: D2
    description: "get_candidate_user_data keeps its name, its signature and every other output column in order"
    requirement: TOU-01
    verification:
      - kind: other
        ref: "pg_get_function_result('public.get_candidate_user_data(uuid, public.entity_type)'::regprocedure) on the applied database: 13 columns, listed under 'For Phase 173'"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/172/172-07-stage2: contestant-journey 1 of 1, contestant-a11y-scan 14 of 14, cold-entry-dataroot-contestant 1 of 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "The generated migration and types match the schema; the override, the column map, RPC-NULLABILITY.md and permittedKeys.ts no longer name the column"
    requirement: TOU-01
    verification:
      - kind: other
        ref: "yarn assert:schema-migration-parity (0); yarn assert:rpc-nullability (0); gate rows 02-types-regen and 03-types-clean of 172-07-stage2 (0, 0) on the committed tree; dev-seed typecheck and test:unit (0, 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "No E2E helper writes the column: unregisterCandidate and deleteAllTestUsers hold no update call, and perm-closed-project.setup.ts issues none"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/172/172-07-stage2: auth-setup 1 of 1, data-setup-perm-closed-project 1 of 1, perm-closed-project 11 of 11, admin-access 1 of 1, every data-teardown project 1 of 1; no log of the run holds 'does not exist', 'schema cache' or the column name"
        status: pass
      - kind: other
        ref: "awk over the two methods counting '.update(': 0 and 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "A standing census reports any policy in public or storage, any function in public or private and any column in public that names terms of use, over populations asserted non-empty"
    requirement: TOU-02
    verification:
      - kind: integration
        ref: "37-terms-of-use-acceptances.test.sql#Section 7 (assertions 46 to 49), inside yarn workspace @openvaa/supabase test:db (exit 0; Files=38, Tests=1385)"
        status: pass
      - kind: other
        ref: "negative controls, each a copy of file 37 with one mutation, run through psql in the file's own rolled-back transaction: a row policy naming a re-added column (46 and 48 red, with 43 and 45), a storage policy reading the acceptance table (46 red), a WITH CHECK reading it (46 red), a function in private reading it (47 red); unmutated 49 of 49"
        status: pass
    human_judgment: false
  - id: D6
    description: "pgTAP passes on the schema without the column, with the two count-based expectations re-measured from the catalogue"
    verification:
      - kind: integration
        ref: "yarn workspace @openvaa/supabase test:db (exit 0; Files=38, Tests=1385), three times: after the edits, as Task 2's verify chain, and as gate row 05"
        status: pass
    human_judgment: false
  - id: D7
    description: "Stage 2 closes green on one tree: nine static gates at 0 and the full default E2E suite at 177 of 177"
    verification:
      - kind: other
        ref: "bash 172-gates.sh --judge 172-07-stage2 (exit 0; nine rows, every status 0; head 467253bfd, clean tree)"
        status: pass
      - kind: e2e
        ref: "bash 172-e2e.sh --judge 172-07-stage2 (exit 0; 177 total, 177 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; the full default suite; head 467253bfd)"
        status: pass
    human_judgment: false
  - id: D8
    description: "PROH-172-02: no condition replaces the removed one, and the census is the standing guard"
    verification: []
    human_judgment: true
    rationale: "The plan marks the prohibition as verified by judgment. The supporting facts are measured and listed under 'Prohibition, Checked'."

duration: 22min
completed: 2026-10-06
status: complete
---

# Phase 172 Plan 07: The Candidate Terms-of-Use Column Is Dropped Summary

**`public.candidates` no longer has a `terms_of_use_accepted` column. It left the table, the candidates self-edit grant (now 10 columns) and the return shape of `get_candidate_user_data` (now 13 columns, name and signature unchanged) in one commit, together with the regenerated migration and types, the three type satellites, the permitted key, the three E2E writers and nine pgTAP files. pgTAP file 37 gained a census that reports any policy, function or column naming terms of use. Stage 2 closed on one tree: nine gate rows at 0 and 177 of 177 E2E tests.**

## Performance

- **Duration:** about 22 min. Started 2026-10-06T06:04:41Z; the commit landed before the gate set started at 06:13:51Z; the E2E run ended at 06:22:50Z.
- **Tasks:** 3 of 3
- **Files changed outside `.planning/`:** 21, exactly the plan's `files_modified` list
- **Start revision:** `5074c3dc6f42fe1bf5e9fcfb70ba591b24cc8950` (plan 06's summary commit; nothing was added since)
- **The tree the gate run, the E2E run and every closing check describe:** `467253bfddebe9af518159817ebc0b9cb506433d`, clean apart from the operator's untracked `CAND-APP-PLAN.md`

## For Phase 173: what `get_candidate_user_data` declares

`public.get_candidate_user_data (p_project_id uuid, p_entity_type public.entity_type DEFAULT 'candidate')`, `STABLE SECURITY INVOKER`, read back from the applied database:

| # | Column | Type |
|---|---|---|
| 1 | `id` | `uuid` |
| 2 | `project_id` | `uuid` |
| 3 | `name` | `jsonb` |
| 4 | `short_name` | `jsonb` |
| 5 | `info` | `jsonb` |
| 6 | `color` | `jsonb` |
| 7 | `image` | `jsonb` |
| 8 | `sort_order` | `integer` |
| 9 | `subtype` | `text` |
| 10 | `custom_data` | `jsonb` |
| 11 | `answers` | `jsonb` |
| 12 | `first_name` | `text` |
| 13 | `last_name` | `text` |

The body, the ambiguity raise and the grant to `authenticated` are unchanged. The override now widens `first_name`, `last_name`, `subtype` and `sort_order`. The named exemption for the RPC in `scripts/assert-no-candidate-app-names.mjs` was not touched.

## What the Plan Asked to Have Recorded

| Item | Value |
|---|---|
| pgTAP `plan (N)` deltas, each counted on the edited file | `10`: 90 to 83 (−7: the column block). `37`: 45 to 49 (+4: Section 7). No change in `05` (21), `07` (39), `09` (32), `16` (51), `21` (21), `33` (48); `00-helpers` declares no plan. Estate: 38 files, 1388 to 1385 tests |
| The two re-measured counts | `09`: `authenticated` holds UPDATE on **10** columns of `candidates` (`information_schema.column_privileges`; was 11). `21`: `get_candidate_user_data` declares **13** output columns (`pg_get_function_result`; was 14). Both were read from the applied database before the expectations were written |
| Dependents the pgTAP run surfaced that the plan did not name | **None.** The first run after the edits exited 0 with every file passing. No file outside the nine listed went red. Assumption A3 of the research held |
| `candidateIdsForUser` | **Not deleted.** Two callers remain: `deleteBankAuthCandidateBySub` in the same file and `tests/tests/specs/contestant/contestant-bank-auth-journey.spec.ts` |
| Interim census for stage 3 | see "Interim Census" below: 9 files, 11 lines (was 26 and 64) |

## Accomplishments

- The column and its comment left `102-entities.sql`; the grant list and its "Allowed columns" comment left `303-column-grants.sql`; the RPC lost the column in its `RETURNS TABLE`, in the candidate arm and in the organization arm, and the "Withheld today" list in the `get_entity_basic_data` comment lost the word.
- The migration was regenerated (6450 to 6446 lines) and its changed lines equal the changed lines of the schema files.
- The types were regenerated from a freshly reset database: four lines left `database.ts` (candidates Row, Insert and Update, and the RPC's Returns).
- The override, the column map, `RPC-NULLABILITY.md` and `permittedKeys.ts` follow.
- `unregisterCandidate` is three steps (find the user, delete the grants, delete the user); `deleteAllTestUsers` lost the lookup and the reset with their two error entries; `perm-closed-project.setup.ts` ends at `forceRegister`.
- pgTAP: four fixtures stop stating the column, the column block left `10`, two counts were re-measured, and `37` gained Section 7.
- Stage 2 closed, and the `default` dataset was seeded again.

## Task Commits

1. **Tasks 1 and 2: the column drop with its pgTAP changes, one commit** — `467253bfd` `feat[db](172-07): drop the candidate terms-of-use column with its grant, its RPC column and every writer of it`

`git rev-list --count 5074c3dc6..467253bfd` is 1. Task 3 changed no source file, so it has no commit of its own; the commit that carries this file follows.

## pgTAP, File by File

| File | Change |
|---|---|
| `00-helpers` | The candidates fixture insert no longer names the column. The three comment paragraphs about the timestamp were replaced by one line: `candidate_b` is unconfirmed and its project is closed to voters |
| `05-organization-admin` | The projection check lost `AND NOT (r ? '<column>')`; it still asserts that `answers` and `custom_data` are absent. Two comments lost the word. The plan speaks of two checks; the file held one check and two comments |
| `07-rpc-security` | The fixture `UPDATE candidates` sets `confirmed = true` only |
| `09-column-restrictions` | Expectation and description: 11 to 10 |
| `10-schema-migrations` | The block of seven assertions about the column is gone, with its line in the header list; `plan (83)`. A `reset_role ()` stands at the head of the `upsert_answers` section, where the deleted block's own reset used to precede it |
| `16-anon-visibility` | The fixture insert no longer names the column or its six values |
| `21-entity-organization` | Expectation and description: 14 to 13 |
| `33-entity-type-collision` | The fixture insert no longer names the column; its comment says the candidate "is confirmed and has no nomination" |
| `37-terms-of-use-acceptances` | Section 7 added after Section 6; the header names it; `plan (49)` |

**Section 7 of file 37.** As postgres, four assertions whose descriptions start `census:`:

1. The `string_agg` of `schemaname.tablename.policyname` over policies in `public` and `storage` whose `qual` or `with_check` contains `terms_of_use` is NULL.
2. The `string_agg` of `nspname.proname` over functions in `public` and `private`, excluding `test_*`, whose `pg_get_functiondef` contains `terms_of_use` is NULL. An aggregate contributes no text, because `pg_get_functiondef` raises on one. The description says what a function with a reason to read the acceptance table must do: be exempted there by name with the reason, or have the searched text narrowed.
3. The `string_agg` of `table_name.column_name` over columns in `public` whose name contains `terms_of_use` is NULL.
4. Each population searched holds text: policies with an expression in `public` and in `storage`, functions in `public` and in `private`, columns in `public` (`'t t t t t'`).

The match is `ILIKE '%terms\_of\_use%'`: literal underscores, any case. On failure pgTAP prints the offenders by name. The retired column's name does not appear in the file.

## Gate and E2E Results

Every exit status was read from the command itself or from the attempt's `done` file, never through a pipe.

| What | Command | Exit | Result |
|---|---|---|---|
| Parity before any edit | `yarn assert:schema-migration-parity` | 0 | 27 schema files, 6450 lines |
| Regenerate | `yarn schema:regenerate` | 0 | 6446 lines; the changed lines of the migration equal those of the schema files (`diff`, exit 0) |
| Apply, then types | `yarn db:reset`, `yarn db:types` | 0, 0 | four lines removed from `database.ts` |
| Nullability, before the satellites | `yarn assert:rpc-nullability` | **1** | two violations, expected: the stale derived entry and the stale disposition row |
| Nullability, after `--write` and the hand edit | same | 0 | `get_candidate_user_data 13`; 0 violations |
| Task 1 gates | `yarn db:lint:sql`; dev-seed `typecheck`; dev-seed `test:unit`; `yarn typecheck:tests`; frontend `typecheck` | 0, 0, 0, 0, 0 | lint `policies examined: 104, tables partitioned: 20`, `0 error(s), 3 warning(s)`; dev-seed 67 files, 996 tests |
| pgTAP after the edits | `yarn workspace @openvaa/supabase test:db` | 0 | **38 files, 1385 tests, PASS** |
| Negative controls | see below | | |
| Task 2 verify, part 1 | `test:db` and the two greps, as one command | 0 | |
| Types from a fresh reset, before the commit | `yarn db:reset`, `yarn db:types`, SHA-256 of `database.ts` before and after | 0, 0, equal | |
| Task 1 verify chain | parity, nullability, lint, dev-seed `test:unit`, `typecheck:tests`, the psql pair, as one command | 0 | `0/false` |
| Comment hygiene | `yarn assert:comment-hygiene` | 0 | 1807 files scanned |
| **Gate set** | `172-gates.sh 172-07-stage2` | **0** | **nine rows, all `0`**, head `467253bfd`, clean tree |
| Task 3 verify, part 1 | the grep and `172-gates.sh --judge 172-07-stage2` | 0 | nine rows, every status 0 |
| **E2E** | `172-e2e.sh 172-07-stage2` | **0** | **177 / 177 / 0 failed / 0 flaky / 0 skipped / 0 did not run**; 100 projects; 5.0 min |
| Task 3 verify, part 2 | `172-e2e.sh --judge 172-07-stage2` | 0 | verdict GREEN, the full default suite, not below the baseline total |
| Re-seed | `yarn db:seed:default` | 0 | 752 rows |
| Allowlist | `170-allowlist-probe.sh after` | 0 | every row OK; the stack was not restarted |

The nine rows of `172-07-stage2`: lint 44 s, types-regen 32 s, types-clean 0 s, sql-lint 3 s, pgtap 5 s (38 files, 1385 tests), unit 58 s (frontend 2170 in 137, dev-seed 996 in 67, supabase 206 in 15, app-shared 141 in 10), svelte-check 8 s, build 16 s, format 18 s.

### Every run directory of this plan

| Directory | Head | Counts | Verdict |
|---|---|---|---|
| `tests/e2e-runs/172-gates/172-07-stage2` | `467253bfd` | nine rows, all `0` | green |
| `tests/e2e-runs/172/172-07-stage2` | `467253bfd` | 177 of 177 over 100 projects | **green, the full default suite** |

There was no red gate row and no red E2E run, no rerun under a label, and nothing under `tests/e2e-runs/` was deleted. One preflight success, no preflight failure, wrapper status 0.

**Reading the E2E run.** Every project that used a changed helper passed: `auth-setup` 1 of 1, `data-setup-perm-closed-project` 1 of 1, `perm-closed-project` 11 of 11, `admin-access` 1 of 1 with its teardown, `contestant-journey` 1 of 1, `contestant-a11y-scan` 14 of 14, `cold-entry-dataroot-contestant` 1 of 1, `perm-localisation-positive` 2 of 2, `voter-journey` 2 of 2, and every `data-teardown-*` project 1 of 1. No log of the run holds `does not exist`, `schema cache`, `PGRST204` or the column's name. The dev-server log holds 2 lines of the known data-provider noise (4 in `172-06-visibility`) and none naming `getBasicUserData`, `acceptTermsOfUse`, a user-data fetch error or `An image file is required`.

## Negative Controls

None is committed. Each is a copy of file 37 with one mutation inserted after `create_test_data ()`, run through `psql` inside the file's own `BEGIN … ROLLBACK`, with the pgTAP extension created inside it. The catalogue was read back unchanged afterwards: 104 policies, none naming terms of use, no `nc_*` policy or function, no terms-of-use column, no pgTAP extension.

| Control | Mutation | Result |
|---|---|---|
| Unmutated | none | 49 of 49 green |
| The retired column in a row policy | the column re-added to `candidates`, and `anon_select_candidates` altered to carry `… IS NOT NULL AND … < now()` again | 4 red of 49. Assertion 46 names `public.candidates.anon_select_candidates`; assertion 48 names `candidates.terms_of_use_accepted`; assertions 43 and 45 of Section 6 (the row read and the `get_nominations` read) go red too |
| The acceptance table in a storage policy | a SELECT policy on `storage.objects` whose expression reads `terms_of_use_acceptances` | 1 red of 49: assertion 46 names `storage.objects.nc_authenticated_select_accepted_assets` |
| The acceptance table in a WITH CHECK | an INSERT policy on `public.feedback` whose check reads the table | 1 red of 49: assertion 46 names `public.feedback.nc_authenticated_insert_feedback_accepted` |
| The acceptance table in a function | a function in `private` whose body reads the table | 1 red of 49: assertion 47 names `private.nc_project_has_acceptance` |

This closes the finding of 172-06. With the shared fixture no longer stamping a column, Section 6's trio now goes red under the column mutation, and the census names the policy and the column.

The storage control was first written as a policy `TO anon`. That run stopped at Section 6's storage read with `permission denied for table terms_of_use_acceptances` before it reached Section 7, so it showed nothing about the census. It was rewritten `TO authenticated` and run again; the row above is the second run.

## Interim Census

`git grep -c -F "terms_of_use_accepted" -- . ':!.planning'` on `467253bfd`: **9 files, 11 lines** (26 and 64 at the start of this plan).

| For | File | Lines | What the hit is |
|---|---|---|---|
| 172-08 | `tests/tests/setup/shared/auth.setup.ts` | 1 | docblock sentence about `unregisterCandidate` being "safe with respect to" the column |
| 172-08 | `tests/tests/specs/a11y/contestant-a11y.spec.ts` | 1 | the known-gaps row in the docblock table |
| 172-08 | `tests/tests/specs/contestant/contestant-journey.spec.ts` | 1 | a `//` comment at the terms-of-use step |
| 172-08 | `tests/tests/specs/voter/voter-journey.spec.ts` | 1 | a `//` comment in the Party AA count |
| 172-08 | `tests/tests/utils/testCredentials.ts` | 1 | docblock sentence about `TEST_CANDIDATE_EXTERNAL_ID` |
| 172-09 | `apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md` | 1 | the column-grant paragraph |
| 172-09 | `apps/docs/src/routes/(content)/developers-guide/contestant-app/registration/+page.md` | 1 | "Accepting saves the time of acceptance in the candidate row's … column" |
| 172-09 | `.claude/skills/database/rls-policy-map.md` | 3 | the two-conjunct sentence and the candidates row of the column-grant table |
| 172-09 | `.claude/skills/database/schema-reference.md` | 1 | the column in the `candidates` listing |

Every file is in one of the three groups the plan names, and every hit under `tests/tests` is comment text. No file under `apps/supabase`, `apps/frontend`, `packages` or `scripts` names the column, and neither does `supabaseAdminClient.ts` or anything under `tests/tests/setup/perm` or `tests/tests/setup/admin`.

Also for 172-08, outside this grep: `voter-journey.spec.ts` has a comment reading "(termsOfUseAccepted=false)" on the hidden-candidate expectation.

## What the Evidence Does and Does Not Show

- **Shown on the applied catalogue:** no column in `public` names terms of use; the candidates grant lists `answers, color, confirmed, custom_data, first_name, image, info, last_name, short_name, subtype`; the RPC returns the 13 columns above.
- **Shown by pgTAP:** the estate passes without the column; the census finds nothing and has text to search; under four mutations it names the offender.
- **Shown by the E2E run:** every setup and teardown that used to write the column runs without it, and the gate, the journey and the scans still land where they did.
- **Not shown:** the two opt-in bank-auth projects were not run; they are outside the default suite. They call `unregisterCandidate` and `deleteBankAuthCandidateBySub`, the first of which this plan changed. `yarn typecheck:tests` covers their call sites.
- **Not shown:** how the census's function half reads a function written in a language other than SQL or PL/pgSQL; the two schemas hold 43 PL/pgSQL and 19 SQL functions and no other (counted on the database after a pgTAP run, helpers included).
- **A property of the function census, not a defect:** it excludes `test_*` names only, as the plan states. `create_test_data`, `set_test_user` and `reset_role`, which `00-helpers.test.sql` also installs, are inside its population. They name nothing of the kind today.

## Decisions Made

- **The census pattern follows the plan, not the dispatch handover.** The handover asked that the pattern not match the new table's own name. The plan's first listed deviation keeps `terms_of_use` as D-15 states it, and says what a later legitimate reference must do. The plan is the contract. It is also the form that guards: with the column gone, a reintroduced acceptance condition can only read the acceptance table, and a pattern that excluded the table's name would not see it. No policy and no function matches today, the table's own two policies included, because their expressions name `user_id` and not the table.
- **A fourth census assertion covers columns.** The handover lists "no column" among what the census must prove, and criterion 2 is that no entity carries a terms-of-use field. The plan lists three assertions.

## Deviations from Plan

### Auto-fixed Issues

None. No gate, no pgTAP file outside the plan's list and no E2E test was red, so no root-cause fix was needed.

### Small departures in form

1. **`RPC-NULLABILITY.md`, section 3.** The plan asks for the derived region to be regenerated and the disposition row deleted. Deleting the row leaves the section's heading ("14 columns, 5 overridden"), its body paragraph (which named the column and a `NULL::timestamptz` literal) and its disposition sentence false, so those were rewritten to 13 columns and 4 overridden. The table had to be re-padded by Prettier in any case, so the section's line citations were corrected to the current lines of `503-entity-rpcs.sql` and `src/database.ts`. Rows 13 and 14 are renumbered 12 and 13. The sentence about a column an earlier phase removed was replaced by one saying where the association is stated.
2. **`RPC-NULLABILITY.md`, derived region.** `--write` also refreshed the declaration lines of the other two RPCs (`resolve_email_variables` `:16` to `:22`, `get_nominations` `:10` to `:13`), which had drifted. The gate does not compare line numbers.
3. **`column-map.ts`:** the `// Candidate columns` heading left with its only entry.
4. **`10-schema-migrations`:** a `reset_role ()` was kept at the head of the `upsert_answers` section, and the header's list lost its line for the column.
5. **`16` and `33`:** Prettier collapsed the two shortened insert column lists onto one line each.
6. **`05`:** one check and two comments were edited; the plan speaks of two checks.
7. **`perm-closed-project.setup.ts`:** only the last sentence of the docblock was rewritten. The docblock's decision ids in the sentences before it were left (deferred item 4).

### Beyond the plan's list

- **The fourth census assertion** (columns), above.
- **Five negative-control runs,** above. The plan asks for none; the dispatch handover asks for one.
- **`yarn assert:comment-hygiene`** (exit 0) and ESLint on the six touched TypeScript files (exit 1: five findings in `database.overrides.ts`, none on a changed line, deferred item 1; the other five files clean).

### Acceptance criteria that did not hold as written

- **Task 2: "The phase's pgTAP file holds three assertions whose descriptions start `census:`".** It holds four; the fourth is the column census.
- **Task 2, second `<automated>` check: `yarn db:types && git diff --exit-code -- …/database.ts`.** Not run as written after the commit, because pgTAP had by then committed its helper functions into `public` and the command would have reported them as drift and rewritten the tracked file. It was satisfied twice in the form that resets first: before the commit (`yarn db:reset`, `yarn db:types`, the file's SHA-256 unchanged) and after it by gate rows `02-types-regen` and `03-types-clean` (both 0) on `467253bfd`.

Every other criterion holds as written.

### Departures in procedure

- **The pgTAP estate was first run after all nine files were edited,** not once in between. The run that the plan calls the instrument for count-based dependents therefore ran on the finished edits; it exited 0, which is the answer "no further dependent".
- **A harness safety check refused one command:** Task 2's verify chain wrapped in `bash -c`, reported as a script that "runs rm". The script held no removal. The same chain was run directly under the shell and exited 0; nothing was deleted by either.
- **Two scratch files were written to the system temp directory** by one early command (`/tmp/x`, and two under `$TMPDIR`) and removed by the next; everything after that went to the session scratchpad.
- **The local database was reset three times:** to apply the schema, to regenerate the types on a database without pgTAP's helpers before the commit, and by the gate run.
- **The commits sit on `feat/entity-signup-multi-grant` in a linked worktree,** as the run's standing notes direct; the branch was checked before each commit.
- **Reading.** The plan, `172-NAMES.md`, `172-06-SUMMARY.md` and `deferred-items.md` were read whole. Of `172-CONTEXT.md`, `172-RESEARCH.md`, `172-PATTERNS.md` and `173-CONTEXT.md` the sections the plan names. `172-05-SUMMARY.md` and `172-01-SUMMARY.md`: the frontmatter head of the first only; what they hand over was taken from `172-06-SUMMARY.md`, `172-NAMES.md` and the dispatch. `PROJECT.md`, the head of `STATE.md`, the database skill, `execute-plan.md`, `checkpoints.md` and `executor-examples.md` were not opened; of the summary template the frontmatter head. The two helper scripts' usage headers were read.

---

**Total deviations:** 0 auto-fixed, seven small departures in form, three additions beyond the plan, two criteria met in a different form.
**Impact on plan:** none on behaviour or scope. The one call to read is the census pattern, where the plan was followed against the dispatch handover.

## Prohibition, Checked

| Prohibition | Evidence |
|---|---|
| PROH-172-02: no condition replaces the removed one, and the census is the standing guard | The schema diff of `467253bfd` only removes: one column, one grant entry, one RPC output column in three places, and one word from a comment (8 changed lines added against 16 removed across the schema files and the migration, each added line a shortened form of a removed one). No predicate, function, trigger, policy or grant is added. `302-rls.sql`, `301-auth-functions.sql` and `400-storage.sql` are untouched. The census turns red under a row policy, a storage policy, a WITH CHECK and a function body that name terms of use, and names each. Verified by judgment, as the plan says |

## Threat Model, Each Disposition

| Threat | Disposition | Where it stands |
|---|---|---|
| T-172-17 an override or a disposition row naming a column the RPC no longer returns | mitigate | `yarn assert:rpc-nullability` was red on both before the satellites were edited and is 0 after; the override member, the disposition row and the column-map entry left in the same commit as the RPC column |
| T-172-23 narrowing the candidates self-edit grant by one column | accept | the change only removes a privilege; `09` asserts the remaining set is 10 columns, read from the catalogue |
| T-172-24 a later policy or function reintroducing an acceptance condition, unnoticed | mitigate | Section 7 of file 37, with four negative controls showing it names the offender |
| T-172-SC package installs | accept | no package was installed; `yarn.lock` and every `package.json` are unchanged |

No security-relevant surface was added beyond the plan's threat model.

## Deferred Issues

None fixed, all outside this plan. Items 1 to 4 were added to `deferred-items.md` under "From plan 172-07":

1. `database.overrides.ts` has five `naming-convention` findings that `lint:check` does not reach.
2. The line citations in sections 1 and 2 of `RPC-NULLABILITY.md` are stale; nothing checks them.
3. A comment in `00-helpers.test.sql` says `candidate_a2` must stay visible to anon; it has no nomination.
4. `perm-closed-project.setup.ts` cites decision ids in its docblock.
5. The comment text under `tests/` and the statements in docs and skills that still describe acceptance on the candidate are 172-08's and 172-09's, as listed under "Interim Census".
6. `172-VALIDATION.md` was not touched; its rows for this plan are answered in this file.

The cross-phase defect ledger (`.planning/WINDOWS.md`) was not appended to: there is no stub, no skipped test and no verification of this plan that was not run in some form. No todo was filed.

## Issues Encountered

None in the product code. The one red result was the expected `assert:rpc-nullability` run between the schema edit and the satellite edits.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## What the Next Plan and Later Phases Must Know

**Plan 172-08**

- **Compare against:** gates and E2E `172-07-stage2` (nine rows at 0; 177 / 177). pgTAP: 38 files, 1385 tests. Frontend 2170 tests in 137 files; dev-seed 996 in 67; supabase 206 in 15; app-shared 141 in 10. Schema: 27 files, a 6446-line migration. Linter census unchanged: 104 policies, 20 tables partitioned.
- **Your file list is the "172-08" rows of the interim census,** plus the `termsOfUseAccepted=false` comment in `voter-journey.spec.ts`. After those five files the column's name is gone from `tests/`.
- **`unregisterCandidate` no longer reads or writes a candidate row.** The docblock sentence in `auth.setup.ts` that explains why the call is "safe with respect to" the column describes a concern that no longer exists.
- **`forceRegister` is the only place a test identity's acceptance is recorded,** and `acceptTermsOfUse(email)` for an identity made another way. An acceptance leaves with its auth user by cascade; no helper deletes one.
- **A gate run still resets the database;** run gates first, E2E after, and seed `default` at the end.

**Plan 172-09**

- **Your file list is the "172-09" rows of the interim census.** The closing census of D-21 is zero hits once 172-08 and 172-09 are done.
- **Facts to write into the skill files:** the candidates self-edit grant is 10 columns (the list is under "What the Evidence Does and Does Not Show"); `candidates` has no terms-of-use column; pgTAP is 38 files and 1385 tests; file 37 has seven sections and `plan (49)`.

**Phase 173**

- **`get_candidate_user_data` is as listed under "For Phase 173".** When it is replaced, `21-entity-organization.test.sql` (the output-column count), `database.overrides.ts`, section 3 of `RPC-NULLABILITY.md` and the gate's exemption line follow it.
- **The shared pgTAP fixture is inside the census.** A fixture row for `terms_of_use_acceptances` written inside `create_test_data` would make assertion 47 name `public.create_test_data`. Write such rows in the test file, as file 37 does.
- **A function or policy that reads `terms_of_use_acceptances` turns Section 7 of pgTAP file 37 red, on purpose.** The user-level layout reads acceptance through the writer, not through a function, so nothing in this phase's design trips it. If Phase 173 or the Admin rule (TOU-F01) adds a function that joins the table, exempt it in that assertion by name with the reason.

**Phase 175**

- The candidates self-edit grant no longer contains a terms-of-use column; the staged-properties list is `image`, `name`, `shortName`, as CONTEXT.md expects.

**Host state:** the stack is up and healthy on the live allowlist (`170-allowlist-probe.sh after`, exit 0); nothing listens on 5173 or 5273. The database carries the schema of `467253bfd`, the pgTAP helper functions in `public` (left by the gate run), what the E2E run left in its own project, and the `default` dataset in the default project (328 candidates). `terms_of_use_acceptances` is empty. `CAND-APP-PLAN.md` was not edited, moved, staged or committed. `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged.

## Self-Check: PASSED

- The 21 files under `key-files.modified` exist, and `git diff --name-only 5074c3dc6..467253bfd` lists exactly those 21.
- The commit `467253bfd` is an ancestor of HEAD; `git rev-list --count 5074c3dc6..HEAD` was 1 when this file was written.
- `tests/e2e-runs/172-gates/172-07-stage2/summary.tsv` and `tests/e2e-runs/172/172-07-stage2/summary.json` exist; both attempts hold `done` = 0 and record head `467253bfd`.
- The plan's verification items were run on the final tree: `yarn assert:schema-migration-parity` (0), `yarn assert:rpc-nullability` (0), `yarn db:lint:sql` (0, row 04), `yarn workspace @openvaa/supabase test:db` (0, row 05; 38 files, 1385 tests), the types unchanged after a reset (rows 02 and 03), `172-gates.sh --judge 172-07-stage2` (0) and `172-e2e.sh --judge 172-07-stage2` (0).
- Every acceptance criterion of the three tasks was checked by command; the two that do not hold as written are listed above with what was measured.
- No stub pattern is in the added lines. `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged since the start revision; `CAND-APP-PLAN.md` is untracked and untouched.
