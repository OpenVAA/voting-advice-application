---
phase: 164-returns-table-nullability-audit-single-override-mechanism
plan: 01
subsystem: api
tags: [typescript, supabase, postgrest, type-generation, nullability, rpc]

requires:
  - phase: 156-supabase-schema-corrections
    provides: the regenerated packages/supabase-types/src/database.ts this override sits on top of
  - phase: 157-adapter-boundary-and-typing
    provides: the cleaned supabaseDataProvider whose remaining Json-narrowing casts define what is OUT of criterion 3's scope
provides:
  - "packages/supabase-types/src/database.overrides.ts — the single hand-maintained locus for RPC return-row nullability"
  - "packages/supabase-types/src/database.merged.ts — the mechanical Omit-then-intersect merge producing the exported Database"
  - "a typecheck script for @openvaa/supabase-types, so turbo run typecheck no longer skips the package"
  - "20 evidenced RPC return columns widened to include null across get_nominations and get_candidate_user_data"
  - "the Phase-126 ad-hoc cast on row.parent_nomination_id removed; criterion-3 grep 1 -> 0"
  - "a committed root-nomination behavioural pin, proven live by assertion inversion"
affects: [164-02, 164-03, 164-04, 164-05, supabase-types regeneration, adapter boundary work]

actuals:
  tokens: 4016
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "RPC return-row nullability override: Omit-then-redeclare in one locus, never a per-site cast"
    - "K extends keyof ReturnsRow<F> as the constraint that turns a stale override key into a compile error"

key-files:
  created:
    - packages/supabase-types/src/database.overrides.ts
    - packages/supabase-types/src/database.merged.ts
    - .planning/todos/pending/2026-09-03-datawriter-row-erasure-absorbs-rpc-nullability.md
  modified:
    - packages/supabase-types/package.json
    - packages/supabase-types/src/index.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
    - package.json
    - yarn.lock

key-decisions:
  - "Used the repo's own no-extension relative-import convention, not the plan's '.js' instruction, because CLAUDE.md's canonical package paradigm forbids .js on TS-internal relative imports and no existing barrel line used one"
  - "Added a typescript devDependency to packages/supabase-types: tsc was resolving to 3.8.3 from the supabase CLI, so the new typecheck script could not compile the package at all"
  - "Re-exported FunctionReturnOverrides from the barrel to make the merged Database nameable at consumers, rather than annotating three consumer files"
  - "Discharged the two widening errors with the data model's smart default (?? ''), not a cast, and wrote the SQL-level non-null proof in-file"
  - "Left the dataWriter's whole-row type erasure in place and filed it, rather than expanding scope into Phase-157 territory"

patterns-established:
  - "Single override locus: database.overrides.ts holds policy, database.merged.ts holds only the mechanical merge"
  - "A widening error is discharged by a guard or an evidenced narrowing, never by re-introducing a cast"

requirements-completed: [CIGATE-05]

coverage:
  - id: D1
    description: "RPC return-row nullability is restored in exactly one documented locus (database.overrides.ts), merged into the exported Database, with no per-site casts"
    requirement: CIGATE-05
    verification:
      - kind: other
        ref: "grep -c 'Omit<ReturnsRow' packages/supabase-types/src/database.overrides.ts -> 1; grep -c 'keyof FunctionReturnOverrides' database.merged.ts -> 1"
        status: pass
      - kind: other
        ref: "criterion-3 grep over apps/packages/tests -> 0 lines (was 1)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The Phase-126 ad-hoc cast on row.parent_nomination_id is removed and the != null guard now reads as live code"
    requirement: CIGATE-05
    verification:
      - kind: other
        ref: "git diff supabaseDataProvider.ts (Task 1) touches exactly 1 line; sed shows bare property read followed by the unchanged guard"
        status: pass
      - kind: other
        ref: "type probe: Row['parent_nomination_id'] = null compiles; Row['entity_id'] = null is TS2322"
        status: pass
    human_judgment: false
  - id: D3
    description: "All 20 evidenced columns widened, the 7 provably-non-null columns untouched, resolve_email_variables absent by decision"
    requirement: CIGATE-05
    verification:
      - kind: other
        ref: "20-key census: all override keys >= 1, all 6 non-override keys 0"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/supabase-types typecheck exit 0 (the K extends keyof ReturnsRow<F> constraint proves every key names a real generated column)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A root nomination is exercised by a committed passing test asserting parentNominationId null and no parentNominationType"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts#a ROOT nomination (parent_nomination_id IS null) yields parentNominationId null and no parentNominationType"
        status: pass
    human_judgment: false
  - id: D5
    description: "The package is now typechecked in CI's turbo graph, so the override's generic constraint is actually compiled"
    verification:
      - kind: other
        ref: "npx turbo run typecheck --dry=json lists @openvaa/supabase-types#typecheck; TURBO_FORCE=true npx turbo run typecheck exits 0 with 0 cached"
        status: pass
    human_judgment: false
  - id: D6
    description: "Criterion 4 (regeneration does not silently revert) is NOT delivered by this plan — it is plan 164-03's CI drift job"
    verification: []
    human_judgment: true
    rationale: "Out of this plan's scope by design. The mechanical basis holds (yarn db:types rewrites only src/database.ts, verified), but nothing in this plan proves a regeneration cannot revert the guarantee. Plan 164-03 owns that gate."

