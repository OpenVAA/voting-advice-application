---
created: 2026-08-27T16:02:00.000Z
title: The candidate answersLocked warning is unscanned — it needs an app_settings scenario the scan family cannot take
area: E2E / a11y
severity: minor
source: Phase 147 (147-SCOUT-INVENTORY.md § 6 "Reachable-but-not-scanned states"; filed by 147-05)
files:
  - tests/tests/specs/a11y/candidate-a11y.spec.ts
  - tests/playwright.config.ts
---

## The gap

`candidate-answers-locked-warning` renders on **three** of the seven scanned candidate
`(protected)` routes when answers are locked. None of Phase 147's 14 scans saw it: the warning is
driven by an `app_settings` scenario, and the scans run against the default `e2e/base` settings.

Its accessibility state is an unknown, not a zero.

## Why its lever is different from the other unscanned states

This one is **not** an identity or dataset choice. `answersLocked` is an `app_settings` value, and
in this suite `app_settings` is owned by the `perm-*` chain, whose every setup performs an
**authoritative singleton REPLACE** (`tests/playwright.config.ts:496-518` records in detail how an
earlier project got that wrong twice).

That is why it cannot simply be added to `candidate-a11y-scan`. `147-ORDERING.md` placed the scan
project in Playwright **phase 3 of 80**, deliberately: phases 1–3 contain **no** `app_settings`
REPLACE and **no** `test-` pre-clear, so the two named ordering hazards are absent by construction.
Making the scan depend on a perm setup would move it into phase ≥ 4 and put it back inside both
hazards — the precise risk Phase 147 measured its way out of.

## Solution — two honest options

1. **Reuse the `perm-answers-locked` setup** and add the three locked-state scans as a *separate*
   project downstream of it, leaving `candidate-a11y-scan` in phase 3 untouched. Costs a project;
   keeps the ordering guarantee.
2. **Accept the gap** and record it as accepted rather than unknown.

Do not resolve it by adding a perm dependency to `candidate-a11y-scan`.

## Note

Filed alone. Its lever is shared with nothing else in the unscanned set, and choosing between the
two options above is a real decision, not bookkeeping.
