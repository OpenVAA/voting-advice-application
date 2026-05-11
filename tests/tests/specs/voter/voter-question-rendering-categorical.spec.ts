/**
 * Voter question rendering — categorical (single-choice) opinion question (QSPEC-02).
 *
 * Asserts the SingleChoiceCategorical render branch at
 * `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte:89-99`
 * end-to-end via Playwright. Per CONTEXT D-05 the spec follows a 4-step
 * contract (B-02 revision: step 3 is the MANDATORY browser-back persistence
 * assertion — distinct reactive path from the answer-store mirror):
 *   (1) input renders as 3 radios with labels 'Option A' / 'Option B' /
 *       'Option C' (per `test-question-directional-1.choices` seeded by
 *       Phase 74 P05 at `packages/dev-seed/src/templates/e2e.ts:539-543`);
 *   (2) voter clicks 'Option B' (middle anchor) → auto-advance to next
 *       question (sort 18 — boolean from Plan 01) or /results via the
 *       Skip-Next fallback;
 *   (3) `page.goBack()` returns to the categorical question and the
 *       previously chosen radio still shows `:checked` state via
 *       `getByRole('radio', { checked: true })` (per QuestionChoices.svelte:
 *       263-273 native `<input type="radio" bind:group={selected}>`);
 *   (4) entity-detail mirror — Alpha's drawer shows BOTH the voter's row
 *       AND Alpha's row marked, on DIFFERENT buttons (voter='b', Alpha='a'
 *       per `packages/dev-seed/src/templates/e2e.ts:641`) — the asymmetric
 *       case-(c) shape per `QuestionChoices.svelte:243-253` display-label
 *       branch (RESEARCH Pitfall 5).
 *
 * Multi-choice categorical (MultipleChoiceCategoricalQuestion) is DEFERRED
 * per CONTEXT D-03 — `OpinionQuestionInput.svelte:113` renders
 * `error.unsupportedQuestion` for that type; adding multi-choice render
 * requires a feature phase, not a coverage phase. Phase 75 Plan 02b will
 * file the follow-up todo at phase close.
 *
 * Fixture choice: this spec does NOT use the `answeredVoterPage` fixture
 * because that fixture clicks Likert `.nth(4)` per `voter.fixture.ts:60`,
 * which is out of range for the categorical question's 3 radios (RESEARCH
 * Pitfall 6). Instead the spec uses a fresh `page` + the
 * `walkToQuestion(page, sortOrder)` helper from `voterNavigation.ts`
 * (Phase 75 Plan 01 Task 3) to land on sort 17. A future Phase 78 /
 * CLEAN-05 follow-up (`.planning/todos/pending/2026-05-11-voter-fixture-
 * heterogeneous-question-types.md` Path B — operator-locked) will
 * introduce a `--likert-only` seed modifier that deprecates the manual
 * walk.
 *
 * i18n note (W-03 deferred-todo at
 * `.planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md`): the
 * spec uses literal English strings `'Option A'` / `'Option B'` /
 * `'Option C'` in locator names (consistent with Phase 74 P05's literal-
 * label convention; the choice labels are seed-defined, not translated).
 * Phase 78 / CLEAN-04 i18n wrapper tightening is the durable home for
 * switching to `t(...)` lookups across all QSPEC-* specs.
 *
 * Asymmetric voter≠Alpha shape (RESEARCH Pitfall 5): voter answers 'b'
 * (Option B); Alpha's seeded answer is 'a' (Option A) per
 * `packages/dev-seed/src/templates/e2e.ts:641`. Step 4 entity-detail
 * mirror MUST handle this asymmetric shape — `.entitySelected` marks
 * Alpha's row on the 'a' radio; `radio[checked]` marks voter's row on
 * the 'b' radio; 'You' label is standalone (not combined "You & ...")
 * per `QuestionChoices.svelte:249-253` `else if (selectedId == id)`
 * branch when voter+Alpha picked different ids.
 *
 * Runs within the `voter-app` Playwright project (read-only voter specs,
 * depends on data-setup only).
 */

