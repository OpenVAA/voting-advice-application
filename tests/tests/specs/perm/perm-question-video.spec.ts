/**
 * perm-question-video — question-media video toggles.
 *
 * Two slices:
 *
 *  1. VOTER visibility matrix (unauthenticated). The seed attaches `customData.video` (`VideoContent`) to the QUESTIONS q1/q3/q5 ONLY — NEVER on the category intros. The voter walks all 3 opinion categories and asserts the per-surface placement:
 *       q-cat 1 intro → no video; q1 → video; q2 → no video; q3 → video
 *       q-cat 2 intro → no video; q4 → no video
 *       q-cat 3 intro → no video; q5 → video
 *     The question video is rendered by the standalone `Video` component (NOT the hero <figure>); its root carries `class:hidden={!hasContent}`, so the reader asserts VISIBILITY-not-churn (toBeVisible/toBeHidden, never attach/detach — see video.fixture.ts:62-72).
 *
 *  2. CANDIDATE hideVideo slice (authenticated via the storage state minted in setup). With `candidateApp.questions.hideVideo=false` (template default) the q1 question video shows in the candidate editor; re-seeding `hideVideo=true` (perm-singleton re-seed via updateAppSettings) suppresses it for the candidate app — while voters still see it (the voter slice runs under the default hideVideo=false posture).
 *
 * ## Navigation note (reactive churn).
 * The questions-intro start and the category-intro start <a> re-render reactively from `voterCtx.selectedQuestionBlocks` (a post-hydration `$state`), so a plain `.click()` detaches mid-click. The category-intro <a> is followed via `dispatchEvent('click')` (churn-robust client-side nav — NOT page.goto, which is a cold/direct entry racing the dataRoot #version-bridge repopulation). The in-question `question-next` button is stable once the question paints.
 *
 * Rigidity contract: every assertion is HARD (no expect.soft, no try/catch, no .catch fallback); locators are testid-only via `testIds`.
 */

