/**
 * `PasswordSetter`, mounted for real against a fake component context whose `t` returns its key.
 *
 * The component is driven the way its callers drive it — the password through the bound prop or the rendered field, the confirmation through the rendered field, `validate()` and `reset()` through the component reference — and read back through the DOM and through `onValidityChange`.
 *
 * What this file holds:
 *
 * 1. **The validity verdict and the message a parent receives** through `onValidityChange`.
 * 2. **The form** — its method, its own validation switched off, and the id and submit handler of its caller.
 * 3. **The address field** — in the form's markup for a password manager, not rendered, and absent without an address.
 * 4. **The two password fields** — their names, tokens, labels and the rule string, and the order of the form's markup.
 * 5. **The address and the rule list** — a password that contains the address is not valid.
 * 6. **`validate()`** — the verdict on the password as typed, the error at the field it concerns and the focus.
 * 7. **Editing and `reset()`** — what removes an error.
 *
 * `t` is mocked to return its key, so the message assertions are on stable identifiers rather than on localized prose. The real `PasswordValidator` child runs, because `validPassword` is an input to the verdict a parent receives; its 200 ms debounce is driven with fake timers rather than waited out. No case of `validate()` advances those timers: the verdict must not depend on the validator's display.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { minPasswordLength } from '$lib/utils/password-validation/passwordValidation';

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

/** Another password that satisfies every enforced rule. */
const OTHER_VALID_PASSWORD = 'Zyxwvu9?';

/** A password that breaks the length rule and three of the character rules. */
const RULE_BREAKING_PASSWORD = 'abc';

/** A made-up address of the account the password is for. */
const ADDRESS = 'person@example.test';

/** A password that satisfies every character rule and contains the address. */
const PASSWORD_WITH_ADDRESS = `A1!${ADDRESS}`;

/** The two translation keys the message ladder can produce. Asserted as keys, never as rendered prose. */
const NOT_VALID_KEY = 'contestantApp.setPassword.passwordNotValid';
const DONT_MATCH_KEY = 'contestantApp.setPassword.passwordsDontMatch';

const PASSWORD_BLOCK = '[data-testid="password-setter-password"]';
const CONFIRMATION_BLOCK = '[data-testid="password-setter-confirmation"]';
const PASSWORD_ERROR = '[data-testid="password-setter-password-error"]';
const CONFIRMATION_ERROR = '[data-testid="password-setter-confirmation-error"]';
const ADDRESS_FIELD = 'input[name="username"]';

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

/** What a parent route observes and what a user does, plus handles on what the parent cannot reach through props. */
type Harness = {
  /** The element the component was mounted into. */
  target: HTMLElement;
  /** The component's root. */
  form: HTMLFormElement;
  /** The password control. */
  password: HTMLInputElement;
  /** The confirmation control. */
  confirmation: HTMLInputElement;
  /** The latest values of the two outputs, as the parent sees them. */
  outputs: { valid: boolean; errorMessage: string | undefined };
  /** The password the parent owns and the component writes back to. */
  parentPassword: () => string;
  /** Set the password from the parent, as a `bind:` at a call site would. */
  setParentPassword: (value: string) => void;
  /** Type into the password field. */
  typePassword: (value: string) => void;
  /** Type into the confirmation field, which is internal state reachable only through the rendered form. */
  typeConfirmation: (value: string) => void;
  /** The value currently shown in the confirmation field. */
  confirmationValue: () => string;
  /** The error shown at the password field, if any. */
  passwordError: () => HTMLElement | null;
  /** The error shown at the confirmation field, if any. */
  confirmationError: () => HTMLElement | null;
  /** Call the component's exported `validate`, as a caller's submit handler does through its component reference. */
  validate: () => boolean;
  /** Call the component's exported `reset`, exactly as the settings route does through its component reference. */
  reset: () => void;
};

