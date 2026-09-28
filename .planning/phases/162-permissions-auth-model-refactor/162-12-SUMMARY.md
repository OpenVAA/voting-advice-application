---
phase: 162-permissions-auth-model-refactor
plan: 12
subsystem: supabase-rls
status: complete
tags: [rls, permissions, user_can, nominations, uniqueness-key, column-grants, pgtap]
requires:
  - '162-04 public.user_can(scope, target_id, permission) and public.is_child_nominee(entity_type, uuid, uuid)'
  - '162-04 task 2 Q2 = (D): is_child_nominee gates nomination.read, NOT entity.read_answers'
  - '162-07 projects.lock_nominations, shipped inert; this plan is its first and only reader'
  - '162-07b factions.organization_id NOT NULL, which makes § 11.8 expressible'
  - '162-08 project_open_for_voters, entity_has_confirmed_nomination, nomination_entities_confirmed'
  - '162-08 the recursion measurement, reproduced here on public.nominations itself'
  - '162-11 the schema/ artefact this plan regenerates after'
provides:
  - 'nominations.confirmed boolean NOT NULL DEFAULT false (D-11c), and every reader flipped with it'
  - 'nominations.created_by uuid DEFAULT auth.uid(), absent from the INSERT grant -- the cap subject and § 8.9 admin queue'
  - 'CONSTRAINT nominations_entity_parent_contest_key UNIQUE NULLS NOT DISTINCT over § 11.7 eight columns'
  - 'parent_nomination_id ON DELETE NO ACTION (task 2 Q2 = A), refusing at end of statement'
  - 'public.enforce_nomination_confirmation() -- edit-unconfirms, admin-only confirm, the requested-parent guard, the cap message'
  - 'public.project_nominations_locked / nomination_exists_in_contest / caller_nominated_in_contest / caller_unconfirmed_originated_count'
  - 'validate_nomination() hardened to SECURITY DEFINER SET search_path, plus § 11.8 the-organization rule'
  - 'eight policies on public.nominations, five converted and three new'
  - 'the first INSERT and UPDATE column grants public.nominations has ever carried'
  - 'apps/supabase/supabase/tests/database/23-nominations-write.test.sql, 40 assertions'
  - 'ZERO can_access_project references in any policy in public -- the shim now has no policy callers'
affects:
  - '162-13 (the column-grants file gained a FIFTH table block, not a third; and it should take pgTAP ordinal 19, not 18)'
  - '162-15 (can_access_project has zero policy callers; its deletion is no longer policy-blocked)'
  - '162-16 (published is already absent from every policy on nominations -- discharged)'
  - '162-17 (the eight-column key asserted by name in both directions; the requested-parent guard established)'
  - '§ 6.2 downstream phase (guard 5 ships as its second clause; the flow is own -> parent -> repoint)'
tech-stack:
  added: []
  patterns:
    - 'entity-scope predicate = user_can(entity, COALESCE(candidate_id, organization_id, faction_id, alliance_id), <verb>)'
    - 'row-state conjunct = NOT project_nominations_locked(project_id), never a matrix member'
    - 'public-visibility disjunct = project_open_for_voters(project_id) AND confirmed AND nomination_entities_confirmed(id), assembled per D-36'
    - 'guard = a hardened helper call, never an inline sub-select, on a table whose own policy guards it'
    - 'negative control count = PLAN - PASSED, never grep -c "not ok"'
key-files:
  created:
    - apps/supabase/supabase/tests/database/23-nominations-write.test.sql
  modified:
    - apps/supabase/supabase/schema/104-nominations.sql
    - apps/supabase/supabase/schema/011-validation-functions.sql
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/schema/302-rls.sql
    - apps/supabase/supabase/schema/303-column-grants.sql
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/00-helpers.test.sql
    - apps/supabase/supabase/tests/database/03-anon-read.test.sql
    - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
    - apps/supabase/supabase/tests/database/08-triggers.test.sql
    - apps/supabase/supabase/tests/database/11-question-rpcs.test.sql
    - apps/supabase/supabase/tests/database/12-user-can.test.sql
    - apps/supabase/supabase/tests/database/16-anon-visibility.test.sql
    - apps/supabase/supabase/tests/database/17-project-structure-authority.test.sql
    - packages/dev-seed/src/supabaseAdminClient.ts
    - packages/dev-seed/src/template/permittedKeys.ts
    - packages/supabase-types/src/database.ts
    - .claude/skills/database/schema-reference.md
