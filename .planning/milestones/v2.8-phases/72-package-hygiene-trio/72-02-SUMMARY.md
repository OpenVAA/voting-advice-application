---
phase: 72-package-hygiene-trio
plan: 02
subsystem: infra
tags: [frontend, app-shared, mergeSettings, re-export-shim, import-hygiene]

# Dependency graph
requires:
  - phase: 63-e2e-template-extension
    provides: "v2.6 Phase 63 Plan 01 hoisted mergeSettings + DeepPartial from apps/frontend/src/lib/utils/merge.ts into @openvaa/app-shared. The deleted shim was the transitional scaffolding from that hoist."
provides:
  - "Direct @openvaa/app-shared imports for mergeSettings and DeepPartial in apps/frontend/src/lib/contexts/layout/ (3 import lines rewritten across 2 files)"
  - "Removal of apps/frontend/src/lib/utils/merge.ts re-export shim — closes the long-standing transitional scaffolding from v2.6 Phase 63"
  - "D-07 audit confirmation: only one shape-equivalent re-export shim existed in apps/frontend/src/lib/utils/ (merge.ts itself); no follow-up todo needed"
affects: [package-hygiene, future-shims-policy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Direct workspace package imports (no re-export shims) for cross-package symbols — aligns with already-direct consumers in tests/tests/setup/templates/* and packages/dev-seed/tests/templates/*"

key-files:
  created: []
  modified:
    - "apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts (mergeSettings value-import + DeepPartial type-import rewired to @openvaa/app-shared; cosmetic merge with existing VideoContent type-import)"
    - "apps/frontend/src/lib/contexts/layout/layoutContext.type.ts (DeepPartial type-import rewired to @openvaa/app-shared; cosmetic merge with existing VideoContent type-import)"
  deleted:
    - "apps/frontend/src/lib/utils/merge.ts (5-line re-export shim from Phase 63 hoist)"

key-decisions:
  - "Cosmetic import merge applied: combined DeepPartial with existing VideoContent type-import in both files (single import statement per from-clause). Auto-sorted by simple-import-sort/imports during eslint --fix."
  - "D-07 audit recorded zero shape-equivalent shims remaining in apps/frontend/src/lib/utils/; no follow-up todo needed."

patterns-established:
  - "Pattern: When a workspace package re-export shim has settled (multiple phases since the hoist) and the broader grep returns zero non-shim consumers, retire the shim atomically — rewrite consumers, delete the shim, verify build + tests, single phase commit."

requirements-completed: [SHARED-02]

# Metrics
duration: 3min
completed: 2026-05-09
---

# Phase 72 Plan 02: `mergeSettings` shim retirement Summary

**Retired the 5-line `apps/frontend/src/lib/utils/merge.ts` re-export shim from v2.6 Phase 63's hoist; rewired 3 import lines across 2 layout-context files to import `mergeSettings` and `DeepPartial` directly from `@openvaa/app-shared`.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-09T10:47:01Z
- **Completed:** 2026-05-09T10:50:34Z
- **Tasks:** 3 (audit + rewrite + delete)
- **Files modified:** 2 (rewrites) + 1 (deletion) = 3 files net

## Accomplishments

- Confirmed via D-07 audit that `apps/frontend/src/lib/utils/merge.ts` was the only shape-equivalent re-export shim in the directory; `removeDuplicates.ts` is a real implementation, not a shim.
- Rewrote 3 import lines (per RESEARCH.md HIGH-confidence inventory) to import directly from `@openvaa/app-shared`:
  - `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts:6` — `mergeSettings` value-import
  - `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts:11` — `DeepPartial` type-import (merged with existing `VideoContent` type-import)
  - `apps/frontend/src/lib/contexts/layout/layoutContext.type.ts:4` — `DeepPartial` type-import (merged with existing `VideoContent` type-import)
- Deleted `apps/frontend/src/lib/utils/merge.ts` via `git rm`.
- All three grep gates (strict, broader, broadest) return zero matches across `apps/frontend/`, `tests/`, `packages/`.
- Frontend build (`yarn workspace @openvaa/frontend build`) exits 0.
- Frontend unit tests (`yarn workspace @openvaa/frontend test:unit`) pass — 646 tests across 37 files.
- Frontend lint error count restored to baseline (96 errors, all pre-existing — Phase 71 / TYPING-01 territory).

## Task Commits

Each task was committed atomically:

1. **Task 1: Audit lib/utils/ for shape-equivalent shims (D-07)** — no commit (audit-only verification gate; no file modifications per plan).
2. **Task 2: Rewrite the 3 import sites to use @openvaa/app-shared directly** — `a2b6ae0e9` (refactor)
3. **Task 3: Delete the shim file and verify frontend build + tests still pass** — `6615fedc9` (chore)

**Plan metadata commit:** to follow this SUMMARY.md write.

## Files Created/Modified

### Modified
- `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts`
  - Line 6: `import { mergeSettings } from '$lib/utils/merge';` → `import { mergeSettings } from '@openvaa/app-shared';`
  - Line 11 (was) / 9 (now): `import type { DeepPartial } from '$lib/utils/merge';` removed; `DeepPartial` merged into existing `import type { ..., VideoContent } from '@openvaa/app-shared';` statement → `import type { DeepPartial, VideoContent } from '@openvaa/app-shared';`
- `apps/frontend/src/lib/contexts/layout/layoutContext.type.ts`
  - Line 4 (was): `import type { DeepPartial } from '$lib/utils/merge';` removed; `DeepPartial` merged into existing `import type { VideoContent } from '@openvaa/app-shared';` statement on line 1 → `import type { DeepPartial, VideoContent } from '@openvaa/app-shared';`

### Deleted
- `apps/frontend/src/lib/utils/merge.ts` (5-line re-export shim — Phase 63 hoist scaffolding)

## Decisions Made

- **Cosmetic merging applied:** The plan offered the option of merging the new `DeepPartial` type-import with the existing `VideoContent` type-import (already from `@openvaa/app-shared`) in both files. I applied the merge for compactness (one statement per from-clause). The `mergeSettings` value-import in `layoutContext.svelte.ts` stayed separate since it's a value-import while the type-imports are grouped on the type-import line. The `simple-import-sort/imports` ESLint rule auto-sorted the final order.
- **D-07 audit result:** zero other shape-equivalent shims in `apps/frontend/src/lib/utils/`; `removeDuplicates.ts` (the only other small file) is a real implementation. No follow-up todo needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Re-sorted imports after edit (simple-import-sort/imports)**
- **Found during:** Task 2 (post-edit lint:check)
- **Issue:** The cosmetic import merging in both files left the imports out of the order required by the `simple-import-sort/imports` ESLint rule. Pre-edit baseline was 96 errors; post-edit was 98 errors (delta +2 — both `simple-import-sort/imports` errors in the two modified files).
- **Fix:** Ran `yarn eslint --flag v10_config_lookup_from_file --fix` on the two modified files only. The autofix re-sorted imports in `layoutContext.svelte.ts` so the value-import `mergeSettings` from `@openvaa/app-shared` moved to the top of the file (before `@sveltejs/kit`).
- **Files modified:** `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts` (final import order), `apps/frontend/src/lib/contexts/layout/layoutContext.type.ts` (no further change needed after merge).
- **Verification:** Post-fix lint error count restored to baseline 96 (pre-edit count); zero errors in either modified file.
- **Committed in:** `a2b6ae0e9` (Task 2 commit — combined the rewrite + autofix into one atomic commit).

---

**Total deviations:** 1 auto-fixed (1 bug — lint-sort).
**Impact on plan:** Auto-fix necessary to satisfy the plan's acceptance criterion that "no new errors are introduced by this plan in the two files modified". No scope creep — the fix was a mechanical re-sort confined to the two files already in scope.

## Issues Encountered

- The Read tool's view of `layoutContext.svelte.ts` after the eslint --fix needed a re-Read since the autofix changed line numbers. Followed by re-reading the file before continuing — no actual edit conflict. (Standard tool usage; not a real issue.)

## Verification Gate Results

All 7 plan-level verification gates pass:

| # | Gate | Expected | Actual |
|---|------|----------|--------|
| 1 | `test ! -f apps/frontend/src/lib/utils/merge.ts` | exit 0 | PASS |
| 2 | Strict grep `from ['\"]\$lib/utils/merge['\"]` (ROADMAP SC-2 verbatim) | 0 matches | 0 matches |
| 3 | Broader grep `['\"]\$lib/utils/merge['\"]` (Pitfall 2 mitigation) | 0 matches | 0 matches |
| 4 | `layoutContext.svelte.ts` has `from '@openvaa/app-shared'` | match | PASS |
| 5 | `layoutContext.type.ts` has `from '@openvaa/app-shared'` | match | PASS |
| 6 | D-07 audit (no shape-equiv shims left) | 0 shims | 0 shims |
| 7 | `yarn workspace @openvaa/frontend build` + `test:unit` | exit 0 | PASS (build OK; 646 tests pass) |

## User Setup Required

None — no external service configuration required. All changes are internal import-path rewrites + a single file deletion.

## Next Phase Readiness

- SHARED-02 is complete; Plan 72-03 (LINT-01 — `@openvaa/supabase` lint script rename) is unblocked and can run independently.
- Phase 72 is now 2/3 plans complete (72-01 SHARED-01 + 72-02 SHARED-02).
- The phase verification gate at close will additionally run `yarn lint:check`, the renamed `yarn supabase:lint:sql`, and the Playwright parity baseline check.

## Self-Check: PASSED

Verified at SUMMARY-write time:
- `apps/frontend/src/lib/utils/merge.ts` GONE (filesystem check)
- Commit `a2b6ae0e9` (refactor) FOUND in `git log`
- Commit `6615fedc9` (chore — shim deletion) FOUND in `git log`
- `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts` MODIFIED — `from '@openvaa/app-shared'` present, `from '$lib/utils/merge'` absent
- `apps/frontend/src/lib/contexts/layout/layoutContext.type.ts` MODIFIED — `from '@openvaa/app-shared'` present, `from '$lib/utils/merge'` absent

---
*Phase: 72-package-hygiene-trio*
*Completed: 2026-05-09*
