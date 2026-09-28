---
phase: 162-permissions-auth-model-refactor
plan: 10
subsystem: database
tags: [postgres, rls, supabase, pgtap, permissions, user_can, entity-policies]

requires:
  - phase: 162-04
    provides: "user_can, is_child_nominee (Q2 = D, gating nomination.read), entity_project_id, grant_role_permissions"
  - phase: 162-07b
    provides: "the removal of candidates.organization_id and the named obligation to restore its reach through the nomination hierarchy (WINDOWS.md row 267)"
  - phase: 162-08
    provides: "project_open_for_voters, entity_has_confirmed_nomination, nomination_entities_confirmed, and the 51-assertion anon-visibility grid"
  - phase: 162-09
    provides: "the account, project and structure tiers converted; user_has_account_grant; the 792-assertion estate this plan grew from"
provides:
  - "All 20 TO authenticated policies on organizations, candidates, factions and alliances delegate their whole authority decision to user_can"
  - "entity_is_anon_visible (entity_type, uuid) — the ONE composition of 'is this entity row publicly visible', called by the four anon policies, the four authenticated ones and nomination_entities_confirmed"
  - "WINDOWS.md row 267 CLOSED: the organization's read of its own unconfirmed candidates, restored through the nomination hierarchy"
  - "entity_update_own_factions and entity_update_own_alliances, each with its REVOKE UPDATE / GRANT UPDATE (...) column bound in the same commit"
  - "is_candidate_self dropped — absent from pg_proc, from schema/ including comments, and from the generated types"
  - "18-entity-policies.test.sql — a 58-assertion grid asserting D-21 structurally across five verb families"
affects: [162-11, 162-12, 162-13, 162-14, 162-15, 162-16, 162-17]

actuals:
  tokens: 38195
  tasks: 6
  commits: 5
  plan_head_before: a4a417d95daef3783ec5b4b1eb317f79c13c3395

tech-stack:
  added: []
  patterns:
    - "Entity-scope self-access folded into user_can: `own` falls out of the reach rule, so no policy compares a column to auth.uid()"
    - "The public-visibility rule composed once and called by both the anon and the authenticated halves (V-6(A))"
    - "D-21 asserted STRUCTURALLY: each verb family's four policy expressions, normalised for the table name and the entity-type literal, are one string"
    - "Affected-row counts measured through a SECURITY INVOKER plpgsql helper with GET DIAGNOSTICS, not inferred from a read-back through a second policy"

key-files:
  created:
    - apps/supabase/supabase/tests/database/18-entity-policies.test.sql
  modified:
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/schema/302-rls.sql
    - apps/supabase/supabase/schema/303-column-grants.sql
    - apps/supabase/supabase/tests/database/05-organization-admin.test.sql
    - apps/supabase/supabase/tests/database/13-shim-parity.test.sql
    - apps/supabase/supabase/tests/database/15-visibility-flags.test.sql
    - apps/supabase/supabase/tests/database/16-anon-visibility.test.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/database.ts

key-decisions:
  - "Q1 (V-6) = A: one entity_is_anon_visible, called by the four anon policies, the four authenticated ones and 162-08's nomination helper"
  - "Q2 (P-3) = a: factions and alliances gain entity_update_own_*, each with its column bound in the same commit. 20 policies, not 18"
  - "Q3 (C-6) = renames approved: candidate_update_own -> entity_update_own_candidates; organization_update_own_organizations -> entity_update_own_organizations. admin_* deliberately NOT renamed"
  - "The parent reach is spelled user_can('entity', id, 'nomination.read'), NOT the entity.read_answers the plan prescribed — 162-04 Q2 = (D) makes the prescribed spelling answer false"
  - "V-6(A)'s premise that 162-08's grid re-runs unchanged is FALSE AS MEASURED: 1 of 51 reddens, a structural text-pin; the operator lifted the prohibition for that assertion alone"
  - "The read-cost gate is BREACHED (6.37x / 7.31x against 2.0) and was NOT fixed, because no fix exists that respects both V-6(A) and D-21"

