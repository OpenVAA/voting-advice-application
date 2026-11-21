/**
 * @file The scan helpers of the Contestant App's signed-in surfaces: the entry type, the declaration of an entry's two scans and the reach proof.
 *
 * A plain module and not a spec, so that every spec that scans a surface of the Contestant App can import it: one Playwright test file cannot import another. It declares no test of its own; `declareScans` declares them in the file that calls it, under whatever session and project that file's describe supplies.
 *
 * What is the Contestant App's own is here: the entry opens its route without an entity segment, and its reach proof asserts a signed-in surface. The composition of the reach, the proof and the dark-theme guard, and the declaration of the light scan and its dark twin, are `declareLightAndDarkScans` of `themedAxeScans.ts`, the same for every family of scans.
 *
 * The gate itself is not here. Every scan goes through the one `assertAxeScan` of `axeScan.ts`, and this module constructs no axe builder and names no rule or tag, so a spec that declares its scans through it cannot be scanned less strictly than another.
 */

import { expect, test } from '@playwright/test';
import { buildEntityLessRoute } from './contestantEntityUrl';
import { declareLightAndDarkScans } from './themedAxeScans';
import { TIMEOUTS } from '../helpers';
import type { Page } from '@playwright/test';
import type { RawAxeRoute } from './axeScan';

/**
 * A Contestant App scan entry. Same shape as the voter table's `RawAxeRoute` — a `routeId` the runner navigates to, a REQUIRED data-driven `contentTestId`, an optional reach step — plus the post-login marker the reach proof asserts.
 *
 * `reach` rather than `settle`: the runner composes `settle` from `reach` + the reach proof + the dark guard (see `toScanEntry` of `themedAxeScans.ts`), so neither proof can be forgotten on a new entry. Everything else is the voter table's contract, unchanged.
 */
export interface ContestantAxeRoute extends Omit<RawAxeRoute, 'settle'> {
  /**
   * REQUIRED — a testid this surface renders ONLY when a contestant session is live. The login route renders none of them, so its presence is a positive proof of authentication rather than the absence of a redirect.
   */
  postLoginTestId: string;
  /**
   * OPTIONAL navigation/interaction needed to REACH the scan target. Runs before the reach proof, which in turn runs before the `contentTestId` wait. It is handed the page alone, after the runner has opened the entry's route without an entity segment; an entry whose target is elsewhere, or in a state the route does not open in, navigates and sets that state here.
   */
  reach?: (page: Page) => Promise<void>;
}

/** Any URL inside the contestant application, with or without a locale prefix. */
const CONTESTANT_APP_URL = /\/contestant(\/|$|\?|#)/;
/** The contestant login route — the surface a lost session silently lands on. */
const CONTESTANT_LOGIN_URL = /\/contestant\/login(\/|$|\?|#)/;

/**
 * Declare the two scans of one entry: the light scan and its dark twin.
 *
 * The one shape every entry's scans take, whichever stored session they run under, so a table cannot emit a scan that skips the reach proof or the dark-theme guard. Call it at the top level of a spec or inside a `describe` that sets the session: the two tests are declared where the call stands, titled `axe accessibility scan — <name>` and the same with ` (dark)`. Each opens the entry's route without an entity segment, in English, and then runs the scan.
 *
 * Every dark twin runs `assertDarkThemeApplied` before scanning, and in a browser context created dark, so the whole signed-in walk, layout chrome included, is dark from the first paint and the guard pins that rather than assuming it.
 *
 * @param entry - The entry to scan, with a `name` no other entry of the same project carries.
 */
export function declareScans(entry: ContestantAxeRoute): void {
  declareLightAndDarkScans({
    name: entry.name,
    routeId: entry.routeId,
    contentTestId: entry.contentTestId,
    open: async (page) => {
      await page.goto(buildEntityLessRoute({ route: entry.routeId, locale: 'en' }));
    },
    reach: async (page) => {
      await entry.reach?.(page);
    },
    proveReach: (page, label) => assertContestantReach(page, entry, label)
  });
}

/**
 * Assert — and attach — the proof that THIS scan is about to read an authenticated contestant document.
 *
 * Two independent readings, because either alone is weak:
 *   - the SETTLED URL is inside `/contestant` and is not `/contestant/login`. This catches `(protected)/+layout.server.ts`'s `redirect(307, ContestantAppLogin)`, the exact way a scan would end up reporting a confident zero about a login form.
 *   - a per-entry marker only the authenticated surface renders. A URL alone would still pass against an error or empty state served at the same path.
 *
 * Both are attached to the test's own output before they are asserted, so the evidence survives on the failing path too — that is the point of taking the proof from the scan's own run rather than from the fixture's exit code.
 *
 * @param page - The page the scan is about to read, already in the state the entry's `reach` leaves it in.
 * @param route - The entry, whose `postLoginTestId` is the marker asserted.
 * @param label - The scan's label, which names the attachment and the failure messages.
 */
export async function assertContestantReach(
  page: Page,
  route: Pick<ContestantAxeRoute, 'postLoginTestId'>,
  label: string
): Promise<void> {
  const marker = page.getByTestId(route.postLoginTestId);
  await marker.first().waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });

  const settledUrl = page.url();
  const markerCount = await marker.count();
  const markerText = ((await marker.first().textContent()) ?? '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const heading = page.getByRole('heading', { level: 1 }).first();
  const headingCount = await page.getByRole('heading', { level: 1 }).count();
  const headingText = headingCount > 0 ? ((await heading.textContent()) ?? '').replace(/\s+/g, ' ').trim() : null;
  const prefersColorSchemeDark = await page.evaluate(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  await test.info().attach(`reach-proof-${label}.json`, {
    body: JSON.stringify(
      {
        label,
        settledUrl,
        postLoginTestId: route.postLoginTestId,
        postLoginNodeCount: markerCount,
        postLoginNodeText: markerText,
        h1: headingText,
        prefersColorSchemeDark
      },
      null,
      2
    ),
    contentType: 'application/json'
  });

  expect(settledUrl, `"${label}" settled outside the contestant application: ${settledUrl}`).toMatch(
    CONTESTANT_APP_URL
  );
  expect(
    settledUrl,
    `"${label}" settled on the candidate LOGIN route — the stored session did not survive, so this scan ` +
      `would have reported a verdict about a login form: ${settledUrl}`
  ).not.toMatch(CONTESTANT_LOGIN_URL);
  expect(
    markerCount,
    `"${label}" rendered no "${route.postLoginTestId}" node, so nothing on the scanned document proves it ` +
      'is the authenticated surface rather than something else served at the same path'
  ).toBeGreaterThan(0);
}
