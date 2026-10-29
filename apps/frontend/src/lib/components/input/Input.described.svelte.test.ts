/**
 * What `Input` tells assistive technology about what it shows under a field.
 *
 * A sighted user reads the info line, the inline error and the `required` badge beside the control they belong to. These cases hold the programmatic half of each: the info line and the error are the control's description, an error marks its control invalid and is announced when it appears, and a required single-control input is required to assistive technology.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InputProps, InputType } from './Input.type';

/** Hoisted so the context factory below can close over it: `vi.mock` factories are lifted above the module body. */
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

/** The id every subject is mounted with, so that derived ids are literals. */
const ID = 'subject';
const INFO_ID = `${ID}-info`;
const ERROR_ID = `${ID}-error`;
/** The shared test id of an `Input`'s inline error. */
const ERROR = '[data-testid="input-error"]';
const TOGGLE = '[data-testid="multilingual-toggle"]';

const OPTIONS = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' }
];

/** The kinds this file mounts, each with a value and the selector of the controls a user operates. For `image` that is the button that opens the file dialog: the file input itself is not rendered to the user. */
const KINDS = {
  text: { props: { value: 'x' }, controls: `#${ID}` },
  url: { props: { value: '' }, controls: `#${ID}` },
  email: { props: { value: '' }, controls: `#${ID}` },
  textarea: { props: { value: 'x' }, controls: `#${ID}` },
  number: { props: { value: 1 }, controls: `#${ID}` },
  date: { props: { value: '2024-10-13' }, controls: `#${ID}` },
  boolean: { props: { value: true }, controls: `#${ID}` },
  select: { props: { value: 'a', options: OPTIONS }, controls: `#${ID}` },
  'select-multiple': { props: { value: ['a'], options: OPTIONS }, controls: `#${ID}` },
  image: { props: { value: null }, controls: `#${ID}-image-label` },
  'text-multilingual': { props: { value: { en: 'x' } }, controls: 'input[type="text"]' },
  'textarea-multilingual': { props: { value: { en: 'x' } }, controls: 'textarea' },
  'multiple-text': { props: { value: ['x', 'y'] }, controls: '[data-testid="multiple-text-row"]' },
  'multiple-text-multilingual': { props: { value: [{ en: 'x' }] }, controls: '[data-testid="multiple-text-row"]' }
} satisfies Partial<Record<InputType, { props: Record<string, unknown>; controls: string }>>;

type Kind = keyof typeof KINDS;

const ALL_KINDS = Object.keys(KINDS) as Array<Kind>;
/** The kinds that render one control, which is therefore the one that is required. */
const SINGLE_CONTROL_KINDS: Array<Kind> = [
  'text',
  'url',
  'email',
  'textarea',
  'number',
  'date',
  'boolean',
  'select',
  'select-multiple'
];

let target: HTMLElement;
let component: ReturnType<typeof mount> | undefined;

function mountKind(kind: Kind, props: Record<string, unknown> = {}): void {
  target = document.createElement('div');
  document.body.appendChild(target);
  component = mount(Input, {
    target,
    props: { label: 'Label', id: ID, type: kind, ...KINDS[kind].props, ...props } as InputProps
  });
  flushSync();
}

/** The controls of the mounted input, in document order. Fails when there is none, so that an empty list never passes an `every`. */
function controls(kind: Kind): Array<HTMLElement> {
  const found = [...target.querySelectorAll<HTMLElement>(KINDS[kind].controls)];
  expect(found.length, `expected a ${kind} input to render a control`).toBeGreaterThan(0);
  return found;
}

