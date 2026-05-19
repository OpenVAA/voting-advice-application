/**
 * Constituency selection variant E2E tests (CONF-03).
 *
 * Covers the voter flow when each election owns a separate, disjoint
 * constituency group:
 * - Constituency selection page appears after election selection
 * - Each election renders its own section in the selector (groups don't
 *   overlap and contain no hierarchical/parent-child members)
 * - Constituency-scoped results: only candidates nominated at the selected
 *   constituency for the active election surface on the results list
 * - Multi-election results with election accordion
 * - Missing-nominations warning when one election has nominations at the
 *   selected constituency and another does not
 *
 * Uses the constituency overlay dataset which creates:
 * - Election 1 (2025) bound to test-cg-east-municipalities (NE + SE)
 * - Election 2 (2026) bound to test-cg-west-municipalities (NW + SW)
 * - 4 constituencies (NE/SE/NW/SW), disjoint groups, no parent hierarchy
 * - NE/SE/SW each have 2 unique candidates; NW is intentionally empty for
 *   the partial-coverage warning test
 *
 * Runs within the `variant-constituency` project which depends on
 * `data-setup-constituency` for dataset loading.
 */

import { expect, test } from '@playwright/test';
import { buildRoute } from '../../utils/buildRoute';
import { dismissMissingNominationsIfPresent } from '../../utils/missingNominations';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

/**
 * Answer questions one-by-one until the results page is reached.
 *
 * Module-level helper hoisted out of test bodies (RESEARCH Pattern 4 canonical 3)
 * so playwright/no-conditional-in-test holds for the test body itself. The
 * conditionals inside this helper are legitimate post-await branches on a
 * settled URL (not a race-mask): `waitForURL` resolves once the URL changes,
 * and we then branch deterministically based on whether the new URL contains
 * `/results` (auto-advance terminated on results) or not (last-question fallback
 * needs the explicit next-button click).
 *
 * @returns The number of questions answered before reaching /results.
 */
async function answerUntilResults(
  page: Page,
  answerOption: ReturnType<Page['getByTestId']>,
  nextButton: ReturnType<Page['getByTestId']>,
  maxQuestions = 50
): Promise<number> {
  let questionCount = 0;
  let onResultsPage = false;

  while (!onResultsPage && questionCount < maxQuestions) {
    questionCount++;
    const urlBefore = page.url();

    // Answer the current question (select the middle option)
    await answerOption.nth(2).click();

    try {
      // Wait for auto-advance (URL change)
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3000 });
      onResultsPage = page.url().includes('/results');
    } catch {
      // No auto-advance — last question; click the explicit next/results button.
      await nextButton.waitFor({ state: 'visible' });
      await nextButton.click();
      await page.waitForURL(/\/results/, { timeout: 10000 });
      onResultsPage = true;
    }
  }

  return questionCount;
}

/**
 * Open the election-accordion's first option if the accordion is rendered.
 *
 * Hoisted out of test bodies (RESEARCH Pattern 4 canonical 3 — same idiom as
 * `answerUntilResults`). The union locator settles on EITHER the accordion or
 * the bare results list; the helper then dispatches deterministically based on
 * which anchor resolved.
 *
 * Phase 78 CLEAN-05 WR-02a fix: replaces the post-union snapshot pattern
 * `(count > 0 && isVisible)` with a dedicated `electionAccordion.waitFor()` —
 * if the union resolved on the results list (not the accordion), this nested
 * waitFor races to timeout deterministically and we proceed to the no-op
 * branch. The previous count+isVisible combo was a snapshot-of-races pattern
 * that could pass on a half-rendered accordion. The accordion-specific waitFor
 * makes the branch deterministic on a settled anchor.
 */
async function selectElectionFromAccordionIfPresent(
  electionAccordion: ReturnType<Page['getByTestId']>,
  resultsList: ReturnType<Page['getByTestId']>
): Promise<void> {
  // Union waitFor resolves the page-level race between "multi-election results
  // with accordion" and "single-election results list".
  await electionAccordion.or(resultsList).first().waitFor({ state: 'visible', timeout: 10000 });

  // Deterministic-branch dispatch: short waitFor scoped to the accordion alone.
  // If the union landed on the results list, this resolves to null and we skip
  // the click; if the accordion is present, the waitFor confirms its visibility
  // before we interact with it.
  const accordionResolved = await electionAccordion
    .waitFor({ state: 'visible', timeout: 1000 })
    .then(() => true)
    .catch(() => false);
  if (accordionResolved) {
    await electionAccordion.getByRole('option').first().click();
  }
}

