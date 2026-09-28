/**
 * Visual regression tests for key pages.
 *
 * Captures full-page screenshots at desktop (1280x720) and mobile (390x844) viewports for the voter results page and candidate preview page.
 *
 * Tagged @visual so they are excluded from the default `yarn test:e2e` run (no project includes the specs/visual/ directory) and run explicitly via:
 *   PLAYWRIGHT_VISUAL=1 npx playwright test -c tests/playwright.config.ts --project=visual-regression
 *
 * Baseline screenshots are stored in tests/tests/specs/visual/__screenshots__/ and tracked in git. To update them after an intentional UI change, see ## Re-baselining below — it is one script, and the flag matters.
 *
 * Fixtures:
 * - Voter-results desktop + mobile use the voter-journey fixture's
 *   `answeredVoterPage` (base dataset; multi-election + multi-constituency walk), then PIN the Regional election — see `selectElectionByName` for why an unpinned /results screenshot can never reproduce.
 * - Candidate-preview desktop + mobile use the `candidatePreviewPage`
 *   function-fixture from the candidate-journey composition root, authenticated as the base candidate CA-AA-1 registered by `auth-setup`.
 *
 * ## Re-baselining
 *
 * `tests/scripts/visual-container.sh` is the single executable source of the whole procedure — flags, port forwarding, evidence directory, exit codes. Do NOT restate it as prose here or anywhere else. The recipe this subsection used to carry bound the repository at a fixed container directory, which has aborted every run since the served-application preflight landed: the mount must map the repo at its IDENTICAL absolute path, because tests/global-setup.ts:41 derives repoRoot from the test process's own path and tests/tests/support/preflight.ts:429-444 requires strict absolute-path equality with what the host dev server echoes. It also instructed you to forward the host ports without saying how — and the tool that step implicitly relied on is not installed in the pinned image at all.
 *
 * Host-side prerequisites, in this order:
 *   1. `yarn build` — @openvaa/app-shared is ESM-only and the frontend reads its built dist/, so a stale dist/ serves the previous font default.
 *   2. `yarn db:reset && yarn db:seed --template e2e/base`.
 *   3. `yarn workspace @openvaa/frontend dev --host 0.0.0.0` — NOT `yarn dev --host
 *      0.0.0.0`, whose root script chains through `concurrently` and swallows the appended flag, silently leaving the server on loopback and unreachable from the container.
 *
 * Baselines are Linux/x86_64 PNGs and MUST be regenerated in the CI-matching container — never on a developer Mac, whose font rasterisation differs enough to fail CI permanently. That mismatch is what left this project non-functional for a long stretch of its history.
 *
 * Re-baselining uses `--update-snapshots=all` (the script's `--update-snapshots-all`, the only form it offers). The bare `--update-snapshots` is mode `changed` and SKIPS images already comparing within tolerance, leaving them carrying old pixels — exactly wrong for a re-capture against new rendering.
 *
 * All of the above is recorded evidence, not recollection.
 *
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
 * Block until webfont loading has settled, and assert the app's own font is the one that will be rasterised.
 *
 * `staticSettings.font.url` serves Inter from the app's OWN origin with `display: swap`, so a page paints in the `system-ui` fallback first and re-lays out when Inter arrives. A screenshot taken inside that window captures fallback advance widths — every glyph lands a few pixels off while the box layout is unchanged, which is exactly the diff this produced before the gate existed. The voter cases never showed it only because their walk takes ~20s, long enough for the swap; the candidate-preview cases capture ~4s in and straddled the race.
 *
 * What this check actually covers, MEASURED in mcr.microsoft.com/playwright:v1.58.2-noble rather than inferred:
 *
 * - An `@font-face` rule whose `src` is unreachable -> `check('1em Inter')` returns
 *   `false` -> CAUGHT HERE, by name.
 * - ZERO `@font-face` rules present — what a missing or 404ing stylesheet produces ->
 *   `check` returns `true` and `document.fonts.size` is 0 -> NOT caught here.
 * - A valid `src` -> `check` returns `true` -> passes, correctly.
 *
 * The docblock this replaces claimed the middle case failed here by name. It never did, at any point in this function's life. That uncovered case is handed to `guardThirdPartyFonts` below, which asserts /fonts/inter.css returned 200 — which is what makes a wrong vendored path fail by name rather than as a whole-page diff.
 * Demonstrated in BOTH directions by the F2-BOGUS-RED and F3-BOGUS-GREEN control rows.
 */
async function settleFonts(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  const interLoaded = await page.evaluate(() => document.fonts.check('1em Inter'));
  expect(interLoaded, 'webfont Inter did not load — baselines were captured with it').toBe(true);
}

