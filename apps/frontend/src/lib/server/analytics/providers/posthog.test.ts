/**
 * The PostHog provider, driven with a recording stand-in for `fetch`. No request leaves the process.
 *
 * The privacy property under test: the request the provider sends is built from the events alone. Distinctive values are planted in an inbound request that the provider is never given, so that an assertion on their absence cannot pass by coincidence; a deliberately leaky stand-in provider, given that request, is caught by the same detector.
 *
 * @vitest-environment node
 */

import { log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPostHogProvider, toPostHogBatchItem } from './posthog';
import type { AnalyticsEvent } from '$lib/analytics/analyticsEvent.type';
import type { AnalyticsProvider } from './provider.type';

const HOST = 'https://posthog-zz9plural.example';
const KEY = 'phc_planted_key_zz9plural';
const VISIT_ID = '0192f0c4-7a11-7c3e-9d5b-0a0b0c0d0e0f';

const PLANTED_ADDRESS = '203.0.113.77';
const PLANTED_USER_AGENT = 'PlantedAgent/9.9 (zz9-agent-marker)';
const PLANTED_REFERRER = 'https://referrer.example/zz9-referrer-marker';
const PLANTED_COOKIE = 'sb-access-token=zz9-cookie-marker';
const PLANTED_AUTHORIZATION = 'Bearer zz9-authorization-marker';

/** The inbound request a relay would have received. The real provider never sees it; the leaky control copies from it. */
const INBOUND = new Request('https://vaa.example/api/usage', {
  method: 'POST',
  headers: {
    'User-Agent': PLANTED_USER_AGENT,
    'X-Forwarded-For': PLANTED_ADDRESS,
    Forwarded: `for=${PLANTED_ADDRESS}`,
    'X-Real-IP': PLANTED_ADDRESS,
    'CF-Connecting-IP': PLANTED_ADDRESS,
    'True-Client-IP': PLANTED_ADDRESS,
    Cookie: PLANTED_COOKIE,
    Authorization: PLANTED_AUTHORIZATION,
    Referer: PLANTED_REFERRER,
    'Accept-Language': 'fi-FI,zz9-language-marker'
  }
});

/** Every planted value that must never appear in what a provider sends. */
const PLANTED = [
  PLANTED_ADDRESS,
  PLANTED_USER_AGENT,
  'zz9-agent-marker',
  'zz9-referrer-marker',
  'zz9-cookie-marker',
  'zz9-authorization-marker',
  'zz9-language-marker'
];

/** Members a PostHog item may carry and that would describe the visitor's request. */
const FORBIDDEN_MEMBERS = ['$ip', '$raw_user_agent', '$current_url', '$referrer'];

/** A planted attribute value, used to show that a failure record holds no event content. */
const ATTRIBUTE_MARKER = 'attr-zz9plural-marker';

const EVENTS: ReadonlyArray<AnalyticsEvent> = [
  {
    name: 'pageview',
    time: Date.UTC(2026, 9, 19, 10, 0, 0, 0),
    app: 'voter',
    attributes: { params: { entityTab: 'candidates' }, duration: 4_200 }
  },
  {
    name: 'answer',
    time: Date.UTC(2026, 9, 19, 10, 0, 1, 500),
    app: 'voter',
    id: VISIT_ID,
    attributes: { questionId: '3b241101-e2bb-4255-8caf-4136c566a962', value: ATTRIBUTE_MARKER }
  },
  {
    name: 'answer_delete',
    time: Date.UTC(2026, 9, 19, 10, 0, 2, 0),
    app: 'contestant',
    attributes: { questionId: '3b241101-e2bb-4255-8caf-4136c566a962' }
  }
];

type FetchCall = { url: string; init: RequestInit };

/**
 * A stand-in for `fetch` that records each call and answers with the given outcome.
 *
 * @param outcome - The response to answer with, or an error to reject with.
 * @returns The stand-in and the list it records into.
 */
