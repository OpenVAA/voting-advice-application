---
phase: 172-terms-of-use-per-user-and-project
plan: 06
subsystem: database
tags: [supabase, postgres, rls, storage, pgtap, dev-seed, terms-of-use, visibility, e2e, playwright]

requires:
  - phase: 172-terms-of-use-per-user-and-project
    provides: "Plan 01: the acceptance table, pgTAP file 37 and the two gate helpers. Plan 04: the gate decided on user-level data. Plan 05: no file under apps/frontend names the candidate column"
provides:
  - "anon_select_candidates and the public disjunct of authenticated_select_candidates with the same three conditions as the other three entity tables: project open for voters, entity confirmed, confirmed nomination"
  - "private.nomination_entities_confirmed whose candidate arm equals its organization arm; public.storage_path_is_public whose entity branch has no per-table addition"
  - "pgTAP guards in 05, 18 and 25 that compare the eight entity SELECT policies with no clause stripped"
  - "pgTAP 37 Section 6: with the acceptance table empty, anon reads a confirmed candidate's row, its file in public-assets and its get_nominations row"
  - "e2e/base control rows test-e2e-base-ca-aa-hidden and test-e2e-base-ca-aa-unregistered seeded confirmed: false"
  - "No dev-seed template states terms_of_use_accepted; permittedKeys.ts is the one file under packages/dev-seed that still names it"
  - "The boundary proof of 172-05: the contestant journey's portrait upload and answer saves pass from a browser"
affects: [172-07, 172-08, 172-09, 173, 174, 175]

actuals:
  tokens: 23130
  tasks: 3
  commits: 3
plan_head_before: ed119aad464a5807642caff8aa1c624ab2bf6f77
plan_head_after: aff4ddc121ac053d4108b33efc3786920fb33702

tech-stack:
  added: []
  patterns:
    - "A seed row that must stay hidden from voters states confirmed: false; the import's confirmed default is the whole entity-side condition of public read"
    - "A pgTAP section whose premise is an empty table deletes what earlier sections of the same transaction left and then asserts the emptiness, so the premise is stated and not assumed"
    - "A guard that normalised a per-table clause away is tightened by removing the strip, and shown to bite by running the file against a mutated policy inside a rolled-back transaction"

key-files:
  created: []
  modified:
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/schema/302-rls.sql
    - apps/supabase/supabase/schema/400-storage.sql
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/schema/102-entities.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/03-anon-read.test.sql
    - apps/supabase/supabase/tests/database/05-organization-admin.test.sql
    - apps/supabase/supabase/tests/database/16-anon-visibility.test.sql
    - apps/supabase/supabase/tests/database/18-entity-policies.test.sql
    - apps/supabase/supabase/tests/database/20-storage-authority.test.sql
    - apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql
    - apps/supabase/supabase/tests/database/37-terms-of-use-acceptances.test.sql
    - packages/dev-seed/src/templates/e2e/base.ts
    - packages/dev-seed/src/templates/e2e/perm/shared.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-localisation-positive.ts
    - packages/dev-seed/src/templates/defaults/candidates-override.ts
    - packages/dev-seed/src/supabaseAdminClient.ts
    - packages/dev-seed/tests/templates/base.test.ts
    - packages/dev-seed/tests/templates/default.test.ts
    - packages/dev-seed/tests/integration/default-template.integration.test.ts

key-decisions:
  - "D-13's other branch was not needed: the journey's preview step shows the portrait of the candidate seeded confirmed: false, so the harness confirms nothing and that candidate never becomes public during a run"
  - "The comment on candidates.terms_of_use_accepted in 102-entities.sql was corrected although the file is not in the plan's list: it stated a visibility rule this plan's schema change makes false"
  - "pgTAP 37 Section 6 deletes the acceptance rows the file's earlier sections left before it asserts the table empty: candidate_a, the editor of candidate A, holds two rows by then"
  - "In pgTAP 16 the fixture candidate and nomination that only the deleted case used were removed with the case, not left as a visible row with no assertion"
  - "In pgTAP 20 the numbered labels after the deleted case were renumbered so that they keep matching pgTAP's own test numbers"

patterns-established:
  - "Hide a seeded entity from voters with confirmed: false on the row; nothing else hides a confirmed, nominated entity of an open project"

requirements-completed: [TOU-02]

