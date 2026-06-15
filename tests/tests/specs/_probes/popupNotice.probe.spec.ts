/**
 * @file popupNotice.probe.spec.ts — smoke/probe for the `popupNotice` fixture
 * (EPERM-09).
 *
 * SC2 (A8 fixtures-first): exercises the `createPopupNotice` fixture
 * (`tests/tests/fixtures/shared/popupNotice.fixture.ts`) end-to-end —
 * `expectVisible` + `dismissAndReload` for BOTH the feedback and survey popups
 * (dismiss-persistence across reload).
 *
 * ## Probe convention — see video.probe.spec.ts. OUT of the perm serial chain,
 * seeded out-of-band, run in isolation.
 *
 * ## SEED (out-of-band pre-step)
 *
 *   yarn db:seed --template show-feedback-survey
 *
 * `show-feedback-survey` sets `results.showFeedbackPopup` + `results.showSurveyPopup`
 * (+ `survey.showIn=['results']`) so both popups surface on /results.
 *
 * ## RUN (single-file, isolated)
 *
 *   npx playwright test tests/tests/specs/_probes/popupNotice.probe.spec.ts \
 *     -c tests/playwright.config.ts
 */

import { createPopupNotice } from '../../fixtures/shared/popupNotice.fixture';
import { test } from '../../fixtures/voter/views';
import { answerAndAdvanceToResults, walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';

test.describe('@probe popupNotice fixture (EPERM-09)', () => {
  test('feedback popup: visible on /results, dismiss persists across reload', async ({ page }) => {
    const popups = createPopupNotice(page);

    await walkUntilQuestionsIntro(page);
    await answerAndAdvanceToResults(page, 'max');

    await popups.expectVisible('feedback');
    await popups.dismissAndReload('feedback');
  });

  test('survey popup: visible on /results, dismiss persists across reload', async ({ page }) => {
    const popups = createPopupNotice(page);

    await walkUntilQuestionsIntro(page);
    await answerAndAdvanceToResults(page, 'max');

    await popups.expectVisible('survey');
    await popups.dismissAndReload('survey');
  });
});