function recordingFetch(outcome: Response | Error = new Response(null, { status: 200 })): {
  fetch: typeof fetch;
  calls: Array<FetchCall>;
} {
  const calls: Array<FetchCall> = [];
  function stand(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    calls.push({ url: String(input), init: init ?? {} });
    return outcome instanceof Error ? Promise.reject(outcome) : Promise.resolve(outcome.clone());
  }
  return { fetch: stand, calls };
}

/**
 * A stand-in for the random id function that counts up, so every id it returns is distinct and predictable.
 *
 * @returns The function.
 */
function countingRandomId(): () => string {
  let n = 0;
  return () => {
    n += 1;
    return `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
  };
}

/**
 * The header names of a recorded request.
 *
 * @param init - The recorded request init.
 * @returns The names, lower-cased as `Headers` holds them.
 */
function headerNames(init: RequestInit): Array<string> {
  return [...new Headers(init.headers ?? {}).keys()];
}

/**
 * Every way a recorded request could carry the visitor's request: a planted value anywhere in the URL, a header or the body, a header other than the content type, or a forbidden member in any item.
 *
 * @param calls - The recorded requests.
 * @returns A description of each leak found; empty when the requests hold nothing but the events.
 */
function findLeaks(calls: ReadonlyArray<FetchCall>): Array<string> {
  const leaks: Array<string> = [];
  for (const { url, init } of calls) {
    const headers = new Headers(init.headers ?? {});
    const text = [url, JSON.stringify([...headers.entries()]), typeof init.body === 'string' ? init.body : ''].join(
      '\n'
    );
    for (const planted of PLANTED) if (text.includes(planted)) leaks.push(`planted value ${planted}`);
    for (const name of headers.keys()) if (name !== 'content-type') leaks.push(`header ${name}`);
    const body: { batch?: Array<Record<string, unknown>> } = typeof init.body === 'string' ? JSON.parse(init.body) : {};
    for (const item of body.batch ?? []) {
      const properties = (item.properties ?? {}) as Record<string, unknown>;
      for (const member of FORBIDDEN_MEMBERS) {
        if (member in item) leaks.push(`item member ${member}`);
        if (member in properties) leaks.push(`property ${member}`);
      }
    }
  }
  return leaks;
}

/**
 * The control: a provider that copies the visitor's address and user agent into its request, as a careless relay would.
 *
 * @param request - The inbound request it was wrongly handed.
 * @param stand - The recording `fetch`.
 * @returns The leaky provider.
 */
function createLeakyProvider(request: Request, stand: typeof fetch): AnalyticsProvider {
  return {
    name: 'posthog',
    async capture(events) {
      const userAgent = request.headers.get('user-agent') ?? '';
      const address = request.headers.get('x-forwarded-for') ?? '';
      await stand(`${HOST}/batch/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': userAgent, 'X-Forwarded-For': address },
        body: JSON.stringify({
          api_key: KEY,
          batch: events.map((event) => ({
            event: event.name,
            properties: { $ip: address, $raw_user_agent: userAgent, $referrer: request.headers.get('referer') ?? '' }
          }))
        })
      });
    }
  };
}

/**
 * The body of the one recorded request.
 *
 * @param calls - The recorded requests, of which there must be exactly one.
 * @returns The parsed body.
 */
function bodyOf(calls: ReadonlyArray<FetchCall>): {
  api_key: string;
  batch: Array<{ event: string; timestamp: string; distinct_id: string; properties: Record<string, unknown> }>;
} {
  expect(calls).toHaveLength(1);
  return JSON.parse(String(calls[0].init.body));
}

const logSpies = {
  debug: vi.spyOn(log, 'debug'),
  info: vi.spyOn(log, 'info'),
  warn: vi.spyOn(log, 'warn'),
  error: vi.spyOn(log, 'error')
};

beforeEach(() => {
  for (const spy of Object.values(logSpies)) spy.mockImplementation(() => {});
});

afterEach(() => {
  for (const spy of Object.values(logSpies)) spy.mockReset();
});

