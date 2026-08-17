/**
 * Network-idle settle helpers.
 *
 * Thin wrappers around `page.waitForLoadState(...)`. Use to bridge
 * cold-start hydration races between `page.goto(url)` and assertions.
 *
 * Implements the hydration-completeness guard pattern.
 *
 * helpers/ vs utils/ boundary:
 *   - `tests/tests/helpers/` = thin generic Playwright wrappers (no domain
 *     knowledge — operate on `Page` / `Locator` only).
 *   - `tests/tests/utils/` = domain-specific assemblers
 *     (`voterNavigation.ts`, `supabaseAdminClient.ts`, `testIds.ts`).
 *
 * No-swallow contract:
 *   Helper does NOT swallow timeouts; caller adds `.catch(() => null)`
 *   post-call where the desired semantic is defensive. This is the
 *   intentional contract — `settleNetworkIdle` is NOT a defensive helper;
 *   it propagates the underlying Playwright timeout so caller-side
 *   suppression is explicit, not hidden.
 */

import type { Page } from '@playwright/test';

type WaitUntil = 'load' | 'domcontentloaded' | 'networkidle';

/**
 * Wait for the page to reach a given load state.
 *
 * Wraps `page.waitForLoadState(...)` with the project's canonical defaults:
 *   - `waitUntil: 'networkidle'`.
 *   - `timeoutMs: 10_000`.
 *
 * DOES NOT swallow timeouts. Callers that want defensive behaviour add
 * `.catch(() => null)` at the call site so the suppression is visible at the
 * read site and not buried inside the helper.
 *
 * Anti-pattern (do NOT do):
 *   ```ts
 *   // BAD — helper masks timeout, caller has no way to opt out.
 *   await settleNetworkIdle(page); // would silently swallow if helper swallowed
 *   ```
 *
 * Canonical use:
 *   ```ts
 *   // Hard wait (timeout propagates to test failure):
 *   await settleNetworkIdle(page);
 *
 *   // Defensive wait (caller-side .catch makes suppression explicit):
 *   await settleNetworkIdle(page).catch(() => null);
 *   ```
 *
 * @param page - Playwright Page.
 * @param opts.waitUntil - load state name; default `'networkidle'`.
 * @param opts.timeoutMs - max wait in ms; default `10_000`.
 */
export async function settleNetworkIdle(
  page: Page,
  opts: { waitUntil?: WaitUntil; timeoutMs?: number } = {}
): Promise<void> {
  await page.waitForLoadState(opts.waitUntil ?? 'networkidle', {
    timeout: opts.timeoutMs ?? 10_000
  });
}
