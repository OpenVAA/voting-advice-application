/**
 * Shared delete-count assertion helper — the single owner of the F3 assertion
 * (Phase 140, ASSERT-02).
 *
 * ROLE: wraps `runTeardown(prefix, client)` and asserts on the returned
 * `rowsDeleted`. Every `*.teardown.ts` project routes through this function.
 *
 * RATIONALE: the assertion previously lived inline at 27 call sites, so
 * strengthening it meant 27 hand edits and the 27th file was covered only by
 * whoever remembered it. With the matcher owned here, a newly added project is
 * covered by construction — the call sites carry no matcher of their own.
 *
 * The helper deliberately does NOT construct the admin client and does NOT own
 * the Playwright wrapper: all three call-site shapes build the client themselves
 * and reuse it for other work, and `bank-auth-journey.teardown.ts` needs its
 * delete to stay in its ordinal position among numbered steps. This function
 * replaces exactly the `runTeardown(...)` call plus its `expect(...)` line.
 *
 * MATCHER: deliberately unchanged from the pre-change inline form. Per decision
 * D-02 the matcher is not chosen until the measurement across all 27 sites has
 * been taken (`140-MEASUREMENT.md`) and adjudicated in plan 06 — two independent
 * mechanisms make `rowsDeleted === 0` a legitimate outcome at most sites, so a
 * positivity floor committed before the measurement would redden ~26 projects at
 * once. Carrying the pre-change matcher is what makes the 27-site codemod
 * behaviour-preserving by construction. `SupabaseAdminClient.countRowsByPrefix`
 * exists as the probe that measurement uses; the assertion does not consume it
 * yet. Neither is an oversight.
 *
 * The caller's `prefix` is forwarded verbatim — no default, no normalisation, no
 * fallback — so `runTeardown`'s two-character mass-delete guard keeps its full
 * reach, and the call is not wrapped in a try/catch that would swallow it.
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect } from '@playwright/test';
import type { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

/**
 * Delete every row matching `prefix`, then assert on the reported count.
 *
 * @param prefix - `external_id` prefix owned by the calling project, forwarded verbatim.
 * @param client - admin client constructed by the caller (reused for its other steps).
 */
export async function runTeardownAsserted(prefix: string, client: SupabaseAdminClient): Promise<void> {
  const { rowsDeleted } = await runTeardown(prefix, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
}
