/**
 * `PendingAddressResend` against a stubbed registration call and a fake clock: the request each press makes, the count that follows it, and the two moments of the status.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RESEND_WAIT_SECONDS } from '$lib/auth/entryFlow';
import { PendingAddressResend } from './pendingAddressResend.svelte';
import type { DataWriter } from '$lib/api/base/dataWriter.type';

const register = vi.fn<DataWriter['registerIdentityProviderAccount']>();

beforeEach(() => {
  register.mockResolvedValue('sent');
});

afterEach(() => {
  vi.useRealTimers();
  register.mockReset();
});

describe('PendingAddressResend', () => {
  it('is available before the first press, with nothing to say', () => {
    const resend = new PendingAddressResend(register);

    expect(resend.unavailable).toBe(false);
    expect(resend.secondsLeft).toBe(0);
    expect(resend.status).toBeUndefined();
  });

  it('asks for the link, says so at once, and counts from the settlement until it is available again', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    const resend = new PendingAddressResend(register);
    resend.start();

    const pressed = resend.resend();
    expect(resend.status).toBe('requested');
    expect(resend.requesting).toBe(true);
    expect(resend.unavailable).toBe(true);
    await pressed;

    expect(register.mock.calls).toEqual([[{ intent: 'resend' }]]);
    expect(resend.requesting).toBe(false);
    expect(resend.secondsLeft).toBe(RESEND_WAIT_SECONDS);
    expect(resend.unavailable).toBe(true);

    await resend.resend();
    expect(register).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(RESEND_WAIT_SECONDS * 1000);
    expect(resend.secondsLeft).toBe(0);
    expect(resend.unavailable).toBe(false);
    expect(resend.status).toBe('ready');

    await resend.resend();
    expect(register).toHaveBeenCalledTimes(2);
    resend.stop();
  });

  it('counts after a refused request as after a sent one', async () => {
    register.mockResolvedValue('failed');
    const resend = new PendingAddressResend(register);

    await resend.resend();

    expect(resend.secondsLeft).toBe(RESEND_WAIT_SECONDS);
    expect(resend.status).toBe('requested');
  });
});
