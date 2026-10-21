/**
 * The bounded event queue: its cap, its flush in slices, its timer and its one flush at shutdown, driven with a recording stand-in provider.
 *
 * @vitest-environment node
 */

import { EventEmitter } from 'node:events';
import { log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueue, registerShutdownFlush } from './queue';
import type { AnalyticsEvent } from '$lib/analytics/analyticsEvent.type';
import type { AnalyticsProvider } from './providers';

/** A recording stand-in provider: each `capture` call is kept with a copy of the batch it received. */
function recordingProvider(capture: AnalyticsProvider['capture'] = () => Promise.resolve()): {
  provider: AnalyticsProvider;
  batches: Array<Array<AnalyticsEvent>>;
} {
  const batches: Array<Array<AnalyticsEvent>> = [];
  return {
    batches,
    provider: {
      name: 'log',
      capture: vi.fn((events: ReadonlyArray<AnalyticsEvent>) => {
        batches.push([...events]);
        return capture(events);
      })
    }
  };
}

/**
 * Events told apart by their `questionIndex`, so that the order a provider receives them in can be checked.
 *
 * @param count - How many events to make.
 * @param from - The index of the first.
 */
function events(count: number, from = 0): Array<AnalyticsEvent> {
  return Array.from({ length: count }, (_, i) => ({
    name: 'question_next',
    time: 1_792_400_000_000 + from + i,
    app: 'voter',
    attributes: { questionIndex: from + i }
  }));
}

/** The `questionIndex` of each event of each batch. */
function indices(batches: Array<Array<AnalyticsEvent>>): Array<Array<unknown>> {
  return batches.map((batch) => batch.map((event) => event.attributes.questionIndex));
}

const warn = vi.spyOn(log, 'warn');

beforeEach(() => {
  warn.mockImplementation(() => {});
});

afterEach(() => {
  warn.mockReset();
  vi.useRealTimers();
});

describe('createQueue', () => {
  it('holds what it is given and returns how many it took', () => {
    const queue = createQueue({ provider: recordingProvider().provider });
    expect(queue.enqueue(events(3))).toBe(3);
    expect(queue.size()).toBe(3);
    queue.stop();
  });

  it('keeps what fits under the cap, drops the rest and reports only the count at the next flush', async () => {
    const { provider, batches } = recordingProvider();
    const queue = createQueue({ provider, maxSize: 5 });
    expect(queue.enqueue(events(4))).toBe(4);
    expect(queue.enqueue(events(4, 4))).toBe(1);
    expect(queue.size()).toBe(5);
    expect(warn).not.toHaveBeenCalled();

    await queue.flush();
    expect(indices(batches)).toEqual([[0, 1, 2, 3, 4]]);
    expect(warn).toHaveBeenCalledTimes(1);
    const [message, fields] = warn.mock.calls[0];
    expect(typeof message).toBe('string');
    expect(fields).toEqual({ dropped: 3 });

    await queue.flush();
    expect(warn).toHaveBeenCalledTimes(1);
    queue.stop();
  });

  it('hands the events on in order, in slices of at most the batch size, and empties itself', async () => {
    const { provider, batches } = recordingProvider();
    const queue = createQueue({ provider, batchSize: 2 });
    queue.enqueue(events(5));
    await queue.flush();
    expect(indices(batches)).toEqual([[0, 1], [2, 3], [4]]);
    expect(queue.size()).toBe(0);
    queue.stop();
  });

  it('calls nothing when it is empty', async () => {
    const { provider } = recordingProvider();
    const queue = createQueue({ provider });
    await queue.flush();
    expect(provider.capture).not.toHaveBeenCalled();
    queue.stop();
  });

  it('resolves and is empty when the provider rejects, and still sends the later slices', async () => {
    const { provider, batches } = recordingProvider(() => Promise.reject(new Error('provider down')));
    const queue = createQueue({ provider, batchSize: 2 });
    queue.enqueue(events(3));
    await expect(queue.flush()).resolves.toBeUndefined();
    expect(queue.size()).toBe(0);
    expect(indices(batches)).toEqual([[0, 1], [2]]);
    queue.stop();
  });

  it('returns from enqueue before the provider is called', () => {
    const { provider } = recordingProvider();
    const queue = createQueue({ provider });
    queue.enqueue(events(2));
    expect(provider.capture).not.toHaveBeenCalled();
    queue.stop();
  });

  it('flushes on its own after the interval, and not before', async () => {
    vi.useFakeTimers();
    const { provider, batches } = recordingProvider();
    const queue = createQueue({ provider, flushIntervalMs: 2_000 });
    queue.enqueue(events(2));
    await vi.advanceTimersByTimeAsync(1_999);
    expect(provider.capture).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(indices(batches)).toEqual([[0, 1]]);
    expect(queue.size()).toBe(0);
    queue.stop();
  });

  it('stops flushing on its own once stopped', async () => {
    vi.useFakeTimers();
    const { provider } = recordingProvider();
    const queue = createQueue({ provider, flushIntervalMs: 2_000 });
    queue.stop();
    queue.enqueue(events(2));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(provider.capture).not.toHaveBeenCalled();
    expect(queue.size()).toBe(2);
  });

  it('keeps no state shared between queues', () => {
    const first = createQueue({ provider: recordingProvider().provider });
    const second = createQueue({ provider: recordingProvider().provider });
    first.enqueue(events(3));
    expect(second.size()).toBe(0);
    first.stop();
    second.stop();
  });
});

describe('registerShutdownFlush', () => {
  it('flushes once when the shutdown event is emitted, and does nothing on a second emission', async () => {
    const { provider, batches } = recordingProvider();
    const queue = createQueue({ provider });
    const emitter = new EventEmitter();
    registerShutdownFlush(queue, emitter);
    queue.enqueue(events(3));

    emitter.emit('sveltekit:shutdown');
    await vi.waitFor(() => expect(provider.capture).toHaveBeenCalledTimes(1));
    expect(indices(batches)).toEqual([[0, 1, 2]]);
    expect(emitter.listenerCount('sveltekit:shutdown')).toBe(0);

    queue.enqueue(events(1, 3));
    emitter.emit('sveltekit:shutdown');
    await Promise.resolve();
    expect(provider.capture).toHaveBeenCalledTimes(1);
  });

  it('listens on the process when no target is given', async () => {
    const { provider } = recordingProvider();
    const queue = createQueue({ provider });
    const before = process.listenerCount('sveltekit:shutdown');
    registerShutdownFlush(queue);
    expect(process.listenerCount('sveltekit:shutdown')).toBe(before + 1);
    queue.enqueue(events(1));
    // Typed as a plain emitter: the process's own typing admits only the events Node itself emits.
    const emitter: EventEmitter = process;
    emitter.emit('sveltekit:shutdown');
    await vi.waitFor(() => expect(provider.capture).toHaveBeenCalledTimes(1));
    expect(process.listenerCount('sveltekit:shutdown')).toBe(before);
  });
});
