/**
 * Voter journey E2E tests.
 *
 * Covers the full voter happy path from landing page through question
 * answering to results:
 * - VOTE-01: Home page loads with start button
 * - VOTE-02: Single election auto-implied (no selection page shown)
 * - VOTE-03: Single constituency auto-implied (no selection page shown)
 * - VOTE-04: Questions intro page with start button, no category intros
 * - VOTE-06: Answer all opinion questions with next/previous/skip navigation
 *
 * Uses serial mode because tests represent sequential flow steps and share
 * page state within the describe block.
 *
 * Runs within the `voter-app` project which depends only on data-setup
 * (no auth needed for voter tests).
 */

import { expect, test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

/**
 * Answer remaining opinion questions until the voter lands on /results,
 * returning the total questions answered (starts from `startCount`).
 *
 * Hoisted to module scope per RESEARCH §"Pattern 4" canonical 3 so the test
 * body itself contains no conditionals/try-catches (DETERM-03:
 * no-conditional-in-test + no-conditional-expect). The auto-advance vs
 * explicit-results-button race is dispatched deterministically by
 * `waitForURL(/\\/results/)` after the fallback click; the in-test
 * `if (page.url().includes('/results'))` race-mask (Pitfall 8) and the
 * try/catch-wrapped `expect(...).toHaveURL` (which had the assertion in a
 * catch branch) are both eliminated.
 */
async function answerRemainingUntilResults(
  page: Page,
  answerOptionIndex: number,
  startCount: number,
  maxSteps = 30
): Promise<number> {
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption);
  const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
  let count = startCount;

  for (let i = 0; i < maxSteps; i++) {
    count++;
    const urlBefore = page.url();

    // Phase 74 Plan 05 — the e2e dev-seed template now includes a
    // categorical opinion question (test-question-directional-1, sort 17)
    // with only 3 choices. When the voter reaches this question,
    // `answerOption.nth(4)` (index for "Fully agree" on Likert-5) is out of
    // range. Detect the choice count first and fall through to the Skip
    // path when the requested index is out of range — the question is
    // `required: false` so Skip→/results is a valid navigation from the
    // last question.
    //
    // reason: Phase 75 Plan 01 — the e2e seed now also includes
    // test-question-boolean-1 at sort 18 (QSPEC-01 anchor, type:'boolean',
    // 2 choices). For the Likert-5 voter (`answerOptionIndex=4`), BOTH the
    // categorical (sort 17, 3 choices) and the boolean (sort 18, 2 choices)
    // are out-of-range. Continue the outer for-loop (don't return early)
    // so the next iteration handles the next sort-18 boolean Skip and the
    // subsequent auto-advance lands on /results. The outer loop's maxSteps
    // cap absorbs additional Skip iterations.
    const choiceCount = await answerOption.count();
    if (answerOptionIndex >= choiceCount) {
      await nextButton.waitFor({ state: 'visible', timeout: 5000 });
      await nextButton.click();
      // Wait for navigation (either to the next question or to /results)
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10000 });
      if (page.url().includes('/results')) return count;
      continue;
    }

    await answerOption.nth(answerOptionIndex).click();

    // Wait for auto-advance OR fall back to next-button click. The fallback
    // path is the last-question case (button text becomes "Results" and there
    // is no auto-advance). Both paths converge on /results via waitForURL.
    try {
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3000 });
    } catch {
      await nextButton.waitFor({ state: 'visible', timeout: 5000 });
      await nextButton.click();
      await page.waitForURL(/\/results/, { timeout: 10000 });
      return count;
    }

    if (page.url().includes('/results')) return count;
  }
  return count;
}

