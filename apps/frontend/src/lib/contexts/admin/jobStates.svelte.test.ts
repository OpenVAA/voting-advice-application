import { flushSync } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { ADMIN_FEATURES } from '$lib/admin/features';
import { JobStatesProvider } from './jobStates.svelte';

describe('JobStatesProvider', () => {
  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  /**
   * Construct the provider inside an `$effect.root` so its `$state`/`$derived` fields settle (mirrors VideoController.svelte.test.ts). jobStates has no `$effect`, so the root is for consistency + predictable `$derived` settling.
   */
  function setup(): JobStatesProvider {
    let instance!: JobStatesProvider;
    cleanup = $effect.root(() => {
      instance = new JobStatesProvider();
    });
    flushSync();
    return instance;
  }

  it('a fresh JobStatesProvider exposes empty projections', () => {
    const jobs = setup();
    expect(jobs.pastJobs).toEqual([]);
    // No jobs → no active job recorded per feature, so the active map is empty.
    expect(jobs.activeJobsByFeature.size).toBe(0);
    // pastJobsByFeature always has one (empty) array per known feature.
    expect([...jobs.pastJobsByFeature.keys()].sort()).toEqual([...ADMIN_FEATURES].sort());
    for (const feat of ADMIN_FEATURES) {
      expect(jobs.pastJobsByFeature.get(feat)).toEqual([]);
    }
  });

  it('startPolling/stopPolling are arrow-function fields that survive detach', () => {
    const jobs = setup();
    const { startPolling, stopPolling } = jobs;
    expect(typeof startPolling).toBe('function');
    expect(typeof stopPolling).toBe('function');
    // stopPolling detached is a safe no-op: no #pollInterval set → early return, no `this` access beyond the guard, no network. Must NOT throw.
    expect(() => stopPolling()).not.toThrow();
  });
});
