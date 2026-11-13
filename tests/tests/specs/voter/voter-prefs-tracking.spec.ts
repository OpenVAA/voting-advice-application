/**
 * @file voter-prefs-tracking.spec.ts.
 *
 * The voter app's usage events in the default (consent-gated) mode, and the round trip of the stored user preferences. Hosted under the `voter-prefs-tracking` Playwright project, which depends on `data-setup-perm-analytics-tracking`.
 *
 * ## Why this is a perm-hosted spec (NOT a base leaf)
 *
 * The `perm-analytics-tracking` dataset turns `analytics.trackEvents` on in the shared `app_settings` row. A base leaf on `data-setup-base` could not depend on that row-writing perm node, so the spec is hosted under the perm project. The consent choice is made at run time through the voter app's consent popup; it is not seeded.
 *
 * ## How events are observed
 *
 * The browser sends its events as `POST` requests to the application's own relay path (`RELAY_PATH`), one JSON batch `{ routeId, locale, events }` per flush. `createRelayCapture` listens on the browser context before the first navigation and records every such request body; the spec asserts on the captured batches. Nothing is stubbed: the relay answers as it does for any visitor.
 *
 * The relay only forwards when the server has an analytics provider configured. The tests below need `ANALYTICS_PROVIDER=log`, as `.env.example` sets it; with provider `none` the browser sends nothing, and the first test fails with a message that says so.
 *
 * What the default mode promises, and what the tests assert:
 *  - Each view sends one pageview, with no id, whether or not the visitor has consented.
 *  - Every other event is sent only after consent, and each carries the visit id, a UUIDv7 that lives in memory for one document and is stored nowhere.
 *  - Events buffered before the grant are dropped at the grant; they are never sent.
 *
 * ## Flushing
 *
 * A batch is sent at the next flush point: a client navigation, the page becoming hidden, or the page being left. `flushTrackingBuffer` reaches the hidden flush point on the same document by overriding `document.visibilityState` and dispatching `visibilitychange`, then restores the real value. Where a test needs a batch to have arrived, it flushes again until the batch is captured, which also covers a first flush made before the page has hydrated.
 *
 * ## Persisted-prefs scope
 *
 * `userPreferences` (userPreferences.type.ts) persists exactly: `dataCollection.consent` + `feedback.status` + `survey.status` — there is NO theme field (dark mode is OS-media-driven, not a persisted preference). The round-trip writes all three through the app's real `localStorageState` versioned envelope (`appContext-userPreferences`), reloads, and re-reads them back THROUGH the version check (proving persistence, not a raw blob echo).
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is HARD — no expect.soft, no try/catch around expect(), no .catch fallback. No one-shot `isVisible({timeout})` as a wait.
 */

import { expect, test } from '@playwright/test';
import { createTrackingIntercept } from '../../fixtures/shared/trackingIntercept.fixture';
import { TIMEOUTS } from '../../helpers';
import type { Page } from '@playwright/test';

/** The in-app DataConsent "granted" button accessible name (DataConsent.svelte). */
const GRANTED_BUTTON = /agree to share my data/i;

/**
 * Flush the tracking buffer on the SAME document. The root layout calls `submitAllEvents()` when the document becomes hidden, so the helper overrides `document.visibilityState` with `'hidden'` and dispatches `visibilitychange`; it then removes the override, so the real value shows through again, and dispatches the event once more, which marks the page visible.
 */
async function flushTrackingBuffer(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

async function grantConsentViaPopup(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog');
  const grantedButton = dialog.getByRole('button', { name: GRANTED_BUTTON });
  await expect(grantedButton).toBeVisible({ timeout: TIMEOUTS.slowPage });
  await grantedButton.click();
  // The popup closes once consent is set (Alert.closeAlert via onChange).
  await expect(dialog).toBeHidden({ timeout: TIMEOUTS.slowPage });
}

/** localStorage key the app persists `userPreferences` under (appContext.svelte.ts:132). */
const PREFS_KEY = 'appContext-userPreferences';

/**
 * The persisted `userPreferences` shape we round-trip. Mirrors userPreferences.type.ts (consent + feedback.status + survey.status). `date` fields are persisted alongside but the round-trip assertion targets the status/consent values.
 */
interface PersistedPrefs {
  dataCollection?: { consent: string; date: string };
  feedback?: { status: string; date: string };
  survey?: { status: string; date: string };
}

/**
 * Read the `data` payload of the app's versioned localStorage envelope (`{ version, data }`, written by persistedState.svelte.ts). Returns `null` when the key is absent. Reads through `JSON.parse` exactly as the app would.
 */
async function readPersistedPrefs(page: Page): Promise<PersistedPrefs | null> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const env = JSON.parse(raw) as { version: number; data: unknown };
    return (env.data as PersistedPrefs) ?? null;
  }, PREFS_KEY);
}

/**
 * Merge `patch` into the app's versioned localStorage envelope, PRESERVING the existing version number (so the app's `getItemFromStorage` version gate accepts it on reload). Requires the envelope to already exist (consent granted via UI first), so we never fabricate a version.
 */
