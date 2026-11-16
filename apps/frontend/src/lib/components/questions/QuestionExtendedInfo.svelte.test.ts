/**
 * `QuestionExtendedInfo` — which blocks the popup renders for a question's info sections and arguments.
 *
 * The arguments expander is rendered whenever the question has at least one argument group, with or without info sections, and after the last section when both are present.
 */

import { ARGUMENT_TYPE } from '@openvaa/app-shared';
import { OBJECT_TYPE } from '@openvaa/data';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { QuestionExtendedInfoProps } from './QuestionExtendedInfo.type';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({
    t: (key: string) => key,
    translate: (value: unknown) => (typeof value === 'string' ? value : ''),
    locale: 'en',
    locales: ['en'],
    darkMode: false
  })
}));

const QuestionExtendedInfo = (await import('./QuestionExtendedInfo.svelte')).default;

const ARGUMENTS = [
  { type: ARGUMENT_TYPE.LikertPros, arguments: [{ content: 'Pro' }] },
  { type: ARGUMENT_TYPE.LikertCons, arguments: [{ content: 'Con' }] }
];

const SECTIONS = [
  { title: 'First', content: 'First content' },
  { title: 'Second', content: 'Second content' }
];

/**
 * A question fixture.
 *
 * `getCustomData` is `object.customData ?? {}` and the `@openvaa/data` guards are structural, so a plain object literal is a sufficient subject, cast to the prop type.
 */
function question(customData: Record<string, unknown>): QuestionExtendedInfoProps['question'] {
  return {
    objectType: OBJECT_TYPE.SingleChoiceOrdinalQuestion,
    id: 'q1',
    text: 'A question',
    info: '',
    customData
  } as unknown as QuestionExtendedInfoProps['question'];
}

let target: HTMLElement;
let teardown: Array<() => void> = [];

/** Mount the component. The single seam every case below goes through. */
function mountSubject(subject: QuestionExtendedInfoProps['question']): void {
  target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(QuestionExtendedInfo, { target, props: { question: subject } });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
}

function byTestId(testId: string): HTMLElement | null {
  return target.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
}

function sectionCount(): number {
  return target.querySelectorAll('[data-testid^="voter-questions-info-section-"]').length;
}

afterEach(() => {
  for (const stop of teardown.reverse()) stop();
  teardown = [];
});

describe('QuestionExtendedInfo — info sections and arguments', () => {
  it('renders the arguments expander for a question with arguments but no info sections', () => {
    mountSubject(question({ arguments: ARGUMENTS }));
    const expander = byTestId('voter-questions-arguments');
    expect(expander).not.toBeNull();
    expect(sectionCount()).toBe(0);

    expander!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    flushSync();
    expect(byTestId('voter-questions-argument-group-likertPros')).not.toBeNull();
  });

  it('renders no arguments expander for an empty arguments array', () => {
    mountSubject(question({ arguments: [] }));
    expect(byTestId('voter-questions-arguments')).toBeNull();
    expect(target.textContent).not.toContain('questions.arguments.title');
  });

  it('renders no arguments expander for an empty arguments array next to info sections', () => {
    mountSubject(question({ infoSections: SECTIONS, arguments: [] }));
    expect(sectionCount()).toBe(2);
    expect(byTestId('voter-questions-arguments')).toBeNull();
  });

  it('renders the info sections and no arguments expander for a question with info sections only', () => {
    mountSubject(question({ infoSections: SECTIONS }));
    expect(byTestId('voter-questions-info-section-0')).not.toBeNull();
    expect(byTestId('voter-questions-info-section-1')).not.toBeNull();
    expect(byTestId('voter-questions-arguments')).toBeNull();
  });

  it('renders the arguments expander after the last info section when both are present', () => {
    mountSubject(question({ infoSections: SECTIONS, arguments: ARGUMENTS }));
    const lastSection = byTestId('voter-questions-info-section-1');
    const expander = byTestId('voter-questions-arguments');
    expect(byTestId('voter-questions-info-section-0')).not.toBeNull();
    expect(lastSection).not.toBeNull();
    expect(expander).not.toBeNull();
    expect(lastSection!.compareDocumentPosition(expander!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
