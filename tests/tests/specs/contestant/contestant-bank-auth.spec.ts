/**
 * The identity-callback Edge Function, called directly (no browser, no live identity provider).
 *
 * Each test builds a synthetic JWE-encrypted Idura id_token (fixed test keys, kid test-enc-1/test-sig-1) with `buildTestIdToken`'s defaults: the issuer `MOCK_ISSUER` and the audience `MOCK_AUDIENCE` of the mock OIDC issuer (tests/tests/support/mockOidcIssuer.ts), so this spec and the browser specs are served by one `identity-callback` environment. It POSTs the token with a project and an entity type as the frontend server does, with the run's server secret in the credential header, and asserts the function's closed answer and what it wrote:
 * 1. A new identity gets an account, a confirmed candidate with the token's names, one editor grant and a record of the candidate in `app_metadata`, which holds the provider, the match property and the match value and neither `hetu` nor `birthdate`.
 * 2. The same identity is found again, and the two claims an older account still holds are removed.
 * 3. The same identity registers an organization beside the candidate: unconfirmed, nameless, its own grant and record entry.
 * 4. A record whose grant is gone answers `no_entity` and creates nothing.
 * 5. A type the project does not allow is refused before any account is created.
 * 6. A token the function cannot decrypt or verify, and a body without a token, get the one result each.
 * 7. A call without the server's secret, and a call with another secret, are refused before anything is read, and create no account.
 * 8. Five first sign-ins of one new identity sent at once make one account, one candidate and one editor grant.
 *
 * The spec owns two projects of its own, so the registration-mode matrices it needs never touch the settings row of the project the rest of the suite seeds: one allows the identity provider's mode for candidates and organizations, the other for neither. Both are removed, with every account and row the tests created, before and after the tests.
 *
 * Run: the project is part of every run. `tests/scripts/e2e-run.sh` serves `identity-callback` with the identity provider's test environment for the length of the run, and hands Playwright the same `IDENTITY_CALLBACK_SERVER_SECRET` it gives the function (see tests/IDURA-TEST-RUNBOOK.md → "Deterministic E2E run"); `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset --project bank-auth` runs this project alone. Against a stack whose `identity-callback` lacks that environment the tests fail on their own assertions.
 */

import { createServiceRoleClient } from '@openvaa/dev-seed';
import { expect, test } from '@playwright/test';
import * as jose from 'jose';
import { buildTestIdToken } from '../../utils/buildTestIdToken';
import { supabaseAnonKey } from '../../utils/supabaseAnonKey';
import { getTestKeys } from '../../utils/testKeys';
import type { SupabaseClient, User } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';

/**
 * The service-role key of the stack the suite runs against, read when a hook needs it, never at module load: a throw at module load fails `playwright test --list` and every project of the run, not only this one.
 *
 * @throws Error naming the variable when it is not set.
 */
function serviceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key)
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set; the bank-auth tests read and remove what identity-callback created with it.'
    );
  return key;
}

/**
 * The secret the frontend server sends to the function, which the E2E wrapper generates for each run and gives to the function and to Playwright alike. Read when a hook needs it, for the reason above.
 *
 * @throws Error naming the variable when it is not set.
 */
function serverSecret(): string {
  const secret = process.env.IDENTITY_CALLBACK_SERVER_SECRET;
  if (!secret)
    throw new Error(
      'IDENTITY_CALLBACK_SERVER_SECRET is not set; the bank-auth tests call identity-callback as the frontend server does, with it.'
    );
  return secret;
}

/** The header that carries the server's secret. */
const SERVER_CREDENTIAL_HEADER = 'x-identity-callback-secret';

/** A value that is not the server's secret. */
const OTHER_SECRET = 'not-the-server-secret';

/** The account every project of `seed.sql` belongs to. */
const DEFAULT_ACCOUNT_ID = '00000000-0000-0000-0000-000000000001';

/** A project whose matrix allows the identity provider's mode for candidates and organizations. */
const OPEN_PROJECT_ID = '00000000-0000-0000-0000-00000000ba01';

