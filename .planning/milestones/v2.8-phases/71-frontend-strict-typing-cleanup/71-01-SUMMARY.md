---
phase: 71-frontend-strict-typing-cleanup
plan: 01
subsystem: testing
tags: [typescript, eslint, supabase, sveltekit, types, no-explicit-any]

# Dependency graph
requires:
  - phase: 70-svelte-5-ssr-a11y-warning-sweep-bind-rationale-cleanup
    provides: Svelte-5-warning-clean baseline so typing diffs land cleanly without warning regressions
provides:
  - "All 67 \\`@typescript-eslint/no-explicit-any\\` errors in apps/frontend/ resolved at the source"
  - "asSupabaseMock(m) helper triad pattern for Supabase test mocks (3 adapter test files)"
  - "Json | null + Tables<'name'>['Row'] cast pattern for Supabase production code (2 files)"
  - "LayoutData from ./\\$types replaces data: any across 5 SvelteKit route layouts"
  - "// reason: <one-line> D-04 inline-justification convention anchored (15 reason-tagged sites)"
affects: [71-02-naming-convention, 71-03-func-style-and-long-tail, future supabase adapter type sweeps]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "asSupabaseMock(m) test-mock helper triad (MockClient alias + reason-tagged unknown-cast bridge)"
    - "Json | null cast at Supabase JSONB column boundaries; Json -> StoredImage via interim unknown bridge"
    - "Tables<'name'>['Row'] for SDK-generated row types in map callbacks"
    - "LayoutData/PageData from ./\\$types for SvelteKit route data prop"
    - "// reason: <one-line lowercase> for unknown-cast justification (D-04 anchor)"

key-files:
  created: []
  modified:
    - "apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts"
    - "apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts"
    - "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts"
    - "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts"
    - "apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts"
    - "apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.test.ts"
    - "apps/frontend/src/routes/(voters)/(located)/+layout.svelte"
    - "apps/frontend/src/routes/(voters)/nominations/+layout.svelte"
    - "apps/frontend/src/routes/admin/(protected)/+layout.svelte"
    - "apps/frontend/src/routes/admin/(protected)/argument-condensation/+layout.svelte"
    - "apps/frontend/src/routes/admin/(protected)/question-info/+layout.svelte"

key-decisions:
  - "D-03 fallback applied: Json -> StoredImage cast goes via `as Json as unknown as StoredImage | null` because parseStoredImage's parameter is narrower than Json (per RESEARCH §Risks #4); the runtime null/path guard preserves correctness"
  - "ENTITY_TYPE.Candidate (runtime constant) used instead of `'candidate' as any` for the entityType filter test, eliminating one any without a cast"
  - "Test-assertion casts narrow to local intersection types (DynamicSettingsTestNarrow, EntityTestNarrow, NominationTestNarrow, QuestionTestNarrow) instead of `(result as any)` per D-03 real-type-preferred"
  - "QuestionCategoryData.electionIds is a runtime-only field per the type doc; narrowed via structural intersection at the filter site"

patterns-established:
  - "Test-mock helper triad: MockClient = ReturnType<typeof createMockSupabaseClient>; asSupabaseMock(m: MockClient) = m as unknown as SupabaseClient<Database>"
  - "Production JSONB-column cast: row.col as Json as unknown as StoredImage | null"
  - "Production answers-column cast: row.col as Json as unknown as LocalizedAnswers | null"
  - "Route layout data prop: import type { LayoutData } from './\\$types'; let { data, children }: { data: LayoutData; children: Snippet } = \\$props();"
  - "// reason: <one-line> single-line lowercase justification, distinct from v2.7 P65 // bind: keep — and Phase 70 // svelte-warning: accepted —"

requirements-completed: [TYPING-01]

# Metrics
duration: 25min
completed: 2026-05-10
---

# Phase 71 Plan 01: no-explicit-any Sweep Summary

