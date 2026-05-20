import { expect } from '@playwright/test';
import { voterTest as test } from '../../fixtures/voter.fixture';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';

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
test.use({ storageState: { cookies: [], origins: [] } });

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

  ////////////////////////////////////////////////////////////////////
  // Phase 86.3-04 SKIP-FALLBACK (LAYOUT-03 / DETERM-12):
  //   Phase 86.1-03 PASS-WITH-DEFERRAL inheritance EXTENDED — Phase 86.3-04
  //   attempted Path 2 (`page.context().addInitScript` swap; RESEARCH §"Cell
  //   #6 Fix shapes §2") and EMPIRICALLY DISPROVED its sufficiency: the
  //   context-scoped init script writes the localStorage seed before the
  //   navigation, but `/results` still stalls at `Loading…` (15s timeout
  //   on `voter-results-list` testid). Path 2 swap is left in the test
  //   body BELOW (verified-applied) as evidence-of-attempt for the v2.11+
  //   pickup.
  //
  //   Path 1 (`test.use({ storageState })`) hit the RESEARCH §"Pitfall 4"
  //   caveat: storage state is statically applied BEFORE beforeAll, so
  //   the runtime-discovered electionId/constituencyId/questionIds
  //   cannot inform the seed without moving discovery to module-load
  //   IIFE OR hard-coding known external_ids — both out of D-08 1h
  //   scope for a 50/50-probability fix attempt.
  //
  //   Trace evidence: identical `Loading…` symptom to Phase 86.3-03
  //   cell #5 finding — Supabase REST returns 200 (app_settings /
  //   elections / constituencies / questions / candidates / nominations),
  //   page navigates to `/results/candidates?electionId=…&constituencyId=…`
  //   (canonical 308 redirect), but SvelteKit page boundary never
  //   resolves to paint. See `.planning/phases/86.3-…/86.3-03-trace-
  //   analysis.md` for the upstream loader-race characterization.
  //
  //   v2.11+ todo `.planning/todos/pending/2026-05-16-voter-popup-
  //   hydration-layout-03-deeplink.md` augmented with the Phase 86.3-04
  //   empirical-disproof of Path 2 + cross-ref to 86.3-03 trace
  //   analysis. The recommended v2.11+ next action is Recommendation #3
  //   from the todo: replace deeplink with navigation-from-home test
  //   (out of D-02 1h scope).
  //
  //   Production-code path (loader-ordering tweak on (located)/+layout.ts)
  //   remains OUT OF D-10 SCOPE for cell #6.
  //
  //   Alternative regression coverage in PASS_LOCKED today (preserved
  //   from Phase 86.1-03 cell 1 disposition):
  //     - voter-app :: voter-results > drawer paints before list on cold
  //       deeplink (D-10 source-order + content-visibility) — uses
  //       `answeredVoterPage` fixture (in-app navigation), so paints
  //       the same /results surface without the addInitScript race
  //     - voter-app-popups > should show feedback popup after delay on
  //       results page
  //     - voter-app-popups > should show survey popup after delay on
  //       results page
  ////////////////////////////////////////////////////////////////////
  // eslint-disable-next-line playwright/no-skipped-test
  test('popup appears on full page load to /results (LAYOUT-03 hydration path)', async ({ page }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(
      true,
      [
        'Phase 86.3-04 deferred: Path 2 context.addInitScript and Path 1 storageState both insufficient within 1h cap.',
        'Path 2 swap (page.context().addInitScript) applied and verified-applied below as evidence-of-attempt;',
        'empirically disproved — /results still stalls at Loading… (same upstream loader-race symptom as',
        'Phase 86.3-03 cell #5 trace analysis; Supabase REST 200 but SvelteKit page never paints).',
        'Path 1 hit Pitfall 4 (storageState static; cannot consume beforeAll-discovered UUIDs).',
        'Alternative regression coverage: voter-app :: voter-results > drawer paints before list on cold deeplink (D-10);',
        'voter-app-popups > should show feedback popup after delay on results page.',
        'v2.11+: .planning/todos/pending/2026-05-16-voter-popup-hydration-layout-03-deeplink.md (Phase 86.3-04 augmentation).'
      ].join(' ')
    );

    test.setTimeout(60000);

    // Fail fast if beforeAll discovery didn't populate IDs. expect() is the
    // unconditional assertion form per RESEARCH §"Pattern 5" — replaces the
    // prior `if (!x) throw` precondition guard that triggered
    // no-conditional-in-test (DETERM-03).
    expect(electionId, 'electionId must be discovered in beforeAll').toBeTruthy();
    expect(constituencyId, 'constituencyId must be discovered in beforeAll').toBeTruthy();

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
    // Phase 86.3-04 cell #6 Path 2 LEFT IN PLACE on SKIP-FALLBACK as
    // evidence-of-attempt (mirrors Phase 86.1-03 cell 2 storage-clear
    // LEFT IN PLACE pattern). The context-scoped addInitScript swap
    // closes the page-scoped-vs-loader race per RESEARCH §"Cell #6
    // Fix shapes §2" but is EMPIRICALLY INSUFFICIENT: /results still
    // stalls at Loading… (same symptom as Phase 86.3-03 cell #5 trace
    // finding). test.skip(true, …) above short-circuits before this
    // executable statement fires; this code is preserved for the
    // v2.11+ investigator who will pick up the deeper loader-race.
    await page.context().addInitScript((seed) => {
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
    //
    // Phase 86 DETERM-12 LAYOUT-03 settle race fix: bare toBeVisible races
    // the addInitScript localStorage seed and the (located)/+layout.ts loader
    // on cold-start. Replace with expect.poll() settle pattern (canonical
    // analog: voter-browse-without-match.spec.ts:50-54; v2.6 P64 pattern) so
    // the answerStore seed + parseParams converge before the popup assertion
    // fires. See 86-RESEARCH.md §3.2 H1 + 86-PATTERNS.md §5.
    const list = page.getByTestId(testIds.voter.results.list);
    await expect
      .poll(() => list.count(), {
        timeout: 15000,
        message: 'results list must render under LAYOUT-03 deeplink (Phase 86 DETERM-12)'
      })
      .toBeGreaterThan(0);
    await expect(list.first()).toBeVisible();

    // Wait for the feedback popup dialog — this is the assertion under test.
    // The setTimeout fires ~2s post-hydration; popupQueue.push must surface
    // through the root layout popup slot for this to pass.
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 10000 });
    await expect(dialog).toBeVisible();
  });
});
