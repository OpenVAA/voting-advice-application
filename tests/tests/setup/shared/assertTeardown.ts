/**
 * Shared delete-count assertion helper — the single owner of the F3 assertion
 * (Phase 140, ASSERT-02).
 *
 * ROLE: wraps `runTeardown(prefix, client)` and asserts the delete accounted for
 * every row that was present under the prefix, and that none survived it. Every
 * `*.teardown.ts` project that performs a prefix delete routes through this
 * function (27 of 28; `candidate-journey.teardown.ts` performs no delete — it
 * only unregisters an auth user, so it has nothing to route through here).
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
 * MATCHER — the before/after invariant (research shape A), adopted under
 * **branch A** of plan 06's pre-specified decision rule. Evidence:
 * `140-MEASUREMENT.md` § 4 (one instrumented, preflight-confirmed full-suite run,
 * 26 observations) and § Adjudication. `rowsDeleted === before` held at 26/26
 * observations and `after === 0` held at 26/26, so the invariant is adopted
 * without relaxation. The rejected alternatives are costed there against the same
 * data: a uniform positivity floor on `rowsDeleted` (research shape C) would have
 * reddened 25 of the 26 executed sites, because two confirmed mechanisms —
 * Playwright's `teardown:` deferral and the `extraTeardownPrefix: ['test-',
 * 'e2e-perm-']` pre-clear at `setupFromTemplate.ts:184-196` — make
 * `rowsDeleted === 0` the LEGITIMATE outcome at almost every site. That is why
 * `before === 0` must pass here and does.
 *
 * WHAT IT CATCHES: a delete that accounts for none (or only some) of the rows
 * that were present — a silently no-opping `bulk_delete`, a scoping bug that
 * sends the RPC a different prefix from the one counted.
 *
 * WHAT IT DOES NOT CATCH:
 *   - A typo in a call site's `PREFIX` constant, which propagates to the count
 *     and the delete alike and therefore presents as a legitimate `0/0/0`
 *     no-op.
 *   - A table removed from `ALLOWED_TEARDOWN_TABLES`. `countRowsByPrefix`
 *     (`tests/tests/utils/supabaseAdminClient.ts:263`) iterates that SAME
 *     constant, by design (its own docblock: "the SAME list `runTeardown`'s
 *     `bulkDelete` clears — so the probe cannot drift from the delete it
 *     measures" — a second hand-maintained copy under `tests/` was rejected
 *     as exactly the duplicated-fact drift this phase closed elsewhere, per
 *     `packages/dev-seed/src/cli/teardown.ts:65-67`). Sharing the constant is
 *     the right call for scope-drift, but it means a table dropped from that
 *     list goes blind on BOTH sides at once: `rowsBefore` stops counting it,
 *     `bulk_delete` stops deleting it, `rowsDeleted` drops by the same
 *     amount, and `rowsAfter` never looks at it again — a clean `N/N/0` while
 *     every row in the dropped table survives.
 * Stated so nobody reads more into this assertion than the measurement
 * supports (`140-MEASUREMENT.md` § Adjudication).
 *
 * The caller's `prefix` is forwarded verbatim — no default, no normalisation, no
 * fallback — so `runTeardown`'s two-character mass-delete guard keeps its full
 * reach, and the call is not wrapped in a try/catch that would swallow it.
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect } from '@playwright/test';
import type { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

/**
 * Delete every row matching `prefix`, then assert the delete accounted for all
 * of them and left none behind.
 *
 * Both assertion messages name the prefix and both counts, so a failure reads as
 * a sentence about the dataset rather than as a bare numeric mismatch
 * (ROADMAP Phase 140 criterion 1: the failure must be "by name").
 *
 * @param prefix - `external_id` prefix owned by the calling project, forwarded verbatim.
 * @param client - admin client constructed by the caller (reused for its other steps).
 */
export async function runTeardownAsserted(prefix: string, client: SupabaseAdminClient): Promise<void> {
  const rowsBefore = await client.countRowsByPrefix(prefix);
  const { rowsDeleted } = await runTeardown(prefix, client);
  const rowsAfter = await client.countRowsByPrefix(prefix);

  // Accounting half: the delete must account for every row that was there.
  // `before === 0` is a legitimate no-op and passes — it is the common case.
  expect(
    rowsDeleted,
    `teardown of prefix '${prefix}' deleted ${rowsDeleted} row(s) but ${rowsBefore} row(s) were present under that prefix before the delete — the delete accounted for none or only some of them`
  ).toBe(rowsBefore);

  // Residue half: nothing under the prefix may survive the delete.
  expect(
    rowsAfter,
    `teardown of prefix '${prefix}' left ${rowsAfter} row(s) behind (${rowsBefore} present before the delete, ${rowsDeleted} reported deleted)`
  ).toBe(0);
}
