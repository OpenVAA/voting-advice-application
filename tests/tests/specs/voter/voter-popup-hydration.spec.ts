import { voterTest as test } from '../../fixtures/voter.fixture';
import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

// LAYOUT-03 / D-09 regression gate:
//
// Validates that a setTimeout-triggered popup.push(...) surfaces through the
// root layout popup slot when the /results page is reached via FULL PAGE LOAD
// (page.goto — SSR + hydration path). This is the exact reactivity path the
// v2.1 PopupRenderer wrapper was introduced to guard.
//
// Plan 60-04 runs this test:
//   - If PASS with PopupRenderer inlined into root layout → PopupRenderer deleted.
//   - If FAIL with PopupRenderer inlined → PopupRenderer retained with D-10
//     rationale comment. Inlining is reverted.
//
// Seeding strategy — direct URL navigation (chosen over fixture-driven):
//
// 1. Discover election + constituency IDs via SupabaseAdminClient.findData
//    using stable external_ids (`test-election-1`, first applicable
//    constituency). Postgres-assigned UUIDs are NOT stable across runs, so
//    external_id lookup is required.
// 2. Seed VoterContext answerStore via addInitScript — the production shape
//    is { version: 1, data: { [questionId]: { value } } } (see
//    apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts line 123
//    + staticSettings.appVersion.requireUserDataVersion=1). The key is
//    `VoterContext-answerStore` (see answerStore.svelte.ts line 16).
// 3. page.goto('/results?electionId=X&constituencyId=Y') — the URL carries
//    both selectors, so the (voters)/(located)/+layout.ts loader does not
//    need to imply (avoids the 2-election e2e-template election selector
//    page). This exercises the FULL page load (SSR + hydration) path on
//    /results directly.
//
// Popup trigger: results layout's $effect reads $appSettings.results.showFeedbackPopup
// (set to 2 in beforeAll) and calls startFeedbackPopupCountdown(2). The
// setTimeout fires ~2s post-hydration and pushes FeedbackPopup onto
// popupQueue. The popup dialog must render via root layout popup slot —
// this is the empirical gate for LAYOUT-03.

test.describe.configure({ mode: 'serial', timeout: 60000 });
test.use({ storageState: { cookies: [], origins: [] }, trace: 'off' });

test.describe('setTimeout popup on full page load (LAYOUT-03 regression gate)', { tag: ['@voter'] }, () => {
  const client = new SupabaseAdminClient();
  test.describe.configure({ mode: 'serial' });

  // Copied verbatim from voter-popups.spec.ts — same interference-suppression
  // policy, same navigation-preserving override set.
  const suppressInterferingPopups = {
    notifications: { voterApp: { show: false } },
    analytics: { trackEvents: false }
  };

  const preserveNavigationSettings = {
    questions: {
      questionsIntro: { show: false, allowCategorySelection: false },
      categoryIntros: { show: false, allowSkip: true },
      showResultsLink: true
    },
    entities: {
      hideIfMissingAnswers: { candidate: false },
      showAllNominations: true
    }
  };

  const defaultPopupSettings = {
    results: { showFeedbackPopup: null, showSurveyPopup: null },
    survey: { showIn: [], linkTemplate: '' },
    notifications: { voterApp: { show: true } },
    analytics: { trackEvents: false },
    ...preserveNavigationSettings
  };

  // Discovered IDs for direct URL navigation (populated in beforeAll).
  let electionId: string | undefined;
  let constituencyId: string | undefined;
  let questionIds: Array<string> = [];

  test.beforeAll(async () => {
    await client.updateAppSettings({
      results: { showFeedbackPopup: 2, showSurveyPopup: null },
      survey: { showIn: [], linkTemplate: '' },
      ...preserveNavigationSettings,
      ...suppressInterferingPopups
    });

    // Discover election ID via stable external_id.
    const electionResult = await client.findData('elections', {
      externalId: { $eq: 'test-election-1' }
    });
    if (electionResult.type !== 'success' || !electionResult.data?.[0])
      throw new Error(`Could not find test-election-1: ${electionResult.cause ?? 'no data'}`);
    electionId = electionResult.data[0].id as string;

    // Discover first constituency ID. e2e template has multiple constituencies;
    // any one that's applicable to test-election-1 will do.
    const constituencyResult = await client.findData('constituencies', {
      externalId: { $like: 'test-constituency-%' }
    });
    if (constituencyResult.type !== 'success' || !constituencyResult.data?.[0])
      throw new Error(`Could not find test constituencies: ${constituencyResult.cause ?? 'no data'}`);
    constituencyId = constituencyResult.data[0].id as string;

    // Discover question IDs — the answerStore needs answers keyed by
    // question ID. The results page requires answers >= minimumAnswers
    // for resultsAvailable to be true, but even with no answers the page
    // still renders (resultsAvailable=false, browse mode). Seed 16+ answers
    // to match the data.setup.ts default minimum.
    const questionResult = await client.findData('questions', {
      externalId: { $like: 'test-question-%' }
    });
    if (questionResult.type !== 'success' || !questionResult.data)
      throw new Error(`Could not find test questions: ${questionResult.cause ?? 'no data'}`);
    questionIds = questionResult.data.map((q) => q.id as string);
  });

  test.afterAll(async () => {
    await client.updateAppSettings(defaultPopupSettings);
  });

  test('popup appears on full page load to /results (LAYOUT-03 hydration path)', async ({ page }) => {
    test.setTimeout(60000);

    // Fail fast if beforeAll discovery didn't populate IDs.
    if (!electionId || !constituencyId)
      throw new Error('electionId / constituencyId not discovered in beforeAll');

    // Seed voter answerStore in localStorage before navigation. Shape
    // matches apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts
    // `saveItemToStorage` (localStorage branch): { version, data }.
    // staticSettings.appVersion.version=1 per @openvaa/app-shared.
    const answerEntries: Record<string, { value: number }> = {};
    for (const qid of questionIds) {
      // Likert-5 middle value — valid answer for singleChoiceOrdinal questions
      // in the e2e template. Actual value doesn't matter for this test —
      // only that an answer exists per question.
      answerEntries[qid] = { value: 3 };
    }
    const storageSeed = { version: 1, data: answerEntries };
    await page.addInitScript((seed) => {
      window.localStorage.setItem('VoterContext-answerStore', JSON.stringify(seed));
    }, storageSeed);

    // Navigate directly to /results with both election + constituency carried
    // in the URL query string. The (voters)/(located)/+layout.ts loader will
    // read these via parseParams instead of trying (and failing) to imply
    // from the 2-election e2e template. This is a FULL page load — the exact
    // SSR + hydration path under test.
    await page.goto(`/results?electionId=${electionId}&constituencyId=${constituencyId}`);

    // Wait for results list to be visible — signals hydration completed and
    // the results layout $effect fired, registering the
    // startFeedbackPopupCountdown setTimeout (delay: 2s).
    await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible({ timeout: 15000 });

    // Wait for the feedback popup dialog — this is the assertion under test.
    // The setTimeout fires ~2s post-hydration; popupQueue.push must surface
    // through the root layout popup slot for this to pass.
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 15000 });
    await expect(dialog).toBeVisible();
  });
});
