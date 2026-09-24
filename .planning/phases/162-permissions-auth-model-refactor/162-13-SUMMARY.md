---
phase: 162-permissions-auth-model-refactor
plan: 13
subsystem: supabase-rls
status: complete
tags: [rls, permissions, user_can, entity-immutability, trigger, column-grants, pgtap]
requires:
  - '162-04 public.user_can(scope, target_id, permission), asked twice per statement at entity scope'
  - '162-04 public.grant_role_permissions -- the matrix the trigger consults and never restates'
  - '162-07 the confirmation column on all four entity tables, shipped INERT on the write side'
  - '162-10 the factions and alliances column-grant blocks (its task 2 Q2 = a), which is why block coverage measured 4 of 4 and not M2''s predicted 2'
  - '162-12 the fifth table block in 303-column-grants.sql, and the role-scope precedent in enforce_nomination_confirmation()'
  - '500-external-id.sql enforce_external_id_immutability() -- the in-tree analog this function copies'
provides:
  - 'public.enforce_entity_immutability() -- SECURITY INVOKER, role-scoped to the effective authenticated role, two rules in a fixed order'
  - 'four column-restricted BEFORE UPDATE FOR EACH ROW registrations, one per entity table, one function body'
  - 'the confirmation column inside the authenticated UPDATE allow-list on all four entity tables, its protection relocated to trigger rule 1'
  - 'two stable exception-message prefixes for 162-17 to assert verbatim'
  - 'apps/supabase/supabase/tests/database/19-entity-immutability.test.sql, 70 assertions (ordinal 19, derived)'
  - '303-column-grants.sql header paragraph stating what the file cannot express and naming the two triggers that carry those rules'
affects:
  - '162-16 (each entity block''s protected half is now the complement of an explicit grant list, so the publication strip is one comment line per block and no grant moves)'
  - '162-17 (inherits the two exception prefixes, the five-column protected set and the three-cell grid shape to widen across the matrix)'
  - '162-17 (documentation sweep: the 162-PATTERNS.md "No Analog Found" correction, and the three .claude/skills/database/ documents this plan deliberately did not edit)'
tech-stack:
  added: []
  patterns:
    - 'one trigger body, many tables, the per-table difference carried in TG_ARGV and compared through a generic JSONB record projection (D-21 made structural)'
    - 'column-restricted BEFORE UPDATE OF as a statement-level early exit, so the hottest write never enters the function'
    - 'a conditional authorization rule expressed as a trigger reading OLD, because neither a column grant nor a policy can correlate the old row with the new one'
key-files:
  created:
    - apps/supabase/supabase/tests/database/19-entity-immutability.test.sql
  modified:
    - apps/supabase/supabase/schema/011-validation-functions.sql
    - apps/supabase/supabase/schema/102-entities.sql
    - apps/supabase/supabase/schema/303-column-grants.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/02-candidate-self-edit.test.sql
    - apps/supabase/supabase/tests/database/09-column-restrictions.test.sql
    - apps/supabase/supabase/tests/database/15-visibility-flags.test.sql
decisions:
  - 'Task 2 Q1 = A (C-7): five protected name columns, the abbreviated display name deliberately excluded'
  - 'Task 2 Q2 = role scope approved (P-6): the rules bind the effective authenticated role and nothing else'
  - 'Task 2 Q3 = reduction approved (P-5): the confirmation column enters every UPDATE allow-list, its protection relocated to trigger rule 1'
  - 'the rule-order must-have was re-expressed: the caller it names is unreachable from ANY claim, because user_can derives permissions from the matrix rather than reading them from the token'
  - 'packages/supabase-types/src/database.ts is UNCHANGED by this plan: the Supabase type generator emits no function returning `trigger`'
metrics:
  duration: one session
  completed: 2026-09-17
commits: 4
plan_head_before: 17c04cae46543eec32eca3576e8516682c8fb1d7
actuals:
  tokens: 31000
  tasks: 6
  commits: 4
---

# Phase 162 Plan 13: Entity Immutability Trigger, Identity-Column Freeze, Column-Grants Reduction — Summary

A confirmed entity's name is now immutable to the entity user, still correctable by a holder of
`entity.edit_immutable`, and **still editable by the entity user while the entity is unconfirmed** —
three observed outcomes per protected column per table, carried by one `SECURITY INVOKER` trigger body
whose protected column set is a registration argument and whose text names no entity type.