duration: 21 min
completed: 2026-09-03
status: complete
---

# Phase 164 Plan 01: Returns-Table Nullability — Single Override Mechanism Summary

**A hand-maintained `database.overrides.ts` that Omit-then-redeclares 20 evidenced `RETURNS TABLE` output columns as nullable, merged into the exported `Database`, replacing the Phase-126 per-site cast — with the null-guard at the consumer now reading as live code.**

## Performance

- **Duration:** 21 min
- **Started:** 2026-09-03T10:54:00Z
- **Completed:** 2026-09-03T11:15:00Z
- **Tasks:** 3
- **Files modified:** 9 (3 created, 6 modified)

## Accomplishments

- `packages/supabase-types/src/database.overrides.ts` is the single locus declaring RPC return-row nullability. `Nullable<F, K extends keyof ReturnsRow<F>>` uses `Omit` before re-declaring, so the widened type **replaces** the generated non-null one instead of intersecting back into it, and a key that no longer names a generated column is a compile error rather than a silent no-op.
- 20 evidenced columns widened: 14 on `get_nominations`, 6 on `get_candidate_user_data`. The 7 provably-non-null columns were left alone, and `resolve_email_variables` has zero override keys by written decision.
- The Phase-126 ad-hoc cast is gone. **Criterion-3 grep: 1 line before, 0 lines after.**
- `@openvaa/supabase-types` now has a `typecheck` script and appears in the turbo graph — it did not before, so the override's constraint would have compiled nowhere.
- A root nomination is pinned by a committed test whose assertion was **proven live by inversion**, not merely un-flagged by the compiler.

## Task Commits

1. **Task 1 (tracer): one column end to end** — `3274e5482` (feat)
2. **Task 2: expand to all 20 columns and triage the fallout** — `e42ce7efa` (fix)
3. **Task 3: root-nomination behavioural pin** — `fbb84d88c` (test)

## Criterion-3 measurement (required by the plan's output spec)

**Before (Task 1, Step 0) — exactly 1 line, verbatim:**

```
apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:360:      const parentNominationId = row.parent_nomination_id as string | null | undefined;
```

**After — 0 lines.** Re-confirmed at plan close, after all three commits.

## Classification of every other `as … | null` cast in the adapter

The success criteria require each one classified, not silently left or silently deleted.

| Line | Cast | In scope? | Reason |
|---|---|---|---|
| 360 (was) | `row.parent_nomination_id as string \| null \| undefined` | **IN SCOPE — removed** | A direct nullability cast on a `get_nominations` RPC **return column**. The one Phase-126 cast. |
| 417-423 | `entityObj.name/shortName/info/color/order/subtype/customData as … \| null \| undefined` | **OUT** | Not RPC-return reads. `entityObj` is the output of the local `toDataObject()` mapper, already transformed to camelCase. No RPC return row has these names, and the criterion-3 alternation deliberately excludes them. |
| 575 | `data as GetQuestionsPayload \| null` | **OUT** | `get_questions` is `RETURNS jsonb`, not `RETURNS TABLE` — its generated type is the opaque `Json`, so it has no return-row columns to override. Phase-157-owned trust-boundary narrowing (its `// reason:` comment says so). |
| 598 | `row.choices as Array<LocalizedChoice> \| null` | **OUT** | Same `get_questions` JSONB payload; a typed-JSONB read with no schema, guarded at runtime by `Array.isArray`. |
| 612 | `(row.allow_open as boolean \| null) ?? true` | **OUT** | Same JSONB payload. |
| 630 | `(obj.name as string \| null) ?? ''` | **OUT** | Reads the local `toDataObject()` output, not an RPC row. |