patterns-established:
  - "A deny assertion must be asked against a row the caller CAN SEE, or the SELECT policy answers the question the UPDATE policy was asked"
  - "An inherited pinned assertion is re-pointed at the end state, never deleted, and the replacement must still fail if the thing it guards regresses"

requirements-completed: [PRESHIP-02]

duration: 3h05m
completed: 2026-09-17
status: complete
---

# Phase 162 Plan 10: The Entity Tier Summary

**The four entity tables now answer "may this caller touch this row" in exactly one place — twenty predicates delegating to `user_can`, one composition of the public-visibility rule, and the organization's read of its own unconfirmed candidates restored through the nomination hierarchy after a two-plan window.**

## Performance

- **Duration:** ~3h05m
- **Tasks:** 6 of 6
- **Files modified:** 9 modified, 1 created
- **Commits:** 5

## The named figures

| Figure | Value |
| --- | --- |
| **Task 2 Q1 (V-6)** | **A** — one function, eight policy call sites plus `nomination_entities_confirmed` |
| **Task 2 Q2 (P-3)** | **a** — 20 policies, `303-column-grants.sql` edited |
| **Task 2 Q3 (C-6)** | **renames approved**, `admin_*` deliberately left alone |
| **162-04 Task 2 Q2** | **(D)** — `is_child_nominee` gates `nomination.read`, NOT `entity.read_answers` |
| `TO authenticated` policies on the four entity tables | **18 before -> 20 after**, all 20 carrying `user_can` |
| `TO anon` policies on those tables | **4 before -> 4 after** |
| Inline `auth.uid()` self-ownership re-derivations | **6 before -> 0 after** |
| Residual `can_access_project` / `has_role` / `is_candidate_self` / `uid()` / `published` in those policies | **0 / 0 / 0 / 0 / 0** |
| `can_access_project` call sites in those policies | **20 before -> 0 after** (20 remain elsewhere in `public`, so 17's non-vacuity companion still holds) |
| `is_candidate_self` in `pg_proc` / in `schema/` / in generated types | **0 / 0 / 0** |
| D-21 verb families proven one expression | **5 of 5** (the plan gated 3) |
| pgTAP estate | **20 files, 853 assertions, exit 0** (baseline 19 / 792) |
| `18-entity-policies.test.sql` declared plan | **58** |
| `authenticated_select_candidates` qual md5 | **`5b2adcf8b4e7a8bcbb5195c6e0bfc37c` -> `c53246aff2e6b5984a69abffac188705`** |
| `anon_select_candidates` qual md5 | **`99172e23c5765f9d688f0e2c8ad9a1b2` -> `319d8e8664cdfdef532628c32c8f0d70`** |
| Column bound, granted / total columns | candidates **10/20**, organizations **8/18**, factions **7/17**, alliances **7/16**; `project_id` granted on **none** |
| E2E population for the authenticated entity read | **2 specs** (`perm/perm-not-located-2e2cg`, `voter/cold-entry-dataroot`) |

## WINDOW 267 IS CLOSED, AND HERE IS THE NUMBER

162-07b removed `has_role ('organization', 'organization', organization_id)` from `authenticated_select_candidates` together with the column it read, and recorded that **no pre-existing test reported the window opening and none would report it closing**. This plan discharges that obligation.

**The before/after of the policy, by md5 of its `qual` read from `pg_policies`:**

| | md5 |
| --- | --- |
| recorded by 162-08 at its base and HEAD, and by 162-09 at both of its | `5b2adcf8b4e7a8bcbb5195c6e0bfc37c` |
| this plan, HEAD | `c53246aff2e6b5984a69abffac188705` |

Both sibling plans proved they left it untouched. This is the plan that changes it.

**The 0 -> 1 move, measured on the same fixture with the same caller:**

| Row | BEFORE (plan base `a4a417d95`) | AFTER |
| --- | --- | --- |
| unpublished, **unconfirmed** candidate nominated under `organization_a`'s own nomination, read by `organization_a` | **0** | **1** |
| unpublished candidate in the same project with **no nomination** (the control) | **0** | **0** |

The control is what distinguishes a restored hierarchy reach from a blanket widening, and it is why 162-07b's own TEST A is left **byte-identical and still green**: its row, Nadia, is nominated nowhere, so under the restored rule she was never "of its own organization" — the reach 162-07b removed read a *column*, and the reach that replaces it reads the *nomination hierarchy*. TEST A is now the bound on the restoration rather than its subject; the subject is the new TEST C, and its paired opposite asserts that an entity grantee which is not this candidate's nominating parent still cannot see the row.

Both live in `05-organization-admin.test.sql` § 5c, and the S-STRICT negative control below reddens **TEST C specifically**, so the closure is attributable to the disjunct that causes it and not to something else in the commit.

### The spelling had to change, and the ratified answer is why

The plan prescribes `user_can ('entity', id, 'entity.read_answers')` and asserts that the predicate is "identical either way, only the assertion direction differs". **That is false under the answer 162-04 actually recorded.** Q2 was ratified **(D)**: `is_child_nominee` gates `nomination.read` and explicitly **not** `entity.read_answers`, so `user_can ('entity', id, 'entity.read_answers')` answers *false* for a parent organization and the window would have stayed open behind a predicate that looked correct.

The reach is therefore spelled **`user_can ('entity', id, 'nomination.read')`** — whose named branch 2 *is* `is_child_nominee`. This is the only spelling compatible with Q2 = (D), it keeps the parent's reach inside `user_can` rather than restoring it as a policy disjunct (the plan's actual requirement), and it generalises past the rule it replaces exactly as D-21 asks: the old disjunct named `organization` and read a column; this one names no entity type at all, so a faction or alliance parent reaches its own child nominees too.

