/**
 * Navigation assertion + click-and-settle helpers.
 *
 * Thin wrappers around `expect(page).toHaveURL(...)` and the
 * `click + race-against-URL-change` pattern.
 *
 * Existing in-tree analog for `clickAndRaceSettle`:
 *   `tests/tests/utils/voterNavigation.ts` `advanceClick` — NOT refactored to
 *   call this helper. The two co-exist intentionally; `voterNavigation.ts` is
 *   the domain-specific voter-journey assembler, this helper is its
 *   generic counterpart for non-voter-journey call sites.
 *
 * "Stuck click" defense rationale:
 *   Without the click-timeout + post-click URL-change race, a raw
 *   `.click()` against a button that detaches mid-action (because the
 *   SvelteKit route transition began before the actionability check
 *   resolved) retries through the full 90s test timeout. The bound timeout
 *   + race short-circuits the click as soon as either the navigation lands
 *   or the actionability budget burns.
 */

import { expect } from '@playwright/test';
import { TIMEOUTS } from './timeouts';
import type { Locator, Page } from '@playwright/test';

/**
 * Settle an in-app (client-side) navigation on the DESTINATION DOM, not on the URL.
 *
 * reason: (Phase 138, D-06 — INTEG-01) DEF-135-04 / EPERM-07. This closes the
 * settle link in the ordering defect named in `138-DIAGNOSIS.md` § Named root
 * cause. SvelteKit commits the destination URL to history FIRST
 * (`client.js:1759-1760`), then awaits the `onNavigate` callbacks
 * (`:1779-1785`), and only THEN swaps the DOM (`:1824`). A settle that waits on
 * the URL alone therefore releases at step one — inside a window in which the
 * destination DOM does not exist yet (measured at 100-125 ms isolated; observed
 * as `triggerCount: 0` in 260 of 262 forensic probes). Every assertion made
 * after such a settle races a swap that has not happened.
 *
 * Two stages, and BOTH matter:
 *
 *  1. The URL changed — and this wait is NOT swallowed. The predecessor helper
 *     ended in `.catch(() => null)`, which made "the URL changed but the DOM has
 *     not" and "the URL never changed at all" flow onward identically. A
 *     navigation that never happens now fails HERE, where it reads as a
 *     navigation problem, instead of surfacing lines later as a missing element.
 *
 *  2. The destination DOM committed — the page's navigation landmark now carries
 *     DIFFERENT text than the one we navigated away from. The landmark selector
 *     `[data-focus-on-nav] ?? h1` mirrors the app's own afterNavigate focus target
 *     (`+layout.svelte:178-180`) character for character, so the two cannot drift.
 *
 *     Why a TEXT comparison and not mere attachment: the stale state this defect
 *     produces is not always "no heading". At low CPU rates the heading NODE
 *     survives the hop and only its content is stale — the previous question is
 *     still rendered — so an attachment-only wait would pass instantly against
 *     Base-2 and settle nothing. `headingCount: 0` (no landmark at all) is the
 *     same defect observed at high CPU rates, and the text comparison covers both
 *     because a null landmark is never "different text" and keeps the wait open.
 *
 *     Why NOT the focus itself, which would be the stronger fact: measured during
 *     this phase, `document.activeElement === target` does not become true until
 *     the View Transition has finished, because the app's `onNavigate` resolves
 *     inside `startViewTransition` and `afterNavigate` runs after it. That makes a
 *     focus wait a measurement of the ANIMATION rather than of the swap, and at
 *     CPU rate 40 it exceeds the element budget outright. The text comparison
 *     settles on the swap, which is the link the diagnosis names.
 *
 * NOT a timeout increase (D-07 rejects that outright, and it would not even fix
 * anything): no budget is raised anywhere. The settle waits for a specific
 * navigation-complete FACT and fails loudly when that fact does not arrive,
 * rather than widening the interval in which a stale DOM goes unnoticed.
 *
 * @param page - Playwright Page.
 * @param urlBefore - `page.url()` captured BEFORE the navigating action ran.
 * @param landmarkTextBefore - landmark text captured BEFORE the action, via
 *   {@link readNavigationLandmarkText}.
 */
