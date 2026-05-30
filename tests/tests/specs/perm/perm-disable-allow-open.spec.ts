/**
 * perm-disable-allow-open — Phase 91 Plan 02 (TIR6:121-142, A9).
 *
 * Phase 91 Plan 05 (CR-02 closure): voter-side walk delegated to
 * voter-mega.fixture.ts answeredVoterPage. Candidate-side block unchanged
 * — storage-state minted by refactored perm-disable-allow-open.setup.ts
 * (Task 3, CR-01 closure).
 *
 * Per D-91-PD-04 (TIR6:122 typo resolution): cand-1 authors info text on
 * BOTH Q1 + Q2 answers. customData.allowOpen=true on Q1 keeps the info
 * surfaces visible (candidate-side comment input + voter-side
 * QuestionOpenAnswer wrapper). customData.allowOpen=false on Q2 SUPPRESSES
 * rendering on BOTH surfaces:
 *
 *   Candidate side: gate at +page.svelte:294 is `{#if customData.allowOpen}`
 *     → Q2's `false` skips the <Input data-testid="candidate-questions-
 *     comment" /> entirely (toHaveCount(0)).
 *   Voter side: gate at EntityOpinions.svelte:78 is
 *     `{#if answer?.info && customData?.allowOpen !== false}` → Q2's
 *     `false` skips the QuestionOpenAnswer (no entity-opinion-open-answer
 *     for that question).
 *
 * Rigidity contract: no soft assertions, no .catch fallbacks, testid-only.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-6.md:121-142.
 */

import { expect, test } from '@playwright/test';
import path from 'path';
import { voterMegaTest as voterTest } from '../../fixtures/voter-mega.fixture';
import { TESTS_DIR } from '../../utils/testsDir';
import { testIds } from '../../utils/testIds';

const PREFIX = 'e2e-perm-no-allowopen-';
const STORAGE_STATE_PATH = path.join(
  TESTS_DIR,
  '../playwright/.auth/perm-disable-allow-open.json'
);

test.describe('perm-disable-allow-open (candidate side — authenticated)', () => {
  test.use({ storageState: STORAGE_STATE_PATH });

  test('Q1 allowOpen=true: candidate-questions-comment visible', async ({ page }) => {
    await page.goto(`/en/candidate/questions/${PREFIX}qu-opin-l5-1`);
    await expect(page.getByTestId(testIds.candidate.questions.commentInput)).toBeVisible();
  });

  test('Q2 allowOpen=false: candidate-questions-comment absent', async ({ page }) => {
    await page.goto(`/en/candidate/questions/${PREFIX}qu-opin-l5-2`);
    await expect(page.getByTestId(testIds.candidate.questions.commentInput)).toHaveCount(0);
  });
});

voterTest.describe('perm-disable-allow-open (voter side — unauthenticated)', () => {
  voterTest(
    'voter detail drawer: Q1 info visible (entity-opinion-open-answer) AND Q2 info hidden',
    async ({ answeredVoterPage }) => {
      // Click the only candidate card ([CA1A]) to open the detail drawer.
      const card = answeredVoterPage
        .getByTestId(testIds.voter.results.card)
        .filter({ hasText: /\[CA1A\]/ })
        .first();
      await expect(card).toBeVisible();
      await card.click();

      // Detail drawer opens — assert opinions tab + scoped opinionOpenAnswer
      // assertions inside the detail container.
      const detail = answeredVoterPage.getByTestId(testIds.voter.entityDetail.container);
      await expect(detail).toBeVisible();

      // Q1 info from cand-1 is rendered (allowOpen=true).
      const openAnswers = detail.getByTestId(testIds.voter.entityDetail.opinionOpenAnswer);
      await expect(openAnswers).toHaveCount(1);
      await expect(openAnswers.first()).toContainText(/\[Q1 info from cand-1\]/);

      // Q2 info — verify the seeded `[Q2 info from cand-1]` marker is NOT
      // present anywhere in the detail (the open-answer wrapper is suppressed).
      await expect(
        detail.getByTestId(testIds.voter.entityDetail.opinionOpenAnswer).filter({
          hasText: /\[Q2 info from cand-1\]/
        })
      ).toHaveCount(0);
    }
  );
});