Recorded as a deviation that fixes a plan-internal contradiction, with 162-04 Q2 = (D) as the authority. Confirmed by the operator.

## V-6(A): one composition, and the premise that was false

`entity_is_anon_visible (p_entity_type public.entity_type, p_entity_id uuid)` is `STABLE SECURITY DEFINER SET search_path = ''`, takes the entity type as its **first argument**, denies when the id is in no row of its type, and is called by the four anon entity policies, the four authenticated ones, and `nomination_entities_confirmed`. 162-08's recorded cost — *"the terms-of-use rule is written in two places"* — is now **paid off rather than mitigated**: there is one expression left to disagree with itself.

**V-6(A)'s stated premise — "162-08's grid re-runs unchanged as the neutrality proof" — is FALSE AS MEASURED. State the numbers:**

- **1 of 51** assertions in `16-anon-visibility.test.sql` reddens: assertion 46, which pinned `COALESCE(qual,'') LIKE '%project_open_for_voters%'` on `anon_select_candidates`. V-6(A) moves that conjunct inside the function, so **no spelling of (A) can satisfy it**.
- **All 50 behavioural assertions stay green**, and `03-anon-read.test.sql` reddens **0**. The refactor is behaviourally neutral exactly as (A) claims; the premise is wrong only about *spelling*.

The executor halted on this rather than resolving it, because it is a contradiction between a ratified answer and a hard plan prohibition. **The operator lifted the prohibition for assertion 46 alone**; every other assertion in that file, and the whole of `03-anon-read`, `06-storage-rls` and `07-rpc-security`, remain fenced and are **byte-identical to the plan base** — verified, as is `400-storage.sql`.

Assertion 46's replacement is **strictly stronger than the pin it replaces, and that is the whole justification for touching a fenced file.** The old pin could only see the policy text. The replacement follows the term to where it now lives: both anon policies must reach the project term — directly or through the one composition — neither may mention the publication column, and **the composition's own body, read from `pg_get_functiondef` rather than from the schema file, must still require `project_open_for_voters`**. Drop that conjunct from the function and the new assertion reddens; the old one would not have noticed, because the function is not the policy.

### The neutrality proof, run as the operator required

162-08's grid was run against a deliberately weakened variant of `entity_is_anon_visible` with the entity-confirmation conjunct removed from all four arms:

