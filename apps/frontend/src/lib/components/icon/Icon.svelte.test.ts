/**
 * `Icon`, mounted for real, with the dynamic import of each icon held by the case, so that two imports resolve in the order the case chooses.
 *
 * A module's mock is made once per file, so each case holds imports of its own.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Icon from './Icon.svelte';
import type { IconName } from './icons';

const { imports } = vi.hoisted(() => {
  /** An import the case lets finish. */
  function hold(path: string) {
    let resolve!: () => void;
    const finished = new Promise<{ default: string }>((res) => {
      resolve = () => res({ default: `<path d="${path}"></path>` });
    });
    return { finished, resolve };
  }
  return {
    imports: {
      locked: hold('locked'),
      logout: hold('logout'),
      check: hold('check'),
      close: hold('close'),
      mail: hold('mail')
    }
  };
});

vi.mock('./svg/material/lock.ts', async () => await imports.locked.finished);
vi.mock('./svg/material/logout.ts', async () => await imports.logout.finished);
vi.mock('./svg/material/check.ts', async () => await imports.check.finished);
vi.mock('./svg/material/close.ts', async () => await imports.close.finished);
vi.mock('./svg/material/mail.ts', async () => await imports.mail.finished);

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

/** Let the imports started and finished so far reach the component. */
async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
}

/**
 * Mount an icon named `first` and then rename it to `second`, so that both imports are under way.
 * @returns The icon's svg element.
 */
async function iconRenamed(first: IconName, second: IconName): Promise<SVGElement> {
  const props = $state({ name: first });
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(Icon, { target, props });
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  flushSync();
  await settle();
  props.name = second;
  flushSync();
  await settle();
  return target.querySelector('svg')!;
}

describe('Icon — two imports under way', () => {
  it('the latest name wins when the newer import resolves first', async () => {
    const svg = await iconRenamed('locked', 'logout');

    imports.logout.resolve();
    await settle();
    expect(svg.innerHTML).toBe('<path d="logout"></path>');

    imports.locked.resolve();
    await settle();
    expect(svg.innerHTML).toBe('<path d="logout"></path>');
  });

  it('the latest name wins when the older import resolves first', async () => {
    const svg = await iconRenamed('check', 'close');

    imports.check.resolve();
    await settle();
    imports.close.resolve();
    await settle();

    expect(svg.innerHTML).toBe('<path d="close"></path>');
  });
});

describe('Icon — unmounted', () => {
  it('writes nothing and raises nothing when its import resolves after the unmount', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(Icon, { target, props: { name: 'mail' } });
    flushSync();
    await settle();
    const svg = target.querySelector('svg')!;

    unmount(component);
    target.remove();
    imports.mail.resolve();
    await settle();

    expect(svg.innerHTML).toBe('');
  });
});
