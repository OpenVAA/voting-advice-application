---
phase: 162-permissions-auth-model-refactor
plan: 08
subsystem: database
tags: [rls, anon-visibility, security-definer, pgtap, negative-controls]
status: complete
requires:
  - '162-01: 162-SPEC.md, the normative reference'
  - '162-02b: one migration only; edit schema/ and regenerate, never hand-edit 00001'
  - '162-04: is_child_nominee, whose four-FK matching idiom and hardening the new helpers reuse structurally'
  - '162-07: projects.open_for_voters and the confirmed column on all four entity tables, shipped inert'
  - '162-07b: the candidates SELECT disjunct removal and the 654-assertion estate this plan extends'
provides:
  - 'public.project_open_for_voters (p_project_id uuid) RETURNS boolean — STABLE SECURITY DEFINER SET search_path = ''''. The project-level term of § 3.4, called by eleven anon policies.'
  - 'public.entity_has_confirmed_nomination (p_entity_type public.entity_type, p_entity_id uuid, p_project_id uuid) RETURNS boolean — STABLE SECURITY DEFINER SET search_path = ''''. The nomination hop, with the entity type as an ARGUMENT and the entity''s own project as the third one.'
  - 'public.nomination_entities_confirmed (p_nomination_id uuid) RETURNS boolean — STABLE SECURITY DEFINER SET search_path = ''''. The transitive conjunct, in Q3(A) strength: fully anon-readable, terms of use included.'
  - 'Thirteen converted TO anon SELECT predicates. `published` is ABSENT from all thirteen, measured against pg_policies on the applied database.'
  - 'apps/supabase/supabase/tests/database/16-anon-visibility.test.sql — 51 assertions, 45 of them observed red under at least one of sixteen deliberately wrong predicate sets.'
  - 'A shared fixture in which ALL FOUR entity tables carry the A-visible / B-hidden polarity.'
affects:
  - '162-14: the three helpers are the interface anon_select_public_assets will call; 400-storage.sql is byte-identical here.'
  - '162-16: the policy layer holds no `published` term left to strip — a discharged obligation.'
  - '162-12: inherits exactly three `unconfirmed` call sites in 301-auth-functions.sql plus one policy predicate, and the missing composite project/entity constraint on nominations.'
  - '162-17: the four structural assertions in 16-anon-visibility.test.sql are what it generalises into lint-schema.mjs; rls-policy-map.md is its sweep.'
  - 'The voter frontend: a closed project returns the anon caller NO app_settings row at all. See the handoff section below.'
tech-stack:
  added: []
  patterns:
    - 'A SECURITY DEFINER helper as the ONLY writable form of a policy predicate, chosen against two measurements rather than on style: an inline projects lookup is blind to every anon caller, and an inline entity/nomination pair raises.'
    - 'A negative-control grid run against N deliberately wrong predicate sets before the real ones are accepted, with every reddened count recorded — and every assertion that reddened under NONE of them treated as a defect in the assertion, not in the count.'
    - 'An over-determined denial is not a denial: a row hidden by two conjuncts at once isolates neither. Two fixture rows were rebuilt as cross-project rows so that exactly one conjunct is false in each.'
    - 'A structural assertion written as a REGEX over pg_policies.qual, never a literal schema-qualified spelling: pg_get_expr renders against the current search_path, so the qualified literal is a check that cannot fail.'
    - 'A two-number invariant assertion (`6/0`) so a clean zero cannot come from a query that examined nothing.'
key-files:
  created:
    - apps/supabase/supabase/tests/database/16-anon-visibility.test.sql
  modified:
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/schema/302-rls.sql
    - apps/supabase/supabase/tests/database/00-helpers.test.sql
    - apps/supabase/supabase/tests/database/03-anon-read.test.sql
    - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/database.ts
decisions:
  - 'Q1 = helpers approved. Three boolean functions, all STABLE SECURITY DEFINER SET search_path = ''''. The SECURITY DEFINER requirement is measured, not argued.'
  - 'Q2 = A. One hop — the nomination''s own linked entity. Transitivity happens per row, not per chain.'
  - 'Q3 = A. "Linked entity confirmed" means fully anon-readable, terms of use included. The duplicated terms-of-use expression is mitigated by a biconditional assertion, not by a comment.'
  - 'Q4 = gate approved. app_settings and both join tables come inside the gate. A closed project returns the anon caller no app_settings row at all.'
