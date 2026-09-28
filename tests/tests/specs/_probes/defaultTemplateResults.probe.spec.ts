/**
 * @file defaultTemplateResults.probe.spec.ts — the default-template results-surface instrument
 *
 * WHAT THIS MEASURES. The requirement behind this probe is that a `default`-seeded database render, in the running voter app, (a) a non-empty parties/organizations list and
 * (b) an entity-tab set that INCLUDES candidates. This probe asserts both halves against whatever dataset is currently seeded, so the before/after is MEASURED rather than remembered: two exit codes and two screenshots instead of two claims in prose.
 *
 * ⚠ THIS IS NOT THE STANDING REGRESSION GUARD. The standing guard is the anon-client assertion in `packages/dev-seed/tests/integration/default-template.integration.test.ts` (a deliberate decision). That decision explicitly REJECTED a gate-suite Playwright spec that seeds `default` mid-suite, for two reasons — shared-database contamination and cardinal-gate risk. Neither reaches this file: it seeds nothing (the seed is an out-of-band pre-step) and it never runs in the gate (every test here is `@probe`-tagged and the root `test:e2e` script appends `--grep-invert @probe`). If you are reading this as a second standing guard, that reading is wrong.
 *
 * ## Probe convention. OUTSIDE the perm serial chain and outside the cardinal gate
 * suite: seeded out-of-band, run one at a time, every test tagged `@probe`.
 *
 * ⚠ This is now the LAST probe. A validation audit (2026-08-25) deleted the five siblings — `video`, `questionInfo`, `popupNotice`, `orgMatching`, `numberScale` — after establishing that every fixture each one proved is consumed by a gate spec (`perm-question-video`, `perm-interactive-info`, `perm-show-feedback-survey`, `perm-org-matching`, `voter-journey`), so they carried no coverage the gate did not already carry. This file survives because its coverage is unique in a way theirs was not: its assertions are duplicated by `voter-journey.spec.ts`, but its DATASET — the `default` template — is seeded by no gate project at all, and the decision quoted above deliberately keeps it that way.
 *
 * ## SEED (out-of-band pre-step)
 *
 *   yarn db:reset-with-data
 *
 * That is the DEFAULT template (`db:reset` + `db:seed --template default`) — NOT `e2e/base`, which is what the gate suite's own data-setup projects install. The two datasets cannot coexist, which is exactly why this file is excluded from the gate and why `145-08` runs `yarn db:reset` before the cardinal suite.
 *
 * ⚠ Do NOT run `yarn test:unit` between the seed and this probe: the dev-seed integration test rewrites the full default template to the live database and has no teardown, so it would overwrite the state being measured.
 *
 * ## RUN (single-file, isolated)
 *
 *   GSD_145_HALF=before yarn test:e2e:probes defaultTemplateResults
 *
 * `GSD_145_HALF` names the half being measured and is encoded into the screenshot filenames, so the pre-fix run writes `app-before-*.png` and the post-fix run (`145-05`) writes `app-after-*.png` from the same source with no edit.
 *
 * ## WHY THE WALK IS WARM-PATH-ONLY
 *
 * Both tests reach the results screen through the voter journey fixture — Home → intro → elections → constituencies → questions → results — and never by pointing the browser straight at the results URL. A session-less direct entry reproduces an uncaught `Cannot use cookies.set(...) after the response has been generated` in `apps/frontend/src/lib/supabase/server.ts`, which kills the Vite dev server and with it the measurement session (a known pitfall, filed as a standing todo and deliberately not fixed here).
 *
 * ## LOCAL SURFACE
 *
 * Everything this probe needs beyond the existing fixtures is written HERE: `captureHalf`, `walkToResults` and `readRenderedEntityTabs`. Nothing under `tests/tests/fixtures/`, `tests/tests/helpers/` or `tests/tests/utils/` is modified — those are gate surfaces, and a probe-only need must not become gate-suite risk.
 *
 * The walk takes the FIRST constituency option the selector offers, because that is what the shared journey fixture does and changing it would mean editing a gate surface. MEASURED, not assumed: on the default template that resolves to
 * **Pirkanmaa** (`c_05`) — the results header reads `8 parties in constituency Pirkanmaa` in `app-before-parties.png` / `app-before-tabs.png`. That happens to be exactly the constituency the nominating decision names (48 candidates, the smallest count, so a wrong number is visible at a glance), so the probe lands on that surface without the spec having to steer for it.
 */

