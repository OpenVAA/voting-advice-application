/**
 * The in-flight counter and the one log line a production server writes as it exits, driven with an `EventEmitter` standing in for the process and a stubbed clock.
 *
 * @vitest-environment node
 */

import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInFlightCounter, registerShutdownLog } from './shutdownLog';

/** The events the log listens for. */
const EVENTS = ['SIGTERM', 'SIGINT', 'sveltekit:shutdown'] as const;

/** The message the line is written with. */
const MESSAGE = 'The server is exiting after its stop.';

/**
 * A clock that answers each read with the next of the given times.
 *
 * @param times - The times to answer with, in order.
 * @returns The clock.
 */
function clock(...times: Array<number>): () => number {
  let i = 0;
  return () => times[Math.min(i++, times.length - 1)];
}

/**
 * How many listeners each event has on the target.
 *
 * @param target - The emitter to count on.
 * @returns The count of each event, by name.
 */
function listenerCounts(target: Pick<EventEmitter, 'listenerCount'>): Record<string, number> {
  return Object.fromEntries(EVENTS.map((event) => [event, target.listenerCount(event)]));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createInFlightCounter', () => {
  it('counts what entered and has not left', () => {
    const counter = createInFlightCounter();
    counter.enter();
    counter.enter();
    counter.leave();
    expect(counter.count()).toBe(1);
  });

  it('never goes below zero when `leave` is called more often than `enter`', () => {
    const counter = createInFlightCounter();
    counter.enter();
    counter.leave();
    counter.leave();
    counter.leave();
    expect(counter.count()).toBe(0);
    counter.enter();
    expect(counter.count()).toBe(1);
  });
});

describe('registerShutdownLog', () => {
  it('writes one record naming the reason, the signal, the requests in flight at the signal and the drain time', () => {
    const target = new EventEmitter();
    const emit = vi.fn();
    const counter = createInFlightCounter();
    counter.enter();
    counter.enter();
    counter.leave();

    registerShutdownLog(counter, { target, emit, now: clock(1_000, 1_250) });
    target.emit('SIGTERM', 'SIGTERM');
    // A request that ends during the drain does not change the count taken at the signal.
    counter.leave();
    target.emit('sveltekit:shutdown', 'SIGTERM');

    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(MESSAGE, {
      reason: 'SIGTERM',
      signal: 'SIGTERM',
      inFlightAtSignal: 1,
      drainMs: 250
    });
  });

  it('writes nothing more on a second signal or a second shutdown event, and leaves no listener behind', () => {
    const target = new EventEmitter();
    const emit = vi.fn();

    registerShutdownLog(createInFlightCounter(), { target, emit, now: clock(10, 20) });
    target.emit('SIGTERM', 'SIGTERM');
    target.emit('sveltekit:shutdown', 'SIGTERM');
    target.emit('SIGTERM', 'SIGTERM');
    target.emit('SIGINT', 'SIGINT');
    target.emit('sveltekit:shutdown', 'SIGTERM');

    expect(emit).toHaveBeenCalledTimes(1);
    expect(listenerCounts(target)).toEqual({ SIGTERM: 0, SIGINT: 0, 'sveltekit:shutdown': 0 });
  });

  it('keeps the first signal when a second one arrives before the shutdown event', () => {
    const target = new EventEmitter();
    const emit = vi.fn();
    const counter = createInFlightCounter();
    counter.enter();

    registerShutdownLog(counter, { target, emit, now: clock(100, 900, 1_100) });
    target.emit('SIGINT', 'SIGINT');
    counter.enter();
    target.emit('SIGTERM', 'SIGTERM');
    target.emit('sveltekit:shutdown', 'SIGINT');

    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(MESSAGE, {
      reason: 'SIGINT',
      signal: 'SIGINT',
      inFlightAtSignal: 1,
      drainMs: 800
    });
  });

  it('writes a record with no signal and no count when the server stops idle', () => {
    const target = new EventEmitter();
    const emit = vi.fn();

    registerShutdownLog(createInFlightCounter(), { target, emit, now: clock(5) });
    target.emit('sveltekit:shutdown', 'IDLE');

    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(MESSAGE, {
      reason: 'IDLE',
      signal: null,
      inFlightAtSignal: null,
      drainMs: null
    });
    expect(listenerCounts(target)).toEqual({ SIGTERM: 0, SIGINT: 0, 'sveltekit:shutdown': 0 });
  });

  it('attaches its listeners to the process when no target is given', () => {
    const before = listenerCounts(process);
    const once = vi.spyOn(process, 'once');

    registerShutdownLog(createInFlightCounter(), { emit: vi.fn() });

    try {
      const after = listenerCounts(process);
      for (const event of EVENTS) expect(after[event]).toBe(before[event] + 1);
    } finally {
      // Detach what was attached, so no listener from this case stays on the test runner's process.
      for (const [event, listener] of once.mock.calls) process.removeListener(event, listener);
    }
  });
});
