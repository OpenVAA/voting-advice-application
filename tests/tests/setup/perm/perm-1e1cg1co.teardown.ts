/**
 * perm-1e1cg1co data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-1e1cg1co-' — ONLY this chain's rows are cleared. Each perm-* chain teardowns ITS OWN prefix; no cross-chain interference (parallel-only contract).
 *
 * No auth unregister step — perm-* chains are voter-only and do not authenticate any candidate.
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-1e1cg1co-';

teardown('delete perm-1e1cg1co dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
