import { configureLogger } from '@openvaa/app-shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnswersLockedError } from '$lib/api/base/answersLockedError';
import { UNVERIFIED_ANSWERS } from '$lib/api/base/universalDataWriter';
import { ROUTE } from '$lib/routes';
import { SupabaseDataWriter } from './supabaseDataWriter';
import type { LogRecord } from '@openvaa/app-shared';
import type { Database } from '@openvaa/supabase-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseAdapterConfig } from '../supabaseAdapter.type';

// Mock $env/dynamic/public before any imports that depend on it
vi.mock('$env/dynamic/public', () => ({
  env: {
    PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    PUBLIC_PROJECT_ID: '00000000-0000-0000-0000-000000000001'
  }
}));

/** The project the adapter under test is configured for, and therefore the one every scoped query and every Storage path must name. It is the same value the `$env/dynamic/public` mock above supplies; it is repeated rather than read from it because `vi.mock` is hoisted above every declaration. */
const PROJECT_ID = '00000000-0000-0000-0000-000000000001';

// Mock $lib/i18n so tests can assert locale flow into _logout's server POST.
const i18nMocks = vi.hoisted(() => ({ getLocale: vi.fn(() => 'en') }));
vi.mock('$lib/i18n', () => ({
  getLocale: i18nMocks.getLocale
}));

/**
 * One recorded PostgREST chain. Every builder method returns the chain itself, and the chain is thenable, so a test can await the query and then read what was called on it.
 *
 * The writer reaches every project-scoped table through the adapter's `scopedFrom` facade, which appends `.eq('project_id', …)` to a builder the test never holds a reference to otherwise. Retaining the chain is what makes that filter observable; without it an assertion claiming to check the project filter would be checking nothing.
 * @param table - The table the chain was created for.
 * @param responses - The per-table response map the chain resolves from.
 * @returns The chain.
 */
function createChain(table: string, responses: Record<string, { data: unknown; error: unknown }>) {
  /**
   * The response this chain's table is configured to answer with, read at settle time so a test may configure it after the chain was handed out.
   * @returns The configured response, or an empty one.
   */
  function settle() {
    return Promise.resolve(responses[table] ?? { data: null, error: null });
  }
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(settle),
    maybeSingle: vi.fn().mockImplementation(settle),
    then: undefined as unknown as PromiseLike<unknown>['then']
  };
  // Params are left unannotated so they are contextually typed from PromiseLike<unknown>['then'], matching the field type.
  chain.then = (resolve, reject) => settle().then(resolve, reject);
  return chain;
}

/**
 * Creates a mock Supabase client with auth methods as vi.fn() stubs and a recording chain behind `from`.
 */
function createMockSupabaseClient() {
  const mockResponses: Record<string, { data: unknown; error: unknown }> = {};
  const chains: Array<{ table: string; chain: ReturnType<typeof createChain> }> = [];

  return {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      setSession: vi.fn()
    },
    rpc: vi.fn(),
    from: vi.fn((table: string) => {
      const chain = createChain(table, mockResponses);
      chains.push({ table, chain });
      return chain;
    }),
    storage: {
      from: vi.fn()
    },
    functions: {
      invoke: vi.fn()
    },
    _mockResponses: mockResponses,
    _chains: chains
  };
}

/**
 * Every `(column, value)` pair passed to `.eq()` on the chains created for `table`.
 * @param client - The mock client under test.
 * @param table - The table whose chains to read.
 * @returns One entry per `.eq()` call, across every chain created for that table.
 */
function eqCallsFor(client: MockClient, table: string): Array<[string, unknown]> {
  return client._chains
    .filter((entry) => entry.table === table)
    .flatMap((entry) => entry.chain.eq.mock.calls as Array<[string, unknown]>);
}

/**
 * Every table name `from` was called with, in call order.
 *
 * The assertions below count these rather than only checking membership: an extra round-trip is observable only as an extra table reached.
 * @param client - The mock client under test.
 * @returns The table names.
 */
function tablesReached(client: MockClient): Array<string> {
  return client.from.mock.calls.map((call) => call[0] as string);
}

/**
 * The arguments of the one RPC call a test made.
 * @param client - The mock client under test.
 * @returns The arguments object of that call. The test fails when the client was not called exactly once.
 */
function onlyRpcArguments(client: MockClient) {
  expect(client.rpc).toHaveBeenCalledTimes(1);
  return client.rpc.mock.calls[0][1];
}

/**
 * The argument list of every `.upsert()` call on the chains created for `table`.
 * @param client - The mock client under test.
 * @param table - The table whose chains to read.
 * @returns One entry per `.upsert()` call, each holding every argument the call was given.
 */
function upsertCallsFor(client: MockClient, table: string): Array<Array<unknown>> {
  return client._chains
    .filter((entry) => entry.table === table)
    .flatMap((entry) => entry.chain.upsert.mock.calls as Array<Array<unknown>>);
}

type MockClient = ReturnType<typeof createMockSupabaseClient>;
// reason: createMockSupabaseClient is structural-only; SupabaseClient<Database> has 50+ methods we don't mock
function asSupabaseMock(m: MockClient): SupabaseClient<Database> {
  return m as unknown as SupabaseClient<Database>;
}

/**
 * Stub a session that PASSES verification: `getUser()` returns the user — the round-trip `_getBasicUserData` makes FIRST — and `getSession()` returns the access token whose grant claim the coarse role is then derived from.
 *
 * Both halves are required, and that is the point. A stub supplying only `getSession` describes a token no auth server ever confirmed, which is exactly the forged-cookie shape the rejection case below asserts against.
 * @param client - The mock client to stub.
 * @param options.user - The user the verification round-trip returns.
 * @param options.grants - The `grants` claim encoded into the access token.
 */
function mockVerifiedSession(
  client: MockClient,
  { user, grants }: { user: Record<string, unknown>; grants: Array<Record<string, unknown>> }
): void {
  const accessToken = `header.${btoa(JSON.stringify({ grants }))}.signature`;
  client.auth.getUser.mockResolvedValue({ data: { user }, error: null });
  client.auth.getSession.mockResolvedValue({ data: { session: { user, access_token: accessToken } }, error: null });
}

/**
 * Run `write` with the structured logger capturing into an array, then restore the silent default.
 * The logger's configuration is module-scoped and starts at `'silent'`, so a parse-failure record is invisible until the level is raised. The restore runs in a `finally` so one failing expectation cannot leave the level raised for the rest of the file. Same shape as the helper in `supabaseDataProvider.test.ts`; the `'warn'` threshold admits the `error`-level records these sites emit.
 * @param write - The writer call under test.
 * @returns The call's result and every record emitted while it ran.
 */
async function withCapturedLogs<TResult>(
  write: () => Promise<TResult>
): Promise<{ result: TResult; records: Array<LogRecord> }> {
  const records: Array<LogRecord> = [];
  configureLogger({ level: 'warn', sink: (record) => records.push(record) });
  try {
    const result = await write();
    return { result, records };
  } finally {
    configureLogger({ level: 'silent', sink: undefined });
  }
}

/**
 * Stub the RPCs the user-data read makes: the list of the caller's entities, awaited directly, the one-entity read, awaited through `maybeSingle()`, and the entity's nominations, awaited directly.
 * @param client - The mock client to stub.
 * @param options.list - What `get_user_entities` resolves with. Defaults to one candidate entry, `cand-1`.
 * @param options.row - What the one-entity read resolves with.
 * @param options.nominations - What `get_entity_nominations` resolves with. When it is not given, a call of that function fails the test.
 * @returns The `maybeSingle` stub, so a test can assert whether the one-entity read was made.
 */
function mockEntityRpcs(
  client: MockClient,
  {
    list = { data: { entities: [listedCandidate('cand-1')] }, error: null },
    row,
    nominations
  }: {
    list?: { data: unknown; error: unknown };
    row: { data: unknown; error: unknown };
    nominations?: { data: unknown; error: unknown };
  }
) {
  const maybeSingle = vi.fn().mockResolvedValue(row);
  client.rpc.mockImplementation((name: string) => {
    if (name === 'get_user_entities') return Promise.resolve(list);
    if (name === 'get_entity_user_data') return { maybeSingle };
    if (name === 'get_entity_nominations' && nominations) return Promise.resolve(nominations);
    throw new Error(`Unexpected RPC in this test: ${name}`);
  });
  return maybeSingle;
}

/**
 * One nomination as `get_entity_nominations` states it: under an organization's nomination, with every column stored.
 * @param overrides - Members to state otherwise.
 * @returns The element.
 */
function nominationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'nom-1',
    election_id: 'el-1',
    election_name: { en: 'Election', fi: 'Vaalit' },
    constituency_id: 'co-1',
    constituency_name: { en: 'Constituency', fi: 'Vaalipiiri' },
    election_round: 2,
    election_symbol: '42',
    confirmed: true,
    custom_data: { requestedParentOrganization: 'A party' },
    updated_at: '2026-10-01T12:00:00.123456+00:00',
    parent: {
      entity_type: 'organization',
      entity_id: 'org-1',
      name: { en: 'The Party', fi: 'Puolue' },
      short_name: { en: 'TP', fi: 'P' }
    },
    ...overrides
  };
}

/**
 * One candidate entry as `get_user_entities` lists it.
 * @param id - The candidate's id.
 * @returns The entry.
 */
function listedCandidate(id: string) {
  return {
    entity_type: 'candidate',
    id,
    first_name: 'Test',
    last_name: 'Candidate',
    short_name: null,
    image: null,
    color: null,
    confirmed: true
  };
}

/**
 * One organization entry as `get_user_entities` lists it.
 * @param id - The organization's id.
 * @returns The entry.
 */
function listedOrganization(id: string) {
  return {
    entity_type: 'organization',
    id,
    name: { en: 'Test Organization' },
    short_name: null,
    image: null,
    color: null,
    confirmed: true
  };
}

