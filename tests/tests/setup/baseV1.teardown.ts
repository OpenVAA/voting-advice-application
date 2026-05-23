/**
 * baseV1 data-teardown project — Phase 88 Plan 01 Task 5.
 *
 * Mirror of tests/tests/setup/data.teardown.ts shape, scoped to
 * PREFIX='test-' (the same prefix the existing e2e teardown uses —
 * runTeardown is idempotent so the prefix-collision risk documented in
 * the Plan 88-01 Risk #4 is mitigated by Playwright's project-graph
 * sequencing: this teardown is wired via the `teardown:` key on
 * `data-setup-baseV1`, so it runs ONLY after the mega-journey project
 * completes).
 *
 * No auth unregister step — the mega-journey is voter-only and does not
 * authenticate any candidate. The existing data.teardown.ts retains the
 * auth-unregister step because the e2e chain's data-setup runs
 * forceRegister; the baseV1 chain runs no auth setup, so cleanup is
 * data-only.
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

const PREFIX = 'test-';

teardown('delete baseV1 dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
