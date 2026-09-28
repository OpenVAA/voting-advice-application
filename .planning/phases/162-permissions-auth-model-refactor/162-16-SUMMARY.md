---
phase: 162-permissions-auth-model-refactor
plan: 16
subsystem: supabase-schema
tags: [rls, anon-visibility, schema-deletion, dev-seed, pgtap, skill-docs]
status: complete
requires:
  - 162-15 (the role table, both enums and the shims out of 300-auth-tables.sql)
  - 162-08 (the thirteen anon predicates written in their end state, with no publication conjunct)
  - 162-07 (projects.open_for_voters; confirmed on the four entity tables)
  - 162-12 (nominations.confirmed, D-11c's polarity flip)
  - 162-13 (the confirmation column moved INTO the UPDATE allow-list)
provides:
  - "one mechanism for public visibility: section 3.4's all-of rule, with no second answer anywhere in the tree"
  - "an anon-visible-row-set fingerprint instrument, rekeyed onto external_id and proven deterministic across rebuilds"
  - "four documents that no longer instruct a future author to rebuild the retired mechanism"
affects:
  - apps/supabase/supabase/schema/
  - apps/supabase/supabase/tests/database/
  - packages/dev-seed/
  - packages/supabase-types/
  - .claude/skills/database/
  - .agents/code-review-checklist.md
tech-stack:
  added: []
  patterns:
    - "identity proven by an md5 fingerprint of the anon-visible row set per table, on two independently rebuilt databases, with the instrument first made to fail in both directions by three planted faults"
    - "a negative control's predicate is RE-EXPRESSED against the replacement flag, never dropped; dropping widens what it counts"
    - "an assertion whose SUBJECT is removed is RE-POINTED at a derived still-protected column, never deleted"
key-files:
  created: []
  modified:
    - apps/supabase/supabase/schema/300-auth-tables.sql
    - apps/supabase/supabase/schema/302-rls.sql
    - apps/supabase/supabase/schema/303-column-grants.sql
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/dev-seed/src/supabaseAdminClient.ts
    - packages/dev-seed/src/template/permittedKeys.ts
    - packages/supabase-types/src/column-map.ts
    - .claude/skills/database/extension-patterns.md
    - .claude/skills/database/schema-reference.md
    - .claude/skills/database/SKILL.md
    - .agents/code-review-checklist.md
decisions:
  - "Q1 = q1-delete-file was NOT executed literally: D-38 measured its premise false, and 300-auth-tables.sql is KEPT because it declares public.grants"
  - "Q2 = q2-rename-all; the citation sweep found the binding list EMPTY, so every description string naming the retired mechanism was renamed"
  - "Q3 = q3-prescriptive-only; the policy inventory is deferred to 162-17 with the figure 12"
  - "replacement-subject = external_id, derived from the un-granted UPDATE set on both covered entity tables"
metrics:
  duration: ~4h
  completed: 2026-09-17
actuals:
  tokens: 57000
  tasks: 6
  commits: 4
  plan_head_before: 6e1415f4fb30361abd032fa70b9cf1a7e9fdd3e6
---

# Phase 162 Plan 16: Delete the Retired Per-Row Visibility Mechanism Summary

Ten publication columns and **five** partial indexes — not the documented ten — out of the declarative
schema, the seeder's publication default out whole, the pgTAP estate re-expressed with no assertion lost,
and four documents corrected so no future author is told to rebuild it; proven by an `md5` fingerprint of
the anon-visible row set that is byte-identical on two independently rebuilt databases.

`300-auth-tables.sql` **still exists and still declares `public.grants`** — the ratified O-3(a) was not
executed literally, because D-38 measured its premise false.

---

## The derived populations, each beside the figure § 11.6 states

| § 11.6 item | Brief's figure | **Measured** | Disposition |
|---|---|---|---|
| Columns out of the declarative schema | 10 | **10** | Removed; M1 confirmed by three sources |
| Partial indexes out of the declarative schema | 10 | **5** ⚠ | Removed; **fourth corrected census of this phase** |
| The term out of every anon policy | "every" | **0 left** | Asserted absent; no predicate edited |
| `303-column-grants.sql` comment occurrences | 2 comments | **7 occurrences** | Derived, then swept to 0 |
| `permittedKeys.ts` entries | — | **11** (10 `TABLE_COLUMNS` + 1 doc note) | Swept to 0; compiler-enforced |
| `dev-seed` template files | "templates" | **1 of 40**, comment only | Comment rewritten |
| `seed.sql` occurrences | named as work | **0** ⚠ | Measured absence |
| Bulk-import RPC column lists | "column lists" | **0 in SQL** ⚠ | Measured absence; resolves to the TS mirror + the seeder default |
| Adapter selects | "the adapter's selects" | **0** ⚠ | Measured absence; typecheck is the instrument |
| E2E specs that publish rows | "a large share" | **0 of 41** ⚠ | Measured absence; resolves to one `bulkImport` branch |
| pgTAP estate | not in § 11.6 | **24 files globbed, 22 naming it, 173 occurrences** | Swept; 3 re-pointed |
| `column-map.ts` identity entry | — | **1** | Removed |
| dev-seed negative-control fixtures | — | **4 files × 2 rows = 8 literals** | Removed |
| Prescriptive documents | — | **4 files, 36 occurrences** | Swept |
| English-language occurrences | ≥ 20 across ≥ 14 files | **55 across 35 files** | **All byte-identical to the base SHA** |

Per-file occurrence deltas, measured:

| File | before | after |
|---|---|---|
| `300-auth-tables.sql` | 22 | **0** (111 → 56 lines) |
| `302-rls.sql` | 24 | **1** (one deliberate quotation of the retired predicate) |
| `303-column-grants.sql` | 7 | **0** |
| `permittedKeys.ts` | 11 | **0** |
| `supabaseAdminClient.ts` | 6 | **0** |
| `column-map.ts` | 1 | **0** |
| `extension-patterns.md` | 10 | **0** |
| `schema-reference.md` | 12 | **0** |
| `SKILL.md` | 12 | **5** (its policy-inventory sections, deferred to 162-17) |
| `.agents/code-review-checklist.md` | 1 | **0** |
| pgTAP estate | 173 | **20** (11 live absence assertions, 7 history comments, 2 their descriptions) |

### The four measured absences

Named as such rather than skipped, because "there was nothing to do" and "I did not look" produce the same
diff. **`apps/supabase/supabase/seed.sql`** — zero column occurrences; its one occurrence of the word is
D-14's own *"no database has been published"* at line 35, and it is on the allow-list. **The bulk-import
RPC column lists** — `501-bulk-operations.sql` builds its insert list from `jsonb_each(p_item)` and names
the word zero times. **The adapter's selects** — zero across `apps/frontend/src`. **The E2E specs** —
zero of 41 tracked spec files; the publication of every seeded row happened in one `bulkImport` branch.

### The partial-index correction — this phase's FOURTH corrected census

After D-03 (storage), D-16 (`election_type`) and D-25 (claim readers). § 11.6, brief § 5 and the plan
outline all say **ten** partial indexes. Three independent sources say **five**: the declarative schema
(5 `CREATE INDEX` statements, all in `300-auth-tables.sql`), `pg_indexes` on the applied database
(`idx_{elections,candidates,organizations,questions,nominations}_published`), and
`schema-reference.md`'s own sentence *"on elections, candidates, organizations, questions, nominations
(5 tables)"*. The five publication-bearing tables that never carried one: `question_categories`,
`constituencies`, `constituency_groups`, `factions`, `alliances`. Every gate was written as *falls to zero
from a recorded positive baseline*, which is true whichever number is right.

**A fifth M-fact was also found false. M10** predicts twelve pgTAP files and ~122 occurrences — a
*pre-phase* figure taken at `72fd11e69`. Measured at `6e1415f4f`: **24 files exist, 22 name the column,
and there are 173 occurrences**. Waves 1–5 added files 12 through 24 and the estate grew by half again.
Every file reference in this plan was derived by glob, so the growth cost nothing.

---

## What 162-08 through 162-14 had already done, asserted rather than edited

`pg_policies` for schemas `public` and `storage` at Task 1: **102 policies** (87 public, 15 storage).
Policy expressions still naming the retired column: **0 in `public`, 0 in `storage`**. The discharge is
therefore verified, not trusted, and this plan edited no predicate. The same 102-line record was asserted
byte-identical at the tracer and again after the expansion.

---

## Task 2's answers

| Question | Ratified option id | Executed |
|---|---|---|
| Q1 — `300-auth-tables.sql` | `q1-delete-file` | **NOT literally — see deviation D2** |
| Q2 — the description strings | `q2-rename-all` | as ratified, after the citation sweep |
| Q3 — the document boundary | `q3-prescriptive-only` | as ratified |

- **`replacement-subject` = `external_id`** (derived, not ratified). It is in the un-granted
  authenticated-UPDATE set on **both** `candidates` and `organizations`; it is **not** the confirmation
  column, which 162-13 moved *into* the allow-list on all four entity tables — an assertion re-pointed
  there would observe a success where its description says a refusal; and it is the **only** member of the
  un-granted set that `09-column-restrictions.test.sql` did not already assert, so the re-pointing adds
  distinct coverage instead of duplicating an assertion two lines away. It is also a real tamper vector:
  `external_id` is the per-project idempotency key `bulk_import` upserts on. Verified un-granted on
  `factions` and `alliances` too, which is what let it replace the retired member of the two structural
  exclusion sets.
- **`deferred-inventory-occurrences` = `12`** — `grep -ow 'published' .claude/skills/database/rls-policy-map.md | wc -l`.
  Asserted **unchanged in both directions** at Task 5, so the boundary is shown to have held rather than
  claimed to have.

### The Q2 citation sweep — the binding list is EMPTY

The sweep is the precondition, and it was run before any rename. Instrument: for each of the **63 distinct
quoted strings** containing the token, `git grep -lF` over the whole tree **including `.planning/`**,
excluding only the pgTAP estate itself. **14 strings were found mentioned outside the estate, and every
one of them is inside a `.planning/` document** — `162-07-PLAN.md`, `162-08-PLAN.md` (2), `162-11-PLAN.md`
(3), `162-15-SUMMARY.md`, `162-16-PLAN.md` (3, this plan's own text), `156-PATTERNS.md` /
`156-RESEARCH.md`, and `260524-l1t-PLAN.md` (5).

**None binds.** The `nominations_election_round_check` precedent is a name a *live artefact* uses as a
handle — another test cites that constraint by name in `throws_ok`, so renaming it would redden a live
assertion. A planning document that quotes a description in prose — historically, or as here while
describing the very rename being performed — is a record, not a handle: nothing reads it at run time.
**No live, non-`.planning/` artefact cites any of the 63 strings**, so the list of strings that must stay
unchanged is empty, recorded explicitly as the ruling requires.

**One class of description string was deliberately NOT renamed, and it is the opposite case.** Two strings
describe *live absence assertions* — `'no TO anon SELECT policy in schema public mentions published'` and
its sibling in `16-anon-visibility.test.sql` — whose SQL literal **is** the token (`LIKE '%published%'`).
Renaming them would make the description disagree with the statement. Q2's rationale is that a label
must not assert a deleted mechanism is real; these assert that it is **absent**, which is the reverse.
Eleven such live literals survive across six files and are the evidence, not the residue.

---

## The instrument, and the three planted faults

**Task 1 fault counts (on the repaired instrument), against the `e2e/base` baseline of 9 non-vacuous cells:**

| Fault | Direction | `moved=` | Observed |
|---|---|---|---|
| A — `projects.open_for_voters = false` | too strict, project scope | **9** | every non-vacuous fingerprint collapsed to `EMPTY` |
| B — one candidate `confirmed = false` | too strict, one row | **2** | candidates 28 → 27 **and nominations 59 → 58** |
| C — unconditional `TO anon` SELECT on candidates | too loose | **1** | candidates 28 → **31**, the whole table |

Fault B's second line is § 3.4's **transitivity observed rather than predicted**: the conjunction runs
across every entity a nomination links, so un-confirming one entity withdraws its nomination as well.
Fault C is the widening direction — the one no read test in this repository reports, because a passing
read test cannot distinguish *correctly visible* from *should have been hidden*.

**Task 3's two-direction counts against the unchanged tree:** the six removal checks (1, 2, 7, 8, 9, 10)
were observed **RED** and the five invariants (3, 4, 5, 6, 11) **GREEN** before any edit was made.

---

## The anon fingerprint comparison

| Database | non-vacuous cells | un-keyable rows | Result |
|---|---|---|---|
| `yarn db:reset-with-data` (default template) | 9 of 10 | 0 | **byte-identical to the pre-change baseline** |
| `yarn db:reset` + `yarn db:seed --template e2e/base` | 9 of 10 | 0 | **byte-identical to the pre-change baseline** |

`factions` is the vacuous cell on every seed (162-07b), excluded by name from the moved/unmoved
arithmetic. Taken at the tracer, again after the full expansion, and again after the E2E suite.

---

## The pgTAP estate

**Declared numeric plan total: 969 before, 969 after. Executed: 978 PASS before, 978 PASS after.** No
file's count fell. (`00-helpers.test.sql` declares `no_plan()`, not a numeric `plan()`; it contributes the
9-assertion difference at run time.)

| Class | count | Treatment |
|---|---|---|
| fixture-insert | 41 | 55 INSERT blocks rewritten structurally; the A-visible / B-hidden polarity is carried by `open_for_voters` and `confirmed`, which the same inserts already state |
| query-predicate | 51 | re-expressed or dropped, **stated per assertion** — see below |
| description-string | 41 | renamed per Q2, minus the two live-absence descriptions |
| comment (prose) | 40 | corrected, or left as explicit history |

**Per assertion, because dropping a filter widens what an assertion counts and that is a change in what it
measures.** Every *"anon can SELECT published X"* **DROPPED** its `WHERE published = true` filter: the
policy under test already decides it and the claim is unchanged. Every paired *"anon cannot see
unpublished X"* was **RE-EXPRESSED, never dropped** — against `confirmed = false` on the four tables that
carry the flag, and against project B's id on the five that do not (their only gate is the project flag).
`07-rpc-security.test.sql`'s two *"publish project B"* `UPDATE`s became one that opens project B to
voters, preserving exactly what that section needs: a project predicate as the only discriminator.

**Five assertions had the retired column as their SUBJECT, and none was deleted.** Three are M11's
column-grant assertions, re-pointed at `external_id` with their `throws_ok` / `lives_ok` shape and their
expectation of a refusal intact; 16 refusal assertions survive in `09-column-restrictions.test.sql`, so
both covered tables keep a negative control for the allow-list mechanism. **Two more were not in M11 and
would have weakened silently**: `15-visibility-flags.test.sql` and `19-entity-immutability.test.sql` each
carry a three-column structural exclusion `IN`-list with the retired column as a member. Removing the
column would have left them counting over a name that matches nothing — still green, one third less
discriminating. The member was **replaced** with `external_id`, measured un-granted on all four entity
tables, so each set keeps three live members.

---

## Deviations from Plan

### D1 — [Rule 1 — Bug] The plan's central instrument could not express identity, and was repaired before it was believed

**Found during:** Task 3, at the first two-database comparison after the tracer edit.

**Issue.** The plan specifies the fingerprint as `md5(string_agg(id::text, ',' ORDER BY id))` — the
ordered **row id** list. Measured: dev-seed lets PostgreSQL generate row ids (`gen_random_uuid()`), so
**every id differs on every rebuild**. The comparison came back with all nine non-vacuous cells moved on
**both** databases after a change that moved no row: every `count` identical, every hash different. An
instrument that cannot survive a rebuild cannot express *"the same rows on two independently rebuilt
databases"*, which is the single thing this plan asks of it. Left unrepaired it would have produced a
permanent, unexplainable red — or, far worse, been "fixed" by relaxing the gate to counts, which is
exactly the count-only comparison the plan's own design table rejects.

**Fix.** Rekeyed onto `external_id`, which dev-seed writes deterministically, plus a per-table
`nullext=<n>` validity guard so a table holding an anon-visible row without an `external_id` reports its
own invalidity instead of a false match. Measured: `nullext=0` on all ten tables of both databases, so
the key covers the whole visible set. **A determinism probe was then added and run** — two independent
rebuilds of the *same* template now produce byte-identical fingerprints. The id-keyed form had no such
probe and would have failed it. The three planted faults were re-run on the repaired instrument and moved
9 / 2 / 1 as before, so its power to detect both directions is unchanged.

To take the corrected baselines honestly, the tracer diff was written to a patch file, the tree restored
to the base SHA, both databases rebuilt and re-fingerprinted, and the patch reapplied — rather than
comparing against baselines taken with the broken key. **No `git stash` was used** (the stack is shared
across worktrees).

**Files:** `${TMPDIR}/162-16/anon-fingerprint.sql` (evidence, not committed).

---

### D2 — [Rule 4 — architectural, resolved by prior operator ruling D-38] `300-auth-tables.sql` was KEPT, against the ratified Q1

**Found during:** Task 1, and already measured by the orchestrator at `a2e82645e`.

**Issue.** Task 2's `<ratified>` block records **O-3 = (a), delete the file**, justified on § 11.4: *"a
schema file is where a concern is explained and enforced, and a file with no concern left is not one."*
That premise is false as measured. O-3 was written before 162-03 executed, and **162-03 declared
`public.grants` in this very file**. The file did not empty; it changed subject.

**Measured at `6e1415f4f`, 111 lines:** `CREATE TABLE public.grants` with
`grants_user_scope_target_role_key` (`UNIQUE NULLS NOT DISTINCT`) and two named CHECKs;
`idx_grants_scope_target`; `ENABLE ROW LEVEL SECURITY`; **`GRANT USAGE ON SCHEMA public TO
supabase_auth_admin`, the only such statement in the schema — removing it issues every token with no
authority at all**; `GRANT ALL ON TABLE public.grants TO supabase_auth_admin`; both `grants` policies;
the blanket `REVOKE`; and this plan's ten column statements and five partial indexes.
`CREATE TABLE public.grants` appears in **exactly one** file in `schema/` — this one.

**Resolution.** Option (a)'s own stated condition is unmet, so it does not apply on its terms. This is not
an overrule of the operator; it is the ruling's precondition failing a measurement — the same class of
defect every plan in this phase has found in its own text. The file's real job here was done (columns and
indexes out) and the file kept, with a header recording that **the filename is older than the subject**,
so the next reader is not misled by its history.

