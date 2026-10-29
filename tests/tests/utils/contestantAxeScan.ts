/**
 * @file The scan helpers of the Contestant App's axe scans: the entry type, the reach proof, the adapter to the shared core's entry, the dark-theme guard and the declaration of an entry's two scans.
 *
 * A plain module and not a spec, so that every spec that scans a surface of the Contestant App can import it: one Playwright test file cannot import another. It declares no test of its own; `declareScans` declares them in the file that calls it, under whatever session and project that file's describe supplies.
 *
 * The gate itself is not here. Every scan goes through the one `assertAxeScan` of `axeScan.ts`, and this module constructs no axe builder and names no rule or tag, so a spec that declares its scans through it cannot be scanned less strictly than another.
 */

import { expect, test } from '@playwright/test';
import { assertAxeScan, assertDarkThemeApplied } from './axeScan';
import { buildEntityLessRoute } from './contestantEntityUrl';
import { TIMEOUTS } from '../helpers';
import type { Page } from '@playwright/test';
import type { RawAxeRoute } from './axeScan';

/**
 * A Contestant App scan entry. Same shape as the voter table's `RawAxeRoute` — a `routeId` the runner navigates to, a REQUIRED data-driven `contentTestId`, an optional reach step — plus the post-login marker the reach proof asserts.
 *
 * `reach` rather than `settle`: the runner composes `settle` from `reach` + the reach proof + the dark guard (see `toScanEntry`), so neither proof can be forgotten on a new entry. Everything else is the voter table's contract, unchanged.
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
export async function assertContestantReach(page: Page, route: ContestantAxeRoute, label: string): Promise<void> {
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

/**
 * Adapt a contestant entry to the shared core's `RawAxeRoute`, composing the entry's own `reach`, the reach proof and — on a dark twin — the dark-theme guard into the single `settle` the core calls.
 *
 * The composition is where the reach proof and the theme claim become structural: the core runs `settle` first and the content anchor last, so both proofs are taken from the REACHED document and asserted BEFORE the scan — and no entry can opt out of either, because entries do not supply `settle` at all.
 *
 * Both proofs run AFTER `reach` rather than immediately after the `goto`. That ordering is load-bearing for every entry whose target is not the URL it opens — one that walks to another route, opens the menu or brings the page into a state first — and it is what lets the dark guard read the persistent layout chrome: that chrome is not in the document yet at `goto` time, and the guard reads it with `querySelector`, so an early call would compare against `null`.
 *
 * @param entry - The entry to adapt.
 * @param label - The scan's label: the entry's name, with a suffix on its dark twin.
 * @param dark - Whether the scan is the dark twin, which also runs the dark-theme guard.
 * @returns The entry in the shape `assertAxeScan` takes.
 */
export function toScanEntry(entry: ContestantAxeRoute, label: string, dark: boolean): RawAxeRoute {
  return {
    name: entry.name,
    fixture: 'raw',
    routeId: entry.routeId,
    contentTestId: entry.contentTestId,
    settle: async (page) => {
      await entry.reach?.(page);
      await assertContestantReach(page, entry, label);
      await assertDarkThemeIfDark(page, dark);
    }
  };
}

/**
 * Run the shared dark-theme guard on a dark twin, and nothing on a light one.
 *
 * The branch lives here, at module scope, so no `if` sits inside a `test()` body (playwright/no-conditional-in-test) and so the two scans of an entry stay a single shared shape rather than two divergent ones.
 *
 * @param page - The page the scan is about to read.
 * @param dark - Whether the scan is the dark twin.
 */
export async function assertDarkThemeIfDark(page: Page, dark: boolean): Promise<void> {
  if (!dark) return;
  await assertDarkThemeApplied(page);
}

// THEME COVERAGE — complete, and stricter than the voter half by one deliberate step. Every entry emits a light scan and a `-dark` twin, and EVERY dark twin runs `assertDarkThemeApplied` before scanning. On the voter side only the fixture-driven twins do, because its raw twins emulate dark before their own `goto` and have no walked-in-light document to strand. Here the twins take a born-dark browser CONTEXT via `use`, so the whole authenticated walk — layout chrome included — is dark from the first paint, and the guard pins that rather than assuming it. See `assertDarkThemeApplied` for the 30-stale-element measurement that makes the difference between the two mechanisms load-bearing.

/**
 * Declare the two scans of one entry: the light scan and its dark twin.
 *
 * The one shape every entry's scans take, whichever stored session they run under, so a table cannot emit a scan that skips the reach proof or the dark-theme guard. Call it at the top level of a spec or inside a `describe` that sets the session: the two tests are declared where the call stands, titled `axe accessibility scan — <name>` and the same with ` (dark)`. Each opens the entry's route without an entity segment, in English, and then runs the scan.
 *
 * @param entry - The entry to scan, with a `name` no other entry of the same project carries.
 */
export function declareScans(entry: ContestantAxeRoute): void {
  test(`axe accessibility scan — ${entry.name}`, async ({ page }, testInfo) => {
    await page.goto(buildEntityLessRoute({ route: entry.routeId, locale: 'en' }));
    await assertAxeScan(page, toScanEntry(entry, entry.name, false), testInfo, entry.name);
  });

  // Dark twin. The anonymous describe scopes `colorScheme: 'dark'` to this one test without adding a title segment — the same idiom the voter spec uses for its fixture-driven twins, and for the same reason: the browser CONTEXT is created dark, so the authenticated document is dark from its first paint rather than being flipped after the fact.
  test.describe(() => {
    test.use({ colorScheme: 'dark' });

    test(`axe accessibility scan — ${entry.name} (dark)`, async ({ page }, testInfo) => {
      const label = `${entry.name}-dark`;
      await page.goto(buildEntityLessRoute({ route: entry.routeId, locale: 'en' }));
      await assertAxeScan(page, toScanEntry(entry, label, true), testInfo, label);
    });
  });
}
