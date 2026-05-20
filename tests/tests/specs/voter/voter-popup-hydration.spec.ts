import { expect } from '@playwright/test';
import { voterTest as test } from '../../fixtures/voter.fixture';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

// LAYOUT-03 / D-09 regression gate — Phase 86.3-04 v2.11+ Recommendation #3
// landed 2026-05-20.
//
// Validates that a setTimeout-triggered popup.push(...) surfaces through the
// root layout popup slot when /results is reached via in-app navigation
// (Home → Intro → Questions → Results) using the answeredVoterPage fixture.
// This is the exact reactivity path the v2.1 PopupRenderer wrapper was
// introduced to guard.
//
// History — direct page.goto deeplink approach was REPLACED:
//
// Phase 86.1-03 cell 2 + Phase 86.3-04 attempted the cold-deeplink approach
// (page.goto('/results?electionId=X&constituencyId=Y') + addInitScript
// localStorage seed). Both attempts SKIP-FALLBACK'd against an upstream
// voter-app cold-deeplink loader race: the page navigation completes,
// Supabase REST returns 200 across the board, but the SvelteKit page
// boundary never resolves to paint (stalls at `Loading…`). The same
// symptom blocks cells #5 (voter-feedback-persistence) + #7/#8
// (voter-question-rendering-{boolean,categorical}).
//
// Recommendation #3 from the Phase 86.3-04 v2.11+ todo
// (`.planning/todos/pending/2026-05-16-voter-popup-hydration-layout-03-deeplink.md`):
// REPLACE the deeplink with in-app navigation. The answeredVoterPage fixture
// navigates Home → Intro → Questions → Results, paints /results via the
// same fixture-driven path that already passes for the sibling
// `voter-results > drawer paints before list on cold deeplink (D-10)` test.
// The results layout's first hydration registers
// startFeedbackPopupCountdown(2); the setTimeout fires ~2s later and pushes
// FeedbackPopup onto popupQueue, where it MUST surface through the root
// layout popup slot for this regression gate to pass.

test.describe.configure({ mode: 'serial', timeout: 60000 });

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

  // afterAll restoration: match the e2e template's baseline
  // (`notifications.voterApp.show: false`, see
  // `packages/dev-seed/src/templates/e2e.ts:105`). The prior `show: true`
  // here leaked the popup-enabled state into subsequent specs — harmless
  // under the pre-86.3 onMount-only queueing, but anything that re-queues
  // on every page mount (e.g. a future reactive rewrite) would break the
  // `answeredVoterPage` fixture flow in downstream voter specs.
  const defaultPopupSettings = {
    results: { showFeedbackPopup: null, showSurveyPopup: null },
    survey: { showIn: [], linkTemplate: '' },
    notifications: { voterApp: { show: false } },
    analytics: { trackEvents: false },
    ...preserveNavigationSettings
  };

  test.beforeAll(async () => {
    await client.updateAppSettings({
      results: { showFeedbackPopup: 2, showSurveyPopup: null },
      survey: { showIn: [], linkTemplate: '' },
      ...preserveNavigationSettings,
      ...suppressInterferingPopups
    });
  });

  test.afterAll(async () => {
    await client.updateAppSettings(defaultPopupSettings);
  });

  test('popup appears on /results after navigation-from-home (LAYOUT-03 hydration path)', async ({
    answeredVoterPage: page
  }) => {
    test.setTimeout(60000);

    // The answeredVoterPage fixture has navigated Home → Intro → Questions →
    // Results and waited for the results list to be visible. The results
    // layout $effect has fired startFeedbackPopupCountdown(2) on first
    // hydration; the setTimeout fires ~2s later and pushes FeedbackPopup
    // onto popupQueue. The popup may have already queued by the time
    // control returns to the test body (fixture's results-list wait is up
    // to 10s) — that is acceptable: the dialog stays visible until
    // dismissed.

    // Wait for the feedback popup dialog — this is the assertion under test.
    // popupQueue.push must surface through the root layout popup slot for
    // this to pass.
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 10000 });
    await expect(dialog).toBeVisible();
  });
});
