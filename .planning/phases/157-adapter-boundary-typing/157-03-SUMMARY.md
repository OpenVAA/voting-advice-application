---
phase: 157-adapter-boundary-typing
plan: 03
subsystem: database
tags: [postgres, supabase, rpc, jsonb, plpgsql, postgrest, migrations, rls]

requires:
  - phase: 156-supabase-schema-corrections-naming-constraints-grants
    provides: "the settled in-place rewrite of 00001_initial_schema.sql that 00004 applies on top of, and the schema-migration parity guard (REVIEW-DB-07) whose signature this plan re-baselines"
provides:
  - "public.get_questions(p_election_id uuid, p_constituency_id uuid, p_election_round integer) RETURNS jsonb — categories and their questions in one round trip, filtered on all three axes"
  - "public.get_nominations(uuid, uuid, boolean, integer) — the 4-argument signature, replacing the 3-argument one"
  - "apps/supabase/supabase/schema/505-question-rpcs.sql — new schema-mirror file"
  - "apps/supabase/supabase/migrations/00004_question_rpcs_and_nomination_election_round.sql — the applied migration"
  - "a re-baselined schema-migration parity signature covering both changes"
affects: [157-04, 157-05, 157-06, 164-nullability-audit, 156-supabase-schema-corrections]

actuals:
  tokens: 6400
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "jsonb-returning read RPC (jsonb_build_object over two jsonb_agg subqueries) as the shape orthogonal to Phase 164's tabular-nullability audit"
    - "NULL-param / NULL-column / empty-array all mean 'applies to all' — the SQL transcription of the client-side predicate it replaces"
    - "DROP FUNCTION of the old signature before CREATE OR REPLACE, whenever an RPC's argument list changes"

key-files:
  created:
    - apps/supabase/supabase/schema/505-question-rpcs.sql
    - apps/supabase/supabase/migrations/00004_question_rpcs_and_nomination_election_round.sql
  modified:
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/scripts/schema-migration-parity.expected.txt

key-decisions:
  - "Task 1 checkpoint resolved as `new-00004`, on a CORRECTED premise: Phase 156 is complete and its in-place 00001 rewrite has landed, so the option's only stated con is eliminated rather than merely outweighed."
  - "get_questions returns a single jsonb value rather than a tabular result, so Phase 164's nullability audit surface does not grow."
  - "p_election_round is appended LAST to get_nominations, keeping the adapter's named-argument call site source-compatible."

patterns-established:
  - "Two edits, one commit: every SQL change touches both the never-applied schema/ mirror and the applied migration in the same commit."
  - "A parity `--update` re-baseline is audited line by line before it is committed, and the audit is recorded in the commit message."

requirements-completed: [REVIEW-ADP-02, REVIEW-ADP-03]

coverage:
  - id: D1
    description: "public.get_questions exists identically in the schema mirror and migration 00004, returns {categories, questions} as jsonb, and filters BOTH tables on election, constituency and election round with NULL-or-empty meaning 'all'."
    requirement: REVIEW-ADP-03
    verification:
      - kind: integration
        ref: "yarn db:reset (00004 applied 4th) then psql filter-branch matrix over 6 synthetic categories x 6 synthetic questions, rolled back"
        status: pass
      - kind: other
        ref: "grep acceptance battery: RETURNS jsonb=1, RETURNS TABLE=0, SECURITY INVOKER=2, SECURITY DEFINER=0, jsonb_array_length=6, GRANT=1"
        status: pass
    human_judgment: false
  - id: D2
    description: "public.get_nominations takes p_election_round integer DEFAULT NULL as its fourth parameter, the migration drops the 3-argument overload first, the grant lists four argument types, and the RLS leak guard survives verbatim."
    requirement: REVIEW-ADP-02
    verification:
      - kind: integration
        ref: "psql pg_proc query after db:reset — exactly one get_nominations row, signature get_nominations(uuid,uuid,boolean,integer), prosecdef=f, proconfig=NULL"
        status: pass
      - kind: integration
        ref: "psql SELECT count(*) FROM public.get_nominations(p_election_round => 2) — named-argument call resolves"
        status: pass
      - kind: other
        ref: "grep: p_election_round param=1, DROP FUNCTION=1, 4-arg GRANT=1, WHERE clause=1, RLS leak guard=1"
        status: pass
    human_judgment: false
  - id: D3
    description: "The tree's gates are green after the change: schema-migration parity re-baselined and audited, lint:check exit 0, pgTAP baseline held."
    verification:
      - kind: other
        ref: "yarn lint:check — exit 0 (12 links, all guards 0 violations)"
        status: pass
      - kind: other
        ref: "cd apps/supabase && npx supabase test db — Files=11, Tests=324, Result: PASS, zero 'not ok'"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-08-30
