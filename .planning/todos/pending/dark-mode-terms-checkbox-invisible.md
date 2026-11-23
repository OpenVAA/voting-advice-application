---
created: 2026-11-23
title: In dark mode the terms-of-use checkbox is invisible while unchecked
area: frontend
severity: major
source: phase 189.1 UAT, test 2 (operator, bank sign-in on staging)
owner: a later frontend phase
files:
  - apps/frontend/src/lib/contestant/components/termsOfUse/TermsOfUseForm.svelte
---

## Problem

Reported by the operator during the staging bank-authentication UAT on 2026-11-23: in dark mode, the checkboxes of the terms of use cannot be seen while they are unchecked. `TermsOfUseForm.svelte` renders a bare DaisyUI `checkbox`, whose unchecked border apparently does not contrast with the dark background.

## Done when

- The unchecked checkbox is visible in dark mode, its border meeting WCAG 2.1 AA non-text contrast (3:1) against its background, in both themes.
- The axe scan of the terms-of-use screen runs in dark mode too, and a contrast regression would fail it.
- Any other bare `checkbox` that shares the cause is fixed with it.