metrics:
  duration: one session
  completed: 2026-09-17
actuals:
  tokens: 30409
  tasks: 6
  commits: 4
plan_head_before: 0c9863c0ee2cd41a97e2fbe4b7ae47f2792d1b9a
---

# Phase 162 Plan 08: The anon visibility model — Summary

Public visibility is now decided by **one project flag and two confirmation states**, in the policies,
in their end state, in thirteen predicates that hold **no `published` term at all**. The move was proved
in both directions before it was accepted: every conjunct was flipped alone against an otherwise-visible
row, and the whole grid was run against **sixteen deliberately wrong predicate sets** — with every
assertion that reddened under none of them treated as a defect in the assertion rather than tolerated.

---

## ⚠ FRONTEND HANDOFF — THE CLOSED-PROJECT `app_settings` CASE

**Stated first because nothing in this repository will catch it.** Every project in every seed is open
for voters (162-07), so no gate here, and no gate in the E2E suite, is ever in this state.

`anon_select_app_settings` was `USING (true)`. Under the operator's ratified **Q4 = gate approved** it is
now gated on `project_open_for_voters (project_id)`. Therefore:

> **An anonymous caller reading `app_settings` for a project that is not open for voters receives ZERO
> ROWS — not a default row, not an empty settings object, no row at all.**

The voter application must be able to render that state. Today it is unreachable because every seeded
project is open; it becomes reachable the moment an operator closes a project, which is exactly what
`open_for_voters` exists to let them do. The behaviour is pinned by one assertion —
*"anon reading app_settings for a project that is not open for voters sees ZERO rows — the frontend
consequence ratified at task 2 Q4"* — and that assertion is a **database** assertion; it says nothing
about what the frontend does with the empty result.

The same gate applies to `elections`, `constituencies`, `questions` and the rest: a closed project
returns the anon caller an empty application, by design.

---

## The window 162-07b opened is neither closed nor widened

`authenticated_select_candidates` is **byte-identical** to its state at the base SHA (same md5 over the
policy block). The RLS diff contains **zero** lines mentioning `authenticated`; the file declares 67
`TO authenticated` policies before and 67 after. WINDOWS.md row 267 stays `open` and stays 162-10's.

---

## Named figures

### The anon policy census, derived from `pg_policies` on the applied database

| | before | after |
|---|---|---|
| `TO anon` SELECT policies in schema `public` | 13 | 13 |
| of those, whose `qual` mentions `published` | **10** | **0** |
| of those, reaching `projects.open_for_voters` (directly or by delegation) | **0** — ten gated on `published`, three ungated `USING (true)` | **13** |
| `TO anon` INSERT policies (`anon_insert_feedback`, out of scope) | 1 | 1 |
| anon policies holding an inline sub-select over `nominations` or `projects` | 0 | **0** |
| anon policies holding a sub-select over `constituency_groups` (the two join tables) | 0 | **2** |

`anon_select_public_assets` in `400-storage.sql` is the fifteenth anon policy and is deliberately
untouched — that file is byte-identical to the base SHA, and it is 162-14's.

### Task 2's ratified answers, verbatim by option letter

- **Q1 = helpers approved.** Signatures as shipped, all three `STABLE SECURITY DEFINER SET search_path = ''`:
  - `public.project_open_for_voters (p_project_id uuid) RETURNS boolean`
  - `public.entity_has_confirmed_nomination (p_entity_type public.entity_type, p_entity_id uuid, p_project_id uuid) RETURNS boolean`
  - `public.nomination_entities_confirmed (p_nomination_id uuid) RETURNS boolean`
- **Q2 = A.** One hop — the nomination's own linked entity. Transitivity still happens per row: an
  unconfirmed party's own nomination fails its own policy and is invisible. Separating row: a confirmed
  candidate with a confirmed nomination whose parent party nomination names an unconfirmed organization
  is **public**, and the party is not.
- **Q3 = A.** "Linked entity confirmed" means **fully anon-readable, terms of use included**. Accepted
  cost: the terms-of-use expression exists in two places. Mitigation: a **biconditional assertion, not a
  comment** — *zero nominations visible to anon whose linked candidate that same caller cannot see* —
  which fails when the two expressions **disagree** rather than merely when they differ.
