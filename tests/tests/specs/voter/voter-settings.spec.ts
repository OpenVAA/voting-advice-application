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

import { expect, test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

/**
 * Answer questions until the voter lands on /results, returning the number of
 * questions answered. Capped at `maxQuestions` so a buggy run can't loop forever.
 *
 * Hoisted to module-level per RESEARCH §"Pattern 4" canonical 3 — keeps the
 * exploration control-flow (try/catch + URL probe + button-visibility fallback)
 * OUT of the test body so the per-test no-conditional-in-test contract holds
 * (DETERM-03). The redirect-from-/questions-to-/results race is dispatched by
 * `waitForURL(/\\/results/)` after each click; the next-button fallback uses
 * web-first auto-retry visibility to avoid the Pitfall 8 `if (page.url())`
 * race-mask.
 */
async function answerUntilResults(page: Page, maxQuestions = 20): Promise<number> {
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption);
  const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
  let questionCount = 0;

  while (questionCount < maxQuestions) {
    // No more answer options visible within 5s -> assume results page reached.
    try {
      await answerOption.first().waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      return questionCount;
    }

    questionCount++;
    const urlBefore = page.url();
    await answerOption.nth(2).click();

    // Wait for auto-advance OR fall back to clicking the next/results button.
    try {
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 5000 });
    } catch {
      // No auto-advance — try the explicit next button. waitFor uses web-first
      // auto-retry visibility so we don't need an `if (await x.isVisible())`
      // race-mask (Pitfall 8 + Anti-Patterns).
      try {
        await nextButton.waitFor({ state: 'visible', timeout: 2000 });
      } catch {
        return questionCount;
      }
      await nextButton.click();
      await page.waitForURL(/\/results/, { timeout: 10000 });
      return questionCount;
    }

    if (page.url().includes('/results')) return questionCount;
  }

  return questionCount;
}

/**
 * Step through the question flow until either a category-intro page appears
 * or the voter lands on /results. Returns `'category-intro'` when an intro is
 * reached, `'results'` when /results is reached, or `'limit'` when neither
 * happens within `maxSteps` iterations.
 *
 * Hoisted per Pattern 4 canonical 3 (DETERM-03 — keeps multi-anchor exploration
 * control-flow out of the test body). The category-intro vs results race is
 * dispatched by waitForURL OR-ed against an intro-visibility wait — both
 * use Playwright's web-first auto-retry, no `.isVisible().catch(false)`
 * swallow-trap (RESEARCH Anti-Patterns).
 */
async function answerUntilCategoryIntroOrResults(
  page: Page,
  maxSteps = 20
): Promise<'category-intro' | 'results' | 'limit'> {
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption);
  const nextButton = page.getByTestId(testIds.voter.questions.nextButton);

  for (let i = 0; i < maxSteps; i++) {
    const urlBefore = page.url();
    await answerOption.nth(2).click();

    // Wait for auto-advance OR explicit next-button advance. No `if (await x.isVisible())`
    // race-mask — use web-first waitFor.
    try {
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 5000 });
    } catch {
      try {
        await nextButton.waitFor({ state: 'visible', timeout: 2000 });
      } catch {
        return 'limit';
      }
      await nextButton.click();
      try {
        await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 5000 });
      } catch {
        return 'limit';
      }
    }

    // Race: did we land on a category-intro page, on /results, OR on the next
    // question (answer-option already visible — no intro page to wait for)?
    // Use page.waitForFunction so the three anchors are evaluated atomically
    // in a single tracking scope — settles whichever appears first within the
    // 5s window. Replaces the prior `if (await x.isVisible().catch(false))`
    // swallow (RESEARCH Anti-Patterns) and the prior `if (page.url().includes(...))`
    // race-mask (Pitfall 8).
    //
    // `answer-option` short-circuits the wait: when the next question's
    // answer options are already visible there is no category-intro to land
    // on — falling through to the loop's next iteration immediately is
    // strictly faster than the 5s waitForFunction timeout.
    const introTestId = testIds.voter.questions.categoryIntro;
    const answerTestId = testIds.voter.questions.answerOption;
    const anchor = await page
      .waitForFunction(
        ([id, answerId]) => {
          const intro = document.querySelector(`[data-testid="${id}"]`);
          if (intro && (intro as HTMLElement).offsetParent !== null) return 'category-intro';
          if (location.pathname.includes('/results')) return 'results';
          const answer = document.querySelector(`[data-testid="${answerId}"]`);
          if (answer && (answer as HTMLElement).offsetParent !== null) return 'answer-option';
          return null;
        },
        [introTestId, answerTestId] as const,
        { timeout: 5000 }
      )
      .then((handle) => handle.jsonValue() as Promise<'category-intro' | 'results' | 'answer-option'>)
      .catch(() => null);
    if (anchor === 'answer-option') continue;
    if (anchor) return anchor;
  }
  return 'limit';
}

// All describe blocks share global app settings state -- run serially.
test.describe.configure({ mode: 'serial' });

// Ensure unauthenticated voter context.
test.use({ storageState: { cookies: [], origins: [] } });

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
    // then select exactly 1 category. setChecked(false) is idempotent — it
    // unchecks if checked and is a no-op if already unchecked — so we don't
    // need a per-checkbox conditional probe (DETERM-03: no-conditional-in-test).
    for (let i = 0; i < checkboxCount; i++) {
      await categoryCheckboxes.nth(i).setChecked(false);
    }

    // Verify start button exists and is not enabled when no categories are selected
    const startButton = page.getByTestId(testIds.voter.questions.startButton);
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeDisabled();

    // Select 2 category checkboxes
    await categoryCheckboxes.nth(0).click();
    await categoryCheckboxes.nth(1).click();

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

    // Uncheck all, then select exactly 1 category. setChecked(false) is
    // idempotent (no-op when already unchecked), so no per-checkbox probe is
    // needed — DETERM-03: no-conditional-in-test.
    for (let i = 0; i < checkboxCount; i++) {
      await categoryCheckboxes.nth(i).setChecked(false);
    }
    await categoryCheckboxes.nth(0).click();

    // Click start
    await page.getByTestId(testIds.voter.questions.startButton).click();

    // Answer questions in the selected category. The number should be fewer
    // than 16 (total across all categories). Control flow is hoisted into
    // `answerUntilResults` at module scope (DETERM-03 — no-conditional-in-test).
    const questionCount = await answerUntilResults(page, 20);

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

    // Answer all questions in the first category. When transitioning to the
    // next category, a category intro page should appear. Control flow is
    // hoisted into `answerUntilCategoryIntroOrResults` at module scope so the
    // test body satisfies no-conditional-in-test (DETERM-03). The two-anchor
    // race (category-intro vs /results) is dispatched via page.waitForFunction
    // inside the helper, replacing the prior `.isVisible().catch(false)`
    // swallow-trap + `if (page.url())` race-mask.
    const anchor = await answerUntilCategoryIntroOrResults(page, 20);
    expect(anchor).toBe('category-intro');

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

    // Reload to ensure the page picks up the latest settings (showResultsLink: false).
    // SvelteKit may cache settings across client-side navigations.
    await page.reload();
    await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible({ timeout: 10000 });

    // Verify results link in banner is NOT visible when showResultsLink is false
    const resultsButton = page.getByTestId(testIds.voter.banner.results);
    await expect(resultsButton).not.toBeVisible({ timeout: 10000 });
  });
});
