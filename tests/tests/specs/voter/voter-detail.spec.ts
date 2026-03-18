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

import { expect } from '@playwright/test';
import defaultDataset from '../../data/default-dataset.json' with { type: 'json' };
import { voterTest as test } from '../../fixtures/voter.fixture';
import { testIds } from '../../utils/testIds';

// The candidate used for detail content verification (has info answers and open answers)
const alphaCandidate = defaultDataset.candidates.find((c) => c.externalId === 'test-candidate-alpha')!;
const alphaAnswers = alphaCandidate.answersByExternalId as Record<
  string,
  { value: string | number | boolean | Record<string, string>; info?: Record<string, string> }
>;

test.describe('voter entity detail', { tag: ['@voter'] }, () => {
  test('should open candidate detail drawer when clicking a result card', async ({ answeredVoterPage: page }) => {
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
    await expect(dialog).toBeHidden();
  });

  test('should display candidate answers correctly in info and opinions tabs', async ({ answeredVoterPage: page }) => {
    // Open "Test Candidate Alpha" who has:
    // - Info answers: campaign slogan "Progress for all", years of experience, etc.
    // - Opinion answers with open answers on default-dataset Q1, Q3, and Q5
    await page.getByTestId(testIds.voter.results.card).filter({ hasText: alphaCandidate.lastName }).click();

    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();

    // --- Info tab: candidate's info question answers are displayed ---
    const infoTab = dialog.getByTestId(testIds.voter.entityDetail.infoTab);
    await expect(infoTab).toBeVisible();
    // Campaign slogan (text-type info answer) from dataset
    const sloganAnswer = alphaAnswers['test-question-text'].value as Record<string, string>;
    await expect(infoTab).toContainText(sloganAnswer.en);

    // --- Opinions tab ---
    await dialog.getByRole('tab', { name: /opinions/i }).click();
    const opinionsTab = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);
    await expect(opinionsTab).toBeVisible();

    // Candidate's opinion answer is correctly indicated:
    // Alpha answered Q1 — the corresponding choice radio has entitySelected class
    const firstQuestionInput = opinionsTab.getByTestId('opinion-question-input').first();
    await expect(firstQuestionInput.locator('.entitySelected')).toHaveCount(1);

    // Voter's answer is displayed alongside the candidate's:
    // The voter's selected radio is checked, and voter label ("You") is shown
    await expect(firstQuestionInput.locator('input:checked')).toHaveCount(1);
    await expect(firstQuestionInput.getByText('You')).toBeAttached();

    // Candidate's open answers are displayed where provided (from dataset info fields)
    const openAnswerKeys = Object.keys(alphaAnswers).filter(
      (k) => alphaAnswers[k].info && (alphaAnswers[k].info as Record<string, string>).en
    );
    for (const key of openAnswerKeys) {
      await expect(opinionsTab).toContainText((alphaAnswers[key].info as Record<string, string>).en);
    }
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

    // Click the first party card's action link to open drawer.
    // The EntityCardAction component renders as <a data-testid="entity-card-action">.
    // When subcards exist, the link wraps the header inside the card;
    // when no subcards, the link wraps the entire card from outside.
    // Using entity-card-action works in both cases.
    await partySection.getByTestId('entity-card-action').first().click();

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
    await expect(dialog).toBeHidden();
  });
});
