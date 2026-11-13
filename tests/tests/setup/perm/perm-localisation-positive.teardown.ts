/**
 * perm-localisation-positive data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-l10n-pos-' (matches the template's own externalIdPrefix).
 *
 * Also owns what the spec's registration step creates (`client.inviteByEmail` in perm-localisation-positive.spec.ts): the invitation addressed to the recipient and the auth.users row that comes into being when its sign-in link is asked for. `runTeardown(PREFIX)` only deletes the SEEDED dataset rows; it does NOT touch the invited auth user, whose address is not prefixed with `e2e-perm-l10n-pos-`. Without this cleanup the user outlives the run with the grant its claim wrote and its terms-of-use acceptance. `removeRunScopedIdentity` removes every user under `L10N_POSITIVE_CANDIDATE_ADDRESS_PREFIX`, this run's and any an interrupted earlier run left, with the users' invitations, the claimed ones included, and grants, and the invitations addressed to this run's address. It is idempotent.
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-l10n-pos-';
// Kept in sync with RECIPIENT_EMAIL in perm-localisation-positive.spec.ts.
// Re-declared rather than imported: importing the spec module would register its `test.describe` block inside this teardown project.
const RECIPIENT_EMAIL = 'candidate-l10n-pos-aa@test.openvaa.local';

teardown('delete perm-localisation-positive dataset', async () => {
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(RECIPIENT_EMAIL);
  await runTeardownAsserted(PREFIX, client);
});