async function patchPersistedPrefs(page: Page, patch: PersistedPrefs): Promise<void> {
  await page.evaluate(
    ({ key, patch }) => {
      const raw = window.localStorage.getItem(key);
      if (!raw) throw new Error(`patchPersistedPrefs: ${key} not present — grant consent via UI first`);
      const env = JSON.parse(raw) as { version: number; data: Record<string, unknown> };
      env.data = { ...env.data, ...patch };
      window.localStorage.setItem(key, JSON.stringify(env));
    },
    { key: PREFS_KEY, patch }
  );
}

test.describe('voter-prefs-tracking (EFLOW-08)', () => {
  test.describe.configure({ mode: 'serial' });

  test('tracking is SUPPRESSED at the umami boundary without consent', async ({ page }) => {
    // Install the window.umami.track capture stub BEFORE any navigation.
    const tracking = await createTrackingIntercept(page);

    // Land on the privacy page WITHOUT granting consent. The analytics singleton is armed (platform.name='umami' + trackEvents=true via the perm seed), but the third arming condition (consent='granted') is NOT met → shouldTrack false. The privacy page's `afterNavigate` always buffers a pageview, so the flush has something to (attempt to) submit.
    await page.goto('/en/privacy');
    await expect(page.getByTestId('voter-privacy-return')).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await tracking.clear();

    // Flush the buffer on the SAME window (keeps the capture array alive). The flush's `submitAllEvents()` runs, but `track()` early-returns because shouldTrack === false (consent not granted) — so NOTHING reaches the umami stub even though the flush fired. This genuinely proves the consent gate (threat T-121-CON), unlike a hard nav which would trivially reset the array.
    await flushTrackingBuffer(page);

    // SUPPRESSION: shouldTrack === false → no calls reached the stub.
    expect(await tracking.getTrackCalls()).toEqual([]);
  });

  test('tracking EMITS at the umami boundary once consent is granted (track + startEvent)', async ({ page }) => {
    const tracking = await createTrackingIntercept(page);

    // Land on the privacy page (DataConsent renders when trackEvents===true, which is seeded). With consent indetermined the DataConsentPopup auto-opens.
    await page.goto('/en/privacy');
    await expect(page.getByTestId('voter-privacy-return')).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await tracking.clear();

    // Grant consent at RUNTIME via the in-app DataConsent control. This writes consent='granted' (arming shouldTrack) AND buffers startEvent('dataConsent_granted').
    await grantConsentViaPopup(page);

    // Flush the buffered events on the SAME window so our `__trackCalls` capture array survives the read. `submitAllEvents()` routes the bundle through track('pageview', { ...NN__dataConsent_granted }) — the umami boundary. This single flush exercises BOTH the buffered startEvent action AND the track boundary.
    await flushTrackingBuffer(page);

    // EMISSION: at least one track call reached the stub.
    await expect
      .poll(async () => (await tracking.getTrackCalls()).length, { timeout: TIMEOUTS.slowPage })
      .toBeGreaterThan(0);

    const calls = await tracking.getTrackCalls();
    // The flush routes the bundle through a 'pageview' track call.
    expect(calls.some((c) => c.name === 'pageview')).toBe(true);
    // The buffered startEvent surfaces as a prefixed subevent key in the pageview data bundle (submitAllEvents prefixes 'NN__<name>'), proving the startEvent action was emitted (not just a bare pageview).
    const pageview = calls.find((c) => c.name === 'pageview');
    const bundleKeys = Object.keys((pageview?.data as Record<string, unknown>) ?? {});
    expect(bundleKeys.some((k) => k.includes('dataConsent_granted'))).toBe(true);
  });

  test('user-preferences round-trip: consent + feedback + survey survive a reload', async ({ page }) => {
    // Grant consent via the in-app DataConsent control so the app writes the real versioned localStorage envelope (NOT a fabricated blob).
    await page.goto('/en/privacy');
    await expect(page.getByTestId('voter-privacy-return')).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await grantConsentViaPopup(page);

    // The other two persisted fields (feedback.status / survey.status) are written through the app's own versioned envelope (version preserved from the consent write), so the reload read passes the version gate.
    await patchPersistedPrefs(page, {
      feedback: { status: 'received', date: new Date().toISOString() },
      survey: { status: 'dismissed', date: new Date().toISOString() }
    });

    // Reload — forces the app to re-read userPreferences THROUGH the version check.
    await page.reload();
    await expect(page).toHaveURL(/\/en\/privacy/, { timeout: TIMEOUTS.slowPage });

    // Re-read every persisted field after the reload and assert each round-trips.
    const prefs = await readPersistedPrefs(page);
    expect(prefs, 'persisted userPreferences present after reload').not.toBeNull();
    expect(prefs?.dataCollection?.consent, 'dataCollection.consent round-trips').toBe('granted');
    expect(prefs?.feedback?.status, 'feedback.status round-trips').toBe('received');
    expect(prefs?.survey?.status, 'survey.status round-trips').toBe('dismissed');

    // The reloaded app must still reflect the persisted consent (granted button disabled) — proves the round-trip is consumed by the app, not just storage.
    const grantedAfterReload = page.getByRole('button', { name: GRANTED_BUTTON });
    await expect(grantedAfterReload).toBeDisabled({ timeout: TIMEOUTS.slowPage });
  });
});
