import { expect, test as setup } from '@playwright/test';
import defaultDataset from '../data/default-dataset.json' with { type: 'json' };
import overlay from '../data/overlays/multi-election-overlay.json' with { type: 'json' };
import voterDataset from '../data/voter-dataset.json' with { type: 'json' };
import { mergeDatasets } from '../utils/mergeDatasets';
import { StrapiAdminClient } from '../utils/strapiAdminClient';

const TEST_DATA_PREFIX = 'test-';

/**
 * Variant data setup: multi-election configuration.
 *
 * Loads the default + voter base datasets merged with the multi-election overlay.
 * This creates 2 elections, each with a single constituency, triggering election
 * selection (but not constituency selection). Election-2 has its own scoped
 * questions and candidates, plus cross-nominations for existing candidates.
 */
setup('import multi-election dataset', async () => {
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

  // Merge base datasets with multi-election overlay
  const merged = mergeDatasets(mergeDatasets(defaultDataset, voterDataset), overlay);

  // Import the merged dataset
  const importResult = await client.importData(merged as Record<string, Array<unknown>>);
  expect(importResult.type, `Failed to import multi-election dataset: ${importResult.cause ?? 'unknown error'}`).toBe(
    'success'
  );

  // Configure app settings with popup suppression and standard defaults.
  // Does NOT set disallowSelection — that is tested as a toggle in the spec.
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
