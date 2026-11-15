/**
 * `EmailField`, mounted for real against a fake component context whose `t` returns its key.
 *
 * `value` and `error` are handed over as accessor pairs, which is what a `bind:` at a call site compiles to, so that a write the field makes reaches the parent. Assertions are on the DOM rather than on component state.
 *
 * What this file holds:
 *
 * 1. **The label** — one visible label tied to the control by `for`, and no placeholder.
 * 2. **What the control declares** — its type, name, autocomplete token and the attributes a browser's keyboard and autofill read.
 * 3. **The hint and the error** — their ids, the control's description and its error state.
 * 4. **Editing** — typing clears the error and leaves the value as typed; a paste is not prevented.
 * 5. **The exports** — `focus()` and `checkValidity()`.
 * 6. **Ids** — two instances never share one, and a given id is used as given.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

const { EmailField } = await import('.');

const ERROR = 'contestantApp.login.emailRequired';

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

type Harness = {
  /** The element the field was mounted into. */
  target: HTMLElement;
  /** The two values a parent binds, as the parent sees them. */
  parent: { value: string; error: string | undefined };
  /** The mounted field's exports. */
  exports: { focus: () => void; checkValidity: () => boolean };
};

/** Mount the field with `value` and `error` bound to a parent and return what a parent can reach. */
function render(props: Record<string, unknown> = {}): Harness {
  const parent = $state({
    value: (props.value as string | undefined) ?? '',
    error: props.error as string | undefined
  });
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(EmailField, {
    target,
    props: {
      ...props,
      get value() {
        return parent.value;
      },
      set value(next: string) {
        parent.value = next;
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
  return { target, parent, exports: component as unknown as Harness['exports'] };
}

/** The field's one control. */
function controlOf(target: HTMLElement): HTMLInputElement {
  const inputs = target.querySelectorAll<HTMLInputElement>('input');
  expect(inputs).toHaveLength(1);
  return inputs[0];
}

/** Type into a control the way a browser reports it. */
function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

describe('EmailField', () => {
  describe('the label', () => {
    it('renders one visible label tied to the control by `for`', () => {
      const { target } = render();

      const input = controlOf(target);
      const labels = target.querySelectorAll('label');
      expect(labels).toHaveLength(1);
      expect(labels[0].getAttribute('for')).toBe(input.id);
      expect(input.id).not.toBe('');
      expect(labels[0].textContent).toBe('common.email');
      expect(labels[0].classList.contains('sr-only')).toBe(false);
    });

    it('shows the label it was given', () => {
      const { target } = render({ label: 'common.emailConfirmation' });

      controlOf(target);
      expect(target.querySelector('label')?.textContent).toBe('common.emailConfirmation');
    });

    it('names the control by its label alone: no placeholder and no `aria-label`', () => {
      const { target } = render();

      const input = controlOf(target);
      expect(input.hasAttribute('placeholder')).toBe(false);
      expect(input.hasAttribute('aria-label')).toBe(false);
    });
  });

  describe('what the control declares', () => {
    it('is a required email control named `email` with the `email` autocomplete token by default', () => {
      const { target } = render();

      const input = controlOf(target);
      expect(input.getAttribute('type')).toBe('email');
      expect(input.getAttribute('name')).toBe('email');
      expect(input.getAttribute('autocomplete')).toBe('email');
      expect(input.getAttribute('inputmode')).toBe('email');
      expect(input.getAttribute('autocapitalize')).toBe('none');
      expect(input.getAttribute('spellcheck')).toBe('false');
      expect(input.required).toBe(true);
    });

    it('carries the name, the autocomplete token and the test id its caller gives, on the control', () => {
      const { target } = render({ name: 'email-confirmation', autocomplete: 'username', 'data-testid': 'login-email' });

      const input = controlOf(target);
      expect(input.getAttribute('name')).toBe('email-confirmation');
      expect(input.getAttribute('autocomplete')).toBe('username');
      expect(input.getAttribute('data-testid')).toBe('login-email');
      expect(target.firstElementChild?.hasAttribute('data-testid')).toBe(false);
    });

    it('sets no limit on the length of an address and no pattern of its own', () => {
      const { target } = render();

      const input = controlOf(target);
      expect(input.hasAttribute('maxlength')).toBe(false);
      expect(input.hasAttribute('pattern')).toBe(false);
    });

    it('merges the caller’s class into its root', () => {
      const { target } = render({ class: 'mt-lg' });

      controlOf(target);
      const root = target.firstElementChild!;
      expect(root.classList.contains('mt-lg')).toBe(true);
      expect(root.classList.contains('gap-xs')).toBe(true);
    });
  });

  describe('the hint and the error', () => {
    it('describes nothing and is not in error when it has neither a hint nor an error', () => {
      const { target } = render();

      const input = controlOf(target);
      expect(input.hasAttribute('aria-describedby')).toBe(false);
      expect(input.hasAttribute('aria-invalid')).toBe(false);
      expect(target.querySelector('[role="alert"]')).toBeNull();
    });

    it('renders a hint as a paragraph with the id `<id>-info` and describes the control by it', () => {
      const { target } = render({ id: 'address', info: 'A hint' });

      const input = controlOf(target);
      const hint = target.querySelector('#address-info');
      expect(hint).not.toBeNull();
      expect(hint!.tagName).toBe('P');
      expect(hint!.textContent).toBe('A hint');
      expect(input.getAttribute('aria-describedby')).toBe('address-info');
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('renders an error as an alert with the id `<id>-error` and the test id it was given', () => {
      const { target } = render({ id: 'address', error: ERROR, errorTestId: 'login-email-error' });

      const input = controlOf(target);
      const alerts = target.querySelectorAll('[role="alert"]');
      expect(alerts).toHaveLength(1);
      expect(alerts[0].id).toBe('address-error');
      expect(alerts[0].getAttribute('data-testid')).toBe('login-email-error');
      expect(alerts[0].textContent).toContain(ERROR);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')).toBe('address-error');
    });

    it('describes the control by the hint and the error when both are rendered', () => {
      const { target } = render({ id: 'address', info: 'A hint', error: ERROR });

      const input = controlOf(target);
      expect(input.getAttribute('aria-describedby')).toBe('address-info address-error');
      expect(target.querySelector('#address-info')).not.toBeNull();
      expect(target.querySelector('#address-error')).not.toBeNull();
    });
  });

  describe('editing', () => {
    it('clears a bound error when the user types', () => {
      const { target, parent } = render({ id: 'address', error: ERROR });

      const input = controlOf(target);
      expect(target.querySelector('[role="alert"]')).not.toBeNull();

      type(input, 'a');

      expect(parent.error).toBeUndefined();
      expect(target.querySelector('[role="alert"]')).toBeNull();
      expect(input.hasAttribute('aria-invalid')).toBe(false);
      expect(input.hasAttribute('aria-describedby')).toBe(false);
    });

    it('hands the parent the value as typed and writes nothing back into the control', () => {
      const { target, parent } = render();

      const input = controlOf(target);
      type(input, ' Someone@Example.ORG ');

      expect(parent.value).toBe(input.value);
      expect(parent.value.trim()).toBe('Someone@Example.ORG');
    });

    it('shows a value set from outside', () => {
      const { target } = render({ value: 'someone@example.org' });

      expect(controlOf(target).value).toBe('someone@example.org');
    });

    it('does not prevent a paste', () => {
      const { target } = render();

      const input = controlOf(target);
      const paste = new Event('paste', { bubbles: true, cancelable: true });
      expect(input.dispatchEvent(paste)).toBe(true);
      expect(paste.defaultPrevented).toBe(false);
    });
  });

  describe('the exports', () => {
    it('focuses the control on `focus()`', () => {
      const { target, exports } = render();

      const input = controlOf(target);
      expect(document.activeElement).not.toBe(input);
      exports.focus();
      expect(document.activeElement).toBe(input);
    });

    it('answers `checkValidity()` with the control’s own verdict', () => {
      const { target, exports } = render();

      const input = controlOf(target);
      expect(input.checkValidity()).toBe(false);
      expect(exports.checkValidity()).toBe(false);

      type(input, 'not an address');
      expect(input.checkValidity()).toBe(false);
      expect(exports.checkValidity()).toBe(false);

      type(input, 'someone@example.org');
      expect(input.checkValidity()).toBe(true);
      expect(exports.checkValidity()).toBe(true);
    });
  });

  describe('ids', () => {
    it('gives two instances different ids, each with its own label', () => {
      const first = render();
      const second = render({ name: 'email-confirmation' });

      const a = controlOf(first.target);
      const b = controlOf(second.target);
      expect(a.id).not.toBe(b.id);
      expect(first.target.querySelector('label')?.getAttribute('for')).toBe(a.id);
      expect(second.target.querySelector('label')?.getAttribute('for')).toBe(b.id);
    });

    it('uses an id it was given as given', () => {
      const { target } = render({ id: 'address' });

      expect(controlOf(target).id).toBe('address');
      expect(target.querySelector('label')?.getAttribute('for')).toBe('address');
    });
  });
});
