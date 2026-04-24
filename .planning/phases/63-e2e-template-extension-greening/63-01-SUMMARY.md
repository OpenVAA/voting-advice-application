---
phase: 63-e2e-template-extension-greening
plan: 01
subsystem: infra
tags: [app-shared, dev-seed, utility-hoist, deep-merge, tdd, e2e-02]

# Dependency graph
requires:
  - phase: 59-e2e-fixture-migration
    provides: "@openvaa/dev-seed template architecture + writer.ts Pass-5 app_settings routing (existing infra consumed by 63-02)"
  - phase: prior-work
    provides: "apps/frontend/src/lib/utils/merge.ts — verbatim source of the hoisted mergeSettings body"
provides:
  - "mergeSettings + DeepPartial exported from @openvaa/app-shared (single source of truth per D-02)"
  - "6-case vitest coverage for mergeSettings contract (nested merge, primitive override, array wholesale replace, no-mutation, missing-target init, function preservation)"
  - "packages/dev-seed now declares @openvaa/app-shared workspace dep — enables Plan 63-02 to import mergeSettings + E2E_BASE_APP_SETTINGS for base+overlay app_settings templates"
  - "Frontend re-export shim at apps/frontend/src/lib/utils/merge.ts — keeps 3 existing $lib/utils/merge import sites stable"
  - "test:unit script added to @openvaa/app-shared package.json (was missing; mirrors dev-seed sibling)"
affects: [63-02-template-population, 63-03-parity-gate, future-frontend-settings-overlay-work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "@openvaa/app-shared utils/ convention: sibling .ts + .test.ts + barrel line via export * from './utils/<name>.js'"
    - "Cross-package utility hoist via re-export shim — keeps call-site imports stable while moving implementation"

key-files:
  created:
    - packages/app-shared/src/utils/mergeSettings.ts
    - packages/app-shared/src/utils/mergeSettings.test.ts
  modified:
    - packages/app-shared/src/index.ts
    - packages/app-shared/package.json
    - apps/frontend/src/lib/utils/merge.ts
    - packages/dev-seed/package.json
    - yarn.lock

key-decisions:
  - "Added test:unit script to @openvaa/app-shared package.json (was absent) — Rule 3 deviation, mirrors packages/dev-seed convention"
  - "Placed barrel line for mergeSettings alphabetically (before passwordValidation) rather than 'at the end of utils block' as the plan loosely suggested — follows the file's existing strict-alphabetical convention within each sub-directory"

patterns-established:
  - "RED-phase stub pattern: signature-only export that fails the suite so the TDD gate is visible in git log before the GREEN commit lands"
  - "Shim-to-hoisted-utility pattern: keep old import paths as 1-statement re-exports so unrelated call sites need zero touch"

requirements-completed: [E2E-02]

# Metrics
duration: 3m 31s
completed: 2026-04-24
---

# Phase 63 Plan 01: mergeSettings Hoist to @openvaa/app-shared Summary

**Hoisted the deep-merge utility (`mergeSettings` + `DeepPartial`) from `apps/frontend/src/lib/utils/merge.ts` into `@openvaa/app-shared` as a shared, tested utility and wired `@openvaa/dev-seed` as a consumer — unblocks Plan 63-02's base+overlay `app_settings` template composition.**

## Performance

- **Duration:** 3 min 31 s
- **Started:** 2026-04-24T22:15:01Z
- **Completed:** 2026-04-24T22:18:32Z
- **Tasks:** 2 (Task 1 split into TDD RED + GREEN commits)
- **Files modified:** 7 (2 created, 5 modified)

## Accomplishments

- `@openvaa/app-shared` now exports a fully tested deep-merge utility with 6 passing contract cases — one source of truth for both `@openvaa/dev-seed` (for Plan 63-02 variant overlays) and the frontend (via the re-export shim).
- Frontend's legacy `apps/frontend/src/lib/utils/merge.ts` became a 5-line re-export shim; the 3 existing `$lib/utils/merge` imports (`layoutContext.type.ts`, `layoutContext.svelte.ts`) resolve unchanged — zero call-site edits.
- `@openvaa/dev-seed` can now `import { mergeSettings } from '@openvaa/app-shared'` at runtime (node smoke test passes: `typeof=function`).
- `@openvaa/app-shared` gained a `test:unit` script so the plan's canonical verify command resolves end-to-end.

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): failing tests for mergeSettings** — `a8f97175a` (test)
2. **Task 1 (GREEN): hoist utility + barrel export** — `80c86c51b` (feat)
3. **Task 2: frontend shim + dev-seed workspace dep** — `c2047291d` (feat)

_Note: Task 1 used TDD (`tdd="true"` in the plan); RED stub returned the target unchanged which made 5/6 cases fail as expected before the GREEN-phase verbatim hoist._

## Files Created/Modified

- `packages/app-shared/src/utils/mergeSettings.ts` (**new**, 51 lines) — verbatim body from frontend, JSDoc updated per plan to cite D-02 and warn against conflating with the SHALLOW `mergeAppSettings` helper.
- `packages/app-shared/src/utils/mergeSettings.test.ts` (**new**, 45 lines) — 6 vitest cases covering the contract; mirrors `passwordValidation.test.ts` conventions.
- `packages/app-shared/src/index.ts` — added `export * from './utils/mergeSettings.js';` at line 13 (alphabetical order within `utils/` block).
- `packages/app-shared/package.json` — added `"test:unit": "vitest run --passWithNoTests"` script (was missing; Rule 3 deviation).
- `apps/frontend/src/lib/utils/merge.ts` — replaced 46-line implementation with a 5-line re-export shim citing D-02 in a header comment.
- `packages/dev-seed/package.json` — added `"@openvaa/app-shared": "workspace:^"` alphabetically between `@openvaa/core` and `@openvaa/matching`.
- `yarn.lock` — refreshed by `yarn install` to pick up the new workspace symlink.