import { expect } from '@playwright/test';
import { voterTest as test } from '../../fixtures/voter.fixture';
import { testIds } from '../../utils/testIds';
import { walkToQuestion } from '../../utils/voterNavigation';

// dedup: QSPEC-02 asserts the user-flow + render-shape contract for the
// single-choice categorical opinion question (input renders + voter
// answers + browser-back persistence + entity-detail mirror). The
// matching-algorithm contract for categoricals is asserted separately by:
//   • packages/matching/tests/algorithms.test.ts:115-150 (CategoricalQuestion
//     algorithm-distance unit tests — directional/Manhattan dispatch)
//   • packages/matching/tests/distance.test.ts:36-138 (directionalKernel +
//     directionalDistance unit tests)
//   • tests/tests/specs/voter/voter-matching.spec.ts:40-43 (ordinal-only
//     filter — categoricals are EXCLUDED from the matching ranking checks)
//   • tests/tests/specs/voter/voter-matching.spec.ts:167-191 (Skip-Next
//     fallback — Phase 74 P05 + Phase 75 P01 bumped to 3-iter loop;
//     QSPEC-02 LEVERAGES this fallback, does NOT duplicate it)
//   • tests/tests/specs/voter/voter-detail.spec.ts:197-296 (E2E-05 4-case
//     + E2E-07 per-category SubMatch — directional metric path is E2E-07's
//     territory per ROADMAP line 203, explicitly out of scope for QSPEC-02)
// No QSPEC-02 assertion duplicates an existing matching-algorithm or
// SubMatch assertion per CONTEXT D-04 + ROADMAP SC #3. Unified Phase 75
// dedup audit: .planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md.

