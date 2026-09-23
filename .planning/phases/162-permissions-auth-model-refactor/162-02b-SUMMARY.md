---
phase: 162-permissions-auth-model-refactor
plan: 02b
subsystem: database
tags: [schema, migrations, declarative-schema, parity-gate, tooling]
status: complete

requires:
  - '162-01 (162-SPEC.md, the phase normative reference)'
  - "operator ruling 2026-09-15: no Supabase database has been published"
  - '162-CHECKPOINT-DECISIONS.md § 2 item O-1 (answered 2026-09-16: proceed)'
provides:
  - 'a fully declarative apps/supabase/supabase/schema/ (15 of 25 column-adding ALTERs merged into CREATE TABLE bodies)'
  - 'a single generated migration, apps/supabase/supabase/migrations/00001_initial_schema.sql'
  - 'yarn schema:regenerate — the generator, sharing one concatenation routine with the verifier'
  - 'a parity gate that is a byte comparison plus a one-migration-file conjunct, machine-enforcing D-14 for waves 1-6'
affects:
  - 'every later plan in phase 162: edit schema/, run yarn schema:regenerate, never create a 000NN file'
  - '162-16, which deletes the ten published columns left in ALTER form and self-heals the ordinal swap'

tech-stack:
  added: []
  patterns:
    - 'declarative schema: one hand-edited source directory, one generated migration'
    - 'generator and checker share a single concatenation routine so they cannot disagree'
    - 'non-vacuity floor on a byte comparator (>=20 files, >=3000 lines, a CREATE TABLE public. line)'

key-files:
  created: []
  modified:
    - apps/supabase/supabase/schema/101-elections.sql
    - apps/supabase/supabase/schema/102-entities.sql
    - apps/supabase/supabase/schema/103-questions.sql
    - apps/supabase/supabase/schema/104-nominations.sql
    - apps/supabase/supabase/schema/105-answers.sql
    - apps/supabase/supabase/schema/106-app-settings.sql
    - apps/supabase/supabase/schema/300-auth-tables.sql
    - apps/supabase/supabase/schema/500-external-id.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - scripts/assert-schema-migration-parity.mjs
    - scripts/assert-rpc-return-nullability.mjs
    - scripts/assert-project-scoped-queries.mjs
    - package.json
    - .prettierignore
    - apps/supabase/README.md
    - .claude/skills/database/SKILL.md
    - packages/dev-seed/src/supabaseAdminClient.ts
    - packages/dev-seed/src/templates/defaults/candidates-override.ts
    - apps/supabase/supabase/tests/database/11-question-rpcs.test.sql
  deleted:
    - apps/supabase/supabase/migrations/00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql
    - apps/supabase/supabase/migrations/00003_authenticated_insert_feedback.sql
    - apps/supabase/supabase/migrations/00004_question_rpcs_and_nomination_election_round.sql
    - apps/supabase/supabase/migrations/00005_get_nominations_project_scope.sql
    - apps/supabase/supabase/migrations/00006_get_questions_project_scope.sql
    - apps/supabase/supabase/migrations/00007_get_nominations_entity_project_scope.sql
    - apps/supabase/supabase/migrations/00008_resolve_email_variables_project_scope.sql
    - apps/supabase/scripts/schema-migration-parity.expected.txt

decisions:
  - 'D-14 implemented: one migration file, enforced mechanically rather than by convention'
  - 'D-14a implemented: 15 of 25 column-adding ALTERs merged; 300-auth-tables.sql''s 10 left for 162-16'
  - 'D-17 rehomed: the same-commit review obligation now lives in the guard docblock and both documents, because the fixture that used to carry it is gone'
  - 'D-18 asserted: yarn db:types produces no diff, because generated members are alphabetical and blind to the ordinal swap'
  - 'the generated migration is excluded from prettier — leaving it in scope let yarn format rewrite it into a state the parity gate could never accept'

metrics:
  duration: ~75 min
  completed: 2026-09-16

