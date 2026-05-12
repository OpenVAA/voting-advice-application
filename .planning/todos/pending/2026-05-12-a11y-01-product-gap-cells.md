# A11Y-01 PRODUCT-GAP cells: email-format + url-format + name-too-short / required-empty

**Date:** 2026-05-12
**Source phase:** 76-profile-a11y (Plan 01 Task 3)
**Scope:** Three deferred candidate-profile validation rejection cells that
require schema + component + i18n additions before the corresponding A11Y-01
spec assertions can be authored. Plan 01 ships the 3 reliably-renderable
cells (image-type, image-size, name-too-long via HTML5 maxlength) and files
this todo for the remaining 3 cells per CONTEXT D-03 PRODUCT-GAP path +
RESEARCH LANDMINE-2.
**Effort:** ~3-5 plans total (1-2 plans each for email-format + url-format;
1 plan for required-empty product-decision + plumbing).
**Source references:**
- Phase 76 CONTEXT D-03 (`.planning/phases/76-profile-a11y/76-CONTEXT.md` §"D-03 — 4 cells, fail-loud rationale per cell")
- Phase 76 RESEARCH §"Concrete Validation Cells" rows 4-6 + §"Recommended A11Y-01 Cell Set"
- Phase 76 Plan 01 PLAN.md (`.planning/phases/76-profile-a11y/76-01-PLAN.md` Tasks 2-3)
- `2026-05-12-qspec-02-multi-choice-categorical-variant.md` — direct shape precedent (Phase 75 P02b deferred-todo)
- Phase 74 D-04 PASS-WITH-DEFERRAL precedent (E2E-01 single-locale)

## Why deferred

### Cell 5 — Email format rejection

- **Schema gap:** `customData.format` field does NOT exist on the
  `CustomData.Question` type. Verified at `packages/app-shared/src/data/customData.type.ts:22-83`
  — the full set is `allowOpen`, `disableMultilingual`, `fillingInfo`,
  `filterable`, `hero`, `hidden`, `locked`, `longText`, `maxlength`,
  `required`, `vertical`, `arguments`, `infoSections`, `terms`, `video`. No
  `format` discriminator.
- **Render-path gap:** HTML5 `type="email"` is used in candidate-app login
  + preregister forms ONLY (per Phase 76 RESEARCH scout §2). The profile
  route at `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte`
  reuses `<QuestionInput>` for editable info questions which dispatches via
  `INPUT_TYPES` in `apps/frontend/src/lib/components/input/QuestionInput.svelte:40-49`
  — no `email` branch exists.
- **i18n gap:** No `input.error.invalidEmail` key in `apps/frontend/src/lib/i18n/translations/en/components.json`
  `input.error` block. Existing keys are `fileLoadingError`, `invalidFile`,
  `invalidUrl`, `oversizeFile` only.

### Cell 6 — URL format rejection (social links)

- **Schema gap:** `Question.subtype` field is COMMENTED OUT on every
  `Question*.type.ts` file in `packages/data/src/objects/questions/`. Only
  `Election` and `Constituency` carry real subtypes. The
  `QuestionInput.svelte:65` branch reads `question.subtype === 'link'` to
  set `type='url'` — that branch is unreachable from any current profile
  field.
- **Render-path gap:** The `Input.svelte:286-296` URL-validation branch
  exists and emits `components.input.error.invalidUrl` correctly — but it
  is unreachable from profile because no editable info question dispatches
  `type='url'` today.

### Cell 4 — Name-too-short / required-empty rejection

- **Product-behavior gap:** `Input.svelte` has NO `handleError` for
  "required field empty". The `required` attribute renders an sr-only
  "Required" badge at `Input.svelte:556-560` (image variant) or `:612-616`
  (text variant), but does NOT block save.
- **Save-path gap:** The save handler at
  `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:125-143`
  reads `allRequiredFilled` (line 94) only to enable/disable the submit
  button via `canSubmit`; it does NOT emit a translation-key error for
  empty required fields. Empty-state save IS allowed by the product today
  (the badge is decorative; the submit-button gating is the only soft
  enforcement).
- **Asserting non-behavior would break:** Plan 01 Cell 4 cannot be authored
  to assert a rejection error that the product doesn't produce. This needs
  a product decision before authoring.

## Scope when picked up

### Email-format (Cell 5)

1. Add `format?: 'email' | 'url' | 'tel' | ...` enum to `CustomData.Question`
   type at `packages/app-shared/src/data/customData.type.ts`.
2. Add an `'email'` branch to `INPUT_TYPES` in
   `apps/frontend/src/lib/components/input/QuestionInput.svelte:40-49` (and
   to the `type` $derived block at lines 63-75 to bridge `customData.format`
   → Input prop).
3. Add `handleError('components.input.error.invalidEmail')` in
   `apps/frontend/src/lib/components/input/Input.svelte` email-validation
   branch (mirrors the URL branch at `:286-296`).
4. Add `invalidEmail` key to all 4 locale files
   `apps/frontend/src/lib/i18n/translations/{en,fi,sv,da}/components.json`
   under the `input.error` block.
