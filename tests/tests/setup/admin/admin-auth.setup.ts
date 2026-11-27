import { expect, test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { createAdminLoginPage } from '../../fixtures/admin/adminLoginPage.fixture';
import { ADMIN_LOGIN_REDIRECT_TIMEOUT, TIMEOUTS } from '../../helpers';
import { ADMIN_STORAGE_STATE, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from '../../utils/adminCredentials';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

/**
 * Admin auth setup project: mints an Admin App identity and saves its storageState.
 *
 * Mirrors `setup/shared/auth.setup.ts` step for step, because the constraint that shapes that file shapes this one identically: the admin `(protected)` layout's identity read goes through `getUserData` → `_getBasicUserData`, which performs a VERIFYING `auth.getUser()` round trip to Supabase Auth. A synthetic or hand-minted cookie fails that call, so the session must come from a real login through the real form. Never mint a cookie here.
 *
 * The grant row this mints is what makes the identity an admin at all: `custom_access_token_hook` reads `public.grants` on every token issue and projects the rows into the JWT's `grants` claim, which is what the login action's admin gate and the protected layout's identity check then read. An account without it logs in and is bounced straight back out.
 *
 * The `unregisterUser` call ahead of `forceRegisterAdmin` makes re-runs idempotent: a prior run's auth user would otherwise collide as "User already exists".
 *
 * The stale-job pre-clear is the second half of that idempotency. `admin_jobs` rows are reachable by NOTHING else in the suite (see `deleteAdminJobsByAuthor`), so a run that died between the spec's write and its teardown would leave a row behind and the spec's own count assertion would then be reading someone else's history.
 */
setup('mint + authenticate as project admin', async ({ page }) => {
  // The admin app loads through the root layout's data promises; allow the same headroom the candidate analog does.
  setup.setTimeout(TIMEOUTS.testMax);

  // `recursive: true` is idempotent — it does not throw when the directory exists.
  fs.mkdirSync(path.dirname(ADMIN_STORAGE_STATE), { recursive: true });

  const client = new SupabaseAdminClient();
  await client.deleteAdminJobsByAuthor(TEST_ADMIN_EMAIL);
  await client.unregisterUser(TEST_ADMIN_EMAIL);
  await client.forceRegisterAdmin(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);

  // Log in through the real form.
  const login = createAdminLoginPage(page);
  await login.goToPage();
  await login.login(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);

  // The login action answers 303 to the admin home, whose data is a second answer; wait for the address to leave the login page.
  await expect(page).not.toHaveURL(/.*\/admin\/login.*/, { timeout: ADMIN_LOGIN_REDIRECT_TIMEOUT });

  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});
