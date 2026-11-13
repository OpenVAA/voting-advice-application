/**
 * The data-setup project of the identity-provider specs.
 *
 * Seeds the `identity-provider` template under its own `e2e-bankauth-idp-` prefix. Its settings replace the stored settings row whole, and the override then states the candidates' registration row in full: the identity provider, email and code, so the provider's start is offered. A list in the override replaces the stored list, and every other setting stays as the template wrote it. The project runs at the tail of the perm chain (`playwright.config.ts`), so no other project writes the settings row at the same time.
 *
 * Before seeding it removes what an earlier run left behind: the candidates and organizations the application made for those users, and every auth user whose placeholder address begins with the prefix of a minted identity or whose typed address begins with the prefix the specs type. The paired `identity-provider.teardown.ts` removes the dataset, the same entities and the same users again.
 */

import { test as setup } from '@playwright/test';
import {
  IDENTITY_PROVIDER_ADDRESS_PREFIX,
  MINTED_SUB_PREFIX
} from '../../fixtures/shared/identityProviderFlow.fixture';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('seed the identity-provider dataset and remove the users an earlier run left', async () => {
  await setupFromTemplate('identity-provider', {
    appSettingsOverride: { contestantApp: { registrationModes: { candidate: ['identity_provider', 'email', 'code'] } } }
  });
  const client = new SupabaseAdminClient();
  await client.removeOwnEntitiesOfUsersByEmailPrefix(MINTED_SUB_PREFIX);
  await client.removeOwnEntitiesOfUsersByEmailPrefix(IDENTITY_PROVIDER_ADDRESS_PREFIX);
  await client.removeUsersByEmailPrefix(MINTED_SUB_PREFIX);
  await client.removeUsersByEmailPrefix(IDENTITY_PROVIDER_ADDRESS_PREFIX);
});
