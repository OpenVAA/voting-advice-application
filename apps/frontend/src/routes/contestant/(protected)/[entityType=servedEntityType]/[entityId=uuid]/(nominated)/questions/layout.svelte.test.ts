/**
 * The questions layout of an entity of the Contestant App, mounted for real against a fake contestant context, with the real `MainContent`, `Button` and `Loading` below it and a marker in place of a questions page.
 *
 * What this file holds:
 *
 * 1. **The three views.** A loading view until the entity's question data is loaded; a page that says there is nothing to answer for an entity that is asked no opinion question; and the questions page otherwise.
 * 2. **No navigation.** The layout asks for none in any state: an entity that has opinion questions is shown them whether or not its required info is answered.
 * 3. **The progress bar of the top bar.** It is shown for an entity that has opinion questions and for no other.
 * 4. **What an entity that has questions never sees.** The page for an entity with none is not rendered at any point between the first render and the questions page.
 *
 * The fake context's members are reactive behind getters over one raw state box, as the real accessors are. The top bar's settings are the real overlay registry, so a case reads the merged setting the header would. Messages are their keys.
 */

import { mergeSettings } from '@openvaa/app-shared';
import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { settingsOverlay } from '$lib/contexts/utils/settingsOverlay.svelte';

/** Everything the layout reads from the contestant context. */
type Box = {
  questionsReady: boolean;
  opinionQuestions: Array<{ id: string }>;
  unansweredOpinionQuestions: Array<{ id: string }>;
  unansweredRequiredInfoQuestions: Array<{ id: string }>;
};

const NOT_LOADED: Box = {
  questionsReady: false,
  opinionQuestions: [],
  unansweredOpinionQuestions: [],
  unansweredRequiredInfoQuestions: []
};

let box = $state.raw<Box>(NOT_LOADED);

const { goto, setProgress } = vi.hoisted(() => ({ goto: vi.fn(), setProgress: vi.fn() }));

/** The top bar's settings as the header reads them: the progress bar is hidden unless an overlay shows it. */
const topBarSettings = settingsOverlay<{ progress: 'hide' | 'show' }, { progress?: 'hide' | 'show' }>(
  { progress: 'hide' },
  (settings, overlay) => mergeSettings(settings, overlay)
);

const progress = { max: 0, current: { set: setProgress } };

const context = {
  t: (key: string) => key,
  getRoute: { current: (route: string) => `/route/${route}` },
  get questionsReady() {
    return box.questionsReady;
  },
  get opinionQuestions() {
    return box.opinionQuestions;
  },
  get unansweredOpinionQuestions() {
    return box.unansweredOpinionQuestions;
  },
  get unansweredRequiredInfoQuestions() {
    return box.unansweredRequiredInfoQuestions;
  }
};

vi.mock('$lib/contexts/contestant', () => ({ getContestantContext: () => context }));
vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));
vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({
    video: { hasContent: false },
    setRouteTitle: () => undefined,
    topBarSettings,
    progress
  })
}));

// The other members stay the resolvable stubs: components the layout reaches import them too.
vi.mock('$app/navigation', async (importOriginal) => ({ ...(await importOriginal<object>()), goto }));

// jsdom has no `window.matchMedia`, and `svelte/motion` reads it when the `$layouts/main` barrel loads the header. The stub answers "no preference".
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false
    })
  });
}

const QuestionsLayout = (await import('./+layout.svelte')).default;

const LOADING = '[data-testid="loading-indicator"]';
const NONE_PAGE = '[data-testid="contestant-questions-none"]';
const NONE_RETURN = '[data-testid="contestant-questions-none-return"]';
const CHILD = '[data-testid="questions-page"]';

/** The title of an error, which no view of the layout shows. */
const ERROR_TITLE = 'error.noQuestions';

const QUESTIONS = [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }];
const REQUIRED_INFO = [{ id: 'info-1' }];

/** The entity's question data is loaded and holds opinion questions, one of them unanswered. */
const WITH_QUESTIONS: Box = {
  questionsReady: true,
  opinionQuestions: QUESTIONS,
  unansweredOpinionQuestions: [QUESTIONS[2]],
  unansweredRequiredInfoQuestions: []
};

/** As `WITH_QUESTIONS`, for an entity whose required info is unanswered. */
const WITH_QUESTIONS_AND_UNANSWERED_INFO: Box = { ...WITH_QUESTIONS, unansweredRequiredInfoQuestions: REQUIRED_INFO };

/** The entity's question data is loaded and holds no opinion question. */
const WITH_NONE: Box = { ...NOT_LOADED, questionsReady: true };

const questionsPage = createRawSnippet(() => ({ render: () => '<div data-testid="questions-page"></div>' }));

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  box = NOT_LOADED;
  progress.max = 0;
  vi.resetAllMocks();
});