decisions:
  - 'Q1 = A, cap = 10 (N-1): an originator column defaulting to the calling user and absent from the insert grant'
  - 'Q2 = A (N-2): ON DELETE NO ACTION -- refuse at END OF STATEMENT, not immediately'
  - 'Q3 (N-3): guard 5 ships as its SECOND CLAUSE only; § 6.2 inherits the own -> parent -> repoint flow'
  - 'Q4 (N-4): both non-renames approved -- the RPC parameter and the custom-data JSONB key keep the retired word'
  - 'OPERATOR RULING 2026-09-17: scope widened to six extra test files; the NULL-safe assertion TRANSFORMED rather than deleted'
  - 'MEASURED CORRECTION: the project-agreement conjunct binds the COALESCED entity, not organization_id -- it was masking guard 1'
metrics:
  duration: ~4h
  completed: 2026-09-17
actuals:
  tokens: 96000
  tasks: 7
  commits: 6
plan_head_before: 7fe8682a65c57721105a6f10d0f3b735cabb5fef
---

# Phase 162 Plan 12: The Nominations Tier Summary

Nominations gained a write model — an entity user creates and edits their own, a child nominee originates the unconfirmed parent it needs under five guards each proven load-bearing by removal, and an administrator is the only party that can confirm anything — plus the operator's eight-column uniqueness key in the form that actually enforces it.

## The numbers this plan measured

Every figure below is measured. Where the plan predicted a different one, both are stated.

### Measurement 1 — would-be duplicates against the eight-column key