coverage:
  - id: D1
    description: "No policy in public or storage and neither visibility function names terms of use on the applied database; the two candidate SELECT policies read as their organization counterparts apart from the table name and the entity-type literal"
    requirement: TOU-02
    verification:
      - kind: other
        ref: "Task 1's automated check as one command under bash (exit 0): parity, db:lint:sql, vitest base.test, and the psql pair printing 0/0; pg_policies read back for candidates and organizations"
        status: pass
    human_judgment: false
  - id: D2
    description: "The eight entity SELECT policies are compared with no special case for candidates, and the comparison fails when the candidate policies carry an extra condition"
    requirement: TOU-02
    verification:
      - kind: integration
        ref: "05-organization-admin.test.sql ('ONE expression modulo the table name and the entity-type literal'), 18-entity-policies.test.sql ('SELECT family ...'), 25-matrix-conformance.test.sql (the two RELATIVE assertions), inside yarn workspace @openvaa/supabase test:db (exit 0; Files=38, Tests=1388)"
        status: pass
      - kind: other
        ref: "negative control: the three files run through psql in a rolled-back transaction with both candidate policies altered to carry the old condition: 05 1 red of 21, 18 1 red of 59, 25 2 red of 40; unmutated in the same harness 21, 59 and 40 green; catalogue unchanged afterwards"
        status: pass
    human_judgment: false
  - id: D3
    description: "With the acceptance table empty, anon reads a confirmed candidate's row, its file in public-assets and its get_nominations row"
    requirement: TOU-02
    verification:
      - kind: integration
        ref: "37-terms-of-use-acceptances.test.sql#Section 6 (assertions 42 to 45)"
        status: pass
      - kind: other
        ref: "negative control: with anon_select_candidates conditioned on an acceptance row existing for the project, assertions 43 and 45 go red (43 ok, 2 not ok). With the policies conditioned on the candidate column the section stays green (45 of 45), because the shared fixture still stamps that column: the section guards against a row-based condition, not against the column"
        status: pass
    human_judgment: false
  - id: D4
    description: "A candidate whose terms_of_use_accepted column is NULL and for whom no acceptance row exists is anon-visible as a row, a file and a nomination; unconfirming it hides all three"
    requirement: TOU-02
    verification:
      - kind: other
        ref: "psql probe in a rolled-back transaction on the fixture: column NULL, 0 acceptance rows: row/file/nomination = 1/1/1; the same candidate with confirmed = false: 0/0/0"
        status: pass
      - kind: other
        ref: "the default dataset seeded after the runs: 328 candidates in the default project, the column NULL on every one, 327 anon-visible (the 328th is seed.sql's unnominated candidate); get_nominations as anon returns candidate 327, organization 40, alliance 10"
        status: pass
    human_judgment: false
  - id: D5
    description: "The two e2e/base control rows state confirmed: false and no other candidate states the key"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/templates/base.test.ts#baseTemplate — registration + hierarchy invariants (three cases)"
        status: pass
      - kind: other
        ref: "the R-3 census adapted to the new rule (exit 0): 31 templates, 0 fixed rows stating the column, explicitConfirmed exactly the two controls, both false"
        status: pass
    human_judgment: false
  - id: D6
    description: "The set of entities voters see on e2e/base is unchanged: 13 candidate cards, 5 Party AA members, Show all 5, the hidden candidate absent"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/172/172-06-visibility: voter-journey 2 of 2, every step ok, among them 'organisation matching shows 5 cards, Party BB members, and Party AA show-all/collapse' and 'matching ranks perfect-match first ...'; voter-journey.spec.ts unmodified"
        status: pass
    human_judgment: false
  - id: D7
    description: "No dev-seed template states the column; the key stays permitted"
    verification:
      - kind: other
        ref: "git grep -l terms_of_use -- packages/dev-seed lists permittedKeys.ts only; yarn workspace @openvaa/dev-seed test:unit (exit 0; 67 files, 996 tests) and typecheck (exit 0)"
        status: pass
    human_judgment: false
  - id: D8
    description: "candidates.terms_of_use_accepted still exists as a column, in the self-edit grant and in the user-data RPC"
    verification:
      - kind: other
        ref: "git grep on 102-entities.sql and 303-column-grants.sql (the column line and the grant line); information_schema.columns count 1; database.ts unchanged after yarn db:types"
        status: pass
    human_judgment: false
  - id: D9
    description: "The plan closes green on one tree: nine static gates at 0 and the full default E2E suite at 177 of 177"
    verification:
      - kind: other
        ref: "bash 172-gates.sh --judge 172-06-visibility (exit 0; nine rows, every status 0; head aff4ddc12, clean tree)"
        status: pass
      - kind: e2e
        ref: "bash 172-e2e.sh --judge 172-06-visibility (exit 0; 177 total, 177 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; the full default suite; head aff4ddc12)"
        status: pass
    human_judgment: false
  - id: D10
    description: "Boundary proof of 172-05: the store's save() and the image-only writer work from a browser"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/172/172-06-visibility: contestant-journey 1 of 1; step 13 (portrait errors, valid upload, submit), steps 16 to 19 (answer saves), step 21 (preview: info, portrait, opinion answers); the dev-server log holds no 'An image file is required' line"
        status: pass
    human_judgment: false
  - id: D11
    description: "PROH-172-02: no condition replaces the removed one; confirmed remains the only entity-side lever and nobody new sets it"
    verification: []
    human_judgment: true
    rationale: "The plan marks the prohibition as verified by judgment. The supporting facts are measured and listed under 'Prohibition, Checked'."
  - id: D12
    description: "T-172-15, the accepted widening: a confirmed candidate with a confirmed nomination in an open project is public whether or not anyone has registered, signed in or accepted"
    verification: []
    human_judgment: true
    rationale: "A decided consequence listed for operator review. It is measured (D4: 327 never-registered candidates of the default dataset are anon-visible); whether to accept it is the operator's call."

