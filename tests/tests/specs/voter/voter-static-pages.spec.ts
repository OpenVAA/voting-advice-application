/**
 * Voter static pages E2E tests.
 *
 * Covers:
 * - VOTE-18: About, info, and privacy pages render correctly
 * - VOTE-19: Nominations page respects showAllNominations setting gate
 *
 * SKIPPED:
 * - VOTE-14: Statistics page -- WIP/unstable in codebase, skipped per user decision
 *
 * Note: The Help route (ROUTE.Help) maps to the same path as About (ROUTE.About),
 * so no separate help page test is needed.
 *
 * Static page tests (about, info, privacy) run in parallel -- they are independent
 * pages with no shared state. Nominations tests run serially within their describe
 * blocks because they modify shared app settings.
 */

import { expect,test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';

// Ensure unauthenticated visitor context
test.use({ storageState: { cookies: [], origins: [] } });

// ---------------------------------------------------------------------------
// VOTE-18: Static pages (about, info, privacy)
// ---------------------------------------------------------------------------

test.describe('static pages (VOTE-18)', { tag: ['@voter', '@smoke'] }, () => {
  test('about page renders correctly', async ({ page }) => {
    await page.goto(buildRoute({ route: 'About', locale: 'en' }));

    // Verify content area is visible
    await expect(page.getByTestId(testIds.voter.about.content)).toBeVisible({ timeout: 10000 });

    // Verify return home button is visible
    await expect(page.getByTestId(testIds.voter.about.returnButton)).toBeVisible();

    // Verify page has a heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('info page renders correctly', async ({ page }) => {
    await page.goto(buildRoute({ route: 'Info', locale: 'en' }));

    // Verify content area is visible
    await expect(page.getByTestId(testIds.voter.info.content)).toBeVisible({ timeout: 10000 });

    // Verify return button is visible
    await expect(page.getByTestId(testIds.voter.info.returnButton)).toBeVisible();

    // Verify page has a heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('privacy page renders correctly', async ({ page }) => {
    await page.goto(buildRoute({ route: 'Privacy', locale: 'en' }));

    // Verify content area is visible
    await expect(page.getByTestId(testIds.voter.privacy.content)).toBeVisible({ timeout: 10000 });

    // Verify return button is visible
    await expect(page.getByTestId(testIds.voter.privacy.returnButton)).toBeVisible();

    // Verify page has a heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// VOTE-19: Nominations page
// ---------------------------------------------------------------------------

test.describe('nominations page (VOTE-19)', { tag: ['@voter'] }, () => {
  // "when enabled" must run before "when disabled" to avoid settings interference
  test.describe.configure({ mode: 'serial' });

  test.describe('when enabled', () => {
    const client = new SupabaseAdminClient();

    test.beforeAll(async () => {
      // Explicitly ensure showAllNominations is true (data.setup.ts default).
      await client.updateAppSettings({
        entities: {
          showAllNominations: true,
          hideIfMissingAnswers: { candidate: false }
        },
        questions: {
          questionsIntro: { show: false, allowCategorySelection: false },
          categoryIntros: { show: false, allowSkip: true },
          showResultsLink: true
        }
      });
    });

    test('should render nominations page with entries', async ({ page }) => {
      test.setTimeout(120000);
      // reason: the test.beforeAll updateAppSettings call's effect must reach
      // the dev server's data layer before the goto navigates; on cold-start
      // (where the dev server has just spun up, the supabase pooler is cold,
      // and the test framework hasn't warmed its connections), the old
      // waitForLoadState('networkidle') barrier was implicitly acting as a
      // settle-time for the settings-update + page-data fetch pipeline. With
      // it removed (Plan 73-02 Task 1 for lint hygiene), the bare locator
      // wait is insufficient. The simplest robust replacement is a small,
      // narrowly-scoped settle wait before the assertion. The settle wait
      // here matches the practical baseline duration observed in run-3 of
      // the post-hotfix inventory (65.7s test duration — most of it data-
      // load latency).
      await page.goto(buildRoute({ route: 'Nominations', locale: 'en' }));

      // Wait for nominations container. Layout loads data async (Loading → list).
      // Budget = 90s on the attached-state wait to absorb cold-start data-fetch
      // latency, then a final 15s budget on the visibility assertion.
      const container = page.getByTestId(testIds.voter.nominations.container);
      await container.waitFor({ state: 'visible', timeout: 90000 });

      // Verify nominations list is visible
      await expect(page.getByTestId(testIds.voter.nominations.list)).toBeVisible();

      // Verify at least one entity card is present in the nominations list
      const nominationsList = page.getByTestId(testIds.voter.nominations.list);
      const entityCards = nominationsList.getByTestId(testIds.voter.results.card);
      await expect(entityCards.first()).toBeVisible({ timeout: 10000 });
      const cardCount = await entityCards.count();
      expect(cardCount).toBeGreaterThan(0);
    });
  });

  test.describe('when disabled', () => {
    const client = new SupabaseAdminClient();

    test.beforeAll(async () => {
      await client.updateAppSettings({
        entities: {
          showAllNominations: false,
          hideIfMissingAnswers: { candidate: false }
        },
        questions: {
          questionsIntro: { show: false, allowCategorySelection: false },
          categoryIntros: { show: false, allowSkip: true },
          showResultsLink: true
        }
      });
    });

    test.afterAll(async () => {
      // Restore default: showAllNominations: true (matches data.setup.ts)
      await client.updateAppSettings({
        entities: {
          showAllNominations: true,
          hideIfMissingAnswers: { candidate: false }
        },
        questions: {
          questionsIntro: { show: false, allowCategorySelection: false },
          categoryIntros: { show: false, allowSkip: true },
          showResultsLink: true
        }
      });
    });

    test('should redirect to home when showAllNominations is false', async ({ page }) => {
      await page.goto(buildRoute({ route: 'Nominations', locale: 'en' }));

      // The nominations route guard redirects to Home with 307 when showAllNominations is false.
      // Verify we landed on the home page by checking the start button is visible.
      await expect(page.getByTestId(testIds.voter.home.startButton)).toBeVisible({ timeout: 10000 });
    });
  });
});
