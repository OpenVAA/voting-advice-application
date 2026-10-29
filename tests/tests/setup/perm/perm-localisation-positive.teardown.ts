/**
 * perm-localisation-positive data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-l10n-pos-' (matches the template's own externalIdPrefix).
 *
 * Also owns what the spec's registration step creates (`client.inviteByEmail` in perm-localisation-positive.spec.ts): the invitation addressed to the recipient and the auth.users row that comes into being when its sign-in link is asked for. `runTeardown(PREFIX)` only deletes the SEEDED dataset rows; it does NOT touch the invited auth user, whose email (`L10N_POSITIVE_CANDIDATE_EMAIL`, this run's address) is NOT prefixed with `e2e-perm-l10n-pos-`. Without this cleanup the user outlives the run with the grant its claim wrote, and the next run's registration is a returning user's sign-in that never reaches the set-password page, breaking the whole downstream perm chain (this spec is its anchor). `unregisterCandidate` removes the user's invitations, the claimed one included, the user's grants and the user. Mirrors the contestant-journey.teardown.ts pattern; it is idempotent (with no matching auth.users row it removes only the invitations addressed to the email).
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { L10N_POSITIVE_CANDIDATE_EMAIL } from '../../utils/testCredentials';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-l10n-pos-';

teardown('delete perm-localisation-positive dataset', async () => {
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(L10N_POSITIVE_CANDIDATE_EMAIL);
  await runTeardownAsserted(PREFIX, client);
});
