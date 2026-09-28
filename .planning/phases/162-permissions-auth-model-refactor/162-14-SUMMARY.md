---
phase: 162-permissions-auth-model-refactor
plan: 14
subsystem: supabase-storage-authority
status: complete
tags: [rls, storage, user_can, criterion-6, K2, D-21, D-27, anon-visibility]

requires:
  - '162-04 user_can(grant_scope_type, uuid, grant_permission) and its named branch 1 (project.read_structure)'
  - '162-08 project_open_for_voters, entity_has_confirmed_nomination, nomination_entities_confirmed'
  - '162-10 the normalised-identity technique and D-21 naming clause'
  - '162-13 the entity UPDATE allow-lists and the immutability trigger'
provides:
  - 'public.storage_verb enum (read | write) -- the declared argument that makes K2 separability structural'
  - 'public.storage_path_can(grant_scope_type, text, text, text, storage_verb) -- the storage authority question'
  - 'public.storage_path_is_public(text, text, text) -- section 3.4 asked of a path'
  - 'the eleven-segment path-to-permission mapping, in one CASE, in one function body'
  - '20-storage-authority.test.sql -- criterion 6 paired grid, 46 assertions'
affects:
  - '162-16 (storage half of the published removal is DISCHARGED -- 400-storage.sql needs no edit)'
  - '162-17 (widen the grid across the 3.3 matrix; file the seven counts in the negative-control ledger; sweep rls-policy-map.md)'

tech-stack:
  added: []
  patterns:
    - 'path segment as an ARGUMENT, never a policy-name or predicate literal (D-21 on the bucket dimension)'
    - 'text path arguments with an exception arm -- deny rather than raise on a malformed segment'
    - 'paired assertion whose table half is a real table operation, never a predicate call'

key-files:
  created:
    - apps/supabase/supabase/tests/database/20-storage-authority.test.sql
  modified:
    - apps/supabase/supabase/schema/000-enums.sql
    - apps/supabase/supabase/schema/400-storage.sql
    - apps/supabase/supabase/tests/database/06-storage-rls.test.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/database.ts

decisions:
  - 'Q1 = A -- two buckets, entity type carried by the path segment'
  - 'Q2 = A -- the full mapping, all ELEVEN segments'
  - 'Q3 = A -- the path-consistency conjunct, applied at BOTH scopes'
  - 'Q4 = A, names approved -- fifteen in, fifteen out, twelve renamed'
  - 'storage_path_is_public mirrors each table anon policy INCLUDING the terms-of-use guards (deviation, Rule 2)'

metrics:
  duration: ~4h
  completed: 2026-09-17

actuals:
  tokens: 71000
  tasks: 6
  commits: 5
  plan_head_before: c56cb4d602361499dbdd650f37316717e5086e16
---

# Phase 162 Plan 14: Storage Authority Summary

The fifteen `storage.objects` policies re-expressed over `user_can`, through an eleven-segment
path-to-permission mapping, with criterion 6's paired assertion landed two-directionally and
control-run three ways before it was accepted.

## Task 2 — the four ratified answers, by letter

Source: `162-CHECKPOINT-DECISIONS.md` § 7, items T-1..T-4, answered 2026-09-16. All four boxes left
unticked, which selects each item's ★ RECOMMENDED option.

| Q | Answer | The MEASURED figure it rests on (re-derived here, not transcribed) |
|---|---|---|
| **Q1** | **A** — two buckets, entity type in the path segment | Option (B)'s cost: the bucket names live in `config.toml`, not `schema/`, and `public-assets` is baked into the adapter's URL builder, the stored-image schema, the candidate upload path, dev-seed's portrait upload and teardown, and 20+ unit-test expectations. A frontend and seed migration with no permissions content. **(B) would have halted this plan; it was not chosen.** |
| **Q2** | **A** — the full mapping, **ELEVEN** segments | Derived from `pg_trigger`: 10 tables carry `cleanup_entity_storage_files`, which builds the path prefix from `TG_TABLE_NAME`, plus `project`. **Eleven, not the four the A4 note names** — a reader working from the note alone will expect four. |
| **Q3** | **A** — the path-consistency conjunct | Closes a gap present **today**. Risk bound measured first: of 327 seeded objects, **zero** carry a segment `[1]` disagreeing with the named row's `project_id`, so the tightening breaks nothing that exists. |
| **Q4** | **A, names approved** — fifteen in, fifteen out, twelve renamed | The count's role is load-bearing: ROADMAP criterion 6, `162-SPEC.md`, the outline and 162-17 all cite "15". Holding it stable is what stops a correct implementation reddening an acceptance criterion — the defect D-03 was corrected to avoid. |

