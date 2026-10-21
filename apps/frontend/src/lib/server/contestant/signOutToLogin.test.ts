/**
 * The sign-out-and-redirect helper of the Contestant App's protected loads, driven with fake request locals.
 */

import { log } from '@openvaa/app-shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import { signOutToLogin } from './signOutToLogin';

type HelperLocals = Parameters<typeof signOutToLogin>[0];

const signOut = vi.fn();

/** Request locals exposing only the sign-out the helper calls. */
function makeLocals(): HelperLocals {
  return { supabase: { auth: { signOut } } } as unknown as HelperLocals;
}

/** What the helper throws. */
async function thrownBy(run: () => Promise<never>): Promise<{ status: number; location: string }> {
  try {
    await run();
  } catch (e) {
    return e as { status: number; location: string };
  }
  throw new Error('signOutToLogin resolved, and it must never return');
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('signOutToLogin', () => {
  it('signs out with scope local, once', async () => {
    signOut.mockResolvedValue({ error: null });

    await thrownBy(() => signOutToLogin(makeLocals(), 'en', 'loginFailed'));

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it.each([['loginFailed']] as const)('throws a 307 redirect to the login page carrying %s', async (code) => {
    signOut.mockResolvedValue({ error: null });

    const redirected = await thrownBy(() => signOutToLogin(makeLocals(), 'en', code));

    expect(redirected.status).toBe(307);
    expect(redirected.location).toBe(buildRoute({ route: 'ContestantAppLogin', locale: 'en', errorMessage: code }));
    expect(redirected.location).toContain(code);
  });

  it('still redirects when the sign-out rejects, and logs the failure', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    signOut.mockRejectedValue(new Error('network down'));

    const redirected = await thrownBy(() => signOutToLogin(makeLocals(), 'en', 'loginFailed'));

    expect(redirected.status).toBe(307);
    expect(redirected.location).toBe(
      buildRoute({ route: 'ContestantAppLogin', locale: 'en', errorMessage: 'loginFailed' })
    );
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain('network down');
  });
});
