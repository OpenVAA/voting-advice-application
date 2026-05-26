/**
 * perm-1e1cg1co data-teardown project — Phase 88 Plan 03.
 *
 * Scoped to PREFIX='test-perm-1e1cg1co-' — ONLY this chain's rows are
 * cleared. Per 88-03-SCOPE.md:104-110, each perm-* chain teardowns ITS OWN
 * prefix; no cross-chain interference (parallel-only contract).
 *
 * No auth unregister step — perm-* chains are voter-only and do not
 * authenticate any candidate.
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

const PREFIX = 'e2e-perm-1e1cg1co-';

teardown('delete perm-1e1cg1co dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