## Task 2's three ratified answers

| Question | Answer | Source |
|---|---|---|
| **Q1 — which columns the freeze protects** | **(A)** — the single name column on three tables and the two personal-name columns on the fourth; the abbreviated display name stays editable | `162-CHECKPOINT-DECISIONS.md` § 8 item **C-7**, 2026-09-16 |
| **Q2 — which callers the rules bind** | **role scope approved** — the effective `authenticated` role only; not the service role, not the database owner | § 5 item **P-6** |
| **Q3 — the reduction and the blocks** | **reduction approved** — the confirmation column enters every UPDATE allow-list; the name columns stay; all four tables carry a block | § 5 item **P-5** |

## The protected-column population, as a derived per-table breakdown

Read from `information_schema.columns` on a rebuilt database, not from the plan's M1.

| Table | Protected name columns | Count | Abbreviated display column present |
|---|---|---|---|
| `organizations` | `name` | 1 | yes — deliberately **outside** the set |
| `candidates` | `first_name`, `last_name` | 2 | yes — deliberately **outside** the set |
| `factions` | `name` | 1 | yes — deliberately **outside** the set |
| `alliances` | `name` | 1 | yes — deliberately **outside** the set |
| **total** | | **5** | |

`short_name` exists on all four and is excluded on purpose: it is a display abbreviation rather than the
seeded identity, it is in today's self-edit grant on every one of the four, and neither sign-up method
asserts an abbreviation. A later reader who finds it editable should read that as a decision.

## The observed refusals proving trigger rule 1 replaces the retired privilege bar

**The bar that was retired, reproduced live before anything was changed** (Task 1,
`unexercisable-permission.txt`). An authenticated caller carrying a project-admin grant on the row's
project:

```
user_can(entity, <that candidate>, entity.confirm) = true
ERROR:  42501: permission denied for table candidates
```

The authority function answers **true** and the statement is refused anyway. The bar the confirmation
column had by omission from the allow-list refused **every** authenticated caller, the administrator the
phase declares may confirm included. That is what makes the reduction a fix rather than a weakening.

**The replacement, observed on all four tables.** With the column now inside the allow-list, the same
class of statement reaches the trigger, which refuses the entity grantee and admits the holder:

| Table | Entity grantee turning the flag **off** | Entity grantee turning it **on** | `entity.confirm` holder, either way |
|---|---|---|---|
| `candidates` | refused — `Entity confirmation requires the entity.confirm permission:%` | refused, same prefix | **allowed**, both directions, value read back |
| `organizations` | refused, same prefix | refused, same prefix | **allowed**, both directions |
| `factions` | refused, same prefix | refused, same prefix | **allowed**, both directions |
| `alliances` | refused, same prefix | refused, same prefix | **allowed**, both directions |

And the refusal is shown to be the **trigger's** rather than the privilege layer's, twice over — once per
covered table in `09-column-restrictions.test.sql` and once in the new file — by a paired assertion on the
SQLSTATE: `P0001`, not `42501`. Without that pair, a message assertion would still pass if the column had
quietly been left out of the allow-list.

**The name freeze, observed on all four tables:**

| Table | Entity grantee, **confirmed** row | Entity grantee, **unconfirmed** row | `entity.edit_immutable` holder, confirmed row |
|---|---|---|---|
| `candidates` (`first_name`) | refused — `Entity name is immutable once confirmed:%` | **allowed**, value read back | allowed, value read back |
| `candidates` (`last_name`) | refused, same prefix | **allowed**, value read back | allowed, value read back |
| `organizations` (`name`) | refused, same prefix | **allowed**, value read back | allowed, value read back |
| `factions` (`name`) | refused, same prefix | **allowed**, value read back | allowed, value read back |
| `alliances` (`name`) | refused, same prefix | **allowed**, value read back | allowed, value read back |

## The two stable exception-message prefixes, verbatim for 162-17

```
Entity confirmation requires the entity.confirm permission:
Entity name is immutable once confirmed:
```

Full forms — both interpolate the table, the row and **both** values (D-23); the second additionally names
the column:

```
Entity confirmation requires the entity.confirm permission: %.% row % cannot change its confirmation flag (current: %, attempted: %)
Entity name is immutable once confirmed: column %.%.% on row % cannot be changed (current: %, attempted: %); changing it requires the entity.edit_immutable permission
```

