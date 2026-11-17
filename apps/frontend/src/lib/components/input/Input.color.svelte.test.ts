/**
 * The `color` kind of `Input`: one row with a hex text field and a round swatch laid under the platform colour picker.
 *
 * The value is lowercase `#rrggbb` or nothing. What these cases hold above all is the difference between the committed colour and the text in the field: an entry that is not a hex colour stays in the field to be corrected, is marked and announced, and changes neither the value nor what the swatch paints. The swatch is painted from the committed colour alone.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InputProps } from './Input.type';

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
const LABEL = 'Colour';
const STORED = '#2546a8';
/** The shared test id of an `Input`'s inline error. */
const ERROR = '[data-testid="input-error"]';

type SubjectProps = {
  value?: string | null;
  locked?: boolean;
  info?: string;
  'data-testid'?: string;
};

let target: HTMLElement;
let component: ReturnType<typeof mount> | undefined;
let emitted: Array<unknown>;

function mountSubject(props: SubjectProps = {}): void {
  emitted = [];
  target = document.createElement('div');
  document.body.appendChild(target);
  component = mount(Input, {
    target,
    props: {
      label: LABEL,
      id: ID,
      type: 'color',
      onChange: (value: unknown) => emitted.push(value),
      ...props
    } as InputProps
  });
  flushSync();
}

/** The hex text field: the labelled control of the row. */
function hexField(): HTMLInputElement {
  const field = target.querySelector<HTMLInputElement>(`input[type="text"]#${ID}`);
  expect(field, 'expected the hex text field to be rendered').not.toBeNull();
  return field!;
}

/** The platform colour picker. */
function picker(): HTMLInputElement {
  const input = target.querySelector<HTMLInputElement>(`input[type="color"]#${ID}-picker`);
  expect(input, 'expected the colour picker to be rendered').not.toBeNull();
  return input!;
}

/** The visible swatch: the decorative element beside the picker, inside the picker's wrapper. */
function swatch(): HTMLElement {
  const fill = picker().parentElement?.querySelector<HTMLElement>('[aria-hidden="true"]') ?? null;
  expect(fill, 'expected the swatch to be rendered').not.toBeNull();
  return fill!;
}

/** The colour the swatch paints as lowercase `#rrggbb`, or an empty string when it paints none. */
function painted(): string {
  const raw = swatch().style.backgroundColor;
  const rgb = /^rgb\((\d+), ?(\d+), ?(\d+)\)$/.exec(raw);
  if (!rgb) return raw;
  return `#${rgb
    .slice(1)
    .map((channel) => Number(channel).toString(16).padStart(2, '0'))
    .join('')}`;
}

