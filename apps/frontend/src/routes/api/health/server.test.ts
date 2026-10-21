import { describe, expect, it } from 'vitest';
import { GET } from './+server';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * `/api/health` is what a load balancer asks to decide whether this server may receive traffic.
 *
 * The trap case is the load-bearing one. A health request carries no cookie and no forwarding header, and it must be answered while the backend is unreachable, so the handler may touch neither the Supabase client nor the client address. With an address header configured, the Node adapter throws when the client address is asked for and the header is absent.
 */

/** The request event a handler receives. */
type HealthEvent = Parameters<RequestHandler>[0];

/** The build id `$app/environment` exports in unit tests. */
const STUB_BUILD = 'test';

/** The URL a load balancer requests, on the container's own address. */
const HEALTH_URL = 'http://internal.example:3000/api/health';

/** The members of the event the handler may not read. */
const TRAPPED_MEMBERS = ['locals', 'getClientAddress'] as const;

/** The handler as the server calls it: with the request event. */
const handler: RequestHandler = GET;

/** The members every event of these cases carries. */
function baseEvent(): { request: Request; url: URL } {
  return { request: new Request(HEALTH_URL), url: new URL(HEALTH_URL) };
}

/** Build an event whose `locals` and `getClientAddress` are harmless. */
function plainEvent(): HealthEvent {
  return { ...baseEvent(), locals: {}, getClientAddress: () => '203.0.113.7' } as unknown as HealthEvent;
}

/** Build an event whose `locals` and `getClientAddress` throw when they are read, each naming itself. */
function trappedEvent(): HealthEvent {
  const event = baseEvent();
  for (const member of TRAPPED_MEMBERS) {
    Object.defineProperty(event, member, {
      enumerable: true,
      get(): never {
        throw new Error(`the handler read event.${member}`);
      }
    });
  }
  return event as unknown as HealthEvent;
}

describe('GET /api/health', () => {
  it('answers 200', async () => {
    const response = await handler(plainEvent());
    expect(response.status).toBe(200);
  });

  it('answers with exactly a status and the build id', async () => {
    const response = await handler(plainEvent());
    expect(await response.json()).toStrictEqual({ status: 'ok', build: STUB_BUILD });
  });

  it('forbids caching the answer', async () => {
    const response = await handler(plainEvent());
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('answers 200 for an event whose locals and client address throw when read', async () => {
    const response = await handler(trappedEvent());
    expect(response.status).toBe(200);
  });

  it.each(TRAPPED_MEMBERS)('the trapped event throws when %s is read', (member) => {
    const event = trappedEvent();
    expect(() => event[member]).toThrow(`the handler read event.${member}`);
  });
});