duration: 27min
completed: 2026-10-06
status: complete
---

# Phase 172 Plan 06: The Acceptance Condition Leaves the Visibility Sites Summary

**A candidate is now visible to voters exactly when its project is open for voters, it is confirmed and a confirmed nomination links it there: the two candidate SELECT policies, the candidate arm of `nomination_entities_confirmed` and the entity branch of `storage_path_is_public` no longer ask about terms of use; the two `e2e/base` control rows are seeded unconfirmed so the voter-visible set is unchanged; no seed template states the column, which itself survives for 172-07; and the plan closed on one tree with nine gate rows at 0 and 177 of 177 E2E tests.**

## Performance

- **Duration:** about 27 min of work, in two stretches. Started 2026-10-06T01:39:58Z; the three task commits landed by 01:52:38Z; the run was then interrupted by an API authentication error and resumed at about 05:47Z; the closing gate set, the E2E run, the re-seed and this file followed, ending about 06:05Z.
- **Tasks:** 3 of 3
- **Files changed outside `.planning/`:** 21 (the plan lists 20; the extra one is `102-entities.sql`, deviation 1)
- **Start revision:** `ed119aad464a5807642caff8aa1c624ab2bf6f77`
- **The tree the gate run, the E2E run and every closing check describe:** `aff4ddc121ac053d4108b33efc3786920fb33702`, clean apart from the operator's untracked `CAND-APP-PLAN.md`

## What the Plan Asked to Have Recorded

| Item | Value |
|---|---|
| pgTAP `plan (N)` deltas, each counted on the edited file | `03`: 59 to 56 (−3). `05`: 22 to 21 (−1). `16`: 52 to 51 (−1). `18`: 60 to 59 (−1). `20`: 46 to 45 (−1). `25`: 41 to 40 (−1). `37`: 41 to 45 (+4). Estate: 38 files, 1392 to 1388 tests |
| Dependents the pgTAP run surfaced that the plan did not name | **None.** The first run after the schema change was red in exactly six assertions, one in each of the six files the plan lists (`03` test 11, `05` test 19, `16` test 6, `18` test 55, `20` test 19, `25` test 40). No other file went red. Assumption A3 held for this plan |
| The journey's preview assumption (A1) | **Held.** Step 21 of `contestant-journey` ("preview: info + portrait + opinion answers + NO voter-comparison") passed for the candidate seeded `confirmed: false`. D-13's other branch was not applied: the harness confirms nothing |
| Template census (step 4), by the R-3 command adapted to the new rule | `default fixed 0 count 327 statingColumn [] explicitConfirmed []`; `e2e/base fixed 30 count 0 statingColumn [] explicitConfirmed ["test-e2e-base-ca-aa-hidden=false","test-e2e-base-ca-aa-unregistered=false"]`; `templates 31 fixedRowsStatingColumn 0`. No built-in template states the column on a fixed row; exactly the two control rows of `e2e/base` state `confirmed` |
| Boundary proof of 172-05 | **Green.** The journey's portrait upload (step 13) and its answer saves (steps 16 to 19) passed through the changed `save()` and the image-only writer |

## Accomplishments

- The acceptance condition is gone from all four sites, and each rewritten comment states the rule as it is.
- The migration was regenerated and its changed lines are, line for line, the changed lines of the schema files.
- Six pgTAP files lost the cases and strips that existed for the condition; the three policy-identity guards now compare the eight policies verbatim and were shown to go red when the candidate policies differ.
- pgTAP 37 gained the trio, with its premise asserted.
- The two control rows are unconfirmed; the voter journey's counts held.
- Every template line stating the column is gone: 28 rows of `e2e/base`, `buildCandidate`, the localisation template's row and the default override's stamp.
- The plan closed on one tree, and the default dataset was seeded again.

## Task Commits

1. **Task 1, step 2: the two control rows** — `6e200ea88` `test(172-06): seed the two e2e/base control candidates unconfirmed`
2. **Tasks 1 and 2: the schema change with its pgTAP changes, one commit** — `1aebfb1b4` `feat[db](172-06): decide candidate visibility on the same three conditions as every other entity type`
3. **Task 3: the templates** — `aff4ddc12` `refactor(172-06): stop the seed templates stating the candidate terms-of-use column`

`git rev-list --count ed119aad4..aff4ddc12` is 3. The commit that carries this file follows them. Task 3's close (gate set, E2E run) changed no source file.

## The Rule as Applied

Read back from `pg_policies` on the reset database:

