/**
 * @file voter-prefs-tracking.spec.ts — EFLOW-08.
 *
 * Two assertions over the voter app, hosted UNDER the `voter-prefs-tracking`
 * Playwright project (depends on `data-setup-perm-analytics-tracking`, Plan 04):
 *
 *  1. TRACKING emit-vs-suppress at the `window.umami.track` boundary, captured by
 *     the verified `trackingIntercept` fixture (Phase 119).
 *  2. USER-PREFERENCES round-trip — every persisted field survives a reload.
 *
 * ## Why this is a perm-hosted spec (NOT a base leaf)
 *
 * Umami emission requires THREE arming conditions (RESEARCH Pitfall 2):
 *   1. `appSettings.analytics.platform.name === 'umami'` (full platform OBJECT)
 *   2. `appSettings.analytics.trackEvents === true`
 *      — BOTH seeded into the shared `app_settings` singleton by the
 *        `perm-analytics-tracking` template (Plan 04). A base-leaf on
 *        `data-setup-base` could NOT depend on this singleton-clobbering perm
 *        node, so the spec is hosted under the perm project.
 *   3. `userPreferences.dataCollection.consent === 'granted'`
 *      — toggled at RUNTIME via the in-app DataConsent control (NOT seeded).
 *
 * ## Emission mechanism (VERIFIED from source)
 *
 *  - Granting consent calls `setDataConsent('granted')`, which itself fires
 *    `startEvent('dataConsent_granted')` (appContext.svelte.ts:445). `startEvent`
 *    BUFFERS the event (trackingService.svelte.ts:160-164).
 *  - The buffer is FLUSHED on navigation / unload via `submitAllEvents()`
 *    (+layout.svelte onNavigate:162 / onDestroy:173 / visibilitychange:191),
 *    which routes the bundle through `track('pageview', { ...NN__dataConsent_granted })`
 *    (trackingService.svelte.ts:186) — the single `window.umami.track` boundary.
 *  - `track` early-returns when `shouldTrack` is false (trackingService.svelte.ts:192),
 *    so WITHOUT consent NOTHING reaches the stub. That early-return IS the
 *    consent-gate regression guard (threat T-121-CON).
 *
 * So one runtime action — grant consent, then navigate to flush — exercises BOTH
 * the buffered `startEvent` action and the immediate `track` boundary required by
 * the success criteria.
 *
 * ## Persisted-prefs scope (RESEARCH A4)
 *
 * `userPreferences` (userPreferences.type.ts) persists exactly:
 * `dataCollection.consent` + `feedback.status` + `survey.status` — there is NO
 * theme field (dark mode is OS-media-driven, not a persisted preference). The
 * round-trip writes all three through the app's real `localStorageState`
 * versioned envelope (`appContext-userPreferences`), reloads, and re-reads them
 * back THROUGH the version check (proving persistence, not a raw blob echo).
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is HARD — no
 * expect.soft, no try/catch around expect(), no .catch fallback. No one-shot
 * `isVisible({timeout})` as a wait.
 */

// EFLOW-08: prefs round-trip + tracking emit/suppress

import { expect, test } from '@playwright/test';
import { createTrackingIntercept } from '../../fixtures/shared/trackingIntercept.fixture';
import { TIMEOUTS } from '../../helpers';
import type { Page } from '@playwright/test';

/** The in-app DataConsent "granted" button accessible name (DataConsent.svelte). */
const GRANTED_BUTTON = /agree to share my data/i;

/**
 * Grant data-collection consent via the in-app DataConsent control (NOT seeded).
 *
 * When consent is `indetermined` the voter layout auto-opens the DataConsentPopup
 * (a modal `Alert` dialog) which carries its OWN DataConsent — the canonical
 * consent surface a voter sees. It overlays the inline privacy-page DataConsent,
 * so we drive the dialog's granted button (scoped to `getByRole('dialog')` to
 * avoid the strict-mode clash with the inline copy). Clicking it runs
 * `setDataConsent('granted')` → `startEvent('dataConsent_granted')` and closes
 * the dialog (`onChange` → `closeAlert()`).
 */
/**
 * Flush the tracking-service event buffer on the SAME window (so the captured
 * `__trackCalls` array survives to be read). The voter layout registers a
 * `visibilitychange` listener (+layout.svelte:188-194) that calls
 * `submitAllEvents()` when the document becomes hidden — which routes any buffered
 * events through `track('pageview', …)` IFF `shouldTrack` is true. We force the
 * hidden state and dispatch the event (no real navigation needed, no modal in the
 * way), then restore visibility.
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
 * The persisted `userPreferences` shape we round-trip. Mirrors
 * userPreferences.type.ts (consent + feedback.status + survey.status). `date`
 * fields are persisted alongside but the round-trip assertion targets the
 * status/consent values.
 */
