/**
 * Voter entity detail E2E tests.
 *
 * Covers:
 * - VOTE-11: Candidate detail drawer with info and opinions tabs
 * - VOTE-12: Party detail drawer with info, candidates (submatches), and opinions tabs
 *
 * Uses the `answeredVoterPage` fixture from `voter.fixture.ts` which
 * navigates the voter journey and answers all questions, landing on
 * the results page. Each test gets a fresh page instance.
 *
 * Runs within the `voter-app` project which depends only on data-setup
 * (no auth needed for voter tests).
 */

import { voterTest as test } from '../../fixtures/voter.fixture';
import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';

test.describe('voter entity detail', () => {
  test('should open candidate detail drawer when clicking a result card', async ({
    answeredVoterPage: page
  }) => {
    // Click the first entity card on the results page (VOTE-11)
    await page.getByTestId(testIds.voter.results.card).first().click();

    // Assert a drawer/dialog opens
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();

    // Assert entity details are visible inside the drawer
    await expect(dialog.getByTestId('entity-details')).toBeVisible();
  });

  test('should display candidate info and opinions tabs', async ({ answeredVoterPage: page }) => {
    // Click first entity card to open drawer (VOTE-11)
    await page.getByTestId(testIds.voter.results.card).first().click();

    // Assert drawer is open
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();

    // Assert info tab content is visible (default tab)
    await expect(dialog.getByTestId(testIds.voter.entityDetail.infoTab)).toBeVisible();

    // Switch to opinions tab via tab button within the drawer
    await dialog.getByRole('tab', { name: /opinions/i }).click();

    // Assert opinions content area is visible
    await expect(dialog.getByTestId(testIds.voter.entityDetail.opinionsTab)).toBeVisible();

    // Close the drawer by pressing Escape
    await page.keyboard.press('Escape');

    // Assert drawer is closed
    await expect(dialog).not.toBeVisible();
  });

  test('should open party detail drawer with info, candidates, and opinions tabs', async ({
    answeredVoterPage: page
  }) => {
    // First switch to organizations/parties tab on results page
    const entityTabs = page.getByTestId(testIds.voter.results.entityTabs);
    await entityTabs.getByRole('tab', { name: /parties/i }).click();

    // Wait for party section to be visible
    const partySection = page.getByTestId(testIds.voter.results.partySection);
    await expect(partySection).toBeVisible();

    // Click the first party card's header link to open drawer.
    // Party cards with subcards don't make the whole card clickable -- only the header
    // area is wrapped in an action link, so we click the heading link inside the card.
    await partySection.getByTestId(testIds.voter.results.card).first().getByRole('link').first().click();

    // Assert drawer opens with party entity details
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId('entity-details')).toBeVisible();

    // Assert info tab is visible (default tab)
    await expect(dialog.getByTestId(testIds.voter.entityDetail.infoTab)).toBeVisible();

    // Switch to candidates/submatches tab
    await dialog.getByRole('tab', { name: /candidates/i }).click();
    await expect(dialog.getByTestId(testIds.voter.entityDetail.submatchesTab)).toBeVisible();

    // Switch to opinions tab
    await dialog.getByRole('tab', { name: /opinions/i }).click();
    await expect(dialog.getByTestId(testIds.voter.entityDetail.opinionsTab)).toBeVisible();

    // Close the drawer
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});
