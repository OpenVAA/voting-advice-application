---
phase: 162-permissions-auth-model-refactor
plan: 07
subsystem: database / seeding / adapter
tags: [visibility-flags, nomination-shape, enum-repurpose, declarative-schema, negative-control]
status: complete
requires:
  - '162-02b: the single-migration regeneration path (`yarn schema:regenerate`)'
  - '162-06: the retired-claim switch, and the `identity-callback` grant write whose insert site this plan edits'
provides:
  - 'projects.open_for_voters — 162-08''s project-level term of § 3.4''s public-read rule'
  - 'projects.lock_nominations — declared INERT; 162-12 wires it'
  - 'organizations/candidates/factions/alliances.confirmed — 162-08''s entity-level term; 162-13''s freeze subject'
  - 'public.nomination_shape + elections.election_type retyped — § 6.2''s flow selector'
  - 'apps/supabase/supabase/tests/database/15-visibility-flags.test.sql — 30 assertions'
affects:
  - '162-08 (writes the policies that read all three terms)'
  - '162-12 (wires lock_nominations)'
  - '162-13 (inherits the column-grant gap on factions/alliances)'
  - '162-16 (swaps `published` for these terms)'
  - '§ 6.2 (reads the per-template shapes recorded below as flow selectors)'
tech-stack:
  added: []
  patterns:
    - 'Declared, not ALTERed — every column inside its own CREATE TABLE body (§ 11.4)'
    - 'Declare-then-observe-red — the creation paths land in a SECOND commit so the census can be seen failing'
    - 'Non-vacuity floor on every census — the violation count is printed beside its population'
    - 'Completeness by type system — the enum makes retired values unrepresentable; the grep only confirms'
key-files:
  created:
    - apps/supabase/supabase/tests/database/15-visibility-flags.test.sql
  modified:
    - apps/supabase/supabase/schema/000-enums.sql
    - apps/supabase/supabase/schema/100-tenancy.sql
    - apps/supabase/supabase/schema/101-elections.sql
    - apps/supabase/supabase/schema/102-entities.sql
    - apps/supabase/supabase/seed.sql
    - apps/supabase/supabase/tests/database/00-helpers.test.sql
    - apps/supabase/supabase/tests/database/09-column-restrictions.test.sql
    - apps/supabase/supabase/functions/identity-callback/candidateRecord.ts
    - apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts
    - apps/supabase/supabase/functions/identity-callback/index.ts
    - packages/dev-seed/src/supabaseAdminClient.ts
    - packages/dev-seed/src/template/permittedKeys.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
    - '+ 22 more (14 templates, the generator, the fixture, two READMEs/skill doc, two regenerated artefacts)'
decisions:
  - 'Q1 = type approved — public.nomination_shape, three members, NOT NULL DEFAULT ''organization_list'''
  - 'Q2 = A — remove the adapter term; ElectionData.subtype is fed by elections.subtype alone'
  - 'Q3 = creation-path values approved — four paths; lock_nominations NOT seeded'
metrics:
  duration: ~4h
  completed: 2026-09-16
actuals:
  tokens: 24528
  tasks: 6
  commits: 7
plan_head_before: 53ee715e8bb978c914a1a425bb2ff3c73949c75b
---

# Phase 162 Plan 07: Visibility Flags and the Repurposed Election Axis — Summary

Six columns declared inside their own `CREATE TABLE` bodies and proven `false` where nothing has spoken for
them and `true` on every row of two actually-rebuilt databases; `elections.election_type` retyped to a
three-member enum whose retired values PostgreSQL now rejects; and the blanking direction observed failing
before it was believed.

---

## Task 2's answers, by question and option letter

