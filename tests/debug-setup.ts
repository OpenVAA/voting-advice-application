import defaultDataset from './tests/data/default-dataset.json' with { type: 'json' };
import overlay from './tests/data/overlays/multi-election-overlay.json' with { type: 'json' };
import voterDataset from './tests/data/voter-dataset.json' with { type: 'json' };
import { mergeDatasets } from './tests/utils/mergeDatasets';
import { StrapiAdminClient } from './tests/utils/strapiAdminClient';

const TEST_DATA_PREFIX = 'test-';

(async () => {
  const client = new StrapiAdminClient();
  await client.login();

  // Delete existing test data
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
  console.log('Delete result:', deleteResult.type);

  // Merge and import
  const merged = mergeDatasets(mergeDatasets(defaultDataset, voterDataset), overlay);
  const importResult = await client.importData(merged as Record<string, Array<unknown>>);
  console.log('Import result:', importResult.type);

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

  await client.dispose();
  console.log('Done!');
})();
