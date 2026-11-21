/**
 * `RadioGroup`, mounted for real from the input library's barrel.
 *
 * `selected` and `error` are handed over as accessor pairs, which is what a `bind:` at a call site compiles to, so that a write the group makes reaches the parent. Assertions are on the DOM rather than on component state.
 */

import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'svelte';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

const { RadioGroup } = await import('.');

const OPTIONS = [
  { value: 'first', label: 'First' },
  { value: 'second', label: 'Second' }
];
const ERROR = 'Choose one';

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

type Harness = {
  target: HTMLElement;
  parent: { selected: string | undefined; error: string | undefined };
  exports: { focusFirst: () => void };
};

function render(props: Record<string, unknown> = {}): Harness {
  const parent = $state({
    selected: props.selected as string | undefined,
    error: props.error as string | undefined
  });
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(RadioGroup as Component<never>, {
    target,
    props: {
      legend: 'The legend',
      name: 'choice',
      options: OPTIONS,
      ...props,
      get selected() {
        return parent.selected;
      },
      set selected(next: string | undefined) {
        parent.selected = next;
      },
      get error() {
        return parent.error;
      },
      set error(next: string | undefined) {
        parent.error = next;
      }
    } as never
  });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return { target, parent, exports: component as unknown as Harness['exports'] };
}

function radiosOf(target: HTMLElement): Array<HTMLInputElement> {
  return [...target.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
}

function choose(radio: HTMLInputElement): void {
  radio.click();
  flushSync();
}

describe('RadioGroup — structure', () => {
  it('renders one fieldset named by its legend, with one native radio per option in the order given', () => {
    const { target } = render();

    const fieldset = target.querySelector('fieldset');
    expect(fieldset?.firstElementChild?.tagName).toBe('LEGEND');
    expect(fieldset?.firstElementChild?.textContent?.trim()).toBe('The legend');
    const radios = radiosOf(target);
    expect(radios.map((radio) => radio.value)).toEqual(['first', 'second']);
    for (const radio of radios) expect(radio.name).toBe('choice');
    expect(radios.map((radio) => radio.closest('label')?.textContent?.trim())).toEqual(['First', 'Second']);
  });

  it('merges the caller’s classes and passes per-option attributes to the blocks and the radios', () => {
    const { target } = render({
      class: 'caller-class',
      'data-testid': 'group',
      legendProps: { class: 'legend-class' },
      optionProps: (value: string) => ({ 'data-option': value }),
      radioProps: (value: string) => ({ 'data-radio': value })
    });

    const fieldset = target.querySelector('fieldset');
    expect(fieldset?.classList.contains('caller-class')).toBe(true);
    expect(fieldset?.classList.contains('flex')).toBe(true);
    expect(fieldset?.getAttribute('data-testid')).toBe('group');
    expect(target.querySelector('legend')?.classList.contains('legend-class')).toBe(true);
    const radio = target.querySelector<HTMLInputElement>('[data-option="second"] [data-radio="second"]');
    expect(radio?.value).toBe('second');
  });

  it('has nothing chosen on arrival and gives no element a role', () => {
    const { target, parent } = render();

    expect(radiosOf(target).some((radio) => radio.checked)).toBe(false);
    expect(parent.selected).toBeUndefined();
    expect(target.querySelector('[role]')).toBeNull();
  });
});

describe('RadioGroup — choosing', () => {
  it('hands the parent the chosen value and calls `onchoose` with it', () => {
    const onchoose = vi.fn();
    const { target, parent } = render({ onchoose });

    choose(radiosOf(target)[1]);

    expect(parent.selected).toBe('second');
    expect(onchoose).toHaveBeenCalledExactlyOnceWith('second');
  });

  it('renders the `option` snippet under the chosen option alone, inside its block', () => {
    const option = createRawSnippet<[string]>((value) => ({
      render: () => `<p data-under="${value()}">under</p>`
    }));
    const { target } = render({ option, optionProps: (value: string) => ({ 'data-option': value }) });

    expect(target.querySelector('[data-under]')).toBeNull();
    choose(radiosOf(target)[0]);

    const under = target.querySelectorAll('[data-under]');
    expect(under).toHaveLength(1);
    expect(under[0].closest('[data-option]')?.getAttribute('data-option')).toBe('first');
  });

  it('focuses the first radio on `focusFirst()`', () => {
    const { target, exports } = render();

    exports.focusFirst();

    expect(document.activeElement).toBe(radiosOf(target)[0]);
  });
});

describe('RadioGroup — the error', () => {
  it('renders no alert and no description without an error', () => {
    const { target } = render();

    expect(target.querySelector('[role="alert"]')).toBeNull();
    expect(target.querySelector('fieldset')?.hasAttribute('aria-describedby')).toBe(false);
  });

  it('renders the error as an alert named as the fieldset’s description, after the caller’s', () => {
    const { target } = render({ error: ERROR, id: 'group-id', 'aria-describedby': 'hint', errorTestId: 'group-error' });

    const alert = target.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain(ERROR);
    expect(alert?.id).toBe('group-id-error');
    expect(alert?.getAttribute('data-testid')).toBe('group-error');
    const fieldset = target.querySelector('fieldset');
    expect(fieldset?.id).toBe('group-id');
    expect(fieldset?.getAttribute('aria-describedby')).toBe('hint group-id-error');
  });

  it('clears a bound error when an option is chosen', () => {
    const { target, parent } = render({ error: ERROR });

    choose(radiosOf(target)[0]);

    expect(parent.error).toBeUndefined();
    expect(target.querySelector('[role="alert"]')).toBeNull();
  });
});
