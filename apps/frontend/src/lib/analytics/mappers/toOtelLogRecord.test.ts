import { describe, expect, it } from 'vitest';
import { toOtelLogRecord } from './toOtelLogRecord';
import { SAMPLE_ID, SAMPLE_VISIT_ID, VALID_EVENTS } from '../events.fixtures';
import { EVENT_NAMES } from '../events.schema';
import type { AnalyticsEvent } from '../analyticsEvent.type';
import type { EventName } from '../events.schema';

/** A fixed relay time, so every expected value is a literal. */
const FIXED_TIME = 1_792_400_000_123;

/** A fixed observation time, later than {@link FIXED_TIME}. */
const OBSERVED_TIME = 1_792_400_000_456;

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

describe('toOtelLogRecord', () => {
  it('maps a sensitive event with a visit id to the log data model fields, in nanoseconds held as strings', () => {
    expect(toOtelLogRecord(eventOf('answer'), OBSERVED_TIME)).toEqual({
      timeUnixNano: '1792400000123000000',
      observedTimeUnixNano: '1792400000456000000',
      severityNumber: 9,
      severityText: 'INFO',
      eventName: 'answer',
      attributes: {
        'openvaa.app': 'voter',
        'session.id': SAMPLE_VISIT_ID,
        questionId: SAMPLE_ID,
        value: 'choice_1,choice_3'
      }
    });
  });

  it('maps a non-sensitive event with no visit id to a record with no session.id key', () => {
    const record = toOtelLogRecord({ ...eventOf('pageview'), app: 'admin' }, OBSERVED_TIME);
    expect(record.eventName).toBe('pageview');
    expect(record.attributes).toEqual({
      'openvaa.app': 'admin',
      params: VALID_EVENTS.pageview.attributes.params,
      duration: 12_300
    });
    expect(record.attributes).not.toHaveProperty(['session.id']);
  });

  it('holds no trace id, span id or body', () => {
    const record = toOtelLogRecord(eventOf('answer'), OBSERVED_TIME);
    for (const absent of ['traceId', 'spanId', 'traceFlags', 'body']) expect(record).not.toHaveProperty(absent);
  });

  it('keeps nanosecond values exact beyond the safe integer range', () => {
    const record = toOtelLogRecord({ ...eventOf('pageview'), time: Number.MAX_SAFE_INTEGER }, 1);
    expect(record.timeUnixNano).toBe(`${BigInt(Number.MAX_SAFE_INTEGER) * 1_000_000n}`);
    expect(record.observedTimeUnixNano).toBe('1000000');
  });

  it('does not change the event it maps', () => {
    const event = eventOf('answer');
    const before = structuredClone(event);
    toOtelLogRecord(event, OBSERVED_TIME);
    expect(event).toEqual(before);
  });

  describe.each(EVENT_NAMES.map((name) => [name]))('the event %s', (name) => {
    it('maps to an event record named by the event, holding every payload attribute', () => {
      const event = eventOf(name);
      const record = toOtelLogRecord(event, OBSERVED_TIME);
      expect(record.eventName).toBe(name);
      expect(record.severityNumber).toBe(9);
      expect(record.severityText).toBe('INFO');
      expect(record.timeUnixNano).toBe('1792400000123000000');
      expect(record.attributes).toMatchObject({ ...event.attributes, 'openvaa.app': 'voter' });
      if (event.id === undefined) expect(record.attributes).not.toHaveProperty(['session.id']);
      else expect(record.attributes).toHaveProperty(['session.id'], event.id);
    });
  });
});
