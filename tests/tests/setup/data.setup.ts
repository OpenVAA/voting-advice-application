import { expect,test as setup } from '@playwright/test';
import defaultDataset from '../data/default-dataset.json' assert { type: 'json' };
import { StrapiAdminClient } from '../utils/strapiAdminClient';

const TEST_DATA_PREFIX = 'test-';

/**
 * Data setup project: imports the default test dataset via Admin Tools API.
 *
 * Runs before all test projects. First deletes any existing test data
 * (by externalId prefix) to ensure a clean state, then imports the
 * full default dataset.
 */
setup('import test dataset', async () => {
  const client = new StrapiAdminClient();
  await client.login();

  // Clean up any existing test data first (reverse import order to avoid FK issues)
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
  expect(deleteResult.type, `Failed to delete existing test data: ${deleteResult.cause ?? 'unknown error'}`).toBe(
    'success'
  );

  // Import the default test dataset
  const importResult = await client.importData(defaultDataset as Record<string, Array<unknown>>);
  expect(importResult.type, `Failed to import test dataset: ${importResult.cause ?? 'unknown error'}`).toBe('success');

  await client.dispose();
});