5. Extend the e2e fixture at
   `packages/dev-seed/src/templates/e2e.ts`: 1 new info question with
   `custom_data.format='email'` (sort 22 — next available after Phase 76
   sort 21 social-link) + Alpha email answer cell.
6. Add A11Y-01 cell-5 to
   `tests/tests/specs/candidate/candidate-profile-validation.spec.ts`:
   type bad email → assert error UI + input value preserved.

### URL-format (Cell 6)

1. Restore `Question.subtype` field on the relevant `Question*.type.ts` shape
   in `packages/data/src/objects/questions/` (likely `QuestionText.ts`).
   Plumb through `customData` JSONB if direct schema column is undesired.
2. Plumb `subtype` from seed `custom_data` (or a dedicated DB column) through
   to `QuestionInput.svelte:65`.
3. Extend e2e fixture at `packages/dev-seed/src/templates/e2e.ts`: 1 new info
   question with `subtype='link'` (or equivalent dispatch). The existing
   Phase 76 P01 `test-question-social-1` slot (sort 21) MAY be promoted to
   carry `subtype='link'` once the schema lands.
4. Add A11Y-01 cell-6 to spec: type bad URL → assert
   `components.input.error.invalidUrl` + input value preserved.

### Name-too-short / required-empty (Cell 4)

1. **Product decision required:** should empty-required save be REJECTED with
   an inline error? Currently it's a soft warning (badge + submit-button
   gating only). Decision dictates the implementation shape.
2. If REJECT: add save-path validation in
   `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:125-143`
   AND add `Input.svelte` `handleError('components.input.error.required')`
   call on submit-time validation failure.
3. Add `required` (or `tooShort`) key to 4-locale i18n `input.error` blocks.
4. Add A11Y-01 cell-4 to spec: empty input → click submit → assert error UI
   + input still empty (preservation = the user's empty state).

## Effort sizing

- Email-format (cell 5): ~1-2 plans (schema + component + i18n + fixture +
  spec). Lower-end if the `customData.format` enum is added in a single plan
  with email as the only initial value.
- URL-format (cell 6): ~1-2 plans (schema restoration is the variable-cost
  step — could be a column add OR a `customData.format` enum extension OR
  using subtype again). Spec authoring is straightforward once the dispatch
  works.
- Required-empty (cell 4): ~1 plan (product decision + save-path validation
  + i18n + spec). Lighter scope IF the product decision is fast.

Total: 3-5 plans for full A11Y-01 closure.

## Why now (NOT v2.9)

Phase 76 Plan 01 ships the 3 reliably-renderable cells (image-type,
image-size, name-too-long via HTML5 maxlength) which exercise the existing
validation paths in `Input.svelte` end-to-end. The PRODUCT-GAP cells require
schema + component + i18n additions that exceed the v2.9 coverage-phase
scope (per ROADMAP A11Y-03 "wiring + first-run baseline only" framing
inherited at A11Y-01 close). A future feature phase OR a dedicated
"candidate profile tightening" milestone is the appropriate home for the
deferred cells.

## Dependencies

- None architectural; aligns with potential future
  "extend customData schema" workstream + future "candidate profile
  tightening" milestone candidate.
- Phase 76 P01 fixture extension (`test-question-social-1` at sort 21) is
  the ANCHOR for future url-format cell promotion (the slot exists; only
  the dispatch path needs to land).

## Acceptance Criteria

- [ ] `customData.format` enum (or equivalent dispatch) added to
  `packages/app-shared/src/data/customData.type.ts` per the email-format
  scope above.
- [ ] `apps/frontend/src/lib/components/input/Input.svelte` email branch
  emits `components.input.error.invalidEmail`.
- [ ] `invalidEmail` key added to all 4 locale `components.json` files.
- [ ] `Question.subtype` (or equivalent) restored to enable url dispatch
  per the url-format scope above.
- [ ] Product decision recorded for required-empty save behavior; if
  REJECT, save-path validation + `required` i18n key added.
- [ ] e2e fixture extended with 3 new info questions (one per cell) +
  Alpha answer cells.
- [ ] A11Y-01 cells 4, 5, 6 added to
  `tests/tests/specs/candidate/candidate-profile-validation.spec.ts`.
- [ ] Per-plan smoke PASS × 3 in isolation; existing Phase 76 P01 cells
  continue to pass.

## Cross-Links

- Phase 76 CONTEXT D-03 — PRODUCT-GAP rationale per cell.
- Phase 76 RESEARCH LANDMINE-2 — 3-cell-reliable + 3-cell-deferred decision.
- Phase 76 Plan 01 PLAN.md Task 3 — this todo's authoring brief.
- `apps/frontend/src/lib/components/input/Input.svelte:267,269,286-296,602`
  — file:line anchors for the email/url/required validation surfaces.
- `apps/frontend/src/lib/components/input/QuestionInput.svelte:40-49,65,79-85`
  — INPUT_TYPES + subtype dispatch + customData bridge anchors.
- `packages/app-shared/src/data/customData.type.ts:22-83` — current
  CustomData.Question type (no `format` field).
- `apps/frontend/src/lib/i18n/translations/en/components.json` `input.error`
  block — current 4-key i18n surface.