**Cleared all 67 `@typescript-eslint/no-explicit-any` errors in apps/frontend/ via 3 sub-batches: asSupabaseMock helper triad in 4 test files, Json/Tables casts in 2 Supabase production files, and LayoutData from ./\$types in 5 SvelteKit route layouts — anchoring the D-04 `// reason:` convention at 15 sites.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-10T00:00:00Z
- **Completed:** 2026-05-10T00:13:00Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- 67 `@typescript-eslint/no-explicit-any` errors cleared (45 test-mock + 17 production-adapter + 5 route-layout — all 67 owned by this plan, per VALIDATION coverage table)
- 3 adapter test files now share the `asSupabaseMock(m)` helper triad (MockClient + reason-tagged unknown-cast bridge), retiring per-site `as any` boundary casts
- 2 Supabase adapter production files now import `Json` (and one `Tables`) from `@openvaa/supabase-types`, replacing per-site `as any` with `as Json as unknown as StoredImage | null` (image columns), `as Json as unknown as LocalizedAnswers | null` (answers columns), and `Tables<'nominations'>['Row']` (one map callback)
- 5 SvelteKit route layouts now use `LayoutData` from `./\$types`, tightening the SSR data-prop boundary
- D-04 `// reason: <one-line>` convention anchored at 15 sites in the supabase adapter (zero matches at HEAD before this plan)
- svelte-check baseline at **159 ERRORS** (≤ 160 gate; net **-1** from the 160 pre-plan baseline — incidental tightening from `LayoutData` flowing real types into 5 layouts)
- All 658 frontend unit tests still pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Sub-batch A — Test-mock `as any` retirement (44 + 1 errors, 4 files)** — `fa0033ec5` (fix)
2. **Task 2: Sub-batch B — Production adapter `as any` retirement (14 + 3 errors, 2 files)** — `b05423b26` (fix)
3. **Task 3: Sub-batch C — Route layout `data: any` → `LayoutData` (5 errors, 5 files)** — `ab4344525` (fix)

## Files Modified

### Sub-batch A (Task 1 — `fa0033ec5`)

- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` — added MockClient + asSupabaseMock helper triad + DynamicSettingsTestNarrow/EntityTestNarrow/NominationTestNarrow/QuestionTestNarrow local narrows; replaced 38 sites
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` — added helper triad; replaced 1 site
- `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts` — added helper triad + AdminFeature/TemporarySetQuestionData narrow imports for invalid-input runtime tests; replaced 5 sites
- `apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.test.ts` — replaced 1 fixture cast with `as Partial<StoredImage> as StoredImage`

### Sub-batch B (Task 2 — `b05423b26`)

- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` — added `Json` + `LocalizedAnswers` + `StoredImage` type imports; replaced 14 sites (9 image, 2 answers, 1 categoryNarrow + 2 in nomination/entity blocks)
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — added `Json, Tables` + `StoredImage` type imports; replaced 3 sites (2 image, 1 nominations map callback)

### Sub-batch C (Task 3 — `ab4344525`)

- `apps/frontend/src/routes/(voters)/(located)/+layout.svelte`
- `apps/frontend/src/routes/(voters)/nominations/+layout.svelte`
- `apps/frontend/src/routes/admin/(protected)/+layout.svelte`
- `apps/frontend/src/routes/admin/(protected)/argument-condensation/+layout.svelte`
- `apps/frontend/src/routes/admin/(protected)/question-info/+layout.svelte`

## Decisions Made

1. **`as Json as unknown as StoredImage | null` (D-03 fallback)** — initial attempt at `as Json | null` directly was rejected by TS because `parseStoredImage`'s parameter type (`StoredImage | null | undefined`) is narrower than `Json` (which permits primitive strings). Per RESEARCH §Risks #4, fall back to the interim `unknown` bridge with a `// reason:` line. The runtime null/path guard at `parseStoredImage:29` preserves correctness — `Json` is the structural superset, the function rejects malformed shapes at runtime regardless.
2. **`ENTITY_TYPE.Candidate` instead of `'candidate' as any`** — the `getEntityData({ entityType })` test was using a string literal cast; the runtime constant export from `@openvaa/data` is the right way to reference the EntityType union value, avoiding the cast entirely (fix-at-source per D-03).
3. **Local intersection narrows for assertion casts** — instead of `(result as any).foo` test assertions, defined four narrow types at the top of `supabaseDataProvider.test.ts` (DynamicSettingsTestNarrow, EntityTestNarrow, NominationTestNarrow, QuestionTestNarrow) tailored to what each assertion-block reads. This preserves test intent without `any` and keeps the diff focused (per PATTERNS §Cluster 1 sub-cluster 1a).
4. **`QuestionCategoryData & { electionIds?: ... }` structural intersection** — `electionIds` is a runtime-only field tacked on by `toDataObject` at the adapter boundary, intentionally not part of `QuestionCategoryData` per the type-doc comment. Used a structural intersection cast with a `// reason:` line rather than touching the data type (out of scope for this plan).

## Deviations from Plan

