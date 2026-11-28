---
created: 2026-11-28
title: Make Tabs component follow the APG tabs pattern
area: frontend
tags: [voter, contestant, frontend, ui, improvement]
keywords: [a11y, tabs, aria-selected, roving-tabindex, keyboard-navigation]
source: "GitHub issue #218"
github_issues: [218]
files:
  - apps/frontend/src/lib/components/tabs/Tabs.svelte
  - apps/frontend/src/lib/components/tabs/Tabs.type.ts
  - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte
---

# Make Tabs component follow the APG tabs pattern

## Origin

Converted from GitHub issue [#218 Fix Tab component a11y navigation](https://github.com/openvaa/voting-advice-application/issues/218) on 2026-11-28.

## Problem

`apps/frontend/src/lib/components/tabs/Tabs.svelte` renders `<ul role="tablist">` with `<li role="tab" tabindex="0">` items that activate on click/Enter/Space. It is missing the rest of the WAI-ARIA tabs pattern (https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-automatic/): no `aria-selected` on the active tab, no `aria-controls` pointing to a `role="tabpanel"` (the panel is rendered by each caller, e.g. EntityDetails and the results page), all tabs are in the Tab order instead of a roving tabindex, and Left/Right/Home/End do not move between tabs. Axe does not flag these, so the a11y gate passes.

## Solution

Add aria-selected and roving tabindex (active=0, others=-1), Arrow/Home/End handling with automatic activation, and an id scheme so callers can set aria-labelledby/role=tabpanel on their panel (or accept a panel snippet). Use a <button> inside each tab instead of focusable <li>. Add a component test for keyboard behaviour.
