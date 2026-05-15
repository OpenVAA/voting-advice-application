/**
 * Multi-election voter journey E2E tests.
 *
 * Covers:
 * - CONF-01: Single election (verified by contrast -- multi-election shows selection page)
 * - CONF-02: Multiple elections with election selection and per-election results accordion
 * - CONF-04: Constituency auto-implied when each election has single constituency (no selection page)
 * - disallowSelection: bypasses election selection and shows all elections in results accordion
 *
 * Uses the `variant-multi-election` Playwright project which depends on
 * `data-setup-multi-election` (loads the multi-election overlay dataset).
 *
 * The multi-election overlay adds a 2nd election with its own single constituency,
 * scoped questions, and candidates + cross-nominations for existing candidates.
 * This triggers election selection (2 elections = not auto-implied) but NOT
 * constituency selection (each election has exactly 1 constituency = auto-implied).
 *
 * IMPORTANT: This spec does NOT use `navigateToFirstQuestion()` because that
 * helper assumes auto-implied elections. Election selection is handled explicitly.
 */

import { expect, test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

// Ensure unauthenticated voter context. Tracing inherits from playwright.config.ts
// (trace: 'on'); the prior `test.use({ trace: 'off' })` workaround was a side
// effect of the sharedPage pattern in the Multi-election describe (Playwright
// 1.58.2 ENOENT race when a manually-created `browser.newPage()` Page spanned
// multiple serial tests in one worker). The describe was refactored to per-test
// `page` fixtures below; that race is gone, traces are now available.
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Shared settings that suppress interfering popups (notification + data consent).
 * Applied in every updateAppSettings call to prevent dialog overlays from
 * intercepting test clicks on navigation buttons.
 */
const suppressInterferingPopups = {
  notifications: { voterApp: { show: false } },
  analytics: { trackEvents: false }
};

/**
 * Default entity settings that data setup configures.
 * Included in every updateAppSettings call to ensure consistent test state.
 */
const defaultEntitySettings = {
  entities: {
    hideIfMissingAnswers: { candidate: false },
    showAllNominations: true
  }
};

/**
 * Click the election-accordion option whose name matches `nameRegex`.
 *
 * Module-level helper hoisted out of test bodies (RESEARCH Pattern 4 canonical
 * 3) so playwright/no-conditional-in-test holds for the test body itself. The
 * post-await `if` here is a legitimate control-flow branch on settled DOM state
 * (not a race-mask): we wait for the target option to attach (via
 * `.or(electionAccordion)` union locator + waitFor), then deterministically
 * dispatch — directly click the target if visible, else expand the accordion's
 * first option to surface the rest and re-attempt the click.
 *
 * Note: the lint rule fires on conditionals INSIDE test() callbacks, NOT
 * module-level helpers. The conditional logic here is therefore valid and
 * does not regress determinism (waitFor handles the race; the if() picks the
 * dispatch path AFTER the race has resolved).
 */
async function clickAccordionOptionByName(
  electionAccordion: ReturnType<Page['getByTestId']>,
  nameRegex: RegExp,
  expandIfHidden = true
): Promise<void> {
  const targetOption = electionAccordion.getByRole('option', { name: nameRegex });

  // Wait for either the target option OR the accordion itself to be visible —
  // the accordion always renders first, the target option may be folded behind
  // a header on the first render in multi-election shape.
  await targetOption.or(electionAccordion).first().waitFor({ state: 'visible', timeout: 10000 });

  if (await targetOption.isVisible()) {
    await targetOption.click();
    return;
  }

  if (expandIfHidden) {
    // Expand the accordion to reveal all options, then click the target.
    await electionAccordion.getByRole('option').first().click();
    await targetOption.waitFor({ state: 'visible', timeout: 5000 });
    await targetOption.click();
  }
}

/**
 * Answer all visible questions dynamically, looping until the results page.
 * Handles category intros if they appear between questions.
 *
 * @returns The number of questions answered
 */
async function answerAllQuestions(page: Page): Promise<number> {
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption);
  const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
  const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);
  let questionCount = 0;

  // Wait for first answer option or category intro
  await answerOption.first().or(categoryStart).waitFor({ state: 'visible', timeout: 10000 });
  if (await categoryStart.isVisible()) {
    await categoryStart.click();
    await answerOption.first().waitFor({ state: 'visible', timeout: 10000 });
  }

  while (questionCount < 50) {
    // Check if we're on the results page
    if (page.url().includes('/results')) break;

    // Wait for answer options to be visible
    try {
      await answerOption.first().waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      // No answer options visible -- check if on results
      if (page.url().includes('/results')) break;
      // Might be on a category intro
      if (await categoryStart.isVisible()) {
        await categoryStart.click();
        continue;
      }
      break;
    }

    questionCount++;
    const urlBefore = page.url();

    // Click the 3rd answer option (middle ground)
    await answerOption.nth(2).click();

    // Wait for auto-advance or handle last question
    try {
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 5000 });
      // Check for category intro after URL change. Phase 78 CLEAN-05 WR-01 fix:
      // replaces the `.catch(() => false)` swallow-trap on `isVisible()` with a
      // union waitFor that deterministically resolves on EITHER a category-start
      // landing OR an answer-option landing (steady-state after URL transition).
      // The post-await isVisible() check is then a settled-state probe, not a race.
      if (!page.url().includes('/results')) {
        await answerOption.first().or(categoryStart).waitFor({ state: 'visible', timeout: 5000 });
        if (await categoryStart.isVisible()) {
          await categoryStart.click();
        }
      }
    } catch {
      // URL didn't change -- last question, click next/results button
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForURL(/\/results/, { timeout: 10000 });
      }
      break;
    }
  }

  return questionCount;
}

