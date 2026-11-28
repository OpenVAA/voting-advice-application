/**
 * perm-hide-hero data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-hide-hero` template declares.
 */

import { test as teardown } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { TESTS_DIR } from '../../utils/testsDir';
import { runTemplateTeardownAsserted, templateTeardownPrefix } from '../shared/assertTeardown';

const PREFIX = templateTeardownPrefix('perm-hide-hero');
const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-hide-hero.json');
// The auth.users row the setup registers through registerAndStoreSession. runTeardown(PREFIX) deletes the seeded candidate row but NOT the auth user; without this it leaks (the setup self-heals via unregisterUser, but we clean up after ourselves). Idempotent no-op when no matching auth.users row exists.
const CANDIDATE_EMAIL = `${PREFIX}cand-1@test.openvaa.local`;

teardown('delete perm-hide-hero dataset', async () => {
  const client = new SupabaseAdminClient();
  await client.unregisterUser(CANDIDATE_EMAIL);
  await runTemplateTeardownAsserted('perm-hide-hero', client);

  if (fs.existsSync(STORAGE_STATE_PATH)) fs.unlinkSync(STORAGE_STATE_PATH);
});
