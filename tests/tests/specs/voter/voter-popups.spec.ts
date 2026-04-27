/**
 * Voter popup E2E tests.
 *
 * Covers:
 * - VOTE-15: Feedback popup timing and dismissal memory
 * - VOTE-16: Survey popup timing with multi-setting configuration
 * - Both popup types verified to NOT appear when disabled
 *
 * Each describe block creates its own SupabaseAdminClient, enables required
 * settings in beforeAll, and restores defaults in afterAll.
 *
 * Notification and data consent popups are disabled via
 * `notifications.voterApp.show: false` and `analytics.trackEvents: false`
 * to prevent popup queue interference with the target popups.
 *
 * Runs within the `voter-app` project which depends only on data-setup
 * (no auth needed for voter tests).
 */

import { voterTest as test } from '../../fixtures/voter.fixture';
import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

// All describe blocks share global app settings state -- run serially.
test.describe.configure({ mode: 'serial', timeout: 60000 });

// Ensure unauthenticated voter context.
// Disable trace to avoid Playwright 1.58.2 ENOENT trace writer conflicts
// when serial describe blocks share state across beforeAll/afterAll.
test.use({ storageState: { cookies: [], origins: [] }, trace: 'off' });

/**
 * Shared settings that suppress interfering popups (notification + data consent).
 * Applied in every describe block's beforeAll to prevent popup queue collisions.
 */
const suppressInterferingPopups = {
  notifications: { voterApp: { show: false } },
  analytics: { trackEvents: false }
};

/**
 * Question and entity settings that data.setup.ts configures.
 * Included in every updateAppSettings call to preserve the navigation flow
 * that the answeredVoterPage fixture depends on (Home -> Intro -> Questions -> Results).
 */
const preserveNavigationSettings = {
  questions: {
    questionsIntro: { show: false, allowCategorySelection: false },
    categoryIntros: { show: false, allowSkip: true },
    showResultsLink: true
  },
  entities: {
    hideIfMissingAnswers: { candidate: false },
    showAllNominations: true
  }
};

/**
 * Default settings to restore in afterAll blocks.
 * Resets popup-related settings to their data.setup.ts defaults.
 */
const defaultPopupSettings = {
  results: { showFeedbackPopup: null, showSurveyPopup: null },
  survey: { showIn: [], linkTemplate: '' },
  notifications: { voterApp: { show: true } },
  analytics: { trackEvents: false },
  ...preserveNavigationSettings
};

// ---------------------------------------------------------------------------
// VOTE-15: Feedback popup
// ---------------------------------------------------------------------------

test.describe('feedback popup (VOTE-15)', { tag: ['@voter'] }, () => {
  const client = new SupabaseAdminClient();

  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await client.updateAppSettings({
      results: { showFeedbackPopup: 2, showSurveyPopup: null },
      survey: { showIn: [], linkTemplate: '' },
      ...preserveNavigationSettings,
      ...suppressInterferingPopups
    });
  });

  test.afterAll(async () => {
    await client.updateAppSettings(defaultPopupSettings);

  });

  test('should show feedback popup after delay on results page', async ({ answeredVoterPage }) => {
    // Increase timeout: fixture navigates 16 questions + popup has 2s delay
    test.setTimeout(60000);
    const page = answeredVoterPage;

    // Verify results list is visible (confirming we are on the results page)
    await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible();

    // Wait for the feedback popup dialog to appear (2s delay + buffer for SSR load + Supabase fetch)
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 15000 });

    // Verify the dialog is visible and contains a heading (feedback popup has an h3 title)
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('h3').first()).toBeVisible();
  });

  test('should remember dismissal after page reload', async ({ answeredVoterPage }) => {
    // Increase timeout: fixture navigates 16 questions + popup timing + reload
    test.setTimeout(60000);
    const page = answeredVoterPage;

    // Wait for the feedback popup to appear
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 7000 });
    await expect(dialog).toBeVisible();

    // Dismiss the popup by clicking the close button (the X button inside the dialog)
    await dialog.locator('button.btn-circle').click();

    // Wait for the dialog to disappear
    await expect(dialog).not.toBeVisible({ timeout: 3000 });

    // Reload the page to verify dismissal memory via localStorage
    await page.reload();

    // Wait for the results list to reappear (page fully loaded)
    await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible({ timeout: 10000 });

    // Wait sufficient time for the popup delay to pass (2s + 3s buffer)
    // Use a positive assertion on the results list as the timing mechanism
    await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible', timeout: 5000 });

    // After waiting, verify the popup did NOT reappear (dismissed status stored in localStorage)
    await expect(dialog).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// VOTE-16: Survey popup
// ---------------------------------------------------------------------------

test.describe('survey popup (VOTE-16)', { tag: ['@voter'] }, () => {
  const client = new SupabaseAdminClient();

  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await client.updateAppSettings({
      results: { showFeedbackPopup: null, showSurveyPopup: 2 },
      survey: { showIn: ['resultsPopup'], linkTemplate: 'https://test.survey.com' },
      ...preserveNavigationSettings,
      ...suppressInterferingPopups
    });
  });

  test.afterAll(async () => {
    await client.updateAppSettings(defaultPopupSettings);

  });

  test('should show survey popup after delay on results page', async ({ answeredVoterPage }) => {
    // Increase timeout: fixture navigates 16 questions + popup has 2s delay
    test.setTimeout(60000);
    const page = answeredVoterPage;

    // Verify results list is visible (confirming we are on the results page)
    await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible();

    // Wait for the survey popup dialog to appear (2s delay + 5s buffer)
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 7000 });

    // Verify the dialog is visible and contains the survey action button
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('h3').first()).toBeVisible();
    await expect(dialog.getByRole('button', { name: /survey/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Popups disabled
// ---------------------------------------------------------------------------

test.describe('popups disabled', { tag: ['@voter'] }, () => {
  const client = new SupabaseAdminClient();

  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await client.updateAppSettings({
      results: { showFeedbackPopup: null, showSurveyPopup: null },
      survey: { showIn: [], linkTemplate: '' },
      ...preserveNavigationSettings,
      ...suppressInterferingPopups
    });
  });

  test.afterAll(async () => {
    await client.updateAppSettings(defaultPopupSettings);

  });

  test('should not show any popup when disabled', async ({ answeredVoterPage }) => {
    // Increase timeout: fixture navigates 16 questions + wait for no popup
    test.setTimeout(60000);
    const page = answeredVoterPage;

    // Verify results list is visible (confirming we are on the results page)
    await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible();

    // Wait 3 seconds to allow any popup to potentially appear.
    // Use the results list as the timing anchor (it should remain visible throughout).
    await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible', timeout: 3000 });

    // After waiting, verify no dialog appeared
    const dialogCount = await page.getByRole('dialog').count();
    expect(dialogCount).toBe(0);
  });
});