actuals:
  tokens: 37332
  tasks: 7
  commits: 5
  plan_head_before: 703d1fbe708c3135edaa4f30e6cb0e2324c2c2be
---

# Phase 162 Plan 02b: Declarative Schema and Single Generated Migration — Summary

`apps/supabase/supabase/schema/` is now the hand-edited source and
`apps/supabase/supabase/migrations/` is one generated file; the parity gate that used to compare
them through an LCS differ against a golden signature is a byte comparison that also fails if a
second migration file ever appears.

## What was done

**Task 1 — baseline.** `yarn db:reset` (applying all eight migrations), then a `pg_dump` and an
ordinal census, both proved non-vacuous before being trusted: 97 `CREATE POLICY` lines, 230 `GRANT `
lines, 6218 dump lines, 242 ordinal rows. The dump recipe was proved deterministic by taking it
twice and `cmp`-ing — the `\restrict`/`\unrestrict` strip is what makes that possible, since
`pg_dump` 17.x regenerates those tokens per invocation. No tracked file was touched.

**Task 2 — the ratified one-way gate.** No question was re-asked. `162-CHECKPOINT-DECISIONS.md` § 2
item O-1 was read before anything was deleted and found to carry **no ticked (B) box and no named
database**; both boxes unticked, which by that document's own rule selects the ★ RECOMMENDED option
**(A) Proceed — the ruling holds**. See "The recorded human answer" below.

**Task 3 — 15 declarations merged.** Column-adding `ALTER TABLE` sites under `schema/` went from 25
to 10, the remaining 10 all in `300-auth-tables.sql`. Each declaration was appended at the END of
its `CREATE TABLE` body, in filename-order-concatenation order, which is what confines the ordinal
change to the registered swap. Both concern files kept their concerns: `500-external-id.sql` still
holds 11 composite unique indexes and 11 immutability triggers, `105-answers.sql` still holds
`validate_answers_jsonb`; only their headers changed, to name the tables that carry the column and
the files those tables are declared in.

**Task 4 — the guard collapsed.** The LCS differ, `MAX_CELLS` budget, hunk and signature builders,
`--update` mode and every reference to the fixture path are gone. What replaced them: a byte
comparison, a one-migration-file conjunct, a census on every run, a self-check that proves the
comparator can report *inequality*, and a new non-vacuity floor. `--write` regenerates through the
same concatenation routine the verifier uses.

**Task 5 — the fold.** `00001` regenerated, `00002`–`00008` removed, gate green for the first time
in its byte form.

**Task 6 — the tree stopped lying.** Both documents describe a generated copy; four stale citations
re-pointed at surviving authorities with their reasoning intact.

**Task 7 — the proof.** Below.

## The recorded human answer (Task 2)

> **Answer:** `proceed` — the 2026-09-15 no-published-database ruling still holds.
> **Date:** 2026-09-16.
> **Source:** `.planning/phases/162-permissions-auth-model-refactor/162-CHECKPOINT-DECISIONS.md`
> § 2 "One-way preconditions", item **O-1 · Has any database run migrations 00002–00008?**

The item was written so that "anything hedged is treated as halt". It was returned unhedged: no
database named, no margin note, no ticked (B). The verification condition in the plan's `<ratified>`
block was checked against the source before any file was deleted, and did not trip.

**The sanctioned deletion set, restated in full, against which Task 5's count was checked:**

| # | File |
|---|------|
| 1 | `apps/supabase/supabase/migrations/00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql` |
| 2 | `apps/supabase/supabase/migrations/00003_authenticated_insert_feedback.sql` |
| 3 | `apps/supabase/supabase/migrations/00004_question_rpcs_and_nomination_election_round.sql` |
| 4 | `apps/supabase/supabase/migrations/00005_get_nominations_project_scope.sql` |
| 5 | `apps/supabase/supabase/migrations/00006_get_questions_project_scope.sql` |
| 6 | `apps/supabase/supabase/migrations/00007_get_nominations_entity_project_scope.sql` |
| 7 | `apps/supabase/supabase/migrations/00008_resolve_email_variables_project_scope.sql` |
| 8 | `apps/supabase/scripts/schema-migration-parity.expected.txt` (the golden-signature fixture) |