| Q | Answer | Source |
|---|---|---|
| **Q1** | **`type approved`** — `CREATE TYPE public.nomination_shape AS ENUM ('organization_only','candidate_only','organization_list')`; `elections.election_type public.nomination_shape NOT NULL DEFAULT 'organization_list'`. Named for the concept, not the column (following `role_scope_type`). No alternative name, nullability or default was given. | `162-CHECKPOINT-DECISIONS.md` § 8 item **C-1** |
| **Q2** | **`A`** — remove the term; leave the application property fed by its own column. Not (B) (scope `162-CONTEXT.md` closes), not (C) (the fail-open option D-16 names). | § 8 item **C-2** |
| **Q3** | **`creation-path values approved`** — values at the creation paths, not a migration. | § 4 item **V-1** |

All three boxes were left unticked, which selects each item's ★ RECOMMENDED option.

**Q3's operator restatement, quoted.** `162-DISCUSSION-POINTS.md` D2's free-text margin note reads
> No backfills for any data

Shown that note quoted against the four creation paths, the operator read it as forbidding the
**migration-time** backfill and not the seed-time values — which is what § 10.2 and D-19 already said in the
same direction.

**The three-flag table, as ratified:**

| flag | safe default | today's behaviour | seeded? |
|---|---|---|---|
| `projects.open_for_voters` | closed | every project is read anonymously today | **yes**, `true` |
| `entities.confirmed` | unconfirmed | every entity is visible today | **yes**, `true` |
| `projects.lock_nominations` | unlocked | admins hold `nomination.edit` unconditionally | **no** |

### ⚠ `lock_nominations` SHIPS INERT AND IS NOT SEEDED

Stated as its own line because getting it wrong is invisible until 162-12. No policy reads it, no seed sets
it, no creation path is taught it, and no assertion claims anything for it beyond existence, type, `NOT NULL`
and default `false`. Its default `false` **is** today's behaviour, not a new permissive setting: § 3.3 grants
admins `nomination.edit` unconditionally, and the `own, unless locked` cells it gates belong to entity-user
write policies that do not exist until 162-12. Verified after the fact: `git grep lock_nominations` outside
`.planning/` reaches the schema declaration, the regenerated migration, the generated types, the value-level
mirror and the two pgTAP assertions — and **no seed, no template, no creation path and no policy**.

### The four creation paths (Q3)

| path | rows it produces | what it sets |
|---|---|---|
| `apps/supabase/supabase/seed.sql` | the default project; the seeded candidate | project open; candidate confirmed |
| `SupabaseAdminClient.ensureProject` | the E2E project, and any project `yarn db:seed` targets | project open, **including one it did not create** |
| `SupabaseAdminClient.bulkImport` | every entity row of all thirty templates | entity rows confirmed, unless the row says otherwise |
| `create_test_data()` | the pgTAP fixture's two projects and nine entity rows | A-true / B-false |

---

## The re-derived trace census against D-16's prediction

| figure | predicted (M3) | measured | difference |
|---|---|---|---|
| tracked files naming the column, outside `.planning/` | 25 | **25** | none |
| template files under `packages/dev-seed/src/templates` | 14 | **14** | none |
| template value occurrences (lines) | 22 | **22** | none |
| `supabaseDataProvider.test.ts` lines naming it | 6 | **6** | none |
| production reads in `apps/frontend/src` | 1 | **1** | none |

M3's correction to D-16 is **confirmed**: the six adapter-test lines are 534, 555, 565, 595, 623 and **653**
— there is no hit at 582, which is the `subtype` assertion the mapping change invalidates and which was in
scope for a different reason. The two traces D-16 does not list, in
`.claude/skills/database/schema-reference.md`, are also confirmed and were swept.

**One trace neither M3 nor D-16 records, found by the extraction and recorded as a finding:**
`packages/dev-seed/src/templates/_helpers/buildMinimal.ts:206` carried the two retired values in a **ternary**
(`idx === 1 ? 'general' : 'local'`), not in the `column: 'literal'` form. It is invisible to the plan's own
value-extraction pattern and to its residual sweep as written. The compiler found it (it is one of the 15
files `yarn typecheck` named); the residual sweep was repaired to reach ternary value positions. The true
literal totals are therefore 17 `general` and 9 `local`, one more each than the extraction's 16 / 8.

### The distinct retired value set

