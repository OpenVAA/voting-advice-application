# Phase 82: A11Y-01 PRODUCT-GAP Cell — Required-Empty - Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 4 (3 modified, 1 verified read-only)
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:92` | route/component (SvelteKit page) | reactive-derive (Svelte 5 `$derived`) | self — extends existing `canSubmit` `$derived` block one line above `allRequiredFilled` at `:94` | exact (in-place extension) |
| `packages/dev-seed/src/templates/e2e.ts` (questions block + Alpha answers) | fixture/seed | request-response (DB seed write) | `tests/tests/setup/templates/variant-hidden-required.ts:142-179` for `custom_data.required` shape; `e2e.ts:797` `test-question-displayname` row for the multilingual LocalizedString answer shape | exact (canonical SETTINGS-03 dispatch + canonical multilingual text-input row) |
| `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` (new test + docstring) | test (Playwright spec) | request-response (page interaction + DOM assertions) | `tests/tests/specs/candidate/candidate-profile-validation.spec.ts:282-315` (Phase 81 D-11 format-rejection for-loop body) | exact (same spec, same describe scope, same `loginAsCandidate` + `goto` + heading-settle + `getByLabel/.first()` + `fill('').blur()` pattern) |
| `tests/tests/utils/testIds.ts:20` | config (testId registry) | static lookup | self — `candidate.profile.submit = 'profile-submit'` already present; verified at scout | no change needed |

## Pattern Assignments

### `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:92` (route/component, reactive-derive)

**Analog:** self — Phase 82 extends the existing `$derived` block in place. No new patterns introduced.

**Existing surrounding context** (lines 88-96):
```svelte
  ////////////////////////////////////////////////////////////////////
  // Handle saving answers and define submit label and notes
  ////////////////////////////////////////////////////////////////////

  let canSubmit = $derived(status !== 'loading');

  let allRequiredFilled = $derived(
    !candCtx.requiredInfoQuestions.some((q) => isEmptyValue(userData.current?.candidate.answers?.[q.id]?.value))
  );
```

**Phase 82 change (D-01 verbatim) — extend `:92` ONLY:**
```svelte
  // BEFORE
  let canSubmit = $derived(status !== 'loading');

  // AFTER (Phase 82 — submit gated by required-field completeness; A11Y-07 TIGHTEN-SOFT)
  let canSubmit = $derived(status !== 'loading' && allRequiredFilled);
