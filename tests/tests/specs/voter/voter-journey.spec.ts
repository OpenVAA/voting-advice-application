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

// Disable tracing for this serial spec to avoid ENOENT errors with
// shared browser contexts. Playwright's trace writer has issues when
// a manually created page spans multiple serial tests in one worker.
test.use({ trace: 'off' });

test.describe('voter journey', () => {
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
    await expect(electionsList).not.toBeVisible();

    // Assert constituency selection page is NOT shown
    const constituenciesList = sharedPage.getByTestId(testIds.voter.constituencies.list);
    await expect(constituenciesList).not.toBeVisible();

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
    await expect(categoryIntro).not.toBeVisible();

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

    // --- Questions 4 through second-to-last: Answer normally with auto-advance ---
    // The dataset has both default (8) and voter-specific (8) Likert questions = 16 total.
    // We've handled Q1-Q3 above with navigation exercises (3 questions answered so far,
    // currently on Q4). We now answer Q4 through Q(N-1) in a loop, where N is the total
    // number of opinion questions. We detect the last question by checking if the next
    // button's text changes to the results label after answering.
    let onResultsPage = false;
    let questionCount = 3; // Already answered 3 (Q1, Q2, Q3)

    while (!onResultsPage) {
      questionCount++;
      const urlBefore = sharedPage.url();

      // Answer the current question
      await answerOption.nth(4).click();

      // Check if auto-advance navigated us away (non-last question) or if we
      // need to click the results button (last question).
      // After answering the last question, the next button label changes to
      // "Results" and the page does NOT auto-advance to results -- it stays
      // on the same question URL.
      try {
        // Wait briefly for a potential auto-advance
        await sharedPage.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3000 });

        // URL changed -- check if we landed on results
        if (sharedPage.url().includes('/results')) {
          onResultsPage = true;
        }
        // Otherwise, we auto-advanced to the next question; continue loop
      } catch {
        // URL did NOT change within timeout -- this means we're on the last
        // question and auto-advance navigated to results, or the button is
        // now showing "Results" and we need to click it.
        // Try clicking the next/results button
        await nextButton.waitFor({ state: 'visible' });
        await nextButton.click();
        await expect(sharedPage).toHaveURL(/\/results/, { timeout: 10000 });
        onResultsPage = true;
      }
    }

    // --- Verify results page ---
    const resultsList = sharedPage.getByTestId(testIds.voter.results.list);
    await expect(resultsList).toBeVisible({ timeout: 10000 });

    // Verify we answered a reasonable number of questions (should be 16 in current dataset)
    expect(questionCount).toBeGreaterThanOrEqual(8);
  });
});
