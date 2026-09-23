import { configureLogger } from '@openvaa/app-shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(settle),
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
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn()
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
 * The assertions below count these rather than only checking membership: a deleted derivation round-trip is only observable as a table that is no longer reached at all.
 * @param client - The mock client under test.
 * @returns The table names.
 */
function tablesReached(client: MockClient): Array<string> {
  return client.from.mock.calls.map((call) => call[0] as string);
}

type MockClient = ReturnType<typeof createMockSupabaseClient>;
// reason: createMockSupabaseClient is structural-only; SupabaseClient<Database> has 50+ methods we don't mock
function asSupabaseMock(m: MockClient): SupabaseClient<Database> {
  return m as unknown as SupabaseClient<Database>;
}

/**
 * Stub a session that PASSES verification: `getUser()` returns the user — the round-trip `_getBasicUserData` now makes FIRST — and `getSession()` returns the access token whose grant claim the coarse role is then derived from.
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
 * The logger's configuration is module-scoped and starts at `'silent'`, so a parse-failure record is invisible until the level is raised. The restore runs in a `finally` so one failing expectation cannot leave the level raised for the rest of the file. Same shape as the helper in `supabaseDataProvider.test.ts`; the `'warn'` threshold still admits the `error`-level records decision C5(b) promoted these sites to.
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

    it('posts the cookie-clear request to the endpoint the route map names', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await writer.logout();

      expect(globalThis.fetch).toHaveBeenCalledWith(ROUTE.CandAppAuthLogout, { method: 'POST' });
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/candidate/auth/logout', { method: 'POST' });
    });

    it('does not assemble the endpoint from the current locale (regression guard for the doubled-prefix bug)', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });
      // The endpoint clears httpOnly cookies and answers json; it is the same endpoint in every locale. An implementation that reached for the current locale would emit a different URL here than in the case above, and the two assertions together are what pins that it does not.
      i18nMocks.getLocale.mockReturnValue('fi');

      await writer.logout();

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/candidate/auth/logout', { method: 'POST' });
    });

    it('does not derive the endpoint from window.location.pathname (regression guard for the /candidate-prefix bug)', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });
      // Simulate an unprefixed candidate route URL. The implementation this guard was written against read the first path segment and produced "/candidate/candidate/auth/logout" from exactly this input.
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { pathname: '/candidate/auth/logout', origin: 'http://localhost' }
      });

      await writer.logout();

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/candidate/auth/logout', { method: 'POST' });
    });
  });

  describe('requestForgotPasswordEmail', () => {
    it('calls resetPasswordForEmail with a redirectTo naming the auth callback under the API prefix', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

      const result = await writer.requestForgotPasswordEmail({ email: 'test@example.com' });

      // The path is asserted in full rather than by substring: the old path also contained "candidate/auth/callback", so a substring assertion would have passed against it and this move would have gone unnoticed here.
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: expect.stringContaining(ROUTE.CandAppAuthCallback)
      });
      expect(result).toEqual({ type: 'success' });
    });

    it('throws Error on Supabase failure', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: { message: 'User not found' }
      });

      await expect(writer.requestForgotPasswordEmail({ email: 'bad@example.com' })).rejects.toThrow('User not found');
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

  describe('resetPassword', () => {
    it('calls updateUser with new password, ignoring code param', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ data: {}, error: null });

      const result = await writer.resetPassword({ password: 'newpass', code: '' });

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newpass' });
      expect(result).toEqual({ type: 'success' });
    });

    it('throws Error on Supabase failure', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: {},
        error: { message: 'Session expired' }
      });

      await expect(writer.resetPassword({ password: 'newpass', code: '' })).rejects.toThrow('Session expired');
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
        p_entity_id: 'entity-1',
        p_answers: expectedAnswers,
        p_overwrite: false
      });
    });

    // WR-06. `file.name` is fully controlled by the uploading candidate. The old path took `name.split('.').pop()` verbatim, so `a.b/c/d` produced the extension `"/d"` and a path of `…/<uuid>./d` — an uploader-chosen sub-path inside the prefix, copied on into the stored `{ path }` and from there into a public URL. Each case below is a shape the derived form admitted and the whitelist does not.
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
   * The post-upsert read-back, which decision **B3** gives a status BRANCH rather than a collapse.
   *
   * The write itself is never in doubt in any of these cases — the RPC resolves without an error. What is under test is what the adapter REPORTS about a write whose result it could not validate. Before this phase the branch read `parseAnswersColumn(...).value ?? {}`, so a malformed read-back became a truthy empty answers map that the candidate store then treated as a verified save (fact 5, ledger row 4).
   */
  describe('_setAnswers read-back (decision B3)', () => {
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
      // Every entry is malformed, so partial preserve keeps nothing — the case that previously produced the truthy `{}`.
      mockSupabase.rpc.mockResolvedValue({ data: { q1: 'not-an-answer-object' }, error: null });

      const { result, records } = await withCapturedLogs(() => writer.updateAnswers({ target, answers }));

      // NOT `{}`: an unverified write and an entity with no answers are different facts and must not be the same value (requirement D8).
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

    it('never carries any part of the answers payload into the record (T-157-17)', async () => {
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

  describe('register', () => {
    it('calls updateUser with password to complete registration', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ data: {}, error: null });
      const result = await writer.register({ registrationKey: 'test-key', password: 'newpass' });
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newpass' });
      expect(result).toEqual({ type: 'success' });
    });

    it('throws on Supabase error', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: {},
        error: { message: 'Weak password' }
      });
      await expect(writer.register({ registrationKey: 'test-key', password: 'x' })).rejects.toThrow('Weak password');
    });
  });

  describe('getBasicUserData', () => {
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
      expect(result.role).toBe('candidate');
      expect(result.settings.language).toBe('fi');
    });

    it('returns admin role for a project-scope admin grant', async () => {
      mockVerifiedSession(mockSupabase, {
        user: { id: 'user-2', email: 'admin@test.com', user_metadata: {} },
        grants: [{ scope: 'project', target_type: null, target_id: 'proj1', role: 'admin' }]
      });

      const result = await writer.getBasicUserData();
      expect(result.role).toBe('admin');
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

    // A session minted before the access-token hook changed still carries the retired claim key until its token refreshes. It confers nothing here, exactly as it confers nothing in the database.
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
  });

  describe('getCandidateUserData', () => {
    /** Helper to set up a mock session with candidate role JWT. */
    function setupCandidateSession() {
      mockVerifiedSession(mockSupabase, {
        user: { id: 'user-1', email: 'cand@test.com', user_metadata: { language: 'fi' } },
        grants: [{ scope: 'entity', target_type: 'candidate', target_id: 'cand-1', role: 'editor' }]
      });
    }

    it('calls get_candidate_user_data RPC and returns structured data', async () => {
      setupCandidateSession();

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
        terms_of_use_accepted: '2024-01-01T00:00:00Z',
        first_name: 'Test',
        last_name: 'Candidate'
      };

      mockSupabase.rpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: entityRow, error: null })
      });

      const result = await writer.getCandidateUserData({
        loadNominations: false,
        locale: 'en'
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_candidate_user_data', {
        p_project_id: PROJECT_ID,
        p_entity_type: 'candidate'
      });
      expect(result.user.id).toBe('user-1');
      expect(result.user.email).toBe('cand@test.com');
      expect(result.candidate.id).toBe('cand-1');
      expect(result.candidate.firstName).toBe('Test');
      expect(result.candidate.lastName).toBe('Candidate');
      expect(result.candidate.answers).toEqual({ q1: { value: 3 } });
      expect(result.nominations).toBeUndefined();
    });

    it('loads nominations when loadNominations=true', async () => {
      setupCandidateSession();

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
        answers: {},
        terms_of_use_accepted: null,
        first_name: 'Test',
        last_name: 'Candidate'
      };

      mockSupabase.rpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: entityRow, error: null })
      });

      // Mock nominations query
      const nomData = [
        {
          id: 'nom-1',
          election_id: 'elec-1',
          constituency_id: 'const-1',
          election_round: 1,
          election_symbol: '42',
          parent_nomination_id: null,
          entity_type: 'candidate'
        }
      ];
      mockSupabase._mockResponses['nominations'] = { data: nomData, error: null };

      const result = await writer.getCandidateUserData({
        loadNominations: true,
        locale: 'en'
      });

      expect(result.nominations).toBeDefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('nominations');
    });

    it('throws if RPC returns empty/error', async () => {
      setupCandidateSession();

      mockSupabase.rpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      });

      await expect(
        writer.getCandidateUserData({
          loadNominations: false,
          locale: 'en'
        })
      ).rejects.toThrow('Failed to load candidate data: Not found');
    });
  });

  describe('preregisterWithApiToken (invite-candidate)', () => {
    it('calls invite-candidate Edge Function with correct params', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, candidateId: 'cand-1', userId: 'user-1' },
        error: null
      });

      const result = await writer.preregisterWithApiToken({
        body: {
          firstName: 'Test',
          lastName: 'User',
          identifier: '1990-01-01',
          email: 'test@example.com',
          nominations: [{ electionId: 'elec-1', constituencyId: 'const-1' }]
        }
      });

      // The elections round-trip that used to answer "which project is this?" is gone: the id comes from configuration, so the invite is issued without reaching any table at all.
      expect(tablesReached(mockSupabase)).toEqual([]);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('invite-candidate', {
        body: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          projectId: PROJECT_ID
        }
      });
      expect(result).toEqual({ type: 'success' });
    });

    it('throws when Edge Function returns error', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Forbidden' }
      });

      await expect(
        writer.preregisterWithApiToken({
          body: {
            firstName: 'A',
            lastName: 'B',
            identifier: '',
            email: 'a@b.com',
            nominations: [{ electionId: 'e1', constituencyId: 'c1' }]
          }
        })
      ).rejects.toThrow('invite-candidate');
    });
  });

  describe('checkRegistrationKey', () => {
    it('throws "not supported" for Supabase adapter', async () => {
      await expect(writer.checkRegistrationKey({ registrationKey: 'some-key' })).rejects.toThrow(
        'not supported by the Supabase adapter'
      );
    });
  });

  describe('updateEntityProperties', () => {
    it('updates termsOfUseAccepted via PostgREST', async () => {
      const timestamp = '2024-01-15T10:00:00.000Z';
      mockSupabase._mockResponses['candidates'] = { data: { terms_of_use_accepted: timestamp }, error: null };

      const result = await writer.updateEntityProperties({
        target: { type: 'candidate', id: 'entity-1' },
        properties: { termsOfUseAccepted: timestamp }
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('candidates');
      const updateCalls = mockSupabase._chains.flatMap((entry) => entry.chain.update.mock.calls);
      expect(updateCalls).toEqual([[{ terms_of_use_accepted: timestamp }]]);
      expect(result).toEqual({ termsOfUseAccepted: timestamp });
    });

    it('throws on PostgREST error', async () => {
      mockSupabase._mockResponses['candidates'] = { data: null, error: { message: 'Row not found' } };

      await expect(
        writer.updateEntityProperties({
          target: { type: 'candidate', id: 'bad-id' },
          properties: { termsOfUseAccepted: 'now' }
        })
      ).rejects.toThrow('updateEntityProperties: Row not found');
    });

    // IN-01. When there is nothing to write, this used to return `{ termsOfUseAccepted: undefined }` through a double cast. The caller SPREADS the result into the stored candidate, so the no-op path wrote `undefined` over the acceptance it had just read. Reading the row back instead makes the merge a no-op too, which is what "nothing was updated" should mean.
    it('reads the stored properties back instead of fabricating a return value when nothing changed', async () => {
      const timestamp = '2024-01-15T10:00:00.000Z';
      mockSupabase._mockResponses['candidates'] = {
        data: { terms_of_use_accepted: timestamp, image: null },
        error: null
      };

      // The reachable no-write shape: the public wrapper requires an image `file` OR a `termsOfUseAccepted`, and the adapter then writes nothing when that `file` is not a `File` instance and the image carries no `url` — which is what an SSR pass, where `File` is undefined, produces.
      const result = await writer.updateEntityProperties({
        target: { type: 'candidate', id: 'entity-1' },
        // reason: a non-`File` `file` is the state under test and the public option type cannot name it.
        properties: { image: { file: 'not-a-File-instance' } as never }
      });

      // No write is attempted…
      expect(mockSupabase._chains.flatMap((entry) => entry.chain.update.mock.calls)).toEqual([]);
      // …and the stored acceptance comes back as stored, rather than as `undefined`.
      expect(result).toEqual({ termsOfUseAccepted: timestamp });
    });
  });

  /**
   * The project this writer works in comes from configuration, once, and every table access names it.
   *
   * Each case here has two halves, and both matter. The POSITIVE half asserts the project filter or the project id actually reached the call. The NEGATIVE half counts the tables reached, because a deleted derivation round-trip is only observable as a table that is no longer touched at all — an assertion that merely checked the filter would still pass with the extra query in place.
   */
  describe('project scoping', () => {
    /** A verified candidate session, which the candidate-facing reads below all require. */
    function setupCandidateSession() {
      mockVerifiedSession(mockSupabase, {
        user: { id: 'user-1', email: 'cand@test.com', user_metadata: { language: 'fi' } },
        grants: [{ scope: 'entity', target_type: 'candidate', target_id: 'cand-1', role: 'editor' }]
      });
    }

    /**
     * The row `get_candidate_user_data` answers with, in the project this adapter is configured for unless a test says otherwise.
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
        terms_of_use_accepted: null,
        first_name: 'Test',
        last_name: 'Candidate'
      };
    }

    it('preregisterWithApiToken sends the configured project id and reaches no table', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({ data: { success: true }, error: null });

      await writer.preregisterWithApiToken({
        body: {
          firstName: 'A',
          lastName: 'B',
          identifier: '',
          email: 'a@b.com',
          nominations: [{ electionId: 'e1', constituencyId: 'c1' }]
        }
      });

      expect(tablesReached(mockSupabase)).toEqual([]);
      const [, options] = mockSupabase.functions.invoke.mock.calls[0] as [string, { body: { projectId: string } }];
      expect(options.body.projectId).toBe(PROJECT_ID);
    });

    it('getCandidateUserData throws when the identity-scoped RPC answers with another project row', async () => {
      setupCandidateSession();
      mockSupabase.rpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: candidateRow('11111111-1111-1111-1111-111111111111'), error: null })
      });

      await expect(writer.getCandidateUserData({ loadNominations: false, locale: 'en' })).rejects.toThrow(
        /^getCandidateUserData: /
      );
    });

    it('does not name either project in the mismatch message', async () => {
      setupCandidateSession();
      const otherProject = '11111111-1111-1111-1111-111111111111';
      mockSupabase.rpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: candidateRow(otherProject), error: null })
      });

      // A uuid in a thrown message travels into logs and error reporters. The message names the CONDITION so an operator knows what to fix; the two values are exactly the pair a mis-provisioned deployment should not be broadcasting.
      const error = await writer.getCandidateUserData({ loadNominations: false, locale: 'en' }).catch((e: Error) => e);
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toContain(otherProject);
      expect((error as Error).message).not.toContain(PROJECT_ID);
    });

    it('getCandidateUserData accepts a row belonging to the configured project', async () => {
      setupCandidateSession();
      mockSupabase.rpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: candidateRow(PROJECT_ID), error: null })
      });

      const result = await writer.getCandidateUserData({ loadNominations: false, locale: 'en' });

      expect(result.candidate.id).toBe('cand-1');
    });

    it('filters the nominations read by project as well as by candidate', async () => {
      setupCandidateSession();
      mockSupabase.rpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: candidateRow(PROJECT_ID), error: null })
      });
      mockSupabase._mockResponses['nominations'] = { data: [], error: null };

      await writer.getCandidateUserData({ loadNominations: true, locale: 'en' });

      const calls = eqCallsFor(mockSupabase, 'nominations');
      expect(calls).toContainEqual(['project_id', PROJECT_ID]);
      expect(calls).toContainEqual(['candidate_id', 'cand-1']);
      expect(tablesReached(mockSupabase)).toEqual(['nominations']);
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
      // The lazily-issued `candidates` lookup that used to answer the same question is gone.
      expect(tablesReached(mockSupabase)).toEqual([]);
    });

    it('updateEntityProperties builds the image path from the configured project and reaches only candidates', async () => {
      const uploadMock = vi.fn().mockResolvedValue({ data: { path: 'uploaded' }, error: null });
      mockSupabase.storage.from.mockReturnValue({ upload: uploadMock });
      mockSupabase._mockResponses['candidates'] = { data: { terms_of_use_accepted: null, image: null }, error: null };

      await writer.updateEntityProperties({
        target: { type: 'candidate', id: 'entity-1' },
        // reason: the public option type names a stored image, and the file-carrying shape under test is the one the profile form produces.
        properties: { image: { file: new File(['x'], 'p.png', { type: 'image/png' }) } as never }
      });

      expect(uploadMock.mock.calls[0][0]).toMatch(new RegExp(`^${PROJECT_ID}/candidates/entity-1/`));
      // One table access, not two: the write itself. The `candidates` lookup that resolved the path prefix is gone.
      expect(tablesReached(mockSupabase)).toEqual(['candidates']);
    });

    it('filters the candidates update by project as well as by id', async () => {
      mockSupabase._mockResponses['candidates'] = { data: { terms_of_use_accepted: 'now', image: null }, error: null };

      await writer.updateEntityProperties({
        target: { type: 'candidate', id: 'entity-1' },
        properties: { termsOfUseAccepted: 'now' }
      });

      const calls = eqCallsFor(mockSupabase, 'candidates');
      expect(calls).toContainEqual(['project_id', PROJECT_ID]);
      expect(calls).toContainEqual(['id', 'entity-1']);
    });

    it('filters the no-write read-back by project as well as by id', async () => {
      mockSupabase._mockResponses['candidates'] = { data: { terms_of_use_accepted: 'now', image: null }, error: null };

      await writer.updateEntityProperties({
        target: { type: 'candidate', id: 'entity-1' },
        // reason: a non-`File` `file` is the no-write state under test and the public option type cannot name it.
        properties: { image: { file: 'not-a-File-instance' } as never }
      });

      const calls = eqCallsFor(mockSupabase, 'candidates');
      expect(calls).toContainEqual(['project_id', PROJECT_ID]);
      expect(calls).toContainEqual(['id', 'entity-1']);
    });
  });
});
