/**
 * @file numberScale.probe.spec.ts — fixtures-first smoke/probe (SC4) for the
 * two net-new VOTER-side fixture capabilities that Phase 130's voter-journey
 * extensions (plan 130-03) depend on:
 *
 *   1. `answerNumberScale` — the value-parametrized native-range slider driver
 *      (129 D-03 keyboard contract). Proven to land EXACT values (7, 0) and to
 *      CLAMP at max (10) when driven past it — the EQTYP-02 boundary proof.
 *   2. `entityDetails.expectQuestionDisplay` (checkbox multi-choice, EQTYP-01)
 *      + `entityDetails.expectNumberQuestionDisplay` (number dual-marker,
 *      129 D-04 / EQTYP-02) — proven against a REAL candidate drawer.
 *
 * Both are proven HERE before any spec consumes them (Pitfall 3 / SC4).
 *
 * ## Probe convention — see video.probe.spec.ts. Seeded out-of-band,
 * run in isolation. This probe reads the base dataset (no perm singleton
 * clobber). Every test is tagged `@probe` so the default `yarn test:e2e`
 * (--grep-invert @probe) excludes it — zero runtime, zero flake surface on
 * the D-05 gate.
 *
 * ## SEED (out-of-band pre-step)
 *
 *   yarn db:reset && yarn db:seed --template e2e/base
 *
 * ## RUN (single-file, isolated)
 *
 *   npx playwright test --project=_probes -c tests/playwright.config.ts \
 *     -g "answerNumberScale"
 */

import { expect, test } from '../../fixtures/voter/views';
import {
  answerAndAdvanceToResults,
  answerNumberScale,
  walkUntilQuestionsIntro
} from '../../fixtures/voter/voter-journey.fixture';
import { TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

/**
 * Advance from the /questions intro page through the answer flow — SKIPPING
 * each question via Next — until the native range slider (Base opinion 6,
 * number scale) is visible. Mirrors the walk's category-intro href-resolve
 * idiom and the URL-settle idiom so it is deterministic under render churn.
 */
/**
 * Select a specific election in the `/results` election accordion, by name.
 *
 * Collapse-aware: `AccordionSelect` renders ONLY the active option when
 * collapsed, so a bare `getByRole('option', { name })` finds nothing whenever
 * the active election is not the wanted one. Expand first (clicking the single
 * rendered option toggles it open), then click the target and wait for the
 * accordion to collapse back — the signal that the selection committed.
 *
 * Mirrors `expectElectionOptionAndSelect` in voter-journey.spec.ts, minus that
 * helper's FIX-02 listbox-accessible-name lock (which the journey spec owns).
 * Duplicated rather than imported because the journey helper is spec-local and
 * hoisting it would mean editing the gated spec for a non-gated probe.
 */
async function selectElectionByName(page: Page, name: RegExp | string): Promise<void> {
  const accordion = page.getByTestId(testIds.voter.results.electionAccordion);
  await expect(accordion).toBeVisible({ timeout: TIMEOUTS.page });
  const options = accordion.getByRole('option');
  const visibleCount = await options.count();
  if (visibleCount === 1) await options.first().click({ timeout: TIMEOUTS.click });
  const target = accordion.getByRole('option', { name }).first();
  await expect(target).toBeVisible({ timeout: TIMEOUTS.element });
  await target.click({ timeout: TIMEOUTS.click });
  await expect(options).toHaveCount(1, { timeout: TIMEOUTS.element });
  await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible({ timeout: TIMEOUTS.page });
}

async function advanceToNumberSlider(page: Page): Promise<void> {
  const slider = page.getByTestId(testIds.voter.questions.numberSlider).first();
  const questionsStart = page.getByTestId(testIds.voter.questions.startButton);
  const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);
  const nextButton = page.getByTestId(testIds.voter.questions.nextButton);

  if (await questionsStart.isVisible({ timeout: TIMEOUTS.page }).catch(() => false)) {
    await questionsStart.click();
  }

  for (let i = 0; i < 40; i++) {
    // Prefer the slider: WAIT (not one-shot) up to a route-transition budget so
    // the still-transitioning q5→q6 nav can't be mistaken for a skippable
    // question and overshoot q6 (the outgoing question's Next button lingers
    // during a param-only nav — SETTLE-BEFORE-COUNT). If the slider paints, stop.
    const onSlider = await slider
      .waitFor({ state: 'visible', timeout: TIMEOUTS.page })
      .then(() => true)
      .catch(() => false);
    if (onSlider) return;
    const urlBefore = page.url();
    // Detect the current page by control PRESENCE: a category-intro renders the
    // categoryStart "Continue" link; a question renders the Next/Skip button.
    if (await categoryStart.isVisible().catch(() => false)) {
      // Category-intro start is an `<a>` whose href resolves reactively; wait
      // for it to settle to a real question route, then navigate (the walk's
      // followLinkWhenHrefResolved idiom — avoids the detach/intercept flake).
      await expect(categoryStart).toHaveAttribute('href', /\/questions\//, { timeout: TIMEOUTS.slowPage });
      const href = await categoryStart.getAttribute('href');
      if (href) await page.goto(href);
    } else if (await nextButton.isVisible().catch(() => false)) {
      // Question page — Skip via Next (unanswered questions advance on Next).
      await nextButton.click();
    } else {
      continue;
    }
    await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: TIMEOUTS.slowPage }).catch(() => null);
  }
  throw new Error('advanceToNumberSlider: question-number-slider never became visible');
}