Measured, not asserted: `git diff --name-status` over `migrations/` reported exactly **7 deletions
and 1 modification**. Nothing outside the sanctioned set was removed.

**The removal commit, in full rather than abbreviated, so the bytes stay recoverable as history
grows:**

```
45c97fe75e86f6a2b37b7e0de029ad6eac66563d
```

Recover any deleted file with
`git show 45c97fe75e86f6a2b37b7e0de029ad6eac66563d^:<path>`.
The fixture was removed one commit earlier, in `b692eab1d`, because the code that wrote it went in
the same change.

## The behaviour-neutrality proof (Task 7)

**Measured `pg_dump` diff size: 38 payload lines. Every one of them confined to the register — zero
lines outside it.**

| Measurement | Before | After | Verdict |
|---|---|---|---|
| `CREATE POLICY` lines | 97 | 97 | unchanged |
| `GRANT ` lines | 230 | 230 | unchanged |
| dump diff payload | — | 38 lines | non-empty, so the comparison witnessed something |
| payload lines mentioning neither `published` nor `external_id` | — | **0** | nothing outside the register |
| ordinal-census changed columns | — | exactly `{external_id, published}` | as registered |
| ordinal-census changed tables | — | exactly **10** | as registered |
| migrations applied by `db:reset` | 8 | 1 | the fold took |

The ten changed tables were exactly the ten in the plan's register: `alliances`, `candidates`,
`constituencies`, `constituency_groups`, `elections`, `factions`, `nominations`, `organizations`,
`question_categories`, `questions`. Every differing dump line was one of four forms — `published`
and `external_id` trading adjacent positions in a `CREATE TABLE` body.

**No line fell outside the register.** There is no finding here for wave 1 to act on.

The 15 SQL comment lines the pre-plan measurement predicted would vanish without semantic effect did
so: comments reach no catalogue, and the dump diff confirms it by containing none of them.

## The deleted migrations' corrections survived

Each of these lived ONLY in a file this plan deleted. Verified present in the regenerated survivor,
by reading the file and not by inferring it from a green suite:

| Correction | Was in | Now in `00001` |
|---|---|---|
| three-clause `anon_select_candidates`: `published = true AND terms_of_use_accepted IS NOT NULL AND terms_of_use_accepted < now()` | `00002` | line 1852 |
| `authenticated_insert_feedback` policy | `00003` | present |
| `resolve_email_variables (uuid, uuid[], text, text)` — leading project parameter | `00008` | present, granted to `authenticated` + `service_role` |
| `get_nominations (uuid, uuid, uuid, boolean, integer)` — five arguments | `00005`, `00007` | present |
| `get_questions (uuid, uuid, uuid, integer)` — four arguments | `00004`, `00006` | present |

And the definitions those migrations superseded are **absent**: the single-clause anon predicate
(`TO anon USING (published = true)`), the three-argument `resolve_email_variables (uuid[], text,
text)` grants, and the three-argument `get_nominations (uuid, uuid, boolean)` grant were all removed
by the regeneration. Losing them was the point.

## The gate was proved to go red, not merely observed green

A gate is only worth its green run if its red run works. Three paths exercised live:

1. **Second migration file** — run with eight files present: exit 1, naming all eight.
2. **One byte of drift** — a single comment line appended to `00001`: exit 1, naming the first
   differing line number and both sides' content. Restored, then green again.
3. **Idempotency** — `--write` run twice against an unchanged `schema/` produced byte-identical
   output, and that output is byte-identical to a plain filename-order `cat`.

## Gate results

