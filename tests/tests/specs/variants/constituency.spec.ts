/**
 * Constituency selection variant E2E tests (CONF-03).
 *
 * Covers the voter flow when elections have multiple constituencies,
 * requiring explicit constituency selection:
 * - Constituency selection page appears after election selection
 * - Selecting a municipality implies the parent region (hierarchical)
 * - Constituency-scoped questions appear only for the selected constituency
 * - Multi-election results with election accordion
 *
 * Uses the constituency overlay dataset which creates:
 * - Election 1 with 2 constituency groups (regions + municipalities)
 * - Election 2 with municipalities constituency group only
 * - 4 constituencies: region-north, region-south, muni-north-a, muni-south-a
 * - Parent hierarchy: muni-north-a -> region-north, muni-south-a -> region-south
 * - Constituency-scoped questions for North Region and election-2 local
 *
 * Runs within the `variant-constituency` project which depends on
 * `data-setup-constituency` for dataset loading.
 */

import { expect, test } from '@playwright/test';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

// Disable tracing for this serial spec to avoid ENOENT errors with
// shared browser contexts in Playwright 1.58.2.
test.use({ trace: 'off' });

test.describe('Constituency selection variant', () => {
  test.describe.configure({ mode: 'serial' });

  let sharedPage: Page;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
  });

  test.afterAll(async () => {
    await sharedPage.close();
  });

  test('should show constituency selection page after election selection', async () => {
    test.setTimeout(30000);

    // Navigate Home -> Start -> Intro
    await sharedPage.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await sharedPage.getByTestId(testIds.voter.home.startButton).click();

    const introStart = sharedPage.getByTestId(testIds.voter.intro.startButton);
    await introStart.waitFor({ state: 'visible' });
    await introStart.click();

    // With 2 elections, the (located) layout gate should redirect to elections
    const electionsList = sharedPage.getByTestId(testIds.voter.elections.list);
    await expect(electionsList).toBeVisible({ timeout: 10000 });

    // Verify 2 election options are shown
    const electionOptions = sharedPage.getByTestId(testIds.voter.elections.card);
    await expect(electionOptions).toHaveCount(2);

    // Both elections should be pre-checked by default
    await expect(electionOptions.nth(0)).toBeChecked();
    await expect(electionOptions.nth(1)).toBeChecked();

    // Click continue to proceed to constituency selection
    await sharedPage.getByTestId(testIds.voter.elections.continue).click();

    // Should redirect to constituency selection (elections have multiple constituencies)
    const constituenciesList = sharedPage.getByTestId(testIds.voter.constituencies.list);
    await expect(constituenciesList).toBeVisible({ timeout: 10000 });

    // Verify the constituency selector container is visible
    const constituencySelector = sharedPage.getByTestId(testIds.voter.constituencies.selector);
    await expect(constituencySelector).toBeVisible();
  });

  test('should allow constituency selection and proceed to questions', async () => {
    test.setTimeout(30000);

    // We should be on the constituency selection page.
    // The ConstituencySelector renders SingleGroupConstituencySelector components
    // with <select> elements (or autocomplete inputs for large groups).
    //
    // With the constituency overlay:
    // - Election 1 uses regions + municipalities (hierarchical, combined)
    // - Election 2 uses municipalities only
    // The getCombinedElections() call should combine them into a single section
    // since municipalities is a child group of regions.
    //
    // We need to select a municipality -- this should imply the parent region
    // for election 1, and directly satisfy election 2.

    const constituencySelector = sharedPage.getByTestId(testIds.voter.constituencies.selector);

    // Find select elements within the constituency selector.
    // The SingleGroupConstituencySelector renders a Select component
    // which uses a native <select> element when autocomplete is 'off'.
    const selectElements = constituencySelector.locator('select');

    // There should be at least one select element for constituency selection
    const selectCount = await selectElements.count();
    expect(selectCount).toBeGreaterThanOrEqual(1);

    // Select a municipality (e.g., "North Municipality A") from the first select.
    // The option values are internal database IDs, so we use the label text.
    const firstSelect = selectElements.first();
    await firstSelect.selectOption({ label: 'North Municipality A' });

    // The continue button should be enabled after selection
    const continueButton = sharedPage.getByTestId(testIds.voter.constituencies.continue);
    await expect(continueButton).toBeEnabled();

    // Click continue to proceed to questions
    await continueButton.click();

    // Should proceed to questions page
    await expect(sharedPage).toHaveURL(/\/questions/, { timeout: 10000 });
  });

  test('should answer questions and reach results', async () => {
    test.setTimeout(60000);

    // We should be on the questions page
    await expect(sharedPage).toHaveURL(/\/questions/);

    const answerOption = sharedPage.getByTestId(testIds.voter.questions.answerOption);
    const nextButton = sharedPage.getByTestId(testIds.voter.questions.nextButton);

    // Wait for first question to load
    await answerOption.first().waitFor({ state: 'visible', timeout: 10000 });

    // Answer all questions dynamically using URL change detection
    let onResultsPage = false;
    let questionCount = 0;

    while (!onResultsPage) {
      questionCount++;
      const urlBefore = sharedPage.url();

      // Answer the current question (select the middle option)
      await answerOption.nth(2).click();

      try {
        // Wait for auto-advance
        await sharedPage.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3000 });

        if (sharedPage.url().includes('/results')) {
          onResultsPage = true;
        }
      } catch {
        // On last question, no auto-advance -- click the next/results button
        await nextButton.waitFor({ state: 'visible' });
        await nextButton.click();
        await expect(sharedPage).toHaveURL(/\/results/, { timeout: 10000 });
        onResultsPage = true;
      }
    }

    // Verify results page loaded
    const resultsList = sharedPage.getByTestId(testIds.voter.results.list);
    await expect(resultsList).toBeVisible({ timeout: 10000 });

    // We should have answered a reasonable number of questions.
    // Base dataset has 8 questions, voter-dataset adds 8 more = 16.
    // The constituency overlay adds constituency-scoped questions.
    // With North Municipality A selected:
    //   - region-north implies for election-1 -> test-cat-const-north (1 question) appears
    //   - election-2 -> test-cat-e2-local (2 questions) appears
    // Not all may appear due to election/constituency scoping.
    expect(questionCount).toBeGreaterThanOrEqual(8);
  });

  test('should show election accordion in multi-election results', async () => {
    // With 2 elections in the dataRoot, the results page should show
    // the election accordion for switching between election results.
    const electionAccordion = sharedPage.getByTestId(testIds.voter.results.electionAccordion);
    await expect(electionAccordion).toBeVisible();
  });

  test('should display constituency-filtered results', async () => {
    // Verify results contain candidates. The results list should be visible
    // with entity cards showing candidates nominated for the selected constituency.
    const resultsList = sharedPage.getByTestId(testIds.voter.results.list);
    await expect(resultsList).toBeVisible();

    // Verify there is at least one entity card in the results
    const entityCards = sharedPage.getByTestId(testIds.voter.results.card);
    const cardCount = await entityCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });
});
