/**
 * `isSessionGone`, driven with a fake client whose `auth.getSession()` answers each form a read of the stored session takes: no session and no error, a session, an error, and a rejection. Only the first means that the client holds no session.
 */

import { describe, expect, it, vi } from 'vitest';
import { isSessionGone } from './sessionGone';

type Client = Parameters<typeof isSessionGone>[0];

/**
 * A client exposing only the session read.
 * @param getSession - What `auth.getSession()` does.
 * @returns The fake client.
 */
function makeClient(getSession: () => Promise<unknown>): Client {
  return { auth: { getSession: vi.fn(getSession) } } as unknown as Client;
}

const SESSION = { access_token: 'access', refresh_token: 'refresh', expires_at: 1893456000 };

describe('isSessionGone', () => {
  it('is true when the client answers no session and no error', async () => {
    const client = makeClient(async () => ({ data: { session: null }, error: null }));

    await expect(isSessionGone(client)).resolves.toBe(true);
  });

  it('is false when the client answers a session', async () => {
    const client = makeClient(async () => ({ data: { session: SESSION }, error: null }));

    await expect(isSessionGone(client)).resolves.toBe(false);
  });

  it('is false when the client answers an error', async () => {
    const client = makeClient(async () => ({ data: { session: null }, error: new Error('The refresh failed.') }));

    await expect(isSessionGone(client)).resolves.toBe(false);
  });

  it('is false when the read rejects', async () => {
    const client = makeClient(async () => {
      throw new Error('network down');
    });

    await expect(isSessionGone(client)).resolves.toBe(false);
  });
});