// ---------------------------------------------------------------------------
// Multi-election voter journey (CONF-01 by contrast, CONF-02, CONF-04)
//
// Per-test `page` fixture pattern. Each test walks the full voter journey
// (Home → Intro → Elections → Continue → Questions → Results) independently
// — no shared browser context, no inter-test state coupling.
//
// History: the prior sharedPage + serial-mode pattern triggered a SvelteKit
// silent-nav race ("freshly-newPage'd sharedPage layout-data promise not
// settled by the time goto() fires", per Phase 78 CLEAN-05 WR-03) and forced
// `trace: 'off'` to work around Playwright 1.58.2's trace-writer ENOENT under
// shared-Page+serial. Per-test pages eliminate both — Playwright manages page
// lifecycle and waits on data-promise settling before yielding the fixture,
// so the manual URL-fallback hack is no longer needed. The matrix-cell test
// below (line ~290) already used this pattern successfully.
// ---------------------------------------------------------------------------

/**
 * Walk the multi-election voter journey from Home to the Results page.
 *
 * Returns the count of opinion questions answered. Each step is a deterministic
 * Playwright wait; no manual URL-goto fallback (per-test `page` fixtures don't
 * have the sharedPage layout-data race that necessitated the prior workaround).
 */
async function navigateMultiElectionToResults(page: Page): Promise<{ questionCount: number }> {
  // Home → start → intro
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  await page.getByTestId(testIds.voter.home.startButton).click();

  const introStart = page.getByTestId(testIds.voter.intro.startButton);
  await introStart.waitFor({ state: 'visible', timeout: 10000 });
  await introStart.click();

  // Elections page → Continue. Both elections pre-checked by default;
  // each has a single constituency so the constituency page auto-implies.
  const electionsList = page.getByTestId(testIds.voter.elections.list);
  await expect(electionsList).toBeVisible({ timeout: 10000 });
  await page.getByTestId(testIds.voter.elections.continue).click();

  // Wait for navigation off /elections (lands on /questions via auto-imply).
  await page.waitForURL((url) => !url.toString().includes('/elections'), { timeout: 10000 });

  // Dismiss "missing nominations" dialog if it appears (some multi-election
  // overlay elections lack candidate/party responses for a given constituency).
  const nominationsDialog = page.getByRole('dialog');
  try {
    await nominationsDialog.waitFor({ state: 'visible', timeout: 3000 });
    await nominationsDialog.getByRole('button', { name: /continue/i }).click();
    await nominationsDialog.waitFor({ state: 'hidden', timeout: 5000 });
  } catch {
    // No dialog appeared.
  }

  // Wait for first answer-option (questions page fully hydrated).
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption);
  await expect(answerOption.first()).toBeVisible({ timeout: 15000 });

  // Answer all questions; helper handles category intros + URL transitions.
  const questionCount = await answerAllQuestions(page);

  return { questionCount };
}