**6 of 51 assertions redden** — the direct entity conjunct on all four tables (tests 3, 28, 32, 36) **and both transitive ones** (tests 10, 43), which reach the function only through `nomination_entities_confirmed`. The transitive pair reddening is the evidence that the composition really is shared rather than merely duplicated. A grid that stayed green against a broken variant would not be proving anything; this one is a live instrument.

## The negative controls, all measured

Seven controls, run against the estate and counted. The plan asked for four numbers; these are the ones the instruments actually produced.

| Control | Reddened | Note |
| --- | --- | --- |
| **Tracer**, self-update `USING (true)` (row-unbound) | **5 behavioural** | floor 4 |
| **Tracer**, self-update with no entity disjunct | **4 behavioural** | floor 3 |
| **Tracer**, `user_can ('project', project_id, 'entity.edit_answers')` — the variant the plan NAMES as its over-permissive control | **4, ALL in the ALLOW half** | **the named control does not exercise the deny half at all.** An entity grantee holds no project-scope grant, so that spelling is over-*strict* for this caller |
| **Task 4**, all four self-update policies `USING (true)` | **8** | |
| **Task 4**, all four self-update policies with no entity disjunct | **10** | |
| **Task 4**, all four SELECT policies blanket `USING (true)` | **24** | includes the four anon-superset id-set equalities |
| **Task 4**, all four SELECT policies with both entity disjuncts removed | **10, including TEST C** | the direct evidence that the `nomination.read` disjunct is what closes window 267 |
| **V-6(A) neutrality**, 162-08's grid vs a weakened `entity_is_anon_visible` | **6 of 51** | |

**The plan's fourth requested number does not exist, and the reason is a finding.** It asked for "existing assertions reddened without the added grants claims", floored above zero. There are **no additions to remove**: `set_test_user` has projected `public.grants` into the claim through `test_grants_claim` since 162-06, so every session in `01-tenant-isolation`, `02-candidate-self-edit`, `05-organization-admin` and `09-column-restrictions` already carries a grants claim. Those three of the four files are consequently **unchanged**, against the plan's expectation that all four would be edited.

**A negative control caught a defect in this plan's own grid.** Section 6's four UPDATE denials stayed GREEN against `USING (true)`, because PostgreSQL applies the SELECT policies as well as the UPDATE policy to an `UPDATE ... WHERE id = $1` — the WHERE clause reads a column — and the sibling rows are invisible to their caller, so the zero those assertions reported was produced by the SELECT policy whether or not the UPDATE predicate was sound. Section 6b re-asks the deny half against rows the caller demonstrably **can** see; all four then redden. Both sections are kept: one states that an entity grantee cannot reach its sibling at all, the other that the UPDATE predicate by itself refuses a visible one. Defence in depth is only defence if each layer is measured on its own.

## The six inherited pinned assertions, each strengthened

Every one was re-pointed at the end state; none was deleted or weakened. What each now proves that the old one did not:

| # | Assertion | What the replacement proves that the pin did not |
| --- | --- | --- |
| 1 | `16-anon-visibility`:46 | follows the project term into `entity_is_anon_visible`'s own body via `pg_get_functiondef`, so a conjunct dropped from the function cannot hide behind a policy that merely calls it |
| 2 | `13-shim-parity`:18 | asserts the retired predicate is **absent** — not in `pg_proc`, not named by any policy in `public`, over a policy population floored above fifty — where an md5 equality went green again the moment anyone re-created the function with the old body, which is precisely the shim this phase forbids |
| 3 | `05-organization-admin`:11 | names **which** row the organization sees and **why** (its child nominee) and which it does not, so it fails both if the hierarchy reach regresses and if it widens into a blanket project read; the old one counted two rows admitted by the publication term, which had nothing to do with the caller |
| 4 | `05-organization-admin`:13 (TEST B) | requires the qual to name `user_can`, the nomination-hierarchy reach and the one public composition, and to name **none** of the five retired predicates; the old one pinned the presence of three strings that D-11b and the conversion both remove |
| 5 | `05-organization-admin`:14 | asserts the `organizations` and `candidates` SELECT quals are **one expression** modulo table name and type literal — D-21 stated where a reader of that file would look for it; the old one was satisfied by the mere presence of a substring |
| 6 | `15-visibility-flags`:25 | states the end state in both directions — the two self-update policies exist under the D-21 name shape, table-level UPDATE is gone, the granted count is >0 and <total, and `project_id`, `id`, `published` and `confirmed` are none of them. The old one proved only that nobody could reach the table, and would have stayed green against a self-update policy with **no bound at all** had it simply carried an `admin_` prefix |

