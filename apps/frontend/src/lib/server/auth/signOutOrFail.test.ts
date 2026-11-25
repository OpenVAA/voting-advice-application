/**
 * The shared sign-out of the server loads and actions, driven with fake locals: it returns after a sign-out that worked; after one that failed, in both forms a failure takes, it logs the failure with the caller's label and then returns when the request's client answers no session, and throws a 503 when it answers a session or an error.
 */

import { log } from '@openvaa/app-shared';
import { isHttpError } from '@sveltejs/kit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { signOutOrFail } from './signOutOrFail';

const signOut = vi.fn();
const getSession = vi.fn();

const SESSION = { access_token: 'access', refresh_token: 'refresh', expires_at: 1893456000 };

/** Locals that expose only the sign-out the helper calls and the session read it makes after a failure. */
function makeLocals(): App.Locals {
  return { supabase: { auth: { getSession, signOut } } } as unknown as App.Locals;
}

/** The two forms a failed sign-out takes. */
const FAILURES = [
  ['rejects', () => signOut.mockRejectedValue(new Error('network down'))],
  ['answers { error }', () => signOut.mockResolvedValue({ error: new Error('network down') })]
] as const;

/** What the helper throws, or `undefined` when it returns. */
async function thrownBy(run: () => Promise<void>): Promise<unknown> {
  try {
    await run();
  } catch (e) {
    return e;
  }
  return undefined;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('signOutOrFail', () => {
  it('signs out with scope local, once, and returns without asking for the session when the sign-out works', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    signOut.mockResolvedValue({ error: null });

    expect(await thrownBy(() => signOutOrFail(makeLocals(), 'Label'))).toBeUndefined();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(getSession).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it.each(FAILURES)(
    'logs the failure once with the label and returns when the sign-out %s and no session is left',
    async (_name, arrange) => {
      const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
      arrange();
      getSession.mockResolvedValue({ data: { session: null }, error: null });

      expect(await thrownBy(() => signOutOrFail(makeLocals(), 'Label'))).toBeUndefined();

      expect(getSession).toHaveBeenCalledTimes(1);
      expect(error).toHaveBeenCalledTimes(1);
      expect(String(error.mock.calls[0][0])).toMatch(/^Label: /);
      expect(String(error.mock.calls[0][0])).toContain('network down');
    }
  );

  it.each(
    FAILURES.flatMap(([name, arrange]) => [
      [name, 'a session', arrange, () => getSession.mockResolvedValue({ data: { session: SESSION }, error: null })],
      [
        name,
        'an error',
        arrange,
        () => getSession.mockResolvedValue({ data: { session: null }, error: new Error('The refresh failed.') })
      ]
    ])
  )(
    'logs the failure once and throws a 503 with the text of error.default when the sign-out %s and the client then answers %s',
    async (_name, _answer, arrange, answer) => {
      const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
      arrange();
      answer();

      const failed = await thrownBy(() => signOutOrFail(makeLocals(), 'Label'));

      expect(isHttpError(failed, 503)).toBe(true);
      expect((failed as { body: unknown }).body).toEqual({ message: 'error.default' });
      expect(getSession).toHaveBeenCalledTimes(1);
      expect(error).toHaveBeenCalledTimes(1);
    }
  );
});
