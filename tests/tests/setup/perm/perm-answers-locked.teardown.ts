/**
 * perm-answers-locked data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-answers-locked-'. Also deletes the per-perm Playwright storage-state JSON file produced by the setup phase.
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { TESTS_DIR } from '../../utils/testsDir';

const PREFIX = 'e2e-perm-answers-locked-';
const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-answers-locked.json');
// The auth.users row minted by the setup's forceRegister. runTeardown(PREFIX)
// deletes the seeded candidate row but NOT the auth user; without this it
// leaks (the setup self-heals via unregisterCandidate, but we clean up after
// ourselves). Idempotent no-op when no matching auth.users row exists.
const CANDIDATE_EMAIL = `${PREFIX}cand-1@test.openvaa.local`;

teardown('delete perm-answers-locked dataset', async () => {
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(CANDIDATE_EMAIL);
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);

  if (fs.existsSync(STORAGE_STATE_PATH)) fs.unlinkSync(STORAGE_STATE_PATH);
});