status: complete
---

# Phase 157 Plan 03: Question RPCs and the Nomination Election Round Summary

**`public.get_questions` now returns categories and their questions as one jsonb payload filtered on election, constituency and election round for BOTH tables — a capability the client-side assembly it replaces never had — and `public.get_nominations` gained a fourth `p_election_round` parameter with its old overload dropped, both landing in the never-applied `schema/` mirror and the applied `00004` migration in the same commits.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-08-30T14:15Z (approx)
- **Completed:** 2026-08-30T14:40Z
- **Tasks:** 3 of 3
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- **`public.get_questions` is greenfield SQL that closes a real correctness gap, not just a round-trip saving.** The TypeScript assembly it replaces filtered *categories only*, and *by election only*; when the filtered category list came back empty it read the entire `questions` table. The RPC filters categories **and** questions, on **all three** axes, because both tables carry `election_ids`, `election_rounds` and `constituency_ids` as JSONB.
- **The filter semantics were transcribed from the measured TypeScript predicate, then proved branch by branch against a live Postgres** — NULL parameter, NULL column, empty-array column and containment each exercised, in both the matching and the non-matching direction.
- **`get_nominations` reached exactly one overload in the applied database.** `pg_proc` shows a single `get_nominations(uuid,uuid,boolean,integer)` row after `db:reset`, which is the mitigation for T-157-08 (a second overload would have produced `PGRST203` at runtime on a migration that had already passed review).
- **The parity guard's re-baseline was audited rather than blessed.** Every one of the 80 new signature lines was accounted for, and it was proved that no previously reviewed signature line was dropped.

## Task Commits

1. **Task 1: Decide the migration strategy against Phase 156's in-place rewrite** — no commit (a decision, recorded below)
2. **Task 2: The `get_questions` RPC, in the schema mirror and the migration** — `67f370181` (feat)
3. **Task 3: `get_nominations` gains `p_election_round`, in both copies** — `022340a6a` (feat)
4. **Deviation: re-baseline the parity signature** — `c4e5675be` (chore)

## Files Created/Modified

- `apps/supabase/supabase/schema/505-question-rpcs.sql` **(created)** — the readable mirror of `get_questions`. Sorts after `504-admin-rpcs.sql` and before `900-test-helpers.sql` in the concatenation order the parity guard uses.
- `apps/supabase/supabase/migrations/00004_question_rpcs_and_nomination_election_round.sql` **(created)** — the only copy any database reads. Two numbered sections inside one `BEGIN;`/`COMMIT;`: `get_questions`, then the `get_nominations` drop-and-recreate.
- `apps/supabase/supabase/schema/503-entity-rpcs.sql` **(modified)** — three edits to `get_nominations` and nothing else (see the Phase 156 coordination note).
- `apps/supabase/scripts/schema-migration-parity.expected.txt` **(modified)** — re-baselined signature; see Deviations.

## Decisions Made

### Task 1 checkpoint — resolved as `new-00004`, on a corrected premise

The checkpoint was pre-answered by the orchestrator as option (a), **a new `00004_question_rpcs_and_nomination_election_round.sql`**. That is the filename tasks 2 and 3 wrote.

**The plan's stated premise for this checkpoint was stale and is not repeated here.** The plan (authored 2026-08-28) said Phase 156 "had only a CONTEXT and a DISCUSSION-LOG, so it was neither planned nor executed and 157 may land first." Measured at this plan's base HEAD, that is false:

- Phase 156 is **complete**, `status: passed`, all 10 plans done, its code review fixed (18/18 findings), its full E2E gate 150 passed / 0 failed.
- Phase 156's in-place `00001_initial_schema.sql` rewrite **has landed** (commits `328b8e635`, `0afaed022`, `707136912`).

**Measured contents of `apps/supabase/supabase/migrations/` at decision time** (verbatim `ls` output):

```
00001_initial_schema.sql
00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql
00003_authenticated_insert_feedback.sql
```

**Measured contents of `.planning/phases/156-*/`** (verbatim `ls -d` output):

```
.planning/phases/156-supabase-schema-corrections-naming-constraints-grants/
```

So `00004` was next and free. On the corrected premise the decision is not merely recommended but **strictly dominant**: option (a)'s only stated con — "if 156 later rewrites history wholesale, someone must reconcile the ordering by hand" — is eliminated, because 156 is finished and verified and will not rewrite `00001` again. Option (b) (fold into 156's `00001`) is now moot for the same reason, and would additionally have meant editing a migration that developer and CI databases have already applied.

