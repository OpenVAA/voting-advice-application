/**
 * An error `Input`'s caller sets, and the two functions `Input` exports.
 *
 * `value` and `error` are handed over as accessor pairs, which is what a `bind:` at a call site compiles to, so that a write the input makes reaches the parent. Assertions are on the DOM rather than on component state.
 *
 * What this file holds:
 *
 * 1. **A caller's error** — shown as the input's inline error, with the caller's test id and reason, marking the control invalid, and cleared by an edit.
 * 2. **The input's own error** — an entry the input refuses itself still shows in the same message and reaches the caller, unless the caller judges the entry itself.
 * 3. **The exports** — `focus()` and `checkValidity()` of a kind that renders one control.
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

/** The id every subject is mounted with, so that derived ids are literals. */
const ID = 'subject';
const ERROR = 'contestantApp.login.emailRequired';
/** The shared test id of an `Input`'s inline error. */
const DEFAULT_ERROR_TEST_ID = 'input-error';

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
  /** The mounted input's exports. */
  exports: { focus?: unknown; checkValidity?: unknown };
};

/** Mount an `Input` with `value` and `error` bound to a parent and return what a parent can reach. */
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
      type: 'text',
      label: 'Label',
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
  return { target, parent, exports: component as unknown as Harness['exports'] };
}

/** The input's one control. */
function controlOf(target: HTMLElement): HTMLInputElement {
  const inputs = target.querySelectorAll<HTMLInputElement>('input');
  expect(inputs).toHaveLength(1);
  return inputs[0];
}

/** The alerts rendered in the input. */
function alertsOf(target: HTMLElement): Array<HTMLElement> {
  return [...target.querySelectorAll<HTMLElement>('[role="alert"]')];
}

/** Dispatch `name` on the control after setting its text. */
function edit(input: HTMLInputElement, text: string, name: 'input' | 'change'): void {
  input.value = text;
  input.dispatchEvent(new Event(name, { bubbles: true }));
  flushSync();
}

describe('an error its caller sets', () => {
  it.each(['text', 'email'] as const)(
    'is shown as the inline error of a %s input and marks its control invalid',
    (type) => {
      const { target } = render({ type, error: ERROR });

      const input = controlOf(target);
      const alerts = alertsOf(target);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].id).toBe(`${ID}-error`);
      expect(alerts[0].textContent).toContain(ERROR);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')).toBe(`${ID}-error`);
      expect(input.hasAttribute('error')).toBe(false);
    }
  );

  it('carries the test id and the reason it was given, and the shared test id and no reason without them', () => {
    const given = render({ id: 'given', error: ERROR, errorTestId: 'login-email-error', errorReason: 'in-use' });
    const without = render({ id: 'without', error: ERROR });

    const [givenAlert] = alertsOf(given.target);
    expect(givenAlert?.getAttribute('data-testid')).toBe('login-email-error');
    expect(givenAlert?.getAttribute('data-reason')).toBe('in-use');
    const [withoutAlert] = alertsOf(without.target);
    expect(withoutAlert?.getAttribute('data-testid')).toBe(DEFAULT_ERROR_TEST_ID);
    expect(withoutAlert?.hasAttribute('data-reason')).toBe(false);
    expect(controlOf(given.target).hasAttribute('errorTestId')).toBe(false);
  });

  it('is shown when the caller sets it after mount', () => {
    const { target, parent } = render();

    expect(alertsOf(target)).toHaveLength(0);
    parent.error = ERROR;
    flushSync();

    expect(alertsOf(target)).toHaveLength(1);
    expect(controlOf(target).getAttribute('aria-invalid')).toBe('true');
  });

  it('is cleared, for the caller too, when the user types', () => {
    const { target, parent } = render({ error: ERROR });

    const input = controlOf(target);
    expect(alertsOf(target)).toHaveLength(1);

    edit(input, 'a', 'input');

    expect(parent.error).toBeUndefined();
    expect(alertsOf(target)).toHaveLength(0);
    expect(input.hasAttribute('aria-invalid')).toBe(false);
    expect(input.hasAttribute('aria-describedby')).toBe(false);
  });

  it('calls an `oninput` its caller gave, as well as clearing the error', () => {
    const oninput = vi.fn();
    const { target, parent } = render({ error: ERROR, oninput });

    edit(controlOf(target), 'a', 'input');

    expect(oninput).toHaveBeenCalledTimes(1);
    expect(parent.error).toBeUndefined();
  });
});

describe('an error the input sets itself', () => {
  it('is written to the bound error and shown in the same message', () => {
    const { target, parent } = render({ type: 'email', value: '', errorTestId: 'given' });

    edit(controlOf(target), 'not an address', 'change');

    expect(parent.error).toBe('components.input.error.invalidEmail');
    const alerts = alertsOf(target);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].getAttribute('data-testid')).toBe('given');
  });
});

describe('an input whose caller judges the entry', () => {
  it.each(['email', 'url'] as const)(
    'shows no error of its own for a committed %s entry it would refuse, and takes the entry in as typed',
    (type) => {
      const { target, parent } = render({ type, value: '', validate: false });

      edit(controlOf(target), 'not one', 'change');

      expect(alertsOf(target)).toHaveLength(0);
      expect(parent.error).toBeUndefined();
      expect(parent.value).toBe('not one');
      expect(controlOf(target).hasAttribute('validate')).toBe(false);
    }
  );

  it('still shows an error its caller sets', () => {
    const { target } = render({ type: 'email', value: '', validate: false, error: ERROR });

    expect(alertsOf(target)).toHaveLength(1);
  });
});

describe('the exports', () => {
  it('focuses the control on `focus()`', () => {
    const { target, exports } = render();

    const input = controlOf(target);
    expect(typeof exports.focus).toBe('function');
    expect(document.activeElement).not.toBe(input);
    (exports.focus as () => void)();
    expect(document.activeElement).toBe(input);
  });

  it('answers `checkValidity()` with the control’s own verdict', () => {
    const { target, exports } = render({ type: 'email', value: '' });

    const input = controlOf(target);
    expect(typeof exports.checkValidity).toBe('function');
    const checkValidity = exports.checkValidity as () => boolean;

    edit(input, 'not an address', 'input');
    expect(input.checkValidity()).toBe(false);
    expect(checkValidity()).toBe(false);

    edit(input, 'someone@example.org', 'input');
    expect(input.checkValidity()).toBe(true);
    expect(checkValidity()).toBe(true);
  });
});