### The twelve ratified policy names

The actor segment is now the **scope the predicate asks at**. The three SELECT policies keep their
names, which is why twelve are renamed and not fifteen.

| Retired name | Ratified name |
|---|---|
| `candidate_insert_public_assets` | `entity_insert_public_assets` |
| `candidate_insert_private_assets` | `entity_insert_private_assets` |
| `candidate_update_public_assets` | `entity_update_public_assets` |
| `candidate_update_private_assets` | `entity_update_private_assets` |
| `candidate_delete_public_assets` | `entity_delete_public_assets` |
| `candidate_delete_private_assets` | `entity_delete_private_assets` |
| `admin_insert_public_assets` | `project_insert_public_assets` |
| `admin_insert_private_assets` | `project_insert_private_assets` |
| `admin_update_public_assets` | `project_update_public_assets` |
| `admin_update_private_assets` | `project_update_private_assets` |
| `admin_delete_public_assets` | `project_delete_public_assets` |
| `admin_delete_private_assets` | `project_delete_private_assets` |

Unchanged (3): `anon_select_public_assets`, `authenticated_select_public_assets`,
`authenticated_select_private_assets`.

## The eleven-segment mapping as shipped

One `CASE`, one function body. **Every cell below was read off the applied `pg_policies` catalogue for
the table it names, cell by cell** — none was inferred from the brief.

| Type segment | entity scope, read | entity scope, write | project scope, read | project scope, write |
|---|---|---|---|---|
| `candidates` | `entity.read_answers` | `entity.edit_answers` | `project.read_entities` | `project.edit_entities` |
| `organizations` | `entity.read_answers` | `entity.edit_answers` | `project.read_entities` | `project.edit_entities` |
| `factions` | `entity.read_answers` | `entity.edit_answers` | `project.read_entities` | `project.edit_entities` |
| `alliances` | `entity.read_answers` | `entity.edit_answers` | `project.read_entities` | `project.edit_entities` |
| `elections` | — deny | — deny | `project.read_structure` | `project.edit_structure` |
| `constituencies` | — deny | — deny | `project.read_structure` | `project.edit_structure` |
| `constituency_groups` | — deny | — deny | `project.read_structure` | `project.edit_structure` |
| `questions` | — deny | — deny | `project.read_structure` | `project.edit_questions` |
| `question_categories` | — deny | — deny | `project.read_structure` | `project.edit_questions` |
| `nominations` | — deny | — deny | `project.read_entities` | `project.edit_nominations` |
| `project` | — deny | — deny | `project.read_structure` | `project.edit_app_settings` |
| anything else | deny | deny | deny | deny |

Three properties are asserted rather than assumed: the row must exist **in the table the segment
names** (test 7 — a path claiming `organizations` while carrying the caller's own candidate id is
refused, even though the caller holds the write permission on that id); the row's own project must be
the project the path claims (Q3); and the fall-through denies in both scopes and both verbs.

## The censuses, side by side

| | total | reaching a helper | legacy project predicate | inline self-ownership | `published` token |
|---|---|---|---|---|---|
| **opening** (Task 1) | 15 | 0 | **8** | **12**, in **8** policies (4 of them inside 2 policies that ALSO called the predicate) | 2 |
| **closing** (Task 6) | 15 | **15** | **0** | **0** | **0** |

Both read from `pg_policies` on a freshly reset database, never transcribed. **M1 and M2 reconciled
exactly**, including that seven is the non-caller total and that the twelve re-derivations sit in eight
policies. The retired publication helper returns **0** rows from `pg_proc`.

The 89 `public`-schema policies are **byte-identical** to the baseline recorded before the first edit —
asserted as a `diff`, not a count.

## The seven observed-red counts

Every count is **declared `plan(N)` minus passed** (D-37), never a count of `not ok` lines.