test.describe('voter journey', { tag: ['@voter', '@smoke'] }, () => {
  test.describe.configure({ mode: 'serial' });

  let sharedPage: Page;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
  });

  test.afterAll(async () => {
    await sharedPage.close();
  });

  test('should load home page and display start button', async () => {
    await sharedPage.goto(buildRoute({ route: 'Home', locale: 'en' }));

    // Assert the start button is visible (VOTE-01)
    const startButton = sharedPage.getByTestId(testIds.voter.home.startButton);
    await expect(startButton).toBeVisible();

    // Click start
    await startButton.click();

    // Verify navigation away from home page
    await expect(sharedPage).not.toHaveURL(/^[^?]*\/en\/?$/);
  });

  test('should auto-imply election and constituency', async () => {
    // After clicking start on home, with single election and single constituency,
    // both selection pages should be skipped (VOTE-02, VOTE-03)

    // Assert election selection page is NOT shown
    const electionsList = sharedPage.getByTestId(testIds.voter.elections.list);
    await expect(electionsList).toBeHidden();

    // Assert constituency selection page is NOT shown
    const constituenciesList = sharedPage.getByTestId(testIds.voter.constituencies.list);
    await expect(constituenciesList).toBeHidden();

    // Assert we navigated directly to intro (URL contains /intro)
    await expect(sharedPage).toHaveURL(/\/intro/);
  });

  test('should show questions intro page with start button', async () => {
    // Assert we are on the intro page (VOTE-04)
    await expect(sharedPage).toHaveURL(/\/intro/);

    // Assert start button is visible
    const introStartButton = sharedPage.getByTestId(testIds.voter.intro.startButton);
    await expect(introStartButton).toBeVisible();

    // Assert category intro is NOT visible (disabled via app settings)
    const categoryIntro = sharedPage.getByTestId(testIds.voter.questions.categoryIntro);
    await expect(categoryIntro).toBeHidden();

    // Click start button
    await introStartButton.click();

    // Verify navigation to questions (URL contains /questions)
    await expect(sharedPage).toHaveURL(/\/questions/);
  });

  test('should answer all Likert questions with navigation', async () => {
    // Increase timeout for this test since it answers all opinion questions
    // with navigation exercises (previous, skip, re-answer).
    test.setTimeout(60000);

    // We should be on the questions page (VOTE-06)
    await expect(sharedPage).toHaveURL(/\/questions/);

    const answerOption = sharedPage.getByTestId(testIds.voter.questions.answerOption);
    const nextButton = sharedPage.getByTestId(testIds.voter.questions.nextButton);
    const previousButton = sharedPage.getByTestId(testIds.voter.questions.previousButton);

    // Helper: answer current question and wait for auto-advance
    async function answerAndWaitForAdvance(optionIndex: number): Promise<void> {
      const urlBefore = sharedPage.url();
      await answerOption.nth(optionIndex).click();
      await sharedPage.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10000 });
    }

    // Helper: click previous and wait for URL change
    async function goBackAndWait(): Promise<void> {
      const urlBefore = sharedPage.url();
      await previousButton.click();
      await sharedPage.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10000 });
    }

    // Helper: skip current question (click next without answering) and wait
    async function skipAndWait(): Promise<void> {
      const urlBefore = sharedPage.url();
      await nextButton.click();
      await sharedPage.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10000 });
    }

    // --- Question 1: Answer with "Fully agree" (index 4), wait for auto-advance to Q2 ---
    await answerAndWaitForAdvance(4);

    // --- Navigate back to Q1 using previous button ---
    await goBackAndWait();

    // --- Re-answer Q1 with a different option to trigger onChange (reselecting
    //     the same option fires onReselect which doesn't auto-advance) ---
    await answerAndWaitForAdvance(3);

    // --- Question 2: Answer normally, auto-advance to Q3 ---
    await answerAndWaitForAdvance(4);

    // --- Question 3: Skip (click next without answering), advance to Q4 ---
    await skipAndWait();

    // --- Go back to Q3, answer it, advance to Q4 ---
    await goBackAndWait();
    await answerAndWaitForAdvance(4);

    // --- Questions 4 through last: Answer normally with auto-advance ---
    // The dataset has both default (8) and voter-specific (8) Likert questions = 16 total.
    // We've handled Q1-Q3 above with navigation exercises (3 questions answered so far,
    // currently on Q4). The remaining-questions loop is hoisted to module scope
    // (`answerRemainingUntilResults`) so the test body itself satisfies
    // no-conditional-in-test + no-conditional-expect (DETERM-03).
    const questionCount = await answerRemainingUntilResults(sharedPage, 4, 3, 30);

    // --- Verify results page ---
    const resultsList = sharedPage.getByTestId(testIds.voter.results.list);
    await expect(resultsList).toBeVisible({ timeout: 10000 });

    // Verify we answered a reasonable number of questions (should be 16 in current dataset)
    expect(questionCount).toBeGreaterThanOrEqual(8);
  });
});
