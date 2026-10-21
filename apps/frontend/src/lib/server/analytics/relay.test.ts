/**
 * The relay as a function over a standard `Request`: what it refuses, what it builds, which ids it lets through, and what it never lets through.
 *
 * Each privacy assertion has a control case that runs the same detector against a deliberately wrong variant and sees it report, so a detector that cannot fail would be noticed.
 *
 * @vitest-environment node
 */

import { log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_BODY_BYTES,
  MAX_PAGEVIEW_DURATION_MS,
  MAX_VISIT_ID_SKEW_MS,
  PAGEVIEW_DURATION_ROUNDING_MS,
  RELAY_PATH
} from '$lib/analytics/constants';
import { SAMPLE_ID, SAMPLE_OTHER_ID, VALID_EVENTS } from '$lib/analytics/events.fixtures';
import { isSensitiveEvent } from '$lib/analytics/events.schema';
import { uuidv7 } from '$lib/analytics/uuidv7';
import { ROUTE } from '$lib/routes/route';
import { createQueue } from './queue';
import { relay } from './relay';
import type { AnalyticsEvent } from '$lib/analytics/analyticsEvent.type';
import type { EventName } from '$lib/analytics/events.schema';
import type { AnalyticsConfig } from './config';
import type { AnalyticsProvider } from './providers';
import type { RelayDeps, RelayInput, RelayStatus } from './relay';

/** The server's own origin, as the route passes it in. */
const ORIGIN = 'https://vaa.example.org';

/** The relay's clock in every case. */
const NOW = 1_792_400_000_000;

/** A visit id stamped a minute before the relay's clock. */
const VISIT_ID = uuidv7(NOW - 60_000, new Uint8Array(10).fill(0x5a));

/** A route id with an allowlist of three parameters, in the voter app. */
const VOTER_ROUTE = ROUTE.ResultEntity;

/** A configuration that keeps events, in the default modes. */
const LOG_CONFIG: AnalyticsConfig = { provider: 'log', consentMode: 'gated', visitIdMode: 'memory' };

/** A value placed in a rejected event, so that its absence from the log can be checked. */
const REJECTED_MARKER = 'zz9plural-rejected-value';

/**
 * Request headers that carry the visitor's address, software, credentials or origin page, each with a value that cannot occur by coincidence, so an assertion on its absence cannot pass by accident.
 */
const PLANTED_HEADERS: Readonly<Record<string, string>> = {
  'x-forwarded-for': '198.51.100.211, 203.0.113.212',
  forwarded: 'for=192.0.2.213;by=zz9plural-forwarded',
  'x-real-ip': '192.0.2.214',
  'cf-connecting-ip': '2001:db8::215',
  'true-client-ip': '198.51.100.216',
  'user-agent': 'Mozilla/5.0 (zz9plural-agent; Planted) Gecko/20100101',
  cookie: 'sb-access-token=zz9plural-cookie-token',
  authorization: 'Bearer zz9plural-authorization-token',
  referer: 'https://vaa.example.org/results?zz9plural-referer=1',
  'accept-language': 'fi-FI, zz9plural-language;q=0.5',
  'sec-ch-ua': '"zz9plural-client-hints";v="9"'
};

/** Everything that must never appear in a queued event or a log record. */
const FORBIDDEN = [
  ...Object.values(PLANTED_HEADERS),
  '198.51.100.211',
  '203.0.113.212',
  '192.0.2.213',
  '192.0.2.214',
  '2001:db8::215',
  '198.51.100.216',
  'zz9plural'
];

/**
 * Give a wire event the visit id, or the one given.
 *
 * @param event - A wire event that may carry an id.
 * @param id - The id to give it.
 */
function withId<TEvent extends object>(event: TEvent, id = VISIT_ID): TEvent & { id: string } {
  return { ...event, id };
}

/**
 * A batch body.
 *
 * @param events - The events of the batch.
 * @param routeId - The route id of the view; a voter route by default.
 */
function batch(events: Array<unknown>, routeId: string = VOTER_ROUTE): Record<string, unknown> {
  return { routeId, locale: 'en', events };
}

/**
 * A POST to the relay path. It is same-origin and JSON unless the headers say otherwise; a header given as `undefined` is left out.
 *
 * @param body - A value sent as JSON, or a string sent as it is.
 * @param headers - Headers added to, or removed from, the defaults.
 */
