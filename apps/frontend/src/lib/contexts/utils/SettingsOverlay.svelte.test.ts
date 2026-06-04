import { mergeSettings } from '@openvaa/app-shared';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { settingsOverlay } from './SettingsOverlay.svelte';
import { StackedState } from './StackedState.svelte';
import type { SettingsOverlayApi } from './SettingsOverlay.svelte';

/**
 * Registry tests for the token-keyed `settingsOverlay` (CTX-04 / D-07).
 *
 * The cases that the old index-based `StackedState` could NOT satisfy —
 * out-of-order revert + idempotent cleanup — are the emphasis here. The
 * LIFO-equivalence case proves `mergeSettings` associativity makes the
 * token-keyed `reduce` result identical to the strict-LIFO stack.
 */

interface Settings {
  a?: string;
  b?: string;
  c?: string;
}

describe('settingsOverlay', () => {
  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  /**
   * Create the registry inside an `$effect.root` so its `$state`/`$derived`
   * settle, returning the API handle.
   */
  function setup(base: Settings): SettingsOverlayApi<Settings, Settings> {
    let api!: SettingsOverlayApi<Settings, Settings>;
    cleanup = $effect.root(() => {
      api = settingsOverlay<Settings, Settings>(base, (acc, ov) => mergeSettings(acc, ov));
    });
    flushSync();
    return api;
  }

  it('.current returns base when empty', () => {
    const overlay = setup({ a: 'base' });
    expect(overlay.current.a).toBe('base');
    expect(overlay.size).toBe(0);
  });

  it('pushing an overlay makes .current the merge of base + overlay; a second overlay merges in order', () => {
    const overlay = setup({ a: 'base', b: 'base' });
    overlay.push({ b: 'first' });
    flushSync();
    expect(overlay.current.a).toBe('base');
    expect(overlay.current.b).toBe('first');
    expect(overlay.size).toBe(1);

    overlay.push({ b: 'second', c: 'second' });
    flushSync();
    expect(overlay.current.a).toBe('base');
    expect(overlay.current.b).toBe('second');
    expect(overlay.current.c).toBe('second');
    expect(overlay.size).toBe(2);
  });

  it('the returned revert fn removes only that overlay (token-keyed) and is idempotent', () => {
    const overlay = setup({ a: 'base' });
    const revertFirst = overlay.push({ a: 'first' });
    overlay.push({ b: 'second' });
    flushSync();
    expect(overlay.current.a).toBe('first');
    expect(overlay.size).toBe(2);

    revertFirst();
    flushSync();
    // Only the first overlay removed; the second remains.
    expect(overlay.current.a).toBe('base');
    expect(overlay.current.b).toBe('second');
    expect(overlay.size).toBe(1);

    // Idempotent: a second revert call is a no-op (does not drop other overlays).
    revertFirst();
    flushSync();
    expect(overlay.current.b).toBe('second');
    expect(overlay.size).toBe(1);
  });

  it('out-of-order revert: push A, push B, revert A first, then revert B → .current returns to base', () => {
    const overlay = setup({ a: 'base', b: 'base' });
    const revertA = overlay.push({ a: 'A' });
    const revertB = overlay.push({ b: 'B' });
    flushSync();
    expect(overlay.current.a).toBe('A');
    expect(overlay.current.b).toBe('B');
    expect(overlay.size).toBe(2);

    // Revert the EARLIER-pushed overlay first — index-based LIFO would corrupt
    // here (it would drop B's slot). Token-keyed removes only A.
    revertA();
    flushSync();
    expect(overlay.current.a).toBe('base');
    expect(overlay.current.b).toBe('B');
    expect(overlay.size).toBe(1);

    revertB();
    flushSync();
    expect(overlay.current.a).toBe('base');
    expect(overlay.current.b).toBe('base');
    expect(overlay.size).toBe(0);
  });

  it('LIFO-equivalence: strictly-nested push/revert matches the old StackedState result (associativity)', () => {
    const base: Settings = { a: 'base', b: 'base', c: 'base' };
    const ov1: Settings = { a: 'one' };
    const ov2: Settings = { b: 'two' };
    const ov3: Settings = { c: 'three' };

    // Reference result via the legacy StackedState (strict-LIFO), exercised in
    // the same nested push/revert order.
    let stackResult!: Settings;
    const stackCleanup = $effect.root(() => {
      const stack = new StackedState<Settings, Settings>(base, (current, value) => [
        ...current,
        mergeSettings(current[current.length - 1], value)
      ]);
      stack.push(ov1);
      stack.push(ov2);
      stack.push(ov3);
      stackResult = stack.current;
    });
    flushSync();

    // Token-keyed registry, same strictly-nested order.
    const overlay = setup(base);
    overlay.push(ov1);
    overlay.push(ov2);
    overlay.push(ov3);
    flushSync();

    expect(overlay.current.a).toBe(stackResult.a);
    expect(overlay.current.b).toBe(stackResult.b);
    expect(overlay.current.c).toBe(stackResult.c);
    expect(overlay.current.a).toBe('one');
    expect(overlay.current.b).toBe('two');
    expect(overlay.current.c).toBe('three');

    stackCleanup();
  });
});