| Gate | Result |
|---|---|
| `yarn db:reset` from the single migration | exit 0 — one file applied cleanly as a forward-only script |
| `yarn db:types` + working-tree check | **no diff** under `packages/supabase-types/` (D-18) |
| `yarn db:lint:sql` | exit 0 — 0 errors, 2 pre-existing FK-index warnings |
| `yarn workspace @openvaa/supabase test:db` | **12 files, 401 pgTAP tests, all pass** |
| `yarn test:unit` | **25 tasks, all pass**, incl. `allowedTeardownTables` + `permittedKeys` |
| `yarn lint:check` | exit 0, status read directly and never through a pipe |
| `yarn assert:schema-migration-parity` (in chain) | green: 25 schema files → 4061 lines; migration → 4061 lines; 1 `.sql` file |
| E2E (`tests/scripts/e2e-run.sh`) | **155 passed, 0 failed, 0 skipped, 0 did-not-run**; preflight failures 0, successes 1 |

The E2E run used the wrapper's default `FRONTEND_PORT=5273`. Port 5173 was held by an unrelated
project's dev server (`~/Desktop/Treader/treader/apps/web`); it was **not** killed, and the wrapper
already defaults away from 5173 for exactly this reason.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] The Task 3 comment reddened `assert:comment-hygiene`**

- **Found during:** Task 6, when the plan's own `yarn assert:comment-hygiene` verify ran.
- **Issue:** the 162-16 note added below `300-auth-tables.sql`'s section title tripped rule 2
  (D-A4): the title line ends without terminal punctuation and my line continued the same comment at
  the same indent. It reddened twice — once in the schema file, once in the generated migration.
- **Fix:** moved the note ABOVE the section title. Its own sentence ends in a period, and the line
  above it is a dashed banner, which the rule exempts. The plan's
  "exactly one insertion, zero deletions" criterion for that file still holds.
- **Files modified:** `apps/supabase/supabase/schema/300-auth-tables.sql`,
  `apps/supabase/supabase/migrations/00001_initial_schema.sql` (regenerated)
- **Commit:** `a12b530e0`

**2. [Rule 3 — Blocking] `yarn format` would have permanently broken the parity gate**

- **Found during:** Task 6, checking formatting before committing.
- **Issue:** `.sql` is in prettier's scope (`prettier --check .`) and the migrations directory was
  not ignored. Prettier wants a blank line at each file-boundary junction of the concatenation, so
  it reported the generated migration as unformatted. The trap: `yarn format` would rewrite the file
  into a state `assert:schema-migration-parity` can **never** accept, and no edit to `schema/` could
  repair it, because the generator reproduces the unformatted join every time. The plan's byte-
  identity invariant and the repo's format gate were in direct conflict.
- **Fix:** excluded the generated file in `.prettierignore` with the reasoning recorded at the
  entry, matching how this repo already handles generated Paraglide output. The hand-edited
  `schema/` sources stay in scope and are prettier-clean. The alternative — teaching the generator
  to emit blank lines — was rejected because it would break the byte-identity invariant that the
  plan states repeatedly and that the gate itself asserts.
- **Files modified:** `.prettierignore`
- **Commit:** `a12b530e0`

**3. [Rule 2 — Missing correctness] Two README claims my own change had falsified**

- **Found during:** Task 6.
- **Issue:** `apps/supabase/README.md` said `schema/105-answers.sql` "adds an `answers jsonb`
  column". After Task 3 that is false — the column is declared in `102-entities.sql`.
- **Fix:** both passages reworded to say the columns are declared in `102-entities.sql` while
  `105-answers.sql` owns the validation behaviour. In scope because my change caused the staleness.
- **Commit:** `a12b530e0`

### Flagged assumptions now resolved

The plan flagged five edge cases as unresolved. Three are now measured rather than assumed:

- **`ordering`** — the open assumption was that the concatenated `schema/` is valid as a single
  forward-only script on an empty database. `yarn db:reset` exited 0 applying exactly one migration.
  **Resolved.**
