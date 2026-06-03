/**
 * base data-teardown project — Phase 88 Plan 01 Task 5; renamed
 * base→base in Phase 93 Plan 04 (D-10).
 *
 * Scoped to PREFIX='test-e2e-base-' (Phase 93 D-05 canonical prefix).
 * runTeardown is idempotent so the prefix-collision risk documented in the
 * Plan 88-01 Risk #4 is mitigated by Playwright's project-graph sequencing:
 * this teardown is wired via the `teardown:` key on `data-setup-base`, so it
 * runs ONLY after the base/journey projects complete.
 *
 * No auth unregister step — the voter-journey is voter-only and does not
 * authenticate any candidate; the base chain runs no auth setup, so cleanup
 * is data-only.
 *
 * Teardown-ownership: this teardown is the SOLE owner of the base namespace.
 * Every perm setup owns its own distinct `e2e-perm-*` prefix; candidate-journey
 * consumes (does not re-seed) base data and owns only its auth.users row. No
 * other setup writes bare `test-` rows, so narrowing the wipe from `test-` to
 * `test-e2e-base-` orphans nothing.
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

const PREFIX = 'test-e2e-base-';

teardown('delete base dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