describe('toPostHogBatchItem', () => {
  it('uses the visit id as distinct_id, at the top level and in properties, and as $session_id', () => {
    const randomId = vi.fn(() => 'unused');
    const item = toPostHogBatchItem(EVENTS[1], randomId);

    expect(item).toEqual({
      event: 'answer',
      timestamp: '2026-10-19T10:00:01.500Z',
      distinct_id: VISIT_ID,
      properties: {
        questionId: '3b241101-e2bb-4255-8caf-4136c566a962',
        value: ATTRIBUTE_MARKER,
        'openvaa.app': 'voter',
        distinct_id: VISIT_ID,
        $session_id: VISIT_ID,
        $process_person_profile: false,
        $geoip_disable: true
      }
    });
    expect(randomId).not.toHaveBeenCalled();
  });

  it('gives an event with no visit id one fresh random id and no $session_id', () => {
    const randomId = vi.fn(() => 'fresh-random-id');
    const item = toPostHogBatchItem(EVENTS[2], randomId);

    expect(randomId).toHaveBeenCalledTimes(1);
    expect(item.distinct_id).toBe('fresh-random-id');
    expect(item.properties.distinct_id).toBe('fresh-random-id');
    expect(item.properties).not.toHaveProperty('$session_id');
    expect(item.properties['openvaa.app']).toBe('contestant');
  });

  it('never gives a pageview the visit id, even when one reaches it', () => {
    const item = toPostHogBatchItem({ ...EVENTS[0], id: VISIT_ID }, () => 'fresh-random-id');
    expect(item.distinct_id).toBe('fresh-random-id');
    expect(item.properties).not.toHaveProperty('$session_id');
    expect(JSON.stringify(item)).not.toContain(VISIT_ID);
  });

  it('does not change the event it maps', () => {
    const event = structuredClone(EVENTS[1]);
    toPostHogBatchItem(event, () => 'x');
    expect(event).toEqual(EVENTS[1]);
  });
});

