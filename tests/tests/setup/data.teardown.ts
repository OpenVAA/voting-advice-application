import { expect, test as teardown } from '@playwright/test';
import { StrapiAdminClient } from '../utils/strapiAdminClient';

const TEST_DATA_PREFIX = 'test-';

/**
 * Data teardown project: cleans up all test data after all test projects complete.
 *
 * Deletes all records with the test- externalId prefix in reverse import order
 * to respect foreign key constraints (nominations first, question types last).
 * Also unregisters test candidates to remove their users-permissions users.
 */
teardown('delete test dataset', async () => {
  const client = new StrapiAdminClient();
  await client.login();

  // Unregister candidates that were registered during tests.
  // This deletes their users-permissions users and clears the user reference,
  // preventing dangling users from accumulating across test runs.
  await client.unregisterCandidate('test.unregistered@openvaa.org');
  await client.unregisterCandidate('test.unregistered2@openvaa.org');

  // Delete in reverse import order to respect FK dependencies.
  // Note: candidates are intentionally NOT deleted because the bootstrap creates
  // a users-permissions user linked to the test candidate. Deleting the candidate
  // would leave the user with a dangling reference, breaking subsequent test runs.
  // The data-setup uses createOrUpdate which updates existing candidates by externalId.
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
  expect(deleteResult.type, `Failed to delete test data: ${deleteResult.cause ?? 'unknown error'}`).toBe('success');

  await client.dispose();
});
