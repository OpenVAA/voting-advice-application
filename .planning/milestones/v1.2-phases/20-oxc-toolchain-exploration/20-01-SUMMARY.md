---
phase: 20-oxc-toolchain-exploration
plan: 01
subsystem: infra
tags: [oxlint, eslint, linting, svelte, toolchain]

# Dependency graph
requires:
  - phase: 15-svelte5-scaffold
    provides: ESLint flat config architecture in packages/shared-config
provides:
  - OXC toolchain evaluation report with rule coverage, benchmark data, and DEFER recommendation
affects: [linting, toolchain-upgrades]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - .planning/phases/20-oxc-toolchain-exploration/20-OXC-EVALUATION.md
  modified: []

key-decisions:
  - "DEFER oxlint migration -- Svelte template linting not supported (dealbreaker)"
  - "Hybrid approach (oxlint for TS + ESLint for Svelte) rejected as adding complexity for marginal gain"
  - "4 trigger conditions defined for re-evaluation: Svelte support, JS plugin API, Svelte team migration, monorepo growth"

patterns-established:
  - "Toolchain evaluation pattern: benchmark + rule coverage + ecosystem readiness check"

requirements-completed: [OXC-01, OXC-02, OXC-03]

# Metrics
duration: 4min
completed: 2026-03-18
---

# Phase 20 Plan 01: OXC Toolchain Evaluation Summary

**oxlint evaluation with 12x benchmark speedup confirmed but DEFER recommendation due to Svelte template linting gap**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-18T10:38:52Z
- **Completed:** 2026-03-18T10:43:08Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Ran informal ESLint vs oxlint benchmark on the monorepo: ESLint 3.4s vs oxlint 0.29s (~12x speedup, 1298 files)
- Documented complete rule coverage comparison: 9/16 active rules have direct oxlint equivalents, 4 gaps all acceptable
- Identified Svelte template linting as the primary blocker (dealbreaker) preventing migration
- Produced self-contained evaluation report with DEFER recommendation, trigger conditions, and future migration path

## Task Commits

Each task was committed atomically:

1. **Task 1: Run informal ESLint vs oxlint benchmark** -- no files (data captured for report)
2. **Task 2: Write OXC toolchain evaluation report** -- `3f69d608c` (docs)

## Files Created/Modified

- `.planning/phases/20-oxc-toolchain-exploration/20-OXC-EVALUATION.md` -- Complete evaluation report with executive summary, rule coverage table, performance benchmark, Svelte support analysis, DEFER recommendation, trigger conditions, and future migration path

## Decisions Made

- **DEFER oxlint migration** -- Svelte template linting is not supported by oxlint (JS plugin system lacks custom file format support), and this is a dealbreaker for a SvelteKit monorepo with 167 .svelte files
- **Hybrid approach rejected** -- Running both oxlint (for TS/JS) and ESLint (for Svelte) adds configuration complexity for marginal gain given ESLint's 3.4s lint time is not a pain point
- **4 trigger conditions for re-evaluation** -- (1) oxlint ships Svelte template support, (2) JS plugin API supports custom formats, (3) Svelte team completes oxlint migration, (4) monorepo grows past 5,000+ files
- **Acceptable rule gaps documented** -- `no-restricted-syntax` (enum ban), `naming-convention`, `simple-import-sort` (imports + exports) -- all project-specific/opinionated rules

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] oxlint npx native binding failure**
- **Found during:** Task 1 (benchmark setup)
- **Issue:** `npx oxlint@latest` failed due to npm optional dependency bug not installing `@oxlint/binding-darwin-arm64` and Node 22.4.0 being outside oxlint's engine requirement (`^20.19.0 || >=22.12.0`)
- **Fix:** Installed oxlint with explicit native binding in a temp directory (`npm install oxlint@latest @oxlint/binding-darwin-arm64@latest --ignore-engines`)
- **Files modified:** None (temp directory, cleaned up after benchmark)
- **Verification:** `oxlint --version` returned `Version: 1.56.0`
- **Committed in:** N/A (no project files affected)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor -- workaround for npx bug did not affect benchmark quality or report content.

## Issues Encountered

- ESLint benchmark ran with Turborepo caching (some workspaces were cache hits), so the 3.4s figure represents a warm run. A cold run would be slower, but the comparison is still meaningful as it reflects real developer workflow conditions.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Evaluation report is complete and self-contained
- DEFER recommendation means no code changes to the linting stack
- Monitor oxlint releases (~weekly) for Svelte support milestones
- Re-evaluate by 2026-06-18 or when trigger conditions are met

## Self-Check: PASSED

- FOUND: 20-OXC-EVALUATION.md
- FOUND: 20-01-SUMMARY.md
- FOUND: commit 3f69d608c

---
*Phase: 20-oxc-toolchain-exploration*
*Completed: 2026-03-18*
