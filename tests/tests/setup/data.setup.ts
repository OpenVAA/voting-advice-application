import { expect, test as setup } from '@playwright/test';
import candidateAddendum from '../data/candidate-addendum.json' with { type: 'json' };
import defaultDataset from '../data/default-dataset.json' with { type: 'json' };
import voterDataset from '../data/voter-dataset.json' with { type: 'json' };
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';
import { TEST_CANDIDATE_PASSWORD } from '../utils/testCredentials';

const TEST_DATA_PREFIX = 'test-';

/**
 * Data setup project: imports the default test dataset via Supabase Admin Client.
 *
 * Runs before all test projects. First deletes any existing test data
 * (by external_id prefix) to ensure a clean state, then imports the
 * full default dataset with answers and join table links. Finally resets
 * the candidate password to ensure auth-setup can log in.
 */
setup('import test dataset', async () => {
  const client = new SupabaseAdminClient();

  // Clean up any existing test data first (reverse import order to avoid FK issues).
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

  // Import the default test dataset (shared foundations: election, constituency, questions, organizations)
  await client.bulkImport(defaultDataset as Record<string, unknown[]>);
  await client.importAnswers(defaultDataset as Record<string, unknown[]>);
  await client.linkJoinTables(defaultDataset as Record<string, unknown[]>);

  // Import voter-specific test data (voter questions, candidates with deterministic answers, nominations)
  await client.bulkImport(voterDataset as Record<string, unknown[]>);
  await client.importAnswers(voterDataset as Record<string, unknown[]>);
  await client.linkJoinTables(voterDataset as Record<string, unknown[]>);

  // Import candidate-app-specific addendum (unregistered candidates and their nominations)
  await client.bulkImport(candidateAddendum as Record<string, unknown[]>);
  await client.linkJoinTables(candidateAddendum as Record<string, unknown[]>);
  // No importAnswers for addendum (unregistered candidates have no answers)

  // Disable category intros and category selection for the simple voter journey path.
  // This ensures Home -> Intro -> Questions -> Results with no category selection pages.
  // Also disable hideIfMissingAnswers for candidates because the combined default + voter
  // datasets create 16 opinion questions, and no single candidate answers all of them.
  // Suppress notification and data consent popups to prevent dialog overlays from
  // intercepting test clicks on navigation buttons across all voter specs.
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

  // Unregister the "unregistered" candidates if a previous test run registered them.
  // This removes the auth user, role assignment, and candidate link,
  // allowing the registration tests to re-register them cleanly.
  await client.unregisterCandidate('test.unregistered@openvaa.org');
  await client.unregisterCandidate('test.unregistered2@openvaa.org');

  // Reset the candidate's password to ensure auth-setup can log in.
  // The password change or reset test may have left a different password.
  // If setPassword fails (e.g., no linked user), fall back to forceRegister
  // which creates the user and sets the password in one step.
  try {
    await client.setPassword('mock.candidate.2@openvaa.org', TEST_CANDIDATE_PASSWORD);
  } catch {
    await client.forceRegister('test-candidate-alpha', 'mock.candidate.2@openvaa.org', TEST_CANDIDATE_PASSWORD);
  }
});
