/**
 * The bounded in-memory queue between the relay and the provider.
 *
 * The relay puts events in and returns at once; the queue hands them to the provider later, on its own timer, so no request ever waits for a provider. The queue has a cap: while a provider is slow or down, events beyond the cap are dropped and only their number is reported, so a flood cannot grow the server's memory without bound.
 *
 * A timer tick is skipped while the timer's previous flush is still running, so a provider that hangs holds at most one taken batch besides the queue: the events held never exceed twice the cap.
 *
 * ## Shutdown
 *
 * `registerShutdownFlush` flushes the queue once when the process emits `sveltekit:shutdown`. adapter-node emits that event before the process exits; the Vite dev server does not, so in development whatever is still queued when the server stops is lost.
 */
import { log } from '@openvaa/app-shared';
import { SHUTDOWN_EVENT } from '$lib/server/shutdown/shutdownLog';
import type { AnalyticsEvent } from '$lib/analytics/analyticsEvent.type';
import type { SignalTarget } from '$lib/server/shutdown/shutdownLog';
import type { AnalyticsProvider } from './providers';

/** The most events the queue holds when not given a cap. */
const DEFAULT_MAX_SIZE = 1000;

/** The most events handed to the provider in one call when not given a batch size. */
const DEFAULT_BATCH_SIZE = 100;

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

/**
 * Create a queue in front of a provider, with its own flush timer. Each call makes a new queue that shares nothing with any other.
 *
 * The timer does not keep the process alive. A tick is skipped while the timer's previous flush is still running, which bounds the events held to the cap plus one taken batch; a `flush` called directly, as at shutdown, runs regardless.
 *
 * @param options.provider - Where the queued events go.
 * @param options.maxSize - The most events held at once; default 1000.
 * @param options.batchSize - The most events per `capture` call; default 100.
 * @param options.flushIntervalMs - How often the queue flushes on its own, in milliseconds.
 * @returns The queue.
 */
export function createQueue({
  provider,
  maxSize = DEFAULT_MAX_SIZE,
  batchSize = DEFAULT_BATCH_SIZE,
  flushIntervalMs
}: {
  provider: AnalyticsProvider;
  maxSize?: number;
  batchSize?: number;
  flushIntervalMs: number;
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

  let inFlight: Promise<void> | undefined;
  const timer = setInterval(() => {
    if (inFlight) return;
    inFlight = flush().finally(() => {
      inFlight = undefined;
    });
  }, flushIntervalMs);
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
export function registerShutdownFlush(queue: EventQueue, target: Pick<SignalTarget, 'once'> = process): void {
  target.once(SHUTDOWN_EVENT, () => {
    queue.stop();
    void queue.flush();
  });
}
