/**
 * `RegistrationCodeField`, mounted for real against a fake component context whose `t` returns its key.
 *
 * `value` and `error` are handed over as accessor pairs, which is what a `bind:` at a call site compiles to, so that a write the field makes reaches the parent. Assertions are on the DOM rather than on component state.
 *
 * What this file holds:
 *
 * 1. **The label and the hint** — one visible label tied to the control by `for`, and the format of a code as the hint.
 * 2. **What the control declares** — a plain text control that a browser offers nothing for and does not correct.
 * 3. **The error** — its id, its test id, its reason, and the control's description and error state.
 * 4. **Editing** — the value is shown and handed back exactly as it is; typing clears the error; a paste is not prevented.
 * 5. **The export and the ids** — `focus()`, and two instances never sharing an id.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

const { RegistrationCodeField } = await import('.');

const ERROR = 'contestantApp.register.codeUnconfirmed';

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
  exports: { focus: () => void };
};

/** Mount the field with `value` and `error` bound to a parent and return what a parent can reach. */
function render(props: Record<string, unknown> = {}): Harness {
  const parent = $state({
    value: (props.value as string | undefined) ?? '',
    error: props.error as string | undefined
  });
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(RegistrationCodeField, {
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

describe('RegistrationCodeField', () => {
  describe('the label and the hint', () => {
    it('renders one visible label tied to the control by `for`, and no placeholder', () => {
      const { target } = render();

      const input = controlOf(target);
      const labels = target.querySelectorAll('label');
      expect(labels).toHaveLength(1);
      expect(labels[0].getAttribute('for')).toBe(input.id);
      expect(input.id).not.toBe('');
      expect(labels[0].textContent).toBe('contestantApp.register.code');
      expect(labels[0].classList.contains('sr-only')).toBe(false);
      expect(input.hasAttribute('placeholder')).toBe(false);
      expect(input.hasAttribute('aria-label')).toBe(false);
    });

    it('shows the format of a code as its hint and describes the control by it', () => {
      const { target } = render({ id: 'code' });

      const input = controlOf(target);
      const hint = target.querySelector('#code-info');
      expect(hint).not.toBeNull();
      expect(hint!.tagName).toBe('P');
      expect(hint!.textContent).toBe('contestantApp.register.codeFormat');
      expect(input.getAttribute('aria-describedby')).toBe('code-info');
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('shows the label and the hint it was given', () => {
      const { target } = render({ id: 'code', label: 'A label', info: 'A hint' });

      controlOf(target);
      expect(target.querySelector('label')?.textContent).toBe('A label');
      expect(target.querySelector('#code-info')?.textContent).toBe('A hint');
    });
  });

  describe('what the control declares', () => {
    it('is a text control named `code` that a browser offers nothing for and does not correct', () => {
      const { target } = render();

      const input = controlOf(target);
      expect(input.getAttribute('type')).toBe('text');
      expect(input.getAttribute('name')).toBe('code');
      expect(input.getAttribute('autocomplete')).toBe('off');
      expect(input.getAttribute('autocapitalize')).toBe('characters');
      expect(input.getAttribute('spellcheck')).toBe('false');
      expect(input.getAttribute('autocorrect')).toBe('off');
    });

    it('sets no limit on the length of a code and no pattern', () => {
      const { target } = render();

      const input = controlOf(target);
      expect(input.hasAttribute('maxlength')).toBe(false);
      expect(input.hasAttribute('pattern')).toBe(false);
    });

    it('carries the test id its caller gives on the control, not on its root', () => {
      const { target } = render({ 'data-testid': 'register-code', class: 'mt-lg' });

      const input = controlOf(target);
      expect(input.getAttribute('data-testid')).toBe('register-code');
      const root = target.firstElementChild!;
      expect(root.hasAttribute('data-testid')).toBe(false);
      expect(root.classList.contains('mt-lg')).toBe(true);
      expect(root.classList.contains('gap-xs')).toBe(true);
    });
  });

  describe('the error', () => {
    it('renders no alert and is not in error without one', () => {
      const { target } = render();

      const input = controlOf(target);
      expect(target.querySelector('[role="alert"]')).toBeNull();
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('renders an error as an alert with the id `<id>-error`, the test id and the reason it was given', () => {
      const { target } = render({
        id: 'code',
        error: ERROR,
        errorReason: 'unconfirmed',
        errorTestId: 'register-code-error'
      });

      const input = controlOf(target);
      const alerts = target.querySelectorAll('[role="alert"]');
      expect(alerts).toHaveLength(1);
      expect(alerts[0].id).toBe('code-error');
      expect(alerts[0].getAttribute('data-testid')).toBe('register-code-error');
      expect(alerts[0].getAttribute('data-reason')).toBe('unconfirmed');
      expect(alerts[0].textContent).toContain(ERROR);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')).toBe('code-info code-error');
    });

    it('clears a bound error when the user types', () => {
      const { target, parent } = render({ id: 'code', error: ERROR });

      const input = controlOf(target);
      expect(target.querySelector('[role="alert"]')).not.toBeNull();

      type(input, 'a');

      expect(parent.error).toBeUndefined();
      expect(target.querySelector('[role="alert"]')).toBeNull();
      expect(input.hasAttribute('aria-invalid')).toBe(false);
      expect(input.getAttribute('aria-describedby')).toBe('code-info');
    });
  });

  describe('editing', () => {
    it('shows a value set from outside exactly as it is', () => {
      const { target } = render({ value: ' abcd efgh-JKMN ' });

      expect(controlOf(target).value).toBe(' abcd efgh-JKMN ');
    });

    it('changes nothing but what was typed', () => {
      const { target, parent } = render({ value: 'abcd' });

      const input = controlOf(target);
      type(input, 'abcd-efgh jkmn ');

      expect(input.value).toBe('abcd-efgh jkmn ');
      expect(parent.value).toBe('abcd-efgh jkmn ');
    });

    it('does not prevent a paste', () => {
      const { target } = render();

      const input = controlOf(target);
      const paste = new Event('paste', { bubbles: true, cancelable: true });
      expect(input.dispatchEvent(paste)).toBe(true);
      expect(paste.defaultPrevented).toBe(false);
    });
  });

  describe('the export and the ids', () => {
    it('focuses the control on `focus()`', () => {
      const { target, exports } = render();

      const input = controlOf(target);
      expect(document.activeElement).not.toBe(input);
      exports.focus();
      expect(document.activeElement).toBe(input);
    });

    it('gives two instances different ids', () => {
      const first = render();
      const second = render();

      expect(controlOf(first.target).id).not.toBe(controlOf(second.target).id);
    });

    it('uses an id it was given as given', () => {
      const { target } = render({ id: 'code' });

      expect(controlOf(target).id).toBe('code');
      expect(target.querySelector('label')?.getAttribute('for')).toBe('code');
    });
  });
});