This was verified rather than assumed: `yarn db:reset` applied `00001` → `00002` → `00003` → `00004` in order, exit 0, with no error on top of 156's rewritten `00001`.

### Coordination note for Phase 156's owner

> **157 touched `apps/supabase/supabase/schema/503-entity-rpcs.sql`, the one file shared with Phase 156, in exactly three places inside `get_nominations` — the parameter list (appended `p_election_round integer DEFAULT NULL` last), the WHERE clause (added a scalar `p_election_round IS NULL OR n.election_round = p_election_round` predicate plus its explanatory comment), and the `GRANT`, which now names four argument types. Nothing else in the file was touched; `get_candidate_user_data` and `upsert_answers` are byte-identical, and the RLS leak guard `AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL` and its comment survive verbatim. Migration ordering: 157's SQL is `00004`, applied after 156's rewritten `00001`; if 156 ever widens `get_nominations` to organizations, that edit must carry the fourth parameter forward or it will silently reintroduce the 3-argument signature into the mirror.**

### `get_questions` returns jsonb, not a tabular result

Chosen deliberately and stated in the function's own header comment so Phase 164's owner can see it: a jsonb return adds no new tabular column and therefore no new nullability metadata for the generated types to misstate, so 164's audit surface does not grow. The adapter zod-parses the payload regardless (157 criterion 1), so generated column typing would buy nothing here. A tabular return with a `row_kind` discriminant would have made 164's problem strictly worse.

### The `get_questions` parameter names — the adapter's call contract for 157-06

These names are echoed in the generated types and become the `.rpc()` named-argument keys downstream. **Do not rename them without touching all three layers:**

```
p_election_id      uuid    DEFAULT NULL
p_constituency_id  uuid    DEFAULT NULL
p_election_round   integer DEFAULT NULL
```

Return shape: `{ "categories": [...], "questions": [...] }`, each an array of whole table rows (`to_jsonb(row)`), each ordered `sort_order NULLS LAST, id`, each defaulting to `[]` rather than `null` when empty (verified: `jsonb_typeof` on both keys returns `array` against empty tables).

`get_nominations`'s fourth parameter is `p_election_round integer DEFAULT NULL`, appended **last** — the adapter's existing call site uses named arguments, so it is source-compatible.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] The schema-migration parity guard went red and had to be re-baselined**

- **Found during:** after Task 3 (the guard is link 12 of `yarn lint:check`, which must be exit 0 at plan end)
- **Issue:** `yarn assert:schema-migration-parity` concatenates `schema/*.sql` and diffs the result against `00001_initial_schema.sql` **only**. This plan's SQL lands in `00004`, so both changes necessarily show as new drift. Observed 7 hunks against a fixture recording 4.
- **Fix:** `yarn assert:schema-migration-parity:update`, committed separately as `c4e5675be` so the fixture diff is reviewable on its own.
- **Files modified:** `apps/supabase/scripts/schema-migration-parity.expected.txt`
- **Verification:** `yarn assert:schema-migration-parity` exit 0 afterwards; `yarn lint:check` exit 0.
- **Committed in:** `c4e5675be`

**Why this is a deviation and not silent scope creep:** the fixture is not in the plan's `files_modified`. It had to change because the plan's SQL cannot land without moving the signature, and the alternative — leaving `lint:check` red — was not available.

#### The re-baseline audit (the `--update` blesses whatever drift exists, so it was read first)

**Census:** `24 schema file(s) -> 3350 lines; 00001 -> 3342 lines; 4 hunks, 11 signature lines`
**became** `25 schema file(s) -> 3424 lines; 00001 -> 3342 lines; 7 hunks, 91 signature lines`.

The `00001` side is unchanged at 3342 lines, as it must be — this plan did not touch `00001`.

The three NEW hunks, each accounted for:

| # | New hunk | Lines | Accounted for by |
|---|----------|-------|------------------|
| A | `get_nominations` parameter list: mirror has `p_include_unconfirmed boolean DEFAULT false,` + `p_election_round integer DEFAULT NULL`, `00001` has the 3-arg form | 4 | Task 3 edit 1 |
| B | `get_nominations` grant: mirror has the 4-argument type list, `00001` has the 3-argument one | 3 | Task 3 edit 3 |
| C | The whole of `505-question-rpcs.sql`, present in the mirror and absent from `00001` | 71 | Task 2 (the file is new, so `00001` has no counterpart) |