| value | occurrences before (literal form) | occurrences before (incl. the ternary) | after the sweep |
|---|---|---|---|
| `general` | 16 | 17 | **0** |
| `local` | 8 | 9 | **0** |
| `presidential` | 2 | 2 | **0** |

Three distinct values, not the two the canonical documents name. The third (M4) lived only in the adapter
test and a sweep written against two literals would have left it standing.

Residual measured over a corpus of **2725** files, with the sweep pattern **first proven able to find a value
it is known to be able to see** before its zero was accepted. The only file excluded is
`15-visibility-flags.test.sql`, which must name all three to assert they are rejected; that exclusion is
itself floored — the file holds exactly **3** occurrences, so it cannot hide a fourth.

---

## The derived per-template shape table

Derived from each template's **own nominations**, never assumed. **No row is marked as assumed.** The
population was found by the **compiler** — retyping the column made `TablesInsert<'elections'>['election_type']`
an enum, and `yarn typecheck` named 15 files (14 templates + the generator); the grep confirmed it and caught
the four traces outside typed code.

| file | election | the nominations that decided it | shape |
|---|---|---|---|
| `src/generators/ElectionsGenerator.ts` | synthetic `election_NN` | pairs with `NominationsGenerator`'s `count` branch, which emits one candidate nomination per candidate with **no `parent_nomination`** and **no organization ref** (both stated in its own comments at the emission site) | `candidate_only` |
| `src/templates/_helpers/buildMinimal.ts` | `el-1` … `el-N` | `buildElectionConstituencyNoms` / `buildSingleOrgNoms`: `or-N` organization nominations + candidate nominations naming them as parent | `organization_list` |
| `src/templates/default.ts` | `election_default` | `defaults/nominations-override.ts`: 10 alliance + 40 organization (parented to alliances) + 327 candidate (each parented to an organization nomination in the same constituency) = the 377 rows the seed reports | `organization_list` |
| `src/templates/e2e/base.ts` | `test-e2e-base-el-reg` | 9 organization, 19 candidate (18 with a parent), 3 alliance | `organization_list` |
| `src/templates/e2e/base.ts` | `test-e2e-base-el-mun` | 11 organization, 13 candidate (12 with a parent), 6 alliance | `organization_list` |
| `…/perm/notLocated2e2cgShape.ts` | `el-1`, `el-2` | `buildElectionConstituencyNoms` | `organization_list` ×2 |
| `…/perm/perm-2e-asymmetric.ts` | `el-1`, `el-2` | `buildElectionConstituencyNoms` | `organization_list` ×2 |
| `…/perm/perm-2e-shared.ts` | `el-1`, `el-2` | `buildElectionConstituencyNoms` | `organization_list` ×2 |
| `…/perm/perm-analytics-tracking.ts` | `el-1` | `buildElectionConstituencyNoms` | `organization_list` |
| `…/perm/perm-disable-election-1co.ts` | `el-1`, `el-2` | `buildElectionConstituencyNoms` | `organization_list` ×2 |
| `…/perm/perm-disable-election-2co.ts` | `el-1`, `el-2` | `buildElectionConstituencyNoms` | `organization_list` ×2 |
| `…/perm/perm-disjoint-1co.ts` | `el-1`, `el-2` | `buildElectionConstituencyNoms` | `organization_list` ×2 |
| `…/perm/perm-interactive-info.ts` | `el-1` | `buildElectionConstituencyNoms` | `organization_list` |
| `…/perm/perm-org-matching.ts` | `el-1` | `buildElectionConstituencyNoms` | `organization_list` |
| `…/perm/perm-question-video.ts` | `el-1` | `buildElectionConstituencyNoms` | `organization_list` |
| `…/perm/perm-startfromcg.ts` | `el-1`, `el-2` | `buildElectionConstituencyNoms` | `organization_list` ×2 |
| `tests/fixtures/negctl-elections-sentinel.ts` | `el-1` | **zero nominations, by design** — its own comment: *"Deliberately empty … Do not add rows here."* The fixture's subject is an illegal SENTINEL key on an elections row, not a nomination flow. | **key removed** (see below) |