## Decisions Made

- **Added `test:unit` script to `@openvaa/app-shared` package.json.** The plan's `<verify>` block runs `yarn workspace @openvaa/app-shared test:unit -- --run mergeSettings`, but the package had no `test:unit` script in its scripts table — only a placeholder `vitest.config.ts` for the root `vitest.workspace.ts` pattern. Added the same one-liner dev-seed already uses (`vitest run --passWithNoTests`) so the command resolves. Rule 3 (blocking infrastructure gap).
- **Alphabetical barrel ordering.** The plan suggested adding the new `mergeSettings` line "at the end of the barrel" but the existing file is strictly alphabetical within each sub-directory block. Placed the new line at position 13 (before `passwordValidation`) to preserve that convention. PATTERNS.md acknowledges this as valid ("alphabetical is the rule, end-of-block is a tie-breaker").

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Added missing `test:unit` script to `@openvaa/app-shared/package.json`**
- **Found during:** Task 1 RED-phase verification
- **Issue:** Plan's `<verify>` command `yarn workspace @openvaa/app-shared test:unit -- --run mergeSettings` failed because the package had no `test:unit` script. Verified via `yarn workspace @openvaa/app-shared run` which listed only `build`, `lint`, `typecheck`.
- **Fix:** Added `"test:unit": "vitest run --passWithNoTests"` (identical shape to the `packages/dev-seed` sibling). `vitest.config.ts` already existed; no other config needed.
- **Files modified:** `packages/app-shared/package.json`
- **Verification:** `yarn workspace @openvaa/app-shared test:unit -- --run mergeSettings` now runs all 3 test files (21 tests, 21 passing).
- **Committed in:** `a8f97175a` (bundled with the Task 1 RED commit since both were needed to satisfy the plan's verify contract).

---

**Total deviations:** 1 auto-fixed (1 blocking infrastructure)
**Impact on plan:** Required for the plan's canonical verify command to work. No scope creep.

## Issues Encountered

None. The hoist was verbatim; the frontend-shim pattern is low-risk; workspace refresh via `yarn install` + `yarn build --filter=@openvaa/app-shared` worked first try.

## Verification Results (full phase-level suite from PLAN.md)

| # | Check | Result |
|---|---|---|
| 1 | `yarn workspace @openvaa/app-shared test:unit -- --run mergeSettings` | ✅ 3 test files / 21 tests pass (6 mergeSettings + 8 passwordValidation + 7 isEmoji) |
| 2 | `yarn workspace @openvaa/app-shared typecheck` | ✅ exit 0 |
| 3 | `yarn workspace @openvaa/frontend check` for the 3 `$lib/utils/merge` sites (`layoutContext.type.ts`, `layoutContext.svelte.ts`) | ✅ 0 errors / 0 warnings on the target files (82 pre-existing errors in unrelated files documented as out-of-scope per SCOPE BOUNDARY) |
| 4 | Node smoke: `yarn workspace @openvaa/dev-seed exec node -e "import('@openvaa/app-shared').then(m => console.log(typeof m.mergeSettings))"` | ✅ prints `function` |
| 5 | `grep -c 'export.*mergeSettings' packages/app-shared/src/utils/mergeSettings.ts` | ✅ `1` |
| 6 | `grep -c 'mergeSettings' packages/app-shared/src/index.ts` | ✅ `1` |

Additional smokes run beyond the plan: `yarn build --filter=@openvaa/app-shared` clean (ESM 7.34 KB + CJS 8.79 KB), `yarn build --filter=@openvaa/frontend` clean (SvelteKit prod build succeeds end-to-end).

## Next Phase Readiness

- **Plan 63-02 is unblocked.** It can now `import { mergeSettings } from '@openvaa/app-shared'` in both `packages/dev-seed/src/templates/e2e.ts` (to bake the base `E2E_BASE_APP_SETTINGS` into the template) and in `tests/tests/setup/templates/variant-*.ts` (to compose variant overlays via `mergeSettings(E2E_BASE_APP_SETTINGS, OVERLAY)`).
- **No blockers introduced.** The frontend re-export shim means all existing `$lib/utils/merge` imports continue to resolve; no call-site edits needed for Plan 63-02/03 or any future consumer.
- **Threat flags:** none new. Plan 63-01 is pure internal source-code movement (T-63-01-01, T-63-01-02 both accepted in the plan's threat_model and remain so — no new network endpoints, auth surfaces, data-ingestion paths, or published-npm dependencies).

## Self-Check: PASSED

- `packages/app-shared/src/utils/mergeSettings.ts` exists ✅
- `packages/app-shared/src/utils/mergeSettings.test.ts` exists ✅
- `packages/app-shared/src/index.ts` contains the new barrel line ✅
- `apps/frontend/src/lib/utils/merge.ts` is a 5-line re-export shim ✅
- `packages/dev-seed/package.json` declares `@openvaa/app-shared: workspace:^` ✅
- Commit `a8f97175a` exists in `git log` ✅
- Commit `80c86c51b` exists in `git log` ✅
- Commit `c2047291d` exists in `git log` ✅

---
*Phase: 63-e2e-template-extension-greening*
*Completed: 2026-04-24*
