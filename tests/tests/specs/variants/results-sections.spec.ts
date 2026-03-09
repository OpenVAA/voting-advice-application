/**
 * Results section configuration variant E2E tests.
 *
 * Covers:
 * - CONF-05: Candidates-only results section (no tabs, candidate section visible, party hidden)
 * - CONF-06: Organizations-only results section (no tabs, party section visible, candidate hidden)
 * - Both sections: tabs visible for switching between candidate and organization views
 *
 * Uses the `variant-results-sections` Playwright project which depends on
 * `variant-multi-election` (reuses the same multi-election dataset with 2 elections).
 *
 * Each test modifies `results.sections` via StrapiAdminClient and reloads the
 * results page to verify the correct sections are displayed. The afterAll block
 * restores the default settings.
 *
 * IMPORTANT: Every updateAppSettings call includes ALL sibling settings within
 * each component to avoid Pitfall 2 (Strapi content-manager PUT replaces entire
 * components, not just specified fields).
 */

import { expect, test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import { StrapiAdminClient } from '../../utils/strapiAdminClient';
import type { Page } from '@playwright/test';

// Disable tracing for this serial spec to avoid ENOENT errors with
// shared browser contexts.
test.use({ trace: 'off' });

// Ensure unauthenticated voter context.
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Shared settings that suppress interfering popups (notification + data consent).
 */
const suppressInterferingPopups = {
  notifications: { voterApp: { show: false } },
  analytics: { trackEvents: false }
};

/**
 * Default entity settings.
 */
const defaultEntitySettings = {
  entities: {
    hideIfMissingAnswers: { candidate: false },
    showAllNominations: true
  }
};

/**
 * Default question settings.
 */
const defaultQuestionSettings = {
  questions: {
    categoryIntros: { show: false },
    questionsIntro: { allowCategorySelection: false, show: false },
    showResultsLink: true
  }
};

/**
 * Complete results component settings. Used in every updateAppSettings call
 * that modifies results.sections to avoid Pitfall 2.
 */
function resultsSettings(sections: string[]) {
  return {
    results: {
      sections,
      cardContents: { candidate: ['submatches'], organization: ['candidates'] },
      showFeedbackPopup: 0,
      showSurveyPopup: 0
    }
  };
}

/**
 * Default election settings included in settings calls.
 */
const defaultElectionSettings = {
  elections: {
    disallowSelection: false,
    showElectionTags: true,
    startFromConstituencyGroup: undefined
  }
};

// ---------------------------------------------------------------------------
// Results section variants (CONF-05, CONF-06)
// ---------------------------------------------------------------------------

test.describe('Results section variants', () => {
  test.describe.configure({ mode: 'serial' });

  let sharedPage: Page;
  const client = new StrapiAdminClient();

  test.beforeAll(async ({ browser }) => {
    await client.login();
    sharedPage = await browser.newPage();

    // Navigate through the voter journey once to reach results.
    // Flow: Home -> Intro -> Elections -> Questions -> Results
    await sharedPage.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await sharedPage.getByTestId(testIds.voter.home.startButton).click();

    // Intro page
    const introStart = sharedPage.getByTestId(testIds.voter.intro.startButton);
    await introStart.waitFor({ state: 'visible', timeout: 10000 });
    await introStart.click();

    // Election selection page (2 elections in multi-election dataset)
    const electionsList = sharedPage.getByTestId(testIds.voter.elections.list);
    await electionsList.waitFor({ state: 'visible', timeout: 10000 });
    await sharedPage.getByTestId(testIds.voter.elections.continue).click();

    // Answer all questions
    const answerOption = sharedPage.getByTestId(testIds.voter.questions.answerOption);
    const nextButton = sharedPage.getByTestId(testIds.voter.questions.nextButton);
    const categoryStart = sharedPage.getByTestId(testIds.voter.questions.categoryStart);

    // Wait for first question or category intro
    await answerOption.first().or(categoryStart).waitFor({ state: 'visible', timeout: 10000 });
    if (await categoryStart.isVisible()) {
      await categoryStart.click();
      await answerOption.first().waitFor({ state: 'visible', timeout: 10000 });
    }

    let onResults = false;
    for (let i = 0; i < 50 && !onResults; i++) {
      if (sharedPage.url().includes('/results')) {
        onResults = true;
        break;
      }

      try {
        await answerOption.first().waitFor({ state: 'visible', timeout: 5000 });
      } catch {
        if (sharedPage.url().includes('/results')) {
          onResults = true;
          break;
        }
        if (await categoryStart.isVisible().catch(() => false)) {
          await categoryStart.click();
          continue;
        }
        break;
      }

      const urlBefore = sharedPage.url();
      await answerOption.nth(2).click();

      try {
        await sharedPage.waitForURL((url) => url.toString() !== urlBefore, { timeout: 5000 });
        if (!sharedPage.url().includes('/results') && await categoryStart.isVisible().catch(() => false)) {
          await categoryStart.click();
        }
      } catch {
        if (await nextButton.isVisible()) {
          await nextButton.click();
          await sharedPage.waitForURL(/\/results/, { timeout: 10000 });
        }
        onResults = true;
      }
    }

    // Verify we're on the results page
    await sharedPage.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible', timeout: 10000 });
  });

  test.afterAll(async () => {
    // Restore default settings
    await client.updateAppSettings({
      ...resultsSettings(['candidate', 'organization']),
      ...defaultQuestionSettings,
      ...defaultElectionSettings,
      ...defaultEntitySettings,
      ...suppressInterferingPopups
    });
    await client.dispose();
    await sharedPage.close();
  });

  test('should show only candidates when sections is ["candidate"]', async () => {
    // CONF-05: Set results.sections to candidates only
    await client.updateAppSettings({
      ...resultsSettings(['candidate']),
      ...defaultQuestionSettings,
      ...defaultElectionSettings,
      ...defaultEntitySettings,
      ...suppressInterferingPopups
    });

    // Reload to pick up settings change
    await sharedPage.reload();
    await sharedPage.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible', timeout: 10000 });

    // Verify entity tabs are NOT visible (single section = no tabs needed)
    const entityTabs = sharedPage.getByTestId(testIds.voter.results.entityTabs);
    await expect(entityTabs).not.toBeVisible();

    // Verify candidate section IS visible
    const candidateSection = sharedPage.getByTestId(testIds.voter.results.candidateSection);
    await expect(candidateSection).toBeVisible();

    // Verify party section is NOT visible
    const partySection = sharedPage.getByTestId(testIds.voter.results.partySection);
    await expect(partySection).not.toBeVisible();
  });

  test('should show only organizations when sections is ["organization"]', async () => {
    // CONF-06: Set results.sections to organizations only
    await client.updateAppSettings({
      ...resultsSettings(['organization']),
      ...defaultQuestionSettings,
      ...defaultElectionSettings,
      ...defaultEntitySettings,
      ...suppressInterferingPopups
    });

    // Reload to pick up settings change
    await sharedPage.reload();
    await sharedPage.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible', timeout: 10000 });

    // Verify entity tabs are NOT visible (single section = no tabs)
    const entityTabs = sharedPage.getByTestId(testIds.voter.results.entityTabs);
    await expect(entityTabs).not.toBeVisible();

    // Verify party section IS visible
    const partySection = sharedPage.getByTestId(testIds.voter.results.partySection);
    await expect(partySection).toBeVisible();

    // Verify candidate section is NOT visible
    const candidateSection = sharedPage.getByTestId(testIds.voter.results.candidateSection);
    await expect(candidateSection).not.toBeVisible();
  });

  test('should show both sections with tabs when sections is ["candidate", "organization"]', async () => {
    // Restore default: both sections
    await client.updateAppSettings({
      ...resultsSettings(['candidate', 'organization']),
      ...defaultQuestionSettings,
      ...defaultElectionSettings,
      ...defaultEntitySettings,
      ...suppressInterferingPopups
    });

    // Reload to pick up settings change
    await sharedPage.reload();
    await sharedPage.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible', timeout: 10000 });

    // Verify entity tabs ARE visible (2 sections = tabs shown)
    const entityTabs = sharedPage.getByTestId(testIds.voter.results.entityTabs);
    await expect(entityTabs).toBeVisible();

    // Verify candidate section is visible (default first tab)
    const candidateSection = sharedPage.getByTestId(testIds.voter.results.candidateSection);
    await expect(candidateSection).toBeVisible();

    // Click the organizations/parties tab
    await entityTabs.getByRole('tab', { name: /parties/i }).click();

    // Verify party section is accessible
    const partySection = sharedPage.getByTestId(testIds.voter.results.partySection);
    await expect(partySection).toBeVisible();
  });
});
