/**
 * The one log line a production server writes as it exits.
 *
 * adapter-node stops the server on `SIGTERM` or `SIGINT`, or after an idle timeout, then emits `sveltekit:shutdown` on the process once the open requests have drained. The line written on that event names why the server stopped, which signal reached it, how many requests were in flight when the signal arrived and how long the drain took, so a deployment can see that its stop signal reached Node and what the stop cost.
 *
 * The line carries a reason, a signal name and two numbers, and nothing taken from a request.
 */
import { log } from '@openvaa/app-shared';

/** The name of the event adapter-node emits on the process once its server has closed. */
const SHUTDOWN_EVENT = 'sveltekit:shutdown';

/** The signals adapter-node stops the server on. */
const STOP_SIGNALS = ['SIGTERM', 'SIGINT'] as const;

/** The message the line is written with. */
const MESSAGE = 'The server is exiting after its stop.';

/**
 * A count of the requests the server is handling.
 *
 * The count is approximate: a request leaves when its `resolve` returns, and a streamed body can still be sending after that.
 */
export type InFlightCounter = {
  /** Count one more request in flight. */
  enter(): void;
  /** Count one request fewer. The count never goes below zero. */
  leave(): void;
  /** How many requests are in flight. */
  count(): number;
};

/** Something the shutdown listeners can be attached to and removed from, by default the process. */
export type SignalTarget = {
  once(event: string, listener: (...args: Array<unknown>) => void): unknown;
  removeListener(event: string, listener: (...args: Array<unknown>) => void): unknown;
};

/** The fields of the line. */
type ShutdownFields = {
  /** The reason adapter-node gives with its event: `SIGTERM`, `SIGINT` or `IDLE`. */
  reason: string | null;
  /** The first stop signal the process received, or `null` when it stopped without one. */
  signal: string | null;
  /** The requests in flight when that signal arrived, or `null` when there was none. */
  inFlightAtSignal: number | null;
  /** The milliseconds from that signal to the event, or `null` when there was no signal. */
  drainMs: number | null;
};

/**
 * Create a counter of the requests in flight, starting at zero.
 *
 * The count is approximate for a streamed body, which can outlive `resolve`.
 *
 * @returns The counter.
 */
export function createInFlightCounter(): InFlightCounter {
  let inFlight = 0;
  return {
    enter: () => {
      inFlight += 1;
    },
    leave: () => {
      inFlight = Math.max(0, inFlight - 1);
    },
    count: () => inFlight
  };
}

/**
 * Write one line when the target emits `sveltekit:shutdown`.
 *
 * The `SIGTERM` and `SIGINT` listeners only record the first signal, the counter's value and the time; adapter-node's own listeners drive the shutdown. Every listener is attached with `once` and the line removes those still attached, so nothing stays on the target after it and a second event writes nothing. The count is approximate for a streamed body, which can outlive `resolve`.
 *
 * @param counter - The counter of the requests in flight.
 * @param options.target - What emits the signals and the event; the process by default.
 * @param options.now - The clock, in milliseconds; `Date.now` by default.
 * @param options.emit - Where the line is written; `log.warn` by default, the level a production server shows without a raised threshold.
 */
export function registerShutdownLog(
  counter: InFlightCounter,
  {
    target = process,
    now = Date.now,
    emit = (message, fields) => log.warn(message, fields)
  }: {
    target?: SignalTarget;
    now?: () => number;
    emit?: (message: string, fields: ShutdownFields) => void;
  } = {}
): void {
  let received: { signal: string; inFlight: number; at: number } | null = null;

  const signalListeners = STOP_SIGNALS.map((signal) => {
    function listener(): void {
      if (received === null) received = { signal, inFlight: counter.count(), at: now() };
      detachSignals();
    }
    return { signal, listener };
  });

  function detachSignals(): void {
    for (const { signal, listener } of signalListeners) target.removeListener(signal, listener);
  }

  function onShutdown(reason: unknown): void {
    detachSignals();
    emit(MESSAGE, {
      reason: reason == null ? null : String(reason),
      signal: received?.signal ?? null,
      inFlightAtSignal: received?.inFlight ?? null,
      drainMs: received === null ? null : now() - received.at
    });
  }

  for (const { signal, listener } of signalListeners) target.once(signal, listener);
  target.once(SHUTDOWN_EVENT, onShutdown);
}
