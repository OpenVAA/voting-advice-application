/**
 * The three default-off props of `EntityCard`: `headerOnly`, `showType` and `keepScroll`.
 *
 * The card is shared by the voter results list, the entity details header and every list built on `EntityList`, so the first group pins what a card renders when none of the three is passed. The other groups hold each prop to its contract: a header-only card makes no question lookup at all, the type label sits inside the element the card is described by, and a link action can give up the keep-scroll attribute.
 *
 * `getCardQuestions` is the real function behind a spy, and the fake data root throws for any question, as a data root does for a question it has not loaded. A card that only hid the featured questions would still throw here.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as EntityCards from '$lib/utils/entityCards';

/** The settings and data root the faked app context answers with; replaced per test. */
const fake = vi.hoisted(() => ({
  appSettings: {} as Record<string, unknown>,
  dataRoot: {} as Record<string, unknown>
}));

vi.mock('$lib/contexts/app', () => ({
  getAppContext: () => ({
    appType: { current: 'contestant' },
    getRoute: { current: () => '/results/candidate/c1' },
    startEvent: () => undefined,
    t: (key: string) => key,
    get appSettings() {
      return fake.appSettings;
    },
    get dataRoot() {
      return fake.dataRoot;
    }
  })
}));

vi.mock('$lib/contexts/voter', () => ({
  getVoterContext: () => undefined
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));

vi.mock('$lib/utils/entityCards', async (importOriginal) => {
  const actual = await importOriginal<typeof EntityCards>();
  return { ...actual, getCardQuestions: vi.fn(actual.getCardQuestions) };
});

const { getCardQuestions } = await import('$lib/utils/entityCards');
const { default: EntityCard } = await import('../EntityCard.svelte');

const ACTION = '[data-testid="entity-card-action"]';
const TYPE_LABEL = '[data-testid="entity-card-type"]';
const NOSCROLL = 'data-sveltekit-noscroll';

/** A question the faked data root knows. */
const QUESTION = { id: 'q1', shortName: 'Featured question', type: 'text', formatAnswer: () => 'An answer' };

/** Card contents that name one question, as a project's results settings do. */
const SETTINGS_WITH_QUESTION = {
  results: { cardContents: { candidate: [{ question: 'q1' }], organization: [{ question: 'q1' }] } }
};

/** A naked entity: neither a match nor a nomination, so the card renders it directly. */
function entity(type: 'candidate' | 'organization', name: string) {
  return { id: `${type}-1`, type, name, shortName: name, answers: {}, getAnswer: () => undefined };
}

const CANDIDATE = entity('candidate', 'Test Candidate');
const ORGANIZATION = entity('organization', 'Test Party');

let teardown: Array<() => void> = [];

beforeEach(() => {
  vi.mocked(getCardQuestions).mockClear();
  fake.appSettings = SETTINGS_WITH_QUESTION;
  fake.dataRoot = { getQuestion: () => QUESTION };
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

/** Mount a card and return the element it was mounted into. */
function render(props: Record<string, unknown>): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  teardown.push(() => target.remove());
  const component = mount(EntityCard, { target, props: props as never });
  flushSync();
  teardown.push(() => unmount(component));
  return target;
}

/** Make the faked data root throw for every question, as a data root does for one it has not loaded. */
function unloadQuestions(): void {
  fake.dataRoot = {
    getQuestion: (id: string) => {
      throw new Error(`Question with id ${id} not found`);
    }
  };
}

/** The element the card's `aria-describedby` points at. */
function subtitleOf(target: HTMLElement): HTMLElement {
  const article = target.querySelector('article');
  expect(article, 'the card should render its article').not.toBeNull();
  const subtitle = target.ownerDocument.getElementById(article!.getAttribute('aria-describedby')!);
  expect(subtitle, 'the article should be described by a rendered element').not.toBeNull();
  return subtitle!;
}

describe('EntityCard with none of the three props', () => {
  it('keeps the scroll position on a link action, shows no type label and looks up the featured questions', () => {
    const target = render({ entity: CANDIDATE, action: '/results/candidate/c1' });

    const link = target.querySelector<HTMLAnchorElement>(`a${ACTION}`);
    expect(link, 'a URL action should render a link').not.toBeNull();
    expect(link!.getAttribute('href')).toBe('/results/candidate/c1');
    expect(link!.hasAttribute(NOSCROLL)).toBe(true);
    expect(target.querySelector(TYPE_LABEL)).toBeNull();

    expect(getCardQuestions).toHaveBeenCalled();
    expect(vi.mocked(getCardQuestions).mock.calls[0][0].type).toBe('candidate');
    expect(target.textContent).toContain(QUESTION.shortName);
  });

  it('throws when the card contents name a question the data root has not loaded', () => {
    unloadQuestions();
    expect(() => render({ entity: CANDIDATE, action: '/results/candidate/c1' })).toThrow('not found');
  });
});

describe('EntityCard headerOnly', () => {
  it('makes no question lookup and renders over a data root that has not loaded the question', () => {
    unloadQuestions();
    const target = render({ entity: CANDIDATE, action: '/somewhere', headerOnly: true });

    expect(getCardQuestions).not.toHaveBeenCalled();
    expect(target.querySelector('[data-testid="entity-card"]')).not.toBeNull();
    expect(target.querySelector('h3')?.textContent?.trim()).toBe(CANDIDATE.name);
  });

  it('renders nothing below the header', () => {
    const target = render({ entity: CANDIDATE, action: '/somewhere', headerOnly: true });

    expect(target.textContent).not.toContain(QUESTION.shortName);
    const article = target.querySelector('article')!;
    expect(Array.from(article.children).map((child) => child.tagName)).toEqual(['HEADER']);
  });
});

describe('EntityCard showType', () => {
  it.each([
    ['a candidate', CANDIDATE, 'common.candidate.singular'],
    ['an organization', ORGANIZATION, 'common.organization.singular']
  ])('puts the type label of %s first in the element the card is described by', (_, cardEntity, key) => {
    const target = render({ entity: cardEntity, showType: true });

    const label = target.querySelector<HTMLElement>(TYPE_LABEL);
    expect(label, 'the type label should be rendered').not.toBeNull();
    expect(label!.textContent?.trim()).toBe(key);
    expect(label!.classList).toContain('small-label');
    const subtitle = subtitleOf(target);
    expect(label!.parentElement).toBe(subtitle);
    expect(subtitle.firstElementChild).toBe(label);
  });

  it('shows no type label on a subcard', () => {
    const target = render({ entity: CANDIDATE, variant: 'subcard', showType: true });

    expect(target.querySelector('[data-testid="entity-card-subcard"]')).not.toBeNull();
    expect(target.querySelector(TYPE_LABEL)).toBeNull();
  });
});

describe('EntityCard keepScroll', () => {
  it('drops the keep-scroll attribute from a link action when false', () => {
    const target = render({ entity: CANDIDATE, action: '/somewhere', keepScroll: false });

    const link = target.querySelector<HTMLAnchorElement>(`a${ACTION}`);
    expect(link).not.toBeNull();
    expect(link!.hasAttribute(NOSCROLL)).toBe(false);
  });

  it('keeps the attribute when true', () => {
    const target = render({ entity: CANDIDATE, action: '/somewhere', keepScroll: true });

    expect(target.querySelector(`a${ACTION}`)!.hasAttribute(NOSCROLL)).toBe(true);
  });

  it('leaves a handler action a button without the attribute', () => {
    const target = render({ entity: CANDIDATE, action: () => undefined, keepScroll: false });

    const button = target.querySelector<HTMLButtonElement>(`button${ACTION}`);
    expect(button, 'a handler action should render a button').not.toBeNull();
    expect(button!.hasAttribute(NOSCROLL)).toBe(false);
    expect(target.querySelector('a')).toBeNull();
  });
});

describe('EntityCard with the three props together', () => {
  it('renders one link holding the name and the type label', () => {
    unloadQuestions();
    const target = render({
      entity: ORGANIZATION,
      variant: 'list',
      action: '/contestant/organization/o1',
      headerOnly: true,
      showType: true,
      keepScroll: false
    });

    const links = target.querySelectorAll<HTMLAnchorElement>('a');
    expect(links).toHaveLength(1);
    const link = links[0];
    expect(link.getAttribute('href')).toBe('/contestant/organization/o1');
    expect(link.hasAttribute(NOSCROLL)).toBe(false);
    expect(link.textContent).toContain(ORGANIZATION.name);
    expect(link.textContent).toContain('common.organization.singular');
    expect(target.querySelectorAll('button')).toHaveLength(0);
    expect(getCardQuestions).not.toHaveBeenCalled();
  });
});
