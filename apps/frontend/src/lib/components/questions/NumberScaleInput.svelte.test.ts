/**
 * `NumberScaleInput` — saving an unset slider's midpoint, and the display mode's accessible markers.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NumberScaleInputProps } from './NumberScaleInput.type';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
    translate: (value: unknown) => (typeof value === 'string' ? value : ''),
    locale: 'en',
    locales: ['en'],
    darkMode: false
  })
}));

const NumberScaleInput = (await import('./NumberScaleInput.svelte')).default;

/** A number question from 0 to 10. A plain object is enough: the component reads only these members. */
const QUESTION = {
  id: 'q1',
  text: 'A number question',
  min: 0,
  max: 10,
  ensureValue: (value: number) => value
} as unknown as NumberScaleInputProps['question'];

let target: HTMLElement;
let teardown: Array<() => void> = [];

function mountSubject(props: Partial<NumberScaleInputProps>): void {
  target = document.body.appendChild(document.createElement('div'));
  const component = mount(NumberScaleInput, {
    target,
    props: { question: QUESTION, ...props } as NumberScaleInputProps
  });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
}

function slider(): HTMLInputElement {
  return target.querySelector<HTMLInputElement>('[data-testid="question-number-slider"]')!;
}

afterEach(() => {
  for (const fn of teardown) fn();
  teardown = [];
});

describe('NumberScaleInput — answer mode', () => {
  it('saves the midpoint when an unset slider is clicked', () => {
    const onChange = vi.fn();
    mountSubject({ onChange });
    slider().click();
    flushSync();
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ question: QUESTION, value: 5 });
  });

  it('saves the midpoint when Enter is pressed on an unset slider', () => {
    const onChange = vi.fn();
    mountSubject({ onChange });
    slider().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ question: QUESTION, value: 5 });
  });

  it('saves the midpoint when Space is pressed on an unset slider, without scrolling the page', () => {
    const onChange = vi.fn();
    mountSubject({ onChange });
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    slider().dispatchEvent(event);
    flushSync();
    expect(event.defaultPrevented).toBe(true);
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ question: QUESTION, value: 5 });
  });

  it('keeps Space from scrolling the page on a set slider', () => {
    const onChange = vi.fn();
    mountSubject({ value: 3, onChange });
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    slider().dispatchEvent(event);
    flushSync();
    expect(event.defaultPrevented).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not save again when a set slider is clicked', () => {
    const onChange = vi.fn();
    mountSubject({ value: 3, onChange });
    slider().click();
    flushSync();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('NumberScaleInput — display mode', () => {
  it('names each answer with its value and hides the slider from assistive technology', () => {
    mountSubject({ mode: 'display', value: 3, otherValue: 7, otherLabel: 'SDP' });
    const group = target.querySelector('[role="group"]');
    expect(group?.getAttribute('aria-label')).toBe('A number question');
    expect(slider().getAttribute('aria-hidden')).toBe('true');
    const srTexts = Array.from(target.querySelectorAll('.sr-only')).map((el) => el.textContent?.trim());
    expect(srTexts).toEqual([
      'questions.answers.numberAnswer {"label":"questions.answers.yourAnswer","value":3}',
      'questions.answers.numberAnswer {"label":"SDP","value":7}'
    ]);
  });

  it('renders one combined marker when both answers are equal', () => {
    mountSubject({ mode: 'display', value: 4, otherValue: 4, otherLabel: 'SDP' });
    const srTexts = Array.from(target.querySelectorAll('.sr-only')).map((el) => el.textContent?.trim());
    expect(srTexts).toEqual([
      'questions.answers.numberAnswer {"label":"questions.answers.yourAndOtherAnswer {\\"other\\":\\"SDP\\"}","value":4}'
    ]);
  });
});
