# Phase 75: Question-Rendering Specs - Research

**Researched:** 2026-05-11
**Domain:** Playwright user-flow spec authoring against the v2.6 P61 boolean branch + long-shipped categorical (singleChoiceCategorical) input surfaces on top of the post-Phase-74 deterministic baseline (4 PASS_LOCKED grows by Phase 74 specs + 15 DATA_RACE + 65 CASCADE after Phase 74's +10 categorical regen — per STATE.md line 135).
**Confidence:** HIGH for the boolean + categorical render contracts, voter-navigation walk pattern, dev-seed extension shape, dedup audit, and determinism/parity-regen contract; MEDIUM for the auto-advance behaviour of QuestionChoices on boolean (mechanism identical to ordinal but spec must verify on first cold run); MEDIUM-LOW for the entity-detail row locator on the boolean question (Phase 74 P05 used `getByRole('meter', ...)` for SubMatch — a DIFFERENT contract; for opinion-row rendering the canonical locator is the `getByTestId('opinion-question-input')` scope + `.entitySelected` class on `<input type="radio">`, verified at `voter-detail.spec.ts:104-113` + `:213-244` precedent).
**HEAD at research time:** `6410e2b12` (Phase 74 closed 2026-05-11 GREEN-WITH-DEFERRAL; Phase 75 CONTEXT committed)

## Summary

Phase 75 lands two focused user-story Playwright specs that walk a voter end-to-end through a Boolean opinion question (QSPEC-01) and a single-choice categorical opinion question (QSPEC-02). The work is **spec authoring + 1 dev-seed extension** (a new boolean question + new category at sort 18, mirroring Phase 74 P05's directional pattern at sort 17) — NOT new product behavior, NOT framework migration, NOT new variant project. Multi-choice categorical is DEFERRED per CONTEXT D-03 because `OpinionQuestionInput.svelte:113` renders `error.unsupportedQuestion` for `MultipleChoiceCategoricalQuestion` — adding multi-choice render is a feature phase, not a coverage phase.

The phase fits in **2 plans + verification folded into Plan 02** per CONTEXT D-01:
- **Plan 01** — QSPEC-01 (Boolean spec) + e2e template extension (boolean question at sort 18 + `test-category-boolean` + Alpha's `{ value: true }` answer cell + `yarn build @openvaa/dev-seed`).
- **Plan 02** — QSPEC-02 (single-choice categorical spec against existing `test-question-directional-1`) + verification gate (vite-cache wipe + 3-run cold-start `--workers=1` + parity-script regen + 3 PARITY GATE PASS + `75-VERIFICATION.md`).

**Primary recommendation:** Treat CONTEXT.md D-01..D-10 as the binding plan blueprint. Both specs assert the same 4-step contract (input renders / voter answers / persists across navigation / entity-detail mirror) using role/aria locators by default, `getByTestId('opinion-question-input')` only as a scope wrapper with inline `// reason:` per D-06. Each spec walks the voter to its target question via `walkToQuestionsIntro(page)` + manual skip through 16 ordinals via `nextButton` clicks (Likert auto-advance does NOT apply because boolean/categorical button labels don't share Likert's `.nth(4)` testId-index pattern). Plan 02 runs the verification gate inline per Phase 73 P01 precedent (single plan delivers feature + verification when phase scope is small). Mandatory pre-gate: `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` per CONTEXT D-09.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| QSPEC-01 Boolean input render | Browser (Playwright role/aria locator) | Frontend Server (`OpinionQuestionInput.svelte:100-111` boolean branch → `QuestionChoices` with synthesized `booleanChoices`) | Pure render-shape contract; spec asserts DOM via `getByRole('button', { name: 'Yes'/'No' })` |
| QSPEC-01 voter answers boolean | Browser (radio-group `click` → `onChange({ value: true })` adapter) | — | `OpinionQuestionInput.svelte:110` maps `'yes'` → `true` before bubbling to parent |
| QSPEC-02 categorical input render | Browser (Playwright role/aria locator) | Frontend Server (`OpinionQuestionInput.svelte:89-99` single-choice branch dispatching to `QuestionChoices`) | Existing `test-question-directional-1` from Phase 74 P05; 3 choices labeled `Option A/B/C` |
| Boolean question seed extension | dev-seed template extension (1 row + 1 category + 1 Alpha answer cell) | Backend (Supabase `questions` + `question_categories` tables via writer pipeline) | Re-runs `yarn build @openvaa/dev-seed`; no new variant project per D-02 |
| Voter→question-sort-N walk | Browser (sequence: home → intro → elections → constituencies → questions intro → skip × 16) | Frontend Server (`/questions/...` route + `voterCtx.unansweredOpinionQuestions`) | Inherits `walkToQuestionsIntro` + per-question `nextButton` skip; Phase 74 P05's Skip-Next + out-of-range fallback DOES handle sort 18 transparently |
| Entity-detail mirror assertion | Browser (DOM-level: `opinions tab` → `opinion-question-input` scope → `.entitySelected` + `radio[checked]` + 'You' text) | — | Reuses `voter-detail.spec.ts:104-113` exemplar; same locator strategy applies to both boolean and categorical question rows |
| Determinism + parity regen | Verification tooling (`tests/scripts/diff-playwright-reports.ts` + `regen-constants.mjs`) | — | New specs MUST land in PASS_LOCKED; parity-script constants regen when new tests appear |

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01** — 2 plans. Plan 01 = QSPEC-01 boolean spec + e2e template boolean addition. Plan 02 = QSPEC-02 single-choice categorical spec + verification gate (inline, mirrors Phase 73 P01 pattern). Risk: if Plan 02 ceiling exceeded, split into 02a (categorical spec) + 02b (verification gate) — default is 1 bundled plan.
- **D-02** — Add boolean question to `packages/dev-seed/src/templates/e2e.ts` `questions.fixed[]` at sort 18 (mirrors Phase 74 P05 directional at sort 17). `type: 'boolean'`, `required: false`, NEW category `test-category-boolean` (analogous to Phase 74 P05's `test-category-directional`). Alpha gets `{ value: true }`. NO new variant template (base e2e template extension).
- **D-03** — PASS-WITH-DEFERRAL on multi-choice categorical. `MultipleChoiceCategoricalQuestion` falls through to `error.unsupportedQuestion` at `OpinionQuestionInput.svelte:113` — deferred via new `.planning/todos/pending/` entry at phase close. QSPEC-02 covers single-choice only (against existing `test-question-directional-1`).
- **D-04** — NEW spec files `voter-question-rendering-{boolean,categorical}.spec.ts`. Dedup audit step per plan against `voter-matching.spec.ts` + `packages/matching/`. Per-assertion `// dedup:` comments where overlap exists.
- **D-05** — 4-step contract per spec: input renders / voter answers / answer persists across navigation / entity-detail mirror. Voter answer pre-state uses fresh page + manual navigation (NOT `answeredVoterPage` fixture — Likert `.nth(4)` doesn't apply to boolean/categorical answer buttons).
- **D-06** — Role/aria locators by default. `getByTestId('opinion-question-input')` only as SCOPE wrapper with inline `// reason:` per Phase 74 D-11 + Phase 73 IN-03 convention. Both specs MUST pass `yarn lint:check` (post-Phase-73 `playwright/no-raw-locators` at `'error'`).
- **D-07** — Determinism contract inherits Phase 74 D-09 verbatim: 3× cold-start `--workers=1` identical pass/fail. New specs expected in `PASS_LOCKED`; any DATA_RACE entry requires per-test rationale.
- **D-08** — Parity-script constants regen CONDITIONAL: re-run `regen-constants.mjs` because both specs add new test IDs (regen IS EXPECTED for the +N new PASS_LOCKED entries). No new variant projects in Phase 75 — variant trigger doesn't fire. IMGPROXY_TIED_TITLES safety: text-only choice buttons; safe.
- **D-09** — Vite-cache wipe is mandatory before the 3-run smoke (`rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit`).
- **D-10** — Plan 01 → Plan 02 strict serial. Plan 01 modifies `e2e.ts` (boolean question + new category + Alpha answer); Plan 02's QSPEC-02 runs against the existing categorical at sort 17 but the 3-run smoke exercises BOTH specs.

### Claude's Discretion

- `walkToQuestion(page, sortOrder)` extraction in `tests/tests/utils/voterNavigation.ts` — RECOMMENDED if both plans share the same skip-walk; planner's call at PLAN.md time.
- Whether Plan 02 produces separate `75-VERIFICATION.md` (default — mirrors Phase 73/74 convention) OR folds into Plan 02 SUMMARY.md. **Default: separate `75-VERIFICATION.md`.**
- Whether QSPEC-01 / QSPEC-02 share a bundled spec file vs. split files. **Default: split per D-04.**
- Whether the boolean category reuses `test-category-info` or adds new `test-category-boolean`. **Default: NEW** per D-02 (reuse REJECTED — info category is text-only).
- Whether `58-E2E-AUDIT.md` gets an addendum for the new boolean question + category — recommended-but-not-blocking.

### Deferred Ideas (OUT OF SCOPE)

- QSPEC-02 multi-choice categorical variant (D-03) — captured at phase close.
- `walkToQuestion(page, sortOrder)` helper extraction — planner's call; recommended.
- E2E-05/E2E-07 4-case extension for boolean question — not in v2.9 scope.
- Per-category match SubMatch for categorical questions — covered by E2E-07 (Phase 74 P05).
- `answeredVoterPage` fixture extension to handle non-Likert questions — Phase 78 / CLEAN-05 (`--likert-only` seed modifier, Path B locked).
- i18n wrapper tightening (CLEAN-04) — Phase 78; existing QSPEC-01 re-validates against the tightened wrapper after CLEAN-04 lands (Order B convention from Phase 74 D-06).
- `58-E2E-AUDIT.md` addendum for the new boolean question + new category — planner's call.
- `tests/scripts/diff-playwright-reports.ts` permanent home + CI integration — out of scope.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QSPEC-01 | Focused spec walks the voter through a Boolean opinion question end-to-end — input shape correct (2-button radio per v2.6 P61), voter answers, navigates, sees their answer reflected on entity-detail. Deduplicated against existing matching tests (assertion-by-assertion). | `OpinionQuestionInput.svelte:72-75` `booleanChoices` (no/yes order using `common.answer.{no,yes}` i18n keys — verified in `apps/frontend/src/lib/i18n/translations/en/common.json:6-9`); `:100-111` boolean branch dispatches to `QuestionChoices` with synthesized choices; `:110` onChange adapter maps `'yes' → true`; existing `voter-detail.spec.ts:104-113` exemplar for entity-detail mirror locator. New seed row per D-02. |
| QSPEC-02 | Focused spec walks the voter through a categorical (single-choice ONLY per D-03) opinion question end-to-end — input shape correct, voter answers, navigates, sees their answer reflected on entity-detail. Per-category match breakdown NOT asserted here (E2E-07's responsibility). | `OpinionQuestionInput.svelte:89-99` single-choice branch dispatches `SingleChoiceCategoricalQuestion` to `QuestionChoices`; existing `test-question-directional-1` at `e2e.ts:518-532` with 3 choices (`Option A/B/C`) + Alpha's answer `{ value: 'a' }` at `:603`. Same entity-detail mirror locator strategy as QSPEC-01. |

## Implementation Approach (per plan)

### Plan 01 — QSPEC-01 (Boolean) + e2e template extension

**Files modified:**
- `packages/dev-seed/src/templates/e2e.ts` — 1 new question (sort 18) + 1 new category (`test-category-boolean`) + 1 new Alpha answer cell + update `§4.1 EXCLUDED` comment at `:298` to remove `test-question-boolean`
- `tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts` — NEW spec file

**Task shape:**
1. **Task 1: Extend e2e template.** Add new category `test-category-boolean` to `question_categories.fixed[]` at sort 6 (after `test-category-directional` at sort 5). Add new boolean question to `questions.fixed[]` at sort 18 (after `test-question-directional-1` at sort 17). Add Alpha's `'test-question-boolean-1': { value: true }` to `answersByExternalId`. Update the §4.1 exclusion comment at line 298 to remove `test-question-boolean` from the excluded list (it's now grep-hit by QSPEC-01). Run `yarn build` (turborepo handles `@openvaa/dev-seed` rebuild). Verify with `yarn supabase:reset` smoke that the row + Alpha answer cell appear in Supabase.
2. **Task 2: Author QSPEC-01 spec.** Walk: fresh page → `walkToQuestionsIntro(page)` → click `voterCtx.questions.startButton` → loop `nextButton.click()` × 16 (skip ordinals) → loop `nextButton.click()` × 1 (skip categorical at sort 17) → land on boolean at sort 18 → 4-step contract assertions. Dedup audit comment block: grep `packages/matching/src/**/*.test.ts` for `BooleanQuestion` matching assertions; QSPEC-01 covers render + flow, NOT matching distance. Inline `// reason:` blocks on any `getByTestId` usage per D-06.
3. **Task 3 (optional): `walkToQuestion(page, sortOrder)` helper extraction.** If Plan 02 will use the same skip pattern, extract to `tests/tests/utils/voterNavigation.ts`. Planner's call.

### Plan 02 — QSPEC-02 (single-choice categorical) + verification gate

**Files modified:**
- `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` — NEW spec file
- `tests/scripts/diff-playwright-reports.ts` — PASS_LOCKED_TESTS constants regen (per D-08)
- `.planning/phases/75-question-rendering-specs/75-VERIFICATION.md` — NEW file
- `.planning/todos/pending/2026-MM-DD-qspec-02-multi-choice-categorical-variant.md` — NEW deferral todo (per D-03)

**Task shape:**
1. **Task 1: Author QSPEC-02 spec.** Walk: fresh page → `walkToQuestionsIntro` → start questions → skip × 16 ordinals → land at sort 17 (categorical) → 4-step contract assertions. Voter clicks `Option B` (middle anchor per parity with Phase 74 P05's mid-choice pattern). Entity-detail mirror: open Alpha's drawer → opinions tab → locate the directional-question's `opinion-question-input` → assert voter's row (`radio[checked]` = 1 + 'You' text) AND entity's row (`.entitySelected` = 1) match. Note: Alpha's answer is `{ value: 'a' }` per `e2e.ts:603`, so the row visualisation is voter on `b`, Alpha on `a` (not matching) — the test asserts BOTH rows render, NOT that they match.
2. **Task 2: Vite-cache wipe + DB reset.** Per D-09.
3. **Task 3: 3-run cold-start `--workers=1` smoke.** Per Phase 73 P06 protocol. SHA-256 identity verification.
4. **Task 4: Parity-script regen + 3 PARITY GATE PASS comparisons.** `regen-constants.mjs` against `run-3.json`; paste output into `diff-playwright-reports.ts`; invoke pair-comparisons 1v2, 2v3, 1v3.
5. **Task 5: Author `75-VERIFICATION.md`.** SC table + 3-run SHA hashes + parity gate outputs + Order B record (E2E-08/CLEAN-04 carry-forward) + deferred-todo filing.
6. **Task 6 (checkpoint:human-verify).** Operator review.

## Key Findings (answers to the 10 research questions)

### 1. Voter navigation walk to a target question at sort N

**Mechanism:** Both specs use a fresh page + `walkToQuestionsIntro(page)` (existing util at `tests/tests/utils/voterNavigation.ts:160-173`) which navigates Home → Intro → /elections → /constituencies → questions-intro page, then click the questions-intro `startButton`. From there the voter is on the first ordinal at sort 0. **Skip the first 16 ordinals via `getByTestId(testIds.voter.questions.nextButton).click()` × 16** (each click registers "Skip" because the question is unanswered and `required: false` for the 16 voter-dataset and 8 default-dataset ordinals).

For QSPEC-01 (sort 18): skip 17 (= 16 ordinals + 1 categorical), land at sort 18 (boolean).
For QSPEC-02 (sort 17): skip 16 ordinals, land at sort 17 (categorical).

**Auto-advance vs. explicit nextButton:** Likert answer auto-advances after 350ms (`voter.fixture.ts:56-77`); the **same auto-advance applies to boolean and categorical** because all three share the `QuestionChoices` component, which dispatches `onChange` → parent `answerQuestion` which auto-advances. The radio-input event chain at `QuestionChoices.svelte:153-178` fires `onChange` on a different-than-currently-selected click. CONFIRMED HIGH confidence: same code path, no auto-advance opt-out in `OpinionQuestionInput.svelte` for boolean/categorical.

**However**, the spec MUST handle the post-answer transition deterministically (not rely on auto-advance alone). Recommend the `urlBefore` pattern from `voter.fixture.ts:63-77`:
```ts
const urlBefore = page.url();
await page.getByRole('button', { name: t('common.answer.yes') }).click();
await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10000 });
```

Falls back to `nextButton.click()` if auto-advance doesn't fire (last-question case; voter.fixture.ts:80-86 pattern).

### 2. Auto-advance behavior for boolean / categorical answers

Same mechanism as Likert — confirmed via `OpinionQuestionInput.svelte:89-111` (single-choice + boolean branches both pass `onChange` to `QuestionChoices`) and `QuestionChoices.svelte:153-211` (radio click → `triggerCallback(value)` → `onChange?.(details)`). The parent (voter questions page) wraps `onChange` with the auto-advance timer. So the spec can rely on the same `urlBefore`/`waitForURL` pattern as the existing Likert fixture.

For the spec to be deterministic, use the same dispatch as `voter-journey.spec.ts answerRemainingUntilResults` (which the project has battle-tested across 3 cold runs):
```ts
const urlBefore = page.url();
await page.getByRole('button', { name: 'Option B' }).click();
try {
  await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3000 });
} catch {
  await page.getByTestId(testIds.voter.questions.nextButton).click();
  await page.waitForURL(/\/results/, { timeout: 10000 });
}
```

### 3. Entity-detail row locator for boolean / categorical answers

**The locator strategy from Phase 74 P05 (`getByRole('meter', ...)`) does NOT apply** — that's for SubMatch ScoreGauge per-category percentages. For plain voter-vs-entity answer rows, the canonical exemplar is `voter-detail.spec.ts:104-113` + `:213-244` (the 4-case E2E-05 block):

```ts
const dialog = page.getByRole('dialog');
await dialog.getByRole('tab', { name: /opinions/i }).click();
const opinionsTab = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);

// Locate the target question's input via scope (LAST input for sort 17 / 18)
const targetInput = opinionsTab.getByTestId('opinion-question-input').last();

// Entity row: .entitySelected class on radio (NOT aria-exposed — see exemplar reason block)
// reason: 'entitySelected' is a CSS class set by OpinionQuestionInput in display mode;
// no aria/role equivalent — see voter-detail.spec.ts:98-106 for the canonical inline justification.
// eslint-disable-next-line playwright/no-raw-locators
await expect(targetInput.locator('.entitySelected')).toHaveCount(1);

// Voter row: aria-semantic via radio[checked] + 'You' label
await expect(targetInput.getByRole('radio', { checked: true })).toHaveCount(1);
await expect(targetInput.getByText('You')).toBeAttached();
```

This works identically for **both** boolean and categorical questions because `OpinionQuestionInput.svelte` dispatches both to `QuestionChoices` (which renders `<input type="radio">` per choice) — see `QuestionChoices.svelte:263-273` for the radio element.

For QSPEC-01: voter-detail's `opinion-question-input` scope locates the boolean input. Spec uses `.last()` (boolean is sort 18, the last input) — though if the directional answer-row only renders when answered (per `EntityOpinions.svelte:69`), and the voter has NOT answered the directional categorical (which is sort 17), then in Alpha's drawer the boolean input is the LAST visible input (because voter answered it and Alpha answered it = both rendered). **Plan 01 verifies this assumption at PLAN.md time** — see Open Question 1.

For QSPEC-02: voter-detail locates the directional input via `opinionsTab.getByTestId('opinion-question-input').last()` IF voter ALSO answered the boolean (Plan 02 runs after Plan 01 — so the boolean is now in the seed too; the categorical is at sort 17, the boolean at sort 18; voter answered categorical = sort 17; voter did NOT answer boolean unless they intentionally walked past sort 17 to sort 18 and answered both). Plan 02 has voter answer ONLY the categorical, so the boolean row in Alpha's drawer renders only if Alpha has an answer there (per D-02 Alpha's `{ value: true }` — yes). So in QSPEC-02 the directional input is locatable by a question-text filter:
```ts
const directionalInput = opinionsTab.getByTestId('opinion-question-input').filter({
  has: page.getByText(/Directional/)
});
```
OR by index — but text-filter is more robust. Planner picks at PLAN.md time.

### 4. Boolean answer rendering on entity-detail

When voter answered `yes` (i.e., `true`) and Alpha answered `yes`, the row visually renders:
- 2 buttons ("No" / "Yes" labels, ordered no-first per `OpinionQuestionInput.svelte:73-75` low→high convention)
- Yes button: `.entitySelected` class (Alpha's choice) AND `checked` radio (voter's choice) — same row renders both annotations
- Voter label: `'You & {entity}'` per `QuestionChoices.svelte:245-253` `display-label` branch (when `selectedId == otherSelected`)
- No button: no `.entitySelected`, no `checked` — but the question text + button labels still render (for visual completeness)

For the case where Alpha answered `yes` but voter has not answered (Alpha drawer at Phase 75 baseline — voter walks to sort 18 to answer Yes): row shows Alpha's button with `.entitySelected` + entity label `Test Candidate Alpha` (or its shortName); voter button has no checked radio.

This means QSPEC-01's entity-detail mirror assertion has TWO valid shapes depending on whether voter answered:
- (a) Both answered same value (`true`): single button shows `.entitySelected` + `checked` + 'You' label (or 'You & Candidate' merged label)
- (b) Both answered different values: two different buttons; one shows `.entitySelected`, the other shows `checked` + 'You'

QSPEC-01 Case D-05 step 4 is case (a) — voter clicks Yes, Alpha is Yes → "both answered, same value" path.

**Concrete render contract per `QuestionChoices.svelte:243-253`:**
```svelte
{#if mode === 'display'}
  {@const style = `grid-${vertical ? 'row' : 'column'}: ${i + 1};`}
  {#if selectedId == id && otherSelected == id}
    <div class="display-label text-primary" {style}>
      {t('questions.answers.yourAnswer')} & {otherLabel}
    </div>
  {:else if selectedId == id}
    <div class="display-label text-primary" {style}>{t('questions.answers.yourAnswer')}</div>
  {:else if otherSelected == id}
    <div class="display-label" {style}>{otherLabel}</div>
  {/if}
{/if}
```
So `getByText(/You/i)` returns 1 match (the combined `You & {entity}` label or the standalone `You` label). For case (a) on the boolean Yes button, expect `'You & Test Candidate Alpha'` or `'You & TC Alpha'` (depending on `shortName` resolution); use a regex partial match:
```ts
await expect(targetInput.getByText(/You/i)).toBeAttached();
```

### 5. Dedup audit against voter-matching.spec.ts + packages/matching

**voter-matching.spec.ts dedup map (verified by reading the file):**
- `:40-43` filter `singleChoiceOrdinal` from `E2E_QUESTIONS` — does NOT touch booleans or categoricals; no overlap
- `:99-103` matching computation via `MatchingAlgorithm` with `DISTANCE_METRIC.Manhattan` — algorithm contract, NOT user-flow; no overlap
- `:191-217` ranking assertions — algorithm contract; no overlap
- `:167-177` Skip-Next fallback for sort 17 — Phase 75 QSPEC-02 LEVERAGES the same fallback (does NOT re-implement it)

**packages/matching/src/**/*.test.ts:** matching distance + normalization unit tests; pure algorithm contract; orthogonal to render-shape contract.

**Verdict:** No assertion-level overlap. Both new specs cover render + flow contracts that no existing test asserts. Per CONTEXT D-04, add per-assertion `// dedup: matching distance covered by …` comments where the assertion is semantically near a matching-algorithm assertion but asserts a different contract. Example:
```ts
// dedup: matching distance for booleans is covered by packages/matching/...;
// this spec asserts the render-shape contract only (2 buttons, no/yes order, click → answer persists).
await expect(input.getByRole('button', { name: 'No' })).toBeVisible();
await expect(input.getByRole('button', { name: 'Yes' })).toBeVisible();
```

### 6. Validation Architecture (Nyquist Dimension 8)

See dedicated section below. Key points: 3-run determinism gate inherited from Phase 73; parity-script regen REQUIRED because both specs add new test IDs (per D-08); boolean+categorical render correctness asserted by the new specs themselves (each spec is its own validation gate). Per-plan smoke: `yarn workspace @openvaa/tests test:e2e --workers=1 --grep "QSPEC-0X"`. Phase gate (Plan 02): `for i in {1..3}; do yarn dev:reset-with-data && yarn test:e2e --workers=1; done` after vite-cache wipe.

### 7. Inline `// reason:` patterns

The canonical shape from Phase 74 P04 (`74-04-PLAN.md`) and the existing `voter-detail.spec.ts:98-106` is:

```ts
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

For the SCOPE-wrapper use of `getByTestId('opinion-question-input')` (used to disambiguate when multiple inputs render on the page — e.g., the voter-answer surface and the entity-detail row would both have "Yes"/"No" button text in the DOM), the reason block is:

```ts
// reason: scope to the opinion-question-input container avoids ambiguity
// when both the voter's answer surface and entity-detail rows render the
// same "Yes"/"No" or choice button labels. Container-scoped role locators
// are preferred over global page-level role locators here.
const input = page.getByTestId('opinion-question-input');
await input.getByRole('button', { name: t('common.answer.yes') }).click();
```

The `// reason:` comment lives immediately above the locator-line. Both `// reason:` AND the `// eslint-disable-next-line playwright/no-raw-locators` directive (where applicable for `.locator('.class')` usage) are required.

### 8. Boolean question category — NEW `test-category-boolean` per D-02

CONFIRMED. Per CONTEXT D-02 + Claude's Discretion paragraph 4: NEW category `test-category-boolean` mirrors Phase 74 P05's `test-category-directional` (`e2e.ts:280-287`). Reusing `test-category-info` is REJECTED — info is for `text`/info-type questions (`test-question-text`), not opinion. Reusing `test-category-economy` etc. would conflate categories (the matching algorithm groups by category for SubMatch).

Shape (mirrors `test-category-directional` at `e2e.ts:280-287`):
```ts
{
  external_id: 'test-category-boolean',
  name: { en: 'Test Category: Boolean (QSPEC-01)' },
  category_type: 'opinion',
  sort_order: 6,  // after test-category-directional at sort 5
  is_generated: false
}
```

Alpha's category metadata does NOT need updating — Alpha doesn't carry category links; category linkage flows through `question.category.external_id` only.

### 9. Skip-Next + sort-18 fallback verification

**Phase 74 P05 added two fallbacks for the sort-17 categorical:**
- `voter-matching.spec.ts navigateToResults` lines 167-177 (Skip-Next fallback when on the categorical at sort 17)
- `voter-journey.spec.ts answerRemainingUntilResults` lines 56-70 (out-of-range guard: `if (answerOptionIndex >= choiceCount) skip`)

**Both fallbacks are sort-agnostic.** The voter-matching fallback checks `if (!page.url().includes('/results'))` — fires whenever auto-advance hasn't navigated yet, regardless of sort. The voter-journey fallback uses `answerOption.count()` to detect out-of-range — fires whenever the requested choice index doesn't exist (Likert is 5 choices; categorical is 3; boolean is 2). Both will handle the sort 18 boolean transparently.

**However**, the voter-journey fallback at line 64-70 ONLY handles `answerOptionIndex >= choiceCount` by clicking nextButton (skip) → waiting for `/results`. The expectation is "this is the last question and we skip past it." If a future spec NEEDED to actually click a boolean answer button (rather than skip), the fallback wouldn't apply. Phase 75 doesn't rely on the fallback for ANSWERING; the fallback only ensures the existing `voter-journey.spec.ts` + `voter-matching.spec.ts` continue passing after the boolean question is added. Phase 75's NEW specs walk the voter MANUALLY (not via the fixture), so they're independent.

**Verification step for Plan 02:** after the seed extension lands (Plan 01), re-run `yarn test:e2e --workers=1 --grep "matching"` + `--grep "voter journey"` to confirm both existing specs still pass under the new 18-question seed. EXPECTED YES — fallbacks are sort-agnostic. If FAIL: planner extends `answerRemainingUntilResults` `maxSteps` cap (currently 30) or wires a second Skip-Next iteration.

### 10. Test running locally + Vite-cache wipe recipe

Exact command shape (per Phase 73/74 + CLAUDE.md):
```bash
# Pre-gate (Plan 02 Task 2): vite-cache wipe + DB reset
rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit
yarn dev:reset-with-data

# 3-run cold-start smoke (Plan 02 Task 3)
for i in 1 2 3; do
  yarn test:e2e --workers=1 --reporter=json --output=run-$i.json 2>&1 | tee run-$i.log
done

# SHA-256 identity check
for f in run-1.json run-2.json run-3.json; do
  jq -r '.suites[]?.suites[]?.specs[]? | "\(.title)|\(.tests[0].results[0].status)"' "$f" | sort | shasum -a 256
done

# Parity gate (Plan 02 Task 4)
node .planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs run-3.json > regen-output.txt
# (paste output into tests/scripts/diff-playwright-reports.ts)
yarn tsx tests/scripts/diff-playwright-reports.ts run-1.json run-2.json
yarn tsx tests/scripts/diff-playwright-reports.ts run-2.json run-3.json
yarn tsx tests/scripts/diff-playwright-reports.ts run-1.json run-3.json
```

Per-plan smoke (during authoring):
```bash
# Plan 01 — boolean spec only
yarn workspace @openvaa/tests test:e2e --workers=1 --grep "QSPEC-01"

# Plan 02 — categorical spec only
yarn workspace @openvaa/tests test:e2e --workers=1 --grep "QSPEC-02"
```

## Code Excerpts (concrete references for the planner)

### Boolean choices synthesis (target render contract for QSPEC-01)
`apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte:72-75`:
```ts
const booleanChoices = $derived<Array<Choice>>([
  { id: 'no', label: t('common.answer.no') },
  { id: 'yes', label: t('common.answer.yes') }
]);
```
i18n keys are EN:`{ no: 'No', yes: 'Yes' }` per `apps/frontend/src/lib/i18n/translations/en/common.json:6-9`. Order in DOM = `[No, Yes]` (low→high left-to-right per the same file's `:69-71` comment).

### Boolean branch dispatch (QSPEC-01 onChange contract)
`apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte:100-111`:
```svelte
{:else if isBooleanQuestion(question)}
  {@const selectedId = booleanToChoiceId(answer?.value)}
  {@const otherSelected = booleanToChoiceId(otherAnswer?.value)}
  <QuestionChoices
    {question}
    choices={booleanChoices}
    {mode}
    {selectedId}
    {otherSelected}
    {otherLabel}
    onChange={onChange ? (d) => onChange({ value: d.value === 'yes', question: d.question }) : undefined}
    {...restProps} />
```
The onChange adapter at `:110` maps `'yes' → true`, `'no' → false`.

### Single-choice categorical branch (QSPEC-02 dispatch)
`apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte:89-99`:
```svelte
{#if isSingleChoiceQuestion(question)}
  {@const selectedId = question.ensureValue(answer?.value)}
  {@const otherSelected = question.ensureValue(otherAnswer?.value)}
  <QuestionChoices
    {question}
    {mode}
    {selectedId}
    {otherSelected}
    {otherLabel}
    onChange={onChange ? (d) => onChange({ value: d.value, question: d.question }) : undefined}
    {...restProps} />
```

### Existing categorical seed row (QSPEC-02 target)
`packages/dev-seed/src/templates/e2e.ts:518-532`:
```ts
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
Alpha's answer for it: `'test-question-directional-1': { value: 'a' }` at `e2e.ts:603`.

### Boolean seed row shape (Plan 01 to AUTHOR)
Mirroring the directional shape at `e2e.ts:518-532`:
```ts
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
Note: boolean questions are schema-free (no `choices` field) per `packages/dev-seed/src/templates/defaults/questions-override.ts:53` ("boolean: no choices (QuestionsGenerator pattern — boolean is schema-free)").

Alpha's answer cell additions:
```ts
// In test-candidate-alpha.answersByExternalId at e2e.ts:582-604:
'test-question-boolean-1': { value: true }
```

### Skip-Next fallback (existing, sort-agnostic)
`tests/tests/specs/voter/voter-matching.spec.ts:167-177`:
```ts
// Phase 74 Plan 05 — Skip→Next fallback for the non-ordinal categorical
// anchor question. After the 16 ordinal answers, auto-advance navigates
// to the 17th question (test-question-directional-1, sort 17,
// singleChoiceCategorical, required: false). [...]
if (!page.url().includes('/results')) {
  await page.getByTestId(testIds.voter.questions.nextButton).click();
  await page.waitForURL(/\/results/, { timeout: 30000 });
}
```

### Entity-detail mirror locator (E2E-05 exemplar, applies to both QSPEC specs)
`tests/tests/specs/voter/voter-detail.spec.ts:97-113`:
```ts
// Candidate's opinion answer is correctly indicated:
// Alpha answered Q1 — the corresponding choice radio has entitySelected class.
// reason: 'entitySelected' is a CSS class set by the OpinionQuestionInput
// component to mark the candidate's answer position; it has no ARIA role
// (the role lives on the underlying <input type="radio">), no associated
// text, and no testId. The class is the contract — getByRole/getByText/etc.
// would match either too few elements (no class info) or too many (all
// radios). Inline-justified per RESEARCH §"Pitfall" + §"Anti-Patterns".
const firstQuestionInput = opinionsTab.getByTestId('opinion-question-input').first();
// eslint-disable-next-line playwright/no-raw-locators
await expect(firstQuestionInput.locator('.entitySelected')).toHaveCount(1);

// Voter's answer is displayed alongside the candidate's:
// The voter's selected radio is checked, and voter label ("You") is shown.
await expect(firstQuestionInput.getByRole('radio', { checked: true })).toHaveCount(1);
await expect(firstQuestionInput.getByText('You')).toBeAttached();
```

### Auto-advance pattern (boolean/categorical inherit this from Likert)
`tests/tests/specs/voter/voter-journey.spec.ts:72-86`:
```ts
await answerOption.nth(answerOptionIndex).click();

// Wait for auto-advance OR fall back to next-button click. [...]
try {
  await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3000 });
} catch {
  await nextButton.waitFor({ state: 'visible', timeout: 5000 });
  await nextButton.click();
  await page.waitForURL(/\/results/, { timeout: 10000 });
  return count;
}
```

### `walkToQuestionsIntro` helper (existing, used by both QSPEC specs)
`tests/tests/utils/voterNavigation.ts:160-173`:
```ts
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

## Risks + Pitfalls

### Pitfall 1: Parity-script `regen-constants.mjs` IMGPROXY_TIED_TITLES match-count assertion

**What goes wrong:** `regen-constants.mjs:80-87` exits 1 if any of the 14 bound IMGPROXY_TIED_TITLES has zero matches in the new JSON (renamed/removed test). Phase 75 does NOT rename existing tests, but adds NEW ones — the assertion runs on the bound list which doesn't change. If the regen output is pasted incorrectly OR the IMGPROXY_TIED_TITLES list isn't updated to track any renames, the gate fails.

**Why it happens:** The bound list is structural — meant to "fail loudly rather than silently miscount" per `regen-constants.mjs:13-14`.

**How to avoid:** Plan 02 verification: before pasting regen output, run `node regen-constants.mjs run-3.json` and verify exit 0. If exit 1: identify the colliding title (none should collide for Phase 75 because new specs DON'T touch entity-detail drawer + image-upload paths or candidate-list image rendering surfaces). For Phase 75 safety, both new spec test titles MUST not END with any of the 14 bound patterns. None of "QSPEC-01 ..." or "QSPEC-02 ..." overlap.

### Pitfall 2: Skip-Next fallback handling for sort 18

**What goes wrong:** Phase 74 P05 added Skip-Next fallback for sort 17 (categorical) in `voter-matching.spec.ts navigateToResults`. After Plan 01 adds the boolean at sort 18, the existing fallback at `voter-matching.spec.ts:167-177` MAY OR MAY NOT need a 2nd iteration to skip past sort 18 → /results.

**Why it happens:** The fallback's single `nextButton.click()` advances ONE question. If voter is on sort 17 (categorical), one skip → sort 18 (boolean), not /results.

**How to avoid:** Plan 01 verification: re-run `yarn test:e2e --workers=1 --grep "matching algorithm"` after seed extension lands. If FAIL: extend the fallback to a `while (!page.url().includes('/results')) { nextButton.click(); }` loop with a `maxSteps` cap (per `voter-journey.spec.ts:46` pattern). The `answerRemainingUntilResults` helper at `voter-journey.spec.ts:42-89` already has a 30-step cap — fine. The matching spec's inline fallback at `:167-177` may need bumping to a 2-iteration loop. Surface as a Plan 01 finding for Plan 02 to address if observed.

### Pitfall 3: Entity-detail input ambiguity (last() vs. filter())

**What goes wrong:** `opinionsTab.getByTestId('opinion-question-input').last()` returns the LAST `opinion-question-input` in the opinions tab. For QSPEC-01 (boolean at sort 18) in Alpha's drawer, the inputs render in question-sort-order:
- 8 default-dataset ordinals (sort 0-7) — Alpha answered Q1, Q3, Q5, Q7
- 1 info question (sort 8, type=text — DOESN'T render as opinion-question-input; rendered by different component)
- 8 voter-dataset ordinals (sort 9-16) — Alpha NOT answered
- 1 categorical (sort 17) — Alpha answered `'a'`
- 1 boolean (sort 18) — Alpha answered `true` (added by Plan 01)

Per `EntityOpinions.svelte:69`: `{#if voterAnswer != null || answer != null}` — the input renders only if either party answered. So in Alpha's drawer at QSPEC-01 baseline (voter answered the boolean Yes):
- 8 default ordinals where voter OR alpha answered: 4 alpha-answered + voter-fixture answers all 16 ordinals = 8 rendered
- 8 voter ordinals (voter answered, Alpha did not): 8 rendered
- 1 categorical (voter NOT answered in QSPEC-01 walk, Alpha answered): 1 rendered
- 1 boolean (BOTH answered): 1 rendered

Total: 18 `opinion-question-input` elements in Alpha's drawer. `.last()` → the boolean (sort 18). Safe.

For QSPEC-02 (categorical at sort 17, walks to sort 17 but does NOT advance past sort 17): voter has answered ONLY the categorical (sort 17, value `b`). Voter has NOT answered the 16 ordinals (was on skip-walk) NOR the boolean (sort 18 wasn't reached). In Alpha's drawer:
- 4 default ordinals where Alpha answered (Q1, Q3, Q5, Q7): 4 rendered
- 0 voter ordinals (Alpha didn't, voter didn't): 0 rendered
- 1 categorical (both answered, voter=b, Alpha=a): 1 rendered
- 1 boolean (Alpha=true, voter=null → renders because Alpha answered): 1 rendered

Total: 6 inputs in Alpha's drawer for QSPEC-02. `.last()` → the boolean (sort 18). **This is the wrong locator for QSPEC-02** (which targets the categorical at sort 17).

**How to avoid:** QSPEC-02 must use a more specific locator. Options:
- `opinionsTab.getByTestId('opinion-question-input').filter({ has: page.getByText(/Directional/) })` — filters by question text
- `opinionsTab.getByTestId('opinion-question-input').nth(N)` — by index, but N depends on rendering order (fragile)
- Wrap the input in a question scope (use the parent `<div>` that contains both `HeadingGroup` and `OpinionQuestionInput` per `EntityOpinions.svelte:43-80`)

**Recommended:** filter-by-text approach. The directional question's `name.en` is "Test Opinion Question Directional 1 (E2E-07)" — strong text discriminator.

### Pitfall 4: Vite-cache + .svelte-kit wipe not done

**What goes wrong:** Pre-bundled Vite deps + pre-rendered `.svelte-kit` routes from prior phases hide shared-type changes (new boolean question schema). The 3-run gate may pass run 1 against stale cache and fail run 2 after Vite re-bundles.

**Why it happens:** v2.8-close gotcha documented in `.planning/milestones/v2.8-MILESTONE-AUDIT.md` §"Bundled Manual Smoke". Inherited by Phase 73 → 74 → 75.

**How to avoid:** Plan 02 Task 2 MUST run `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` before the first `yarn dev:reset-with-data` invocation. Verification via `ls apps/frontend/node_modules/.vite 2>&1 | grep -c "No such file"` (expect 1).

### Pitfall 5: Categorical `value: 'b'` middle-choice rationale check

**What goes wrong:** Plan 02 has voter click Option B (id=`b`); Alpha's answer is `value: 'a'`. The two answers are DIFFERENT — entity-detail mirror should show BOTH rows but on DIFFERENT buttons. If the planner assumes "same-value case (a)" mirror logic, the assertion fails.

**Why it happens:** The visual contract differs by whether voter and Alpha agree:
- If `selectedId == otherSelected`: combined `'You & {entity}'` label on 1 button
- If different: voter's button has `'You'`, entity's button has `'{entity}'` label

**How to avoid:** QSPEC-02 entity-detail assertion uses the **different-buttons** shape:
```ts
// Voter answered 'b' (Option B); Alpha answered 'a' (Option A).
// Two buttons → distinct You and entity-label markers.
const directionalInput = opinionsTab.getByTestId('opinion-question-input').filter({ has: page.getByText(/Directional/) });
await expect(directionalInput.locator('.entitySelected')).toHaveCount(1);  // Alpha's row on 'a'
await expect(directionalInput.getByRole('radio', { checked: true })).toHaveCount(1);  // voter's row on 'b'
await expect(directionalInput.getByText('You')).toBeAttached();
// Alpha's display-label literal — assert by entity short name (Alpha's shortName resolves to "Test Candidate Alpha" or "TC Alpha" — read at PLAN time)
```

Alternatively, the planner can revise the spec so voter clicks `Option A` (matching Alpha) — but that DUPLICATES case (a). Recommend Option B (middle anchor per Phase 74 P05 directional pattern) so the entity-detail shows the asymmetric render. The assertion shape MUST match.

### Pitfall 6: `answeredVoterPage` fixture cannot be reused

**What goes wrong:** Both QSPEC specs use a fresh page + manual `walkToQuestionsIntro` + skip-walk. The existing `answeredVoterPage` fixture at `tests/tests/fixtures/voter.fixture.ts:48-95` clicks Likert by `.nth(voterAnswerIndex)` (default 4) — which works on Likert-5 (5 buttons) but `.nth(4)` is OUT OF RANGE on boolean (2 buttons) AND on categorical (3 buttons). Reusing the fixture would crash the walk.

**Why it happens:** The fixture was Phase 59-era Likert-only by design (operator-locked Path B in `2026-05-11-voter-fixture-heterogeneous-question-types.md` for Phase 78 CLEAN-05).

**How to avoid:** Phase 75 specs DO NOT use `answeredVoterPage`. They build their own fresh page + manual navigation (per D-05 voter-answer pre-state). The `walkToQuestion(page, sortOrder)` helper (Claude's Discretion) would encapsulate this if extracted. Document inline in each spec:
```ts
// Phase 75 specs do NOT use the answeredVoterPage fixture — its Likert .nth(4)
// click pattern is out of range for boolean (2 buttons) and categorical (3 buttons).
// Manual navigation via walkToQuestionsIntro + nextButton skip × N. Path B locked
// in Phase 78 CLEAN-05 will add a --likert-only seed modifier for the fixture.
```

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 (locked at v2.9 — no migration; v2.7 P67 + STATE.md "durable stack") |
| Config file | `tests/playwright.config.ts` (90s per-test timeout; `fullyParallel: true`; workers: 6 local / 1 CI) |
| Quick run command (per plan) | `yarn workspace @openvaa/tests test:e2e --workers=1 --grep "QSPEC-0X"` |
| Full suite command | `yarn test:e2e --workers=1` (Plan 02 verification gate) |
| Determinism re-run | `for i in 1 2 3; do yarn dev:reset-with-data && yarn test:e2e --workers=1; done` |
| Verification gate | `yarn tsx tests/scripts/diff-playwright-reports.ts run-N.json run-M.json` × 3 pair invocations |
| Lint | `yarn lint:check` (root, 0/0 expected post-Phase-73) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| QSPEC-01 | Boolean opinion question — input renders, voter answers, persists across nav, entity-detail mirrors | e2e | `yarn test:e2e --workers=1 --grep "QSPEC-01"` | ❌ Plan 01 creates `tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts` |
| QSPEC-02 | Single-choice categorical opinion question — same 4-step contract against existing `test-question-directional-1` | e2e | `yarn test:e2e --workers=1 --grep "QSPEC-02"` | ❌ Plan 02 creates `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` |

### Sampling Rate

- **Per task commit (within plan):** `yarn workspace @openvaa/tests test:e2e --workers=1 --grep "QSPEC-0X"` (the spec being authored only).
- **Per plan close:** 3-spot-check (`for i in 1 2 3; do yarn test:e2e --workers=1 --grep "QSPEC-0X"; done`) to confirm determinism on the per-spec scope.
- **Phase gate (Plan 02):** Full suite × 3 cold-start `--workers=1` runs with vite-cache wipe before run 1. SHA-256 confirm byte-level identity. Parity-script regen + 3 PARITY GATE PASS pair-comparisons. `75-VERIFICATION.md` written.

### What FAILS LOUDLY when contract breaks

| Req ID | Failure-Loud Mechanism |
|--------|------------------------|
| QSPEC-01 | (a) If boolean branch in `OpinionQuestionInput.svelte:100-111` is removed/regressed: `getByRole('button', { name: 'Yes' })` returns 0 → spec fails. (b) If i18n key `common.answer.yes` is removed: button label changes → assertion fails on the exact text. (c) If `entitySelected` class is removed from `QuestionChoices`: `.entitySelected` locator returns 0 → entity-detail mirror assertion fails. (d) If Alpha's `{ value: true }` cell is missing in seed: Alpha drawer shows no entity row → `.entitySelected` count = 0 → spec fails. |
| QSPEC-02 | (a) If single-choice categorical branch in `OpinionQuestionInput.svelte:89-99` is removed/regressed: `getByRole('button', { name: 'Option B' })` returns 0 → spec fails. (b) If `test-question-directional-1` is removed from seed: question navigation skips past sort 17 unexpectedly → walk-to-question step times out. (c) Same entity-detail mirror failure modes as QSPEC-01. |
| Both | (e) If auto-advance breaks (e.g., `onChange` adapter regression): `urlBefore !== page.url()` waitForURL times out → spec catches via try/catch and falls back to nextButton; if nextButton is also broken, spec fails on `/results` waitForURL timeout. (f) If voter→sort-N walk regresses (e.g., Skip-Next sort-18 fallback breaks): manual nextButton.click() × N loop fails on missing locator. |
| Determinism | If new specs land in DATA_RACE (Phase-73-locked pool grows from 15): `74-VERIFICATION.md`-style identity check shows hash mismatch across 3 runs OR parity-gate PASS_LOCKED_TESTS mismatch → `regen-constants.mjs` paste fails the IMGPROXY_TIED_TITLES match-count assertion OR parity-gate reports FAIL. |

### Wave 0 Gaps

- [ ] `tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts` — covers QSPEC-01 (Plan 01)
- [ ] `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` — covers QSPEC-02 (Plan 02)
- [ ] `packages/dev-seed/src/templates/e2e.ts` — boolean question + new `test-category-boolean` + Alpha answer cell (Plan 01)
- [ ] (OPTIONAL — Claude's Discretion) `tests/tests/utils/voterNavigation.ts` extension — `walkToQuestion(page, sortOrder)` helper (Plan 01 or Plan 02; planner's call)
- [ ] `tests/scripts/diff-playwright-reports.ts` — PASS_LOCKED_TESTS regen including 2 new spec entries (Plan 02 Task 4 via `regen-constants.mjs`)
- [ ] `.planning/phases/75-question-rendering-specs/75-VERIFICATION.md` — phase verification record (Plan 02 Task 5)
- [ ] `.planning/todos/pending/2026-MM-DD-qspec-02-multi-choice-categorical-variant.md` — deferred-todo filing per D-03 (Plan 02 Task 5)

**Framework install:** None — Playwright 1.58.2 is in place. No new dependencies.

## Project Constraints (from CLAUDE.md)

The following CLAUDE.md directives apply to Phase 75 work:

- **Never commit sensitive data.** Both specs use test-prefix fixtures (alpha + the new boolean question external_id `test-question-boolean-1`).
- **Test accessibility — WCAG 2.1 AA.** Spec authoring prefers role/aria locators (which exercise the a11y surface). Both specs use `getByRole('button', { name: ... })` as the canonical locator strategy per D-06.
- **Use TypeScript strictly.** Both spec files MUST pass `yarn lint:check` (0 errors / 0 warnings on tests/ post-Phase-73, with `playwright/no-raw-locators` at `'error'`).
- **Matching algorithms — questions creating subdimensions (like categorical) need special handling.** NOT a Phase 75 concern — QSPEC-02 asserts render + flow, not matching distance. The directional/Manhattan dispatch is covered by E2E-07 (Phase 74 P05) + matching unit tests.
- **Missing values — use `MISSING_VALUE` from `@openvaa/core` in matching contexts.** N/A for Phase 75 (no missing-value branches asserted).
- **Localization.** Both specs assert against English translations (`common.answer.yes/no` for boolean; `Option A/B/C` literal labels for categorical — these are seed-defined, not translated). No new translation keys introduced. The `test-question-boolean-1.name.en` literal "Test Opinion Question Boolean 1 (QSPEC-01)" is seed-defined.
- **Check code against `/.agents/code-review-checklist.md`.** Plan 02 verification step references this.
- **Context Destructuring Rule (Svelte 5).** New specs do NOT destructure reactive accessors from context — they assert on rendered DOM via Playwright locators only. Safe.
- **Commits in this repo must use `git -c core.hooksPath=/dev/null`** per `project_gsd_repo_hook_workaround.md` (operator memory).

## Open Questions for Planner

1. **`walkToQuestion(page, sortOrder)` helper extraction** — both plans use the skip-walk pattern (skip 16 ordinals → reach sort 17/18). Recommend extraction in Plan 01 if it materially DRYs up Plan 02. Planner reads both plans' actual spec bodies and decides. Default: extract.

2. **Plan 02 vs. 02a/02b split** — Plan 02 bundles QSPEC-02 spec + verification gate. If the actual task count + LoC exceeds the per-plan ceiling (~8 tasks / 600 LoC observed in Phase 73 P01), split into 02a (categorical spec) + 02b (verification gate). Default: 1 bundled plan, mirrors Phase 73 P01 + the small-phase precedent.

3. **Whether `75-VERIFICATION.md` is separate or folded** into Plan 02 SUMMARY.md. Default: separate file (mirrors Phase 73 + Phase 74 convention; STATE.md references `74-VERIFICATION.md` by name, so the project convention is a phase-level VERIFICATION.md).

4. **Entity-detail locator strategy for the directional input in QSPEC-02** — `.last()` vs. `.filter({ has: page.getByText(/Directional/) })`. Per Pitfall 3: filter-by-text is more robust because the boolean (sort 18) is the actual last input in Alpha's drawer at QSPEC-02 baseline (voter answered ONLY categorical at sort 17). Recommend filter-by-text. Planner verifies at PLAN.md time by re-reading the seed + Alpha's answer cells.

5. **Whether to bump `voter-matching.spec.ts navigateToResults` Skip-Next fallback to handle TWO un-answered questions (sort 17 + 18)** — per Pitfall 2. If the existing single-iteration fallback fails after Plan 01 seed extension, Plan 01 needs an additional task: extend the fallback to a 2-iteration loop. Default: verify-then-decide.

6. **Voter answer pre-state shape for QSPEC-02** — should the voter answer the 16 ordinals (matching `answeredVoterPage` fixture's pre-state but without using the fixture), or skip them all? Default: SKIP (per Pitfall 6) — voter walks to the categorical at sort 17, answers it, then the entity-detail mirror assertion shows ONLY the categorical question's row (plus rows where Alpha-only answered, like the 4 Alpha-answered default ordinals and the boolean Alpha answered). The dedup contract is on render+flow, NOT on matching distance.

7. **Whether to bundle Plan 01's `// reason:` justifications inline OR refer to a single `RESEARCH.md` anchor** — Phase 74 P05 inlined. Default: inline per Phase 74 convention.

8. **Whether `58-E2E-AUDIT.md` needs an addendum** for the new boolean question + new category (Claude's Discretion paragraph 5). Recommended-but-not-blocking. Default: skip in Plan 01, file as follow-up at phase close if the operator wants the audit anchored.

## Sources

### Primary (HIGH confidence)

- `.planning/phases/75-question-rendering-specs/75-CONTEXT.md` — D-01..D-10 binding decisions.
- `.planning/REQUIREMENTS.md` lines 56-60 — QSPEC-01 + QSPEC-02 locked success criteria.
- `.planning/ROADMAP.md` lines 197-207 — Phase 75 goal + 4 SC + plan estimate.
- `.planning/phases/74-high-leverage-e2e-coverage/74-CONTEXT.md` — Phase 74 D-07 / D-09 / D-10 / D-11 / D-12 inherited verbatim.
- `.planning/phases/74-high-leverage-e2e-coverage/74-04-PLAN.md` — concrete inline `// reason:` pattern + sequential-chain verification pattern.
- `.planning/phases/74-high-leverage-e2e-coverage/74-07-PLAN.md` — full verification gate task shape (4 tasks + 1 checkpoint).
- `.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs` — parity-script regenerator (lines 55-70 IMGPROXY_TIED_TITLES bound list; lines 80-87 match-count assertion).
- `.planning/phases/73-determinism-baseline/73-VERIFICATION.md` — Phase 73 verdict shape; Phase 75 inherits.
- `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` (verbatim) — boolean branch at 100-111; single-choice branch at 89-99; `booleanChoices` synthesis at 72-75; onChange adapters.
- `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` (verbatim) — radio rendering at 263-273; `entitySelected` class application at 266; display-label render at 243-253.
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte` (verbatim) — entity-vs-voter render contract at 57-80; `bothHaventAnswered`/`youHaventAnswered`/`entityHasntAnswered` i18n keys.
- `apps/frontend/src/lib/i18n/translations/en/common.json` lines 6-9 — `answer.{no: 'No', yes: 'Yes'}` literal i18n values (en); verified parallel in fi/sv/da per OpinionQuestionInput.svelte:69 comment.
- `packages/dev-seed/src/templates/e2e.ts:280-287` — `test-category-directional` shape (mirror for new `test-category-boolean`).
- `packages/dev-seed/src/templates/e2e.ts:518-532` — `test-question-directional-1` shape (mirror for new `test-question-boolean-1`).
- `packages/dev-seed/src/templates/e2e.ts:582-604` — Alpha's answer cells (add `'test-question-boolean-1': { value: true }`).
- `packages/dev-seed/src/templates/e2e.ts:298` — §4.1 EXCLUDED comment (update to drop `test-question-boolean`).
- `packages/dev-seed/src/templates/defaults/questions-override.ts:53` — "boolean: no choices (QuestionsGenerator pattern — boolean is schema-free)".
- `tests/tests/specs/voter/voter-detail.spec.ts:97-113` — canonical entity-detail mirror locator exemplar (E2E-05 case (a) inline `// reason:` block).
- `tests/tests/specs/voter/voter-detail.spec.ts:197-296` — full 4-case E2E-05 block (additional locator patterns).
- `tests/tests/specs/voter/voter-matching.spec.ts:144-182` — `navigateToResults` helper with sort-17 Skip-Next fallback.
- `tests/tests/specs/voter/voter-journey.spec.ts:42-89` — `answerRemainingUntilResults` with out-of-range guard at lines 56-70.
- `tests/tests/utils/voterNavigation.ts:160-173` — `walkToQuestionsIntro` helper.
- `tests/tests/fixtures/voter.fixture.ts:48-95` — `answeredVoterPage` fixture (NOT used by Phase 75 per Pitfall 6).
- `tests/tests/utils/testIds.ts:77-143` — testId map (`voter.questions.nextButton`, `voter.questions.answerOption`, `voter.entityDetail.opinionsTab`, etc.).
- `tests/playwright.config.ts:43-50` — per-test timeout + workers config.
- `tests/scripts/diff-playwright-reports.ts` (verbatim) — parity-script with constants arrays at lines 73-156.

### Secondary (MEDIUM confidence)

- `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts:28` — boolean rendering precedent (`common.answer.{yes,no}` used outside Opinion path).
- `.planning/STATE.md` lines 1-150 — current project state; Phase 74 close + Phase 75 framing.
- `.planning/phases/74-high-leverage-e2e-coverage/74-RESEARCH.md` — phase-shape inheritance (RESEARCH.md skeleton).

### Tertiary (LOW confidence — needs validation)

- None. All claims for Phase 75 verifiable against repo HEAD `6410e2b12`.

## Metadata

**Confidence breakdown:**
- Standard stack (Playwright 1.58.2): HIGH — verified in `tests/playwright.config.ts` and `package.json`.
- Architecture patterns (4-step contract per spec, role/aria locator strategy, dev-seed extension shape): HIGH — verified against Phase 74 P05 working precedent.
- Don't-hand-roll items (parity-script regen, vite-cache wipe, Skip-Next fallback): HIGH — verified inheritance from Phase 73 + Phase 74.
- Common pitfalls (entity-detail locator ambiguity, auto-advance behaviour, IMGPROXY collision): MEDIUM — derived from precedent + first-principles analysis; planner verifies at PLAN.md time.
- Code examples: HIGH — verbatim citations from source files at HEAD.

**Research date:** 2026-05-11
**Valid until:** 2026-06-10 (30 days — stable phase scope; underlying surfaces — `OpinionQuestionInput.svelte`, `EntityOpinions.svelte`, dev-seed templates — last touched in Phase 74 P05 on 2026-05-11; no Phase 75-blocking changes anticipated).

---

*Phase: 75-Question-Rendering Specs*
*Research completed: 2026-05-11*
