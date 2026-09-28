import { describe, expect, it, vi } from 'vitest';
import { createSafeGetSession } from './safeGetSession';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { SupabaseDatabase } from '$lib/api/adapters/supabase/supabaseAdapter.type';

/**
 * `createSafeGetSession` verifies each access token once per request and re-reads the session on every call.
 *
 * The re-read is what keeps password login working: the login action calls the helper after `signInWithPassword` on the same request, when a session exists that did not exist on the first call.
 */

/**
 * A session stub carrying only the access token the helper keys on.
 * @param accessToken - The token the session reports.
 * @returns The stub, typed as a `Session`.
 */
function sessionWith(accessToken: string): Session {
  return { access_token: accessToken } as Session;
}

/**
 * A client stub whose `getSession` and `getUser` are independent spies.
 * @returns The stub client and the two spies.
 */
function fakeClient() {
  const getSession = vi.fn<() => Promise<{ data: { session: Session | null } }>>();
  const getUser = vi.fn<() => Promise<{ data: { user: User | null }; error: Error | null }>>();
  const supabase = { auth: { getSession, getUser } } as unknown as SupabaseClient<SupabaseDatabase>;
  return { supabase, getSession, getUser };
}

const USER = { id: 'user-1' } as User;

describe('createSafeGetSession', () => {
  it('verifies a token once and returns the same session and user on every call', async () => {
    const { supabase, getSession, getUser } = fakeClient();
    const session = sessionWith('token-a');
    getSession.mockResolvedValue({ data: { session } });
    getUser.mockResolvedValue({ data: { user: USER }, error: null });
    const safeGetSession = createSafeGetSession(supabase);

    const first = await safeGetSession();
    const second = await safeGetSession();

    expect(getUser).toHaveBeenCalledTimes(1);
    expect(getSession).toHaveBeenCalledTimes(2);
    expect(first).toEqual({ session, user: USER });
    expect(second).toEqual({ session, user: USER });
  });

  it('shares one verification between concurrent calls', async () => {
    const { supabase, getSession, getUser } = fakeClient();
    getSession.mockResolvedValue({ data: { session: sessionWith('token-a') } });
    getUser.mockResolvedValue({ data: { user: USER }, error: null });
    const safeGetSession = createSafeGetSession(supabase);

    await Promise.all([safeGetSession(), safeGetSession()]);

    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it('returns nulls without verifying when there is no session, then verifies a session that appears later', async () => {
    const { supabase, getSession, getUser } = fakeClient();
    const session = sessionWith('token-after-login');
    getSession.mockResolvedValueOnce({ data: { session: null } }).mockResolvedValueOnce({ data: { session } });
    getUser.mockResolvedValue({ data: { user: USER }, error: null });
    const safeGetSession = createSafeGetSession(supabase);

    expect(await safeGetSession()).toEqual({ session: null, user: null });
    expect(getUser).not.toHaveBeenCalled();

    expect(await safeGetSession()).toEqual({ session, user: USER });
    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it('verifies again when the access token changes', async () => {
    const { supabase, getSession, getUser } = fakeClient();
    const refreshed = sessionWith('token-b');
    getSession
      .mockResolvedValueOnce({ data: { session: sessionWith('token-a') } })
      .mockResolvedValueOnce({ data: { session: refreshed } });
    getUser.mockResolvedValue({ data: { user: USER }, error: null });
    const safeGetSession = createSafeGetSession(supabase);

    await safeGetSession();
    const second = await safeGetSession();

    expect(getUser).toHaveBeenCalledTimes(2);
    expect(second).toEqual({ session: refreshed, user: USER });
  });

  it('returns nulls when verification errors, and verifies again on the next call', async () => {
    const { supabase, getSession, getUser } = fakeClient();
    const session = sessionWith('token-a');
    getSession.mockResolvedValue({ data: { session } });
    getUser
      .mockResolvedValueOnce({ data: { user: null }, error: new Error('invalid JWT') })
      .mockResolvedValueOnce({ data: { user: USER }, error: null });
    const safeGetSession = createSafeGetSession(supabase);

    expect(await safeGetSession()).toEqual({ session: null, user: null });
    expect(await safeGetSession()).toEqual({ session, user: USER });
    expect(getUser).toHaveBeenCalledTimes(2);
  });

  it('propagates a thrown verification and does not cache it', async () => {
    const { supabase, getSession, getUser } = fakeClient();
    const session = sessionWith('token-a');
    getSession.mockResolvedValue({ data: { session } });
    getUser
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ data: { user: USER }, error: null });
    const safeGetSession = createSafeGetSession(supabase);

    await expect(safeGetSession()).rejects.toThrow('network down');
    expect(await safeGetSession()).toEqual({ session, user: USER });
    expect(getUser).toHaveBeenCalledTimes(2);
  });

  it('keeps no memo between two helpers, as two requests would each build their own', async () => {
    const { supabase, getSession, getUser } = fakeClient();
    getSession.mockResolvedValue({ data: { session: sessionWith('token-a') } });
    getUser.mockResolvedValue({ data: { user: USER }, error: null });

    await createSafeGetSession(supabase)();
    await createSafeGetSession(supabase)();

    expect(getUser).toHaveBeenCalledTimes(2);
  });
});
