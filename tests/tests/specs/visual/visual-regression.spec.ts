/**
 * Visual regression tests for key pages.
 *
 * Captures full-page screenshots at desktop (1280x720) and mobile (390x844)
 * viewports for the voter results page and candidate preview page.
 *
 * Tagged @visual so they are excluded from the default `yarn test:e2e` run
 * (no project includes the specs/visual/ directory) and run explicitly via:
 *   npx playwright test --grep @visual
 *
 * Baseline screenshots are stored in tests/tests/__screenshots__/ and
 * tracked in git. To update baselines after intentional UI changes:
 *   npx playwright test --grep @visual --update-snapshots
 */

import { STORAGE_STATE } from '../../../playwright.config';
import { expect, test } from '../../fixtures';
import { voterTest } from '../../fixtures/voter.fixture';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';

// ── Voter Results - Desktop ──────────────────────────────────────────

voterTest.describe('Voter Results - Desktop @visual', { tag: ['@visual'] }, () => {
  voterTest.describe.configure({ mode: 'serial' });
  voterTest.use({ viewport: { width: 1280, height: 720 } });

  voterTest('screenshot matches baseline', async ({ answeredVoterPage: page }) => {
    await page.waitForLoadState('networkidle');
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
    await page.waitForLoadState('networkidle');
    await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible' });

    await voterTest.expect(page).toHaveScreenshot('voter-results-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

// ── Candidate Preview - Desktop ──────────────────────────────────────

test.describe('Candidate Preview - Desktop @visual', { tag: ['@visual'] }, () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: STORAGE_STATE, viewport: { width: 1280, height: 720 } });

  test('screenshot matches baseline', async ({ page }) => {
    await page.goto(buildRoute({ route: 'CandAppPreview', locale: 'en' }));
    await page.getByTestId(testIds.candidate.preview.container).waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('candidate-preview-desktop.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

// ── Candidate Preview - Mobile ───────────────────────────────────────

test.describe('Candidate Preview - Mobile @visual', { tag: ['@visual'] }, () => {
  test.describe.configure({ mode: 'serial' });
  test.use({
    storageState: STORAGE_STATE,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });

  test('screenshot matches baseline', async ({ page }) => {
    await page.goto(buildRoute({ route: 'CandAppPreview', locale: 'en' }));
    await page.getByTestId(testIds.candidate.preview.container).waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('candidate-preview-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});