The criterion-3 grep is scoped to snake_case RPC column names precisely so it cannot swallow the Phase-157 class. That scoping was verified, not assumed: the out-of-scope casts do not match it, so the gate reads 0 without any of them being touched.

## Type errors the widening surfaced, and how each was discharged

Not "none appeared" — **two appeared**, both real.

| # | Site | Error | Discharge |
|---|---|---|---|
| 1 | `supabaseDataProvider.ts:443` | `Type 'string \| null' is not assignable to type 'string'` on `firstName: row.entity_first_name` | `?? ''` — the data model's smart default, matching `:448` and `:630` in the same file and CLAUDE.md's smart-defaults rule |
| 2 | `supabaseDataProvider.ts:444` | same, on `lastName: row.entity_last_name` | same |

`organizationId: row.entity_organization_id` on the same object did **not** error, because `CandidateData.organizationId` is already `Id | null`. That asymmetry is the evidence that the two errors are real rather than an artifact.

**Why a guard and not a narrowing-by-assertion.** These two columns are provably non-null *on the candidate branch*: `nominations.entity_type` is a GENERATED column derived from whichever FK is set, under `CHECK (num_nonnulls(candidate_id, organization_id, faction_id, alliance_id) = 1)` (`104-nominations.sql:34-39`, `:51`), so an `entity_type` of `candidate` means the other three LEFT JOINs cannot match; the RPC's own `COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL` filter (`503-entity-rpcs.sql:84`) then guarantees the candidates row was visible; and `candidates.first_name`/`last_name` are `NOT NULL`. That three-link chain lives entirely in SQL where TypeScript cannot see it. Asserting it away with a cast would have reproduced exactly the construct this phase removes (PROH-02), so the fallback was used instead and the chain written into the code comment. If the invariant ever breaks, the candidate renders with an empty name rather than the string `"null"`.

**Zero new casts** were introduced anywhere: `git diff -- apps/ packages/ | grep -cE '^\+.*( as (string|number|boolean)| as any|@ts-(ignore|expect-error))'` returns **0**.

## Task 3 assertion-inversion check (both exit codes, as required)

| Run | Assertion | Exit code | Observed |
|---|---|---|---|
| Inverted | `expect(nom?.parentNominationId).not.toBeNull()` | **1** | `AssertionError: expected null not to be null` — 1 failed, 67 passed |
| Reverted | `expect(nom?.parentNominationId).toBeNull()` | **0** | 68 passed, 0 failed, 0 skipped |

The inverted run's message proves the assertion reaches real code **and** that the value genuinely is `null` — not that the test is vacuous. Revert proven complete: `grep -c "not.toBeNull"` returns 0, and `toBeNull()` count went from 1 at HEAD to 2 (delta exactly +1).

## Verification results (every exit code read directly, never through a pipe)

| Gate | Exit | Detail |
|---|---|---|
| `yarn workspace @openvaa/supabase-types typecheck` | 0 | proves all 20 keys name real generated columns |
| `TURBO_FORCE=true npx turbo run typecheck` | 0 | 23/23 tasks, **0 cached** (forced, not a replay) |
| `yarn workspace @openvaa/frontend check` | 0 | 2750 files, **0 errors, 0 warnings** |
| `yarn test:unit` | 0 | 25/25 workspaces; frontend 88 files / 1590 tests; 0 failed, 0 skipped |
| `yarn workspace @openvaa/frontend build` | 0 | production build — run per the standing lesson that typecheck + unit does not prove a types-package change sound |
| `yarn lint:check` | 0 | includes the comment-hygiene guard, 0 violations |
| `yarn format:check` | 0 | |
| criterion-3 grep | — | 0 lines |
| `git status --porcelain` | — | clean |