```
anon_select_candidates
  (( SELECT project_open_for_voters(candidates.project_id)) AND confirmed
   AND ( SELECT private.entity_has_confirmed_nomination('candidate'::entity_type, candidates.id, candidates.project_id)))

authenticated_select_candidates
  (( SELECT user_can('project', candidates.project_id, 'project.read_entities'))
   OR (<the anon qual, verbatim>)
   OR ( SELECT user_can('entity', candidates.id, 'entity.read_answers', 'candidate'::entity_type)))
```

Both equal the organization policies once `candidates` / `'candidate'` are replaced. `private.nomination_entities_confirmed`: the candidate arm is `e.confirmed AND public.project_open_for_voters(e.project_id) AND private.entity_has_confirmed_nomination('candidate', e.id, e.project_id)`, as the other three arms. `public.storage_path_is_public`: the entity branch runs `SELECT e.confirmed FROM public.%I e WHERE e.id = $1 AND e.project_id = $2` for all four tables and then asks `entity_has_confirmed_nomination`; the CASE is gone. `get_nominations` is unchanged in code; one comment paragraph above its trailing filter was removed.

## pgTAP, File by File

| File | Removed | Kept or reworded |
|---|---|---|
| `03-anon-read` | the three cases at the end of Section 1 (acceptance NULL, in the future, in the past), the two ephemeral candidates and their two nominations, and the comment above `plan` that counted them | everything else; "anon can SELECT publicly visible candidates" and "anon cannot see unconfirmed candidates" stand |
| `05-organization-admin` | the `replace(…)` that stripped the clause from the candidates side; the companion that pinned the clause to exactly two policies | the identity assertion, now over the two quals as they are; the header and the comment above it say "modulo the table name and the entity-type literal". The two `get_entity_basic_data` projection checks are untouched (172-07) |
| `16-anon-visibility` | the case that flipped the condition alone; the fixture candidate `…000000000006` and its nomination `…0000000000a6`, which only that case used | the all-true case lists three conditions; the comment above the biconditional says what the two expressions are; Section 9's comment and its positive case no longer list acceptance. The fixture insert still names the column (172-07) |
| `18-entity-policies` | the inner `replace(…)` of the SELECT-family normaliser; the `2/8` companion | the SELECT-family identity assertion; the comment says all five families collapse under the two replacements alone |
| `20-storage-authority` | case 19 (DENY, the condition flipped alone) with its two `UPDATE` statements | case 13 says three conjuncts hold; the set's header says two positives and four negatives; cases 17 and 18 no longer mention terms. Every label after the deleted case was renumbered by one (deviation 4). The file holds no mention of terms of use in any spelling |
| `25-matrix-conformance` | the outermost `regexp_replace` of `m17_assembly.norm`; the ABSOLUTE assertion that both candidate assemblies carry the two terms | the count of eight, the two RELATIVE assertions, the verbatim-disjunct assertion and the three other ABSOLUTE assertions |
| `37-terms-of-use-acceptances` | nothing | Section 6 added after Section 5: four assertions. The header and the `Depends on` line name it |

**Section 6 of file 37.** As postgres: `DELETE FROM terms_of_use_acceptances` (the earlier sections leave `candidate_a`, the editor of candidate A, with two rows), one `storage.objects` row at `<project A>/candidates/<candidate A>/66666666-6666-6666-6666-666666666666.jpg` in `public-assets`, then the assertion that the table holds no row. As `anon`: candidate A's row is returned; that storage object is returned; `get_nominations (project A)` returns `nomination_cand_a` with `entity_id` = candidate A. The section does not mention the candidate column.

## Gate and E2E Results

Every exit status was read from the command itself or from the attempt's `done` file, never through a pipe.

| What | Command | Exit | Result |
|---|---|---|---|
| Parity before any edit | `yarn assert:schema-migration-parity` | 0 | 27 schema files, 6466 lines |
| Seed rows | `yarn workspace @openvaa/dev-seed vitest run base.test`; dev-seed typecheck; Prettier and ESLint on the two files | 0, 0, 0, 0 | 49 of 49 |
| Regenerate | `yarn schema:regenerate` | 0 | 6450 lines; the changed lines of the migration equal the changed lines of the schema files (`diff` of the two, exit 0) |
| Apply, then types | `yarn db:reset`, `yarn db:types` | 0, 0 | `database.ts` unchanged (`git diff --quiet`, exit 0) |
| Schema lint | `yarn db:lint:sql` | 0 | `policies examined: 104, tables partitioned: 20`; `Summary: 0 error(s), 3 warning(s)` |
| pgTAP, schema changed, tests not yet | `yarn workspace @openvaa/supabase test:db` | **1** | six failed assertions in the six listed files, expected; 38 files, 1392 tests |
| pgTAP after the edits | same | 0 | **38 files, 1388 tests, PASS** |
| Task 1 verify chain | parity, lint, `base.test`, the psql pair, as one command under bash | 0 | `0/0` |
| Task 2 verify chain | `test:db` and the two greps on file 37, as one command | 0 | |
| Negative controls and probes | see below | | |
| Comment hygiene | `yarn assert:comment-hygiene` | 0 | 0 violations, after Task 2 and after Task 3 |
| Templates | `yarn workspace @openvaa/dev-seed test:unit`; typecheck | 0, 0 | 67 files, **996 tests** (was 997: one case added in `base.test.ts`, two deleted in `default.test.ts`); run before the commit and again on HEAD after the interruption |
| **Gate set** | `172-gates.sh 172-06-visibility` | **0** | **nine rows, all `0`**, head `aff4ddc12`, clean tree |
| Task 3 verify, part 1 | `172-gates.sh --judge 172-06-visibility` | 0 | nine rows, every status 0 |
| **E2E** | `172-e2e.sh 172-06-visibility` | **0** | **177 / 177 / 0 failed / 0 flaky / 0 skipped / 0 did not run**; 100 projects; 5.0 min |
| Task 3 verify, part 2 | `172-e2e.sh --judge 172-06-visibility` | 0 | verdict GREEN, the full default suite, not below the baseline total |
| Re-seed | `yarn db:seed:default` | 0 | 752 rows |
| Allowlist | `170-allowlist-probe.sh after` | 0 | every row OK; the stack was not restarted |

