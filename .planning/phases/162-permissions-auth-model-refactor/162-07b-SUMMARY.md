---
phase: 162-permissions-auth-model-refactor
plan: 07b
subsystem: database
tags: [schema, rls, rpc-contract, dev-seed, types, res-7]
status: complete
requires:
  - '162-01: 162-SPEC.md, the normative reference'
  - '162-02b: one migration only; edit schema/ and regenerate, never hand-edit 00001'
  - '162-06: the grants claim and the (scope, role) shape pairs'
  - '162-07: the two project visibility flags, the confirmation column, nomination_shape'
provides:
  - 'public.factions.organization_id — uuid NOT NULL REFERENCES public.organizations ON DELETE CASCADE. 162-12 reads it when it tightens validate_nomination() from *an* organization nomination to *the* faction own organization nomination.'
  - 'get_nominations at 31 output columns and get_candidate_user_data at 14 — both published contracts, one column shorter.'
  - 'RES-7 / T-144-11 closed at its cause, with a standing assertion that reddens on a future duplicate of ANY property name.'
  - 'A two-plan visibility window that 162-10 inherits — see the section of that name below.'
affects:
  - '162-10: owns the restoration of the organization read of its own candidates, through the nomination hierarchy.'
  - '162-12: its faction-parent rule depends on the column this plan ships.'
tech-stack:
  added: []
  patterns:
    - 'A column declared in its CREATE TABLE body, never appended as an ALTER (section 11.4, D-14).'
    - 'A must-not-fire companion assertion, green before AND after, for the adjacency of two identically-named columns in one return shape.'
    - 'Reclassification from RELATIONSHIP_REFS to COLLECTION_NON_COLUMN_LIST — permitted on the row, stripped before the write — for a template key whose only surviving reader is in memory.'
    - 'A standing duplicate-property guard asserted as key-count equals distinct-value-count, naming every offender, so it reddens on the NEXT collision rather than only on this one.'
key-files:
  created:
    - apps/supabase/supabase/tests/database/21-entity-organization.test.sql
  modified:
    - apps/supabase/supabase/schema/102-entities.sql
    - apps/supabase/supabase/schema/200-indexes.sql
    - apps/supabase/supabase/schema/302-rls.sql
    - apps/supabase/supabase/schema/303-column-grants.sql
    - apps/supabase/supabase/schema/501-bulk-operations.sql
    - apps/supabase/supabase/schema/502-email-helpers.sql
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/column-map.ts
    - packages/supabase-types/src/database.overrides.ts
    - packages/supabase-types/src/database.ts
    - packages/supabase-types/RPC-NULLABILITY.md
    - packages/dev-seed/src/template/permittedKeys.ts
    - packages/dev-seed/src/generators/FactionsGenerator.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
    - apps/supabase/supabase/functions/invite-candidate/index.ts
decisions:
  - 'Q1 = A. The live candidates SELECT disjunct is removed now; 162-10 restores the reach through the nomination hierarchy. Fail-closed.'
  - 'Q2 = A. The UI branch AND its orphan translation key deleted in both catalogue trees. No residue.'
  - 'Q3 = reclassify approved. The candidates organization template key survives as an emitter-only field.'
metrics:
  duration: one session
  completed: 2026-09-17
actuals:
  tokens: 40663
  tasks: 6
  commits: 9
plan_head_before: 8228868e62c7df31fbb2e61620d63794e3cfd5d2
---

# Phase 162 Plan 07b: Move `organization_id` off `candidates` and onto `factions` — Summary

The candidate-to-organization association is now stated **once**, on the `parent_nomination_id` edge,
and the column that stated it a second time is gone from the declarative schema, the applied database,
two RPC contracts, the seed pipeline, the generated types, the adapter and an Edge Function — closing
RES-7 at its cause as a by-product, because that collision's sole cause was two tables carrying a
column of the same name.

---

## ⚠ THE TWO-PLAN VISIBILITY WINDOW THIS PLAN OPENED — 162-10 INHERITS IT

**Stated first because nothing else in this repository will tell 162-10 about it.**

