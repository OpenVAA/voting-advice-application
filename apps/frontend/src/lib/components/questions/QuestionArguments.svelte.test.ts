/**
 * `QuestionArguments` — the heading each argument group carries and the order the groups are shown in.
 *
 * Pro groups (`likertPros`, `booleanPros`) are headed by `questions.arguments.pro` and con groups (`likertCons`, `booleanCons`) by `questions.arguments.con`. Categorical groups are headed by `questions.arguments.proCategory` with the choice label as `{option}`.
 *
 * Pros are shown before cons whatever order `customData.arguments` lists them in, and groups on the same side keep their authored order.
 */

import { ARGUMENT_TYPE } from '@openvaa/app-shared';
import { OBJECT_TYPE } from '@openvaa/data';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ArgumentType, QuestionArguments as QuestionArgumentsData } from '@openvaa/app-shared';
import type { QuestionArgumentsProps } from './QuestionArguments.type';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({
    // The `option` parameter is appended so the categorical heading's choice label is observable.
    t: (key: string, params?: { option?: string }) => (params?.option ? `${key}|${params.option}` : key),
    translate: (value: unknown) => (typeof value === 'string' ? value : ''),
    locale: 'en',
    locales: ['en'],
    darkMode: false
  })
}));

const QuestionArguments = (await import('./QuestionArguments.svelte')).default;

/** One argument group with a single line whose content names the group, so cases can tell same-type groups apart. */
function group(type: ArgumentType, content: string, choiceId?: string): QuestionArgumentsData {
  return { type, arguments: [{ content }], ...(choiceId ? { choiceId } : {}) };
}

/**
 * A question fixture.
 *
 * `@openvaa/data`'s guards are structural (`isChoiceQuestion` reads `objectType`) and `getCustomData` is `object.customData ?? {}`, so a plain object literal is a sufficient subject, cast to the prop type.
 */
function question(objectType: string, args: Array<QuestionArgumentsData>): QuestionArgumentsProps['question'] {
  const choices = [
    { id: 'a', label: 'Choice A' },
    { id: 'b', label: 'Choice B' }
  ];
  return {
    objectType,
    id: 'q1',
    text: 'A question',
    choices,
    getChoice: (id: string) => choices.find((choice) => choice.id === id),
    customData: { arguments: args }
  } as unknown as QuestionArgumentsProps['question'];
}

let target: HTMLElement;
let teardown: Array<() => void> = [];

/** Mount the component. The single seam every case below goes through. */
function mountSubject(subject: QuestionArgumentsProps['question']): void {
  target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(QuestionArguments, { target, props: { question: subject } });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
}

/** The rendered groups in document order: their testid suffix, heading text and first line. */
function renderedGroups(): Array<{ id: string; heading: string; content: string }> {
  return [...target.querySelectorAll<HTMLElement>('[data-testid^="voter-questions-argument-group-"]')].map((el) => ({
    id: el.dataset.testid!.replace('voter-questions-argument-group-', ''),
    heading: el.querySelector('h5')?.textContent?.trim() ?? '',
    content: el.querySelector('li')?.textContent?.trim() ?? ''
  }));
}

afterEach(() => {
  for (const stop of teardown.reverse()) stop();
  teardown = [];
});

describe('QuestionArguments — headings and order', () => {
  it('heads likert pros with the pro label and likert cons with the con label, pros first', () => {
    mountSubject(
      question(OBJECT_TYPE.SingleChoiceOrdinalQuestion, [
        group(ARGUMENT_TYPE.LikertCons, 'Con'),
        group(ARGUMENT_TYPE.LikertPros, 'Pro')
      ])
    );
    expect(renderedGroups()).toEqual([
      { id: 'likertPros', heading: 'questions.arguments.pro', content: 'Pro' },
      { id: 'likertCons', heading: 'questions.arguments.con', content: 'Con' }
    ]);
  });

  it('heads boolean pros with the pro label and boolean cons with the con label, pros first', () => {
    mountSubject(
      question(OBJECT_TYPE.BooleanQuestion, [
        group(ARGUMENT_TYPE.BooleanCons, 'Con'),
        group(ARGUMENT_TYPE.BooleanPros, 'Pro')
      ])
    );
    expect(renderedGroups()).toEqual([
      { id: 'booleanPros', heading: 'questions.arguments.pro', content: 'Pro' },
      { id: 'booleanCons', heading: 'questions.arguments.con', content: 'Con' }
    ]);
  });

  it('moves pros before cons and keeps the authored order of groups on the same side', () => {
    mountSubject(
      question(OBJECT_TYPE.SingleChoiceOrdinalQuestion, [
        group(ARGUMENT_TYPE.LikertCons, 'C1'),
        group(ARGUMENT_TYPE.LikertPros, 'P'),
        group(ARGUMENT_TYPE.LikertCons, 'C2')
      ])
    );
    expect(renderedGroups().map(({ content }) => content)).toEqual(['P', 'C1', 'C2']);
  });

  it('heads categorical groups with the proCategory label and the choice label, in authored order', () => {
    mountSubject(
      question(OBJECT_TYPE.SingleChoiceCategoricalQuestion, [
        group(ARGUMENT_TYPE.CategoricalPros, 'For A', 'a'),
        group(ARGUMENT_TYPE.CategoricalPros, 'For B', 'b')
      ])
    );
    expect(renderedGroups()).toEqual([
      { id: 'a', heading: 'questions.arguments.proCategory|Choice A', content: 'For A' },
      { id: 'b', heading: 'questions.arguments.proCategory|Choice B', content: 'For B' }
    ]);
  });
});