export async function settleAfterClientNavigation(
  page: Page,
  urlBefore: string,
  landmarkTextBefore: string | null
): Promise<void> {
  // Stage 1 — the URL must actually change. Deliberately NOT swallowed.
  await page.waitForURL((u) => u.toString() !== urlBefore, { timeout: TIMEOUTS.page });

  // Stage 2 — the destination DOM must have committed.
  await page.waitForFunction(
    (previous) => {
      const target = document.querySelector('[data-focus-on-nav]') ?? document.querySelector('h1');
      return target !== null && (target.textContent ?? '') !== previous;
    },
    landmarkTextBefore,
    {
      // `page` bucket, NOT `element`: this wait is part of a single route
      // transition — it is the second half of the navigation whose first half is
      // the URL change above — and `page` is that bucket by its own definition
      // (`timeouts.ts:12`). No budget value is edited anywhere; this chooses the
      // correct existing bucket for a navigation wait, which is a different thing
      // from raising one (D-07).
      timeout: TIMEOUTS.page,
      // Fixed-interval polling, NOT the `raf` default. rAF callbacks are tied to
      // the rendering loop, so rAF polling is starved at precisely the moment
      // this predicate needs to observe — while the browser is busy committing
      // the swap. Measured during this phase: with `raf` polling under the
      // adversary's 40x CPU throttle the predicate missed a swap that had
      // demonstrably happened — 4 of 5 runs timed out, on a path where the term
      // assertion at the production budget passes at every CPU rate tested
      // (`138-FORCED-REPRO.md` §B.5). That block is recorded as the discarded
      // block in `138-NEGATIVE-CONTROL.md` § 5.6; it was an artifact of the
      // observation method, not of the app.
      polling: 50
    }
  );
}

/**
 * Read the navigation landmark's text, for use as {@link settleAfterClientNavigation}'s
 * `landmarkTextBefore`. Returns `null` when no landmark is present.
 *
 * reason: (Phase 138, D-06 — INTEG-01) the selector mirrors the app's afterNavigate
 * focus target (`+layout.svelte:178-180`); keeping the two reads in one module is
 * what stops the "before" and "after" halves of the comparison from drifting apart.
 */
export async function readNavigationLandmarkText(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const target = document.querySelector('[data-focus-on-nav]') ?? document.querySelector('h1');
    return target?.textContent ?? null;
  });
}

/**
 * The callback an {@link expectClientNavigation} action MUST invoke immediately
 * before the click that navigates, to record the settle's baseline.
 */
export type CaptureNavigationBaseline = () => Promise<void>;

/**
 * Run a navigating `action` and then settle on the DESTINATION DOM.
 *
 * reason: (Phase 138 review WR-01) the baseline MUST be read from the page the
 * action navigates AWAY from, and only the action knows when the DOM is
 * definitively on that page — its own entry gate (`expect(heading).toHaveText(...)`)
 * is what establishes it. Reading the baseline at wrapper entry instead is
 * unsound: the caller's gate targets the SAME element the baseline read targets,
 * so a DOM that is one page stale at wrapper entry yields the sequence
 *
 *   1. baseline := page A's landmark text (stale)
 *   2. the action's gate waits for page B's heading — the DOM catches up here
 *   3. the click on B navigates to C
 *   4. stage 2 of the settle asks "landmark text != A?" — the DOM shows B, so
 *      this is true IMMEDIATELY
 *
 * and the settle releases with the DOM on B while the test asserts against C.
 * That is exactly the pre-fix no-op the phase named, silently restored. Stale
 * baselines are reachable in this suite because several neighbourhoods
 * (`page.goBack()`, the `previousButton` hops) re-establish the DOM only through
 * a NON-aborting `expect.soft`, which hands the next wrapper a page-behind DOM.
 *
 * Handing the capture down as a callback makes the precondition structural: an
 * action that never captures cannot silently settle against a wrong baseline, it
 * throws here instead.
 *
 * @param page - Playwright Page.
 * @param action - performs the navigation. It must gate on the page being left,
 *   then call `capture()`, then click.
 */