/**
 * Explicitly select an election in the results-page accordion by name pattern.
 *
 * Mirrors `results-sections.spec.ts:waitForResultsList`'s accordion handling
 * but lets the caller name the target election rather than always picking
 * `.first()`. Required by `should display constituency-filtered results`,
 * which previously inherited an arbitrary selection from the upstream
 * `selectElectionFromAccordionIfPresent` (`.first()`) call and therefore
 * could land on an election with no nominations for the current constituency.
 *
 * AccordionSelect state machine (AccordionSelect.svelte:49,57-69,86):
 *   - `optionCount === 1`: lone option has `pointer-events-none`; cannot click,
 *     don't need to (single option is implicitly active).
 *   - Target already `aria-selected="true"`: clicking would just toggle
 *     `expanded`, not change selection — skip.
 *   - Target visible: click directly.
 *   - Target not visible (collapsed accordion showing only the active option):
 *     click the visible option to flip `expanded = true`, wait for the target
 *     to mount, then click it.
 */
async function selectElectionByName(
  electionAccordion: ReturnType<Page['getByTestId']>,
  pattern: RegExp
): Promise<void> {
  await electionAccordion.waitFor({ state: 'visible', timeout: 10000 });
  const optionCount = await electionAccordion.getByRole('option').count();
  if (optionCount <= 1) return;
  const target = electionAccordion.getByRole('option', { name: pattern }).first();
  const alreadyActive = (await target.getAttribute('aria-selected').catch(() => null)) === 'true';
  if (alreadyActive) return;
  if (await target.isVisible().catch(() => false)) {
    await target.click();
    return;
  }
  await electionAccordion.getByRole('option').first().click();
  await target.waitFor({ state: 'visible', timeout: 5000 });
  await target.click();
}

/**
 * Activate the entity tab matching `pattern` (case-insensitive) if the tabs
 * row is rendered and the target tab isn't already active.
 *
 * The Tabs component (`Tabs.svelte:44-69`) renders `<li role="tab">` children
 * inside a `role="tablist"` ul. The entity-tabs row is conditionally rendered
 * by the results layout only when `entityTabs.length > 1` — i.e. the active
 * election:constituency tuple has both candidate AND organization (or
 * alliance) matches. For single-section configurations (e.g. only candidates
 * nominated for the active election), the tabs row never mounts and this
 * helper no-ops.
 */
async function selectEntityTabIfPresent(entityTabs: ReturnType<Page['getByTestId']>, pattern: RegExp): Promise<void> {
  const visible = await entityTabs.isVisible().catch(() => false);
  if (!visible) return;
  const target = entityTabs.getByRole('tab', { name: pattern }).first();
  if (!(await target.isVisible().catch(() => false))) return;
  const isSelected = (await target.getAttribute('aria-selected').catch(() => null)) === 'true';
  if (!isSelected) await target.click();
}