## ⚠ THE READ-COST GATE IS BREACHED, AND NOT FIXED

Reported as measured, not padded. Row counts unchanged on both sides, so it is a real slowdown and not a faster-but-emptier query.

| Read | Before | After | Ratio | Budget | Rows |
| --- | --- | --- | --- | --- | --- |
| anon `count(*)` on `candidates` | **2.024 ms** | **12.895 ms** | **6.37** | 2.0 | 200 -> 200 |
| authenticated (no grants) `count(*)` | **2.666 ms** | **19.484 ms** | **7.31** | 2.0 | 200 -> 200 |

Instrument: 400 candidates in one open project, half anon-visible, RLS actually applied via `SET LOCAL ROLE`, min of 3 runs of 20 queries, fixture rolled back. **The plan's own timing blocks were repaired first** — they ran as `postgres`, a superuser, so RLS was bypassed and the ratio measured statement overhead against a one-row table; and Task 1's block never wrote the `anon_before_ms` value Task 5's block reads, so the gate could only ever have exited non-zero.

**Decomposed (400 rows, ms per query):**

| Variant | ms |
| --- | --- |
| old inline predicate (the before shape) | 3.00 |
| shipped `entity_is_anon_visible`, four-arm CASE | 13.37 |
| same rule, **one** arm, same nesting | 11.90 |
| same rule, one arm, `projects`/`nominations` read **directly** | **3.75** |
| trivial `SECURITY DEFINER` fn, 400 calls from a policy qual | 0.61 |
| PK-probe `SECURITY DEFINER` fn, 400 calls from a policy qual | 1.18 |

**The cause is not the four-arm CASE (1.5 ms) and not the primary-key re-read the operator accepted (~3 µs/call).** It is calling `project_open_for_voters` and `entity_has_confirmed_nomination` from **inside** another SQL `SECURITY DEFINER` body: ~20 µs per row, against ~2 µs for the same two calls made from the policy qual. The before policy made them at the top level; V-6(A) moved them one level down, and that *is* the composition.

**No in-plan fix exists that respects the ratification, and this is a tension between two ratified properties:**

- The variant that meets the budget (3.75 ms) reads `projects` and `nominations` directly inside the function — a second spelling of the two rules 162-08's helpers own, forbidden by that plan's own docstring (*"NO policy anywhere holding a nominations sub-select of its own"*). Meeting the performance gate would break the single-encoding rule V-6(A) exists to serve.
- The other fast variant makes the function `SECURITY INVOKER` and inlinable by passing `project_id`, `confirmed` and the terms-of-use timestamp as arguments. But `terms_of_use_accepted` exists only on `candidates`, so the other three tables would pass `NULL` — and **D-21's SELECT-family normalised-identity assertion would fail**, which is the property V-6(A) was chosen over (B) and (C) to obtain.

**Not done, deliberately:** reordering the four disjuncts to put the public one first buys ~20% on the voter path, costs the candidate app the same, and contradicts the order the plan's design section prescribes. A cosmetic 20% against a 3x overshoot is a padded number, not a fix. No index was added — prohibited, and every lookup already uses one.

**At default-template scale** (328 candidates, 377 nominations): anon `count(*)` on `candidates` **32.9 ms**, `get_nominations` as anon **83.5 ms**. Absolute figures are acceptable for this dataset; the ratio is what does not scale.

