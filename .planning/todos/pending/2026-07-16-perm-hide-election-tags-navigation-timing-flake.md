---
created: "2026-07-16T00:00:00.000Z"
title: Triage perm-hide-election-tags navigation-timing flake (Phase 127 gate, run 1)
area: testing
priority: medium
resolves_phase: 131
files:
  - tests/e2e (perm-hide-election-tags spec + navigation helper)
source: Phase 127 finding (127-03-SUMMARY.md — D-06 gate run 1)
---

## Problem

During the Phase 127 D-06 acceptance gate, the first full E2E run failed once on
`perm-hide-election-tags` — a navigation-helper timing race, NOT a behavior change:
the error-context snapshot shows the `/questions` page rendered correctly with no
election tag (i.e. the product behavior under test was correct; the helper raced).
Re-run went 125/0/0 with zero code change. Phase 127's commits touch neither
`voterNavigation.ts` nor the `perm-hide-election-tags` seed template (verified by
the phase verifier via git log).

Per the project's cardinal rule, an intermittently-failing test is a real defect
(in the test or the code) and must be ironed out — not left as retry-until-green.

## Solution

Root-cause the navigation-helper race in the `perm-hide-election-tags` spec path
(likely a wait-for-navigation vs. settings-overlay timing issue similar to the
Phase-86 walkToQuestion cold-start race family) and harden the helper or the
spec's wait condition. Evidence: the run-1 failure trace artifact saved by the
Phase 127 gate (see 127-03-SUMMARY.md).
