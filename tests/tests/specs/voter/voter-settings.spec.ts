/**
 * Voter settings and configuration-driven features E2E tests.
 *
 * Covers:
 * - VOTE-13: Category selection feature (allowCategorySelection setting)
 * - VOTE-05: Category intro pages (categoryIntros.show setting)
 * - VOTE-04: Question intro page (questionsIntro.show setting)
 * - VOTE-07: Minimum answers threshold enforcement
 * - VOTE-17: Results link visibility in header banner
 *
 * Each describe block creates its own SupabaseAdminClient, enables required
 * settings in beforeAll, and restores data.setup.ts defaults in afterAll.
 *
 * Runs within the `voter-app` project which depends only on data-setup
 * (no auth needed for voter tests).
 *
 * IMPORTANT: Tests that modify shared app settings run serially to prevent
 * race conditions between describe blocks.
 *
 * Notification and analytics popups are suppressed to prevent dialog overlays
 * from intercepting test clicks.
 */

import { test, expect } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

// All describe blocks share global app settings state -- run serially.
test.describe.configure({ mode: 'serial' });

// Ensure unauthenticated voter context.
// Disable trace to avoid Playwright 1.58.2 ENOENT trace writer conflicts
// when serial describe blocks share state across beforeAll/afterAll.
test.use({ storageState: { cookies: [], origins: [] }, trace: 'off' });

/**
 * Shared settings that suppress interfering popups (notification + data consent).
 * Applied in every describe block's beforeAll to prevent dialog overlays from
 * intercepting test clicks on navigation buttons.
 */
const suppressInterferingPopups = {
  notifications: { voterApp: { show: false } },
  analytics: { trackEvents: false }
};

/**
 * Entity settings that data.setup.ts configures.
 * Included in every updateAppSettings call to ensure consistent test state.
 */
const defaultEntitySettings = {
  entities: {
    hideIfMissingAnswers: { candidate: false },
    showAllNominations: true
  }
};

/**
 * Default settings to restore in afterAll blocks.
 * Matches the data.setup.ts app settings configuration.
 */
const defaultQuestionSettings = {
  questions: {
    categoryIntros: { show: false, allowSkip: true },
    questionsIntro: { allowCategorySelection: false, show: false },
    showResultsLink: true
  },
  ...defaultEntitySettings,
  ...suppressInterferingPopups
};

// ---------------------------------------------------------------------------
// VOTE-13: Category selection feature
// ---------------------------------------------------------------------------