Under Task 2's ratified **Q1 = A**, `authenticated_select_candidates` lost the disjunct
`has_role ('organization', 'organization', organization_id)` along with the column it read. Until
162-10 converts that policy to `user_can` and restores the reach **through the nomination hierarchy**:

> **An organization-role user cannot see an unconfirmed candidate of its own organization.**

Three things about this window, each measured rather than argued:

1. **It is fail-closed.** The policy went from four disjuncts to three. Nothing became visible that was
   not visible before. Read back from `pg_policies.qual`, the surviving three are `can_access_project`,
   the `auth_user_id` self comparison and `published = true`.
2. **It cost nothing that was under test, and that is exactly why it is dangerous.** M8 predicted that
   the two assertions in § 5 of `05-organization-admin.test.sql` which *appear* to cover this reach were
   passing through the policy's **published** term instead. Confirmed: both fixture candidates are
   `published = true`, and that disjunct admits any published row to any authenticated caller. **No test
   reported this window opening, and no pre-existing test will report it closing.**
3. **So the assertion that makes it observable had to be CONSTRUCTED.** Test A, added to
   `05-organization-admin.test.sql`, inserts an unpublished candidate into the organization's own project
   and asserts it is invisible. Measured against the base SHA it reddened with **`have: 1  want: 0`** —
   the organization user *could* see it. That `1` becoming `0` **is** the window, expressed as a number.

`302-rls.sql` carries a note beside the policy naming 162-10 and saying through what the reach returns.
162-10 already depends on this plan, so the gap is ordered rather than open-ended — but it owes the
restoration on the strength of this record alone.

---

## Measurement 2 — faction-emitting rows, by source

Taken before the `NOT NULL` column was written, and it decided the fixture work rather than being
anticipated.

| Source | Rows | Supplied an organization before? |
|---|---|---|
| `apps/supabase/supabase/seed.sql` | **0** | n/a — the file contains no occurrence of `faction` at all |
| Built-in dev-seed templates (`packages/dev-seed/src/templates/`) | **0** | n/a — no template declares a `factions` fragment |
| `FactionsGenerator` synthetic path | **N per template, 0 by default** | **NO** — the defect the NOT NULL exposed rather than created |
| dev-seed test corpus | **5 row-constructing sites** | NO |
| E2E suite (`tests/`) | **0** | n/a — one prose mention in a doc comment, zero fixtures |
| `create_test_data()` (`00-helpers.test.sql`) | **2** | **NO** — both fixed in this plan |

**⚠ The census as the plan scoped it was INCOMPLETE, and the gap was found by the NOT NULL rather than
by the instrument.** Task 1's measurement counted faction rows in `create_test_data()` and nowhere else
in the pgTAP estate. Measured after the column landed: **three** pgTAP files emit faction rows, not one.
`15-visibility-flags.test.sql` inserts a bare confirmation probe naming no organization and failed with
`null value in column "organization_id" of relation "factions" violates not-null constraint`, taking its
whole file down to 8 of 30 assertions. `03-anon-read.test.sql` carries a second faction insert that
survived only because the privilege denial fires before the constraint. Both are fixed here and both are
reported by name; `15-visibility-flags.test.sql` was added to `files_modified`.

**Nothing else needed fixing, because measurement 2's three zeros were real.** No shipped template
became unseedable, `yarn db:reset` seeds cleanly, and no E2E fixture was touched.

---

## Measurement 3 — consumers of the two dropped RPC output columns

| Column | Production readers | Test fixtures | Named production reader |
|---|---|---|---|
| `get_nominations.entity_organization_id` | **1** | 2 | `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:446` |
| `get_candidate_user_data.organization_id` | **0** | 3 | — |

The zero is recorded **with its explanation attached**, because a bare zero from a grep proves nothing:
the candidate app reads that row through the generic snake-to-camel mapper at
`supabaseDataWriter.ts:209`, so no source line names the column. The assertion that carries the change
is therefore the output-column count read from `pg_get_function_result`, not a call-site sweep.

---

## The `302-rls.sql` classification — a correction to brief fact 38

Brief fact 38 records `302-rls.sql` as "a comment citing it". Measured across the whole schema tree:
**22 hits — 7 declarations, 12 live predicates or expressions, 3 comments.** For `302-rls.sql` alone:

