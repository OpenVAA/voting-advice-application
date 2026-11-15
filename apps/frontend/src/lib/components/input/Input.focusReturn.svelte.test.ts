/**
 * Where `Input` sends focus, and what a dev build of Svelte says about how it finds the element.
 *
 * `Input` returns focus to its first field in two places: when the translations toggle reveals the other locales, and when a selected option is deleted from a `select-multiple`. The fields are rendered by the parts under `./parts`, so focusing one means crossing a component boundary.
 *
 *  - The first group holds the behaviour. It does not depend on how the boundary is crossed and must stay green through any change to that wiring.
 *  - The second group holds what the wiring must not cost. A dev build of Svelte reports a component that writes into a `$state` object it was handed as a plain prop as `ownership_invalid_mutation`, and mounting an `Input` of any kind logs none. For the two multi-text kinds a zero is necessary and not sufficient: the compiler does not instrument a write through a computed index.
 */

import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import type { InputProps, InputType } from './Input.type';

/**
 * Hoisted so the context factory below can close over it: `vi.mock` factories are lifted above the module body. Two locales, so that the translations toggle is rendered and has a second field to reveal.
 */
const { i18n } = vi.hoisted(() => ({
  i18n: { locale: 'en', locales: ['en', 'fi'] as ReadonlyArray<string> }
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({
    get locale() {
      return i18n.locale;
    },
    get locales() {
      return i18n.locales;
    },
    t: (key: string) => key,
    translate: (value: unknown) => (typeof value === 'string' ? value : ''),
    darkMode: false
  })
}));

const Input = (await import('./Input.svelte')).default;

/** The show/hide-translations control, rendered by `Input` for any multilingual kind. */
const TOGGLE = '[data-testid="multilingual-toggle"]';
/** The delete control of a selected option. Its title is the translation key, because the mocked `t` returns keys. */
const DELETE_OPTION = 'button[title="components.input.deleteOption"]';
/** Every text field a part renders. */
const FIELD = 'input[type="text"], textarea';

const OPTIONS = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' }
];

/** One mountable example of every kind. */
const EXAMPLES: Record<InputType, Record<string, unknown>> = {
  text: { value: 'x' },
  url: { value: '' },
  email: { value: '' },
  textarea: { value: 'x' },
  number: { value: 1 },
  date: { value: '2024-10-13' },
  color: { value: '#2546a8' },
  boolean: { value: true },
  select: { value: 'a', options: OPTIONS },
  image: { value: null },
  'text-multilingual': { value: { en: 'x' } },
  'textarea-multilingual': { value: { en: 'x' } },
  'select-multiple': { value: ['a'], options: OPTIONS },
  'multiple-text': { value: ['x'] },
  'multiple-text-multilingual': { value: [{ en: 'x' }] }
};

let target: HTMLElement;
let component: ReturnType<typeof mount> | undefined;
let warn: MockInstance<typeof console.warn>;

function mountKind(type: InputType): void {
  target = document.createElement('div');
  document.body.appendChild(target);
  component = mount(Input, { target, props: { label: 'Label', type, ...EXAMPLES[type] } as InputProps });
  flushSync();
}

/** Click the control matching `selector`, failing loudly rather than silently no-opping when absent. */
function click(selector: string): void {
  const control = target.querySelector<HTMLElement>(selector);
  expect(control, `expected a control matching ${selector} to be rendered`).not.toBeNull();
  control!.click();
  flushSync();
}

/** The number of `ownership_invalid_mutation` warnings logged so far. */
function ownershipWarnings(): number {
  return warn.mock.calls.filter((args) => String(args[0]).includes('ownership_invalid_mutation')).length;
}

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(async () => {
  if (component) unmount(component);
  component = undefined;
  target.remove();
  // An element binding is cleared in a microtask after unmount; wait for it so that the write lands while `console.warn` is still replaced.
  await tick();
  warn.mockRestore();
});

describe('focus return', () => {
  it.each<InputType>(['text-multilingual', 'textarea-multilingual', 'multiple-text-multilingual'])(
    'moves focus to the first field when the translations of a %s input are revealed',
    (type) => {
      mountKind(type);
      expect(target.querySelectorAll(FIELD)).toHaveLength(1);
      expect(document.activeElement).toBe(document.body);

      click(TOGGLE);

      expect(target.querySelectorAll(FIELD)).toHaveLength(i18n.locales.length);
      expect(document.activeElement).toBe(target.querySelector(FIELD));
    }
  );

  it('moves focus to the dropdown when a selected option is deleted', () => {
    mountKind('select-multiple');
    expect(document.activeElement).toBe(document.body);

    click(DELETE_OPTION);

    expect(document.activeElement).toBe(target.querySelector('select'));
  });
});

describe('ownership warnings on mount', () => {
  it.each<InputType>([
    'text-multilingual',
    'textarea-multilingual',
    'select-multiple',
    'multiple-text',
    'multiple-text-multilingual'
  ])('logs no ownership warning on mount of a %s input, whose part holds the field that takes focus', (type) => {
    mountKind(type);

    expect(ownershipWarnings()).toBe(0);
  });

  it.each<InputType>(['text', 'url', 'email', 'textarea', 'number', 'date', 'color', 'boolean', 'select', 'image'])(
    'logs none for a %s input, which hands no focus target to a part',
    (type) => {
      mountKind(type);

      expect(ownershipWarnings()).toBe(0);
    }
  );
});
