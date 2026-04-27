import { expect, test as teardown } from '@playwright/test';
import { runTeardown } from '@openvaa/dev-seed';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';
import { TEST_UNREGISTERED_EMAILS } from '../utils/e2eFixtureRefs';

const PREFIX = 'test-';

/**
 * Data-teardown project: cleans up all e2e-seeded rows after specs run.
 *
 * Delegates data removal to @openvaa/dev-seed's runTeardown (dev-seed owns
 * rows + portrait storage per D-24). Auth unregister stays in tests/ per
 * the D-24 split boundary. PREFIX 'test-' matches what the e2e template
 * emits (externalIdPrefix '' + fixed[] external_ids already prefixed with
 * 'test-') and is >= 2 chars so runTeardown's safety guard permits it.
 */
teardown('delete test dataset', async () => {
  const client = new SupabaseAdminClient();

  // Auth unregister (D-24 tests/-only).
  for (const email of TEST_UNREGISTERED_EMAILS) {
    await client.unregisterCandidate(email);
  }

  // Data + storage teardown via package API (D-59-06).
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