**The `Depends on` population was derived rather than assumed** — three headers name the file:
`301-auth-functions.sql:3` *(grants table)* and `502-email-helpers.sql:4` *(grants)* stay **correct and
unchanged**; `303-column-grants.sql:11` named it *(published column)*, and that parenthetical retires with
the column — an edit this plan owed anyway, independent of Q1. A dangling-reference gate confirms every
`Depends on` in `schema/` resolves to a file that exists.

---

### D3 — [Rule 3 — Blocking] Three verify-block instruments in the plan could not have passed, and were repaired in place

**a) `for M in $MOVED` iterates once, not three times.** The harness shell is zsh 5.9, which does **not**
word-split an unquoted `$VAR` (it does split an unquoted `$(...)`). Probed directly. Task 1's third verify
block does `MOVED="$(... | cut -d= -f2)"` then `for M in $MOVED; do test "$M" -gt 0 ...`, which hands
`test` a three-line string, raises *"integer expression expected"*, and fires the halt branch **against
correct evidence**. A false-red gate. Repaired by splitting through a command substitution.

**b) `psql -Atf` emits `BEGIN` / `SET` / `ROLLBACK` command tags into the fingerprint file.** The plan's
`grep -vc '|EMPTY$'` counts those three as non-vacuous cells, inflating every live-cell count by 3 and so
weakening the floor of 8 it is checked against. Repaired with `psql -q`, and the vacuity marker moved to
`'|EMPTY|'` once the `nullext` guard was appended (D1).

