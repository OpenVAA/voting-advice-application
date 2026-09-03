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

export type PasswordSetterProps = Omit<SvelteHTMLElements['form'], 'autocomplete'> & {
  /**
   * Bindable: The password value.
   */
  password?: string;
  /**
   * The autocomplete attribute for the password input field. @default 'new-password'
   */
  autocomplete?: string;
  /**
   * Called whenever the validity verdict or the error message changes. Both values are computed from the component's own inputs, so they are derived rather than pushed, and this callback is how they reach the parent. Replaces the former bindable `valid` and `errorMessage` props.
   */
  onValidityChange?: (validity: PasswordSetterValidity) => void;
};
