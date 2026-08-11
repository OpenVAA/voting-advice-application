/**
 * Performance budget for the voter results page.
 *
 * Purpose: detect performance regressions on the results page — the heaviest
 * user-facing surface in the app (SSR → hydration → Supabase round-trips →
 * match computation → entity-list render).
 *
 * ## Why this measures what it measures (Phase 136, REAL-02)
 *
 * This spec previously asserted `domContentLoaded < 8000` / `loadEventEnd <
 * 15000` off Navigation Timing. Both assertions were **structurally incapable**
 * of seeing the page they were named after. Measured on this machine
 * (2026-08-11, 8 runs — 5 on an idle dev server, 3 under 3-project contention):
 *
 * ```
 * domContentLoaded 43–183 ms   loadEventEnd 45–185 ms   ttfb 30–173 ms
 * ```
 *
 * `ttfb` is ~95% of `domContentLoaded` and `loadEventEnd` lands 1–2 ms after
 * it, i.e. the Navigation Timing window closes at the **SSR response** — before
 * hydration, before the 11 client-side Supabase requests, before matching, and
 * before a single entity card exists. A 10× regression in the matching
 * algorithm, or an N+1 in the results fetch, moves neither number. The old
 * thresholds also carried 44–186× headroom over the measured values.
 *
 * The two assertions below span the actual work instead:
 *
 * 1. **Time to matches rendered** (wall clock) — `reload()` → the first
 *    `match-score` visible. This is the thing a voter waits for, and it
 *    covers every stage the old metric excluded.
 * 2. **Results-fetch operation budget** (load-independent) — the number of
 *    `/rest/v1/` requests the results route issues. This is the guard that
 *    catches an N+1 or a duplicated fetch chain *regardless* of how fast the
 *    machine is, so it cannot be silently absorbed by faster hardware.
 *
 * Navigation Timing is still logged (never asserted) as observability, so the
 * SSR-vs-client split stays visible when a budget fails.
 *
 * ## Calibration (measured, not assumed)
 *
 * `TIME_TO_MATCHES_BUDGET_MS = 5000`, from 8 measured runs of the metric below:
 *
 * ```
 * idle dev server (workers=1):        296, 500, 502, 508, 522 ms
 * contended (perf + a11y + journey):  821, 1101, 1504 ms
 * ```
 *
 * Max observed 1504 ms; the environmental spread alone is 5× (296 → 1504), so
 * any non-flaky threshold must clear max-observed by more than that spread's
 * own variance. 5000 ms = 3.3× max observed / 9.6× the idle P90, and additionally
 * absorbs the ~1 s of cold-dev-server SSR inflation measured separately on this
 * machine (ttfb 428 ms on a just-started server vs 30–173 ms warm). It is a
 * regression gate for dev mode, NOT a production target.
 *
 * `RESULTS_FETCH_BUDGET = 13`: the route issued exactly **11** `/rest/v1/`
 * requests in 8/8 runs, invariantly across both idle and contended runs AND
 * across result sets of 6 and 13 cards (so the count is genuinely
 * load-independent, not incidentally stable). +2 slack for a benign reactive
 * re-fetch. An N+1 in the results fetch fails this as `expected 40 to be ≤ 13`.
 *
 * ## How to update the budgets
 *
 *   1. Run 5× on an idle dev server and 3× alongside `--project=a11y-smoke
 *      --project=voter-journey` (contention matters more than repetition here).
 *   2. Read the `Results performance:` console line from each run.
 *   3. Set the wall-clock budget above max-observed with a stated multiplier,
 *      and record the raw numbers in this docblock. Never lower a budget
 *      without re-measuring, and never raise one to make a red test green.
 *
 * Fixture: the voter-journey `answeredVoterPage` (base dataset) — a full voter
 * walk that lands on `/results` with answers persisted, so the reload measured
 * below renders a real, matched result set.
 *
 * Run command:
 *   npx playwright test -c tests/playwright.config.ts --project=performance
 *
 * Rigidity contract: every assertion is HARD — no `expect.soft`, no
 * unconditioned timeouts.
 */

