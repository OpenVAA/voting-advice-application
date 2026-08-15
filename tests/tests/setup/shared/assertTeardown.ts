/**
 * Shared delete-count assertion helper — the single owner of the F3 assertion
 * (Phase 140, ASSERT-02).
 *
 * ROLE: wraps `runTeardown(prefix, client)` and asserts the delete accounted for
 * every ROW that was present under the prefix, and that none survived it —
 * `runTeardown`'s OTHER return value, `storageRemoved` (portrait objects), is
 * NOT asserted here at all (Phase 140 IN-03; see WHAT IT DOES NOT CATCH
 * below). Every
 * `*.teardown.ts` project that performs a prefix delete routes through this
 * function (27 of 28; `candidate-journey.teardown.ts` performs no delete — it
 * only unregisters an auth user, so it has nothing to route through here).
 *
 * RATIONALE: the assertion previously lived inline at 27 call sites, so
 * strengthening it meant 27 hand edits and the 27th file was covered only by
 * whoever remembered it. With the matcher owned here, a newly added
 * `*.teardown.ts` project's OWN delete is covered by construction — the call
 * sites carry no matcher of their own.
 *
 * NOT covered (Phase 140 WR-05): `setupFromTemplate.ts` performs three
 * prefix-scoped deletes of its own that do NOT route through this function —
 * the `extraTeardownPrefix` pre-clear loop (`:189`), the template's own
 * pre-clear (`:196`), and the `cleanup` closure returned to callers (`:279`).
 * These are the deletes that run in the COMMON case (they are why
 * `rowsBefore === 0` at almost every teardown site — see WR-03 above), so the
 * delete path most exercised by the suite carries no assertion at all. "Every
 * `*.teardown.ts` project's own delete is covered by construction" does NOT
 * extend to `setupFromTemplate.ts`'s internal deletes.
 *
 * The helper deliberately does NOT construct the admin client and does NOT own
 * the Playwright wrapper: all three call-site shapes build the client themselves
 * and reuse it for other work, and `bank-auth-journey.teardown.ts` needs its
 * delete to stay in its ordinal position among numbered steps. This function
 * replaces exactly the `runTeardown(...)` call plus its `expect(...)` line.
 *
 * MATCHER — the before/after invariant (research shape A), adopted under
 * **branch A** of plan 06's pre-specified decision rule. The full measurement
 * (observation counts, per-site breakdown, and the rejected-alternatives cost
 * analysis) lives in `140-MEASUREMENT.md` § 4 / § Adjudication — the single
 * source of truth; figures are deliberately NOT restated here (Phase 140
 * IN-02 — a duplicated number in a docblock is precisely the F10 failure mode
 * this phase closed elsewhere, and line-number citations into
 * `setupFromTemplate.ts` go stale on that file's first edit). Conclusion:
 * both `rowsDeleted === before` and `after === 0` held at every observed
 * site, so the invariant is adopted without relaxation; a uniform positivity
 * floor on `rowsDeleted` (research shape C) was rejected because
 * Playwright's `teardown:` deferral and `setupFromTemplate.ts`'s
 * `extraTeardownPrefix` pre-clear make `rowsBefore === 0` (and therefore
 * `rowsDeleted === 0`) the LEGITIMATE outcome at almost every site — see
 * WHAT IT CATCHES below for what that implies about this assertion's
 * discriminating power at those sites.
 *
 * WHAT IT CATCHES UNCONDITIONALLY (holds regardless of `rowsBefore`):
 * over-deletion — rows deleted under a prefix the probe counted as empty
 * (`rowsDeleted > 0` while `rowsBefore === 0`), or rows left behind after a
 * delete that claimed to have removed them (`rowsAfter > 0`).
 *
 * WHAT IT CATCHES ONLY WHEN `rowsBefore > 0` AT THE SITE IN QUESTION: a
 * silently no-opping `bulk_delete`, a scoping bug that sends the RPC a
 * different prefix from the one counted. Per `140-MEASUREMENT.md` § 4 /
 * § Adjudication, `rowsBefore > 0` was the RARE outcome, not the common one
 * (see MATCHER above for the mechanism) — so at most observed sites this
 * assertion's discriminating power is limited to the unconditional
 * over-deletion catch above; the no-op/scoping catches are exercised by
 * construction only at the sites that still own rows at teardown time. Read
 * any "held at every site" framing accordingly: that is a `0/0/0`
 * confirmation of the trivial branch at most sites, not an independent
 * confirmation of the no-op/scoping catches everywhere.
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
 *   - Portrait STORAGE cleanup (Phase 140 IN-03). `runTeardown` returns
 *     `{ rowsDeleted, storageRemoved }`
 *     (`packages/dev-seed/src/cli/teardown.ts:126-132`); this function only
 *     destructures `rowsDeleted`. `storageRemoved` is completely unasserted at
 *     all 27 call sites — a silent regression in `listCandidatePortraitPaths`
 *     / `removePortraitStorageObjects` would leak storage objects across
 *     every run with no signal. Not a regression (matches prior behaviour),
 *     but this ROLE paragraph's "the delete accounted for every row that was
 *     present… and none survived it" describes rows only — it should not be
 *     read as covering storage too.
 * Stated so nobody reads more into this assertion than the measurement
 * supports (`140-MEASUREMENT.md` § Adjudication).
 *
 * The caller's `prefix` is forwarded verbatim — no default, no normalisation, no
 * fallback — so `runTeardown`'s two-character mass-delete guard keeps its full
 * reach over the delete, and the call is not wrapped in a try/catch that would
 * swallow it. Phase 140 WR-07: the SAME guard is re-checked at the top of
 * `runTeardownAsserted` itself (mirrored, not merely relied upon), so the
 * before-count probe below never runs an unbounded `LIKE '%'` scan for a
 * prefix `runTeardown` would refuse anyway.
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
  // Phase 140 WR-07: mirror runTeardown's T-58-07-02 mass-delete guard here,
  // BEFORE the probe below. Forwarding `prefix` verbatim (this file's
  // docblock, "no default, no normalisation, no fallback") means
  // `runTeardown`'s own guard still fires for a bad prefix — but only AFTER
  // this function's `countRowsByPrefix` has already run ten unbounded
  // `external_id LIKE '%'` exact-count scans across every content table.
  // Read-only, so no data risk, but it inverts the guard's stated intent
  // (refuse before touching the DB) and is the slowest possible way to reach
  // an error that is decidable from the argument alone. Re-checking the
  // identical invariant here means the probe never runs for an argument the
  // delete will refuse anyway.
  if (!prefix || prefix.length < 2) {
    throw new Error(`runTeardownAsserted: prefix must be at least 2 characters (got '${prefix}').`);
  }

  const rowsBefore = await client.countRowsByPrefix(prefix);
  // `storageRemoved` (portrait objects) is intentionally NOT destructured —
  // this function asserts row counts only. See the file docblock's WHAT IT
  // DOES NOT CATCH entry (Phase 140 IN-03) for why that gap is unclosed.
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
