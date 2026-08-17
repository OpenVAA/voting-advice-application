/**
 * @file perm-show-feedback-survey.spec.ts — perm-chain spec.
 *
 * Renamed in place from perm-header-show-feedback (see phase 120) and EXTENDED
 * with the results-view feedback/survey popup-coordination assertions + the
 * survey.showIn[] per-surface audit.
 *
 * Seed (`show-feedback-survey.ts`):
 *   - `header.showFeedback: true`            — feedback Button in Banner top bar.
 *   - `results.showFeedbackPopup: 1`         — feedback popup, 1s countdown on /results.
 *   - `results.showSurveyPopup: 1`           — survey popup, 1s countdown on /results.
 *   - `survey.showIn: ['resultsPopup']`      — survey surfaces as a results popup.
 *
 * Assertions (HARD — rigidity contract: no expect.soft / try-catch / .catch):
 *   1. header-feedback Button visible on the voter intro; click opens the
 *      feedback-form dialog (the ORIGINAL assertion, kept verbatim).
 *   2. FEEDBACK popup coordination on /results: placement (renders after results),
 *      timing/once (exactly one popup element), no-double-pop, dismiss-persistence
 *      across reload.
 *   3. SURVEY popup coordination on /results: same 4 criteria. The popup queue is
 *      FIFO and shows ONE popup at a time (popupState.svelte.ts:
 *      `#current = $derived(#queue[0])`); with both countdowns active the feedback
 *      popup leads, so the survey only surfaces once feedback is dismissed
 *      (trace-confirmed; mirrors popupNotice.probe.spec.ts).
 *   4. survey.showIn SURFACE AUDIT — the survey banner mounts ONLY on the surfaces
 *      named in `survey.showIn`. Re-seed showIn per net-new surface (frontpage /
 *      entityDetails — both render SurveyBanner.svelte's `survey-banner` testid)
 *      and assert the banner is present on the seeded surface and ABSENT on the
 *      other. (`resultsPopup` is covered by tests 2-3 above; `navigation` renders
 *      a text-only NavItem with no stable test anchor — audited, deferred; see
 *      120-07-SUMMARY.)
 *
 * The spec re-seeds the `app_settings` singleton per showIn surface (perm-singleton
 * pattern, mirroring perm-org-matching.spec.ts) and restores the shipped posture
 * (`survey.showIn: ['resultsPopup']`) in afterAll so the singleton is not left
 * mutated for any downstream perm node.
 *
 * Rigidity contract: testid-only via `testIds`; getByRole permitted for the popup
 * close button (popupNotice fixture) per the locator-guard carve-out.
 */