The nine rows of `172-06-visibility`: lint 44 s, types-regen 32 s, types-clean 0 s, sql-lint 3 s, pgtap 5 s (38 files, 1388 tests), unit 59 s (frontend 2170 in 137, dev-seed 996 in 67, supabase 206 in 15, app-shared 141 in 10), svelte-check 8 s (2655 files, 0 errors, 0 warnings), build 16 s, format 17 s.

### Every run directory of this plan

| Directory | Head | Counts | Verdict |
|---|---|---|---|
| `tests/e2e-runs/172-gates/172-06-visibility` | `aff4ddc12` | nine rows, all `0` | green |
| `tests/e2e-runs/172/172-06-visibility` | `aff4ddc12` | 177 of 177 over 100 projects | **green, the full default suite** |

There was no red gate row and no red E2E run, no rerun under a label, and nothing under `tests/e2e-runs/` was deleted. One preflight success, no preflight failure, wrapper status 0.

**Reading the E2E run.** `voter-journey` 2 of 2, every step ok: the results steps that count cards and Party AA members passed, and `voter-journey.spec.ts` is byte-identical to the start revision. `contestant-journey` 1 of 1, steps 1 to 22 ok. `auth-setup` 1 of 1, `contestant-a11y-scan` 14 of 14, `cold-entry-dataroot-contestant` 1 of 1, `perm-localisation-positive` 2 of 2. The dev-server log holds 4 lines matching `A DataProvider returned an invalid result`, `Error loading election data` or `Error loading constituency data` (4 in `172-04-stage1`), and none naming `getBasicUserData`, `acceptTermsOfUse`, `Error fetching basic user data`, `Error fetching user data`, `Error loading protected-layout data` or `An image file is required`.

## Negative Controls and Probes

None of these is committed; each ran through `psql` inside one transaction that was rolled back, with the pgTAP extension created inside it, and the catalogue was read back unchanged afterwards (no policy naming terms of use, no leftover function, no pgTAP extension).

| Control | Mutation | Result |
|---|---|---|
| Identity guards (T-172-22) | both candidate SELECT policies altered to carry `terms_of_use_accepted IS NOT NULL AND < now()` again | `05`: 1 red of 21 (the identity assertion). `18`: 1 red of 59 (the SELECT-family assertion). `25`: 2 red of 40 (both RELATIVE assertions). Unmutated: 21, 59, 40 green |
| The trio against the column | the same mutation, file `37` | **45 of 45 green.** The shared fixture stamps the column on candidate A, so a condition on the column does not move the trio |
| The trio against a row-based condition | `anon_select_candidates` altered to also require that an acceptance row exists for the project | 2 red of 45: the row read and the `get_nominations` read. The storage read stays, because `storage_path_is_public` was not mutated |
| Probe A | fixture candidate A with its column set to NULL, zero acceptance rows | row / file / nomination as anon = 1 / 1 / 1 |
| Probe B | the same candidate with `confirmed = false` | 0 / 0 / 0 |

## What the Evidence Does and Does Not Show

- **Shown on the applied catalogue:** no policy and neither function names terms of use; the eight entity SELECT policies are identical modulo table and type.
- **Shown by pgTAP:** the identity guards hold with nothing stripped and bite when a policy diverges; with no acceptance row anywhere, row, file and nomination are public.
- **Shown by measurement, not by a committed test:** a candidate whose column is NULL is public (probe A; the 327 nominated candidates of the default dataset). The committed trio does not show this: the fixture's column is still set, and the section is written without the column so that 172-07 need not edit it. Once 172-07 drops the column the question cannot be asked.
- **Shown by the E2E run:** the voter-visible set of `e2e/base` did not move; the journey of an unconfirmed candidate works end to end, preview and portrait included.
- **Not shown:** an anon `list` of `public-assets` through the Storage API (pgTAP reads `storage.objects` under the policy, which is what a list consults); the integration test `default-template.integration.test.ts`, whose comment was corrected and which no gate of this phase runs. Its assertion (anon-visible candidate nominations above zero) was observed by hand on the seeded dataset: 327.

