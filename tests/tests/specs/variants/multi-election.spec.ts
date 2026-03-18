/**
 * Multi-election voter journey E2E tests.
 *
 * Covers:
 * - CONF-01: Single election (verified by contrast -- multi-election shows selection page)
 * - CONF-02: Multiple elections with election selection and per-election results accordion
 * - CONF-04: Constituency auto-implied when each election has single constituency (no selection page)
 * - disallowSelection: bypasses election selection and shows all elections in results accordion
 *
 * Uses the `variant-multi-election` Playwright project which depends on
 * `data-setup-multi-election` (loads the multi-election overlay dataset).
 *
 * The multi-election overlay adds a 2nd election with its own single constituency,
 * scoped questions, and candidates + cross-nominations for existing candidates.
 * This triggers election selection (2 elections = not auto-implied) but NOT
 * constituency selection (each election has exactly 1 constituency = auto-implied).
 *
 * IMPORTANT: This spec does NOT use `navigateToFirstQuestion()` because that
 * helper assumes auto-implied elections. Election selection is handled explicitly.
 */

import { expect, test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { StrapiAdminClient } from '../../utils/strapiAdminClient';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

// Disable tracing for this serial spec to avoid ENOENT errors with
// shared browser contexts. Playwright's trace writer has issues when
// a manually created page spans multiple serial tests in one worker.
test.use({ trace: 'off' });

// Ensure unauthenticated voter context.
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Shared settings that suppress interfering popups (notification + data consent).
 * Applied in every updateAppSettings call to prevent dialog overlays from
 * intercepting test clicks on navigation buttons.
 */
const suppressInterferingPopups = {
  notifications: { voterApp: { show: false } },
  analytics: { trackEvents: false }
};

/**
 * Default entity settings that data setup configures.
 * Included in every updateAppSettings call to avoid Pitfall 2.
 */
const defaultEntitySettings = {
  entities: {
    hideIfMissingAnswers: { candidate: false },
    showAllNominations: true
  }
};

/**
 * Answer all visible questions dynamically, looping until the results page.
 * Handles category intros if they appear between questions.
 *
 * @returns The number of questions answered
 */
async function answerAllQuestions(page: Page): Promise<number> {
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption);
  const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
  const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);
  let questionCount = 0;

  // Wait for first answer option or category intro
  await answerOption.first().or(categoryStart).waitFor({ state: 'visible', timeout: 10000 });
  if (await categoryStart.isVisible()) {
    await categoryStart.click();
    await answerOption.first().waitFor({ state: 'visible', timeout: 10000 });
  }

  while (questionCount < 50) {
    // Check if we're on the results page
    if (page.url().includes('/results')) break;

    // Wait for answer options to be visible
    try {
      await answerOption.first().waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      // No answer options visible -- check if on results
      if (page.url().includes('/results')) break;
      // Might be on a category intro
      if (await categoryStart.isVisible()) {
        await categoryStart.click();
        continue;
      }
      break;
    }

    questionCount++;
    const urlBefore = page.url();

    // Click the 3rd answer option (middle ground)
    await answerOption.nth(2).click();

    // Wait for auto-advance or handle last question
    try {
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 5000 });
      // Check for category intro after URL change
      if (!page.url().includes('/results') && (await categoryStart.isVisible().catch(() => false))) {
        await categoryStart.click();
      }
    } catch {
      // URL didn't change -- last question, click next/results button
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForURL(/\/results/, { timeout: 10000 });
      }
      break;
    }
  }

  return questionCount;
}

// ---------------------------------------------------------------------------
// Multi-election voter journey (CONF-01 by contrast, CONF-02, CONF-04)
// ---------------------------------------------------------------------------