`buildElectionConstituencyNoms` (`…/perm/shared.ts:301`) is the evidence for eleven rows: it emits `or-1` and
`or-2` organization nominations plus one candidate nomination per candidate, each carrying
`parent_nomination: { external_id: '…nom-<key>-or-<N>' }` — the first rule's antecedent verbatim.

**The one file no rule classifies did not halt the task, because the honest answer there is not a shape.**
Rather than record an assumed shape for `negctl-elections-sentinel.ts`, its `election_type` key was
**removed**; the column is `NOT NULL DEFAULT`, so the row still gets a value, which is precisely the property
Q1 ratified the default for. ⚠ That file declares itself **BYTE-FROZEN**; the edit is recorded rather than
made silently. The freeze protects a *pair* of runs that must differ only by the tree, taken in phase 144;
this edit cannot change that pair, and a future re-run uses the new bytes for both halves. Leaving the
retired value would have made the fixture unseedable against the new enum — breaking the control rather than
preserving it.

**Measured on the rebuilt database afterwards:**

    seed_election_default   ->  organization_list
    test-e2e-base-el-mun    ->  organization_list
    test-e2e-base-el-reg    ->  organization_list

---

## The two reddened counts — this plan's rows in the phase's negative-control ledger

### Task 3 — the project flags declared, no creation path wired: **4 red**

| what | result |
|---|---|
| pgTAP `15-visibility-flags` | **Failed 1/8** — `Fixture project A is open for voters` |
| census 1 `reset-with-data` | projects rows **1**, not open **1** — RED |
| census 2 `e2e/base` | projects rows **1**, not open **1** — RED |
| census 3 the M6 upgrade path | planted closed → `{"open_for_voters":false}` — RED |

Green at that same commit, and correctly so: the bare-insert defaults, the explicit-insert probe, both
`NOT NULL` catalogue reads, the project-B polarity assertion and the lock-flag assertion. Those are about the
**column**, not the seed; a red there would have meant the declaration was wrong.

Census 3 confirms **M6 is live, not theoretical**: `ensureProject`'s conflict-ignoring upsert leaves a
project it did not create closed for ever, and `tests/global-setup.ts` never deletes the E2E project.

### Task 4 — the four entity columns declared, no creation path wired: **10 red**

| what | result |
|---|---|
| pgTAP `15-visibility-flags` | **Failed 4/25** — the four A-half fixture assertions |
| census 4 `reset-with-data` | organizations **8/8**, candidates **328/328**, alliances **2/2** — 3 RED |
| census 5 `e2e/base` | organizations **13/13**, candidates **358/358**, alliances **4/4** — 3 RED |

`09-column-restrictions.test.sql` was **green at that commit and never red**, which is correct and is
recorded rather than hidden: `303-column-grants.sql` is an allow-list, so the column is outside the
authenticated UPDATE grant **by construction**. Those two assertions observe a structural, pre-existing
protection; they do not build one.

### ⚠ Combined: **14**, against the plan's floor of "at least fifteen"

Short by one, and the one is **unreachable by construction**. The floor counts *both* halves of each A/B
fixture pair as reddenable, but the B half of every pair asserts the column's own **default**, so it is green
before the creation paths are wired and green after — which is exactly what makes it a control rather than a
second copy of the A assertion. Padding the count would have meant adding an assertion that cannot fail,
which is the defect this plan's whole instrument design exists to prevent. The measured figure is reported.

---

## The seeded-true census figures

### After `yarn db:reset-with-data`

| table | rows | violating |
|---|---|---|
| `projects` (not open for voters) | 1 | **0** |
| `organizations` (unconfirmed) | 8 | **0** |
| `candidates` (unconfirmed) | 328 | **0** |
| `factions` (unconfirmed) | **0** | 0 |
| `alliances` (unconfirmed) | 2 | **0** |

### After `yarn db:seed --template e2e/base`