| Hits | Declarations | **Live predicates** | Comments |
|---|---|---|---|
| 2 | 0 | **1** (`:502`, the `USING` disjunct) | 1 (`:517`, the self-update note) |

**The correction is not cosmetic.** Because that predicate is live, the schema does not apply while it
reads a column that is gone. Measured directly: with the column removed and the policy untouched,
`yarn db:reset` exited 1 with
`ERROR: column "organization_id" does not exist (SQLSTATE 42703)`, quoting the `has_role` line. A plan
written to fact 38's list alone would have produced a tree in which every later gate was unrunnable.

---

## Phase 164's guard — twelve numbers, before and after

| | RPCs | `resolve_email_variables` | `get_nominations` | `get_candidate_user_data` | cast alternation | cast hits | violations |
|---|---|---|---|---|---|---|---|
| **before** | 3 | 4 | 32 | 15 | 32 | 0 | 0 |
| **after** | 3 | 4 | **31** | **14** | **31** | 0 | 0 |

The alternation shrank by **exactly one**, which is the assertion that the correct column left:
`entity_organization_id` went and `organization_id` stayed, because `get_nominations` still returns the
nominations FK of that name.

**Distinct violation classes named in the recorded RED run: 3 of 3** — 6 violations, exactly 2 per
class: two stale derived-region entries, two stale disposition rows, two override keys widening columns
the schema no longer declares. All three artifacts were corrected: `--write` for the derived region, a
hand edit for the two disposition rows and both section heading counts, and the removal of the two
override keys — forced first by two TS2344 errors from the `K extends keyof ReturnsRow<F>` constraint.
**The type error was answered, not silenced**: the diff against the base SHA adds no cast, no
`@ts-expect-error` and no `@ts-ignore`.

---

## `COLUMN_MAP` — RES-7 / T-144-11, closed at its cause

| | keys | distinct values | duplicated |
|---|---|---|---|
| **before** | 40 | 39 | 1 (`organizationId` ×2) |
| **after** | **39** | **39** | **0** |

The todo suggested two routes — give the suffixed key its own camel property, or drop it if the column
is dead. Neither was taken: both treat the symptom. The cause was two tables carrying a column called
`organization_id` with an object literal unable to declare one key twice. With one table left, the
`_nom` suffix retired with the problem it worked around.

**The closure is guarded standing, and proven in both directions.** The new assertion compares key count
with distinct-value count and names every offender in its own failure message:

- observed RED against the real collision → `COLUMN_MAP maps two or more keys to the same property: organizationId x2`
- observed RED against a deliberately re-duplicated **different** property, then reverted → `... firstName x2`

That second observation is what makes "a future duplicate of ANY property reddens" a measured claim
rather than an asserted one. The test that recorded the collision as deliberately-left-open was
**rewritten into its closed form, not deleted**, and asserts the resulting widening in both directions.

---

## Task 2's three ratified answers

| | Answer | Consequence |
|---|---|---|
| **Q1** | **A** | Remove the disjunct now; 162-10 restores the reach. The window above. |
| **Q2** | **A** | Branch AND orphan key deleted in both catalogue trees. **No residue is named**, because no key is left behind. |
| **Q3** | **reclassify approved** | The `organization` key moved from `RELATIONSHIP_REFS` to `COLLECTION_NON_COLUMN_LIST.candidates`. |

**Q3's forcing evidence, recorded because the failure it prevents is silent.** `pipeline.ts` installs
`latentAnswerEmitter` for *every* template; it reads that key in memory before any write; an unresolved
`findOrganizationIndex` falls back to random emission **with no warning**, for every synthetic
candidate. Deleting the key would have turned every seeded dataset's matching data into noise with every
gate in this repository still green. Test G asserts the pair — present on the generator's row, named in
the const `bulkImport`'s strip loop reads — because the one-sided version would pass against a key
stripped everywhere *including* where the emitter reads it.

---

## Reddened-assertion counts from every recorded negative control

