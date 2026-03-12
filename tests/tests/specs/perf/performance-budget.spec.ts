/**
 * Performance budget tests for the voter results page.
 *
 * These budgets are calibrated to the Docker dev-mode environment used
 * by the E2E suite (SvelteKit dev server + Strapi dev + Postgres in
 * Docker Compose). They are NOT representative of production build
 * performance and should not be compared to production baselines.
 *
 * Purpose: Detect performance regressions. If the results page suddenly
 * takes 30 seconds to load when it used to take 5, something broke.
 * The generous thresholds (8s DOMContentLoaded, 15s full load) ensure
 * that normal dev-mode variance does not cause flaky failures.
 *
 * How to update budgets:
 *   1. Run this test 3-5 times locally: `npx playwright test -c tests/playwright.config.ts --grep @perf`
 *   2. Note the P90 value from the console output
 *   3. Add a 50% margin to the P90 value
 *   4. Update the expect() thresholds below
 *
 * Run command:
 *   npx playwright test -c tests/playwright.config.ts --grep @perf
 */

import { voterTest } from '../../fixtures/voter.fixture';
import { expect } from '@playwright/test';

voterTest.describe('Performance budgets', { tag: ['@perf'] }, () => {
  // Generous timeout: fixture navigation (~30s) + page reload + measurement
  voterTest.setTimeout(60000);

  voterTest('voter results page loads within budget', async ({ answeredVoterPage: page }) => {
    // The fixture has navigated through the voter journey and landed on the
    // results page via client-side routing. To get clean Navigation Timing
    // data for a full page load (not a client-side route transition), we
    // reload the page.
    await page.reload({ waitUntil: 'load' });

    // Wait for the results list to re-render after reload
    await page.waitForLoadState('domcontentloaded');

    // Extract Navigation Timing metrics
    const timing = await page.evaluate(() => {
      const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      const nav = entries[0];
      return {
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
        loadComplete: Math.round(nav.loadEventEnd),
        domInteractive: Math.round(nav.domInteractive),
        duration: Math.round(nav.duration),
        ttfb: Math.round(nav.responseStart - nav.requestStart)
      };
    });

    // Log timing values for calibration visibility
    console.log('Performance timing:', timing);

    // Assert budgets calibrated to Docker dev mode.
    // These are generous -- regression detectors, not absolute targets.
    expect(timing.domContentLoaded).toBeLessThan(8000); // 8s DOMContentLoaded
    expect(timing.loadComplete).toBeLessThan(15000); // 15s full load
  });
});