/** A project whose matrix allows the identity provider's mode for no entity type. */
const CLOSED_PROJECT_ID = '00000000-0000-0000-0000-00000000ba02';

const PROJECT_SETTINGS: Record<string, Record<string, unknown>> = {
  [OPEN_PROJECT_ID]: {
    contestantApp: {
      entityTypes: ['candidate', 'organization'],
      registrationModes: { candidate: ['identity_provider'], organization: ['identity_provider'] }
    }
  },
  [CLOSED_PROJECT_ID]: {
    contestantApp: {
      entityTypes: ['candidate', 'organization'],
      registrationModes: { candidate: ['email'], organization: [] }
    }
  }
};

/** The synthetic identity that registers. */
const TEST_IDENTITY = {
  sub: 'test-bank-auth-sub-001',
  given_name: 'Testi',
  family_name: 'Tunnistautuja',
  birthdate: '1990-01-15',
  hetu: '150190-999X',
  country: 'FI',
  identityscheme: 'fitupas'
};

/** A second synthetic identity, refused before an account is made for it. */
const REFUSED_IDENTITY = { ...TEST_IDENTITY, sub: 'test-bank-auth-sub-002' };

/** A third synthetic identity, presented without the server's secret, for which no account may come to exist. */
const UNCREDENTIALLED_IDENTITY = { ...TEST_IDENTITY, sub: 'test-bank-auth-sub-003' };

/** A fourth synthetic identity, whose first sign-ins all arrive at once, with names of its own so its candidates can be told from the first identity's. */
const CONCURRENT_IDENTITY = {
  ...TEST_IDENTITY,
  sub: 'test-bank-auth-sub-004',
  given_name: 'Samanaikainen',
  family_name: 'Kirjautuja'
};

/** How many first sign-ins of the fourth identity are sent at once. */
const CONCURRENT_SIGN_INS = 5;

// Don't use stored auth — the function is called without a session.
test.use({ storageState: { cookies: [], origins: [] } });

/** An answer of the function. */
interface FunctionAnswer {
  status: number;
  body: Record<string, unknown>;
}

