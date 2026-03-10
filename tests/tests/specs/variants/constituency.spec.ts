/**
 * Constituency selection variant E2E tests (CONF-03).
 *
 * Covers the voter flow when elections have multiple constituencies,
 * requiring explicit constituency selection:
 * - Constituency selection page appears after election selection
 * - Selecting a municipality implies the parent region (hierarchical)
 * - Constituency-scoped questions appear only for the selected constituency
 * - Multi-election results with election accordion
 * - Missing nominations warning when a constituency lacks nominations for some elections
 *
 * Uses the constituency overlay dataset which creates:
 * - Election 1 with 2 constituency groups (regions + municipalities)
 * - Election 2 with municipalities constituency group only
 * - 5 constituencies: region-north, region-south, muni-north-a, muni-south-a, muni-east
 * - Parent hierarchy: muni-north-a -> region-north, muni-south-a -> region-south
 * - East Municipality has no parent and nominations only for Election 1 (not Election 2)
 * - Constituency-scoped questions for North Region and election-2 local
 *
 * Runs within the `variant-constituency` project which depends on
 * `data-setup-constituency` for dataset loading.
 */

import { expect, test } from '@playwright/test';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import { StrapiAdminClient } from '../../utils/strapiAdminClient';
import type { Page } from '@playwright/test';

// Disable tracing for this serial spec to avoid ENOENT errors with
// shared browser contexts in Playwright 1.58.2.
test.use({ trace: 'off' });