E2E was not run: this plan's verification does not call for a full suite, and no plan task touches runtime behaviour reachable only through the browser. The one behavioural change (`?? ''` on a branch whose input is proven non-null) is covered by the unit suite. Recorded as an outstanding gate under `human_judgment` in D6's sibling scope, not silently skipped.

## Decisions Made

- **`.js` import extensions: followed CLAUDE.md, not the plan.** The plan asserts "the `.js` extension is the house convention — all four existing barrel lines use it". Measured at HEAD, **zero** barrel lines used it (`from './database'`), `moduleResolution` is `Bundler`, and CLAUDE.md's canonical package paradigm explicitly says "no `.js` extensions on TS-internal relative imports". CLAUDE.md wins. This also makes the plan's `must_haves` artifact pattern `database\.merged\.js` unsatisfiable as written — see Deviations.
- **Two files, not one**, per D-M2(a)'s "exactly one documented locus": `database.overrides.ts` is the locus a human edits; `database.merged.ts` adds no policy.
- **The dataWriter was left alone and filed instead.** Its whole-row `as Record<string, unknown>` erasure absorbs the widening, so no error appeared there. Fixing it means Phase-157 adapter-boundary work, out of scope.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `packages/supabase-types` had no `typescript` devDependency, so the new `typecheck` script ran TypeScript 3.8.3**

- **Found during:** Task 1, Step 1
- **Issue:** `tsc` in that workspace resolved to **3.8.3**, bundled by the `supabase` CLI devDependency. The first `typecheck` run exited 1 with hundreds of TS1005/TS1110 syntax errors inside `@types/node` — a version artifact, not a code defect. The plan's Step 1 treats adding the script as sufficient; it is not.
- **Fix:** added `"typescript": "catalog:"` to devDependencies, verbatim from `packages/core`. This introduces **no new package**: `typescript: ^5.8.3` was already in the yarn catalog, already in the lockfile, already installed at root. The lockfile diff is a **single line**, confirming no new resolution. `tsc --version` then reported 5.9.3 and typecheck exited 0.
- **Files modified:** `packages/supabase-types/package.json`, `yarn.lock`
- **Commit:** `3274e5482`

**2. [Rule 3 - Blocking] `FunctionReturnOverrides` was not nameable through the package's public surface**

- **Found during:** Task 1, Step 5 verification
- **Issue:** `yarn workspace @openvaa/frontend check` exited 1 with 3 errors: *"The inferred type of `createSupabaseBrowserClient` cannot be named without a reference to `.../database.overrides`. This is likely not portable."* at `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/routes/+layout.ts`. The merged `Database` expands to a structure mentioning a type that had no path through the entry point.
- **Fix:** re-exported `FunctionReturnOverrides` from `src/index.ts`. One line at the single locus, rather than annotating three consumer files.
- **Verification:** frontend check 0 errors, 0 warnings. **No consumer file changed its import** — the plan's truth holds.
- **Commit:** `3274e5482`

**3. [Rule 1 - Bug] Multi-line `//` and block comments violated the D-A4 comment-hygiene rule**

- **Found during:** Task 1 and again in Task 2
- **Issue:** `yarn lint:check` exited 1 with 6 then 20 violations of rule 2 (a comment line ending without terminal punctuation whose successor continues at the same indent). The Task-2 recurrence is instructive: the guard scans **tracked** files, so the two new files were invisible to it while untracked and were first scanned only after Task 1's commit.
- **Fix:** joined every affected comment into single long lines, the house convention already used throughout the adapter.
- **Commit:** `3274e5482`, `e42ce7efa`

**4. [Rule 1 - Bug] Root `package.json` carried a mis-indented line**

- **Found during:** Task 1, after the required `yarn install`
- **Issue:** `"assert:cookie-names"` was indented 2 spaces instead of 4; `yarn install` normalized it, dirtying the tree.
- **Fix:** included the whitespace-only normalization rather than leaving the tree dirty against the plan's "git status clean" verification. Zero behavioural change.
- **Commit:** `3274e5482`

---

**Total deviations:** 4 auto-fixed (2 blocking, 2 bugs). **Impact:** all four were prerequisites for the plan's own gates to run or pass honestly. No scope creep; no new casts; no suppression.

## Measured drift from the plan and ROADMAP (reported, not worked around)

Every one of these was re-measured rather than inherited. **None was resolved by bending code or prose to fit a stale citation.**

