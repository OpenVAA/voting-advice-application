/**
 * The `password` kind of `Input`, mounted for real against a fake component context whose `t` returns its key.
 *
 * `value` and `error` are handed over as accessor pairs, which is what a `bind:` at a call site compiles to, so that a write the input makes reaches the parent. Assertions are on the DOM rather than on component state. The values typed here are sample text, not passwords.
 *
 * What this file holds:
 *
 * 1. **The control** — what it is given reaches it, its one label is in its row, and it asks the platform not to capitalise, correct or spell-check what is typed.
 * 2. **A required control** — `aria-required` given by its caller, with no native `required` and no badge.
 * 3. **A description and an error state** — from what the input shows under the control.
 * 4. **A rule string** — stated to the browser on the control when its caller gives one, and absent otherwise.
 * 5. **The toggle and the export** — the toggle changes the control's type, keeps its value and name, and says whether it is pressed under one name; a pointer press leaves focus on the control with the caret at the end, and a press from the keyboard leaves it on the toggle; `focus()` focuses the control.
 * 6. **The value** — written on every input event, whoever reads it.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({
    locale: 'en',
    locales: ['en'],
    t: (key: string) => key,
    translate: (value: unknown) => (typeof value === 'string' ? value : ''),
    darkMode: false
  })
}));

const Input = (await import('./Input.svelte')).default;

const ID = 'subject';
const ERROR = 'contestantApp.login.passwordRequired';
const TOGGLE = '[data-testid="password-field-toggle"]';

/** What the sign-in form's field is given, beside its label. */
const SIGN_IN_PROPS = {
  name: 'password',
  autocomplete: 'current-password',
  'data-testid': 'password-field'
};

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

type Harness = {
  /** The element the input was mounted into. */
  target: HTMLElement;
  /** The two values a parent binds, as the parent sees them. */
  parent: { value: string | undefined; error: string | undefined };
  /** The input's one control. */
  input: HTMLInputElement;
  /** The mounted input's exports. */
  exports: { focus: () => void };
};

