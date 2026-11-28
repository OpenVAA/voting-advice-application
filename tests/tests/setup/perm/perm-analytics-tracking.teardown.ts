/**
 * perm-analytics-tracking data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-analytics-tracking` template declares.
 *
 * Before the prefix delete it unregisters the two auth users the terms-tracking spec registers on the dataset's member candidates (`ANALYTICS_TERMS_GRANTING_EMAIL` and `ANALYTICS_TERMS_REFUSING_EMAIL`), with their grants and terms-of-use acceptances, and asserts that no auth user holds either address afterwards: the prefix delete removes the candidate rows but not the auth users, and a user left behind would collide as "already registered" on the next run. It also removes the two stored sessions. The stand-alone teardown project `data-teardown-analytics-standalone` runs this same file.
 *
 * Idempotent: `unregisterUser` is a no-op when no auth user holds the address, as when the spec did not run.
 */

import { expect, test as teardown } from '@playwright/test';
import fs from 'fs';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import {
  ANALYTICS_TERMS_GRANTING_EMAIL,
  ANALYTICS_TERMS_GRANTING_STORAGE_STATE,
  ANALYTICS_TERMS_REFUSING_EMAIL,
  ANALYTICS_TERMS_REFUSING_STORAGE_STATE
} from '../../utils/testCredentials';
import { runTemplateTeardownAsserted } from '../shared/assertTeardown';

teardown('delete perm-analytics-tracking dataset', async () => {
  const client = new SupabaseAdminClient();

  await client.unregisterUser(ANALYTICS_TERMS_GRANTING_EMAIL);
  await client.unregisterUser(ANALYTICS_TERMS_REFUSING_EMAIL);
  expect(
    await client.hasAuthUser(ANALYTICS_TERMS_GRANTING_EMAIL),
    `an auth user still holds ${ANALYTICS_TERMS_GRANTING_EMAIL} after the teardown unregistered it`
  ).toBe(false);
  expect(
    await client.hasAuthUser(ANALYTICS_TERMS_REFUSING_EMAIL),
    `an auth user still holds ${ANALYTICS_TERMS_REFUSING_EMAIL} after the teardown unregistered it`
  ).toBe(false);

  await runTemplateTeardownAsserted('perm-analytics-tracking', client);

  fs.rmSync(ANALYTICS_TERMS_GRANTING_STORAGE_STATE, { force: true });
  fs.rmSync(ANALYTICS_TERMS_REFUSING_STORAGE_STATE, { force: true });
});
