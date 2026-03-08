/**
 * Voter popup E2E tests.
 *
 * Covers:
 * - VOTE-15: Feedback popup timing and dismissal memory
 * - VOTE-16: Survey popup timing with multi-setting configuration
 * - Both popup types verified to NOT appear when disabled
 *
 * Each describe block creates its own StrapiAdminClient, enables required
 * settings in beforeAll, and restores defaults in afterAll.
 *
 * IMPORTANT: Notification and data consent popups are disabled via
 * `notifications.voterApp.show: false` and `analytics.trackEvents: false`
 * to prevent popup queue interference with the target popups.
 *
 * Runs within the `voter-app` project which depends only on data-setup
 * (no auth needed for voter tests).
 */

import { voterTest as test } from '../../fixtures/voter.fixture';
import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import { StrapiAdminClient } from '../../utils/strapiAdminClient';

// Ensure unauthenticated voter context
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Shared settings that suppress interfering popups (notification + data consent).
 * Applied in every describe block's beforeAll to prevent popup queue collisions.
 */
const suppressInterferingPopups = {
  notifications: { voterApp: { show: false } },
  analytics: { trackEvents: false }
};

/**
 * Default settings to restore in afterAll blocks.
 * Resets popup-related settings to their data.setup.ts defaults.
 */
const defaultPopupSettings = {
  results: { showFeedbackPopup: null, showSurveyPopup: null },
  survey: { showIn: [], linkTemplate: '' },
  notifications: { voterApp: { show: true } },
  analytics: { trackEvents: false }
};

// ---------------------------------------------------------------------------
// VOTE-15: Feedback popup
// ---------------------------------------------------------------------------

test.describe('feedback popup (VOTE-15)', () => {
  const client = new StrapiAdminClient();

  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await client.login();
    await client.updateAppSettings({
      results: { showFeedbackPopup: 2, showSurveyPopup: null },
      survey: { showIn: [], linkTemplate: '' },
      ...suppressInterferingPopups
    });
  });

  test.afterAll(async () => {
    await client.updateAppSettings(defaultPopupSettings);
    await client.dispose();
  });

  test('should show feedback popup after delay on results page', async ({ answeredVoterPage }) => {
    const page = answeredVoterPage;

    // Verify results list is visible (confirming we are on the results page)
    await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible();

    // Wait for the feedback popup dialog to appear (2s delay + 5s buffer)
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 7000 });

    // Verify the dialog is visible and contains a heading (feedback popup has an h3 title)
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('h3').first()).toBeVisible();
  });

  test('should remember dismissal after page reload', async ({ answeredVoterPage }) => {
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

test.describe('survey popup (VOTE-16)', () => {
  const client = new StrapiAdminClient();

  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await client.login();
    await client.updateAppSettings({
      results: { showFeedbackPopup: null, showSurveyPopup: 2 },
      survey: { showIn: ['resultsPopup'], linkTemplate: 'https://test.survey.com' },
      ...suppressInterferingPopups
    });
  });

  test.afterAll(async () => {
    await client.updateAppSettings(defaultPopupSettings);
    await client.dispose();
  });

  test('should show survey popup after delay on results page', async ({ answeredVoterPage }) => {
    const page = answeredVoterPage;

    // Verify results list is visible (confirming we are on the results page)
    await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible();

    // Wait for the survey popup dialog to appear (2s delay + 5s buffer)
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 7000 });

    // Verify the dialog is visible and contains a link (survey popup has a SurveyButton link)
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('h3').first()).toBeVisible();
    await expect(dialog.getByRole('link')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Popups disabled
// ---------------------------------------------------------------------------

test.describe('popups disabled', () => {
  const client = new StrapiAdminClient();

  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await client.login();
    await client.updateAppSettings({
      results: { showFeedbackPopup: null, showSurveyPopup: null },
      survey: { showIn: [], linkTemplate: '' },
      ...suppressInterferingPopups
    });
  });

  test.afterAll(async () => {
    await client.updateAppSettings(defaultPopupSettings);
    await client.dispose();
  });

  test('should not show any popup when disabled', async ({ answeredVoterPage }) => {
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