| Variant | Reddened | What it proves |
|---|---|---|
| **scope-variant** (tracer) | **4** | tests 4, 6, 7, 8 — the storage deny half |
| **deny-all-variant** (tracer) | **3** | tests 2, 5, 12 — the storage allow half |
| **visibility-true-variant** (anon grid) | **5** | tests 14, 15, 17, 18, 19 — the five conjuncts flipped one at a time |
| **visibility-false-variant** (anon grid) | **2** | tests 13, 16 — both allow directions |
| **verb-ignoring-variant** (paired grid) | **5** | includes **both** separability refusals — the floor K2's amendment exists to enforce |
| **wrong-scope-variant** (paired grid) | **9** | three separability refusals among them |
| **deny-all-variant** (paired grid) | **7** | the allow half at both scopes and both verbs |

**D-37 earned its keep in this plan, measured rather than inherited.** An early run of the new file
produced `plan=12 passed=0 rawnotok=0` — a data-modifying-CTE error aborted the transaction and the
file emitted **zero** `not ok` lines. A `not ok` count would have scored a wholly broken file at zero.

## pgTAP plan counts

| File | before | after |
|---|---|---|
| `20-storage-authority.test.sql` | — (new) | **46** |
| `06-storage-rls.test.sql` | 15 | **19** |
| estate total | 1042 | **1092** |

## Session figures for the existing storage file

- **claimed sessions: 3** — every authenticated session in `06-storage-rls.test.sql` that exercises a
  converted policy.
- **session observed-red: 4** — allow assertions that redden when the grants claim is stripped from
  those three sessions (at least one per session).

## Evidence that the path-consistency conjunct refuses a path that succeeds today

The plan's Q3 claim is that an admin of one project can **today** write into a path naming their project
and carrying another project's entity id. Measured on this database, in a rolled-back transaction, as
`admin_a` (project_admin of project A), against the **pre-plan** policy set and then the shipped one:

| Path written | pre-plan (`admin_insert_public_assets`) | shipped (`project_insert_public_assets`) |
|---|---|---|
| `{project_A}/candidates/{candidate_B_id}/forged.jpg` | **ACCEPTED** — the predicate was `can_access_project(segment[1])` and never looked at segment `[3]` at all | **REFUSED, 42501** — the row exists but its `project_id` is project B, not the project the path claims |
| `{project_A}/organizations/{candidate_A_id}/forged.png` | **ACCEPTED** — same reason; the type segment was unread at project scope | **REFUSED, 42501** — no row with that id in `organizations` |

Both refusals are the same conjunct doing two jobs: the type/id pairing and the project pairing. Test 7
asserts the second shape at entity scope, where it is sharper still — the caller **does** hold
`entity.edit_answers` on the id in segment `[3]`, so without the pairing the forgery is authorised by
the caller's own legitimate grant.

Not asserted — **run**. The pre-plan predicate was restored verbatim inside a rolled-back transaction
and both paths retried as the same fixture identity. Output, unedited:

```
SHIPPED  cross-project id : REFUSED 42501
SHIPPED  wrong-type id    : REFUSED 42501
SHIPPED  honest path      : ACCEPTED
PRE-PLAN cross-project id : ACCEPTED
PRE-PLAN wrong-type id    : ACCEPTED
```

The third line is what keeps the other two from being a blanket denial: the same caller writing the
path it legitimately owns is still accepted.

## Deviations from Plan

### [Rule 2 — missing critical functionality] `storage_path_is_public` mirrors each table anon policy in full, including the terms-of-use guards

- **Found during:** Task 1, deriving the anon table predicates from `pg_policies`.
- **Issue:** the plan specifies the helper as "162-08's three helpers and nothing else" — project open,
  entity confirmed, confirming nomination. But `anon_select_candidates` carries **two further
  conjuncts**, `terms_of_use_accepted IS NOT NULL AND terms_of_use_accepted < now()`, and only
  `candidates` has that column. Composing the three helpers alone would have made a candidate's photo
  anon-fetchable while the candidate row itself stayed hidden — storage disagreeing with tables, in the
  one direction a passing read test cannot report, inside the plan whose subject is that they agree.
- **Fix:** each branch of the helper is the anon SELECT policy of the table that segment names, read
  from the catalogue: the six structure families carry the project conjunct alone; `nominations`
  carries its own three; the four entity tables carry confirmation plus a confirming nomination, plus
  the terms-of-use guards where the table has them.
- **Made load-bearing:** test 19 flips the terms-of-use conjunct alone and is observed red against the
  true-returning variant, so the added conjunct is asserted rather than merely present.
