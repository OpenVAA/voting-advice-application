import { describe, expect, it } from 'vitest';
import { parseBatch } from '$lib/analytics/batch.schema';
import { MAX_BATCH_BYTES, MAX_BATCH_EVENTS } from '$lib/analytics/constants';
import { SAMPLE_ID, SAMPLE_VISIT_ID, VALID_EVENTS } from '$lib/analytics/events.fixtures';
import { ROUTE } from '$lib/routes/route';
import { buildBatch } from './batchBuilder';
import type { EventName } from '$lib/analytics/events.schema';
import type { AnalyticsProjection, ConsentMode, VisitIdMode } from '$lib/analytics/modes';
import type { BufferedEvent } from './batchBuilder';
import type { PageviewDraft, View } from './viewTracker';

const NOW = 100_000;

const VIEW: View = {
  routeId: ROUTE.ResultEntity,
  locale: 'en',
  params: { electionTab: SAMPLE_ID, entityTab: 'candidates', entity: 'candidate' }
};

const PAGEVIEW: PageviewDraft = { ...VIEW, duration: 12_345 };

function projection(consentMode: ConsentMode = 'gated', visitIdMode: VisitIdMode = 'memory'): AnalyticsProjection {
  return { active: true, consentMode, visitIdMode };
}

/** A buffered event built from the vocabulary's valid sample of `name`. */
function buffered(name: EventName, at = NOW - 1_000): BufferedEvent {
  const sample: { attributes: Record<string, JSONData> } = VALID_EVENTS[name];
  return { name, attributes: sample.attributes, at };
}

/** The parsed body, failing the test when it is missing or refused. */
function parse(body: string | undefined) {
  expect(body).toBeTypeOf('string');
  const parsed = parseBatch(JSON.parse(body ?? 'null'));
  if (!parsed.ok) throw new Error('The batch envelope was refused');
  return parsed;
}

/** The raw events of a body, as sent. */
function rawEvents(body: string | undefined): Array<Record<string, unknown>> {
  return (JSON.parse(body ?? '{"events":[]}') as { events: Array<Record<string, unknown>> }).events;
}

function idOf(body: string | undefined, name: EventName): unknown {
  const event = rawEvents(body).find((e) => e.name === name);
  expect(event).toBeDefined();
  return event?.id;
}

