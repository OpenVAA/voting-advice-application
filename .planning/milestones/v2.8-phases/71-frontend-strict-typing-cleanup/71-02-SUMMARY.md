---
phase: 71-frontend-strict-typing-cleanup
plan: 02
subsystem: testing
tags: [typescript, eslint, naming-convention, type-parameters, sveltekit]

# Dependency graph
requires:
  - phase: 71-frontend-strict-typing-cleanup
    plan: 01
    provides: no-explicit-any cluster cleared first; this plan lands against the same workspace baseline
provides:
  - "All 13 \\`@typescript-eslint/naming-convention\\` errors in apps/frontend/ resolved at the source via mechanical T → TX renames"
  - "_Unused<TEntity> type alias deleted from EntityListWithControls.helpers.ts (zero downstream consumers per RESEARCH §Risks #10)"
  - "TFn cross-file convention established between EntityListWithControls.helpers.ts and EntityListWithControls.svelte (3 references)"
affects: [71-03-func-style-and-long-tail, future apps/frontend/ generic-type renames]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "T → TRow / TObj / TItem / TVal / TFn — semantic rename per type-parameter intent (read-path row, write-path obj, sequence item, value-shape, function-shape)"
    - "_TElement → TElement — drop unused-marker underscore where the rule's ^T[A-Z] regex flags the leading-underscore form"
    - "Delete-rather-than-rename for type aliases with zero consumers (e.g., _Unused workaround for unused-generic-slot warnings)"

key-files:
  created: []
  modified:
    - "apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.ts"
    - "apps/frontend/src/lib/components/input/Input.type.ts"
    - "apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts"
    - "apps/frontend/src/lib/contexts/filter/filterContext.svelte.test.ts"
    - "apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.helpers.ts"
    - "apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte"
    - "apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.test.ts"

key-decisions:
  - "Plan-71-02's CONTEXT D-02 framing (DB-row snake_case at adapter boundary) was reframed to its actual scope per RESEARCH §Cluster 2: all 13 errors are type-parameter T violations + 1 type-alias _Unused. The adapter boundary already enforces camelCase via mapRow() + COLUMN_MAP from @openvaa/supabase-types; no new boundary work needed."
  - "_Unused<TEntity> at EntityListWithControls.helpers.ts:46-47 deleted (rather than renamed to Unused). RESEARCH §Risks #10 verified zero downstream consumers; the type alias was a workaround for the unused-TEntity-slot warning in the unused FilterGroupLike type. Deletion is the cleaner fix per D-02 fix-at-source."
  - "Plan instruction said 'delete lines 43-47' but line 43 is FilterGroupLike (a different, broken-but-actively-typed alias that uses MaybeWrappedEntityVariant which isn't imported). Only the _Unused declaration + its preceding comment (lines 46-47) were deleted — RESEARCH source confirms intent is to delete only the _Unused alias."
  - "_TElement → TElement (drop underscore) — applied per CONTEXT D-02 fix-at-source. Renamed all 3 references in Input.type.ts: JSDoc at line 51, type-parameter declaration at line 55, in-body usage at line 110."

patterns-established:
  - "Cross-file type-parameter consistency: TFn used in both EntityListWithControls.helpers.ts (filterGroup/searchFilter parameter types) and EntityListWithControls.svelte (local ApplyFn type alias) for the function-shape generic"
  - "Test-file generic naming: TVal for test-fake apply<T>(targets: Array<T>) shapes (filterContext.svelte.test.ts FakeGroup, EntityListWithControls.test.ts FakeFilter/FakeGroup/FakeSearchFilter)"
  - "Adapter-mapping generic naming: TRow (read path, snake_case row input) vs TObj (write path, camelCase object input) for the same structural Record<string, unknown> constraint"

requirements-completed: [TYPING-01]

# Metrics
duration: 4min
completed: 2026-05-09
---

# Phase 71 Plan 02: naming-convention Sweep Summary

