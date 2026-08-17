import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { createSpikeCtx } from './ctx.svelte';
import Harness from './Harness.svelte';

// ─────────────────────────────────────────────────────────────────────────────
// Spike 024 — empirical validation of the debug session `dataroot-stale-direct-nav`
// root cause + scope map.
//
// HYPOTHESIS: `const X = $derived(ctx.X)` (an intermediate alias) over an
// IDENTITY-STABLE, mutated-in-place accessor (dataRoot, reactive via a #version
// $state counter) suffers a Svelte 5 referential-equality DOWNSTREAM-SKIP: the
// alias recomputes on the version bump but yields the SAME object reference, so
// Svelte skips notifying downstream consumers — they keep showing the pre-mount
// empty snapshot. Direct `ctx.X.prop` reads inside the consuming thunk re-track
// the version and update.
//
// SCOPE PREDICTION:
//   Case 1 (dataRoot, stable-ref + #version)   → alias STALE,  direct UPDATES   [AFFECTED]
//   Case 2 (appSettings, reference-replaced)    → alias UPDATES, direct UPDATES  [not affected]
//   Case 3 (locale, scalar)                     → alias UPDATES, direct UPDATES  [not affected]
//   Case 4 (selectedElections, array-replaced)  → alias UPDATES, direct UPDATES  [not affected]
//
// The "provide" mutators run AFTER mount, modelling cold direct-URL entry where
// data is provided into the context post-mount.
// ─────────────────────────────────────────────────────────────────────────────

let target: HTMLElement;
let component: ReturnType<typeof mount> | null = null;

afterEach(() => {
  if (component) unmount(component);
  component = null;
  target?.remove();
});

function text(testid: string): string {
  return target.querySelector(`[data-testid="${testid}"]`)?.textContent ?? '<missing>';
}

function mountHarness() {
  target = document.createElement('div');
  document.body.appendChild(target);
  const ctx = createSpikeCtx();
  component = mount(Harness, { target, props: { ctx } });
  flushSync();
  return ctx;
}

describe('Spike 024 — $derived-alias-over-stable-ref downstream-skip', () => {
  it('CASE 1 (dataRoot, stable-ref + #version): intermediate alias goes STALE, direct read UPDATES', () => {
    const ctx = mountHarness();

    // Pre-provide: both empty.
    expect(text('case1-alias')).toBe('');
    expect(text('case1-direct')).toBe('');

    // Provide data AFTER mount (cold direct-URL entry path).
    ctx.provideElections(['e1', 'e2']);
    flushSync();

    // THE BUG: the intermediate-alias consumer never sees the update.
    expect(text('case1-alias')).toBe(''); // STALE — referential-equality skip
    // THE FIX: the direct-read consumer updates.
    expect(text('case1-direct')).toBe('e1,e2'); // UPDATES
  });

  it('CASE 2 (appSettings, reference-replaced): BOTH alias and direct UPDATE', () => {
    const ctx = mountHarness();
    expect(text('case2-alias')).toBe('INIT');
    expect(text('case2-direct')).toBe('INIT');

    ctx.provideSettings('LOADED');
    flushSync();

    expect(text('case2-alias')).toBe('LOADED'); // not affected — new ref propagates
    expect(text('case2-direct')).toBe('LOADED');
  });

  it('CASE 3 (locale, scalar): BOTH alias and direct UPDATE', () => {
    const ctx = mountHarness();
    expect(text('case3-alias')).toBe('INIT');
    expect(text('case3-direct')).toBe('INIT');

    ctx.provideLocale('fi');
    flushSync();

    expect(text('case3-alias')).toBe('fi'); // not affected — scalar change propagates
    expect(text('case3-direct')).toBe('fi');
  });

  it('CASE 4 (selectedElections, array-replaced): BOTH alias and direct UPDATE', () => {
    const ctx = mountHarness();
    expect(text('case4-alias')).toBe('');
    expect(text('case4-direct')).toBe('');

    ctx.provideSelected(['s1', 's2']);
    flushSync();

    expect(text('case4-alias')).toBe('s1,s2'); // not affected by THIS defect — new ref
    expect(text('case4-direct')).toBe('s1,s2');
  });
});
