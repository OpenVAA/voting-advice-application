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
 * A client stub whose `getSession` reads a mutable storage slot, as auth-js reads its cookie storage, and whose `getUser` is a spy.
 * @param initial - The session storage holds at first.
 * @returns The stub client, its storage slot and the two spies.
 */
function fakeClient(initial: Session | null) {
  const storage: { session: Session | null } = { session: initial };
  const getSession = vi.fn(async () => ({ data: { session: storage.session } }));
  const getUser = vi.fn<() => Promise<{ data: { user: User | null }; error: Error | null }>>();
  const supabase = { auth: { getSession, getUser } } as unknown as SupabaseClient<SupabaseDatabase>;
  return { supabase, storage, getSession, getUser };
}

const USER = { id: 'user-1' } as User;
const VERIFIED = { data: { user: USER }, error: null };

describe('createSafeGetSession', () => {
  it('verifies a token once and returns the same session and user on every call', async () => {
    const session = sessionWith('token-a');
    const { supabase, getSession, getUser } = fakeClient(session);
    getUser.mockResolvedValue(VERIFIED);
    const { safeGetSession } = createSafeGetSession(supabase);

    const first = await safeGetSession();
    const second = await safeGetSession();

    expect(getUser).toHaveBeenCalledTimes(1);
    // One read per call, plus the one read that follows the single verification.
    expect(getSession).toHaveBeenCalledTimes(3);
    expect(first).toEqual({ session, user: USER });
    expect(second).toEqual({ session, user: USER });
  });

  it('shares one verification between concurrent calls', async () => {
    const { supabase, getUser } = fakeClient(sessionWith('token-a'));
    getUser.mockResolvedValue(VERIFIED);
    const { safeGetSession } = createSafeGetSession(supabase);

    await Promise.all([safeGetSession(), safeGetSession()]);

    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it('returns nulls without verifying when there is no session, then verifies a session that appears later', async () => {
    const { supabase, storage, getUser } = fakeClient(null);
    getUser.mockResolvedValue(VERIFIED);
    const { safeGetSession } = createSafeGetSession(supabase);

    expect(await safeGetSession()).toEqual({ session: null, user: null });
    expect(getUser).not.toHaveBeenCalled();

    const session = sessionWith('token-after-login');
    storage.session = session;
    expect(await safeGetSession()).toEqual({ session, user: USER });
    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it('verifies again when the access token changes', async () => {
    const { supabase, storage, getUser } = fakeClient(sessionWith('token-a'));
    getUser.mockResolvedValue(VERIFIED);
    const { safeGetSession } = createSafeGetSession(supabase);

    await safeGetSession();
    const refreshed = sessionWith('token-b');
    storage.session = refreshed;
    const second = await safeGetSession();

    expect(getUser).toHaveBeenCalledTimes(2);
    expect(second).toEqual({ session: refreshed, user: USER });
  });

  it('pairs the user only with the token getUser() verified when it refreshes the session mid-verification', async () => {
    const { supabase, storage, getUser } = fakeClient(sessionWith('token-a'));
    const refreshed = sessionWith('token-b');
    // Without a token argument, getUser() refreshes a session inside the expiry margin and verifies the new token.
    getUser
      .mockImplementationOnce(async () => {
        storage.session = refreshed;
        return VERIFIED;
      })
      .mockResolvedValue(VERIFIED);
    const { safeGetSession } = createSafeGetSession(supabase);

    expect(await safeGetSession()).toEqual({ session: refreshed, user: USER });
    expect(getUser).toHaveBeenCalledTimes(2);

    expect(await safeGetSession()).toEqual({ session: refreshed, user: USER });
    expect(getUser).toHaveBeenCalledTimes(2);
  });

  it('returns nulls when every verification replaces the token it was asked to verify', async () => {
    const { supabase, storage, getUser } = fakeClient(sessionWith('token-0'));
    let rotations = 0;
    getUser.mockImplementation(async () => {
      rotations += 1;
      storage.session = sessionWith(`token-${rotations}`);
      return VERIFIED;
    });
    const { safeGetSession } = createSafeGetSession(supabase);

    expect(await safeGetSession()).toEqual({ session: null, user: null });
    expect(getUser).toHaveBeenCalledTimes(2);
  });

  it('returns nulls when verification errors, and verifies again on the next call', async () => {
    const session = sessionWith('token-a');
    const { supabase, getUser } = fakeClient(session);
    getUser
      .mockResolvedValueOnce({ data: { user: null }, error: new Error('invalid JWT') })
      .mockResolvedValueOnce(VERIFIED);
    const { safeGetSession } = createSafeGetSession(supabase);

    expect(await safeGetSession()).toEqual({ session: null, user: null });
    expect(await safeGetSession()).toEqual({ session, user: USER });
    expect(getUser).toHaveBeenCalledTimes(2);
  });

  it('propagates a thrown verification and does not cache it', async () => {
    const session = sessionWith('token-a');
    const { supabase, getUser } = fakeClient(session);
    getUser.mockRejectedValueOnce(new Error('network down')).mockResolvedValueOnce(VERIFIED);
    const { safeGetSession } = createSafeGetSession(supabase);

    await expect(safeGetSession()).rejects.toThrow('network down');
    expect(await safeGetSession()).toEqual({ session, user: USER });
    expect(getUser).toHaveBeenCalledTimes(2);
  });

  it('verifies afresh on every call once the request has ended', async () => {
    const session = sessionWith('token-a');
    const { supabase, getUser } = fakeClient(session);
    getUser.mockResolvedValue(VERIFIED);
    const { safeGetSession, endRequest } = createSafeGetSession(supabase);

    await safeGetSession();
    endRequest();
    expect(await safeGetSession()).toEqual({ session, user: USER });
    expect(await safeGetSession()).toEqual({ session, user: USER });

    expect(getUser).toHaveBeenCalledTimes(3);
  });

  it('keeps no memo between two helpers, as two requests would each build their own', async () => {
    const { supabase, getUser } = fakeClient(sessionWith('token-a'));
    getUser.mockResolvedValue(VERIFIED);

    await createSafeGetSession(supabase).safeGetSession();
    await createSafeGetSession(supabase).safeGetSession();

    expect(getUser).toHaveBeenCalledTimes(2);
  });
});
