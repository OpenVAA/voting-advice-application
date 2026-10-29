/**
 * The provider that writes each event as one JSON line to the server's output stream, for a container log store to keep.
 *
 * The line is the event's own log record and holds nothing about the request that carried it. It is written straight to the stream it is given rather than through the application logger, for two reasons: the logger drops `info` records at the production default level, and its default sink prints an inspected object rather than one JSON line.
 */
import { log } from '@openvaa/app-shared';
import { toLogRecord } from '$lib/analytics/mappers/toLogRecord';
import type { AnalyticsProvider, ProviderDeps } from './provider.type';

/**
 * Create the log provider.
 *
 * @param deps - `write`, which receives each line with its trailing newline.
 * @returns A provider whose `capture` writes one line per event and always resolves.
 */
export function createLogProvider({ write }: Pick<ProviderDeps, 'write'>): AnalyticsProvider {
  return {
    name: 'log',
    capture(events) {
      let failed = 0;
      for (const event of events) {
        try {
          write(`${JSON.stringify(toLogRecord(event))}\n`);
        } catch {
          failed += 1;
        }
      }
      // The count only: the caught error may quote the line it could not write.
      if (failed > 0) log.warn('Analytics log provider could not write events', { failed });
      return Promise.resolve();
    }
  };
}