test.describe('Constituency selection variant', { tag: ['@variant'] }, () => {
  test.describe.configure({ mode: 'serial' });

  let sharedPage: Page;
  const client = new SupabaseAdminClient();

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();

    // Suppress notification and data consent popups that block test clicks
    await client.updateAppSettings({
      notifications: { voterApp: { show: false } },
      analytics: { trackEvents: false },
      entities: {
        hideIfMissingAnswers: { candidate: false },
        showAllNominations: true
      },
      questions: {
        categoryIntros: { show: false },
        questionsIntro: { allowCategorySelection: false, show: false },
        showResultsLink: true
      },
      results: {
        sections: ['candidate', 'organization'],
        cardContents: { candidate: ['submatches'], organization: ['children'] },
        showFeedbackPopup: 0,
        showSurveyPopup: 0
      }
    });
  });

  test.afterAll(async () => {
    await sharedPage.close();
  });

  test('should show constituency selection page after election selection', async () => {
    test.setTimeout(30000);

    // Navigate Home -> Start -> Intro
    await sharedPage.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await sharedPage.getByTestId(testIds.voter.home.startButton).click();

    const introStart = sharedPage.getByTestId(testIds.voter.intro.startButton);
    await introStart.waitFor({ state: 'visible' });
    await introStart.click();

    // With 2 elections, the (located) layout gate should redirect to elections
    const electionsList = sharedPage.getByTestId(testIds.voter.elections.list);
    await expect(electionsList).toBeVisible({ timeout: 10000 });

    // Verify 2 election options are shown
    const electionOptions = sharedPage.getByTestId(testIds.voter.elections.card);
    await expect(electionOptions).toHaveCount(2);

    // Both elections should be pre-checked by default
    await expect(electionOptions.nth(0)).toBeChecked();
    await expect(electionOptions.nth(1)).toBeChecked();

    // Click continue to proceed to constituency selection
    await sharedPage.getByTestId(testIds.voter.elections.continue).click();

    // Should redirect to constituency selection (elections have multiple constituencies)
    const constituenciesList = sharedPage.getByTestId(testIds.voter.constituencies.list);
    await expect(constituenciesList).toBeVisible({ timeout: 10000 });

    // Verify a continue button exists for constituency selection
    const continueBtn = sharedPage.getByTestId(testIds.voter.constituencies.continue);
    await expect(continueBtn).toBeVisible();
  });

  test('should allow constituency selection and proceed to questions', async () => {
    test.setTimeout(30000);

    // The constituency selection page renders one section per election
    // (groups are disjoint, so no sections combine):
    // - Election 1: "Eastern Municipalities" (NE + SE)
    // - Election 2: "Western Municipalities" (NW + SW)
    //
    // We pick SE for Election 1 and SW for Election 2.

    const constituenciesList = sharedPage.getByTestId(testIds.voter.constituencies.list);

    // Election 1 → SE Municipality (via the Eastern Municipalities combobox).
    const easternCombobox = constituenciesList.getByRole('combobox', { name: /Eastern Municipalities/ }).first();
    await easternCombobox.click();
    await easternCombobox.fill('SE Municipality');
    const easternListbox = sharedPage.getByRole('listbox');
    await easternListbox.waitFor({ state: 'visible', timeout: 5000 });
    await easternListbox.getByRole('option', { name: /SE Municipality/ }).click();

    // Election 2 → SW Municipality (via the Western Municipalities combobox).
    const westernCombobox = constituenciesList.getByRole('combobox', { name: /Western Municipalities/ }).first();
    await westernCombobox.click();
    await westernCombobox.fill('SW Municipality');
    const westernListbox = sharedPage.getByRole('listbox');
    await westernListbox.waitFor({ state: 'visible', timeout: 5000 });
    await westernListbox.getByRole('option', { name: /SW Municipality/ }).click();

    // The continue button should be enabled once both selections are made.
    const continueButton = sharedPage.getByTestId(testIds.voter.constituencies.continue);
    await expect(continueButton).toBeEnabled();

    // Click continue to proceed to questions
    await continueButton.click();

    // Should proceed to questions page
    await expect(sharedPage).toHaveURL(/\/questions/, { timeout: 10000 });
  });

  test('should answer questions and reach results', async () => {
    test.setTimeout(60000);

    // We should be on the questions page
    await expect(sharedPage).toHaveURL(/\/questions/);

    const answerOption = sharedPage.getByTestId(testIds.voter.questions.answerOption);
    const nextButton = sharedPage.getByTestId(testIds.voter.questions.nextButton);

    // Dismiss the "missing nominations" modal if it appears. The shared
    // helper races the modal's open against the first answer-option painting
    // so we cannot miss the modal on cold-paint runs where it opens at the
    // 3-4s mark (awaitNominationsSettled safety-timer window in
    // (located)/+layout.svelte) — the prior 3s try/catch swallow was the
    // root cause of this test's flakiness under the CONF-03 dataset, where
    // every constituency permutation surfaces the warning.
    await dismissMissingNominationsIfPresent(sharedPage);

    // Wait for first question to load
    await answerOption.first().waitFor({ state: 'visible', timeout: 10000 });

    // Answer all questions until /results — hoisted helper keeps the in-test
    // body conditional-free (RESEARCH Pattern 4 canonical 3).
    const questionCount = await answerUntilResults(sharedPage, answerOption, nextButton);

    // Verify results page loaded — in multi-election mode, select an election first.
    // The hoisted helper performs an atomic two-anchor waitFor + deterministic
    // dispatch (RESEARCH Pattern 4 canonical 3). The election may not have nominations
    // in which case the no nominations warning is accepted.
    const electionAccordion = sharedPage.getByTestId(testIds.voter.results.electionAccordion);
    const resultsList = sharedPage.getByTestId(testIds.voter.results.list);
    const noNominationsWarning = sharedPage.getByTestId(testIds.voter.results.noNominationsWarning);
    await selectElectionFromAccordionIfPresent(electionAccordion, resultsList);
    await expect(resultsList.or(noNominationsWarning)).toBeVisible({ timeout: 10000 });

    // We should have answered a reasonable number of questions.
    // Base dataset has 8 opinion questions (test-question-1..8); the
    // disjoint-municipality variant doesn't add any constituency-scoped
    // opinion questions, so we expect at least the base count.
    expect(questionCount).toBeGreaterThanOrEqual(8);
  });

  test('should show election accordion in multi-election results', async () => {
    // With 2 elections in the dataRoot, the results page should show
    // the election accordion for switching between election results.
    const electionAccordion = sharedPage.getByTestId(testIds.voter.results.electionAccordion);
    await expect(electionAccordion).toBeVisible();
  });

  test('should display constituency-filtered results', async () => {
    // With SE selected for Election 1 and SW selected for Election 2, the
    // Election 1 results pane should show ONLY SE-nominated candidates
    // (SE Candidate One / Two). The remaining variant candidates must be
    // excluded:
    //   - NE candidates are nominated for E1 but at a different constituency
    //     (same group, different muni) → filtered out by exact-id match in
    //     dataRoot.findNominations.
    //   - SW candidates are nominated for E2, not E1 → never surface on the
    //     Election 1 results pane.
    //   - NW has no candidates at all.
    const electionAccordion = sharedPage.getByTestId(testIds.voter.results.electionAccordion);
    await selectElectionByName(electionAccordion, /2025/);

    // Once Election 1 is active, ensure the results list paints for it.
    const resultsList = sharedPage.getByTestId(testIds.voter.results.list);
    await expect(resultsList).toBeVisible({ timeout: 10000 });

    // The entity-tabs row mounts only when the active election:constituency
    // tuple has multiple section types nominated (results.sections includes
    // 'candidate' AND 'organization'); switch to candidates explicitly so the
    // assertion below doesn't depend on URL-derived defaults.
    const entityTabs = sharedPage.getByTestId(testIds.voter.results.entityTabs);
    await selectEntityTabIfPresent(entityTabs, /candidate/i);

    // SE candidates are nominated for E1 at SE (variant template
    // test-nom-const-se-{1,2}-e1) → they must appear in the results list.
    await expect(resultsList.getByText(/SE Candidate One/)).toBeVisible({ timeout: 10000 });
    await expect(resultsList.getByText(/SE Candidate Two/)).toBeVisible();

    // NE candidates: same election, different constituency → filtered out.
    await expect(resultsList.getByText(/NE Candidate One/)).toHaveCount(0);
    await expect(resultsList.getByText(/NE Candidate Two/)).toHaveCount(0);

    // SW candidates: different election → never shown on E1's pane.
    await expect(resultsList.getByText(/SW Candidate One/)).toHaveCount(0);
    await expect(resultsList.getByText(/SW Candidate Two/)).toHaveCount(0);

    // Sanity: at least one entity card rendered.
    const entityCards = sharedPage.getByTestId(testIds.voter.results.card);
    await expect(entityCards.first()).toBeVisible();
  });

  test('should show missing nominations warning for partial-coverage constituency', async () => {
    test.setTimeout(60000);

    // Navigate from scratch and pick SE for Election 1 (has nominations) plus
    // NW for Election 2 (intentionally empty in the variant template). The
    // partial coverage triggers the "some nominations" warning dialog.
    await sharedPage.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await sharedPage.getByTestId(testIds.voter.home.startButton).click();

    const introStart = sharedPage.getByTestId(testIds.voter.intro.startButton);
    await introStart.waitFor({ state: 'visible' });
    await introStart.click();

    // Select both elections
    const electionsList = sharedPage.getByTestId(testIds.voter.elections.list);
    await expect(electionsList).toBeVisible({ timeout: 10000 });
    await sharedPage.getByTestId(testIds.voter.elections.continue).click();

    // Constituency selection page
    const constituenciesList = sharedPage.getByTestId(testIds.voter.constituencies.list);
    await expect(constituenciesList).toBeVisible({ timeout: 10000 });

    // Election 1 → SE Municipality (Eastern Municipalities combobox)
    const easternCombobox = constituenciesList.getByRole('combobox', { name: /Eastern Municipalities/ }).first();
    await easternCombobox.click();
    await easternCombobox.fill('SE Municipality');
    const easternListbox = sharedPage.getByRole('listbox');
    await easternListbox.waitFor({ state: 'visible', timeout: 5000 });
    await easternListbox.getByRole('option', { name: /SE Municipality/ }).click();

    // Election 2 → NW Municipality (Western Municipalities combobox; no
    // nominations in the variant template → triggers the warning).
    const westernCombobox = constituenciesList.getByRole('combobox', { name: /Western Municipalities/ }).first();
    await westernCombobox.click();
    await westernCombobox.fill('NW Municipality');
    const westernListbox = sharedPage.getByRole('listbox');
    await westernListbox.waitFor({ state: 'visible', timeout: 5000 });
    await westernListbox.getByRole('option', { name: /NW Municipality/ }).click();

    // Continue to questions
    const continueButton = sharedPage.getByTestId(testIds.voter.constituencies.continue);
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    // Should reach the questions URL
    await expect(sharedPage).toHaveURL(/\/questions/, { timeout: 10000 });

    // The missing nominations warning dialog should appear because NW
    // Municipality has no nominations for Election 2 while SE Municipality
    // does have nominations for Election 1. getByRole('dialog') only matches
    // an open <dialog>; closed dialogs are hidden from the accessibility tree.
    const dialog = sharedPage.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    // Verify the dialog shows the "some nominations" variant with per-election
    // availability indicators. Election 1 (2025) should be available, Election
    // 2 (2026) should not.
    await expect(dialog.getByText(/Test Election 2025/)).toBeVisible();
    await expect(dialog.getByText(/Test Election 2026/)).toBeVisible();
    await expect(dialog.getByText(/not available/)).toBeVisible();

    // Click Continue to dismiss the dialog and verify the journey can proceed
    await dialog.getByRole('button', { name: /continue/i }).click();
    await dialog.waitFor({ state: 'hidden', timeout: 5000 });

    // After dismissing, questions should still be accessible
    const answerOption = sharedPage.getByTestId(testIds.voter.questions.answerOption);
    await expect(answerOption.first()).toBeVisible({ timeout: 10000 });
  });
});

