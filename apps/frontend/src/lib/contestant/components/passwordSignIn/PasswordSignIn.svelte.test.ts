/**
 * `PasswordSignIn`, mounted for real with its real `PasswordField` against a fake contestant context.
 *
 * The fake context's `t` returns its key and its `getRoute` builds routes with the real `buildRoute` from an empty set of route params, so the link is asserted as the address the app would build. `password` and `error` are handed over as accessor pairs, which is what a `bind:` at a call site compiles to. Assertions are on the DOM rather than on component state.
 *
 * What this file holds:
 *
 * 1. **The labelled field** — a visible label tied to the control, and what the control declares.
 * 2. **The refusal** — rendered only when there is one, with the test id and the status it was given.
 * 3. **The link** — to the forgot-password page, with the test id it was given and the address it was given in the `email` search parameter.
 * 4. **The link for a user without a password** — rendered only when it is offered, to the same page with the same address.
 * 5. **The order** — the control, its toggle, the refusal and the links, in the document and so in the tab order.
 * 6. **The field's error** — its wiring to the control, and that typing clears it.
 * 7. **The export and the ids** — `focus()`, and two instances never sharing an id.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import type { RouteOptions } from '$lib/routes';

vi.mock('$lib/contexts/contestant', () => ({
  getContestantContext: () => ({
    t: (key: string) => key,
    getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {} }) }
  })
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

const { PasswordSignIn } = await import('.');

const FIELD = '[data-testid="password-field"]';
const TOGGLE = '[data-testid="password-field-toggle"]';

/** The three test ids each of the two screens that render the component passes. */
const SIGN_IN_SCREEN_IDS = {
  errorTestId: 'login-password-error',
  failureTestId: 'login-errorMessage',
  forgotPasswordTestId: 'login-forgot-password-link'
};
const CODE_SIGN_IN_SCREEN_IDS = {
  errorTestId: 'register-sign-in-password-error',
  failureTestId: 'register-sign-in-error',
  forgotPasswordTestId: 'register-sign-in-forgot-password-link'
};

/** The test id the sign-in screen gives the link for a user without a password. */
const NO_PASSWORD_YET_ID = { noPasswordYetTestId: 'login-no-password-yet-link' };

const ADDRESS = 'someone+tag@example.test';

const FAILURE = 'error.wrongEmailOrPassword';
const ERROR = 'contestantApp.login.passwordRequired';

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

type Harness = {
  /** The element the component was mounted into. */
  target: HTMLElement;
  /** The two values a parent binds, as the parent sees them. */
  parent: { password: string; error: string | undefined };
  /** The password control. */
  input: HTMLInputElement;
  /** The mounted component's exports. */
  exports: { focus: () => void };
};

/** Mount the component with `password` and `error` bound to a parent. */
function render(props: Record<string, unknown> = {}): Harness {
  const parent = $state({
    password: (props.password as string | undefined) ?? '',
    error: props.error as string | undefined
  });
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(PasswordSignIn, {
    target,
    props: {
      ...props,
      get password() {
        return parent.password;
      },
      set password(next: string) {
        parent.password = next;
      },
      get error() {
        return parent.error;
      },
      set error(next: string | undefined) {
        parent.error = next;
      }
    } as never
  });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  const inputs = target.querySelectorAll<HTMLInputElement>('input');
  expect(inputs).toHaveLength(1);
  return { target, parent, input: inputs[0], exports: component as unknown as Harness['exports'] };
}

/** Type into a control the way a browser reports it. */
function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

