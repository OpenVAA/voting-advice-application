/**
 * contestant-journey data-setup project.
 *
 * The chain consumes the base dataset ALREADY seeded by `data-setup-base` and runs in parallel with `voter-journey`. The only state this setup guarantees is that no auth user holds an address under `UNREGISTERED_CANDIDATE_ADDRESS_PREFIX`, so the registration-via-email step in the contestant-journey spec lands deterministically. The address carries the run tag, so a user an interrupted earlier run left holds an address of its own; `removeRunScopedIdentity` removes by the prefix and reaches it. It is idempotent, so a cold start, a warm start and a run after an interrupted one all converge to the same starting state.
 *
 * Row-level base data is owned by `data-setup-base`; the paired `data-teardown-base` is the sole owner of the `test-` prefix wipe.
 * `data-teardown-contestant-journey` only handles the auth.users rows this chain owns.
 */

import { test as setup } from '@playwright/test';
import {
  UNREGISTERED_CANDIDATE_ADDRESS_PREFIX,
  UNREGISTERED_CANDIDATE_EMAIL
} from '../../utils/contestantJourneyConstants';
import { removeRunScopedIdentity } from '../../utils/runScopedIdentity';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

setup('prepare contestant-journey auth state (unregister, idempotent)', async () => {
  // Removes the users under the prefix, with their grants, invitations and terms-of-use acceptances, and the invitations addressed to this run's address. Safe alongside voter-journey, which never touches this candidate's auth state.
  await removeRunScopedIdentity(new SupabaseAdminClient(), {
    addressPrefix: UNREGISTERED_CANDIDATE_ADDRESS_PREFIX,
    address: UNREGISTERED_CANDIDATE_EMAIL
  });
});
