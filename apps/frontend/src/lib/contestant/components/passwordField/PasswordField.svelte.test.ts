/**
 * `PasswordField`, mounted for real against a fake component context whose `t` returns its key.
 *
 * The field is shared by the Contestant App and by the Admin App's login, so the first block mounts it with exactly what the Admin login passes and holds what that page gets. Assertions are on the DOM rather than on component state.
 *
 * What this file holds:
 *
 * 1. **The Admin login's field** — the markup of a caller that passes only an id and an autocomplete token.
 * 2. **A name** — the control is submitted under the name its caller gives.
 * 3. **An outside label** — no label and no placeholder are rendered inside.
 * 4. **A description and an error state** — passed on to the control.
 * 5. **A rule string** — stated to the browser on the control when its caller gives one, and absent otherwise.
 * 6. **The toggle and the export** — the toggle changes the control's type alone, and `focus()` focuses the control.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

const { PasswordField } = await import('.');

const FIELD = '[data-testid="password-field"]';
const TOGGLE = '[data-testid="password-field-toggle"]';

/** What the Admin App's login page passes, beside the bound password. */
const ADMIN_LOGIN_PROPS = { autocomplete: 'current-password', id: 'password' };

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

type Harness = {
  /** The element the field was mounted into. */
  target: HTMLElement;
  /** The field's one control. */
  input: HTMLInputElement;
  /** The mounted field's exports. */
  exports: { focus: () => void };
};

/** Mount the field and return its control. */
function render(props: Record<string, unknown> = {}): Harness {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(PasswordField, { target, props: props as never });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  const inputs = target.querySelectorAll<HTMLInputElement>('input');
  expect(inputs).toHaveLength(1);
  return { target, input: inputs[0], exports: component as unknown as Harness['exports'] };
}

describe('PasswordField', () => {
  describe('the Admin login’s field', () => {
    it('is a required password control named `password` with the test id `password-field`', () => {
      const { target, input } = render(ADMIN_LOGIN_PROPS);

      expect(target.querySelector(FIELD)).toBe(input);
      expect(input.getAttribute('type')).toBe('password');
      expect(input.getAttribute('name')).toBe('password');
      expect(input.getAttribute('autocomplete')).toBe('current-password');
      expect(input.id).toBe('password');
      expect(input.required).toBe(true);
    });

    it('is labelled for assistive technology only, and shows its placeholder', () => {
      const { target, input } = render(ADMIN_LOGIN_PROPS);

      const labels = target.querySelectorAll('label');
      expect(labels).toHaveLength(1);
      expect(labels[0].getAttribute('for')).toBe('password');
      expect(labels[0].classList.contains('sr-only')).toBe(true);
      expect(labels[0].textContent).toBe('common.password');
      expect(input.getAttribute('placeholder')).toBe('components.passwordInput.placeholder');
    });

    it('carries no description and no error state', () => {
      const { input } = render(ADMIN_LOGIN_PROPS);

      expect(input.hasAttribute('aria-describedby')).toBe(false);
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('a name', () => {
    it('submits the control under the name it was given', () => {
      const { input } = render({ name: 'new-password' });

      expect(input.getAttribute('name')).toBe('new-password');
    });
  });

  describe('an outside label', () => {
    it('renders no label and no placeholder inside', () => {
      const { target, input } = render({ externalLabel: true, id: 'secret' });

      expect(target.querySelectorAll('label')).toHaveLength(0);
      expect(input.hasAttribute('placeholder')).toBe(false);
      expect(input.id).toBe('secret');
    });
  });

  describe('a description and an error state', () => {
    it('passes both on to the control', () => {
      const { input } = render({ describedby: 'secret-error', invalid: true });

      expect(input.getAttribute('aria-describedby')).toBe('secret-error');
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('leaves the control without an error state when it is not in error', () => {
      const { input } = render({ describedby: 'secret-info', invalid: false });

      expect(input.getAttribute('aria-describedby')).toBe('secret-info');
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('a rule string', () => {
    it('is absent from the control by default', () => {
      const { input } = render(ADMIN_LOGIN_PROPS);

      expect(input.hasAttribute('passwordrules')).toBe(false);
    });

    it('is stated on the control when its caller gives one', () => {
      const { input } = render({ passwordrules: 'minlength: 12; required: digit;' });

      expect(input.getAttribute('passwordrules')).toBe('minlength: 12; required: digit;');
    });
  });

  describe('the toggle and the export', () => {
    it('has a toggle that submits nothing and changes the control’s type alone', () => {
      const { target, input } = render({ password: 'a typed value', name: 'new-password' });

      const toggle = target.querySelector<HTMLButtonElement>(TOGGLE);
      expect(toggle).not.toBeNull();
      expect(toggle!.getAttribute('type')).toBe('button');

      toggle!.click();
      flushSync();
      expect(input.type).toBe('text');
      expect(input.value).toBe('a typed value');
      expect(input.getAttribute('name')).toBe('new-password');

      toggle!.click();
      flushSync();
      expect(input.type).toBe('password');
      expect(input.value).toBe('a typed value');
    });

    it('focuses the control on `focus()`', () => {
      const { input, exports } = render();

      expect(document.activeElement).not.toBe(input);
      exports.focus();
      expect(document.activeElement).toBe(input);
    });
  });
});