import { createPopupNotice } from '../../fixtures/shared/popupNotice.fixture';
import { expect, test } from '../../fixtures/voter/views';
import { answerAndAdvanceToResults, walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

test.describe('perm-show-feedback-survey (EPERM-09)', () => {
  test.describe.configure({ mode: 'serial' });

  let client: SupabaseAdminClient;

  test.beforeAll(() => {
    client = new SupabaseAdminClient();
  });

  test.afterAll(async () => {
    // Restore the seed's shipped survey.showIn posture so the singleton is not
    // left mutated for any downstream perm node (perm-header-show-help next).
    if (client) await client.updateAppSettings({ survey: { showIn: ['resultsPopup'] } });
  });

  // --- Test 1: ORIGINAL header-feedback assertion (kept verbatim) ---------------
  test('header-feedback visible on voter intro; click opens feedback-form', async ({ page, voterHomePage }) => {
    await voterHomePage.goToPage('en');
    const feedbackBtn = page.getByTestId(testIds.shared.header.feedback);
    await expect(feedbackBtn).toBeVisible();
    await feedbackBtn.click();
    await expect(page.getByTestId('feedback-form')).toBeVisible();
  });

  // --- Test 1b: feedback text persists across cancel-then-reopen ----------------
  // The FeedbackModal keeps <Feedback bind:this={feedbackRef}> mounted across
  // close (FeedbackModal.svelte:62); the cancel path calls closeFeedback()
  // WITHOUT reset (only a successful send resets, via onSent → feedbackRef.reset).
  // So feedback typed before an accidental cancel survives and is still present
  // on reopen — a load-bearing UX invariant (todo #4 / OQ 7.1 parity gap). HARD
  // assertions, testid-only; no /results nav and no app_settings mutation.
  test('feedback text persists across cancel then reopen (kept-mounted form)', async ({ page, voterHomePage }) => {
    const PERSIST_TEXT = 'persistence test text';

    await voterHomePage.goToPage('en');
    const feedbackBtn = page.getByTestId(testIds.shared.header.feedback);
    const description = page.getByTestId('feedback-description');

    // Open the feedback modal and type known text into the description textarea.
    await feedbackBtn.click();
    await expect(page.getByTestId('feedback-form')).toBeVisible();
    await description.fill(PERSIST_TEXT);
    await expect(description).toHaveValue(PERSIST_TEXT);

    // Cancel — the modal closes but the kept-mounted form retains its $state
    // (cancel does not reset; only a successful send does).
    await page.getByTestId('feedback-cancel').click();
    await expect(page.getByTestId('feedback-form')).toBeHidden();

    // Reopen — the previously-typed text is still there.
    await feedbackBtn.click();
    await expect(page.getByTestId('feedback-form')).toBeVisible();
    await expect(description).toHaveValue(PERSIST_TEXT);
  });

  // --- Test 2: FEEDBACK popup coordination on /results --------------------------
  test('feedback popup: surfaces on /results (once, no double-pop), dismiss persists across reload', async ({
    page
  }) => {
    const popups = createPopupNotice(page);

    await walkUntilQuestionsIntro(page);
    await answerAndAdvanceToResults(page, 'max');

    // Placement + timing: the feedback popup surfaces after the results render.
    await popups.expectVisible('feedback');
    // No double-pop: exactly ONE feedback popup element exists.
    await expect(page.getByTestId(testIds.shared.feedbackPopup)).toHaveCount(1);
    // Dismiss-persistence: dismiss → reload → must NOT reappear.
    await popups.dismissAndReload('feedback');
  });

  // --- Test 3: SURVEY popup coordination on /results ----------------------------
  test('survey popup: surfaces on /results behind feedback (once, no double-pop), dismiss persists across reload', async ({
    page
  }) => {
    const popups = createPopupNotice(page);

    await walkUntilQuestionsIntro(page);
    await answerAndAdvanceToResults(page, 'max');

    // FIFO queue: the feedback popup leads. Dismiss it to surface the survey.
    await popups.expectVisible('feedback');
    await popups.dismiss('feedback');

    // Placement + timing: the survey popup surfaces once feedback is dismissed.
    await popups.expectVisible('survey');
    // No double-pop: exactly ONE survey popup element exists.
    await expect(page.getByTestId(testIds.shared.surveyPopup)).toHaveCount(1);
    // Dismiss-persistence: dismiss → reload → must NOT reappear.
    await popups.dismissAndReload('survey');
  });

  // --- Test 4: survey.showIn surface audit (net-new surfaces) -------------------
  test('survey.showIn=[frontpage]: banner present on frontpage, absent on entityDetails', async ({
    page,
    voterHomePage,
    resultsPage
  }) => {
    await client.updateAppSettings({ survey: { showIn: ['frontpage'] } });

    // Present on the seeded surface (frontpage / voter intro).
    await voterHomePage.goToPage('en');
    await expect(page.getByTestId(testIds.shared.surveyBanner)).toBeVisible();

    // Absent on a non-seeded surface (entityDetails of a result card). The
    // results feedback popup (results.showFeedbackPopup is still seeded) surfaces
    // on /results and its modal scrim intercepts the card click — dismiss it
    // before opening the entity card (mirrors the perm-interactive-info
    // dismiss-before-nav pattern).
    const popups = createPopupNotice(page);
    await walkUntilQuestionsIntro(page);
    await answerAndAdvanceToResults(page, 'max');
    await popups.expectVisible('feedback');
    await popups.dismiss('feedback');
    await resultsPage.selectEntityTab('cands');
    await openCandidateDetails(page);
    await expect(page.getByTestId(testIds.shared.surveyBanner)).toHaveCount(0);
  });

  test('survey.showIn=[entityDetails]: banner present on entityDetails, absent on frontpage', async ({
    page,
    voterHomePage,
    resultsPage
  }) => {
    await client.updateAppSettings({ survey: { showIn: ['entityDetails'] } });

    // Absent on a non-seeded surface (frontpage / voter intro).
    await voterHomePage.goToPage('en');
    await expect(page.getByTestId(testIds.shared.surveyBanner)).toHaveCount(0);

    // Present on the seeded surface (entityDetails of a result card). Dismiss the
    // results feedback popup first (its scrim intercepts the card click).
    const popups = createPopupNotice(page);
    await walkUntilQuestionsIntro(page);
    await answerAndAdvanceToResults(page, 'max');
    await popups.expectVisible('feedback');
    await popups.dismiss('feedback');
    await resultsPage.selectEntityTab('cands');
    await openCandidateDetails(page);
    await expect(page.getByTestId(testIds.shared.surveyBanner)).toBeVisible();
  });
});

/**
 * Navigate to a candidate's entity-details view from the active candidate
 * results section.
 *
 * The shared `resultsPage.openEntityDetailsForCard` helper scopes the
 * `entity-card-action` lookup INSIDE the matched `entity-card`. That works for
 * org/subcard cards (whose action wraps the inner header) but NOT for a
 * no-subcard candidate card, where `EntityCardAction` is the OUTER link
 * WRAPPING the `entity-card` article (EntityCard.svelte:220) — so the action is
 * a parent, not a descendant, of the card. This minimal seed has a single
 * no-subcard candidate, so we click the first `entity-card-action` in the active
 * candidate section directly (the parent link) and hard-assert the
 * entity-details container. testid-only.
 */
async function openCandidateDetails(page: Page): Promise<void> {
  const section = page.getByTestId(testIds.voter.results.candidateSection);
  await section.getByTestId('entity-card-action').first().click();
  await expect(page.getByTestId(testIds.voter.results.entityDetails)).toBeVisible();
}
