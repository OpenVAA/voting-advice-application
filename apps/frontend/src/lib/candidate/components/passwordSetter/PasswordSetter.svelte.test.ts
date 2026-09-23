/**
 * `PasswordSetter.svelte` — the validity verdict and the error-message ladder the three candidate routes consume.
 *
 * Phase 159, criterion 1 (D-H1). The component computes both outputs inside `$effect`s whose bodies are pure functions of the component's own inputs — `password`, the internal confirmation field, and the `validPassword` flag the child validator pushes up. That is the semantic half of criterion 1's test, and it passes. The mechanical half fails: both write targets are `$bindable` props, and Svelte 5 does not permit a derived value to hold one. Whatever disposition resolves that collision, the OBSERVABLE contract asserted here must be identical either side of it.
 *
 * This file is the equivalence proof. It drives the component the way its three call sites drive it — the password through the prop, the confirmation through the rendered field, the reset through the component reference the settings route holds — and reads back the two outputs the parents bind. The four cases below are the contract; they are not to be weakened, relaxed or "adapted" to whatever a new implementation happens to produce. If the disposition changes the component's public prop contract, only the `render` helper's wiring changes, because that helper is the one place this file spells the contract out.
 *
 * `t` is mocked to return its key, so the message assertions are on stable identifiers rather than on localized prose that a translation edit would move. The real `PasswordValidator` child runs, because `validPassword` is an input to both computations under test and stubbing it would leave the interesting half of the ladder unexercised; its 200 ms debounce is driven with fake timers rather than waited out.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

/**
 * jsdom ships no `window.matchMedia`, and `svelte/motion` reads it at module-evaluation time to honour `prefers-reduced-motion`. The child validator's progress bar pulls that module in transitively, so without this the suite fails during import and never reaches a single assertion. The stub answers "no preference", which is the browser default the components are authored against.
 */
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

const PasswordSetter = (await import('./PasswordSetter.svelte')).default;

/** The child validator validates on a 200 ms debounce, so `validPassword` does not move until this much fake time has passed. */
const DEBOUNCE_MS = 200;

/** A password that satisfies every enforced rule in `passwordValidation.ts`: length, uppercase, lowercase, digit, symbol. */
const VALID_PASSWORD = 'Abcdef1!';

/** The two translation keys the message ladder can produce. Asserted as keys, never as rendered prose. */
const NOT_VALID_KEY = 'candidateApp.setPassword.passwordNotValid';
const DONT_MATCH_KEY = 'candidateApp.setPassword.passwordsDontMatch';

let teardown: Array<() => void> = [];

beforeEach(() => {
  // Only the debounce's timer functions are faked. Leaving the microtask queue real keeps `flushSync()` behaving as it does in production.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
  for (const stop of teardown.reverse()) stop();
  teardown = [];
  vi.useRealTimers();
});

/** What a parent route observes: the two outputs, plus a handle on the field the parent cannot reach through props. */
type Harness = {
  /** The latest values of the two outputs, as the parent sees them. */
  outputs: { valid: boolean; errorMessage: string | undefined };
  /** The password the parent owns and the component writes back to on reset. */
  parentPassword: () => string;
  /** Type into the confirmation field, which is internal state reachable only through the rendered form. */
  typeConfirmation: (value: string) => void;
  /** The value currently shown in the confirmation field. */
  confirmationValue: () => string;
  /** Call the component's exported reset, exactly as the settings route does through its component reference. */
  reset: () => void;
};

/**
 * Mount the component wired the way its three call sites wire it. `password` carries an accessor pair rather than a plain value because that is precisely what a `bind:` at a call site compiles to — a plain object would let the component's write-back on reset vanish instead of reaching the parent. The two outputs arrive through `onValidityChange`, which is how a parent receives values the component derives rather than pushes.
 */
function render(password = ''): Harness {
  const parent = $state({ password, valid: false, errorMessage: undefined as string | undefined });

  const target = document.createElement('div');
  document.body.appendChild(target);

  const component = mount(PasswordSetter, {
    target,
    props: {
      get password() {
        return parent.password;
      },
      set password(next: string) {
        parent.password = next;
      },
      onValidityChange: ({ valid, errorMessage }: { valid: boolean; errorMessage: string | undefined }) => {
        parent.valid = valid;
        parent.errorMessage = errorMessage;
      }
    }
  });
  flushSync();

  teardown.push(() => {
    unmount(component);
    target.remove();
  });

  const confirmation = target.querySelector<HTMLInputElement>('[data-testid="password-setter-confirmation"] input');
  if (!confirmation)
    throw new Error('The confirmation field did not render, so the contract under test cannot be driven.');

  return {
    outputs: parent,
    parentPassword: () => parent.password,
    typeConfirmation: (value: string) => {
      confirmation.value = value;
      confirmation.dispatchEvent(new Event('input', { bubbles: true }));
      flushSync();
    },
    confirmationValue: () => confirmation.value,
    reset: () => {
      (component as unknown as { reset: () => void }).reset();
      flushSync();
    }
  };
}

/** Advance past the child validator's debounce and settle the reactive graph, so `validPassword` reflects the current password. */
function settle(): void {
  vi.advanceTimersByTime(DEBOUNCE_MS);
  flushSync();
}

describe('PasswordSetter validity and error message', () => {
  it('reports not valid with the not-valid message for an empty password', () => {
    const harness = render('');
    settle();

    expect(harness.outputs.valid).toBe(false);
    expect(harness.outputs.errorMessage).toBe(NOT_VALID_KEY);
  });

  it('reports not valid with the do-not-match message when the confirmation differs', () => {
    const harness = render(VALID_PASSWORD);
    settle();
    harness.typeConfirmation('Zyxwvu9?');
    settle();

    expect(harness.outputs.valid).toBe(false);
    expect(harness.outputs.errorMessage).toBe(DONT_MATCH_KEY);
  });

  it('reports valid with no message when a valid password is confirmed', () => {
    const harness = render(VALID_PASSWORD);
    settle();
    harness.typeConfirmation(VALID_PASSWORD);
    settle();

    expect(harness.outputs.valid).toBe(true);
    expect(harness.outputs.errorMessage).toBeUndefined();
  });

  it('clears both fields and the message when reset is called', () => {
    const harness = render(VALID_PASSWORD);
    settle();
    harness.typeConfirmation('Zyxwvu9?');
    settle();
    expect(harness.outputs.errorMessage).toBe(DONT_MATCH_KEY);

    harness.reset();

    expect(harness.parentPassword()).toBe('');
    expect(harness.confirmationValue()).toBe('');
    expect(harness.outputs.errorMessage).toBeUndefined();
    expect(harness.outputs.valid).toBe(false);
  });
});
