/**
 * `EmailEntry`, mounted for real with its two real `EmailField`s against a fake component context whose `t` returns its key.
 *
 * `email` is handed over as an accessor pair, which is what a `bind:` at a call site compiles to. The confirmation is internal to the component and is driven through the rendered control. Assertions are on the DOM rather than on component state, and messages are asserted as keys.
 *
 * What this file holds:
 *
 * 1. **The two fields** — their labels, names, autocomplete tokens, test ids and ids.
 * 2. **`email`** — the first field's value, and nothing of the second's.
 * 3. **The comparison when the confirmation loses focus** — shown only while both hold text and they differ, trimmed and without regard to case.
 * 4. **Editing** — an edit of either field removes the mismatch; a paste is not prevented.
 * 5. **`validate()`** — its verdict, the message at each field and where focus goes.
 * 6. **`showEmailError()`** — a message from outside shown at the address field, with its reason, and removed by the next edit of either field.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

const { EmailEntry } = await import('.');

const EMAIL = '[data-testid="email-entry-email"]';
const CONFIRMATION = '[data-testid="email-entry-confirmation"]';
const EMAIL_ERROR = '[data-testid="email-entry-email-error"]';
const CONFIRMATION_ERROR = '[data-testid="email-entry-confirmation-error"]';

const REQUIRED_KEY = 'contestantApp.login.emailRequired';
const INVALID_KEY = 'components.input.error.invalidEmail';
const MISMATCH_KEY = 'contestantApp.register.emailEntry.mismatch';

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

type Harness = {
  /** The element the component was mounted into. */
  target: HTMLElement;
  /** The value a parent binds, as the parent sees it. */
  parent: { email: string };
  /** The two controls. */
  email: HTMLInputElement;
  confirmation: HTMLInputElement;
  /** Call the component's exported `validate()` and settle the DOM. */
  validate: () => boolean;
  /** Call the component's exported `showEmailError()` and settle the DOM. */
  showEmailError: (message: string) => void;
};

/** Mount the component with `email` bound to a parent. */
function render(props: Record<string, unknown> = {}): Harness {
  const parent = $state({ email: (props.email as string | undefined) ?? '' });
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(EmailEntry, {
    target,
    props: {
      ...props,
      get email() {
        return parent.email;
      },
      set email(next: string) {
        parent.email = next;
      }
    } as never
  });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });

  const inputs = target.querySelectorAll<HTMLInputElement>('input');
  expect(inputs).toHaveLength(2);
  const email = target.querySelector<HTMLInputElement>(EMAIL);
  const confirmation = target.querySelector<HTMLInputElement>(CONFIRMATION);
  expect(email).not.toBeNull();
  expect(confirmation).not.toBeNull();

  return {
    target,
    parent,
    email: email!,
    confirmation: confirmation!,
    validate: () => {
      const verdict = (component as unknown as { validate: () => boolean }).validate();
      flushSync();
      return verdict;
    },
    showEmailError: (message: string) => {
      (component as unknown as { showEmailError: (message: string) => void }).showEmailError(message);
      flushSync();
    }
  };
}

/** Type into a control the way a browser reports it. */
function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

/** Move focus into a control and out of it again. */
function leave(input: HTMLInputElement): void {
  input.focus();
  input.blur();
  flushSync();
}

/** The message of an error, or `undefined` when it is not rendered. */
function messageOf(target: HTMLElement, selector: string): string | undefined {
  const alerts = target.querySelectorAll(selector);
  expect(alerts.length).toBeLessThanOrEqual(1);
  if (!alerts.length) return undefined;
  expect(alerts[0].getAttribute('role')).toBe('alert');
  return alerts[0].textContent ?? '';
}