**c) `test -n "$A" || exit 1` fires on `00-helpers.test.sql`.** Task 4's plan-count verify requires every
globbed file to declare a numeric `plan()`. `00-helpers.test.sql` declares `no_plan()` by construction —
it is the fixture file and asserts nothing of its own — so the gate hard-fails on a correct tree. Repaired
by guarding on whether the ledger recorded a numeric plan for that file, which is how Task 3's version of
the same check was already written.

**Related, and the reason this matters:** the documented `"$VAR:path"` zsh history-modifier trap fired
once during measurement (`$BASE:apps/...` expanded via `:a`), producing `fatal: ambiguous argument` and a
**silent `0`** from the piped `grep -c` behind it. Braced and re-measured; the real figures are in the
per-file table above.

---

### D4 — [Rule 1 — Bug] Check 9's grep is line-scoped and missed multi-line INSERT column lists

**Found during:** Task 3, after the first tracer edit, by the pgTAP run rather than by the grep.

**Issue.** Task 3's Check 9 is `grep -nw published *.test.sql | grep -i candidate`. Two problems, in
opposite directions. It is **too wide**: it matches any line carrying both words, including nominations
inserts keyed on `candidate_id` and predicates on `elections` in a file named `02-candidate-self-edit` —
pulling most of Task 4's work into the tracer and destroying the slice. And it is **too narrow**: a
pretty-printed `INSERT INTO candidates (\n id,\n ... published,\n ...)` puts the column on a line that
does not contain the word *candidates* at all, so the grep reports zero while the statement is broken.
`16-anon-visibility.test.sql` (7 rows) and `05-organization-admin.test.sql` (1 row) were both missed;
`supabase test db` then **ABORTED** two files — D-37's exact signature, scored as `PLAN − PASSED`:
`05` ran 12 of 20 (8 broken), `16` ran **0 of 52** (52 broken), with **zero `not ok` lines emitted**.
Raw TAP via `psql -f` named the cause in one line: *column "published" of relation "candidates" does not
exist*.

