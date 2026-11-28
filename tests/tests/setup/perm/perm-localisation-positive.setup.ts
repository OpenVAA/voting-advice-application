/**
 * perm-localisation-positive data-setup project.
 *
 * Invokes setupFromTemplate('perm-localisation-positive').
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` defends against cross-chain leakage from base / contestant-journey / prior perm chains still mid-teardown when this setup starts.
 *
 * Before the import it removes every auth user under `L10N_POSITIVE_CANDIDATE_ADDRESS_PREFIX`. The walk's address carries the run tag, so a user an interrupted earlier run left holds an address of its own, which no removal by this run's address reaches.
 */

import { test as setup } from '@playwright/test';
import { removeRunScopedIdentity } from '../../utils/runScopedIdentity';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { L10N_POSITIVE_CANDIDATE_ADDRESS_PREFIX, L10N_POSITIVE_CANDIDATE_EMAIL } from '../../utils/testCredentials';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-localisation-positive dataset', async () => {
  await removeRunScopedIdentity(new SupabaseAdminClient(), {
    addressPrefix: L10N_POSITIVE_CANDIDATE_ADDRESS_PREFIX,
    address: L10N_POSITIVE_CANDIDATE_EMAIL
  });
  await setupFromTemplate('perm-localisation-positive', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