| Control | Reddened | Notes |
|---|---|---|
| Tracer, allow half | **8 of 9** | The ninth is assertion 14, the must-not-fire companion |
| Tracer, deny half | **6 of 6** | |
| Tracer, total | **14 of 15** | `Looks like you failed 14 tests of 15` |
| Task 4 Test A | **1** | `have: 1  want: 0` against the base SHA |
| Task 4 Test B | **1** | the qual named both the role predicate and the column |
| Task 4 Test C, negative half | **1** | `candidate_a2`, unnominated, still emitted `Org A` off the column |
| Task 4 Test C, positive half | **0 — green before AND after** | |
| Task 5, RES-7 standing guard | **1 + 1** | once against the real duplicate, once against a re-duplicated different property |

**Two of these are reported as measured rather than padded**, per D-34 and 162-05's tenth-identity
precedent:

- **Tracer assertion 14 is green in both states, and that is what it is for.** It asserts the
  *nominations* organization FK SURVIVES. The plan's `<behavior>` block lists it in the "MUST be observed
  red" half; it cannot be, because requiring it to redden beforehand would require the nominations key to
  be absent beforehand — inverting the property the companion exists to hold. Reported as **8**, not
  padded to 9 with an assertion that could not fail.
- **Test C's positive half is green before and after.** It is the must-keep-working half: its *source*
  changes (column → parent-nomination hierarchy) while its *value* does not, so it cannot redden first.

---

## pgTAP plan counts, before and after

| File | Before | After | Why |
|---|---|---|---|
| `00-helpers.test.sql` | `no_plan` | `no_plan` | fixtures only — candidates lose the column, both factions gain an organization in their own project |
| `03-anon-read.test.sql` | 59 | 59 | fixture edits only, no assertion count change |
| `05-organization-admin.test.sql` | 14 | **17** | §§ 5–6 rekeyed; Test A, Test B and the scoping companion added |
| `09-column-restrictions.test.sql` | 28 | **27** | one assertion retired — reason below |
| `15-visibility-flags.test.sql` | 30 | 30 | its faction probe now names an organization; no assertion changed |
| `21-entity-organization.test.sql` | — | **18** | new |

**Estate: 16 files / 634 assertions → 17 files / 654 assertions**, `Result: PASS`, with **no
planned-versus-ran line**.

**The one retired assertion, with its recorded reason.** `09-column-restrictions.test.sql` asserted that
a candidate cannot `UPDATE` its own `organization_id`. That column no longer exists, so the statement it
ran now raises `42703` (undefined column) rather than the `42501` (insufficient privilege) it asserted —
it would fail for a reason unrelated to the protection it was written to prove. **This is not a weakened
assertion; it is an assertion whose SUBJECT was removed.** The protection did not lapse: the
column-grant model is an allow-list, so a column that does not exist is outside every grant by
construction. The retirement reason is written inline at the assertion's former site, not only here.

---

## Gate chain and E2E

| Gate | Result |
|---|---|
| `yarn typecheck` | 0 |
| `yarn lint:check` | 0 — **both standing gates observed running INSIDE the chain**: RPC-nullability (3 RPCs, 4/31/14, 31-column alternation, 0 violations) and schema-migration-parity (1 `.sql`, generated copy current) |
| `yarn test:unit` | 0 — dev-seed 784/784, frontend 1639/1639, data 244/244, supabase 100/100 |
| `yarn workspace @openvaa/supabase test:db` | 0 — 17 files, 654 assertions, `Result: PASS` |
| `yarn db:lint:sql` | 0 — 0 errors, 2 pre-existing warnings |
| **Full E2E suite** | **155 passed / 0 failed / 0 did-not-run**, 10.6m |

- Run directory: **`tests/e2e-runs/162-07b-wave3`**
- `playwright exit 0`; `preflight failures 0, successes 1`
- Zero `flaky` and zero `skipped` mentions in the output
- **Disk headroom measured BEFORE the run: 52 GiB** (floor 20). Nothing under `tests/e2e-runs/` was
  deleted.

---

## Scope proof

48 source files changed, **every one of them in `files_modified`**. Zero `packages/data` files. Zero
changes to `011-validation-functions.sql`. Zero `user_can` calls added in code. `migrations/` holds
exactly one `.sql` and no `000NN` sibling. `102-entities.sql` `ALTER TABLE` occurrences: **0 before, 0
after** — the column was declared in the `CREATE TABLE` body, never appended.

