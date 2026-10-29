/**
 * The confirm page between a mailed link and its verification, mounted for real against fake component and layout contexts.
 *
 * `t` returns its key. `$app/forms` is replaced by an `enhance` that attaches nothing, so the form is inspected rather than posted. Assertions are on the DOM.
 *
 * What this file holds:
 *
 * 1. **The form** — one form, holding the link's token, type and next path in hidden fields, and a Continue button outside it that is tied to it.
 * 2. **A browser with no session** — no notice and no Cancel.
 * 3. **A browser that is signed in** — the notice that continuing signs that account out, and Cancel, a link to the route the load named, beside Continue. The notice names no account.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/i18n', () => ({ t: (key: string) => key }));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({
    video: { hasContent: false },
    setRouteTitle: () => undefined,
    pageStyles: { use: () => undefined },
    topBarSettings: { use: () => undefined }
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

const ConfirmPage = (await import('./+page.svelte')).default;

const PAGE = '[data-testid="auth-confirm-page"]';
const CONTINUE = '[data-testid="auth-confirm-continue"]';
const CANCEL = '[data-testid="auth-confirm-cancel"]';
const NOTICE = '[data-testid="auth-confirm-signed-in"]';

/** The cancel route a signed-in browser is offered in these tests. */
const CANCEL_ROUTE = '/fi/admin';

let target: HTMLElement | undefined;
let instance: ReturnType<typeof mount> | undefined;

/**
 * Mount the page with load data.
 * @param data - What the load answered.
 */
function render(data: Record<string, unknown>): HTMLElement {
  target = document.createElement('div');
  document.body.appendChild(target);
  instance = mount(ConfirmPage, { target, props: { data } as never });
  flushSync();
  return target;
}

afterEach(() => {
  if (instance) unmount(instance);
  target?.remove();
  instance = undefined;
  target = undefined;
});

/** The load's answer for a link opened in a browser with no session. */
const SIGNED_OUT = { tokenHash: 'hash-1', type: 'recovery', next: 'contestant/help', signedIn: false };

/** The load's answer for a link opened in a browser that is signed in. */
const SIGNED_IN = { tokenHash: 'hash-1', type: 'magiclink', next: null, signedIn: true, cancelRoute: CANCEL_ROUTE };

describe('the form', () => {
  it('holds the token, the type and the next path in hidden fields, and Continue is tied to it', () => {
    const root = render(SIGNED_OUT);

    const page = root.querySelector(PAGE);
    expect(page?.getAttribute('data-type')).toBe('recovery');
    const forms = root.querySelectorAll('form');
    expect(forms).toHaveLength(1);
    const form = forms[0];
    expect(form.getAttribute('method')?.toUpperCase()).toBe('POST');
    expect(form.hasAttribute('action')).toBe(false);
    const fields = [...form.querySelectorAll('input')].map((input) => [input.type, input.name, input.value]);
    expect(fields).toEqual([
      ['hidden', 'token_hash', 'hash-1'],
      ['hidden', 'type', 'recovery'],
      ['hidden', 'next', 'contestant/help']
    ]);
    const button = root.querySelector<HTMLButtonElement>(CONTINUE);
    expect(button?.type).toBe('submit');
    expect(button?.getAttribute('form')).toBe(form.id);
    expect(root.textContent).toContain('authConfirm.intro.recovery');
  });

  it('holds no next field for a link that names none', () => {
    const root = render(SIGNED_IN);

    const names = [...root.querySelectorAll('form input')].map((input) => input.getAttribute('name'));
    expect(names).toEqual(['token_hash', 'type']);
  });
});

describe('a browser with no session', () => {
  it('is shown no notice and no Cancel', () => {
    const root = render(SIGNED_OUT);

    expect(root.querySelector(NOTICE)).toBeNull();
    expect(root.querySelector(CANCEL)).toBeNull();
    expect(root.querySelector(CONTINUE)).not.toBeNull();
  });
});

describe('a browser that is signed in', () => {
  it('is told that continuing signs that account out, and is offered Cancel to the route the load named', () => {
    const root = render(SIGNED_IN);

    const notice = root.querySelector(NOTICE);
    expect(notice?.textContent?.trim()).toBe('authConfirm.signedIn');
    const cancel = root.querySelector<HTMLAnchorElement>(CANCEL);
    expect(cancel?.tagName).toBe('A');
    expect(cancel?.getAttribute('href')).toBe(CANCEL_ROUTE);
    expect(cancel?.closest('form')).toBeNull();
    expect(root.querySelector(CONTINUE)).not.toBeNull();
  });
});
