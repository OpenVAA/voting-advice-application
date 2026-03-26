#!/usr/bin/env npx tsx
/**
 * Standalone script to seed the Supabase database with E2E test data.
 * Use this for manual testing and development — data persists until
 * you run this script again (it cleans before importing).
 *
 * Usage:
 *   cd tests && npx tsx seed-test-data.ts
 *
 * Prerequisites:
 *   - Supabase running: cd apps/supabase && npx supabase start
 *   - Database reset (optional): cd apps/supabase && npx supabase db reset
 */

import candidateAddendum from './tests/data/candidate-addendum.json' with { type: 'json' };
import defaultDataset from './tests/data/default-dataset.json' with { type: 'json' };
import voterDataset from './tests/data/voter-dataset.json' with { type: 'json' };
import { SupabaseAdminClient } from './tests/utils/supabaseAdminClient';

const TEST_DATA_PREFIX = 'test-';
const TEST_CANDIDATE_EMAIL = 'mock.candidate.2@openvaa.org';
const TEST_CANDIDATE_PASSWORD = 'TestPassword123!';

async function seed() {
  const client = new SupabaseAdminClient();

  console.log('Cleaning existing test data...');
  await client.bulkDelete({
    nominations: { prefix: TEST_DATA_PREFIX },
    candidates: { prefix: TEST_DATA_PREFIX },
    questions: { prefix: TEST_DATA_PREFIX },
    question_categories: { prefix: TEST_DATA_PREFIX },
    organizations: { prefix: TEST_DATA_PREFIX },
    constituency_groups: { prefix: TEST_DATA_PREFIX },
    constituencies: { prefix: TEST_DATA_PREFIX },
    elections: { prefix: TEST_DATA_PREFIX }
  });

  console.log('Importing default dataset...');
  await client.bulkImport(defaultDataset as Record<string, unknown[]>);
  await client.importAnswers(defaultDataset as Record<string, unknown[]>);
  await client.linkJoinTables(defaultDataset as Record<string, unknown[]>);

  console.log('Importing voter dataset...');
  await client.bulkImport(voterDataset as Record<string, unknown[]>);
  await client.importAnswers(voterDataset as Record<string, unknown[]>);
  await client.linkJoinTables(voterDataset as Record<string, unknown[]>);

  console.log('Importing candidate addendum...');
  await client.bulkImport(candidateAddendum as Record<string, unknown[]>);
  await client.linkJoinTables(candidateAddendum as Record<string, unknown[]>);

  console.log('Configuring app settings...');
  await client.updateAppSettings({
    questions: {
      categoryIntros: { show: false },
      questionsIntro: { allowCategorySelection: false, show: false },
      showResultsLink: true
    },
    results: {
      cardContents: {
        candidate: ['submatches'],
        organization: ['candidates']
      },
      sections: ['candidate', 'organization']
    },
    entities: {
      hideIfMissingAnswers: { candidate: false },
      showAllNominations: true
    },
    notifications: { voterApp: { show: false } },
    analytics: { trackEvents: false }
  });

  console.log('Setting up test candidate auth...');
  await client.unregisterCandidate('test.unregistered@openvaa.org');
  await client.unregisterCandidate('test.unregistered2@openvaa.org');
  await client.unregisterCandidate(TEST_CANDIDATE_EMAIL);
  await client.forceRegister('test-candidate-alpha', TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD);

  console.log('Done! Test data is ready for manual testing.');
  console.log(`  Candidate login: ${TEST_CANDIDATE_EMAIL} / ${TEST_CANDIDATE_PASSWORD}`);
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