import { expect, test } from '@playwright/test';
import path from 'path';
import { createCandidateQuestionsOverviewPage } from '../../fixtures/candidate/candidateQuestionsOverviewPage.fixture';
import { createVideoReader } from '../../fixtures/shared/video.fixture';
import { walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';

const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-question-video.json');

test.describe('perm-question-video (voter visibility matrix — unauthenticated)', () => {
  test('video on q1/q3/q5 only; none on q2/q4 or any category intro', async ({ page }) => {
    const video = createVideoReader(page);
    const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);
    const answerOption = page.getByTestId(testIds.voter.questions.answerOption).first();
    const nextButton = page.getByTestId(testIds.voter.questions.nextButton);

    // walkUntilQuestionsIntro is bypass-tolerant: with questionsIntro.show=false (MINIMAL_BASE_APP_SETTINGS) the intro auto-redirects to the first category intro (categoryIntros.show=true here).
    await walkUntilQuestionsIntro(page);

    // --- q-cat 1 intro: no question video (seeded on questions only). ---
    await expect(categoryStart).toHaveAttribute('href', /\/questions\//, { timeout: 15_000 });
    await video.expectVideo(false);

    // Advance to q1 via churn-robust client-side nav (preserves the warm voter context so customData.video is present when the +layout loads it).
    await categoryStart.dispatchEvent('click');
    await expect(page).toHaveURL(/\/questions\/[^/]+(\?|$)/, { timeout: 15_000 });

    // --- q1: video present. ---
    await expect(answerOption).toBeVisible({ timeout: 15_000 });
    await video.expectVideo(true);

    // --- q2: no video. ---
    await nextButton.click();
    await expect(answerOption).toBeVisible({ timeout: 15_000 });
    await video.expectVideo(false);

    // --- q3: video present. ---
    await nextButton.click();
    await expect(answerOption).toBeVisible({ timeout: 15_000 });
    await video.expectVideo(true);

    // --- q-cat 2 intro: no video. Advancing past the last question of cat 1 surfaces the next category intro start link. ---
    await nextButton.click();
    await expect(categoryStart).toHaveAttribute('href', /\/questions\//, { timeout: 15_000 });
    await video.expectVideo(false);

    // --- q4: no video. ---
    await categoryStart.dispatchEvent('click');
    await expect(answerOption).toBeVisible({ timeout: 15_000 });
    await video.expectVideo(false);

    // --- q-cat 3 intro: no video. ---
    await nextButton.click();
    await expect(categoryStart).toHaveAttribute('href', /\/questions\//, { timeout: 15_000 });
    await video.expectVideo(false);

    // --- q5: video present. ---
    await categoryStart.dispatchEvent('click');
    await expect(answerOption).toBeVisible({ timeout: 15_000 });
    await video.expectVideo(true);
  });
});

// video renders on mobile.
//
// A SCOPED mobile-viewport sub-test — `test.use` is INSIDE its own describe so the 390×844 isMobile/hasTouch descriptor NEVER leaks to the sibling unauthenticated/authenticated slices above (a file-scope test.use would flip the whole spec to mobile). Asserts the per-question Video media still renders on the q1 question at the mobile viewport, reusing the voter visibility assertion adapted to mobile.
test.describe('mobile viewport smoke', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('q1 question video renders on mobile', async ({ page }) => {
    const video = createVideoReader(page);
    const consentDialog = page.getByRole('dialog');
    const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);
    const answerOption = page.getByTestId(testIds.voter.questions.answerOption).first();

    // walkUntilQuestionsIntro is bypass-tolerant; with questionsIntro.show=false it auto-redirects to the first category intro (categoryIntros.show=true).
    // The shared walk installs the DataConsentPopup auto-grant handler, so the mobile-only full-width consent modal is dismissed during the walk.
    await walkUntilQuestionsIntro(page);

    // The walk's consent handler has granted + closed the popup; assert it is gone BEFORE the churn-robust dispatchEvent nav (dispatchEvent bypasses actionability, so a lingering modal scrim would silently swallow the nav).
    await expect(consentDialog).toBeHidden({ timeout: 15_000 });

    // Advance from the q-cat 1 intro to q1 via churn-robust client-side nav.
    await expect(categoryStart).toHaveAttribute('href', /\/questions\//, { timeout: 15_000 });
    await categoryStart.dispatchEvent('click');
    await expect(page).toHaveURL(/\/questions\/[^/]+(\?|$)/, { timeout: 15_000 });

    // q1 carries customData.video — the Video element renders at mobile.
    await expect(answerOption).toBeVisible({ timeout: 15_000 });
    await video.expectVideo(true);
  });
});

test.describe('perm-question-video (candidate hideVideo slice — authenticated)', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: STORAGE_STATE_PATH });

  let client: SupabaseAdminClient;

  test.afterAll(async () => {
    // Restore the default posture so the perm-singleton is not left mutated for any downstream consumer of this seed.
    if (client) {
      await client.updateAppSettings({
        candidateApp: { questions: { hideVideo: false } }
      });
    }
  });

  test('hideVideo=false: candidate editor shows q1 video, hides q2 video', async ({ page }) => {
    const questionsOverview = createCandidateQuestionsOverviewPage(page);
    const video = createVideoReader(page);

    // q1 carries customData.video — the candidate editor shows it (hideVideo=false).
    await questionsOverview.goToPage();
    await questionsOverview.goToQuestion(/\[QU1-VIDEO\]/);
    await expect(page.getByTestId(testIds.candidate.questions.answerInput)).toBeVisible();
    await video.expectVideo(true);

    // q2 carries no video — the Video element is hidden (no content).
    await questionsOverview.goToPage();
    await questionsOverview.goToQuestion(/\[QU2-NOVIDEO\]/);
    await expect(page.getByTestId(testIds.candidate.questions.answerInput)).toBeVisible();
    await video.expectVideo(false);
  });

  test('hideVideo=true (re-seeded): q1 video suppressed for the candidate app', async ({ page }) => {
    // Perm-singleton re-seed: flip candidateApp.questions.hideVideo to true.
    client = new SupabaseAdminClient();
    await client.updateAppSettings({
      candidateApp: { questions: { hideVideo: true } }
    });

    const questionsOverview = createCandidateQuestionsOverviewPage(page);
    const video = createVideoReader(page);

    // q1 still carries customData.video, but hideVideo=true suppresses the Video surface in the candidate editor. Voters still see it (the voter slice runs under the default hideVideo=false posture).
    await questionsOverview.goToPage();
    await questionsOverview.goToQuestion(/\[QU1-VIDEO\]/);
    await expect(page.getByTestId(testIds.candidate.questions.answerInput)).toBeVisible();
    await video.expectVideo(false);
  });
});
