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

## Disposition: FIXED

Source: Phase 131 Plan 02 (131-02-PLAN.md / 131-02-SUMMARY.md)

Resolved by hardening the SHARED navigation helper at the class level (not a
spec-local band-aid), per D-03.

- **Reproduce-first (D-03/§4.5):** attempted against clean HEAD. The only
  uncontaminated iteration (REPRO-1) passed 81/0/0 — the Phase-127 run-1 race
  did not reproduce. Two further iterations were contaminated by an unrelated
  mid-session vite dev-server crash (ERR_CONNECTION_REFUSED), not the race. With
  the genuine race unreproducible after a bounded attempt, the helper was
  hardened DEFENSIVELY (test-only, D-09-preferred) — a genuine product hydration
  race would have been escalated, not absorbed.
- **Harden (commit a6ba83c5a):** `navigateToFirstQuestion` in
  `tests/tests/utils/voterNavigation.ts` now appends
  `answerOption.waitFor({ state: 'visible', timeout: TIMEOUTS.element })` AFTER
  the existing `waitForURL(/\/questions\//)`. This closes the window where
  `advanceVoterFlow` short-circuits on an answer option visible on the
  pre-redirect `/questions` intro page, but the `/questions → /questions/__first__`
  onMount redirect then detaches it — the caller could otherwise observe a
  mid-redirect transitional DOM (the heading where ElectionTag renders).
- **3× green (post-fix/131-perm-hide-election-tags-3x.txt):** pass/pass/pass,
  81 passed each, zero did-not-run.
- **5-consumer regression (post-fix/131-helper-consumer-regression.txt):** all
  navigateToFirstQuestion consumers — perm-hide-election-tags,
  perm-hide-if-missing-answers, perm-hide-category-tags, perm-disable-allow-open,
  and the minimalVoterResultsPage.fixture.ts path (exercised by the latter two) —
  green in one cold-start run (89 passed, zero failures, zero did-not-run). The
  harden does not regress the perm cluster.