/** Mount the kind with `value` and `error` bound to a parent, and return what a parent can reach. */
function render(props: Record<string, unknown> = {}): Harness {
  const parent = $state({
    value: props.value as string | undefined,
    error: props.error as string | undefined
  });
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(Input, {
    target,
    props: {
      type: 'password',
      label: 'common.password',
      id: ID,
      ...props,
      get value() {
        return parent.value;
      },
      set value(next: string | undefined) {
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
  const inputs = target.querySelectorAll<HTMLInputElement>('input');
  expect(inputs).toHaveLength(1);
  return { target, parent, input: inputs[0], exports: component as unknown as Harness['exports'] };
}

/** Type into a control the way a browser reports it: an input event, and no change event. */
function type(input: HTMLInputElement, text: string): void {
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

/**
 * Press the toggle as a browser reports it: a click whose `detail` is `0` for a press from the keyboard (Space or Enter) and the number of presses for a pointer.
 */
function press(toggle: HTMLButtonElement, by: 'keyboard' | 'pointer'): void {
  toggle.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: by === 'keyboard' ? 0 : 1 }));
  flushSync();
}

/** The toggle of the mounted input. */
function toggleOf(target: HTMLElement): HTMLButtonElement {
  const toggle = target.querySelector<HTMLButtonElement>(TOGGLE);
  expect(toggle, 'expected the toggle to be rendered').not.toBeNull();
  return toggle!;
}

describe('Input of the password kind', () => {
  describe('the control', () => {
    it('is a password control with the name, the autocomplete token and the test id it is given', () => {
      const { target, input } = render(SIGN_IN_PROPS);

      expect(target.querySelector('[data-testid="password-field"]')).toBe(input);
      expect(input.getAttribute('type')).toBe('password');
      expect(input.getAttribute('name')).toBe('password');
      expect(input.getAttribute('autocomplete')).toBe('current-password');
      expect(input.id).toBe(ID);
    });

    it('takes no name of its own', () => {
      const { input } = render();

      expect(input.hasAttribute('name')).toBe(false);
    });

    it('is tied by `for` to one label, in its row and visible', () => {
      const { target, input } = render();

      const labels = target.querySelectorAll('label');
      expect(labels).toHaveLength(1);
      expect(labels[0].getAttribute('for')).toBe(input.id);
      expect(labels[0].textContent).toBe('common.password');
      expect(labels[0].classList.contains('sr-only')).toBe(false);
      expect(labels[0].parentElement?.contains(input)).toBe(true);
    });

    it('has a placeholder only when it is given one', () => {
      expect(render().input.hasAttribute('placeholder')).toBe(false);
      expect(render({ id: 'with-placeholder', placeholder: 'given' }).input.getAttribute('placeholder')).toBe('given');
    });

    it('asks the platform not to capitalise, correct or spell-check, masked and revealed', () => {
      const { target, input } = render();

      for (const revealed of [false, true]) {
        expect(input.getAttribute('type')).toBe(revealed ? 'text' : 'password');
        expect(input.getAttribute('autocapitalize')).toBe('none');
        expect(input.getAttribute('autocorrect')).toBe('off');
        expect(input.getAttribute('spellcheck')).toBe('false');
        toggleOf(target).click();
        flushSync();
      }
    });

    it('disables the control and its toggle while the input is disabled or locked', () => {
      for (const props of [{ disabled: true }, { locked: true }]) {
        const { target, input } = render({ id: Object.keys(props)[0], ...props });

        expect(input.disabled).toBe(true);
        expect(toggleOf(target).hasAttribute('disabled')).toBe(true);
      }
    });
  });

  describe('a required control', () => {
    it('is `aria-required` when its caller says so, with no native `required` and no badge', () => {
      const { target, input } = render({ 'aria-required': 'true' });

      expect(input.getAttribute('aria-required')).toBe('true');
      expect(input.required).toBe(false);
      expect(target.textContent).not.toContain('common.required');
    });
  });

  describe('a description and an error state', () => {
    it('carries neither while the input shows nothing under the control', () => {
      const { input } = render();

      expect(input.hasAttribute('aria-describedby')).toBe(false);
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('is described by the error and marked invalid while the error is shown', () => {
      const { target, input } = render({ error: ERROR, errorTestId: 'given' });

      const alerts = target.querySelectorAll('[role="alert"]');
      expect(alerts).toHaveLength(1);
      expect(alerts[0].id).toBe(`${ID}-error`);
      expect(alerts[0].getAttribute('data-testid')).toBe('given');
      expect(input.getAttribute('aria-describedby')).toBe(`${ID}-error`);
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('is described by the info line, with no error state', () => {
      const { input } = render({ info: 'Help.' });

      expect(input.getAttribute('aria-describedby')).toBe(`${ID}-info`);
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('a rule string', () => {
    it('is absent from the control by default', () => {
      const { input } = render(SIGN_IN_PROPS);

      expect(input.hasAttribute('passwordrules')).toBe(false);
    });

    it('is stated on the control when its caller gives one', () => {
      const { input } = render({ passwordrules: 'minlength: 12; required: digit;' });

      expect(input.getAttribute('passwordrules')).toBe('minlength: 12; required: digit;');
    });
  });

  describe('the toggle and the export', () => {
    it('has a toggle that submits nothing, changes the control’s type and keeps its value and name', () => {
      const { target, input } = render({ value: 'a typed value', name: 'new-password' });

      const toggle = toggleOf(target);
      expect(toggle.getAttribute('type')).toBe('button');
      expect(input.getAttribute('type')).toBe('password');

      toggle.click();
      flushSync();
      expect(input.getAttribute('type')).toBe('text');
      expect(input.value).toBe('a typed value');
      expect(input.getAttribute('name')).toBe('new-password');

      toggle.click();
      flushSync();
      expect(input.getAttribute('type')).toBe('password');
      expect(input.value).toBe('a typed value');
    });

    it('leaves focus on the control after a pointer press of the toggle, with the caret at the end and nothing selected, in both directions', () => {
      const { target, input } = render({ value: 'a typed value' });
      const end = 'a typed value'.length;
      const toggle = toggleOf(target);

      for (const revealedAfter of [true, false]) {
        toggle.focus();
        expect(document.activeElement).toBe(toggle);

        press(toggle, 'pointer');

        expect(input.getAttribute('type')).toBe(revealedAfter ? 'text' : 'password');
        expect(document.activeElement).toBe(input);
        expect(input.selectionStart).toBe(end);
        expect(input.selectionEnd).toBe(end);
      }
    });

    it('moves the caret to the end of a selection the press finds in the control', () => {
      const { target, input } = render({ value: 'a typed value' });
      const end = 'a typed value'.length;

      input.focus();
      input.setSelectionRange(0, 3);
      press(toggleOf(target), 'pointer');

      expect(document.activeElement).toBe(input);
      expect(input.selectionStart).toBe(end);
      expect(input.selectionEnd).toBe(end);
    });

    it('does not let a pointer press on the toggle take focus from the control', () => {
      const { target } = render();

      const press = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      toggleOf(target).dispatchEvent(press);

      expect(press.defaultPrevented).toBe(true);
    });

    it('leaves focus on the toggle after a press from the keyboard, in both directions, so that the next press toggles again', () => {
      const { target, input } = render({ value: 'a typed value' });
      const toggle = toggleOf(target);
      toggle.focus();

      for (const revealedAfter of [true, false]) {
        press(toggle, 'keyboard');

        expect(input.getAttribute('type')).toBe(revealedAfter ? 'text' : 'password');
        expect(document.activeElement).toBe(toggle);
        expect(input.value).toBe('a typed value');
      }
    });

    it('says whether it is pressed: not while the entry is masked, and pressed while it is shown', () => {
      const { target } = render();
      const toggle = toggleOf(target);

      for (const pressed of [false, true, false]) {
        expect(toggle.getAttribute('aria-pressed')).toBe(String(pressed));
        press(toggle, 'keyboard');
      }
    });

    it('keeps one name, the sentence that shows the entry, while it is pressed and while it is not', () => {
      const { target } = render();
      const toggle = toggleOf(target);

      for (let i = 0; i < 2; i++) {
        expect(toggle.getAttribute('aria-label')).toBe('components.passwordInput.showPassword');
        press(toggle, 'pointer');
      }
    });

    it('focuses the control on `focus()`', () => {
      const { input, exports } = render();

      expect(document.activeElement).not.toBe(input);
      exports.focus();
      expect(document.activeElement).toBe(input);
    });
  });

  describe('the value', () => {
    it('starts empty when none is given', () => {
      const { parent, input } = render();

      expect(parent.value).toBe('');
      expect(input.value).toBe('');
    });

    it('reaches a bound parent after one input event, as typed', () => {
      const { parent, input } = render();

      type(input, ' a typed value ');

      expect(parent.value).toBe(' a typed value ');
      expect(input.value).toBe(' a typed value ');
    });

    it('calls `onChange` with the value on every input event', () => {
      const onChange = vi.fn();
      const { input } = render({ onChange });

      type(input, 'a');
      type(input, 'ab');

      expect(onChange.mock.calls).toEqual([['a'], ['ab']]);
    });

    it('shows a value its parent writes', () => {
      const { parent, input } = render();

      parent.value = 'written by the parent';
      flushSync();

      expect(input.value).toBe('written by the parent');
    });

    it('clears a bound error on an edit, for the caller too', () => {
      const { target, parent, input } = render({ error: ERROR });
      expect(target.querySelector('[role="alert"]')).not.toBeNull();

      type(input, 'a');

      expect(parent.error).toBeUndefined();
      expect(target.querySelector('[role="alert"]')).toBeNull();
      expect(input.hasAttribute('aria-invalid')).toBe(false);
      expect(input.hasAttribute('aria-describedby')).toBe(false);
    });

    it('calls an `oninput` its caller gave', () => {
      const oninput = vi.fn();
      const { input } = render({ oninput });

      type(input, 'a');

      expect(oninput).toHaveBeenCalledTimes(1);
    });
  });
});