/**
 * Mount the component wired the way its call sites wire it. `password` carries an accessor pair rather than a plain value because that is precisely what a `bind:` at a call site compiles to — a plain object would let the component's write-back vanish instead of reaching the parent. The two outputs arrive through `onValidityChange`, which is how a parent receives values the component derives rather than pushes.
 *
 * @param password - The password the parent holds at mount.
 * @param props - Further props, e.g. `username`, `id` and `onsubmit`.
 */
function render(password = '', props: Record<string, unknown> = {}): Harness {
  const parent = $state({ password, valid: false, errorMessage: undefined as string | undefined });

  const target = document.createElement('div');
  document.body.appendChild(target);

  const component = mount(PasswordSetter, {
    target,
    props: {
      ...props,
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
    } as never
  });
  flushSync();

  teardown.push(() => {
    unmount(component);
    target.remove();
  });

  const form = target.querySelector<HTMLFormElement>('form');
  const passwordInput = target.querySelector<HTMLInputElement>(`${PASSWORD_BLOCK} input`);
  const confirmation = target.querySelector<HTMLInputElement>(`${CONFIRMATION_BLOCK} input`);
  if (!form || !passwordInput || !confirmation)
    throw new Error('The form or one of its two fields did not render, so the contract under test cannot be driven.');

  const exports = component as unknown as { reset: () => void; validate: () => boolean };

  function type(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
  }

  return {
    target,
    form,
    password: passwordInput,
    confirmation,
    outputs: parent,
    parentPassword: () => parent.password,
    setParentPassword: (value: string) => {
      parent.password = value;
      flushSync();
    },
    typePassword: (value: string) => type(passwordInput, value),
    typeConfirmation: (value: string) => type(confirmation, value),
    confirmationValue: () => confirmation.value,
    passwordError: () => target.querySelector<HTMLElement>(PASSWORD_ERROR),
    confirmationError: () => target.querySelector<HTMLElement>(CONFIRMATION_ERROR),
    validate: () => {
      const verdict = exports.validate();
      flushSync();
      return verdict;
    },
    reset: () => {
      exports.reset();
      flushSync();
    }
  };
}

/** Advance past the child validator's debounce and settle the reactive graph, so `validPassword` reflects the current password. */
function settle(): void {
  vi.advanceTimersByTime(DEBOUNCE_MS);
  flushSync();
}

/** Whether `first` comes before `second` in the document. */
function precedes(first: Element, second: Element): boolean {
  return !!(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
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
    harness.typeConfirmation(OTHER_VALID_PASSWORD);
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
    harness.typeConfirmation(OTHER_VALID_PASSWORD);
    settle();
    expect(harness.outputs.errorMessage).toBe(DONT_MATCH_KEY);

    harness.reset();

    expect(harness.parentPassword()).toBe('');
    expect(harness.confirmationValue()).toBe('');
    expect(harness.outputs.errorMessage).toBeUndefined();
    expect(harness.outputs.valid).toBe(false);
  });
});

