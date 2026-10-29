/**
 * `PendingAddressResend` and `postIdentityProviderRegistration` against a stubbed endpoint and a fake clock: the request each press makes, the count that follows it, the two moments of the status, and the answers the request reads.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RESEND_WAIT_SECONDS } from '$lib/contestant/entryFlow';
import { PendingAddressResend, postIdentityProviderRegistration } from './pendingAddressResend.svelte';

const ENDPOINT = '/api/contestant/identity-provider';
const fetchMock = vi.fn();

function answer(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
}

beforeEach(() => {
  fetchMock.mockResolvedValue(answer({ result: 'sent' }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('postIdentityProviderRegistration', () => {
  it('posts the intent as JSON to the endpoint and answers its result', async () => {
    fetchMock.mockResolvedValue(answer({ result: 'in-use' }));

    expect(await postIdentityProviderRegistration({ intent: 'save', email: 'typed@example.org' })).toBe('in-use');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(ENDPOINT);
    expect(init.method).toBe('POST');
    expect(new Headers(init.headers).get('content-type')).toBe('application/json');
    expect(JSON.parse(String(init.body))).toEqual({ intent: 'save', email: 'typed@example.org' });
  });

  it.each([
    ['a body without a result', () => Promise.resolve(answer({}))],
    ['a body that is not an object', () => Promise.resolve(answer('sent'))],
    ['a failed request', () => Promise.reject(new Error('offline'))]
  ])('answers undefined for %s', async (_, reply) => {
    fetchMock.mockImplementation(reply);

    expect(await postIdentityProviderRegistration({ intent: 'resend' })).toBeUndefined();
  });
});

describe('PendingAddressResend', () => {
  it('is available before the first press, with nothing to say', () => {
    const resend = new PendingAddressResend();

    expect(resend.unavailable).toBe(false);
    expect(resend.secondsLeft).toBe(0);
    expect(resend.status).toBeUndefined();
  });

  it('asks for the link, says so at once, and counts from the settlement until it is available again', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    const resend = new PendingAddressResend();
    resend.start();

    const pressed = resend.resend();
    expect(resend.status).toBe('requested');
    expect(resend.requesting).toBe(true);
    expect(resend.unavailable).toBe(true);
    await pressed;

    expect(JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body))).toEqual({
      intent: 'resend'
    });
    expect(resend.requesting).toBe(false);
    expect(resend.secondsLeft).toBe(RESEND_WAIT_SECONDS);
    expect(resend.unavailable).toBe(true);

    await resend.resend();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(RESEND_WAIT_SECONDS * 1000);
    expect(resend.secondsLeft).toBe(0);
    expect(resend.unavailable).toBe(false);
    expect(resend.status).toBe('ready');

    await resend.resend();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    resend.stop();
  });

  it('counts after a refused request as after a sent one', async () => {
    fetchMock.mockResolvedValue(answer({ result: 'failed' }));
    const resend = new PendingAddressResend();

    await resend.resend();

    expect(resend.secondsLeft).toBe(RESEND_WAIT_SECONDS);
    expect(resend.status).toBe('requested');
  });
});