function post(body: unknown, headers: Record<string, string | undefined> = {}): Request {
  const merged = new Headers();
  const all: Record<string, string | undefined> = {
    'content-type': 'application/json',
    'sec-fetch-site': 'same-origin',
    ...headers
  };
  for (const [name, value] of Object.entries(all)) if (value !== undefined) merged.set(name, value);
  return new Request(`${ORIGIN}${RELAY_PATH}`, {
    method: 'POST',
    headers: merged,
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
}

/** A valid request with a pageview and two events that carry the visit id. */
function validRequest(headers: Record<string, string | undefined> = {}): Request {
  return post(batch([VALID_EVENTS.pageview, withId(VALID_EVENTS.answer), withId(VALID_EVENTS.menu_open)]), headers);
}

/** The outcome of one relay call: its status and every batch handed to `enqueue`. */
type Outcome = { status: RelayStatus; calls: Array<Array<AnalyticsEvent>>; queued: Array<AnalyticsEvent> };

/** The relay under test, or a test-local variant of it with the same signature. */
type Relay = (input: RelayInput, deps: RelayDeps) => Promise<RelayStatus>;

/**
 * Run a relay with a recording `enqueue` and the fixed clock.
 *
 * @param request - The request.
 * @param config - The configuration; provider `log` in the default modes unless given.
 * @param run - The relay or a variant of it.
 */
async function call(request: Request, config: AnalyticsConfig = LOG_CONFIG, run: Relay = relay): Promise<Outcome> {
  const calls: Array<Array<AnalyticsEvent>> = [];
  const status = await run(
    { request, origin: ORIGIN },
    {
      config,
      now: () => NOW,
      enqueue: (events) => {
        calls.push([...events]);
        return events.length;
      }
    }
  );
  return { status, calls, queued: calls.flat() };
}

/**
 * The detector of the "nothing is kept" cases: whether a request reached the queue at all.
 *
 * @param request - The request.
 * @param config - The configuration.
 */
async function reachesQueue(request: Request, config: AnalyticsConfig = LOG_CONFIG): Promise<boolean> {
  const { status, calls } = await call(request, config);
  expect(status).toBe(204);
  return calls.length > 0;
}

/** Everything written to the logger and the console during the current test. */
const logSpies = [
  vi.spyOn(log, 'debug'),
  vi.spyOn(log, 'info'),
  vi.spyOn(log, 'warn'),
  vi.spyOn(log, 'error'),
  vi.spyOn(console, 'log'),
  vi.spyOn(console, 'info'),
  vi.spyOn(console, 'warn'),
  vi.spyOn(console, 'error'),
  vi.spyOn(console, 'debug')
];

/** Every argument of every logger and console call in the current test, serialised. */
function loggedText(): string {
  return logSpies.flatMap((spy) => spy.mock.calls.map((args) => JSON.stringify(args))).join('\n');
}

/**
 * The privacy detector: which forbidden values occur in a text.
 *
 * @param text - Serialised events and log records.
 * @returns The forbidden values found, empty when none is.
 */
function plantedValuesIn(text: string): Array<string> {
  return FORBIDDEN.filter((value) => text.includes(value));
}

/** A promise with its resolver, for a provider that has not answered yet. */
function deferred(): { promise: Promise<void>; resolve: () => void } {
  let release: (() => void) | undefined;
  const promise = new Promise<void>((r) => {
    release = r;
  });
  return { promise, resolve: () => release?.() };
}

/**
 * The "answered before the provider resolved" detector.
 *
 * The relay's `enqueue` puts the events in a real queue and starts its flush at once, so the stand-in provider is already holding an unresolved promise while the relay finishes. The result says whether the relay answered within a short real-time window while that promise was still pending.
 *
 * @param makeRelay - Builds the relay, or a variant of it, around the stand-in provider.
 * @returns `true` when the relay answered while the provider had not resolved.
 */
async function answersBeforeProviderResolves(makeRelay: (provider: AnalyticsProvider) => Relay): Promise<boolean> {
  const held = deferred();
  const provider: AnalyticsProvider = { name: 'log', capture: vi.fn(() => held.promise) };
  const queue = createQueue({ provider, flushIntervalMs: 60_000 });
  const answered = makeRelay(provider)(
    { request: validRequest(), origin: ORIGIN },
    {
      config: LOG_CONFIG,
      now: () => NOW,
      enqueue: (events) => {
        const kept = queue.enqueue(events);
        void queue.flush();
        return kept;
      }
    }
  ).then(() => true);
  const waited = new Promise<false>((resolve) => setTimeout(() => resolve(false), 50));
  const result = await Promise.race([answered, waited]);
  expect(provider.capture).toHaveBeenCalled();
  held.resolve();
  queue.stop();
  await answered;
  return result;
}

beforeEach(() => {
  for (const spy of logSpies) spy.mockImplementation(() => {});
});

afterEach(() => {
  for (const spy of logSpies) spy.mockReset();
});

describe('relay: provider none', () => {
  it('answers 204 without reading the request at all', async () => {
    const untouchable = new Proxy(
      {},
      {
        get() {
          throw new Error('the request was read');
        }
      }
    ) as unknown as Request;
    const enqueue = vi.fn(() => 0);
    const status = await relay(
      { request: untouchable, origin: ORIGIN },
      { config: { ...LOG_CONFIG, provider: 'none' }, enqueue, now: () => NOW }
    );
    expect(status).toBe(204);
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('answers 204 for a request whose body cannot be read, and leaves the body unread', async () => {
    const failing = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.error(new Error('the body was read'));
      }
    });
    const request = new Request(`${ORIGIN}${RELAY_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
      body: failing,
      duplex: 'half'
    } as RequestInit);
    const { status, calls } = await call(request, { ...LOG_CONFIG, provider: 'none' });
    expect(status).toBe(204);
    expect(calls).toEqual([]);
    expect(request.bodyUsed).toBe(false);
  });

  it('keeps nothing with provider none; control: the same request with provider log is kept', async () => {
    expect(await reachesQueue(validRequest(), { ...LOG_CONFIG, provider: 'none' })).toBe(false);
    expect(await reachesQueue(validRequest(), LOG_CONFIG)).toBe(true);
  });
});

describe('relay: Sec-GPC', () => {
  it('answers 204 and keeps nothing for a request that carries Sec-GPC', async () => {
    expect(await reachesQueue(validRequest({ 'sec-gpc': '1' }))).toBe(false);
  });

  it('control: the same request without the header is kept', async () => {
    expect(await reachesQueue(validRequest())).toBe(true);
  });

  it('drops the pageview too, in the consent-free mode as well', async () => {
    const request = post(batch([VALID_EVENTS.pageview]), { 'sec-gpc': '1' });
    expect(await reachesQueue(request, { ...LOG_CONFIG, consentMode: 'free' })).toBe(false);
  });
});

describe('relay: same origin', () => {
  it.each([
    ['Sec-Fetch-Site same-origin', { 'sec-fetch-site': 'same-origin' }, 204],
    [
      'Sec-Fetch-Site same-origin with another Origin',
      { 'sec-fetch-site': 'same-origin', origin: 'https://evil.example' },
      204
    ],
    ['Sec-Fetch-Site cross-site', { 'sec-fetch-site': 'cross-site' }, 403],
    ['Sec-Fetch-Site same-site', { 'sec-fetch-site': 'same-site' }, 403],
    ['Sec-Fetch-Site none', { 'sec-fetch-site': 'none' }, 403],
    ['Sec-Fetch-Site cross-site with the own Origin', { 'sec-fetch-site': 'cross-site', origin: ORIGIN }, 403],
    ['no Sec-Fetch-Site and the own Origin', { 'sec-fetch-site': undefined, origin: ORIGIN }, 204],
    ['no Sec-Fetch-Site and another Origin', { 'sec-fetch-site': undefined, origin: 'https://evil.example' }, 403],
    ['no Sec-Fetch-Site and Origin null', { 'sec-fetch-site': undefined, origin: 'null' }, 403],
    ['neither header', { 'sec-fetch-site': undefined }, 403]
  ] as const)('%s answers %i', async (_, headers, expected) => {
    const { status, calls } = await call(validRequest(headers));
    expect(status).toBe(expected);
    expect(calls.length > 0).toBe(expected === 204);
  });
});

describe('relay: the body', () => {
  it('answers 415 for a body that is not JSON by its content type', async () => {
    const { status, calls } = await call(validRequest({ 'content-type': 'text/plain' }));
    expect(status).toBe(415);
    expect(calls).toEqual([]);
  });

  it('answers 415 when the content type is missing', async () => {
    const request = new Request(`${ORIGIN}${RELAY_PATH}`, {
      method: 'POST',
      headers: { 'sec-fetch-site': 'same-origin' },
      body: new TextEncoder().encode(JSON.stringify(batch([VALID_EVENTS.pageview])))
    });
    expect(request.headers.get('content-type')).toBeNull();
    expect((await call(request)).status).toBe(415);
  });

  it('accepts the JSON media type with parameters and in another case', async () => {
    expect((await call(validRequest({ 'content-type': 'application/json; charset=utf-8' }))).status).toBe(204);
    expect((await call(validRequest({ 'content-type': 'Application/JSON' }))).status).toBe(204);
  });

  it('answers 413 for a declared length above the cap, without reading the body', async () => {
    const request = validRequest({ 'content-length': String(MAX_BODY_BYTES + 1) });
    expect(request.headers.get('content-length')).toBe(String(MAX_BODY_BYTES + 1));
    const { status, calls } = await call(request);
    expect(status).toBe(413);
    expect(calls).toEqual([]);
    expect(request.bodyUsed).toBe(false);
  });

  it('answers 413 for a body longer than the cap that declares no length', async () => {
    const padding = 'a'.repeat(MAX_BODY_BYTES);
    const request = post(JSON.stringify({ ...batch([VALID_EVENTS.pageview]), padding }));
    expect(request.headers.get('content-length')).toBeNull();
    const { status, calls } = await call(request);
    expect(status).toBe(413);
    expect(calls).toEqual([]);
  });

  it('counts the cap in bytes, not characters', async () => {
    const characters = Math.ceil(MAX_BODY_BYTES / 2);
    const request = post(JSON.stringify({ padding: 'ä'.repeat(characters) }));
    expect(characters).toBeLessThan(MAX_BODY_BYTES);
    expect((await call(request)).status).toBe(413);
  });

  it('answers 400 for a body that is not JSON', async () => {
    const { status, calls } = await call(post('{"routeId": '));
    expect(status).toBe(400);
    expect(calls).toEqual([]);
  });

  it('answers 400 for a route id that is not listed', async () => {
    const { status, calls } = await call(post(batch([VALID_EVENTS.pageview], '/no/such/route')));
    expect(status).toBe(400);
    expect(calls).toEqual([]);
  });

  it('answers 400 for an empty event list', async () => {
    const { status, calls } = await call(post(batch([])));
    expect(status).toBe(400);
    expect(calls).toEqual([]);
  });

  it('answers 400 for an envelope with an unknown member', async () => {
    const { status } = await call(post({ ...batch([VALID_EVENTS.pageview]), extra: 1 }));
    expect(status).toBe(400);
  });
});

describe('relay: the events it builds', () => {
  it('answers 204 and calls enqueue once, stamping each event with the clock minus its age and the app of the route', async () => {
    const { status, calls, queued } = await call(validRequest());
    expect(status).toBe(204);
    expect(calls).toHaveLength(1);
    expect(queued.map(({ name, time, app }) => ({ name, time, app }))).toEqual([
      { name: 'pageview', time: NOW - VALID_EVENTS.pageview.ago, app: 'voter' },
      { name: 'answer', time: NOW - VALID_EVENTS.answer.ago, app: 'voter' },
      { name: 'menu_open', time: NOW - VALID_EVENTS.menu_open.ago, app: 'voter' }
    ]);
  });

  it('derives the app from the envelope route id', async () => {
    const { queued } = await call(
      post(batch([VALID_EVENTS.pageview, withId(VALID_EVENTS.menu_open)], ROUTE.ContestantAppHelp))
    );
    expect(queued.map(({ app }) => app)).toEqual(['contestant', 'contestant']);
  });

  it('builds the pageview from the route id, the locale, the allowed parameters and the duration, with no id', async () => {
    const pageview = {
      ...VALID_EVENTS.pageview,
      attributes: {
        duration: 12_345,
        params: { electionTab: SAMPLE_ID, entityTab: 'candidates', entity: 'candidate', id: SAMPLE_OTHER_ID }
      }
    };
    const { queued } = await call(post(batch([pageview])));
    expect(queued).toHaveLength(1);
    expect(queued[0]).not.toHaveProperty('id');
    expect(queued[0].attributes).toEqual({
      routeId: VOTER_ROUTE,
      locale: 'en',
      duration: 12_300,
      params: { electionTab: SAMPLE_ID, entityTab: 'candidates', entity: 'candidate' }
    });
    expect(JSON.stringify(queued)).not.toContain(SAMPLE_OTHER_ID);
  });

  it('caps a long duration and rounds it down to the step', async () => {
    const durations = [MAX_PAGEVIEW_DURATION_MS + 12_345, 99, 0];
    const pageviews = durations.map((duration) => ({
      ...VALID_EVENTS.pageview,
      attributes: { ...VALID_EVENTS.pageview.attributes, duration }
    }));
    const { queued } = await call(post(batch(pageviews)));
    const recorded = queued.map((event) => event.attributes.duration);
    expect(recorded).toEqual([MAX_PAGEVIEW_DURATION_MS, 0, 0]);
    for (const value of recorded) expect(value % PAGEVIEW_DURATION_ROUNDING_MS).toBe(0);
  });

  it('never queues a pageview with an id, even when a changed client sends one', async () => {
    const { status, queued } = await call(
      post(batch([withId(VALID_EVENTS.pageview), VALID_EVENTS.pageview, withId(VALID_EVENTS.answer)]))
    );
    expect(status).toBe(204);
    const pageviews = queued.filter(({ name }) => name === 'pageview');
    expect(pageviews).toHaveLength(1);
    for (const pageview of pageviews) expect(pageview).not.toHaveProperty('id');
  });

  it('queues the valid events of a batch with one invalid event, and logs only the count', async () => {
    const bad = { ...VALID_EVENTS.feedback_sent, attributes: { rating: 4, description: REJECTED_MARKER } };
    const { status, queued } = await call(post(batch([VALID_EVENTS.pageview, bad, withId(VALID_EVENTS.menu_open)])));
    expect(status).toBe(204);
    expect(queued.map(({ name }) => name)).toEqual(['pageview', 'menu_open']);
    expect(log.debug).toHaveBeenCalledTimes(1);
    expect(vi.mocked(log.debug).mock.calls[0][1]).toEqual({ dropped: 1 });
    expect(loggedText()).not.toContain(REJECTED_MARKER);
    expect(JSON.stringify(queued)).not.toContain(REJECTED_MARKER);
  });

  it('answers 204 and queues nothing when every event is invalid', async () => {
    const { status, calls } = await call(post(batch([{ name: 'nope', ago: 0, attributes: {} }])));
    expect(status).toBe(204);
    expect(calls).toEqual([]);
  });
});

describe('relay: the id rules', () => {
  /** Every sample of the vocabulary, each that may carry one given the visit id. */
  const everyEvent = Object.values(VALID_EVENTS).map((event) => ('id' in event ? withId(event) : event));

  /** The names of the queued events that carry an id. */
  function namesWithId(queued: Array<AnalyticsEvent>): Array<string> {
    return queued.filter((event) => event.id !== undefined).map(({ name }) => name);
  }

  it('memory and gated: an answer keeps a current visit id, and so does every event but the pageview', async () => {
    const { queued } = await call(post(batch(everyEvent)));
    expect(queued).toHaveLength(everyEvent.length);
    expect(queued.find(({ name }) => name === 'answer')?.id).toBe(VISIT_ID);
    expect(namesWithId(queued)).toEqual(everyEvent.map(({ name }) => name).filter((name) => name !== 'pageview'));
  });

  it('visit-id mode none: no queued event has an id', async () => {
    const { queued } = await call(post(batch(everyEvent)), { ...LOG_CONFIG, visitIdMode: 'none' });
    expect(queued).toHaveLength(everyEvent.length);
    expect(namesWithId(queued)).toEqual([]);
  });

  it('consent mode free: every sensitive event loses its id and every other event keeps it', async () => {
    const { queued } = await call(post(batch(everyEvent)), { ...LOG_CONFIG, consentMode: 'free' });
    expect(queued.find(({ name }) => name === 'answer')).not.toHaveProperty('id');
    expect(queued.find(({ name }) => name === 'menu_open')?.id).toBe(VISIT_ID);
    for (const event of queued) {
      const sensitive = isSensitiveEvent(event.name as EventName);
      expect(event.id === undefined).toBe(sensitive || event.name === 'pageview');
    }
  });

  it.each([
    ['older than the skew allows', NOW - MAX_VISIT_ID_SKEW_MS - 1, false],
    ['newer than the skew allows', NOW + MAX_VISIT_ID_SKEW_MS + 1, false],
    ['at the edge of the skew', NOW - MAX_VISIT_ID_SKEW_MS, true]
  ])('an id stamped %s is kept: %s', async (_, stampedAt, kept) => {
    const id = uuidv7(stampedAt, new Uint8Array(10).fill(0x33));
    const { queued } = await call(post(batch([withId(VALID_EVENTS.menu_open, id)])));
    expect(queued).toHaveLength(1);
    expect(queued[0].id).toBe(kept ? id : undefined);
  });

  it('an id that is not a UUIDv7 never reaches the queue', async () => {
    const { queued } = await call(
      post(batch([withId(VALID_EVENTS.menu_open, SAMPLE_OTHER_ID), VALID_EVENTS.pageview]))
    );
    expect(queued.map(({ name }) => name)).toEqual(['pageview']);
    expect(JSON.stringify(queued)).not.toContain(SAMPLE_OTHER_ID);
  });
});

describe('relay: nothing of the request but the validated events crosses', () => {
  /** A request with every planted header, every sample event and one rejected event, so the log path runs too. */
  function plantedRequest(): Request {
    const bad = { ...VALID_EVENTS.feedback_sent, attributes: { rating: 4, description: REJECTED_MARKER } };
    const events = [...Object.values(VALID_EVENTS).map((event) => ('id' in event ? withId(event) : event)), bad];
    const request = post(batch(events), PLANTED_HEADERS);
    for (const [name, value] of Object.entries(PLANTED_HEADERS)) expect(request.headers.get(name)).toBe(value);
    return request;
  }

  /**
   * A deliberately leaky relay: it copies the user agent into an attribute of every event.
   *
   * @param input - The relay's input.
   * @param deps - The relay's dependencies.
   */
  function leakyRelay(input: RelayInput, deps: RelayDeps): Promise<RelayStatus> {
    return relay(input, {
      ...deps,
      enqueue: (events) =>
        deps.enqueue(
          events.map((event) => ({
            ...event,
            attributes: { ...event.attributes, agent: input.request.headers.get('user-agent') }
          }))
        )
    });
  }

  it('queues and logs none of the planted values', async () => {
    const { status, queued } = await call(plantedRequest());
    expect(status).toBe(204);
    expect(queued.length).toBeGreaterThan(0);
    expect(log.debug).toHaveBeenCalled();
    expect(plantedValuesIn(`${JSON.stringify(queued)}\n${loggedText()}`)).toEqual([]);
  });

  it('control: a relay that copies the user agent is reported by the same detector', async () => {
    const { queued } = await call(plantedRequest(), LOG_CONFIG, leakyRelay);
    expect(plantedValuesIn(`${JSON.stringify(queued)}\n${loggedText()}`)).toContain(PLANTED_HEADERS['user-agent']);
  });
});

describe('relay: it never waits for the provider', () => {
  it('answers 204 while the provider behind the queue has not resolved', async () => {
    expect(await answersBeforeProviderResolves(() => relay)).toBe(true);
  });

  it('control: a variant that awaits the provider is detected by the same assertion', async () => {
    function awaitingRelay(provider: AnalyticsProvider): Relay {
      return async (input, deps) => {
        let handed: ReadonlyArray<AnalyticsEvent> = [];
        const status = await relay(input, {
          ...deps,
          enqueue: (events) => {
            handed = events;
            return deps.enqueue(events);
          }
        });
        await provider.capture(handed);
        return status;
      };
    }
    expect(await answersBeforeProviderResolves(awaitingRelay)).toBe(false);
  });
});
