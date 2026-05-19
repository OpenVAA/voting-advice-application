import type { SvelteHTMLElements } from 'svelte/elements';

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
   * Bindable: Error message if the password is invalid or doesn't match the confirmation password.
   */
  errorMessage?: string;
  /**
   * Bindable: Whether the password is valid and the confirmation password matches.
   */
  valid?: boolean;
  /**
   * Optional `data-testid` for the password field wrapper. When provided, wraps the password input in a `<div>` with this value.
   */
  passwordTestId?: string;
  /**
   * Optional `data-testid` for the confirm password field wrapper. When provided, wraps the confirmation input in a `<div>` with this value.
   */
  confirmPasswordTestId?: string;
};
