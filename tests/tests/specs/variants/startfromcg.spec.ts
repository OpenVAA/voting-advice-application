/**
 * startFromConstituencyGroup variant E2E tests.
 *
 * Covers the reversed voter flow where constituencies are selected BEFORE
 * elections, triggered by the `elections.startFromConstituencyGroup` setting:
 * - Constituency selection appears first (not elections)
 * - Only the specified constituency group's constituencies are shown
 * - After constituency selection, election selection is shown (filtered)
 * - Orphan municipality (no parent region) does not cause runtime errors
 *
 * Uses the startfromcg overlay dataset which creates:
 * - Same hierarchical structure as constituency overlay PLUS an orphan municipality
 * - 2 elections: election-1 (regions + municipalities), election-2 (municipalities only)
 * - 5 constituencies: region-north, region-south, muni-north-a, muni-south-a, muni-orphan
 * - The orphan municipality has no parent region
 *
 * The `startFromConstituencyGroup` setting is set in beforeAll after querying
 * for the municipalities constituency group's database ID (not externalId).
 *
 * Runs within the `variant-startfromcg` project which depends on
 * `data-setup-startfromcg` for dataset loading.
 */

import { expect, test } from '@playwright/test';
import { buildRoute } from '../../utils/buildRoute';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

// Disable tracing for this serial spec to avoid ENOENT errors with
// shared browser contexts in Playwright 1.58.2.
test.use({ trace: 'off' });

/**
 * Answer questions one-by-one until the results page is reached.
 *
 * Module-level helper hoisted out of test bodies (RESEARCH Pattern 4 canonical 3)
 * so playwright/no-conditional-in-test holds for the test body itself. The
 * post-await conditionals inside this helper are legitimate control-flow
 * branches on settled URL state (not race-masks): the helper deterministically
 * dispatches between (a) auto-advance ended on /results, and (b) last-question
 * needs the explicit next-button click followed by a waitForURL terminator.
 *
 * @returns The number of questions answered before reaching /results.
 */
async function answerUntilResults(
  page: Page,
  answerOption: ReturnType<Page['getByTestId']>,
  nextButton: ReturnType<Page['getByTestId']>,
  maxQuestions = 50
): Promise<number> {
  let questionCount = 0;
  let onResultsPage = false;

  while (!onResultsPage && questionCount < maxQuestions) {
    questionCount++;
    const urlBefore = page.url();

    // Answer the current question (select the middle option)
    await answerOption.nth(2).click();

    try {
      // Wait for auto-advance (URL change)
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3000 });
      onResultsPage = page.url().includes('/results');
    } catch {
      // No auto-advance — last question; click the explicit next/results button.
      await nextButton.waitFor({ state: 'visible' });
      await nextButton.click();
      await page.waitForURL(/\/results/, { timeout: 10000 });
      onResultsPage = true;
    }
  }

  return questionCount;
}

/**
 * Iteratively answer questions and tolerate URL-not-changed via explicit next.
 *
 * Hoisted out of test bodies (RESEARCH Pattern 4 canonical 3). Used for the
 * orphan-municipality edge-case test where the question set may differ in size
 * and the next-button fallback path is more frequently exercised. The function
 * either reaches /results (caller verifies) or exhausts maxIterations.
 */
async function answerOrAdvanceUntilResults(
  page: Page,
  answerOption: ReturnType<Page['getByTestId']>,
  nextButton: ReturnType<Page['getByTestId']>,
  maxIterations = 50
): Promise<void> {
  // Use waitForFunction to atomically check (a) the URL settled on /results.
  // We re-evaluate after each click below; once /results is reached we exit.
  for (let i = 0; i < maxIterations; i++) {
    if (page.url().includes('/results')) return;

    const urlBefore = page.url();
    await answerOption.nth(2).click();

    try {
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3000 });
    } catch {
      // URL didn't change — try the explicit next button.
      await nextButton.waitFor({ state: 'visible', timeout: 5000 });
      await nextButton.click();
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 5000 });
    }
  }
}

