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
import type { Page } from '@playwright/test';
import type { EntityGrantTarget } from '../../utils/supabaseAdminClient';

/**
 * A user `registerAndStoreSession` registers and signs in.
 *
 * The entities the user edits are `externalId`'s candidate, when stated, followed by `entityGrants` in their order. An identity must name at least one: the sign-in refuses a user with no entity to edit.
 */
export interface StoredSessionIdentity {
  /** external_id of the candidate the user is registered as the editor of, in the suite's project. Omitted by an identity that states `entityGrants` alone. */
  externalId?: string;
  /** Further entities of the suite's project the user is registered as the editor of, each a type and an external id. Written between registration and sign-in, so the session's token carries them. */
  entityGrants?: ReadonlyArray<EntityGrantTarget>;
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
 * The entities an identity edits, in the order they are granted.
 *
 * @throws Error if the identity names no entity.
 */
function entityGrantsOf(identity: StoredSessionIdentity): Array<EntityGrantTarget> {
  const grants: Array<EntityGrantTarget> = [];
  if (identity.externalId) grants.push({ entityType: 'candidate', externalId: identity.externalId });
  grants.push(...(identity.entityGrants ?? []));
  if (grants.length === 0) {
    throw new Error(
      `registerAndStoreSession: the identity ${identity.email} names no entity. State \`externalId\` or \`entityGrants\`: a user with no entity to edit cannot pass the sign-in.`
    );
  }
  return grants;
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
 * The branches on the identity's optional fields live here rather than in a setup body, so the setup bodies stay free of conditionals.
 */
export async function registerAndStoreSession(page: Page, identity: StoredSessionIdentity): Promise<void> {
  const entityGrants = entityGrantsOf(identity);

  // `recursive: true` is idempotent: it does NOT throw if the directory already exists (Node fs docs), so no existence check is needed.
  fs.mkdirSync(path.dirname(identity.storageStatePath), { recursive: true });

  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(identity.email);
  await client.forceRegisterUser(identity.email, identity.password, {
    entityGrants,
    acceptTermsOfUse: identity.acceptTermsOfUse
  });

  // The backend can be slow to answer while voter tests run beside this setup, and the step opens the sign-in screen again when its form does not appear.
  await createContestantLoginPage(page).signInFromCold(identity.email, identity.password);

  // The address leaves the login routes once the sign-in has redirected.
  await expect(page).not.toHaveURL(/.*login.*/);

  // The URL has left the login route as soon as the redirect lands, before the protected page has rendered. An identity whose settled page matters names a test id of it.
  if (identity.settledTestId) {
    await page.getByTestId(identity.settledTestId).waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
  }

  // Save authenticated state for downstream tests
  await page.context().storageState({ path: identity.storageStatePath });
}