**No `published` term was removed from any policy**, asserted three ways rather than by the plan's
unsatisfiable proxy (see deviation 12): zero publication/confirmation/flag **declaration** lines changed
anywhere under `schema/`; `published = true` occurrences in the migration **27 before, 27 after**; and 20
policies on the applied database still name it in their `qual`. The removed code of `302-rls.sql` is
**exactly** the four lines of the `has_role` disjunct and nothing else.

**Two scope findings, both reported by name rather than papered over:**

1. `packages/dev-seed/src/generators/NominationsGenerator.ts` and its test carry comments asserting the
   party-candidate relationship "is in `candidates.organization_id`" — a statement this plan makes false.
   The design table did not name them because the census swept the schema tree and the adapter, not the
   seed generators' prose. Comment-only edits.
2. `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts` is where Test G landed;
   `files_modified` named only `FactionsGenerator.test.ts` among the generator tests.

Both were added to `files_modified` with the reason recorded inline.

---

## 162-07 ran BEFORE this plan, and no regeneration conflict had to be resolved

The flagged assumption warned that 162-07 and this plan share four files and cannot run concurrently.
**They did not.** 162-07 landed at `3990ee1f1` / `8228868e6`, which is this plan's base SHA, so the two
were strictly serialised in the order the assumption requires — 162-07 first.

Consequence, measured on each of the four shared files: **zero conflicts to resolve.**
`102-entities.sql` already carried 162-07's four `confirmed` declarations when this plan edited two of
the same `CREATE TABLE` bodies, and those declarations are untouched in the diff.
`00001_initial_schema.sql`, `packages/supabase-types/src/database.ts` and
`packages/dev-seed/src/template/permittedKeys.ts` were each regenerated or edited on top of 162-07's
state rather than over it. Had the order been reversed, 162-07 would have regenerated over a tree it was
not planned against.

---

## Deviations from Plan

Every executed plan in this phase has found broken gates in its own text; this one found **twelve**, and
each is recorded in a `<gate_repair>` block beside the gate it fixes. Four are gates that **could not
fail**, two are **task-boundary contradictions**, three count a **comment as code**, one is
**unsatisfiable by any correct implementation**, one is a **census scoped too narrowly**, and one is a
coarse gate that was **satisfied rather than widened**.

### Gates that could not fail

**1. [Rule 1 — Bug] The `seed.sql` faction grep matched no table at all.**
- **Found during:** Task 1.
- **Issue:** `grep -ci 'INTO[[:space:]]*factions'`. Every `INSERT` in `seed.sql` puts the table name on
  the line AFTER the `INSERT INTO` keyword, so the pattern matches nothing.
- **Proof of vacuity:** the same instrument applied to `projects` — a table `seed.sql` demonstrably
  inserts into — also returns `0`. The gate would have printed `0` and passed against a `seed.sql`
  emitting a hundred factions.
- **Fix:** a plain non-comment word grep. Measures `0` here and `1` for `candidates`.
- **Commit:** `e1e09fd80`

**2. [Rule 1 — Bug] The `create_test_data()` row count read 4, not the 2 its own criterion names.**
- **Found during:** Task 1.
- **Issue:** `grep -c "test_id('faction_"` counts lines anywhere in the file; `00-helpers.test.sql` names
  both faction ids twice — once in the `test_id()` CASE mapping, once in the `INSERT` VALUES.
- **Fix:** a `sed` range scoped to the `INSERT INTO factions` statement. The figure was echoed rather
  than tested, so this corrects a **reported number** — which is what the SUMMARY carries.
- **Commit:** `e1e09fd80`

**3. [Rule 1 — Bug] The template grep was anchored where it need not be.**
- Broadened from `-rlE '^[[:space:]]*factions[[:space:]]*:'` to a plain word grep, strictly more
  sensitive for a zero-assertion. Measures `0` here and `34` for `candidates`. **Commit:** `e1e09fd80`