describe('EmailEntry', () => {
  describe('the two fields', () => {
    it('renders an address and its confirmation, each an email control with the `email` autocomplete token', () => {
      const { email, confirmation } = render();

      for (const input of [email, confirmation]) {
        expect(input.getAttribute('type')).toBe('email');
        expect(input.getAttribute('autocomplete')).toBe('email');
        expect(input.getAttribute('inputmode')).toBe('email');
        expect(input.getAttribute('autocapitalize')).toBe('none');
        expect(input.getAttribute('spellcheck')).toBe('false');
        expect(input.getAttribute('aria-required')).toBe('true');
      }
    });

    it('gives the two controls different names and different ids', () => {
      const { email, confirmation } = render();

      expect(email.getAttribute('name')).toBe('email');
      expect(confirmation.getAttribute('name')).toBe('email-confirmation');
      expect(email.id).not.toBe('');
      expect(confirmation.id).not.toBe('');
      expect(email.id).not.toBe(confirmation.id);
    });

    it('labels each control visibly, tied to it by `for`', () => {
      const { target, email, confirmation } = render();

      const labels = [...target.querySelectorAll('label')];
      expect(labels).toHaveLength(2);
      expect(labels[0].getAttribute('for')).toBe(email.id);
      expect(labels[0].textContent).toBe('common.email');
      expect(labels[1].getAttribute('for')).toBe(confirmation.id);
      expect(labels[1].textContent).toBe('common.emailConfirmation');
    });

    it('builds the two ids from an id it was given, and merges the caller’s class into its root', () => {
      const { target, email, confirmation } = render({ id: 'entry', class: 'mt-lg' });

      expect(email.id).toBe('entry-email');
      expect(confirmation.id).toBe('entry-confirmation');
      const root = target.firstElementChild!;
      expect(root.classList.contains('mt-lg')).toBe(true);
      expect(root.classList.contains('gap-md')).toBe(true);
    });

    it('gives two instances four different ids', () => {
      const first = render();
      const second = render();

      const ids = [first.email.id, first.confirmation.id, second.email.id, second.confirmation.id];
      expect(new Set(ids).size).toBe(4);
    });
  });

  describe('`email`', () => {
    it('is the first field’s value', () => {
      const { parent, email } = render();

      type(email, 'someone@example.org');

      expect(parent.email).toBe('someone@example.org');
    });

    it('does not change when the confirmation is typed', () => {
      const { parent, email, confirmation } = render();

      type(email, 'someone@example.org');
      type(confirmation, 'another@example.org');

      expect(parent.email).toBe('someone@example.org');
    });

    it('shows a value set from outside in the first field alone', () => {
      const { email, confirmation } = render({ email: 'someone@example.org' });

      expect(email.value).toBe('someone@example.org');
      expect(confirmation.value).toBe('');
    });
  });

  describe('the comparison when the confirmation loses focus', () => {
    it('shows the mismatch at the confirmation when both hold text and they differ', () => {
      const { target, email, confirmation } = render();

      type(email, 'someone@example.org');
      type(confirmation, 'another@example.org');
      expect(messageOf(target, CONFIRMATION_ERROR)).toBeUndefined();

      leave(confirmation);

      expect(messageOf(target, CONFIRMATION_ERROR)).toContain(MISMATCH_KEY);
      expect(messageOf(target, EMAIL_ERROR)).toBeUndefined();
      expect(confirmation.getAttribute('aria-invalid')).toBe('true');
      expect(confirmation.getAttribute('aria-describedby')).toBe(`${confirmation.id}-error`);
      expect(email.hasAttribute('aria-invalid')).toBe(false);
    });

    it('compares the two trimmed and without regard to case', () => {
      const { target, confirmation } = render({ email: 'A@b.c ' });

      type(confirmation, 'a@B.c');
      leave(confirmation);

      expect(messageOf(target, CONFIRMATION_ERROR)).toBeUndefined();
      expect(confirmation.hasAttribute('aria-invalid')).toBe(false);
    });

    it('shows nothing while the address is empty', () => {
      const { target, confirmation } = render();

      type(confirmation, 'someone@example.org');
      leave(confirmation);

      expect(messageOf(target, CONFIRMATION_ERROR)).toBeUndefined();
      expect(messageOf(target, EMAIL_ERROR)).toBeUndefined();
    });

    it('shows nothing while the confirmation is empty', () => {
      const { target, email, confirmation } = render();

      type(email, 'someone@example.org');
      leave(confirmation);

      expect(messageOf(target, CONFIRMATION_ERROR)).toBeUndefined();
      expect(messageOf(target, EMAIL_ERROR)).toBeUndefined();
    });

    it('shows nothing when the address loses focus', () => {
      const { target, email, confirmation } = render();

      type(confirmation, 'another@example.org');
      type(email, 'someone@example.org');
      leave(email);

      expect(messageOf(target, CONFIRMATION_ERROR)).toBeUndefined();
    });
  });

  describe('editing', () => {
    it('removes the mismatch when the confirmation is edited', () => {
      const { target, email, confirmation } = render();
      type(email, 'someone@example.org');
      type(confirmation, 'another@example.org');
      leave(confirmation);
      expect(messageOf(target, CONFIRMATION_ERROR)).toContain(MISMATCH_KEY);

      type(confirmation, 'another@example.or');

      expect(messageOf(target, CONFIRMATION_ERROR)).toBeUndefined();
      expect(confirmation.hasAttribute('aria-invalid')).toBe(false);
    });

    it('removes the mismatch when the address is edited', () => {
      const { target, email, confirmation } = render();
      type(email, 'someone@example.org');
      type(confirmation, 'another@example.org');
      leave(confirmation);
      expect(messageOf(target, CONFIRMATION_ERROR)).toContain(MISMATCH_KEY);

      type(email, 'someone@example.or');

      expect(messageOf(target, CONFIRMATION_ERROR)).toBeUndefined();
      expect(confirmation.hasAttribute('aria-invalid')).toBe(false);
    });

    it('keeps the confirmation’s own message when the address is edited', () => {
      const { target, email, validate } = render();
      type(email, 'someone@example.org');
      expect(validate()).toBe(false);
      expect(messageOf(target, CONFIRMATION_ERROR)).toContain(REQUIRED_KEY);

      type(email, 'someone@example.or');

      expect(messageOf(target, CONFIRMATION_ERROR)).toContain(REQUIRED_KEY);
    });

    it('does not prevent a paste into either field', () => {
      const { email, confirmation } = render();

      for (const input of [email, confirmation]) {
        const paste = new Event('paste', { bubbles: true, cancelable: true });
        expect(input.dispatchEvent(paste)).toBe(true);
        expect(paste.defaultPrevented).toBe(false);
      }
    });
  });

  describe('`validate()`', () => {
    it('returns true for two equal, usable addresses and shows nothing', () => {
      const { target, email, confirmation, validate } = render();
      type(email, 'someone@example.org');
      type(confirmation, 'someone@example.org');

      expect(validate()).toBe(true);

      expect(target.querySelector('[role="alert"]')).toBeNull();
      expect(email.hasAttribute('aria-invalid')).toBe(false);
      expect(confirmation.hasAttribute('aria-invalid')).toBe(false);
    });

    it('returns true for two addresses that differ only in case and surrounding space', () => {
      const { target, confirmation, validate } = render({ email: ' Someone@Example.org ' });
      type(confirmation, 'someone@example.ORG');

      expect(validate()).toBe(true);

      expect(target.querySelector('[role="alert"]')).toBeNull();
    });

    it('asks for an address at each empty field and moves focus to the first', () => {
      const { target, email, validate } = render();

      expect(validate()).toBe(false);

      expect(messageOf(target, EMAIL_ERROR)).toContain(REQUIRED_KEY);
      expect(messageOf(target, CONFIRMATION_ERROR)).toContain(REQUIRED_KEY);
      expect(document.activeElement).toBe(email);
    });

    it('says the address is not valid when its control says so, and moves focus to it', () => {
      const { target, email, confirmation, validate } = render();
      type(email, 'not an address');
      type(confirmation, 'not an address');
      expect(email.checkValidity()).toBe(false);

      expect(validate()).toBe(false);

      expect(messageOf(target, EMAIL_ERROR)).toContain(INVALID_KEY);
      expect(messageOf(target, CONFIRMATION_ERROR)).toBeUndefined();
      expect(email.getAttribute('aria-invalid')).toBe('true');
      expect(document.activeElement).toBe(email);
    });

    it('asks for the confirmation when it alone is empty, and moves focus to it', () => {
      const { target, email, confirmation, validate } = render();
      type(email, 'someone@example.org');

      expect(validate()).toBe(false);

      expect(messageOf(target, EMAIL_ERROR)).toBeUndefined();
      expect(messageOf(target, CONFIRMATION_ERROR)).toContain(REQUIRED_KEY);
      expect(document.activeElement).toBe(confirmation);
    });

    it('shows the mismatch at the confirmation when the two differ, and moves focus to it', () => {
      const { target, email, confirmation, validate } = render();
      type(email, 'someone@example.org');
      type(confirmation, 'another@example.org');

      expect(validate()).toBe(false);

      expect(messageOf(target, EMAIL_ERROR)).toBeUndefined();
      expect(messageOf(target, CONFIRMATION_ERROR)).toContain(MISMATCH_KEY);
      expect(document.activeElement).toBe(confirmation);
    });

    it('shows nothing once the fields were corrected and it is asked again', () => {
      const { target, email, confirmation, validate } = render();
      expect(validate()).toBe(false);

      type(email, 'someone@example.org');
      type(confirmation, 'someone@example.org');

      expect(validate()).toBe(true);
      expect(target.querySelector('[role="alert"]')).toBeNull();
    });
  });

  describe('`showEmailError()`', () => {
    const IN_USE = 'contestantApp.identityProvider.emailInUse';

    it('shows the message at the address field as an alert with the reason `in-use`, and moves focus to the field', () => {
      const { target, email, confirmation, showEmailError } = render();
      type(email, 'someone@example.org');
      type(confirmation, 'someone@example.org');
      confirmation.focus();

      showEmailError(IN_USE);

      expect(messageOf(target, EMAIL_ERROR)).toContain(IN_USE);
      expect(target.querySelector(EMAIL_ERROR)?.getAttribute('data-reason')).toBe('in-use');
      expect(email.getAttribute('aria-invalid')).toBe('true');
      expect(email.getAttribute('aria-describedby')).toBe(`${email.id}-error`);
      expect(messageOf(target, CONFIRMATION_ERROR)).toBeUndefined();
      expect(document.activeElement).toBe(email);
    });

    it('keeps what was typed in both fields', () => {
      const { parent, email, confirmation, showEmailError } = render();
      type(email, 'someone@example.org');
      type(confirmation, 'someone@example.org');

      showEmailError(IN_USE);

      expect(parent.email).toBe('someone@example.org');
      expect(email.value).toBe('someone@example.org');
      expect(confirmation.value).toBe('someone@example.org');
    });

    it('is removed by the next edit of the address', () => {
      const { target, email, showEmailError } = render({ email: 'someone@example.org' });
      showEmailError(IN_USE);

      type(email, 'someone@example.or');

      expect(messageOf(target, EMAIL_ERROR)).toBeUndefined();
      expect(email.hasAttribute('aria-invalid')).toBe(false);
    });

    it('is removed by the next edit of the confirmation', () => {
      const { target, email, confirmation, showEmailError } = render({ email: 'someone@example.org' });
      type(confirmation, 'someone@example.org');
      showEmailError(IN_USE);

      type(confirmation, 'someone@example.or');

      expect(messageOf(target, EMAIL_ERROR)).toBeUndefined();
      expect(email.hasAttribute('aria-invalid')).toBe(false);
    });

    it('leaves no reason on a message the fields show themselves after it', () => {
      const { target, email, showEmailError, validate } = render({ email: 'someone@example.org' });
      showEmailError(IN_USE);

      type(email, '');
      expect(validate()).toBe(false);

      expect(messageOf(target, EMAIL_ERROR)).toContain(REQUIRED_KEY);
      expect(target.querySelector(EMAIL_ERROR)?.hasAttribute('data-reason')).toBe(false);
    });

    it('is replaced by the verdict of `validate()`', () => {
      const { target, email, confirmation, showEmailError, validate } = render();
      type(email, 'someone@example.org');
      type(confirmation, 'someone@example.org');
      showEmailError(IN_USE);

      expect(validate()).toBe(true);

      expect(target.querySelector('[role="alert"]')).toBeNull();
    });

    it('marks no message with a reason before it is called', () => {
      const { target, validate } = render();

      expect(validate()).toBe(false);

      expect(target.querySelector('[data-reason]')).toBeNull();
    });
  });
});