**One symptom already surfaced.** The first full `yarn test:unit` run failed `dev-seed` TMPL-03 with `57014: canceling statement due to statement timeout` on the anon `get_nominations` call, while turbo was building 23 packages concurrently on a cold cache. It did not reproduce: the test passes in isolation and the full suite is green on re-run (784 dev-seed tests). It is recorded rather than dismissed as a flake — the regression did not cause a deterministic failure, but it consumed the headroom that used to absorb load.

Recorded in `WINDOWS.md` as an open entry. **The choice is the operator's:** accept the cost, re-ratify V-6, or relax D-21's SELECT-family identity for the terms-of-use argument.

## Corrections to the plan's measured facts

- **M7 is FALSE.** *"No pgTAP file asserts a policy name or reads `pg_policies`."* Five files read `pg_policies` — `05`, `12`, `15`, `16`, `17` — and `05-organization-admin.test.sql` reads `policyname` at its lines 289 and 304. C-6's cost statement inherits the error. The renames were still cheap, but not free: they cost two re-pointed assertions, not two comment corrections.
- **M3 is FALSE, narrowly.** *"`is_candidate_self`'s only occurrences in `apps/supabase/` are its declaration, two header helper lists and the generated types."* Two more exist, both non-executable: `13-shim-parity.test.sql` pins its `md5(prosrc)` — parked there **by 162-06, explicitly for this plan** — and `17-project-structure-authority.test.sql` names it in a negative guard that stays at zero. **Zero *executable* call sites is still correct**, so A3(a)'s drop-not-shim ruling stands; but the deletion was not invisible to the estate as M3 implied.
- **The plan's `uid`, `can_access_project`, `has_role` and `published` counts (6 / 20 / 3 / 4) are all exactly right**, once the counting instrument is repaired: `pg_get_expr` renders every function call with an `AS <fnname>` alias, so the plan's `grep -o 'can_access_project'` measures **40** where 20 call sites exist, and `has_role` **6** where 3 exist. Counting `can_access_project(` and `has_role(` reproduces the plan's figures exactly.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Blocking] The parent-reach predicate contradicted its own ratified input**
- **Found during:** Task 1 (reading 162-04-SUMMARY.md) and Task 4
- **Issue:** The plan prescribes `user_can ('entity', id, 'entity.read_answers')` as the SELECT policies' entity disjunct and asserts the predicate is the same under every Q2 answer. Under the recorded Q2 = (D) that call answers false for a parent organization, so window 267 — this plan's headline obligation — would have stayed open behind a correct-looking predicate.
- **Fix:** the reach is spelled `user_can ('entity', id, 'nomination.read')`, whose named branch 2 is `is_child_nominee`. Both disjuncts are kept: the own-row read and the parent reach are two rules that happen to nest today, and pruning the redundant one would make correctness depend on a derived property of the matrix.
- **Files:** `302-rls.sql`, `05-organization-admin.test.sql`
- **Commit:** `32af62289` — confirmed by the operator

**2. [Rule 3 - Blocking] Six inherited assertions pinned to the pre-conversion shape**
- **Found during:** Task 1 and Task 4, measured by applying the whole conversion to a live database and re-running the estate
- **Issue:** exactly six assertions redden under the ratified scope. One of them (`16-anon-visibility`:46) sits behind a hard prohibition. The executor **halted and reported** rather than choosing; the operator lifted the prohibition for that assertion alone.
- **Fix:** all six re-pointed at the end state, each strengthened or equal — see the table above. No assertion deleted, no behavioural assertion touched.
- **Commit:** `32af62289`

**3. [Rule 1 - Bug] This plan's own deny half was not measuring the UPDATE policy**
- **Found during:** Task 4's negative control
- **Issue:** section 6's four UPDATE denials stayed green against a row-unbound `USING (true)`, because the SELECT policy hides the sibling rows and produces the zero regardless of the UPDATE predicate.
- **Fix:** section 6b re-asks the deny half against anon-visible siblings; all four then redden under the same control.
- **Commit:** `32af62289`