- **`idempotency`** — two consecutive `--write` runs produced byte-identical output. **Resolved**
  (the case-insensitive / non-UTF-8 filesystem sub-case remains untested, as the plan noted).
- **`adjacency`** — the ordinal census showed exactly two changed column names across exactly ten
  tables, so every moved column landed where the placement rule required. **Resolved.**
- **`empty`** — the non-vacuity floor is implemented and its thresholds are absolute numbers that
  will need raising as the schema grows. Still open by design; see Known Stubs.
- **`concurrency`** — mitigation was procedural and held: the whole plan ran in one session against
  one stack, and the resulting diff was 38 lines rather than the large confusing diff a second
  checkout's stack would have produced.

## Known Stubs

None in product code. Two documentation-debt items, neither introduced by this plan and neither
blocking:

| Item | File | Note |
|---|---|---|
| `24 SQL files` | `.claude/skills/database/SKILL.md:22` | Pre-existing drift: there were 25 at this plan's base SHA and this plan added none. Left alone as out of scope. |
| `migrations/ still holds 3` | `.claude/skills/database/SKILL.md:441` | Inside the date-stamped "Freshness Record / Verified still true" section (reviewed 2026-08-29). The claim was true at that review date, so it is a historical record rather than a live assertion; correcting it belongs to the next skill-drift audit, which is the mechanism that maintains that section. |

The non-vacuity floor's thresholds (`MIN_SCHEMA_FILES = 20`, `MIN_SCHEMA_LINES = 3000`) are absolute
and nothing reminds anyone to raise them as the schema grows. This is stated in the guard's own
docblock, which is where a reader will meet it.

## Threat Flags

None. No file changed in this plan introduces a network endpoint, an auth path, a file-access
pattern or a schema change at a trust boundary. The plan moved column declarations, regenerated a
file and edited prose; the `pg_dump` proof above is the evidence that the security surface — 97
policies, 230 grants — is byte-for-byte what it was.

The threat register's four `mitigate` dispositions were all discharged with the evidence the plan
specified: T-01 by the dump diff (not by a test run), T-02 and T-03 by reading the regenerated file
for the corrections that lived only in deleted files, T-04 by the self-check, census and floor plus
the independent `pg_dump` proof that never invokes the script, and T-05 by the one-migration-file
conjunct now being live.

## Commits

| Task | Commit | Subject |
|---|---|---|
| 3 | `a0710ee99` | merge 15 column declarations into their CREATE TABLE bodies |
| 4 | `b692eab1d` | collapse the parity guard to a byte comparison with a `--write` mode |
| 5 | `45c97fe75` | fold migrations 00002-00008 into a regenerated 00001 and delete them |
| 6 | `a12b530e0` | describe the generated migration and re-point four stale citations |

Tasks 1, 2 and 7 modify no tracked file by design — they take a baseline, record a ratified
decision, and verify.

## What the next plan must know

1. **Never create a `000NN` migration file.** The gate fails outright if a second `.sql` appears
   under `migrations/`. This is no longer a convention to remember; it is enforced.
2. **A schema change is two steps in one commit:** edit the `schema/` file, then
   `yarn schema:regenerate`. Then read the regenerated diff — that is D-17, and nothing enforces it.
3. **Run `yarn db:types` after any schema change.** It produced no diff here only because the change
   was purely ordinal.
4. **Never hand-edit `00001_initial_schema.sql`.** It is generated and prettier-ignored; the next
   regeneration discards anything written into it directly.
5. **The ordinal swap self-heals at 162-16.** When that plan drops the ten `published` columns from
   the declarative schema, the ordinal order becomes what a fresh `CREATE TABLE` gives, which is
   what it would have been either way.

## Self-Check: PASSED

All eight sanctioned deletions verified absent from the working tree. All nine claimed modified or
created files verified present. All four task commits plus the full-SHA removal commit verified to
exist in the repository.
