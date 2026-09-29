---
phase: 119-e2e-fixtures-helpers-seed
plan: 04
subsystem: dev-seed (e2e perm templates + e2e/base + registry)
tags: [e2e, dev-seed, perm-templates, settings-overlay, EPERM-09, EPERM-11, EPERM-07]
requires:
  - 119-03 (registered perm-question-video / perm-interactive-info / perm-org-matching in index.ts — this plan's registry edits are additive on top)
provides:
  - "show-feedback-survey perm template (renamed from perm-header-show-feedback, extended) — EPERM-09 seed substrate"
  - "perm-access-disable consolidated perm template — EPERM-11 seed substrate"
  - "e2e/base question carrying additive customData.terms — EPERM-07 NOTE seed substrate"
  - "registry: 'show-feedback-survey' (renamed key) + 'perm-access-disable' (added key)"
affects:
  - Phase 120 (EPERM specs) — consumes the renamed/consolidated registry keys + the terms-bearing base question
tech-stack:
  added: []
  patterns:
    - "buildMinimal + settingsOverlay perm authoring (single-Likert minimal topology)"
    - "git mv rename so history follows the renamed template file"
    - "3-edit registry rule (import + BUILT_IN_TEMPLATES key + re-export)"
key-files:
  created:
    - packages/dev-seed/src/templates/e2e/perm/show-feedback-survey.ts (via git mv from perm-header-show-feedback.ts)
    - packages/dev-seed/src/templates/e2e/perm/perm-access-disable.ts
  modified:
    - packages/dev-seed/src/templates/e2e/base.ts
    - packages/dev-seed/src/templates/index.ts
  deleted:
    - packages/dev-seed/src/templates/e2e/perm/perm-header-show-feedback.ts (deletion-by-rename via git mv)
decisions:
  - "results.showSurveyPopup/showFeedbackPopup authored as numeric popup delays (500/180), not booleans — the dynamicSettings type makes them numeric delays; the type-correct equivalent of the coverage-plan's 'true' is a positive delay"
  - "survey.showIn authored as ['resultsPopup'] (not ['results']) + linkTemplate — 'resultsPopup' is the valid showIn enum member surfacing the survey in a results popup; survey requires linkTemplate"
  - "terms trigger 'Likert' (appears verbatim in test-e2e-base-qu-opin-base-3-likert7 title) — chose a question with no prior custom_data and no rigid base-count assertion"
metrics:
  duration: ~12m
  completed: 2026-06-15
---

# Phase 119 Plan 04: Settings-Overlay Perm Templates + Additive e2e/base Terms Summary

Renamed+extended the feedback perm into `show-feedback-survey` (EPERM-09), authored the consolidated `perm-access-disable` template (EPERM-11), added an additive `customData.terms` to one `e2e/base` question (EPERM-07 NOTE), and reconciled the registry — dev-seed unit suite (441) + `typecheck:tests` both green.

## What Was Built

### Task 1 — show-feedback-survey rename+extend (EPERM-09) + perm-access-disable (EPERM-11)
- `git mv perm-header-show-feedback.ts → show-feedback-survey.ts` (history follows). Symbol `permHeaderShowFeedbackTemplate → showFeedbackSurveyTemplate` (+ default export). Prefix changed to `e2e-perm-feedback-survey-`.
- Extended `settingsOverlay`: KEPT `header.showFeedback: true` (additive; existing header-feedback assertion stays valid) and ADDED `results.showSurveyPopup`/`results.showFeedbackPopup` (numeric delays) + `survey.showIn: ['resultsPopup']` + `survey.linkTemplate`.
- New `perm-access-disable.ts` via `buildMinimal` (prefix `e2e-perm-access-disable-`), exporting `permAccessDisableTemplate` + default. Its `settingsOverlay.access` expresses `voterApp`/`candidateApp`/`underMaintenance`; the Phase-120 spec re-seeds the singleton per mode.
- `perm-disable-voter-app.ts` / `perm-disable-candidate-app.ts` template files RETAINED (their Phase-120-owned setup consumers still resolve them — Pitfall 3).
- Commit: `1101af258`

### Task 2 — additive customData.terms on e2e/base + registry reconciliation
- Added `custom_data: { terms: [{ triggers: ['Likert'], title: 'Likert scale', content: ... }] }` to `test-e2e-base-qu-opin-base-3-likert7` (the trigger 'Likert' appears verbatim in the question title; additive customData, no rigid base count changed).
- `index.ts`: renamed the `perm-header-show-feedback` registration to `'show-feedback-survey'` (import + BUILT_IN_TEMPLATES key + re-export), ADDED `'perm-access-disable'` (import + key + re-export). RETAINED `'perm-disable-voter-app'`/`'perm-disable-candidate-app'` keys.
- `yarn workspace @openvaa/dev-seed test:unit` → 441 passed. `yarn typecheck:tests` → exit 0.
- Commit: `b723973c5`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Type correctness] Authored type-valid feedback/survey setting values**
- **Found during:** Task 1
- **Issue:** The plan (and the coverage-plan note) phrased the new settings as `results.showSurveyPopup=true`, `results.showFeedbackPopup=true`, and `survey.showIn=['results']`. The live `packages/app-shared/src/settings/dynamicSettings.type.ts` makes `results.showSurveyPopup`/`showFeedbackPopup` **numeric popup delays** (not booleans), and `survey.showIn` accepts `Array<'frontpage' | 'entityDetails' | 'navigation' | 'resultsPopup'>` — `'results'` is NOT a valid member. `survey` also requires a `linkTemplate`. The `settingsOverlay` field is `Record<string, unknown>`, so the literal plan values would typecheck but produce a semantically-broken overlay that fails the post-seed `toMatchObject` validation at runtime.
- **Fix:** Authored `results.showSurveyPopup: 500`, `results.showFeedbackPopup: 180` (positive delays = the type-correct "enabled"), and `survey: { linkTemplate, showIn: ['resultsPopup'] }`. The `showSurveyPopup` token still satisfies the plan's artifact `contains` check.
- **Files modified:** packages/dev-seed/src/templates/e2e/perm/show-feedback-survey.ts
- **Commit:** 1101af258

No other deviations — registry rename/consolidation and the additive base change followed the plan exactly.

## Notes / Handoff (Phase 120 — out of 119 scope)
- `git mv perm-header-show-feedback.spec.ts → perm-show-feedback-survey.spec.ts` + setup/teardown/playwright-config rename.
- Absorb `perm-disable-voter-app.spec.ts` + `perm-disable-candidate-app.spec.ts` into `perm-access-disable.spec.ts`, then atomically remove the two old templates + their registry keys + setup files (Pitfall 3 — removing now would orphan still-present consumers).

## Self-Check: PASSED
