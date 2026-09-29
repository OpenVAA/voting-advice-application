/**
 * Spike 035 — which ways can a root-level host render content that needs contexts from the opener's subtree?
 * Each case mounts Root(provider) > [Host, Provider(voter, filter, unrelated) > Typed > Opener].
 */
import { flushSync, mount, unmount } from 'svelte';
import type { ComponentProps } from 'svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Scene from './Scene.svelte';
import { host, log } from './keys.svelte';

let target: HTMLElement;
let app: ReturnType<typeof mount> | undefined;
const text = (id: string) => target.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();

beforeEach(() => { target = document.createElement('div'); document.body.append(target); log.length = 0; host.payload = null; });
afterEach(() => { if (app) unmount(app); app = undefined; target.remove(); });

function scene(props: ComponentProps<typeof Scene>) {
  const p = $state(props);
  app = mount(Scene, { target, props: p });
  flushSync();
  return p;
}

describe('snippet rendered by a root host', () => {
  it('sees the HOST ancestry, not the opener ancestry (why a bridge exists at all)', () => {
    scene({ mode: 'none', bridge: false });
    expect(text('hosted')).toBe('voter=MISSING filter=MISSING typed=n/a');
  });

  it('getAllContexts carries every ancestor context, wanted or not', () => {
    scene({ mode: 'all', bridge: true });
    expect(text('hosted')).toBe('voter=voter filter=filter typed=n/a');
    console.log(log[0]);
    expect(log[0]).toMatch(/size=5/); // root + voter + filter + unrelated + typed
    expect(log[0]).toContain('unrelated-ancestor');
  });
});

describe('named carriers (opener provides only what the content needs)', () => {
  it('Symbol keys: re-providing voter + filter only is enough', () => {
    scene({ mode: 'named', bridge: true });
    expect(text('hosted')).toBe('voter=voter filter=filter typed=n/a');
  });
  it('createContext() pairs: carrier = () => set(get()) works without exporting a key', () => {
    scene({ mode: 'typed', bridge: true });
    expect(text('hosted')).toBe('voter=MISSING filter=MISSING typed=typed-voter');
  });
});

describe('portal (content stays in the opener tree, DOM moved into the host)', () => {
  it('renders inside the host slot with the opener contexts and stays reactive', () => {
    const p = scene({ mode: 'portal', bridge: false, count: 1 });
    const slot = target.querySelector('#host-slot')!;
    expect(slot.querySelector('[data-testid="portaled"]')?.textContent?.trim()).toBe('voter=voter filter=filter typed=n/a');
    p.count = 2; flushSync();
    expect(slot.querySelector('[data-testid="count"]')?.textContent).toBe('2');
  });
  it('on opener teardown the moved DOM survives as a dead snapshot (host owns removal)', () => {
    const p = scene({ mode: 'portal', bridge: false, count: 7 });
    p.showOpener = false; flushSync();
    console.log(log.join('\n'));
    const slot = target.querySelector('#host-slot')!;
    expect(log).toContain('portaled destroyed');
    // The snapshot is still in the slot after the opener is gone:
    expect(slot.textContent).toContain('7');
    p.count = 9; flushSync();
    expect(slot.textContent).toContain('7'); // dead: no longer reactive, and no crash
  });
});