- **Q4 = gate approved.** `app_settings` and both join tables come inside the gate. The join tables
  **delegate** to `constituency_groups`' own policy rather than calling the helper.

### The three probes, measured in rolled-back transactions

| Probe | Result |
|---|---|
| **A — the recursion** | `ERROR:  infinite recursion detected in policy for relation "candidates"` |
| **B — the blind project lookup** | inline `EXISTS … FROM public.projects` → **0** rows; the same rule behind a `SECURITY DEFINER` helper → **1**; table total → **1** |
| **C — the join-table delegation** | **no error.** groups visible to anon = **1**; join rows visible = **5**; join rows total = **5** |

Probe B was **vacuous on the first attempt** — `elections` was empty (`inline=0 secdef=0 total=0`) and
the plan's own `fails_when` names that as "nothing was measured". The database was rebuilt before the
probe was re-run. See deviation D-1.

### The two visibility censuses

| | `yarn db:reset-with-data` | `+ yarn db:seed --template e2e/base` |
|---|---|---|
| projects total / closed to voters | 1 / **0** | 1 / **0** |
| candidates total / unconfirmed / with no confirming nomination | 328 / 0 / **1** | 358 / 0 / **1** |
| organizations total / unconfirmed / with no confirming nomination | 8 / 0 / 0 | 13 / 0 / 0 |
| factions total | **0** | **0** |
| alliances total / unconfirmed / with no confirming nomination | 2 / 0 / 0 | 4 / 0 / 0 |
| nominations total / `unconfirmed` true / `unconfirmed` NULL | 377 / 0 / 0 | 438 / 0 / 0 |
| **rows that would LOSE visibility and are not already hidden today** | **0** | **0** |

The single candidate with no confirming nomination is the deliberate negative control — the same row
that is unpublished with a NULL terms-of-use timestamp. `factions` are emitted by **no seed at all**, so
the faction predicate is covered by pgTAP and by nothing else; a green E2E run says nothing about it.

### The E2E spec census

| | measured | M11 predicted |
|---|---|---|
| spec files under `tests/tests/specs/` | **41** | 41 |
| importing from `tests/tests/fixtures/voter/` | **20** | 20 |
| anon-visibility-dependent (the disjunction) | **24** | 28 |
| naming `published` | **0** | 0 |

**24, not 28.** The disjunction is reported as measured; the prediction is recorded beside it and not
adopted.

### Every wrong-predicate run, with its failed-assertion count

Nine runs against the 14-assertion tracer file, seven against the 51-assertion grid.

| Variant | direction | failed | assertions reddened |
|---|---|---|---|
| `drop-confirmed` | over-permissive | 1 | 3 |
| `drop-nomination-helper` | over-permissive | 2 | 4, 5 |
| `drop-terms-of-use` | over-permissive | 1 | 6 |
| `drop-project-conjunct` | over-permissive | 3 | 2, 8, 14 |
| `drop-unconfirmed-conjunct` | over-permissive | 1 | 9 |
| `drop-transitive-conjunct` | over-permissive | 2 | 10, 12 |
| `equals-false-spelling` | over-strict (drops NULL rows) | 1 | 11 |
| `and-false` | over-strict | 3 | 1, 7, 11 |
| `inline-subselects` | raises | **14** | none — the file ABORTS at the first anon read with `infinite recursion detected in policy for relation "candidates"`. Zero `not ok` lines and fourteen un-run assertions, counted as fourteen failed under `CLAUDE.md`'s did-not-run rule, **not** as fourteen reddened |
| `grid-and-false` | over-strict | 10 | 1, 7, 11, 14, 24, 26, 30, 34, 44, 46 |
| `grid-drop-entity-conjunct` | over-permissive | 10 | 3, 4, 5, 28, 29, 32, 33, 36, 37, 45 |
| `grid-ungate-settings-and-joins` | over-permissive | 4 | 25, 39, 41, 42 |
| `grid-ungate-all-structure` | over-permissive | 18 | 15, 17, 19, 21, 23, 25, 27, 28, 29, 31, 32, 33, 35, 36, 37, 39, 41, 42 |
| `grid-drop-project-conjunct-everywhere` | over-permissive | 15 | 2, 8, 15, 17, 19, 21, 23, 25, 27, 31, 35, 39, 41, 42, 46 |
| `grid-and-false-everywhere` | over-strict | 16 | 1, 7, 11, 14, 16, 18, 20, 22, 24, 26, 30, 34, 38, 40, 44, 46 |
| `grid-drop-transitive-conjunct` | over-permissive | 3 | 10, 12, 43 |

