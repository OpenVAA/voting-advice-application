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
 * Fixtures:
 * - Voter-results desktop + mobile use the voter-journey fixture's
 *   `answeredVoterPage` (base dataset; multi-election + multi-constituency walk),
 *   then PIN the Regional election — see `selectElectionByName` for why an
 *   unpinned /results screenshot can never reproduce.
 * - Candidate-preview desktop + mobile use the `candidatePreviewPage`
 *   function-fixture from the candidate-journey composition root, authenticated
 *   as the base candidate CA-AA-1 registered by `auth-setup`.
 *
 * ## Re-baselining (Phase 136 plan 05)
 *
 * Baselines are Linux/x86_64 PNGs and MUST be regenerated in the container that
 * matches CI's `ubuntu-latest` runner — never on a developer Mac, whose font
 * rasterisation differs enough to fail CI permanently. That mismatch is what left
 * this project non-functional between v1.2 and Phase 136. With the app on
 * http://localhost:$PORT and Supabase on the host:
 *
 *   docker run --rm --platform linux/amd64
 *     --add-host=host.docker.internal:host-gateway
 *     -v "$PWD":/work -w /work
 *     mcr.microsoft.com/playwright:v1.58.2-noble
 *     bash -c 'forward the host ports onto the container loopback, then:
 *       FRONTEND_PORT=$PORT PLAYWRIGHT_VISUAL=1 npx playwright test
 *         -c tests/playwright.config.ts --project=visual-regression
 *         --update-snapshots --workers=1'
 *
 * Keep `--workers=1`: that is what CI uses (`workers: process.env.CI ? 1 : 6`),
 * and the voter walk does not survive 6-way contention under emulation.
 * Bump the image tag with the `@playwright/test` version in the root catalog.
 */

import { STORAGE_STATE } from '../../../playwright.config';
import { expect, test as candidateTest } from '../../fixtures/candidate/candidate-journey';
import { voterJourneyTest as voterTest } from '../../fixtures/voter/voter-journey.fixture';
import { buildRoute } from '../../utils/buildRoute';
import { selectElectionByName } from '../../utils/selectElection';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

/**
 * Block until webfont loading has settled, and assert the app's own font is the
 * one that will be rasterised.
 *
 * `staticSettings.font.url` pulls Inter from Google Fonts with `display=swap`,
 * so a page paints in the `system-ui` fallback first and re-lays out when Inter
 * arrives. A screenshot taken inside that window captures fallback advance
 * widths — every glyph lands a few pixels off while the box layout is unchanged,
 * which is exactly the diff this produced before the gate existed. The voter
 * cases never showed it only because their walk takes ~20s, long enough for the
 * swap; the candidate-preview cases capture ~4s in and straddled the race.
 *
 * The `check` assertion is deliberate: if a runner cannot reach
 * fonts.googleapis.com, `document.fonts.ready` still resolves (with the fallback
 * in place) and the run would fail as an inscrutable whole-page pixel diff. This
 * fails it as "Inter did not load" instead.
 */
async function settleFonts(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  const interLoaded = await page.evaluate(() => document.fonts.check('1em Inter'));
  expect(interLoaded, 'webfont Inter did not load — baselines were captured with it').toBe(true);
}

// ── Voter Results - Desktop ──────────────────────────────────────────

voterTest.describe('Voter Results - Desktop @visual', { tag: ['@visual'] }, () => {
  voterTest.describe.configure({ mode: 'serial' });
  voterTest.use({ viewport: { width: 1280, height: 720 } });

  voterTest('screenshot matches baseline', async ({ answeredVoterPage: page }) => {
    await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible' });
    // Pin the election: the walk's landing election is a coin flip between
    // Regional and Municipal, and the two lists differ in length, so an unpinned
    // screenshot compares two different pages.
    await selectElectionByName(page, /Regional/i);
    await settleFonts(page);

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
    // Same election pin as the desktop case — see selectElectionByName.
    await selectElectionByName(page, /Regional/i);
    await settleFonts(page);

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
    // Use the candidatePreviewPage fixture's container-visible assertion —
    // the fixture wraps the testid lookup and offers strict visibility
    // semantics + a future composition surface for follow-up assertions.
    await candidatePreviewPage.expectPortraitVisible();
    await settleFonts(page);

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
    await settleFonts(page);

    await expect(page).toHaveScreenshot('candidate-preview-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});
