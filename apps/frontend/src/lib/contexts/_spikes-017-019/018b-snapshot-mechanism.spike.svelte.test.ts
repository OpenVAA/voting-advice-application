import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';

/**
 * SCRATCH — what actually "snapshots"? Tests the precise mechanism behind the
 * 018 claim, because "you cannot pass a bare reactive value across a function
 * boundary" is imprecise. The real principle: reactivity is RE-EXECUTING A READ
 * inside a tracking scope — never a property of the value. Three sub-cases.
 */

type Settings = { analytics: { trackEvents: boolean } };

describe('what snapshots and what does not', () => {
  it('CASE 1 — eager PRIMITIVE read at the boundary snapshots (this is what 018 test 1 did)', () => {
    const recorded: Array<boolean> = [];
    const settings = $state<Settings>({ analytics: { trackEvents: false } });

    // The read happens HERE, once, producing a dead boolean.
    function producer(enabledNow: boolean) {
      return { get enabled() { return enabledNow; } };
    }

    const cleanup = $effect.root(() => {
      const p = producer(settings.analytics.trackEvents); // ← read executed at call time
      $effect(() => recorded.push(p.enabled));
    });
    flushSync();
    settings.analytics.trackEvents = true;
    flushSync();

    expect(recorded.at(-1)).toBe(false); // dead — the boolean was extracted before crossing
    cleanup();
  });

  it('CASE 2 — pass the $state PROXY, read its property LAZILY inside the producer → REACTIVE (no getter, no .current)', () => {
    const recorded: Array<boolean> = [];
    const settings = $state<Settings>({ analytics: { trackEvents: false } });

    // Receives the proxy OBJECT. The read is deferred into the producer's own
    // $derived, i.e. into a tracking scope that re-runs.
    function producer(s: Settings) {
      const enabled = $derived(s.analytics.trackEvents); // ← read deferred into a tracking scope
      return { get enabled() { return enabled; } };
    }

    const cleanup = $effect.root(() => {
      const p = producer(settings); // pass the proxy, NOT a value
      $effect(() => recorded.push(p.enabled));
    });
    flushSync();
    expect(recorded.at(-1)).toBe(false);

    settings.analytics.trackEvents = true; // mutate IN PLACE
    flushSync();

    expect(recorded.at(-1)).toBe(true); // REACTIVE — per-property proxy signal was tracked
    cleanup();
  });

  it('CASE 3 — passing the proxy fails when the source VARIABLE is REASSIGNED wholesale (this is why production needs a getter)', () => {
    const recordedHeldRef: Array<boolean> = [];
    const recordedViaGetter: Array<boolean> = [];
    let settings = $state<Settings>({ analytics: { trackEvents: false } });

    function producerHoldingRef(s: Settings) {
      const enabled = $derived(s.analytics.trackEvents);
      return { get enabled() { return enabled; } };
    }
    // A getter re-reads the VARIABLE each call — sees the reassignment.
    function producerViaGetter(get: () => Settings) {
      const enabled = $derived(get().analytics.trackEvents);
      return { get enabled() { return enabled; } };
    }

    const cleanup = $effect.root(() => {
      const pRef = producerHoldingRef(settings); // captures the CURRENT object
      const pGet = producerViaGetter(() => settings); // re-reads the binding
      $effect(() => recordedHeldRef.push(pRef.enabled));
      $effect(() => recordedViaGetter.push(pGet.enabled));
    });
    flushSync();

    // Reassign the whole object (mirrors appContext: appSettingsValue = pureMerge(...)).
    settings = { analytics: { trackEvents: true } };
    flushSync();

    expect(recordedHeldRef.at(-1)).toBe(false); // STALE — holds the old object reference
    expect(recordedViaGetter.at(-1)).toBe(true); // reactive — getter re-read the variable
    cleanup();
  });
});
