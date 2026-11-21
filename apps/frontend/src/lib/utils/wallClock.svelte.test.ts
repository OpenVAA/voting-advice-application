import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WallClock } from './wallClock.svelte';
import type { Mock } from 'vitest';

describe('WallClock', () => {
  let clock: WallClock;
  let onRead: Mock<(now: number) => void>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    onRead = vi.fn<(now: number) => void>();
    clock = new WallClock(onRead);
  });

  afterEach(() => {
    clock.stop();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('reads the clock on start, without calling `onRead`', () => {
    vi.setSystemTime(2_000_000);
    clock.start();
    expect(clock.now).toBe(2_000_000);
    expect(onRead).not.toHaveBeenCalled();
  });

  it('reads the clock once a second while started, and not after it is stopped', () => {
    clock.start();
    vi.advanceTimersByTime(1_000);
    expect(clock.now).toBe(1_001_000);
    expect(onRead).toHaveBeenLastCalledWith(1_001_000);

    clock.stop();
    vi.advanceTimersByTime(5_000);
    expect(clock.now).toBe(1_001_000);
    expect(onRead).toHaveBeenCalledTimes(1);
  });

  it.each<[string, () => void]>([
    ['shown again', () => document.dispatchEvent(new Event('visibilitychange'))],
    ['resumed', () => document.dispatchEvent(new Event('resume'))],
    ['restored from the back-forward cache', () => window.dispatchEvent(new Event('pageshow'))],
    ['focused again', () => window.dispatchEvent(new Event('focus'))]
  ])('reads the clock at once when the document is %s', (_label, signal) => {
    clock.start();
    vi.setSystemTime(5_000_000);
    signal();
    expect(clock.now).toBe(5_000_000);
  });

  it('does not read the clock on a `visibilitychange` that leaves the document hidden', () => {
    clock.start();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    vi.setSystemTime(5_000_000);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(clock.now).toBe(1_000_000);
  });

  it('reads nothing on an event once stopped', () => {
    clock.start();
    clock.stop();
    vi.setSystemTime(5_000_000);
    window.dispatchEvent(new Event('focus'));
    expect(clock.now).toBe(1_000_000);
  });
});
