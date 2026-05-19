/**
 * Navigation assertion + click-and-settle helpers.
 *
 * Thin wrappers around `expect(page).toHaveURL(...)` and the
 * `click + race-against-URL-change` pattern.
 *
 * Source: distilled from
 *   - tests/tests/specs/candidate/candidate-profile-validation.spec.ts:101
 *     (Phase 86.1 post-fix — `expectLandedOn` anchor).
 *   - tests/tests/specs/voter/voter-matching.spec.ts:186-198
 *     (Phase 86.1 post-fix — `clickAndRaceSettle` anchor).
 *
 * Existing in-tree analog for `clickAndRaceSettle`:
 *   `tests/tests/utils/voterNavigation.ts:74-91 advanceClick` — NOT being
 *   refactored to call this helper (per 86.2-RESEARCH.md §"Helper #3
 *   propagation"). The two co-exist intentionally; `voterNavigation.ts` is
 *   the domain-specific voter-journey assembler, this helper is its
 *   generic counterpart for non-voter-journey call sites.
 *
 * Phase 86.1 RCA "stuck click" defense rationale:
 *   Without the click-timeout + post-click URL-change race, a raw
 *   `.click()` against a button that detaches mid-action (because the
 *   SvelteKit route transition began before the actionability check
 *   resolved) retries through the full 90s test timeout. The bound timeout
 *   + race short-circuits the click as soon as either the navigation lands
 *   or the actionability budget burns.
 */

import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

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
 * clearly. See 86.2-RESEARCH.md §"Helper #2 / Example 1".
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
 * INTERNALLY swallow click-timeout failures (matches all 3 anchor sites:
 * `voter-matching.spec.ts:194`, `voter.fixture.ts:131`, and
 * `voterNavigation.ts:advanceClick`). Then race `Promise.race(...)` against
 * one or more URL predicates with a `settleTimeoutMs` budget (default
 * 5_000ms). Each predicate is wrapped in `.catch(() => null)` so the race
 * resolves on first settle (not first throw).
 *
 * Pitfall #1 note — Internal `.catch(() => null)` matches all 3 anchor
 * patterns (voter-matching, voter.fixture, voterNavigation.advanceClick)
 * — distinct from helper #1 `settleNetworkIdle` which does NOT swallow.
 * The asymmetry is intentional: helper #1 is a hard wait helper, this is
 * a defensive click+race helper. Read 86.2-RESEARCH.md §"Common Pitfalls"
 * Pitfall #1 for the full rationale.
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