| | Value |
|---|---|
| nomination rows examined (seed half) | **438** (`db:reset-with-data` + `db:seed --template e2e/base`) |
| would-be-duplicate groups, seed half | **0** — and the real constraint applied cleanly to all 438 |
| pgTAP files inserting nominations | **6** (M1 and the plan's grep both found 4; `12-user-can` and `16-anon-visibility` put the table name on the following line) |
| colliding pairs, pgTAP half | **3** — `08-triggers:170`, `12-user-can:118`, `16-anon-visibility` rows a1/a9 |

**M1's uncovered half was not clean, and that is what halted Task 1.** Two of the three collisions were 162-08's doing: it added `nomination_faction_a` / `nomination_alliance_a` to the shared fixture at contests where those files already created their own rows locally. They had been duplicates ever since, invisibly, because nothing forbade it.

**The negative control, obtained at Task 1 rather than Task 4.** Same database, same estate: written as a plain `UNIQUE`, the estate passes **923** assertions and the key catches nothing; written `UNIQUE NULLS NOT DISTINCT`, it goes to **802** and catches all three pairs. Every pair carries at least one NULL, so the default form never compares them. The two forms are not interchangeable on this table — measured, not argued.

### The four ratified answers

- **Q1 = A, cap = `10`.** `created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid()`. Two properties make the cap a cap: it **defaults to the calling user**, and it is **absent from the INSERT column grant**, so a caller naming it is refused at privilege level before any policy is consulted. Nullable, because the service-role and owner paths have no calling user. Ten was offered with a blank to overrule and the blank came back empty.
- **Q2 = A — refuse at end of statement.** `confdeltype` `c` → **`a`** (`ON DELETE NO ACTION`). The measurement that decided it is below.
- **Q3 — guard 5's second clause only.** A row-level `WITH CHECK` sees only the row being inserted, so the same-transaction clause is inexpressible; insertion order makes it moot. Flow: **own nomination with no parent → the parent → repoint.** § 6.2's interface inherits this.
- **Q4 — both non-renames approved.** `p_include_unconfirmed` keeps its name (signature unchanged and verified: `uuid, uuid, uuid, boolean, integer`). The shared-package JSONB key `CustomData.Nomination.unconfirmed` keeps its name, and its **measured reader count is 0** — nothing imports or reads it; the candidate profile page's `unconfirmed` is a local display field computed from a try/catch.

### The delete action does NOT break `bulk_delete` teardown

`bulk_delete` (`501-bulk-operations.sql:354`) puts `nominations` **first** in `delete_order` and removes a collection with **one statement per table**. Under `ON DELETE NO ACTION`, measured on the applied database:

1. **Targeted delete of a parent that still has children → REFUSED**
   `ERROR: update or delete on table "nominations" violates foreign key constraint "nominations_parent_nomination_id_fkey" … Key (id)=(5a802d5c-…) is still referenced from table "nominations".`
2. **Delete of the owning project → SUCCEEDS**, 61 nominations → 0, whole subtree in one statement.
3. **The literal `bulk_delete` shape** `DELETE FROM public.nominations WHERE project_id = $1` → **DELETE 61**, 0 left.
4. **The real teardown, end to end: `yarn db:seed:teardown` → exit 0**, *"Teardown complete: 751 rows deleted, 327 storage objects removed. Prefix: seed_"*, nominations **438 → 61**, **no foreign-key error of any kind**.

Option (B) `RESTRICT` would have broken case 3 and therefore case 4. Option (C), the current cascade, is the one § 11.5 fact 35 forbids.

### The retired column

| | Value |
|---|---|
| before, whole tracked tree | **94 lines in 27 files** (M3 predicted 25 in 17 — stale by three plans, measured at `df719df28`) |
| after, column references in `schema/` + `tests/database/` + `dev-seed/src/` | **0** |
| null-coalescing wrappers around the confirmation column in `schema/` | **0** |
| `entity_has_confirmed_nomination` call sites carrying a wrapper | **1**, not the three 162-08 predicted |

Description strings naming the word in prose are excluded from the target per the operator's ruling: editing prose to hit a census number would change what an assertion says it measures.

### The seeded census, both directions

| | Nominations | Unconfirmed |
|---|---|---|
| **RED control** — creation path unwired | 377 | **377** |
| first seed run | **438** | **0** |
| second seed run (service role) | **438** | **0** |

The RED control is the blanking failure this flip's direction makes possible: every seeded nomination invisible to the voter application. One line in `SupabaseAdminClient.bulkImport` closes it, and no template file was edited.

### All thirteen negative controls

Every count is **`PLAN − PASSED`** against the 40-assertion file.

| Control | Reddened |
|---|---|
| guard 1 removed | **1** |
| guard 2 removed | **1** |
| guard 3 removed | **1** |
| guard 4 removed | **2** |
| guard 5 removed | **4** |
| constraint in the default null form | **3** |
| parent column dropped from the key | **1** |
| validator left unhardened | **1** |
| trigger rule 2 disabled | **2** |
| flag forced off unconditionally | **7** |
| read: public disjunct removed | **1** |
| read: entity disjunct removed | **38** |
| read: predicate replaced by `true` | **3** |

### Estate, policies and the gate

| | Before | After |
|---|---|---|
| pgTAP assertions | **923** (21 files) | **966** (22 files) |
| policies in `public` | 86 | **89** |
| policies on `public.nominations` | 5 | **8** |
| `can_access_project` references in any policy | 1 | **0** |
| migrations directory | 1 `.sql` | **1 `.sql`**, parity green |

**E2E: 155 passed, 0 failed, 0 did-not-run**, wrapper exit 0, preflight successes 1 / failures 0. Run directory `tests/e2e-runs/162-12-wave4`. Disk: 60 GiB free before the run.

`yarn typecheck`, `yarn lint:check`, `yarn test:unit`, `yarn workspace @openvaa/supabase test:db` and `yarn db:lint:sql` all exit **0**.

### The inherited option letter

**162-04 task 2 Q2 = (D)**: `is_child_nominee` gates **`nomination.read`**, for any entity grant, and **not** `entity.read_answers`. This plan consumes it through `user_can` rather than by calling the function in a policy, so ROADMAP criterion 3's *used wherever policy allows that control* is satisfied by the call chain policy → `user_can` → `is_child_nominee`. 162-17 should assert the same reading rather than deriving a fresh one.

## What was built

**The column.** `unconfirmed boolean DEFAULT false` → `confirmed boolean NOT NULL DEFAULT false`. The default is what makes § 11.5 guard 2 true for a caller who cannot name the column; `NOT NULL` is what makes the null-coalescing wrapper removable, so the plan asserts its absence rather than its correctness.

**The eight-column key**, named, with `NULLS NOT DISTINCT` asserted from `pg_index.indnullsnotdistinct` and the PostgreSQL-15 floor stated in its comment. Three pairs: a genuine duplicate rejected naming the constraint, the same candidate under two different parents accepted, and two null-parent duplicates rejected.

**The delete action**, ruled and asserted behaviourally in both directions.

**The faction-parent rule** (§ 11.8), with the exception naming both organizations per D-23, and `validate_nomination()` hardened — a consequence of the capability this plan adds, not a pre-existing defect. Measured first: an entity-user parent lookup returns **0 rows**.

**Eight policies**, five converted and three new. The authenticated read is three disjuncts; the per-row publication term is replaced, not deleted.

**The first column grants this table has ever carried.** INSERT: exactly ten columns, excluding the confirmation flag and the originator. UPDATE: exactly six, including the flag. The asymmetry is the design.

**The cap**, enforced as a policy conjunct and raised by name in the trigger, because a row-level-security refusal names the policy and never the number.

## Deviations from plan

### Operator ruling 2026-09-17 — the Task 1 halt

Task 1 halted exactly as its own text specified. Three measured contradictions between ratified answers and hard plan prohibitions; the operator ruled **(A)** — keep the ratified thing, transform the blocking assertion into something strictly stronger.

**1. [Ruling] Declared scope widened by six test files.** Authorised: `03-anon-read`, `05-organization-admin`, `12-user-can`, `16-anon-visibility`. Added under the ruling's "no further stops for this class": `11-question-rpcs` and `17-project-structure-authority`. `05-organization-admin` was authorised but **not edited** — its only occurrence is a description string, which the ruling says not to touch.

**2. [Ruling] Three fixture collisions re-expressed, never deleted.** `08-triggers` and `12-user-can` now reuse the shared fixture's row instead of creating a duplicate; `16-anon-visibility`'s row a9 moved to `election_round = 2`. Its deliberate purpose survives the move — the round is read by no anon predicate, so a9 still differs from a1 in the confirmation flag alone, and the denial is still un-over-determined. **Cause attributed:** 162-08 introduced two of the three.

**3. [Ruling] The NULL-safe assertion transformed, not deleted.** `16-anon-visibility:555` asserted that the predicate tolerated a NULL that *could* occur. `NOT NULL` makes that unstatable. It is replaced by `col_not_null`, proving the NULL can no longer occur **at all** — strictly stronger. Row a7 was kept, re-expressed as `confirmed = true`. The file's plan went **51 → 52**; the estate total did not drop.

### Rule 1 — bugs found and fixed

**4. [Rule 1 — Bug] The project-agreement conjunct was masking guard 1.** Removing guard 1 reddened **zero** assertions. Cause: the conjunct was written against `organization_id` alone, so for any non-organization row `entity_project_id(NULL)` is NULL, `NULL = project_id` is NULL, and the policy refused *there* — guard 1 never fired. It now binds the **coalesced** entity, which is what it should always have said; it admits exactly the same rows, and guard 1 reddens 1. **This is the defect the removal sweep exists to find, and it found it.**

**5. [Rule 1 — Bug] My own control counter was unfalsifiable.** It counted `not ok` lines. A variant that makes the file **die** mid-run emits none, so it scored the entity-disjunct variant as **0** — indistinguishable from "changed nothing" — while that variant actually broke **38 of 40** assertions. Every control count in this plan is now `PLAN − PASSED`, and all thirteen were re-measured on that instrument.

**6. [Rule 1 — Bug] The entity read disjunct is load-bearing far beyond reading.** Discovered by control 5's repair: the confirmation trigger turns the flag off on an entity user's edit, and PostgreSQL then requires the NEW row to satisfy the SELECT policy — so without that disjunct an entity user cannot edit their own nomination **at all**.

**7. [Rule 3 — Blocking] 162-09's non-vacuity tripwire expired because this phase succeeded.** `17-project-structure-authority:1905` proved its scoped scan non-vacuous by asserting `can_access_project` **still stood** somewhere in `public`. This plan's read conversion removed the last one, measured at zero. Re-expressed against a control that cannot expire — the scanned population itself is non-empty (31 policies). The description string keeps its claim.

**8. [Rule 3 — Blocking] Two fixtures got confirmation for free from a default that meant the opposite.** `07-rpc-security` §9 and `11-question-rpcs`'s round-2 nomination now name the column. No description string changed.

### Plan defects found and repaired in place (D-34)

**9. M1's uncovered half** — see measurement 1. **10. M3 stale by three plans** — 94/27, not 25/17. **11. M4/Artifacts** — `303-column-grants.sql` already carried **four** blocks after 162-10, so nominations is the **fifth**, not the third. **12. "Seven policies"** — the plan's own Artifacts table enumerates **eight**; three gates corrected. **13. Ordinal instruction** — "lowest free two-digit prefix" (19) contradicts the ratified registry (23); the registry wins.

**14. Six verify instruments repaired:**
- Task 1 v1 defined a shell function after `&&` — would not parse at all.
- Task 1 v2's `grep -rlI 'INSERT INTO nominations'` found 4 of 6 files and passed vacuously at `-ge 2`, missing exactly the two carrying collisions.
- Task 6 v2's `grep -c '^ok \|^not ok '` returns 0 on a passing estate, making `test "$NOW" -ge "$WAS"` a `0 ≥ 0` tautology. Now the `Files=N, Tests=M` summary line.
- Task 3 v2's comment-stripped census also counted description strings, so its target of 0 was unreachable.
- Task 3's stub floor of 3 was unreachable: exactly **2** assertions are scoped to rule 2, so 2 is the complete population. Measured down.
- Task 5's D-21 gate demanded **zero** entity-type literals in any policy; `entity_insert_parent_nominations` must carry `'organization'` because § 11.5 guard 1 is organization-specific in the operator's own words, and it is the **argument** to a type-parameterised helper — D-21's compliant shape. Exempted by name.
- Task 6's gate demanded a literal `user_can` in every authenticated policy; the parent policy asks its authority question one hop out through `caller_nominated_in_contest`, which is the design's own instruction.

**15. [Task ordering] Test D1 moved from Task 4 to Task 5.** It needs an entity user to INSERT, and no entity INSERT policy exists until Task 5. Unstatable in Task 4; moved rather than dropped, along with its unhardened-validator control.

**16. [Task ordering] Section 9 of the new test file runs last.** Its project-delete assertion destroys project B, which the read-model section reads across.

**17. [Task ordering] The cap fixture is created last.** The cap is a BEFORE INSERT trigger, so it runs ahead of the row-level check: a caller already at the cap is refused by the cap before any guard is consulted. Creating those rows earlier made every guard assertion measure the cap instead of its guard — observed as `P0001` where `42501` was wanted.

**18. [Style] 354 comment-hygiene junctions**, all introduced by this plan's prose. Joined by a codemod driven by the guard's **own output** rather than a re-derivation of its predicate, so the two cannot disagree. Converged in one pass.

## Known limitations

- **`nominations.created_by` is a foreign key without an index** — a new `db:lint:sql` advisory **warning** (exit code still 0; two identical warnings predate this plan). No index was added: the plan forbids choosing one from a predicate's shape rather than from a measured plan, and no production-scale plan exists. Handed on with the reason rather than guessed at.
- **G2-alt is asserted structurally, not behaviourally.** While the column grant stands, an `authenticated` caller cannot reach the policy's unconfirmed conjunct at all — the privilege refuses first — so there is no behavioural difference to observe. Dropping the grant to observe one would assert against a schema this plan does not ship.
- **The § 11.8 faction rule is exercised by the pgTAP estate and by nothing else.** 162-07b measured that no seed template and no E2E fixture emits a faction row at all. A green E2E suite says nothing about it. Stated in the fixture comment so it is not misread.

## Handoffs

- **To 162-13 (obligation).** This plan added the **fifth** table block to `303-column-grants.sql` — not the third, as the plan text says. Do not disturb it: the INSERT/UPDATE asymmetry on `confirmed` is load-bearing and the absence of `created_by` from both lists is what makes the cap unforgeable. **Also take pgTAP ordinal `19`, not `18`:** the ratified registry assigns `19-entity-policies` to 162-10, but 162-10 shipped `18-entity-policies.test.sql`, so the registry's `18-entity-immutability` would collide. On-disk ordinals are now 00–18, 21, 22, 23.
- **To 162-15 (unblocked).** `can_access_project` now has **zero policy callers anywhere in `public`**, measured. Its deletion is no longer blocked by any policy on any table.
- **To 162-16 (discharged).** The per-row publication term is already absent from every policy on `nominations`. That plan removes ten columns and ten partial indexes here and touches no policy.
- **To 162-17.** The eight-column key is asserted **by name and in both directions** already; widen the population rather than establishing the property. The requested-parent confirmation guard is implemented and asserted; add the admin-queue behaviour around it. Assert 162-04 Q2's option **(D)** rather than re-deriving it. `.claude/skills/database/rls-policy-map.md` still needs its sweep.
- **To § 6.2's downstream phase.** Guard 5 ships as its second clause. The candidate flow is **own nomination with no parent → the parent → repoint**, and it is legal today because `validate_nomination()` already admits a parentless candidate nomination.
- **Still open, and not any named plan's.** A general constraint requiring a nomination's linked entity to share the nomination's project. It is a conjunct of the new entity-user policies only, because `07-rpc-security.test.sql` §9 creates exactly that row on purpose as a negative control. The general case needs a plan that can also re-express that control.

## Self-Check: PASSED

All twenty files in `key-files` exist on disk. All six commits resolve:
`f35d2fc80`, `5434c6ff8`, `7560bb9ad`, `364011284`, `70bbfeb82`, `1c72ff0b6`.
`git rev-list --count 7fe8682a6..HEAD` = **6**, matching the recorded `commits`.
Scope diff against the base SHA lists only declared paths plus `.planning/`; zero template files changed; one migration file; no manifest dependency line moved.
