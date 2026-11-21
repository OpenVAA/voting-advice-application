/**
 * @file The scan helper of the Contestant App's screens that are shown to a visitor with no session: the entry types, the declaration of an entry's two scans and the reach proof.
 *
 * A plain module and not a spec, so that every spec that scans such a screen can import it: one Playwright test file cannot import another. It declares no test of its own; `declareEntryScans` declares them in the file that calls it, under whatever project and settings that file's describe supplies.
 *
 * Why these entries are not declared through `declareScans` of `contestantAxeScan.ts`: that helper's reach proof asserts that the settled address is not under the login route and that a marker only a signed-in surface renders is in the document. Both are right for a stored session and wrong here: the login screen and the sign-in screen are under the login route, and no screen of this family renders a signed-in marker. The proof of reach here is the entry's own marker, which only the scanned state renders, and the address of the route the entry names.
 *
 * The composition of the reach, the proof and the dark-theme guard, and the declaration of the light scan and its dark twin, are `declareLightAndDarkScans` of `themedAxeScans.ts`, the same for every family of scans.
 *
 * The gate itself is not here. Every scan goes through the one `assertAxeScan` of `axeScan.ts`, and this module constructs no axe builder and names no rule or tag, so a spec that declares its scans through it cannot be scanned less strictly than another.
 */

import { expect } from '@playwright/test';
import { buildRoute } from './buildRoute';
import { declareLightAndDarkScans } from './themedAxeScans';
import { TIMEOUTS } from '../helpers';
import type { Locator, Page } from '@playwright/test';
import type { RawAxeRoute } from './axeScan';

/**
 * An element that only the scanned state renders: a test id, and where the state is told by an attribute of that element, the attribute and the value it must hold.
 */
export interface EntryScanMarker {
  /** The test id of the element. */
  testId: string;
  /** The state attribute the element must carry, and the value it must hold. */
  state?: { attribute: string; value: string };
}

/**
 * A scan entry for one state of a screen shown with no session.
 */
export interface EntryAxeRoute {
  /** The entry's name, which no other entry of the same project carries. It names the two tests and the scan's attachments. */
  name: string;
  /** The route whose address the page is at in the scanned state. */
  routeId: RawAxeRoute['routeId'];
  /** The locale segment that leads the settled address, for a state reached through a link that names its locale, as a mailed link does. Absent, the address is the route's own. */
  addressLocale?: string;
  /**
   * Bring the page to the state: whatever the state needs written, the navigation, and the choices made on the screen. It is handed a page that has opened nothing.
   */
  reach: (page: Page) => Promise<void>;
  /** The reach marker: the element that proves the scanned state is the one rendered. The scan waits for it last. */
  marker: EntryScanMarker;
  /** Further elements the state must show, each asserted before the scan. For a state that is told by an attribute of another element than the marker. */
  alsoShown?: ReadonlyArray<EntryScanMarker>;
  /** `false` for a page that renders under the root layout alone, with no header: its dark twin's guard then asserts that the page renders no menu toggle in place of comparing its colour. See `assertDarkThemeApplied`. */
  layoutChrome?: false;
}

/**
 * Declare the two scans of each entry: the light scan and its dark twin.
 *
 * Call it at the top level of a spec or inside a `describe`: the tests are declared where the call stands, titled `axe accessibility scan — <name>` and the same with ` (dark)`. Each brings the page to the entry's state through the entry's own `reach`, proves the state by the entry's markers, and then runs the shared scan. The test opens nothing before `reach`.
 *
 * @param entries - The entries to scan, each with a `name` no other entry of the same project carries.
 */
export function declareEntryScans(entries: ReadonlyArray<EntryAxeRoute>): void {
  for (const entry of entries) {
    declareLightAndDarkScans({
      name: entry.name,
      routeId: entry.routeId,
      contentTestId: entry.marker.testId,
      reach: entry.reach,
      proveReach: (page, label) => assertEntryReach(page, entry, label),
      layoutChrome: entry.layoutChrome !== false
    });
  }
}

/**
 * Assert that the page is in the entry's state, at the entry's route: every marker of the entry is shown, and the settled address is the route's, led by the entry's `addressLocale` where it names one.
 *
 * @param page - The page, after the entry's `reach`.
 * @param entry - The entry whose state is asserted.
 * @param label - The scan's label, which names the failure messages.
 */
async function assertEntryReach(page: Page, entry: EntryAxeRoute, label: string): Promise<void> {
  for (const marker of [entry.marker, ...(entry.alsoShown ?? [])]) {
    await expect(
      locatorOf(page, marker).first(),
      `"${label}" does not show ${marker.testId}, which only the scanned state renders`
    ).toBeVisible({ timeout: TIMEOUTS.slowPage });
  }
  const routePath = buildRoute({ route: entry.routeId, locale: 'en' });
  const path = entry.addressLocale === undefined ? routePath : `/${entry.addressLocale}${routePath}`;
  expect(new URL(page.url()).pathname, `"${label}" settled at another address than its route's`).toBe(path);
}

/** The locator of a marker: its test id, narrowed by its state attribute where it names one. */
function locatorOf(page: Page, { testId, state }: EntryScanMarker): Locator {
  const marked = page.getByTestId(testId);
  if (state === undefined) return marked;
  // reason: the state is the value of an attribute of the marked element, and neither getByTestId nor getByRole selects by an attribute's value. The selector reads a test id and that attribute, neither of which is a translated string.
  // eslint-disable-next-line playwright/no-restricted-locators
  return page.locator(`[data-testid="${testId}"][${state.attribute}="${state.value}"]`);
}
