import defaultDataset from './tests/data/default-dataset.json' with { type: 'json' };
import overlay from './tests/data/overlays/multi-election-overlay.json' with { type: 'json' };
import voterDataset from './tests/data/voter-dataset.json' with { type: 'json' };
import { mergeDatasets } from './tests/utils/mergeDatasets';
import { SupabaseAdminClient } from './tests/utils/supabaseAdminClient';

const TEST_DATA_PREFIX = 'test-';

(async () => {
  const client = new SupabaseAdminClient();

  // Delete existing test data
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
  console.log('Delete result:', deleteResult);

  // Merge and import
  const merged = mergeDatasets(mergeDatasets(defaultDataset, voterDataset), overlay);
  await client.bulkImport(merged as Record<string, unknown[]>);
  await client.importAnswers(merged as Record<string, unknown[]>);
  await client.linkJoinTables(merged as Record<string, unknown[]>);
  console.log('Import complete');

  // Configure app settings
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
  console.log('Settings configured');

  console.log('Done!');
})();
