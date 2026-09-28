# Phase 75: Question-Rendering Specs - Pattern Map

**Mapped:** 2026-05-11
**Files analyzed:** 5 (2 NEW specs + 1 MODIFIED dev-seed template + 1 POSSIBLY-EXTENDED util + 1 NEW verification report)
**Analogs found:** 5 / 5 (all exact or near-exact)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts` | test (Playwright e2e spec) | request-response (user-flow walk → DOM assertions) | `tests/tests/specs/voter/voter-detail.spec.ts` (E2E-05 case-a block at `:197-222`) + `tests/tests/specs/voter/voter-journey.spec.ts` `answerRemainingUntilResults` at `:42-89` | exact (role + flow + entity-detail mirror match) |
| `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` | test (Playwright e2e spec) | request-response (user-flow walk → DOM assertions) | SAME as boolean spec — `voter-detail.spec.ts:197-222` + `voter-journey.spec.ts:42-89` | exact |
| `packages/dev-seed/src/templates/e2e.ts` (MODIFY: +1 question + 1 category + 1 Alpha answer cell) | config / fixture template | batch (declarative seed payload consumed at DB-reset time) | Same file, `test-question-directional-1` row at `:518-532` + `test-category-directional` at `:280-287` + Alpha's `test-question-directional-1` answer cell at `:603` | exact (Phase 74 P05 direct precedent) |
| `tests/tests/utils/voterNavigation.ts` (POSSIBLY EXTEND with `walkToQuestion(page, sortOrder)`) | utility (helper for spec navigation) | request-response (page interaction sequence) | Same file, `walkToQuestionsIntro` at `:160-173` | exact (sibling helper, same shape) |
| `.planning/phases/75-question-rendering-specs/75-VERIFICATION.md` | doc (phase verification report) | event-driven (gate result documentation) | `.planning/phases/74-high-leverage-e2e-coverage/74-VERIFICATION.md` (full file, 325 lines) | exact (phase-level VERIFICATION.md convention) |

## Pattern Assignments

---

### `tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts` (test, request-response)

**Analog:** `tests/tests/specs/voter/voter-detail.spec.ts` (E2E-05 host) + `tests/tests/specs/voter/voter-journey.spec.ts` (auto-advance pattern)

**Imports pattern** (mirror `voter-detail.spec.ts:21-24`):

```typescript
import { expect } from '@playwright/test';
import { voterTest as test } from '../../fixtures/voter.fixture';
import { walkToQuestionsIntro } from '../../utils/voterNavigation';
import { testIds } from '../../utils/testIds';
```

NOTE: Phase 75 specs DO NOT use `answeredVoterPage` from `voter.fixture` (Likert `.nth(4)` is out of range for 2-button boolean). Import `voterTest as test` only for the test-describe wrapper + project-tag inheritance. Use a fresh `page` (Playwright default).

**Fixture-free test setup** (deviates from `voter-detail.spec.ts:35-37` `answeredVoterPage: page` pattern — Phase 75 uses fresh page):

```typescript
test.describe('voter question rendering — boolean (QSPEC-01)', { tag: ['@voter'] }, () => {
  test('boolean opinion question renders, voter answers, persists, mirrors on entity-detail', async ({ page }) => {
    // Phase 75 specs do NOT use the answeredVoterPage fixture — its Likert .nth(4)
    // click pattern is out of range for boolean (2 buttons). Manual navigation via
    // walkToQuestionsIntro + nextButton skip × N. Path B locked in Phase 78 CLEAN-05
    // will add a --likert-only seed modifier for the fixture.
    await walkToQuestionsIntro(page);
    await page.getByTestId(testIds.voter.questions.startButton).click();
    // ... skip 17 → answer boolean → navigate → assert mirror
  });
});
```

**Skip-walk pattern** (extracted from RESEARCH §1 + mirrors `voter-matching.spec.ts:151-165` ordinal loop):

```typescript
// Skip 16 ordinals + 1 categorical (sort 17) to land on boolean at sort 18.
const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
for (let i = 0; i < 17; i++) {
  await nextButton.waitFor({ state: 'visible', timeout: 10000 });
  await nextButton.click();
}
```

**Voter-answer auto-advance pattern** (mirror `voter-journey.spec.ts:72-86`, lines 77-84 specifically):

```typescript
// Wait for auto-advance OR fall back to next-button click. Both paths converge
// on /results via waitForURL. Boolean+categorical inherit Likert auto-advance
// because all three share the QuestionChoices component.
const urlBefore = page.url();
await page.getByRole('button', { name: 'Yes' }).click();  // t('common.answer.yes')
try {
  await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3000 });
} catch {
  await nextButton.waitFor({ state: 'visible', timeout: 5000 });
  await nextButton.click();
  await page.waitForURL(/\/results/, { timeout: 10000 });
}
```

**Entity-detail mirror pattern** (mirror `voter-detail.spec.ts:197-222` case (a) "both answered" — the canonical E2E-05 exemplar):

```typescript
// Open Alpha's drawer → opinions tab → locate the boolean input row → assert
// BOTH the voter's checked radio + 'You' label AND Alpha's .entitySelected class.
await page.getByTestId(testIds.voter.results.card).filter({ hasText: 'Candidate Alpha' }).click();
const dialog = page.getByRole('dialog');
await dialog.getByRole('tab', { name: /opinions/i }).click();
const opinionsTab = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);