Plus **one pre-existing hunk that grew by 2 lines** — the `get_nominations` WHERE-clause hunk. Task 3 edit 2's comment and predicate sit immediately above the RLS leak guard, whose two lines were already in the reviewed signature, so the differ merged them into one contiguous hunk. Those 2 new lines are Task 3 edit 2. Net: `4 + 3 = 7` hunks. `4 + 3 + 71 + 2 = 80` new signature lines; `11 + 80 = 91`.

**Nothing appeared that could not be accounted for**, and the more dangerous direction was checked explicitly: the only line **deleted** from the fixture is the `# hunks: 4` header. Programmatic check — all 11 previously reviewed signature lines are still present in the new fixture, **0 dropped**. A `--update` that silently discarded a reviewed hunk (for example, the RLS leak guard) would have been invisible in the census; it is not invisible in this check.

---

**Total deviations:** 1 auto-fixed (1 × Rule 3 — blocking).
**Impact on plan:** none on scope. The re-baseline is a mechanical consequence of the plan's own SQL, audited before it was blessed.

## Issues Encountered

**The guard's documented blind spot was treated as live, not theoretical.** Phase 156's WR-10 recorded that the parity guard opens only `00001`, so an object a later migration recreates can leave the signature unchanged while the applied database carries the later definition. `get_nominations` now lives in **four** places (`schema/503`, `00001`, `00002`, `00004`), so a green parity run proves nothing about it. It was therefore proved against a real database instead:

```
$ yarn db:reset
Applying migration 00001_initial_schema.sql...
Applying migration 00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql...
Applying migration 00003_authenticated_insert_feedback.sql...
Applying migration 00004_question_rpcs_and_nomination_election_round.sql...
Finished supabase db reset on branch main.
```

```
=== get_nominations overloads (expect exactly 1) ===
                 signature                  | security_definer | proconfig
--------------------------------------------+------------------+-----------
 get_nominations(uuid,uuid,boolean,integer) | f                |
(1 row)

=== get_questions ===
            signature             | security_definer | provolatile | proconfig
----------------------------------+------------------+-------------+-----------
 get_questions(uuid,uuid,integer) | f                | s           |
(1 row)
```

`prosecdef` is `f` and `proconfig` is NULL on both — i.e. `SECURITY INVOKER` with no `SET search_path`, as the plan's prohibitions require. `provolatile = s` is `STABLE`. Grants confirmed present for both `anon` and `authenticated` on both functions via `information_schema.routine_privileges`.

**No pgTAP test references either RPC today** (`grep -rln 'get_nominations|get_questions' apps/supabase/supabase/tests/` returns nothing), which is consistent with 157-04 owning that coverage. So the signature change could not have broken an existing assertion, and did not.

## Verification Performed

### Filter-semantics proof (the substantive one)

Six synthetic categories and six synthetic questions were inserted inside a transaction covering every branch — NULL columns, empty-array columns, election-specific, round-specific, constituency-specific — then rolled back. Actual output:

| Call | Result |
|------|--------|
| `get_questions()` | 6 categories, 6 questions (all) |
| `get_questions(e1)` | `["cat-null-all","cat-empty-all","cat-e1","cat-round2","cat-c1"]` — `cat-e2` excluded; questions mirror it exactly (`["q-null-all","q-empty-all","q-e1","q-round2","q-c1"]`), proving questions are filtered on their **own** columns |
| `get_questions(NULL, NULL, 1)` | `cat-round2` excluded, the other five in |
| `get_questions(NULL, NULL, 2)` | all six in (`[2]` matches; NULL and `[]` mean "all") |
| `get_questions(NULL, c1)` | all six in |
| `get_questions(NULL, <other uuid>)` | `cat-c1` excluded, the other five in |

That is NULL-param, NULL-column, empty-array-column, containment-match and containment-miss each exercised, on all three axes.

### Acceptance-criteria greps (actual output)

Task 2: `CREATE OR REPLACE FUNCTION public.get_questions` = 1 in **both** files; `RETURNS jsonb` = 1; `RETURNS TABLE` = 0; `SECURITY INVOKER` = 2; `SECURITY DEFINER` = 0; the exact `GRANT` line = 1; `jsonb_array_length` = 6 (three axes × two tables); `-- Applies to schema files:` = 1; `BEGIN;` = 1; `COMMIT;` = 1.

