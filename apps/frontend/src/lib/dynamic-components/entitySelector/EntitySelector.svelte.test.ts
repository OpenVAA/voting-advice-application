/**
 * `EntitySelector`, mounted for real: a single-choice group whose options are entity cards and plain rows.
 *
 * The entities are objects of a real `DataRoot`, and the card inside an entity option is the real `EntityCard` against a fake app context. The keyboard model is the browser's own for radios that share a name, which jsdom does not implement, so these tests assert the structure that gives it: one name, no `tabindex` and no key press the component answers.
 */

import { DataRoot } from '@openvaa/data';
import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EntitySelectorOption } from './EntitySelector.type';

vi.mock('$lib/contexts/app', () => ({
  getAppContext: () => ({
    appType: { current: 'contestant' },
    getRoute: { current: () => '/unused' },
    startEvent: () => undefined,
    t: (key: string) => key,
    appSettings: {},
    dataRoot: {}
  })
}));

vi.mock('$lib/contexts/voter', () => ({
  getVoterContext: () => undefined
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));

const { EntitySelector } = await import('.');

const OPTION = '[data-testid="entity-selector-option"]';
const INPUT = '[data-testid="entity-selector-option-input"]';
const HINT = '[data-testid="entity-selector-option-hint"]';
const EMPTY = '[data-testid="entity-selector-empty"]';
const ERROR = '[data-testid="entity-selector-error"]';
const CARD = '[data-testid="entity-card-subcard"]';
const DETAIL = '[data-testid="detail"]';
const HIDDEN = '[aria-hidden="true"]';
const FOCUSABLE = 'a, button, input, select, textarea, [tabindex]';

const LEGEND = 'List';
const REQUIRED_SENTENCE = 'common.required';

const dataRoot = new DataRoot();
dataRoot.provideEntityData([
  { type: 'organization', id: 'green', name: 'Green Party', shortName: 'GP' },
  { type: 'organization', id: 'blue', name: 'Blue Party', shortName: 'BP' },
  { type: 'alliance', id: 'coast', name: 'Coastal Alliance', shortName: 'CA' }
]);

const NONE: EntitySelectorOption = { kind: 'none', value: 'none', name: 'Independent / no party' };
const GREEN: EntitySelectorOption = {
  kind: 'entity',
  value: 'green',
  name: 'Green Party',
  entity: dataRoot.getEntity('organization', 'green')
};
const BLUE: EntitySelectorOption = {
  kind: 'entity',
  value: 'blue',
  name: 'Blue Party',
  hint: 'Not nominated here yet',
  entity: dataRoot.getEntity('organization', 'blue')
};
const COAST: EntitySelectorOption = {
  kind: 'entity',
  value: 'coast',
  name: 'Coastal Alliance',
  entity: dataRoot.getEntity('alliance', 'coast')
};
const OTHER: EntitySelectorOption = { kind: 'other', value: 'other', name: 'Other' };
const UNLISTED: EntitySelectorOption = {
  kind: 'unlisted',
  value: 'unlisted',
  name: 'Old Party',
  hint: 'No longer listed'
};

const OPTIONS = [NONE, GREEN, BLUE, OTHER];
const PLAIN_OPTIONS = [NONE, OTHER];

/** A `detail` snippet that renders the value of the option it is given and a text field. */
const detail = createRawSnippet<[EntitySelectorOption]>((option) => ({
  render: () => `<div data-testid="detail" data-detail-of="${option().value}"><input type="text" /></div>`
}));

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

type Mounted = {
  /** The component's root element. */
  root: HTMLElement;
  /** The values `onChange` was called with, in order. */
  changes: Array<string>;
  /** The value bound to `selected`. */
  selected: () => string | undefined;
};

/** Mount the selector with `selected` bound and `onChange` recorded. */
function render(props: Record<string, unknown> = {}): Mounted {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const bound = $state({ selected: props.selected as string | undefined });
  const changes: Array<string> = [];
  const component = mount(EntitySelector, {
    target,
    props: {
      legend: LEGEND,
      options: OPTIONS,
      onChange: (value: string) => changes.push(value),
      ...props,
      get selected() {
        return bound.selected;
      },
      set selected(value: string | undefined) {
        bound.selected = value;
      }
    } as never
  });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return { root: target.firstElementChild as HTMLElement, changes, selected: () => bound.selected };
}

/** The option rows of a mounted selector, in document order. */
function rowsOf(root: HTMLElement): Array<HTMLElement> {
  return [...root.querySelectorAll<HTMLElement>(OPTION)];
}

/** The row of the option with the given value. */
function rowOf(root: HTMLElement, value: string): HTMLElement {
  const row = rowsOf(root).find((candidate) => candidate.getAttribute('data-option-value') === value);
  expect(row, `the row of ${value}`).toBeDefined();
  return row!;
}

/** The radio of the option with the given value. */
function radioOf(root: HTMLElement, value: string): HTMLInputElement {
  const radio = rowOf(root, value).querySelector<HTMLInputElement>(INPUT);
  expect(radio, `the radio of ${value}`).not.toBeNull();
  return radio!;
}

/** The one label that names the radio of the option with the given value. */
function labelOf(root: HTMLElement, value: string): HTMLLabelElement {
  const radio = radioOf(root, value);
  const labels = [...root.querySelectorAll<HTMLLabelElement>('label')].filter((label) => label.htmlFor === radio.id);
  expect(labels, `labels of ${value}`).toHaveLength(1);
  return labels[0];
}

/** Choose an option as a pointer does: by its row's label. */
function choose(root: HTMLElement, value: string): void {
  labelOf(root, value).click();
  flushSync();
}

/** The text of an element that assistive technology is given: everything outside a hidden subtree. */
function exposedText(element: Element): string {
  const copy = element.cloneNode(true) as Element;
  for (const hidden of copy.querySelectorAll(HIDDEN)) hidden.remove();
  return (copy.textContent ?? '').replace(/\s+/g, ' ').trim();
}

describe('EntitySelector — the group', () => {
  it('is a fieldset with the role radiogroup, named by its legend', () => {
    const { root } = render();

    expect(root.tagName).toBe('FIELDSET');
    expect(root.getAttribute('role')).toBe('radiogroup');
    expect(root.getAttribute('data-testid')).toBe('entity-selector');
    const legend = root.querySelector('legend');
    expect(legend).not.toBeNull();
    expect(legend!.id).not.toBe('');
    expect(root.getAttribute('aria-labelledby')).toBe(legend!.id);
    expect(legend!.textContent).toContain(LEGEND);
  });

  it('renders every option as a row, in the order given', () => {
    const { root } = render({ options: [UNLISTED, NONE, GREEN, BLUE, OTHER] });

    const rows = rowsOf(root);
    expect(rows.map((row) => row.getAttribute('data-option-value'))).toEqual([
      'unlisted',
      'none',
      'green',
      'blue',
      'other'
    ]);
    expect(rows.map((row) => row.getAttribute('data-option-kind'))).toEqual([
      'unlisted',
      'none',
      'entity',
      'entity',
      'other'
    ]);
  });

  it('is not marked required or invalid when it is neither', () => {
    const { root } = render();

    expect(rowsOf(root)).toHaveLength(OPTIONS.length);
    expect(root.hasAttribute('aria-required')).toBe(false);
    expect(root.hasAttribute('aria-invalid')).toBe(false);
    expect(root.hasAttribute('aria-describedby')).toBe(false);
    expect(root.querySelector(ERROR)).toBeNull();
  });

  it('carries aria-required where a choice is required', () => {
    const { root } = render({ required: true });

    expect(root.getAttribute('aria-required')).toBe('true');
  });

  it('carries aria-invalid in error and is described by its error line, an alert', () => {
    const { root } = render({ error: 'Choose a list.' });

    const line = root.querySelector(ERROR);
    expect(line).not.toBeNull();
    expect(line!.getAttribute('role')).toBe('alert');
    expect(line!.textContent?.trim()).toBe('Choose a list.');
    expect(line!.id).not.toBe('');
    expect(root.getAttribute('aria-invalid')).toBe('true');
    expect(root.getAttribute('aria-describedby')).toBe(line!.id);
  });

  it('puts a class and a test id given by the caller on the fieldset', () => {
    const { root } = render({ class: 'mt-lg', 'data-testid': 'nomination-editor-parent' });

    expect(root.tagName).toBe('FIELDSET');
    expect(root.getAttribute('role')).toBe('radiogroup');
    expect(root.getAttribute('data-testid')).toBe('nomination-editor-parent');
    expect(root.classList).toContain('mt-lg');
  });
});

describe('EntitySelector — the radios', () => {
  it('gives every radio one shared name and no tabindex', () => {
    const { root } = render();

    const radios = [...root.querySelectorAll<HTMLInputElement>(INPUT)];
    expect(radios).toHaveLength(OPTIONS.length);
    for (const radio of radios) {
      expect(radio.type).toBe('radio');
      expect(radio.hasAttribute('tabindex')).toBe(false);
    }
    const names = new Set(radios.map((radio) => radio.name));
    expect(names.size).toBe(1);
    expect([...names][0]).not.toBe('');
    expect(root.querySelectorAll('[tabindex]')).toHaveLength(0);
  });

  it('gives two groups on one page different names', () => {
    const first = render().root.querySelector<HTMLInputElement>(INPUT)?.name;
    const second = render().root.querySelector<HTMLInputElement>(INPUT)?.name;

    expect(first).toBeTruthy();
    expect(second).toBeTruthy();
    expect(first).not.toBe(second);
  });

  it.each(OPTIONS.map((option) => [option.kind, option] as const))(
    'names the radio of an option once, by the option’s name (%s)',
    (_, option) => {
      const { root } = render();

      const radio = radioOf(root, option.value);
      expect(labelOf(root, option.value).textContent?.trim()).toBe(option.name);
      expect(radio.hasAttribute('aria-label')).toBe(false);
      expect(radio.hasAttribute('aria-labelledby')).toBe(false);
      expect(radio.value).toBe(option.value);
      const said = exposedText(rowOf(root, option.value));
      expect(said.startsWith(option.name)).toBe(true);
      expect(said.split(option.name)).toHaveLength(2);
    }
  );

  it('answers no key press itself', () => {
    const { root, selected, changes } = render({ selected: 'green' });

    const radio = radioOf(root, 'green');
    for (const key of ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', ' ', 'Enter', 'Home', 'End'])
      for (const type of ['keydown', 'keypress', 'keyup']) {
        const notPrevented = radio.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true }));
        expect(notPrevented, `${type} ${key}`).toBe(true);
      }
    flushSync();

    expect(radio.checked).toBe(true);
    expect(selected()).toBe('green');
    expect(changes).toEqual([]);
  });
});

