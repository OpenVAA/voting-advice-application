---
phase: 121-e2e-specs-flow-coverage
plan: 05
subsystem: e2e-test-infra
tags: [playwright, e2e, project-dag, mobile-descriptor, perm-triad]
requires:
  - "121-04 (perm-analytics-tracking setup/teardown files for the triad testMatch)"
provides:
  - "voter-dark-mode leaf project (consumed by Plan 07)"
  - "voter-journey-mobile leaf project (consumed by Plan 07)"
  - "perm-analytics-tracking triad incl. voter-prefs-tracking (consumed by Plan 06)"
affects:
  - "tests/playwright.config.ts (project DAG)"
tech-stack:
  added: []
  patterns:
    - "Leaf project on data-setup-base (cold-entry-dataroot analog)"
    - "Explicit mobile descriptor 390x844 isMobile/hasTouch at project scope (visual-regression analog, not devices['Pixel 5'])"
    - "Perm triad serial chain over app_settings singleton (setup deps prev-perm-spec)"
key-files:
  created: []
  modified:
    - "tests/playwright.config.ts"
decisions:
  - "Mobile descriptor uses explicit 390x844 isMobile/hasTouch, matching visual-regression, over devices['Pixel 5'] (RESEARCH A3/Open Q1)"
  - "voter-prefs-tracking hosted under the perm-analytics-tracking triad (not a base leaf) because the analytics overlay clobbers the app_settings singleton (PATTERNS singleton conflict)"
  - "perm-analytics-tracking setup depends on perm-org-matching (the verified tail) to preserve the strict serial perm chain"
metrics:
  duration: "~10m"
  completed: "2026-06-16"
  tasks: 1
  files: 1
---

# Phase 121 Plan 05: Playwright project DAG wiring (dark-mode + mobile leaves + analytics-tracking triad) Summary

Added three new Playwright project sets to `tests/playwright.config.ts` so the Wave-3 specs (Plans 06/07/08) have project homes and cannot silently "not run": two read-only leaf projects on `data-setup-base` (`voter-dark-mode`, `voter-journey-mobile` with an explicit 390×844 mobile descriptor) and the `perm-analytics-tracking` triad (`data-setup-perm-analytics-tracking` → `data-teardown-perm-analytics-tracking` → `voter-prefs-tracking`) appended after the verified perm tail `perm-org-matching`.

## What Was Built

- **`voter-dark-mode` leaf** — `testDir ./tests/specs/voter`, `testMatch /voter-dark-mode\.spec\.ts/`, `use {...devices['Desktop Chrome']}`, `dependencies ['data-setup-base']`. Mirrors the `cold-entry-dataroot` leaf block.
- **`voter-journey-mobile` leaf** — same `testDir`, `testMatch /voter-journey-mobile\.spec\.ts/`, `use {...devices['Desktop Chrome'], viewport:{width:390,height:844}, isMobile:true, hasTouch:true}`, `fullyParallel:false`, `dependencies ['data-setup-base']`. Descriptor lives at project scope so the walk spec stays viewport-agnostic.
- **perm-analytics-tracking triad** appended after `perm-org-matching` (verified to still be the tail, A5):
  - `data-setup-perm-analytics-tracking` — `testMatch /perm-analytics-tracking\.setup\.ts/`, `teardown 'data-teardown-perm-analytics-tracking'`, `dependencies ['perm-org-matching']` (serial chain over the shared `app_settings` singleton).
  - `data-teardown-perm-analytics-tracking` — `testMatch /perm-analytics-tracking\.teardown\.ts/`.
  - `voter-prefs-tracking` — `testDir ./tests/specs/voter`, `testMatch /voter-prefs-tracking\.spec\.ts/`, `fullyParallel:false`, `use {...devices['Desktop Chrome']}`, `dependencies ['data-setup-perm-analytics-tracking']`.

## Verification

- `yarn test:e2e --list` → exit 0, no config/type error. The new setup/teardown projects are listed (Plan 04 files exist). The three leaf spec projects (`voter-dark-mode`, `voter-journey-mobile`, `voter-prefs-tracking`) register in the DAG but show no spec rows yet because their target spec files arrive in Plans 06/07/08 — exactly the expected pre-Wave-3 state. Playwright loads them with zero matching tests without error.
- All five new project `name:` entries confirmed present in the parsed config (L240, L253, L952, L958, L962).
- `voter-journey`'s `testMatch` is exact (`/voter-journey\.spec\.ts/`) so it never picks up the new `voter-*.spec.ts` siblings (Pitfall 3).
- No file deletions in the commit.

## Deviations from Plan

None — plan executed exactly as written.

## Authentication Gates

None.

## Known Stubs

None. This is config-only project wiring; the consuming spec files are produced by Plans 06/07/08.

## Commits

- `ef5c0e242` — feat(121-05): wire voter-dark-mode + voter-journey-mobile leaves + perm-analytics-tracking triad

## Self-Check: PASSED

- FOUND: tests/playwright.config.ts (5 new project entries)
- FOUND: commit ef5c0e242
