---
created: 2026-10-06T19:00:27.000Z
title: The navigation drawer does not close on Escape
area: Layout / accessibility
severity: minor
source: Phase 173 plan 12 (E2E run 173-12-slice; deferred-items.md item 4); filed by 173-13
files:
  - apps/frontend/src/lib/layouts/main/Layout.svelte
  - apps/frontend/src/lib/dynamic-components/navigation
  - tests/tests/fixtures/shared/navMenu.fixture.ts
  - tests/tests/specs/contestant/contestant-journey.spec.ts
---

## Problem

Opening the navigation drawer moves focus into it, and the Escape key does not close it: `lib/layouts/main/Layout.svelte` has no key handler, and `git grep -n -E "Escape|keydown" -- apps/frontend/src/lib/layouts apps/frontend/src/lib/dynamic-components/navigation apps/frontend/src/lib/contexts/layout` prints nothing outside tests. Measured in the contestant app: the open menu was still visible five seconds after Escape. The drawer closes through its close item, the overlay or a link.

The voter and admin drawers share `Layout.svelte`; whether they behave the same was not measured. Whether the project's WCAG 2.1 AA bar requires Escape here was not judged: the drawer is not a modal dialog element, but it takes focus and covers the page, and users of a keyboard expect Escape to dismiss it.

## Solution

Decide in an accessibility review; if Escape should close it, handle the key in the layout while the drawer is open, return focus to the menu toggle, and assert it in a component case. Then remove the two `page.keyboard.press('Escape')` calls in `contestant-journey.spec.ts`, which do nothing today, or turn them into assertions; `navMenu.closeNav()` closes the drawer through its close item and says why.
