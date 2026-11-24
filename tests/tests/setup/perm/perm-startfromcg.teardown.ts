/**
 * perm-startfromcg data-teardown project.
 *
 * Removes what `data-setup-perm-startfromcg` left and what the spec wrote: every nomination the application wrote for the candidate the contestant tests edit, which carries no external id and which the delete by prefix therefore does not name; the auth user the setup registered, with its grant; every row under `e2e-perm-startfromcg-`, with an assertion that the delete accounted for all of them and left none; and the storage-state file.
 *
 * `runTeardown` deletes the seeded rows and not the auth user, so the user is unregistered here by its address; a user left behind would hold a real editor grant under a known password.
 */

import { expect, test as teardown } from '@playwright/test';
import { clearWrittenNominations } from '../../fixtures/contestant/perm-startfromcg';
import { EDITORS, START_FROM_CG_PREFIX } from '../../utils/permStartFromCgData';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';
import { removeEditorSessions } from '../shared/registerAndStoreSession';

// A plain string literal: the Playwright configuration reads it from this file's text to check that no two teardowns own overlapping prefixes.
const PREFIX = 'e2e-perm-startfromcg-';

teardown('delete perm-startfromcg dataset', async () => {
  expect(PREFIX, 'the prefix deleted here is the one the dataset is seeded under').toBe(START_FROM_CG_PREFIX);

  await clearWrittenNominations();

  const client = new SupabaseAdminClient();
  await removeEditorSessions(client, EDITORS);

  await runTeardownAsserted(PREFIX, client);
});