**Coverage, stated as measured: 45 of the 51 assertions were observed red under at least one variant.**
The six that were not are assertion 13 — the `lives_ok` no-recursion standing property, which *aborts*
rather than reddens under the only variant that can move it — and assertions 47 through 51, the four
structural absences and the invariant, which read the catalogue and which **no predicate variant can
move**. Assertion 48's regex was instead proven to fire by a direct measurement against exactly the
construction it exists to catch (see deviation D-6).

### The pgTAP estate

| file | ordinal | declared `plan()` before | after |
|---|---|---|---|
| `16-anon-visibility.test.sql` | **16** (derived, lowest free ≥ 12) | — | **51** |
| `03-anon-read.test.sql` | 03 | 59 | **59** (unchanged — the repairs were additive fixture rows and three corrected description strings) |
| `07-rpc-security.test.sql` | 07 | 31 | **31** (unchanged — only the statements that put the database into the state § 9 measures) |
| `00-helpers.test.sql` | 00 | 9 | **9** |
| **whole estate** | 18 files | **654** | **705** |

No assertion was deleted. Per-file assertion-call counts: `00-helpers` 9 → 9, `03-anon-read` 59 → 59,
`07-rpc-security` 31 → 31. Exactly **three** description strings changed, all three of them the ones
that called a now-gated table *always readable*.

### The three helper timings

Measured over 2000 calls each, on the same claim and the same seeded database
(`yarn db:reset-with-data`, 328 candidates / 377 nominations):

| helper | per 2000 calls | mean per call |
|---|---|---|
| `project_open_for_voters` | 4.538 ms | **0.0023 ms** |
| `entity_has_confirmed_nomination` | 107.801 ms | **0.0539 ms** |
| `nomination_entities_confirmed` | 122.676 ms | **0.0613 ms** |

**No index was added** for `open_for_voters`, `confirmed` or `unconfirmed` — the prohibition is explicit
and the read plans these predicates produce have not been profiled at scale. The figures are handed to
162-14 and 162-16, which read the same predicates against larger estates.

`yarn db:lint:sql` exits 0 with two **pre-existing** warnings, unchanged by this diff: foreign keys
without indexes on `constituency_group_constituencies.constituency_id` and
`election_constituency_groups.constituency_group_id`. Neither is on the path the new join-table
predicates take (they probe `constituency_groups` by primary key).

### The gate chain and the E2E suite

Each exit status read **directly**, never through a pipe.

| gate | exit |
|---|---|
| `yarn typecheck` | **0** |
| `yarn lint:check` | **0** |
| `yarn format:check` | **0** |
| `yarn test:unit` | **0** |
| `yarn workspace @openvaa/supabase test:db` | **0** — 18 files, 705 assertions, PASS |
| `yarn db:lint:sql` | **0** — 0 errors, 2 pre-existing warnings |
| full E2E suite | **0** |

**E2E: 155 passed / 0 failed / 0 did-not-run / 0 flaky / 0 skipped.** Preflight failures 0, preflight
successes 1. Run directory: `tests/e2e-runs/162-08-anon-visibility/`. Disk headroom checked before the
run: **55 GiB** (floor 20).

The live biconditional against a rebuilt seeded database, after the suite:

- nominations visible to anon whose linked **candidate** is not: **0**
- nominations visible to anon whose linked **entity of any type** is not: **0**
- visible to anon — nominations **377**, candidates **327 of 328**, organizations **8**, app_settings
  **1**, elections **1**. Both sides non-empty, so the zero is a measurement and not an artefact.

---

## Deviations from Plan

Thirteen defective gates found in this plan's own text and repaired in place. The plan predicted
defects and named the shapes; it did not name these instances. **Every figure below is measured; none
is the plan's prediction where the two disagree.**

