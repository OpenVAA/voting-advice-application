import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';

/**
 * SPIKE 018 — does the read/write split remove the producer-internal `.current`
 * input reads in survey.svelte.ts / trackingService.svelte.ts (Phase-103 finding #2)?
 *
 * Production producers receive their inputs as `ReactiveHandle<T> = { readonly current: T }`
 * and read `input.current` (survey.svelte.ts:23-24, trackingService.svelte.ts:88-89).
 * appContext constructs the `{ current }` handle and passes it in.
 *
 * The Phase-103 codemod's PASS 1 regex `/\b(appSettings)\.current\b/g` cannot tell a
 * FOLDED CONTEXT MEMBER named `appSettings` from a PRODUCER INPUT PARAMETER named
 * `appSettings` — same identifier, opposite correct treatment — so it rewrites the
 * producer reads and breaks the build (finding #2).
 *
 * HYPOTHESIS to test: a reactive value cannot be passed "bare" across a plain
 * function-call boundary (eager read snapshots it), so the producer input must be
 * read through SOME accessor. The read/write split therefore does NOT remove the
 * producer read — but choosing a getter-FUNCTION spelling `input()` (or any non-
 * `.current` accessor) decouples the producer from the codemod's `.current` regex.
 */

type AppSettings = { analytics: { trackEvents: boolean } };

// ── Approach 1: bare value (the naive "just pass the reactive value") ──────
// Reading `appSettingsValue` eagerly at call time snapshots it. The producer
// closes over a frozen value — NOT reactive. This is the failure the spike must
// surface to justify why SOME accessor is unavoidable.
function surveyProducer_bareValue(appSettings: AppSettings) {
  // captured once — no way to re-read
  const enabledAtConstruction = appSettings.analytics.trackEvents;
  return {
    get enabled() {
      return enabledAtConstruction;
    }
  };
}

// ── Approach 2: getter-FUNCTION input `() => T` (proposed split-friendly shape) ─
// The producer reads `appSettings()` inside its own `$derived` → reactive, AND the
// source text contains no `.current` token → invisible to the Phase-103 codemod.
function surveyProducer_getterFn(appSettings: () => AppSettings) {
  const enabled = $derived(appSettings().analytics.trackEvents);
  return {
    get enabled() {
      return enabled;
    }
  };
}

// ── Approach 3: status-quo ReactiveHandle `{ current }` (what production uses) ──
type ReactiveHandle<T> = { readonly current: T };
function surveyProducer_currentHandle(appSettings: ReactiveHandle<AppSettings>) {
  const enabled = $derived(appSettings.current.analytics.trackEvents);
  return {
    get enabled() {
      return enabled;
    }
  };
}

describe('Spike 018 — producer-internal input reads under the read/write split', () => {
  it('Approach 1 (bare value) is NOT reactive — proves you cannot pass a bare reactive read across a function boundary', () => {
    let producer!: ReturnType<typeof surveyProducer_bareValue>;
    const recorded: Array<boolean> = [];

    const cleanup = $effect.root(() => {
      const settings = $state<AppSettings>({ analytics: { trackEvents: false } });
      producer = surveyProducer_bareValue(settings); // eager read snapshots `false`
      $effect(() => {
        recorded.push(producer.enabled);
      });
      // mutate the source AFTER construction
      settings.analytics.trackEvents = true;
    });
    flushSync();

    // Still false — the producer captured a snapshot, the mutation never propagated.
    expect(recorded.at(-1)).toBe(false);
    expect(producer.enabled).toBe(false);
    cleanup();
  });

  it('Approach 2 (getter-function input) IS reactive — and the source has no `.current` token (codemod-immune)', () => {
    let producer!: ReturnType<typeof surveyProducer_getterFn>;
    const recorded: Array<boolean> = [];
    const settings = $state<AppSettings>({ analytics: { trackEvents: false } });

    const cleanup = $effect.root(() => {
      producer = surveyProducer_getterFn(() => settings); // pass a getter fn, not a value
      $effect(() => {
        recorded.push(producer.enabled);
      });
    });
    flushSync();
    expect(recorded.at(-1)).toBe(false);

    settings.analytics.trackEvents = true;
    flushSync();
    expect(recorded.at(-1)).toBe(true); // producer $derived recomputed → reactive
    cleanup();
  });

  it('Approach 3 (status-quo `.current` handle) IS reactive too — equivalent reactivity, but the `.current` token is what the Phase-103 codemod collides with', () => {
    let producer!: ReturnType<typeof surveyProducer_currentHandle>;
    const recorded: Array<boolean> = [];
    let value = $state<AppSettings>({ analytics: { trackEvents: false } });

    const cleanup = $effect.root(() => {
      const handle: ReactiveHandle<AppSettings> = {
        get current() {
          return value;
        }
      };
      producer = surveyProducer_currentHandle(handle);
      $effect(() => {
        recorded.push(producer.enabled);
      });
    });
    flushSync();
    expect(recorded.at(-1)).toBe(false);

    value = { analytics: { trackEvents: true } };
    flushSync();
    expect(recorded.at(-1)).toBe(true);
    cleanup();
  });

  it('codemod-collision check: only Approach 3 contains a `.current` read; the split-friendly getter-fn shape does not', () => {
    // The Phase-103 PASS 1 read-rewrite is literally `/\b(appSettings)\.current\b/`.
    const phase103ReadRegex = /\bappSettings\.current\b/;

    const approach2Source = surveyProducer_getterFn.toString();
    const approach3Source = surveyProducer_currentHandle.toString();

    expect(phase103ReadRegex.test(approach3Source)).toBe(true); // status quo → codemod hits it (finding #2)
    expect(phase103ReadRegex.test(approach2Source)).toBe(false); // getter-fn → codemod can't see it
  });
});
