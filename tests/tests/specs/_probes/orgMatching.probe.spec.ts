/**
 * @file orgMatching.probe.spec.ts — smoke/probe for the org-matching readers
 * (EPERM-10).
 *
 * SC2 (A8 fixtures-first): exercises two readers built in Plan 06 —
 *   - `resultsPage.expectOrgMatchScore(target)`
 *     (`tests/tests/fixtures/voter/resultsPage.fixture.ts`) — the org-card
 *     score-gauge readout.
 *   - `aboutPage.expectOrgMatchingDisclosure(mode)`
 *     (`tests/tests/fixtures/voter/aboutPage.fixture.ts`) — the About-page
 *     org-matching disclosure block.
 *
 * The full none/answersOnly/impute matrix is the Phase-120 spec's job (it
 * re-seeds the singleton per mode); this probe only proves the readers work
 * against an active org-matching seed.
 *
 * ## Probe convention — see video.probe.spec.ts. OUT of the perm serial chain,
 * seeded out-of-band, run in isolation.
 *
 * ## SEED (out-of-band pre-step)
 *
 *   yarn db:seed --template perm-org-matching
 *
 * `perm-org-matching` sets `matching.organizationMatching` to an active mode
 * (answersOnly/impute) with an org carrying SOME of its own answers + member
 * candidates answering the questions the org leaves blank.
 *
 * ## RUN (single-file, isolated)
 *
 *   npx playwright test tests/tests/specs/_probes/orgMatching.probe.spec.ts \
 *     -c tests/playwright.config.ts
 */

import { expect, test } from '../../fixtures/voter/views';
import { answerAndAdvanceToResults, walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';

test.describe('@probe org-matching readers (EPERM-10)', () => {
  test('results org-match score gauge renders on the parties tab', async ({ page, resultsPage }) => {
    // Answer at max through to /results so org match scores compute.
    await walkUntilQuestionsIntro(page);
    await answerAndAdvanceToResults(page, 'max');

    // Switch to the parties/orgs tab and assert the org card's score gauge
    // reads out. The first org card scopes the gauge (no org-scoped id needed).
    await resultsPage.selectEntityTab('orgs');
    // Indexer target: the FIRST org card scopes the gauge (the org-matching
    // mode produces a distinguishable score; the probe only proves the readout).
    const gauge = await resultsPage.expectOrgMatchScore(() => 0);
    await expect(gauge).toBeVisible();
  });

  test('About-page org-matching disclosure renders for an active mode', async ({ aboutPage }) => {
    // With organizationMatching active (answersOnly/impute) the disclosure
    // block is present. The reader asserts presence for non-'none' modes.
    await aboutPage.goToPage('en');
    await aboutPage.expectOrgMatchingDisclosure('impute');
  });
});
