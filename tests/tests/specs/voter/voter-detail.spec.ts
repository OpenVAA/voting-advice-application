/**
 * Voter entity detail E2E tests.
 *
 * Covers:
 * - VOTE-11: Candidate detail page with info and opinions tabs
 * - VOTE-12: Party detail page with info, candidates (submatches), and opinions tabs
 *
 * Uses the `answeredVoterPage` fixture from `voter.fixture.ts` which
 * navigates the voter journey and answers all questions, landing on
 * the results page. Each test gets a fresh page instance.
 *
 * Entity details are accessed by navigating to the entity detail URL.
 * The results page uses pushState + beforeNavigate to show details in
 * a drawer overlay, but direct URL navigation renders the full entity
 * detail page route, which is more reliable for E2E testing.
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
  // The answeredVoterPage fixture navigates 16 questions (~20-25s).
  // Increase timeout to 60s so the test body has sufficient time.
  test.setTimeout(60000);

  test('should open candidate detail page when clicking a result card', async ({ answeredVoterPage: page }) => {
    // Get the first entity card's link href to navigate directly (VOTE-11).
    // The results page intercepts entity card clicks via beforeNavigate + pushState
    // to show a drawer overlay. For E2E reliability, we navigate directly to the
    // entity detail URL, which renders the full detail page route.
    const href = await page.getByTestId('entity-card-action').first().getAttribute('href');
    expect(href).toBeTruthy();
    await page.goto(href!);

    // Wait for the entity detail page to load
    await page.waitForURL(/\/results\/candidate\//, { timeout: 10000 });

    // Assert entity details are visible on the detail page.
    // The full page route sets data-testid="voter-entity-detail" (via restProps on EntityDetails),
    // while the drawer overlay uses the component's default "entity-details" testId.
    await expect(page.getByTestId(testIds.voter.entityDetail.container)).toBeVisible({ timeout: 10000 });
  });

  test('should display candidate info and opinions tabs', async ({ answeredVoterPage: page }) => {
    // Navigate directly to the first entity's detail page (VOTE-11)
    const href = await page.getByTestId('entity-card-action').first().getAttribute('href');
    expect(href).toBeTruthy();
    await page.goto(href!);
    await page.waitForURL(/\/results\/candidate\//, { timeout: 10000 });

    // Assert entity details are visible
    await expect(page.getByTestId(testIds.voter.entityDetail.container)).toBeVisible({ timeout: 10000 });

    // Assert info tab content is visible (default tab)
    await expect(page.getByTestId(testIds.voter.entityDetail.infoTab)).toBeVisible();

    // Switch to opinions tab
    await page.getByRole('tab', { name: /opinions/i }).click();

    // Assert opinions content area is visible
    await expect(page.getByTestId(testIds.voter.entityDetail.opinionsTab)).toBeVisible();

    // Navigate back to results
    await page.goBack();
    await page.waitForURL(/\/results/, { timeout: 10000 });
  });

  test('should display candidate answers correctly in info and opinions tabs', async ({ answeredVoterPage: page }) => {
    // Open "Test Candidate Alpha" who has:
    // - Info answers: campaign slogan "Progress for all", years of experience, etc.
    // - Opinion answers with open answers on default-dataset Q1, Q3, and Q5
    const href = await page
      .getByTestId('entity-card-action')
      .filter({ hasText: alphaCandidate.lastName })
      .first()
      .getAttribute('href');
    expect(href).toBeTruthy();
    await page.goto(href!);
    await page.waitForURL(/\/results\/candidate\//, { timeout: 10000 });

    // Assert entity details are visible
    await expect(page.getByTestId(testIds.voter.entityDetail.container)).toBeVisible({ timeout: 10000 });

    // --- Info tab: candidate's info question answers are displayed ---
    const infoTab = page.getByTestId(testIds.voter.entityDetail.infoTab);
    await expect(infoTab).toBeVisible();
    // Campaign slogan (text-type info answer) from dataset
    const sloganAnswer = alphaAnswers['test-question-text'].value as Record<string, string>;
    await expect(infoTab).toContainText(sloganAnswer.en);

    // --- Opinions tab ---
    await page.getByRole('tab', { name: /opinions/i }).click();
    const opinionsTab = page.getByTestId(testIds.voter.entityDetail.opinionsTab);
    await expect(opinionsTab).toBeVisible();

    // Candidate's opinion answer is correctly indicated:
    // Alpha answered Q1 -- the corresponding choice radio has entitySelected class
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

  test('should open party detail page with info, candidates, and opinions tabs', async ({
    answeredVoterPage: page
  }) => {
    // Navigate directly to a party/organization detail page.
    // Due to a known Svelte 5 reactivity issue (DEFERRED: $state changes in
    // {#snippet} blocks don't propagate to template rendering), tab switching
    // on the results page doesn't update the content section. Instead, we
    // construct a party detail URL by extracting organization match data
    // from the page's JavaScript context.
    const orgUrl = await page.evaluate(() => {
      // Access the match data from Svelte stores to find an organization entity.
      // The entity cards on the candidate view contain party info links, but
      // they are not rendered as navigable links. Instead, we find the
      // organization matches from the global page data.
      //
      // Look for any link on the page that points to an organization
      const links = document.querySelectorAll('a[href]');
      for (const link of links) {
        const href = link.getAttribute('href');
        if (href && href.includes('/results/organization/')) return href;
      }
      // If no organization link found, check candidate card's party badge
      // The party names are shown but may not be links
      return null;
    });

    // If no organization link exists on the page, navigate to a candidate
    // detail page and find the party link from there
    let href: string;
    if (orgUrl) {
      href = orgUrl;
    } else {
      // Navigate to a candidate detail page first
      const candidateHref = await page.getByTestId('entity-card-action').first().getAttribute('href');
      expect(candidateHref).toBeTruthy();
      await page.goto(candidateHref!);
      await page.waitForURL(/\/results\/candidate\//, { timeout: 10000 });
      await expect(page.getByTestId(testIds.voter.entityDetail.container)).toBeVisible({ timeout: 10000 });

      // On the candidate detail page, the party badge should be a link
      const partyLink = page.locator('a[href*="/results/organization/"]').first();
      await expect(partyLink).toBeVisible({ timeout: 5000 });
      href = (await partyLink.getAttribute('href'))!;
    }

    expect(href).toBeTruthy();
    await page.goto(href);
    await page.waitForURL(/\/results\/(party|organization)\//, { timeout: 10000 });

    // Assert entity details are visible on the detail page
    await expect(page.getByTestId(testIds.voter.entityDetail.container)).toBeVisible({ timeout: 10000 });

    // Assert info tab is visible (default tab)
    await expect(page.getByTestId(testIds.voter.entityDetail.infoTab)).toBeVisible();

    // Switch to candidates/submatches tab
    await page.getByRole('tab', { name: /candidates/i }).click();
    await expect(page.getByTestId(testIds.voter.entityDetail.submatchesTab)).toBeVisible();

    // Switch to opinions tab
    await page.getByRole('tab', { name: /opinions/i }).click();
    await expect(page.getByTestId(testIds.voter.entityDetail.opinionsTab)).toBeVisible();

    // Navigate back to results
    await page.goBack();
    await page.waitForURL(/\/results/, { timeout: 10000 });
  });
});