describe('EntitySelector — what an option shows', () => {
  it.each([
    ['an organization', GREEN],
    ['an alliance', COAST]
  ] as const)('renders %s as one entity card, hidden from assistive technology', (_, option) => {
    const { root } = render({ options: [NONE, option, OTHER] });

    const row = rowOf(root, option.value);
    const cards = row.querySelectorAll(CARD);
    expect(cards).toHaveLength(1);
    expect(cards[0].closest(HIDDEN)).not.toBeNull();
    expect(row.contains(cards[0].closest(HIDDEN))).toBe(true);
    expect(cards[0].textContent).toContain(option.name);
  });

  it('leaves a press on an entity’s card to the row’s label', () => {
    const { root } = render();

    const hidden = rowOf(root, 'green').querySelector(CARD)?.closest(HIDDEN);
    expect(hidden).toBeTruthy();
    expect(hidden!.classList).toContain('pointer-events-none');
  });

  it('holds nothing focusable inside a hidden part', () => {
    const { root } = render();

    const hidden = [...root.querySelectorAll(HIDDEN)];
    expect(hidden.length).toBeGreaterThanOrEqual(OPTIONS.length);
    for (const part of hidden) expect(part.querySelectorAll(FOCUSABLE)).toHaveLength(0);
  });

  it.each([
    ['none', NONE],
    ['other', OTHER],
    ['unlisted', UNLISTED]
  ] as const)('renders a plain option’s name as hidden text and no card (%s)', (_, option) => {
    const { root } = render({ options: [option, GREEN] });

    const row = rowOf(root, option.value);
    expect(row.querySelector(CARD)).toBeNull();
    const shown = [...row.querySelectorAll(HIDDEN)].filter((part) => part.textContent?.trim() === option.name);
    expect(shown).toHaveLength(1);
  });

  it('renders an option’s hint and describes its radio by it', () => {
    const { root } = render();

    const hint = rowOf(root, 'blue').querySelector(HINT);
    expect(hint).not.toBeNull();
    expect(hint!.textContent?.trim()).toBe('Not nominated here yet');
    expect(hint!.id).not.toBe('');
    expect(hint!.closest(HIDDEN)).toBeNull();
    expect(radioOf(root, 'blue').getAttribute('aria-describedby')).toBe(hint!.id);
  });

  it('renders no hint for an option that has none', () => {
    const { root } = render();

    expect(root.querySelectorAll(HINT)).toHaveLength(1);
    expect(rowOf(root, 'green').querySelector(HINT)).toBeNull();
    expect(radioOf(root, 'green').hasAttribute('aria-describedby')).toBe(false);
  });

  it('renders names, hints, the legend and the lines as text, never as markup', () => {
    const markup = '<b>bold</b>';
    const { root } = render({
      legend: markup,
      error: markup,
      emptyMessage: markup,
      options: [
        { kind: 'none', value: 'none', name: markup, hint: markup },
        { kind: 'other', value: 'other', name: markup }
      ]
    });

    expect(rowsOf(root)).toHaveLength(2);
    expect(root.querySelector('b')).toBeNull();
    expect(root.querySelector('legend')?.textContent).toContain(markup);
    expect(root.querySelector(ERROR)?.textContent).toContain(markup);
    expect(root.querySelector(EMPTY)?.textContent).toContain(markup);
    expect(root.querySelector(HINT)?.textContent).toContain(markup);
    expect(labelOf(root, 'none').textContent).toContain(markup);
  });
});

