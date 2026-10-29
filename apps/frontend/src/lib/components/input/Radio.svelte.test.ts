/**
 * `Radio`, mounted for real from the input library's barrel.
 *
 * A group is two radios that share one name and are both bound to one parent value. The bound value is handed over as an accessor pair, which is what a `bind:` at a call site compiles to, so that a write a radio makes reaches the parent. Assertions are on the DOM rather than on component state.
 */

import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'svelte';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

const { Radio } = await import('.');

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

type Harness = {
  /** The element the radios were mounted into. */
  target: HTMLElement;
  /** The value the radios are bound to, as the parent sees it. */
  parent: { group: string | undefined };
};

/**
 * Mount one radio per entry of `radios`, all bound to one parent value.
 * @param radios - The props of each radio, without `group`.
 * @param group - The parent's value on arrival.
 */
function render(radios: Array<Record<string, unknown>>, group?: string): Harness {
  const parent = $state({ group });
  const target = document.createElement('div');
  document.body.appendChild(target);
  for (const props of radios) {
    const mounted = mount(Radio as Component<never>, {
      target,
      props: {
        ...props,
        get group() {
          return parent.group;
        },
        set group(next: string | undefined) {
          parent.group = next;
        }
      } as never
    });
    teardown.push(() => unmount(mounted));
  }
  flushSync();
  teardown.push(() => target.remove());
  return { target, parent };
}

/**
 * The radios in the document order, asserted to be as many as were mounted.
 * @param count - The number of radios mounted.
 */
function radiosOf(target: HTMLElement, count: number): Array<HTMLInputElement> {
  const radios = [...target.querySelectorAll<HTMLInputElement>('input')];
  expect(radios, 'one input per radio mounted').toHaveLength(count);
  return radios;
}

const TWO = [
  { name: 'fruit', value: 'apple', label: 'An apple' },
  { name: 'fruit', value: 'pear', label: 'A pear' }
];

describe('Radio — the markup', () => {
  it('renders a native radio with the bordered radio classes, its name and its value, inside a label holding its text', () => {
    const { target } = render([TWO[0]]);

    const labels = target.querySelectorAll('label');
    expect(labels).toHaveLength(1);
    const [radio] = radiosOf(target, 1);
    expect(radio.type).toBe('radio');
    expect(radio.name).toBe('fruit');
    expect(radio.value).toBe('apple');
    for (const name of ['radio', 'radio-primary', 'border']) expect(radio.classList.contains(name)).toBe(true);
    expect(radio.closest('label')).toBe(labels[0]);
    expect(labels[0].textContent?.trim()).toBe('An apple');
  });

  it('renders the children in place of the text', () => {
    const children = createRawSnippet(() => ({ render: () => '<em data-child>Pear, ripe</em>' }));
    const { target } = render([{ name: 'fruit', value: 'pear', children }]);

    const label = target.querySelector('label');
    expect(label?.querySelector('[data-child]')?.textContent).toBe('Pear, ripe');
    expect(label?.textContent?.trim()).toBe('Pear, ripe');
  });

  it('merges the caller’s class into the radio’s and passes the other attributes to the radio', () => {
    const { target } = render([{ ...TWO[0], class: 'mt-sm', 'data-testid': 'fruit-input', 'data-kind': 'apple' }]);

    const [radio] = radiosOf(target, 1);
    expect(radio.classList.contains('mt-sm')).toBe(true);
    expect(radio.classList.contains('border')).toBe(true);
    expect(radio.getAttribute('data-testid')).toBe('fruit-input');
    expect(radio.getAttribute('data-kind')).toBe('apple');
    expect(target.querySelector('label')?.hasAttribute('data-testid')).toBe(false);
  });

  it('passes the container’s attributes to the label, merging its class', () => {
    const { target } = render([{ ...TWO[0], containerProps: { class: 'p-lg', 'data-testid': 'fruit-option' } }]);

    const label = target.querySelector('label');
    expect(label?.classList.contains('p-lg')).toBe(true);
    expect(label?.classList.contains('cursor-pointer')).toBe(true);
    expect(label?.getAttribute('data-testid')).toBe('fruit-option');
  });

  it('disables the radio when it is disabled, and the label no longer shows a pointer', () => {
    const { target } = render([{ ...TWO[0], disabled: true }]);

    const [radio] = radiosOf(target, 1);
    expect(radio.disabled).toBe(true);
    expect(target.querySelector('label')?.classList.contains('cursor-pointer')).toBe(false);
  });
});

describe('Radio — the bound group', () => {
  it('checks no radio while the group holds no value', () => {
    const { target } = render(TWO);

    expect(radiosOf(target, 2).some((radio) => radio.checked)).toBe(false);
  });

  it('checks the radio whose value the group holds', () => {
    const { target } = render(TWO, 'pear');

    expect(radiosOf(target, 2).map((radio) => radio.checked)).toEqual([false, true]);
  });

  it('writes the value of the radio chosen to the group, and unchecks the other', () => {
    const { target, parent } = render(TWO, 'pear');

    radiosOf(target, 2)[0].click();
    flushSync();

    expect(parent.group).toBe('apple');
    expect(radiosOf(target, 2).map((radio) => radio.checked)).toEqual([true, false]);
  });

  it('follows the group when the parent changes it', () => {
    const { target, parent } = render(TWO);

    parent.group = 'apple';
    flushSync();

    expect(radiosOf(target, 2).map((radio) => radio.checked)).toEqual([true, false]);
  });

  it('calls the change handler it was given when it is chosen', () => {
    const onchange = vi.fn();
    const { target } = render([{ ...TWO[0], onchange }, TWO[1]]);

    radiosOf(target, 2)[0].click();
    flushSync();

    expect(onchange).toHaveBeenCalledTimes(1);
  });
});