| Plan/ROADMAP claim | Measured at HEAD | Handling |
|---|---|---|
| The cast is at `supabaseDataProvider.ts:300` | It is at **`:360`** | Anchored by content. The line number is wrong in the plan objective, `must_haves.truths`, `success_criteria`, CONTEXT § D-M2 and the ROADMAP. |
| "the `.js` extension is the house convention — all four existing barrel lines use it" | **Zero** barrel lines used `.js`; CLAUDE.md forbids it | Followed CLAUDE.md. Makes `must_haves` artifact pattern `./database.merged.js` and key_link pattern `database\.merged\.js` **unsatisfiable by any correct implementation** — reported, not met. |
| `tsconfig.tsbuildinfo` "is tracked and not gitignored"; restore it with `git checkout --` after each `tsc` run | **Untracked** — `.gitignore:29` has `*.tsbuildinfo`. `tsc --noEmit` did not write it either. | The prescribed `git checkout --` restore is a no-op and was unnecessary. Pitfall 3 in RESEARCH does not apply. |
| Sibling test titled `...not in the result set (P01)` | Actual title has **no** `(P01)` suffix | New test placed adjacent as instructed. |
| `get_candidate_user_data` Returns at `database.ts:1167-1186`; `get_nominations` at `:1191-1229` | `:1166-1182` and `:1195-1228` | Cosmetic; blocks located by name. |
| RLS leak guard at `503-entity-rpcs.sql:88`; UNION NULL literals at `:131-132` | `:84` and `:127-128` | Drift of 4 lines. **The evidence itself verified exact** — the guard and the four `NULL::` literals are present and mean what RESEARCH says. |
| RESEARCH assumption A2: "UNVERIFIED whether any error appears at the dataWriter call site" | **No error appears**, and the reason is type erasure (`as Record<string, unknown>`), not correctness | Resolved and filed under `.planning/todos/pending/`. |

## Issues Encountered

None beyond the four deviations above. No fix required more than one attempt.

## TDD Gate Compliance

Task 3 carried `tdd="true"`. RED and GREEN were both **observed** (exit 1 with a meaningful assertion failure, then exit 0), but committed as a **single** `test(164-01)` commit rather than a RED commit followed by a GREEN commit. The plan prescribes this shape explicitly — its acceptance criterion is an assertion-inversion check, and the implementation under test already existed, so a separate RED commit would have meant knowingly committing a broken test. Both exit codes are recorded above.

## Known Stubs

None. No placeholder values, no unwired data sources, no `TODO`/`FIXME` introduced.

## Threat Flags

None. This plan adds no network endpoint, no auth path, no file access and no schema change. `T-164-01`'s dependency on the `IS NOT NULL` RLS leak guard was verified intact (`503-entity-rpcs.sql:84`) and no SQL was modified. `T-164-02` (a `DataProvisionError` blanking the nominations surface) is mitigated as planned: the evidenced columns are widened and the both-or-neither branch is byte-unchanged.

## User Setup Required

None.

## Next Phase Readiness

Ready for `164-02` (the enumeration script and `RPC-NULLABILITY.md`). Two things it inherits:

- **`RPC-NULLABILITY.md` does not exist yet**, but `database.overrides.ts` and `database.merged.ts` both point at it in their docblocks. Plan `164-02` owns creating it; until it does, those two references are forward references.
- **The 20/7/0 disposition split is settled and independently verified** against the SQL bodies and table Rows, so `164-02`'s derivation script has a fixed target to agree with.

Outstanding, and explicitly **not** delivered here: **criterion 4** (regeneration does not silently revert). The mechanical basis holds — `yarn db:types` rewrites only `src/database.ts`, verified from the `generate` script — but nothing in this plan *proves* it. Plan `164-03`'s unfiltered CI drift job owns that, and per the phase's own constraint it must not share a wave with Phase 163.

---
*Phase: 164-returns-table-nullability-audit-single-override-mechanism*
*Completed: 2026-09-03*

## Self-Check: PASSED

All 4 created files verified present on disk with `[ -f ]`. All 4 commits (`3274e5482`, `e42ce7efa`, `fbb84d88c`, `0f3e33695`) verified present in `git log --oneline --all`. All task acceptance criteria and the plan-level `<verification>` block re-run at plan close: every exit code 0, criterion-3 grep 0 lines, working tree clean.
