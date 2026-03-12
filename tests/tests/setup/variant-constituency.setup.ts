import { expect, test as setup } from '@playwright/test';
import defaultDataset from '../data/default-dataset.json' assert { type: 'json' };
import voterDataset from '../data/voter-dataset.json' assert { type: 'json' };
import overlay from '../data/overlays/constituency-overlay.json' assert { type: 'json' };
import { mergeDatasets } from '../utils/mergeDatasets';
import { StrapiAdminClient } from '../utils/strapiAdminClient';

const TEST_DATA_PREFIX = 'test-';

/**
 * Variant data setup: constituency configuration.
 *
 * Loads the default + voter base datasets merged with the constituency overlay.
 * This creates multiple constituencies with hierarchical regions/municipalities,
 * 2 elections referencing different constituency groups, and constituency-scoped
 * questions. Triggers both election and constituency selection.
 */
setup('import constituency dataset', async () => {
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

  // Merge base datasets with constituency overlay
  const merged = mergeDatasets(mergeDatasets(defaultDataset, voterDataset), overlay);

  // Import the merged dataset
  const importResult = await client.importData(merged as Record<string, Array<unknown>>);
  expect(importResult.type, `Failed to import constituency dataset: ${importResult.cause ?? 'unknown error'}`).toBe(
    'success'
  );

  // Configure app settings with popup suppression and standard defaults
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
