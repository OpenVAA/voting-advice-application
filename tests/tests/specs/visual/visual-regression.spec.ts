/**
 * Visual regression tests for key pages.
 *
 * Captures full-page screenshots at desktop (1280x720) and mobile (390x844)
 * viewports for the voter results page and candidate preview page.
 *
 * Tagged @visual so they are excluded from the default `yarn test:e2e` run
 * (no project includes the specs/visual/ directory) and run explicitly via:
 *   PLAYWRIGHT_VISUAL=1 npx playwright test -c tests/playwright.config.ts --project=visual-regression
 *
 * Baseline screenshots are stored in tests/tests/specs/visual/__screenshots__/ and
 * tracked in git. To update baselines after intentional UI changes:
 *   PLAYWRIGHT_VISUAL=1 npx playwright test --project=visual-regression --update-snapshots
 *
 * Phase 91 Plan 04 (D-91-RS-01 + D-91-RS-03):
 * - Voter-results desktop + mobile MIGRATED from legacy
 *   tests/tests/fixtures/voter.fixture.ts `voterTest.answeredVoterPage`
 *   to tests/tests/fixtures/voter-mega.fixture.ts `voterMegaTest.answeredVoterPage`
 *   (baseV1 dataset; multi-election + multi-constituency walk).
 * - Candidate-preview desktop + mobile MIGRATED from raw STORAGE_STATE +
 *   page.goto to the `candidatePreviewPage` function-fixture from
 *   tests/tests/fixtures/candidate/candidate-mega.ts (Phase 89 Plan 02
 *   composition root).
 * - PNG baselines NOT regenerated in this commit — CI follow-up via
 *   --update-snapshots per D-91-RS-01 (developer machines vary in font
 *   rendering; baseline capture happens on the canonical CI runner). The
 *   visual project may fail until CI re-baselines; this is expected.
 */

import { STORAGE_STATE } from '../../../playwright.config';
import { test as candidateTest, expect } from '../../fixtures/candidate/candidate-mega';
import { voterMegaTest as voterTest } from '../../fixtures/voter-mega.fixture';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';

// ── Voter Results - Desktop ──────────────────────────────────────────

voterTest.describe('Voter Results - Desktop @visual', { tag: ['@visual'] }, () => {
  voterTest.describe.configure({ mode: 'serial' });
  voterTest.use({ viewport: { width: 1280, height: 720 } });

  voterTest('screenshot matches baseline', async ({ answeredVoterPage: page }) => {
    await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible' });

    await voterTest.expect(page).toHaveScreenshot('voter-results-desktop.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

// ── Voter Results - Mobile ───────────────────────────────────────────

voterTest.describe('Voter Results - Mobile @visual', { tag: ['@visual'] }, () => {
  voterTest.describe.configure({ mode: 'serial' });
  voterTest.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  voterTest('screenshot matches baseline', async ({ answeredVoterPage: page }) => {
    await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible' });

    await voterTest.expect(page).toHaveScreenshot('voter-results-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

// ── Candidate Preview - Desktop ──────────────────────────────────────

candidateTest.describe('Candidate Preview - Desktop @visual', { tag: ['@visual'] }, () => {
  candidateTest.describe.configure({ mode: 'serial' });
  candidateTest.use({ storageState: STORAGE_STATE, viewport: { width: 1280, height: 720 } });

  candidateTest('screenshot matches baseline', async ({ candidatePreviewPage, page }) => {
    await page.goto(buildRoute({ route: 'CandAppPreview', locale: 'en' }));
    // Use the candidatePreviewPage fixture's container-visible assertion
    // (D-91-RS-01) — the fixture wraps the testid lookup and offers strict
    // visibility semantics + future composition surface for follow-up assertions.
    await candidatePreviewPage.expectPortraitVisible();

    await expect(page).toHaveScreenshot('candidate-preview-desktop.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

// ── Candidate Preview - Mobile ───────────────────────────────────────

candidateTest.describe('Candidate Preview - Mobile @visual', { tag: ['@visual'] }, () => {
  candidateTest.describe.configure({ mode: 'serial' });
  candidateTest.use({
    storageState: STORAGE_STATE,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });

  candidateTest('screenshot matches baseline', async ({ candidatePreviewPage, page }) => {
    await page.goto(buildRoute({ route: 'CandAppPreview', locale: 'en' }));
    await candidatePreviewPage.expectPortraitVisible();

    await expect(page).toHaveScreenshot('candidate-preview-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});
