/**
 * perm-unnominated-entities data-teardown project.
 *
 * Removes what `data-setup-perm-unnominated-entities` left and what the spec wrote: every nomination the application wrote for an entity of the dataset, which carries no external id and which the delete by prefix therefore does not name; the three auth users the setup registered, with their grants; every row under `e2e-perm-unnominated-entities-`, the nominations a state step wrote among them, with an assertion that the delete accounted for all of them and left none; and the three storage-state files.
 *
 * The application's rows are removed first, each one that stands under another before the one it stands under: a nomination cannot be deleted while another stands under it, so a row left under a seeded nomination would refuse the delete by prefix.
 *
 * `runTeardown` deletes the seeded rows and not the auth users, so each user is unregistered here by its address; a user left behind would hold a real editor grant under a known password.
 */

import { expect, test as teardown } from '@playwright/test';
import { clearWrittenNominations } from '../../fixtures/contestant/perm-unnominated-entities';
import { EDITORS, UNNOMINATED_ENTITIES_PREFIX } from '../../utils/permUnnominatedEntitiesData';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTemplateTeardownAsserted, templateTeardownPrefix } from '../shared/assertTeardown';
import { removeEditorSessions } from '../shared/registerAndStoreSession';

const PREFIX = templateTeardownPrefix('perm-unnominated-entities');

teardown('delete perm-unnominated-entities dataset', async () => {
  expect(PREFIX, 'the prefix deleted here is the one the dataset is seeded under').toBe(UNNOMINATED_ENTITIES_PREFIX);

  await clearWrittenNominations();

  const client = new SupabaseAdminClient();
  await removeEditorSessions(client, EDITORS);

  await runTemplateTeardownAsserted('perm-unnominated-entities', client);
});
