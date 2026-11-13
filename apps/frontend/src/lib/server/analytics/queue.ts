/**
 * The bounded in-memory queue between the relay and the provider.
 *
 * The relay puts events in and returns at once; the queue hands them to the provider later, on its own timer, so no request ever waits for a provider. The queue has a cap: while a provider is slow or down, events beyond the cap are dropped and only their number is reported, so a flood cannot grow the server's memory without bound.
 *
 * ## Shutdown
 *
 * `registerShutdownFlush` flushes the queue once when the process emits `sveltekit:shutdown`. adapter-node emits that event before the process exits; the Vite dev server does not, so in development whatever is still queued when the server stops is lost.
 */
import { log } from '@openvaa/app-shared';
import type { AnalyticsEvent } from '$lib/analytics/analyticsEvent.type';
import type { AnalyticsProvider } from './providers';

/** The most events the queue holds when not given a cap. */
const DEFAULT_MAX_SIZE = 1000;

/** The most events handed to the provider in one call when not given a batch size. */
const DEFAULT_BATCH_SIZE = 100;

/** How often the queue flushes on its own when not given an interval, in milliseconds. */
const DEFAULT_FLUSH_INTERVAL_MS = 2000;

/** The name of the event adapter-node emits on the process before it exits. */
const SHUTDOWN_EVENT = 'sveltekit:shutdown';

/** A bounded queue of events waiting for the provider. */
export type EventQueue = {
  /**
   * Add events without waiting for anything. Events beyond the cap are dropped.
   *
   * @param events - The events to add, in order.
   * @returns How many of them were kept.
   */
  enqueue(events: ReadonlyArray<AnalyticsEvent>): number;
  /** Hand every queued event to the provider, in slices of the batch size. The promise always resolves. */
  flush(): Promise<void>;
  /** How many events are waiting. */
  size(): number;
  /** Stop the timer. Queued events stay until the next `flush`. */
  stop(): void;
};

/** Something a shutdown listener can be attached to once, by default the process. */
export type ShutdownTarget = { once(event: string, listener: () => void): unknown };

/**
 * Create a queue in front of a provider, with its own flush timer. Each call makes a new queue that shares nothing with any other.
 *
 * The timer does not keep the process alive.
 *
 * @param options.provider - Where the queued events go.
 * @param options.maxSize - The most events held at once; default 1000.
 * @param options.batchSize - The most events per `capture` call; default 100.
 * @param options.flushIntervalMs - How often the queue flushes on its own; default 2000.
 * @returns The queue.
 */
export function createQueue({
  provider,
  maxSize = DEFAULT_MAX_SIZE,
  batchSize = DEFAULT_BATCH_SIZE,
  flushIntervalMs = DEFAULT_FLUSH_INTERVAL_MS
}: {
  provider: AnalyticsProvider;
  maxSize?: number;
  batchSize?: number;
  flushIntervalMs?: number;
}): EventQueue {
  const pending = new Array<AnalyticsEvent>();
  const sliceSize = Math.max(1, Math.floor(batchSize));
  let dropped = 0;

  function enqueue(events: ReadonlyArray<AnalyticsEvent>): number {
    const room = Math.max(0, maxSize - pending.length);
    const kept = Math.min(room, events.length);
    for (let i = 0; i < kept; i++) pending.push(events[i]);
    dropped += events.length - kept;
    return kept;
  }

  async function flush(): Promise<void> {
    if (dropped > 0) {
      // The count only: a dropped event is never described.
      log.warn('Analytics queue was full and dropped events', { dropped });
      dropped = 0;
    }
    const taken = pending.splice(0, pending.length);
    for (let start = 0; start < taken.length; start += sliceSize) {
      try {
        await provider.capture(taken.slice(start, start + sliceSize));
      } catch {
        // A provider is not meant to reject; one that does loses this slice and the rest are still sent.
      }
    }
  }

  const timer = setInterval(() => void flush(), flushIntervalMs);
  timer.unref();

  return {
    enqueue,
    flush,
    size: () => pending.length,
    stop: () => clearInterval(timer)
  };
}

/**
 * Flush the queue once, and stop its timer, when the target emits `sveltekit:shutdown`.
 *
 * @param queue - The queue to flush.
 * @param target - What emits the event; the process by default.
 */
export function registerShutdownFlush(queue: EventQueue, target: ShutdownTarget = process): void {
  target.once(SHUTDOWN_EVENT, () => {
    queue.stop();
    void queue.flush();
  });
}