**Fix.** Check 9 repaired to its stated intent — *a statement about `candidates`* — and the estate swept
with a **paren-aware structural rewriter** rather than a line grep: it parses each `INSERT` column list,
finds the ordinal of the column, and removes that element from the column list and from every `VALUES`
tuple, handling nested parens, `'...'` with `''` escapes, `$$…$$` literals and `--` comments. 55 blocks
rewritten across 12 files. One `INSERT … SELECT` (`23-nominations-write.test.sql:429`) has no `VALUES`
clause and was handled by hand.

---

### D5 — [Rule 2 — Missing critical correctness] SKILL.md's sweep was widened beyond the literal instruction

The ratified Q3 says *"correct the common-columns rule and nothing else"* in `SKILL.md`. Applied
literally, that would have left **§ Schema Conventions 9** — *"Add these indexes for every new content
table: … Partial index on `published WHERE published = true`"* — standing. That is the exact twin of
`extension-patterns.md`'s numbered step 6, which the same ruling deletes, and it is an **instruction**,
not a description: a future author following it creates an index on a column that does not exist. Leaving
it would have satisfied the letter of Q3 while leaving T-162-16-05 open in the other half of the same
sentence.

Swept in addition, all within Q3's *prescriptive and column-fact* class and none of it the deferred policy
inventory: the indexing-strategy step; the `create_test_data()` fixture description (a fixture **this
plan changed**); and the column-grant protected lists, which were **doubly stale** — they still named
`organization_id`, removed from `candidates` by 162-07b. `SKILL.md`'s five surviving occurrences are all
in its policy sections (the 5-policy pattern, the storage-policy description) and are 162-17's.