import fs from 'fs';
import path from 'path';
import { expect, test } from '../../fixtures/voter/views';
import { answerAndAdvanceToResults, walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

/**
 * Screenshot destination. Lives OUTSIDE the repository (never committed) and is stable across both halves so the before/after pair is two files in one directory.
 */
const SHOT_DIR = path.join(process.env.TMPDIR ?? '/tmp', 'gsd-145');

/** Which half of the phase's before/after pair this run is measuring. */
const HALF = process.env.GSD_145_HALF ?? 'unknown';

/**
 * reason: the default template seeds 26 opinion questions (vs. the gate dataset's shorter set) and computes matches over 327 candidates, so the warm walk does not fit the 90s global ceiling (TIMEOUTS.testMax). Named inline per the tests/tests/helpers/timeouts.ts convention for budgets above the ceiling; same form as perm-localisation-positive's 180s. A probe that times out is a VOID measurement, not a red one, so the budget has to clear the walk comfortably.
 */
const PROBE_TEST_MAX = 240_000;

/** Write the half's full-page screenshot and return its path. */
async function captureHalf(page: Page, slug: 'parties' | 'tabs'): Promise<string> {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const file = path.join(SHOT_DIR, `app-${HALF}-${slug}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

/** Warm path to the results screen. Never a direct URL entry — see the header. */
async function walkToResults(page: Page): Promise<void> {
  await walkUntilQuestionsIntro(page);
  await answerAndAdvanceToResults(page, 'max');
}

/**
 * The entity-tab labels actually rendered, in render order. Read for the RECORD, not for an assertion: the ledger row quotes this list verbatim, so the absence of a candidates tab is written down as an observation rather than inferred from a count mismatch. Resolves to `[]` when no tablist is present at all.
 */
async function readRenderedEntityTabs(page: Page): Promise<Array<string>> {
  return page.getByTestId(testIds.voter.results.entityTabs).getByRole('tab').allInnerTexts();
}

test.describe('@probe default-template results surface (TMPL-03, criterion 1)', () => {
  test('parties list is non-empty @probe', async ({ page, resultsPage }) => {
    test.setTimeout(PROBE_TEST_MAX);

    await walkToResults(page);
    await resultsPage.selectEntityTab('orgs');

    const cards = resultsPage.getEntityCards();
    const observed = await cards.count();
    console.log(`[145-03] observed organization card count: ${observed}`);
    console.log(`[145-03] screenshot: ${await captureHalf(page, 'parties')}`);

    await expect(cards, 'organization (parties) cards rendered on the results page').not.toHaveCount(0);
  });

  test('entity tabs include candidates @probe', async ({ page, resultsPage }) => {
    test.setTimeout(PROBE_TEST_MAX);

    await walkToResults(page);

    // Record the rendered tab set and the screenshot BEFORE the assertion below, so both survive a failing run — a red half whose evidence was never written is not a measurement.
    console.log(`[145-03] observed entity tab set: ${JSON.stringify(await readRenderedEntityTabs(page))}`);
    console.log(`[145-03] screenshot: ${await captureHalf(page, 'tabs')}`);

    // WHY A MISSING ENTITY TYPE PRESENTS AS A MISSING TAB, NOT AN EMPTY LIST.
    // The results layout derives its tabs from `Object.keys(matches[electionId])` (routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte), and the nomination tree drops a WHOLE LEAF when an entity type has zero nominations.
    // So an entity type the anon role cannot see never reaches the key set at all: the tab is ABSENT, and the tab bar silently renders one fewer control. That is the app-level mirror of the RPC's absent `candidate` key, and it is why this assertion is over the tab SET rather than over a card count on a tab that may not exist.
    await resultsPage.expectEntityTabs(['cands', 'orgs', 'alliances']);

    await resultsPage.selectEntityTab('cands');
    const cards = resultsPage.getEntityCards();
    console.log(`[145-03] observed candidate card count: ${await cards.count()}`);

    await expect(cards, 'candidate cards rendered on the results page').not.toHaveCount(0);
  });
});