describe('PasswordSetter', () => {
  describe('the form', () => {
    it('is one form posted by `POST`, with the browser’s own validation switched off', () => {
      const { target, form } = render();

      expect(target.querySelectorAll('form')).toHaveLength(1);
      expect(target.firstElementChild).toBe(form);
      expect(form.getAttribute('method')).toBe('POST');
      expect(form.noValidate).toBe(true);
    });

    it('takes its id and its submit handler from its caller', () => {
      const onsubmit = vi.fn((event: Event) => event.preventDefault());
      const { form } = render('', { id: 'choose-password', onsubmit });

      expect(form.id).toBe('choose-password');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      expect(onsubmit).toHaveBeenCalledTimes(1);
    });

    it('stays a `POST` form without the browser’s validation whatever its caller passes', () => {
      const { form } = render('', { method: 'GET', novalidate: false });

      expect(form.getAttribute('method')).toBe('POST');
      expect(form.noValidate).toBe(true);
    });

    it('keeps its own classes beside a class of its caller', () => {
      const { form } = render('', { class: 'max-w-md' });

      expect(form.classList.contains('max-w-md')).toBe(true);
      expect(form.classList.contains('flex')).toBe(true);
      expect(form.classList.contains('gap-md')).toBe(true);
    });
  });

  describe('the address field', () => {
    it('is the form’s first control: a read-only user name that is no tab stop and is not rendered', () => {
      const { form } = render('', { username: ADDRESS });

      const address = form.querySelector<HTMLInputElement>(ADDRESS_FIELD);
      expect(address).not.toBeNull();
      expect(form.elements[0]).toBe(address);
      expect(address!.getAttribute('type')).toBe('email');
      expect(address!.getAttribute('autocomplete')).toBe('username');
      expect(address!.readOnly).toBe(true);
      expect(address!.getAttribute('tabindex')).toBe('-1');
      expect(address!.classList.contains('hidden')).toBe(true);
      expect(address!.value).toBe(ADDRESS);
    });

    it('is absent without an address', () => {
      const { form } = render();

      expect(form.querySelector(ADDRESS_FIELD)).toBeNull();
      expect(form.querySelectorAll('input')).toHaveLength(2);
    });

    it('is absent with an empty address', () => {
      const { form } = render('', { username: '' });

      expect(form.querySelector(ADDRESS_FIELD)).toBeNull();
    });
  });

  describe('the two password fields', () => {
    it('have different names and both ask for a new password', () => {
      const { password, confirmation } = render();

      expect(password.getAttribute('type')).toBe('password');
      expect(password.getAttribute('name')).toBe('new-password');
      expect(password.getAttribute('autocomplete')).toBe('new-password');
      expect(confirmation.getAttribute('type')).toBe('password');
      expect(confirmation.getAttribute('name')).toBe('new-password-confirmation');
      expect(confirmation.getAttribute('autocomplete')).toBe('new-password');
      expect(password.id).not.toBe(confirmation.id);
    });

    it('each have one visible label tied to them and no placeholder', () => {
      const { form, password, confirmation } = render();

      const labels = Array.from(form.querySelectorAll('label'));
      expect(labels).toHaveLength(2);
      expect(labels[0].getAttribute('for')).toBe(password.id);
      expect(labels[0].textContent).toBe('common.password');
      expect(labels[1].getAttribute('for')).toBe(confirmation.id);
      expect(labels[1].textContent).toBe('common.passwordConfirmation');
      for (const label of labels) expect(label.classList.contains('sr-only')).toBe(false);
      expect(password.hasAttribute('placeholder')).toBe(false);
      expect(confirmation.hasAttribute('placeholder')).toBe(false);
    });

    it('state the rule list’s own rules to the browser on the first field alone', () => {
      const { password, confirmation } = render();

      expect(password.getAttribute('passwordrules')).toBe(
        `minlength: ${minPasswordLength}; required: upper; required: lower; required: digit; required: special;`
      );
      expect(confirmation.hasAttribute('passwordrules')).toBe(false);
    });

    it('carry no error state before the form is judged', () => {
      const harness = render();
      settle();

      expect(harness.passwordError()).toBeNull();
      expect(harness.confirmationError()).toBeNull();
      expect(harness.password.hasAttribute('aria-invalid')).toBe(false);
      expect(harness.confirmation.hasAttribute('aria-invalid')).toBe(false);
    });

    it('follow the address field, the sentence and the rule list, in that order', () => {
      const { form, password, confirmation } = render('', { username: ADDRESS });

      const address = form.querySelector(ADDRESS_FIELD);
      const sentence = Array.from(form.querySelectorAll('*')).find(
        (element) =>
          element.children.length === 0 && element.textContent?.trim() === 'contestantApp.setPassword.ingress'
      );
      const ruleList = form.querySelector('progress');
      expect(address).not.toBeNull();
      expect(sentence).toBeDefined();
      expect(ruleList).not.toBeNull();

      expect(precedes(address!, sentence!)).toBe(true);
      expect(precedes(sentence!, ruleList!)).toBe(true);
      expect(precedes(ruleList!, password)).toBe(true);
      expect(precedes(password, confirmation)).toBe(true);
    });
  });

  describe('the address and the rule list', () => {
    it('reports a password that contains the address as not valid', () => {
      const harness = render(PASSWORD_WITH_ADDRESS, { username: ADDRESS });
      settle();
      harness.typeConfirmation(PASSWORD_WITH_ADDRESS);
      settle();

      expect(harness.outputs.valid).toBe(false);
      expect(harness.outputs.errorMessage).toBe(NOT_VALID_KEY);
    });

    it('reports the same password as valid where no address is given', () => {
      const harness = render(PASSWORD_WITH_ADDRESS);
      settle();
      harness.typeConfirmation(PASSWORD_WITH_ADDRESS);
      settle();

      expect(harness.outputs.valid).toBe(true);
    });
  });

  describe('validate()', () => {
    it('refuses two empty fields at the first field and focuses it', () => {
      const harness = render();

      expect(harness.validate()).toBe(false);

      const error = harness.passwordError();
      expect(error).not.toBeNull();
      expect(error!.textContent).toContain(NOT_VALID_KEY);
      expect(error!.getAttribute('role')).toBe('alert');
      expect(harness.password.getAttribute('aria-invalid')).toBe('true');
      expect(harness.password.getAttribute('aria-describedby')).toBe(error!.id);
      expect(error!.id).not.toBe('');
      expect(harness.confirmationError()).toBeNull();
      expect(harness.confirmation.hasAttribute('aria-invalid')).toBe(false);
      expect(document.activeElement).toBe(harness.password);
    });

    it('refuses a password that breaks a rule at the first field and focuses it', () => {
      const harness = render();
      harness.typePassword(RULE_BREAKING_PASSWORD);
      harness.typeConfirmation(RULE_BREAKING_PASSWORD);

      expect(harness.validate()).toBe(false);

      expect(harness.passwordError()?.textContent).toContain(NOT_VALID_KEY);
      expect(harness.confirmationError()).toBeNull();
      expect(document.activeElement).toBe(harness.password);
    });

    it('refuses a password that contains the address at the first field', () => {
      const harness = render('', { username: ADDRESS });
      harness.typePassword(PASSWORD_WITH_ADDRESS);
      harness.typeConfirmation(PASSWORD_WITH_ADDRESS);

      expect(harness.validate()).toBe(false);

      expect(harness.passwordError()?.textContent).toContain(NOT_VALID_KEY);
      expect(document.activeElement).toBe(harness.password);
    });

    it('refuses a valid password with a different confirmation at the second field and focuses it', () => {
      const harness = render();
      harness.typePassword(VALID_PASSWORD);
      harness.typeConfirmation(OTHER_VALID_PASSWORD);

      expect(harness.validate()).toBe(false);

      const error = harness.confirmationError();
      expect(error).not.toBeNull();
      expect(error!.textContent).toContain(DONT_MATCH_KEY);
      expect(error!.getAttribute('role')).toBe('alert');
      expect(harness.confirmation.getAttribute('aria-invalid')).toBe('true');
      expect(harness.confirmation.getAttribute('aria-describedby')).toBe(error!.id);
      expect(harness.passwordError()).toBeNull();
      expect(harness.password.hasAttribute('aria-invalid')).toBe(false);
      expect(document.activeElement).toBe(harness.confirmation);
    });

    it('accepts a valid password and its confirmation at once, before the rule list has caught up', () => {
      const harness = render();
      harness.typePassword(VALID_PASSWORD);
      harness.typeConfirmation(VALID_PASSWORD);

      expect(harness.validate()).toBe(true);

      expect(harness.passwordError()).toBeNull();
      expect(harness.confirmationError()).toBeNull();
      // The rule list has not judged the password yet, so the verdict a parent receives is still the earlier one.
      expect(harness.outputs.valid).toBe(false);
    });

    it('accepts a valid password its parent set', () => {
      const harness = render();
      harness.setParentPassword(VALID_PASSWORD);
      harness.typeConfirmation(VALID_PASSWORD);

      expect(harness.validate()).toBe(true);
    });

    it('refuses a password edited into breaking a rule while the rule list still shows the earlier one as valid', () => {
      const harness = render();
      harness.typePassword(VALID_PASSWORD);
      harness.typeConfirmation(VALID_PASSWORD);
      settle();
      expect(harness.outputs.valid).toBe(true);

      harness.typePassword(RULE_BREAKING_PASSWORD);
      harness.typeConfirmation(RULE_BREAKING_PASSWORD);

      expect(harness.validate()).toBe(false);
      expect(harness.passwordError()?.textContent).toContain(NOT_VALID_KEY);
    });

    it('removes an earlier error when the pair has become acceptable', () => {
      const harness = render();
      expect(harness.validate()).toBe(false);
      expect(harness.passwordError()).not.toBeNull();

      harness.setParentPassword(VALID_PASSWORD);
      harness.typeConfirmation(VALID_PASSWORD);

      expect(harness.validate()).toBe(true);
      expect(harness.passwordError()).toBeNull();
      expect(harness.confirmationError()).toBeNull();
    });

    it('shows one error at a time: the password’s own before the mismatch', () => {
      const harness = render();
      harness.typePassword(RULE_BREAKING_PASSWORD);
      harness.typeConfirmation(OTHER_VALID_PASSWORD);

      expect(harness.validate()).toBe(false);

      expect(harness.passwordError()).not.toBeNull();
      expect(harness.confirmationError()).toBeNull();
    });
  });

  describe('editing and reset()', () => {
    it('removes the password’s error when the password is edited', () => {
      const harness = render();
      harness.validate();
      expect(harness.passwordError()).not.toBeNull();

      harness.typePassword('A');

      expect(harness.passwordError()).toBeNull();
      expect(harness.password.hasAttribute('aria-invalid')).toBe(false);
      expect(harness.password.hasAttribute('aria-describedby')).toBe(false);
      expect(harness.parentPassword()).toBe('A');
    });

    it('removes the confirmation’s error when the confirmation is edited', () => {
      const harness = render();
      harness.typePassword(VALID_PASSWORD);
      harness.typeConfirmation(OTHER_VALID_PASSWORD);
      harness.validate();
      expect(harness.confirmationError()).not.toBeNull();

      harness.typeConfirmation(VALID_PASSWORD);

      expect(harness.confirmationError()).toBeNull();
      expect(harness.confirmation.hasAttribute('aria-invalid')).toBe(false);
    });

    it('removes the mismatch when the password is edited, since the mismatch is about both fields', () => {
      const harness = render();
      harness.typePassword(VALID_PASSWORD);
      harness.typeConfirmation(OTHER_VALID_PASSWORD);
      harness.validate();
      expect(harness.confirmationError()).not.toBeNull();

      harness.typePassword(OTHER_VALID_PASSWORD);

      expect(harness.confirmationError()).toBeNull();
    });

    it('keeps the password’s error while the confirmation is edited', () => {
      const harness = render();
      harness.validate();
      expect(harness.passwordError()).not.toBeNull();

      harness.typeConfirmation('A');

      expect(harness.passwordError()).not.toBeNull();
    });

    it('empties both fields and both errors on `reset()`', () => {
      const harness = render();
      harness.typePassword(RULE_BREAKING_PASSWORD);
      harness.typeConfirmation(OTHER_VALID_PASSWORD);
      harness.validate();
      expect(harness.passwordError()).not.toBeNull();

      harness.reset();

      expect(harness.parentPassword()).toBe('');
      expect(harness.password.value).toBe('');
      expect(harness.confirmationValue()).toBe('');
      expect(harness.passwordError()).toBeNull();
      expect(harness.confirmationError()).toBeNull();
      expect(harness.password.hasAttribute('aria-invalid')).toBe(false);
    });

    it('empties a mismatch on `reset()`', () => {
      const harness = render();
      harness.typePassword(VALID_PASSWORD);
      harness.typeConfirmation(OTHER_VALID_PASSWORD);
      harness.validate();
      expect(harness.confirmationError()).not.toBeNull();

      harness.reset();

      expect(harness.confirmationError()).toBeNull();
      expect(harness.confirmation.hasAttribute('aria-invalid')).toBe(false);
    });
  });
});