### D-1 [Rule 3 — blocking] Probe B's gate is ordered before anything populates the database

- **Found during:** Task 1.
- **Issue:** Probe B requires `elections` to be non-empty, and the verify block that rebuilds and seeds
  the database (`yarn db:reset-with-data`) is the block *after* it. On the tree as found, the probe
  returned `inline=0 secdef=0 total=0` and the plan's own `fails_when` classes that as vacuous.
- **Fix:** ran `yarn db:reset-with-data` before the probe. The probe then reproduced M2 exactly.
- **Commit:** none — Task 1 modifies no tracked file.

### D-2 [Rule 1 — bug] The `nominations?_total=0` emptiness guard could never fire

- **Found during:** Task 1.
- **Issue:** the plan's `CENSUS()` function emits `nom_unconfirmed_true=` and `nom_unconfirmed_null=`
  and **no nominations total at all**, while the gate greps for `nominations\?_total=0`. A gate matching
  a line the instrument never prints is the "check that cannot fail" class this phase keeps finding.
- **Fix:** added `projects_total=`, `nominations_total=` and a per-table `_no_nomination=` line to the
  census, and checked `candidates_total`, `organizations_total` and `nominations_total` explicitly.

### D-3 [Rule 2 — missing critical functionality] The `losing_visibility` census omitted the `confirmed` conjunct

- **Found during:** Task 1.
- **Issue:** the halt condition is *"any entity row that would lose visibility"*, but the query counted
  only rows lacking a confirming nomination. An entity carrying `confirmed = false` would have gone dark
  in the voter application with the census still reporting zero — the exact failure the halt exists for.
- **Fix:** added `NOT <table>.confirmed OR …` to all four arms. Result is still **0** on both databases,
  so the halt condition holds on a gate that can now actually detect the state.

### D-4 [Rule 1 — bug] Probe C is in the acceptance criteria and in no verify block

- **Found during:** Task 1.
- **Issue:** the acceptance criteria require *"Probe C raising no error, with both counts recorded"*;
  no `<automated>` block runs it. The join-table delegation is an M3-shaped construction that the plan
  itself says is "not being taken on reasoning" — and nothing measured it.
- **Fix:** wrote and ran Probe C, with a non-empty floor on both counts so it cannot pass vacuously.
  Result: no error, groups = 1, join rows = 5 of 5.

### D-5 [Rule 1 — bug] Task 3's `REST -eq 11` is arithmetically wrong and fails a correct implementation

- **Found during:** Task 3.
- **Issue:** the gate asserts *"Eleven anon SELECT policies still carry `published` at the end of this
  task"*, reasoning 13 − 2. But only **10** of the 13 carried the term to begin with (three were
  ungated `USING (true)`), so the correct answer after converting two is **8**.
- **Fix:** asserted 8 and recorded the before-count of 10 beside it. **The ratified figure was not
  moved to fit** — it was measured and found wrong.

### D-6 [Rule 1 — bug] `qual LIKE '%FROM public.nominations%'` is a check that cannot fail

- **Found during:** Task 3, and it is the most consequential of the thirteen.
- **Issue:** `pg_get_expr` renders a policy predicate against the **current** `search_path`. A genuine
  inline sub-select over `public.nominations` therefore renders as `FROM nominations`, and the plan's
  literal match on the schema-qualified spelling never fires. This gate appears **three times** — in
  Task 3's verify, in Task 4's verify, and as Task 5's structural assertion — and in every one of them
  it was unfalsifiable.
- **Measured, in a rolled-back transaction, against exactly the construction it exists to catch:**
  policy rendered as `EXISTS ( SELECT 1 FROM nominations n WHERE …)`;
  `qual LIKE '%FROM public.nominations%'` → **false**;
  `qual ~ 'FROM[[:space:]]+(public\.)?(nominations|projects)[[:space:]]'` → **true**.
- **Fix:** the regex form, in all three places, including the committed pgTAP assertion, with the
  measurement written into the assertion's own comment so the next reader does not restore the literal.

### D-7 [Rule 1 — bug] `join-table delegations = 2` counts 3 on a correct implementation

