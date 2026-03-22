import { expect, test as setup } from '@playwright/test';
import defaultDataset from '../data/default-dataset.json' with { type: 'json' };
import voterDataset from '../data/voter-dataset.json' with { type: 'json' };
import overlay from '../data/overlays/startfromcg-overlay.json' with { type: 'json' };
import { mergeDatasets } from '../utils/mergeDatasets';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

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
  const client = new SupabaseAdminClient();

  // Delete existing test data in reverse import order to avoid FK issues.
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
  expect(deleteResult, 'Failed to delete existing test data').toBeTruthy();

  // Merge base datasets with startfromcg overlay
  const merged = mergeDatasets(mergeDatasets(defaultDataset, voterDataset), overlay);

  // Import the merged dataset
  await client.bulkImport(merged as Record<string, unknown[]>);
  await client.importAnswers(merged as Record<string, unknown[]>);
  await client.linkJoinTables(merged as Record<string, unknown[]>);

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
});
