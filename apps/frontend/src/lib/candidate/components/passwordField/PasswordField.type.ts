import type { SvelteHTMLElements } from 'svelte/elements';

export type PasswordFieldProps = SvelteHTMLElements['div'] & {
  /**
   * Optional id for the input.
   */
  id?: string;
  /**
   * Bindable: The password value.
   */
  password?: string;
  /**
   * The autocomplete value for password input. @default ''
   */
  autocomplete?: string;
  /**
   * The label for the password field.
   */
  label?: string;
  /**
   * Whether the label is outside the component and should not be rendered inside. @default false
   */
  externalLabel?: boolean;
  /**
   * Bindable: Function to set focus to the password input.
   */
  focus?: () => void;
};