- **Found during:** Task 4.
- **Issue:** the gate counts anon policies whose `qual LIKE '%constituency_groups%'`. Once
  `anon_select_constituency_groups` is itself gated, its own predicate renders as
  `project_open_for_voters(constituency_groups.project_id)` — which contains the table name. Measured: 3.
- **Fix:** count only quals holding a **sub-select** over the table:
  `qual ~ 'FROM[[:space:]]+(public\.)?constituency_groups[[:space:]]'`. Measured: exactly the two join
  tables.

### D-8 [Rule 1 — bug] The NULL-safety grep is not comment-scoped and punishes the warning

- **Found during:** Task 3.
- **Issue:** the gate greps both schema files for `unconfirmed = false` / `unconfirmed IS FALSE` with no
  exclusion for comments. It fired on the two comments this plan **required** be written — the ones
  explaining that the equality spelling silently drops every NULL row. The gate as written pressures an
  implementer to delete the documentation of the hazard in order to go green.
- **Fix:** excluded comment lines, exactly as this repository's own `assert-comment-hygiene.mjs` is
  comment-scoped and for the same stated reason. Zero violations in code.

### D-9 [Rule 3 — blocking] Two of Task 4's gates are in direct contradiction

- **Found during:** Task 4.
- **Issue:** *"the retired phrasing must not survive anywhere in the file"* and *"a removed assertion
  description string fails the gate"* cannot both hold, because three of the `always readable`
  occurrences **are** description strings. Satisfying either gate trips the other.
- **Fix:** kept both intents with a narrower instrument — an **allow-list of exactly three** description
  strings, plus a per-file assertion-call count that may not decrease. Measured: exactly the three
  allow-listed strings changed; `00-helpers` 9 → 9, `03-anon-read` 59 → 59, `07-rpc-security` 31 → 31.
  Strictly stronger than the plan's gate everywhere except the three enumerated strings.

### D-10 [Rule 3 — blocking] Task 3's whole-estate gate is unreachable from Task 3's scope

- **Found during:** Task 3.
- **Issue:** the tracer converts `anon_select_nominations`, which is precisely what takes
  `07-rpc-security.test.sql` § 9 red (assertions 15, 20, 21 — the three positive controls). Its repair
  is assigned to Task 4, while Task 3's own acceptance requires the whole estate green.
- **Fix:** brought the **minimal** § 9 re-expression into Task 3 — open project B for voters and confirm
  its entities — keeping the then still-live `published` UPDATEs, because `anon_select_organizations`
  had not yet been converted. Task 4 removed them once it had been. The tracer therefore committed green
  without the expansion being pulled forward.

### D-11 [Rule 1 — bug] The live biconditional reads the literal `SET`, not a count

- **Found during:** Task 5.
- **Issue:** `psql -Atc "SET ROLE anon; SELECT count(*) …"` prints `SET` on its own line before the
  result. Without `-q` or `| tail -1` the captured value is `SET\n0`, and `test "$ORPHAN" -eq 0` fails
  with `integer expression expected` on a database that is in fact correct.
- **Fix:** `| tail -1` on every anon-role read. This is the same defect the orchestrator recorded for
  `BEGIN; …; ROLLBACK;`.

### D-12 [Rule 3 — blocking] The biconditional gate needs seeded data and nothing seeds it

- **Found during:** Task 5.
- **Issue:** the gate floors `nominations`, `candidates` and the closed-project count above zero, but by
  that point in the plan the database has been through `yarn db:reset` for the pgTAP estate and holds
  none of them. Same shape as D-1.
- **Fix:** `yarn db:reset-with-data` before the check, and the floors extended to `organizations`,
  `app_settings` and `elections` so the non-emptiness is proved on every table the biconditional spans.

### D-13 [Rule 1 + Rule 2] Three of the plan's assertions were not measuring, and its three variants could not have shown it

- **Found during:** Task 3, and this is the deviation the grid exists to produce.
- **Issue, part one — over-determined denials.** The plan's Test 8 (a nomination in a closed project)
  and Test 9 (an unconfirmed nomination) were written against rows hidden by **two** conjuncts at once:
  a nomination in a closed project linking a candidate in that same closed project fails both its own
  project term and the transitive term, which reads the same flag through the entity; a nomination whose
  only linked candidate has no *other* confirmed nomination fails both its own `unconfirmed` and the
  transitive term. Measured: **neither reddened under any wrong-predicate variant at all.**
