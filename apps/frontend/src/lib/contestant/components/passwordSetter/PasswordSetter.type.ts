import type { SvelteHTMLElements } from 'svelte/elements';

/**
 * The pair of outputs `PasswordSetter` computes from its own inputs and hands to its parent.
 */
export type PasswordSetterValidity = {
  /** Whether the password is valid and the confirmation password matches it. */
  valid: boolean;
  /** The reason the password is not yet acceptable, or `undefined` when it is. */
  errorMessage: string | undefined;
};

/**
 * The form's `method` and `novalidate` are the component's own and its fields carry their own `autocomplete` tokens, so none of the three is a prop.
 */
export type PasswordSetterProps = Omit<SvelteHTMLElements['form'], 'autocomplete' | 'method' | 'novalidate'> & {
  /**
   * Bindable: The password value.
   */
  password?: string;
  /**
   * The address of the account the password is for. It is held in the form, in a read-only field that is not rendered, for a password manager to pair with the new password, and it is given to the rule list, which refuses a password that contains it. The component never shows it and never sends it anywhere.
   */
  username?: string;
  /**
   * Called whenever the validity verdict or the error message changes. Both values are computed from the component's own inputs, so they are derived rather than pushed, and this callback is how they reach the parent. The verdict follows the rule list's delayed display; `validate()` judges the password as typed.
   */
  onValidityChange?: (validity: PasswordSetterValidity) => void;
};
