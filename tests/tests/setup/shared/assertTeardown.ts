/**
 * Shared delete-count assertion helper — the single owner of the teardown accounting assertion.
 *
 * ROLE: wraps `runTeardown(prefix, client)` and asserts the delete accounted for every ROW that was present under the prefix, and that none survived it — `runTeardown`'s OTHER return value, `storageRemoved` (portrait objects), is NOT asserted here at all (see WHAT IT DOES NOT CATCH below). Every `*.teardown.ts` project that performs a prefix delete routes through this function; `contestant-journey.teardown.ts` performs no delete — it only unregisters an auth user, so it has nothing to route through here.
 *
 * With the matcher owned here, a newly added `*.teardown.ts` project's OWN delete is covered by construction — the call sites carry no matcher of their own.
 *
 * A teardown of a dataset seeded from a dev-seed template calls `runTemplateTeardownAsserted(templateName)`, which reads the prefix from the template's own `externalIdPrefix`, so the setup and the teardown cannot disagree on it. Only the base dataset, whose template declares an empty prefix and whose ids carry a literal `test-e2e-base-`, passes a literal prefix to `runTeardownAsserted`.
 *
 * NOT covered: `setupFromTemplate.ts` performs three prefix-scoped deletes of its own that do NOT route through this function — the `extraTeardownPrefix` pre-clear loop, the template's own step-1b pre-clear, and the `cleanup` closure returned to callers. These are the deletes that run in the COMMON case (they are why `rowsBefore === 0` at almost every teardown site — see WHAT IT CATCHES ONLY WHEN `rowsBefore > 0` below), so the delete path most exercised by the suite carries no assertion at all. "Every `*.teardown.ts` project's own delete is covered by construction" does NOT extend to `setupFromTemplate.ts`'s internal deletes.
 *
 * Neither function owns the Playwright wrapper. A call site that reuses the admin client for other work, as `identity-provider.teardown.ts` does for the removals that follow its delete, builds it itself and passes it in.
 *
 * MATCHER — the before/after invariant: `rowsDeleted === before` and `after === 0`, without relaxation. There is no positivity floor on `rowsDeleted`, because Playwright's `teardown:` deferral and `setupFromTemplate.ts`'s `extraTeardownPrefix` pre-clear make `rowsBefore === 0` (and therefore `rowsDeleted === 0`) the LEGITIMATE outcome at almost every site — see WHAT IT CATCHES below for what that implies about this assertion's discriminating power at those sites.
 *
 * WHAT IT CATCHES UNCONDITIONALLY (holds regardless of `rowsBefore`): over-deletion — rows deleted under a prefix the probe counted as empty (`rowsDeleted > 0` while `rowsBefore === 0`), or rows left behind after a delete that claimed to have removed them (`rowsAfter > 0`).
 *
 * WHAT IT CATCHES ONLY WHEN `rowsBefore > 0` AT THE SITE IN QUESTION: a silently no-opping `bulk_delete`, a scoping bug that sends the RPC a different prefix from the one counted. `rowsBefore > 0` is the RARE outcome, not the common one (see MATCHER above for the mechanism) — so at most sites this assertion's discriminating power is limited to the unconditional over-deletion catch above; the no-op/scoping catches are exercised only at the sites that still own rows at teardown time. A green teardown at most sites is a `0/0/0` confirmation of the trivial branch, not an independent confirmation of the no-op/scoping catches.
 *
 * WHAT IT DOES NOT CATCH:
 *   - A typo in a call site's literal prefix, which propagates to the count and the delete alike and therefore presents as a legitimate `0/0/0` no-op.
 *   - A table removed from `ALLOWED_TEARDOWN_TABLES`. `countRowsByPrefix` (`tests/tests/utils/supabaseAdminClient.ts`) iterates that SAME constant, by design (its own docblock: "the SAME list `runTeardown`'s `bulkDelete` clears — so the probe cannot drift from the delete it measures"). Sharing the constant keeps the probe's scope equal to the delete's, but it means a table dropped from that list goes blind on BOTH sides at once: `rowsBefore` stops counting it, `bulk_delete` stops deleting it, `rowsDeleted` drops by the same amount, and `rowsAfter` never looks at it again — a clean `N/N/0` while every row in the dropped table survives.
 *   - Portrait STORAGE cleanup. `runTeardown` returns `{ rowsDeleted, storageRemoved }` (`runTeardown` in `packages/dev-seed/src/cli/teardown.ts`); this function only destructures `rowsDeleted`, so a silent regression in `listCandidatePortraitPaths` / `removePortraitStorageObjects` would leak storage objects across every run with no signal. The ROLE paragraph's "the delete accounted for every row that was present… and none survived it" describes rows only — it should not be read as covering storage too.
 *
 * The caller's `prefix` is forwarded verbatim — no default, no normalisation, no fallback — so `runTeardown`'s two-character mass-delete guard keeps its full reach over the delete, and the call is not wrapped in a try/catch that would swallow it. The SAME guard is checked at the top of `runTeardownAsserted` itself via dev-seed's exported `assertTeardownPrefix` (the SAME implementation `runTeardown` calls), so the before-count probe never runs an unbounded `LIKE '%'` scan for a prefix `runTeardown` would refuse anyway.
 */