/**
 * Open the election-accordion's first option if the accordion is rendered.
 *
 * Hoisted out of test bodies (RESEARCH Pattern 4 canonical 3). The `.or()`
 * union locator + `waitFor` gives an atomic two-anchor probe (accordion OR
 * list visible); the helper then dispatches deterministically based on which
 * terminator landed. The post-await `if` is a legitimate control-flow branch
 * on settled DOM state (not a race-mask).
 */
async function selectElectionFromAccordionIfPresent(
  electionAccordion: ReturnType<Page['getByTestId']>,
  resultsList: ReturnType<Page['getByTestId']>
): Promise<void> {
  await electionAccordion.or(resultsList).first().waitFor({ state: 'visible', timeout: 10000 });
  if ((await electionAccordion.count()) > 0 && (await electionAccordion.isVisible())) {
    await electionAccordion.getByRole('option').first().click();
  }
}

test.describe('startFromConstituencyGroup variant', { tag: ['@variant'] }, () => {
  test.describe.configure({ mode: 'serial' });

  let sharedPage: Page;
  let client: SupabaseAdminClient;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();

    // Query for the municipalities constituency group to get its database ID
    client = new SupabaseAdminClient();

    const findResult = await client.findData('constituencyGroups', {
      externalId: { $eq: 'test-cg-municipalities' }
    });
    expect(findResult.type).toBe('success');
    expect(findResult.data).toBeDefined();
    expect(findResult.data!.length).toBeGreaterThan(0);

    const cgDocumentId = findResult.data![0].documentId as string;
    expect(cgDocumentId).toBeTruthy();

    // Set startFromConstituencyGroup to the municipalities group database ID.
    // This reverses the flow: Constituencies -> Elections -> Questions.
    await client.updateAppSettings({
      elections: {
        startFromConstituencyGroup: cgDocumentId,
        disallowSelection: false,
        showElectionTags: true
      },
      questions: {
        categoryIntros: { show: false },
        questionsIntro: { allowCategorySelection: false, show: false },
        showResultsLink: true
      },
      results: {
        sections: ['candidate', 'organization'],
        cardContents: { candidate: ['submatches'], organization: ['children'] },
        showFeedbackPopup: 0,
        showSurveyPopup: 0
      },
      entities: {
        hideIfMissingAnswers: { candidate: false },
        showAllNominations: true
      },
      notifications: { voterApp: { show: false } },
      analytics: { trackEvents: false }
    });
  });

  test.afterAll(async () => {
    // Restore startFromConstituencyGroup to undefined (disabled)
    if (client) {
      await client.updateAppSettings({
        elections: {
          startFromConstituencyGroup: null,
          disallowSelection: false,
          showElectionTags: true
        },
        questions: {
          categoryIntros: { show: false },
          questionsIntro: { allowCategorySelection: false, show: false },
          showResultsLink: true
        },
        results: {
          sections: ['candidate', 'organization'],
          cardContents: { candidate: ['submatches'], organization: ['children'] },
          showFeedbackPopup: 0,
          showSurveyPopup: 0
        },
        entities: {
          hideIfMissingAnswers: { candidate: false },
          showAllNominations: true
        },
        notifications: { voterApp: { show: false } },
        analytics: { trackEvents: false }
      });
    }
    await sharedPage.close();
  });

  test('should show constituency selection first (reversed flow)', async () => {
    test.setTimeout(30000);

    // Navigate Home -> Start -> Intro
    await sharedPage.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await sharedPage.getByTestId(testIds.voter.home.startButton).click();

    const introStart = sharedPage.getByTestId(testIds.voter.intro.startButton);
    await introStart.waitFor({ state: 'visible' });
    await introStart.click();

    // With startFromConstituencyGroup set, the flow is reversed:
    // Constituencies first, NOT elections.
    // The (located) layout gate should redirect to constituency selection.
    const constituenciesList = sharedPage.getByTestId(testIds.voter.constituencies.list);
    await expect(constituenciesList).toBeVisible({ timeout: 10000 });

    // Election selection should NOT be visible at this point
    const electionsList = sharedPage.getByTestId(testIds.voter.elections.list);
    await expect(electionsList).toBeHidden();

    // The constituency selector combobox should be visible, showing only
    // the municipalities group (the specified startFromConstituencyGroup).
    // Note: the `constituency-selector` testId is overwritten by the parent's
    // `voter-constituencies-list` testId due to $$restProps spread, so we
    // check for the combobox within the list container instead.
    const municipalityCombobox = constituenciesList.getByRole('combobox', { name: /Municipalities/ });
    await expect(municipalityCombobox).toBeVisible();
  });

  test('should show election selection after constituency selection', async () => {
    test.setTimeout(30000);

    // Select a municipality from the selector.
    // The startfromcg overlay has: muni-north-a, muni-south-a, muni-orphan
    // Use a regular municipality (not orphan) for the main flow test.
    // With 3+ constituencies, the selector renders as an autocomplete combobox.
    const constituenciesList = sharedPage.getByTestId(testIds.voter.constituencies.list);
    const combobox = constituenciesList.getByRole('combobox', { name: /Municipalities/ });

    // Select "North Municipality A" via the autocomplete combobox
    await combobox.click();
    await combobox.fill('North Municipality A');
    const listbox = sharedPage.getByRole('listbox');
    await listbox.waitFor({ state: 'visible', timeout: 5000 });
    await listbox.getByRole('option', { name: /North Municipality A/ }).click();

    // Click continue
    const continueButton = sharedPage.getByTestId(testIds.voter.constituencies.continue);
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    // After constituency selection in startFromConstituencyGroup mode,
    // the flow goes to Elections page (filtered by applicable constituencies).
    const electionsList = sharedPage.getByTestId(testIds.voter.elections.list);
    await expect(electionsList).toBeVisible({ timeout: 10000 });

    // Election options should be shown. The elections filtered by the selected
    // municipality (muni-north-a which implies region-north) should include
    // both election-1 (has regions + municipalities) and election-2 (has municipalities).
    const electionOptions = sharedPage.getByTestId(testIds.voter.elections.card);
    const electionCount = await electionOptions.count();
    expect(electionCount).toBeGreaterThanOrEqual(1);

    // Select all available elections and continue
    await sharedPage.getByTestId(testIds.voter.elections.continue).click();

    // After election continue in startFromConstituencyGroup mode, the flow
    // goes directly to questions (constituency already selected).
    await expect(sharedPage).toHaveURL(/\/questions/, { timeout: 10000 });
  });

  test('should complete journey through questions to results', async () => {
    test.setTimeout(60000);

    // We should be on the questions page
    await expect(sharedPage).toHaveURL(/\/questions/);

    // Dismiss the "missing nominations" dialog if it appears
    // getByRole('dialog') matches only open <dialog>; closed dialogs are hidden.
    const dialog = sharedPage.getByRole('dialog');
    try {
      await dialog.waitFor({ state: 'visible', timeout: 3000 });
      await dialog.getByRole('button', { name: /continue/i }).click();
      await dialog.waitFor({ state: 'hidden', timeout: 5000 });
    } catch {
      // No dialog appeared
    }

    const answerOption = sharedPage.getByTestId(testIds.voter.questions.answerOption);
    const nextButton = sharedPage.getByTestId(testIds.voter.questions.nextButton);

    // Wait for first question to load
    await answerOption.first().waitFor({ state: 'visible', timeout: 10000 });

    // Answer all questions until /results — hoisted helper keeps the in-test
    // body conditional-free (RESEARCH Pattern 4 canonical 3).
    const questionCount = await answerUntilResults(sharedPage, answerOption, nextButton);

    // Verify results page loaded — handle multi-election accordion if present.
    // Hoisted helper performs atomic two-anchor waitFor + deterministic dispatch.
    const electionAccordion = sharedPage.getByTestId(testIds.voter.results.electionAccordion);
    const resultsList = sharedPage.getByTestId(testIds.voter.results.list);
    await selectElectionFromAccordionIfPresent(electionAccordion, resultsList);
    await expect(resultsList).toBeVisible({ timeout: 10000 });

    // Verify we answered a reasonable number of questions
    expect(questionCount).toBeGreaterThanOrEqual(8);
  });

  test('should handle orphan municipality without error', async () => {
    test.setTimeout(60000);

    // Start a fresh navigation to test the orphan municipality edge case.
    // The orphan municipality (test-const-muni-orphan) has no parent region,
    // which means it won't imply a region for election-1 (which requires regions).
    // The app should handle this gracefully.

    await sharedPage.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await sharedPage.getByTestId(testIds.voter.home.startButton).click();

    const introStart = sharedPage.getByTestId(testIds.voter.intro.startButton);
    await introStart.waitFor({ state: 'visible' });
    await introStart.click();

    // Should redirect to constituency selection (startFromConstituencyGroup mode)
    const constituenciesList = sharedPage.getByTestId(testIds.voter.constituencies.list);
    await expect(constituenciesList).toBeVisible({ timeout: 10000 });

    // Select the orphan municipality via autocomplete combobox
    const combobox = constituenciesList.getByRole('combobox', { name: /Municipalities/ });
    await combobox.click();
    await combobox.fill('Orphan Municipality');
    const listbox = sharedPage.getByRole('listbox');
    await listbox.waitFor({ state: 'visible', timeout: 5000 });
    await listbox.getByRole('option', { name: /Orphan Municipality/ }).click();

    // Click continue
    const continueButton = sharedPage.getByTestId(testIds.voter.constituencies.continue);
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    // After selecting orphan municipality, the elections page should appear.
    // The orphan has no parent region, so election-1 (which uses regions) may
    // not have an applicable constituency. Only election-2 (municipalities only)
    // should be applicable.
    const electionsList = sharedPage.getByTestId(testIds.voter.elections.list);
    await expect(electionsList).toBeVisible({ timeout: 10000 });

    // Key assertion: no runtime error, no crash. The app gracefully handles
    // the orphan municipality. There should be at least one election shown
    // (election-2 uses municipalities which includes the orphan).
    const electionOptions = sharedPage.getByTestId(testIds.voter.elections.card);
    const electionCount = await electionOptions.count();
    expect(electionCount).toBeGreaterThanOrEqual(1);

    // Continue with election selection to verify the journey completes
    await sharedPage.getByTestId(testIds.voter.elections.continue).click();

    // Should proceed to questions
    await expect(sharedPage).toHaveURL(/\/questions/, { timeout: 10000 });

    // Dismiss the "missing nominations" dialog if it appears
    // getByRole('dialog') matches only open <dialog>; closed dialogs are hidden.
    const orphanDialog = sharedPage.getByRole('dialog');
    try {
      await orphanDialog.waitFor({ state: 'visible', timeout: 3000 });
      await orphanDialog.getByRole('button', { name: /continue/i }).click();
      await orphanDialog.waitFor({ state: 'hidden', timeout: 5000 });
    } catch {
      // No dialog appeared
    }

    // Answer questions and reach results to confirm full journey works.
    // Hoisted helper keeps the in-test body conditional-free (RESEARCH Pattern 4
    // canonical 3); the helper internally tolerates URL-not-changed via the
    // explicit next button (orphan-municipality edge case may exercise the
    // fallback path more frequently).
    const answerOption = sharedPage.getByTestId(testIds.voter.questions.answerOption);
    const nextButton = sharedPage.getByTestId(testIds.voter.questions.nextButton);

    await answerOption.first().waitFor({ state: 'visible', timeout: 10000 });

    await answerOrAdvanceUntilResults(sharedPage, answerOption, nextButton);

    // Verify the journey completed without errors — we reached the results page.
    // The orphan municipality may have limited nominations, so we just verify
    // the results URL was reached and the page rendered (no crash).
    await expect(sharedPage).toHaveURL(/\/results/, { timeout: 10000 });
  });
});
