---
created: 2026-11-23
title: In dark mode the terms-of-use checkbox is invisible while unchecked
area: frontend
severity: major
source: phase 189.1 UAT, test 2 (operator, bank sign-in on staging)
owner: a later frontend phase
files:
  - apps/frontend/src/lib/contestant/components/termsOfUse/TermsOfUseForm.svelte
completed: 2026-11-24
status: completed
---

## Problem

Reported by the operator during the staging bank-authentication UAT on 2026-11-23: in dark mode, the checkboxes of the terms of use cannot be seen while they are unchecked. `TermsOfUseForm.svelte` renders a bare DaisyUI `checkbox`, whose unchecked border apparently does not contrast with the dark background.

## Done when

- The unchecked checkbox is visible in dark mode, its border meeting WCAG 2.1 AA non-text contrast (3:1) against its background, in both themes.
- The axe scan of the terms-of-use screen runs in dark mode too, and a contrast regression would fail it.
- Any other bare `checkbox` that shares the cause is fixed with it.

## Closed (phase 189.1.1)

Fixed by plan 189.1.1-08 (`.planning/workstreams/deployment/phases/189.1.1-address-tech-debt-the-consent-prompt-covers-an-answer-choice/189.1.1-08-PLAN.md`), commit `d2fbfe81b`; evidence in that phase's `evidence/189.1.1-08-controls.md`.

The cause: both themes set daisyUI's `--border: 0px`, and daisyUI 5 draws the checkbox border `var(--border)` wide in its nested utilities layer, so an unchecked box had no boundary in either theme (measured 1:1 in both). The fix is one rule, `:where(.checkbox)`, in the un-sublayered `@layer utilities` block of `apps/frontend/src/app.css`: a 2px border in `--input-color` or the theme's content colour.

- **The unchecked box is visible in dark mode, at 3:1 or more in both themes.** The terms checkbox measures `RATIO_TERMS_LIGHT=12.63` and `RATIO_TERMS_DARK=13.08`, the analytics opt-out box `RATIO_OPTOUT_LIGHT=12.63` and `RATIO_OPTOUT_DARK=13.08`. Red before the rule: `RED_A11Y_RUN_DIR` and `RED_TRACKING_RUN_DIR` (each only the new test failed, `Received: 1`); green after: `GREEN_A11Y_RUN_DIR`, `GREEN_TRACKING_RUN_DIR`.
- **The scan of the terms view runs in dark mode, and a contrast regression fails it.** The terms-of-use view was already scanned by axe in both themes (`contestant-terms-gate`, light and dark, in `contestant-a11y.spec.ts`). axe-core has no WCAG 1.4.11 rule, so axe cannot fail on this defect; what a regression now fails is the computed-style contrast assertion `the unchecked terms checkbox has a border of at least 3:1 contrast in the light and the dark theme`, in the same terms-pending describe, and its twin for the opt-out box in `contestant-terms-tracking.spec.ts`. Both use `tests/tests/utils/nonTextContrast.ts`.
- **Every other bare `checkbox` that shares the cause is fixed with it.** The rule matches every `.checkbox`: `TermsOfUseForm`, `TrackingOptOut`, `NumericEntityFilter`, `EnumeratedEntityFilter`, `ElectionSelector`, `MultiConstituencySelector` and the voter questions page. `--input-color` is not set globally, so a checked box keeps its check mark; a `checkbox-*` variant keeps its own colour. The projects served after the change are green (`E2E_HEAD=fe1c5754f`, twelve projects, `WRAPPER_EXIT_*=0`, `VERDICT_EXIT_*=0`), and the visual baselines are unchanged in the pinned container (`VISUAL_RESULT=unchanged`).