test.describe('candidate bank authentication', { tag: ['@bank-auth'] }, () => {
  test.describe.configure({ mode: 'serial' });

  let adminClient: SupabaseClient;
  let anonKey: string;
  let secret: string;
  let testKeys: Awaited<ReturnType<typeof getTestKeys>>;
  let userId: string;
  let candidateId: string;
  let organizationId: string;

  /**
   * POST a body to the function as the frontend server does: the anonymous key, and the server's secret in the credential header.
   *
   * @param credential - The value of the credential header, or null to send none.
   */
  async function callFunction(
    body: Record<string, unknown>,
    credential: string | null = secret
  ): Promise<FunctionAnswer> {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/identity-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        ...(credential === null ? {} : { [SERVER_CREDENTIAL_HEADER]: credential })
      },
      body: JSON.stringify(body)
    });
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
  }

  /** POST a fresh token of an identity for a project and an entity type. */
  async function register(
    identity: typeof TEST_IDENTITY,
    projectId: string,
    entityType: string
  ): Promise<FunctionAnswer> {
    const idToken = await buildTestIdToken(identity, testKeys.sigPriv, testKeys.encPubJwk);
    return callFunction({ id_token: idToken, project_id: projectId, entity_type: entityType });
  }

  /** The account whose `app_metadata` holds the match value, or undefined. */
  async function accountOf(sub: string): Promise<User | undefined> {
    for (let page = 1; ; page++) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(`listUsers failed: ${error.message}`);
      const found = data.users.find((user) => user.app_metadata?.identity_match_value === sub);
      if (found) return found;
      if (data.users.length < 1000) return undefined;
    }
  }

  /** The account's `app_metadata`, read again. */
  async function metadataOf(id: string): Promise<Record<string, unknown>> {
    const { data, error } = await adminClient.auth.admin.getUserById(id);
    if (error) throw new Error(`getUserById failed: ${error.message}`);
    return data.user.app_metadata ?? {};
  }

  /** The grants the account holds, without their ids. */
  async function grantsOf(id: string): Promise<Array<Record<string, unknown>>> {
    const { data, error } = await adminClient
      .from('grants')
      .select('scope, target_type, target_id, role')
      .eq('user_id', id)
      .order('target_type');
    if (error) throw new Error(`grants read failed: ${error.message}`);
    return data ?? [];
  }

  /** The rows of an entity table in a project. */
  async function rowsIn(table: 'candidates' | 'organizations', projectId: string, columns: string) {
    const { data, error } = await adminClient.from(table).select(columns).eq('project_id', projectId);
    if (error) throw new Error(`${table} read failed: ${error.message}`);
    return (data ?? []) as unknown as Array<Record<string, unknown>>;
  }

  /** Remove both identities' accounts and grants, and both projects with every row in them. */
  async function removeEverything(): Promise<void> {
    for (const identity of [TEST_IDENTITY, REFUSED_IDENTITY, UNCREDENTIALLED_IDENTITY, CONCURRENT_IDENTITY]) {
      const account = await accountOf(identity.sub);
      if (!account) continue;
      const { error: grantError } = await adminClient.from('grants').delete().eq('user_id', account.id);
      if (grantError) throw new Error(`grants delete failed: ${grantError.message}`);
      const { error: userError } = await adminClient.auth.admin.deleteUser(account.id);
      if (userError) throw new Error(`deleteUser failed: ${userError.message}`);
    }
    const { error } = await adminClient.from('projects').delete().in('id', [OPEN_PROJECT_ID, CLOSED_PROJECT_ID]);
    if (error) throw new Error(`projects delete failed: ${error.message}`);
  }

  test.beforeAll(async () => {
    // Built through dev-seed's guarded factory, which refuses a non-local SUPABASE_URL before any service-role request is sent.
    adminClient = createServiceRoleClient(SUPABASE_URL, serviceRoleKey());
    anonKey = supabaseAnonKey();
    secret = serverSecret();
    testKeys = await getTestKeys();

    await removeEverything();
    for (const [id, settings] of Object.entries(PROJECT_SETTINGS)) {
      const { error: projectError } = await adminClient
        .from('projects')
        .insert({ id, account_id: DEFAULT_ACCOUNT_ID, name: `Project ${id}`, default_locale: 'en' });
      if (projectError) throw new Error(`projects insert failed: ${projectError.message}`);
      const { error: settingsError } = await adminClient.from('app_settings').insert({ project_id: id, settings });
      if (settingsError) throw new Error(`app_settings insert failed: ${settingsError.message}`);
    }
  });

  test.afterAll(async () => {
    if (adminClient) await removeEverything();
  });

  test('creates an account, a confirmed candidate, its grant and its record for a new identity', async () => {
    const answer = await register(TEST_IDENTITY, OPEN_PROJECT_ID, 'candidate');

    expect(answer.status).toBe(200);
    expect(answer.body.result).toBe('created');
    expect(typeof answer.body.token).toBe('string');
    expect(answer.body.token).not.toBe('');
    expect(Object.keys(answer.body).sort()).toEqual(['result', 'token']);

    const account = await accountOf(TEST_IDENTITY.sub);
    expect(account).toBeDefined();
    userId = account!.id;

    const candidates = await rowsIn('candidates', OPEN_PROJECT_ID, 'id, first_name, last_name, confirmed');
    expect(candidates).toHaveLength(1);
    candidateId = candidates[0].id as string;
    expect(candidates[0]).toMatchObject({
      first_name: TEST_IDENTITY.given_name,
      last_name: TEST_IDENTITY.family_name,
      confirmed: true
    });

    expect(await grantsOf(userId)).toEqual([
      { scope: 'entity', target_type: 'candidate', target_id: candidateId, role: 'editor' }
    ]);

    const metadata = await metadataOf(userId);
    expect(metadata.identity_provider).toBe('idura-ftn');
    expect(metadata.identity_match_prop).toBe('sub');
    expect(metadata.identity_match_value).toBe(TEST_IDENTITY.sub);
    expect(metadata.registered_entities).toEqual({ [OPEN_PROJECT_ID]: { candidate: candidateId } });
    expect(metadata.hetu).toBeUndefined();
    expect(metadata.birthdate).toBeUndefined();
  });

  test('refuses a token encrypted for a key the function does not hold, with the invalid-token result alone', async () => {
    const { publicKey: wrongEncPub } = await jose.generateKeyPair('RSA-OAEP-256', { extractable: true });
    const wrongEncJwk = await jose.exportJWK(wrongEncPub);
    wrongEncJwk.kid = 'wrong-enc-1';
    wrongEncJwk.alg = 'RSA-OAEP-256';
    wrongEncJwk.use = 'enc';

    const mismatchedToken = await buildTestIdToken(TEST_IDENTITY, testKeys.sigPriv, wrongEncJwk);
    const answer = await callFunction({
      id_token: mismatchedToken,
      project_id: OPEN_PROJECT_ID,
      entity_type: 'candidate'
    });

    expect(answer.status).toBe(401);
    expect(answer.body).toEqual({ result: 'invalid_token' });
  });

  test('finds the same candidate for a returning identity and removes the claims an older account holds', async () => {
    expect(userId, 'the first test created the account').toBeTruthy();
    const { error: plantError } = await adminClient.auth.admin.updateUserById(userId, {
      app_metadata: { hetu: TEST_IDENTITY.hetu, birthdate: TEST_IDENTITY.birthdate }
    });
    expect(plantError).toBeNull();
    const planted = await metadataOf(userId);
    expect(planted.hetu).toBeDefined();
    expect(planted.birthdate).toBeDefined();

    const answer = await register(TEST_IDENTITY, OPEN_PROJECT_ID, 'candidate');

    expect(answer.status).toBe(200);
    expect(answer.body.result).toBe('found');
    expect(typeof answer.body.token).toBe('string');
    expect(Object.keys(answer.body).sort()).toEqual(['result', 'token']);

    expect(await rowsIn('candidates', OPEN_PROJECT_ID, 'id')).toEqual([{ id: candidateId }]);
    expect(await grantsOf(userId)).toEqual([
      { scope: 'entity', target_type: 'candidate', target_id: candidateId, role: 'editor' }
    ]);

    const metadata = await metadataOf(userId);
    expect(metadata.registered_entities).toEqual({ [OPEN_PROJECT_ID]: { candidate: candidateId } });
    expect(metadata.hetu).toBeUndefined();
    expect(metadata.birthdate).toBeUndefined();
  });

  test('creates an unconfirmed, nameless organization for the same identity beside its candidate', async () => {
    expect(candidateId, 'the first test created the candidate').toBeTruthy();
    const answer = await register(TEST_IDENTITY, OPEN_PROJECT_ID, 'organization');

    expect(answer.status).toBe(200);
    expect(answer.body.result).toBe('created');
    expect(typeof answer.body.token).toBe('string');

    const organizations = await rowsIn('organizations', OPEN_PROJECT_ID, 'id, name, confirmed');
    expect(organizations).toHaveLength(1);
    organizationId = organizations[0].id as string;
    expect(organizations[0]).toMatchObject({ name: null, confirmed: false });

    expect(await grantsOf(userId)).toEqual([
      { scope: 'entity', target_type: 'candidate', target_id: candidateId, role: 'editor' },
      { scope: 'entity', target_type: 'organization', target_id: organizationId, role: 'editor' }
    ]);

    const metadata = await metadataOf(userId);
    expect(metadata.registered_entities).toEqual({
      [OPEN_PROJECT_ID]: { candidate: candidateId, organization: organizationId }
    });
  });

  test('answers no_entity and creates nothing when the grant on the recorded candidate is gone', async () => {
    expect(organizationId, 'the organization test ran').toBeTruthy();
    const { error: revokeError } = await adminClient
      .from('grants')
      .delete()
      .eq('user_id', userId)
      .eq('target_id', candidateId);
    expect(revokeError).toBeNull();

    const answer = await register(TEST_IDENTITY, OPEN_PROJECT_ID, 'candidate');

    expect(answer.status).toBe(200);
    expect(answer.body.result).toBe('no_entity');
    expect(typeof answer.body.token).toBe('string');

    expect(await rowsIn('candidates', OPEN_PROJECT_ID, 'id')).toEqual([{ id: candidateId }]);
    expect(await grantsOf(userId)).toEqual([
      { scope: 'entity', target_type: 'organization', target_id: organizationId, role: 'editor' }
    ]);
  });

  test('refuses a type the project does not allow and creates no account for the identity', async () => {
    const answer = await register(REFUSED_IDENTITY, CLOSED_PROJECT_ID, 'candidate');

    expect(answer.status).toBe(403);
    expect(answer.body).toEqual({ result: 'mode_not_allowed' });
    expect(await accountOf(REFUSED_IDENTITY.sub)).toBeUndefined();
    expect(await rowsIn('candidates', CLOSED_PROJECT_ID, 'id')).toEqual([]);
  });

  test('should handle CORS preflight correctly', async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/identity-callback`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5174',
        'Access-Control-Request-Method': 'POST'
      }
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('access-control-allow-methods')).toContain('POST');
  });

  test('answers a body without a token with the bad-request result alone', async () => {
    const answer = await callFunction({});

    expect(answer.status).toBe(400);
    expect(answer.body).toEqual({ result: 'bad_request' });
  });

  test('answers a token that is not a JWE or a JWT with the invalid-token result alone', async () => {
    const answer = await callFunction({ id_token: 'not.a.valid.jwt.token', project_id: OPEN_PROJECT_ID });

    expect(answer.status).toBe(401);
    expect(answer.body).toEqual({ result: 'invalid_token' });
  });

  test("refuses a call without the server's secret and creates no account for a valid token", async () => {
    const idToken = await buildTestIdToken(UNCREDENTIALLED_IDENTITY, testKeys.sigPriv, testKeys.encPubJwk);
    const answer = await callFunction(
      { id_token: idToken, project_id: OPEN_PROJECT_ID, entity_type: 'candidate' },
      null
    );

    expect(answer.status).toBe(401);
    expect(answer.body).toEqual({ result: 'refused' });
    expect(await accountOf(UNCREDENTIALLED_IDENTITY.sub)).toBeUndefined();
  });

  test('refuses a call with another secret and creates no account for a valid token', async () => {
    const idToken = await buildTestIdToken(UNCREDENTIALLED_IDENTITY, testKeys.sigPriv, testKeys.encPubJwk);
    const answer = await callFunction(
      { id_token: idToken, project_id: OPEN_PROJECT_ID, entity_type: 'candidate' },
      OTHER_SECRET
    );

    expect(answer.status).toBe(401);
    expect(answer.body).toEqual({ result: 'refused' });
    expect(await accountOf(UNCREDENTIALLED_IDENTITY.sub)).toBeUndefined();
  });

  test('five concurrent first sign-ins of one identity create one candidate and one editor grant', async () => {
    const answers = await Promise.all(
      Array.from({ length: CONCURRENT_SIGN_INS }, () => register(CONCURRENT_IDENTITY, OPEN_PROJECT_ID, 'candidate'))
    );

    const account = await accountOf(CONCURRENT_IDENTITY.sub);
    expect(account, 'the sign-ins made an account').toBeDefined();
    const created = (await rowsIn('candidates', OPEN_PROJECT_ID, 'id, first_name, last_name')).filter(
      (row) => row.first_name === CONCURRENT_IDENTITY.given_name && row.last_name === CONCURRENT_IDENTITY.family_name
    );
    expect(created, 'candidates made for the identity').toHaveLength(1);
    expect((await grantsOf(account!.id)).filter((grant) => grant.target_type === 'candidate')).toEqual([
      { scope: 'entity', target_type: 'candidate', target_id: created[0].id, role: 'editor' }
    ]);

    expect(answers.map((answer) => answer.status)).toEqual(Array(CONCURRENT_SIGN_INS).fill(200));
    for (const answer of answers) {
      expect(['created', 'found']).toContain(answer.body.result);
      expect(typeof answer.body.token).toBe('string');
    }
    expect(answers.filter((answer) => answer.body.result === 'created')).toHaveLength(1);
  });
});