describe('createPostHogProvider', () => {
  it('is named posthog and sends nothing for an empty batch', async () => {
    const { fetch, calls } = recordingFetch();
    const provider = createPostHogProvider({ host: HOST, key: KEY, fetch, randomId: countingRandomId() });
    expect(provider.name).toBe('posthog');
    await provider.capture([]);
    expect(calls).toHaveLength(0);
  });

  it('sends one POST to the configured host at /batch/, with the content type as its only header', async () => {
    const { fetch, calls } = recordingFetch();
    await createPostHogProvider({ host: HOST, key: KEY, fetch, randomId: countingRandomId() }).capture(EVENTS);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`${HOST}/batch/`);
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.redirect).toBe('error');
    expect(headerNames(calls[0].init)).toEqual(['content-type']);
    expect(Object.keys(calls[0].init.headers ?? {})).toEqual(['Content-Type']);
    expect(new Headers(calls[0].init.headers).get('content-type')).toBe('application/json');
  });

  it('sends the key and one item per event, each with the privacy properties', async () => {
    const { fetch, calls } = recordingFetch();
    await createPostHogProvider({ host: HOST, key: KEY, fetch, randomId: countingRandomId() }).capture(EVENTS);

    const body = bodyOf(calls);
    expect(Object.keys(body).sort()).toEqual(['api_key', 'batch']);
    expect(body.api_key).toBe(KEY);
    expect(body.batch).toHaveLength(EVENTS.length);
    body.batch.forEach((item, i) => {
      expect(item.event).toBe(EVENTS[i].name);
      expect(item.timestamp).toBe(new Date(EVENTS[i].time).toISOString());
      expect(item.properties).toMatchObject({
        ...EVENTS[i].attributes,
        'openvaa.app': EVENTS[i].app,
        $process_person_profile: false,
        $geoip_disable: true
      });
    });
  });

  it('never lets a pageview share an id with another event of its batch', async () => {
    const { fetch, calls } = recordingFetch();
    await createPostHogProvider({ host: HOST, key: KEY, fetch, randomId: countingRandomId() }).capture(EVENTS);

    const [pageview, answer] = bodyOf(calls).batch;
    expect(answer.distinct_id).toBe(VISIT_ID);
    expect(answer.properties.$session_id).toBe(VISIT_ID);
    expect(pageview.distinct_id).not.toBe(answer.distinct_id);
    expect(pageview.properties).not.toHaveProperty('$session_id');
  });

  it('gives every event with no visit id its own distinct_id', async () => {
    const { fetch, calls } = recordingFetch();
    const anonymous = EVENTS.map(({ id: _id, ...event }) => event);
    await createPostHogProvider({ host: HOST, key: KEY, fetch, randomId: countingRandomId() }).capture([
      ...anonymous,
      ...anonymous
    ]);

    const ids = bodyOf(calls).batch.map((item) => item.distinct_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('sends nothing of the inbound request: no planted value, no other header, no forbidden member', async () => {
    const { fetch, calls } = recordingFetch();
    await createPostHogProvider({ host: HOST, key: KEY, fetch, randomId: countingRandomId() }).capture(EVENTS);

    expect(calls).toHaveLength(1);
    expect(findLeaks(calls)).toEqual([]);
  });

  it('control: the same detector reports a provider that copies the address and user agent', async () => {
    const { fetch, calls } = recordingFetch();
    await createLeakyProvider(INBOUND, fetch).capture(EVENTS);

    const leaks = findLeaks(calls);
    expect(leaks).toEqual(
      expect.arrayContaining([
        `planted value ${PLANTED_ADDRESS}`,
        `planted value ${PLANTED_USER_AGENT}`,
        'header user-agent',
        'header x-forwarded-for',
        'property $ip',
        'property $raw_user_agent',
        'property $referrer',
        'planted value zz9-referrer-marker'
      ])
    );
  });

  describe('when the forward fails', () => {
    /** Everything that must never appear in a failure record. */
    const NEVER_LOGGED = [HOST, 'zz9plural', KEY, VISIT_ID, ATTRIBUTE_MARKER, 'posthog-body-marker'];

    /**
     * Assert that exactly one warning was logged, with the given fields and nothing secret.
     *
     * @param fields - The fields the one record must carry.
     */
    function expectOneSafeWarning(fields: Record<string, unknown>): void {
      expect(logSpies.warn).toHaveBeenCalledTimes(1);
      expect(logSpies.warn.mock.calls[0][1]).toEqual(fields);
      for (const spy of [logSpies.debug, logSpies.info, logSpies.error]) expect(spy).not.toHaveBeenCalled();
      const logged = JSON.stringify(logSpies.warn.mock.calls);
      for (const secret of NEVER_LOGGED) expect(logged).not.toContain(secret);
    }

    it('resolves on a rejected call and logs only the transport code', async () => {
      const failure = new TypeError(`fetch failed for ${HOST}`, {
        cause: Object.assign(new Error(`getaddrinfo ENOTFOUND ${HOST}`), { code: 'ENOTFOUND' })
      });
      const { fetch } = recordingFetch(failure);

      await expect(
        createPostHogProvider({ host: HOST, key: KEY, fetch, randomId: countingRandomId() }).capture(EVENTS)
      ).resolves.toBeUndefined();
      expectOneSafeWarning({ transport: 'ENOTFOUND' });
    });

    it('logs unidentified for a transport code that is not a symbolic constant', async () => {
      const failure = new TypeError('fetch failed', { cause: { code: `${HOST}/x` } });
      const { fetch } = recordingFetch(failure);

      await createPostHogProvider({ host: HOST, key: KEY, fetch, randomId: countingRandomId() }).capture(EVENTS);
      expectOneSafeWarning({ transport: 'unidentified' });
    });

    it('resolves on status 500 and logs only the status', async () => {
      const { fetch, calls } = recordingFetch(new Response('posthog-body-marker zz9plural', { status: 500 }));

      await expect(
        createPostHogProvider({ host: HOST, key: KEY, fetch, randomId: countingRandomId() }).capture(EVENTS)
      ).resolves.toBeUndefined();
      expect(calls).toHaveLength(1);
      expectOneSafeWarning({ status: 500 });
    });

    it('logs nothing on a success', async () => {
      const { fetch } = recordingFetch(new Response('{"status":1}', { status: 200 }));
      await createPostHogProvider({ host: HOST, key: KEY, fetch, randomId: countingRandomId() }).capture(EVENTS);
      for (const spy of Object.values(logSpies)) expect(spy).not.toHaveBeenCalled();
    });
  });
});
