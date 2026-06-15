/**
 * @file questionInfo.probe.spec.ts — smoke/probe for the `questionInfo` fixture
 * (EPERM-07).
 *
 * SC2 (A8 fixtures-first): exercises the `createQuestionInfo` readers
 * (`tests/tests/fixtures/voter/questionInfo.fixture.ts`) end-to-end —
 * `expectInfoMode` (popup vs expander), `expectInfoSections`, `expectArguments`.
 *
 * ## Probe convention — see video.probe.spec.ts. Probes are OUT of the perm
 * serial chain, seeded out-of-band via the dev-seed CLI, and run in isolation
 * (perm templates clobber the shared `app_settings` singleton).
 *
 * ## SEED (out-of-band pre-step)
 *
 *   yarn db:seed --template perm-interactive-info
 *
 * `perm-interactive-info` seeds one `interactiveInfo.enabled=true` (popup) +
 * one default (static-expander) question, PLUS `customData.infoSections` (>=1
 * question) and `customData.arguments` on three questions (one Likert/ordinal,
 * one Boolean, one Categorical — categorical grouped by `choiceId`).
 *
 * ## RUN (single-file, isolated)
 *
 *   npx playwright test tests/tests/specs/_probes/questionInfo.probe.spec.ts \
 *     -c tests/playwright.config.ts
 *
 * NOTE on `question` index: the readers take an OPTIONAL 0-based index scoping
 * the locator to the Nth matching element on the page. Because the questions
 * flow shows one question at a time, the probe omits the index (defaults to the
 * first match on the current question page).
 */

import { expect, test } from '../../fixtures/voter/views';
import { walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';
import { testIds } from '../../utils/testIds';

test.describe('@probe questionInfo fixture (EPERM-07)', () => {
  test('expectInfoMode popup + expectInfoSections + expectArguments(categorical)', async ({
    page,
    voterQuestionsPage,
    questionInfo
  }) => {
    // Walk to the located questions flow and open the first question.
    await walkUntilQuestionsIntro(page);
    await voterQuestionsPage.clickStart();
    await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible();

    // The popup-flagged question opens a modal disclosure (interactiveInfo).
    await questionInfo.expectInfoMode(undefined, 'popup');

    // Its infoSections render (>=1 section, index 0 present).
    await questionInfo.expectInfoSections([0]);

    // The categorical argument group renders (keyed by choiceId).
    await questionInfo.expectArguments(undefined, 'categorical');
  });

  test('expectInfoMode expander on the default (non-interactive) question', async ({
    page,
    voterQuestionsPage,
    questionInfo
  }) => {
    await walkUntilQuestionsIntro(page);
    await voterQuestionsPage.clickStart();
    await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible();

    // The expander branch clicks the static info button and asserts NO modal
    // appears (inline body reveal). Exercises the 'expander' arm of the reader.
    await questionInfo.expectInfoMode(undefined, 'expander');
  });
});
