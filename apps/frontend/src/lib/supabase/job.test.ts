import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSupabaseJobClient } from './job';

/**
 * The job client's contract, read off the configuration handed to the library rather than reasoned about (criterion **D10-C12**).
 *
 * Every claim this factory makes is a claim about an OBJECT it passes to `createClient`, so every assertion below reads that object. The difference matters: "session persistence is disabled" reasoned from the library's documented default is a claim about a version, and the version can change under the tree without anything here going red. The same claim read off `createClient.mock.calls[0][2].auth` is a claim about this file, and it fails the day someone edits this file.
 *
 * ## Why the whole option object is enumerated rather than spot-checked
 *
 * The load-bearing property is an ABSENCE — the job client has no adapter that could reach the request's session store, so the failure mode where a job raises inside a token refresh on an already-generated response has no code path to occur on. An absence cannot be spot-checked: `expect(options.someKey).toBeUndefined()` only rules out the key someone thought to name. The key-set assertions below rule out every key nobody thought to name, which is what "no adapter of any kind" has to mean to be worth asserting.
 *
 * ## The version these option names were read from
 *
 * `@supabase/supabase-js` **2.99.3**, installed in this tree. `persistSession` and `autoRefreshToken` were read from `SupabaseClientOptions` in `node_modules/@supabase/supabase-js/dist/index.d.mts`, where both are documented as defaulting to `true`; the header path was read from the same package's `dist/index.mjs`, where the client copies `global.headers` onto `this.headers`, hands them to its PostgREST client, and its own `fetchWithAuth` wrapper sets `Authorization` only `if (!headers.has("Authorization"))` — so a header supplied here is the one every request carries.
 */

/** The library call the factory's whole contract is expressed in; every assertion below reads its third argument. */
const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn((url: string, key: string, options: unknown) => ({ url, key, options }))
}));

vi.mock('@supabase/supabase-js', () => ({ createClient }));

/**
 * The option object the factory handed the library on its most recent call.
 * @returns The third argument of the last `createClient` call, as a readable record.
 */
function lastOptions(): Record<string, Record<string, unknown>> {
  const calls = createClient.mock.calls;
  return calls[calls.length - 1][2] as Record<string, Record<string, unknown>>;
}

describe('createSupabaseJobClient — a credential without a session', () => {
  beforeEach(() => {
    createClient.mockClear();
  });

  it('disables session persistence and automatic token refresh explicitly, rather than inheriting a default', () => {
    createSupabaseJobClient({ accessToken: 'the-initiating-admin-token' });

    // Read off the object, not off the library's documentation. Both keys are asserted PRESENT and `false`; `toBeFalsy` would pass for an absent key, which is the reading this factory exists to make impossible.
    expect(lastOptions().auth).toEqual({ persistSession: false, autoRefreshToken: false });
  });

  it('carries the initiating admin’s credential on every request the client makes', () => {
    createSupabaseJobClient({ accessToken: 'the-initiating-admin-token' });

    expect(lastOptions().global).toEqual({ headers: { Authorization: 'Bearer the-initiating-admin-token' } });
  });

  it('configures NOTHING ELSE, so there is no adapter through which a session write could be attempted', () => {
    createSupabaseJobClient({ accessToken: 'the-initiating-admin-token' });

    const options = lastOptions();
    // THE ABSENCE, enumerated. Two configured groups and no third: no storage adapter, no request-scoped transport, nothing that could reach the response this job outlives. A named-key assertion would only rule out the name it named.
    expect(Object.keys(options).sort()).toEqual(['auth', 'global']);
    expect(Object.keys(options.global)).toEqual(['headers']);
    expect(Object.keys(options.auth).sort()).toEqual(['autoRefreshToken', 'persistSession']);
  });

  it('speaks to this deployment’s project, with this deployment’s publishable key', () => {
    createSupabaseJobClient({ accessToken: 'the-initiating-admin-token' });

    const [url, key] = createClient.mock.calls[0];
    // Both come from `constants`, which the test environment stubs to empty strings — so this asserts WHICH values were passed, not what they contain. A factory that hard-coded either would fail here.
    expect({ url, key }).toEqual({ url: '', key: '' });
  });

  it('gives two jobs two clients, each carrying its own credential and neither observing the other’s', () => {
    createSupabaseJobClient({ accessToken: 'token-for-the-first-admin' });
    createSupabaseJobClient({ accessToken: 'token-for-the-second-admin' });

    expect(
      createClient.mock.calls.map(([, , options]) => (options as { global: { headers: unknown } }).global)
    ).toEqual([
      { headers: { Authorization: 'Bearer token-for-the-first-admin' } },
      { headers: { Authorization: 'Bearer token-for-the-second-admin' } }
    ]);
  });

  it('RAISES when no credential is supplied, and builds no client at all', () => {
    // "Nobody supplied a credential" and "this runs anonymously" must not be one program state; ruling D10 blames that shape for the admin outage. The second assertion is the load-bearing half: a factory that raised AFTER constructing would still have made an anonymous client.
    expect(() => createSupabaseJobClient({ accessToken: undefined })).toThrow(/no access token/);
    expect(() => createSupabaseJobClient({ accessToken: '' })).toThrow(/no access token/);
    expect(createClient).not.toHaveBeenCalled();
  });
});