| table | rows | violating |
|---|---|---|
| `projects` | 1 | **0** |
| `organizations` | 13 | **0** |
| `candidates` | 358 | **0** |
| `factions` | **0** | 0 |
| `alliances` | 4 | **0** |

⚠ **`public.factions` is EMPTY after both built-in templates** — no template in the repository creates a
faction row. The plan's non-vacuity floor ("every total greater than zero") therefore could not pass against
a tree where nothing is wrong. Repaired rather than dropped: the census floors every table the rebuild
actually populates, names the populated and empty sets at run time, and **fails if a table that was populated
at the Task 1 baseline comes back empty**. A table that silently loses its rows is still caught; a table no
template has ever populated no longer halts the plan.

## The default-false grid, measured on the applied database

| probe | reading |
|---|---|
| bare insert into `projects` → `open_for_voters` | `false` |
| bare insert into `projects` → `lock_nominations` | `false` |
| bare insert into `organizations` → `confirmed` | `false` |
| bare insert into `candidates` → `confirmed` | `false` |
| bare insert into `factions` → `confirmed` | `false` |
| bare insert into `alliances` → `confirmed` | `false` |
| **explicit** insert naming `open_for_voters` true | `true` |
| **explicit** insert naming `confirmed` true | `true` |

The two explicit readings are what make the six `false` readings **defaults** rather than writes that failed.

## The M6 upgrade path

A project planted closed by hand and passed to `ensureProject` reads back
`{"name":"preexisting closed project","open_for_voters":true}` — it **opens**, and the planted **name
survives**, which is why the conflict-ignoring upsert itself was left exactly as it was and the flag rides on
a separate unconditional update.

## The derived paths and the derived gap

- **Project-writing code paths: 2**, and they are M5's two —
  `apps/supabase/supabase/seed.sql` and `packages/dev-seed/src/supabaseAdminClient.ts`.
  (Three further sites write `public.projects` **inside the pgTAP fixture**: `00-helpers`, `03-anon-read`,
  `04-admin-crud`. Classified, not counted as application creation paths.)
- **Non-admin UPDATE policies on the two entity tables with no column grant: `NONE`**, derived from
  `pg_policies` over a policy population of **10** (`factions` and `alliances` carry 5 each:
  `admin_delete`, `admin_insert`, `admin_update`, `anon_select`, `authenticated_select`). The absent grant
  is proven **unreachable**, not assumed harmless.

## Assertion counts

| file | before | after |
|---|---|---|
| `09-column-restrictions.test.sql` declared plan | `plan (26)` | `plan (28)` |
| `15-visibility-flags.test.sql` declared plan | — (new) | `plan (30)` |
| pgTAP estate | 15 files / 602 assertions | **16 files / 634 assertions** |
| `supabaseDataProvider.test.ts` cases | 79 | **80** |
| `candidateRecord.test.ts` cases | 10 | **14** |

`09-column-restrictions.test.sql` gained **exactly 2** `throws_ok` (15 → 17) and the **only** removed line in
its whole diff is the old plan count.

## Does `162-SPEC.md` state the repurposing?

**Yes** — line 378, in full, including that there is no `nomination_shape` column. 162-01 carried it; there
is no omission to report.

---

## Deviations from Plan

### ⚠ The headline finding: `set -e` is inert in this harness

The Bash tool runs **zsh 5.9** and evaluates each block through `eval`, where `ERR_EXIT` does **not** abort
on a failing simple command. Measured directly: `set -e; false; echo REACHED` prints `REACHED`. **Every
`set -euo pipefail` in this plan's verify blocks, and every one I wrote myself, was decoration.** D-34's
measurement across the phase ("193 of 215 blocks without `set -e`") implicitly treats `set -e` as the
remedy; in this harness it is not one. Every gate here was re-run with explicit
`|| { echo …; exit 1; }` after the discovery, and the later plans in this phase should assume the same.

Two zsh-specific expansion traps fell out of the same root and each produced a **fail-open or fail-loud gate
that cannot pass as written**:

1. **`"$BASE:apps/…"` applies zsh's `:a` variable modifier**, resolving to a cwd-prefixed path. The plan uses
   this form in Task 4's `EXPANSION-GATES-OK` and Task 5's `SWEEP-COMPLETE`; both die with
   `unknown revision or path`. Braces (`"${BASE}:apps/…"`) are mandatory.
2. **`"$C[^A-Za-z_]…"` is read as an array subscript**, so zsh tries to evaluate the character class as a
   math expression and the pattern silently degrades. My first residual sweep reported `0` from a broken
   instrument. Caught only because zsh printed `bad math expression`; re-run with `${C}` and with the pattern
   first **proven able to find a value it is known to be able to see**.

### Gate repairs (D-34 — each found in this plan's own text, each repaired in place)

**1. [Rule 3 — blocking] Task 1's `BASELINE-OK` block cannot fail.**
Its shape is `A && B && … && S="$(git status …)"; if [ -n "$S" ]; …; fi; echo BASELINE-OK`. If any of
`test "$PF" -eq 0`, `test "$CF" -eq 0` or `test "$ET" = "text"` fails, the `&&` chain short-circuits, the `;`
resets `$?`, `$S` is never assigned so the `if` cannot fire, and **`BASELINE-OK` prints and the block exits
0**. This is exactly 162-06's defect reproduced. Replaced with explicit per-assertion checks.

**2. [Rule 3 — blocking] Task 1's path sweep can never match `seed.sql`.**
It greps `INSERT INTO *projects` on a single line; `seed.sql` writes `INSERT INTO\n  projects (` with the
table name on the next line. The gate's own `grep -qx 'apps/supabase/supabase/seed.sql'` then fails, so the
block halts against a correct tree. Repaired to a multiline (`perl -0777`) match, which also reached the
three pgTAP sites the single-line pattern never saw — those are classified as fixture sites, leaving M5's
count of 2 application creation paths intact.

**3. [Rule 3 — blocking] The non-vacuity floor cannot pass: `factions` is empty in every template.**
See the census section above. Repaired to floor the populated set and to fail on a table that *was* populated
and is now empty.

**4. [Rule 3 — blocking] Task 3 asserts `lock_nominations` but Task 4 declares it.**
Task 3's `<behavior>` lists Tests 2, 5 and 8 on the lock flag, and Task 3's own `<verify>` runs the whole
pgTAP estate and requires it green — unsatisfiable if the column arrives in Task 4. Resolved by declaring
**both project flags in Task 3**, which is also how `162-PATTERNS.md` row 26 scopes `100-tenancy.sql`
(`projects.open_for_voters`, `lock_nominations` → 162-07 as one unit). Task 4's lock-flag acceptance criteria
are catalogue reads and remain satisfied. No ratified figure moves.

**5. [Rule 3 — blocking] Task 3 asserts the fixture polarity but `00-helpers.test.sql` is a Task 4 file.**
Same shape as (4): Tests 6 and 7 require an edit to `create_test_data()`, which Task 3's file list omits and
its gate requires green. The projects half of the fixture edit moved into Task 3. The file is in the plan's
top-level `files_modified`, so the scope proof is unaffected.

**6. [Rule 1 — bug] Task 3's `COLUMN-OK` probe reads `BEGIN`, not the value.**
`psql -Atc "BEGIN; INSERT … RETURNING …; ROLLBACK;" | head -1` prints the `BEGIN` command tag. (The plan's
own measured-facts section warns that `| tail -1` reads `ROLLBACK`; `head -1` has the mirror-image defect.)
Repaired with `-q`. This is where the inert `set -e` was discovered — the probe returned `BEGIN`, the
comparison failed, and the block still printed `COLUMN-OK`.

