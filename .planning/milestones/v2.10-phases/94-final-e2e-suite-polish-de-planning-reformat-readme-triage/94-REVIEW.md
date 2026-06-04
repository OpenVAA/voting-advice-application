---
phase: 94-final-e2e-suite-polish-de-planning-reformat-readme-triage
reviewed: 2026-06-03T21:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - tests/tests/setup/shared/setupFromTemplate.ts
  - packages/dev-seed/src/templates/_helpers/buildMinimal.ts
  - tests/seed-test-data.ts
  - tests/playwright.config.ts
findings:
  critical: 0
  warning: 1
  info: 1
  total: 2
status: issues_found
---

# Phase 94: Code Review Report

**Reviewed:** 2026-06-03T21:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the four behavior-bearing files from Phase 94 Plan 01. Three of the four files (`tests/seed-test-data.ts`, `tests/playwright.config.ts`, and the WR-02/D-03 compliance aspect of `setupFromTemplate.ts`) are sound — logic, literals, and dependency wiring are unchanged from pre-phase baseline. The two deleted files (`diff-playwright-reports.ts`, `variant-app-settings.test.ts`) have no surviving imports or script references outside `.planning/`.

The WR-03 guard in `setupFromTemplate.ts` is correctly implemented — the three-branch ternary-with-IIFE-throw pattern is valid TypeScript, correctly maps only `e2e/base` onto `test-e2e-base-`, and throws loudly for any unknown empty-prefix template. `probeFreshDatabasePrecondition` behavior is unchanged (it was already called with `teardownPrefix = 'test-e2e-base-'` for the base dataset before WR-03).

The WR-04 median ordinal formula `choices[Math.floor((choices.length - 1) / 2)].id` is mathematically correct. For Likert-5 (length=5), `Math.floor(4/2) = 2`, giving `LIKERT_5_EN[2].id = '3'` (neutral) — matches the specified invariant. The `'3'` fallback applies only when choices are absent, which cannot occur for `buildMinimal`-generated questions (all ordinal questions unconditionally carry `choices: LIKERT_5_EN`).

One warning and one info item were found.

## Warnings

### WR-01: `defaultAnswerForQuestion` docstring describes a hardcoded literal that no longer exists

**File:** `packages/dev-seed/src/templates/_helpers/buildMinimal.ts:152`
**Issue:** The JSDoc bullet on line 152 reads `opinion (singleChoiceOrdinal / Likert5) → { value: '3' } (neutral)`. After WR-04 the implementation computes `choices[Math.floor((choices.length - 1) / 2)].id` — the literal `'3'` is no longer hardcoded; it is coincidentally produced for Likert-5 because index 2 of `LIKERT_5_EN` has `id: '3'`. The docstring accurately describes the Likert-5 case but is misleading for any future ordinal scale with different ids or lengths: a reader will expect `'3'` and not realise the value is data-driven.

The 94-01-SUMMARY notes "buildMinimal docstring de-planning deferred to Plan 94-07", so this gap was accepted in-phase. However, the inaccuracy is a logic-documentation mismatch: the docstring is now incorrect for the general case and will mislead anyone who adds a non-Likert-5 ordinal question to `buildMinimal`.

**Fix:** Update the bullet to reflect the data-driven behavior:
```
 *   - opinion (`singleChoiceOrdinal`) → `{ value: choices[middle].id }` (median/neutral; Likert-5 resolves to `'3'`)
```
This should be done when Plan 94-07 de-plans the broader docstring, or earlier if a non-Likert-5 ordinal question type is added.

## Info

### IN-01: WR-03 IIFE throw does not prevent silent mismatch when `externalIdPrefix` is `undefined` vs `''`

**File:** `tests/tests/setup/shared/setupFromTemplate.ts:143,151-156`
**Issue:** `prefix` is computed as `template!.externalIdPrefix ?? ''`. If a future template omits `externalIdPrefix` entirely (the field is optional per the Zod schema at `packages/dev-seed/src/template/schema.ts:102`), `prefix` will be `''`. The WR-03 guard then fires: if the template is not named `'e2e/base'`, it throws — which is the correct and intended behavior. This path is sound.

However, the comment on line 141-142 says "Templates that emit pre-prefixed external_ids (e2e + base) declare `externalIdPrefix: ''`" — the phrase "e2e + base" is a vestigial dual-name reference (the old `e2e` bare template was merged into `e2e/base` in Phase 93). This is cosmetically confusing but does not affect runtime behavior, since the only registered template with `externalIdPrefix: ''` in `BUILT_IN_TEMPLATES` is `'e2e/base'`.

**Fix:** Update comment from "e2e + base" to just "e2e/base":
```typescript
  // Writer prefix. Templates that emit pre-prefixed external_ids (e2e/base)
  // declare `externalIdPrefix: ''` so the writer's pass-through is a no-op.
```

---

_Reviewed: 2026-06-03T21:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
