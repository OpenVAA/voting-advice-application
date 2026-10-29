import { afterEach, describe, expect, it, vi } from 'vitest';
import { RELAY_PATH } from '$lib/analytics/constants';
import { sendBatch } from './relayTransport';

/** Let pending promise callbacks run, so a rejection that nobody handles would surface. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('sendBatch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends one keepalive POST of the body to the relay path without cookies', () => {
    const fetchStub = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchStub);
    const body = '{"routeId":"/(voters)","locale":"en","events":[]}';

    sendBatch(body);

    expect(fetchStub).toHaveBeenCalledTimes(1);
    const [url, init] = fetchStub.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(RELAY_PATH);
    expect(init.method).toBe('POST');
    expect(init.keepalive).toBe(true);
    expect(init.credentials).toBe('omit');
    expect(init.body).toBe(body);
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('drops a rejected send without an unhandled rejection or a console error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    try {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
      expect(sendBatch('{}')).toBeUndefined();
      await settle();
    } finally {
      process.off('unhandledRejection', unhandled);
    }
    expect(unhandled).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('drops a send whose fetch throws synchronously, without a console error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        throw new TypeError('keepalive quota exceeded');
      })
    );
    expect(() => sendBatch('{}')).not.toThrow();
    await settle();
    expect(consoleError).not.toHaveBeenCalled();
  });
});
