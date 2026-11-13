/**
 * The mapping of a usage event to the application's own structured log record.
 *
 * The record's message is the event name, which is one of a closed set of constants, so a log store can key on it. The envelope members are namespaced (`openvaa.app`, `session.id`) so that they cannot collide with a payload attribute.
 */
import type { LogRecord } from '@openvaa/app-shared';
import type { AnalyticsEvent } from '../analyticsEvent.type';

/**
 * Map a usage event to an `info` log record. Pure: it reads no clock and does not change its input.
 *
 * @param event - The event as the relay keeps it.
 * @returns The record, with the app, the visit id when present, and every payload attribute in `attributes`.
 */
export function toLogRecord(event: AnalyticsEvent): LogRecord {
  return {
    level: 30,
    severityText: 'INFO',
    time: event.time,
    msg: event.name,
    attributes: {
      ...event.attributes,
      'openvaa.app': event.app,
      ...(event.id === undefined ? {} : { 'session.id': event.id })
    }
  };
}