describe('buildBatch', () => {
  it('builds a body the batch parser accepts whole, with the pageview first', () => {
    const body = buildBatch({
      view: VIEW,
      pageview: PAGEVIEW,
      events: [buffered('answer'), buffered('menu_open')],
      visitId: SAMPLE_VISIT_ID,
      projection: projection(),
      now: NOW
    });
    const parsed = parse(body);
    expect(parsed.dropped).toBe(0);
    expect(parsed.routeId).toBe(VIEW.routeId);
    expect(parsed.locale).toBe(VIEW.locale);
    expect(parsed.events.map((e) => e.name)).toEqual(['pageview', 'answer', 'menu_open']);
    expect(parsed.events[0]).toEqual({
      name: 'pageview',
      ago: 0,
      attributes: { params: PAGEVIEW.params, duration: PAGEVIEW.duration }
    });
  });

  it.each([
    ['gated', 'memory'],
    ['free', 'memory'],
    ['gated', 'none'],
    ['free', 'none']
  ] as const)('never puts an id on the pageview (consent mode %s, visit-id mode %s)', (consentMode, visitIdMode) => {
    const body = buildBatch({
      view: VIEW,
      pageview: PAGEVIEW,
      events: [buffered('menu_open')],
      visitId: SAMPLE_VISIT_ID,
      projection: projection(consentMode, visitIdMode),
      now: NOW
    });
    const pageview = rawEvents(body)[0];
    expect(pageview.name).toBe('pageview');
    expect(Object.hasOwn(pageview, 'id')).toBe(false);
  });

  describe('the visit id', () => {
    const EVENTS = [buffered('answer'), buffered('menu_open')];

    it('goes on every event in gated mode with visit-id mode memory', () => {
      const body = buildBatch({
        view: VIEW,
        events: EVENTS,
        visitId: SAMPLE_VISIT_ID,
        projection: projection(),
        now: NOW
      });
      expect(idOf(body, 'answer')).toBe(SAMPLE_VISIT_ID);
      expect(idOf(body, 'menu_open')).toBe(SAMPLE_VISIT_ID);
    });

    it('goes only on non-sensitive events in free mode with visit-id mode memory', () => {
      const body = buildBatch({
        view: VIEW,
        events: EVENTS,
        visitId: SAMPLE_VISIT_ID,
        projection: projection('free', 'memory'),
        now: NOW
      });
      expect(idOf(body, 'menu_open')).toBe(SAMPLE_VISIT_ID);
      expect(idOf(body, 'answer')).toBeUndefined();
      expect(Object.hasOwn(rawEvents(body)[0], 'id')).toBe(false);
    });

    it.each(['gated', 'free'] as const)('goes on no event in visit-id mode none (consent mode %s)', (consentMode) => {
      const body = buildBatch({
        view: VIEW,
        events: EVENTS,
        visitId: SAMPLE_VISIT_ID,
        projection: projection(consentMode, 'none'),
        now: NOW
      });
      expect(rawEvents(body).every((e) => !Object.hasOwn(e, 'id'))).toBe(true);
      expect(body).not.toContain(SAMPLE_VISIT_ID);
    });

    it('goes on no event when no visit id is given', () => {
      const body = buildBatch({ view: VIEW, events: EVENTS, projection: projection(), now: NOW });
      expect(rawEvents(body)).toHaveLength(2);
      expect(rawEvents(body).every((e) => !Object.hasOwn(e, 'id'))).toBe(true);
    });
  });

  it('sets ago to now minus the buffered time, never below zero', () => {
    const body = buildBatch({
      view: VIEW,
      events: [buffered('menu_open', NOW - 2_500), buffered('filters_reset', NOW + 40)],
      projection: projection(),
      now: NOW
    });
    expect(rawEvents(body).map((e) => e.ago)).toEqual([2_500, 0]);
  });

  it('leaves out an event that fails the schema and sends the rest', () => {
    const invalid: BufferedEvent = { name: 'menu_open', attributes: { label: 'free text' }, at: NOW };
    const body = buildBatch({
      view: VIEW,
      pageview: PAGEVIEW,
      events: [buffered('answer'), invalid, buffered('filters_reset')],
      visitId: SAMPLE_VISIT_ID,
      projection: projection(),
      now: NOW
    });
    const parsed = parse(body);
    expect(parsed.dropped).toBe(0);
    expect(parsed.events.map((e) => e.name)).toEqual(['pageview', 'answer', 'filters_reset']);
    expect(body).not.toContain('free text');
  });

  it('holds at most the event cap, the pageview included', () => {
    const events = Array.from({ length: MAX_BATCH_EVENTS + 10 }, () => buffered('menu_open'));
    const body = buildBatch({ view: VIEW, pageview: PAGEVIEW, events, projection: projection(), now: NOW });
    const parsed = parse(body);
    expect(parsed.events).toHaveLength(MAX_BATCH_EVENTS);
    expect(parsed.events[0].name).toBe('pageview');
  });

  it('drops events from the end until the body fits the byte cap, keeping the pageview', () => {
    const longValue = Array.from({ length: 25 }, (_, i) => `choice_${String(i).padStart(2, '0')}`).join(',');
    expect(longValue.length).toBeLessThanOrEqual(256);
    const events = Array.from({ length: MAX_BATCH_EVENTS - 1 }, (_, i) => ({
      name: 'answer' as const,
      attributes: { questionId: `question-${i}`, value: longValue },
      at: NOW
    }));
    const body = buildBatch({
      view: VIEW,
      pageview: PAGEVIEW,
      events,
      visitId: SAMPLE_VISIT_ID,
      projection: projection(),
      now: NOW
    });

    // Without the byte cap every event would fit the event cap, and the body would be too large.
    const uncapped = {
      routeId: VIEW.routeId,
      locale: VIEW.locale,
      events: events.map((e) => ({ name: e.name, ago: 0, id: SAMPLE_VISIT_ID, attributes: e.attributes }))
    };
    expect(new TextEncoder().encode(JSON.stringify(uncapped)).length).toBeGreaterThan(MAX_BATCH_BYTES);

    expect(new TextEncoder().encode(body).length).toBeLessThanOrEqual(MAX_BATCH_BYTES);
    const parsed = parse(body);
    expect(parsed.dropped).toBe(0);
    expect(parsed.events[0].name).toBe('pageview');
    const kept = parsed.events.slice(1).map((e) => (e.attributes as { questionId: string }).questionId);
    expect(kept.length).toBeGreaterThan(0);
    expect(kept.length).toBeLessThan(events.length);
    // The kept events are the first ones, in order: the dropped ones came off the end.
    expect(kept).toEqual(events.slice(0, kept.length).map((e) => e.attributes.questionId));
    // Only as many were dropped as needed: the next one would not have fitted.
    const next = events[kept.length];
    const nextSize = new TextEncoder().encode(
      JSON.stringify({ name: next.name, ago: 0, id: SAMPLE_VISIT_ID, attributes: next.attributes })
    ).length;
    expect(new TextEncoder().encode(body).length + 1 + nextSize).toBeGreaterThan(MAX_BATCH_BYTES);
  });

  it('measures the byte cap in UTF-8 bytes, not characters', () => {
    // Every character here is one UTF-16 unit and three UTF-8 bytes, so a character count would let the body through.
    const events = Array.from({ length: 40 }, () => ({
      name: 'video' as const,
      attributes: { src: `https://example.org/${'€'.repeat(150)}` },
      at: NOW
    }));
    const body = buildBatch({ view: VIEW, events, projection: projection('gated', 'none'), now: NOW });
    expect(body).toBeTypeOf('string');
    expect(new TextEncoder().encode(body).length).toBeLessThanOrEqual(MAX_BATCH_BYTES);
    // In characters, all forty events would fit.
    expect(JSON.stringify(events).length).toBeLessThan(MAX_BATCH_BYTES);
    expect(rawEvents(body).length).toBeGreaterThan(0);
    expect(rawEvents(body).length).toBeLessThan(40);
  });

  it('returns undefined when there is no pageview and no valid event', () => {
    expect(buildBatch({ view: VIEW, events: [], projection: projection(), now: NOW })).toBeUndefined();
    expect(
      buildBatch({
        view: VIEW,
        events: [{ name: 'menu_open', attributes: { extra: 1 }, at: NOW }],
        projection: projection(),
        now: NOW
      })
    ).toBeUndefined();
  });

  it('sends a lone pageview', () => {
    const parsed = parse(
      buildBatch({ view: VIEW, pageview: PAGEVIEW, events: [], projection: projection(), now: NOW })
    );
    expect(parsed.events.map((e) => e.name)).toEqual(['pageview']);
  });
});
