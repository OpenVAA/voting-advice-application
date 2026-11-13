/**
 * The mapping of a usage event to the fields of an OpenTelemetry log record that is an event.
 *
 * The function returns the data-model fields as a plain object. It does not produce the OTLP wire encoding, and the record has no resource or instrumentation scope: a sender that exports it adds those. It has no trace context and no body either; the payload is in `attributes`, under the same namespaced keys the application's own log record uses.
 */
import type { AnalyticsEvent } from '../analyticsEvent.type';

/** The OpenTelemetry log data-model fields filled for one usage event. */
export type OtelLogRecord = {
  /** When the event happened, in nanoseconds since the Unix epoch, as a decimal string because the value exceeds the safe integer range. */
  timeUnixNano: string;
  /** When the relay observed the event, in nanoseconds since the Unix epoch, as a decimal string. */
  observedTimeUnixNano: string;
  /** The lowest number of the `INFO` range. */
  severityNumber: 9;
  /** The severity name that goes with {@link OtelLogRecord.severityNumber}. */
  severityText: 'INFO';
  /** The event name; a log record with an event name is an event. */
  eventName: string;
  /** The app, the visit id when present, and every payload attribute. */
  attributes: Record<string, JSONData>;
};

/** Nanoseconds in one millisecond. */
const NANOS_PER_MILLI = 1_000_000n;

/**
 * Map a usage event to OpenTelemetry log data-model fields. Pure: it reads no clock and does not change its input.
 *
 * @param event - The event as the relay keeps it.
 * @param observedTimeMs - When the relay received the event, in epoch milliseconds.
 * @returns The record fields.
 */
export function toOtelLogRecord(event: AnalyticsEvent, observedTimeMs: number): OtelLogRecord {
  return {
    timeUnixNano: millisToNanos(event.time),
    observedTimeUnixNano: millisToNanos(observedTimeMs),
    severityNumber: 9,
    severityText: 'INFO',
    eventName: event.name,
    attributes: {
      ...event.attributes,
      'openvaa.app': event.app,
      ...(event.id === undefined ? {} : { 'session.id': event.id })
    }
  };
}

/**
 * Convert whole epoch milliseconds to nanoseconds without losing precision.
 *
 * @param ms - Epoch milliseconds; a fractional part is truncated.
 * @returns The nanoseconds as a decimal string.
 */
function millisToNanos(ms: number): string {
  return (BigInt(Math.trunc(ms)) * NANOS_PER_MILLI).toString();
}