/** Mount the layout for a state of the context. */
function render(state: Box): HTMLElement {
  box = state;
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(QuestionsLayout, { target, props: { children: questionsPage } });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

/** Which of the three views a target holds, by what is in its markup. */
function viewsOf(target: HTMLElement): { loading: boolean; none: boolean; questions: boolean } {
  return {
    loading: target.querySelector(LOADING) !== null,
    none: target.querySelector(NONE_PAGE) !== null,
    questions: target.querySelector(CHILD) !== null
  };
}

describe("the questions layout — the entity's question data is not loaded", () => {
  it.each([
    ['an empty list', NOT_LOADED],
    ['a list that holds questions', { ...WITH_QUESTIONS, questionsReady: false }],
    ['unanswered required info', { ...NOT_LOADED, unansweredRequiredInfoQuestions: REQUIRED_INFO }]
  ] as Array<[string, Box]>)('shows the loading view alone with %s, and asks for no redirect', (_, state) => {
    const target = render(state);

    expect(viewsOf(target)).toEqual({ loading: true, none: false, questions: false });
    expect(target.textContent).not.toContain(ERROR_TITLE);
    expect(goto).not.toHaveBeenCalled();
    expect(topBarSettings.current.progress).toBe('hide');
  });
});

describe('the questions layout — an entity that has opinion questions', () => {
  it('shows the questions page, with the progress bar and its maximum', () => {
    const target = render(WITH_QUESTIONS);

    expect(viewsOf(target)).toEqual({ loading: false, none: false, questions: true });
    expect(goto).not.toHaveBeenCalled();
    expect(topBarSettings.current.progress).toBe('show');
    expect(progress.max).toBe(3);
    expect(setProgress).toHaveBeenLastCalledWith(2);
  });

  it('shows the questions page, with the progress bar, while required info is unanswered, and asks for no navigation', () => {
    const target = render(WITH_QUESTIONS_AND_UNANSWERED_INFO);

    expect(viewsOf(target)).toEqual({ loading: false, none: false, questions: true });
    expect(target.textContent).not.toContain(ERROR_TITLE);
    expect(goto).not.toHaveBeenCalled();
    expect(topBarSettings.current.progress).toBe('show');
    expect(progress.max).toBe(3);
    expect(setProgress).toHaveBeenLastCalledWith(2);
  });

  it.each([
    ['with required info answered', WITH_QUESTIONS],
    ['with required info unanswered', WITH_QUESTIONS_AND_UNANSWERED_INFO]
  ] as Array<[string, Box]>)(
    'never renders the page for an entity with none on the way from the first render to the questions page, %s',
    (_, state) => {
      const target = render(NOT_LOADED);
      expect(viewsOf(target)).toEqual({ loading: true, none: false, questions: false });

      box = state;
      flushSync();

      expect(viewsOf(target)).toEqual({ loading: false, none: false, questions: true });
      expect(topBarSettings.current.progress).toBe('show');
      expect(goto).not.toHaveBeenCalled();
    }
  );
});

describe('the questions layout — an entity that is asked no opinion question', () => {
  it('shows a page with a title, one paragraph and one button back to the home of the entity', () => {
    const target = render(WITH_NONE);

    expect(viewsOf(target)).toEqual({ loading: false, none: true, questions: false });
    const page = target.querySelector<HTMLElement>(NONE_PAGE)!;
    expect(page.querySelector('h1')?.textContent).toBe('contestantApp.questions.none.title');
    const paragraphs = [...page.querySelectorAll('p')];
    expect(paragraphs.map((paragraph) => paragraph.textContent?.trim())).toEqual([
      'contestantApp.questions.none.content'
    ]);
    const buttons = [...page.querySelectorAll('a, button')];
    expect(buttons).toHaveLength(1);
    expect(buttons[0].matches(NONE_RETURN)).toBe(true);
    expect(buttons[0].getAttribute('href')).toBe('/route/ContestantAppEntityHome');
    expect(buttons[0].textContent).toContain('common.return');
  });

  it('is not an error page: no hero and no error title', () => {
    const target = render(WITH_NONE);

    expect(target.querySelector('figure')).toBeNull();
    expect(target.textContent).not.toContain(ERROR_TITLE);
    expect(target.textContent).not.toContain('dynamic.error.heroEmoji');
  });

  it('shows no progress bar', () => {
    render(WITH_NONE);

    expect(topBarSettings.current.progress).toBe('hide');
  });

  it.each([
    ['with no required info unanswered', WITH_NONE],
    ['with required info unanswered', { ...WITH_NONE, unansweredRequiredInfoQuestions: REQUIRED_INFO }]
  ] as Array<[string, Box]>)('asks for no redirect %s', (_, state) => {
    const target = render(state);

    expect(viewsOf(target)).toEqual({ loading: false, none: true, questions: false });
    expect(goto).not.toHaveBeenCalled();
  });

  it('replaces the loading view once the data is loaded and holds none', () => {
    const target = render(NOT_LOADED);
    expect(viewsOf(target)).toEqual({ loading: true, none: false, questions: false });

    box = WITH_NONE;
    flushSync();

    expect(viewsOf(target)).toEqual({ loading: false, none: true, questions: false });
    expect(topBarSettings.current.progress).toBe('hide');
  });
});

describe('the questions layout — the progress bar follows the questions', () => {
  it('is taken away when the entity is left with no opinion question, and shown again when it has some', () => {
    render(WITH_QUESTIONS);
    expect(topBarSettings.current.progress).toBe('show');

    box = WITH_NONE;
    flushSync();
    expect(topBarSettings.current.progress).toBe('hide');

    box = WITH_QUESTIONS;
    flushSync();
    expect(topBarSettings.current.progress).toBe('show');
  });
});