---

### D6 — [Rule 2] The live half of the seeder's retired caution was MOVED rather than deleted with it

The four-paragraph caution block existed to explain the publication default, so the plan removes it as one
unit with the default. But one of its paragraphs — ⚠ *this default is **not sufficient for candidates***,
with its companion ⚠ *do not "fix" that by stamping `terms_of_use_accepted` here, because a default at
this layer reaches `e2e/base`'s deliberately unaccepted negative-control rows* — is about a hazard that
**outlives** the publication column: the confirmation default inherits the identical asymmetry. Deleting
it with its block would have removed the only in-tree warning against a change that blanks the voter
application's candidate list under a green unit suite. Both paragraphs, plus the standing
*other-tables-not-audited* caution, now sit on the confirmation block that inherits the problem.

---

## Three things that did not leave with the term

- **`terms_of_use_accepted`** is still emitted by `defaults/candidates-override.ts` and by `e2e/base`, and
  is still a conjunct of `anon_select_candidates`. Only the comment above it was rewritten, against the
  predicate that now exists: the confirmation auto-default supplies the confirmation term and
  `ensureProject` the project term, and **neither** supplies this one.
- **`503-entity-rpcs.sql`'s trailing entity-join filter** is byte-identical: **zero non-comment changed
  lines** against the base SHA, asserted by a SHA-pinned diff. Its comment now records the narrowing
  162-08 asked to be recorded — since `anon_select_nominations` carries the transitive conjunct, the class
  this filter still catches is smaller, but **not empty**, because the terms-of-use clause is a
  candidates-policy term that no nominations predicate restates.