/* eslint-disable playwright/no-standalone-expect -- voterTest extends @playwright/test; expect is inside test body */
import { expect } from '@playwright/test';
import { voterJourneyTest as voterTest } from '../../fixtures/voter/voter-journey.fixture';
import { testIds } from '../../utils/testIds';

/** Wall-clock budget: reload → first match score visible. See calibration above. */
const TIME_TO_MATCHES_BUDGET_MS = 5000;

/** Load-independent budget: `/rest/v1/` requests issued by the results route. */
const RESULTS_FETCH_BUDGET = 13;

/**
 * Ceiling for the render waits. Deliberately above the budget so an over-budget
 * render still fails as a legible `expected 6234 to be less than 5000` rather
 * than as an opaque locator timeout.
 */
const RENDER_WAIT_CEILING_MS = 20_000;

voterTest.describe('Performance budgets', { tag: ['@perf'] }, () => {
  // Fixture walk (~15-27s) + reload + measurement, with headroom for the
  // over-budget case (RENDER_WAIT_CEILING_MS) so the assertion — not the test
  // timeout — reports the failure.
  voterTest.setTimeout(90000);

  voterTest('voter results page renders matches within budget', async ({ answeredVoterPage: page }) => {
    // Count the results route's own data fetches. Portrait/storage requests are
    // excluded: those scale with the number of nominated candidates, which is a
    // property of the dataset, not of the fetch shape under test.
    const resultsFetches: Array<string> = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/rest/v1/')) resultsFetches.push(`${request.method()} ${url}`);
    });

    const list = page.getByTestId(testIds.voter.results.list);
    const matchScore = page.getByTestId(testIds.voter.results.matchScore);
    const card = page.getByTestId(testIds.voter.results.card);

    // The fixture landed on /results via client-side routing. Reload so the
    // measurement spans a full cold client load of the route: SSR response →
    // hydration → Supabase round-trips → matching → list render.
    //
    // `waitUntil: 'commit'` (not 'load') deliberately: the load event fires ~1ms
    // after the SSR response and long before the list exists, so waiting for it
    // would put the very blind spot this spec was rewritten to close back into
    // the measured window.
    const started = Date.now();
    await page.reload({ waitUntil: 'commit' });
    await list.waitFor({ state: 'visible', timeout: RENDER_WAIT_CEILING_MS });
    await matchScore.first().waitFor({ state: 'visible', timeout: RENDER_WAIT_CEILING_MS });
    const timeToMatches = Date.now() - started;

    const cardCount = await card.count();
    const scoreCount = await matchScore.count();

    // Observability only — NEVER asserted. Kept so a budget failure shows
    // whether the regression is server-side (ttfb climbs) or client-side
    // (ttfb flat, timeToMatches climbs). See the docblock for why asserting
    // on these is meaningless for this page.
    const navigationTiming = await page.evaluate(() => {
      const nav = (performance.getEntriesByType('navigation') as Array<PerformanceNavigationTiming>)[0];
      return {
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
        loadComplete: Math.round(nav.loadEventEnd),
        ttfb: Math.round(nav.responseStart - nav.requestStart)
      };
    });

    console.log(
      `Results performance: ${JSON.stringify({
        timeToMatches,
        resultsFetches: resultsFetches.length,
        cardCount,
        scoreCount,
        navigationTiming
      })}`
    );

    // Non-vacuity guard: the timer above is only meaningful if the page
    // actually rendered a matched result set. Without this, a results page that
    // rendered an empty list would post an excellent time.
    expect(cardCount).toBeGreaterThan(0);
    expect(scoreCount).toBeGreaterThan(0);

    // Load-independent: fetch shape, not machine speed.
    expect(resultsFetches.length).toBeLessThanOrEqual(RESULTS_FETCH_BUDGET);

    // Wall clock: spans SSR + hydration + data + matching + render.
    expect(timeToMatches).toBeLessThan(TIME_TO_MATCHES_BUDGET_MS);
  });
});
