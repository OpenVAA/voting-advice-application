/**
 * The batch envelope and its parser: a strict envelope with a listed route id and a supported locale, each event judged alone, and a result that holds a count of what was dropped and nothing of it.
 */
import { describe, expect, it } from 'vitest';
import { ROUTE } from '$lib/routes/route';
import { BatchSchema, parseBatch } from './batch.schema';
import { MAX_BATCH_EVENTS } from './constants';
import { VALID_EVENTS } from './events.fixtures';

/** A route id the pageview allowlist lists. */
const LISTED_ROUTE = ROUTE.ResultEntity;

/** A distinctive value placed in a rejected event, so that its absence from the result can be checked. */
const MARKER = 'rejected-marker-value';

/**
 * A valid body with the given events.
 *
 * @param events - The events of the batch.
 * @returns A batch body for the listed route in English.
 */
function body(events: Array<unknown>): Record<string, unknown> {
  return { routeId: LISTED_ROUTE, locale: 'en', events };
}

describe('parseBatch', () => {
  it('accepts a body with a listed route, a supported locale and valid events, and drops nothing', () => {
    const events = [VALID_EVENTS.pageview, VALID_EVENTS.answer, VALID_EVENTS.menu_open];
    const result = parseBatch(body(events));
    expect(result).toEqual({ ok: true, routeId: LISTED_ROUTE, locale: 'en', events, dropped: 0 });
  });

  it('accepts every sample in one batch', () => {
    const result = parseBatch(body(Object.values(VALID_EVENTS)));
    expect(result.ok && result.dropped).toBe(0);
    expect(result.ok && result.events.length).toBe(Object.keys(VALID_EVENTS).length);
  });

  it('keeps the valid events and counts the invalid one when one event among three is bad', () => {
    const bad = { ...VALID_EVENTS.feedback_sent, attributes: { rating: 4, description: MARKER } };
    const result = parseBatch(body([VALID_EVENTS.answer, bad, VALID_EVENTS.menu_open]));
    expect(result).toEqual({
      ok: true,
      routeId: LISTED_ROUTE,
      locale: 'en',
      events: [VALID_EVENTS.answer, VALID_EVENTS.menu_open],
      dropped: 1
    });
  });

  it('keeps a body whose every event is bad, with nothing kept and every event counted', () => {
    const result = parseBatch(body([{ name: 'nope', ago: 0, attributes: {} }, null]));
    expect(result).toEqual({ ok: true, routeId: LISTED_ROUTE, locale: 'en', events: [], dropped: 2 });
  });

  it('returns the parsed event, so a media URL arrives without its query string', () => {
    const video = {
      ...VALID_EVENTS.video,
      attributes: { ...VALID_EVENTS.video.attributes, src: 'https://m.example.org/a.mp4?t=1' }
    };
    const result = parseBatch(body([video]));
    const kept = result.ok ? result.events[0] : undefined;
    expect(kept?.name === 'video' ? kept.attributes.src : undefined).toBe('https://m.example.org/a.mp4');
  });

  it('holds no value of a rejected event and no issue', () => {
    const bad = { ...VALID_EVENTS.feedback_sent, attributes: { rating: 4, description: MARKER } };
    const result = parseBatch(body([bad]));
    expect(Object.keys(result).sort()).toEqual(['dropped', 'events', 'locale', 'ok', 'routeId']);
    expect(JSON.stringify(result)).not.toContain(MARKER);
    expect(JSON.stringify(result)).not.toContain('description');
  });

  it.each([
    ['a route id the allowlist does not list', { ...body([VALID_EVENTS.menu_open]), routeId: '/not-a-route' }],
    ['a path in place of the route id', { ...body([VALID_EVENTS.menu_open]), routeId: '/en/results/candidates' }],
    ['an inherited name as the route id', { ...body([VALID_EVENTS.menu_open]), routeId: '__proto__' }],
    ['a locale outside the locale list', { ...body([VALID_EVENTS.menu_open]), locale: 'de' }],
    ['a locale that is not a string', { ...body([VALID_EVENTS.menu_open]), locale: 1 }],
    ['an unknown key in the envelope', { ...body([VALID_EVENTS.menu_open]), href: 'https://example.org/' }],
    ['no events member', { routeId: LISTED_ROUTE, locale: 'en' }],
    ['an empty events array', body([])],
    [
      'more events than a batch may hold',
      body(Array.from({ length: MAX_BATCH_EVENTS + 1 }, () => VALID_EVENTS.menu_open))
    ],
    ['events that are not an array', { ...body([]), events: VALID_EVENTS.menu_open }],
    ['an array body', [VALID_EVENTS.menu_open]],
    ['a string body', 'routeId'],
    ['a number body', 7],
    ['null', null],
    ['undefined', undefined]
  ])('refuses %s', (_, input) => {
    expect(parseBatch(input)).toEqual({ ok: false });
  });

  it('accepts exactly as many events as a batch may hold', () => {
    const result = parseBatch(body(Array.from({ length: MAX_BATCH_EVENTS }, () => VALID_EVENTS.menu_open)));
    expect(result.ok && result.events.length).toBe(MAX_BATCH_EVENTS);
  });

  it.each(['en', 'fi', 'sv', 'da', 'et', 'fr', 'lb'])('accepts the locale %s', (locale) => {
    expect(parseBatch({ ...body([VALID_EVENTS.menu_open]), locale }).ok).toBe(true);
  });
});

describe('BatchSchema', () => {
  it('leaves the events unjudged, so the envelope of a batch with a bad event still parses', () => {
    expect(BatchSchema.safeParse(body([{ name: 'nope' }])).success).toBe(true);
  });
});
