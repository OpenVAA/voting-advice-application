/**
 * @file trackingIntercept.probe.spec.ts — smoke/probe for the `trackingIntercept`
 * fixture (EFLOW-08).
 *
 * SC2 (A8 fixtures-first): exercises the `createTrackingIntercept` fixture
 * (`tests/tests/fixtures/shared/trackingIntercept.fixture.ts`) — the
 * `window.umami.track` capture seam — proving BOTH:
 *   1. the capture seam records emitted `track` calls (`getTrackCalls()` is
 *      non-empty after an emit), and
 *   2. the suppression case: with consent NOT granted the app's `shouldTrack`
 *      gate is false, so the app emits nothing and `getTrackCalls()` stays empty.
 *
 * ## Arming path (chosen — documented per the plan NOTE)
 *
 * The app only WIRES + passes the `shouldTrack` gate when (1)
 * `appSettings.analytics.platform==='umami'`, (2) `analytics.trackEvents===true`,
 * AND (3) `userPreferences.dataCollection.consent==='granted'`
 * (`trackingService.svelte.ts:121`). Of these:
 *   - (3) consent is a CLIENT-side `localStorageState('appContext-userPreferences')`
 *     value — armable from the test via `addInitScript` (versioned envelope).
 *   - (1)+(2) analytics.platform/trackEvents are APP-SETTINGS values. NO current
 *     dev-seed template arms them (`MINIMAL_BASE_APP_SETTINGS` sets
 *     `analytics.trackEvents:false`; `e2e/base` sets none), and whether a dynamic
 *     `app_settings.analytics` override propagates to `appSettings.analytics` at
 *     runtime is RESEARCH Open-Question-2 (UNCONFIRMED in 119).
 *
 * Because (1)+(2) cannot be deterministically armed in 119 without confirmed
 * analytics-override seeding, this probe proves the fixture's CAPTURE SEAM
 * directly: it stubs `window.umami.track` (the fixture's seam), then drives a
 * page-side `window.umami.track(...)` call (exactly what `UmamiAnalytics`'s
 * `sendUmamiEvent` does once armed) and asserts the seam captured it. The
 * suppression case is proven against the REAL app (no consent ⇒ no emit).
 *
 * The Phase-121 EFLOW-08 spec — once the analytics-override arming is confirmed
 * (Open-Question-2) — drives the emit via a real in-app UI action instead of the
 * direct seam call. This probe's emit assertion proves the capture half; the
 * suppression assertion proves the gate half.
 *
 * ## SEED (out-of-band pre-step)
 *
 *   yarn db:seed --template e2e/base
 *
 * ## RUN (single-file, isolated)
 *
 *   npx playwright test tests/tests/specs/_probes/trackingIntercept.probe.spec.ts \
 *     -c tests/playwright.config.ts
 */

import { createTrackingIntercept } from '../../fixtures/shared/trackingIntercept.fixture';
import { expect, test } from '../../fixtures/voter/views';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';

test.describe('@probe trackingIntercept fixture (EFLOW-08)', () => {
  test('capture seam records an emitted track call', async ({ page }) => {
    // Install the capture stub BEFORE navigation (addInitScript).
    const tracking = await createTrackingIntercept(page);

    await page.goto(buildRoute({ route: 'Home', locale: 'en' }) || '/');

    // Drive the exact emit seam UmamiAnalytics.sendUmamiEvent uses once armed:
    // window.umami.track(name, data). The fixture's stub captures it.
    await page.evaluate(() => window.umami?.track('probe_event', { source: 'probe' }));

    const calls = await tracking.getTrackCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0].name).toBe('probe_event');
  });

  test('suppression: no consent ⇒ the app emits nothing (getTrackCalls empty)', async ({ page }) => {
    // Stub installed, but consent is NOT granted, so the app's shouldTrack gate
    // is false and no in-app emit reaches the seam. The captured array stays
    // empty (suppression).
    const tracking = await createTrackingIntercept(page);

    await page.goto(buildRoute({ route: 'Home', locale: 'en' }) || '/');
    // Let any app-side tracking that WOULD fire have a chance to (it must not,
    // because consent is withheld). Anchor on the home content load instead of a
    // timeout (no-wait-for-timeout lint rule).
    await page.getByTestId(testIds.voter.home.page).waitFor({ state: 'visible' });

    const calls = await tracking.getTrackCalls();
    expect(calls).toHaveLength(0);
  });
});
