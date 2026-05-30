/**
 * perm-hide-hero data-teardown project — Phase 91 Plan 02 (TIR6:24-32).
 *
 * Scoped to PREFIX='e2e-perm-hide-hero-' per D-91-PD-05.
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { TESTS_DIR } from '../utils/testsDir';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

const PREFIX = 'e2e-perm-hide-hero-';
const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-hide-hero.json');

teardown('delete perm-hide-hero dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);

  if (fs.existsSync(STORAGE_STATE_PATH)) fs.unlinkSync(STORAGE_STATE_PATH);
});