test.describe('category selection (VOTE-13)', { tag: ['@voter'] }, () => {
  const client = new SupabaseAdminClient();

  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await client.updateAppSettings({
      questions: {
        questionsIntro: { show: true, allowCategorySelection: true },
        categoryIntros: { show: false, allowSkip: true },
        showResultsLink: true
      },
      matching: { minimumAnswers: 1 },
      ...defaultEntitySettings,
      ...suppressInterferingPopups
    });
  });

  test.afterAll(async () => {
    await client.updateAppSettings({
      ...defaultQuestionSettings,
      matching: { minimumAnswers: 5 }
    });

  });

  test('should show category checkboxes when allowCategorySelection enabled', async ({ page }) => {
    // Navigate to the voter home page
    await page.goto(buildRoute({ route: 'Home', locale: 'en' }));

    // Click start on the home page
    await page.getByTestId(testIds.voter.home.startButton).click();

    // Should navigate to intro page (single election + constituency auto-implied)
    await page.getByTestId(testIds.voter.intro.startButton).waitFor({ state: 'visible' });
    await page.getByTestId(testIds.voter.intro.startButton).click();

    // Should land on questions intro page since questionsIntro.show is true
    // Verify category list container is visible
    const categoryList = page.getByTestId(testIds.voter.questions.categoryList);
    await expect(categoryList).toBeVisible({ timeout: 10000 });

    // Verify category checkboxes are present (at least 2 -- one per category in dataset)
    const categoryCheckboxes = page.getByTestId(testIds.voter.questions.categoryCheckbox);
    await expect(categoryCheckboxes.first()).toBeVisible();
    const checkboxCount = await categoryCheckboxes.count();
    expect(checkboxCount).toBeGreaterThanOrEqual(2);

    // Uncheck all category checkboxes first to start from a clean slate,
    // then select exactly 1 category
    for (let i = 0; i < checkboxCount; i++) {
      const checkbox = categoryCheckboxes.nth(i);
      if (await checkbox.isChecked()) {
        await checkbox.click();
      }
    }

    // Select 1 category checkbox
    await categoryCheckboxes.nth(0).click();

    // Verify start button exists and is enabled
    const startButton = page.getByTestId(testIds.voter.questions.startButton);
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();

    // Click start
    await startButton.click();

    // Verify landed on first question of the selected category (question-choice visible)
    await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible({ timeout: 10000 });
  });

  test('should filter questions to selected categories', async ({ page }) => {
    // Navigate fresh for this test
    await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await page.getByTestId(testIds.voter.home.startButton).click();
    await page.getByTestId(testIds.voter.intro.startButton).waitFor({ state: 'visible' });
    await page.getByTestId(testIds.voter.intro.startButton).click();

    // Wait for category list
    await expect(page.getByTestId(testIds.voter.questions.categoryList)).toBeVisible({ timeout: 10000 });

    const categoryCheckboxes = page.getByTestId(testIds.voter.questions.categoryCheckbox);
    const checkboxCount = await categoryCheckboxes.count();

    // Uncheck all, then select exactly 1 category
    for (let i = 0; i < checkboxCount; i++) {
      const checkbox = categoryCheckboxes.nth(i);
      if (await checkbox.isChecked()) {
        await checkbox.click();
      }
    }
    await categoryCheckboxes.nth(0).click();

    // Click start
    await page.getByTestId(testIds.voter.questions.startButton).click();

    // Answer questions in the selected category.
    // The number should be fewer than 16 (total across all categories).
    let questionCount = 0;
    let onResultsPage = false;

    while (!onResultsPage && questionCount < 20) {
      // Wait for answer options to be visible
      const answerOption = page.getByTestId(testIds.voter.questions.answerOption);
      try {
        await answerOption.first().waitFor({ state: 'visible', timeout: 5000 });
      } catch {
        // No more questions -- we should be on results
        onResultsPage = true;
        break;
      }

      questionCount++;
      const urlBefore = page.url();
      await answerOption.nth(2).click();

      // Wait for auto-advance
      try {
        await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 5000 });
        if (page.url().includes('/results')) {
          onResultsPage = true;
        }
      } catch {
        // URL didn't change -- might need to click next/results button
        const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
        if (await nextButton.isVisible()) {
          await nextButton.click();
          await page.waitForURL(/\/results/, { timeout: 10000 });
          onResultsPage = true;
        }
      }
    }

    // With only 1 of 2 categories selected, question count should be less than 16
    expect(questionCount).toBeLessThan(16);
    expect(questionCount).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// VOTE-05: Category intros
// ---------------------------------------------------------------------------

