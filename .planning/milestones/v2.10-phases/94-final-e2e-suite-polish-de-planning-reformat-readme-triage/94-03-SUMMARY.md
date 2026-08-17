---
phase: 94-final-e2e-suite-polish-de-planning-reformat-readme-triage
plan: 03
subsystem: e2e-tests
tags: [de-planning, test-hygiene, perm-specs, a11y, visual, perf, wr-02]
requires:
  - 94-01 (residual-grep gate + carve-out list locked)
provides:
  - 25 de-planned + retitled E2E specs (22 perm + a11y/visual/perf)
  - WR-02 quarantine re-enable TODO at perm-per-app-notifications
affects:
  - tests/tests/specs/perm/
  - tests/tests/specs/a11y/
  - tests/tests/specs/visual/
  - tests/tests/specs/perf/
tech-stack:
  added: []
  patterns:
    - "Plain-language test/describe titles (no Phase/Plan/D-NN/TIR/A11Y-0 refs)"
    - "Functional directive comments (// reason:, eslint-disable) preserved verbatim"
key-files:
  created: []
  modified:
    - tests/tests/specs/perm/perm-1e1cg1co.spec.ts
    - tests/tests/specs/perm/perm-2e-asymmetric.spec.ts
    - tests/tests/specs/perm/perm-2e-shared.spec.ts
    - tests/tests/specs/perm/perm-answers-locked.spec.ts
    - tests/tests/specs/perm/perm-disable-allow-open.spec.ts
    - tests/tests/specs/perm/perm-disable-candidate-app.spec.ts
    - tests/tests/specs/perm/perm-disable-election-1co.spec.ts
    - tests/tests/specs/perm/perm-disable-election-2co.spec.ts
    - tests/tests/specs/perm/perm-disable-voter-app.spec.ts
    - tests/tests/specs/perm/perm-disjoint-1co.spec.ts
    - tests/tests/specs/perm/perm-header-show-feedback.spec.ts
    - tests/tests/specs/perm/perm-header-show-help.spec.ts
    - tests/tests/specs/perm/perm-hide-all-nominations.spec.ts
    - tests/tests/specs/perm/perm-hide-category-tags.spec.ts
    - tests/tests/specs/perm/perm-hide-election-tags.spec.ts
    - tests/tests/specs/perm/perm-hide-hero.spec.ts
    - tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts
    - tests/tests/specs/perm/perm-localisation-positive.spec.ts
    - tests/tests/specs/perm/perm-missing-nominations.spec.ts
    - tests/tests/specs/perm/perm-not-located-2e2cg.spec.ts
    - tests/tests/specs/perm/perm-per-app-notifications.spec.ts
    - tests/tests/specs/perm/perm-startfromcg.spec.ts
    - tests/tests/specs/a11y/a11y-smoke.spec.ts
    - tests/tests/specs/visual/visual-regression.spec.ts
    - tests/tests/specs/perf/performance-budget.spec.ts
decisions:
  - "WR-02/D-03 honoured: perm-per-app-notifications kept skipped + intact; only a re-enable TODO added"
  - "localisation-positive title reformatted to plain language (verified safe — no --grep anchor)"
metrics:
  duration: ~25min
  completed: 2026-06-03
---

# Phase 94 Plan 03: Perm + a11y/visual/perf spec de-planning Summary

Mechanically de-archaeologized 25 E2E spec files (22 perm + a11y/visual/perf), reformatting every `test`/`describe` title to plain language, stripping `Phase`/`Plan`/`D-NN`/`TIR`/`A11Y-0`/`MED-`/`PERM-L10N-POS`/`Pitfall`/`RESEARCH §`/`Assumption` archaeology from comments, collapsing wrapped prose, and adding the WR-02 quarantine re-enable TODO — all while preserving functional string literals, `// reason:` blocks, and eslint-disable directives.

## What Was Built

- **Task 1 — 22 perm specs** (`e4de205c4`): stripped docstring/inline archaeology; reformatted the `perm-localisation-positive` test title (`full TIR5:52-95 walk …` → `localisation walk across en/fi/sv with voter-side cross-check`); added the inline `// TODO: re-enable perm-per-app-notifications projects + spec after the Svelte 5 runes migration` marker at the quarantined `describe.skip` (D-03 — spec, projects, and skip all left intact).
- **Task 2 — a11y/visual/perf specs** (`c9fe08eb4`): reformatted the a11y title `A11Y-04 axe smoke — ${route.name}` → `axe accessibility scan — ${route.name}` (template expression preserved) across all 4 occurrences (3 dynamic + the static `questions`/`results`/`voter-detail-drawer` cases); stripped phase/plan/DETERM/RESEARCH refs from the a11y, visual, and perf docstrings; preserved `PLAYWRIGHT_VISUAL`/`PLAYWRIGHT_PERF` env-gate references.

## Verification

| Gate | Result |
| ---- | ------ |
| Task 1 scoped residual grep (22 perm specs, carve-outs + re-enable TODO filtered) | CLEAN |
| `perm-per-app-notifications.spec.ts` retains `describe.skip` + `re-enable perm-per-app-notifications` TODO | PASS |
| Task 2 scoped residual grep (a11y/visual/perf, carve-outs filtered) | CLEAN |
| `yarn typecheck:tests` | exit 0 |
| `npx playwright test --list` | `Total: 84 tests in 72 files` |

## Deviations from Plan

None — plan executed exactly as written. Functional string literals (`e2e/base`, `e2e-perm-*`, `test-perm-*`, testIds, bracketed `[CA1A]`/`[EL1]`/`[QU-OPIN-L5-1]` data markers) and directive comments were left untouched; no logic changes.

## Known Stubs

None — these are comment/title-only edits to existing specs. No data wiring, no placeholder values.

## Self-Check: PASSED

- All 25 modified files exist on disk (confirmed via Edit success + git commit file counts: 22 + 3).
- Commit `e4de205c4` (Task 1) and `c9fe08eb4` (Task 2) both present in git log.