- **Both confirmation defaults** in `SupabaseAdminClient.bulkImport` (162-07's entity set, 162-12's
  nominations set) survive, asserted in the same assertion that checks the publication default is gone —
  because the danger is deleting the wrong two of three.

---

## Verification

| Gate | Result |
|---|---|
| `information_schema.columns` publication columns | **10 → 0**, a decrement from a recorded baseline ≥ 10 |
| `pg_indexes` publication indexes | **5 → 0**, from a recorded positive baseline |
| `ADD COLUMN published` / `DROP COLUMN` / `DROP INDEX` in `schema/` + `migrations/` | **0 / 0 / 0** |
| `migrations/` `.sql` files | **1** |
| `yarn assert:schema-migration-parity` | green |
| `Depends on` headers resolving to an existing file | all |
| anon fingerprint, default database | **byte-identical**, 9 live cells, 0 un-keyable |
| anon fingerprint, `e2e/base` database | **byte-identical**, 9 live cells, 0 un-keyable |
| `pg_policies` (`public` + `storage`) | **byte-identical, 102** |
| pgTAP declared plan total | **969 → 969**; executed **978 PASS** |
| `yarn typecheck` / `typecheck:tests` / `lint:check` | green (exit status read directly, never through a pipe) |
| `yarn test:unit` | green — 2423 tests, 151 files |
| `yarn workspace @openvaa/supabase test:db` | **PASS**, 24 files, 978 tests |
| `yarn db:lint:sql` | green |
| `yarn assert:rpc-nullability` + `RPC-NULLABILITY.md` hash | green **and** artifact byte-identical (`38ddcfdc…`) |
| allow-listed English occurrences | **55 across 35 files, all byte-identical to the base SHA** |
| scope check against the base SHA | 40 files changed, **none outside the declared set** |

