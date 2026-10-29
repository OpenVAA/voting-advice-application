/**
 * perm-no-nomination data-teardown project.
 *
 * Removes what `data-setup-perm-no-nomination` left and what the spec wrote: every nomination the application wrote for an entity of the dataset, which carries no external id and which the delete by prefix therefore does not name; the three auth users the setup registered, with their grants; every row under `e2e-perm-no-nomination-`, the nominations a state step wrote among them, with an assertion that the delete accounted for all of them and left none; and the three storage-state files.
 *
 * The application's rows are removed first, each one that stands under another before the one it stands under: a nomination cannot be deleted while another stands under it, so a row left under a seeded nomination would refuse the delete by prefix.
 *
 * `runTeardown` deletes the seeded rows and not the auth users, so each user is unregistered here by its address; a user left behind would hold a real editor grant under a known password.
 */

import { expect, test as teardown } from '@playwright/test';
import fs from 'fs';
import { clearWrittenNominations } from '../../fixtures/contestant/perm-no-nomination';
import {
  NO_NOMINATION_PREFIX,
  NOMINATED_CANDIDATE_EDITOR_EMAIL,
  NOMINATED_CANDIDATE_STORAGE_STATE,
  UNNOMINATED_CANDIDATE_EDITOR_EMAIL,
  UNNOMINATED_CANDIDATE_STORAGE_STATE,
  UNNOMINATED_ORGANIZATION_EDITOR_EMAIL,
  UNNOMINATED_ORGANIZATION_STORAGE_STATE
} from '../../utils/permNoNominationData';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

// A plain string literal: the Playwright configuration reads it from this file's text to check that no two teardowns own overlapping prefixes.
const PREFIX = 'e2e-perm-no-nomination-';

teardown('delete perm-no-nomination dataset', async () => {
  expect(PREFIX, 'the prefix deleted here is the one the dataset is seeded under').toBe(NO_NOMINATION_PREFIX);

  await clearWrittenNominations();

  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(UNNOMINATED_CANDIDATE_EDITOR_EMAIL);
  await client.unregisterCandidate(UNNOMINATED_ORGANIZATION_EDITOR_EMAIL);
  await client.unregisterCandidate(NOMINATED_CANDIDATE_EDITOR_EMAIL);

  await runTeardownAsserted(PREFIX, client);

  for (const storageStatePath of [
    UNNOMINATED_CANDIDATE_STORAGE_STATE,
    UNNOMINATED_ORGANIZATION_STORAGE_STATE,
    NOMINATED_CANDIDATE_STORAGE_STATE
  ]) {
    if (fs.existsSync(storageStatePath)) fs.unlinkSync(storageStatePath);
  }
});
