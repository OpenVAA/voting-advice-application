import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

const TEST_DATA_PREFIX = 'test-';

/**
 * Data teardown project: cleans up all test data after all test projects complete.
 *
 * Deletes all records with the test- external_id prefix in reverse import order
 * to respect foreign key constraints (nominations first, elections last).
 * Also unregisters test candidates to remove their auth users and role assignments.
 */
teardown('delete test dataset', async () => {
  const client = new SupabaseAdminClient();

  // Unregister candidates that may have been registered during tests.
  await client.unregisterCandidate('test.unregistered@openvaa.org');
  await client.unregisterCandidate('test.unregistered2@openvaa.org');

  // Delete in reverse import order to respect FK dependencies
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
  expect(deleteResult, 'Failed to delete test data').toBeTruthy();
});
