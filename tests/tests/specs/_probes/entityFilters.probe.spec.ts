/**
 * @file entityFilters.probe.spec.ts — smoke/probe for the entityFilters
 * select-all/none toggle (EFLOW-01).
 *
 * SC2 (A8 fixtures-first): exercises the `selectAll()` / `selectNone()` methods
 * added to `tests/tests/fixtures/voter/entityFilters.fixture.ts` (Plan 07) —
 * the single flip-toggle that renders only on a categorical filter with > 3
 * options.
 *
 * ## Probe convention — see video.probe.spec.ts. Seeded out-of-band, run in
 * isolation. This probe reads the base dataset (no perm singleton clobber).
 *
 * ## SEED (out-of-band pre-step)
 *
 *   yarn db:seed --template e2e/base
 *
 * The categorical filter under test MUST have ≥4 options to surface the toggle
 * (threshold > 3 confirmed). The base Party/categorical filter qualifies.
 *
 * ## RUN (single-file, isolated)
 *
 *   npx playwright test tests/tests/specs/_probes/entityFilters.probe.spec.ts \
 *     -c tests/playwright.config.ts
 */

import { expect, test } from '../../fixtures/voter/views';
import { answerAndAdvanceToResults, walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';

test.describe('@probe entityFilters select-all/none toggle (EFLOW-01)', () => {
  test('selectAll shows cards; selectNone hides them', async ({ page, resultsPage, entityFilters }) => {
    // Answer through to /results, then move to the candidates tab (the
    // categorical filter with > 3 options surfaces the select-all toggle).
    await walkUntilQuestionsIntro(page);
    await answerAndAdvanceToResults(page, 'max');
    await resultsPage.selectEntityTab('cands');

    // Open the filter dialog and pick the first categorical filter row that
    // carries the > 3-option select-all toggle (indexer target → first row).
    const dialog = await entityFilters.openFilterDialog();
    const filter = await dialog.getFilter(() => 0);

    // selectAll → all options checked → entity cards are shown.
    await filter.selectAll();
    await dialog.close();
    await expect(resultsPage.getEntityCards().first()).toBeVisible();

    // Re-open and selectNone → zero options checked → zero entity cards.
    const dialog2 = await entityFilters.openFilterDialog();
    const filter2 = await dialog2.getFilter(() => 0);
    await filter2.selectNone();
    await dialog2.close();
    await expect(resultsPage.getEntityCards()).toHaveCount(0);
  });
});
