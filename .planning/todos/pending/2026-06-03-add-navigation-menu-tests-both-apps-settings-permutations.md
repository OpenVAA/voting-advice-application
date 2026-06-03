---
created: 2026-06-03T19:12:34.010Z
title: Add E2E tests for navigation menus (both apps) across settings permutations
area: testing
files:
  - tests/tests/specs/
  - apps/frontend/src/lib/dynamic-components/
---

## Problem

The navigation menus for both the voter app and the candidate app are not systematically covered by E2E tests, especially across the settings permutations that change what the nav exposes (header show/hide flags, feedback/help toggles, app-disable flags, election/constituency scope, etc.). Many of these settings already have `perm-*` seed templates + specs in the suite (`tests/tests/setup/perm/`, `tests/tests/specs/perm/`), but there's no dedicated, intentional coverage asserting the **navigation menu** renders the correct items/links for each app under each relevant settings permutation. Nav is a high-traffic, settings-sensitive surface — regressions here (wrong/missing menu items, broken links, wrong active state) are easy to ship unnoticed.

## Solution

TBD. Likely approach:
- Inventory the settings that affect navigation (header show-help / show-feedback, app-disable flags, hidden-* flags, multi-election / constituency scope) and which already have `perm-*` templates.
- Add nav-focused specs (or extend existing `perm-*` specs) asserting the voter-app nav and candidate-app nav contents/links/active-state per permutation, reusing the `perm-*` dev-seed templates rather than inventing new datasets.
- Cover the authenticated candidate nav too (ties into the post-login candidate-nav recheck todo `after-runes-update-check-stale-app-header-styling-banner-ima`).
- Keep it hermetic and green (no external dependencies) consistent with the all-green-suite priority.
