---
created: 2026-06-06T15:31:46.122Z
title: Fix broken default seed template
area: tooling
priority: high
files:
  - packages/dev-seed/src/templates/default.ts
  - packages/dev-seed/src/templates/index.ts
resolves_phase: 119
---

## Problem

The **default** seed template (the one used by `yarn db:reset-with-data`,
`yarn db:seed:default`, and `yarn db:seed --template default` — the Finnish demo
dataset, NOT the `e2e/*` templates) is broken. Three symptoms observed:

1. **0 parties in results** — the voter results page shows no organizations/parties
   for the default-seeded data.
2. **Candidates tab not shown** — the results entity-type tabs don't render the
   candidates tab (likely tied to `appSettings.results.sections` / nominations not
   being seeded, or matches coming back empty for the default dataset).
3. **Mixed naming of constants** — the template mixes naming conventions for its
   constants (inconsistent with the `e2e/base` template's conventions), which makes
   the data shape hard to reason about and may be contributing to 1 & 2.

This is the developer-facing "first run" dataset, so a broken default template is a
bad onboarding/demo experience. High priority.

Surfaced during v2.11 Phase 101 (milestone-close) while debugging the voter results
flow — note this is the DEFAULT template, separate from the `e2e/base` template the
E2E suite uses (that one renders parties/candidates correctly), so the bug is scoped
to `default.ts`, not the shared results-rendering path.

## Solution

TBD. Investigate `packages/dev-seed/src/templates/default.ts`:
- Confirm it seeds organizations/parties + their nominations for the election(s).
- Confirm `app_settings.results.sections` includes both `candidate` and
  `organization` (drives which entity tabs render).
- Reconcile constant naming with the `e2e/base` template conventions.
- Verify against the live results page after `yarn db:reset-with-data` (0 parties /
  no candidates tab should both be gone).
Cross-ref: [[2026-05-31-edit-the-seed-utility-to-use-strict-typing-for-the-templates]]
(strict template typing would likely have caught the const-naming drift).
