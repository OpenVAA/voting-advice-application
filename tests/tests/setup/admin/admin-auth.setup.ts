import { expect, test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { ADMIN_STORAGE_STATE, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from '../../utils/adminCredentials';
import { buildRoute } from '../../utils/buildRoute';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';

/**
 * Admin auth setup project: mints an Admin App identity and saves its storageState.
 *
 * Mirrors `setup/shared/auth.setup.ts` step for step, because the constraint that shapes that file shapes this one identically: the admin `(protected)` layout's identity read goes through `getUserData` → `_getBasicUserData`, which performs a VERIFYING `auth.getUser()` round trip to Supabase Auth. A synthetic or hand-minted cookie fails that call, so the session must come from a real login through the real form. Never mint a cookie here.
 *
 * The `user_roles` row this mints is what makes the identity an admin at all: `custom_access_token_hook` reads that table on every token issue and injects the rows into the JWT's `user_roles` claim, which is what the login action's `ADMIN_ROLES` gate and the protected layout's `role !== 'admin'` check then read. An account without it logs in and is bounced straight back out.
 *
 * The `unregisterCandidate` call ahead of `forceRegisterAdmin` makes re-runs idempotent: a prior run's auth user would otherwise collide as "User already exists". It is the correct removal for an admin despite its name — its candidate-row update matches no row for an account with no `auth_user_id` link, and its other two steps delete the role rows by `user_id` and the account itself.
 *
 * The stale-job pre-clear is the second half of that idempotency. `admin_jobs` rows are reachable by NOTHING else in the suite (see `deleteAdminJobsByAuthor`), so a run that died between the spec's write and its teardown would leave a row behind and the spec's own count assertion would then be reading someone else's history.
 */
setup('mint + authenticate as project admin', async ({ page }) => {
  // The admin app loads through the root layout's data promises; allow the same headroom the candidate analog does.
  setup.setTimeout(90000);

  // `recursive: true` is idempotent — it does not throw when the directory exists.
  fs.mkdirSync(path.dirname(ADMIN_STORAGE_STATE), { recursive: true });

  const client = new SupabaseAdminClient();
  await client.deleteAdminJobsByAuthor(TEST_ADMIN_EMAIL);
  await client.unregisterCandidate(TEST_ADMIN_EMAIL);
  await client.forceRegisterAdmin(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);

  // Log in through the real form.
  const loginRoute = buildRoute({ route: 'AdminAppLogin', locale: 'en' });
  await page.goto(loginRoute, { waitUntil: 'domcontentloaded' });

  // reason: the admin login page declares NO test id on its email input or its submit button — unlike the candidate login page, which is a large part of why the admin surface has had no coverage until now. Both selectors below are the locale-stable exception the rule names: `#email` is the id the markup itself declares, and `button[type="submit"]` is a type attribute. Neither reads any translated string, so neither can break on a locale change. The password field is addressed through the shared test id its component DOES carry.
  // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
  const emailInput = page.locator('#email');
  // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
  const submitButton = page.locator('form button[type="submit"]');

  await emailInput.waitFor({ state: 'visible', timeout: 30000 });
  await emailInput.fill(TEST_ADMIN_EMAIL);
  await page.getByTestId(testIds.candidate.password.field).fill(TEST_ADMIN_PASSWORD);
  await submitButton.click();

  // The login action answers 303 to the admin home; wait for the address to leave the login page.
  await expect(page).not.toHaveURL(/.*\/admin\/login.*/);

  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});
