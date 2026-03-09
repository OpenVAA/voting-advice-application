import { expect, test as setup } from '@playwright/test';
import defaultDataset from '../data/default-dataset.json' assert { type: 'json' };
import voterDataset from '../data/voter-dataset.json' assert { type: 'json' };
import overlay from '../data/overlays/startfromcg-overlay.json' assert { type: 'json' };
import { mergeDatasets } from '../utils/mergeDatasets';
import { StrapiAdminClient } from '../utils/strapiAdminClient';

const TEST_DATA_PREFIX = 'test-';

/**
 * Variant data setup: startFromConstituencyGroup configuration.
 *
 * Loads the default + voter base datasets merged with the startfromcg overlay.
 * Similar to the constituency overlay but includes an orphan municipality
 * (no parent region) to test the edge case of startFromConstituencyGroup
 * reversed flow where a constituency doesn't imply a parent.
 *
 * NOTE: The `startFromConstituencyGroup` setting is NOT set here because it
 * requires the database ID of the constituency group (not externalId). The
 * spec file must query for the group first, then set the setting.
 */
setup('import startfromcg dataset', async () => {
  const client = new StrapiAdminClient();
  await client.login();

  // Delete existing test data in reverse import order to avoid FK issues.
  // Note: candidates are intentionally NOT deleted (same reason as data.setup.ts).
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
  expect(deleteResult.type, `Failed to delete existing test data: ${deleteResult.cause ?? 'unknown error'}`).toBe(
    'success'
  );

  // Merge base datasets with startfromcg overlay
  const merged = mergeDatasets(mergeDatasets(defaultDataset, voterDataset), overlay);

  // Import the merged dataset
  const importResult = await client.importData(merged as Record<string, Array<unknown>>);
  expect(importResult.type, `Failed to import startfromcg dataset: ${importResult.cause ?? 'unknown error'}`).toBe(
    'success'
  );

  // Configure app settings with popup suppression and standard defaults.
  // The startFromConstituencyGroup setting will be applied in the spec file
  // after querying for the constituency group's database ID.
  await client.updateAppSettings({
    questions: {
      categoryIntros: { show: false },
      questionsIntro: { allowCategorySelection: false, show: false },
      showResultsLink: true
    },
    entities: {
      hideIfMissingAnswers: { candidate: false },
      showAllNominations: true
    },
    notifications: { voterApp: { show: false } },
    analytics: { trackEvents: false }
  });

  await client.dispose();
});
