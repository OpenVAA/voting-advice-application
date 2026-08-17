/**
 * @file trackingIntercept fixture.
 *
 * Shared, cross-app function-fixture that captures the analytics events the
 * app emits at the Umami boundary — WITHOUT any real network to
 * `cloud.umami.is` and WITHOUT embedding any Umami website key
 * (cardinal-rule safe; CLAUDE.md: never commit secrets).
 *
 * ## Emission boundary (VERIFIED)
 *
 * `TrackingService` routes all submitted event data through a single handler
 * stored in its `sendTrackingEvent` rune. `+layout.svelte` wires that handler
 * to Umami: `sendTrackingEvent.set(umamiRef.trackEvent)`, and
 * `UmamiAnalytics.svelte`'s `sendUmamiEvent` ultimately calls
 * `window.umami.track(name, data)` (guarded by `'umami' in window`). So the
 * single, stable capture seam is `window.umami.track`.
 *
 * This fixture defines a stub `window.umami.track` via `page.addInitScript`
 * BEFORE navigation, so the app's `sendUmamiEvent` pushes every call into
 * `window.__trackCalls`. `getTrackCalls()` reads that array back via
 * `page.evaluate`.
 *
 * ## Arming prerequisite (Pitfall 5 — the consuming spec/probe MUST satisfy)
 *
 * The app only WIRES `sendTrackingEvent` and only passes the `shouldTrack`
 * gate when ALL of these hold:
 *   1. `appSettings.analytics.platform === 'umami'`  → so `UmamiAnalytics`
 *      mounts and `sendTrackingEvent.set(umamiRef.trackEvent)` runs.
 *   2. `appSettings.analytics.trackEvents === true`   → part of the
 *      `shouldTrack` gate (`trackingService.svelte.ts`).
 *   3. `userPreferences.dataCollection.consent === 'granted'` → the other
 *      part of `shouldTrack`.
 * Seed (1)+(2) via the perm/`app_settings` analytics overlay and grant (3)
 * in userPreferences. WITHOUT all three, nothing emits and
 * `getTrackCalls()` is empty.
 *
 * The CONSENT-UNGRANTED state is the SUPPRESSION (no-emit) assertion: with
 * consent withheld, `shouldTrack === false`, so `getTrackCalls()` must stay
 * empty even though the stub is installed.
 *
 * ## Surface
 *  - install()        — idempotent; (re)arm the `window.umami.track` stub via
 *                       addInitScript. Called by the async factory; exposed so
 *                       a caller can re-install after a fresh context if
 *                       needed.
 *  - getTrackCalls()  — read the captured `{ name, data }[]` from the page.
 *  - clear()          — reset the captured-calls array in the page.
 *
 * **Rigidity contract**: no `expect.soft`, no `try/catch` wrapping
 * `expect(...)`, no `.catch(() => null)` on assertion-bearing interactions.
 * This fixture performs no assertions itself (it is a capture seam) — the
 * consuming spec asserts against `getTrackCalls()`.
 */

import type { Page } from '@playwright/test';

/** A single captured analytics event. */
export interface TrackCall {
  name: string;
  data?: unknown;
}

export interface TrackingInterceptFixture {
  /** (Re)install the `window.umami.track` capture stub (idempotent). */
  install(): Promise<void>;
  /** Read the captured `{ name, data }` calls from the page. */
  getTrackCalls(): Promise<Array<TrackCall>>;
  /** Reset the captured-calls array in the page. */
  clear(): Promise<void>;
}

/**
 * Local window augmentation scoped to this fixture file (the captured-calls
 * array + the stubbed umami global). Kept local rather than in the global
 * `.d.ts` because it is a test-only capture seam, not an app contract.
 */
declare global {
  interface Window {
    __trackCalls?: Array<TrackCall>;
    umami?: { track: (name: string, data?: unknown) => void };
  }
}

/**
 * Create the tracking-intercept fixture bound to `page`.
 *
 * ASYNC because it calls `page.addInitScript` (which returns a Promise). The
 * init-script runs in EVERY document the context creates, BEFORE any app
 * script — so `window.umami` is already stubbed when `UmamiAnalytics` checks
 * `'umami' in window` and calls `window.umami.track`.
 */
export async function createTrackingIntercept(page: Page): Promise<TrackingInterceptFixture> {
  const fixture: TrackingInterceptFixture = {
    async install(): Promise<void> {
      await page.addInitScript(() => {
        window.__trackCalls ||= [];
        window.umami = {
          track: (name: string, data?: unknown) => {
            (window.__trackCalls ||= []).push({ name, data });
          }
        };
      });
    },

    async getTrackCalls(): Promise<Array<TrackCall>> {
      return page.evaluate(() => window.__trackCalls ?? []);
    },

    async clear(): Promise<void> {
      await page.evaluate(() => {
        window.__trackCalls = [];
      });
    }
  };

  await fixture.install();
  return fixture;
}