export async function expectClientNavigation(
  page: Page,
  action: (capture: CaptureNavigationBaseline) => Promise<void>
): Promise<void> {
  let baseline: { url: string; landmarkText: string | null } | undefined;
  await action(async () => {
    baseline = { url: page.url(), landmarkText: await readNavigationLandmarkText(page) };
  });
  if (baseline === undefined) {
    throw new Error(
      'expectClientNavigation: the action never called its capture() callback, so there is no ' +
        'trustworthy baseline for the destination-DOM settle. Call capture() immediately before ' +
        'the click that navigates — after the action has gated on the page it is leaving.'
    );
  }
  await settleAfterClientNavigation(page, baseline.url, baseline.landmarkText);
}

/**
 * Positive landing assertion — assert the page URL eventually matches the
 * given pattern.
 *
 * Thin wrapper around `expect(page).toHaveURL(...)` with the project's
 * canonical default timeout (10_000ms).
 *
 * Positive-only semantic: this helper does NOT wrap `not.toHaveURL(...)`.
 * Negative-landing assertions (e.g. `expect(page).not.toHaveURL(/\/login\b/)`)
 * stay inline because they are rarer + the inline form already reads
 * clearly.
 *
 * @param page - Playwright Page.
 * @param pattern - URL pattern (RegExp or string substring).
 * @param opts.timeoutMs - max wait in ms; default `10_000`.
 */
export async function expectLandedOn(
  page: Page,
  pattern: RegExp | string,
  opts: { timeoutMs?: number } = {}
): Promise<void> {
  await expect(page).toHaveURL(pattern, { timeout: opts.timeoutMs ?? 10_000 });
}

/**
 * URL predicate accepted by `clickAndRaceSettle` destinationPredicate.
 *
 * Matches the union accepted by `page.waitForURL(...)` — a string,
 * RegExp, or `(url: URL) => boolean` filter.
 */
type UrlPredicate = string | RegExp | ((url: URL) => boolean);

/**
 * Click a locator and race the click against a destination URL settle.
 *
 * Pattern: bound the click with a short timeout (default 3_000ms) and
 * INTERNALLY swallow click-timeout failures (matches the
 * `voterNavigation.ts:advanceClick` pattern). Then race `Promise.race(...)`
 * against one or more URL predicates with a `settleTimeoutMs` budget (default
 * 5_000ms). Each predicate is wrapped in `.catch(() => null)` so the race
 * resolves on first settle (not first throw).
 *
 * Internal `.catch(() => null)` matches the `voterNavigation.advanceClick`
 * pattern — distinct from `settleNetworkIdle` which does NOT swallow. The
 * asymmetry is intentional: `settleNetworkIdle` is a hard wait helper, this is
 * a defensive click+race helper.
 *
 * @param locator - the element to click (extracts its Page via `locator.page()`).
 * @param destinationPredicate - one or more URL predicates to race against.
 * @param opts.clickTimeoutMs - per-click actionability budget; default `3_000`.
 * @param opts.settleTimeoutMs - per-predicate post-click wait budget; default `5_000`.
 */
export async function clickAndRaceSettle(
  locator: Locator,
  destinationPredicate: UrlPredicate | Array<UrlPredicate>,
  opts: { clickTimeoutMs?: number; settleTimeoutMs?: number } = {}
): Promise<void> {
  const page = locator.page();
  const clickTimeoutMs = opts.clickTimeoutMs ?? 3_000;
  const settleTimeoutMs = opts.settleTimeoutMs ?? 5_000;
  const predicates = Array.isArray(destinationPredicate) ? destinationPredicate : [destinationPredicate];
  await locator.click({ timeout: clickTimeoutMs }).catch(() => null);
  await Promise.race(
    predicates.map((p) =>
      page.waitForURL(p as Parameters<Page['waitForURL']>[0], { timeout: settleTimeoutMs }).catch(() => null)
    )
  );
}