////////////////////////////////////////////////////////////////////
// Phase 77 / SETTINGS-01 wave B — constituency-filter (PASS-WITH-DEFERRAL)
//
// Per Phase 77 Plan 02 Task 3 (OQ-5 resolution).
//
// Plan 02 Task 0 audit:
//   - `apps/frontend/src/lib/contexts/voter/filters/buildParentFilters.ts:9-13`
//     emits filters ONLY for parent-nomination types (`alliance`, `faction`,
//     `organization`) — NOT for `constituency`.
//   - The voter results filter dialog therefore does NOT render a top-level
//     constituency filter today. Constituency is a navigation/scope concern
//     (election → constituency → questions/results), not a per-list filter.
//   - Conclusion: constituency-filter cell is PASS-WITH-DEFERRAL pending a
//     product decision on whether constituency should surface as a filter.
//
// This block is ADDITIVE — it does NOT modify the existing CONF-03 invariants
// in the serial-mode 'Constituency selection variant' suite above. The skip
// is structural (no surface to assert against), not a flake.
////////////////////////////////////////////////////////////////////
test.describe('SETTINGS-01 wave B — constituency-filter', { tag: ['@variant'] }, () => {
  // reason: PASS-WITH-DEFERRAL stub — no constituency filter UI exists today
  // (Phase 77 Plan 02 OQ-5 resolution). The test.skip annotation documents the
  // PRODUCT-GAP and routes maintainers to the follow-up todo. Phase 77 Plan 01
  // SUMMARY established this PASS-WITH-DEFERRAL pattern for product gaps that
  // are asserter-able only against an absent surface.
  // eslint-disable-next-line playwright/expect-expect
  test('SETTINGS-01 wave B — constituency-filter (PRODUCT-GAP / PASS-WITH-DEFERRAL)', async () => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(
      true,
      [
        'Phase 77 Plan 02 OQ-5 resolution: the voter results filter dialog does NOT render',
        'a constituency filter today. buildParentFilters emits only alliance/faction/organization',
        'filters; no constituency code path exists. PRODUCT-GAP — see follow-up todo at',
        '.planning/todos/pending/2026-05-13-constituency-filter-product-gap.md.'
      ].join(' ')
    );
  });
});
