import { expect, test as teardown } from '@playwright/test';
import { StrapiAdminClient } from '../utils/strapiAdminClient';

const TEST_DATA_PREFIX = 'test-';

/**
 * Shared variant data teardown: cleans up all test data after variant tests complete.
 *
 * This is shared across all variant setup projects (multi-election, constituency,
 * startfromcg). It deletes all records with the test- externalId prefix in reverse
 * import order, identical to the default data.teardown.ts pattern.
 *
 * Also unregisters test candidates to remove their users-permissions users.
 */
teardown('delete variant test dataset', async () => {
  const client = new StrapiAdminClient();
  await client.login();

  // Unregister candidates that may have been registered during tests.
  await client.unregisterCandidate('test.unregistered@openvaa.org');
  await client.unregisterCandidate('test.unregistered2@openvaa.org');

  // Delete in reverse import order to respect FK dependencies.
  // Note: candidates are intentionally NOT deleted (same reason as data.teardown.ts).
  const deleteResult = await client.deleteData({
    nominations: TEST_DATA_PREFIX,
    alliances: TEST_DATA_PREFIX,
    parties: TEST_DATA_PREFIX,
    questions: TEST_DATA_PREFIX,
    questionCategories: TEST_DATA_PREFIX,
    constituencyGroups: TEST_DATA_PREFIX,
    constituencies: TEST_DATA_PREFIX,
    elections: TEST_DATA_PREFIX,
    questionTypes: TEST_DATA_PREFIX
  });
  expect(deleteResult.type, `Failed to delete variant test data: ${deleteResult.cause ?? 'unknown error'}`).toBe(
    'success'
  );

  await client.dispose();
});