- **Commit:** a76e39fda

### [Rule 3 — blocking] Four broken gates in the plan's own verify blocks, repaired in place

D-34 expectation met; each was load-bearing or would have reddened against a correct implementation.

1. **`GROUP BY 1` over an expression containing an aggregate** (Task 1 path-shape census) — PostgreSQL
   errors outright: `aggregate functions are not allowed in GROUP BY`. Rewritten as a subquery.
2. **`prosecdef` renders `true`, not `t`** (Task 3 helper hardening). The gate greps for
   `|t|search_path=` against a catalogue that renders `name|true|search_path=""`. As written it would
   have fired on **every** correct helper. Repaired to `|true|search_path=`.
3. **The cast-hazard probe could not reproduce on this database.** The plan selects over the seeded
   bucket and expects `invalid input syntax for type uuid`; all 327 seeded objects carry a uuid third
   segment, so nothing raises. Repaired by inserting the project-level path inside the rolled-back
   probe transaction, which makes the reproduction deterministic rather than dependent on the seed.
   The hazard then reproduced exactly: `invalid input syntax for type uuid: "settings"`, aborting the
   whole statement; the guarded form returned `328`.
4. **`test "$RED" -eq 12` and the `Q1` letter grep read figures the source files do not carry** — see
   the two findings below.

### [Rule 3 — blocking] Two of the plan's inherited-answer gates read figures that are not in the files

- **`162-13-SUMMARY.md` does not contain the string `edit_answers` at all.** The plan's gate halts if
  it cannot recover "the entity-scope write permission" from that SUMMARY; 162-13 was about the
  immutability trigger and names `entity.edit_immutable` and `entity.confirm`. **Repaired by deriving
  the permission from the applied `pg_policies` instead** — `entity_update_own_*` asks
  `entity.edit_answers`, `admin_update_*` asks `project.edit_entities`. Strictly stronger: it reads the
  thing the storage layer must actually agree with, rather than a prose restatement of it.
- **`162-10-SUMMARY.md` records its Q1 answer in a form the plan's regex cannot match** (`Q1 (V-6) = A`
  — the `(V-6)` between the key and the letter defeats the `[^A-Za-z0-9]{0,20}` window). The answer is
  recoverable by eye and is **A**.

### [Rule 3 — blocking] Two of the plan's control-variant floors were unreachable by its own design

Both were repaired by making the assertion set **stronger**, never by lowering a floor.

- **Tracer.** The plan's deny half is "tests 3, 4, 6 and 7", floor 4 — but test 3 is a **table**
  assertion, which a storage-only variant cannot redden, so its own design tops out at 3. Repaired by
  adding a fourth genuine storage-side denial (an entity grantee refused the project-level path) and a
  third storage-side allow (the project-scope twin, which the tracer converts anyway and so ought to
  have been asserted). Measured: 4 and 3.
- **Anon grid.** The plan's deny half of 5 includes the private-bucket read and the anon writes, neither
  of which a visibility variant can redden — the private-bucket SELECT has no visibility disjunct **by
  the plan's own design**, and there are no anon write policies at all. Repaired by making all five
  negatives genuine conjunct-flips of the visibility rule, which is what the floor was reaching for.
  Measured: 5.

### [Rule 1 — bug] Two assertions in the new file were coupled to objects other tests create

`%/candidates/{id}/%` and `%/project/settings/%` counted objects that earlier tests had inserted, so a
widening control variant reddened test 16 for a reason unrelated to what it asserts. Scoped both to the
specific fixture filename.

### [Rule 1 — bug] The anon DELETE assertion could not measure what it claimed

`storage.objects` carries a Supabase-supplied guard refusing direct deletion from **every** role —
`Direct deletion from storage tables is not allowed. Use the Storage API instead.` — so a DELETE-policy
denial is not observable as an affected-row count of zero. Asserting `0` would have reddened against a
correct policy set for a reason with nothing to do with authority. Re-expressed to assert the property
that matters and holds whichever mechanism refuses: every public-bucket object **survives** the attempt,
counted as postgres on both sides of it.

### [Rule 3 — blocking] `06-storage-rls.test.sql`'s grants-claim instruction was inert