**7. [Rule 1 — bug] Task 3's `ensureProject` upgrade probe is wrong three ways.**
`node -e "const {SupabaseAdminClient}=require('@openvaa/dev-seed'); new SupabaseAdminClient(pid)…"`:
`@openvaa/dev-seed` is `"type": "module"` exporting a raw `.ts` entry, so `require()` cannot load it; the
constructor's **first** parameter is the Supabase URL, not the project id; and the argument-less
`ensureProject()` that follows would then ensure `TEST_PROJECT_ID` rather than the planted row. Rewritten as a
`tsx` probe using `new SupabaseAdminClient(URL, KEY, PROBE_ID)`. It is the probe that caught M6 red.

**8. [Rule 1 — bug] Task 5's residual sweep cannot see a ternary value position.**
`git grep -c "$C: *'$VAL'"` reaches only `column: 'literal'`. `buildMinimal.ts:206` held one occurrence of
each retired value in a ternary. Widened to a value position within 60 characters of the column name, in TS
or SQL, and the pattern's own ability to find a known occurrence is asserted before its zero is accepted.

**9. [Rule 3 — blocking] Task 3/4's verification floor of "at least fifteen" reddened assertions is
unreachable by construction.** Kept and reported as measured (14) rather than met by padding — see above.

### Other deviations

**10. [Rule 1 — bug] `array_agg(e.enumlabel)` is `name[]`, not `text[]`.**
The enum-membership assertion failed with `function is(name[], text[], unknown) does not exist`. Cast added.

**11. [Rule 2 — required convention] The comment-hygiene guard rejected two fixture banners.**
`scripts/assert-comment-hygiene.mjs` rule 2 (D-A4) flags a comment line with no terminal punctuation whose
successor continues at the same indent. The `===== Projects =====` and `===== Organizations =====` banners
each acquired a continuation; joined onto the banner, matching the `===== Candidates … =====` form beside
them. Committed separately as `style(162-07)`.

**12. [Rule 2 — required] `candidateRecord.test.ts`'s entry-point assertions had to be rewritten.**
Extracting the insert invalidated two of them: the import assertion pinned the exact single-name import line,
and the "at least one candidates chain" instrument floored a population that extraction empties. The rewrite
is a **strengthening**, not a weakening: the entry point now holds *no* candidates chain at all, so the
assertion becomes that emptiness, and the project-naming property is restated over the helper module where
the queries now live, over its own floored population.

---

## Scope proof (against base SHA `53ee715e8`)

