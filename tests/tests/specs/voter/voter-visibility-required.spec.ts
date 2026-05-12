/**
 * Voter visibility (hidden question) E2E tests — Phase 77 SETTINGS-03
 * voter-hidden cell.
 *
 * --- Surface under test ---
 *
 * `voterContext.svelte.ts:215-230` applies a `.filter((q) =>
 * !(q.customData as CustomData['Question'])?.hidden)` to both
 * `_infoQuestions` (line 221) and `_opinionQuestions` (line 226). When a
 * question's `customData.hidden` is `true`, the voter app excludes it from
 * the question flow AND from the entity-detail drawer's opinions list.
 *
 * --- Variant + fixture layout ---
 *
 * Variant: this spec runs under the `variant-hidden-required-voter`
 * Playwright project, which loads the `variant-hidden-required` dataset
 * overlay:
 *   - `customData.hidden: true` on `test-voter-q-8` (sort 16; opinion
 *     question not used by voter-matching invariants in `voter-matching.spec.ts`
 *     since those run under the separate `voter-app` project).
 *   - `customData.required: true` on `test-question-displayname` (used by
 *     the sibling candidate-required spec under
 *     `variant-hidden-required-candidate`).
 *   - Alpha's `test-question-displayname` answer deleted (for the
 *     candidate-required cell).
 *
 * Because `test-voter-q-8` is hidden, the voter app sees only 15 opinion
 * questions (8 `test-question-*` ordinals at sorts 0-7 + 7 `test-voter-q-*`
 * ordinals at sorts 8-15; `test-voter-q-8` at sort 16 is filtered out).
 * The `answeredVoterPage` fixture is invoked with `voterAnswerCount: 15`
 * so it completes the journey landing on /results without trying to answer
 * a 16th non-existent ordinal.
 *
 * --- LANDMINE-3 reframing ---
 *
 * SETTINGS-03 voter-required is a PRODUCT-GAP (no analog of
 * `unansweredRequiredInfoQuestions` exists on the voter context — only
 * `matching.minimumAnswers` gates voter-results CTA, covered by Phase 74
 * E2E-02). Captured as follow-up todo at
 * `.planning/todos/pending/2026-05-12-settings-03-voter-required-product-gap.md`.
 * This spec covers ONLY the voter-hidden cell; candidate-required lives in
 * the sibling `candidate-required-info.spec.ts`.
 *
 * --- Sentinel disjointness (LANDMINE-C inheritance) ---
 *
 * `test-voter-q-8`'s English name is `'Voter Test Question 8: Social'`
 * (per `e2e.ts:523`) — does not contain `'Alpha'` substring (case-insensitive),
 * disjoint from CAND-06 strict-mode lookup.
 */

import { expect } from '@playwright/test';
import { voterTest as test } from '../../fixtures/voter.fixture';
import { E2E_CANDIDATES, E2E_QUESTIONS } from '../../utils/e2eFixtureRefs';
import { testIds } from '../../utils/testIds';

// Hidden question seed reference. The variant overlay flips its
// `customData.hidden` to `true`; the base seed leaves it unset. We derive
// the English name from the base template so the assertion text stays in
// sync with future seed renames.
const hiddenQuestion = E2E_QUESTIONS.find((q) => q.external_id === 'test-voter-q-8')!;
const hiddenQuestionEn =
  ((hiddenQuestion?.name as { en?: string } | undefined)?.en ?? 'Voter Test Question 8: Social');

// Alpha candidate seed reference — used for opening the entity-detail drawer.
const alphaCandidate = E2E_CANDIDATES.find((c) => c.external_id === 'test-candidate-alpha')!;

// The variant overlay hides test-voter-q-8 from voter-side opinion
// questions, leaving 15 ordinals (8 `test-question-*` at sorts 0-7 + 7
// `test-voter-q-*` at sorts 8-15). Override the fixture's voterAnswerCount
// so the answer loop completes without trying to answer the hidden 16th.
test.use({ voterAnswerCount: 15 });

test.describe(
  'SETTINGS-03 — voter-side hidden question filter',
  { tag: ['@voter', '@variant', '@settings-03'] },
  () => {
    test('SETTINGS-03 hidden question absent from voter question flow', async ({ answeredVoterPage: page }) => {
      // The fixture walked the voter through Home → Intro → Elections →
      // Constituencies → Questions → Results. Throughout that walk the
      // hidden question's English name (`'Voter Test Question 8: Social'`)
      // MUST never have rendered, because the voter-context filter at
      // voterContext.svelte.ts:221+226 excludes hidden questions from
      // `_opinionQuestions`.
      //
      // At this point we're on /results. Assert the hidden question's text
      // is not visible on the current page (results list + filter dialog
      // surfaces).
      await expect(page.getByText(hiddenQuestionEn, { exact: true })).toHaveCount(0);

      // Stronger negative-presence anchor: the question's NAME would surface
      // in the entity-detail drawer's opinions tab IF it weren't filtered.
      // Open Alpha's drawer and confirm absence.
      await page
        .getByTestId(testIds.voter.results.card)
        .filter({ hasText: alphaCandidate.last_name! })
        .click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      await dialog.getByRole('tab', { name: /opinions/i }).click();
      const opinionsTab = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);
      await expect(opinionsTab).toBeVisible();

      // Assertion 1: the hidden question's English text is NOT rendered in
      // the opinions tab. The voter-context filter at voterContext.svelte.ts:226
      // excludes `customData.hidden` questions from `_opinionQuestions`, so
      // EntityOpinions.svelte iterates over the filtered list and never
      // renders this question's row.
      await expect(opinionsTab.getByText(hiddenQuestionEn, { exact: true })).toHaveCount(0);

      // Assertion 2: positive control — at least ONE non-hidden opinion
      // question DOES render in the opinions tab (proving the tab loaded
      // and the negative-presence is a real filter effect, not a load
      // failure). `test-voter-q-1`'s English name is
      // `'Voter Test Question 1: Economy'` (per `e2e.ts:445`).
      //
      // The question name renders TWICE per row in EntityOpinions.svelte
      // (once as the visible `<h3>` heading + once as a `<legend
      // class="sr-only">` for screen readers — see QuestionHeading.svelte).
      // Use count >= 1 (positive presence) instead of toBeVisible (which
      // is strict-mode-sensitive when the locator matches multiple
      // elements). At least one rendered = positive control satisfied.
      const visibleQuestion = E2E_QUESTIONS.find((q) => q.external_id === 'test-voter-q-1');
      const visibleQuestionEn = (visibleQuestion?.name as { en?: string } | undefined)?.en;
      expect(visibleQuestionEn, 'test-voter-q-1 must carry an English name in the seed').toBeTruthy();
      const visibleQuestionCount = await opinionsTab.getByText(visibleQuestionEn!, { exact: true }).count();
      expect(
        visibleQuestionCount,
        'test-voter-q-1 must render at least once in the opinions tab as a positive control'
      ).toBeGreaterThanOrEqual(1);
    });
  }
);
