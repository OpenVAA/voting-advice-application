---
phase: 119-e2e-fixtures-helpers-seed
plan: 03
subsystem: dev-seed (e2e perm templates)
tags: [e2e, dev-seed, perm-templates, seed-data, EPERM-06, EPERM-07, EPERM-10, SC4]
requires:
  - 119-01 (perm template shared builders + prefix discipline)
provides:
  - perm-question-video template (EPERM-06 video info-media substrate)
  - perm-interactive-info template (EPERM-07 popup/expander + infoSections + arguments substrate)
  - perm-org-matching template (EPERM-10 none/answersOnly/impute substrate)
  - importAnswers org-answer support (organizations can carry own answers)
affects:
  - Phase 120 EPERM specs (consume these three templates via setup/teardown + Playwright project wiring)
tech-stack:
  added: []
  patterns:
    - hand-authored multi-category/multi-type perm template (perm-2e-shared skeleton, NOT buildMinimal)
    - app_settings spread-override of MINIMAL_BASE_APP_SETTINGS sub-keys (questions.categoryIntros / questions.interactiveInfo / matching.organizationMatching)
    - org-own-answers via answersByExternalId stitched by the generalised importAnswers pass
key-files:
  created:
    - packages/dev-seed/src/templates/e2e/perm/perm-question-video.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts
  modified:
    - packages/dev-seed/src/templates/index.ts
    - packages/dev-seed/src/supabaseAdminClient.ts
decisions:
  - "importAnswers generalised over candidates AND organizations (Rule 2/3) — required because the writer previously stitched answersByExternalId only for candidates, but EPERM-10 answersOnly matching needs an org with its OWN answers"
  - "interactiveInfo.enabled / categoryIntros.show / organizationMatching set at the app_settings level (spread-override of MINIMAL_BASE_APP_SETTINGS), since the per-mode toggles are app-singleton settings re-seeded by the Phase-120 spec"
metrics:
  duration: ~25m
  completed: 2026-06-15
  tasks: 2
  files_created: 3
  files_modified: 2
---

# Phase 119 Plan 03: E2E Perm Templates (video / interactive-info / org-matching) Summary

Hand-authored the three multi-type / multi-category perm seed templates that `buildMinimal` cannot express (Pitfall 2) — `perm-question-video` (EPERM-06), `perm-interactive-info` (EPERM-07), `perm-org-matching` (EPERM-10) — registered each in the dev-seed registry, and generalised the writer's answer-stitching pass so an organization can carry its own answers (the substrate `answersOnly` org-matching needs). The dev-seed unit suite stays fully green (441/441), satisfying SC4.

## What Was Built

### Task 1 — `perm-question-video` (EPERM-06) + `perm-interactive-info` (EPERM-07)
- **`perm-question-video.ts`** (prefix `e2e-perm-qvid-`): hand-authored 5-question / 3-opinion-category layout with category intros SHOWN. `customData.video` (`VideoContent` from `@openvaa/app-shared`, placeholder media URLs) on q1/q3/q5 ONLY — none on the category intros. Both candidates fully answer the 5 opinion questions so the candidate-app questions overview is populated. Layout: cat1 [q1 video, q2 no, q3 video], cat2 [q4 no], cat3 [q5 video].
- **`perm-interactive-info.ts`** (prefix `e2e-perm-iinfo-`): `questions.interactiveInfo.enabled=true` (popup-modal mode) in app_settings; two info-text carriers (`qu-popup`, `qu-default`); `customData.infoSections` (2 sections, html content) on `qu-popup`; `customData.arguments` on THREE separate questions — `qu-likert` (LikertPros/Cons), `qu-boolean` (BooleanPros/Cons), `qu-categorical` (CategoricalPros grouped per `choiceId` a/b). `ARGUMENT_TYPE` resolved from `@openvaa/app-shared`.
- Commit: `2ad21a957`.

