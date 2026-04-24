import { voterTest as test } from '../../fixtures/voter.fixture';
import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

// LAYOUT-03 / D-09 regression gate:
//
// Validates that a setTimeout-triggered popup.push(...) surfaces through the
// root layout popup slot when the page is reached via FULL PAGE LOAD
// (page.goto — SSR + hydration path). This is the exact reactivity path the
// v2.1 PopupRenderer wrapper was introduced to guard.
//
// Plan 60-04 runs this test:
//   - If PASS with PopupRenderer inlined into root layout → PopupRenderer deleted.
//   - If FAIL with PopupRenderer inlined → PopupRenderer retained with D-10
//     rationale comment. Inlining is reverted.
//
// This file is created in Plan 60-01 (Wave 0) as a SKELETON. The full seeding
// helper is owned by Plan 60-04 Task 1 (which already finalizes the seeding).
// The `test.skip(...)` marker below is intentional — it keeps this spec
// discoverable by Playwright's --list without producing a silent false-GREEN
// until Plan 60-04 lands the seeding path.

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

  // Skeleton — seeding helper + full assertion path is Plan 60-04 Task 1.
  // Per W-2: keep this as an explicit test-skip (NOT the alternative fixme
  // marker — the skip makes the scope handoff visible in the Playwright
  // --list and reporter output).
  test.skip('popup appears on full page load to /results (LAYOUT-03 hydration path) — seeding TBD in Plan 60-04 Task 1', async ({ page }) => {
    test.setTimeout(60000);

    // Plan 60-04 Task 1 replaces this body with:
    //   (a) a seeding helper for voter answers (localStorage OR fixture-function),
    //   (b) await page.goto('/results'),
    //   (c) await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible({ timeout: 10000 }),
    //   (d) const dialog = page.getByRole('dialog');
    //       await dialog.waitFor({ state: 'visible', timeout: 15000 });
    //       await expect(dialog).toBeVisible();
    // plus removal of the `test.skip(...)` marker (replace `test.skip` with `test`).
    //
    // The shape below is a documentation-only reference for Plan 60-04 to follow.
    // Leaving the reference call here keeps the spec body type-checkable and
    // the imports live even while skipped.
    await page.goto('/results');
    expect(testIds.voter.results.list).toBeDefined();
  });
});
