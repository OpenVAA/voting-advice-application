/**
 * @file video.probe.spec.ts — smoke/probe for the `video` fixture (EPERM-06).
 *
 * SC2 (A8 fixtures-first): each NEW Phase-119 fixture is exercised by at least
 * one smoke/probe that proves its preparatory steps + view manipulation BEFORE
 * any Phase-120/121 spec relies on it. This probe drives the `createVideoReader`
 * fixture (`tests/tests/fixtures/shared/video.fixture.ts`) end-to-end.
 *
 * ## Probe convention (NEW — `tests/tests/specs/_probes/`)
 *
 * Probes are deliberately OUTSIDE the perm serial-DAG chain (no setup/teardown
 * project wiring — that is the Phase-120/121 job). Each probe:
 *   1. Is SEEDED OUT-OF-BAND via the dev-seed CLI before the run (see SEED below).
 *      Perm templates clobber the shared `app_settings` JSONB singleton, so a
 *      probe MUST run in ISOLATION (its own single-file run), never interleaved
 *      with other tests.
 *   2. Imports `test`/`expect` from the voter `views.ts` composition root so the
 *      view fixtures are available, and reuses the exported voter-journey walk
 *      helpers (`walkUntilQuestionsIntro` / `answerAndAdvanceToResults`) for
 *      navigation.
 *   3. Drives the running app and asserts the fixture's observable effect.
 *
 * Probes need not meet the spec phases' 3x-determinism bar — they must pass
 * cleanly once.
 *
 * ## SEED (out-of-band pre-step, run ONCE before this probe)
 *
 *   yarn db:seed --template perm-question-video
 *
 * The `perm-question-video` template seeds video `customData` on questions
 * (q1/q3/q5) and NONE on the category intros, so a video question shows the
 * Video element and a no-video question hides it.
 *
 * ## RUN (single-file, isolated)
 *
 *   npx playwright test tests/tests/specs/_probes/video.probe.spec.ts \
 *     -c tests/playwright.config.ts
 */

import { createVideoReader } from '../../fixtures/shared/video.fixture';
import { expect, test } from '../../fixtures/voter/views';
import { answerAndAdvanceToResults, walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';
import { testIds } from '../../utils/testIds';

test.describe('@probe video fixture (EPERM-06)', () => {
  test('expectVideo(true) on a video question', async ({ page, voterQuestionsPage }) => {
    const video = createVideoReader(page);

    // Walk the located voter chain and start the question flow.
    await walkUntilQuestionsIntro(page);
    await voterQuestionsPage.clickStart();

    // The first question in perm-question-video carries customData.video, so the
    // Video element renders (visible). The reader asserts visibility-not-churn
    // (the element is hidden-not-destroyed; here it is visible).
    await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible();
    await video.expectVideo(true);
  });

  test('expectVideo(false) on a surface with no question video (results)', async ({ page }) => {
    const video = createVideoReader(page);

    // Answer through to /results — a no-video surface. The Video element is
    // hidden-not-destroyed; here it must read as HIDDEN, proving the
    // present=false branch of the reader.
    await walkUntilQuestionsIntro(page);
    await answerAndAdvanceToResults(page, 'max');
    await video.expectVideo(false);
  });
});
