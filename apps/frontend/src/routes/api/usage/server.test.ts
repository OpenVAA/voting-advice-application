import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RELAY_PATH } from '$lib/analytics/constants';
import { POST } from './+server';

/**
 * `/api/usage` is the endpoint the browser sends usage batches to. It owns no logic: the relay decides the status, and the endpoint answers it with an empty body.
 *
 * The load-bearing assertion is the one over what the endpoint reads. It may read the request and the server's origin and nothing else, so an event whose client address, cookies and every other member throw must still be answered.
 */

const handleUsageRequest = vi.hoisted(() => vi.fn<(request: Request, origin: string) => Promise<number>>());

vi.mock('$lib/server/analytics/runtime', () => ({ handleUsageRequest }));

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** The routes directory, resolved from this file's own location. */
const ROUTES_ROOT = path.resolve(HERE, '..', '..');

/** The origin the test server is reached on. */
const ORIGIN = 'http://127.0.0.1:4173';

/** The members of the event the endpoint is allowed to read. */
const READABLE_MEMBERS = new Set<PropertyKey>(['request', 'url']);

/**
 * Build the event the endpoint receives. Every member other than the request and the URL throws when read, so a read of anything else fails the test.
 *
 * @returns The event, the request inside it, and the names of the members that were read.
 */
function eventWith() {
  const request = new Request(`${ORIGIN}${RELAY_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  });
  const members: Record<string, unknown> = {
    request,
    url: new URL(`${ORIGIN}${RELAY_PATH}`),
    getClientAddress: () => '203.0.113.77',
    cookies: {},
    locals: {}
  };
  const read = new Array<PropertyKey>();
  const event = new Proxy(members, {
    get(target, key) {
      read.push(key);
      if (!READABLE_MEMBERS.has(key)) throw new Error(`The endpoint read the event member ${String(key)}.`);
      return target[key as string];
    }
  }) as unknown as Parameters<typeof POST>[0];
  return { event, request, read };
}

beforeEach(() => {
  handleUsageRequest.mockReset();
});

describe('POST /api/usage', () => {
  it.each([204, 400, 403, 413, 415])('answers status %i with an empty body', async (status) => {
    handleUsageRequest.mockResolvedValue(status);
    const { event } = eventWith();
    const response = await POST(event);
    expect(response.status).toBe(status);
    expect(response.body).toBeNull();
    expect(await response.text()).toBe('');
  });

  it('passes the request and the origin of the URL, and nothing else', async () => {
    handleUsageRequest.mockResolvedValue(204);
    const { event, request } = eventWith();
    await POST(event);
    expect(handleUsageRequest).toHaveBeenCalledExactlyOnceWith(request, ORIGIN);
  });

  it('reads only the request and the URL of the event', async () => {
    handleUsageRequest.mockResolvedValue(204);
    const { event, read } = eventWith();
    const response = await POST(event);
    expect(response.status).toBe(204);
    expect(new Set(read)).toEqual(READABLE_MEMBERS);
  });

  it('control: an event that throws on its client address and its cookies throws when they are read', () => {
    const { event } = eventWith();
    expect(() => event.getClientAddress()).toThrow();
    expect(() => event.cookies).toThrow();
  });
});

describe('the endpoint lives at the shared relay path', () => {
  it('sits in the directory named by RELAY_PATH under the routes root', () => {
    expect(path.join(ROUTES_ROOT, RELAY_PATH)).toBe(HERE);
    expect(fs.existsSync(path.join(ROUTES_ROOT, RELAY_PATH, '+server.ts'))).toBe(true);
  });
});
