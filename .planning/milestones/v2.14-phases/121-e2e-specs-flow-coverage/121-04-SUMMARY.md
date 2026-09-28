---
phase: 121-e2e-specs-flow-coverage
plan: 04
subsystem: testing
tags: [dev-seed, e2e, playwright, analytics, umami, app-settings]

# Dependency graph
requires:
  - phase: 121-e2e-specs-flow-coverage
    provides: perm-seed template + setup/teardown conventions (perm-org-matching skeleton)
provides:
  - "perm-analytics-tracking dev-seed template (D-01) arming the analytics overlay for EFLOW-08"
  - "Registry import/map/re-export of permAnalyticsTrackingTemplate in templates/index.ts"
  - "perm-analytics-tracking setup + prefix-scoped teardown triad"
affects: [121-05 (playwright config triad wiring), 121-06/121-07 (voter-prefs-tracking spec)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Analytics-overlay seed: spread MINIMAL_BASE_APP_SETTINGS then override analytics with full platform OBJECT {name,code,infoUrl} + trackEvents:true"
    - "Dummy analytics code (e2e-dummy-code) — never a real key; seed only needs the platform object present"

key-files:
  created:
    - packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts
    - tests/tests/setup/perm/perm-analytics-tracking.setup.ts
    - tests/tests/setup/perm/perm-analytics-tracking.teardown.ts
  modified:
    - packages/dev-seed/src/templates/index.ts

key-decisions:
  - "analytics.platform.code seeded with DUMMY value e2e-dummy-code (threat T-121-AN), never a real Umami key"
  - "Consent is NOT seeded — toggled at runtime by the consuming spec (Plan 07); seed only arms platform + trackEvents"
  - "Additive namespaced dataset (externalIdPrefix e2e-perm-analytics-); e2e/base left untouched"

patterns-established:
  - "Pattern: analytics-overlay perm seed mirrors perm-org-matching skeleton with an app_settings analytics override"

requirements-completed: []  # EFLOW-08 remains in-progress overall — this plan delivers the seed dependency (D-01), not the consuming assertion (Plan 07)

# Metrics
duration: ~25min
completed: 2026-06-16
---

# Phase 121 Plan 04: perm-analytics-tracking Seed Template Summary

**D-01 dev-seed template arming the analytics overlay (full umami platform object + dummy code + trackEvents:true) for the EFLOW-08 voter-prefs-tracking spec, registered + re-exported with its setup/teardown triad.**

## Performance

- **Duration:** ~25 min (implementation landed in commit b75fd7a50)
- **Completed:** 2026-06-16
- **Tasks:** 1
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments
- New `perm-analytics-tracking.ts` template: spreads `MINIMAL_BASE_APP_SETTINGS`, overrides `analytics` with the FULL platform object `{ name:'umami', code:'e2e-dummy-code', infoUrl:'https://example.test/umami' }` + `trackEvents:true`; minimal walkable voter topology; `externalIdPrefix='e2e-perm-analytics-'`; consent intentionally NOT seeded.
- Registered in `templates/index.ts`: import (L22), map entry `'perm-analytics-tracking'` (L119), re-export (L145).
- Created `perm-analytics-tracking.setup.ts` (`setupFromTemplate('perm-analytics-tracking')`, unauthenticated) and `perm-analytics-tracking.teardown.ts` (PREFIX `e2e-perm-analytics-` matching the template prefix).
- `@openvaa/dev-seed` builds clean with the template registered.

## Task Commits

1. **Task 1: D-01 perm-analytics-tracking template + registry + setup/teardown + dev-seed rebuild** - `b75fd7a50` (feat)

_Note: This plan was resumed/finalized after a prior executor died (transient API 500) post-implementation-commit but pre-SUMMARY. The implementation commit `b75fd7a50` was independently verified intact; no re-implementation was needed._

## Files Created/Modified
- `packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts` - D-01 analytics overlay seed template (`permAnalyticsTrackingTemplate`)
- `packages/dev-seed/src/templates/index.ts` - import + `'perm-analytics-tracking'` map entry + re-export
- `tests/tests/setup/perm/perm-analytics-tracking.setup.ts` - seed setup via `setupFromTemplate`
- `tests/tests/setup/perm/perm-analytics-tracking.teardown.ts` - prefix-scoped `runTeardown`

## Decisions Made
- **Dummy analytics code:** `analytics.platform.code = 'e2e-dummy-code'` (threat T-121-AN, Information Disclosure → mitigate). The seed only needs the platform OBJECT present + `trackEvents:true`; no real Umami/analytics key is committed.
- **Consent not seeded:** consent is a runtime toggle owned by the consuming spec (Plan 07), not a seeded value.
- **Additive, namespaced:** `externalIdPrefix='e2e-perm-analytics-'` keeps the dataset isolated; teardown clears exactly this prefix; e2e/base is untouched.

## Deviations from Plan
None - plan executed exactly as written. The implementation was already committed by the prior (interrupted) executor; this session confirmed acceptance criteria and finalized tracking only.

## Issues Encountered
The prior executor died on a transient API 500 after committing the implementation but before writing this SUMMARY and updating tracking. Resolved by verifying the committed work (registry greps, overlay/prefix content, clean dev-seed build) and finalizing the docs — no code changes required.

## Threat Flags
None beyond the registered T-121-AN, which is mitigated (dummy code, no secrets committed).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- D-01 seed dependency is in place. Plan 05 wires the perm triad (playwright.config `data-setup-perm-analytics-tracking` project + teardown); Plan 06/07 add the `voter-prefs-tracking` spec that consumes this overlay and asserts tracking-event emission under consent / suppression.
- **EFLOW-08 remains in-progress overall** — this plan delivers the dependency (seed node), not the assertion (consuming spec is Plan 07). EFLOW-08 should NOT be marked fully Complete here.

## Self-Check: PASSED
- FOUND: packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts
- FOUND: tests/tests/setup/perm/perm-analytics-tracking.setup.ts
- FOUND: tests/tests/setup/perm/perm-analytics-tracking.teardown.ts
- FOUND: packages/dev-seed/src/templates/index.ts (import L22 / map L119 / re-export L145)
- FOUND commit: b75fd7a50

---
*Phase: 121-e2e-specs-flow-coverage*
*Completed: 2026-06-16*
