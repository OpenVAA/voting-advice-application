/**
 * Voter question rendering — boolean opinion question (QSPEC-01).
 *
 * Asserts the v2.6 Phase 61 BooleanQuestion render branch at
 * `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte:100-111`
 * end-to-end via Playwright. Per CONTEXT D-05 the spec follows a 4-step
 * contract (B-02 revision: step 3 is the MANDATORY browser-back persistence
 * assertion — distinct reactive path from the answer-store mirror):
 *   (1) input renders as 2 radios with i18n labels 'No' / 'Yes';
 *   (2) voter clicks 'Yes' → auto-advance to next question or /results;
 *   (3) `page.goBack()` returns to the boolean question and the previously
 *       chosen radio still shows `:checked` state via
 *       `getByRole('radio', { checked: true })` (per QuestionChoices.svelte:
 *       263-273 native `<input type="radio" bind:group={selected}>`);
 *   (4) entity-detail mirror — Alpha's drawer shows BOTH the voter's row
 *       AND Alpha's row marked (case (a) "both answered same value true"
 *       per QuestionChoices.svelte:245-253 display-label branch).
 *
 * Fixture choice: this spec does NOT use the `answeredVoterPage` fixture
 * because that fixture clicks Likert `.nth(4)` per `voter.fixture.ts:60`,
 * which is out of range for the boolean question's 2 radios (RESEARCH
 * Pitfall 6). Instead the spec uses a fresh `page` + the new
 * `walkToQuestion(page, sortOrder)` helper from `voterNavigation.ts`
 * (Phase 75 Plan 01 Task 3) to land on sort 18. A future Phase 78 /
 * CLEAN-05 follow-up (`.planning/todos/pending/2026-05-11-voter-fixture-
 * heterogeneous-question-types.md` Path B — operator-locked) will
 * introduce a `--likert-only` seed modifier that deprecates the manual
 * walk.
 *
 * i18n note (W-03 deferred-todo at
 * `.planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md`): the
 * spec uses literal English strings `'No'` / `'Yes'` in
 * `getByRole('radio', { name })` locators (consistent with Phase 74 P05
 * `'Option A/B/C'` literal-label convention; specs run in default `en`
 * locale). Phase 78 / CLEAN-04 i18n wrapper tightening is the durable
 * home for switching to `t('common.answer.{no,yes}')` lookups across all
 * QSPEC-* specs.
 *
 * Runs within the `voter-app` Playwright project (read-only voter specs,
 * depends on data-setup only).
 */

import { expect } from '@playwright/test';
import { voterTest as test } from '../../fixtures/voter.fixture';
import { testIds } from '../../utils/testIds';
import { walkToQuestion } from '../../utils/voterNavigation';

// dedup: QSPEC-01 asserts the user-flow + render-shape contract for the
// boolean opinion question (input renders + voter answers + browser-back
// persistence + entity-detail mirror). The matching-algorithm contract
// for booleans is asserted separately by:
//   • packages/matching/src/**/*.test.ts (algorithm-distance unit tests
//     for BooleanQuestion via the `isBooleanQuestion` dispatch)
//   • tests/tests/specs/voter/voter-matching.spec.ts:40-43 (ordinal-only
//     filter — booleans are EXCLUDED from the matching ranking checks)
//   • tests/tests/specs/voter/voter-matching.spec.ts:167-177 (Skip-Next
//     fallback — Phase 74 P05 + Phase 75 P01 Option A bumped to 2-iter
//     loop; QSPEC-01 LEVERAGES this fallback, does NOT duplicate it)
// No QSPEC-01 assertion duplicates an existing matching-algorithm
// assertion per CONTEXT D-04 + ROADMAP SC #3.

