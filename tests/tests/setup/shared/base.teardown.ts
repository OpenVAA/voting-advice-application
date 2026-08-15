/**
 * base data-teardown project.
 *
 * Scoped to PREFIX='test-e2e-base-' (canonical prefix). runTeardown is
 * idempotent so the prefix-collision risk is mitigated by Playwright's
 * project-graph sequencing: this teardown is wired via the `teardown:` key on
 * `data-setup-base`, so it runs ONLY after the base/journey projects complete.
 *
 * Auth unregister step: the default base chain is voter-only and registers no
 * candidate, but the opt-in `auth-setup` project (PLAYWRIGHT_VISUAL) force-registers
 * CA-AA-1 (Phase 136 plan 05). Without unregistering, that auth.users row outlives
 * the deleted candidate row and accumulates across runs. `unregisterCandidate`
 * returns early when the user does not exist, so the default run pays only one
 * admin listUsers call and its behaviour is unchanged.
 *
 * Teardown-ownership: this teardown is the SOLE owner of the base namespace.
 * Every perm setup owns its own distinct `e2e-perm-*` prefix; candidate-journey
 * consumes (does not re-seed) base data and owns only its auth.users row. No
 * other setup writes bare `test-` rows, so narrowing the wipe from `test-` to
 * `test-e2e-base-` orphans nothing.
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