## The three observed-red counts — measured as `PLAN − PASSED`, never by counting `not ok`

| Control | Declared plan | Passed | **Reddened** | What it proves |
|---|---|---|---|---|
| permissive stub (`RETURN NEW` unconditionally), tracer file | 18 | 13 | **5** | exactly the five deny assertions — nothing else in the file depends on the rules firing |
| refusing stub (role guard kept, raises on every authenticated update), tracer file | 18 | 7 | **11** | the allow half is load-bearing; the answers write and the service-role write still passed, which is the column restriction and the role guard doing their jobs rather than the body |
| **absolute-freeze variant** (rule 2's `OLD.confirmed` guard removed), full file | 70 | 59 | **11** | the plan's central evidence. The 11 are the **5 middle-cell allows** (one per protected column — equal to the derived population, which is the required floor), their 5 read-backs, and the structural OLD-flag assertion |

D-37 was applied throughout: `supabase test db` emits only a prove summary, and a variant that aborts the
transaction emits no `not ok` at all. Every count above is `declared plan − passed ok lines`. This mattered
in practice: the `throws_unlike` defect below aborted the transaction and produced **zero** `not ok` lines
against a file that had run only 47 of 70 assertions.

## Block coverage, before and after

| | Covered entity tables (bounded column list, no table-wide UPDATE) | Confirmation column inside the allow-list |
|---|---|---|
| **before** | **4 of 4** | **0 of 4** |
| **after** | **4 of 4** | **4 of 4** |

162-10's recorded task 2 Q2 letter is **(a)** — `factions` and `alliances` gained `entity_update_own_*`
policies with their column bounds in the same commit. That is why the before-figure is 4 and not M2's
predicted 2: **the plan's M2 and M4 are stale by three plans**, and 162-07's asymmetry was already closed
by 162-10. What this plan added to those two tables is the confirmation column, not the block.

Per-table allow-lists after this plan, read from `information_schema.column_privileges`:

- `organizations` — `answers, color, confirmed, custom_data, image, info, name, short_name, subtype`
- `candidates` — `answers, color, confirmed, custom_data, first_name, image, info, last_name, short_name, subtype, terms_of_use_accepted`
- `factions` — `color, confirmed, custom_data, image, info, name, short_name, subtype`
- `alliances` — `color, confirmed, custom_data, image, info, name, short_name, subtype`

Table-wide UPDATE grants to `authenticated` on the four: **0**. `project_id`, `id` and `published` are in
none of the four lists.

## The registrations, read from `pg_trigger`

| Table | `tgattr` column restriction | Arguments | Enabled |
|---|---|---|---|
| `alliances` | `confirmed, name` | `'name'` | `O` (origin) |
| `candidates` | `confirmed, first_name, last_name` | `'first_name', 'last_name'` | `O` |
| `factions` | `confirmed, name` | `'name'` | `O` |
| `organizations` | `confirmed, name` | `'name'` | `O` |

Registration count **4**, compared in pgTAP against the entity-type population **derived from `pg_enum`**
rather than against the literal four. Function: `prosecdef = false`, returns `trigger`, `plpgsql`.
Entity-type labels appearing in `pg_proc.prosrc`: **0**, over a derived label population of 4.

Row-level `BEFORE UPDATE` trigger population on the four entity tables: **14 before, 18 after**.

## pgTAP estate

| | Files | Assertions |
|---|---|---|
| before this plan | 22 | 966 |
| after this plan | **23** | **1042** |

Declared plan counts of every host file this plan touched:

| File | Before | After |
|---|---|---|
| `02-candidate-self-edit.test.sql` | 15 | **16** |
| `09-column-restrictions.test.sql` | 27 | **30** |
| `15-visibility-flags.test.sql` | 31 | **33** |
| `19-entity-immutability.test.sql` | — | **70** (new) |

No declared plan count fell. No assertion was deleted, weakened or renamed.

## Task 5 — the seeder and the hot path

**The seeder, run twice against one database.** Both shipped templates, each run twice:

| Run | `organizations` | `candidates` | `factions` | `alliances` | exit | name digest |
|---|---|---|---|---|---|---|
| default, run 1 | 8 rows / 0 unconfirmed | 328 / 0 | **0 / 0** | 2 / 0 | 0 | `3768971c04…` |
| default, run 2 (same command, same database) | 8 / 0 | 328 / 0 | **0 / 0** | 2 / 0 | **0** | `3768971c04…` |
| `e2e/base`, run 1 | 13 / 0 | 358 / 0 | **0 / 0** | 4 / 0 | 0 | `ca033fa3fb…` |
| `e2e/base`, run 2 | 13 / 0 | 358 / 0 | **0 / 0** | 4 / 0 | **0** | `ca033fa3fb…` |

**Name digest identical across the second run: YES**, for both templates. Zero unconfirmed rows on every
populated table. This is the role scope asserted in the direction pgTAP cannot reach — pgTAP runs as the
database owner and never seeds — and its failure mode would have been a broken developer stack rather than
a red test.

**`factions` measures 0 rows in both shipped templates, and that is reported rather than papered over.**
A `FactionsGenerator` exists but no shipped template asks for factions, so the clean unconfirmed count on
that one table comes from an empty instrument. The plan's acceptance criterion asked for a non-zero row
count on every entity table; it is unmeetable without editing a dev-seed template, which this plan is
prohibited from doing. The trigger's behaviour on `factions` is proven by pgTAP, which builds its own
faction grantee and faction rows.

**The hot path, timed.** `upsert_answers` against one confirmed candidate row, on a session carrying an
entity grant and no project grant — the caller the rule would refuse if it fired. Four alternating blocks
of 500 writes each, so ordering bias cancels:

| | mean per write |
|---|---|
| with the four registrations **enabled** | **0.18123 ms** |
| with them **disabled** | **0.20926 ms** |
| **ratio** | **0.8661** |

Gate: at most 1.1. The reading is below 1.0, which is noise around unity rather than a speed-up — a trigger
cannot make an unrelated write faster. The interpretation is the intended one: the column restriction is
decided once per statement from the parse tree, `upsert_answers` sets only the answers column, and this
plan's four registrations therefore contribute nothing measurable to the candidate application's hottest
write. A single-shot measurement taken first gave 0.8309 on the same setup, so the two agree.

After the measurement the four registrations were re-enabled and the structural census re-asserted:
4 enabled registrations with their derived column sets intact.

`SECURITY DEFINER` functions in `public`: **23**, of which **0** carry an unpinned `search_path`.
`yarn db:lint:sql` exits **0**.

## The policy estate is unmoved

| | `pg_policies` across `public` + `storage` | `public` alone | on the four entity tables |
|---|---|---|---|
| before (Task 1 baseline) | **104** | 89 | 24 |
| after | **104** | 89 | 24 |

The sorted entity-table policy-name set is byte-identical to Task 1's record. The schema diff against the
base SHA contains **0** lines matching `CREATE POLICY`, `DROP POLICY`, `ALTER TABLE`, `ADD COLUMN` or
`DROP COLUMN`.

## The wave-4 gate

| Gate | Result |
|---|---|
| `yarn typecheck` | **0** |
| `yarn lint:check` (includes `assert:schema-migration-parity`) | **0** |
| `yarn test:unit` | **0** — 3026 tests across 237 files |
| `yarn workspace @openvaa/supabase test:db` | **0** — Files=23, Tests=1042, `Result: PASS` |
| `yarn db:lint:sql` | **0** — 0 errors, 3 pre-existing FK-index warnings (none this plan's) |
| **full E2E suite** | **155 passed / 0 failed / 0 did-not-run / 0 skipped / 0 flaky** |

E2E run directory: `tests/e2e-runs/162-13-entity-immutability`. Wrapper exit **0**, preflight failures
**0**, preflight successes **1**, HEAD `19ce93ed68…`, started `2026-09-17T13:53:21Z`, ended
`2026-09-17T14:04:20Z`, duration 10.8 min. Disk headroom measured **before** the run: 65 GiB available,
`tests/e2e-runs/` at 6.9 GiB.

`apps/supabase/supabase/migrations/` holds exactly **1** `.sql` file. No manifest dependency or
development-dependency line moved.

## 162-04 Task 2 Q2, and the disposition of § 3.4's answers gap

**162-04 Task 2 Q2 = (D)** — `is_child_nominee` gates `nomination.read` for any entity grant, and
explicitly **not** `entity.read_answers`.

**Disposition: CLOSED by the ratified reading.** Under (D) a parent organization reaches its child's
**nomination** and never the child's entity row, so "basic data only, not answers unless public" does not
arise as a column-grant question and needs no read-side column grant. This plan therefore adds no SELECT
grant — a new mechanism on a new verb for a reach that does not exist. Nothing is handed to 162-17 here.

## Deviations from Plan

### Auto-fixed issues and repaired plan defects

**1. [Rule 1 — plan defect] The rule-order must-have names a caller no claim can produce.**
- **Found during:** Task 4 (design of section 6).
- **Issue:** The plan asserts that a caller holding `entity.confirm` and not `entity.edit_immutable` is
  "reachable only from a hand-built claim". It is reachable from **no** claim. `user_can` does not read a
  permission list out of the token — it reads a scope, a role and a target and asks
  `grant_role_permissions` for the verbs — and in that matrix the two permissions appear in exactly the
  same four rows (global admin, account admin, project admin, project editor). Verified by reading
  `301-auth-functions.sql`. The prescribed assertion could never have been written.
- **Fix:** re-expressed into two assertions that together are **strictly stronger** than the one that was
  asked for. (a) **Behavioural, and it is the claim that actually matters:** an entity grantee issuing
  `SET confirmed = false, first_name = …` in ONE statement on a confirmed row is refused with the
  **confirmation** prefix, and — asserted separately, in the negative — is **not** refused with the
  immutability prefix. The opposite rule order would produce the opposite prefix, so the pair
  discriminates rather than merely passing. (b) **Structural:** `pg_proc.prosrc` is asserted to contain
  `IF OLD.confirmed THEN`, so a rewrite to `NEW.confirmed` reddens. The absolute-freeze control confirms
  it is load-bearing: that assertion is one of the 11 it reddens.
- **Files modified:** `apps/supabase/supabase/tests/database/19-entity-immutability.test.sql`
- **Commit:** `a52b2a97b`

**2. [Rule 3 — blocking] `throws_unlike` does not exist in this tree's pgTAP.**
- **Found during:** Task 4.
- **Issue:** the negative half of the rule-order assertion was first written with `throws_unlike`.
  `function throws_unlike(text, unknown, unknown) does not exist` **aborted the transaction**, which
  produced zero `not ok` lines against a file that had completed only 47 of its 70 assertions — the exact
  instrument failure D-37 describes, met in the wild.
- **Fix:** a session-temporary `pg_temp.capture_refusal(text)` helper that runs a statement and returns
  `SQLERRM` (or the literal `(no exception)`), asserted with pgTAP's `unalike`. The helper dies with the
  file's transaction. Available pgTAP exception assertions were enumerated from `pg_proc` first rather
  than assumed.
- **Commit:** `a52b2a97b`

**3. [Rule 1 — my own test bug, caught by the tests] Writing a confirmation value equal to the row's is a
no-op the trigger correctly permits.**
- **Found during:** Task 3, as `no exception thrown` on two re-expressed assertions in
  `09-column-restrictions.test.sql`.
- **Issue:** rule 1 compares old to new with `IS DISTINCT FROM`. The inherited assertions wrote
  `confirmed = true` to an already-confirmed fixture row, which under a privilege bar was refused
  regardless of value and under the trigger is correctly permitted.
- **Fix:** the assertions write `confirmed = false` — the direction that is really a change, and also the
  dangerous one, since an entity user who can unconfirm can unfreeze their own name. The same rule applies
  to `first_name`: an assertion rewriting the value it had just written observed no refusal, and now
  writes a distinct value. Both recorded in the files as measured notes.
- **Commit:** `fe25f6018`

**4. [Rule 2 — falsified plan fact] M7 predicts 8 row-level `BEFORE UPDATE` triggers on the entity
tables; there are 14.**
- **Found during:** Task 1. Besides `set_updated_at` and `enforce_external_id_immutability`, every entity
  table carries `cleanup_image_on_update`, and `candidates` and `organizations` additionally carry
  `validate_answers_before_insert_or_update`.
- **Fix:** the plan's verify gate (`test "$N" = 8`) would have halted here. The census records the
  measured before-figure of 14 and the claim M7 makes that IS true and IS what the design depends on:
  **none** of the 14 is column-restricted, so a column-restricted registration is a new form on these
  tables and trigger dispatch is an already-paid cost. The pgTAP structural census asserts the after-bound
  as **18** — the measured before-population plus one per table.

**5. [Rule 2 — unachievable plan must-have] The generated types cannot carry the new function.**
- **Found during:** Task 3.
- **Issue:** the plan's D-18 must-have requires `packages/supabase-types/src/database.ts` to carry the new
  trigger function in its `Functions` block "as the evidence the declaration reached PostgreSQL".
  **Measured: the Supabase type generator emits no function returning `trigger` at all** — not
  `validate_nomination`, not `enforce_nomination_confirmation`, not `enforce_external_id_immutability`,
  not `update_updated_at`. `yarn db:types` produces **no diff** for this plan, and that is correct.
- **Fix:** the evidence is read from `pg_proc` directly — the function exists, returns `trigger`,
  `prosecdef = false` — which is a *direct* measurement of the applied database rather than an indirect
  one through a generator that filters the whole category. `yarn db:types` is still run, and its producing
  no diff is itself the assertion that nothing drifted.

**6. [Rule 1 — instrument contamination, caught and undone] `db:types` run after `test:db`.**
- **Found during:** Task 4, as 26 unexpected added lines in `packages/supabase-types/src/database.ts`
  naming `create_test_data`, `set_test_user`, `test_id` and six more pgTAP helpers.
- **Fix:** reverted, then `db:reset` → `db:types` in the correct order. The generated types are unchanged
  by this plan. This is exactly the contamination the order `db:reset → db:types → test:db` exists to
  prevent.

**7. [Rule 2 — stale schema comments stating a retired protection as current] Four `CREATE TABLE` body
comments in `102-entities.sql`.**
- **Issue:** all four said the confirmation column is "outside the authenticated UPDATE grant … by
  construction"; two of them additionally said `303-column-grants.sql` "names this table NOWHERE" and that
  "closing the gap properly is 162-13's" — already false since 162-10. Left standing, a reader of the
  column this plan's rule governs would conclude the protection is a privilege when it is a trigger.
- **Fix:** the four comment lines updated to name the trigger and the reason the grant gave way. **This is
  a deliberate, narrow departure from the plan's prohibition "No `CREATE TABLE` body changes".** No column
  definition, no constraint and no trigger registration was altered; the four `set_updated_at`
  registrations — which the prohibition's own sentence names as the thing to preserve — are byte-identical.
  A false comment about where a security protection lives is the broken window this phase exists to close.
- **Commits:** `fe25f6018`, `a52b2a97b`

**8. [Rule 2 — inherited assertions the plan did not name] M5 predicts three; there are six, in three host
files.**
- **Issue:** M5 names the two confirmation assertions in `09-column-restrictions.test.sql` and "162-07's
  catalogue-derived emptiness assertion" in `15-visibility-flags.test.sql`. **162-10 had already
  re-expressed the third, one plan before this one.** And M5 names none of: the two catalogue COUNT
  assertions in `09` (candidates 10, organizations 8), the two self-edit assertions in `09` and the two in
  `02-candidate-self-edit.test.sql` — all of which this plan invalidates, and one of whose host files
  (`02`) is not even in the plan's `files_modified` list.
- **Fix:** all six re-expressed with their description strings and measured claims intact.
  - The two confirmation refusals: `42501` → the named trigger refusal, **plus a new paired assertion on
    the SQLSTATE** proving the statement now reaches the trigger. Strictly stronger.
  - The two counts: 10 → 11 and 8 → 9, with the added column named in the description.
  - The four self-edit assertions in `09` and `02`: their rows are unconfirmed **as the owner** for the
    length of their section, so they keep measuring the grant and the row policy they were written for —
    and each pair gains a **new** assertion that the identical statement on the re-confirmed row is
    refused by name. Strictly stronger.
  - `15`'s structural-grant assertion: its exclusion set loses `confirmed` (the one clause this plan
    deliberately retires, named in the file rather than quietly dropped) and gains a positive requirement
    that the column BE granted — plus two **new** assertions beside it: no entity table lacks a block, and
    all four carry an enabled registration whose column restriction includes the confirmation column.
- **Commits:** `fe25f6018`, `a52b2a97b`

**9. [Rule 3 — harness] The plan's `<automated>` blocks use bash word-splitting that zsh does not perform.**
- **Issue:** `ETAB="organizations candidates factions alliances"; for t in $ETAB` iterates **once**, with
  the whole string as one value, under this harness's zsh. The first derivation ran against a table named
  `organizations candidates factions alliances` and reported a protected-column population of **0**.
  Unquoted `--include=*.ts` was likewise glob-expanded and aborted a grep.
- **Fix:** literal iteration lists and quoted glob arguments throughout. Recorded because every block in
  the plan carries the same shape.

**10. [Rule 3 — instrument] Three catalogue queries in the plan's verify blocks are ill-typed.**
- `t.tgenabled` is `"char"` and needs `::text` before `||`; `tgargs` is `bytea` and needs
  `pg_get_triggerdef` rather than `array_to_string`; `ORDER BY 1,2` over a single-expression select list
  errors. Each was repaired in place. One of the failures also produced a **false count**: `grep -c` over
  the captured output matched the literal inside the PostgreSQL error text and reported `total: 1` for a
  query that had returned nothing — a miniature of D-37, caught.

**11. [Rule 3 — the plan's own gate would misfire] `fails_when` on the policy baseline reads "90 or
below".**
- The measured figure is **104** across `public` + `storage` but **89** for `public` alone. A block
  written with the public-only query would have reported a false failure at 89 ≤ 90. Both figures are
  recorded in the baseline, and the comparison is made on the public+storage figure the plan's prose names.

**12. [Rule 3 — hygiene gate] The new pgTAP file's multi-line `Depends on:` comment tripped
`assert:comment-hygiene` rule 2.**
- Joined onto one line, the form every other SQL file in this tree uses. Committed separately as
  `19ce93ed6`.

### Out of scope, logged and not fixed

`yarn db:lint:sql` reports three pre-existing "foreign keys without indexes" warnings —
`constituency_group_constituencies.constituency_id`, `election_constituency_groups.constituency_group_id`
and `nominations.created_by` (162-12's). None is this plan's; the command exits 0 and no index was added,
consistent with this plan's prohibition on choosing an index from a predicate's shape rather than a plan.

## Four handoffs, each named with the plan that owns it

1. **162-17 — the exception prefixes and the protected-column set.** The two stable prefixes are
   reproduced verbatim above, and the protected set is the five-column per-table breakdown above. 162-17
   widens this property across § 3.3's matrix; it does not need to re-establish it, and it should assert
   those exact strings rather than invent new ones. The three-cell grid shape is the form to widen.
2. **162-16 — the per-block comment shape.** Every entity block in `303-column-grants.sql` now states its
   protected half as the explicit complement of its grant list. Stripping the publication column is
   therefore **one comment line per block** and no grant list moves; the enforcement is unaffected because
   that column is protected by omission and will simply cease to exist.
3. **162-17's documentation sweep — the `162-PATTERNS.md` § No Analog Found correction.** That entry says
   this tree contains no trigger comparing OLD to NEW to gate column immutability. It does:
   `enforce_external_id_immutability()` in `500-external-id.sql` gates on an OLD-row condition, compares
   with `IS DISTINCT FROM`, raises a named exception interpolating both values, and is registered on
   eleven tables from one body. This plan copied it rather than inventing a second idiom. Also for that
   sweep: `.claude/skills/database/rls-policy-map.md`, `schema-reference.md` and `extension-patterns.md`
   are untouched by this plan and the column-grant pattern note in the last of them is now mildly stale.
4. **§ 3.4's answers-versus-basic-data gap — CLOSED, nothing to inherit.** 162-04 Task 2 Q2 = **(D)**, so
   a parent reads its child's nomination and never the child's entity row. No read-side column grant is
   needed and none was added.

## Known Stubs

None. No stub, placeholder, hardcoded empty value or unwired data source was introduced.

## Threat Flags

None. This plan creates no network endpoint, no auth path, no file-access pattern and no schema change at
a trust boundary. It narrows an existing surface: five identity columns and one confirmation flag move
from unconditionally writable (or unconditionally refused) to permission-gated. The one accepted residual
is the plan's own T-162-13-12 — a service-role path can rename a confirmed entity, which is the latitude
that role already holds against row-level security and against the column grants, neither of which names
it.

## Self-Check: PASSED

All five declared artefacts exist on disk. All three commit hashes resolve in `git log --all`.
`commits: 4` is MEASURED — `git rev-list --count 17c04cae4..HEAD` — not narrated. Three code
commits plus this metadata commit; the figure was 3 at the moment the file was written and 4 once the
metadata commit landed, so 4 is what a re-run of the same instrument reports.
