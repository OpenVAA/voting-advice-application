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
 * Each test modifies `results.sections` via SupabaseAdminClient and reloads the
 * results page to verify the correct sections are displayed. The afterAll block
 * restores the default settings.
 */

import { expect, test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
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
 * Complete results component settings for configuring results.sections.
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

/**
 * In multi-election mode, the results page shows an election accordion first.
 * Selects the first election if the accordion is visible, then waits for the results list.
 */
async function waitForResultsList(page: Page): Promise<void> {
  // Dismiss any dialogs first (nominations warning, survey popup, etc.)
  for (let i = 0; i < 3; i++) {
    const dialog = page.getByRole('dialog');
    try {
      await dialog.first().waitFor({ state: 'visible', timeout: 2000 });
      const continueBtn = dialog.first().getByRole('button', { name: /continue/i });
      const closeBtn = dialog.first().getByRole('button', { name: /close/i });
      if (await continueBtn.isVisible()) await continueBtn.click();
      else if (await closeBtn.isVisible()) await closeBtn.click();
      await dialog.first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    } catch {
      break;
    }
  }

  const electionAccordion = page.getByTestId(testIds.voter.results.electionAccordion);
  const resultsList = page.getByTestId(testIds.voter.results.list);
  // Wait for either the accordion or the results list to appear
  await electionAccordion.or(resultsList).waitFor({ state: 'visible', timeout: 10000 });
  // If accordion is visible, select the election with candidates (2025)
  if (await electionAccordion.isVisible().catch(() => false)) {
    const election2025 = electionAccordion.getByRole('option', { name: /2025/ });
    if (await election2025.isVisible().catch(() => false)) {
      await election2025.click();
    } else {
      // Expand accordion and select
      await electionAccordion.getByRole('option').first().click();
      await election2025.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
      if (await election2025.isVisible()) await election2025.click();
    }
  }
  await resultsList.waitFor({ state: 'visible', timeout: 10000 });
}

// ---------------------------------------------------------------------------
// Results section variants (CONF-05, CONF-06)
// ---------------------------------------------------------------------------

test.describe('Results section variants', { tag: ['@variant'] }, () => {
  test.describe.configure({ mode: 'serial' });

  let sharedPage: Page;
  const client = new SupabaseAdminClient();

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();

    // Suppress popups before navigating through the voter journey
    await client.updateAppSettings({
      ...defaultQuestionSettings,
      ...defaultEntitySettings,
      results: {
        sections: ['candidate', 'organization'],
        cardContents: { candidate: ['submatches'], organization: ['candidates'] },
        showFeedbackPopup: 0,
        showSurveyPopup: 0
      },
      notifications: { voterApp: { show: false } },
      analytics: { trackEvents: false }
    });

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

    // TODO: Remove this goto() fallback. Same issue as in multi-election.spec.ts —
    // the elections Continue button's goto() silently fails in sharedPage context.
    // This bypasses the client-side navigation chain and may mask real routing bugs.
    try {
      await sharedPage.waitForURL((url) => !url.toString().includes('/elections'), { timeout: 3000 });
    } catch {
      const e1 = await client.findData('elections', { externalId: { $eq: 'test-election-1' } });
      const e2 = await client.findData('elections', { externalId: { $eq: 'test-election-2' } });
      const c1 = await client.findData('constituencies', { externalId: { $eq: 'test-constituency-alpha' } });
      const c2 = await client.findData('constituencies', { externalId: { $eq: 'test-constituency-e2' } });
      const eqs = [e1.data?.[0]?.id, e2.data?.[0]?.id].filter(Boolean).map(id => `electionId=${id}`).join('&');
      const cqs = [c1.data?.[0]?.id, c2.data?.[0]?.id].filter(Boolean).map(id => `constituencyId=${id}`).join('&');
      const baseUrl = sharedPage.url().replace(/\/elections.*/, '');
      await sharedPage.goto(`${baseUrl}/questions?${eqs}&${cqs}`);
    }

    // Dismiss any dialogs that appear (missing nominations, survey, etc.)
    for (let i = 0; i < 3; i++) {
      const dialog = sharedPage.getByRole('dialog');
      try {
        await dialog.first().waitFor({ state: 'visible', timeout: 2000 });
        const continueBtn = dialog.first().getByRole('button', { name: /continue/i });
        const closeBtn = dialog.first().getByRole('button', { name: /close/i });
        if (await continueBtn.isVisible()) await continueBtn.click();
        else if (await closeBtn.isVisible()) await closeBtn.click();
        await dialog.first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
      } catch {
        break; // No more dialogs
      }
    }

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

    // Verify we're on the results page (handles multi-election accordion)
    await waitForResultsList(sharedPage);
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

    // Reload to pick up settings change (handles multi-election accordion)
    await sharedPage.reload();
    await waitForResultsList(sharedPage);

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

    // Reload to pick up settings change (handles multi-election accordion)
    await sharedPage.reload();
    await waitForResultsList(sharedPage);

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

    // Reload to pick up settings change (handles multi-election accordion)
    await sharedPage.reload();
    await waitForResultsList(sharedPage);

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
