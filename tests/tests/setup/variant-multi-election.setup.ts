import { expect, test as setup } from '@playwright/test';
import defaultDataset from '../data/default-dataset.json' with { type: 'json' };
import voterDataset from '../data/voter-dataset.json' with { type: 'json' };
import overlay from '../data/overlays/multi-election-overlay.json' with { type: 'json' };
import { mergeDatasets } from '../utils/mergeDatasets';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

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

  // Merge base datasets with multi-election overlay
  const merged = mergeDatasets(mergeDatasets(defaultDataset, voterDataset), overlay);

  // Import the merged dataset
  await client.bulkImport(merged as Record<string, unknown[]>);
  await client.importAnswers(merged as Record<string, unknown[]>);
  await client.linkJoinTables(merged as Record<string, unknown[]>);

  // Configure app settings with popup suppression and standard defaults.
  // Does NOT set disallowSelection -- that is tested as a toggle in the spec.
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
    analytics: { trackEvents: false },
    results: {
      showFeedbackPopup: 0,
      showSurveyPopup: 0
    }
  });
});
