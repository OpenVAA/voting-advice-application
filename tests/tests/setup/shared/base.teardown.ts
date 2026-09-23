/**
 * base data-teardown project.
 *
 * Scoped to PREFIX='test-e2e-base-' (canonical prefix). runTeardown is idempotent so the prefix-collision risk is mitigated by Playwright's project-graph sequencing: this teardown is wired via the `teardown:` key on `data-setup-base`, so it runs ONLY after the base/journey projects complete.
 *
 * Auth unregister step: the default base chain is voter-only and registers no candidate, but the opt-in `auth-setup` project (PLAYWRIGHT_VISUAL) force-registers CA-AA-1. Without unregistering, that auth.users row outlives the deleted candidate row and accumulates across runs. `unregisterCandidate` returns early when the user does not exist, so the default run pays only one admin listUsers call and its behaviour is unchanged.
 *
 * Teardown-ownership: this teardown is the sole *writer* of the `test-e2e-base-` namespace, but NOT its sole deleter — all 19 perm setups pass `extraTeardownPrefix: ['test-', 'e2e-perm-']`, and `'test-'` matches `test-e2e-base-%`, so a perm setup wipes this dataset before seeding its own (confirmed empirically — the stated reason `before = 0` was observed at this site). That is safe only because Playwright's `teardown:` deferral is transitive over the serial perm chain, so every setup completes before any teardown runs (review finding WR-06); it is NOT safe by namespace ownership. Breaking that ordering would make this site's `runTeardownAsserted` accounting race the perm pre-clears.
 * Every perm setup owns its own distinct `e2e-perm-*` prefix for its OWN seeded data; candidate-journey consumes (does not re-seed) base data and owns only its auth.users row.
 */

import { test as teardown } from '@playwright/test';
import { runTeardownAsserted } from './assertTeardown';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { TEST_CANDIDATE_EMAIL } from '../../utils/testCredentials';

const PREFIX = 'test-e2e-base-';

teardown('delete base dataset', async () => {
  const client = new SupabaseAdminClient();
  // Runs BEFORE the row wipe so the candidate row is still present to unlink.
  await client.unregisterCandidate(TEST_CANDIDATE_EMAIL);
  await runTeardownAsserted(PREFIX, client);
});
