/**
 * base data-teardown project.
 *
 * Scoped to PREFIX='test-e2e-base-' (canonical prefix). runTeardown is idempotent so the prefix-collision risk is mitigated by Playwright's project-graph sequencing: this teardown is wired via the `teardown:` key on `data-setup-base`, so it runs ONLY after the base/journey projects complete.
 *
 * Auth unregister step: the `auth-setup` project force-registers two users on this dataset, the base candidate's and the one who has not accepted the terms of use. The row wipe deletes candidate rows, not auth users, so without unregistering both users would outlive the dataset and accumulate across runs. `unregisterCandidate` returns early when the user does not exist, so a run in which `auth-setup` did not run pays only one listing of the auth users per email.
 *
 * Teardown-ownership: this teardown is the sole *writer* of the `test-e2e-base-` namespace, but NOT its sole deleter — all 19 perm setups pass `extraTeardownPrefix: ['test-', 'e2e-perm-']`, and `'test-'` matches `test-e2e-base-%`, so a perm setup wipes this dataset before seeding its own (confirmed empirically — the stated reason `before = 0` was observed at this site). That is safe only because Playwright's `teardown:` deferral is transitive over the serial perm chain, so every setup completes before any teardown runs (review finding WR-06); it is NOT safe by namespace ownership. Breaking that ordering would make this site's `runTeardownAsserted` accounting race the perm pre-clears.
 * Every perm setup owns its own distinct `e2e-perm-*` prefix for its OWN seeded data; contestant-journey consumes (does not re-seed) base data and owns only its auth.users row.
 */

import { test as teardown } from '@playwright/test';
import { runTeardownAsserted } from './assertTeardown';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { TEST_CANDIDATE_EMAIL, TEST_TERMS_PENDING_CANDIDATE_EMAIL } from '../../utils/testCredentials';

const PREFIX = 'test-e2e-base-';

teardown('delete base dataset', async () => {
  const client = new SupabaseAdminClient();
  // Each call deletes one auth user; the user's grants and terms-of-use acceptance go with them. Neither call reads or writes a candidate row, so their order relative to the row wipe does not matter.
  await client.unregisterCandidate(TEST_CANDIDATE_EMAIL);
  await client.unregisterCandidate(TEST_TERMS_PENDING_CANDIDATE_EMAIL);
  await runTeardownAsserted(PREFIX, client);
});
