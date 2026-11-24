import { describe, expect, it, vi } from 'vitest';
import { POST } from './+server';

/**
 * `/api/auth/logout` is the one sign-out endpoint, posted to by the contestant app and the admin app alike.
 *
 * The scope assertion is the load-bearing one. `signOut()` with no argument is a GLOBAL sign-out in the Supabase client: it ends the user's sessions on every device. This endpoint must end the session of the request it serves and no other.
 *
 * The logout count is withdrawn with the request's event before the sign-out, on a sign-out that works and on one that fails. The withdrawal is replaced here; what it removes is asserted in its own test file.
 */

const { withdrawLogoutDeadline } = vi.hoisted(() => ({ withdrawLogoutDeadline: vi.fn() }));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/server/auth/logoutDeadline', () => ({ withdrawLogoutDeadline }));

/** Build the event the endpoint receives, with a recording `signOut`. */
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

describe('the logout count', () => {
  /** The order in which the withdrawal and the sign-out were called, with the sign-out failing or not. */
  function recordOrder(failing: boolean) {
    const order: Array<string> = [];
    withdrawLogoutDeadline.mockReset();
    withdrawLogoutDeadline.mockImplementation(() => {
      order.push('withdrawLogoutDeadline');
    });
    const { event, signOut } = eventWith();
    signOut.mockImplementationOnce(async () => {
      order.push('signOut');
      return failing
        ? ({ error: { name: 'AuthRetryableFetchError', message: 'fetch failed' } } as never)
        : { error: null };
    });
    return { event, order };
  }

  it("is withdrawn with the request's event before the sign-out, which answers as before", async () => {
    const { event, order } = recordOrder(false);
    const response = await POST(event);
    expect(withdrawLogoutDeadline).toHaveBeenCalledTimes(1);
    expect(withdrawLogoutDeadline.mock.calls[0][0]).toBe(event);
    expect(order).toEqual(['withdrawLogoutDeadline', 'signOut']);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, type: 'success' });
  });

  it('is withdrawn before the sign-out also when the sign-out fails, which still answers a failure', async () => {
    const { event, order } = recordOrder(true);
    const response = await POST(event);
    expect(withdrawLogoutDeadline).toHaveBeenCalledTimes(1);
    expect(withdrawLogoutDeadline.mock.calls[0][0]).toBe(event);
    expect(order).toEqual(['withdrawLogoutDeadline', 'signOut']);
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ ok: false, type: 'failure' });
  });
});
