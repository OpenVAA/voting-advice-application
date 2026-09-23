/**
 * The multi-text row list — its value semantics, and the multilingual gap.
 *
 * Phase 159, criterion 2 (D-H2). The multi-text input is being absorbed into `Input` as an extracted part, and multilingual support lands in the same change. Those are two different kinds of change and this file separates them:
 *
 *  - Cases 1-5 describe the value semantics the row list ALREADY has — empty rows dropped, duplicates kept, order preserved, an absent value emitting an empty collection rather than a collection holding one empty string, and a single row behaving exactly like many. They are green before the extraction and must stay green through it. That before/after identity is the equivalence proof that the extraction moved code rather than changing behaviour, so these five assertions must not be "adapted" to whatever the new implementation happens to do.
 *  - Cases 6-7 describe multilingual multi-text, which does not exist yet. They are RED on unmodified source, by design: the standalone component's own header states that multilingual values are out of its input scope and that its rows are plain text bound to a flat collection. Recording them red first is this project's standing practice of showing a guard fail before the fix.
 *
 * `mountSubject` below is the ONLY seam that moves as the component is absorbed. Task 1 points it at the standalone component; the extraction re-points it at `Input` with the new multi-text kind. Every `it()` body stays byte-identical across that edit — that is the whole point of routing the mount through one helper.
 *
 * Assertions are on the emitted value observed through the change callback, never on internal state: the emitted value is what the candidate app persists, and a silent change to its shape is the threat this file exists to catch.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InputProps } from './Input.type';

/**
 * Hoisted so the context factory below can close over them. `vi.mock` factories are lifted above the module body, so plain top-level `const`s would be in their temporal dead zone at factory-definition time. `locale` is mutable because the displayed locale is a page-lifecycle constant in this app — the only way to observe a locale switch is to remount against a different one, which case 7 does.
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

/** The testid carried by every editable row field, plain or per-locale. Byte-matches the component. */
const ROW = '[data-testid="multiple-text-row"]';
/** The add-a-row control. */
const ADD = '[data-testid="multiple-text-add"]';
/** The show/hide-translations control. Rendered by `Input` for any multilingual kind. */
const TOGGLE = '[data-testid="multilingual-toggle"]';

/** The props the multi-text subject accepts, independent of which component currently implements it. */
type SubjectProps = {
  label: string;
  value?: Array<string> | Array<LocalizedString> | null;
  minItems?: number;
  maxItems?: number;
  multilingual?: boolean;
  onChange?: (value: unknown) => void;
};

let target: HTMLElement;
let teardown: Array<() => void> = [];

/**
 * Mount the multi-text subject. THIS IS THE ONLY SEAM that moved as the component was absorbed into `Input`; the cases below never reference the component directly.
 *
 * The `multilingual` flag selects the multilingual sibling kind. Until that kind exists the plain kind is used for both, which is what keeps cases 6 and 7 red rather than unwritable.
 */
function mountSubject({ multilingual, ...props }: SubjectProps): void {
  target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(Input, {
    target,
    props: { ...props, type: multilingual ? 'multiple-text-multilingual' : 'multiple-text' } as InputProps
  });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
}

/** Every editable row field currently in the DOM, in document order. */
function fields(): Array<HTMLInputElement | HTMLTextAreaElement> {
  return [...target.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(ROW)];
}

/**
 * Type `text` into the field at `index`. Both `input` and `change` are dispatched so the helper is agnostic about which of the two the implementation listens on — the plain row list uses `oninput`, the multilingual text branch uses `onchange`, and the absorbed part sits between them.
 */
