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
   * The name the input is submitted under. Two password fields in one form need different names. @default 'password'
   */
  name?: string;
  /**
   * The autocomplete value for password input. @default ''
   */
  autocomplete?: string;
  /**
   * The label for the password field.
   */
  label?: string;
  /**
   * Whether the label is outside the component and should not be rendered inside. With an outside label the input has no placeholder either: the visible label names it. @default false
   */
  externalLabel?: boolean;
  /**
   * The ids of the elements that describe the input, e.g. its error message. Rendered as the input's `aria-describedby`.
   */
  describedby?: string;
  /**
   * Whether the input is in error. Rendered as the input's `aria-invalid`. @default false
   */
  invalid?: boolean;
  /**
   * A rule string for browsers that suggest passwords, e.g. `'minlength: 8; required: digit;'`. Rendered as the input's `passwordrules`, an attribute outside the HTML standard that some browsers read. Not rendered when not given.
   */
  passwordrules?: string;
};