**None substantive.** Two cosmetic adjustments applied during execution:

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused `Json` import after pivot to `as Json as unknown as ...`**
- **Found during:** Task 2 (Sub-batch B production adapter)
- **Issue:** The plan suggested `as Json | null` for image casts, but TS rejected this because `parseStoredImage`'s parameter type is narrower than `Json`. Per RESEARCH §Risks #4, the fallback is `as Json as unknown as StoredImage | null`.
- **Fix:** Applied the fallback uniformly across 9 image-cast sites in `supabaseDataProvider.ts` and 2 in `supabaseDataWriter.ts`; added `LocalizedAnswers` import for the 2 answers-cast sites.
- **Files modified:** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`, `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts`
- **Verification:** `yarn workspace @openvaa/frontend check` passes (159 ERRORS, ≤ 160 gate); `yarn test:unit` passes 658/658
- **Committed in:** `b05423b26` (Task 2 commit)

**2. [Rule 3 - Blocking] Auto-import sort fix from `eslint --fix`**
- **Found during:** Task 1 (Sub-batch A test mocks) — after manual import additions, eslint reported `simple-import-sort/imports` errors (also part of the project's lint set)
- **Issue:** Manually-appended imports broke the `simple-import-sort/imports` ordering rule
- **Fix:** Ran `yarn workspace @openvaa/frontend lint:fix` — auto-fix re-sorted imports in the 3 test files. Strict no-explicit-any clearance held after the auto-fix.
- **Files modified:** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts`, `dataWriter/supabaseDataWriter.test.ts`, `adminWriter/supabaseAdminWriter.test.ts`
- **Verification:** `yarn workspace @openvaa/frontend lint:check 2>&1 | grep "simple-import-sort"` returns 0 matches in the affected files post-fix
- **Committed in:** `fa0033ec5` (Task 1 commit; auto-fix changes folded into the same commit before staging)

---

**Total deviations:** 2 auto-fixed (1 cast-shape adjustment per RESEARCH §Risks #4, 1 import-sort auto-fix)
**Impact on plan:** Both deviations were pre-anticipated by the plan/research and required no scope expansion. RESEARCH §Risks #4 explicitly called out the `as Json as unknown as StoredImage | null` fallback; the import-sort auto-fix is a project-wide lint convention.

## Issues Encountered

None blocking. The lint:fix auto-rewrite at the end of Task 1 caused a tooling notice (the lint:fix command exited non-zero because remaining errors existed in OTHER plans' scope, not because of any issue with the test-file edits). All 4 test files cleared cleanly post-fix.

## Self-Check

Verifying claims:

- **Created files exist:** N/A (no files created)
- **Modified files have the fixes:**
  - `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` — `asSupabaseMock` helper present (`grep -c asSupabaseMock` ≥ 1 ✓)
  - `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` — `Json` import present, `as Json as unknown as StoredImage` pattern present ✓
  - 5 route layouts have `import type { LayoutData } from './\$types'` (verified by `git grep -l` — 7 routes total contain the import; 5 modified by this plan + 2 prior) ✓
- **Phase rule clearance:** `yarn workspace @openvaa/frontend lint:check 2>&1 | grep -c "no-explicit-any"` = **0** ✓
- **svelte-check baseline:** `159 ERRORS` (≤ 160 gate) ✓
- **Unit suite:** `Test Files 38 passed (38) / Tests 658 passed (658)` ✓
- **Commits exist:** `git log --oneline -3` shows `ab4344525`, `b05423b26`, `fa0033ec5` ✓
- **D-04 anchor:** `git grep -n "// reason:" apps/frontend/src/lib/api/adapters/supabase/ | wc -l` = **15** (≥ 3 required) ✓
- **No new `as any`:** `git diff main..HEAD -- apps/frontend/ | grep -E "^\\+.*\\bas any\\b"` = **0** introductions in this plan's commits ✓

## Self-Check: PASSED

## Next Plan Readiness

- Plan 71-02 (`naming-convention` sweep, 13 errors) is independent and parallelizable; no file conflicts with this plan.
- Plan 71-03 (merged `func-style` + long-tail, ~15 errors) is also independent.
- The `// reason:` D-04 convention is now anchored — Plans 71-02 and 71-03 should follow the same single-line lowercase format for any inline disables they need.
- Phase gate for TYPING-01 SC-1 (no-explicit-any cluster cleared) is fully satisfied by this plan; SC-2 svelte-check baseline holds at 159 ≤ 160; SC-4 unit suite green.

---

*Phase: 71-frontend-strict-typing-cleanup*
*Plan: 01 (no-explicit-any sweep)*
*Completed: 2026-05-10*