### E2E — the cardinal gate

**155 passed / 0 failed / 0 did-not-run.** Run directory `tests/e2e-runs/162-16-published-removal/`.
From `results.json` via `env-posture.txt`: `observed_expected=155`, `observed_unexpected=0`,
`observed_flaky=0`, `observed_skipped=0`, `observed_retries=0`, `observed_workers=6`,
`observed_duration_ms=633326` (**633 s, inside the phase's 627–651 s baseline**).
Environment posture: `load_at_start=30.39/19.06/13.83`, `cpu_count=14`, `containers_running=24`,
`dirty_files=0`, `frontend_port=5273`, `e2e_project_id=…0000e2`. Preflight: 1 success, 0 failures.

**Disk headroom measured and printed before the run: 64 GiB available** (`tests/e2e-runs/` at 6.9 G) —
checked first because an ENOSPC part-way through voids a run rather than failing it, and a voided run is
not evidence.

**Post-suite fingerprint.** The suite ran `--no-db-reset` and its per-family teardowns removed its own
`seed_`-prefixed rows, so it left the **default-template** corpus behind, not the `e2e/base` one the
plan's gate names. Comparing against the `e2e` baseline would therefore have failed for a reason with
nothing to do with this plan. Repaired by identifying which pre-change baseline the surviving corpus
matches: it is **byte-identical to `anon-default-before.txt`**. The `e2e/base` corpus was then re-seeded
and compared as well, so **both** baselines are exercised after the suite; both byte-identical, 9 live
cells each.

---

## Handoffs

1. **`.claude/skills/database/rls-policy-map.md` → 162-17, with its figure: 12 occurrences** of the
   retired publication column, deliberately unswept under C-10. Asserted unchanged in both directions, so
   the boundary is demonstrated rather than claimed. Its stated policy total (**97**) is also stale — the
   measured estate is **102**. `SKILL.md`'s five remaining occurrences belong to the same sweep.
2. **ROADMAP criterion 5 and the PRESHIP-02 row still read *a published project is readable by anyone*.**
   After this plan the adjective has no referent in the schema. 162-02 corrected the ROADMAP entry in
   wave 0, before this deletion existed. This plan is prohibited from editing `.planning/` documents other
   than its own SUMMARY. **Also measured, and outside `.planning/`: `PRE-SHIP-REFACTORING.md:87,89`** carry
   the same wording — it is on the allow-list and byte-identical, and belongs to the same decision.
3. **`.agents/code-review-checklist.md` — flagged explicitly, and swept here.** It sits **outside**
   `.claude/skills/`, and `CLAUDE.md` binds every plan in this repository to it (*"Always check your code
   against the Code review checklist"*). A stale rule there is checked against **every future phase**, not
   merely read by an agent that happens to load the database skill. Its line 26 required every new content
   table to carry the retired column; it now says there is no such column and names § 3.4's rule instead.
4. **The `17-` ordinal collision (162-09, 162-11, 162-12)** resolved before this plan ran: the estate is
   contiguous `00`–`24` **with no `13-`** (162-15 retired `13-shim-parity.test.sql`). Recorded as observed
   rather than as an outstanding risk. Every file reference in this plan was derived by glob regardless.
5. **`test_user_roles()` does not exist and four documents still tell an author to call it** — 162-15
   renamed it to `test_user_grants()`. Out of this plan's class (Q3 is scoped to the publication column),
   logged to `deferred-items.md`, **not fixed**. Same trace class as M13, different subject.

### `user_roles` residue, re-derived at close

**16 files** name the term (the orchestrator's pre-dispatch survey measured 14; this plan added 2 — its
own header comment in `300-auth-tables.sql` and its regenerated mirror in `00001_initial_schema.sql`,
both recording that the filename is older than the subject).

| Classification | files | detail |
|---|---|---|
| **Residue** — stale, needs 162-17's sweep | **3** | `SKILL.md` (JWT-claims + helper sections), `rls-policy-map.md` (a table row, two footnotes, a two-policy block for a table that no longer exists), `schema-reference.md` (a table entry, an index entry, the hook description) |
| **Residue** — stale *prescriptive*, filed as deferred | **1** | `extension-patterns.md` — four `test_user_roles(...)` call sites that raise *function does not exist* |
| **Deliberate history / live evidence** | **12** | 6 pgTAP files (live absence assertions that `public.user_roles` is gone, that its two policies are gone by name, that `backfill_grants_from_user_roles` is gone at any signature; plus `set_test_retired_claim`, the one helper that constructs a retired-shaped token); 2 frontend tests (retired-shaped-token **negative controls** asserting the shape confers nothing); `requireAdminIdentity.ts:17` (docstring recording a past attack shape — **verified before being left**); `candidate-bank-auth-journey.spec.ts:170` (162-15's own comment recording the query was stale since 162-06 — **verified**); and this plan's two header comments |

Both files the orchestrator flagged as *probably deliberate* were inspected and confirmed deliberate. A
comment describing history is not a stale instruction.

---

## Known Stubs

None. No stub, placeholder, TODO or unwired data path was introduced.

---

## Self-Check: PASSED

- `apps/supabase/supabase/schema/300-auth-tables.sql` — **FOUND** (56 lines, still declares
  `CREATE TABLE public.grants`, 1 occurrence).
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` — FOUND (1 file in `migrations/`).
- `tests/e2e-runs/162-16-published-removal/` — FOUND (`results.json`, `env-posture.txt`, `stdout.log`,
  `html/`, `exit`, `preflight-successes`).
- `.planning/phases/162-permissions-auth-model-refactor/162-16-SUMMARY.md` — FOUND.
- Commits `9a39285d2`, `5a6c56178`, `9b69d4223` — FOUND in `git log`.
