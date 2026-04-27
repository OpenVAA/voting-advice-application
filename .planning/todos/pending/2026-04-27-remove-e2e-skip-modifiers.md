---
title: Sweep E2E suite for `test.skip(true, ...)` modifiers — make the suite deterministic
priority: medium
created: 2026-04-27
context: Captured during Phase 64 discuss-phase as a deferred follow-up. Every `test.skip(true, ...)` is a place where the test contract is data-dependent. Phase 64 removes them in `voter-results.spec.ts` for RESULTS-01/02 + D-14 + D-15; the rest of the suite carries similar skip paths that should be evaluated.
---

# Sweep E2E suite for `test.skip(true, ...)` modifiers

Phase 64 removes the data-dependent skip paths in
`tests/tests/specs/voter/voter-results.spec.ts` lines 169-181, 202-213,
232-243 by guaranteeing seed prerequisites and replacing the skips with
hard assertions. The same pattern likely exists across the broader E2E
suite.

## Goal

Make the entire E2E suite deterministic. Every test should either pass
or fail — never skip silently because seed data is too sparse.

## Approach

1. **Inventory** — `grep -rn "test.skip(true" tests/tests/specs/` to
   enumerate every conditional skip currently in use
2. **Classify** each skip as one of:
   - **Removable** — the prerequisite can be guaranteed by extending the
     e2e template or fixture; replace skip with hard assertion
   - **Documented-flake** — the underlying behavior is intermittent and
     belongs in DATA_RACE_TESTS, not in a runtime skip path; reclassify
     and remove the skip
   - **Genuinely conditional** — the test exercises a feature that may
     legitimately be absent in some configurations (e.g., variant-only
     features); convert to a `test.describe.configure({ mode: 'serial' })`
     guarded against a configuration boolean instead of runtime data
3. **Apply** — fix each case per its classification
4. **Lint-rule** (optional follow-up) — add an ESLint rule or a CI grep
   gate that flags `test.skip(true, ...)` so future drift is prevented

## Why deferred

The sweep is a cross-spec hygiene concern that doesn't gate Phase 64's
parity-close goal. Best handled as a dedicated test-hygiene phase,
potentially paired with the all-filter-types coverage extension
(`2026-04-27-extend-e2e-filter-type-coverage.md`).

## Files of interest

- `tests/tests/specs/**/*.spec.ts` — full inventory target
- `tests/tests/fixtures/*.ts` — fixtures may need extension to support
  the new hard contracts
- `packages/dev-seed/src/templates/e2e.ts` — template may need extension
  to satisfy newly-promoted hard prerequisites

## Related work

- Phase 64 D-11 — removes skip paths in `voter-results.spec.ts` for the
  5 named tests; this todo extends that to the rest of the suite
- Phase 63 E2E-02 — established the e2e-template precedent for deterministic
  test prerequisites (app_settings.fixed[])