describe('EntitySelector — choosing', () => {
  it('has nothing chosen while `selected` is undefined', () => {
    const { root } = render();

    const radios = [...root.querySelectorAll<HTMLInputElement>(INPUT)];
    expect(radios).toHaveLength(OPTIONS.length);
    expect(radios.filter((radio) => radio.checked)).toHaveLength(0);
    expect(root.getAttribute('data-selected-kind')).toBe('');
  });

  it('checks the radio of the option `selected` names on arrival', () => {
    const { root, changes } = render({ selected: 'blue' });

    expect(radioOf(root, 'blue').checked).toBe(true);
    expect(root.querySelectorAll<HTMLInputElement>(`${INPUT}:checked`)).toHaveLength(1);
    expect(root.getAttribute('data-selected-kind')).toBe('entity');
    expect(changes).toEqual([]);
  });

  it.each([
    ['none', NONE],
    ['entity', GREEN],
    ['other', OTHER],
    ['unlisted', UNLISTED]
  ] as const)('follows a click on a row’s label (%s)', (kind, option) => {
    const { root, selected, changes } = render({ options: [UNLISTED, NONE, GREEN, OTHER] });

    choose(root, option.value);

    expect(selected()).toBe(option.value);
    expect(changes).toEqual([option.value]);
    expect(radioOf(root, option.value).checked).toBe(true);
    expect(root.getAttribute('data-selected-kind')).toBe(kind);
  });

  it('moves the choice from one option to another', () => {
    const { root, selected, changes } = render({ selected: 'none' });

    choose(root, 'green');

    expect(selected()).toBe('green');
    expect(changes).toEqual(['green']);
    expect(radioOf(root, 'none').checked).toBe(false);
    expect(radioOf(root, 'green').checked).toBe(true);
    expect(root.getAttribute('data-selected-kind')).toBe('entity');
  });

  it('leaves focus on the chosen radio, and never moves it into the detail', () => {
    const { root, selected } = render({ detail });

    const radio = radioOf(root, 'other');
    radio.focus();
    choose(root, 'other');

    expect(selected()).toBe('other');
    expect(root.querySelector(`${DETAIL} input`)).not.toBeNull();
    expect(document.activeElement).toBe(radio);
  });
});