/**
 * Third-party font hosts worth guarding against. Font hosts only: the app's analytics host is deliberately absent, being out of scope.
 */
const THIRD_PARTY_FONT_HOSTS =
  /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|fonts\.bunny\.net|use\.typekit\.net|p\.typekit\.net|cdn\.jsdelivr\.net\/npm\/@fontsource)/;

/** The same-origin stylesheet `staticSettings.font.url` points at. */
const SELF_HOSTED_FONT_STYLESHEET = '/fonts/inter.css';

/**
 * Assert the page rasterised the application's OWN Inter, served from its OWN origin — no third-party font request was made, and the same-origin stylesheet actually arrived.
 *
 * ## Why a retroactive read rather than a listener
 *
 * The primary assertion reads `performance.getEntriesByType('resource')`, which covers the WHOLE document lifetime. That matters because the voter cases are handed an already-navigated page: `answeredVoterPage` has completed a ~20s walk before the test body starts, so a `page.on('request')` listener installed here could not observe a single request the walk made. The retroactive read sees them all. Requests are asserted on as a collected list with the offending URLs named — never by throwing inside an event handler, where the exception is swallowed or surfaces as an unattributed unhandled rejection.
 *
 * ## Why the second assertion exists
 *
 * `settleFonts` above is MEASURABLY BLIND to a missing stylesheet. Measured in the pinned container: with zero `@font-face` rules present — the exact state produced by an unreachable font host OR by a wrong same-origin `/fonts/inter.css` path — `document.fonts.check('1em Inter')` returns `true` and `document.fonts.size` is `0`. It returns `false` only when a face exists whose `src` fails. So a broken vendored path would sail past `settleFonts` and surface as an inscrutable whole-page pixel diff, or worse, be absorbed into a re-baseline as the new truth. Asserting the stylesheet loaded with status 200 makes that failure say so BY NAME. `settleFonts` itself is unchanged.
 *
 * ## The boundary of the claim
 *
 * This asserts zero third-party font REQUESTS were observed. It does NOT assert zero occurrences of a font-host string in the build, and must never be described that way: `+layout.svelte` keeps the Google URL as its `??` fallback literal and keeps two preconnect literals in a branch that is dead for the current default but correct for an operator who overrides `staticSettings.font.url` back to Google. All three survive into the bundle by design, so a static grep of `apps/frontend/build/` returns hits forever.
 */
async function guardThirdPartyFonts(page: Page): Promise<void> {
  const resources = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name));

  const thirdParty = resources.filter((url) => THIRD_PARTY_FONT_HOSTS.test(url));
  expect(
    thirdParty,
    `third-party font requests observed (VGATE-05 requires none): ${thirdParty.join(', ')}`
  ).toStrictEqual([]);

  const stylesheet = resources.find((url) => url.includes(SELF_HOSTED_FONT_STYLESHEET));
  expect(
    stylesheet,
    `the same-origin Inter stylesheet ${SELF_HOSTED_FONT_STYLESHEET} was never requested — staticSettings.font.url is not pointing at it`
  ).toBeDefined();

  const response = await page.request.get(stylesheet!);
  expect(
    response.status(),
    `the same-origin Inter stylesheet ${stylesheet} did not load: status ${response.status()}. The vendored font path is wrong, so the capture is fallback glyphs — settleFonts cannot see this (N-2)`
  ).toBe(200);
}

// ── Voter Results - Desktop ──────────────────────────────────────────

voterTest.describe('Voter Results - Desktop @visual', { tag: ['@visual'] }, () => {
  voterTest.describe.configure({ mode: 'serial' });
  voterTest.use({ viewport: { width: 1280, height: 720 } });

  voterTest('screenshot matches baseline', async ({ answeredVoterPage: page }) => {
    await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible' });
    // Pin the election: the walk's landing election is a coin flip between Regional and Municipal, and the two lists differ in length, so an unpinned screenshot compares two different pages.
    await selectElectionByName(page, /Regional/i);
    await settleFonts(page);
    await guardThirdPartyFonts(page);

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
    await guardThirdPartyFonts(page);

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
    // Use the candidatePreviewPage fixture's container-visible assertion — the fixture wraps the testid lookup and offers strict visibility semantics + a future composition surface for follow-up assertions.
    await candidatePreviewPage.expectPortraitVisible();
    await settleFonts(page);
    await guardThirdPartyFonts(page);

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
    await guardThirdPartyFonts(page);

    await expect(page).toHaveScreenshot('candidate-preview-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});
