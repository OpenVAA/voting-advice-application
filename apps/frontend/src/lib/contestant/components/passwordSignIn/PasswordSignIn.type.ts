import type { SvelteHTMLElements } from 'svelte/elements';

export type PasswordSignInProps = SvelteHTMLElements['div'] & {
  /**
   * Bindable: The password in the field. @default ''
   */
  password?: string;
  /**
   * Bindable: The message shown at the field while it is in error, e.g. when it was left empty. The caller decides when the field is in error; the component clears the message when the user edits the field.
   */
  error?: string;
  /**
   * The sentence of a refused sign-in, shown under the field. Not shown when empty.
   */
  failure?: string;
  /**
   * The status a refused sign-in was answered with, rendered as `data-status` on the refusal.
   */
  failureStatus?: number | string;
  /**
   * The id of the password control. The field's error takes the id `<id>-error`. @default a generated id
   */
  id?: string;
  /**
   * The test id of the field's error.
   */
  errorTestId?: string;
  /**
   * The test id of the refusal.
   */
  failureTestId?: string;
  /**
   * The test id of the link to the forgot-password page.
   */
  forgotPasswordTestId?: string;
};
