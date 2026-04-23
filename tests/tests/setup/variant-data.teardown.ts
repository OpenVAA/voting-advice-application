import { expect, test as teardown } from '@playwright/test';
import { runTeardown } from '@openvaa/dev-seed';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';
import { TEST_UNREGISTERED_EMAILS } from '../utils/e2eFixtureRefs';

const PREFIX = 'test-';

/**
 * Shared variant data teardown: same posture as data.teardown.ts.
 * Runs after the chain of variant-setup projects completes.
 */
teardown('delete variant test dataset', async () => {
  const client = new SupabaseAdminClient();

  // Auth unregister (D-24 tests/-only).
  for (const email of TEST_UNREGISTERED_EMAILS) {
    await client.unregisterCandidate(email);
  }

  // Data + storage teardown via package API (D-59-06).
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'variant runTeardown deleted zero rows').toBeGreaterThan(0);
});
