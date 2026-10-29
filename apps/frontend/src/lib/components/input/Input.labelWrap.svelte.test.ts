/**
 * The label inside an `Input` row may wrap.
 *
 * A row holds its label and its control side by side. The label's text is a translation or a question's name, as long as its author made it: a label that cannot wrap and is wider than the room beside the control runs over the control, and inside an `InputGroup`, whose `<fieldset>` is never narrower than its content, it widens the whole page. Every in-row label therefore carries DaisyUI's `label` class, which the project's rule in `app.css` lets wrap between words (`labelWrap.test.ts` holds that rule), and no utility that keeps it on one line or breaks a word.
 *
 * A DOM without layout cannot show a label wrapping; the page-width and row checks of the end-to-end suite do that. What these cases hold is that every kind of `Input` that renders an in-row label takes it from the one shared class, so that none of them is left on one line.
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

/** The utilities that keep a label on one line. */
const ONE_LINE_CLASSES = ['whitespace-nowrap', 'whitespace-pre', 'truncate'];
/** Utilities that break a word in two. A label a few pixels narrower than its one word would lose that word's last letter to a second line. */
const WORD_BREAKING_CLASSES = [
  '[overflow-wrap:anywhere]',
  'wrap-anywhere',
  'wrap-break-word',
  'break-words',
  'break-all'
];

const OPTIONS = [
  { id: 'a', label: 'Option A' },
  { id: 'b', label: 'Option B' }
];

/** Each kind that renders a label inside a row, with a value, and the number of in-row labels it then renders. */
const KINDS: Array<{ type: InputType; props: Record<string, unknown>; labels: number }> = [
  { type: 'text', props: { value: 'x' }, labels: 1 },
  { type: 'url', props: { value: '' }, labels: 1 },
  { type: 'email', props: { value: '' }, labels: 1 },
  { type: 'number', props: { value: 1 }, labels: 1 },
  { type: 'date', props: { value: '2026-01-01' }, labels: 1 },
  { type: 'boolean', props: { value: true }, labels: 1 },
  { type: 'color', props: { value: '#2546a8' }, labels: 1 },
  { type: 'image', props: { value: null }, labels: 1 },
  { type: 'select', props: { value: 'a', options: OPTIONS }, labels: 1 },
  // The row of the dropdown, and one row for the selected option.
  { type: 'select-multiple', props: { value: ['a'], options: OPTIONS }, labels: 2 },
  // The language label of the displayed locale's field.
  { type: 'text-multilingual', props: { value: { en: 'x' } }, labels: 1 },
  { type: 'multiple-text-multilingual', props: { value: [{ en: 'x' }] }, labels: 1 }
];

let target: HTMLElement;
let component: ReturnType<typeof mount> | undefined;

function mountKind(type: InputType, props: Record<string, unknown>): void {
  target = document.createElement('div');
  document.body.appendChild(target);
  component = mount(Input, { target, props: { label: 'Label', type, ...props } as InputProps });
  flushSync();
}

/** The labels rendered inside a row: the elements that carry DaisyUI's `label` class. */
function inRowLabels(): Array<HTMLElement> {
  return [...target.querySelectorAll<HTMLElement>('.label')];
}

/** Assert that a label may wrap between words and breaks no word. */
function expectWrapsBetweenWords(label: HTMLElement): void {
  const classes = [...label.classList];
  expect(classes).toContain('label');
  for (const oneLine of ONE_LINE_CLASSES) expect(classes).not.toContain(oneLine);
  for (const breaking of WORD_BREAKING_CLASSES) expect(classes).not.toContain(breaking);
}

afterEach(() => {
  if (component) unmount(component);
  component = undefined;
  target.remove();
});

describe('the label inside a row', () => {
  it.each(KINDS)('may wrap in the $type kind', ({ type, props, labels }) => {
    mountKind(type, props);

    const rendered = inRowLabels();
    expect(rendered, `the in-row labels of the ${type} kind`).toHaveLength(labels);
    for (const label of rendered) expectWrapsBetweenWords(label);
  });

  it('may wrap in every language label once the translations are shown', () => {
    mountKind('text-multilingual', { value: { en: 'x', fi: 'y' } });
    target.querySelector<HTMLElement>('[data-testid="multilingual-toggle"]')?.click();
    flushSync();

    const rendered = inRowLabels();
    expect(rendered).toHaveLength(i18n.locales.length);
    for (const label of rendered) expectWrapsBetweenWords(label);
  });
});
