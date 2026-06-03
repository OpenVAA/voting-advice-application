/**
 * Network-idle settle helpers.
 *
 * Thin wrappers around `page.waitForLoadState(...)`. Use to bridge
 * cold-start hydration races between `page.goto(url)` and assertions.
 *
 * Inherits the Phase 83 DETERM-07b hydration-completeness guard pattern.
 *
 * helpers/ vs utils/ boundary (per 86.2-RESEARCH.md §"Open Questions (RESOLVED)" Q5):
 *   - `tests/tests/helpers/` = thin generic Playwright wrappers (no domain
 *     knowledge — operate on `Page` / `Locator` only).
 *   - `tests/tests/utils/` = domain-specific assemblers
 *     (`voterNavigation.ts`, `supabaseAdminClient.ts`, `testIds.ts`).
 *
 * Pitfall #1 (per 86.2-RESEARCH.md §"Common Pitfalls"):
 *   Helper does NOT swallow timeouts; caller adds `.catch(() => null)`
 *   post-call where the original semantic was defensive. This is the
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
 *   - `waitUntil: 'networkidle'` (matches dominant anchor at
 *     `candidate-profile-validation.spec.ts:97,203`).
 *   - `timeoutMs: 10_000` (matches anchor timeout literal).
 *
 * Pitfall #1 — DOES NOT swallow timeouts. Callers that want defensive
 * behaviour add `.catch(() => null)` at the call site so the suppression
 * is visible at the read site and not buried inside the helper.
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

/**
 * Navigate and then settle to a load state in a single paired call.
 *
 * Equivalent to `await page.goto(url); await settleNetworkIdle(page, opts);`.
 * Same Pitfall #1 contract as `settleNetworkIdle` — does NOT internally
 * swallow timeouts.
 *
 * @param page - Playwright Page.
 * @param url - target URL (relative or absolute).
 * @param opts - forwarded to `settleNetworkIdle` (same defaults).
 */
export async function gotoAndSettle(
  page: Page,
  url: string,
  opts: { waitUntil?: WaitUntil; timeoutMs?: number } = {}
): Promise<void> {
  await page.goto(url);
  await settleNetworkIdle(page, opts);
}
