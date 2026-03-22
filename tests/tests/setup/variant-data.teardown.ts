import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

const TEST_DATA_PREFIX = 'test-';

/**
 * Shared variant data teardown: cleans up all test data after variant tests complete.
 *
 * This is shared across all variant setup projects (multi-election, constituency,
 * startfromcg). It deletes all records with the test- external_id prefix in reverse
 * import order, identical to the default data.teardown.ts pattern.
 *
 * Also unregisters test candidates to remove their auth users and role assignments.
 */
teardown('delete variant test dataset', async () => {
  const client = new SupabaseAdminClient();

  // Unregister candidates that may have been registered during tests.
  await client.unregisterCandidate('test.unregistered@openvaa.org');
  await client.unregisterCandidate('test.unregistered2@openvaa.org');

  // Delete in reverse import order to respect FK dependencies.
  const deleteResult = await client.bulkDelete({
    nominations: { prefix: TEST_DATA_PREFIX },
    candidates: { prefix: TEST_DATA_PREFIX },
    questions: { prefix: TEST_DATA_PREFIX },
    question_categories: { prefix: TEST_DATA_PREFIX },
    organizations: { prefix: TEST_DATA_PREFIX },
    constituency_groups: { prefix: TEST_DATA_PREFIX },
    constituencies: { prefix: TEST_DATA_PREFIX },
    elections: { prefix: TEST_DATA_PREFIX }
  });
  expect(deleteResult, 'Failed to delete variant test data').toBeTruthy();
});