| claim | result |
|---|---|
| `302-rls.sql` | **byte-identical** |
| `400-storage.sql` | **byte-identical** |
| `300-auth-tables.sql` (publication columns: 23 → 23) | **byte-identical** |
| `303-column-grants.sql` | **byte-identical** |
| files under `tests/tests/specs/` changed | **0** |
| lines naming `organization_id` in the `102-entities.sql` diff | **0** (162-07b's subject untouched) |
| `.sql` files in `apps/supabase/supabase/migrations/` | **1** |
| `package.json` dependency / devDependency lines moved | **0** (T-162-07-SC) |
| name-only diff vs. `files_modified` | **35 changed / 35 declared — every path declared** |
| `CREATE POLICY` / `CREATE INDEX` / `ALTER TABLE` / `DROP COLUMN` / `SECURITY DEFINER` added | **0 / 0 / 0 / 0 / 0** |

## Gate chain

| gate | result |
|---|---|
| `yarn typecheck` | **0** |
| `yarn lint:check` | **0** (includes parity, rpc-nullability, project-scoped-queries, grant-enum, comment hygiene — all 0 violations) |
| `yarn test:unit` | **0** |
| `yarn typecheck:tests` | **0** |
| `yarn workspace @openvaa/supabase test:db` | **0** — 16 files, **634** assertions, `Result: PASS`, no failing file named |
| `yarn db:lint:sql` | **0** — 0 errors, 2 warnings, both **pre-existing** (FK-without-index on `constituency_group_constituencies.constituency_id` and `election_constituency_groups.constituency_group_id`; neither table is touched by this plan, and 162-06's `deferred-items.md` already has them on record) |
| **Full E2E suite** | **155 passed / 0 failed / 0 did-not-run**, `flaky: 0`, `skipped: 0`, preflight successes 1 / failures 0, wrapper exit 0. Run directory: `tests/e2e-runs/162-07-wave3/` |

**What the suite can and cannot show here.** It shows that adding six columns and retyping a seventh broke
nothing that works today — the seeding paths still seed, the templates still apply, the adapter still maps.
It **cannot** show that the flags carry the right values, because nothing reads them until 162-08. That is
what the censuses and the two reddened counts are for, and the division is stated here rather than letting a
green suite stand in for evidence it does not supply.

## Code-review checklist

Checked against this plan's diff. Every applicable item passes; the inapplicable ones are named rather than
silently skipped.

- Solves the stated problem ✓ · OWASP: the only new trust surface is the confirmation column, and the
  elevation path is closed by an allow-list column grant (asserted, `42501`) and a derived-empty policy set ✓
  · code style ✓ · **no `any`** (the single diff hit is the English word in a doc comment) ✓ · no repetition
  (`bulkImport`'s confirmation default is deliberately its own set, not a fold into the publication one) ✓ ·
  all new entities documented ✓ · repo docs updated (`schema-reference.md`, `dev-seed/README.md`) ✓ · errors
  handled and attributed (`ensureProject` names which of its three writes failed;
  `createCandidate` throws `ERR_CANDIDATE_CREATE_FAILED` on both the error and the null-row case) ✓ · no
  failing checks ✓ · shared dependants unaffected (full E2E green) ✓ · commit history linear and conventional
  ✓.
- **Supabase backend:** no new table, so the common-columns / 5-policy / index items are N/A by prohibition —
  this plan writes no policy and adds no index, both asserted at 0. pgTAP transaction boundary
  (`BEGIN`/`create_test_data()`/`ROLLBACK`) ✓; assertion patterns (`is`, `cmp_ok`, `throws_ok`) ✓; no new
  `SECURITY DEFINER` function ✓.
- **Supabase adapter:** no new mapping added — a term was removed; `column-map.ts` byte-identical ✓.
- **Edge Functions:** the caller's auth path is unchanged; the extracted module takes the service-role client
  as a parameter and reaches no Deno global, which is what makes it vitest-importable ✓.
- **N/A and named:** tracking events (no user-facing function added), Svelte component guidelines, WCAG
  A/AA, keyboard and screen-reader use — this plan changes no UI.

## Handoffs

- **→ 162-08: the index decision is deferred, deliberately.** No index is added for any of the three flags.
  The predicate that would justify one is 162-08's anon policy, and an index chosen for a policy nobody has
  written is a guess recorded as a fact. 162-08 should derive it from the predicate it actually writes.
- **→ 162-13: the column-grant gap on `factions` and `alliances` is real.** `303-column-grants.sql` is an
  allow-list covering `candidates` and `organizations` only; on the other two, only row-level security stands
  between an authenticated caller and `confirmed`. Measured today the gap is **unreachable** (0 non-admin
  UPDATE policies over a population of 10), and that derivation is now a standing pgTAP assertion — so it
  reddens if the gap ever opens. Closing it properly is 162-13's named deliverable.
- **→ 162-12: `lock_nominations` is declared and inert.** One line to wire.
- **→ § 6.2 / 162-17: the derived shape table above is the flow-selector record.** Every election is
  `organization_list` except the synthetic generator's, which is `candidate_only`.

## Known Stubs

None. `lock_nominations` is **not** a stub — it is a deliberately inert column, declared by D-15's
instruction, asserted for exactly what it is (existence, type, `NOT NULL`, default) and claimed as nothing
more, in the schema comment, in the pgTAP file and here.

## Threat Flags

None. The only new security-relevant surface is `entities.confirmed`, which the plan's own
`<threat_model>` already registers as T-162-07-04, and it is mitigated here (two `throws_ok` observing
`42501` on the covered tables; a derived-empty non-admin UPDATE policy set on the uncovered two).

## Self-Check: PASSED

All 14 claimed files exist on disk; all 6 claimed commits are reachable from `HEAD`.