/** Commit `text` in the hex field, as blur or Enter does. */
function typeHex(text: string): void {
  const field = hexField();
  field.value = text;
  field.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** Choose `color` in the platform picker. */
function pick(color: string): void {
  const input = picker();
  input.value = color;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** Whether the row shows the badge whose screen-reader text is `key`. */
function hasBadge(key: string): boolean {
  return [...target.querySelectorAll('.sr-only')].some((element) => element.textContent === key);
}

/** The ids a control names as its description. */
function describedBy(control: Element): Array<string> {
  return (control.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
}

afterEach(() => {
  if (component) unmount(component);
  component = undefined;
  target.remove();
});

describe('an editable colour', () => {
  it('shows a stored colour in the hex field and paints the swatch with it', () => {
    mountSubject({ value: STORED });

    expect(hexField().value).toBe(STORED);
    expect(painted()).toBe(STORED);
    expect(picker().value).toBe(STORED);
    expect(hexField().disabled).toBe(false);
    expect(picker().disabled).toBe(false);
    expect(emitted).toEqual([]);
  });

  it.each([{ value: undefined }, { value: null }])(
    'shows no colour for $value as an empty field without a placeholder and an unfilled, dashed swatch',
    ({ value }) => {
      mountSubject({ value });

      expect(hexField().value).toBe('');
      expect(hexField().hasAttribute('placeholder')).toBe(false);
      expect(painted()).toBe('');
      expect(swatch().classList.contains('border-dashed')).toBe(true);
      expect(emitted).toEqual([]);
    }
  );

  it('starts the picker from a neutral grey when there is no colour, without emitting it', () => {
    mountSubject();

    expect(picker().value).toBe('#808080');
    expect(emitted).toEqual([]);
  });

  it.each([
    { stored: '2546A8', shown: '#2546a8' },
    { stored: '#ABC', shown: '#aabbcc' },
    { stored: '#2546A8', shown: '#2546a8' }
  ])('shows the stored colour $stored as $shown and emits nothing', ({ stored, shown }) => {
    mountSubject({ value: stored });

    expect(hexField().value).toBe(shown);
    expect(painted()).toBe(shown);
    expect(swatch().classList.contains('border-dashed')).toBe(false);
    expect(emitted).toEqual([]);
  });

  it.each(['red', '#12345', 'url(x)', '#fff; background: url(x)', 'rgb(-1,0,0)'])(
    'shows the stored value %s, which is no colour, as the empty state and emits nothing',
    (stored) => {
      mountSubject({ value: stored });

      expect(hexField().value).toBe('');
      expect(painted()).toBe('');
      expect(swatch().classList.contains('border-dashed')).toBe(true);
      expect(emitted).toEqual([]);
    }
  );
});

describe('setting, changing and clearing a colour', () => {
  it.each([
    { typed: '#ff0000', committed: '#ff0000' },
    { typed: 'f00', committed: '#ff0000' },
    { typed: '#FF0000', committed: '#ff0000' },
    { typed: ' 00ff00 ', committed: '#00ff00' }
  ])('emits $committed once when $typed is committed in the hex field, and shows it', ({ typed, committed }) => {
    mountSubject({ value: STORED });

    typeHex(typed);

    expect(emitted).toEqual([committed]);
    expect(hexField().value).toBe(committed);
    expect(painted()).toBe(committed);
    expect(picker().value).toBe(committed);
  });

  it('emits the picked colour once and shows it in the hex field', () => {
    mountSubject();

    pick('#00ff00');

    expect(emitted).toEqual(['#00ff00']);
    expect(hexField().value).toBe('#00ff00');
    expect(painted()).toBe('#00ff00');
    expect(swatch().classList.contains('border-dashed')).toBe(false);
  });

  it('emits no colour once when the hex field is emptied, and empties the swatch', () => {
    mountSubject({ value: STORED });

    typeHex('');

    expect(emitted).toHaveLength(1);
    expect(emitted[0] ?? null).toBeNull();
    expect(painted()).toBe('');
    expect(swatch().classList.contains('border-dashed')).toBe(true);
  });
});

describe('an entry that is not a hex colour', () => {
  const INVALID = ['red', '#12345', 'rgb(0,0,0)', '#fff; background: url(x)'];

  it.each(INVALID)('keeps %s in the field, marks it invalid and changes neither the value nor the swatch', (typed) => {
    mountSubject({ value: STORED });

    typeHex(typed);

    expect(emitted).toEqual([]);
    expect(hexField().value).toBe(typed);
    expect(hexField().getAttribute('aria-invalid')).toBe('true');
    expect(painted()).toBe(STORED);
    expect(picker().value).toBe(STORED);
  });

  it.each(INVALID)('shows and announces the invalid-colour message for %s as the field’s description', (typed) => {
    mountSubject({ value: STORED });

    typeHex(typed);

    const error = target.querySelector(ERROR);
    expect(error, 'expected the inline error to be rendered').not.toBeNull();
    expect(error?.id).toBe(`${ID}-error`);
    expect(error?.getAttribute('role')).toBe('alert');
    expect(error?.textContent).toContain('components.input.error.invalidColor');
    expect(describedBy(hexField())).toContain(`${ID}-error`);
  });

  it.each(INVALID)('marks the picker invalid and describes it by the message for %s, as the hex field', (typed) => {
    mountSubject({ value: STORED });

    typeHex(typed);

    expect(picker().getAttribute('aria-invalid')).toBe('true');
    expect(describedBy(picker())).toContain(`${ID}-error`);
  });

  it('leaves the swatch unfilled when there was no colour before it', () => {
    mountSubject();

    typeHex('red');

    expect(emitted).toEqual([]);
    expect(painted()).toBe('');
    expect(swatch().classList.contains('border-dashed')).toBe(true);
  });

  it('is cleared by a valid entry', () => {
    mountSubject({ value: STORED });
    typeHex('red');

    typeHex('#ff0000');

    expect(target.querySelector(ERROR)).toBeNull();
    expect(hexField().hasAttribute('aria-invalid')).toBe(false);
    expect(emitted).toEqual(['#ff0000']);
  });

  it('is cleared by an empty field', () => {
    mountSubject({ value: STORED });
    typeHex('red');

    typeHex('');

    expect(target.querySelector(ERROR)).toBeNull();
    expect(hexField().hasAttribute('aria-invalid')).toBe(false);
    expect(emitted).toHaveLength(1);
  });

  it('is cleared by a picked colour, which replaces the typed text', () => {
    mountSubject({ value: STORED });
    typeHex('red');

    pick('#00ff00');

    expect(target.querySelector(ERROR)).toBeNull();
    expect(hexField().hasAttribute('aria-invalid')).toBe(false);
    expect(hexField().value).toBe('#00ff00');
    expect(emitted).toEqual(['#00ff00']);
  });

  it('is replaced by the stored colour again when that same colour is picked', () => {
    mountSubject({ value: STORED });
    typeHex('red');

    pick(STORED);

    expect(target.querySelector(ERROR)).toBeNull();
    expect(hexField().value).toBe(STORED);
  });
});

describe('a locked colour', () => {
  it('shows the value and the swatch with both controls disabled and the lock badge', () => {
    mountSubject({ value: STORED, locked: true });

    expect(hexField().value).toBe(STORED);
    expect(painted()).toBe(STORED);
    expect(hexField().disabled).toBe(true);
    expect(picker().disabled).toBe(true);
    expect(hasBadge('common.locked')).toBe(true);
  });

  it('shows the no-colour text and the lock badge, and neither a field nor a swatch, when there is none', () => {
    mountSubject({ locked: true });

    expect(target.textContent).toContain('components.input.noColor');
    expect(hasBadge('common.locked')).toBe(true);
    expect(target.querySelector('input')).toBeNull();
    expect(target.querySelector('.rounded-full')).toBeNull();
  });
});

describe('the names and descriptions of the colour controls', () => {
  it('names the hex field by the row label', () => {
    mountSubject({ value: STORED });

    const label = target.querySelector<HTMLLabelElement>(`label[for="${ID}"]`);
    expect(label?.textContent).toBe(LABEL);
    expect(label?.control).toBe(hexField());
  });

  it('names the picker by the row label followed by the picker label', () => {
    mountSubject({ value: STORED });

    const name = (picker().getAttribute('aria-labelledby') ?? '')
      .split(/\s+/)
      .map((id) => target.querySelector(`#${id}`)?.textContent?.trim())
      .join(' ');
    expect(name).toBe(`${LABEL} components.input.colorPicker`);
  });

  it('hides the swatch’s fill from assistive technology and keeps both controls in the tab order', () => {
    mountSubject({ value: STORED });

    expect(swatch().getAttribute('aria-hidden')).toBe('true');
    expect(hexField().tabIndex).toBe(0);
    expect(picker().tabIndex).toBe(0);
  });

  it('gives the picker a wrapper of the touch size that shows the focus ring', () => {
    mountSubject({ value: STORED });

    const wrapper = picker().parentElement;
    expect([...(wrapper?.classList ?? [])]).toEqual(
      expect.arrayContaining(['min-h-touch', 'min-w-touch', 'focus-within:ring', 'focus-within:ring-offset-2'])
    );
  });

  it('describes the hex field by the info line', () => {
    mountSubject({ value: STORED, info: 'Help.' });

    expect(target.querySelector(`#${ID}-info`)?.textContent).toContain('Help.');
    expect(describedBy(hexField())).toEqual([`${ID}-info`]);
  });

  it('describes the picker by the info line too, and marks it valid while the entry is', () => {
    mountSubject({ value: STORED, info: 'Help.' });

    expect(describedBy(picker())).toEqual([`${ID}-info`]);
    expect(picker().hasAttribute('aria-invalid')).toBe(false);
  });

  it('puts a test id on the hex field only when the caller passes one', () => {
    mountSubject({ value: STORED, 'data-testid': 'profile-color-hex' });
    expect(hexField().getAttribute('data-testid')).toBe('profile-color-hex');
    if (component) unmount(component);
    target.remove();

    mountSubject({ value: STORED });
    expect(hexField().hasAttribute('data-testid')).toBe(false);
  });
});