**Cleared all 13 `@typescript-eslint/naming-convention` errors in apps/frontend/ via mechanical type-parameter renames (T → TRow/TObj/TItem/TVal/TFn) across 7 files plus deletion of the zero-consumer _Unused type alias — clearing TYPING-01 SC-1 second cluster with zero new disables.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-09T21:14:04Z
- **Completed:** 2026-05-09T21:18:03Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- 13 `@typescript-eslint/naming-convention` errors cleared (6 in Task 1 + 7 in Task 2 — full plan-owned set per VALIDATION coverage table)
- `_Unused<TEntity>` type alias deleted (line 46-47 of EntityListWithControls.helpers.ts) — RESEARCH §Risks #10's zero-consumer claim re-verified at execution time via `git grep "_Unused\b" apps/frontend/`
- TFn convention established cross-file between EntityListWithControls.helpers.ts and EntityListWithControls.svelte (3 references confirmed via grep)
- D-02 fix-at-source preserved: zero new `// eslint-disable-next-line @typescript-eslint/naming-convention` comments introduced
- svelte-check baseline holds at **159 ERRORS** (≤ 160 gate; identical to Plan 71-01's post-baseline)
- All 658 frontend unit tests still pass (8/8 EntityListWithControls + 8/8 filterContext explicitly verified, full suite green)

## Task Commits

Each task was committed atomically:

1. **Task 1: mapRow + Input.type + context-helper renames (5 sites + 1 underscore drop, 4 files)** — `ffa560689` (fix)
2. **Task 2: EntityListWithControls cluster renames + _Unused deletion (7 sites + 1 deletion, 3 files)** — `60593d2b3` (fix)

## Files Modified

### Task 1 (`ffa560689`)

- `apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.ts` — 3 sites: `mapRow<T>` → `<TRow>` (line 9), `mapRowToDb<T>` → `<TObj>` (line 22), `mapRows<T>` → `<TRow>` (line 34)
- `apps/frontend/src/lib/components/input/Input.type.ts` — 1 site: `_TElement` → `TElement` at line 55 (type-parameter declaration); cascaded rename to JSDoc reference at line 51 and in-body `options?: _TElement extends 'select'` at line 110
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` — 1 site: `sameRefs<T>` → `sameRefs<TItem>` (file-private helper at line 91)
- `apps/frontend/src/lib/contexts/filter/filterContext.svelte.test.ts` — 1 site: `FakeGroup.apply<T>` → `apply<TVal>` (line 75)

### Task 2 (`60593d2b3`)

- `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.helpers.ts` — 2 site renames + 1 deletion: `<T>` → `<TFn>` in computeFiltered's filterGroup/searchFilter parameter types at lines 18-19; `export type _Unused<TEntity> = TEntity` plus its preceding comment deleted (lines 46-47)
- `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte` — 1 site: `type ApplyFn = { apply: <T>(...) }` → `apply: <TFn>(...)` at line 108 (matches helpers form)
- `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.test.ts` — 3 sites: `FakeFilter.apply<T>` (line 23), `FakeGroup.apply<T>` (line 40), `FakeSearchFilter.apply<T>` (line 49) all → `<TVal>`

## Error List (per VALIDATION §Coverage Bookkeeping)

| File | Line:Col | Symbol | Renamed To | Status | Resolved By |
|------|----------|--------|------------|--------|-------------|
| `lib/api/adapters/supabase/utils/mapRow.ts` | 9:24 | `T` | `TRow` | verified | `ffa560689` |
| `lib/api/adapters/supabase/utils/mapRow.ts` | 22:28 | `T` | `TObj` | verified | `ffa560689` |
| `lib/api/adapters/supabase/utils/mapRow.ts` | 34:25 | `T` | `TRow` | verified | `ffa560689` |
| `lib/components/input/Input.type.ts` | 55:36 | `_TElement` | `TElement` | verified | `ffa560689` |
| `lib/contexts/filter/filterContext.svelte.test.ts` | 75:9 | `T` | `TVal` | verified | `ffa560689` |
| `lib/contexts/voter/voterContext.svelte.ts` | 91:21 | `T` | `TItem` | verified | `ffa560689` |
| `lib/dynamic-components/entityList/EntityListWithControls.helpers.ts` | 18:26 | `T` | `TFn` | verified | `60593d2b3` |
| `lib/dynamic-components/entityList/EntityListWithControls.helpers.ts` | 19:27 | `T` | `TFn` | verified | `60593d2b3` |
| `lib/dynamic-components/entityList/EntityListWithControls.helpers.ts` | 47:13 | `_Unused` | (deleted) | verified | `60593d2b3` |
| `lib/dynamic-components/entityList/EntityListWithControls.svelte` | 108:28 | `T` | `TFn` | verified | `60593d2b3` |
| `lib/dynamic-components/entityList/EntityListWithControls.test.ts` | 23:9 | `T` | `TVal` | verified | `60593d2b3` |
| `lib/dynamic-components/entityList/EntityListWithControls.test.ts` | 40:9 | `T` | `TVal` | verified | `60593d2b3` |
| `lib/dynamic-components/entityList/EntityListWithControls.test.ts` | 49:9 | `T` | `TVal` | verified | `60593d2b3` |

**Total resolved: 13 ✓** (matches lint-output baseline pre-plan).

## Decisions Made

1. **CONTEXT D-02 framing reframed at execution time per RESEARCH §Cluster 2** — the LOCKED user decision said "rename DB-row snake_case keys at the adapter boundary," but RESEARCH (and confirmed by lint output at HEAD) showed all 13 errors are type-parameter T violations, not DB-row sites. The adapter boundary already enforces camelCase via `mapRow()` + `COLUMN_MAP` from `@openvaa/supabase-types`. The execution treats this as a non-deviation: the principle of D-02 (fix at source, no rule-tune, minimal disables) was preserved verbatim — only the SHAPE of the work was different from CONTEXT.md's anticipated narrative.

2. **`_Unused` type alias deletion (lines 46-47), NOT lines 43-47** — the PLAN.md instruction said "delete lines 43-47 entirely (the comment block + the export type declaration)." However, line 43 is `FilterGroupLike` (an actively-declared but currently unused-and-broken type alias that references `MaybeWrappedEntityVariant` without an import). RESEARCH §Cluster 2 source clarifies the intent is to delete only the `_Unused` declaration + its preceding workaround comment. Applied: deleted only lines 46-47 (the `// Suppress unused TEntity` comment + `export type _Unused<TEntity> = TEntity`). Left `FilterGroupLike` untouched (out of scope; its missing `MaybeWrappedEntityVariant` import is pre-existing tech debt unrelated to naming-convention).

3. **Semantic rename selection per type-parameter intent** — followed RESEARCH §Cluster 2's per-site recommendations:
   - Read-path adapter generic (`Record<string, unknown>` row from Supabase) → `TRow`
   - Write-path adapter generic (camelCase object input) → `TObj` (distinct from `TRow` to telegraph the read/write asymmetry)
   - Sequence-comparison helper → `TItem` (the array-element generic)
   - Test-fake `apply<T>(targets: Array<T>): Array<T>` → `TVal` (the value-shape generic)
   - Function-shape generic in `<...>(...) => Array<...>` parameter typing → `TFn`

4. **`_TElement` rename cascaded all 3 references in Input.type.ts** — the plan said "rename uses inside the file (currently 1 reference at line 55 as a phantom param)," but execution-time grep found 3 references: JSDoc at line 51, declaration at line 55, conditional-type body at line 110 (`options?: _TElement extends 'select'`). All three updated atomically; line 110 is a meaningful in-body use, not a phantom-only reference.

## Deviations from Plan

**None substantive.** All deviations are interpretation refinements documented above as Decisions, not policy changes:

- **Decision 2** (line-range correction for `_Unused` deletion) is a faithful reading of RESEARCH source — the plan's line-range was off-by-N, but the intent (`_Unused` only) was preserved.
- **Decision 4** (3-reference cascade for `_TElement`) follows the plan's explicit "rename uses inside the file" instruction; the count differed from the plan's prediction but the rename approach was identical.

### Auto-fixed Issues

None — no Rule 1/2/3 deviations triggered. Renames are runtime-neutral (type-only changes); no bug fixes, no critical functionality additions, no blocking issues encountered.

---

**Total deviations:** 0 substantive · 4 documented interpretation refinements (Decisions 1-4)
**Impact on plan:** None — all 13 errors cleared per the plan's Error List, all acceptance criteria satisfied.

## Issues Encountered

None blocking. One observation surfaced (out-of-scope for this plan): `FilterGroupLike<TEntity>` at `EntityListWithControls.helpers.ts:43` references `MaybeWrappedEntityVariant` but does not import it — and `FilterGroupLike` itself has zero downstream consumers per `git grep`. This is pre-existing dead code unrelated to naming-convention; logging here for future cleanup but not modifying (scope-boundary rule).

## Self-Check

Verifying claims:

- **Created files:** N/A (no files created)
- **Modified files have the renames:**
  - `mapRow.ts` — `<TRow extends`, `<TObj extends`, `<TRow extends` (all 3 ✓)
  - `Input.type.ts` — `_TElement` count = 0 (verified `git grep -n "_TElement\b" apps/frontend/` returns no matches ✓)
  - `voterContext.svelte.ts` — `function sameRefs<TItem>` present ✓
  - `filterContext.svelte.test.ts` — `apply<TVal>` present at line 75 ✓
  - `EntityListWithControls.helpers.ts` — `<TFn>` x2 + zero `_Unused` matches (verified) ✓
  - `EntityListWithControls.svelte` — `type ApplyFn = { apply: <TFn>` at line 108 ✓
  - `EntityListWithControls.test.ts` — `apply<TVal>` x3 (lines 23, 40, 49) ✓
- **Phase rule clearance:** `yarn workspace @openvaa/frontend lint:check 2>&1 | grep -c "naming-convention"` = **0** ✓
- **`_Unused` deleted:** `git grep -n "_Unused\b" apps/frontend/` returns 0 matches ✓
- **TFn cross-file count:** `git grep -n "TFn\b" apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.helpers.ts apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte | wc -l` = **3** (≥ 3 required) ✓
- **svelte-check baseline:** `159 ERRORS` (≤ 160 gate) ✓ — identical to Plan 71-01's post-baseline; no regression
- **Unit suite:** `Test Files 38 passed (38) / Tests 658 passed (658)` ✓
- **Commits exist:** `git log --oneline -3` shows `60593d2b3`, `ffa560689`, ... ✓
- **No new naming-convention disables:** `git diff` against task-1+task-2 commits shows zero `eslint-disable-next-line @typescript-eslint/naming-convention` introductions ✓

## Self-Check: PASSED

## Cross-Plan Conflict Outcome

`apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte` is touched by both this plan (line 108 — TFn rename) and Plan 71-03 (line 91 — func-style fix). **Plan 71-02 landed first** in Wave 1's sequential merge order. Plan 71-03 (when executed) will rebase cleanly because the two edits are 17 lines apart and modify disjoint tokens — RESEARCH §Cross-Plan File Conflict Audit explicitly anticipated this resolution path (option 3: merge-sequential auto-rebase).

## Next Plan Readiness

- **Plan 71-03** (merged func-style + long-tail, ~15 errors) can proceed independently. The single overlap file (EntityListWithControls.svelte) will auto-rebase against this plan's commit.
- The TFn convention established in this plan is documented in `patterns-established` for future generic-naming consistency.
- Phase gate for TYPING-01 SC-1 (naming-convention cluster cleared) is fully satisfied by this plan; combined with Plan 71-01 (no-explicit-any cleared), 80 of 95 errors are now resolved. Remaining: 11 func-style + 4 long-tail = 15 errors owned by Plan 71-03/71-04.
- D-04 `// reason:` convention from Plan 71-01 was not exercised by this plan (no inline disables introduced — D-02 fix-at-source held cleanly across all 13 sites).

---

*Phase: 71-frontend-strict-typing-cleanup*
*Plan: 02 (naming-convention sweep — type-parameter renames)*
*Completed: 2026-05-09*