test.describe('voter question rendering — boolean (QSPEC-01)', { tag: ['@voter'] }, () => {
  test('boolean opinion question renders, voter answers, persists across goBack, mirrors on entity-detail', async ({
    page
  }) => {
    // ---------------------------------------------------------------
    // Step 1 — Walk to the boolean question at sort 18 + assert input
    // renders as 2 radios ('No' / 'Yes' per booleanChoices synthesized
    // at OpinionQuestionInput.svelte:72-75).
    // ---------------------------------------------------------------

    // sortOrder=17 means 17 Skip clicks after the start CTA: skip ordinals
    // sorts 0-15 (16 ordinals) + 1 categorical at sort 17, landing on the
    // boolean at sort 18.
    await walkToQuestion(page, 17);

    // reason: scope to the opinion-question-input container disambiguates
    // the voter's input from any entity-detail drawer rendering. Container-
    // scoped role locators are preferred over global page-level locators
    // here per CONTEXT D-06 + Phase 74 D-11 convention.
    const booleanScope = page.getByTestId('opinion-question-input');
    await expect(booleanScope).toBeVisible();

    // Assert the two boolean choices render as accessible radios with the
    // expected i18n labels (English literal per W-03 deferred-todo).
    await expect(booleanScope.getByRole('radio', { name: 'No' })).toBeVisible();
    await expect(booleanScope.getByRole('radio', { name: 'Yes' })).toBeVisible();

    // ---------------------------------------------------------------
    // Step 2 — Voter clicks 'Yes' + answer triggers auto-advance.
    // Auto-advance + nextButton fallback per voter-journey.spec.ts:72-86.
    // ---------------------------------------------------------------

    const urlBefore = page.url();
    await booleanScope.getByRole('radio', { name: 'Yes' }).click();

    const nextButton = page.getByTestId(testIds.voter.questions.nextButton);

    // Wait for auto-advance to navigate to the next URL (either the next
    // question or /results — boolean is sort 18, the last opinion question,
    // so auto-advance lands on /results). Fallback to nextButton click if
    // auto-advance doesn't fire within 3s.
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
    // ---------------------------------------------------------------

    // Router-level back from /results (or the next question) returns to
    // the boolean question's URL.
    await page.goBack();

    // reason: scope to the opinion-question-input container disambiguates
    // the voter's input from any entity-detail rendering. Required after
    // page.goBack() to wait for the boolean question's container to be
    // re-mounted in the DOM before asserting the selected-state.
    const booleanScopeBack = page.getByTestId('opinion-question-input');
    await expect(booleanScopeBack).toBeVisible();

    // reason: QuestionChoices.svelte:263-273 renders <input type="radio"
    // bind:group={selected}>; selected-state is the radio's :checked
    // pseudo-state via getByRole('radio', { checked: true }). The 'yes'
    // input must remain checked after router-level back navigation per
    // CONTEXT D-05 step 3 LOCKED.
    await expect(booleanScopeBack.getByRole('radio', { checked: true })).toHaveCount(1);

    // reason: defensive — confirms the checked radio is specifically the
    // 'yes' choice, not a sibling. Guards against a different radio being
    // restored as :checked after browser-back.
    // eslint-disable-next-line playwright/no-raw-locators
    await expect(booleanScopeBack.locator('input[type="radio"]:checked')).toHaveAttribute('value', 'yes');

    // ---------------------------------------------------------------
    // Step 4 — Voter sees their answer reflected on entity-detail
    // (mirror exemplar — mirrors voter-detail.spec.ts:97-113).
    // ---------------------------------------------------------------

    // Navigate forward past the boolean to /results. The answer is still
    // committed in the answer store (browser-back didn't unanswer it), so
    // a single Skip-Next click advances to /results.
    const urlBeforeForward = page.url();
    await nextButton.waitFor({ state: 'visible', timeout: 5000 });
    await nextButton.click();
    await page.waitForURL((url) => url.toString() !== urlBeforeForward, { timeout: 30000 });
    await page.waitForURL(/\/results/, { timeout: 30000 });

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

    // reason: 'opinion-question-input' is rendered once per opinion
    // question in Alpha's drawer. The boolean is sort 18 (last), so
    // .last() targets it. The categorical at sort 17 is the second-to-
    // last — Plan 02a's spec uses .filter({ has: ... }) for that case
    // (NOT .last()). Per RESEARCH §3 + Pitfall 3.
    const booleanInput = opinionsTab.getByTestId('opinion-question-input').last();

    // Three-line assertion block mirrors voter-detail.spec.ts:97-113.
    // reason: 'entitySelected' is a CSS class set by the OpinionQuestion-
    // Input component to mark the candidate's answer position; it has no
    // ARIA role (the role lives on the underlying <input type="radio">),
    // no associated text, and no testId. The class is the contract —
    // getByRole/getByText/etc. would match either too few elements (no
    // class info) or too many (all radios). Inline-justified per Phase 74
    // D-11 + Phase 73 IN-03 convention.
    // eslint-disable-next-line playwright/no-raw-locators
    await expect(booleanInput.locator('.entitySelected')).toHaveCount(1);

    // Voter's row: the 'Yes' radio is :checked + the 'You' label is shown.
    await expect(booleanInput.getByRole('radio', { checked: true })).toHaveCount(1);
    await expect(booleanInput.getByText(/You/i)).toBeAttached();
  });
});
