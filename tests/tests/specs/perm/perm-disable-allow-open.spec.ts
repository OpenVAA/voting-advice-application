/**
 * perm-disable-allow-open — Phase 91 Plan 02 (TIR6:121-142, A9).
 *
 * Phase 91 Plan 05 (CR-02 closure): voter-side walk delegated to
 * voter-mega.fixture.ts. Candidate-side block unchanged semantically —
 * storage-state minted by refactored perm-disable-allow-open.setup.ts
 * (Task 3, CR-01 closure).
 *
 * Voter-side fixture: this perm uses the `buildMinimal` (1-election +
 * 1-constituency) dataset, so the elections/constituencies pages
 * auto-imply and the /questions intro page is skipped. The voter-side test
 * therefore consumes `minimalVoterResultsPage` (robust race-based
 * `navigateToFirstQuestion` traversal) rather than `answeredVoterPage`
 * (which hard-waits for the skipped intro start button and would time out).
 *
 * Both describe blocks consume `voterMegaTest as test` (Option B from
 * Plan 91-05 §Task 6) to unify the file under a single test runner —
 * eliminates the `playwright/no-standalone-expect` lint failure that fires
 * when the lint rule's test-block detector does not recognise a non-`test`
 * runner inside an `expect()` call. The candidate-side tests do NOT
 * consume the `minimalVoterResultsPage` fixture, so the voter walk does
 * not run for those tests (Playwright fixtures are lazy — only created on
 * consumption).
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

import { expect } from '@playwright/test';
import path from 'path';
import { createCandidateQuestionsOverviewPage } from '../../fixtures/candidate/candidateQuestionsOverviewPage.fixture';
import { voterJourneyTest as test } from '../../fixtures/voter/voter-journey.fixture';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';

const STORAGE_STATE_PATH = path.join(
  TESTS_DIR,
  '../playwright/.auth/perm-disable-allow-open.json'
);

test.describe('perm-disable-allow-open (candidate side — authenticated)', () => {
  test.use({ storageState: STORAGE_STATE_PATH });

  // The per-question candidate URL is keyed on the INTERNAL question id, not
  // the seed external_id, so `page.goto('/candidate/questions/<external_id>')`
  // resolves to the "no questions for your constituency" empty state. Navigate
  // via the questions-overview instead (label-matched), mirroring the canonical
  // perm-answers-locked.spec.ts:67-76 pattern.
  test('Q1 allowOpen=true: candidate-questions-comment visible', async ({ page }) => {
    const overview = createCandidateQuestionsOverviewPage(page);
    await overview.goToPage();
    await overview.goToQuestion(/\[QU-OPIN-L5-1\]/);
    await expect(page.getByTestId(testIds.candidate.questions.commentInput)).toBeVisible();
  });

  test('Q2 allowOpen=false: candidate-questions-comment absent', async ({ page }) => {
    const overview = createCandidateQuestionsOverviewPage(page);
    await overview.goToPage();
    await overview.goToQuestion(/\[QU-OPIN-L5-2\]/);
    await expect(page.getByTestId(testIds.candidate.questions.commentInput)).toHaveCount(0);
  });
});

test.describe('perm-disable-allow-open (voter side — unauthenticated)', () => {
  test(
    'voter detail drawer: Q1 info visible (entity-opinion-open-answer) AND Q2 info hidden',
    async ({ minimalVoterResultsPage }) => {
      // Click the only candidate card ([CA1A]) to open the detail drawer.
      const card = minimalVoterResultsPage
        .getByTestId(testIds.voter.results.card)
        .filter({ hasText: /\[CA1A\]/ })
        .first();
      await expect(card).toBeVisible();
      await card.click();

      // Detail drawer opens as a role=dialog. The open-answer surface lives on
      // the OPINIONS tab (the drawer defaults to Basic Info), so switch tabs
      // first — the standard entity-detail opinions-tab pattern. (The
      // `voter-entity-detail` container testid does not exist in the source;
      // the real scoped surface is `voter-entity-detail-opinions`.)
      const dialog = minimalVoterResultsPage.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await dialog.getByRole('tab', { name: /opinions/i }).click();
      const detail = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);
      await expect(detail).toBeVisible();

      // Q1 info from cand-1 is rendered (allowOpen=true).
      const openAnswers = detail.getByTestId(testIds.voter.entityDetail.opinionOpenAnswer);
      await expect(openAnswers).toHaveCount(1);
      await expect(openAnswers.first()).toContainText(/\[Q1 info from cand-1\]/);

      // Q2 info — verify the seeded `[Q2 info from cand-1]` marker is NOT
      // present anywhere in the detail (the open-answer wrapper is suppressed
      // by the EntityOpinions.svelte:78 `customData?.allowOpen !== false` gate).
      await expect(
        detail.getByTestId(testIds.voter.entityDetail.opinionOpenAnswer).filter({
          hasText: /\[Q2 info from cand-1\]/
        })
      ).toHaveCount(0);
    }
  );
});
