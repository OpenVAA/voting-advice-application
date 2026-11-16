/**
 * `NotEditableNote`, mounted for real against a fake contestant context.
 *
 * The note embeds the support block, which builds its link with the context's route builder: the fake context uses the real `buildRoute` with an empty set of route params, as the support block's own test does.
 */

import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import type { RouteOptions } from '$lib/routes';

vi.mock('$lib/contexts/contestant', () => ({
  getContestantContext: () => ({
    t: (key: string) => key,
    getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {} }) },
    appSettings: { admin: { email: 'support@example.org' }, contestantApp: { entityTypes: ['candidate'] } }
  })
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));

const { NotEditableNote } = await import('.');

const SUPPORT_BUTTON = '[data-testid="contestant-contact-support"]';
const SECOND_SENTENCE = '[data-testid="second-sentence"]';

/** The sentence each reason shows. */
const SENTENCES = {
  answersLocked: 'contestantApp.common.editingNotAllowed',
  nominationsLocked: 'contestantApp.common.nominationsNotEditable',
  nominationsAnswersLocked: 'contestantApp.common.nominationsNotEditableAnswersLocked'
} as const;

type Reason = keyof typeof SENTENCES;

const REASONS = Object.keys(SENTENCES) as Array<Reason>;

/**
 * Whether a text holds a sentence's key whole: one key is the beginning of another, so a key counts only where no letter follows it.
 */
function holdsSentence(text: string | null, key: string): boolean {
  return new RegExp(`${key.replaceAll('.', '\\.')}(?![A-Za-z])`).test(text ?? '');
}

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

/** Mount the note and return its root element. */
function render(props: Record<string, unknown>): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(NotEditableNote, { target, props: props as never });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target.firstElementChild as HTMLElement;
}

describe('NotEditableNote', () => {
  it.each(REASONS)('shows the sentence of its reason and of no other (%s)', (reason) => {
    const root = render({ reason });

    for (const candidate of REASONS)
      expect(holdsSentence(root.textContent, SENTENCES[candidate]), candidate).toBe(candidate === reason);
  });

  it.each(REASONS)('names its reason on its root (%s)', (reason) => {
    const root = render({ reason });

    expect(root.getAttribute('data-reason')).toBe(reason);
  });

  it('holds exactly one support button, a link to the support section of the Help page', () => {
    const root = render({ reason: 'nominationsLocked' });

    const buttons = root.querySelectorAll<HTMLAnchorElement>(SUPPORT_BUTTON);
    expect(buttons).toHaveLength(1);
    expect(buttons[0].tagName).toBe('A');
    expect(buttons[0].getAttribute('href')).toBe('/contestant/help#support');
    expect(buttons[0].textContent).toContain('contestantApp.common.contactSupport');
  });

  it('lays its support button out from the start of the row, icon first', () => {
    const root = render({ reason: 'answersLocked' });

    const button = root.querySelector<HTMLElement>(SUPPORT_BUTTON);
    expect(button).not.toBeNull();
    for (const cls of ['btn-ghost', 'w-full', 'justify-start', 'flex-row', 'min-h-touch'])
      expect(button!.classList, cls).toContain(cls);
    expect(button!.classList).not.toContain('flex-row-reverse');
  });

  it('renders a second sentence after the sentence of its reason and before the support button', () => {
    const root = render({
      reason: 'answersLocked',
      children: createRawSnippet(() => ({
        render: () => '<span data-testid="second-sentence">A second sentence</span>'
      }))
    });

    const second = root.querySelector(SECOND_SENTENCE);
    const button = root.querySelector(SUPPORT_BUTTON);
    expect(second).not.toBeNull();
    expect(button).not.toBeNull();
    const text = root.textContent ?? '';
    expect(text.indexOf(SENTENCES.answersLocked)).toBeGreaterThanOrEqual(0);
    expect(text.indexOf(SENTENCES.answersLocked)).toBeLessThan(text.indexOf('A second sentence'));
    expect(text).toMatch(/editingNotAllowed\s+A second sentence/);
    expect(second!.compareDocumentPosition(button!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders no second sentence when it is given none', () => {
    const root = render({ reason: 'answersLocked' });

    expect(root.querySelector(SECOND_SENTENCE)).toBeNull();
    expect(root.querySelectorAll(SUPPORT_BUTTON)).toHaveLength(1);
  });

  it('merges the caller’s test id and class into its root', () => {
    const root = render({
      reason: 'answersLocked',
      'data-testid': 'contestant-answers-locked-warning',
      class: 'mb-lg'
    });

    expect(root.tagName).toBe('DIV');
    expect(root.getAttribute('data-testid')).toBe('contestant-answers-locked-warning');
    for (const cls of ['mb-lg', 'flex', 'items-start', 'text-warning']) expect(root.classList, cls).toContain(cls);
  });
});