**4. [Rule 3 - Blocking] Two defective verify instruments in the plan's own text**
- `grep -o 'can_access_project'` / `grep -o 'has_role'` double-count, because `pg_get_expr` emits an `AS <fnname>` alias per call. Repaired to match `can_access_project(` / `has_role(`; both then reproduce the plan's expected figures.
- The Task 1 and Task 5 timing blocks ran as `postgres` — a superuser, so **RLS is bypassed entirely** — against a table holding one row, and Task 1 never wrote the `anon_before_ms` value Task 5 reads. The ratio could not have moved and the gate could not have passed. Replaced with `bench.sql`: a deterministic 400-row fixture, `SET LOCAL ROLE`, min of 3 runs, rolled back.

**5. [Rule 2 - Missing] The comment-hygiene guard (D-A4) rejected 344 wrapped comment lines**
- Fixed by running the sanctioned phase-152 instrument `unwrap-comment-paragraphs.mjs --apply`, not by hand, so this plan's joins and the sweep that took the tree to zero share one predicate. The migration was regenerated from the joined sources rather than edited, so the parity guard still holds.
- **Commit:** `2f8d4ec42`

### Scope deviations, recorded rather than absorbed

- **The new test file is `18-entity-policies.test.sql`, not `19-`.** The plan's `files_modified` names 19; its own derivation rule is "the lowest free two-digit prefix", which is 18. The rule won.
- **Three files declared in `files_modified` are UNCHANGED** — `01-tenant-isolation`, `02-candidate-self-edit`, `09-column-restrictions` — because `set_test_user` has emitted the grants claim since 162-06 and there was nothing additive to do. Editing them to satisfy a file list would have been churn.
- **Three files NOT in `files_modified` are changed** — `13-shim-parity`, `15-visibility-flags`, `16-anon-visibility` — each carrying one inherited pin that the ratified scope necessarily invalidates.
- **`admin_*` is still a misnomer and is still not renamed.** Under D-07 a ProjectEditor holds `project.edit_entities`, so twelve policies named for an administrator are gated on a permission an editor holds. The actor segment now reads as "the project-scope actor". Renaming cuts across the identical names 162-09, 162-11 and 162-12 carry on their own tables, so it is a phase-wide convention question. Flagged, not absorbed — and `18-entity-policies.test.sql` asserts the editor half of that pair directly.

## Open items this plan names rather than silently accepts

- **§ 3.4's "basic data only, not answers unless public" is still not expressible by a row-level policy.** `answers` is a JSONB column on the entity row and RLS is row-level, so a parent organization reading its child candidate's row through the restored `nomination.read` reach reads that child's answers as a side effect. `303-column-grants.sql` carries no SELECT grants at all. **This is 162-13's**, and it is now live rather than hypothetical, because the reach it depends on landed in this commit.
- **The read-cost regression** — see above. The operator's call.

## Gate chain

| Gate | Result |
| --- | --- |
| `yarn typecheck` | **exit 0** (23 tasks) |
| `yarn lint:check` | **exit 0** (includes `assert:schema-migration-parity` and the comment-hygiene guard at 0 violations) |
| `yarn test:unit` | **exit 0** — 784 dev-seed, 1639 frontend, 244 data, 30 argument-condensation |
| `yarn workspace @openvaa/supabase test:db` | **exit 0** — 20 files, **853** assertions |
| `yarn db:lint:sql` | **exit 0** — 0 errors, 2 pre-existing join-table FK warnings |
| `apps/supabase/supabase/migrations/` | **1 `.sql` file** |
| `package.json` dependency lines moved | **0** |
| Prohibited paths touched | **none** — `packages/dev-seed`, `seed.sql`, `tests/`, `.claude/skills`, `400-storage.sql`, `300-auth-tables.sql` all clean |
| **Full E2E suite** | **exit 0 — 155 passed / 0 failed / 0 did-not-run**, 10.7m |

