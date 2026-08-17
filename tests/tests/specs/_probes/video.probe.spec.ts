/**
 * @file video.probe.spec.ts — smoke/probe for the `video` fixture.
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
 *      helper (`walkUntilQuestionsIntro`) for the located walk.
 *   3. Drives the running app and asserts the fixture's observable effect.
 *
 * ## Navigation note (perm-question-video reactive-churn)
 *
 * The questions-intro start `<Button>` and the category-intro start `<a>` both
 * re-render reactively from `voterCtx.selectedQuestionBlocks` (a post-hydration
 * `$state`), so a plain `.click()` detaches mid-click (the documented
 * voter-journey churn hazard). This probe sidesteps both:
 *   - the intro `<Button>` is fired via `dispatchEvent('click')` (bypasses the
 *     actionability/stability wait that detaches on the re-render), and
 *   - the category-intro `<a>` is followed by navigating to its resolved `href`
 *     (the `followLinkWhenHrefResolved` pattern), landing on the first question.
 * perm-question-video seeds `customData.video` on QUESTIONS (q1/q3/q5), NONE on
 * the category intros — so the Video element is VISIBLE on the first question
 * and HIDDEN on the category intro.
 *
 * ## SEED (out-of-band pre-step, run ONCE before this probe)
 *
 *   yarn db:seed --template perm-question-video
 *
 * ## RUN (single-file, isolated)
 *
 *   npx playwright test tests/tests/specs/_probes/video.probe.spec.ts \
 *     -c tests/playwright.config.ts
 */

import { createVideoReader } from '../../fixtures/shared/video.fixture';
import { expect, test } from '../../fixtures/voter/views';
import { walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';
import { testIds } from '../../utils/testIds';

test.describe('@probe video fixture (EPERM-06)', () => {
  test('expectVideo(false) on a category intro; expectVideo(true) on a video question', async ({ page }) => {
    const video = createVideoReader(page);

    // Located walk to the /questions stage. With perm-question-video the seed
    // sets `questions.questionsIntro.show=false` (MINIMAL_BASE_APP_SETTINGS), so
    // the intro page auto-redirects on mount PAST the `voter-questions-start`
    // button straight to the category intro (`categoryIntros.show=true` here).
    // walkUntilQuestionsIntro is bypass-tolerant (see phase 120) and lands on the
    // category intro directly..
    await walkUntilQuestionsIntro(page);

    // Under perm-question-video the questions-intro is bypassed (show=false) and
    // walkUntilQuestionsIntro deterministically lands on the category intro
    // (categoryIntros.show=true). No questions-start dispatch is needed — the
    // page is already on the category intro..
    const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);

    // On the category intro: NO question video here (seeded on questions only).
    await expect(categoryStart).toHaveAttribute('href', /\/questions\//, { timeout: 15_000 });
    await video.expectVideo(false);

    // Advance to the first question via a CLIENT-SIDE nav (dispatchEvent click,
    // churn-robust) — NOT page.goto. A full page.goto is a COLD/direct entry
    // that races the dataRoot #version-bridge repopulation (CLAUDE.md cold
    // direct-nav staleness), so the questions +layout's `video.load(customData
    // .video)` runs before the question's customData is present and the Video
    // never gains content. A client-side nav preserves the warm voter context,
    // so the customData is present when the layout loads the video. The first
    // question carries customData.video.
    await categoryStart.dispatchEvent('click');
    await expect(page).toHaveURL(/\/questions\/[^/]+(\?|$)/, { timeout: 15_000 });

    // On the first question the Video element gains content and becomes VISIBLE.
    // The reader asserts visibility-not-churn (the element is hidden-not-destroyed).
    await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible({ timeout: 15_000 });
    await video.expectVideo(true);
  });
});