## Decisions Made

None of the plan's decisions was decided differently. The calls the plan does not make are under `key-decisions` and the deviations below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The comment on `candidates.terms_of_use_accepted` stated a visibility rule the schema change makes false**
- **Found during:** Task 1, after the first regeneration.
- **Issue:** `102-entities.sql` said "An anonymous reader sees the candidate only once this is set and not in the future." The file is not in the plan's list; the column and its comment leave in 172-07. Until then the schema would have carried a false statement about who can read a candidate.
- **Fix:** the sentence now reads "No visibility rule reads it." The migration was regenerated, so it holds one comment hunk beyond the four sites.
- **Files modified:** `apps/supabase/supabase/schema/102-entities.sql`, `apps/supabase/supabase/migrations/00001_initial_schema.sql`
- **Verification:** parity exit 0; a `--` comment is not part of the applied catalogue, and the gate set reset and re-applied the schema afterwards.
- **Committed in:** `1aebfb1b4`

### Small departures in form

2. **`16`: the fixture candidate and nomination of the deleted case were removed with it.** The plan says the fixture insert stays for 172-07 (it names the column). It stays, with six rows where it had seven: left in place, the seventh would have become an anon-visible candidate named `NoTermsOfUse` that no assertion reads.
3. **`16`: two sites beyond the three the plan names were reworded,** because they list acceptance among conditions that all hold: Section 9's comment ("has accepted the terms of use in the past") and its case's description ("terms accepted", a spelling the plan's grep does not match).
4. **`20`: sixteen numbered labels after the deleted case were renumbered by one** ("20-23" became "19-22", and so on to "46" becoming "45"), and the cross-reference "Test 27" became "Test 26". The labels matched pgTAP's own numbers before the deletion (the runner reported the deleted case as test 19) and match them again. The comments of cases 17 and 18 lost "terms accepted" and "its terms are accepted".
5. **`03`: the comment above `plan` that counted the three cases was removed** with them.
6. **`37` Section 6 begins with a `DELETE`.** The plan says to assert first that the table holds no row. After Sections 2 to 5 it holds two, both `candidate_a`'s, who is the editor of candidate A. They are deleted as postgres and the emptiness is then asserted. The dispatch handover speaks of each read being preceded by such an assertion; the plan asks for one, first, and one was written.
7. **`base.test.ts` has a third case:** the two control rows are the only candidates of `e2e/base` that state `confirmed`. It is the plan's census of step 4 put into a test.
8. **`supabaseAdminClient.ts`: three comment blocks were replaced by two paragraphs,** not two by two. The third block ("the asymmetry is established for `candidates` only") depended on the two the plan names and would have been false without them. The older blocks above them, which narrate earlier phases, were not touched.
9. **`perm-localisation-positive.ts`: two comments were reworded** (the docblock line and the comment above the candidate) with the removed literal; **`default.test.ts` lost an import** (`BUILT_IN_TEMPLATES`) that only the deleted Test 29 used, and the docblock entry describing Tests 28 and 29.
10. **`301-auth-functions.sql`: the header sentence was rewritten, not only shortened.** It now says each arm restates its table's anon SELECT policy, which is what the biconditional in `16` holds.
11. **`503-entity-rpcs.sql`: the "defence in depth" paragraph was deleted.** The paragraph above it already says what the filter does (it drops a nomination whose entity-side joins all resolved to NULL), so nothing was added.

### Beyond the plan's list

- **Three negative controls and two probes,** in the table above.
- **A measurement on the seeded default dataset** after the re-seed (coverage D4).
- **`yarn assert:comment-hygiene`** after Tasks 2 and 3.

### Acceptance criteria that did not hold as written

- **Task 1, step 8: "the migration diff … holds these hunks and no others".** It holds them and the one comment hunk of deviation 1.
- **Task 2: "`git show --stat` lists the four schema files, the migration and the seven pgTAP files".** It lists five schema files, the migration and the seven pgTAP files.
- **`files_modified`.** 21 files changed, the 20 listed and `102-entities.sql`.

Every other criterion holds as written, and each `<automated>` check was run as one command and exited 0. Task 1's was run under `bash`, as its last link is a `grep -qx` on psql's output, which is how the plan writes it.

### Departures in procedure

- **The run was interrupted between Task 3's commit and its close** by an API authentication error. On resuming, the state was re-measured before anything was run: HEAD `aff4ddc12`, a clean tree, no `172-06-*` run directory, nothing listening on 5173 or 5273, parity 0, the applied database at `0/0` with the column present; dev-seed `test:unit` and typecheck were run again on HEAD (0, 0). The gate set then reset the database in any case.
- **Task 1's schema edits were committed in Task 2's commit,** as the plan directs; Task 1's own commit is the seed rows.
- **The commits sit on `feat/entity-signup-multi-grant` in a linked worktree,** as the run's standing notes direct; the branch was checked before each commit.
- **Reading.** `172-NAMES.md`, the three earlier summaries named in the dispatch and `deferred-items.md` were read whole. `172-CONTEXT.md`, `172-RESEARCH.md` and `172-PATTERNS.md` were read by the sections the plan names. Of the database skill, the heading list and the lines naming terms of use were read, not the whole file; `execute-plan.md`, `checkpoints.md` and `executor-examples.md` were not opened, and of the summary template only the frontmatter head: the form of this file follows the four earlier summaries of the phase.
- **Polling** was a bounded foreground loop of `--status` calls 45 seconds apart; both helper runs were started with the tool's background mode.
- **The gate set was started only after the interruption,** so no gate or E2E run was in flight when the run stopped.

---

**Total deviations:** 1 auto-fixed (a false schema comment, in a file outside the plan's list), ten small departures in form, three additions beyond the plan.
**Impact on plan:** none on behaviour or scope. The one finding to read is that the committed trio guards against a row-based condition and not against the column; the column's absence from the rule is held by the catalogue check, the tightened identity guards and their negative control.

## Prohibition, Checked

| Prohibition | Evidence |
|---|---|
| PROH-172-02: no condition replaces the removed one; `confirmed` stays the only entity-side lever and this plan does not change who sets it | The schema diff only removes lines from the two policies and the two functions and rewrites comments: no predicate, function, trigger or grant is added (`git show --stat 1aebfb1b4`: 7 added and 23 removed lines of schema before the comment of deviation 1). `303-column-grants.sql` is untouched, so who may write `confirmed` is as it was. No file under `apps/frontend` or `tests/tests` changed in this plan. The seed change sets `confirmed: false` on two rows and nothing reads registration, sign-in or acceptance; the E2E harness confirms nothing (D-13's other branch was not applied). Verified by judgment, as the plan says |

## Threat Model, Each Disposition

| Threat | Disposition | Where it stands |
|---|---|---|
| T-172-15 a confirmed, nominated candidate of an open project is anon-readable whether or not its editor has accepted, registered or signed in | accept | measured, not only reasoned: 327 never-registered candidates of the default dataset are anon-visible with the column NULL. Bounded as planned by the two unconfirmed control rows, the voter journey's unchanged counts, the trio, and the guards in `05`, `18` and `25`. Listed for operator review |
| T-172-16 a candidate's files become anon-listable in step with the row | accept | probe B: with the candidate unconfirmed, the row, the file and the nomination all go to 0 together; `20-storage-authority` keeps cases 13 to 18 |
| T-172-22 removing the strip could hide a divergence between the eight policies | mitigate | the strip is removed and nothing replaces it; the identity assertion remains in each of the three files; the negative control shows each goes red when the candidate policies differ |
| T-172-SC package installs | accept | no package was installed; `yarn.lock` and every `package.json` are unchanged |

No security-relevant surface was added beyond the plan's threat model.

## Changes for the Operator's Eye

- **The widening is live on the local database.** Every confirmed, nominated candidate of an open project is public. A custom seed template that produces such candidates without the column, which were hidden before, now shows them.
- **Five deviations from CONTEXT.md that the plan lists stand as planned,** with item 1 now settled by the run: neither branch of D-13 was needed.
- **The committed trio does not, on its own, prove the column condition is gone** (see "What the Evidence Does and Does Not Show").
- **The local database was reset twice:** once by hand to apply the schema, once by the gate run. The `default` dataset was seeded again at the end. The stack was not stopped or restarted. The other Supabase stack on this host, `my-redis` and the Vite server on port 5199 were not touched.
- **`CAND-APP-PLAN.md` was not edited, moved, staged or committed.** `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged.

## Deferred Issues

None fixed, all outside this plan. None was added to `deferred-items.md`; each belongs to a plan that already owns the file:

1. **Comments this plan made false, in files 172-07 owns:** the comment above the candidates fixture insert in `00-helpers.test.sql` ("`anon_select_candidates` requires `terms_of_use_accepted IS NOT NULL AND < now()` …"), and the comments beside the fixture inserts in `16` and `33` that 172-07 already rewords.
2. **Statements this plan made false, in files 172-08 and 172-09 own:** `apps/docs/…/developers-guide/backend/authentication/+page.md` ("A candidate must also have accepted the terms of use."), `.claude/skills/database/rls-policy-map.md` ("`candidates` alone carries two further conjuncts …"), and the three comments of `voter-journey.spec.ts` that research lists (the spec was not touched here, by the plan's own criterion).
3. **A pre-existing weakness that left with its case:** the "acceptance in the future" control of `03` was given an unconfirmed nomination, so it was hidden for a second reason and kept passing after the schema change. It is deleted, not repaired.
4. **`packages/dev-seed/tests/integration/default-template.integration.test.ts` has two `import-x/consistent-type-specifier-style` findings** on lines this plan did not change. The package's `lint` script covers `src/` only, so `lint:check` does not see them.
5. **The count of retired-column sites** is now 26 files and 64 lines (was 41 and 145): the templates and their tests left it. What remains is 172-07's and 172-08's.
6. `172-VALIDATION.md` was not touched; its rows for this plan are answered in this file.

The cross-phase defect ledger (`.planning/WINDOWS.md`) was not appended to: there is no stub, no skipped test and no verification of this plan that was not run. No todo was filed.

## Issues Encountered

None in the product code: no gate row and no E2E test was red at any point. The one red result was the expected pgTAP run between the schema edit and the test edits. The run itself was interrupted once, as described under "Departures in procedure".

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## What the Next Plan and Later Phases Must Know

**Plan 172-07**

- **Compare against:** gates and E2E `172-06-visibility` (nine rows at 0; 177 / 177). pgTAP: 38 files, 1388 tests. Frontend 2170 tests in 137 files; dev-seed 996 in 67; supabase 206 in 15; app-shared 141 in 10; svelte-check 2655 files. Schema: 27 files, a 6450-line migration. Linter census unchanged: 104 policies, 20 tables partitioned. The retired-column census: 26 files, 64 lines.
- **pgTAP sites still naming the column,** by file and line count: `00-helpers` 2, `05` 3 (the `get_entity_basic_data` projection checks and their comments), `07` 1, `10` 18, `16` 1 (the fixture insert's column list; its value appears six times in the rows below it), `33` 2. `20` is finished: it holds no mention in any spelling, and its labels after case 18 were renumbered.
- **`16`'s fixture insert has six candidates,** `…001` to `…005` and `…007`; `…006` and nomination `…a6` are gone.
- **`37` has `plan (45)` and six sections.** The inverse census goes after Section 6. Section 6 ends with `reset_role ()`, and leaves the acceptance table empty and one `storage.objects` row in `public-assets`.
- **The trio does not mention the column and needs no edit when the column goes.**
- **`102-entities.sql`:** the comment above the column line now reads "When the candidate accepted the terms of use; null until then. No visibility rule reads it." Both lines go with the column.
- **No template states the column,** so dropping it cannot fail an import. `permittedKeys.ts` still lists the key and is the one dev-seed file left. The E2E helpers that write the column (`tests/tests/utils/supabaseAdminClient.ts`, `perm-closed-project.setup.ts`) are untouched and still yours.
- **The default dataset on the local database was seeded without the column:** every candidate row has it NULL.

**Plan 172-08**

- The stale comments of 172-04's deferred item 3 and 172-05's deferred item 5 stand, with the docs and skill statements under deferred item 2 above. `voter-journey.spec.ts` was not modified by this plan.
- The contestant-journey candidate (`test-e2e-base-ca-aa-unregistered`) is unconfirmed for the whole run and is never public; no spec asserts otherwise.

**Phases 174 and 175**

- **`confirmed` is the single entity-side visibility lever** for all four entity tables, in the row policies, in the nomination helper and in storage. Whoever sets it publishes the entity, given a confirmed nomination in an open project. Nothing else stands between a confirmed entity and the public: not registration, not sign-in, not acceptance.
- A seeded entity that must stay hidden states `confirmed: false`; the import's default is `true`.

**Phase 173**

- The entity SELECT policies' own-row disjunct (`user_can('entity', id, 'entity.read_answers', …)`) is unchanged, and an editor reads and edits its own unconfirmed row: the journey ran end to end on one.

**Host state:** the stack is up and healthy on the live allowlist (`170-allowlist-probe.sh after`, exit 0); nothing listens on 5173 or 5273. The database carries the schema of `aff4ddc12`, the pgTAP helper functions in `public` (left by the gate run), what the E2E run left in its own project, and the `default` dataset in the default project. `terms_of_use_acceptances` is empty.

## Self-Check: PASSED

- The 21 files under `key-files.modified` exist, and `git diff --name-only ed119aad4..aff4ddc12` lists exactly those 21.
- The three commits (`6e200ea88`, `1aebfb1b4`, `aff4ddc12`) are ancestors of HEAD; `git rev-list --count ed119aad4..HEAD` was 3 when this file was written.
- `tests/e2e-runs/172-gates/172-06-visibility/summary.tsv` and `tests/e2e-runs/172/172-06-visibility/summary.json` exist; both attempts hold `done` = 0 and record head `aff4ddc12`.
- The plan's verification items were run on the final tree: `yarn assert:schema-migration-parity` (0), `yarn db:lint:sql` (0, row 04 of the gate set), `yarn workspace @openvaa/supabase test:db` (0, row 05; 38 files, 1388 tests), the applied-database pair (`0/0`), `172-gates.sh --judge 172-06-visibility` (0) and `172-e2e.sh --judge 172-06-visibility` (0).
- Every acceptance criterion of the three tasks was checked by command; the three that do not hold as written are listed above with what was measured.
- No stub pattern is in the added lines. `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged since the start revision; `CAND-APP-PLAN.md` is untracked and untouched.