```

**Reactivity safety (RESEARCH Pitfall 4):** `canSubmit` at `:92` references `allRequiredFilled` declared at `:94`. Svelte 5 `$derived(...)` is LAZY — captures the expression as a thunk and only evaluates on read. Template reads `canSubmit` at `:304` (`disabled={!canSubmit}`) AFTER all `let` declarations in the `<script>` block initialize. NO reorder; NO ReferenceError; NO `state_referenced_locally` warning.

**Defense-in-depth preserved (RESEARCH Pitfall 5):** `handleSubmit` guard at `:126-130` (`if (!canSubmit) { status = 'error'; ... return; }`) catches programmatic clicks on the disabled button. Keep unchanged.

**NO downstream effect on:**
- `:94` `allRequiredFilled` block (already correctly derived).
- `:98-109` `submitRouting` block (does NOT depend on `canSubmit`; depends on `allRequiredFilled` directly — same expression, same evaluation order).
- `:304-310` `<Button disabled={!canSubmit} data-testid="profile-submit">` (already wired).

---

### `packages/dev-seed/src/templates/e2e.ts` (fixture/seed, request-response)

**Analog:** `tests/tests/setup/templates/variant-hidden-required.ts:142-179` for the `custom_data.required` dispatch shape; `e2e.ts:592-601` (`test-question-displayname`) + `e2e.ts:797` (Alpha's displayname answer) for the multilingual LocalizedString answer shape.

**LANDMINE-1 correction source — canonical `custom_data.required` dispatch** (`variant-hidden-required.ts:142-159`):
```typescript
questions: {
  count: 0,
  fixed: baseFixed('questions').map((row) => {
    if (row.external_id === 'test-voter-q-8') {
      return {
        ...row,
        custom_data: { ...((row.custom_data ?? {}) as object), hidden: true }
      };
    }
    if (row.external_id === 'test-question-displayname') {
      return {
        ...row,
        custom_data: { ...((row.custom_data ?? {}) as object), required: true }
      };
    }
    return row;
  })
},
```

The key observation: SETTINGS-03's working spec (`candidate-required-info.spec.ts`) authors `required: true` INSIDE `custom_data`, NOT at the top level. This is the canonical dispatch shape because `candCtx.requiredInfoQuestions` at `candidateContext.svelte.ts:350` reads `getCustomData(q).required` (= `q.customData.required`); the DB top-level `required` column is unused in the filter chain.

**LANDMINE-2 correction source — multilingual LocalizedString answer shape** (`e2e.ts:797`):
```typescript
'test-question-displayname': { value: { en: 'Display Name Sentinel 76' } },
```

The displayname question is `type: 'text'` with NO `subtype` (lines 592-601) → QuestionInput dispatches to `text-multilingual`. Its answer is a `LocalizedString { en: ... }`, NOT a plain string. Phase 82's new row has the same dispatch shape (text, no subtype) and MUST mirror this LocalizedString answer pattern.

**Phase 82 fixture changes — TWO additions:**

**1. NEW sort-24 question row** (insert at `e2e.ts:701` immediately after the sort-23 `test-question-email-1` row at lines 691-701):
```typescript
// Phase 82 A11Y-07 anchor — required-empty save-gate dispatch via custom_data.required=true.
// profile/+page.svelte:94 derives allRequiredFilled from candCtx.requiredInfoQuestions
// (apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:347-352, which reads
// getCustomData(q).required = q.customData.required) + isEmptyValue(
// userData.current?.candidate.answers?.[q.id]?.value). Phase 82 wires allRequiredFilled into
// canSubmit at :92 so the submit button becomes truly disabled when this row's answer is empty.
//
// CUSTOM_DATA INVARIANT (Phase 82 RESEARCH LANDMINE-1): `required` MUST be inside
// custom_data — the frontend filter at candidateContext.svelte.ts:350 reads
// `customData.required`, NOT the top-level `required` DB column. The variant-hidden-required
// template at tests/tests/setup/templates/variant-hidden-required.ts:151-156 is the canonical
// dispatch pattern.
//
// ALPHA-COMPLETENESS INVARIANT (Phase 76 P02 + Phase 81 + downstream specs assuming
// profileComplete): Alpha MUST seed an answer for this row so Alpha stays profileComplete by
// default. Otherwise candidate-app + candidate-app-mutation specs that don't explicitly clear
// answers would race against the "Required" notice + the newly-disabled submit button.
//
// VALUE-DISJOINTNESS INVARIANT (Phase 76 P01 fixture-extension fix + Phase 81 D-08 inheritance):
// Alpha's answer value MUST NOT contain the substring 'Alpha' / 'alpha' (case-insensitive).
// 'sentinel-82-required' below is disjoint.
//
// sort_order: 24 — placed AFTER Phase 81's test-question-email-1 (sort 23). Voter fixture
// only iterates opinion questions; this info question is never encountered regardless of
// sort_order. Phase 81 D-08 additive numbering convention preserved.
//
// No subtype: plain text input (dispatches to 'text-multilingual' per QuestionInput.svelte:72-77).
// No custom_data.maxlength: required-empty cell asserts on the gate, not on character-cap
// (Phase 76 P01 cell 3 already covers maxlength).
{
  external_id: 'test-question-required-empty-1',
  type: 'text',
  name: { en: 'Required-empty (Phase 82 A11Y-07 anchor)' },
  category: { external_id: 'test-category-info' },
  custom_data: { required: true },
  allow_open: false,
  sort_order: 24,
  is_generated: false
}
```

**2. NEW Alpha answer cell** (insert at `e2e.ts:810` immediately after the `test-question-email-1` Alpha-answer entry at line 809, BEFORE the closing `}` at line 810):
```typescript
// reason: LocalizedString shape matches the new question's text-multilingual dispatch
// (QuestionInput.svelte:72-77 — type='text' + no subtype). Plain-string answers no-op the
// write-back through Input.svelte:248-250's `(value as LocalizedString)[locale] = ...` line
// per Phase 82 RESEARCH LANDMINE-2. Mirrors test-question-displayname's LocalizedString
// answer at line 797. 'sentinel-82-required' is disjoint from 'alpha' substring per the
// value-disjointness invariant.
'test-question-required-empty-1': { value: { en: 'sentinel-82-required' } }
```

**Comma placement:** the sort-23 row at `e2e.ts:701` has NO trailing comma (closes the `fixed[]` array). Phase 82 adds a trailing comma after `}` on the existing sort-23 row's closing brace AND inserts the new row before `]`. Similarly the Alpha answer block at `:809` ends with `'test-question-email-1': { value: 'sentinel-81@example.com' }` with NO trailing comma — Phase 82 adds the trailing comma + inserts the new entry before `}` at `:810`.

---

### `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` (test, request-response)

**Analog:** Phase 81 D-11 format-rejection for-loop body at lines 282-315 (same spec, same describe scope).

**Imports pattern** (already in place at lines 51-58):
```typescript
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD } from '../../utils/testCredentials';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';
```
**NO new imports.** Phase 82 reuses `expect`, `test`, `buildRoute`, `testIds`, `loginAsCandidate` (module helper at lines 73-80).

**Module-level helper (reused)** at `:73-80`:
```typescript
async function loginAsCandidate(page: Page): Promise<void> {
  await page.goto(buildRoute({ route: 'CandAppHome', locale: 'en' }));
  await page.getByTestId(testIds.candidate.login.email).fill(TEST_CANDIDATE_EMAIL);
  await page.getByTestId(testIds.candidate.login.password).fill(TEST_CANDIDATE_PASSWORD);
  await page.getByTestId(testIds.candidate.login.submit).click();
  await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
}
```

**Phase 81 D-11 format-cell pattern (canonical analog body at lines 283-314):**
```typescript
test(`A11Y-01 ${cell.name}`, async ({ page }) => {
  await loginAsCandidate(page);
  await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));

  await expect(page.getByRole('heading', { name: /your profile/i })).toBeVisible({
    timeout: 10000
  });

  const input = page.getByLabel(cell.fieldLabel).first();
  await expect(input).toBeVisible({ timeout: 5000 });

  // BLUR INVARIANT: Input.svelte binds `onchange` (NOT `oninput`) on the
  // <input> at line 614-621. Playwright's `fill()` fires DOM `input`
  // events on each keystroke but `change` only fires on blur. The
  // existing maxlength cell at lines 239-273 doesn't assert error UI so
  // doesn't expose this; the format cells DO assert error UI, so we
  // must blur explicitly after fill to drive the change handler.
  await input.fill(cell.badValue);
  await input.blur();

  // (a) i18n error surfaces.
  await expect(page.getByText(cell.expectedErrorText)).toBeVisible({ timeout: 5000 });

  // (b) Value preservation contract — the typed bad value remains
  // in the input element (handleChange did not overwrite it).
  await expect(input).toHaveValue(cell.badValue);
});
```

**Phase 82 cell 4 — NEW standalone `test(...)` block** (insert AFTER the format for-loop closing `}` at line 315, BEFORE the describe-block closing `});` at line 316):
```typescript
// Phase 82 A11Y-07 cell — required-empty disables submit button via canSubmit gate.
// Lives OUTSIDE the existing TEXT_CELLS / IMAGE_CELLS for-loops (D-06): cell 4's
// contract (button-disable assertion on the profile-submit testId) is structurally
// different from format ('error text + input value preservation') and maxlength
// ('input value truncates to cap').
//
// CELL 4 CONTRACT (Phase 82 A11Y-07 TIGHTEN-SOFT): assert the submit button transitions from
// enabled → disabled when a required info question's answer is cleared. The reactive chain is:
// Input.svelte handleChange (multilingual branch) → userData.setAnswer → candCtx
// .requiredInfoQuestions filter → allRequiredFilled $derived re-evaluation → canSubmit
// $derived re-evaluation → <Button disabled={!canSubmit}> re-render.
//
// BLUR INVARIANT (Phase 81 D-11 inheritance): Input.svelte binds `onchange` (NOT `oninput`);
// Playwright's fill('') fires `input` events but `change` only fires on blur. The
// allRequiredFilled re-derivation depends on the change event firing — fill('') + .blur() is
// mandatory.
test('A11Y-01 A11Y-07 required-empty disables submit button via canSubmit gate', async ({ page }) => {
  await loginAsCandidate(page);
  await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));

  await expect(page.getByRole('heading', { name: /your profile/i })).toBeVisible({
    timeout: 10000
  });

  // (a) Sanity gate — Alpha is profileComplete by default; submit button is enabled.
  // The submit button at +page.svelte:308 renders as a native <button type="submit">
  // (href is unset → Button.svelte:178-186 selects `button` element); Playwright's
  // toBeDisabled() matcher works on native form elements.
  const submit = page.getByTestId(testIds.candidate.profile.submit);
  await expect(submit).toBeEnabled({ timeout: 5000 });

  // The new required info question renders as 'text-multilingual' (QuestionInput.svelte:72-77
  // — no subtype, profile route does not set disableMultilingual). Multiple <input>s share
  // the same accessible name via aria-labelledby="{id}-label {id}-label-{locale}". .first()
  // disambiguates to the EN input (Input.svelte:395 iterates [currentLocale, ...others]).
  const input = page.getByLabel(/Required-empty \(Phase 82 A11Y-07 anchor\)/i).first();
  await expect(input).toBeVisible({ timeout: 5000 });
  await input.fill('');
  await input.blur();

  // (b) Submit button is now disabled — TIGHTEN-SOFT gate engaged.
  await expect(submit).toBeDisabled({ timeout: 5000 });

  // (c) Value-preservation: the user's empty state is preserved on screen (the spec did not
  // see the field revert to Alpha's seeded value).
  await expect(input).toHaveValue('');
});
```

**Phase 82 docstring update (D-09)** — rewrite the paragraph at `candidate-profile-validation.spec.ts:32-35`:

**BEFORE (lines 32-35):**
```
 * Remaining PRODUCT-GAP cells (name-too-short / required-empty) stay deferred
 * via `.planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md`; the
 * required-empty cell is scheduled for Phase 82 / A11Y-07 with an embedded
 * product decision (REJECT-with-inline-error vs SOFT-WARN-ONLY).