**7. [Rule 1 — Bug] The planned-versus-ran grep could not match — and this run PROVED it.**
- **Found during:** Task 4.
- **Issue:** the gate greps `'looks like you planned'`. `supabase test db` emits a **prove** summary,
  whose wording is `Parse errors: Bad plan.  You planned 30 tests but ran 8.`
- **Why this one is the sharpest of the four:** a genuine bad-plan run occurred mid-task —
  `15-visibility-flags.test.sql` declaring 30 and running 8 — and `grep -ci 'looks like you planned'`
  measured against that very output returned **0**. The gate would have reported clean on the one run in
  this whole plan that actually had the defect it exists to catch.
- **Fix:** `grep -qiE 'Bad plan|You planned [0-9]+ tests but ran'`, plus a positive `Result: PASS`
  assertion so a run producing no summary at all cannot pass by silence either.
- **Commit:** `b9cceded7`

### Task-boundary contradictions

**4. [Rule 3 — Blocking] Task 3's own gates required a database Task 4 was scheduled to unblock.**
- **Found during:** Task 3.
- **Issue:** two of Task 3's verify blocks read the applied database, but its action ends by requiring
  `yarn db:reset` to still FAIL on `302-rls.sql` — and Task 4's precondition requires that red reset.
  **Measured: not simultaneously satisfiable.** `302-rls.sql` applies before `503-entity-rpcs.sql`, so a
  reset that aborts on the policy never creates the two functions at all: `pg_get_function_result`
  returns no row and `yarn db:types` would generate against a half-built database.
- **Fix:** take the red reset as **evidence** and then clear it inside Task 3. The failure was captured
  first (`ERROR: column "organization_id" does not exist (SQLSTATE 42703)`, quoting the `has_role` line —
  M7 stated by PostgreSQL), then the single disjunct was removed, which is exactly Task 2's ratified
  Q1 = A. Nothing else in `302-rls.sql` moved; `303`, `501`, `502` and all four pgTAP files remained
  Task 4's, so the two tasks still have distinct diffs. A tracer that leaves the database unable to apply
  is not a tracer.
- **Commit:** `00d54d9e7`

**6. [Rule 3 — Blocking] Task 6's scope proof halted on work Task 5 mandates.**
- **Found during:** Task 1 (read ahead), applied at Task 6.
- **Issue:** the changed-file list was the whole-tree diff and every entry had to appear in
  `files_modified`. But Task 5's action mandates moving a todo from `.planning/todos/pending/` to
  `completed/`, and the phase's D-34 discipline edits the plan's own text. Neither path can be in a
  SOURCE manifest.
- **Fix:** scope the cross-checked list to `apps packages scripts tests`; capture the `.planning` half
  separately so it is still printed and read rather than hidden.
- **Commit:** `e1e09fd80`

### Gates that count a comment as code

**9. [Rule 1 — Bug] The `invite-candidate` zero-check counts a comment.** Removing a field from a
published Edge Function request body with no comment saying where the relationship went is exactly the
silent residue this phase exists to end — but writing that comment reddens a whole-file
`grep -c 'organizationId'`. This plan's own comment-text discipline says such checks must be scoped to
code positions. Repaired; proven non-vacuous: **0** here, **7** for `projectId`. **Commit:** `9f88b789c`

**11. [Rule 1 — Bug] The `user_can` zero-check counts a comment the plan itself requires.** Task 4's
action says to add a note beside the policy naming 162-10 as where the reach returns *and through what*.
162-10's mechanism **is** `user_can`. Repaired to code positions. Measured after: **`302-rls.sql` gained
zero code lines** — every addition is a comment and the only removal is the four-line disjunct.
Non-vacuity proven on `501-bulk-operations.sql`, which gained exactly one code line
(`WHEN 'factions' THEN`) that the instrument finds. **Commit:** `d88a5dbb9`

### Unsatisfiable, and a census scoped too narrowly