test.describe('@probe answerNumberScale + new-type drawer displays (EQTYP-01/EQTYP-02)', () => {
  test('exact-value slider driving lands 7, 0, and clamps at max (10)', async ({ page }) => {
    await walkUntilQuestionsIntro(page);
    await advanceToNumberSlider(page);

    const valueLabel = page.getByTestId(testIds.voter.questions.numberValue).first();

    // Exact mid-ish value.
    await answerNumberScale(page, 7);
    await expect(valueLabel).toHaveText('7');

    // Exact min.
    await answerNumberScale(page, 0);
    await expect(valueLabel).toHaveText('0');

    // Drive PAST max (15 > 10): native range clamps → an out-of-range answer is
    // physically impossible (EQTYP-02 boundary proof for qu-opin-base-6-number,
    // min 0 / max 10).
    await answerNumberScale(page, 15);
    await expect(valueLabel).toHaveText('10');
  });

  test('new-type drawer displays: multi-choice + number dual-marker', async ({ page, resultsPage, entityDetails }) => {
    // Max walk answers every opinion question (multi-choice → smallest valid
    // selection from index 0, i.e. a,b on base-7 and a on base-8; number → End
    // = 10), then lands on /results.
    await walkUntilQuestionsIntro(page);
    await answerAndAdvanceToResults(page, 'max');

    // Pin the REGIONAL election. `answerAndAdvanceToResults` step 7 lands on
    // whichever election its `options.first()` pick resolves to, and that is
    // NOT deterministic between EL-Reg and EL-Mun — voter-journey.spec.ts says
    // so in as many words and pins the election for exactly this reason
    // (`expectElectionOptionAndSelect({ text: TEXT_RE.regional })`). This probe
    // needs Regional specifically: Polar-Max BB One is nominated only in
    // CO-Reg-N, so on the Municipal list it is legitimately absent and the
    // `toHaveCount(1)` below fails for a reason that has nothing to do with the
    // drawer capabilities under test. The probe previously relied on the coin
    // landing Regional-side; Phase 135's extra base question changed the walk's
    // shape enough to flip it, exposing the latent dependency.
    await selectElectionByName(page, /Regional/i);

    // Open the Polar-Max candidate drawer (POLAR_MAX answers: base-6-number=10,
    // base-7-multichoice=['a','b']) and switch to the opinions tab. Candidate
    // cards wrap the whole article in the navigating `<a>` (no in-card subcard
    // action), so click the card article directly — mirrors voter-journey.spec's
    // `specialCard.click()` (openEntityDetailsForCard targets the subcard-action
    // descendant, which a no-subcard candidate card lacks).
    await resultsPage.selectEntityTab('cands');
    const polarMaxCards = resultsPage.getEntityCards().filter({ hasText: /Polar-Max/i });
    await expect(polarMaxCards).toHaveCount(1);
    await polarMaxCards.first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: TIMEOUTS.page });
    await entityDetails.selectTab('opinions');
    await entityDetails.getQuestionDisplays().first().waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });

    // (a) Multi-choice display (EQTYP-01): max-walk voter checked a,b (2) and
    //     POLAR_MAX entity answer a,b (2 entity markers).
    await entityDetails.expectQuestionDisplay(/Base opinion 7 — Multi-choice/i, {
      voterSelectedCount: 2,
      entitySelectedCount: 2
    });

    // (b) Number dual-marker display (EQTYP-02 / 129 D-04): voter 10 (max walk)
    //     and entity 10 → a single combined marker at the shared position.
    await entityDetails.expectNumberQuestionDisplay(/Base opinion 6 — Number scale/i, {
      voterValue: 10,
      entityValue: 10
    });
  });
});
