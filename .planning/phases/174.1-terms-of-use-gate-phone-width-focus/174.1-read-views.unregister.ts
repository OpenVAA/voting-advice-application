// 174.1-read-views.unregister.ts — removes the two users of the plan `views` of 174.1-read.mjs.
//
// Run by 174.1-read.mjs alone, as the project views-users-unregister of 174.1-read-views.config.ts, in the session's
// teardown and before the suite's data-teardown-base. It opens no page.
//
// `unregisterCandidate` deletes the auth user; the user's grants and terms-of-use acceptance go with them, and the
// entity rows are left for data-teardown-base. It returns quietly when no user holds the address, and also when the
// users cannot be listed, so the two assertions that follow are what show the users gone: `hasAuthUser` throws on a
// failed listing.

import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../../tests/tests/utils/supabaseAdminClient';

/** A value 174.1-read.mjs puts in the environment of this invocation. */
function given(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set: this file is run by 174.1-read.mjs, which sets it`);
  return value;
}

const MULTI_EMAIL = given('READ1741_MULTI_EMAIL');
const NONE_EMAIL = given('READ1741_NONE_EMAIL');

teardown('unregister the two users of the plan', async () => {
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(MULTI_EMAIL);
  await client.unregisterCandidate(NONE_EMAIL);
  expect(await client.hasAuthUser(MULTI_EMAIL)).toBe(false);
  expect(await client.hasAuthUser(NONE_EMAIL)).toBe(false);
});
