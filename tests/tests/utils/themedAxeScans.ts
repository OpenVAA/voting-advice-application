/**
 * @file The declaration of a surface's two axe scans, the light scan and its dark twin, shared by every helper that declares scans of the Contestant App or the Admin App.
 *
 * A plain module and not a spec, so that each scan helper can import it: one Playwright test file cannot import another. It declares no test of its own; `declareLightAndDarkScans` declares them in the file that calls it, under whatever session and project that file's describe supplies.
 *
 * What a helper supplies is only what differs between the families: how the page is first opened, how the state is reached and how the reach is proved. The composition of the three, the dark-theme guard on the twin and the twin's dark browser context are here once, so no family can declare a scan that skips either proof.
 *
 * The gate itself is not here. Every scan goes through the one `assertAxeScan` of `axeScan.ts`, and this module constructs no axe builder and names no rule or tag, so a spec that declares its scans through it cannot be scanned less strictly than another.
 */

import { test } from '@playwright/test';
import { assertAxeScan, assertDarkThemeApplied } from './axeScan';
import type { Page } from '@playwright/test';
import type { Route } from '../../../apps/frontend/src/lib/routes/route';
import type { RawAxeRoute } from './axeScan';

/**
 * One surface to scan in both themes, in the shape every scan helper hands over.
 */
export interface ThemedScanEntry {
  /** The entry's name, which no other entry of the same project carries. It names the two tests and the scan's attachments. */
  name: string;
  /** The route the scanned surface belongs to. */
  routeId: Route;
  /** The data-driven test id the scan waits for last, once the state is reached and proved. */
  contentTestId: string;
  /** Open the page before the state is reached, in the test's body. Absent, the test opens nothing and `reach` starts from a page that has opened nothing. */
  open?: (page: Page) => Promise<void>;
  /** Bring the page to the scanned state. */
  reach: (page: Page) => Promise<void>;
  /** Assert that the page is in the scanned state, after `reach`. */
  proveReach: (page: Page, label: string) => Promise<void>;
  /** `false` for a page that renders under the root layout alone, with no header. See `assertDarkThemeApplied`. */
  layoutChrome?: boolean;
}

/**
 * Declare the two scans of one entry: the light scan and its dark twin.
 *
 * Call it at the top level of a spec or inside a `describe`: the two tests are declared where the call stands, titled `axe accessibility scan — <name>` and the same with ` (dark)`. Each opens the entry's page, reaches and proves its state, and on the dark twin proves the theme, before the shared scan.
 *
 * A dark twin runs in a browser context that is created dark, so the whole document, the persistent layout chrome included, is dark from its first paint. The page is never switched to dark after it has rendered: a document switched so keeps its persistent chrome in the light colours, which `assertDarkThemeApplied` pins.
 *
 * @param entry - The entry to scan.
 */
export function declareLightAndDarkScans(entry: ThemedScanEntry): void {
  test(`axe accessibility scan — ${entry.name}`, async ({ page }, testInfo) => {
    await entry.open?.(page);
    await assertAxeScan(page, toScanEntry(entry, entry.name, false), testInfo, entry.name);
  });

  // The anonymous describe scopes the colour scheme to this one test without adding a segment to its title.
  test.describe(() => {
    test.use({ colorScheme: 'dark' });

    test(`axe accessibility scan — ${entry.name} (dark)`, async ({ page }, testInfo) => {
      const label = `${entry.name}-dark`;
      await entry.open?.(page);
      await assertAxeScan(page, toScanEntry(entry, label, true), testInfo, label);
    });
  });
}

/**
 * Adapt an entry to the shared core's raw route, composing the entry's `reach`, its reach proof and, on a dark twin, the dark-theme guard into the one `settle` the core calls.
 *
 * The core runs `settle` first and waits for the content anchor last, so both proofs are taken from the reached document and asserted before the scan, and no entry can opt out of either: entries do not supply `settle` at all. Both proofs run after `reach` rather than after the page is opened, because an entry's target is often not the address it opens, and because the dark guard reads the persistent layout chrome, which is not in the document before the page has rendered.
 *
 * Exported for a spec that runs the shared scan inside a test of its own rather than declaring the two scans.
 *
 * @param entry - The entry to adapt.
 * @param label - The scan's label: the entry's name, with a suffix on its dark twin.
 * @param dark - Whether the scan is the dark twin, which also runs the dark-theme guard.
 * @returns The entry in the shape `assertAxeScan` takes.
 */
export function toScanEntry(entry: ThemedScanEntry, label: string, dark: boolean): RawAxeRoute {
  return {
    name: entry.name,
    fixture: 'raw',
    routeId: entry.routeId,
    contentTestId: entry.contentTestId,
    settle: async (page) => {
      await entry.reach(page);
      await entry.proveReach(page, label);
      await assertDarkThemeIfDark(page, dark, entry.layoutChrome ?? true);
    }
  };
}

/**
 * Run the shared dark-theme guard on a dark twin, and nothing on a light one. The branch lives at module scope, so that no condition sits inside a test's body (playwright/no-conditional-in-test).
 *
 * @param page - The page the scan is about to read.
 * @param dark - Whether the scan is the dark twin.
 * @param layoutChrome - Whether the page renders the layout's header.
 */
async function assertDarkThemeIfDark(page: Page, dark: boolean, layoutChrome: boolean): Promise<void> {
  if (!dark) return;
  await assertDarkThemeApplied(page, { layoutChrome });
}