- **Issue, part two — an incomplete variant set.** The plan's three ratified variants (drop the entity
  conjunct, drop the project conjunct, AND `false`) leave the terms-of-use conjunct and the `unconfirmed`
  conjunct untouched, so Tests 6 and 9 could not redden under any of them either.
- **Fix, part one:** both denials were rebuilt as **cross-project rows** — a nomination in the closed
  project linking the fully visible candidate of the open one, and an unconfirmed nomination linking that
  same visible candidate — so that exactly one conjunct is false in each. This is what the third argument
  on `entity_has_confirmed_nomination` exists for, used as a test instrument.
- **Fix, part two:** the variant set was taken from **3 to 16**, splitting the composite variants
  (`drop-confirmed` apart from `drop-nomination-helper`) and adding `drop-terms-of-use`,
  `drop-unconfirmed-conjunct`, `equals-false-spelling` — which reddens the NULL-row assertion and so
  measures M5 directly rather than by grep — and `inline-subselects`.
- **The ratified floors were not moved.** The plan requires ≥ 3 recorded runs at Task 3 and ≥ 5 by Task
  5; 16 were run and all 16 recorded. Coverage is reported as **45 of 51**, with the six exceptions
  named and each explained, rather than rounded up.

---

## What this plan did NOT do, by name

- **The authenticated half of ROADMAP criterion 5 is NOT satisfied.** Criterion 5 has three clauses.
  *A published project is readable by anyone* is now *a project open for voters is readable by anyone*,
  and **that clause alone** is implemented here, for the anon reader. *An unpublished project's
  non-entities are readable by any grantee* and *its entities by the grantees themselves and their
  parents* are **162-09, 162-10 and 162-11's**, and `is_child_nominee`'s read role lands there. The
  criterion must not be read as discharged.
- **No `TO authenticated` policy was written, edited or deleted.** Proven above.
- **No storage policy was touched.** `400-storage.sql` is byte-identical to the base SHA,
  `anon_select_public_assets` included. Note that `is_storage_entity_published()` in that file still
  reads the `published` column — 162-14's, by the outline.
- **The ten `published` columns, their partial indexes and `300-auth-tables.sql` are untouched.** The
  term left the policies; the columns leave at 162-16.
- **`nominations.unconfirmed` was not renamed, negated or given a `NOT NULL`.**
- **No dev-seed template, `seed.sql` row, bulk-import column list or E2E spec was changed.**
- **No index was added**, and no `package.json` dependency or devDependency line moved.

---

## Handoffs, by name

1. **`.claude/skills/database/rls-policy-map.md` → 162-17.** It is the existing inventory of the
   policies this phase rewrites and it went stale the moment this plan landed. Deliberately not swept
   here: 162-09 through 162-16 each rewrite more of the same inventory, so sweeping it eight times is
   churn. A **phase-level obligation**, not this plan's.
2. **The missing composite project/entity constraint on `nominations` → 162-12.**
   `nomination_entities_confirmed` deliberately does **not** require the linked entity to belong to the
   nomination's own project: no such constraint exists, and `07-rpc-security.test.sql` § 9 creates
   exactly that row on purpose as the control that makes its entity-join assertions non-vacuous.
   Tightening here would have voided an existing negative control. 162-12 owns this table's constraints.
3. **The narrowed role of `get_nominations`' trailing entity filter → 162-16.** Its comment says the
   filter exists because *"the nomination row itself has no published/ToU gate"*. After this plan the
   nomination row **does** have an entity gate, in Q3(A)'s full strength, so the filter is now defence in
   depth rather than the only guard. It is left in place: removing an application-layer filter in a plan
   whose gate is a visibility grid puts two changes in one commit.
4. **The voter frontend → the closed-project `app_settings` case.** See the section at the top.
5. **`factions` are covered by pgTAP only.** Zero faction rows exist across `seed.sql`, every dev-seed
   template and the E2E suite. A green E2E run must not be read as covering all four entity tables.

---

## Known Stubs

None. No hardcoded empty value, placeholder string, TODO or FIXME was introduced; no test was skipped;
every `<verify>` block was run, and the thirteen that were defective were repaired and re-run rather than
waived.

---

## Self-Check: PASSED