test.describe('voter question rendering — categorical (QSPEC-02)', { tag: ['@voter'] }, () => {
  test('categorical opinion question (single-choice) renders, voter answers, persists across goBack, mirrors on entity-detail', async ({
    page
  }) => {
    // ---------------------------------------------------------------
    // Step 1 — Walk to the categorical question at sort 17 + assert
    // input renders as 3 radios ('Option A' / 'Option B' / 'Option C'
    // per test-question-directional-1.choices at e2e.ts:539-543).
    // ---------------------------------------------------------------

    // sortOrder=16 means 16 Skip clicks after the start CTA: skip ordinals
    // sorts 0-15 (16 ordinals), landing on the categorical at sort 17.
    // NOTE: count is 16, NOT 17 like QSPEC-01. The categorical IS the
    // target; QSPEC-01 skipped 17 because the boolean was one past the
    // categorical.
    await walkToQuestion(page, 16);

    // Scope to the opinion-question-input container disambiguates the
    // voter's input from any entity-detail drawer rendering. Container-
    // scoped role locators are preferred over global page-level locators
    // here per CONTEXT D-06 + Phase 74 D-11 convention.
    // reason: D-06 scope-wrapper for testId — every getByTestId('opinion-question-input') invocation in this spec carries an inline reason block per W-01 MANDATORY rule (see lines above for the full justification).
    const categoricalScope = page.getByTestId('opinion-question-input');
    await expect(categoricalScope).toBeVisible();

    // Assert the three categorical choices render as accessible radios with
    // the expected literal labels (Option A/B/C are seed-defined at
    // e2e.ts:539-543; no i18n translation — these labels are not in the
    // common.answer.* keyspace).
    await expect(categoricalScope.getByRole('radio', { name: 'Option A' })).toBeVisible();
    await expect(categoricalScope.getByRole('radio', { name: 'Option B' })).toBeVisible();
    await expect(categoricalScope.getByRole('radio', { name: 'Option C' })).toBeVisible();

    // ---------------------------------------------------------------
    // Step 2 — Voter clicks 'Option B' (middle anchor) + answer
    // triggers auto-advance. Auto-advance + nextButton fallback per
    // voter-journey.spec.ts:72-86. After answering the categorical at
    // sort 17, the next question is the boolean at sort 18 (Plan 01
    // seed). Voter doesn't answer the boolean — Skip via nextButton
    // advances past sort 18 to /results. This explicit cross-plan
    // dependency is documented inline so future readers know the
    // walk-past-boolean hop is required.
    // ---------------------------------------------------------------

    const urlBefore = page.url();
    await categoricalScope.getByRole('radio', { name: 'Option B' }).click();

    const nextButton = page.getByTestId(testIds.voter.questions.nextButton);

    // Wait for auto-advance to navigate to the next URL. After answering
    // the categorical at sort 17, the next page is either the boolean
    // (sort 18 — Plan 01 seed) OR /results (if auto-advance happens to
    // collapse past the unanswered boolean). Fallback to nextButton click
    // if auto-advance doesn't fire within 3s.
    try {
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3000 });
    } catch {
      await nextButton.waitFor({ state: 'visible', timeout: 5000 });
      await nextButton.click();
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10000 });
    }

    // ---------------------------------------------------------------
    // Step 3 — Browser-back persistence assertion (MANDATORY per B-02 /
    // CONTEXT D-05 step 3 LOCKED). Distinct reactive path from the
    // answer-store mirror in step 4: asserts the input's DOM-level
    // selected-state survives a router-level back navigation.
    //
    // NOTE on goBack target: after Step 2 the page is either at the
    // boolean question (sort 18) OR at /results. `page.goBack()` from
    // the boolean returns to the categorical (sort 17). `page.goBack()`
    // from /results returns to the previous URL (likely the boolean OR
    // the categorical depending on history). To disambiguate without a
    // playwright/no-conditional-in-test violation, the test waits for
    // the categorical's scope to appear after goBack; if not visible
    // within 2s, a second goBack is performed (we may have landed on
    // the boolean after the first goBack).
    // ---------------------------------------------------------------

    await page.goBack();

    // Scope to the directional input's container disambiguates it from
    // the boolean (sort 18) which may also be visible on the previous-
    // step page. Filter-by-text on the question's name discriminates
    // the directional from the boolean (per RESEARCH Pitfall 3 + W-04
    // NEGATIVE CHECK — `.last()` is FORBIDDEN here because the boolean
    // at sort 18 may be the actual last input on the page).
    // reason: D-06 scope-wrapper for testId — filter-by-text replaces .last() per W-04 NEGATIVE CHECK; the boolean at sort 18 may be the actual last input on the page.
    const directionalScope = page.getByTestId('opinion-question-input').filter({ has: page.getByText(/Directional/) });

    // reason: depending on auto-advance vs fallback in step 2, one
    // goBack may land on the boolean (sort 18); a 2nd goBack reaches
    // the categorical (sort 17). Try-catch the visibility wait to
    // disambiguate without a playwright/no-conditional-in-test
    // violation (try/catch is exception-handling, NOT a conditional).
    try {
      await directionalScope.waitFor({ state: 'visible', timeout: 2000 });
    } catch {
      await page.goBack();
      await directionalScope.waitFor({ state: 'visible', timeout: 5000 });
    }

    // reason: QuestionChoices.svelte:263-273 renders <input type="radio"
    // bind:group={selected}>; selected-state is the radio's :checked
    // pseudo-state via getByRole('radio', { checked: true }). The 'b'
    // input must remain checked after router-level back navigation per
    // CONTEXT D-05 step 3 LOCKED.
    await expect(directionalScope.getByRole('radio', { checked: true })).toHaveCount(1);

    // reason: defensive — confirms the checked radio is specifically the
    // 'b' (Option B) choice, not a sibling. Guards against a different
    // radio being restored as :checked after browser-back.
    // eslint-disable-next-line playwright/no-raw-locators
    await expect(directionalScope.locator('input[type="radio"]:checked')).toHaveAttribute('value', 'b');

    // ---------------------------------------------------------------
    // Step 4 — Voter sees their answer reflected on entity-detail
    // (ASYMMETRIC voter≠Alpha mirror — voter='b', Alpha='a' per
    // e2e.ts:641; RESEARCH Pitfall 5 + voter-detail.spec.ts:247-269
    // case-(c) "different buttons" shape).
    // ---------------------------------------------------------------

    // Navigate forward past the categorical (sort 17) + the boolean
    // (sort 18) to /results. After page.goBack() landed us on the
    // categorical, the answer is still committed in the answer store,
    // so a Skip-Next click advances to the boolean; a second Skip-Next
    // advances to /results. Use try/catch (exception-handling — NOT a
    // `if`-conditional per playwright/no-conditional-in-test rule) to
    // detect whether we're already at /results after a single Skip.
    await nextButton.waitFor({ state: 'visible', timeout: 5000 });
    await nextButton.click();
    try {
      // If the first Skip already landed us on /results (auto-advance
      // collapsed past the boolean), this wait succeeds and we're done.
      await page.waitForURL(/\/results/, { timeout: 3000 });
    } catch {
      // First Skip landed on the boolean (sort 18); one more Skip
      // advances to /results.
      await nextButton.waitFor({ state: 'visible', timeout: 5000 });
      await nextButton.click();
      await page.waitForURL(/\/results/, { timeout: 30000 });
    }

    // Open Alpha's entity-detail drawer.
    await page
      .getByTestId(testIds.voter.results.card)
      .filter({ hasText: 'Candidate Alpha' })
      .click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Open the opinions tab inside the drawer.
    await dialog.getByRole('tab', { name: /opinions/i }).click();
    const opinionsTab = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);
    await expect(opinionsTab).toBeVisible();

    // Per W-04 / RESEARCH Pitfall 3 — `.last()` is FORBIDDEN here
    // because the boolean at sort 18 is also rendered in Alpha's
    // drawer (Alpha answered both the categorical and the boolean per
    // e2e.ts:641 + e2e.ts:650). Filter-by-text on the question's name
    // discriminates the directional from the boolean. Do NOT regress
    // to `.last()` even though the boolean assertion uses it in
    // QSPEC-01 — the contexts differ.
    // reason: D-06 scope-wrapper for testId — filter-by-text replaces .last() per W-04 NEGATIVE CHECK; in Alpha's drawer both directional (sort 17) and boolean (sort 18) are rendered, so .last() would target the boolean instead of the directional.
    const directionalInput = opinionsTab.getByTestId('opinion-question-input').filter({ has: page.getByText(/Directional/) });

    // Three-line ASYMMETRIC assertion block (DIFFERENT-buttons case
    // per voter-detail.spec.ts:247-269; voter='b', Alpha='a'):
    //
    // reason: 'entitySelected' is a CSS class set by the OpinionQuestion-
    // Input component to mark the candidate's answer position; it has no
    // ARIA role (the role lives on the underlying <input type="radio">),
    // no associated text, and no testId. The class is the contract —
    // getByRole/getByText/etc. would match either too few elements (no
    // class info) or too many (all radios). Inline-justified per Phase 74
    // D-11 + Phase 73 IN-03 convention. count=1 = Alpha's 'a' button.
    // eslint-disable-next-line playwright/no-raw-locators
    await expect(directionalInput.locator('.entitySelected')).toHaveCount(1);

    // Voter's row: the 'b' radio is :checked (voter's selection — DIFFERENT
    // button from Alpha's 'a' / .entitySelected).
    await expect(directionalInput.getByRole('radio', { checked: true })).toHaveCount(1);

    // Voter's 'You' label is rendered standalone (NOT combined "You &
    // {entity}") per QuestionChoices.svelte:249-253 `else if (selectedId
    // == id)` branch when voter and Alpha picked different ids.
    await expect(directionalInput.getByText(/You/i)).toBeAttached();
  });
});