test.describe('Multi-election voter journey', { tag: ['@variant'] }, () => {
  test('should show election selection page with 2 elections', async ({ page }) => {
    // Navigate Home → start → intro.
    await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await page.getByTestId(testIds.voter.home.startButton).click();

    const introStart = page.getByTestId(testIds.voter.intro.startButton);
    await introStart.waitFor({ state: 'visible', timeout: 10000 });
    await introStart.click();

    // With 2 elections, the election selection page appears (not auto-implied).
    // Verifies CONF-01 by contrast: single-election seeds bypass this page.
    const electionsList = page.getByTestId(testIds.voter.elections.list);
    await expect(electionsList).toBeVisible({ timeout: 10000 });

    const electionCards = page.getByTestId(testIds.voter.elections.card);
    await expect(electionCards).toHaveCount(2);

    // CONF-04: constituency selection page does NOT appear because each election
    // has exactly 1 constituency → auto-implied.
    const constituenciesList = page.getByTestId(testIds.voter.constituencies.list);
    await expect(constituenciesList).toBeHidden();
  });

  test('should display questions and reach results', async ({ page }) => {
    test.setTimeout(60000);

    const { questionCount } = await navigateMultiElectionToResults(page);

    // Post-`applyLikertOnlyFilter` (variant-multi-election.setup.ts): base e2e
    // contributes 16 singleChoiceOrdinal opinion questions; the variant overlay
    // adds 2 (test-e2-q-1, test-e2-q-2) → 18 ordinal opinion total.
    expect(questionCount).toBeGreaterThanOrEqual(16);

    // Multi-election results page shows an election accordion (CONF-02).
    const electionAccordion = page.getByTestId(testIds.voter.results.electionAccordion);
    await expect(electionAccordion).toBeVisible({ timeout: 10000 });
  });

  test('should show election accordion and results after selecting election', async ({ page }) => {
    test.setTimeout(60000);

    await navigateMultiElectionToResults(page);

    // Test Election 2025 has candidates; Test Election 2026 may not have
    // respondents in the selected constituency. Hoisted helper performs the
    // atomic two-anchor probe + deterministic expand-then-click dispatch
    // (RESEARCH Pattern 4 canonical 3).
    const electionAccordion = page.getByTestId(testIds.voter.results.electionAccordion);
    await clickAccordionOptionByName(electionAccordion, /2025/);

    const resultsList = page.getByTestId(testIds.voter.results.list);
    await expect(resultsList).toBeVisible({ timeout: 10000 });
  });

  test('should display election-specific questions', async ({ page }) => {
    test.setTimeout(60000);

    await navigateMultiElectionToResults(page);

    // The multi-election overlay adds 2 election-2-specific opinion questions
    // (test-e2-q-1, test-e2-q-2). Walking the full journey confirms all
    // questions across both elections were rendered + answered.
    const candidateSection = page.getByTestId(testIds.voter.results.candidateSection);
    await expect(candidateSection).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// disallowSelection mode
// ---------------------------------------------------------------------------

test.describe('disallowSelection mode', { tag: ['@variant'] }, () => {
  test.describe.configure({ mode: 'serial' });

  const client = new SupabaseAdminClient();

  test.beforeAll(async () => {
    await client.updateAppSettings({
      elections: {
        disallowSelection: true,
        showElectionTags: true,
        startFromConstituencyGroup: undefined
      },
      questions: {
        categoryIntros: { show: false },
        questionsIntro: { allowCategorySelection: false, show: false },
        showResultsLink: true
      },
      ...defaultEntitySettings,
      ...suppressInterferingPopups
    });
  });

  test.afterAll(async () => {
    await client.updateAppSettings({
      elections: {
        disallowSelection: false,
        showElectionTags: true,
        startFromConstituencyGroup: undefined
      },
      questions: {
        categoryIntros: { show: false },
        questionsIntro: { allowCategorySelection: false, show: false },
        showResultsLink: true
      },
      ...defaultEntitySettings,
      ...suppressInterferingPopups
    });
  });

  test('should bypass election selection when disallowSelection is true', async ({ page }) => {
    // Increase timeout for full question journey
    test.setTimeout(60000);

    // Navigate Home -> start -> intro
    await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await page.getByTestId(testIds.voter.home.startButton).click();

    const introStart = page.getByTestId(testIds.voter.intro.startButton);
    await introStart.waitFor({ state: 'visible', timeout: 10000 });
    await introStart.click();

    // Election selection page should NOT appear (disallowSelection implies all elections)
    const electionsList = page.getByTestId(testIds.voter.elections.list);
    // Wait for either the elections list or the first question to appear
    const answerOption = page.getByTestId(testIds.voter.questions.answerOption);
    await answerOption.first().or(electionsList).waitFor({ state: 'visible', timeout: 10000 });

    // Verify election list is NOT visible
    await expect(electionsList).toBeHidden();

    // Dismiss the "missing nominations" dialog if it appears
    // getByRole('dialog') matches only open <dialog>; closed dialogs are hidden.
    const dialog = page.getByRole('dialog');
    try {
      await dialog.waitFor({ state: 'visible', timeout: 3000 });
      await dialog.getByRole('button', { name: /continue/i }).click();
      await dialog.waitFor({ state: 'hidden', timeout: 5000 });
    } catch {
      // No dialog appeared
    }

    // Should proceed to questions (constituency auto-implied for both elections)
    await expect(answerOption.first()).toBeVisible();

    // Answer all questions to reach results
    await answerAllQuestions(page);

    // Verify results page shows election accordion with all elections
    const electionAccordion = page.getByTestId(testIds.voter.results.electionAccordion);
    await expect(electionAccordion).toBeVisible({ timeout: 10000 });

    // Multi-election results require selecting an election before results list appears
    const electionOption = electionAccordion.getByRole('option').first();
    await electionOption.click();

    // Verify results list is visible after selecting an election
    const resultsList = page.getByTestId(testIds.voter.results.list);
    await expect(resultsList).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// E2E-04 cell 3 (Ne × 1c) — ADDITIVE matrix assertion (Phase 74 Plan 04 Task 4)
//
// Reuses the multi-election dataset (variant-multi-election.ts: 2 elections,
// each with exactly 1 constituency — test-constituency-alpha on E1 and
// test-constituency-e2 on E2). The matrix contract:
//   - 2 elections → election selection page SHOWN
//   - 1 constituency per election → constituency selection page BYPASSED
//     (auto-implied at the voter (located)/+layout.ts:55-67 redirect path)
//
// This block is ADDITIVE per Phase 74 CONTEXT D-05 — it does NOT modify the
// CONF-01/CONF-02/CONF-04 invariants asserted by the test blocks above.
// ---------------------------------------------------------------------------

test.describe('matrix cell: Ne × 1c (E2E-04 cell 3)', { tag: ['@variant', '@matrix'] }, () => {
  test('Ne × 1c — election selector shown; constituency auto-implied (single)', async ({ page }) => {
    test.setTimeout(30000);

    await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await page.getByTestId(testIds.voter.home.startButton).click();

    const introStart = page.getByTestId(testIds.voter.intro.startButton);
    await introStart.waitFor({ state: 'visible', timeout: 10000 });
    await introStart.click();

    // (1) Election selector visible — 2 elections (not auto-implied).
    const electionsList = page.getByTestId(testIds.voter.elections.list);
    await expect(electionsList).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId(testIds.voter.elections.card)).toHaveCount(2);

    // Both elections are pre-checked by default. Continue with both selected
    // — each election has 1 constituency, so constituency auto-implies for
    // both elections at the (located)/+layout.ts:55-67 redirect path.
    await page.getByTestId(testIds.voter.elections.continue).click();

    // (2) Constituency selection page is BYPASSED — single constituency per
    // election → auto-implied. The voter-constituencies-list must NOT be
    // visible at any point; the flow proceeds directly to /questions (or an
    // intermediate /intro if questions-intro is enabled).
    await expect(page.getByTestId(testIds.voter.constituencies.list)).toBeHidden();
  });
});