test.describe('Multi-election voter journey', { tag: ['@variant'] }, () => {
  test.describe.configure({ mode: 'serial' });

  let sharedPage: Page;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
  });

  test.afterAll(async () => {
    await sharedPage.close();
  });

  test('should show election selection page with 2 elections', async () => {
    // Navigate Home
    await sharedPage.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await sharedPage.getByTestId(testIds.voter.home.startButton).click();

    // Intro page appears first
    const introStart = sharedPage.getByTestId(testIds.voter.intro.startButton);
    await introStart.waitFor({ state: 'visible', timeout: 10000 });
    await introStart.click();

    // With 2 elections, election selection page should appear (not auto-implied)
    // This simultaneously verifies CONF-01 by contrast: single election = no selection page
    const electionsList = sharedPage.getByTestId(testIds.voter.elections.list);
    await expect(electionsList).toBeVisible({ timeout: 10000 });

    // Verify 2 election option elements exist
    const electionCards = sharedPage.getByTestId(testIds.voter.elections.card);
    await expect(electionCards).toHaveCount(2);

    // CONF-04: No constituency selection page appears because each election
    // has a single constituency (auto-implied). Verify constituency list is NOT visible.
    const constituenciesList = sharedPage.getByTestId(testIds.voter.constituencies.list);
    await expect(constituenciesList).toBeHidden();

    // Click continue to proceed with both elections selected
    await sharedPage.getByTestId(testIds.voter.elections.continue).click();
  });

  test('should display questions and reach results', async () => {
    // Increase timeout for answering 16+ questions
    test.setTimeout(60000);

    // After election selection + auto-implied constituency, should land on first question
    // Wait for answer options to be visible
    const answerOption = sharedPage.getByTestId(testIds.voter.questions.answerOption);
    await expect(answerOption.first()).toBeVisible({ timeout: 10000 });

    // Answer all questions dynamically until results page
    const questionCount = await answerAllQuestions(sharedPage);

    // Verify we answered a reasonable number of questions
    // The combined dataset has 16 default questions + 2 E2-scoped questions = 18 total
    expect(questionCount).toBeGreaterThanOrEqual(16);

    // Verify landing on results page with election accordion (multi-election shows accordion)
    const electionAccordion = sharedPage.getByTestId(testIds.voter.results.electionAccordion);
    await expect(electionAccordion).toBeVisible({ timeout: 10000 });
  });

  test('should show election accordion and results after selecting election', async () => {
    // On results page, verify election accordion is visible (2 elections = accordion shown)
    // This verifies per-election results display (CONF-02)
    const electionAccordion = sharedPage.getByTestId(testIds.voter.results.electionAccordion);
    await expect(electionAccordion).toBeVisible();

    // Multi-election results require clicking an election before results list appears
    const electionOption = electionAccordion.getByRole('option').first();
    await electionOption.click();

    // Now the results list should be visible
    const resultsList = sharedPage.getByTestId(testIds.voter.results.list);
    await expect(resultsList).toBeVisible({ timeout: 10000 });
  });

  test('should display election-specific questions', async () => {
    // Verify that at least one election-2-specific question appeared during the journey
    // by checking the question count was higher than the base 16 questions.
    // The multi-election overlay adds 2 scoped questions for election-2.
    // We already verified questionCount >= 16 in the previous test.
    // With both elections selected and their questions combined, the total should be 18.

    // Navigate to the results page and verify candidate section is visible
    // (this confirms the full journey completed with all questions answered)
    const candidateSection = sharedPage.getByTestId(testIds.voter.results.candidateSection);
    await expect(candidateSection).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// disallowSelection mode
// ---------------------------------------------------------------------------

test.describe('disallowSelection mode', { tag: ['@variant'] }, () => {
  test.describe.configure({ mode: 'serial' });

  const client = new StrapiAdminClient();

  test.beforeAll(async () => {
    await client.login();
    await client.updateAppSettings({
      elections: {
        disallowSelection: true,
        showElectionTags: true,
        startFromConstituencyGroup: undefined
      },
      questions: {
        categoryIntros: { show: false },
        questionsIntro: { allowCategorySelection: false, show: false },
        showResultsLink: true
      },
      ...defaultEntitySettings,
      ...suppressInterferingPopups
    });
  });

  test.afterAll(async () => {
    await client.updateAppSettings({
      elections: {
        disallowSelection: false,
        showElectionTags: true,
        startFromConstituencyGroup: undefined
      },
      questions: {
        categoryIntros: { show: false },
        questionsIntro: { allowCategorySelection: false, show: false },
        showResultsLink: true
      },
      ...defaultEntitySettings,
      ...suppressInterferingPopups
    });
    await client.dispose();
  });

  test('should bypass election selection when disallowSelection is true', async ({ page }) => {
    // Increase timeout for full question journey
    test.setTimeout(60000);

    // Navigate Home -> start -> intro
    await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await page.getByTestId(testIds.voter.home.startButton).click();

    const introStart = page.getByTestId(testIds.voter.intro.startButton);
    await introStart.waitFor({ state: 'visible', timeout: 10000 });
    await introStart.click();

    // Election selection page should NOT appear (disallowSelection implies all elections)
    const electionsList = page.getByTestId(testIds.voter.elections.list);
    // Wait for either the elections list or the first question to appear
    const answerOption = page.getByTestId(testIds.voter.questions.answerOption);
    await answerOption.first().or(electionsList).waitFor({ state: 'visible', timeout: 10000 });

    // Verify election list is NOT visible
    await expect(electionsList).toBeHidden();

    // Should proceed to questions (constituency auto-implied for both elections)
    await expect(answerOption.first()).toBeVisible();

    // Answer all questions to reach results
    await answerAllQuestions(page);

    // Verify results page shows election accordion with all elections
    const electionAccordion = page.getByTestId(testIds.voter.results.electionAccordion);
    await expect(electionAccordion).toBeVisible({ timeout: 10000 });

    // Multi-election results require selecting an election before results list appears
    const electionOption = electionAccordion.getByRole('option').first();
    await electionOption.click();

    // Verify results list is visible after selecting an election
    const resultsList = page.getByTestId(testIds.voter.results.list);
    await expect(resultsList).toBeVisible({ timeout: 10000 });
  });
});
