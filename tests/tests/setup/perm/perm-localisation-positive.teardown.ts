/**
 * perm-localisation-positive data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-localisation-positive` template declares.
 *
 * Also owns what the spec's registration step creates (`client.inviteByEmail` in perm-localisation-positive.spec.ts): the invitation addressed to the recipient and the auth.users row that comes into being when its sign-in link is asked for. `runTeardown(PREFIX)` only deletes the SEEDED dataset rows; it does NOT touch the invited auth user, whose address is not prefixed with `e2e-perm-l10n-pos-`. Without this cleanup the user outlives the run with the grant its claim wrote and its terms-of-use acceptance. `removeRunScopedIdentity` removes every user under `L10N_POSITIVE_CANDIDATE_ADDRESS_PREFIX`, this run's and any an interrupted earlier run left, with the users' invitations, the claimed ones included, and grants, and the invitations addressed to this run's address. It is idempotent.
 */

import { test as teardown } from '@playwright/test';
import { removeRunScopedIdentity } from '../../utils/runScopedIdentity';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { L10N_POSITIVE_CANDIDATE_ADDRESS_PREFIX, L10N_POSITIVE_CANDIDATE_EMAIL } from '../../utils/testCredentials';
import { runTemplateTeardownAsserted } from '../shared/assertTeardown';

teardown('delete perm-localisation-positive dataset', async () => {
  const client = new SupabaseAdminClient();
  await removeRunScopedIdentity(client, {
    addressPrefix: L10N_POSITIVE_CANDIDATE_ADDRESS_PREFIX,
    address: L10N_POSITIVE_CANDIDATE_EMAIL
  });
  await runTemplateTeardownAsserted('perm-localisation-positive', client);
});