describe('SupabaseDataWriter', () => {
  let writer: SupabaseDataWriter;
  let mockSupabase: MockClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    const config: SupabaseAdapterConfig = {
      fetch: vi.fn(),
      client: asSupabaseMock(mockSupabase)
    };
    writer = new SupabaseDataWriter(config);
    // Mock global fetch for _logout's server-side cookie clearing call
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  describe('login', () => {
    it('calls signInWithPassword and returns success', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });

      const result = await writer.login({ username: 'test@example.com', password: 'pass' });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'pass'
      });
      expect(result).toEqual({ type: 'success' });
    });

    it('throws Error with Supabase error message on failure', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {},
        error: { message: 'Invalid login credentials' }
      });

      await expect(writer.login({ username: 'test@example.com', password: 'wrong' })).rejects.toThrow(
        'Invalid login credentials'
      );
    });
  });

  describe('logout (via backendLogout)', () => {
    it('calls signOut with scope local and returns success', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const result = await writer.backendLogout();

      expect(mockSupabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
      expect(result).toEqual({ type: 'success' });
    });

    it('throws Error on Supabase signOut failure', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Session not found' }
      });

      await expect(writer.backendLogout()).rejects.toThrow('Session not found');
    });
  });

  describe('logout (public override)', () => {
    beforeEach(() => {
      i18nMocks.getLocale.mockReturnValue('en');
    });

    it('calls signOut directly without posting to universal logout route', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const result = await writer.logout();

      expect(mockSupabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
      expect(result).toEqual({ type: 'success' });
    });

    it('rejects without signing the browser out when the server could not clear the session cookies', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 502 });

      await expect(writer.logout()).rejects.toThrow(/502/);
      expect(mockSupabase.auth.signOut).not.toHaveBeenCalled();
    });

    it('posts the cookie-clear request to the endpoint the route map names', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await writer.logout();

      expect(globalThis.fetch).toHaveBeenCalledWith(ROUTE.AuthLogout, { method: 'POST' });
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
    });

    it('does not assemble the endpoint from the current locale (regression guard for the doubled-prefix bug)', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });
      // The endpoint clears httpOnly cookies and answers json; it is the same endpoint in every locale. An implementation that reached for the current locale would emit a different URL here than in the case above, and the two assertions together are what pins that it does not.
      i18nMocks.getLocale.mockReturnValue('fi');

      await writer.logout();

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
    });

    it('does not derive the endpoint from window.location.pathname (regression guard for the /contestant-prefix bug)', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });
      // Simulate an unprefixed candidate route URL. Reading the locale from the first path segment would take "contestant" for a locale and put it in front of the endpoint from exactly this input.
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { pathname: '/contestant/auth/logout', origin: 'http://localhost' }
      });

      await writer.logout();

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
    });
  });

  describe('setPassword', () => {
    it('calls updateUser with the new password', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ data: {}, error: null });

      const result = await writer.setPassword({
        password: 'newpass'
      });

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newpass' });
      expect(result).toEqual({ type: 'success' });
    });

    it('throws Error on Supabase failure', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: {},
        error: { message: 'Password too short' }
      });

      await expect(writer.setPassword({ password: 'x' })).rejects.toThrow('Password too short');
    });
  });

  describe('acceptTermsOfUse', () => {
    // Both arguments are pinned, and exactly. A payload naming the user or the time is refused by the column privilege, and an upsert without the ignore-duplicates option is refused on a repeat, a failure no mocked client can show.
    it('issues one ignore-duplicates upsert stating nothing but the project', async () => {
      const result = await writer.acceptTermsOfUse();

      expect(upsertCallsFor(mockSupabase, 'terms_of_use_acceptances')).toEqual([
        [{ project_id: PROJECT_ID }, { ignoreDuplicates: true }]
      ]);
      expect(tablesReached(mockSupabase)).toEqual(['terms_of_use_acceptances']);
      expect(result).toEqual({ type: 'success' });
    });

    it('rejects with the method named when the write fails', async () => {
      mockSupabase._mockResponses['terms_of_use_acceptances'] = {
        data: null,
        error: { message: 'permission denied for table terms_of_use_acceptances' }
      };

      await expect(writer.acceptTermsOfUse()).rejects.toThrow(
        /^acceptTermsOfUse: permission denied for table terms_of_use_acceptances$/
      );
    });
  });

  describe('updateAnswers (merge mode)', () => {
    it('calls upsert_answers RPC with overwrite=false', async () => {
      const mockAnswers = { q1: { value: 3 }, q2: { value: 'text' } };
      const returnedAnswers = { q1: { value: 3 }, q2: { value: 'text' }, q3: { value: 1 } };
      mockSupabase.rpc.mockResolvedValue({ data: returnedAnswers, error: null });

      const result = await writer.updateAnswers({
        target: { type: 'candidate', id: 'entity-1' },
        answers: mockAnswers
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('upsert_answers', {
        p_entity_type: 'candidate',
        p_entity_id: 'entity-1',
        p_answers: mockAnswers,
        p_overwrite: false
      });
      expect(result).toEqual(returnedAnswers);
    });
  });

  describe('overwriteAnswers (overwrite mode)', () => {
    it('calls upsert_answers RPC with overwrite=true', async () => {
      const mockAnswers = { q1: { value: 5 } };
      mockSupabase.rpc.mockResolvedValue({ data: mockAnswers, error: null });

      const result = await writer.overwriteAnswers({
        target: { type: 'candidate', id: 'entity-1' },
        answers: mockAnswers
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('upsert_answers', {
        p_entity_type: 'candidate',
        p_entity_id: 'entity-1',
        p_answers: mockAnswers,
        p_overwrite: true
      });
      expect(result).toEqual(mockAnswers);
    });
  });

  describe('updateAnswers with File upload', () => {
    it('uploads File objects to Storage and replaces with path in answers', async () => {
      const mockFile = new File(['image-data'], 'photo.png', { type: 'image/png' });
      const mockAnswers = {
        'q-text': { value: 'hello' },
        'q-image': { value: mockFile, info: { en: 'My photo' } }
      };

      // Mock storage upload
      const uploadMock = vi.fn().mockResolvedValue({ data: { path: 'uploaded' }, error: null });
      mockSupabase.storage.from.mockReturnValue({ upload: uploadMock });

      // Mock upsert_answers RPC
      const expectedAnswers = {
        'q-text': { value: 'hello' },
        'q-image': {
          value: { path: expect.stringMatching(new RegExp(`^${PROJECT_ID}/candidates/entity-1/.*\\.png$`)) },
          info: { en: 'My photo' }
        }
      };
      mockSupabase.rpc.mockResolvedValue({ data: expectedAnswers, error: null });

      await writer.updateAnswers({
        target: { type: 'candidate', id: 'entity-1' },
        answers: mockAnswers
      });

      // Verify storage upload was called
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('public-assets');
      expect(uploadMock).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`^${PROJECT_ID}/candidates/entity-1/.*\\.png$`)),
        mockFile,
        { cacheControl: '3600', upsert: true }
      );

      // Verify RPC was called with path object instead of File
      expect(mockSupabase.rpc).toHaveBeenCalledWith('upsert_answers', {
        p_entity_type: 'candidate',
        p_entity_id: 'entity-1',
        p_answers: expectedAnswers,
        p_overwrite: false
      });
    });

    // `file.name` is fully controlled by the uploading candidate. Taking `name.split('.').pop()` verbatim would turn `a.b/c/d` into the extension `"/d"` and a path of `…/<uuid>./d` — an uploader-chosen sub-path inside the prefix, copied on into the stored `{ path }` and from there into a public URL. Each case below is a shape that derivation admits and the whitelist does not.
    it.each([
      ['a slash-bearing name that placed objects at a chosen sub-path', 'evil.png/../../elsewhere/x'],
      ['a name whose suffix is not an image extension at all', 'payload.svg'],
      ['a name carrying no extension', 'no-extension-here'],
      ['a name whose suffix carries control and URL-significant characters', 'photo.p%3Fng#frag']
    ])('sanitizes the Storage object path for %s', async (_case, fileName) => {
      const mockFile = new File(['image-data'], fileName, { type: 'image/png' });
      const uploadMock = vi.fn().mockResolvedValue({ data: { path: 'uploaded' }, error: null });
      mockSupabase.storage.from.mockReturnValue({ upload: uploadMock });
      mockSupabase.rpc.mockResolvedValue({ data: {}, error: null });

      await writer.updateAnswers({
        target: { type: 'candidate', id: 'entity-1' },
        answers: { 'q-image': { value: mockFile } }
      });

      const [storagePath] = uploadMock.mock.calls[0];
      // The whole path is a member of the known language: prefix, one UUID, one whitelisted extension, nothing else.
      expect(storagePath).toMatch(
        new RegExp(`^${PROJECT_ID}/candidates/entity-1/[0-9a-f-]{36}\\.(jpg|jpeg|png|webp|gif|avif)$`)
      );
    });

    it('keeps a legitimate whitelisted extension, case-insensitively', async () => {
      const mockFile = new File(['image-data'], 'Portrait.WEBP', { type: 'image/webp' });
      const uploadMock = vi.fn().mockResolvedValue({ data: { path: 'uploaded' }, error: null });
      mockSupabase.storage.from.mockReturnValue({ upload: uploadMock });
      mockSupabase.rpc.mockResolvedValue({ data: {}, error: null });

      await writer.updateAnswers({
        target: { type: 'candidate', id: 'entity-1' },
        answers: { 'q-image': { value: mockFile } }
      });

      expect(uploadMock.mock.calls[0][0]).toMatch(/\.webp$/);
    });
  });

  describe('updateAnswers error handling', () => {
    it('throws on RPC error', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

      await expect(
        writer.updateAnswers({
          target: { type: 'candidate', id: 'entity-1' },
          answers: { q1: { value: 1 } }
        })
      ).rejects.toThrow('setAnswers: RPC failed');
    });

    it('throws the answers-locked error when the database refuses the write because answers are locked', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { code: '42501', message: 'upsert_answers: answers are locked in this project' }
      });

      const write = writer.updateAnswers({
        target: { type: 'candidate', id: 'entity-1' },
        answers: { q1: { value: 1 } }
      });

      await expect(write).rejects.toBeInstanceOf(AnswersLockedError);
      await expect(write).rejects.not.toThrow(/upsert_answers/);
    });

    it('throws the answers-locked error for an overwrite the lock refuses', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { code: '42501', message: 'upsert_answers: answers are locked in this project' }
      });

      await expect(
        writer.overwriteAnswers({ target: { type: 'candidate', id: 'entity-1' }, answers: { q1: { value: 1 } } })
      ).rejects.toBeInstanceOf(AnswersLockedError);
    });

    it.each([
      [
        'another refusal under the same code',
        { code: '42501', message: 'permission denied for function upsert_answers' }
      ],
      [
        'the lock text under another code',
        { code: 'P0001', message: 'upsert_answers: answers are locked in this project' }
      ],
      ['the lock text with no code', { message: 'upsert_answers: answers are locked in this project' }],
      [
        'the lock text quoted inside another message',
        { code: '42501', message: 'upsert_answers: answers are locked in this project, said the log' }
      ]
    ])('throws the method error, and not the answers-locked one, for %s', async (_shape, error) => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error });

      const write = writer.updateAnswers({
        target: { type: 'candidate', id: 'entity-1' },
        answers: { q1: { value: 1 } }
      });

      await expect(write).rejects.toThrow(/^setAnswers: /);
      await expect(write).rejects.not.toBeInstanceOf(AnswersLockedError);
    });

    it('throws on Storage upload error', async () => {
      const mockFile = new File(['data'], 'img.jpg', { type: 'image/jpeg' });

      // Mock storage upload failure
      const uploadMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'Bucket full' } });
      mockSupabase.storage.from.mockReturnValue({ upload: uploadMock });

      await expect(
        writer.updateAnswers({
          target: { type: 'candidate', id: 'entity-1' },
          answers: { 'q-img': { value: mockFile } }
        })
      ).rejects.toThrow('Image upload failed: Bucket full');
    });
  });

  /**
   * The post-upsert read-back, which is a status BRANCH rather than a collapse.
   *
   * The write itself is never in doubt in any of these cases — the RPC resolves without an error. What is under test is what the adapter REPORTS about a write whose result it could not validate. A collapse to `parseAnswersColumn(...).value ?? {}` would turn a malformed read-back into a truthy empty answers map that the candidate store would treat as a verified save.
   */
  describe('_setAnswers read-back', () => {
    const target = { type: 'candidate', id: 'entity-1' } as const;
    const answers = { q1: { value: 3 } };

    it('returns the parsed answers and emits no record when the read-back is clean', async () => {
      const readBack = { q1: { value: 3 }, q2: { value: 'text' } };
      mockSupabase.rpc.mockResolvedValue({ data: readBack, error: null });

      const { result, records } = await withCapturedLogs(() => writer.updateAnswers({ target, answers }));

      expect(result).toEqual(readBack);
      expect(records).toHaveLength(0);
    });

    it('returns the unverified signal when the read-back is malformed, and reports it exactly once', async () => {
      // Every entry is malformed, so partial preserve keeps nothing — the case a collapse would report as a truthy `{}`.
      mockSupabase.rpc.mockResolvedValue({ data: { q1: 'not-an-answer-object' }, error: null });

      const { result, records } = await withCapturedLogs(() => writer.updateAnswers({ target, answers }));

      // NOT `{}`: an unverified write and an entity with no answers are different facts and must not be the same value.
      expect(result).toBe(UNVERIFIED_ANSWERS);
      expect(result).not.toEqual({});
      expect(records).toHaveLength(1);
      expect(records[0].severityText).toBe('ERROR');
      expect(records[0].attributes?.column).toBe('upsert_answers.result');
      expect(records[0].attributes?.id).toBe('entity-1');
      expect(records[0].attributes?.issues).toEqual(['q1']);
    });

    it('returns the unverified signal when the read-back is genuinely absent', async () => {
      // An absent read-back leaves the write exactly as unverified as a malformed one, so it resolves to the same signal. Absence is not a parse failure, so no record is emitted for it.
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const { result, records } = await withCapturedLogs(() => writer.updateAnswers({ target, answers }));

      expect(result).toBe(UNVERIFIED_ANSWERS);
      expect(records).toHaveLength(0);
    });

    it('never carries any part of the answers payload into the record', async () => {
      // A candidate's answer text is author-supplied content that may carry personal data. The refused KEY name is disclosed; what was stored under and beside it is not.
      const secret = 'MY_SECRET_ANSWER_TEXT';
      mockSupabase.rpc.mockResolvedValue({
        data: { q1: { value: secret, bogusAnswerKey: 1 } },
        error: null
      });

      const { result, records } = await withCapturedLogs(() => writer.updateAnswers({ target, answers }));

      expect(result).toBe(UNVERIFIED_ANSWERS);
      expect(records).toHaveLength(1);
      // The exhaustive assertion is what proves nothing else rode along.
      expect(records[0].attributes).toEqual({
        column: 'upsert_answers.result',
        id: 'entity-1',
        issues: ['q1'],
        rejectedKeys: ['bogusAnswerKey'],
        preserved: true
      });
      expect(JSON.stringify(records[0])).not.toContain(secret);
    });

    it('still throws on an RPC error — a failed write is not an unverified one', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

      await expect(writer.updateAnswers({ target, answers })).rejects.toThrow('setAnswers: RPC failed');
    });
  });

  describe('getBasicUserData', () => {
    /**
     * Stub the one RPC the method makes, `get_user_entities`, whose answer carries the caller's password fact.
     * @param answer - What the RPC resolves with. Defaults to the answer for a user who has a password and edits nothing.
     */
    function mockPasswordFact(
      answer: { data: unknown; error: unknown } = {
        data: { entities: [], password_set: true, pending_email_taken: false },
        error: null
      }
    ): void {
      mockSupabase.rpc.mockResolvedValue(answer);
    }

    beforeEach(() => mockPasswordFact());

    it('extracts user data from the verified session and its JWT claims', async () => {
      mockVerifiedSession(mockSupabase, {
        user: { id: 'user-1', email: 'cand@test.com', user_metadata: { language: 'fi' } },
        grants: [{ scope: 'entity', target_type: 'candidate', target_id: 'uuid1', role: 'editor' }]
      });

      const result = await writer.getBasicUserData();
      // The verifying round-trip runs, and it runs BEFORE any claim is read.
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(result.id).toBe('user-1');
      expect(result.email).toBe('cand@test.com');
      expect(result.username).toBe('cand@test.com');
      expect(result.role).toBe('contestant');
      expect(result.settings.language).toBe('fi');
      expect(result.passwordSet).toBe(true);
    });

    it('returns admin role for a project-scope admin grant', async () => {
      mockVerifiedSession(mockSupabase, {
        user: { id: 'user-2', email: 'admin@test.com', user_metadata: {} },
        grants: [{ scope: 'project', target_type: null, target_id: 'proj1', role: 'admin' }]
      });

      const result = await writer.getBasicUserData();
      expect(result.role).toBe('admin');
    });

    // An admin grant is never masked by an entity editor grant: the Admin App admits the `'admin'` role alone, so an administrator who also edits an entity must still be read as one. The entity grant comes first in each token, so the outcome cannot follow from the order of the claims.
    it.each(['candidate', 'organization'])(
      'returns the admin role for an admin grant held beside an editor grant on a %s',
      async (target_type) => {
        mockVerifiedSession(mockSupabase, {
          user: { id: 'user-2c', email: 'both@test.com', user_metadata: {} },
          grants: [
            { scope: 'entity', target_type, target_id: 'entity-1', role: 'editor' },
            { scope: 'project', target_type: null, target_id: 'proj1', role: 'admin' }
          ]
        });

        expect((await writer.getBasicUserData()).role).toBe('admin');
      }
    );

    it('returns the contestant role for an editor grant on an organization alone', async () => {
      mockVerifiedSession(mockSupabase, {
        user: { id: 'user-2d', email: 'org@test.com', user_metadata: {} },
        grants: [{ scope: 'entity', target_type: 'organization', target_id: 'org-1', role: 'editor' }]
      });

      expect((await writer.getBasicUserData()).role).toBe('contestant');
    });

    // The app serves neither factions nor alliances, so their editors hold neither app's role.
    it.each(['faction', 'alliance'])('returns a null role for an editor grant on a %s alone', async (target_type) => {
      mockVerifiedSession(mockSupabase, {
        user: { id: 'user-2e', email: 'other@test.com', user_metadata: {} },
        grants: [{ scope: 'entity', target_type, target_id: 'entity-2', role: 'editor' }]
      });

      expect((await writer.getBasicUserData()).role).toBeNull();
    });

    // The shape the database's CHECK constraints admit and the user-type mapping never produces, given the empty permission set by the matrix. It is neither app's principal, and reading it as an admin because its role says `admin` is the fail-open direction this normalisation must not take.
    it('returns a null role for an entity-scope admin grant, which the matrix maps to nothing', async () => {
      mockVerifiedSession(mockSupabase, {
        user: { id: 'user-2b', email: 'nobody@test.com', user_metadata: {} },
        grants: [{ scope: 'entity', target_type: 'candidate', target_id: 'cand-x', role: 'admin' }]
      });

      expect((await writer.getBasicUserData()).role).toBeNull();
    });

    it('returns null role when the token carries no grants at all', async () => {
      mockVerifiedSession(mockSupabase, {
        user: { id: 'user-3', email: 'nobody@test.com', user_metadata: {} },
        grants: []
      });

      const result = await writer.getBasicUserData();
      expect(result.role).toBeNull();
    });

    // A token carrying only the retired claim key and no `grants` claim confers nothing here, exactly as it confers nothing in the database.
    it('returns a null role for a token carrying only the retired claim shape', async () => {
      const retiredToken = `header.${btoa(JSON.stringify({ user_roles: [{ role: 'super_admin', scope_type: 'global', scope_id: null }] }))}.signature`;
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-3b', email: 'stale@test.com', user_metadata: {} } },
        error: null
      });
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-3b' }, access_token: retiredToken } },
        error: null
      });

      expect((await writer.getBasicUserData()).role).toBeNull();
    });

    it('defaults language to en when not in user_metadata', async () => {
      mockVerifiedSession(mockSupabase, {
        user: { id: 'user-4', email: 'test@test.com', user_metadata: {} },
        grants: []
      });

      const result = await writer.getBasicUserData();
      expect(result.settings.language).toBe('en');
    });

    it('throws when no active session', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      await expect(writer.getBasicUserData()).rejects.toThrow('No active session');
    });

    // THE FORGED-TOKEN CASE. A self-minted JWT in an `sb-*` cookie is what `getSession()` hands back unchallenged: the blob is well-formed, its self-reported `expires_at` is in the future, and its grant claim says global admin. Only the `getUser()` round-trip rejects it, which is why `_getBasicUserData` makes that call first and why this spec asserts the claim is never reached.
    it('rejects a forged, unexpired session whose token fails the verification round-trip', async () => {
      const forgedGrants = [{ scope: 'global', target_type: null, target_id: null, role: 'admin' }];
      const forgedToken = `header.${btoa(JSON.stringify({ grants: forgedGrants }))}.forged-signature`;
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'invalid JWT: unable to parse or verify signature' }
      });
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'attacker', email: 'attacker@test.com', user_metadata: {} },
            access_token: forgedToken,
            expires_at: Math.floor(Date.now() / 1000) + 3600
          }
        },
        error: null
      });

      await expect(writer.getBasicUserData()).rejects.toThrow('No active session');
      // The claim must never be reached: had the decode run first, this caller would have been an admin.
      expect(mockSupabase.auth.getSession).not.toHaveBeenCalled();
    });

    describe('terms-of-use acceptance', () => {
      /** A verified session of a user holding no grant, which is all the acceptance read needs. */
      function setupSession() {
        mockVerifiedSession(mockSupabase, {
          user: { id: 'user-5', email: 'user@test.com', user_metadata: {} },
          grants: []
        });
      }

      it('returns the stamped time of the acceptance row as termsOfUseAccepted', async () => {
        setupSession();
        mockSupabase._mockResponses['terms_of_use_acceptances'] = {
          data: { accepted_at: '2026-01-02T03:04:05.678+00:00' },
          error: null
        };

        const result = await writer.getBasicUserData();

        expect(result.termsOfUseAccepted).toBe('2026-01-02T03:04:05.678+00:00');
      });

      it('returns null when the user has no acceptance row', async () => {
        setupSession();
        mockSupabase._mockResponses['terms_of_use_acceptances'] = { data: null, error: null };

        const { result, records } = await withCapturedLogs(() => writer.getBasicUserData());

        expect(result.termsOfUseAccepted).toBeNull();
        expect(records).toHaveLength(0);
      });

      // A read that failed is neither "accepted" nor "not accepted". Read as not accepted, it would show the gate again after every acceptance for as long as the read keeps failing.
      it('rejects, naming the acceptance read, when the read fails', async () => {
        setupSession();
        mockSupabase._mockResponses['terms_of_use_acceptances'] = {
          data: null,
          error: { message: 'connection refused', code: '08006' }
        };

        await expect(writer.getBasicUserData()).rejects.toThrow(
          /^getBasicUserData: could not read the terms-of-use acceptance: connection refused$/
        );
      });

      it('reads the acceptance of this adapter’s project in one round-trip', async () => {
        setupSession();

        await writer.getBasicUserData();

        expect(eqCallsFor(mockSupabase, 'terms_of_use_acceptances')).toEqual([['project_id', PROJECT_ID]]);
        expect(tablesReached(mockSupabase)).toEqual(['terms_of_use_acceptances']);
      });
    });

    describe("the account's address and the identity's own organization", () => {
      const PLACEHOLDER = 'a-subject@bank-auth.placeholder';
      const TYPED = 'typed@example.test';
      const PROVIDER = 'idura-ftn';
      const OWN_ORGANIZATION = '6f1c2a3b-4d5e-4f60-8a71-92b3c4d5e6f7';
      const OTHER_ORGANIZATION = '8b3c4d5e-6f70-4a81-9c92-b3d4e5f60718';
      const OTHER_PROJECT = '00000000-0000-0000-0000-000000000002';

      /**
       * A verified user an identity provider made.
       * @param overrides - Members of the verified user to state otherwise.
       * @returns The user.
       */
      function providerUser(overrides: Record<string, unknown> = {}): Record<string, unknown> {
        return {
          id: 'user-ip',
          email: PLACEHOLDER,
          user_metadata: {},
          app_metadata: {
            identity_provider: PROVIDER,
            registered_entities: { [PROJECT_ID]: { organization: OWN_ORGANIZATION } }
          },
          ...overrides
        };
      }

      /**
       * The answer of `get_user_entities` with the given entries and caller facts.
       * @param entities - The listed entries.
       * @param pendingEmailTaken - The `pending_email_taken` member.
       * @returns The answer.
       */
      function listed(entities: Array<unknown> = [], pendingEmailTaken: unknown = false) {
        return { data: { entities, password_set: false, pending_email_taken: pendingEmailTaken }, error: null };
      }

      /**
       * An organization entry with the given name, unconfirmed.
       * @param id - The organization's id.
       * @param name - Its stored name.
       * @returns The entry.
       */
      function organizationNamed(id: string, name: unknown) {
        return { ...listedOrganization(id), name, confirmed: false };
      }

      it('reads an account no identity provider made as proved, with its address in email and username', async () => {
        mockVerifiedSession(mockSupabase, {
          user: { id: 'user-1', email: TYPED, new_email: 'other@example.test', user_metadata: {}, app_metadata: {} },
          grants: []
        });
        mockPasswordFact(listed([], false));

        expect(await writer.getBasicUserData()).toMatchObject({
          email: TYPED,
          username: TYPED,
          addressState: 'proved',
          pendingEmail: null,
          ownOrganizationUnnamed: false,
          pendingEmailTaken: false
        });
      });

      it('reads a provider account on its placeholder with nothing pending as none, with no address anywhere', async () => {
        mockVerifiedSession(mockSupabase, { user: providerUser(), grants: [] });
        mockPasswordFact(listed());

        const result = await writer.getBasicUserData();
        expect(result).toMatchObject({
          email: '',
          username: '',
          addressState: 'none',
          pendingEmail: null,
          pendingEmailTaken: false
        });
        expect(JSON.stringify(result)).not.toContain('bank-auth.placeholder');
      });

      it('reads a provider account on its placeholder with an address pending as pending, with that address as the pending one alone', async () => {
        mockVerifiedSession(mockSupabase, { user: providerUser({ new_email: TYPED }), grants: [] });
        mockPasswordFact(listed());

        const result = await writer.getBasicUserData();
        expect(result).toMatchObject({
          email: '',
          username: '',
          addressState: 'pending',
          pendingEmail: TYPED,
          pendingEmailTaken: false
        });
        expect(JSON.stringify(result)).not.toContain('bank-auth.placeholder');
      });

      it('reads a pending address that is now another account’s as none, saying it is taken and naming no pending address', async () => {
        mockVerifiedSession(mockSupabase, { user: providerUser({ new_email: TYPED }), grants: [] });
        mockPasswordFact(listed([], true));

        expect(await writer.getBasicUserData()).toMatchObject({
          email: '',
          username: '',
          addressState: 'none',
          pendingEmail: null,
          pendingEmailTaken: true
        });
      });

      it('reads a provider account on a real address as proved, with that address in email and username', async () => {
        mockVerifiedSession(mockSupabase, { user: providerUser({ email: TYPED }), grants: [] });
        mockPasswordFact(listed([], true));

        expect(await writer.getBasicUserData()).toMatchObject({
          email: TYPED,
          username: TYPED,
          addressState: 'proved',
          pendingEmail: null,
          pendingEmailTaken: false
        });
      });

      it('reads the facts from the verified user, never from the session object', async () => {
        mockVerifiedSession(mockSupabase, {
          user: { id: 'user-1', email: TYPED, user_metadata: {}, app_metadata: {} },
          grants: []
        });
        const accessToken = `header.${btoa(JSON.stringify({ grants: [] }))}.signature`;
        mockSupabase.auth.getSession.mockResolvedValue({
          data: { session: { user: providerUser({ new_email: 'session@example.test' }), access_token: accessToken } },
          error: null
        });
        mockPasswordFact(listed([organizationNamed(OWN_ORGANIZATION, {})]));

        expect(await writer.getBasicUserData()).toMatchObject({
          email: TYPED,
          addressState: 'proved',
          pendingEmail: null,
          ownOrganizationUnnamed: false
        });
      });

      it.each<[string, unknown, boolean]>([
        ['no name at all', {}, true],
        ['a name in another locale only', { fi: 'Puolue' }, true],
        ['a blank name in the default locale', { en: '  ' }, true],
        ['a name in the default locale', { en: 'The Party' }, false]
      ])('says whether the own organization is unnamed when it has %s', async (_label, name, unnamed) => {
        mockVerifiedSession(mockSupabase, { user: providerUser({ new_email: TYPED }), grants: [] });
        mockPasswordFact(listed([listedCandidate('cand-1'), organizationNamed(OWN_ORGANIZATION, name)]));

        expect((await writer.getBasicUserData()).ownOrganizationUnnamed).toBe(unnamed);
      });

      it.each<[string, Record<string, unknown>]>([
        ['granted otherwise, with no record', providerUser({ app_metadata: { identity_provider: PROVIDER } })],
        [
          'recorded for another project',
          providerUser({
            app_metadata: {
              identity_provider: PROVIDER,
              registered_entities: { [OTHER_PROJECT]: { organization: OTHER_ORGANIZATION } }
            }
          })
        ],
        [
          'not the one the record names',
          providerUser({
            app_metadata: {
              identity_provider: PROVIDER,
              registered_entities: { [PROJECT_ID]: { organization: OWN_ORGANIZATION } }
            }
          })
        ]
      ])('never asks about an unnamed organization %s', async (_label, user) => {
        mockVerifiedSession(mockSupabase, { user, grants: [] });
        mockPasswordFact(listed([organizationNamed(OTHER_ORGANIZATION, {})]));

        expect((await writer.getBasicUserData()).ownOrganizationUnnamed).toBe(false);
      });

      it('reads the own organization as named when the list does not hold it', async () => {
        mockVerifiedSession(mockSupabase, { user: providerUser(), grants: [] });
        mockPasswordFact(listed([]));

        expect((await writer.getBasicUserData()).ownOrganizationUnnamed).toBe(false);
      });

      it('rejects a list it must read for the own organization when the list is malformed', async () => {
        mockVerifiedSession(mockSupabase, { user: providerUser(), grants: [] });
        mockPasswordFact(listed([{ entity_type: 'organization', id: OWN_ORGANIZATION }]));

        await expect(writer.getBasicUserData()).rejects.toThrow(/did not match its schema/);
      });

      it.each([
        ['holds no pending_email_taken', { entities: [], password_set: true }],
        ['holds a null pending_email_taken', { entities: [], password_set: true, pending_email_taken: null }],
        ['holds a string for pending_email_taken', { entities: [], password_set: true, pending_email_taken: 'false' }]
      ])('rejects when the answer %s', async (_label, data) => {
        mockVerifiedSession(mockSupabase, { user: providerUser({ new_email: TYPED }), grants: [] });
        mockPasswordFact({ data, error: null });

        await expect(writer.getBasicUserData()).rejects.toThrow(/pending-address fact did not match its schema/);
      });
    });

    describe('password fact', () => {
      /** A verified session of a user holding no grant, which is all the read of the fact needs. */
      function setupSession() {
        mockVerifiedSession(mockSupabase, {
          user: { id: 'user-6', email: 'user@test.com', user_metadata: {} },
          grants: []
        });
      }

      it.each([true, false])('returns passwordSet as the answer holds it: %s', async (password_set) => {
        setupSession();
        mockPasswordFact({ data: { entities: [], password_set, pending_email_taken: false }, error: null });

        expect((await writer.getBasicUserData()).passwordSet).toBe(password_set);
      });

      it('reads the fact on every call, with one call of get_user_entities for this adapter’s project', async () => {
        setupSession();

        await writer.getBasicUserData();

        expect(mockSupabase.rpc.mock.calls).toEqual([['get_user_entities', { p_project_id: PROJECT_ID }]]);

        await writer.getBasicUserData();

        expect(mockSupabase.rpc.mock.calls).toEqual([
          ['get_user_entities', { p_project_id: PROJECT_ID }],
          ['get_user_entities', { p_project_id: PROJECT_ID }]
        ]);
      });

      it('rejects, naming the method and the failure, when the read of the fact fails', async () => {
        setupSession();
        mockPasswordFact({ data: null, error: { message: 'permission denied for function caller_password_set' } });

        await expect(writer.getBasicUserData()).rejects.toThrow(
          /^getBasicUserData: .*permission denied for function caller_password_set/
        );
      });

      it.each([
        ['holds no password_set', { entities: [] }],
        ['holds a null password_set', { entities: [], password_set: null }],
        ['holds a string for password_set', { entities: [], password_set: 'true' }],
        ['is null', null]
      ])('rejects when the answer %s', async (_label, data) => {
        setupSession();
        mockPasswordFact({ data, error: null });

        await expect(writer.getBasicUserData()).rejects.toThrow(/password fact did not match its schema/);
      });
    });
  });

  describe('getEntityUserData for a candidate', () => {
    /** Helper to set up a mock session with candidate role JWT. */
    function setupContestantSession() {
      mockVerifiedSession(mockSupabase, {
        user: { id: 'user-1', email: 'cand@test.com', user_metadata: { language: 'fi' } },
        grants: [{ scope: 'entity', target_type: 'candidate', target_id: 'cand-1', role: 'editor' }]
      });
    }

    it('reads the candidate and returns structured data', async () => {
      setupContestantSession();

      const entityRow = {
        id: 'cand-1',
        project_id: PROJECT_ID,
        name: { en: 'Test Candidate' },
        short_name: null,
        info: null,
        color: null,
        image: null,
        sort_order: 1,
        subtype: null,
        custom_data: null,
        answers: { q1: { value: 3 } },
        first_name: 'Test',
        last_name: 'Candidate'
      };

      mockEntityRpcs(mockSupabase, { row: { data: entityRow, error: null } });

      const result = await writer.getEntityUserData({
        type: 'candidate',
        id: 'cand-1',
        loadNominations: false,
        locale: 'en'
      });

      expect(mockSupabase.rpc.mock.calls).toEqual([
        ['get_entity_user_data', { p_project_id: PROJECT_ID, p_entity_type: 'candidate', p_entity_id: 'cand-1' }]
      ]);
      // The entity data carries no user, and reading it looks the user up nowhere: no verification round-trip, no session read and no table.
      expect(Object.keys(result ?? {}).sort()).toEqual(['entity', 'nominations']);
      expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
      expect(mockSupabase.auth.getSession).not.toHaveBeenCalled();
      expect(tablesReached(mockSupabase)).toEqual([]);
      expect(result?.entity).toMatchObject({
        type: 'candidate',
        id: 'cand-1',
        firstName: 'Test',
        lastName: 'Candidate'
      });
      expect(result?.entity.answers).toEqual({ q1: { value: 3 } });
      expect(result?.nominations).toBeUndefined();
    });

    /** The row the one-entity read answers with for the candidate `cand-1` of this adapter's project. */
    function candidateRow() {
      return {
        id: 'cand-1',
        project_id: PROJECT_ID,
        name: { en: 'Test Candidate' },
        short_name: null,
        info: null,
        color: null,
        image: null,
        sort_order: 1,
        subtype: null,
        custom_data: null,
        answers: {},
        first_name: 'Test',
        last_name: 'Candidate'
      };
    }

    /**
     * Read the candidate with its nominations, the function answering with `answer`.
     * @param answer - What `get_entity_nominations` resolves with.
     * @param locale - The locale to read in.
     * @returns The pending read.
     */
    function readWithNominations(answer: { data: unknown; error: unknown }, locale = 'en') {
      setupContestantSession();
      mockEntityRpcs(mockSupabase, { row: { data: candidateRow(), error: null }, nominations: answer });
      return writer.getEntityUserData({ type: 'candidate', id: 'cand-1', loadNominations: true, locale });
    }

    it('reads the nominations through get_entity_nominations, naming the project, the type and the id', async () => {
      await readWithNominations({ data: [nominationRow()], error: null });

      expect(mockSupabase.rpc.mock.calls).toEqual([
        ['get_entity_user_data', { p_project_id: PROJECT_ID, p_entity_type: 'candidate', p_entity_id: 'cand-1' }],
        ['get_entity_nominations', { p_project_id: PROJECT_ID, p_entity_type: 'candidate', p_entity_id: 'cand-1' }]
      ]);
    });

    it('issues no query on the nominations table, or on any table, when it loads an entity with its nominations', async () => {
      const result = await readWithNominations({ data: [nominationRow()], error: null });

      expect(result?.nominations).toHaveLength(1);
      expect(tablesReached(mockSupabase)).toEqual([]);
    });

    it('returns a flat list of nominations, each with its names in the requested locale, its state and its parent', async () => {
      const result = await readWithNominations({ data: [nominationRow()], error: null }, 'fi');

      expect(result?.nominations).toEqual([
        {
          id: 'nom-1',
          electionId: 'el-1',
          electionName: 'Vaalit',
          constituencyId: 'co-1',
          constituencyName: 'Vaalipiiri',
          electionRound: 2,
          electionSymbol: '42',
          confirmed: true,
          customData: { requestedParentOrganization: 'A party' },
          updatedAt: '2026-10-01T12:00:00.123456+00:00',
          parent: { entityType: 'organization', entityId: 'org-1', name: 'Puolue', shortName: 'P' }
        }
      ]);
    });

    it('falls back to the default locale for a name the requested locale does not hold', async () => {
      const result = await readWithNominations(
        {
          data: [
            nominationRow({
              election_name: { en: 'Election' },
              constituency_name: { en: 'Constituency' },
              parent: {
                entity_type: 'alliance',
                entity_id: 'all-1',
                name: { en: 'The Alliance' },
                short_name: { en: 'TA' }
              }
            })
          ],
          error: null
        },
        'fi'
      );

      expect(result?.nominations).toMatchObject([
        {
          electionName: 'Election',
          constituencyName: 'Constituency',
          parent: { entityType: 'alliance', entityId: 'all-1', name: 'The Alliance', shortName: 'TA' }
        }
      ]);
    });

    it('reads a round that is not stored as 1, a symbol that is not stored as empty, and states no parent for a row without one', async () => {
      const result = await readWithNominations({
        data: [
          nominationRow({
            election_round: null,
            election_symbol: null,
            confirmed: false,
            custom_data: null,
            parent: null
          })
        ],
        error: null
      });

      expect(result?.nominations).toEqual([
        {
          id: 'nom-1',
          electionId: 'el-1',
          electionName: 'Election',
          constituencyId: 'co-1',
          constituencyName: 'Constituency',
          electionRound: 1,
          electionSymbol: '',
          confirmed: false,
          customData: null,
          updatedAt: '2026-10-01T12:00:00.123456+00:00'
        }
      ]);
      expect(Object.hasOwn(result?.nominations[0] ?? {}, 'parent')).toBe(false);
    });

    it('states no short name for a parent that stores none', async () => {
      const result = await readWithNominations({
        data: [
          nominationRow({
            parent: { entity_type: 'organization', entity_id: 'org-1', name: { en: 'The Party' }, short_name: null }
          })
        ],
        error: null
      });

      expect(result?.nominations[0]?.parent).toEqual({
        entityType: 'organization',
        entityId: 'org-1',
        name: 'The Party'
      });
    });

    it('keeps the order the function listed the nominations in', async () => {
      const result = await readWithNominations({
        data: [nominationRow({ id: 'nom-b' }), nominationRow({ id: 'nom-a' }), nominationRow({ id: 'nom-c' })],
        error: null
      });

      expect(result?.nominations).toHaveLength(3);
      expect(result?.nominations).toMatchObject([{ id: 'nom-b' }, { id: 'nom-a' }, { id: 'nom-c' }]);
    });

    it('returns the entity with an empty list for an entity that has no nomination', async () => {
      const result = await readWithNominations({ data: [], error: null });

      expect(result?.entity).toMatchObject({ type: 'candidate', id: 'cand-1' });
      expect(result?.nominations).toEqual([]);
    });

    it('resolves to no user data for a refused nominations read, and not to an entity with an empty list', async () => {
      await expect(readWithNominations({ data: null, error: null })).resolves.toBeUndefined();
    });

    it('rejects when the nominations call fails', async () => {
      await expect(readWithNominations({ data: null, error: { message: 'permission denied' } })).rejects.toThrow(
        'Failed to load nominations: permission denied'
      );
    });

    it('rejects a malformed nominations answer instead of reading it as an empty list, and repeats no stored value', async () => {
      const secret = 'value-that-must-not-be-in-the-message';
      const error = await readWithNominations({
        data: [nominationRow({ confirmed: secret })],
        error: null
      }).catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('0.confirmed');
      expect((error as Error).message).not.toContain(secret);
    });

    it('rejects a nominations answer that is not a list', async () => {
      await expect(readWithNominations({ data: { nominations: [] }, error: null })).rejects.toThrow(
        /did not match its schema/
      );
    });

    it('makes no nominations call when the entity read answers with no row', async () => {
      setupContestantSession();
      mockEntityRpcs(mockSupabase, { row: { data: null, error: null }, nominations: { data: [], error: null } });

      await expect(
        writer.getEntityUserData({ type: 'candidate', id: 'cand-1', loadNominations: true })
      ).resolves.toBeUndefined();
      expect(mockSupabase.rpc.mock.calls.map(([name]) => name)).toEqual(['get_entity_user_data']);
    });

    it.each([
      ['false', false],
      ['left out', undefined]
    ])('makes no nominations call and returns no list when loadNominations is %s', async (_name, loadNominations) => {
      setupContestantSession();
      mockEntityRpcs(mockSupabase, {
        row: { data: candidateRow(), error: null },
        nominations: { data: [], error: null }
      });

      const result = await writer.getEntityUserData({ type: 'candidate', id: 'cand-1', loadNominations });

      expect(mockSupabase.rpc.mock.calls.map(([name]) => name)).toEqual(['get_entity_user_data']);
      expect(result?.entity.id).toBe('cand-1');
      expect(result?.nominations).toBeUndefined();
    });

    it('rejects when the one-entity read fails', async () => {
      setupContestantSession();
      mockEntityRpcs(mockSupabase, { row: { data: null, error: { message: 'Not found' } } });

      await expect(
        writer.getEntityUserData({ type: 'candidate', id: 'cand-1', loadNominations: false, locale: 'en' })
      ).rejects.toThrow('Failed to load entity data: Not found');
    });
  });

  describe('the generic entity path', () => {
    /**
     * The row the one-entity read answers with for the organization `org-1` of this adapter's project.
     * @returns The row.
     */
    function organizationRow() {
      return {
        id: 'org-1',
        project_id: PROJECT_ID,
        name: { en: 'Test Organization', fi: 'Testijärjestö' },
        short_name: { en: 'TO' },
        info: null,
        color: null,
        image: null,
        sort_order: 1,
        subtype: null,
        custom_data: null,
        answers: { q1: { value: 'stored' } },
        first_name: null,
        last_name: null
      };
    }

    /** Stub a verified session of a user who edits the organization `org-1`. */
    function setupOrganizationSession() {
      mockVerifiedSession(mockSupabase, {
        user: { id: 'user-2', email: 'org@test.com', user_metadata: { language: 'en' } },
        grants: [{ scope: 'entity', target_type: 'organization', target_id: 'org-1', role: 'editor' }]
      });
    }

    /** A small image file, in the file-carrying shape the profile form produces. */
    function imageFile() {
      return new File(['x'], 'logo.png', { type: 'image/png' });
    }

    /**
     * Answer the Storage upload a write makes.
     * @returns The upload mock.
     */
    function mockUpload() {
      const uploadMock = vi.fn().mockResolvedValue({ data: { path: 'uploaded' }, error: null });
      mockSupabase.storage.from.mockReturnValue({ upload: uploadMock });
      return uploadMock;
    }

    it('getUserEntities narrows a mixed answer and returns it in the listed order', async () => {
      mockEntityRpcs(mockSupabase, {
        list: {
          data: {
            entities: [
              { ...listedOrganization('org-1'), name: { en: 'Org', fi: 'Järjestö' }, short_name: { fi: 'J' } },
              { ...listedCandidate('cand-1'), confirmed: false, image: { path: 'p/candidates/cand-1/a.png' } }
            ]
          },
          error: null
        },
        row: { data: null, error: null }
      });

      const result = await writer.getUserEntities({ locale: 'fi' });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_entities', { p_project_id: PROJECT_ID });
      expect(result).toEqual([
        { type: 'organization', id: 'org-1', name: 'Järjestö', shortName: 'J', confirmed: true },
        {
          type: 'candidate',
          id: 'cand-1',
          firstName: 'Test',
          lastName: 'Candidate',
          image: { url: 'http://localhost:54321/storage/v1/object/public/public-assets/p/candidates/cand-1/a.png' },
          confirmed: false
        }
      ]);
    });

    it('getUserEntities hands on a stored colour parsed and adjusted for contrast, with a dark colour beside it', async () => {
      mockEntityRpcs(mockSupabase, {
        list: {
          data: {
            entities: [
              { ...listedOrganization('org-1'), color: { normal: '#FFFFFF' } },
              { ...listedOrganization('org-2'), color: { normal: '#000', dark: '#FFF' } }
            ]
          },
          error: null
        },
        row: { data: null, error: null }
      });

      const [adjusted, kept] = await writer.getUserEntities();

      // White has too little contrast on the light background, so it is not handed on as stored.
      expect(adjusted.color?.normal).toMatch(/^#[0-9a-f]{6}$/);
      expect(adjusted.color?.normal).not.toBe('#ffffff');
      expect(adjusted.color?.dark).toMatch(/^#[0-9a-f]{6}$/);
      expect(kept.color).toEqual({ normal: '#000000', dark: '#ffffff' });
    });

    it.each([
      ['a hex code followed by further CSS', { normal: '#fff; background: url(x)' }],
      ['a colour name', { normal: 'red', dark: '#000000' }],
      ['a string', '#000000']
    ])('getUserEntities hands on no colour for a stored colour that is %s', async (_label, color) => {
      mockEntityRpcs(mockSupabase, {
        list: {
          data: {
            entities: [
              { ...listedOrganization('org-1'), color },
              { ...listedCandidate('cand-1'), color }
            ]
          },
          error: null
        },
        row: { data: null, error: null }
      });

      const { result, records } = await withCapturedLogs(() => writer.getUserEntities());

      expect(result).toHaveLength(2);
      for (const entity of result) expect(entity.color).toBeUndefined();
      expect(JSON.stringify(result)).not.toContain('url(');
      // Each malformed column is reported with its column and row, and never its value.
      expect(records).toHaveLength(2);
      expect(JSON.stringify(records)).not.toContain('url(');
    });

    // The database accepts a colour object with no default-theme colour. It is no colour, and no failure.
    it('getUserEntities hands on no colour, and reports nothing, for a stored colour without a normal colour', async () => {
      mockEntityRpcs(mockSupabase, {
        list: { data: { entities: [{ ...listedOrganization('org-1'), color: { dark: '#000000' } }] }, error: null },
        row: { data: null, error: null }
      });

      const { result, records } = await withCapturedLogs(() => writer.getUserEntities());

      expect(result[0].color).toBeUndefined();
      expect(records).toHaveLength(0);
    });

    it('getUserEntities resolves to an empty array for a user who edits nothing', async () => {
      mockEntityRpcs(mockSupabase, { list: { data: { entities: [] }, error: null }, row: { data: null, error: null } });

      await expect(writer.getUserEntities()).resolves.toEqual([]);
    });

    it('getUserEntities rejects a malformed answer instead of reading it as an empty list', async () => {
      mockEntityRpcs(mockSupabase, {
        list: { data: { entities: [{ entity_type: 'organization', id: 'org-1' }] }, error: null },
        row: { data: null, error: null }
      });

      await expect(writer.getUserEntities()).rejects.toThrow(/did not match its schema at: /);
    });

    it('getUserEntities rejects when the list read fails', async () => {
      mockEntityRpcs(mockSupabase, {
        list: { data: null, error: { message: 'permission denied' } },
        row: { data: null, error: null }
      });

      await expect(writer.getUserEntities()).rejects.toThrow("Failed to list the user's entities: permission denied");
    });

    it('getEntityUserData for an organization stamps its type, carries its name and reads its nominations under its type', async () => {
      setupOrganizationSession();
      mockEntityRpcs(mockSupabase, {
        row: { data: organizationRow(), error: null },
        nominations: { data: [nominationRow({ election_round: 1, election_symbol: null, parent: null })], error: null }
      });

      const result = await writer.getEntityUserData({
        type: 'organization',
        id: 'org-1',
        loadNominations: true,
        locale: 'en'
      });

      expect(mockSupabase.rpc.mock.calls).toEqual([
        ['get_entity_user_data', { p_project_id: PROJECT_ID, p_entity_type: 'organization', p_entity_id: 'org-1' }],
        ['get_entity_nominations', { p_project_id: PROJECT_ID, p_entity_type: 'organization', p_entity_id: 'org-1' }]
      ]);
      expect(result?.entity.type).toBe('organization');
      expect(result?.entity.id).toBe('org-1');
      expect(result?.entity.name).toBe('Test Organization');
      expect(result?.entity.answers).toEqual({ q1: { value: 'stored' } });
      expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
      expect(tablesReached(mockSupabase)).toEqual([]);
      expect(result?.nominations).toEqual([
        {
          id: 'nom-1',
          electionId: 'el-1',
          electionName: 'Election',
          constituencyId: 'co-1',
          constituencyName: 'Constituency',
          electionRound: 1,
          electionSymbol: '',
          confirmed: true,
          customData: { requestedParentOrganization: 'A party' },
          updatedAt: '2026-10-01T12:00:00.123456+00:00'
        }
      ]);
    });

    // The store compares and stages the colour it is given, so it is handed a validated one: a stored value that is no colour reads as no colour.
    it.each([
      ['a dark-theme colour alone', { dark: '#123456' }, null],
      ['a value that is no colour object', 'red', null],
      ['a colour pair', { normal: '#2546a8', dark: '#6b8dd6' }, { normal: '#2546a8', dark: '#6b8dd6' }]
    ])('getEntityUserData hands on %s of the stored colour as parsed', async (_form, stored, expected) => {
      setupOrganizationSession();
      mockEntityRpcs(mockSupabase, {
        row: { data: { ...organizationRow(), color: stored }, error: null },
        nominations: { data: [], error: null }
      });

      const result = await writer.getEntityUserData({ type: 'organization', id: 'org-1', loadNominations: false });

      expect(result?.entity.color ?? null).toEqual(expected);
    });

    it('getEntityUserData for a candidate stamps its type and reads its nominations under its type', async () => {
      setupOrganizationSession();
      mockEntityRpcs(mockSupabase, {
        row: {
          data: { ...organizationRow(), id: 'cand-1', name: null, first_name: 'Test', last_name: 'Candidate' },
          error: null
        },
        nominations: { data: [], error: null }
      });

      const result = await writer.getEntityUserData({ type: 'candidate', id: 'cand-1', loadNominations: true });

      expect(result?.entity.type).toBe('candidate');
      expect(result?.entity).toMatchObject({ firstName: 'Test', lastName: 'Candidate' });
      expect(mockSupabase.rpc).toHaveBeenLastCalledWith('get_entity_nominations', {
        p_project_id: PROJECT_ID,
        p_entity_type: 'candidate',
        p_entity_id: 'cand-1'
      });
      expect(result?.nominations).toEqual([]);
    });

    it('getEntityUserData resolves undefined when the read answers with no row', async () => {
      setupOrganizationSession();
      mockEntityRpcs(mockSupabase, { row: { data: null, error: null } });

      await expect(writer.getEntityUserData({ type: 'organization', id: 'org-9' })).resolves.toBeUndefined();
    });

    it('getEntityUserData rejects when the read fails', async () => {
      setupOrganizationSession();
      mockEntityRpcs(mockSupabase, { row: { data: null, error: { message: 'boom' } } });

      await expect(writer.getEntityUserData({ type: 'organization', id: 'org-1' })).rejects.toThrow(
        'Failed to load entity data: boom'
      );
    });

    it('getEntityUserData rejects a row of another project', async () => {
      setupOrganizationSession();
      mockEntityRpcs(mockSupabase, {
        row: { data: { ...organizationRow(), project_id: '11111111-1111-1111-1111-111111111111' }, error: null }
      });

      await expect(writer.getEntityUserData({ type: 'organization', id: 'org-1' })).rejects.toThrow(
        /^getEntityUserData: the authenticated entity belongs to a different project/
      );
    });

    it('updateAnswers for an organization calls upsert_answers with its type and uploads under its folder', async () => {
      const uploadMock = mockUpload();
      const file = imageFile();
      mockSupabase.rpc.mockResolvedValue({ data: { 'q-text': { value: 'hello' } }, error: null });

      await writer.updateAnswers({
        target: { type: 'organization', id: 'org-1' },
        answers: { 'q-text': { value: 'hello' }, 'q-image': { value: file } }
      });

      expect(uploadMock.mock.calls[0][0]).toMatch(new RegExp(`^${PROJECT_ID}/organizations/org-1/.*\\.png$`));
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'upsert_answers',
        expect.objectContaining({ p_entity_type: 'organization', p_entity_id: 'org-1', p_overwrite: false })
      );
    });

    it('updateEntityProperties for an organization writes the organizations table within the configured project', async () => {
      const uploadMock = mockUpload();
      const storedPath = `${PROJECT_ID}/organizations/org-1/logo.png`;
      mockSupabase._mockResponses['organizations'] = { data: { image: { path: storedPath } }, error: null };

      const result = await writer.updateEntityProperties({
        target: { type: 'organization', id: 'org-1' },
        // reason: the public option type names a stored image, and the file-carrying shape under test is the one the profile form produces.
        properties: { image: { file: imageFile() } as never }
      });

      const [uploadedPath] = uploadMock.mock.calls[0];
      expect(uploadedPath).toMatch(new RegExp(`^${PROJECT_ID}/organizations/org-1/.*\\.png$`));
      expect(tablesReached(mockSupabase)).toEqual(['organizations']);
      expect(mockSupabase._chains.flatMap((entry) => entry.chain.update.mock.calls)).toEqual([
        [{ image: { path: uploadedPath } }]
      ]);
      // The write and its read-back are one chain, filtered by the adapter's project as well as by the id.
      expect(eqCallsFor(mockSupabase, 'organizations')).toEqual(
        expect.arrayContaining([
          ['project_id', PROJECT_ID],
          ['id', 'org-1']
        ])
      );
      expect(result).toEqual({
        type: 'saved',
        properties: { image: { url: `http://localhost:54321/storage/v1/object/public/public-assets/${storedPath}` } },
        localizedNames: {}
      });
    });

    it('getEntityUserData for an organization carries its name and short name as stored, by locale', async () => {
      setupOrganizationSession();
      mockEntityRpcs(mockSupabase, { row: { data: organizationRow(), error: null } });

      const result = await writer.getEntityUserData({ type: 'organization', id: 'org-1', locale: 'fi' });

      expect(result?.localizedNames).toEqual({
        name: { en: 'Test Organization', fi: 'Testijärjestö' },
        shortName: { en: 'TO' }
      });
      // The localized strings the pages and the preview read are beside them.
      expect(result?.entity.name).toBe('Testijärjestö');
      expect(result?.entity.shortName).toBe('TO');
    });

    it('getEntityUserData for an organization carries null for a stored name column that holds nothing', async () => {
      setupOrganizationSession();
      mockEntityRpcs(mockSupabase, { row: { data: { ...organizationRow(), short_name: null }, error: null } });

      const result = await writer.getEntityUserData({ type: 'organization', id: 'org-1', locale: 'en' });

      expect(result?.localizedNames).toEqual({
        name: { en: 'Test Organization', fi: 'Testijärjestö' },
        shortName: null
      });
    });

    it('getEntityUserData for a candidate carries no names by locale', async () => {
      mockEntityRpcs(mockSupabase, {
        row: {
          data: { ...organizationRow(), id: 'cand-1', name: null, short_name: null, first_name: 'A', last_name: 'B' },
          error: null
        }
      });

      const result = await writer.getEntityUserData({ type: 'candidate', id: 'cand-1', locale: 'en' });

      expect(result).toBeDefined();
      expect(Object.keys(result ?? {})).not.toContain('localizedNames');
    });

    it('getEntityUserData reports a stored name that is not a localized string, and does not pass it through', async () => {
      setupOrganizationSession();
      mockEntityRpcs(mockSupabase, {
        row: { data: { ...organizationRow(), name: 'A plain string', short_name: { en: 'TO', fi: 42 } }, error: null }
      });

      const { result, records } = await withCapturedLogs(() =>
        writer.getEntityUserData({ type: 'organization', id: 'org-1', locale: 'en' })
      );

      // A scalar holds no entry to keep; an object keeps the entries that are text.
      expect(result?.localizedNames).toEqual({ name: null, shortName: { en: 'TO' } });
      const reported = records.filter((record) => record.severityText === 'ERROR');
      expect(reported.map((record) => record.attributes?.column).sort()).toEqual([
        'organizations.name',
        'organizations.short_name'
      ]);
      // The record names the column and the row, never the stored value.
      expect(JSON.stringify(reported)).not.toContain('A plain string');
    });

    it.each([
      ['updateAnswers', () => writer.updateAnswers({ target: { type: 'faction', id: 'f-1' }, answers: {} })],
      ['overwriteAnswers', () => writer.overwriteAnswers({ target: { type: 'faction', id: 'f-1' }, answers: {} })],
      [
        'updateEntityProperties',
        () =>
          writer.updateEntityProperties({
            target: { type: 'faction', id: 'f-1' },
            // reason: the public option type names a stored image, and the file-carrying shape under test is the one the profile form produces.
            properties: { image: { file: imageFile() } as never }
          })
      ]
    ])('%s rejects a target of a type the application does not serve, naming the type', async (_name, write) => {
      const uploadMock = mockUpload();

      await expect(write()).rejects.toThrow(/faction/);
      // Refused before anything is sent: no upload, no RPC, no table access.
      expect(uploadMock).not.toHaveBeenCalled();
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
      expect(tablesReached(mockSupabase)).toEqual([]);
    });
  });

  describe('the invitation contract', () => {
    /** The body of the one `account-access` invocation a test made. */
    function invokedBody(): Record<string, unknown> {
      expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(1);
      const [name, options] = mockSupabase.functions.invoke.mock.calls[0] as [
        string,
        { body: Record<string, unknown> }
      ];
      expect(name).toBe('account-access');
      expect(Object.keys(options)).toEqual(['body']);
      return options.body;
    }

    describe('checkInvitationCode', () => {
      it('sends the operation, this adapter project and the code, and resolves to the status', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: { status: 'used' }, error: null });

        const status = await writer.checkInvitationCode({ code: 'ABCD-EFGH-JKLM' });

        expect(status).toBe('used');
        expect(invokedBody()).toStrictEqual({
          code: 'ABCD-EFGH-JKLM',
          operation: 'check-code',
          project_id: PROJECT_ID
        });
      });

      it('throws when the function cannot be reached', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: { message: 'Failed to send a request' } });

        await expect(writer.checkInvitationCode({ code: 'ABCD-EFGH-JKLM' })).rejects.toThrow(
          'account-access check-code: Failed to send a request'
        );
      });

      it('throws for an answer that carries no known status', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: { status: 'expired' }, error: null });

        await expect(writer.checkInvitationCode({ code: 'ABCD-EFGH-JKLM' })).rejects.toThrow(
          /^The answer of account-access check-code did not match its schema/
        );
      });
    });

    describe('requestSignInLink', () => {
      it('sends an address and the locale, and nothing for the code that was not given', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: { accepted: true }, error: null });

        const result = await writer.requestSignInLink({ email: 'invited@example.com', locale: 'fi' });

        expect(result).toStrictEqual({ type: 'success' });
        expect(invokedBody()).toStrictEqual({
          email: 'invited@example.com',
          locale: 'fi',
          operation: 'request-link',
          project_id: PROJECT_ID
        });
      });

      it('sends a code and the locale, and nothing for the address that was not given', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: { accepted: true }, error: null });

        await writer.requestSignInLink({ code: 'ABCD-EFGH-JKLM', locale: 'en' });

        expect(invokedBody()).toStrictEqual({
          code: 'ABCD-EFGH-JKLM',
          locale: 'en',
          operation: 'request-link',
          project_id: PROJECT_ID
        });
      });

      it('sends both an address and a code when both are given', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: { accepted: true }, error: null });

        await writer.requestSignInLink({ email: 'invited@example.com', code: 'ABCD-EFGH-JKLM', locale: 'sv' });

        expect(invokedBody()).toStrictEqual({
          code: 'ABCD-EFGH-JKLM',
          email: 'invited@example.com',
          locale: 'sv',
          operation: 'request-link',
          project_id: PROJECT_ID
        });
      });

      it('throws when the function answers with an error status', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({
          data: null,
          error: { message: 'Edge Function returned a non-2xx status code' }
        });

        await expect(writer.requestSignInLink({ email: 'invited@example.com', locale: 'en' })).rejects.toThrow(
          'account-access request-link: Edge Function returned a non-2xx status code'
        );
      });

      it('throws for an answer that is not the acceptance', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: { accepted: false }, error: null });

        await expect(writer.requestSignInLink({ email: 'invited@example.com', locale: 'en' })).rejects.toThrow(
          /^The answer of account-access request-link did not match its schema/
        );
      });
    });

    describe('requestPasswordRecovery', () => {
      it('sends the operation, this adapter project, the address and the locale, and nothing else', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: { accepted: true }, error: null });

        await writer.requestPasswordRecovery({ email: 'user@example.com', locale: 'fi' });

        expect(invokedBody()).toStrictEqual({
          email: 'user@example.com',
          locale: 'fi',
          operation: 'request-recovery',
          project_id: PROJECT_ID
        });
      });

      it('resolves to a bare success for the accepted answer', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: { accepted: true }, error: null });

        const result = await writer.requestPasswordRecovery({ email: 'user@example.com', locale: 'en' });

        expect(result).toStrictEqual({ type: 'success' });
      });

      it('resolves to the same bare success when the accepted answer holds more than the acceptance', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: { accepted: true, mail: 'recovery' }, error: null });

        const result = await writer.requestPasswordRecovery({ email: 'user@example.com', locale: 'en' });

        expect(result).toStrictEqual({ type: 'success' });
      });

      it('throws when the function cannot be reached', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: { message: 'Failed to send a request' } });

        await expect(writer.requestPasswordRecovery({ email: 'user@example.com', locale: 'en' })).rejects.toThrow(
          'account-access request-recovery: Failed to send a request'
        );
      });

      it('throws when the function answers with an error status', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({
          data: null,
          error: { message: 'Edge Function returned a non-2xx status code' }
        });

        await expect(writer.requestPasswordRecovery({ email: 'user@example.com', locale: 'en' })).rejects.toThrow(
          'account-access request-recovery: Edge Function returned a non-2xx status code'
        );
      });

      it('throws for an answer that is not the acceptance', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: { accepted: false }, error: null });

        await expect(writer.requestPasswordRecovery({ email: 'user@example.com', locale: 'en' })).rejects.toThrow(
          /^The answer of account-access request-recovery did not match its schema/
        );
      });

      it('throws for an empty answer', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: null });

        await expect(writer.requestPasswordRecovery({ email: 'user@example.com', locale: 'en' })).rejects.toThrow(
          /^The answer of account-access request-recovery did not match its schema/
        );
      });
    });

    describe('requestAddressConfirmation', () => {
      it('sends the operation, this adapter project, the address and the locale, and nothing else', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: { result: 'sent' }, error: null });

        await writer.requestAddressConfirmation({ email: 'typed@example.test', locale: 'fi' });

        expect(mockSupabase.functions.invoke.mock.calls[0][0]).toBe('account-access');
        expect(invokedBody()).toStrictEqual({
          email: 'typed@example.test',
          locale: 'fi',
          operation: 'confirm-address',
          project_id: PROJECT_ID
        });
      });

      it('sends no header of its own, so the call carries the session of the client it is made on', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: { result: 'sent' }, error: null });

        await writer.requestAddressConfirmation({ email: 'typed@example.test', locale: 'en' });

        expect(Object.keys(mockSupabase.functions.invoke.mock.calls[0][1])).toEqual(['body']);
      });

      it.each(['sent', 'in-use', 'refused'] as const)('answers %s as the function answers it', async (result) => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: { result }, error: null });

        expect(await writer.requestAddressConfirmation({ email: 'typed@example.test', locale: 'en' })).toBe(result);
      });

      it.each([
        ['an unknown result', { result: 'accepted' }],
        ['the unauthenticated body', { error: 'unauthenticated' }],
        ['an empty body', null],
        ['a result that is not a string', { result: true }]
      ])('answers refused for %s', async (_label, data) => {
        mockSupabase.functions.invoke.mockResolvedValue({ data, error: null });

        expect(await writer.requestAddressConfirmation({ email: 'typed@example.test', locale: 'en' })).toBe('refused');
      });

      it.each([
        ['a 401', { message: 'Edge Function returned a non-2xx status code', context: { status: 401 } }],
        ['a function that cannot be reached', { message: 'Failed to send a request' }]
      ])('answers refused, never a rejection, for %s', async (_label, error) => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: null, error });

        expect(await writer.requestAddressConfirmation({ email: 'typed@example.test', locale: 'en' })).toBe('refused');
      });

      it('answers refused when the call itself rejects', async () => {
        mockSupabase.functions.invoke.mockRejectedValue(new Error('network down'));

        expect(await writer.requestAddressConfirmation({ email: 'typed@example.test', locale: 'en' })).toBe('refused');
      });

      it('logs a failure without the address', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: { message: 'Failed to send a request' } });

        const { result, records } = await withCapturedLogs(() =>
          writer.requestAddressConfirmation({ email: 'typed@example.test', locale: 'en' })
        );

        expect(result).toBe('refused');
        expect(records.length).toBeGreaterThan(0);
        expect(JSON.stringify(records)).not.toContain('typed@example.test');
      });
    });

    describe('signInWithInvitationCode', () => {
      const ACCESS_TOKEN = 'access-token-that-must-stay-inside-the-auth-client';
      const REFRESH_TOKEN = 'refresh-token-that-must-stay-inside-the-auth-client';

      it('sends the operation, this adapter project, the code and the password', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: { result: 'invalid-credentials' }, error: null });

        await writer.signInWithInvitationCode({ code: 'ABCD-EFGH-JKLM', password: 'a password' });

        expect(invokedBody()).toStrictEqual({
          code: 'ABCD-EFGH-JKLM',
          password: 'a password',
          operation: 'code-sign-in',
          project_id: PROJECT_ID
        });
      });

      it('sets the session once with the two tokens, and its result and its log hold neither', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({
          data: { result: 'signed-in', access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN },
          error: null
        });
        mockSupabase.auth.setSession.mockResolvedValue({ data: { session: {}, user: {} }, error: null });

        // Captured from the lowest level, so a token in a debug line would be seen.
        const records: Array<LogRecord> = [];
        configureLogger({ level: 'debug', sink: (record) => records.push(record) });
        const result = await writer
          .signInWithInvitationCode({ code: 'ABCD-EFGH-JKLM', password: 'a password' })
          .finally(() => configureLogger({ level: 'silent', sink: undefined }));

        expect(mockSupabase.auth.setSession).toHaveBeenCalledTimes(1);
        expect(mockSupabase.auth.setSession.mock.calls[0]).toStrictEqual([
          { access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN }
        ]);
        expect(result).toStrictEqual({ type: 'success' });
        expect(JSON.stringify(result)).not.toContain(ACCESS_TOKEN);
        expect(JSON.stringify(result)).not.toContain(REFRESH_TOKEN);
        expect(JSON.stringify(records)).not.toContain(ACCESS_TOKEN);
        expect(JSON.stringify(records)).not.toContain(REFRESH_TOKEN);
      });

      it('resolves to a failure for the refusal, and sets no session', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: { result: 'invalid-credentials' }, error: null });

        const result = await writer.signInWithInvitationCode({ code: 'ABCD-EFGH-JKLM', password: 'wrong' });

        expect(result).toStrictEqual({ type: 'failure' });
        expect(mockSupabase.auth.setSession).not.toHaveBeenCalled();
      });

      it('throws when the session cannot be set, and the message holds neither token', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({
          data: { result: 'signed-in', access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN },
          error: null
        });
        mockSupabase.auth.setSession.mockResolvedValue({
          data: { session: null, user: null },
          error: { message: 'Auth session missing!' }
        });

        const error = await writer
          .signInWithInvitationCode({ code: 'ABCD-EFGH-JKLM', password: 'a password' })
          .catch((e: Error) => e);

        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('signInWithInvitationCode: Auth session missing!');
        expect((error as Error).message).not.toContain(ACCESS_TOKEN);
        expect((error as Error).message).not.toContain(REFRESH_TOKEN);
      });

      it('throws for a signed-in answer with an empty token, sets no session and repeats no token', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({
          data: { result: 'signed-in', access_token: ACCESS_TOKEN, refresh_token: '' },
          error: null
        });

        const error = await writer
          .signInWithInvitationCode({ code: 'ABCD-EFGH-JKLM', password: 'a password' })
          .catch((e: Error) => e);

        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toMatch(/^The answer of account-access code-sign-in did not match its schema/);
        expect((error as Error).message).not.toContain(ACCESS_TOKEN);
        expect(mockSupabase.auth.setSession).not.toHaveBeenCalled();
      });

      it('throws when the function cannot be reached, and sets no session', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: { message: 'Failed to send a request' } });

        await expect(
          writer.signInWithInvitationCode({ code: 'ABCD-EFGH-JKLM', password: 'a password' })
        ).rejects.toThrow('account-access code-sign-in: Failed to send a request');
        expect(mockSupabase.auth.setSession).not.toHaveBeenCalled();
      });
    });

    describe('claimInvitations', () => {
      const claimed = { scope: 'entity', target_type: 'candidate', target_id: 'cand-1', role: 'editor' };
      const skipped = { scope: 'entity', target_type: 'candidate', target_id: 'cand-2', role: 'editor' };

      it('names this adapter project and passes nothing else', async () => {
        mockSupabase.rpc.mockResolvedValue({ data: { claimed: [], skipped: [], password_set: true }, error: null });

        await writer.claimInvitations();

        expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
        const [name, args] = mockSupabase.rpc.mock.calls[0] as [string, Record<string, unknown>];
        expect(name).toBe('claim_invitations');
        expect(Object.keys(args)).toEqual(['p_project_id']);
        expect(args.p_project_id).toBe(PROJECT_ID);
        expect(mockSupabase.rpc.mock.calls[0]).toHaveLength(2);
      });

      it('narrows the answer to the grants written, the promises left open and the password state', async () => {
        mockSupabase.rpc.mockResolvedValue({
          data: { claimed: [claimed], skipped: [{ ...skipped, reason: 'candidate_has_editor' }], password_set: false },
          error: null
        });

        expect(await writer.claimInvitations()).toStrictEqual({
          claimed: [claimed],
          skipped: [{ ...skipped, reason: 'candidate_has_editor' }],
          passwordSet: false
        });
      });

      it('throws the database error, so a failed claim is never an empty one', async () => {
        mockSupabase.rpc.mockResolvedValue({
          data: null,
          error: { message: 'permission denied for function claim_invitations' }
        });

        await expect(writer.claimInvitations()).rejects.toThrow(
          'claimInvitations: permission denied for function claim_invitations'
        );
      });

      it('throws for an answer of another shape', async () => {
        mockSupabase.rpc.mockResolvedValue({ data: { claimed: [] }, error: null });

        await expect(writer.claimInvitations()).rejects.toThrow(
          /^The answer of claim_invitations did not match its schema/
        );
      });
    });
  });

  describe('updateEntityProperties', () => {
    // The stored form of an image, and the application `Image` the adapter derives from it.
    const STORED_IMAGE = { path: `${PROJECT_ID}/candidates/entity-1/portrait.png` };
    const DERIVED_IMAGE = { url: `http://localhost:54321/storage/v1/object/public/public-assets/${STORED_IMAGE.path}` };

    /**
     * Answer the Storage upload the image write makes.
     * @returns The upload mock.
     */
    function mockUpload() {
      const uploadMock = vi.fn().mockResolvedValue({ data: { path: 'uploaded' }, error: null });
      mockSupabase.storage.from.mockReturnValue({ upload: uploadMock });
      return uploadMock;
    }

    it('uploads the image file, writes the image column alone and returns the image alone', async () => {
      const uploadMock = mockUpload();
      mockSupabase._mockResponses['candidates'] = { data: { image: STORED_IMAGE }, error: null };

      const result = await writer.updateEntityProperties({
        target: { type: 'candidate', id: 'entity-1' },
        // reason: the public option type names a stored image, and the file-carrying shape under test is the one the profile form produces.
        properties: { image: { file: new File(['x'], 'p.png', { type: 'image/png' }) } as never }
      });

      const [storagePath] = uploadMock.mock.calls[0];
      const updateCalls = mockSupabase._chains.flatMap((entry) => entry.chain.update.mock.calls);
      expect(updateCalls).toEqual([[{ image: { path: storagePath } }]]);
      // The row is read back for its image and for no other column.
      expect(mockSupabase._chains.flatMap((entry) => entry.chain.select.mock.calls)).toEqual([['image']]);
      expect(result).toEqual({ type: 'saved', properties: { image: DERIVED_IMAGE }, localizedNames: {} });
    });

    it('clears the image column on null, uploads nothing and returns no image', async () => {
      const uploadMock = mockUpload();
      mockSupabase._mockResponses['candidates'] = { data: { image: null }, error: null };

      const result = await writer.updateEntityProperties({
        target: { type: 'candidate', id: 'entity-1' },
        properties: { image: null }
      });

      expect(uploadMock).not.toHaveBeenCalled();
      const updateCalls = mockSupabase._chains.flatMap((entry) => entry.chain.update.mock.calls);
      expect(updateCalls).toEqual([[{ image: null }]]);
      expect(mockSupabase._chains.flatMap((entry) => entry.chain.select.mock.calls)).toEqual([['image']]);
      expect(result).toEqual({ type: 'saved', properties: { image: null }, localizedNames: {} });
    });

    it('throws on PostgREST error', async () => {
      mockUpload();
      mockSupabase._mockResponses['candidates'] = { data: null, error: { message: 'Row not found' } };

      await expect(
        writer.updateEntityProperties({
          target: { type: 'candidate', id: 'bad-id' },
          // reason: the public option type names a stored image, and the file-carrying shape under test is the one the profile form produces.
          properties: { image: { file: new File(['x'], 'p.png', { type: 'image/png' }) } as never }
        })
      ).rejects.toThrow('updateEntityProperties: Row not found');
    });

    it('refuses an image whose file is not a File, and uploads and writes nothing', async () => {
      const uploadMock = mockUpload();

      await expect(
        writer.updateEntityProperties({
          target: { type: 'candidate', id: 'entity-1' },
          // reason: a non-`File` `file` is the state under test and the public option type cannot name it.
          properties: { image: { file: 'not-a-File-instance' } as never }
        })
      ).rejects.toThrow(/^updateEntityProperties: the image carries no file$/);

      expect(uploadMock).not.toHaveBeenCalled();
      expect(tablesReached(mockSupabase)).toEqual([]);
    });

    it.each([
      ['no property at all', {}],
      ['properties that are all undefined', { image: undefined, name: undefined }]
    ])('refuses a call that carries %s, naming the method', (_shape, properties) => {
      expect(() =>
        writer.updateEntityProperties({ target: { type: 'organization', id: 'entity-1' }, properties })
      ).toThrow(/^updateEntityProperties: /);
      expect(tablesReached(mockSupabase)).toEqual([]);
    });

    it('refuses an image that carries no file, whatever else the call carries', () => {
      const uploadMock = mockUpload();

      expect(() =>
        writer.updateEntityProperties({
          target: { type: 'organization', id: 'entity-1' },
          properties: { image: { url: 'https://example.test/logo.png' }, name: { en: 'Name' } }
        })
      ).toThrow(/^updateEntityProperties: .*image/);
      expect(uploadMock).not.toHaveBeenCalled();
      expect(tablesReached(mockSupabase)).toEqual([]);
    });
  });

  describe('updateEntityProperties, the properties of each entity type', () => {
    const ORGANIZATION = { type: 'organization', id: 'org-1' } as const;
    const CANDIDATE = { type: 'candidate', id: 'cand-1' } as const;
    /** How the database's refusal of a changed name on a confirmed row begins. */
    const NAME_REFUSAL =
      'Entity name is immutable once confirmed: column public.organizations.name on row org-1 cannot be changed (current: {"en": "Old"}, attempted: {"en": "New"}); changing it requires the entity.edit_immutable permission';

    /**
     * Answer the Storage upload the image write makes.
     * @returns The upload mock.
     */
    function mockUpload() {
      const uploadMock = vi.fn().mockResolvedValue({ data: { path: 'uploaded' }, error: null });
      mockSupabase.storage.from.mockReturnValue({ upload: uploadMock });
      return uploadMock;
    }

    /**
     * The payload of every update issued, across every table.
     * @returns One entry per `.update()` call, each holding the call's arguments.
     */
    function updateCalls(): Array<Array<unknown>> {
      return mockSupabase._chains.flatMap((entry) => entry.chain.update.mock.calls as Array<Array<unknown>>);
    }

    /**
     * The columns each read-back asked for, sorted, so a case states which columns were read and not their order.
     * @returns One sorted column list per `.select()` call.
     */
    function selectedColumns(): Array<Array<string>> {
      return mockSupabase._chains
        .flatMap((entry) => entry.chain.select.mock.calls as Array<[string]>)
        .map(([columns]) =>
          columns
            .split(',')
            .map((column) => column.trim())
            .sort()
        );
    }

    it('writes an organization name given alone as one update of the name column, and returns it in both forms', async () => {
      const name = { en: 'New name', fi: 'Uusi nimi' };
      mockSupabase._mockResponses['organizations'] = { data: { name }, error: null };

      const result = await writer.updateEntityProperties({ target: ORGANIZATION, properties: { name }, locale: 'fi' });

      expect(tablesReached(mockSupabase)).toEqual(['organizations']);
      expect(updateCalls()).toEqual([[{ name }]]);
      expect(selectedColumns()).toEqual([['name']]);
      expect(result).toEqual({ type: 'saved', properties: { name: 'Uusi nimi' }, localizedNames: { name } });
    });

    it('returns the written name in the default locale when the call names none', async () => {
      const name = { en: 'New name', fi: 'Uusi nimi' };
      mockSupabase._mockResponses['organizations'] = { data: { name }, error: null };

      const result = await writer.updateEntityProperties({ target: ORGANIZATION, properties: { name } });

      expect(result).toEqual({ type: 'saved', properties: { name: 'New name' }, localizedNames: { name } });
    });

    it('writes a colour as lowercase #rrggbb under normal and nothing else', async () => {
      mockSupabase._mockResponses['organizations'] = { data: { color: { normal: '#2546a8' } }, error: null };

      const result = await writer.updateEntityProperties({
        target: ORGANIZATION,
        properties: { color: { normal: '#2546A8' } }
      });

      expect(updateCalls()).toEqual([[{ color: { normal: '#2546a8' } }]]);
      expect(selectedColumns()).toEqual([['color']]);
      expect(result).toEqual({ type: 'saved', properties: { color: { normal: '#2546a8' } }, localizedNames: {} });
    });

    it('writes a three-digit colour in its six-digit form', async () => {
      mockSupabase._mockResponses['organizations'] = { data: { color: { normal: '#00aa00' } }, error: null };

      await writer.updateEntityProperties({ target: ORGANIZATION, properties: { color: { normal: '#0A0' } } });

      expect(updateCalls()).toEqual([[{ color: { normal: '#00aa00' } }]]);
    });

    it('clears the colour when the colour given is null', async () => {
      mockSupabase._mockResponses['organizations'] = { data: { color: null }, error: null };

      const result = await writer.updateEntityProperties({ target: ORGANIZATION, properties: { color: null } });

      expect(updateCalls()).toEqual([[{ color: null }]]);
      expect(result).toEqual({ type: 'saved', properties: { color: null }, localizedNames: {} });
    });

    it('does not name the colour column when no colour is given, so a stored pair is left as it is', async () => {
      mockSupabase._mockResponses['organizations'] = { data: { short_name: { en: 'NN' } }, error: null };

      await writer.updateEntityProperties({
        target: ORGANIZATION,
        properties: { shortName: { en: 'NN' }, color: undefined }
      });

      expect(updateCalls()).toEqual([[{ short_name: { en: 'NN' } }]]);
      expect(Object.keys(updateCalls()[0][0] as object)).toEqual(['short_name']);
      expect(selectedColumns()).toEqual([['short_name']]);
    });

    it('writes a name, a short name, a colour and a logo as one update of four columns, after the upload', async () => {
      const uploadMock = mockUpload();
      const name = { en: 'New name' };
      const shortName = { en: 'NN' };
      const storedPath = `${PROJECT_ID}/organizations/org-1/logo.png`;
      mockSupabase._mockResponses['organizations'] = {
        data: { name, short_name: shortName, color: { normal: '#2546a8' }, image: { path: storedPath } },
        error: null
      };

      const result = await writer.updateEntityProperties({
        target: ORGANIZATION,
        properties: {
          name,
          shortName,
          color: { normal: '#2546a8' },
          // reason: the public option type names a stored image, and the file-carrying shape under test is the one the profile form produces.
          image: { file: new File(['x'], 'logo.png', { type: 'image/png' }) } as never
        }
      });

      const [uploadedPath] = uploadMock.mock.calls[0];
      expect(updateCalls()).toEqual([
        [{ name, short_name: shortName, color: { normal: '#2546a8' }, image: { path: uploadedPath } }]
      ]);
      expect(selectedColumns()).toEqual([['color', 'image', 'name', 'short_name']]);
      const [updateChain] = mockSupabase._chains.filter((entry) => entry.chain.update.mock.calls.length > 0);
      expect(uploadMock.mock.invocationCallOrder[0]).toBeLessThan(updateChain.chain.update.mock.invocationCallOrder[0]);
      expect(result).toEqual({
        type: 'saved',
        properties: {
          name: 'New name',
          shortName: 'NN',
          color: { normal: '#2546a8' },
          image: { url: `http://localhost:54321/storage/v1/object/public/public-assets/${storedPath}` }
        },
        localizedNames: { name, shortName }
      });
    });

    it('trims the entries of a name and drops the blank ones', async () => {
      mockSupabase._mockResponses['organizations'] = { data: { name: { en: 'New name' } }, error: null };

      await writer.updateEntityProperties({
        target: ORGANIZATION,
        properties: { name: { en: '  New name ', fi: '', sv: '   ' } }
      });

      expect(updateCalls()).toEqual([[{ name: { en: 'New name' } }]]);
    });

    it('stores a short name with no entry left as null', async () => {
      mockSupabase._mockResponses['organizations'] = { data: { short_name: null }, error: null };

      const result = await writer.updateEntityProperties({
        target: ORGANIZATION,
        properties: { shortName: { en: '', fi: '  ' } }
      });

      expect(updateCalls()).toEqual([[{ short_name: null }]]);
      expect(result).toEqual({ type: 'saved', properties: { shortName: null }, localizedNames: { shortName: null } });
    });

    it('stores a short name given as null as null', async () => {
      mockSupabase._mockResponses['organizations'] = { data: { short_name: null }, error: null };

      await writer.updateEntityProperties({ target: ORGANIZATION, properties: { shortName: null } });

      expect(updateCalls()).toEqual([[{ short_name: null }]]);
    });

    it('writes a candidate first and last name as one update of the two columns, trimmed', async () => {
      mockSupabase._mockResponses['candidates'] = { data: { first_name: 'Ada', last_name: 'Lovelace' }, error: null };

      const result = await writer.updateEntityProperties({
        target: CANDIDATE,
        properties: { firstName: ' Ada ', lastName: 'Lovelace' }
      });

      expect(tablesReached(mockSupabase)).toEqual(['candidates']);
      expect(updateCalls()).toEqual([[{ first_name: 'Ada', last_name: 'Lovelace' }]]);
      expect(selectedColumns()).toEqual([['first_name', 'last_name']]);
      expect(result).toEqual({
        type: 'saved',
        properties: { firstName: 'Ada', lastName: 'Lovelace' },
        localizedNames: {}
      });
    });

    it.each([
      ['a colour for a candidate', CANDIDATE, { color: { normal: '#2546a8' } }, /color.*candidate/],
      ['a name for a candidate', CANDIDATE, { name: { en: 'Name' } }, /name.*candidate/],
      ['a first name for an organization', ORGANIZATION, { firstName: 'Ada' }, /firstName.*organization/],
      ['a subtype', ORGANIZATION, { subtype: 'party' }, /subtype.*organization/],
      ['the confirmation flag', CANDIDATE, { confirmed: true }, /confirmed.*candidate/],
      ['a property every object inherits', ORGANIZATION, { constructor: 'x' }, /constructor.*organization/]
    ])('refuses %s by name, before any request', async (_shape, target, properties, message) => {
      const uploadMock = mockUpload();

      await expect(
        // reason: a property outside the public option type is the state under test.
        writer.updateEntityProperties({ target, properties: properties as never })
      ).rejects.toThrow(message);
      expect(uploadMock).not.toHaveBeenCalled();
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
      expect(tablesReached(mockSupabase)).toEqual([]);
    });

    it('refuses a property outside the map even when a property inside it is given too, and uploads nothing', async () => {
      const uploadMock = mockUpload();

      await expect(
        writer.updateEntityProperties({
          target: CANDIDATE,
          properties: {
            color: { normal: '#2546a8' },
            // reason: the public option type names a stored image, and the file-carrying shape under test is the one the profile form produces.
            image: { file: new File(['x'], 'p.png', { type: 'image/png' }) } as never
          }
        })
      ).rejects.toThrow(/color.*candidate/);
      expect(uploadMock).not.toHaveBeenCalled();
      expect(tablesReached(mockSupabase)).toEqual([]);
    });

    it.each([
      ['a colour name', { normal: 'red' }],
      ['functional notation', { normal: 'rgb(37, 70, 168)' }],
      ['a hex code followed by further text', { normal: '#fff; background: url(x)' }],
      ['a hex code without its hash', { normal: '2546a8' }],
      ['four digits', { normal: '#2546' }],
      ['surrounding whitespace', { normal: ' #2546a8 ' }],
      ['an empty string', { normal: '' }],
      ['a pair with a dark colour', { normal: '#2546a8', dark: '#ffffff' }],
      ['an object without normal', {}],
      ['a bare string', '#2546a8']
    ])('refuses a colour that is %s, naming the property, before any request', async (_shape, color) => {
      const uploadMock = mockUpload();

      await expect(
        writer.updateEntityProperties({
          target: ORGANIZATION,
          properties: {
            // reason: a colour outside the public option type is the state under test.
            color: color as never,
            // reason: the public option type names a stored image, and the file-carrying shape under test is the one the profile form produces.
            image: { file: new File(['x'], 'logo.png', { type: 'image/png' }) } as never
          }
        })
      ).rejects.toThrow(/^updateEntityProperties: .*color/);
      expect(uploadMock).not.toHaveBeenCalled();
      expect(tablesReached(mockSupabase)).toEqual([]);
    });

    it.each([
      ['a name that is a string', { name: 'Name' }, /name/],
      ['a short name that is a list', { shortName: ['NN'] }, /shortName/]
    ])('refuses %s, naming the property, before any request', async (_shape, properties, message) => {
      await expect(
        // reason: a name outside the public option type is the state under test.
        writer.updateEntityProperties({ target: ORGANIZATION, properties: properties as never })
      ).rejects.toThrow(message);
      expect(tablesReached(mockSupabase)).toEqual([]);
    });

    it('refuses a first name that is not text, naming the property, before any request', async () => {
      await expect(
        // reason: a name outside the public option type is the state under test.
        writer.updateEntityProperties({ target: CANDIDATE, properties: { firstName: 42 } as never })
      ).rejects.toThrow(/firstName/);
      expect(tablesReached(mockSupabase)).toEqual([]);
    });

    it('resolves to the name-refused result when the database refuses a changed name, and does not throw', async () => {
      mockSupabase._mockResponses['organizations'] = {
        data: null,
        error: { code: 'P0001', message: NAME_REFUSAL, details: null, hint: null }
      };

      const result = await writer.updateEntityProperties({
        target: ORGANIZATION,
        properties: { name: { en: 'New' } }
      });

      expect(result).toEqual({ type: 'nameRefused' });
      // The raised text names the row and both values, and none of it is in the result.
      expect(JSON.stringify(result)).not.toContain('org-1');
    });

    it.each([
      [
        'the same code with another message',
        { code: 'P0001', message: 'Invalid entity color: column public.organizations.color on row org-1' }
      ],
      ['the same message under another code', { code: '42501', message: NAME_REFUSAL }],
      ['the same message with no code', { message: NAME_REFUSAL }],
      ['the refusal quoted inside another message', { code: 'P0001', message: `Failed: ${NAME_REFUSAL}` }]
    ])('throws for %s, naming the method', async (_shape, error) => {
      mockSupabase._mockResponses['organizations'] = { data: null, error };

      await expect(
        writer.updateEntityProperties({ target: ORGANIZATION, properties: { name: { en: 'New' } } })
      ).rejects.toThrow(/^updateEntityProperties: /);
    });

    it('reports a read-back name that is not a localized string, and returns nothing for it', async () => {
      mockSupabase._mockResponses['organizations'] = { data: { name: 42 }, error: null };

      const { result, records } = await withCapturedLogs(() =>
        writer.updateEntityProperties({ target: ORGANIZATION, properties: { name: { en: 'New name' } } })
      );

      expect(result).toEqual({ type: 'saved', properties: { name: '' }, localizedNames: { name: null } });
      expect(
        records.filter((record) => record.severityText === 'ERROR').map((record) => record.attributes?.column)
      ).toEqual(['organizations.name']);
    });

    it('reports a read-back colour that is not a hex colour, and returns nothing for it', async () => {
      mockSupabase._mockResponses['organizations'] = { data: { color: { normal: 'red' } }, error: null };

      const { result, records } = await withCapturedLogs(() =>
        writer.updateEntityProperties({ target: ORGANIZATION, properties: { color: { normal: '#2546a8' } } })
      );

      expect(result).toEqual({ type: 'saved', properties: { color: null }, localizedNames: {} });
      expect(
        records.filter((record) => record.severityText === 'ERROR').map((record) => record.attributes?.column)
      ).toEqual(['organizations.color']);
    });

    it('filters a name update by project as well as by id', async () => {
      mockSupabase._mockResponses['organizations'] = { data: { name: { en: 'New name' } }, error: null };

      await writer.updateEntityProperties({ target: ORGANIZATION, properties: { name: { en: 'New name' } } });

      expect(updateCalls()).toHaveLength(1);
      const calls = eqCallsFor(mockSupabase, 'organizations');
      expect(calls).toContainEqual(['project_id', PROJECT_ID]);
      expect(calls).toContainEqual(['id', 'org-1']);
      expect(tablesReached(mockSupabase)).toEqual(['organizations']);
    });
  });

  /**
   * The project this writer works in comes from configuration, once, and every table access names it.
   *
   * Each case here has two halves, and both matter. The POSITIVE half asserts the project filter or the project id actually reached the call. The NEGATIVE half counts the tables reached, because an extra round-trip is observable only as an extra table reached — an assertion that merely checked the filter would still pass with an extra query in place.
   */
  describe('setEntityNominations', () => {
    const CANDIDATE = { type: 'candidate', id: 'cand-1' } as const;
    const ORGANIZATION = { type: 'organization', id: 'org-1' } as const;
    const COUNTS = { inserted: 1, updated: 2, deleted: 3, unchanged: 4, parents_created: 5 };
    /** The whole text the database raises when a removed nomination has nominations listed under it. */
    const LISTED_UNDER_REFUSAL =
      'update or delete on table "nominations" violates foreign key constraint "nominations_parent_nomination_id_fkey" on table "nominations"';
    /** The whole text the database raises for one unconfirmed parent nomination too many. */
    const PENDING_CAP_REFUSAL =
      'A caller may originate at most 10 unconfirmed parent nominations; this caller already holds 10. An administrator must confirm or reject some before more can be created.';
    /** The whole text the database raises when the nominations a set was computed from are no longer those stored. */
    const CHANGED_REFUSAL = 'set_entity_nominations: the nominations have changed since they were read';
    /** The whole text the database raises when the project's answers are locked. */
    const ANSWERS_LOCKED_REFUSAL = 'set_entity_nominations: answers are locked in this project';

    /**
     * One nomination of the kind a page hands the writer: not stored yet, under no parent.
     * @param overrides - Members to state otherwise.
     * @returns The nomination.
     */
    function desired(overrides: Record<string, unknown> = {}) {
      return {
        electionId: 'el-1',
        constituencyId: 'co-1',
        electionSymbol: '7',
        parent: { kind: 'none' as const },
        ...overrides
      };
    }

    /**
     * Answer the next call of the write function.
     * @param answer - What the function resolves with.
     */
    function mockWrite(answer: { data: unknown; error: unknown }) {
      mockSupabase.rpc.mockResolvedValue(answer);
    }

    it('calls set_entity_nominations once, with the type, the id and one object for each nomination', async () => {
      mockWrite({ data: COUNTS, error: null });

      await writer.setEntityNominations({
        readFrom: [],
        target: CANDIDATE,
        nominations: [desired(), desired({ electionId: 'el-2', constituencyId: 'co-2', electionSymbol: '' })]
      });

      expect(mockSupabase.rpc.mock.calls).toEqual([
        [
          'set_entity_nominations',
          {
            p_entity_type: 'candidate',
            p_entity_id: 'cand-1',
            p_nominations: [
              { election_id: 'el-1', constituency_id: 'co-1', election_symbol: '7', parent: { kind: 'none' } },
              { election_id: 'el-2', constituency_id: 'co-2', election_symbol: '', parent: { kind: 'none' } }
            ],
            p_expected_reach: {}
          }
        ]
      ]);
      expect(tablesReached(mockSupabase)).toEqual([]);
    });

    it('states the nominations the set was computed from as the expected reach, each id with the time it was last updated', async () => {
      mockWrite({ data: COUNTS, error: null });

      await writer.setEntityNominations({
        target: CANDIDATE,
        nominations: [desired({ id: 'nom-1' })],
        readFrom: [
          { id: 'nom-1', updatedAt: '2026-10-01T12:00:00.123456+00:00' },
          { id: 'nom-2', updatedAt: '2026-10-02T08:30:00+00:00' }
        ]
      });

      expect(onlyRpcArguments(mockSupabase).p_expected_reach).toEqual({
        'nom-1': '2026-10-01T12:00:00.123456+00:00',
        'nom-2': '2026-10-02T08:30:00+00:00'
      });
    });

    it('resolves to the changed refusal when the nominations have changed since they were read, and returns none of the raised text', async () => {
      mockWrite({ data: null, error: { code: '40001', message: CHANGED_REFUSAL, details: null, hint: null } });

      const result = await writer.setEntityNominations({ target: CANDIDATE, nominations: [desired()], readFrom: [] });

      expect(result).toEqual({ type: 'refused', reason: 'changed' });
      expect(JSON.stringify(result)).not.toContain('set_entity_nominations');
    });

    it('states an id only for a nomination that has one', async () => {
      mockWrite({ data: COUNTS, error: null });

      await writer.setEntityNominations({
        readFrom: [],
        target: CANDIDATE,
        nominations: [desired({ id: 'nom-1' }), desired({ electionId: 'el-2', id: undefined })]
      });

      const sent = onlyRpcArguments(mockSupabase).p_nominations as Array<Record<string, unknown>>;
      expect(sent[0].id).toBe('nom-1');
      expect(Object.hasOwn(sent[1], 'id')).toBe(false);
    });

    it.each([
      ['none', { kind: 'none' }, { kind: 'none' }],
      [
        'entity',
        { kind: 'entity', entityType: 'organization', entityId: 'org-9' },
        { kind: 'entity', entity_type: 'organization', entity_id: 'org-9' }
      ],
      ['other', { kind: 'other', name: 'A party' }, { kind: 'other', name: 'A party' }],
      ['keep', { kind: 'keep' }, { kind: 'keep' }]
    ])(
      'states a parent of the kind %s in the keys of the function, and no other key',
      async (_kind, parent, stated) => {
        mockWrite({ data: COUNTS, error: null });

        await writer.setEntityNominations({
          readFrom: [],
          target: CANDIDATE,
          // reason: the table states each member of the parent union as a plain object.
          nominations: [desired({ id: 'nom-1', parent }) as never]
        });

        expect(onlyRpcArguments(mockSupabase).p_nominations[0].parent).toEqual(stated);
        expect(Object.keys(onlyRpcArguments(mockSupabase).p_nominations[0].parent).sort()).toEqual(
          Object.keys(stated).sort()
        );
      }
    );

    it("writes an organization's nominations under its own type, an alliance named as the parent", async () => {
      mockWrite({ data: COUNTS, error: null });

      await writer.setEntityNominations({
        readFrom: [],
        target: ORGANIZATION,
        nominations: [desired({ parent: { kind: 'entity', entityType: 'alliance', entityId: 'all-1' } })]
      });

      expect(onlyRpcArguments(mockSupabase)).toMatchObject({
        p_entity_type: 'organization',
        p_entity_id: 'org-1',
        p_nominations: [{ parent: { kind: 'entity', entity_type: 'alliance', entity_id: 'all-1' } }]
      });
    });

    it('sends an empty list as an empty array, which removes every nomination', async () => {
      mockWrite({ data: { ...COUNTS, inserted: 0 }, error: null });

      await writer.setEntityNominations({ readFrom: [], target: CANDIDATE, nominations: [] });

      expect(onlyRpcArguments(mockSupabase).p_nominations).toEqual([]);
    });

    it('resolves to the saved result with the five counts of the answer', async () => {
      mockWrite({ data: COUNTS, error: null });

      await expect(
        writer.setEntityNominations({ readFrom: [], target: CANDIDATE, nominations: [desired()] })
      ).resolves.toEqual({
        type: 'saved',
        inserted: 1,
        updated: 2,
        deleted: 3,
        unchanged: 4,
        parentsCreated: 5
      });
    });

    it('resolves to the has-candidates refusal when the parent foreign key refuses the write, and returns none of the raised text', async () => {
      mockWrite({
        data: null,
        error: {
          code: '23503',
          message: LISTED_UNDER_REFUSAL,
          details: 'Key (id)=(nom-secret) is still referenced from table "nominations".',
          hint: null
        }
      });

      const result = await writer.setEntityNominations({ readFrom: [], target: ORGANIZATION, nominations: [] });

      expect(result).toEqual({ type: 'refused', reason: 'hasCandidates' });
      expect(JSON.stringify(result)).not.toContain('nominations');
      expect(JSON.stringify(result)).not.toContain('nom-secret');
    });

    it('resolves to the too-many-pending refusal when the cap refuses the write, and returns none of the raised text', async () => {
      mockWrite({ data: null, error: { code: 'P0001', message: PENDING_CAP_REFUSAL, details: null, hint: null } });

      const result = await writer.setEntityNominations({ readFrom: [], target: CANDIDATE, nominations: [desired()] });

      expect(result).toEqual({ type: 'refused', reason: 'tooManyPending' });
      expect(JSON.stringify(result)).not.toContain('10');
    });

    it('resolves to the answers-locked refusal when the database refuses the write because answers are locked, and returns none of the raised text', async () => {
      mockWrite({
        data: null,
        error: { code: '42501', message: ANSWERS_LOCKED_REFUSAL, details: null, hint: null }
      });

      const result = await writer.setEntityNominations({ readFrom: [], target: CANDIDATE, nominations: [desired()] });

      expect(result).toEqual({ type: 'refused', reason: 'answersLocked' });
      expect(JSON.stringify(result)).not.toContain('set_entity_nominations');
    });

    it('recognises the cap by the start of its message, whatever limit and count follow', async () => {
      mockWrite({
        data: null,
        error: {
          code: 'P0001',
          message:
            'A caller may originate at most 25 unconfirmed parent nominations; this caller already holds 31. An administrator must confirm or reject some before more can be created.'
        }
      });

      await expect(
        writer.setEntityNominations({ readFrom: [], target: CANDIDATE, nominations: [desired()] })
      ).resolves.toEqual({
        type: 'refused',
        reason: 'tooManyPending'
      });
    });

    it.each([
      [
        'a caller who does not edit the entity',
        {
          code: '42501',
          message: 'set_entity_nominations: the caller does not hold nomination.edit on the named entity'
        }
      ],
      [
        'the lock on an update or a delete',
        {
          code: '42501',
          message:
            "set_entity_nominations: a nomination could not be written; nominations are locked or the rows are no longer the caller's"
        }
      ],
      [
        'the lock on an insert',
        { code: '42501', message: 'new row violates row-level security policy for table "nominations"' }
      ],
      ['a refused privilege', { code: '42501', message: 'permission denied for function set_entity_nominations' }],
      ['a required parent that is missing', { code: '23514', message: 'Nomination parent required: nomination nom-1' }],
      ['an entity type the election refuses', { code: '23514', message: 'Nomination shape refused: candidate' }],
      [
        'a malformed argument',
        { code: '22023', message: 'set_entity_nominations: p_nominations[0] needs an election_id that is a uuid' }
      ],
      [
        'two callers creating one parent nomination at once',
        {
          code: '23505',
          message: 'duplicate key value violates unique constraint "nominations_entity_parent_contest_key"'
        }
      ],
      ['an error with no code', { message: 'fetch failed' }],
      [
        'another serialization failure',
        { code: '40001', message: 'could not serialize access due to concurrent update' }
      ],
      ['the changed message under another code', { code: 'P0001', message: CHANGED_REFUSAL }],
      ['a foreign-key violation of another key', { code: '23503', message: 'violates "nominations_election_id_fkey"' }],
      ['the parent foreign key named under another code', { code: 'P0001', message: LISTED_UNDER_REFUSAL }],
      ['the parent foreign key named with no code', { message: LISTED_UNDER_REFUSAL }],
      ['the answers lock text under another code', { code: 'P0001', message: ANSWERS_LOCKED_REFUSAL }],
      ['the answers lock text with no code', { message: ANSWERS_LOCKED_REFUSAL }],
      ['the cap message under another code', { code: '42501', message: PENDING_CAP_REFUSAL }],
      ['the cap message with no code', { message: PENDING_CAP_REFUSAL }],
      ['the cap message quoted inside another message', { code: 'P0001', message: `Failed: ${PENDING_CAP_REFUSAL}` }],
      [
        'another raised exception',
        { code: 'P0001', message: 'Faction nominations must have a parent organization nomination' }
      ]
    ])('throws for %s, naming the method', async (_shape, error) => {
      mockWrite({ data: null, error });

      await expect(
        writer.setEntityNominations({ readFrom: [], target: CANDIDATE, nominations: [desired()] })
      ).rejects.toThrow(/^setEntityNominations: /);
    });

    it.each([
      ['no answer', null],
      ['an answer without a count', { inserted: 1, updated: 0, deleted: 0, unchanged: 0 }],
      ['an answer that is a list', [COUNTS]]
    ])('rejects %s instead of reporting a write it cannot read as saved', async (_shape, data) => {
      mockWrite({ data, error: null });

      await expect(
        writer.setEntityNominations({ readFrom: [], target: CANDIDATE, nominations: [desired()] })
      ).rejects.toThrow(/did not match its schema at: /);
    });

    it.each([
      ['no id', { type: 'candidate', id: '' }],
      ['no id member', { type: 'candidate' }]
    ])('refuses a target with %s before any request', (_shape, target) => {
      // reason: a target outside the public option type is the state under test.
      expect(() =>
        writer.setEntityNominations({ readFrom: [], target: target as never, nominations: [desired()] })
      ).toThrow(/^setEntityNominations: /);
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it.each([
      ['absent', undefined],
      ['null', null],
      ['one nomination outside a list', { electionId: 'el-1' }],
      ['text', 'el-1']
    ])('refuses nominations that are %s and not a list, before any request', (_shape, nominations) => {
      // reason: a value outside the public option type is the state under test.
      expect(() =>
        writer.setEntityNominations({ readFrom: [], target: CANDIDATE, nominations: nominations as never })
      ).toThrow(/^setEntityNominations: /);
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it.each([
      ['absent', undefined],
      ['null', null],
      ['one nomination outside a list', { id: 'nom-1', updatedAt: '2026-10-01T12:00:00+00:00' }]
    ])('refuses a read that is %s and not a list, before any request', (_shape, readFrom) => {
      // reason: a value outside the public option type is the state under test.
      expect(() =>
        writer.setEntityNominations({ target: CANDIDATE, nominations: [desired()], readFrom: readFrom as never })
      ).toThrow(/^setEntityNominations: /);
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it('refuses an entity type the application does not serve before any request', async () => {
      await expect(
        writer.setEntityNominations({ readFrom: [], target: { type: 'faction', id: 'fac-1' }, nominations: [] })
      ).rejects.toThrow(/Unsupported entity type: faction/);
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });
  });

  describe('getNominationParentOptions', () => {
    const CANDIDATE = { type: 'candidate', id: 'cand-1' } as const;
    const ORGANIZATION = { type: 'organization', id: 'org-1' } as const;
    const CONTESTS = [
      { electionId: 'el-1', constituencyId: 'co-1' },
      { electionId: 'el-2', constituencyId: 'co-2' }
    ];

    /**
     * One organization as `get_nomination_parent_options` states it, with nothing stored in its optional columns.
     * @param overrides - Members to state otherwise.
     * @returns The element.
     */
    function optionRow(overrides: Record<string, unknown> = {}) {
      return {
        id: 'org-9',
        entity_type: 'organization',
        name: { en: 'Second Party', fi: 'Toinen puolue' },
        short_name: null,
        color: null,
        image: null,
        nominated: [],
        ...overrides
      };
    }

    /**
     * Read the candidate's options, the function answering with `answer`.
     * @param answer - What `get_nomination_parent_options` resolves with.
     * @param locale - The locale to read in.
     * @returns The pending read.
     */
    function readOptions(answer: { data: unknown; error: unknown }, locale = 'en') {
      mockSupabase.rpc.mockResolvedValue(answer);
      return writer.getNominationParentOptions({ target: CANDIDATE, contests: CONTESTS, locale });
    }

    it('calls get_nomination_parent_options once, naming the project, the entity and the contests', async () => {
      await readOptions({ data: [], error: null });

      expect(mockSupabase.rpc.mock.calls).toEqual([
        [
          'get_nomination_parent_options',
          {
            p_project_id: PROJECT_ID,
            p_entity_type: 'candidate',
            p_entity_id: 'cand-1',
            p_contests: [
              { election_id: 'el-1', constituency_id: 'co-1' },
              { election_id: 'el-2', constituency_id: 'co-2' }
            ]
          }
        ]
      ]);
      expect(tablesReached(mockSupabase)).toEqual([]);
    });

    it("reads an organization's options under its own type", async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      await writer.getNominationParentOptions({ target: ORGANIZATION, contests: [], locale: 'en' });

      expect(onlyRpcArguments(mockSupabase)).toEqual({
        p_project_id: PROJECT_ID,
        p_entity_type: 'organization',
        p_entity_id: 'org-1',
        p_contests: []
      });
    });

    it('resolves to undefined for a refused read, and not to an empty list', async () => {
      await expect(readOptions({ data: null, error: null })).resolves.toBeUndefined();
    });

    it('resolves to an empty list for a project that lists nothing the entity may be nominated under', async () => {
      await expect(readOptions({ data: [], error: null })).resolves.toEqual([]);
    });

    it('returns each option as an entity with its names in the requested locale and the contests it is nominated at', async () => {
      const result = await readOptions(
        {
          data: [
            optionRow({
              short_name: { en: 'SP', fi: 'TP' },
              nominated: [
                { election_id: 'el-2', constituency_id: 'co-2' },
                { election_id: 'el-1', constituency_id: 'co-1' }
              ]
            }),
            optionRow({ id: 'org-8', name: { en: 'Third Party' } })
          ],
          error: null
        },
        'fi'
      );

      expect(result).toEqual([
        {
          entity: { type: 'organization', id: 'org-9', name: 'Toinen puolue', shortName: 'TP' },
          nominatedIn: [
            { electionId: 'el-2', constituencyId: 'co-2' },
            { electionId: 'el-1', constituencyId: 'co-1' }
          ]
        },
        // A name the requested locale does not hold is read in the default locale.
        { entity: { type: 'organization', id: 'org-8', name: 'Third Party' }, nominatedIn: [] }
      ]);
    });

    it('states nothing for a short name, a colour and an image that are not stored, and an empty name when no locale holds one', async () => {
      const result = await readOptions({ data: [optionRow({ name: null })], error: null });

      expect(result?.[0]?.entity).toEqual({ type: 'organization', id: 'org-9', name: '' });
      expect(Object.keys(result?.[0]?.entity ?? {}).sort()).toEqual(['id', 'name', 'type']);
    });

    it('returns an alliance as an alliance', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [optionRow({ id: 'all-1', entity_type: 'alliance', name: { en: 'The Alliance' } })],
        error: null
      });

      const result = await writer.getNominationParentOptions({
        target: ORGANIZATION,
        contests: CONTESTS,
        locale: 'en'
      });

      expect(result).toEqual([{ entity: { type: 'alliance', id: 'all-1', name: 'The Alliance' }, nominatedIn: [] }]);
    });

    it('hands on a stored image as a public address with its text, and a stored colour parsed and adjusted for contrast', async () => {
      const result = await readOptions({
        data: [
          optionRow({
            image: { path: 'p/organizations/org-9/logo.png', alt: 'Logo of the second party' },
            color: { normal: '#000', dark: '#FFF' }
          }),
          optionRow({ id: 'org-8', color: { normal: '#FFFFFF' } })
        ],
        error: null
      });

      expect(result?.[0]?.entity.image).toEqual({
        url: 'http://localhost:54321/storage/v1/object/public/public-assets/p/organizations/org-9/logo.png',
        alt: 'Logo of the second party'
      });
      expect(result?.[0]?.entity.color).toEqual({ normal: '#000000', dark: '#ffffff' });
      // White has too little contrast on the light background, so it is not handed on as stored.
      expect(result?.[1]?.entity.color?.normal).toMatch(/^#[0-9a-f]{6}$/);
      expect(result?.[1]?.entity.color?.normal).not.toBe('#ffffff');
    });

    it('hands on no colour and no image for stored values that are neither, and reports each without its value', async () => {
      const { result, records } = await withCapturedLogs(() =>
        readOptions({
          data: [optionRow({ color: { normal: '#fff; background: url(x)' }, image: { alt: 'url(y)' } })],
          error: null
        })
      );

      expect(result?.[0]?.entity).toEqual({ type: 'organization', id: 'org-9', name: 'Second Party' });
      expect(records).toHaveLength(2);
      expect(JSON.stringify(records)).not.toContain('url(');
    });

    it('rejects when the read fails, naming the method', async () => {
      await expect(readOptions({ data: null, error: { code: '42501', message: 'permission denied' } })).rejects.toThrow(
        /^getNominationParentOptions: /
      );
    });

    it('rejects a malformed answer instead of reading it as an empty list, and repeats no stored value', async () => {
      const secret = 'value-that-must-not-be-in-the-message';
      const read = readOptions({ data: [optionRow({ nominated: secret })], error: null });

      await expect(read).rejects.toThrow(/did not match its schema at: 0\.nominated$/);
      await expect(read).rejects.not.toThrow(secret);
    });

    it('rejects an answer that is not a list', async () => {
      await expect(readOptions({ data: { options: [] }, error: null })).rejects.toThrow(
        /did not match its schema at: \(root\)$/
      );
    });

    it.each([
      ['no id', { type: 'candidate', id: '' }],
      ['no id member', { type: 'candidate' }]
    ])('refuses a target with %s before any request', (_shape, target) => {
      expect(() =>
        // reason: a target outside the public option type is the state under test.
        writer.getNominationParentOptions({ target: target as never, contests: CONTESTS, locale: 'en' })
      ).toThrow(/^getNominationParentOptions: /);
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it.each([
      ['absent', undefined],
      ['one contest outside a list', { electionId: 'el-1', constituencyId: 'co-1' }]
    ])('refuses contests that are %s and not a list, before any request', (_shape, contests) => {
      expect(() =>
        // reason: a value outside the public option type is the state under test.
        writer.getNominationParentOptions({ target: CANDIDATE, contests: contests as never, locale: 'en' })
      ).toThrow(/^getNominationParentOptions: /);
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });
  });

  describe('project scoping', () => {
    /** A verified candidate session, which the candidate-facing reads below all require. */
    function setupContestantSession() {
      mockVerifiedSession(mockSupabase, {
        user: { id: 'user-1', email: 'cand@test.com', user_metadata: { language: 'fi' } },
        grants: [{ scope: 'entity', target_type: 'candidate', target_id: 'cand-1', role: 'editor' }]
      });
    }

    /**
     * The row the one-entity read answers with, in the project this adapter is configured for unless a test says otherwise.
     * @param projectId - The project the returned candidate belongs to.
     * @returns The row.
     */
    function candidateRow(projectId: string) {
      return {
        id: 'cand-1',
        project_id: projectId,
        name: { en: 'Test Candidate' },
        short_name: null,
        info: null,
        color: null,
        image: null,
        sort_order: 1,
        subtype: null,
        custom_data: null,
        answers: {},
        first_name: 'Test',
        last_name: 'Candidate'
      };
    }

    it('getEntityUserData throws when the read answers with another project row', async () => {
      setupContestantSession();
      mockEntityRpcs(mockSupabase, {
        row: { data: candidateRow('11111111-1111-1111-1111-111111111111'), error: null }
      });

      await expect(
        writer.getEntityUserData({ type: 'candidate', id: 'cand-1', loadNominations: false, locale: 'en' })
      ).rejects.toThrow(/^getEntityUserData: /);
    });

    it('does not name either project in the mismatch message', async () => {
      setupContestantSession();
      const otherProject = '11111111-1111-1111-1111-111111111111';
      mockEntityRpcs(mockSupabase, { row: { data: candidateRow(otherProject), error: null } });

      // A uuid in a thrown message travels into logs and error reporters. The message names the CONDITION so an operator knows what to fix; the two values are exactly the pair a mis-provisioned deployment should not be broadcasting.
      const error = await writer
        .getEntityUserData({ type: 'candidate', id: 'cand-1', loadNominations: false, locale: 'en' })
        .catch((e: Error) => e);
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toContain(otherProject);
      expect((error as Error).message).not.toContain(PROJECT_ID);
    });

    it('getEntityUserData accepts a row belonging to the configured project', async () => {
      setupContestantSession();
      mockEntityRpcs(mockSupabase, { row: { data: candidateRow(PROJECT_ID), error: null } });

      const result = await writer.getEntityUserData({
        type: 'candidate',
        id: 'cand-1',
        loadNominations: false,
        locale: 'en'
      });

      expect(result?.entity.id).toBe('cand-1');
    });

    it('the list and the one-entity read each name the configured project in their RPC call', async () => {
      setupContestantSession();
      mockEntityRpcs(mockSupabase, { row: { data: candidateRow(PROJECT_ID), error: null } });

      await writer.getUserEntities();
      await writer.getEntityUserData({ type: 'candidate', id: 'cand-1', loadNominations: false, locale: 'en' });

      const calls = mockSupabase.rpc.mock.calls as Array<[string, { p_project_id?: string }]>;
      expect(calls.map(([name]) => name)).toEqual(['get_user_entities', 'get_entity_user_data']);
      for (const [, args] of calls) expect(args.p_project_id).toBe(PROJECT_ID);
    });

    it('the nominations read names the configured project in its RPC call and reaches no table', async () => {
      setupContestantSession();
      mockEntityRpcs(mockSupabase, {
        row: { data: candidateRow(PROJECT_ID), error: null },
        nominations: { data: [], error: null }
      });

      await writer.getEntityUserData({ type: 'candidate', id: 'cand-1', loadNominations: true, locale: 'en' });

      const calls = mockSupabase.rpc.mock.calls as Array<[string, { p_project_id?: string }]>;
      expect(calls.map(([name]) => name)).toEqual(['get_entity_user_data', 'get_entity_nominations']);
      for (const [, args] of calls) expect(args.p_project_id).toBe(PROJECT_ID);
      // Both reads are function calls that carry the project, so the entity read with its nominations reaches no table.
      expect(tablesReached(mockSupabase)).toEqual([]);
    });

    it('setAnswers builds the Storage path from the configured project and reaches no table', async () => {
      const uploadMock = vi.fn().mockResolvedValue({ data: { path: 'uploaded' }, error: null });
      mockSupabase.storage.from.mockReturnValue({ upload: uploadMock });
      mockSupabase.rpc.mockResolvedValue({ data: {}, error: null });

      await writer.updateAnswers({
        target: { type: 'candidate', id: 'entity-1' },
        answers: { 'q-image': { value: new File(['x'], 'p.png', { type: 'image/png' }) } }
      });

      expect(uploadMock.mock.calls[0][0]).toMatch(new RegExp(`^${PROJECT_ID}/candidates/entity-1/`));
      // No `candidates` lookup is issued to answer the same question.
      expect(tablesReached(mockSupabase)).toEqual([]);
    });

    it('updateEntityProperties builds the image path from the configured project and reaches only candidates', async () => {
      const uploadMock = vi.fn().mockResolvedValue({ data: { path: 'uploaded' }, error: null });
      mockSupabase.storage.from.mockReturnValue({ upload: uploadMock });
      mockSupabase._mockResponses['candidates'] = { data: { image: null }, error: null };

      await writer.updateEntityProperties({
        target: { type: 'candidate', id: 'entity-1' },
        // reason: the public option type names a stored image, and the file-carrying shape under test is the one the profile form produces.
        properties: { image: { file: new File(['x'], 'p.png', { type: 'image/png' }) } as never }
      });

      expect(uploadMock.mock.calls[0][0]).toMatch(new RegExp(`^${PROJECT_ID}/candidates/entity-1/`));
      // One table access, not two: the write itself. The path prefix comes from configuration, not from a `candidates` lookup.
      expect(tablesReached(mockSupabase)).toEqual(['candidates']);
    });

    it('filters the candidates update by project as well as by id', async () => {
      mockSupabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'uploaded' }, error: null })
      });
      mockSupabase._mockResponses['candidates'] = { data: { image: null }, error: null };

      await writer.updateEntityProperties({
        target: { type: 'candidate', id: 'entity-1' },
        // reason: the public option type names a stored image, and the file-carrying shape under test is the one the profile form produces.
        properties: { image: { file: new File(['x'], 'p.png', { type: 'image/png' }) } as never }
      });

      // The chain under test is the update.
      expect(mockSupabase._chains.flatMap((entry) => entry.chain.update.mock.calls)).toHaveLength(1);
      const calls = eqCallsFor(mockSupabase, 'candidates');
      expect(calls).toContainEqual(['project_id', PROJECT_ID]);
      expect(calls).toContainEqual(['id', 'entity-1']);
    });
  });
});