Task 3: `p_election_round integer DEFAULT NULL` = 1; `DROP FUNCTION IF EXISTS public.get_nominations(uuid, uuid, boolean)` = 1 in the migration; 4-argument `GRANT` = 1; the WHERE predicate = 1; `COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL` still = 1. The `-- Applies to schema files:` list names both `505-question-rpcs.sql` and `503-entity-rpcs.sql`.

**Cross-copy identity, checked programmatically rather than by eye:** the `get_questions` block (CREATE through GRANT) is **byte-identical** between `schema/505-question-rpcs.sql` and the migration, and the `get_nominations` block is **byte-identical** between `schema/503-entity-rpcs.sql` and the migration. The migration's copy was mechanically extracted from the mirror, so the two cannot drift by transcription error.

**Two edits, one commit** (`git show --name-only`): `67f370181` lists `505-question-rpcs.sql` + the migration; `022340a6a` lists `503-entity-rpcs.sql` + the migration. Neither commit deleted a tracked file (`git diff --diff-filter=D` empty).

### Gates

| Gate | Command | Result |
|------|---------|--------|
| Lint / typecheck / all 12 guards | `yarn lint:check` | **exit 0** |
| Comment hygiene (D-N1) | included above; also run standalone | 1565 files, **0 violations** |
| Schema-migration parity | `yarn assert:schema-migration-parity` | **exit 0**, matches the re-baselined fixture |
| pgTAP | `cd apps/supabase && npx supabase test db` | **`Files=11, Tests=324, Result: PASS`**, zero `not ok` — the stated baseline exactly |
| Migration applies | `yarn db:reset` | **exit 0**, `00004` applied fourth |

**Not run, deliberately:** `yarn db:types` (a regen straight after a pgTAP run writes the suite's helper fixtures into `packages/supabase-types`; 157-04 owns the regen) and `yarn db:lint:sql` (exits 1 on four pre-existing plpgsql advisories since phase 151, and the plan's own prohibitions forbid invoking it here). `yarn test:unit` was not run: the realized diff contains zero TypeScript, JavaScript or Svelte files — only `.sql` and one `.txt` fixture — so no unit test is reachable from this change.

**Database left clean for the orchestrator.** The pgTAP run leaves helper fixtures (`test_id`, `test_user_id`, `set_test_user`) in `public` because `00-helpers.test.sql` defines them outside its `BEGIN`/`ROLLBACK`. A final `yarn db:reset` was run afterwards; a `pg_proc` count for those three names now returns **0**. The database carries migrations only, with no dev seed data, ready for the orchestrator's reseed.

## Known Stubs

None. No placeholder values, no TODO/FIXME markers, and no unwired data path were introduced. `get_questions` is a complete implementation exercised against a live database; its consumption by the adapter is 157-06's scope by design, not a stub left here.

## Threat Flags

None. The plan's `<threat_model>` covers the full surface this plan introduces, and each `mitigate` disposition was implemented and verified:

- **T-157-RPC (elevation of privilege):** `prosecdef = f`, `proconfig = NULL`, explicit `GRANT EXECUTE ... TO anon, authenticated` with the full argument list. Verified against the applied database.
- **T-157-07 (tampering, parameter handling):** parameters are typed `uuid` and `integer`, used only in comparisons and `@>` containment. `LANGUAGE sql` with no `EXECUTE`, so there is no dynamic statement to inject into.
- **T-157-08 (denial of service, overload ambiguity):** exactly one `get_nominations` row in `pg_proc` after `db:reset`.
- **T-157-09 (repudiation, mirror drift):** both copies in each commit, byte-identity checked, `-- Applies to schema files:` list complete.
- **T-157-SC (supply chain):** zero packages installed.

One residual worth flagging to 157-04's pgTAP author, not a new threat surface: `jsonb_array_length` raises on a non-array JSONB value. The three filter columns are arrays by convention but carry no CHECK constraint, so a hand-authored or imported row storing an object or scalar there would make `get_questions` error rather than fall back to "applies to all". This matches the plan's specified predicate and the TypeScript it transcribes (which would also mis-handle a non-array), so it was implemented as specified rather than hardened unilaterally.

## Self-Check: PASSED

- `apps/supabase/supabase/schema/505-question-rpcs.sql` — FOUND
- `apps/supabase/supabase/migrations/00004_question_rpcs_and_nomination_election_round.sql` — FOUND
- `apps/supabase/supabase/schema/503-entity-rpcs.sql` — FOUND (modified)
- `apps/supabase/scripts/schema-migration-parity.expected.txt` — FOUND (modified)
- Commit `67f370181` — FOUND
- Commit `022340a6a` — FOUND
- Commit `c4e5675be` — FOUND
