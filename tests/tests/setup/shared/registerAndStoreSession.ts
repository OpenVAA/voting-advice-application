/**
 * The one mechanism behind a stored contestant session: register a user as the editor of entities of the suite's project, sign them in on the sign-in screen and store the session. It serves any dataset seeded into that project, the base dataset and a permutation dataset alike: an entity is found by its `external_id` in the project, whichever template seeded it.
 *
 * A plain module and not a setup file, so that every setup file that stores a session can import it: one Playwright test file cannot import another. It declares no test of its own.
 *
 * The `candidates` table carries NO email column, so no seed can ship a *registered* candidate — registration is a runtime act. The helper therefore mints the auth user itself through `SupabaseAdminClient`, exactly as every perm-* setup does, then signs in through the login page object's `signInFromCold`, which opens the contestant app's sign-in screen and posts its form (synthetic tokens fail server-side `safeGetSession()` JWT validation, so only a real Supabase-minted session survives the protected layout).
 */

import { expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { createContestantLoginPage } from '../../fixtures/contestant/contestantLoginPage.fixture';
import { TIMEOUTS } from '../../helpers';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { TEST_PASSWORD } from '../../utils/testCredentials';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import type { Browser, Page } from '@playwright/test';
import type { EntityGrantTarget } from '../../utils/supabaseAdminClient';

/**
 * A user `registerAndStoreSession` registers and signs in.
 *
 * The entities the user edits are `entityGrants`, in their order. The list cannot be empty: the sign-in refuses a user with no entity to edit.
 */
export interface StoredSessionIdentity {
  /** The entities of the suite's project the user is registered as the editor of, each a type and an external id. Written between registration and sign-in, so the session's token carries them. */
  entityGrants: readonly [EntityGrantTarget, ...Array<EntityGrantTarget>];
  /** Email of the auth user. Any auth user already holding it is unregistered first. */
  email: string;
  /** Password of the auth user, typed into the sign-in form. */
  password: string;
  /** Absolute path of the file the signed-in session is written to. */
  storageStatePath: string;
  /** Whether registration records the user's acceptance of the terms of use. With `false` the user is shown the terms-of-use view at every protected URL. */
  acceptTermsOfUse: boolean;
  /** A test id that must be visible before the session is stored. Without one the session is stored as soon as the URL has left the login route. */
  settledTestId?: string;
}

/**
 * Register a user as the editor of one or more entities of the suite's project, sign them in on the sign-in screen and store the session.
 *
 * Each setup test that stores a session is a single call, and its identity argument is all that differs between them.
 *
 * Unregistering first makes a rerun idempotent: a prior run's auth user would otherwise collide as "User already exists". Unregistering deletes the user, and the user's grants and terms-of-use acceptance go with them; the entity rows are left as they are.
 *
 * The grants are written by the registration itself, before the sign-in, so the token the stored session holds carries every one of them.
 *
 * The branch on the identity's optional settled test id lives here rather than in a setup body, so the setup bodies stay free of conditionals.
 */
export async function registerAndStoreSession(page: Page, identity: StoredSessionIdentity): Promise<void> {
  // `recursive: true` is idempotent: it does NOT throw if the directory already exists (Node fs docs), so no existence check is needed.
  fs.mkdirSync(path.dirname(identity.storageStatePath), { recursive: true });

  const client = new SupabaseAdminClient();
  await client.unregisterUser(identity.email);
  await client.forceRegisterUser(identity.email, identity.password, {
    entityGrants: identity.entityGrants,
    acceptTermsOfUse: identity.acceptTermsOfUse
  });

  // The backend can be slow to answer while voter tests run beside this setup, and the step opens the sign-in screen again when its form does not appear.
  await createContestantLoginPage(page).signInFromCold(identity.email, identity.password);

  // The address leaves the login routes once the sign-in has redirected. That is a form post followed by two redirected loads, on a dev server that may not have compiled those routes yet, so the wait takes a slow page's time.
  await expect(page).not.toHaveURL(/.*login.*/, { timeout: TIMEOUTS.slowPage });

  // The URL has left the login route as soon as the redirect lands, before the protected page has rendered. An identity whose settled page matters names a test id of it.
  if (identity.settledTestId) {
    await page.getByTestId(identity.settledTestId).waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
  }

  // Save authenticated state for downstream tests
  await page.context().storageState({ path: identity.storageStatePath });
}

/**
 * An editor of a permutation dataset: the one entity the user edits, the user's address and where the user's session is stored. Built by `permEditor`, so that the three cannot drift apart.
 */
export interface PermEditor {
  /** The entity the editor is registered on. */
  grant: EntityGrantTarget;
  /** Email of the editor's auth user. */
  email: string;
  /** Absolute path of the file the editor's session is stored in. */
  storageStatePath: string;
}

/**
 * The editor of one entity of a permutation dataset. The address is the entity's external id on the E2E-only `test.openvaa.local` domain, and the session is stored under the suite's `playwright/.auth/` directory.
 *
 * @param entityType - The type of the entity the editor edits.
 * @param externalId - The entity's `external_id`.
 * @param sessionFile - The name of the file the editor's session is stored in.
 */
export function permEditor(
  entityType: EntityGrantTarget['entityType'],
  externalId: string,
  sessionFile: string
): PermEditor {
  return Object.freeze({
    grant: Object.freeze({ entityType, externalId }),
    email: `${externalId}@test.openvaa.local`,
    storageStatePath: path.join(TESTS_DIR, '../playwright/.auth', sessionFile)
  });
}

/**
 * Register each editor of a permutation dataset and store the editor's session.
 *
 * Each editor has accepted the terms of use and edits one entity alone, so signing in sends the user straight to that entity's home, and the session is stored only once the home has rendered its status message. Each registration runs in a browser context of its own, because a page that is already signed in is never shown the login form.
 */
export async function storeEditorSessions(
  browser: Browser,
  baseURL: string | undefined,
  editors: ReadonlyArray<PermEditor>
): Promise<void> {
  for (const editor of editors) {
    const context = await browser.newContext({ baseURL });
    try {
      await registerAndStoreSession(await context.newPage(), {
        entityGrants: [editor.grant],
        email: editor.email,
        password: TEST_PASSWORD,
        storageStatePath: editor.storageStatePath,
        acceptTermsOfUse: true,
        settledTestId: testIds.contestant.home.statusMessage
      });
    } finally {
      await context.close();
    }
  }
}

/**
 * Unregister each editor of a permutation dataset, with the user's grants, and delete the editor's stored session.
 *
 * A dataset's teardown deletes the seeded rows and not the auth users, so an editor left behind would hold a real editor grant under a known password.
 */
export async function removeEditorSessions(
  client: SupabaseAdminClient,
  editors: ReadonlyArray<PermEditor>
): Promise<void> {
  for (const editor of editors) {
    await client.unregisterUser(editor.email);
    fs.rmSync(editor.storageStatePath, { force: true });
  }
}
