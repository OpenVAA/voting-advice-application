import { expect,test as setup } from '@playwright/test';
import candidateAddendum from '../data/candidate-addendum.json' assert { type: 'json' };
import defaultDataset from '../data/default-dataset.json' assert { type: 'json' };
import voterDataset from '../data/voter-dataset.json' assert { type: 'json' };
import { StrapiAdminClient } from '../utils/strapiAdminClient';

const TEST_DATA_PREFIX = 'test-';

/**
 * Data setup project: imports the default test dataset via Admin Tools API.
 *
 * Runs before all test projects. First deletes any existing test data
 * (by externalId prefix) to ensure a clean state, then imports the
 * full default dataset. Finally resets the candidate password to ensure
 * auth-setup can log in (a previous test run may have changed the password).
 */
setup('import test dataset', async () => {
  const client = new StrapiAdminClient();
  await client.login();

  // Clean up any existing test data first (reverse import order to avoid FK issues).
  // Note: candidates are intentionally NOT deleted here because the bootstrap
  // creates a users-permissions user linked to the test candidate. Deleting and
  // re-creating the candidate would break that link. The import step uses
  // createOrUpdate which updates existing candidates by externalId.
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

  // Import the default test dataset (shared foundations: election, constituency, question types, questions, parties)
  const importResult = await client.importData(defaultDataset as Record<string, Array<unknown>>);
  expect(importResult.type, `Failed to import test dataset: ${importResult.cause ?? 'unknown error'}`).toBe('success');

  // Import voter-specific test data (voter questions, candidates with deterministic answers, nominations)
  const voterImportResult = await client.importData(voterDataset as Record<string, Array<unknown>>);
  expect(voterImportResult.type, `Failed to import voter dataset: ${voterImportResult.cause ?? 'unknown error'}`).toBe(
    'success'
  );

  // Import candidate-app-specific addendum (unregistered candidates and their nominations)
  const addendumImportResult = await client.importData(candidateAddendum as Record<string, Array<unknown>>);
  expect(
    addendumImportResult.type,
    `Failed to import candidate addendum: ${addendumImportResult.cause ?? 'unknown error'}`
  ).toBe('success');

  // Disable category intros and category selection for the simple voter journey path.
  // This ensures Home -> Intro -> Questions -> Results with no category selection pages.
  // Also disable hideIfMissingAnswers for candidates because the combined default + voter
  // datasets create 16 opinion questions, and no single candidate answers all of them.
  await client.updateAppSettings({
    questions: {
      categoryIntros: { show: false },
      questionsIntro: { allowCategorySelection: false, show: false }
    },
    entities: {
      hideIfMissingAnswers: { candidate: false },
      showAllNominations: true
    }
  });

  // Unregister the "unregistered" candidates if a previous test run registered them.
  // This deletes the linked users-permissions user and clears the user reference,
  // allowing the registration tests to re-register them cleanly.
  await client.unregisterCandidate('test.unregistered@openvaa.org');
  await client.unregisterCandidate('test.unregistered2@openvaa.org');

  // Reset the candidate's password to ensure auth-setup can log in.
  // The password change or reset test may have left a different password.
  // If setPassword fails (e.g., no linked user), fall back to forceRegister
  // which creates the user and sets the password in one step.
  const candidatePassword = process.env.DEV_CANDIDATE_PASSWORD ?? 'Password1!';
  const findResult = await client.findData(
    'candidates',
    { externalId: { $eq: 'test-candidate-alpha' } }
  );
  if (findResult.type === 'success' && findResult.data?.length) {
    const documentId = (findResult.data[0] as { documentId: string }).documentId;
    const setResult = await client.setPassword({ documentId, password: candidatePassword });
    if (setResult.type !== 'success') {
      // Candidate has no linked user — create one via forceRegister
      const registerResult = await client.forceRegister({ documentId, password: candidatePassword });
      expect(
        registerResult.type,
        `Failed to restore candidate auth: setPassword failed (${setResult.cause}), forceRegister failed (${registerResult.cause})`
      ).toBe('success');
    }
  }

  await client.dispose();
});