import { assertTeardownPrefix, BUILT_IN_TEMPLATES, runTeardown } from '@openvaa/dev-seed';
import { expect } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

/**
 * The `external_id` prefix a dev-seed template seeds its rows under, read from the template's own `externalIdPrefix`.
 *
 * @param templateName - Key into `BUILT_IN_TEMPLATES`.
 * @throws When no template is registered under `templateName`, or its prefix is shorter than the two characters `runTeardown` requires.
 */
export function templateTeardownPrefix(templateName: string): string {
  const template = BUILT_IN_TEMPLATES[templateName];
  if (!template) {
    throw new Error(
      `No dev-seed template is registered as '${templateName}' — check BUILT_IN_TEMPLATES in templates/index.ts.`
    );
  }
  const prefix = template.externalIdPrefix ?? '';
  assertTeardownPrefix(prefix, `templateTeardownPrefix('${templateName}')`);
  return prefix;
}

/**
 * Delete every row of the dataset seeded from `templateName`, under the prefix the template declares, and assert the delete as `runTeardownAsserted` does.
 *
 * @param templateName - Key into `BUILT_IN_TEMPLATES`.
 * @param client - admin client to reuse; a new one by default.
 */
export async function runTemplateTeardownAsserted(
  templateName: string,
  client: SupabaseAdminClient = new SupabaseAdminClient()
): Promise<void> {
  await runTeardownAsserted(templateTeardownPrefix(templateName), client);
}

/**
 * Delete every row matching `prefix`, then assert the delete accounted for all of them and left none behind.
 *
 * Both assertion messages name the prefix and both counts, so a failure reads as a sentence about the dataset rather than as a bare numeric mismatch — the failure must be "by name".
 *
 * @param prefix - `external_id` prefix owned by the calling project, forwarded verbatim.
 * @param client - admin client constructed by the caller (reused for its other steps).
 */
export async function runTeardownAsserted(prefix: string, client: SupabaseAdminClient): Promise<void> {
  // runTeardown's own mass-delete guard, checked BEFORE the probe below so that a prefix the delete would refuse never reaches `countRowsByPrefix`'s unbounded `external_id LIKE '%'` scans.
  assertTeardownPrefix(prefix, 'runTeardownAsserted');

  const rowsBefore = await client.countRowsByPrefix(prefix);
  // `storageRemoved` (portrait objects) is intentionally NOT destructured — this function asserts row counts only. See the file docblock's WHAT IT DOES NOT CATCH entry.
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