**E2E: `155 passed / 0 failed / 0 did-not-run`**, run directory `tests/e2e-runs/162-10-entity-policies`, via the documented wrapper (`tests/scripts/e2e-run.sh --run-dir … --no-db-reset`), which starts Supabase and one fresh dev server scoped to the project the suite seeds. Disk headroom checked first: 74 GiB free, well above the 20 GiB floor an ENOSPC would void a run at. `flaky` count 0; no assertion was retried to green and none is annotated.

**Coverage this plan does and does not have.** Task 1 derived the E2E population for the authenticated entity read by a stated rule — a spec that establishes an authenticated session and afterwards navigates outside `/candidate` — and it is **2**: `perm/perm-not-located-2e2cg.spec.ts` and `voter/cold-entry-dataroot.spec.ts`. So the authenticated public disjunct, the term D-11b rewrote, is exercised end-to-end by two specs and is otherwise covered by pgTAP only. A first, looser derivation (any `login` token) returned 3 and included `perm-access-disable.spec.ts`, whose only `login` hits are comments and a testId; discarded for the tighter rule. The figure is stated rather than implied.

The four fenced files and `400-storage.sql` were **byte-identical to the plan base** throughout and green; `16-anon-visibility.test.sql` differs in exactly two hunks, both belonging to assertion 46 and its comment block, which is the single assertion the operator released.

## Handoffs

- **162-13** inherits the `factions` and `alliances` `REVOKE UPDATE` / `GRANT UPDATE (...)` pairs written here as the starting point for its column-grants reduction — 7 of 17 and 7 of 16 columns, `confirmed` deliberately outside both allow-lists, which is the bar P-5 retires. It also inherits the answers-column gap named above, now live.
- **162-14** inherits the entity-type-as-argument shape for the storage policies: `user_can ('entity', <id from segment 3>, ...)` and `entity_is_anon_visible (<type from segment 2>, ...)`, with the type as an argument and never as a policy name. D-21's normalised-identity assertion in `18-entity-policies.test.sql` is the instrument that shape is checked by.
- **162-17** inherits the stale inventory. `.claude/skills/database/rls-policy-map.md`, `SKILL.md` and `schema-reference.md` name `candidate_update_own`, `organization_update_own_organizations` and `is_candidate_self`, and all three went stale on this commit. Deliberately **not** swept here — every plan from 162-09 to 162-16 rewrites more of the same inventory — and recorded so it is inherited rather than rediscovered. A skill document is swept by no test, so a stale one survives every gate and then teaches the next agent the retired rule.

## Known Stubs

None. No placeholder values, no unwired components, no `TODO`/`FIXME` introduced.

## Threat Flags

None. This plan adds no network endpoint, no file access pattern and no schema change at a trust boundary. The two new write paths (`factions`, `alliances`) were surfaced by the plan's own threat register as T-162-10-04 and are mitigated exactly as it specifies: the column bound lands in the same commit and is asserted as a number in both directions.

## Self-Check: PASSED

Files asserted to exist, checked on disk: `18-entity-policies.test.sql`, `301-auth-functions.sql`, `302-rls.sql`, `303-column-grants.sql`, this SUMMARY — all **FOUND**.

Commits asserted to exist, checked with `git log`: `a45d767b4`, `32af62289`, `768c25def`, `2f8d4ec42` — all **FOUND**.

`commits: 5` is MEASURED — `git rev-list --count a4a417d95..HEAD` returned **4** before this documentation commit, which is the fifth. `plan_head_before` is recorded in the frontmatter so the count can be re-derived with the same instrument.

## Commits

| Hash | Task | Subject |
| --- | --- | --- |
| `a45d767b4` | 3 | `feat(162-10)` the tracer — the candidate self-access rule, folded into `user_can` |
| `32af62289` | 4 | `feat(162-10)` the entity tier — twenty predicates, one public-visibility composition, and window 267 closed |
| `768c25def` | 5 | `test(162-10)` move the structural properties into the estate, and record the read-cost gate as FAILED |
| `2f8d4ec42` | 6 | `style(162-10)` join wrapped comment lines in the nine edited SQL files (D-A4) |