The plan asks for a grants claim "added additively after the existing user-setup call". `set_test_user`
has **built the grants claim itself** since 162-06, via `test_grants_claim(p_user_id)`, so the addition
would have reddened nothing — a decorative edit of exactly the class 162-12 found one of. Replaced with
a stronger measurement: the claim those sessions already carry is **stripped** (through
`set_test_retired_claim`, the estate's own no-grants-token instrument) and the allow assertions are
observed to fail. 3 sessions, 4 assertions red.

### [Rule 3 — blocking] Two falsified reasons in the existing storage file, not one

The plan names the organizations-folder refusal. The project-level assertion — `Anon can see
project-level file in public-assets (always accessible)` — is **equally falsified**, because this plan
gates that path on the project being open for voters. Both reasons re-expressed; neither assertion's
claim or direction moved and none was deleted.

### [style] 282 comment-hygiene violations, all in this plan's own files

`lint:check` rule 2 (D-A4) requires a wrapped comment span to be one line. All 282 were in the five
files authored here and none anywhere else. Joined mechanically by the gate's own predicate; no word of
any comment changed. Commit d0e55ae56.

## Findings to report

### FINDING 1 — the stale `entity_is_anon_visible` reference is in `162-10-SUMMARY.md`, not in this plan

The orchestrator flagged that any plan text naming `entity_is_anon_visible` is stale under D-36.
**`162-14-PLAN.md` contains zero occurrences of it** — the plan is clean. The stale reference is in
`162-10-SUMMARY.md` line 297, which this plan's `read_first` directs the executor to read: *"162-14
inherits ... `entity_is_anon_visible (<type from segment 2>, ...)`"*. `pg_proc` returns **0** rows for
that name. The direct helpers were used, as D-36 requires.

### FINDING 2 — the anon bucket read is 6.4x slower, reported as measured

Same instrument on both sides — `EXPLAIN ANALYZE` of an RLS-filtered `SELECT count(*) FROM
storage.objects WHERE bucket_id='public-assets'` as `anon`, over the 327 seeded objects, after a full
`db:reset` in **both** cases (an estate run leaves the last applied variant installed; D-35's 19x error
came from exactly that).

| | |
|---|---|
| before (retired publication helper) | **4.890 ms** |
| after (`storage_path_is_public`) | **31.730 / 30.773 / 31.153 ms → ~31.2 ms** |
| ratio | **6.4x** |

**Cause, and why D-36's remedy does not apply here.** The anon read now makes three `SECURITY DEFINER`
calls per row where it made one. D-36's finding is precisely this — a definer function can never be
inlined by the planner, so composing two inside a third makes every per-row call depth 2 — and it is
why `entity_is_anon_visible` was reverted and the eight entity SELECT policies call the helpers
directly. **That remedy is structurally unavailable at this layer**: a table policy can inline because
its object identity is a typed column, whereas a storage policy's is three text path segments needing a
parse, a dynamically named lookup and a cast guard, none of which is expressible inside a policy
expression.

**Practical reach, measured rather than assumed.** `public-assets` is declared `public = true` in
`config.toml`, so Supabase serves those objects through `/storage/v1/object/public/...` **without
applying RLS** — image fetching in the voter app never touches this policy. The only `storage.objects`
list/remove calls in the tree are in `packages/dev-seed/src/supabaseAdminClient.ts`, on a
**service-role** client, which bypasses RLS entirely. So the regression has **no application path
exercising it today**. It is real, it is recorded, and no index was added: `storage.objects.name`
predicates have never been measured on this tree, and an index chosen from a predicate's shape rather
than from a plan is a guess recorded as a fact. **Handed on with the numbers.**

### FINDING 3 — the E2E suite failed on run 01 and was green on run 02. Recorded OPEN, not written off.

| run | passed | failed | did not run |
|---|---|---|---|
| `tests/e2e-runs/162-14-wave5` (run 01) | 118 | **2** | **35** |
| `tests/e2e-runs/162-14-recheck-a11y` (a11y-smoke alone) | 18 | 0 | 0 |
| `tests/e2e-runs/162-14-recheck-perm` (perm-show-feedback-survey alone) | 86 | 0 | 0 |
| **`tests/e2e-runs/162-14-wave5-run02` (full suite)** | **155** | **0** | **0** |

The two failures were `perm-show-feedback-survey` (EPERM-09, survey popup) and `a11y-smoke`
(navigation focus after Q→Q). **CLAUDE.md forbids calling an intermittent failure flaky**, so this is
recorded as an open entry in `.planning/WINDOWS.md` rather than closed by the green re-run.

What the evidence bears on causation, stated without overclaiming:

- **Both failures are timeout-shaped, not assertion-shaped.** `perm-show-feedback-survey` reports
  `Test timeout of 90000ms exceeded` with a recorded **duration of 770174 ms** — a 12.8-minute wall
  clock against a 90-second budget, which is the signature of a starved worker rather than of a wrong
  answer. `a11y-smoke` timed out after 10 s waiting on a focus predicate. Neither asserts anything
  about storage.
- **The one application path that exercises a converted write policy for real — the candidate
  journey's portrait upload — PASSED in the failing run**, as did all 14 candidate a11y scans and the
  cold-entry candidate spec.
- **No voter data query changed**: the 89 `public`-schema table policies are byte-identical to the
  pre-plan baseline.
- **The voter image path does not reach the changed policy at all** (public bucket, RLS not applied).
- The run recorded `observed_workers=6` on a host also running Docker and Supabase.
- **Against all of that**: the five preceding runs in this worktree (162-13, 162-12, d36-revert-01,
  162-11, 162-10) were each **155 passed**, so run 01 is the first failure in the series and that fact
  is not explained by the points above. It is left open for that reason.

## Known Stubs

None. No stub, placeholder or hardcoded empty value was introduced.

## Threat Flags

None. No new network endpoint, auth path or trust-boundary schema change beyond the two helpers, both
of which are in the plan's own threat register (T-162-14-01 .. T-162-14-13).

## Handoffs

1. **To 162-16 — DISCHARGED.** The storage layer's reader of the retired publication term is gone:
   `is_storage_entity_published` returns **0** rows from `pg_proc`, the token `published` appears in
   **0** storage policy expressions, and no tombstone comment names it. 162-16 removes the ten columns
   and their partial indexes and **touches `400-storage.sql` not at all**. Stated in the form 162-08's
   SUMMARY used for the anon table policies.
2. **To 162-17 — PARTLY OWED, and the boundary is stated so criterion 6 is read as neither wholly
   discharged nor wholly outstanding.** This plan **lands** the paired grid for the fifteen policies it
   converts and control-runs it three ways. 162-17 **widens** it across § 3.3's matrix and files the
   seven reddened counts in `162-NEGATIVE-CONTROL-LEDGER.md` under F4(a). Also owed there: behavioural
   entity-scope coverage for factions and alliances, which the shared fixture cannot give today (M8 —
   it carries users for candidates and organizations only); they are covered here on the read side and
   structurally by the normalised-identity assertion.
3. **To 162-17 — `.claude/skills/database/rls-policy-map.md` § Storage Policies is STALE as of this
   commit.** It names all fifteen old policy names, the retired publication helper and the old path
   convention. Deliberately not swept here, on the reasoning 162-08 and 162-10 recorded: every plan
   from 162-08 to 162-16 rewrites more of the same inventory, so sweeping it nine times is churn.

## Verification

| Gate | Result |
|---|---|
| `yarn typecheck` | 0 — 23/23 tasks |
| `yarn lint:check` | 0 — comment hygiene 0 violations across 1672 files |
| `yarn test:unit` | 0 — 25/25 tasks |
| `yarn workspace @openvaa/supabase test:db` | 0 — Files=24, **Tests=1092**, PASS |
| `yarn db:lint:sql` | 0 — 0 errors, 3 pre-existing FK-index warnings |
| full E2E suite | run 02: **155 passed / 0 failed / 0 did not run** (see FINDING 3) |
| `yarn assert:schema-migration-parity` | pass; `migrations/` holds exactly **1** `.sql` file |
| scope | 6 files changed vs base, **0** outside the declared surface, **0** dependency lines moved |

Each gate was invoked directly and its exit status read directly — never through a pipe.

## Self-Check: PASSED

- `apps/supabase/supabase/tests/database/20-storage-authority.test.sql` — FOUND
- `apps/supabase/supabase/schema/400-storage.sql` — FOUND
- `apps/supabase/supabase/schema/000-enums.sql` — FOUND
- `apps/supabase/supabase/tests/database/06-storage-rls.test.sql` — FOUND
- Commits `6bc45214e`, `a76e39fda`, `6e5e10076`, `d0e55ae56` — all FOUND in `git log`