describe('EntitySelector — the required mark', () => {
  it('is shown beside the legend, with its sentence, while a choice is required and none is made', () => {
    const { root } = render({ required: true });

    const legend = root.querySelector('legend');
    expect(legend).not.toBeNull();
    expect(legend!.querySelector('svg')).not.toBeNull();
    const sentence = [...legend!.querySelectorAll('.sr-only')].filter(
      (part) => part.textContent?.trim() === REQUIRED_SENTENCE
    );
    expect(sentence).toHaveLength(1);
  });

  it('goes once something is chosen', () => {
    const { root } = render({ required: true });
    const legend = root.querySelector('legend');
    expect(legend).not.toBeNull();
    expect(legend!.textContent).toContain(REQUIRED_SENTENCE);

    choose(root, 'green');

    expect(legend!.textContent).toContain(LEGEND);
    expect(legend!.textContent).not.toContain(REQUIRED_SENTENCE);
    expect(legend!.querySelector('svg')).toBeNull();
    expect(root.getAttribute('aria-required')).toBe('true');
  });

  it('is not shown where no choice is required', () => {
    const { root } = render();

    const legend = root.querySelector('legend');
    expect(legend).not.toBeNull();
    expect(legend!.textContent).toContain(LEGEND);
    expect(legend!.textContent).not.toContain(REQUIRED_SENTENCE);
    expect(legend!.querySelector('svg')).toBeNull();
  });
});

