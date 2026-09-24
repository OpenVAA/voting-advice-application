---
phase: 156-supabase-schema-corrections-naming-constraints-grants
plan: 01
subsystem: supabase-schema
tags: [schema, migrations, rpc, grants, pgtap, lint-gate, tracer]
status: complete

requires:
  - apps/supabase/supabase/schema/*.sql (the readable mirror)
  - apps/supabase/supabase/migrations/00001-00003 (what the CLI applies)
  - a running local Supabase stack (db:reset-with-data, db:types, pgTAP)
provides:
  - "public.candidates has no name column; public.organizations.name and both short_name columns survive"
  - "scripts/assert-schema-migration-parity.mjs — the two-copy rule, machine-checked, as lint:check link 12"
  - "156-DISPOSITIONS.md entry 6 — the Contract-C3 RPC name Phase 157's planning is blocked on"
affects:
  - plans 156-02..156-10 (every SQL edit is now gated by the parity check)
  - phase 157 (adapter boundary — has a published RPC name and two amended C3 rows)

tech-stack:
  added: []
  patterns:
    - "typed-NULL padding to preserve RETURNS TABLE arity when a source column goes away"
    - "normalised golden-signature diff (payload lines only, hunk headers dropped) as a drift gate"
    - "guard self-check: a differ that cannot find a planted difference withholds its verdict"

key-files:
  created:
    - scripts/assert-schema-migration-parity.mjs
    - apps/supabase/scripts/schema-migration-parity.expected.txt
    - .planning/phases/156-supabase-schema-corrections-naming-constraints-grants/156-DISPOSITIONS.md
  modified:
    - apps/supabase/supabase/schema/102-entities.sql
    - apps/supabase/supabase/schema/303-column-grants.sql
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/migrations/00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql
    - apps/supabase/supabase/tests/database/10-schema-migrations.test.sql
    - packages/supabase-types/src/database.ts
    - packages/dev-seed/src/template/permittedKeys.ts
    - package.json
    - .planning/REQUIREMENTS.md

decisions:
  - "merge_custom_data is RENAMED to merge_question_custom_data, not generalised — the derivation is measured, not argued (Contract C3, published for 157)"
  - "upsert_answers is PROMOTED to entity-generic over candidates + organizations; the asymmetry with the rename is deliberate and recorded"
  - "the schema/migrations drift check lands as a normalised golden-signature assert; the fold-00002/00003-into-00001 variant is declined"
  - "the parity gate is appended as lint:check link 12 rather than inserted after assert:a11y-scan-wiring — the plan's insertion point was written when the chain had 6 links; all 11 existing links survive by name"
  - "only REVIEW-DB-07 is marked complete; REVIEW-DB-01 and REVIEW-DB-06 stay Pending with their unmet clauses named"
  - "E2E declined, on a five-part mechanical proof that the diff is a runtime no-op"

metrics:
  duration: ~55 min
  completed: 2026-08-29

actuals:
  tokens: 26000
  tasks: 3
  commits: 3
---

# Phase 156 Plan 01: End-to-end removal of `candidates.name` + the two-copy parity gate — Summary

Dropped `public.candidates.name` through every layer the remaining nine plans will touch — both
hand-maintained SQL copies, the third copy of `get_nominations` in `00002`, the live database, the
regenerated types and pgTAP — then converted the phase's principal hazard, that the two SQL copies
can drift silently, into a `lint:check` gate demonstrated red before it was claimed to guard.

## Commits

| # | Hash | Task |
|---|---|---|
| 1 | `79f798d41` | drop `public.candidates.name`, keeping `short_name` and `organizations.name` |
| 2 | `cee2084b6` | gate the schema/migrations two-copy rule in `lint:check` |
| 3 | `d83c63119` | publish the Contract-C3 RPC choice in `156-DISPOSITIONS.md` |

## What was done

**Task 1 — one column, eleven edit sites, five SQL files, both copies in one commit.**
Every site was located by content match and applied by a script that asserted an exact occurrence
count of 1 before writing anything; a mismatch would have aborted with nothing written. The sites:
the column itself in `schema/102-entities.sql` + `migrations/00001`; the `authenticated` `GRANT
UPDATE` list and its hand-maintained "Allowed columns" comment mirror in
`schema/303-column-grants.sql` + `migrations/00001`; `get_nominations`'s `entity_name` COALESCE and
`get_candidate_user_data`'s candidate branch in `schema/503-entity-rpcs.sql` + `migrations/00001`;
and the third copy of `get_nominations` in `migrations/00002`. `organizations.name` and both
`short_name` columns are untouched, as D-E4 requires.

Neither `RETURNS TABLE` declaration changed. `get_candidate_user_data` keeps all 15 declared output
columns including `name jsonb`, its candidate branch now returning `NULL::jsonb` in that ordinal —
the same typed-NULL padding its organization branch already used for four columns. `get_nominations`
keeps `entity_name`, which is now NULL for a candidate nomination.

**Task 2 — the two-copy rule, machine-checked.** `apps/supabase/README.md` states the hazard in the
repo's own words: *"Nothing verifies that they agree."* Now something does.

**Task 3 — `156-DISPOSITIONS.md`.** Entry 6 published (the criterion-8 plan appends 1–5), carrying
the RPC choice, the `upsert_answers` companion decision, the two Contract-C3 amendments criterion 7
forces, the drift-check decision, and six measurement corrections for plans 02–10.

## Verification — both halves of every gate, recorded verbatim

| Gate | Result | Baseline |
|---|---|---|
| `yarn db:reset-with-data` | exit 0, **35.95 s** wall clock, 00001+00002+00003 replayed, 752 rows seeded | never measured in this repo before |
| `yarn db:reset-with-data` (2nd run, tracer gate, committed state) | exit 0, **35.86 s**, 752 rows | — |
| `yarn db:types` | exit 0; 3 deletions, all in the candidates row types. Re-run on the committed state produced a **byte-identical file** (`git status` empty) | — |
| `cd apps/supabase && npx supabase test db` | exit 0 — **11 files, 275 tests, 0 failures** (267 planned + 8 unplanned from `00-helpers`) | was 264 planned |
| the three new pgTAP assertions | `ok 66`, `ok 67`, `ok 68`, captured individually from TAP output — they ran, they did not merely not-fail | new |
| `yarn assert:schema-migration-parity` (clean) | exit 0 — 24 schema files → 3279 lines vs 3271; 4 hunks / 11 signature lines | new |
| `yarn lint:check` | exit 0, **12 links**, every guard 0 violations | was 11 links, all 11 survive by name |
| `yarn typecheck --force` | exit 0, **22/22, `0 cached`** | 22/22 |
| `yarn build --force` | exit 0, **14/14, `0 cached`** | 14/14 |
| `yarn test:unit --force` | exit 0, **25/25, `0 cached`**; dev-seed 603/53, frontend 816/54 | identical |
| `yarn format:check` | exit 0 | clean |
| `yarn assert:comment-hygiene` | 1,584 files, 2 rules live, **0 violations** | 1,584 / 0 |

The `lint:check` run replayed `typecheck` from cache (`22 cached, 22 total`). That replay is backed
by a separate `yarn typecheck --force` on the same tree at `0 cached`, recorded above.

### The negative control — the parity gate, proved red then green, in both directions

The gate was never claimed to guard until it had been observed to fail. Recorded verbatim:

| Run | Exit | Census | Payload named |
|---|---|---|---|
| clean tree | **0** | 4 hunks / 11 signature lines | matches fixture |
| one line appended to `schema/107-feedback.sql` only | **1** | **5 hunks / 12 lines**, 3279 → 3280 | `< -- drift probe` |
| after `git checkout --` of that file | **0** | 4 hunks / 11 lines | matches fixture |
| one line appended to `migrations/00001` only | **1** | **5 hunks / 12 lines**, 3271 → 3272 | `> -- drift probe` |
| after `git checkout --` of that file | **0** | 4 hunks / 11 lines | matches fixture |

Both failure messages name `apps/supabase/supabase/schema` *and*
`apps/supabase/supabase/migrations/00001_initial_schema.sql`, and state which copy carries the
unmatched line. `git diff --exit-code` over both directories is 0 at task end — every perturbation
was reverted, and the schema files were already committed before any perturbation, so
`git checkout --` was a safe undo.

### The gate cannot report a green it did not earn

Phase 153's lesson — *a gate that examines nothing reports green* — was designed against directly,
and the defence was demonstrated rather than asserted:

- **Census on every run.** `24 schema file(s) -> 3279 line(s); 00001_initial_schema.sql -> 3271
  line(s); 4 hunk(s), 11 signature line(s)`. A verdict over an empty or truncated input is visible
  in the census, not hidden behind the exit code. Zero schema files is an explicit named failure.
- **Self-check on every run.** The line differ is run against synthetic input with one changed line
  and one deleted line, plus an identical-input case, before it is trusted on the real files.
  **Demonstrated:** a copy of the script with `diffHunks` stubbed to `return []` — i.e. a differ
  that reports "they agree" about everything — exits **1** with
  *"A differ that cannot find a difference it was handed would report parity over anything."*
  It cannot reach the parity verdict.

The gate's known limit is stated in its own docblock rather than left for a reader to discover: it
catches one-sidedness, which is the measured hazard, and cannot catch a change made *identically
wrong* in both copies.

## E2E — declined, with the proof

CLAUDE.md's cardinal rule makes a decline something that must be argued from the diff. This diff is
a **runtime no-op**, provably, in five independent measurements:

1. **`candidates.name` was never written by any seed path.** `apps/supabase/supabase/seed.sql`
   inserts candidates with `id, project_id, first_name, last_name, auth_user_id`. Dev-seed's
   `CandidatesGenerator.ts` writes `first_name`/`last_name`. No candidate `fixed` row in
   `templates/default.ts` or `templates/e2e/base.ts` carries a `name`.
2. **That is mechanically confirmed, not eyeballed.** Removing `'name'` from
   `permittedKeys.ts`'s `candidates` array makes any template setting it a type error; `yarn
   typecheck` is 22/22 at `0 cached` afterwards. No template sets it.
3. **Therefore both RPC edits return byte-identical results.**
   `COALESCE(c.name, o.name, f.name, a.name)` already fell through a NULL `c.name` for every
   candidate nomination; `c.name` → `NULL::jsonb` in `get_candidate_user_data` is NULL either way.
4. **Both `RETURNS TABLE` declarations are unchanged** — confirmed in the regenerated types, whose
   whole diff is 3 deletions inside the `candidates` table row types and nothing in either
   function's `Returns`.
5. **The narrowed GRANT removes an unexercised privilege.** The frontend writes exactly two columns
   to `candidates` — `updateFields` in `supabaseDataWriter.ts` is only ever populated with
   `terms_of_use_accepted` and `image`. It never wrote `name`. And the candidate read path never
   reads `entity_name`: `supabaseDataProvider.ts`'s candidate branch uses `entity_first_name` /
   `entity_last_name`; only the organization branch reads `base.name`, and organizations keep theirs.

Against that, an 11-minute suite would re-prove what pgTAP proves in one second — the role-simulated
RLS and grant surface, now including three assertions on this exact change. **The E2E suite was not
run and its 150/150 baseline is untouched by this plan.** The first plan in this phase that changes
an observable value — the `party` → `organization` rename is the obvious candidate — should run it.

## Deviations from plan

### Rule 3 — blocking issue auto-fixed

**1. `packages/dev-seed/src/template/permittedKeys.ts` needed a hand edit; RESEARCH said it would
not.** `156-RESEARCH.md` § "Criterion 7" item 9 records that this file "narrows automatically from
the regenerated types". Measured: it is a hand-written literal key array, and `yarn typecheck --force`
failed at `permittedKeys.ts:223` with `TS2322: Type '"name"' is not assignable to ...` (14 of 17
tasks successful). Removed `'name'` from the `candidates` array; typecheck then 22/22. The file was
added to Task 1's commit — it is not in the plan's `files_modified` list. **Every later plan in this
phase that drops or renames a column must expect the same edit**; recorded in `156-DISPOSITIONS.md`.

### Deviations of record (no code impact, but the plan's text was wrong)

**2. `lint:check` was an eleven-link chain, not six.** The plan instructs appending
`&& yarn assert:schema-migration-parity` "after `yarn assert:a11y-scan-wiring`", which was the end of
the chain when the plan was written. It is now link 6 of 11. **Appended at the end as link 12
instead**, and all eleven existing links verified to survive **by name**: `turbo run lint`, `eslint …
tests`, `typecheck:tests`, `typecheck`, `assert:i18n-catalog-namespaces`, `assert:a11y-scan-wiring`,
`assert:comment-hygiene`, `assert:edge-env-defaults`, `assert:declared-binaries`,
`assert:node-engine`, `assert:env-pair-registry`.

**3. Only `REVIEW-DB-07` marked complete, not all three in the plan's frontmatter.**
`REVIEW-DB-01` requires the `party` → `organization` rename across four trees — none of it is done
here; only its `db:reset-with-data`-green clause is proven. `REVIEW-DB-06` requires the
`upsert_answers` widening *and* the `merge_custom_data` treatment to be implemented; only the
requirement's *"with the choice recorded"* clause is met. Both left **Pending** with the unmet
clauses named rather than force-marked.

## Falsified premises — measured, with the measurement

Every one of these was inherited as fact and found false. Line citations were wrong across the board
in this plan's `read_first`; symbol- and table-anchored navigation was right every time.

1. **The `156-PATTERNS.md` per-file twin-line map is stale, and was stale before this plan ran.**
   Phase 152's comment sweep joined multi-line SQL comments, shifting every offset below each joined
   comment. Measured *pre*-edit: `schema/503-entity-rpcs.sql` `entity_name` at `:60` (mapped `:62`);
   its `get_candidate_user_data` candidate branch at `:114` (mapped `:121`); `00001` twins at `:3051`
   and `:3103` (mapped `:3159`, `:3211`); the third copy in `00002` at `:82` (plan and PATTERNS say
   `:90`); `00001`'s candidates `CREATE TABLE` at `:496`. The plan's own site list ("currently line
   512", "currently lines 27-29", "currently lines 1831 and 1826") is wrong in the same way. The
   `102-entities.sql:27` / `:7` pair is the one citation that reproduced exactly.

2. **The measured `schema/` ↔ `00001` difference is 4 hunks / 11 signature lines, not "exactly three
   hunks and 26 diff lines"** as both the plan and `156-RESEARCH.md` § "Drift check" state. Same
   three *semantic* deltas — 152's sweep inserted a standalone comment line between the two halves
   of the 00002 terms-of-use tightening, splitting it into two hunks, and collapsed multi-line
   comments, cutting the line totals. Concatenated `schema/` is 3279 lines and `00001` is 3271, not
   RESEARCH's 3409 / 3390. **The plan's instruction to "assert the hunk COUNT is exactly 3" was
   therefore not implemented as a hardcoded literal**; the count lives in the fixture's reviewed
   `# hunks: N` header, which `--update` rewrites and a human reads in the diff.

3. **`grep -c 'entity_name' …00002…` returns 2, not the acceptance criterion's 1.** The second hit
   is the `RETURNS TABLE` declaration `entity_name jsonb,` at `:57`, which the criterion's author did
   not count. The substantive half of the criterion holds: the one COALESCE line at `:82` names no
   candidate alias.

4. **Comment hygiene is enforced by a gate, not by discipline.** `156-PATTERNS.md` § Pattern S5 and
   `156-RESEARCH.md` § Pitfall 7 both record Phase 152 as not landed and D-N1 as honoured "by
   discipline". `assert:comment-hygiene` is live in `lint:check` — 1,584 files, 2 rules, 0
   violations. Every comment this plan wrote passed it.

5. **`REVIEW-DB-01..08` ARE defined in `.planning/REQUIREMENTS.md`** (17 `REVIEW-DB-` occurrences;
   `REVIEW-DB-07` at `:127` with a traceability row at `:287`). `156-CONTEXT.md` § O-2's claim that
   they are undefined is stale, exactly as this plan's objective predicted.

6. **The pgTAP suite reports 275 tests, not the plan's expected 267.** 267 is the sum of the
   `plan(N)` literals across the ten planned files; `00-helpers.test.sql` uses `no_plan()` and
   contributes 8 more. The pre-plan planned sum was 264, matching `database/SKILL.md`.

## Known stubs

None. No stub, no skipped test, no `<verify>` left unrun. Nothing was appended to
`.planning/WINDOWS.md`, because this plan left no defect behind.

## Threat flags

None. No new network endpoint, auth path, file-access pattern or trust-boundary schema change. The
change only narrows: a column and a column grant were removed, and both RPCs' output arity is
preserved so no consumer receives an unexpected field (T-156-04, disposition `accept`, holds as
written). T-156-01 and T-156-03 are mitigated as planned; T-156-02 was exercised — the third copy of
`get_nominations` in `00002` was edited and the reset replayed it green.

## What the operator needs to write

`.planning/STATE.md` is not touched by this plan, per instruction. It needs:

- Current plan advanced to **156-02**; phase 156 at **1/10 plans complete**.
- Decisions to record: the `merge_question_custom_data` rename (Contract C3, published — **Phase 157
  is unblocked**); the `upsert_answers` promotion; the drift-check adoption with the
  fold-into-`00001` variant declined.
- No blockers. No open questions requiring the operator overnight — the one item that could have
  needed a human judgement, the Contract-C3 choice, was explicitly delegated to Claude's Discretion
  by `156-CONTEXT.md` and is derivable from the code; the derivation is recorded in
  `156-DISPOSITIONS.md` rather than asserted.
- `.planning/ROADMAP.md` was **not** updated (plan-progress row), to avoid racing a concurrent
  editor on a shared integration branch. Phase 156's row should read 1/10.

## Self-Check: PASSED

All created files exist on disk (`scripts/assert-schema-migration-parity.mjs`,
`apps/supabase/scripts/schema-migration-parity.expected.txt`, `156-DISPOSITIONS.md`); all three
commits (`79f798d41`, `cee2084b6`, `d83c63119`) are present in `git log`.