function type(index: number, text: string): void {
  const field = fields()[index];
  field.value = text;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** Click the control matching `selector`, failing loudly rather than silently no-opping when absent. */
function click(selector: string): void {
  const button = target.querySelector<HTMLElement>(selector);
  expect(button, `expected a control matching ${selector} to be rendered`).not.toBeNull();
  button!.click();
  flushSync();
}

beforeEach(() => {
  i18n.locale = 'en';
});

afterEach(() => {
  for (const stop of teardown.reverse()) stop();
  teardown = [];
});

describe('multi-text value semantics', () => {
  it('keeps two rows whose trimmed content is identical — nothing is de-duplicated', () => {
    const emitted: Array<unknown> = [];
    mountSubject({ label: 'Languages', value: ['fi', 'fi'], onChange: (v) => emitted.push(v) });

    type(1, 'fi');

    expect(emitted.at(-1)).toEqual(['fi', 'fi']);
  });

  it('drops a row containing only whitespace', () => {
    const emitted: Array<unknown> = [];
    mountSubject({ label: 'Languages', value: ['fi', '', 'sv'], onChange: (v) => emitted.push(v) });

    type(1, '   ');

    expect(emitted.at(-1)).toEqual(['fi', 'sv']);
  });

  it('emits an empty collection for an absent value, never a collection holding an empty string', () => {
    const emitted: Array<unknown> = [];
    mountSubject({ label: 'Languages', onChange: (v) => emitted.push(v) });

    // The floor renders one empty row; editing it to empty is the only way to observe the emission.
    expect(fields()).toHaveLength(1);
    type(0, '');

    expect(emitted.at(-1)).toEqual([]);
  });

  it('treats a single-row value exactly like a multi-row one', () => {
    const emitted: Array<unknown> = [];
    mountSubject({ label: 'Languages', value: ['fi'], onChange: (v) => emitted.push(v) });

    expect(fields()).toHaveLength(1);
    type(0, '  fi  ');
    expect(emitted.at(-1)).toEqual(['  fi  ']);

    type(0, '   ');
    expect(emitted.at(-1)).toEqual([]);
  });

  it('emits rows in the authored order', () => {
    const emitted: Array<unknown> = [];
    mountSubject({ label: 'Languages', value: ['gamma', 'alpha', 'beta'], onChange: (v) => emitted.push(v) });

    click(ADD);
    type(3, 'delta');

    expect(emitted.at(-1)).toEqual(['gamma', 'alpha', 'beta', 'delta']);
  });
});

describe('multi-text multilingual', () => {
  it('renders one editable field per supported locale for each row and emits a per-locale value', () => {
    const emitted: Array<unknown> = [];
    mountSubject({
      label: 'Languages',
      multilingual: true,
      value: [{ en: 'first' }, { en: 'second' }],
      onChange: (v) => emitted.push(v)
    });

    // Only the displayed locale is editable until translations are revealed, exactly as the single-language multilingual branch behaves.
    expect(fields()).toHaveLength(2);
    click(TOGGLE);
    expect(fields()).toHaveLength(2 * i18n.locales.length);

    // Field order is row-major: row 0 displayed locale, row 0 other locale, row 1 displayed locale, …
    type(1, 'ensimmainen');

    expect(emitted.at(-1)).toEqual([{ en: 'first', fi: 'ensimmainen' }, { en: 'second' }]);
  });

  it('does not reorder rows or drop a row that is empty in the newly displayed locale', () => {
    const emitted: Array<unknown> = [];
    const value: Array<LocalizedString> = [{ en: 'first' }, { en: 'second', fi: 'toinen' }];
    mountSubject({ label: 'Languages', multilingual: true, value, onChange: (v) => emitted.push(v) });
    expect(fields().map((f) => f.value)).toEqual(['first', 'second']);

    // A locale switch is a fresh page lifecycle in this app, so remount against the other locale with the same value. Row 0 is empty in Finnish and must survive, in place.
    for (const stop of teardown.reverse()) stop();
    teardown = [];
    i18n.locale = 'fi';
    mountSubject({ label: 'Languages', multilingual: true, value, onChange: (v) => emitted.push(v) });

    expect(fields()).toHaveLength(2);
    expect(fields().map((f) => f.value)).toEqual(['', 'toinen']);

    type(0, 'ensimmainen');

    expect(emitted.at(-1)).toEqual([
      { en: 'first', fi: 'ensimmainen' },
      { en: 'second', fi: 'toinen' }
    ]);
  });
});