/** The ids a control names as its description. */
function describedBy(control: Element): Array<string> {
  return (control.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
}

/** Commit `text` in the single control of a text-like kind. */
function commit(kind: Kind, text: string): void {
  const [control] = controls(kind) as Array<HTMLInputElement>;
  control.value = text;
  control.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

afterEach(() => {
  if (component) unmount(component);
  component = undefined;
  target.remove();
});

describe('the info line', () => {
  it.each(ALL_KINDS)('is the description of every control of a %s input', (kind) => {
    mountKind(kind, { info: 'Help.' });

    expect(target.querySelector(`#${INFO_ID}`)?.textContent).toContain('Help.');
    for (const control of controls(kind)) expect(describedBy(control)).toContain(INFO_ID);
  });

  it('is the description of the fields the translations toggle reveals', () => {
    mountKind('text-multilingual', { info: 'Help.' });

    target.querySelector<HTMLElement>(TOGGLE)?.click();
    flushSync();

    const revealed = controls('text-multilingual');
    expect(revealed).toHaveLength(i18n.locales.length);
    for (const control of revealed) expect(describedBy(control)).toContain(INFO_ID);
  });

  it.each<Kind>(['text', 'textarea', 'select', 'text-multilingual', 'select-multiple', 'multiple-text', 'image'])(
    'is joined to the description the caller of a %s input passed',
    (kind) => {
      mountKind(kind, { info: 'Help.', 'aria-describedby': 'note' });

      for (const control of controls(kind)) expect(describedBy(control)).toEqual(['note', INFO_ID]);
    }
  );

  it('gives a control no description when the input shows none', () => {
    mountKind('text');

    expect(target.querySelector(`#${INFO_ID}`)).toBeNull();
    expect(controls('text')[0].hasAttribute('aria-describedby')).toBe(false);
  });

  it('passes the caller’s description through alone when the input shows no info line', () => {
    mountKind('text', { 'aria-describedby': 'note' });

    expect(describedBy(controls('text')[0])).toEqual(['note']);
  });
});

describe('an inline error', () => {
  it.each<{ kind: Kind; invalid: string; valid: string }>([
    { kind: 'url', invalid: 'not a link', valid: 'https://example.com/' },
    { kind: 'email', invalid: 'nobody', valid: 'somebody@example.com' }
  ])(
    'is announced, described and marked on the control of a $kind input, and all three go with it',
    ({ kind, invalid, valid }) => {
      mountKind(kind);
      expect(target.querySelector(ERROR)).toBeNull();

      commit(kind, invalid);

      const error = target.querySelector(ERROR);
      expect(error, 'expected the inline error to be rendered').not.toBeNull();
      expect(error?.id).toBe(ERROR_ID);
      expect(error?.getAttribute('role')).toBe('alert');
      expect(controls(kind)[0].getAttribute('aria-invalid')).toBe('true');
      expect(describedBy(controls(kind)[0])).toEqual([ERROR_ID]);

      commit(kind, valid);

      expect(target.querySelector(ERROR)).toBeNull();
      expect(controls(kind)[0].hasAttribute('aria-invalid')).toBe(false);
      expect(controls(kind)[0].hasAttribute('aria-describedby')).toBe(false);
    }
  );

  it('is the description of the button that opens the file dialog when a file is refused', () => {
    mountKind('image');
    const fileInput = target.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput, 'expected the file input to be rendered').not.toBeNull();

    Object.defineProperty(fileInput, 'files', {
      configurable: true,
      value: [new File(['x'], 'notes.txt', { type: 'text/plain' })]
    });
    fileInput!.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();

    const error = target.querySelector(ERROR);
    expect(error?.id).toBe(ERROR_ID);
    expect(error?.getAttribute('role')).toBe('alert');
    expect(describedBy(controls('image')[0])).toEqual([INFO_ID, ERROR_ID]);
    expect(fileInput!.getAttribute('aria-invalid')).toBe('true');
  });

  it.each(ALL_KINDS)('marks no control of a %s input invalid while there is none', (kind) => {
    mountKind(kind);

    expect(target.querySelector(ERROR)).toBeNull();
    expect(target.querySelectorAll('[aria-invalid]')).toHaveLength(0);
  });
});

describe('a required input', () => {
  it.each(SINGLE_CONTROL_KINDS)('is required to assistive technology on the one control of a %s input', (kind) => {
    mountKind(kind, { required: true });

    expect(controls(kind)[0].getAttribute('aria-required')).toBe('true');
  });

  it.each(ALL_KINDS)('marks no control of a %s input required when the input is not', (kind) => {
    mountKind(kind);

    expect(target.querySelectorAll('[aria-required]')).toHaveLength(0);
  });

  it.each<Kind>(['text-multilingual', 'textarea-multilingual', 'multiple-text', 'multiple-text-multilingual'])(
    'marks no one field of a %s input required, where none is the required one',
    (kind) => {
      mountKind(kind, { required: true });

      expect(target.querySelectorAll('[aria-required]')).toHaveLength(0);
    }
  );
});
