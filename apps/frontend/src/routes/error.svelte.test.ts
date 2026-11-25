/**
 * The error page, mounted for real against the English error catalogue.
 *
 * `t` reads `messages/en/error.json` and answers any other key with the key itself, as the real wrapper does for a key with no message. Assertions are on the rendered heading and the document title.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from '$app/state';
import errorMessages from '../../messages/en/error.json';

const { t } = vi.hoisted(() => ({ t: vi.fn() }));

vi.mock('$lib/i18n', () => ({ t }));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t, darkMode: { current: false } })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({
    video: { hasContent: false },
    setRouteTitle: () => undefined
  })
}));

// jsdom ships no `window.matchMedia`, and `svelte/motion` reads it when it is imported. The page reaches it through the `$layouts/main` barrel, so without this the file fails at import. The stub answers "no preference".
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

const ErrorPage = (await import('./+error.svelte')).default;

const catalogue: Record<string, string> = errorMessages.error;

/** The English message of an `error.*` key, or the key itself when the catalogue has none. */
function translate(key: string): string {
  const [namespace, name] = key.split('.', 2);
  return namespace === 'error' && name in catalogue ? catalogue[name] : key;
}

let teardown: Array<() => void> = [];

/** Set the status and error the stubbed `page` answers with. */
function setError(status: number, error: App.Error | null): void {
  const stub = page as { status: number; error: App.Error | null };
  stub.status = status;
  stub.error = error;
}

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  setError(200, null);
  vi.resetAllMocks();
});

function render(status: number, error: App.Error | null): HTMLElement {
  t.mockImplementation(translate);
  setError(status, error);
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(ErrorPage, { target, props: {} as never });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

function heading(target: HTMLElement): string | undefined {
  return target.querySelector('h1')?.textContent?.trim();
}

describe('the error page title', () => {
  it('shows the translated message of a 404 whose error carries only the status', () => {
    const target = render(404, { message: '404' });
    expect(heading(target)).toBe('Page not found, sorry!');
    expect(document.title).toContain('Page not found, sorry!');
  });

  it('shows the translated message of a 500 whose error carries only the status', () => {
    const target = render(500, { message: '500' });
    expect(heading(target)).toBe('Internal server error, sorry!');
  });

  it('shows the default message for a status the catalogue has no message for', () => {
    const target = render(418, { message: '418' });
    expect(heading(target)).toBe('Something went wrong, sorry!');
  });

  it("shows a load's own message as it is", () => {
    const target = render(404, { message: 'No such election' });
    expect(heading(target)).toBe('No such election');
  });
});
