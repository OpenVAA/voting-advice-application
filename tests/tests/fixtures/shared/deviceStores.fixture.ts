/**
 * @file deviceStores fixture.
 *
 * Reads what a browser context holds on the device — cookies, localStorage, sessionStorage and IndexedDB — and asserts that it is only what the application is allowed to keep there.
 *
 * ## What is read
 *
 * Cookies, localStorage and IndexedDB come from one `context.storageState({ indexedDB: true })` call. Cookies are read for every domain the context holds. localStorage and IndexedDB are read for the page's origin by name; the names any other origin holds are reported with that origin in front, so they are never allowed. sessionStorage is per tab and is not part of a storage state, so its keys are read from the page itself; the page must therefore be on the app's origin when the state is read, and it must be the page the journey ran in.
 *
 * The allowlist and the boundary of the claim are those of `tests/tests/utils/privacyAllowlists.ts`.
 *
 * **Rigidity contract**: every assertion is hard — no soft assertion, no `try/catch` wrapping `expect(...)`, no `.catch(() => null)` on assertion-bearing interactions.
 */

import { expect } from '@playwright/test';
import { findUnexpectedDeviceState, findUnexpectedPreferenceMembers } from '../../utils/privacyAllowlists';
import type { BrowserContext, Page } from '@playwright/test';
import type { DeviceState } from '../../utils/privacyAllowlists';

/** The localStorage key the application keeps the user preferences under. */
const USER_PREFERENCES_KEY = 'appContext-userPreferences';

/** The device state with the raw stored user preferences, when present. */
export type DeviceStateReading = DeviceState & {
  /** The stored string of the user preferences on the page's origin, or `null` when none is stored. */
  userPreferences: string | null;
};

/** The IndexedDB part of a storage-state origin, which the declared return type of `storageState` omits. */
type IndexedDbOrigin = { indexedDB?: Array<{ name: string }> };

/**
 * Read the names held in the four stores.
 * @param context - The browser context whose cookies, localStorage and IndexedDB are read.
 * @param page - A page of `context` on the app's origin; its sessionStorage is read and its origin is the app's.
 * @returns The names per store, with the stored user preferences.
 */
export async function readDeviceState(context: BrowserContext, page: Page): Promise<DeviceStateReading> {
  const appOrigin = new URL(page.url()).origin;
  const storage = await context.storageState({ indexedDB: true });
  const sessionStorageKeys = await page.evaluate(() => Object.keys(window.sessionStorage));

  const state: DeviceStateReading = {
    localStorage: [],
    sessionStorage: sessionStorageKeys,
    cookies: storage.cookies.map((cookie) => cookie.name),
    indexedDB: [],
    userPreferences: null
  };

  for (const origin of storage.origins) {
    const label = (name: string): string => (origin.origin === appOrigin ? name : `${origin.origin} ${name}`);
    state.localStorage.push(...origin.localStorage.map((item) => label(item.name)));
    state.indexedDB.push(...((origin as IndexedDbOrigin).indexedDB ?? []).map((database) => label(database.name)));
    if (origin.origin === appOrigin) {
      state.userPreferences = origin.localStorage.find((item) => item.name === USER_PREFERENCES_KEY)?.value ?? null;
    }
  }

  return state;
}

/**
 * Assert that the device holds only allow-listed state, and that the stored user preferences hold only their allowed members.
 * @param context - The browser context to read.
 * @param page - A page of `context` on the app's origin, the one the journey ran in.
 */
export async function expectOnlyAllowedDeviceState(context: BrowserContext, page: Page): Promise<void> {
  const state = await readDeviceState(context, page);

  const unexpected = findUnexpectedDeviceState(state);
  expect(unexpected, `the device holds state outside the allowlist: ${unexpected.join(', ')}`).toStrictEqual([]);

  if (state.userPreferences !== null) {
    const members = findUnexpectedPreferenceMembers(state.userPreferences);
    expect(
      members,
      `the stored user preferences hold members outside the allowlist: ${members.join(', ')}`
    ).toStrictEqual([]);
  }
}
