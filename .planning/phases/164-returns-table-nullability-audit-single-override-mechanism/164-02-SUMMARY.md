---
phase: 164-returns-table-nullability-audit-single-override-mechanism
plan: 02
subsystem: testing
tags: [supabase, postgrest, nullability, static-analysis, ci-gate, node-scripts, markdown-artifact]

requires:
  - phase: 164-returns-table-nullability-audit-single-override-mechanism
    provides: "164-01's database.overrides.ts (cross-checked by check 5) and the removal of the Phase-126 cast (which is what makes the criterion-3 grep read 0)"
  - phase: 156-supabase-schema-corrections
    provides: the apps/supabase/supabase/schema/** tree this plan derives the enumeration from
provides:
  - "scripts/assert-rpc-return-nullability.mjs — derives the RETURNS TABLE enumeration from the schema tree and runs five checks, each proven able to fire"
  - "packages/supabase-types/RPC-NULLABILITY.md — 3 RPCs, 51 output columns, every one with an evidence cell and a written disposition"
  - "the assert:rpc-nullability script and its lint:check link, so the gate reaches CI with no new job"
  - "a verified count of the RETURNS TABLE population: exactly three in the schema tree, derived rather than inherited from prose"
affects: [164-03, 164-04, 164-05, supabase-types regeneration, any future RETURNS TABLE RPC]

actuals:
  tokens: 16034
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Derived-plus-hand-written artifact: a --write mode that MERGES into a sentinel-delimited region and copies every other byte through, so machine-owned and human-owned halves live in one committed file without either clobbering the other"
    - "Two-half set equality: 1a against the machine region (satisfiable by --write) and 1b against the hand-written disposition rows (satisfiable only by a human), so a new column cannot reach a green gate undispositioned"
    - "Self-maintaining cast alternation: the grep's column list is the harvested schema output, never a hand-written literal"

key-files:
  created:
    - scripts/assert-rpc-return-nullability.mjs
    - packages/supabase-types/RPC-NULLABILITY.md
  modified:
    - package.json

key-decisions:
  - "Split the artifact into a sentinel-delimited derived region plus hand-written disposition tables, and made --write splice rather than rewrite — the plan's own escape hatch for the clobber problem, chosen over a merge-by-key parser"
  - "Rendered the derived region as a fenced text block rather than a markdown table, because prettier reformats markdown tables and would have fought the byte-stability criterion"
  - "Cited every schema and database.ts line by measurement, not by the plan's or RESEARCH's anchors — eight of them were stale, including three the acceptance criteria grep for verbatim"
  - "Broadened the override-key parser to accept any identifier shape after a probe showed a lowercase-only pattern silently DROPPED a mistyped key, making check 5 report clean over a set it never read"
  - "Kept the guard to the five checks the plan specifies and did not add a self-membership check, even though scripts/assert-adapter-casts.mjs sets that precedent — 164-03 owns the anti-vacuity spec"

patterns-established:
  - "A guard's own non-vacuity is proven by probe before it is trusted: every check here was made to fire and then reverted"
  - "A derived enumeration replaces a prose population claim, so a future RPC cannot be missed by having been overlooked"

requirements-completed: [CIGATE-04, CIGATE-05]

coverage:
  - id: D1
    description: "Every RETURNS TABLE RPC is enumerated against its output columns, derived from apps/supabase/supabase/schema/** by a committed script rather than written as prose"
    requirement: CIGATE-04
    verification:
      - kind: other
        ref: "node scripts/assert-rpc-return-nullability.mjs -> exit 0, summary names resolve_email_variables 4, get_nominations 32, get_candidate_user_data 15"
        status: pass
      - kind: other
        ref: "independent re-measurement: grep -rn 'RETURNS TABLE' apps/supabase/supabase/schema/ -> exactly 3 hits (502:20, 503:15, 503:96); grep over all CREATE OR REPLACE FUNCTION confirms no fourth"
        status: pass
    human_judgment: false
  - id: D2
    description: "A remedy is recorded per RPC including every no-change and its reason; all 51 output columns carry an evidence cell naming the SQL body or the generated table Row"
    requirement: CIGATE-04
    verification:
      - kind: other
        ref: "51 disposition rows parsed from RPC-NULLABILITY.md, split 4/0/4, 32/14/18, 15/6/9; 20 OVERRIDE lines total"
        status: pass
      - kind: other
        ref: "cross-check: the 20 OVERRIDE rows equal the 20 keys in src/database.overrides.ts exactly, 0 mismatches in either direction"
        status: pass
    human_judgment: false
  - id: D3
    description: "A future RPC or column cannot be silently missed: the gate fails on a fourth RPC, a new column, a removed column, or a duplicate function name"
    requirement: CIGATE-04
    verification:
      - kind: other
        ref: "probe B: a second get_nominations declaration added to 900-test-helpers.sql -> exit 1 naming both file:line pairs; reverted, 0 tree changes"
        status: pass
      - kind: other
        ref: "observed live before Task 2: three missing-disposition violations, one per RPC, from the same check"
        status: pass
    human_judgment: false
  - id: D4
    description: "The grep for ad-hoc nullability casts on RPC-return columns returns zero across apps, packages and tests, and is a committed standing gate rather than a one-shot check"
    requirement: CIGATE-05
    verification:
      - kind: other
        ref: "standalone criterion-3 grep -> exit 1, 0 lines (before was 1, per 164-01-SUMMARY)"
        status: pass
      - kind: other
        ref: "probe A and probe V6: a matching cast planted under apps/frontend/src/lib -> exit 1 naming file:line; removed, back to 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "The gate is not silently deletable: yarn lint:check invokes yarn assert:rpc-nullability"
    verification:
      - kind: other
        ref: "TURBO_FORCE=true yarn lint:check -> exit 0, 0 cached on both turbo invocations (11/11 and 23/23), with the guard's summary line printed last"
        status: pass
      - kind: other
        ref: "lint:check split on && contains the literal link 'yarn assert:rpc-nullability'; test:unit and test:e2e do not"
        status: pass
    human_judgment: false
  - id: D6
    description: "The committed artifact is byte-stable across repeated --write runs, so git diff --exit-code on it can never false-positive on ordering"
    verification:
      - kind: other
        ref: "two consecutive --write runs against the committed file -> git diff --exit-code exit 0; hand-written evidence and disposition cells survived (tree clean)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The gate is fail-closed on a vacuous corpus and on an unreadable override locus"
    verification:
      - kind: other
        ref: "probe C: both RETURNS TABLE tokens broken -> exit 1, 'harvested ZERO RETURNS TABLE functions from apps/supabase/supabase/schema (25 .sql files read)'; reverted"
        status: pass
      - kind: other
        ref: "probe D: an override key mistyped -> exit 1 naming it. probe E: Nullable declarations removed -> exit 1. Both reverted, 0 tree changes"
        status: pass
    human_judgment: false
  - id: D8
    description: "Criterion 4 (yarn db:types regeneration does not silently revert the guarantee) is NOT delivered by this plan"
    verification: []
    human_judgment: true
    rationale: "Out of this plan's scope by design; 164-03's CI drift job owns it. Recorded here so the phase gate does not read this plan's green as covering it."

duration: 18 min
completed: 2026-09-03
status: complete
---

# Phase 164 Plan 02: The Derived Enumeration and the Cast Gate Summary

**A schema-derived enumeration of all three `RETURNS TABLE` RPCs — 51 output columns, each with an evidence cell naming the SQL body or the generated table Row and a written disposition — guarded by a five-check `lint:check` link whose column alternation is harvested rather than hand-written, so a fourth RPC cannot arrive undispositioned.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-09-03T08:22:00Z
- **Completed:** 2026-09-03T08:40:40Z
- **Tasks:** 3
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- The `RETURNS TABLE` population is now **derived, not asserted**. `scripts/assert-rpc-return-nullability.mjs` walks `apps/supabase/supabase/schema/**`, harvests every declaration, and fails if the committed enumeration disagrees.
- **The three-RPC claim was verified independently against the schema, not inherited from prose** — and it holds. Exactly three, no fourth.
- All **51** output columns carry an evidence cell and a disposition. **20 overridden, 31 no-change**, and the 20 match `database.overrides.ts` exactly in both directions.
- `resolve_email_variables` has a full section with **zero override keys by decision**, two body citations, and a stated correction of the earlier reading that reasoned from the source column.
- **Criterion-3 grep: 1 line before (164-01), 0 lines after.** Now a committed standing gate rather than a one-shot check, with a self-maintaining alternation.
- **Every one of the five checks was proven able to fire by probe** and then reverted — the gate is not a green that means nothing.

## Task Commits

1. **Task 1: the derivation and the gate** — `ba5e5200c` (feat)
2. **Task 2: the enumeration artifact** — `2539dc325` (docs)
3. **Task 3: the `lint:check` wiring** — `5db2cd31e` (chore)
4. **Plan-level format fix** — `1fe208e4b` (style) — see Deviations

## The script's summary line, verbatim

```
RPC return-nullability guard (phase 164: CIGATE-04, CIGATE-05) — 3 RETURNS TABLE RPC(s) derived from apps/supabase/supabase/schema: resolve_email_variables 4, get_nominations 32, get_candidate_user_data 15; 32 snake_case column(s) in the cast alternation, 0 cast hit(s); 0 violation(s).
```

The 32-name alternation the harvest produces is exactly the 32 names `164-RESEARCH.md` § R5 arrived at by hand — an independent agreement, since the script derives it and never reads that list.

## The override / no-change split, per RPC

| RPC | Columns | Overridden | No change | Composition of the no-changes |
|---|---|---|---|---|
| `resolve_email_variables` | 4 | **0** | **4** | 1 `Json` (nullable by type) + 3 scalars proven non-null by the body |
| `get_nominations` | 32 | **14** | **18** | 13 `Json` + 5 scalars (`id`, `entity_type`, `election_id`, `constituency_id`, `entity_id`) |
| `get_candidate_user_data` | 15 | **6** | **9** | 7 `Json` + 2 scalars (`id`, `project_id`) |
| **Total** | **51** | **20** | **31** | |

Cross-checked mechanically: the 20 `OVERRIDE` rows in the artifact equal the 20 keys in `packages/supabase-types/src/database.overrides.ts`, with **0 mismatches in either direction**.

## Criterion-3 measurement (required by the plan's output spec)

**Before — exactly 1 line.** Recorded in `164-01-SUMMARY.md` § "Criterion-3 measurement":

```
apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:360:      const parentNominationId = row.parent_nomination_id as string | null | undefined;
```

**After — 0 lines**, `grep` exit **1**. Re-confirmed at plan close, after all four commits, running the plan's invocation verbatim.

**The grep does not swallow Phase 157's work.** Verified by construction rather than by assertion: the script's hit list is **empty**, so it cannot contain any Phase-157 anchor. See the drift table below for the naive-count discrepancy.

## Byte-stability check (required by the plan's output spec)

| Step | Exit |
|---|---|
| `node scripts/assert-rpc-return-nullability.mjs --write` (1st) | **0** |
| `node scripts/assert-rpc-return-nullability.mjs --write` (2nd) | **0** |
| `git diff --exit-code -- packages/supabase-types/RPC-NULLABILITY.md` | **0** |

Run against the **committed** artifact, so the check is real. The hand-written evidence and disposition cells survived both regenerations — `git status --porcelain` returned 0 lines afterwards.

## Non-vacuity: every check made to fire, then reverted (PROH-01)

A gate reported satisfied by an instrument nobody proved can fail is a false report. Each probe below was applied, observed, and reverted with `git checkout -- <specific file>`; the tree was confirmed clean after each.

| Probe | Check | Mutation | Observed | Reverted |
|---|---|---|---|---|
| A / V6 | 4 — cast grep | a matching cast planted in a new `.ts` under `apps/frontend/src/lib` | exit **1**, `ad-hoc nullability cast on an RPC return column — apps/frontend/src/lib/__rpc_null_probe.ts:1` | file removed, count back to 0 |
| B | 2 — duplicate name | a second `get_nominations` declared in `900-test-helpers.sql` | exit **1**, `'get_nominations' is declared 2 times in the scanned tree — …503-entity-rpcs.sql:9 and …900-test-helpers.sql:…` | 0 tree changes |
| C | 3 — empty harvest | both `RETURNS TABLE (` tokens broken | exit **1**, `harvested ZERO 'RETURNS TABLE' functions from 'apps/supabase/supabase/schema' (25 .sql file(s) read)` | 0 tree changes |
| D | 5 — override cross-check | `'parent_nomination_id'` mistyped to `'parent_nomination_id_TYPO'` | exit **1**, `widens 'get_nominations.parent_nomination_id_TYPO', which '…503-entity-rpcs.sql' does not declare` | 0 tree changes |
| E | 5 — cross-check corpus | every `Nullable<` declaration removed from the override locus | exit **1**, `no Nullable<'<rpc>', ...> declaration could be read` | 0 tree changes |
| — | 1b — disposition rows | observed **live**, not staged: before Task 2 wrote the tables, the gate reported 3 violations, one per RPC | exit **1** | resolved by Task 2 |

**Probe D found a real hole in my own guard and was the reason for a fix.** The first attempt at probe D did **not** fire: the override-key parser matched `'[a-z0-9_]+'` only, so an uppercase typo key was silently dropped and check 5 reported clean over a set it had never read — precisely the inert-guard shape the check exists to prevent. The pattern was broadened to `'[A-Za-z0-9_$]+'` and the probe then fired. Recorded because the check would otherwise have shipped unable to see the defect it names.

## Verification results (every exit code read directly, never through a pipe)

| Gate | Exit | Detail |
|---|---|---|
| `node scripts/assert-rpc-return-nullability.mjs` | **0** | 3 RPCs, 4/32/15, 32-name alternation, 0 cast hits, 0 violations |
| two consecutive `--write` + `git diff --exit-code` | **0** | byte-stable against the committed file |
| criterion-3 grep, standalone | **1** (grep: no match) | **0 lines** |
| `yarn assert:rpc-nullability` | **0** | the new script entry runs |
| `TURBO_FORCE=true yarn lint:check` | **0** | **0 cached** on both turbo invocations (11/11 lint, 23/23 typecheck); the guard's summary line printed last, so the new link demonstrably executed |
| `yarn test:unit` | **0** | 25/25 workspaces; frontend 88 files / 1591 tests, dev-seed 53 / 603; **0 failed, 0 skipped** |
| `yarn format:check` | **0** | after the style commit below |
| `npx prettier --check` on the artifact | **0** | the generated region survives prettier untouched |
| `git status --porcelain` | — | **0 lines**, clean |

**E2E was not run.** This plan's `<verification>` block does not call for a suite, and no task touches runtime behaviour: the deliverables are a static-analysis script, a markdown artifact, and two `package.json` script lines. Nothing the frontend compiles against changed, and `lint:check` ran the full monorepo typecheck (23/23, 0 cached) regardless. Recorded as an outstanding gate under `human_judgment` in D8's sibling scope rather than silently skipped.

## Decisions Made

- **The artifact is split, and `--write` splices.** The plan foresaw the clobber problem and required it be resolved in Task 1 rather than by dropping the check. The chosen shape: a `<!-- BEGIN DERIVED -->` / `<!-- END DERIVED -->` region that `--write` rewrites, and every other byte copied through. That makes the byte-stability criterion true by construction while leaving the 51 hand-written disposition rows untouchable by the script.
- **The derived region is a fenced `text` block, not a markdown table.** Prettier reformats markdown tables (it pads every cell to the column width), which would have fought byte-stability on every regeneration. A fenced block is left alone by prettier, verified by `npx prettier --check`.
- **Set equality is two halves, and the second one cannot be auto-satisfied.** 1a compares the harvest to the derived region — which `--write` can fix. 1b compares it to the hand-written disposition rows — which only a human can fix. Without 1b the whole "a future RPC is not missed" property would collapse into "a future RPC is auto-added to a list nobody read".
- **No self-membership check was added**, even though `scripts/assert-adapter-casts.mjs` establishes that precedent in this exact family (its Check 3 asserts its own `lint:check` link). Plan `164-03` owns the anti-vacuity spec; duplicating it here would give the phase two owners for one property.

## Measured drift from the plan and RESEARCH (reported, not worked around)

Every anchor was re-measured before being cited. **None was resolved by writing a false citation into a permanent artifact to satisfy a grep.**

| Claim | Measured at HEAD | Handling |
|---|---|---|
| The migrations tree has **four** `RETURNS TABLE` occurrences for the three functions, from `00001` (×3) and `00002:39` | **Five**, from **three** files: `00001` at `:2903`, `:3045`, `:3122`; `00002` at `:36`; and **`00004_question_rpcs_and_nomination_election_round.sql:84`**, which the plan and RESEARCH never mention — it drops and recreates `get_nominations` with the `p_election_round` parameter | Strengthens the D-M1(a) exclusion rather than weakening it. The docblock states the count as measured. |
| `502-email-helpers.sql:22` declaration, `RETURNS TABLE` at `:27` | `:15` and `:20` | Cited as measured |
| `503-entity-rpcs.sql:11` / `:16` (`get_nominations`) and `:97` / `:100` (`get_candidate_user_data`) | `:9` / `:15` and `:93` / `:96` | Cited as measured |
| Task 2 acceptance greps for `502-email-helpers.sql:64` (the `IF u_email IS NULL`) | The `IF` is at **`:57`**, the `CONTINUE` at **`:59`** | **Criterion unsatisfiable as written.** `grep -c '502-email-helpers.sql:64'` returns **0**. The artifact cites `:57` and `:59`, which are correct. The sibling `:59` grep returns 1 — correctly, for the `CONTINUE`. |
| Task 2 acceptance greps for `503-entity-rpcs.sql:88` (the RLS leak guard) | The guard is at **`:84`** — already re-measured by `164-01` | **Criterion unsatisfiable as written**; `grep -c` returns 0. The artifact cites `:84` (twice). |
| Task 2 acceptance greps for `503-entity-rpcs.sql:132` (the `NULL::text` pair) | It is at **`:128`**; `NULL::timestamptz` at `:127` | **Criterion unsatisfiable as written**; `grep -c` returns 0. The artifact cites `:128` (five times) and `:127`. |
| RESEARCH § R2's `database.ts` anchors for `nominations` (block at `:685`, columns `:687`–`:710`) | Block at **`:682`**, columns **`:684`–`:707`** — a uniform −3 | Cited as measured |
| RESEARCH § R2's `database.ts` anchors for `candidates` `organization_id :236`, `sort_order :240`, `subtype :241`, `terms_of_use_accepted :242`, `project_id :237` | `:235`, `:239`, `:240`, `:241`, `:236` — a −1 from `:231` onward. (`first_name :229`, `last_name :234`, `id :230` verified **exact**) | Cited as measured |
| RESEARCH's `Returns` blocks: `get_candidate_user_data` `:1167-1186`, `get_nominations` `:1191-1229`, `resolve_email_variables` `:1270-1281` | `:1166-1182`, `:1195-1228`, `:1283-1288` | Cited as measured |
| Task 1 acceptance: the naive `grep -rn " as .*\| null"` over the adapter dir should be **32** (was 33) | **16** | The count fell further because Phase 157 plan 07 replaced fifteen `as Json as unknown as X` casts with a zod `safeParse` (recorded in `scripts/assert-adapter-casts.mjs`'s docblock) **after** the 164 research pass. The criterion's *intent* — that the gate must not swallow Phase 157's work — is met and reported: the script's hit list is **0** against those 16, so no Phase-157 anchor can be in it. |
| The `allow_open` attribution note is at `supabaseDataProvider.ts:573`, `database.ts:1011` | **`:613`** and **`database.ts:1008`** | Cited as measured in the artifact |
| The `send-email` `preferred_locale` read is at `:170` | **`:169`** (the `rpc(` call at `:134` verified exact) | Cited as measured |
| Task 1 action: "There is **no in-repo analog** for a `--write` mode in this script family — no existing `scripts/assert-*.mjs` reads `process.argv`" | **False at HEAD.** Five do: `assert-schema-migration-parity.mjs:94` (`--update`, and it regenerates a committed fixture from the *same* schema tree), `assert-node-engine.mjs:258`, `assert-comment-hygiene.mjs:189`, `assert-env-pairs-agree.mjs:73`, `assert-env-pair-registry.mjs:495` | Followed the existing precedent instead of designing from scratch, and cited it in the docblock |
| Task 3 read_first: `package.json:23-36`, with `:25-27` the three `assert:*` entries, `:35` `lint:check`, `:36` `typecheck` | **Thirteen** `assert:*` entries at `:25-37`; `lint:check` at **`:47`** already chaining **eleven** guards; `typecheck` at `:48`; `test:unit` `:40`; `test:e2e` `:42` | Appended as instructed; the membership-not-position rationale still holds and was re-read at `ciTypecheckGate.test.ts:57-58` and `:63-69` |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The override-key parser silently dropped a malformed key, making check 5 unable to fail**

- **Found during:** Task 1, probe D
- **Issue:** `parseOverrideKeys` matched quoted strings with `'[a-z0-9_]+'`. A key mistyped as `parent_nomination_id_TYPO` contains uppercase, so it was not matched at all — the key vanished from the parsed set and check 5 reported clean. A cross-check that cannot see a malformed key is a cross-check with no inputs, which is the exact inert-guard shape the check exists to prevent.
- **Fix:** broadened to `'[A-Za-z0-9_$]+'`, with the reason written into the function's docblock so the next reader does not "tighten" it back.
- **Verification:** probe D re-run — exit 1, message naming `get_nominations.parent_nomination_id_TYPO`. Reverted; 0 tree changes.
- **Committed in:** `ba5e5200c` (Task 1 commit)

**2. [Rule 3 - Blocking] `scripts/assert-rpc-return-nullability.mjs` was not prettier-formatted**

- **Found during:** plan-level verification, after Task 3
- **Issue:** `yarn format:check` exited **1** naming the new script. The per-task gates do not run prettier, and `scripts/` is outside the comment-hygiene scan roots, so nothing caught it earlier.
- **Fix:** `npx prettier --write` on the file — 3 insertions, 1 deletion, no behaviour change.
- **Verification:** every Task 1 source acceptance grep re-run afterwards and still holding (schema-root literal 2, migrations-in-code 0, `node:` imports 3, non-`node:` imports 0, `--write` literal 1, `.planning` 0); guard still exit 0 with the same summary line; the cast-grep non-vacuity probe re-run post-format and still fires. `yarn format:check` then exit 0.
- **Committed in:** `1fe208e4b` (separate `style` commit rather than a history rewrite of `ba5e5200c`)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking). **Impact:** the first was necessary for one of the plan's own checks to be honest; the second for the repository's format gate. No scope creep, no new casts, no suppression, and no acceptance criterion satisfied by editing prose to match a stale count.

## Unsatisfiable acceptance criteria (measured, reported, not met)

Three of Task 2's acceptance greps name line numbers that are wrong at HEAD. Satisfying them would have meant writing a **false citation into a permanent artifact** — the exact shape lesson 3 and PROH-01 forbid. They are recorded here rather than met:

| Criterion as written | Returns | Correct anchor, used instead |
|---|---|---|
| `grep -n '502-email-helpers.sql:64'` ≥ 1 | **0** | `:57` (`IF u_email IS NULL THEN`) and `:59` (`CONTINUE;`) |
| `grep -n '503-entity-rpcs.sql:88'` ≥ 1 | **0** | `:84` (`AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL`) |
| `grep -n '503-entity-rpcs.sql:132'` ≥ 1 | **0** | `:128` (`NULL::text, NULL::text, NULL::uuid`) |

The *substance* each criterion asks for is present: the `resolve_email_variables` reason is cited rather than asserted, the `entity_id` disposition records its dependency on the leak guard, and `first_name`/`last_name` cite the SQL body rather than the table. Only the line numbers differ, and they differ because the plan's were stale. A fourth criterion — `grep -n '502-email-helpers.sql:59'` ≥ 1 — **is** satisfied, and correctly so: `:59` really is the `CONTINUE`.

Every other acceptance criterion across the three tasks passes as written.

## Issues Encountered

None beyond the two deviations. No fix required more than one attempt.

## Known Stubs

None. No placeholder values, no unwired data sources, no `TODO`/`FIXME` introduced. The artifact's 51 disposition cells are all filled; check 1b would fail if any were absent.

## Threat Flags

None. This plan adds no network endpoint, no auth path and no schema change; the script reads files and never writes outside `packages/supabase-types/RPC-NULLABILITY.md`.

`T-164-01` (the `get_nominations` RLS leak guard) is **mitigated as planned**: `RPC-NULLABILITY.md` records, in both the `entity_id` row and the section preamble, that the column's "no change needed" disposition depends on `apps/supabase/supabase/schema/503-entity-rpcs.sql:84`, so a future phase touching that clause sees the disposition voided. The guard was re-verified intact at that line and no SQL was modified.

`T-164-07` (a cast grep narrowed until it cannot match) is **mitigated by measurement, not by claim**: a recorded before-count of 1, an after-count of 0, an alternation derived from the schema rather than hand-written, and probes A and V6 showing the grep firing on a planted cast and returning to 0 when it is removed.

`T-164-08` (a hand-maintained enumeration drifting silently) is **mitigated by check 1's two halves**, with the second half observed failing live before Task 2 wrote the tables.

## User Setup Required

None.

## Next Phase Readiness

Ready for `164-03` (the repo-meta anti-vacuity spec and the `supabase-types-drift` CI job). Three things it inherits:

- **`scripts/assert-rpc-return-nullability.mjs` is a member of the `lint:check` chain**, verified by splitting the chain on `&&`. `164-03`'s `packages/dev-seed/tests/rpcNullabilityGate.test.ts` should assert that **membership, never terminal position** — `ciTypecheckGate.test.ts:57-58` records why, and this plan appended a further link past `assert:no-session-in-loads` precisely because appending is safe.
- **`--write` must never be wired into CI.** It is not wired anywhere today; only the flagless form is.
- **Criterion 4 is still not delivered.** `164-03` owns it. Do not read this plan's green as covering it.

One finding worth carrying to `164-03`'s CI work: `apps/supabase/supabase/migrations/00004_question_rpcs_and_nomination_election_round.sql:84` is a **fifth** `RETURNS TABLE` occurrence in the migrations tree that no phase document mentions. It changes nothing here (the scan is schema-scoped) but it means any future instrument tempted to read the migrations tree would find three redefining files, not two.

---
*Phase: 164-returns-table-nullability-audit-single-override-mechanism*
*Completed: 2026-09-03*

## Self-Check: PASSED

Both created files verified present on disk with `[ -f ]`. All four commits (`ba5e5200c`, `2539dc325`, `5db2cd31e`, `1fe208e4b`) verified present in `git log --oneline --all`. Every task acceptance criterion and the plan-level `<verification>` block re-run at plan close: guard exit 0, byte-stability `git diff --exit-code` 0, criterion-3 grep 0 lines, `TURBO_FORCE=true yarn lint:check` exit 0 with 0 cached, `yarn test:unit` exit 0 with 0 failed and 0 skipped, `yarn format:check` exit 0, working tree clean. Three acceptance criteria are reported unsatisfiable-as-written above with their measured replacements; none was met by bending code or prose.