test.describe('category intros (VOTE-05)', { tag: ['@voter'] }, () => {
  const client = new SupabaseAdminClient();

  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await client.updateAppSettings({
      questions: {
        questionsIntro: { show: false, allowCategorySelection: false },
        categoryIntros: { show: true, allowSkip: true },
        showResultsLink: true
      },
      ...defaultEntitySettings,
      ...suppressInterferingPopups
    });
  });

  test.afterAll(async () => {
    await client.updateAppSettings(defaultQuestionSettings);

  });

  test('should show category intro page before each category', async ({ page }) => {
    // Increase timeout for answering questions
    test.setTimeout(60000);

    // Navigate Home -> start -> intro -> start
    await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await page.getByTestId(testIds.voter.home.startButton).click();
    await page.getByTestId(testIds.voter.intro.startButton).waitFor({ state: 'visible' });
    await page.getByTestId(testIds.voter.intro.startButton).click();

    // With categoryIntros.show: true and questionsIntro.show: false,
    // the first thing after intro should be a category intro page
    const categoryIntro = page.getByTestId(testIds.voter.questions.categoryIntro);
    await expect(categoryIntro).toBeVisible({ timeout: 10000 });

    // Verify continue button is visible
    const continueButton = page.getByTestId(testIds.voter.questions.categoryStart);
    await expect(continueButton).toBeVisible();

    // Click continue to start first category's questions
    await continueButton.click();

    // Should land on first question
    await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible({ timeout: 10000 });

    // Answer all questions in the first category.
    // When transitioning to the next category, a category intro page should appear.
    let foundSecondCategoryIntro = false;

    // Answer questions until we see another category intro or reach results
    for (let i = 0; i < 20; i++) {
      const urlBefore = page.url();
      await page.getByTestId(testIds.voter.questions.answerOption).nth(2).click();

      // Wait for navigation
      try {
        await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 5000 });
      } catch {
        // URL didn't change -- click next button
        const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
        if (await nextButton.isVisible()) {
          await nextButton.click();
          try {
            await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 5000 });
          } catch {
            break;
          }
        }
      }

      // Check if we landed on a category intro page
      if (await categoryIntro.isVisible().catch(() => false)) {
        foundSecondCategoryIntro = true;
        break;
      }

      // Check if we landed on results
      if (page.url().includes('/results')) {
        break;
      }
    }

    expect(foundSecondCategoryIntro).toBe(true);

    // Verify category intro elements on the second category intro page
    await expect(categoryIntro).toBeVisible();
    await expect(page.getByTestId(testIds.voter.questions.categoryStart)).toBeVisible();
  });

  test('should skip category when skip button clicked', async ({ page }) => {
    // Increase timeout
    test.setTimeout(60000);

    // Navigate fresh
    await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await page.getByTestId(testIds.voter.home.startButton).click();
    await page.getByTestId(testIds.voter.intro.startButton).waitFor({ state: 'visible' });
    await page.getByTestId(testIds.voter.intro.startButton).click();

    // Should see first category intro
    const categoryIntro = page.getByTestId(testIds.voter.questions.categoryIntro);
    await expect(categoryIntro).toBeVisible({ timeout: 10000 });

    // Verify skip button is visible (allowSkip: true)
    const skipButton = page.getByTestId(testIds.voter.questions.categorySkip);
    await expect(skipButton).toBeVisible();

    // Click skip to bypass this category
    await skipButton.click();

    // After skipping, should navigate to the next category intro or questions
    // Verify we moved past the first category
    // We should either see a new category intro or the first question of the next category
    const nextCategoryIntro = page.getByTestId(testIds.voter.questions.categoryIntro);
    const answerOption = page.getByTestId(testIds.voter.questions.answerOption);

    // Wait for either the next category intro or a question to appear
    await expect(nextCategoryIntro.or(answerOption.first())).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// VOTE-04: Question intro page
// ---------------------------------------------------------------------------

test.describe('question intro page (VOTE-04)', { tag: ['@voter'] }, () => {
  const client = new SupabaseAdminClient();

  test.beforeAll(async () => {
    await client.updateAppSettings({
      questions: {
        questionsIntro: { show: true, allowCategorySelection: false },
        categoryIntros: { show: false, allowSkip: true },
        showResultsLink: true
      },
      ...defaultEntitySettings,
      ...suppressInterferingPopups
    });
  });

  test.afterAll(async () => {
    await client.updateAppSettings(defaultQuestionSettings);

  });

  test('should show question intro page when questionsIntro.show enabled', async ({ page }) => {
    // Navigate Home -> start -> intro -> start
    await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await page.getByTestId(testIds.voter.home.startButton).click();
    await page.getByTestId(testIds.voter.intro.startButton).waitFor({ state: 'visible' });
    await page.getByTestId(testIds.voter.intro.startButton).click();

    // Should land on questions intro page (URL contains /questions)
    await expect(page).toHaveURL(/\/questions/, { timeout: 10000 });

    // Verify start button is visible (this is the questions start button, not the intro start)
    const questionsStartButton = page.getByTestId(testIds.voter.questions.startButton);
    await expect(questionsStartButton).toBeVisible();

    // Click start
    await questionsStartButton.click();

    // Verify landed on first question (question-choice visible)
    await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// VOTE-07: Minimum answers threshold
// ---------------------------------------------------------------------------

test.describe('minimum answers threshold (VOTE-07)', { tag: ['@voter'] }, () => {
  const client = new SupabaseAdminClient();

  test.beforeAll(async () => {
    await client.updateAppSettings({
      questions: {
        questionsIntro: { show: false, allowCategorySelection: false },
        categoryIntros: { show: false, allowSkip: true },
        showResultsLink: true
      },
      matching: { minimumAnswers: 5 },
      ...defaultEntitySettings,
      ...suppressInterferingPopups
    });
  });

  test.afterAll(async () => {
    await client.updateAppSettings({
      ...defaultQuestionSettings,
      matching: { minimumAnswers: 5 }
    });

  });

  test('should enforce minimum answers before results available', async ({ page }) => {
    // Increase timeout for question answering
    test.setTimeout(60000);

    // Navigate Home -> start -> intro -> start -> first question
    await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await page.getByTestId(testIds.voter.home.startButton).click();
    await page.getByTestId(testIds.voter.intro.startButton).waitFor({ state: 'visible' });
    await page.getByTestId(testIds.voter.intro.startButton).click();

    // Land on first question
    await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible({ timeout: 10000 });

    // Verify results link in banner exists but is disabled (0 answers, below threshold of 5).
    // The Button component renders as an <a> with role="button" and disabled="true" attribute.
    // Playwright's toBeDisabled() doesn't work on <a> elements, so check the attribute directly.
    const resultsButton = page.getByTestId(testIds.voter.banner.results);
    await expect(resultsButton).toBeVisible();
    await expect(resultsButton).toHaveAttribute('disabled', 'true');

    // Helper: answer current question and wait for auto-advance
    async function answerAndAdvance(): Promise<void> {
      const urlBefore = page.url();
      await page.getByTestId(testIds.voter.questions.answerOption).nth(3).click();
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 5000 });
    }

    // Answer 2 questions (below threshold of 5)
    await answerAndAdvance();
    await answerAndAdvance();

    // Check results link is still disabled (2 answers < 5 threshold)
    await expect(resultsButton).toHaveAttribute('disabled', 'true');

    // Answer 3 more questions (total 5 = at threshold)
    await answerAndAdvance();
    await answerAndAdvance();
    await answerAndAdvance();

    // Check results link is now enabled (5 answers >= 5 threshold).
    // When enabled, the disabled attribute is removed entirely.
    await expect(resultsButton).not.toHaveAttribute('disabled');
  });
});

// ---------------------------------------------------------------------------
// VOTE-17: Results link visibility
// ---------------------------------------------------------------------------

test.describe('results link visibility (VOTE-17)', { tag: ['@voter'] }, () => {
  const client = new SupabaseAdminClient();

  test.beforeAll(async () => {
    await client.updateAppSettings({
      questions: {
        questionsIntro: { show: false, allowCategorySelection: false },
        categoryIntros: { show: false, allowSkip: true },
        showResultsLink: false
      },
      ...defaultEntitySettings,
      ...suppressInterferingPopups
    });
  });

  test.afterAll(async () => {
    await client.updateAppSettings(defaultQuestionSettings);

  });

  test('should hide results link when showResultsLink is false', async ({ page }) => {
    // Navigate Home -> start -> intro -> start -> first question
    await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await page.getByTestId(testIds.voter.home.startButton).click();
    await page.getByTestId(testIds.voter.intro.startButton).waitFor({ state: 'visible' });
    await page.getByTestId(testIds.voter.intro.startButton).click();

    // Land on first question
    await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible({ timeout: 10000 });

    // Verify results link in banner is NOT visible when showResultsLink is false
    const resultsButton = page.getByTestId(testIds.voter.banner.results);
    await expect(resultsButton).not.toBeVisible();
  });
});