### Task 2 — `perm-org-matching` (EPERM-10) + registry + writer generalisation
- **`perm-org-matching.ts`** (prefix `e2e-perm-orgmatch-`): `matching.organizationMatching` set in app_settings. ONE opinion category, FOUR Likert-5 questions. Org `or-1` carries SOME own answers (q1='5', q2='1') and leaves q3/q4 BLANK; member candidate `ca-1-1a` answers all four (q3='5', q4='5'), covering the org's blanks. For a polar-max voter (all '5'), `answersOnly` penalises the blanks as polar-opposite ('1') while `impute` fills them from the member ('5') — so the three modes (`none`/`answersOnly`/`impute`) produce distinguishable org match scores.
- **`importAnswers` generalisation** (`supabaseAdminClient.ts`): the answer-stitching pass now iterates BOTH `candidates` and `organizations` (both tables carry an `answers` JSONB column + `external_id`/`project_id`). Previously it processed candidates only, so an org's `answersByExternalId` was silently dropped — making `answersOnly` org matching impossible to seed. The fix is a backward-compatible generalisation (the candidate path is unchanged in behaviour).
- **Registry** (`index.ts`): registered all three with the 3-edit rule each (import + `BUILT_IN_TEMPLATES` key + re-export). Keys stay FLAT (`'perm-question-video'`, `'perm-interactive-info'`, `'perm-org-matching'`). Edits are additive and minimal so they do not collide with Plan 119-04's later registry additions.
- Commit: `2c06d781a`.

## Verification

- **Typecheck:** `tsc --noEmit -p packages/dev-seed/tsconfig.json` — clean.
- **dev-seed unit suite (SC4):** `yarn workspace @openvaa/dev-seed test:unit` — **441 passed (42 files)**, including `supabaseAdminClient.test.ts` (7) unaffected by the `importAnswers` change.
- **Schema parse + registry resolution:** all three templates `TemplateSchema.safeParse` → OK and `BUILT_IN_TEMPLATES[<name>] === template` → OK (validated via tsx harness).
- **Lint:** ESLint clean on all new/changed files (one import-sort autofix applied to `perm-interactive-info.ts`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Generalised `importAnswers` to support organization own-answers**
- **Found during:** Task 2 (authoring `perm-org-matching`).
- **Issue:** The plan requires the EPERM-10 org to carry SOME of its OWN `answersByExternalId` so `answersOnly` differs from `impute`. But the writer's Pass-2 `importAnswers` (`supabaseAdminClient.ts`) iterated `data.candidates` only — an org's `answersByExternalId` was stripped at bulk-import (it is in `NON_COLUMN_FIELDS`) and never re-applied, so the org's `answers` JSONB would stay empty. Without this, `answersOnly` and `impute` cannot diverge and the must-have ("none/answersOnly/impute differ") fails.
- **Fix:** Generalised `importAnswers` over an `answerSources` array covering both `candidates` and `organizations` (both tables share the `external_id` / `answers` / `project_id` shape; the `answers` JSONB column exists on both per `schema/105-answers.sql`). The candidate path is behaviourally unchanged. No schema change, no new table — the `organizations.answers` column already exists. This is a Rule 2/3 fix (missing functionality the deliverable depends on), not architectural.
- **Files modified:** `packages/dev-seed/src/supabaseAdminClient.ts`.
- **Commit:** `2c06d781a`.

**2. [Rule 3 - Blocking] Import-sort autofix on `perm-interactive-info.ts`**
- **Found during:** Task 2 lint pass.
- **Issue:** `simple-import-sort/imports` flagged the value-import `ARGUMENT_TYPE` ordering vs the local `./shared` import.
- **Fix:** ran `eslint --fix` (moved `import { ARGUMENT_TYPE } from '@openvaa/app-shared'` above the `./shared` import). Staged into the Task-2 commit.
- **Commit:** `2c06d781a`.

## Notes / Handoff

- The `interactiveInfo.enabled`, `categoryIntros.show`, and `organizationMatching` toggles are app-singleton settings; this plan ships sensible defaults (popup-modal / intros-shown / impute). The Phase-120 specs re-seed the app_settings singleton per mode (the perm-singleton pattern) to assert the full matrices.
- HANDOFF to Phase 120 (out of 119 scope): the `*.spec.ts`, `tests/tests/setup/perm/<name>.{setup,teardown}.ts`, and `tests/playwright.config.ts` project nodes for these three templates.
- Registry edits were kept additive/minimal so Plan 119-04's later `index.ts` additions (more perm templates) do not collide.

## Known Stubs

None. The templates seed real datasets; placeholder media URLs in `perm-question-video` are intentional (the EPERM-06 spec asserts Video-component visibility/attachment, not playback) and documented in the file header.

## Self-Check: PASSED

- FOUND: packages/dev-seed/src/templates/e2e/perm/perm-question-video.ts
- FOUND: packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts
- FOUND: packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts
- FOUND commit: 2ad21a957 (Task 1)
- FOUND commit: 2c06d781a (Task 2)
- dev-seed unit suite: 441 passed (SC4 green)