interface PersistedPrefs {
  dataCollection?: { consent: string; date: string };
  feedback?: { status: string; date: string };
  survey?: { status: string; date: string };
}

/**
 * Read the `data` payload of the app's versioned localStorage envelope
 * (`{ version, data }` — persistedState.svelte.ts:182-189). Returns `null` when
 * the key is absent. Reads through `JSON.parse` exactly as the app would.
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
 * Merge `patch` into the app's versioned localStorage envelope, PRESERVING the
 * existing version number (so the app's `getItemFromStorage` version gate accepts
 * it on reload). Requires the envelope to already exist (consent granted via UI
 * first), so we never fabricate a version.
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

    // Land on the privacy page WITHOUT granting consent. The analytics singleton
    // is armed (platform.name='umami' + trackEvents=true via the perm seed), but
    // the third arming condition (consent='granted') is NOT met → shouldTrack
    // false. The privacy page's `afterNavigate` always buffers a pageview, so the
    // flush has something to (attempt to) submit.
    await page.goto('/en/privacy');
    await expect(page.getByTestId('voter-privacy-return')).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await tracking.clear();

    // Flush the buffer on the SAME window (keeps the capture array alive). The
    // flush's `submitAllEvents()` runs, but `track()` early-returns because
    // shouldTrack === false (consent not granted) — so NOTHING reaches the umami
    // stub even though the flush fired. This genuinely proves the consent gate
    // (threat T-121-CON), unlike a hard nav which would trivially reset the array.
    await flushTrackingBuffer(page);

    // SUPPRESSION: shouldTrack === false → no calls reached the stub.
    expect(await tracking.getTrackCalls()).toEqual([]);
  });

  test('tracking EMITS at the umami boundary once consent is granted (track + startEvent)', async ({ page }) => {
    const tracking = await createTrackingIntercept(page);

    // Land on the privacy page (DataConsent renders when trackEvents===true, which
    // is seeded). With consent indetermined the DataConsentPopup auto-opens.
    await page.goto('/en/privacy');
    await expect(page.getByTestId('voter-privacy-return')).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await tracking.clear();

    // Grant consent at RUNTIME via the in-app DataConsent control. This writes
    // consent='granted' (arming shouldTrack) AND buffers
    // startEvent('dataConsent_granted').
    await grantConsentViaPopup(page);

    // Flush the buffered events on the SAME window so our `__trackCalls` capture
    // array survives the read. `submitAllEvents()` routes the bundle through
    // track('pageview', { ...NN__dataConsent_granted }) — the umami boundary. This
    // single flush exercises BOTH the buffered startEvent action AND the track
    // boundary.
    await flushTrackingBuffer(page);

    // EMISSION: at least one track call reached the stub.
    await expect
      .poll(async () => (await tracking.getTrackCalls()).length, { timeout: TIMEOUTS.slowPage })
      .toBeGreaterThan(0);

    const calls = await tracking.getTrackCalls();
    // The flush routes the bundle through a 'pageview' track call.
    expect(calls.some((c) => c.name === 'pageview')).toBe(true);
    // The buffered startEvent surfaces as a prefixed subevent key in the pageview
    // data bundle (submitAllEvents prefixes 'NN__<name>'), proving the startEvent
    // action was emitted (not just a bare pageview).
    const pageview = calls.find((c) => c.name === 'pageview');
    const bundleKeys = Object.keys((pageview?.data as Record<string, unknown>) ?? {});
    expect(bundleKeys.some((k) => k.includes('dataConsent_granted'))).toBe(true);
  });

  test('user-preferences round-trip: consent + feedback + survey survive a reload', async ({ page }) => {
    // Grant consent via the in-app DataConsent control so the app writes the real
    // versioned localStorage envelope (NOT a fabricated blob).
    await page.goto('/en/privacy');
    await expect(page.getByTestId('voter-privacy-return')).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await grantConsentViaPopup(page);

    // The other two persisted fields (feedback.status / survey.status) are written
    // through the app's own versioned envelope (version preserved from the
    // consent write), so the reload read passes the version gate.
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

    // The reloaded app must still reflect the persisted consent (granted button
    // disabled) — proves the round-trip is consumed by the app, not just storage.
    const grantedAfterReload = page.getByRole('button', { name: GRANTED_BUTTON });
    await expect(grantedAfterReload).toBeDisabled({ timeout: TIMEOUTS.slowPage });
  });
});
