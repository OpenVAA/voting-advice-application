import type { SvelteHTMLElements } from 'svelte/elements';

export type PasswordValidatorProps = SvelteHTMLElements['div'] & {
  /**
   * The password to validate.
   */
  password?: string;
  /**
   * The username used to prevent the password from being too similar. @default ''
   */
  username?: string;
  /**
   * Bindable: Whether the password is valid.
   */
  validPassword?: boolean;
};