/** Whether `first` comes before `second` in the document. */
function precedes(first: Element, second: Element): boolean {
  return !!(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe('PasswordSignIn', () => {
  describe('the labelled field', () => {
    it('renders one visible label tied to the password control, and no placeholder', () => {
      const { target, input } = render();

      const labels = target.querySelectorAll('label');
      expect(labels).toHaveLength(1);
      expect(labels[0].getAttribute('for')).toBe(input.id);
      expect(input.id).not.toBe('');
      expect(labels[0].textContent).toBe('common.password');
      expect(labels[0].classList.contains('sr-only')).toBe(false);
      expect(input.hasAttribute('placeholder')).toBe(false);
      expect(input.hasAttribute('aria-label')).toBe(false);
    });

    it('declares a required password control named `password` that holds the current password', () => {
      const { target, input } = render();

      expect(target.querySelector(FIELD)).toBe(input);
      expect(input.getAttribute('type')).toBe('password');
      expect(input.getAttribute('name')).toBe('password');
      expect(input.getAttribute('autocomplete')).toBe('current-password');
      expect(input.required).toBe(true);
      expect(input.hasAttribute('maxlength')).toBe(false);
    });

    it('hands the parent the password as typed', () => {
      const { parent, input } = render();

      type(input, ' a typed value ');

      expect(parent.password).toBe(' a typed value ');
      expect(input.value).toBe(' a typed value ');
    });
  });

  describe('the refusal', () => {
    it('renders no alert while there is no refusal and no error', () => {
      const { target, input } = render(SIGN_IN_SCREEN_IDS);

      expect(target.querySelector('[role="alert"]')).toBeNull();
      expect(target.querySelector('[data-testid="login-errorMessage"]')).toBeNull();
      expect(input.hasAttribute('aria-invalid')).toBe(false);
      expect(input.hasAttribute('aria-describedby')).toBe(false);
    });

    it('renders the refusal as an alert holding its sentence, with the test id and the status it was given', () => {
      const { target } = render({ ...SIGN_IN_SCREEN_IDS, failure: FAILURE, failureStatus: 400 });

      const alerts = target.querySelectorAll('[role="alert"]');
      expect(alerts).toHaveLength(1);
      expect(alerts[0].getAttribute('data-testid')).toBe('login-errorMessage');
      expect(alerts[0].getAttribute('data-status')).toBe('400');
      expect(alerts[0].textContent).toContain(FAILURE);
    });

    it('leaves the control out of the error state for a refusal', () => {
      const { input } = render({ ...SIGN_IN_SCREEN_IDS, failure: FAILURE, failureStatus: 400 });

      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('carries the test ids of the screen that renders it', () => {
      const { target } = render({ ...CODE_SIGN_IN_SCREEN_IDS, failure: FAILURE, error: ERROR });

      expect(target.querySelector('[data-testid="register-sign-in-error"]')).not.toBeNull();
      expect(target.querySelector('[data-testid="register-sign-in-password-error"]')).not.toBeNull();
      expect(target.querySelector('[data-testid="register-sign-in-forgot-password-link"]')).not.toBeNull();
      expect(target.querySelector('[data-testid^="login-"]')).toBeNull();
    });
  });

  describe('the link', () => {
    it('leads to the forgot-password page, with the test id it was given', () => {
      const { target } = render(SIGN_IN_SCREEN_IDS);

      const links = target.querySelectorAll<HTMLAnchorElement>('a');
      expect(links).toHaveLength(1);
      expect(links[0].getAttribute('href')).toBe('/contestant/forgot-password');
      expect(links[0].getAttribute('data-testid')).toBe('login-forgot-password-link');
      expect(links[0].textContent).toContain('contestantApp.login.forgotPassword');
    });

    it('carries the address it was given to the forgot-password page', () => {
      const { target } = render({ ...SIGN_IN_SCREEN_IDS, email: ADDRESS });

      const link = target.querySelector<HTMLAnchorElement>('[data-testid="login-forgot-password-link"]');
      expect(link).not.toBeNull();
      const href = new URL(link!.getAttribute('href')!, 'http://localhost');
      expect(href.pathname).toBe('/contestant/forgot-password');
      expect(href.searchParams.get('email')).toBe(ADDRESS);
    });

    it.each([
      ['an empty address', ''],
      ['an address of spaces alone', '   ']
    ])('carries no address for %s', (_name, email) => {
      const { target } = render({ ...SIGN_IN_SCREEN_IDS, email, noPasswordYetOffered: true, ...NO_PASSWORD_YET_ID });

      for (const link of target.querySelectorAll<HTMLAnchorElement>('a'))
        expect(link.getAttribute('href')).toBe('/contestant/forgot-password');
    });
  });

  describe('the link for a user without a password', () => {
    it('is not rendered unless it is offered', () => {
      const { target } = render({ ...SIGN_IN_SCREEN_IDS, ...NO_PASSWORD_YET_ID, email: ADDRESS });

      expect(target.querySelector('[data-testid="login-no-password-yet-link"]')).toBeNull();
      expect(target.textContent).not.toContain('contestantApp.login.noPasswordYet');
    });

    it('leads to the forgot-password page with the address it was given, with the test id it was given', () => {
      const { target } = render({
        ...SIGN_IN_SCREEN_IDS,
        ...NO_PASSWORD_YET_ID,
        email: ADDRESS,
        noPasswordYetOffered: true
      });

      const link = target.querySelector<HTMLAnchorElement>('[data-testid="login-no-password-yet-link"]');
      expect(link).not.toBeNull();
      expect(link!.tagName).toBe('A');
      expect(link!.textContent).toContain('contestantApp.login.noPasswordYet');
      const href = new URL(link!.getAttribute('href')!, 'http://localhost');
      expect(href.pathname).toBe('/contestant/forgot-password');
      expect(href.searchParams.get('email')).toBe(ADDRESS);
    });

    it('leads there with no address when it was given none', () => {
      const { target } = render({ ...SIGN_IN_SCREEN_IDS, ...NO_PASSWORD_YET_ID, noPasswordYetOffered: true });

      const link = target.querySelector<HTMLAnchorElement>('[data-testid="login-no-password-yet-link"]');
      expect(link?.getAttribute('href')).toBe('/contestant/forgot-password');
    });

    it('follows the Forgot password link, in the document and so in the tab order', () => {
      const { target } = render({ ...SIGN_IN_SCREEN_IDS, ...NO_PASSWORD_YET_ID, noPasswordYetOffered: true });

      const stops = [...target.querySelectorAll('input, button, a')].map(
        (element) => element.getAttribute('data-testid') ?? element.tagName
      );
      expect(stops).toEqual([
        'password-field',
        'password-field-toggle',
        'login-forgot-password-link',
        'login-no-password-yet-link'
      ]);
    });
  });

  describe('the order', () => {
    it('puts the control, its toggle, the field’s error, the refusal and the link in that order', () => {
      const { target, input } = render({ ...SIGN_IN_SCREEN_IDS, error: ERROR, failure: FAILURE });

      const toggle = target.querySelector(TOGGLE);
      const error = target.querySelector('[data-testid="login-password-error"]');
      const failure = target.querySelector('[data-testid="login-errorMessage"]');
      const link = target.querySelector('[data-testid="login-forgot-password-link"]');
      expect(toggle).not.toBeNull();
      expect(error).not.toBeNull();
      expect(failure).not.toBeNull();
      expect(link).not.toBeNull();

      expect(precedes(target.querySelector('label')!, input)).toBe(true);
      expect(precedes(input, toggle!)).toBe(true);
      expect(precedes(toggle!, error!)).toBe(true);
      expect(precedes(error!, failure!)).toBe(true);
      expect(precedes(failure!, link!)).toBe(true);
    });

    it('moves no control in or out of the tab order, so the tab order is the order of the document', () => {
      const { target } = render({ ...SIGN_IN_SCREEN_IDS, error: ERROR, failure: FAILURE });

      // A `tabindex` of 0, which `Button` sets on its element, keeps the element at its place in the document.
      for (const element of target.querySelectorAll('[tabindex]')) expect(element.getAttribute('tabindex')).toBe('0');
      const stops = [...target.querySelectorAll('input, button, a')].map(
        (element) => element.getAttribute('data-testid') ?? element.tagName
      );
      expect(stops).toEqual(['password-field', 'password-field-toggle', 'login-forgot-password-link']);
    });
  });

  describe('the field’s error', () => {
    it('renders the error as an alert tied to the control, with the test id it was given', () => {
      const { target, input } = render({ ...SIGN_IN_SCREEN_IDS, id: 'secret', error: ERROR });

      const alerts = target.querySelectorAll('[role="alert"]');
      expect(alerts).toHaveLength(1);
      expect(alerts[0].id).toBe('secret-error');
      expect(alerts[0].getAttribute('data-testid')).toBe('login-password-error');
      expect(alerts[0].textContent).toContain(ERROR);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')).toBe('secret-error');
    });

    it('clears a bound error when the user types', () => {
      const { target, parent, input } = render({ ...SIGN_IN_SCREEN_IDS, id: 'secret', error: ERROR });
      expect(target.querySelector('[role="alert"]')).not.toBeNull();

      type(input, 'a');

      expect(parent.error).toBeUndefined();
      expect(target.querySelector('[role="alert"]')).toBeNull();
      expect(input.hasAttribute('aria-invalid')).toBe(false);
      expect(input.hasAttribute('aria-describedby')).toBe(false);
    });
  });

  describe('the export and the ids', () => {
    it('focuses the password control on `focus()`', () => {
      const { input, exports } = render();

      expect(document.activeElement).not.toBe(input);
      exports.focus();
      expect(document.activeElement).toBe(input);
    });

    it('gives two instances different ids, each with its own label', () => {
      const first = render();
      const second = render();

      expect(first.input.id).not.toBe(second.input.id);
      expect(first.target.querySelector('label')?.getAttribute('for')).toBe(first.input.id);
      expect(second.target.querySelector('label')?.getAttribute('for')).toBe(second.input.id);
    });

    it('uses an id it was given as given, and merges the caller’s class into its root', () => {
      const { target, input } = render({ id: 'secret', class: 'mt-lg' });

      expect(input.id).toBe('secret');
      expect(target.querySelector('label')?.getAttribute('for')).toBe('secret');
      expect(target.firstElementChild!.classList.contains('mt-lg')).toBe(true);
    });
  });
});