```

**AFTER (Phase 82):**
```
 * Phase 82 lift: A11Y-07 (required-empty save gate) is NOW resolved by the
 * standalone `A11Y-01 A11Y-07 required-empty ...` test below — TIGHTEN-SOFT
 * decision: `allRequiredFilled` is wired into `canSubmit` at
 * `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:92`
 * so the submit button is truly disabled when any required info question is
 * empty. Cell 4 fixture row `test-question-required-empty-1` (sort 24) lives
 * in `packages/dev-seed/src/templates/e2e.ts` with `custom_data.required: true`.
 *
 * Remaining PRODUCT-GAP cell (name-too-short) stays deferred for a future
 * milestone with no current phase mapping.
```

---

## Shared Patterns

### BLUR INVARIANT (Phase 81 D-11 inheritance)
**Source:** `tests/tests/specs/candidate/candidate-profile-validation.spec.ts:299-306`
**Apply to:** Phase 82 cell 4 fill-then-assert chain.
```typescript
// Input.svelte binds `onchange` (NOT `oninput`) — fill() fires `input` events
// per keystroke but `change` only fires on blur. The reactive chain
// (handleChange → userData.setAnswer → candCtx.requiredInfoQuestions →
// allRequiredFilled → canSubmit → disabled prop) ONLY engages after change fires.
await input.fill('');
await input.blur();
await expect(submit).toBeDisabled({ timeout: 5000 });
```

### Additive sort-numbering (Phase 81 D-08 inheritance)
**Source:** `packages/dev-seed/src/templates/e2e.ts:688-690` (Phase 81 comment block)
**Apply to:** Phase 82 new sort-24 row.
- sort 19: `test-question-displayname` (Phase 76 P01)
- sort 20: `test-question-bio` (Phase 76 P01)
- sort 21: `test-question-social-1` (Phase 76 P01 / Phase 81 subtype:'link' lift)
- sort 22: `test-question-number-1` (Phase 77 SETTINGS-01)
- sort 23: `test-question-email-1` (Phase 81 A11Y-05)
- **sort 24: `test-question-required-empty-1` (Phase 82 A11Y-07) — NEW**

No earlier anchors perturbed. Voter fixture's `voterAnswerCount=16` iterates OPINION questions only — INFO questions (category `test-category-info`) are skipped regardless of sort_order. Voter app unaffected.

### Scope-marked test-title pattern (Phase 76 D-04 / Phase 75 D-04 / Phase 81 D-11 inheritance)
**Source:** Phase 81 cells 5+6 test titles at `candidate-profile-validation.spec.ts:132,139` (`A11Y-05 ...`, `A11Y-06 ...`)
**Apply to:** Phase 82 cell 4 test title.
- Prefix: `A11Y-01 ` (matches existing 5 cells in the describe block — keeps `-g "A11Y-01"` regression invocation green).
- Infix: `A11Y-07 ` (marks the closed requirement ID — scoped lookup via `-g "A11Y-07"`).
- Resulting title: `A11Y-01 A11Y-07 required-empty disables submit button via canSubmit gate`.

### IMGPROXY_TIED_TITLES safety (Phase 80 D-13 / Phase 81 D-12 / D-16 inheritance)
**Source:** `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/regen-constants.mjs:64-78`
**Apply to:** Phase 82 cell 4 test title.

The 14 bound patterns are entity-image-upload-related (e.g., "uploads avatar/portrait", "saves entity image", etc.). Phase 82's title `A11Y-01 A11Y-07 required-empty disables submit button via canSubmit gate` does NOT end with any bound pattern. Verified at CONTEXT D-08 + RESEARCH D-08. No constants regen for IMGPROXY_TIED_TITLES.

### Determinism contract (Phase 80 D-09 / D-11 / D-12 / Phase 81 D-13 / D-15 inheritance)
**Source:** Phase 79 verification anchor at `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-VERIFICATION.md`
**Apply to:** Phase 82 Plan 01 close.
1. Vite-cache wipe BEFORE 3-run gate: `yarn db:reset && yarn db:seed --template e2e && yarn dev:clean`.
   - NOT `yarn db:reset-with-data --likert-only` (per CLAUDE.md Yarn arg-forwarding caveat — `--likert-only` is not forwarded through the `&&`-chain).
   - NOT Likert-only here: Phase 82's cell 4 does not iterate opinion questions.
2. 3-run cold-start `--workers=1` verification: each run must produce identical SHA on `tests/scripts/diff-playwright-reports.ts` against expected v2.10 anchor (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE).
3. Expected delta: +1 PASS_LOCKED entry (Phase 82 cell 4). Fold additive constants regen into Plan 01 close.
4. Self-identity smoke: `npx tsx tests/scripts/diff-playwright-reports.ts | diff <expected-template> -` at HEAD-pre-changes; re-run post-fix.

### Locator + lint convention (Phase 81 D-19 / Phase 80 D-14 / Phase 76 D-11a / Phase 73 IN-03 inheritance)
**Source:** `tests/eslint.config.mjs` + `tests/tests/specs/candidate/candidate-profile-validation.spec.ts:282-314` (Phase 81 cells)
**Apply to:** Phase 82 cell 4.
- Role/aria locators by default: `page.getByRole('heading', { name: /your profile/i })`, `page.getByLabel(/Required-empty .../i).first()`.
- testIds for stable form-action anchors: `page.getByTestId(testIds.candidate.profile.submit)`.
- `playwright/no-raw-locators` at `'error'`: NO `page.locator('[data-testid=...]')` or `page.locator('input[type=...]')` allowed.
- `playwright/no-conditional-in-test` at `'error'`: NO `if (...)` branches inside the `test()` body — `loginAsCandidate` is module-level (per Phase 76 P01 Pattern 4 canonical 3).
- The modified spec MUST pass `yarn lint:check`.

## No Analog Found

None — all 4 files have exact in-repo precedents:
- The `canSubmit` `$derived` is extended in place (no new pattern).
- The fixture row + Alpha answer have CANONICAL precedents in `variant-hidden-required.ts:142-179` (`custom_data.required` shape) + `e2e.ts:592-601,797` (multilingual displayname row + LocalizedString answer).
- The spec cell extends a same-file Phase 81 pattern.
- The testId registry already exposes `candidate.profile.submit = 'profile-submit'`.

## Metadata

**Analog search scope:**
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte`
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts`
- `apps/frontend/src/lib/components/input/{Input.svelte,QuestionInput.svelte,Button.svelte}`
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`
- `packages/app-shared/src/data/{customData.type.ts,getCustomData.ts}`
- `packages/data/src/utils/answer.ts`
- `packages/dev-seed/src/templates/e2e.ts`
- `packages/dev-seed/src/generators/QuestionsGenerator.ts`
- `tests/tests/setup/templates/variant-hidden-required.ts`
- `tests/tests/specs/candidate/candidate-profile-validation.spec.ts`
- `tests/tests/specs/candidate/candidate-required-info.spec.ts`
- `tests/tests/utils/testIds.ts`

**Files scanned:** 15 (primary analog sources)

**Pattern extraction date:** 2026-05-13
