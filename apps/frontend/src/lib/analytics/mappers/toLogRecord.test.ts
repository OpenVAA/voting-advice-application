import { describe, expect, it } from 'vitest';
import { toLogRecord } from './toLogRecord';
import { SAMPLE_ID, SAMPLE_VISIT_ID, VALID_EVENTS } from '../events.fixtures';
import { EVENT_NAMES } from '../events.schema';
import type { AnalyticsEvent } from '../analyticsEvent.type';
import type { EventName } from '../events.schema';

/** A fixed relay time, so every expected value is a literal. */
const FIXED_TIME = 1_792_400_000_123;

/**
 * Turn a wire sample of the vocabulary into the event the relay keeps, with a fixed time and app.
 *
 * @param name - The name of the sample.
 * @returns The event, carrying the sample's visit id when the sample has one.
 */
function eventOf(name: EventName): AnalyticsEvent {
  const sample: { name: string; id?: string; attributes: Record<string, JSONData> } = VALID_EVENTS[name];
  const event: AnalyticsEvent = { name: sample.name, time: FIXED_TIME, app: 'voter', attributes: sample.attributes };
  if (sample.id !== undefined) event.id = sample.id;
  return event;
}

describe('toLogRecord', () => {
  it('maps a sensitive event with a visit id to an info record carrying the app, the id and the payload', () => {
    expect(toLogRecord(eventOf('answer'))).toEqual({
      level: 30,
      severityText: 'INFO',
      time: FIXED_TIME,
      msg: 'answer',
      attributes: {
        'openvaa.app': 'voter',
        'session.id': SAMPLE_VISIT_ID,
        questionId: SAMPLE_ID,
        value: 'choice_1,choice_3'
      }
    });
  });

  it('maps a non-sensitive event with no visit id to a record with no session.id key', () => {
    const record = toLogRecord({ ...eventOf('pageview'), app: 'contestant' });
    expect(record.msg).toBe('pageview');
    expect(record.attributes).toEqual({
      'openvaa.app': 'contestant',
      params: VALID_EVENTS.pageview.attributes.params,
      duration: 12_300
    });
    expect(record.attributes).not.toHaveProperty(['session.id']);
  });

  it('does not change the event it maps', () => {
    const event = eventOf('answer');
    const before = structuredClone(event);
    toLogRecord(event);
    expect(event).toEqual(before);
  });

  describe.each(EVENT_NAMES.map((name) => [name]))('the event %s', (name) => {
    it('maps to an info record named by the event, holding every payload attribute', () => {
      const event = eventOf(name);
      const record = toLogRecord(event);
      expect(record.level).toBe(30);
      expect(record.severityText).toBe('INFO');
      expect(record.time).toBe(FIXED_TIME);
      expect(record.msg).toBe(name);
      expect(record.attributes).toMatchObject({ ...event.attributes, 'openvaa.app': 'voter' });
      if (event.id === undefined) expect(record.attributes).not.toHaveProperty(['session.id']);
      else expect(record.attributes).toHaveProperty(['session.id'], event.id);
    });
  });
});