**12. [Rule 1 — Bug] The publication-column check cannot be satisfied by any correct implementation.**
It asserts zero diff lines contain `published`. But `00-helpers.test.sql` and `03-anon-read.test.sql`
insert candidates and factions with column lists naming `organization_id` AND `published` **on the same
line**, so removing one necessarily touches the other. Measured: 8 such lines plus 5 for `confirmed` —
every one a fixture column list, an assertion description string, or Test B's own `qual LIKE`. Repaired
to assert what the prohibition **means**, in three measurements a real breach would move: zero flag
declaration lines changed under `schema/`; `published = true` at 27 before and 27 after; the removed code
of `302-rls.sql` being exactly the four disjunct lines. **Commit:** `d88a5dbb9`

**8. [Rule 3 — Blocking] Measurement 2's pgTAP census was scoped to one file and missed a live faction-row
source.** Detailed under *Measurement 2* above. Both affected files fixed and reported by name;
`15-visibility-flags.test.sql` added to `files_modified`. **Commit:** `b9cceded7`

### Ordering repair, and one gate satisfied rather than widened

**5. [Rule 3 — Blocking] The guard RED had to be taken BEFORE the override keys were removed.** Task 3's
action orders "remove the two keys … Then run the guard … Confirm it names all three violation classes".
Check 5 **is** "an override key widens a column the schema no longer declares", so a run taken after the
keys are gone cannot name that class, and the three-class assertion could never have passed as ordered.
Taken in the repaired order the guard emitted 6 violations, exactly 2 per class. **Commit:** `00d54d9e7`

**10. [note, not a repair] The widening-cast census is coarse but was satisfiable.** It cannot
distinguish a test-file shape narrowing from a Phase-164 nullability compensation. Test G originally read
a row through `(row as unknown as { organization?: … })` — the same pattern already four lines above it
in that file. **Answered by removing the cast, not by widening the gate:**
`expect(row).toHaveProperty('organization', ORG_REF)` asserts shape and contents with none. Recorded so
the next plan that trips it knows the census is coarse rather than wrong. **Commit:** `9f88b789c`

### A measured correction to a plan prediction

**[Rule 1 — measurement]** The plan predicted five dev-seed test sites would become compile errors once
the `factions` insert type required the organization. **Measured: ZERO did.** Those fixtures are untyped
object literals or fragments rather than `TablesInsert` values, so the compiler never saw them.
`locales.test.ts`, `writer.test.ts` and `template.test.ts` are listed in `files_modified` and were
correctly left unchanged. The measured number is reported rather than the predicted one.

### Also handled, not a plan defect

**[Rule 3 — Blocking] The pgTAP type-contamination trap.** `yarn db:types` run after
`yarn workspace @openvaa/supabase test:db` pulled `create_test_data`, `reset_role`, `set_test_user` and
three more pgTAP helpers into `packages/supabase-types/src/database.ts` (26 added lines). Reverted,
`db:reset`, regenerated clean. Caught before commit. **Commit:** `d88a5dbb9`

**[Rule 3 — Blocking] Comment-hygiene rule 2.** Eighteen comment-span junctions across three test files
this plan added comments to. Joined; no wording changed and no claim shortened. **Commit:** `70f2e5bbc`

---

## Known Stubs

**None.** The changed-source scan found no `TODO`, `FIXME`, "coming soon", "not available" or
placeholder introduced by this plan — the only hits are pre-existing i18n key names and prose. Zero
`.skip(` / `.todo(` markers added. One assertion was **retired**, with its reason recorded inline and in
the pgTAP section above; a retirement whose subject no longer exists is not a stub.

---

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or trust-boundary schema surface was
introduced. Every trust boundary this plan crossed is already in its `<threat_model>`, and the one that
changed — `authenticated_select_candidates` — narrowed rather than widened.

---

## Self-Check: PASSED

- `apps/supabase/supabase/tests/database/21-entity-organization.test.sql` — FOUND
- All 16 modified key files — FOUND
- Commits `e1e09fd80`, `7e9f2be01`, `00d54d9e7`, `b9cceded7`, `9f88b789c`, `70f2e5bbc`, `d88a5dbb9` — all FOUND in `git log`
- `commits: 9` measured via `git rev-list --count 8228868e6..HEAD`, not narrated: seven task commits, the metadata commit, and this correction — which was AMENDED rather than added on top, so the figure and the instrument agree instead of chasing each other by one.
