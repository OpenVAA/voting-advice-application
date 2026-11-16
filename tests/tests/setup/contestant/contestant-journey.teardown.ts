/**
 * contestant-journey data-teardown project.
 *
 * Owns what the registration step of the contestant-journey spec creates: the invitation seeded for the unregistered candidate's address and the auth.users row that comes into being when its sign-in link is asked for. `removeRunScopedIdentity` removes every user under `UNREGISTERED_CANDIDATE_ADDRESS_PREFIX`, this run's and any an interrupted earlier run left, with the users' invitations, the claimed ones included, the grants the claims wrote and the users' terms-of-use acceptances, and the invitations addressed to this run's address. The `test-` row prefix is owned by `data-teardown-base`, which runs once at the end of the wider chain.
 *
 * Idempotent: with no user under the prefix it removes only the invitations addressed to this run's address. Safe across cold starts, warm starts and re-runs after a partial spec failure.
 */

import { test as teardown } from '@playwright/test';
import {
  UNREGISTERED_CANDIDATE_ADDRESS_PREFIX,
  UNREGISTERED_CANDIDATE_EMAIL
} from '../../utils/contestantJourneyConstants';
import { removeRunScopedIdentity } from '../../utils/runScopedIdentity';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

teardown('unregister contestant-journey auth user', async () => {
  await removeRunScopedIdentity(new SupabaseAdminClient(), {
    addressPrefix: UNREGISTERED_CANDIDATE_ADDRESS_PREFIX,
    address: UNREGISTERED_CANDIDATE_EMAIL
  });
});
