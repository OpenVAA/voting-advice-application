/**
 * `QuestionChoices` — the class set on each choice input, per branch.
 *
 * In `display` mode an option that neither the voter nor the entity picked is drawn as a small dot, and the entity's answer, when the voter did not pick it, as a filled dot inside a ring. Both are class sets applied through `cn`, so these cases assert the final class set of each input.
 *
 * `cn` merges, so the dot's classes replace the base sizes rather than sitting alongside them: a dimmed input carries `h-16` and not `h-32`.
 *
 * Assertions read `classList`, not the raw attribute, because the merge makes no promise about token order.
 */

import { OBJECT_TYPE } from '@openvaa/data';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { QuestionChoicesProps } from './QuestionChoices.type';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({
    t: (key: string) => key,
    translate: (value: unknown) => (typeof value === 'string' ? value : ''),
    locale: 'en',
    locales: ['en'],
    darkMode: false
  })
}));

const QuestionChoices = (await import('./QuestionChoices.svelte')).default;

/**
 * The tokens the full-size (undimmed) branch must carry, and ONLY those that actually discriminate between the branches.
 *
 * `border-lg` is not in this list although it is in both base class strings: it is a border width and the dot's `border-none` is a border style, so both survive the merge. A separate case below asserts that.
 */
const FULL_SIZE = ['h-32', 'w-32', 'outline-4'] as const;
/** The tokens the dimmed branch must carry. */
const DIMMED = ['m-8', 'h-16', 'w-16', 'border-none', 'bg-(--line-bg)', 'outline-2'] as const;
/** The tokens the entity's answer must carry, which take effect only while the input is disabled and unchecked. */
const ENTITY_PICKED = [
  'disabled:not-checked:border-neutral',
  'disabled:not-checked:bg-neutral',
  'disabled:not-checked:shadow-[inset_0_0_0_4px_var(--color-base-100)]'
] as const;

/**
 * A question fixture.
 *
 * `@openvaa/data`'s guards are structural rather than `instanceof` — `isDataObject` checks `'objectType' in obj` against `Object.values(OBJECT_TYPE)` and `getCustomData` is `object.customData ?? {}` — so a plain object literal carrying `objectType`, `id`, `text`, `choices` and `customData` is a sufficient subject, cast to the prop type.
 */
function question(objectType: string): QuestionChoicesProps['question'] {
  return {
    objectType,
    id: 'q1',
    text: 'A question',
    choices: [
      { id: 'A', label: 'Choice A' },
      { id: 'B', label: 'Choice B' },
      { id: 'C', label: 'Choice C' }
    ],
    customData: {}
  } as unknown as QuestionChoicesProps['question'];
}

let target: HTMLElement;
let teardown: Array<() => void> = [];

/** Mount the component. The single seam every case below goes through. */
function mountSubject(props: Partial<QuestionChoicesProps>): void {
  target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(QuestionChoices, {
    target,
    props: { question: question(OBJECT_TYPE.SingleChoiceOrdinalQuestion), ...props } as QuestionChoicesProps
  });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
}

/** The choice inputs in document order, keyed by their `value` so cases can name a choice. */
function input(value: string): HTMLInputElement {
  const found = target.querySelector<HTMLInputElement>(`input[value="${value}"]`);
  expect(found, `expected an input for choice ${value}`).not.toBeNull();
  return found!;
}

/** Assert the input carries every token in `present` and none of those in `absent`. */
function expectClasses(
  element: HTMLInputElement,
  { present, absent }: { present: ReadonlyArray<string>; absent: ReadonlyArray<string> }
): void {
  const classes = [...element.classList];
  for (const token of present) expect(classes, `expected ${token} on ${element.value}`).toContain(token);
  for (const token of absent) expect(classes, `expected NO ${token} on ${element.value}`).not.toContain(token);
}

afterEach(() => {
  for (const stop of teardown.reverse()) stop();
  teardown = [];
});

describe('QuestionChoices — display mode, single choice', () => {
  it('case 1: dims only the option neither the voter nor the entity selected', () => {
    mountSubject({ mode: 'display', selectedId: 'A', otherSelected: 'B', otherLabel: 'Candidate' });

    expectClasses(input('A'), { present: FULL_SIZE, absent: [...DIMMED, ...ENTITY_PICKED] });

    expectClasses(input('B'), { present: [...FULL_SIZE, ...ENTITY_PICKED], absent: DIMMED });

    expectClasses(input('C'), { present: DIMMED, absent: [...FULL_SIZE, ...ENTITY_PICKED] });
  });

  it('case 3: dims EVERY option when nothing at all is selected', () => {
    // Pins that the dimming predicate carries no "something is selected" guard. That is exactly what distinguishes it from the neighbouring `sr-only` predicate, which DOES carry one — with nothing selected the labels stay visible but every option is still dimmed. Merging the two would be a behaviour change, and this case is what catches it.
    mountSubject({ mode: 'display', selectedId: null, otherSelected: null });

    for (const id of ['A', 'B', 'C']) expectClasses(input(id), { present: DIMMED, absent: FULL_SIZE });
  });

  it('case 5: the dimmed const OVERRIDES the base sizes rather than being added alongside them', () => {
    mountSubject({ mode: 'display', selectedId: 'A', otherSelected: 'B', otherLabel: 'Candidate' });

    const classes = [...input('C').classList];
    expect(classes).toContain('h-16');
    expect(classes).not.toContain('h-32');
    expect(classes).toContain('w-16');
    expect(classes).not.toContain('w-32');
    expect(classes).toContain('outline-2');
    expect(classes).not.toContain('outline-4');
  });

  it('keeps the base border WIDTH alongside the dimmed border STYLE, as the scoped rule did', () => {
    // Different CSS properties, so the merge must keep both. If a future merge-configuration change ever collapsed these into one group, the dot would lose its `border-none` or its width silently.
    mountSubject({ mode: 'display', selectedId: 'A', otherSelected: 'B', otherLabel: 'Candidate' });

    const classes = [...input('C').classList];
    expect(classes).toContain('border-lg');
    expect(classes).toContain('border-none');
  });
});

describe('QuestionChoices — answer mode', () => {
  it('case 2: every input is full size, undimmed and enabled', () => {
    mountSubject({ mode: 'answer', selectedId: 'A' });

    for (const id of ['A', 'B', 'C']) {
      expectClasses(input(id), { present: FULL_SIZE, absent: DIMMED });
      expect(input(id).disabled).toBe(false);
    }
  });
});

describe('QuestionChoices — display mode, multiple choice', () => {
  it('case 4: dims an unselected checkbox and gives it rounded-sm, leaving selected ones full size', () => {
    mountSubject({
      question: question(OBJECT_TYPE.MultipleChoiceCategoricalQuestion),
      mode: 'display',
      selectedIds: ['A'],
      otherSelectedIds: ['B'],
      otherLabel: 'Candidate'
    });

    expectClasses(input('A'), { present: FULL_SIZE, absent: [...DIMMED, ...ENTITY_PICKED] });
    expectClasses(input('B'), { present: [...FULL_SIZE, ...ENTITY_PICKED], absent: DIMMED });

    expectClasses(input('C'), { present: [...DIMMED, 'rounded-sm'], absent: FULL_SIZE });
  });
});
