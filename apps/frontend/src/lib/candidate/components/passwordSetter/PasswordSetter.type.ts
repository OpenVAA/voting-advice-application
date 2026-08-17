import type { SvelteHTMLElements } from 'svelte/elements';

export type PasswordSetterProps = SvelteHTMLElements['form'] & {
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
   * Bindable: Function to clear the form.
   */
  reset?: () => void;
};
