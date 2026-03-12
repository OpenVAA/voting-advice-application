import { expect,test as teardown } from '@playwright/test';
import { StrapiAdminClient } from '../utils/strapiAdminClient';

const TEST_DATA_PREFIX = 'test-';

/**
 * Data teardown project: cleans up all test data after all test projects complete.
 *
 * Deletes all records with the test- externalId prefix in reverse import order
 * to respect foreign key constraints (nominations first, question types last).
 */
teardown('delete test dataset', async () => {
  const client = new StrapiAdminClient();
  await client.login();

  // Delete in reverse import order to respect FK dependencies
  const deleteResult = await client.deleteData({
    nominations: TEST_DATA_PREFIX,
    alliances: TEST_DATA_PREFIX,
    candidates: TEST_DATA_PREFIX,
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