describe('EntitySelector — no entity listed', () => {
  it('says so in one line under the legend, and keeps the plain options', () => {
    const { root } = render({ options: PLAIN_OPTIONS, emptyMessage: 'No party is available.' });

    const line = root.querySelector(EMPTY);
    expect(line).not.toBeNull();
    expect(line!.textContent?.trim()).toBe('No party is available.');
    const legend = root.querySelector('legend')!;
    const firstRow = rowsOf(root)[0];
    expect(legend.compareDocumentPosition(line!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(line!.compareDocumentPosition(firstRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(rowsOf(root).map((row) => row.getAttribute('data-option-kind'))).toEqual(['none', 'other']);
  });

  it('does not say so while an entity is listed', () => {
    const { root } = render({ emptyMessage: 'No party is available.' });

    expect(rowsOf(root)).toHaveLength(OPTIONS.length);
    expect(root.querySelector(EMPTY)).toBeNull();
  });

  it('says nothing when it is given no line', () => {
    const { root } = render({ options: PLAIN_OPTIONS });

    expect(rowsOf(root)).toHaveLength(PLAIN_OPTIONS.length);
    expect(root.querySelector(EMPTY)).toBeNull();
  });
});

describe('EntitySelector — the detail', () => {
  it('is rendered once, directly after the chosen option’s row, with that option', () => {
    const { root } = render({ detail, selected: 'green' });

    const details = root.querySelectorAll(DETAIL);
    expect(details).toHaveLength(1);
    expect(details[0].getAttribute('data-detail-of')).toBe('green');
    expect(rowOf(root, 'green').nextElementSibling).toBe(details[0]);
  });

  it('follows the choice', () => {
    const { root } = render({ detail, selected: 'green' });

    choose(root, 'other');

    const details = root.querySelectorAll(DETAIL);
    expect(details).toHaveLength(1);
    expect(details[0].getAttribute('data-detail-of')).toBe('other');
    expect(rowOf(root, 'other').nextElementSibling).toBe(details[0]);
  });

  it('is not rendered while nothing is chosen', () => {
    const { root } = render({ detail });

    expect(rowsOf(root)).toHaveLength(OPTIONS.length);
    expect(root.querySelector(DETAIL)).toBeNull();
  });
});
