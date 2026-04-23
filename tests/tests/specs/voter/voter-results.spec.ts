/**
 * Voter results page E2E tests.
 *
 * Covers:
 * - VOTE-08: Results display with candidate section and result cards
 * - VOTE-09: Switching to organizations/parties section
 * - VOTE-10: Entity type tabs for hybrid candidate + organization view
 *
 * Uses the `answeredVoterPage` fixture from `voter.fixture.ts` which
 * navigates the voter journey and answers all questions, landing on
 * the results page. Each test gets a fresh page instance.
 *
 * Runs within the `voter-app` project which depends only on data-setup
 * (no auth needed for voter tests).
 */

import { expect } from '@playwright/test';
import { voterTest as test } from '../../fixtures/voter.fixture';
import { E2E_DEFAULT_CANDIDATES, E2E_ORGANIZATIONS, E2E_VOTER_CANDIDATES } from '../../utils/e2eFixtureRefs';
import { testIds } from '../../utils/testIds';

// Compute expected counts from the e2e template.
// Addendum candidates have unconfirmed nominations and are excluded from voter results.
const visibleCandidateCount = [...E2E_DEFAULT_CANDIDATES, ...E2E_VOTER_CANDIDATES].filter(
  (c) => typeof c.terms_of_use_accepted === 'string' && c.terms_of_use_accepted.length > 0
).length;
const totalPartyCount = E2E_ORGANIZATIONS.length;

test.describe('voter results', { tag: ['@voter'] }, () => {
  test('should display candidates section with result cards', async ({ answeredVoterPage: page }) => {
    // Assert candidate section is visible (VOTE-08)
    const candidateSection = page.getByTestId(testIds.voter.results.candidateSection);
    await expect(candidateSection).toBeVisible();

    // Assert result cards are visible
    const firstCard = page.getByTestId(testIds.voter.results.card).first();
    await expect(firstCard).toBeVisible();

    // Count candidate cards: expect 11 visible candidates
    // - 5 from default dataset (alpha through epsilon, all registered)
    // - 6 from voter dataset (agree, close, neutral, oppose, mixed, partial)
    // The hidden candidate (no termsOfUseAccepted) should NOT appear (12 total - 1 hidden = 11)
    // Addendum candidates have unconfirmed nominations and are also excluded
    const cardCount = page.getByTestId(testIds.voter.results.card);
    await expect(cardCount).toHaveCount(visibleCandidateCount);
  });

  test('should display entity type tabs for switching between candidates and organizations', async ({
    answeredVoterPage: page
  }) => {
    // Assert entity tabs are visible (VOTE-10)
    const entityTabs = page.getByTestId(testIds.voter.results.entityTabs);
    await expect(entityTabs).toBeVisible();

    // The tabs should have at least 2 tab buttons (candidates + organizations)
    const tabButtons = entityTabs.getByRole('tab');
    const tabCount = await tabButtons.count();
    expect(tabCount).toBeGreaterThanOrEqual(2);
  });

  test('should switch to organizations/parties section and back', async ({ answeredVoterPage: page }) => {
    // Click the organizations/parties tab (VOTE-09)
    const entityTabs = page.getByTestId(testIds.voter.results.entityTabs);
    await entityTabs.getByRole('tab', { name: /parties/i }).click();

    // Assert party section is visible
    const partySection = page.getByTestId(testIds.voter.results.partySection);
    await expect(partySection).toBeVisible();

    // Assert party section shows results -- verify the heading mentions "parties"
    // Note: entity-card testId is shared by party cards AND nested candidate subcards,
    // so we verify the party section heading count instead of counting entity-card elements.
    // Use first() because the section also contains party card h3 headings.
    await expect(partySection.locator('h3').first()).toContainText(`${totalPartyCount} parties`);

    // Switch back to candidates tab
    await entityTabs.getByRole('tab', { name: /candidate/i }).click();

    // Assert candidate section is visible again
    const candidateSection = page.getByTestId(testIds.voter.results.candidateSection);
    await expect(candidateSection).toBeVisible();
  });
});