// Boolean is sort 18 = last opinion-question-input rendered in Alpha's drawer
// (see RESEARCH §"Pitfall 3" for the 18-input total — boolean is .last()).
const booleanInput = opinionsTab.getByTestId('opinion-question-input').last();

// reason: 'entitySelected' is a CSS class set by OpinionQuestionInput; no
// aria/role equivalent — see exemplar at voter-detail.spec.ts:98-106 for the
// canonical inline justification.
// eslint-disable-next-line playwright/no-raw-locators
await expect(booleanInput.locator('.entitySelected')).toHaveCount(1);
await expect(booleanInput.getByRole('radio', { checked: true })).toHaveCount(1);
await expect(booleanInput.getByText(/You/i)).toBeAttached();
```

**Variation notes (boolean vs. case-a exemplar at `voter-detail.spec.ts:197-222`):**
- SAME: 3-line assertion shape (`.entitySelected` count=1, `radio[checked]` count=1, `getByText('You')` attached).
- SAME: scope-by-`opinion-question-input` testId + inline `// reason:` block + `eslint-disable-next-line playwright/no-raw-locators` directive.
- DIFFERENT: input locator is `.last()` (boolean = sort 18 = last input rendered in Alpha's drawer) instead of `.first()` (which is sort 0 = `test-question-1`).
- DIFFERENT: voter answer comes from fresh-page walk + boolean button click, not from `answeredVoterPage` fixture.
- DIFFERENT: `getByText(/You/i)` (regex) because the label may render as `'You'` standalone OR `'You & Test Candidate Alpha'` combined (per `QuestionChoices.svelte:243-253` `display-label` branch when `selectedId == otherSelected` AND both answered).

---

### `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` (test, request-response)

**Analog:** SAME as boolean spec — `voter-detail.spec.ts:197-222` + `voter-journey.spec.ts:42-89`.

**Imports pattern**, **fixture-free setup**, and **auto-advance pattern**: identical to boolean spec above (substitute the test title + `'Option B'` for `'Yes'`).

**Skip-walk pattern** (SHORTER than boolean — categorical is at sort 17):

```typescript
// Skip 16 ordinals to land on the categorical at sort 17.
const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
for (let i = 0; i < 16; i++) {
  await nextButton.waitFor({ state: 'visible', timeout: 10000 });
  await nextButton.click();
}

// Assert the 3 choice buttons render (Option A / Option B / Option C from
// e2e.ts:522-526).
await expect(page.getByRole('button', { name: 'Option A' })).toBeVisible();
await expect(page.getByRole('button', { name: 'Option B' })).toBeVisible();
await expect(page.getByRole('button', { name: 'Option C' })).toBeVisible();
```

**Voter clicks middle anchor** (mirror Phase 74 P05 directional mid-choice convention):

```typescript
const urlBefore = page.url();
await page.getByRole('button', { name: 'Option B' }).click();
try {
  await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3000 });
} catch {
  await nextButton.waitFor({ state: 'visible', timeout: 5000 });
  await nextButton.click();
  await page.waitForURL(/\/results/, { timeout: 10000 });
}
```

**Entity-detail mirror — DIFFERENT BUTTONS shape** (mirror `voter-detail.spec.ts:247-269` case (c) shape — voter and entity selected different choices). Per RESEARCH Pitfall 3 + Pitfall 5: voter answered `'b'`, Alpha answered `'a'` (per `e2e.ts:603`), so the two selections render on DIFFERENT buttons:

```typescript
await page.getByTestId(testIds.voter.results.card).filter({ hasText: 'Candidate Alpha' }).click();
const dialog = page.getByRole('dialog');
await dialog.getByRole('tab', { name: /opinions/i }).click();
const opinionsTab = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);

// QSPEC-02 voter answered ONLY the categorical (sort 17). The boolean (sort 18)
// is also rendered in Alpha's drawer (Alpha answered true). Use filter-by-text
// per RESEARCH Pitfall 3 — .last() would target the boolean, not the directional.
const directionalInput = opinionsTab.getByTestId('opinion-question-input').filter({
  has: page.getByText(/Directional/)
});

// reason: same CSS-class contract as case (a) at voter-detail.spec.ts:98-106.
// eslint-disable-next-line playwright/no-raw-locators
await expect(directionalInput.locator('.entitySelected')).toHaveCount(1);  // Alpha's 'a'
await expect(directionalInput.getByRole('radio', { checked: true })).toHaveCount(1);  // voter's 'b'
await expect(directionalInput.getByText(/You/i)).toBeAttached();
```

**Variation notes (QSPEC-02 vs. boolean spec):**
- SAME: skip-walk pattern, auto-advance pattern, scope-by-testId + `eslint-disable` directive.
- DIFFERENT: skip count = 16 (not 17 — sort 17 IS the target).
- DIFFERENT: input locator uses `.filter({ has: page.getByText(/Directional/) })` (not `.last()`) because the boolean at sort 18 IS the actual last input in Alpha's drawer when voter hasn't answered the boolean.
- DIFFERENT: button labels `'Option A'/'Option B'/'Option C'` are seed-literal (no i18n) — no `t()` call needed; mirror Phase 74 P05's `name: 'Test Opinion Question Directional 1 (E2E-07)'` literal-string convention.

**Dedup-audit comment block** (mirror `voter-matching.spec.ts:167-173` Phase-74-P05 inline reasoning):

```typescript
// dedup: matching distance for booleans/categoricals is covered by
// packages/matching/src/**/*.test.ts + voter-matching.spec.ts:40-43 (ordinal
// filter excludes boolean+categorical). This spec asserts the render-shape
// contract only (input renders, voter clicks, answer persists, entity-detail
// mirrors). Per-category SubMatch breakdown is E2E-07's territory
// (voter-detail.spec.ts directional-metric block at :197-296), explicitly
// out of scope per ROADMAP line 203.
```

---

### `packages/dev-seed/src/templates/e2e.ts` (config, batch — MODIFY)

**Analog:** Same file. Mirrors Phase 74 P05's directional-question addition pattern.

**New category addition** (mirror `test-category-directional` at `:280-287`):

```typescript
// E2E-07/directional-metric-anchor: category housing the categorical
// question that exercises @openvaa/matching's directional SubMatch path.
// Phase 74 Plan 05 Task 1 — added so the per-category SubMatch grid in
// voter-detail.spec.ts asserts BOTH metric paths (Manhattan via the 4
// ordinal categories above + directional via this categorical category).
// @openvaa/matching/src/algorithms/matchingAlgorithm.ts dispatches
// categorical-question SubMatches to the directional path transparently;
// additive — existing CONF-01..CONF-06 invariants stay intact.
{
  external_id: 'test-category-directional',
  name: { en: 'Test Category: Directional (E2E-07)' },
  category_type: 'opinion',
  sort_order: 5,
  is_generated: false
}
```

**Plan 01 authors this NEW category (mirroring shape, NEW sort_order 6):**

```typescript
// QSPEC-01/boolean-opinion-anchor: category housing the boolean opinion
// question that exercises OpinionQuestionInput.svelte's isBooleanQuestion
// branch (v2.6 Phase 61). Phase 75 Plan 01 — additive; mirrors Phase 74
// P05's test-category-directional pattern. Required so the new boolean
// question carries a distinct category (CONTEXT D-02 + Claude's Discretion
// paragraph 4 — REJECTED reusing test-category-info because that's the
// text-only info category).
{
  external_id: 'test-category-boolean',
  name: { en: 'Test Category: Boolean (QSPEC-01)' },
  category_type: 'opinion',
  sort_order: 6,
  is_generated: false
}
```

**New question addition** (mirror `test-question-directional-1` at `:518-532`):

```typescript
// E2E-07/directional-metric-anchor: categorical question — exercises
// @openvaa/matching's directional-metric SubMatch path (vs. Manhattan
// for ordinal questions). singleChoiceCategorical satisfies the
// SingleChoiceQuestion + categorical-dispatch invariants in
// packages/matching/src/algorithms/matchingAlgorithm.ts.
//
// `required: false` and the sort_order 17 placement keep the voter
// fixture (voter.fixture.ts default voterAnswerCount=16) unaffected:
// voter answers the 16 ordinals first, encounters this categorical
// question last, and the fixture's post-loop fallback clicks "Skip"
// (nextButton) to navigate to /results. Phase 74 Plan 05 Task 1.
{
  external_id: 'test-question-directional-1',
  type: 'singleChoiceCategorical',
  name: { en: 'Test Opinion Question Directional 1 (E2E-07)' },
  choices: [
    { id: 'a', label: { en: 'Option A' } },
    { id: 'b', label: { en: 'Option B' } },
    { id: 'c', label: { en: 'Option C' } }
  ],
  category: { external_id: 'test-category-directional' },
  allow_open: false,
  required: false,
  sort_order: 17,
  is_generated: false
}
```

**Plan 01 authors this NEW boolean question (mirroring shape, with `type: 'boolean'` and NO `choices` field per `questions-override.ts:53` "boolean is schema-free"):**

```typescript
// QSPEC-01/boolean-opinion-anchor: boolean question — exercises
// OpinionQuestionInput.svelte:100-111 isBooleanQuestion branch (v2.6 P61
// 2-button radio shape). `booleanChoices` synthesized at :72-75 with
// common.answer.{no,yes} i18n keys (verified parallel in fi/sv/da per
// :69 comment).
//
// `required: false` and the sort_order 18 placement keep the voter
// fixture unaffected: voter answers the 16 ordinals first, encounters
// the categorical (sort 17) AND boolean (sort 18) last; existing
// Skip-Next fallbacks (voter-matching.spec.ts:167-177 +
// voter-journey.spec.ts:56-70) are sort-agnostic and handle sort 18
// transparently. Phase 75 Plan 01 — additive.
//
// No `choices` field per packages/dev-seed/src/templates/defaults/
// questions-override.ts:53 ("boolean: no choices — schema-free").
{
  external_id: 'test-question-boolean-1',
  type: 'boolean',
  name: { en: 'Test Opinion Question Boolean 1 (QSPEC-01)' },
  category: { external_id: 'test-category-boolean' },
  allow_open: false,
  required: false,
  sort_order: 18,
  is_generated: false
}
```

**Alpha's answer cell addition** (mirror `'test-question-directional-1': { value: 'a' }` at `:603`):

```typescript
// E2E-07/directional-metric-anchor: alpha's answer to the categorical
// question (Phase 74 Plan 05 Task 1). Voter doesn't answer the
// categorical (sort_order 17 > voter.fixture default 16), so the
// directional SubMatch row in alpha's voter-detail drawer is the
// entity-answered/voter-missing case — exactly what E2E-07's
// "per-category SubMatch grid renders" asserts.
'test-question-directional-1': { value: 'a' }
```

**Plan 01 authors this NEW Alpha answer cell:**

```typescript
// QSPEC-01/boolean-opinion-anchor: alpha's answer to the boolean
// question (Phase 75 Plan 01). Voter answers the boolean as `true`
// (per QSPEC-01 4-step contract step 2 → click "Yes"), so the
// entity-detail mirror assertion shows BOTH voter's row + Alpha's row
// on the same "Yes" button (case (a) "both answered same value" per
// QuestionChoices.svelte:245-253 display-label branch — combined
// "You & {entity}" label or separate "You" label).
'test-question-boolean-1': { value: true }
```

**§4.1 EXCLUDED comment update** (at `e2e.ts:298`):

```typescript
// BEFORE (existing):
// EXCLUDED (§4.1): test-question-date, test-question-number, test-question-boolean
// — zero grep hits in specs; dropping preserves the 8-ordinal filter result.

// AFTER (Plan 01 edits to remove test-question-boolean from the excluded list):
// EXCLUDED (§4.1): test-question-date, test-question-number
// — zero grep hits in specs; dropping preserves the 8-ordinal filter result.
// test-question-boolean re-introduced as test-question-boolean-1 in Phase 75
// Plan 01 (QSPEC-01 anchor; sort 18, required:false, new test-category-boolean).
```

**Variation notes (boolean addition vs. directional precedent):**
- SAME: location (`questions.fixed[]`), shape, `required: false`, `is_generated: false`, category field structure, Alpha-answer-cell colocation.
- DIFFERENT: no `choices` field on the boolean (schema-free per `questions-override.ts:53`).
- DIFFERENT: sort_order = 18 (one past directional's 17).
- DIFFERENT: category = NEW `test-category-boolean` (mirror directional's NEW `test-category-directional`).
- DIFFERENT: Alpha's value = `true` (boolean literal; directional's value = `'a'` string literal).
- DIFFERENT: §4.1 comment edit — directional addition did NOT touch this comment (categorical wasn't on the EXCLUDED list); boolean addition DOES touch it (boolean WAS on the list and is now re-opened).

---

### `tests/tests/utils/voterNavigation.ts` (utility, request-response — POSSIBLY EXTEND)

**Analog:** Same file. `walkToQuestionsIntro` at `:160-173` is the sibling helper.

**Existing helper pattern** (`tests/tests/utils/voterNavigation.ts:160-173`):

```typescript
/**
 * Walk Home → Intro → /elections → /constituencies and stop on the questions
 * intro page (the page with the category checkboxes + "Answer N Questions"
 * counter). Use this when the test wants to inspect the intro page itself
 * rather than the first question.
 */
export async function walkToQuestionsIntro(page: Page): Promise<void> {
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  await page.getByTestId(testIds.voter.home.startButton).click();

  const introStart = page.getByTestId(testIds.voter.intro.startButton);
  await introStart.waitFor({ state: 'visible' });
  await introStart.click();

  await passThroughElections(page);
  await passThroughConstituencies(page);

  // The questions intro page renders the start CTA + category checkboxes.
  await page.getByTestId(testIds.voter.questions.startButton).waitFor({ state: 'visible', timeout: 10000 });
}
```

**Plan-X (Claude's Discretion) may author this NEW helper** (mirroring shape; extends with skip-walk loop after questions-intro):

```typescript
/**
 * Walk to a specific question by sort order. Composes walkToQuestionsIntro
 * with a click of the questions-start CTA and N skip-clicks to advance
 * past unanswered required:false questions to land on the target.
 *
 * Phase 75 Plan 01/02 — used by voter-question-rendering-{boolean,
 * categorical}.spec.ts to reach sort 17 (categorical) and sort 18
 * (boolean) without using the answeredVoterPage fixture (which clicks
 * Likert by .nth(4), out of range for boolean+categorical).
 *
 * Path B locked in Phase 78 CLEAN-05 will add a --likert-only seed
 * modifier so the answeredVoterPage fixture handles heterogeneous
 * question types directly, deprecating this manual walk.
 */
export async function walkToQuestion(page: Page, sortOrder: number): Promise<void> {
  await walkToQuestionsIntro(page);
  await page.getByTestId(testIds.voter.questions.startButton).click();

  const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
  for (let i = 0; i < sortOrder; i++) {
    await nextButton.waitFor({ state: 'visible', timeout: 10000 });
    await nextButton.click();
  }
}
```

**Variation notes (`walkToQuestion` vs. `walkToQuestionsIntro`):**
- SAME: export signature (single `Page` param plus optional `sortOrder: number`); JSDoc comment shape; sequential await chain.
- SAME: helpers in this file are SCOPE-AGNOSTIC (work across voter-app, voter-journey, voter-questions specs).
- DIFFERENT: extends past `walkToQuestionsIntro`'s stop point — clicks `startButton` AND loops `nextButton.click()` × N to reach `sort_order`.
- DIFFERENT: uses skip-walk via `nextButton` (Skip text on unanswered required:false questions) rather than answer-click via `answerOption`.

**Note:** Planner's call per CONTEXT Claude's Discretion paragraph 1. If only ONE plan uses the skip-walk pattern, inlining is acceptable. If BOTH plans use it (RESEARCH §1 indicates yes — Plan 01 skips 17, Plan 02 skips 16, same loop shape), extract to this util.

---

### `.planning/phases/75-question-rendering-specs/75-VERIFICATION.md` (doc, event-driven — NEW)

**Analog:** `.planning/phases/74-high-leverage-e2e-coverage/74-VERIFICATION.md` (full file, 325 lines).

**YAML frontmatter pattern** (mirror Phase 74 `74-VERIFICATION.md:1-46`):

```yaml
---
phase: 75-question-rendering-specs
verified: 2026-MM-DDTHH:MM:SSZ
status: passed | passed-with-deferral | failed
score: N/N success criteria PASS (X PASS-WITH-DEFERRAL, Y PASS; 0 FAIL)
verifier: gsd-executor (self-authored per Plan 02 Task 5)
overrides_applied: 0
follow_ups:
  - id: QSPEC-02-multi-choice-categorical
    severity: deferred
    file: .planning/todos/pending/2026-MM-DD-qspec-02-multi-choice-categorical-variant.md
    rationale: "PASS-WITH-DEFERRAL per CONTEXT D-03. Single-choice categorical (lower-risk; render path exists) landed; multi-choice categorical (higher-risk; render path doesn't exist — OpinionQuestionInput.svelte:113 renders error.unsupportedQuestion) deferred until MultipleChoiceCategoricalQuestion render branch is added. Recommend revisiting at a future feature-phase milestone."
re_verification:
  verified_at: 2026-MM-DDTHH:MM:SSZ
  verifier: gsd-verifier (goal-backward, independent)
  previous_status: passed
  previous_score: N/N SCs addressed
  verdict: PASS-WITH-DEFERRAL — independently confirmed
  notes: >
    Goal-backward re-verification by gsd-verifier. Both new spec files confirmed
    substantive (not stubs). 3-run SHA-256 identity re-confirmed: <hash>
    across all 3 cold-start runs. Parity gate independently re-run via
    `yarn tsx tests/scripts/diff-playwright-reports.ts` for all 3 pairs: PASS × 3.
    Parity-script constants verified at <P>/<D>/<C> PASS_LOCKED/DATA_RACE/CASCADE.
    DATA_RACE pool preserved at 15 (D-09 binding). Follow-up todo for QSPEC-02
    multi-choice confirmed at .planning/todos/pending/...
  gaps_closed: []
  gaps_remaining: []
  regressions: []
---
```

**Body structure** (mirror Phase 74 `74-VERIFICATION.md:48-325` H1 → H2 sections):

```markdown
# Phase 75 — Verification Record

**Phase:** 75-Question-Rendering Specs
**Verified:** 2026-MM-DD
**HEAD at verification:** `<commit hash>`
**Status:** GREEN-WITH-DEFERRAL — N/N ROADMAP success criteria addressed (1 PASS-WITH-DEFERRAL, X PASS, 0 FAIL); Phase 73 + Phase 74 baselines preserved; 1 follow-up todo filed.

[1-paragraph summary of phase deliverables — 2 specs + 1 dev-seed extension + 0 new variant projects + 3-run determinism gate]

## Requirements Coverage (QSPEC-01, QSPEC-02)

| Requirement | Source Plan(s) | Status | Evidence |
|-------------|----------------|--------|----------|
| **QSPEC-01** — Boolean opinion question | 75-01 | ✓ VERIFIED | `voter-question-rendering-boolean.spec.ts`; e2e template +1 question +1 category +1 Alpha answer; 3-run per-plan smoke PASS × 3. |
| **QSPEC-02** — Single-choice categorical opinion question | 75-02 | ✓ VERIFIED (PASS-WITH-DEFERRAL on multi-choice per D-03) | `voter-question-rendering-categorical.spec.ts` against existing `test-question-directional-1`; 3-run per-plan smoke PASS × 3. Follow-up todo: `.planning/todos/pending/...qspec-02-multi-choice-categorical-variant.md`. |

## Success Criteria Verification (ROADMAP §"Phase 75", 4 SCs)

| SC | Description | Status | Evidence |
|----|-------------|--------|----------|
| #1 | Boolean question end-to-end (QSPEC-01) | **PASS** | ... |
| #2 | Categorical question end-to-end (QSPEC-02) — single-choice + multi-choice | **PASS-WITH-DEFERRAL** | Single-choice covered; multi-choice deferred per CONTEXT D-03. |
| #3 | Deduplicated against existing matching tests | **PASS** | ... |
| #4 | Determinism preserved (3-run identical) | **PASS** | ... |

## 3-Run Determinism Record (SC #4)

[Mirror Phase 74 §"3-Run Determinism Record" — pre-run env prep, 3 SHA-256 hashes, identity verdict]

## SHA-Identity Re-Confirmation (Independent Verifier)

[Mirror Phase 74 §"SHA-Identity Re-Confirmation"]

## Parity Gate Output

[Mirror Phase 74 §"Parity Gate Output" — 3 PARITY GATE PASS pair comparisons + diff-playwright-reports.ts output]

## Constants Regen (CONTEXT D-08)

[Mirror Phase 74 §"Constants Regen" — regen invocation + pool delta table]

## DATA_RACE Pool Rationale (no new entries)

[Mirror Phase 74 §"DATA_RACE Pool Rationale" — confirm 15 → 15 unchanged]

## Plan Closures

| Plan | New files | New tests | 3-run per-plan smoke |
|------|-----------|-----------|----------------------|
| 75-01 (QSPEC-01) | 1 spec + 1 e2e template extension | 1 test | PASS × 3 |
| 75-02 (QSPEC-02 + verification gate) | 1 spec + 1 VERIFICATION.md + 1 deferred-items todo + parity-script regen | 1 test | PASS × 3 |

## Regression Gates

[Mirror Phase 74 §"Regression Gates" — 4 GREEN gates]

## Cross-Links

[Mirror Phase 74 §"Cross-Links" — anchors to ROADMAP, CONTEXT, prior phases]

## Operator Sign-Off

[Mirror Phase 74 §"Operator Sign-Off" — checkpoint:human-verify self-verification per CONTEXT auto-mode]

---

## VERIFICATION COMPLETE

**Verdict: PASS | PASS-WITH-DEFERRAL | FAIL**

[Independent re-verification summary; mirror Phase 74 §"VERIFICATION COMPLETE"]

---

*Phase: 75-Question-Rendering Specs*
*Verification completed: 2026-MM-DD*
*HEAD at verification: <commit hash>*
*Re-verification completed: 2026-MM-DD*
*Re-verifier: gsd-verifier (goal-backward, independent)*
```

**Variation notes (Phase 75 verification vs. Phase 74 precedent):**
- SAME: YAML frontmatter shape, H1/H2 section structure, "VERIFICATION COMPLETE" trailer.
- SAME: 3-run SHA-256 identity table, Parity Gate Output section, Constants Regen pool-delta table, Regression Gates table.
- SAME: PASS-WITH-DEFERRAL verdict convention when one SC has a structural deferral (Phase 74 had E2E-01 single-locale; Phase 75 has QSPEC-02 multi-choice).
- DIFFERENT: # requirements = 2 (vs. Phase 74's 8 E2E-0X requirements).
- DIFFERENT: # SCs = 4 per ROADMAP lines 197-207 (vs. Phase 74's 9).
- DIFFERENT: # plans = 2 (vs. Phase 74's 7) — Plan Closures table is correspondingly shorter.
- DIFFERENT: NO new variant Playwright projects (per CONTEXT D-02). Constants Regen reason = "+2 new PASS_LOCKED test entries" (boolean + categorical), NOT "+N new variant projects."
- DIFFERENT: No Order B record (CONTEXT D-09 inherits but doesn't introduce a new Order-B item; the Phase 78 CLEAN-04 wrapper-tightening re-validation note from Phase 74 carries forward but no NEW order decision).

---

## Shared Patterns

### Inline `// reason:` annotation for CSS-class-based locators

**Source:** `tests/tests/specs/voter/voter-detail.spec.ts:98-106` (canonical exemplar)
**Apply to:** Both new spec files — wherever `.entitySelected` or other CSS-class locators are used.

```typescript
// reason: 'entitySelected' is a CSS class set by the OpinionQuestionInput
// component to mark the candidate's answer position; it has no ARIA role
// (the role lives on the underlying <input type="radio">), no associated
// text, and no testId. The class is the contract — getByRole/getByText/etc.
// would match either too few elements (no class info) or too many (all
// radios). Inline-justified per RESEARCH §"Pitfall" + §"Anti-Patterns".
const firstQuestionInput = opinionsTab.getByTestId('opinion-question-input').first();
// eslint-disable-next-line playwright/no-raw-locators
await expect(firstQuestionInput.locator('.entitySelected')).toHaveCount(1);
```

### Scope-by-testId for ambiguous role-locator surfaces

**Source:** RESEARCH §7 + CONTEXT D-06 (canonical convention).
**Apply to:** Both new spec files when role/aria locators alone surface ambiguity (voter answer surface and entity-detail row may both render the same button text).

```typescript
// reason: scope to the opinion-question-input container avoids ambiguity
// when both the voter's answer surface and entity-detail rows render the
// same "Yes"/"No" or choice button labels. Container-scoped role locators
// are preferred over global page-level role locators here.
const input = page.getByTestId('opinion-question-input');
await input.getByRole('button', { name: t('common.answer.yes') }).click();
```

### Auto-advance + nextButton fallback (urlBefore/waitForURL pattern)

**Source:** `tests/tests/specs/voter/voter-journey.spec.ts:72-86` (battle-tested across 3 cold runs).
**Apply to:** Both new spec files for the voter-answers step.

```typescript
const urlBefore = page.url();
await page.getByRole('button', { name: <label> }).click();
try {
  await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3000 });
} catch {
  await nextButton.waitFor({ state: 'visible', timeout: 5000 });
  await nextButton.click();
  await page.waitForURL(/\/results/, { timeout: 10000 });
}
```

### Entity-detail mirror (open drawer → opinions tab → scope → assertions)

**Source:** `tests/tests/specs/voter/voter-detail.spec.ts:197-222` (case-a exemplar) + `:247-269` (case-c — different-button shape for QSPEC-02).
**Apply to:** Both new spec files step 4 of the 4-step contract.

```typescript
await page.getByTestId(testIds.voter.results.card).filter({ hasText: 'Candidate Alpha' }).click();
const dialog = page.getByRole('dialog');
await dialog.getByRole('tab', { name: /opinions/i }).click();
const opinionsTab = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);
const targetInput = opinionsTab.getByTestId('opinion-question-input')<.last() | .filter(...)>;
// 3-line assertion: .entitySelected count, radio[checked] count, 'You' attached
```

### Dedup-audit comment block

**Source:** RESEARCH §5 + CONTEXT D-04 (canonical inline-justification convention).
**Apply to:** Both new spec files at the top of the describe block OR per-assertion where overlap is semantically near a matching-algorithm test.

```typescript
// dedup: matching distance for booleans/categoricals is covered by
// packages/matching/src/**/*.test.ts + voter-matching.spec.ts:40-43
// (ordinal filter excludes boolean+categorical). This spec asserts the
// render-shape contract only (input renders, voter clicks, answer persists,
// entity-detail mirrors). Per-category SubMatch breakdown is E2E-07's
// territory, explicitly out of scope per ROADMAP line 203.
```

### Phase-74-P05 directional-question seed-extension pattern

**Source:** `packages/dev-seed/src/templates/e2e.ts:280-287` (category) + `:518-532` (question) + `:597-603` (Alpha answer cell).
**Apply to:** Plan 01's `e2e.ts` modifications.

Mirror SHAPE-for-SHAPE: new category with `category_type: 'opinion'` + next sort_order; new question with `required: false` + next sort_order; new Alpha-answer-cell with matching `external_id` key. Boolean diff = no `choices` field + `type: 'boolean'` + `value: true`.

## No Analog Found

None. All 5 Phase 75 files have direct analogs in the codebase at HEAD `6410e2b12`.

## Metadata

**Analog search scope:** `tests/tests/specs/voter/*.ts`, `tests/tests/utils/*.ts`, `tests/tests/fixtures/*.ts`, `packages/dev-seed/src/templates/*.ts`, `.planning/phases/74-high-leverage-e2e-coverage/74-VERIFICATION.md`.
**Files scanned:** 7 (voter-detail.spec.ts, voter-journey.spec.ts, voter-matching.spec.ts, voter-questions.spec.ts, voterNavigation.ts, e2e.ts, 74-VERIFICATION.md).
**Pattern extraction date:** 2026-05-11
**HEAD:** `6410e2b12` (Phase 74 closed; Phase 75 CONTEXT + RESEARCH committed)
