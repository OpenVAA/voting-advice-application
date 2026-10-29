/**
 * The data-teardown project of the identity-provider specs.
 *
 * Removes the dataset under the `e2e-bankauth-idp-` prefix, asserting the rows are gone; the candidates and organizations the application made for the users the specs made, which carry no external id and so no dataset prefix; and every auth user the specs made, with their grants and invitations: those whose placeholder address begins with the prefix of a minted identity, and those whose typed address begins with the prefix the specs type. It writes nothing to the settings row: the next setup to run replaces it whole.
 *
 * Idempotent: each removal is a no-op when nothing matches.
 */

import { test as teardown } from '@playwright/test';
import {
  IDENTITY_PROVIDER_ADDRESS_PREFIX,
  MINTED_SUB_PREFIX
} from '../../fixtures/shared/identityProviderFlow.fixture';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-bankauth-idp-';

teardown('remove the identity-provider dataset, and the entities and users the specs made', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
  // The entities go first: each is found through its user's editor grant, which goes with the user.
  await client.removeOwnEntitiesOfUsersByEmailPrefix(MINTED_SUB_PREFIX);
  await client.removeOwnEntitiesOfUsersByEmailPrefix(IDENTITY_PROVIDER_ADDRESS_PREFIX);
  await client.removeUsersByEmailPrefix(MINTED_SUB_PREFIX);
  await client.removeUsersByEmailPrefix(IDENTITY_PROVIDER_ADDRESS_PREFIX);
});