test.describe('Constituency selection variant', { tag: ['@variant'] }, () => {
  test.describe.configure({ mode: 'serial' });

  let sharedPage: Page;
  const client = new StrapiAdminClient();

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();

    // Suppress notification and data consent popups that block test clicks
    await client.login();
    await client.updateAppSettings({
      notifications: { voterApp: { show: false } },
      analytics: { trackEvents: false },
      entities: {
        hideIfMissingAnswers: { candidate: false },
        showAllNominations: true
      },
      questions: {
        categoryIntros: { show: false },
        questionsIntro: { allowCategorySelection: false, show: false },
        showResultsLink: true
      },
      results: {
        sections: ['candidate', 'organization'],
        cardContents: { candidate: ['submatches'], organization: ['candidates'] },
        showFeedbackPopup: 0,
        showSurveyPopup: 0
      }
    });
  });

  test.afterAll(async () => {
    await client.dispose();
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

    // Verify a continue button exists for constituency selection
    const continueBtn = sharedPage.getByTestId(testIds.voter.constituencies.continue);
    await expect(continueBtn).toBeVisible();
  });

  test('should allow constituency selection and proceed to questions', async () => {
    test.setTimeout(30000);

    // We should be on the constituency selection page.
    // The page shows each election's constituency groups as separate sections:
    // - Election 1: "Regions" OR "Municipalities" (hierarchical, user picks one)
    // - Election 2: "Municipalities" only
    //
    // We select from the Municipalities combobox for each election.
    // Selecting a municipality for Election 1 implies the parent region.

    const constituenciesList = sharedPage.getByTestId(testIds.voter.constituencies.list);

    // Target the "Select Municipalities" comboboxes specifically (not Regions).
    // There are two: one for Election 1's Municipalities group, one for Election 2.
    const municipalityComboboxes = constituenciesList.getByRole('combobox', { name: /Municipalities/ });

    // Select "North Municipality A" for Election 1
    const election1Muni = municipalityComboboxes.first();
    await election1Muni.click();
    await election1Muni.fill('North Municipality A');
    const listbox1 = sharedPage.getByRole('listbox');
    await listbox1.waitFor({ state: 'visible', timeout: 5000 });
    await listbox1.getByRole('option', { name: /North Municipality A/ }).click();

    // Select "North Municipality A" for Election 2
    const election2Muni = municipalityComboboxes.nth(1);
    await election2Muni.click();
    await election2Muni.fill('North Municipality A');
    const listbox2 = sharedPage.getByRole('listbox');
    await listbox2.waitFor({ state: 'visible', timeout: 5000 });
    await listbox2.getByRole('option', { name: /North Municipality A/ }).click();

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

    // Verify NO missing nominations dialog appears.
    // North Municipality A has nominations for both elections, so the warning
    // should not trigger. The dialog opens before the questions slot renders,
    // so once answer options are visible the nominations check has completed.
    const answerOption = sharedPage.getByTestId(testIds.voter.questions.answerOption);
    const nextButton = sharedPage.getByTestId(testIds.voter.questions.nextButton);

    // Wait for first question to load — also confirms no dialog is blocking
    await answerOption.first().waitFor({ state: 'visible', timeout: 10000 });
    const noNomDialog = sharedPage.locator('dialog[open]');
    await expect(noNomDialog).toHaveCount(0);

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

    // Verify results page loaded — in multi-election mode, select an election first
    const electionAccordion = sharedPage.getByTestId(testIds.voter.results.electionAccordion);
    await electionAccordion.or(sharedPage.getByTestId(testIds.voter.results.list)).waitFor({ state: 'visible', timeout: 10000 });
    if (await electionAccordion.isVisible().catch(() => false)) {
      await electionAccordion.getByRole('option').first().click();
    }
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

  test('should show missing nominations warning for partial-coverage constituency', async () => {
    test.setTimeout(60000);

    // Navigate from scratch to test a constituency with partial nominations.
    // East Municipality has a nomination for Election 1 but NOT Election 2,
    // which should trigger the "some nominations" warning dialog.
    await sharedPage.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await sharedPage.getByTestId(testIds.voter.home.startButton).click();

    const introStart = sharedPage.getByTestId(testIds.voter.intro.startButton);
    await introStart.waitFor({ state: 'visible' });
    await introStart.click();

    // Select both elections
    const electionsList = sharedPage.getByTestId(testIds.voter.elections.list);
    await expect(electionsList).toBeVisible({ timeout: 10000 });
    await sharedPage.getByTestId(testIds.voter.elections.continue).click();

    // Constituency selection page
    const constituenciesList = sharedPage.getByTestId(testIds.voter.constituencies.list);
    await expect(constituenciesList).toBeVisible({ timeout: 10000 });

    // Select East Municipality for both elections via the Municipalities comboboxes.
    const municipalityComboboxes = constituenciesList.getByRole('combobox', { name: /Municipalities/ });

    // Election 1's municipalities combobox
    const e1Muni = municipalityComboboxes.first();
    await e1Muni.click();
    await e1Muni.fill('East Municipality');
    const listbox1 = sharedPage.getByRole('listbox');
    await listbox1.waitFor({ state: 'visible', timeout: 5000 });
    await listbox1.getByRole('option', { name: /East Municipality/ }).click();

    // Election 2's municipalities combobox
    const e2Muni = municipalityComboboxes.nth(1);
    await e2Muni.click();
    await e2Muni.fill('East Municipality');
    const listbox2 = sharedPage.getByRole('listbox');
    await listbox2.waitFor({ state: 'visible', timeout: 5000 });
    await listbox2.getByRole('option', { name: /East Municipality/ }).click();

    // Continue to questions
    const continueButton = sharedPage.getByTestId(testIds.voter.constituencies.continue);
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    // Should reach the questions URL
    await expect(sharedPage).toHaveURL(/\/questions/, { timeout: 10000 });

    // The missing nominations warning dialog should appear because
    // East Municipality has nominations for Election 1 but NOT Election 2.
    const dialog = sharedPage.locator('dialog[open]');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    // Verify the dialog shows the "some nominations" variant with
    // per-election availability indicators.
    // Election 1 (2025) should be available, Election 2 (2026) should not.
    await expect(dialog.getByText(/Test Election 2025/)).toBeVisible();
    await expect(dialog.getByText(/Test Election 2026/)).toBeVisible();
    await expect(dialog.getByText(/not available/)).toBeVisible();

    // Click Continue to dismiss the dialog and verify the journey can proceed
    await dialog.getByRole('button', { name: /continue/i }).click();
    await dialog.waitFor({ state: 'hidden', timeout: 5000 });

    // After dismissing, questions should still be accessible
    const answerOption = sharedPage.getByTestId(testIds.voter.questions.answerOption);
    await expect(answerOption.first()).toBeVisible({ timeout: 10000 });
  });
});
