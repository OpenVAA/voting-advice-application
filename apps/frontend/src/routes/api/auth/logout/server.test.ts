import { describe, expect, it, vi } from 'vitest';
import { POST } from './+server';

/**
 * `/api/auth/logout` is the one sign-out endpoint, posted to by the contestant app and the admin app alike.
 *
 * The scope assertion is the load-bearing one. `signOut()` with no argument is a GLOBAL sign-out in the Supabase client: it ends the user's sessions on every device. This endpoint must end the session of the request it serves and no other.
 */

/** Build the `{ locals }` the endpoint receives, with a recording `signOut`. */
function eventWith() {
  const signOut = vi.fn(async () => ({ error: null }));
  return {
    signOut,
    event: {
      locals: { supabase: { auth: { signOut } } }
    } as unknown as Parameters<typeof POST>[0]
  };
}

describe('POST /api/auth/logout', () => {
  it('signs out the local session only, exactly once', async () => {
    const { event, signOut } = eventWith();
    await POST(event);
    expect(signOut).toHaveBeenCalledExactlyOnceWith({ scope: 'local' });
  });

  it('answers 200 with a DataApiActionResult', async () => {
    const { event } = eventWith();
    const response = await POST(event);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, type: 'success' });
  });

  it('answers a failure, never success, when the sign-out failed and the session cookies may still be set', async () => {
    const { event, signOut } = eventWith();
    signOut.mockResolvedValueOnce({ error: { name: 'AuthRetryableFetchError', message: 'fetch failed' } } as never);
    const response = await POST(event);
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ ok: false, type: 'failure' });
  });
});
