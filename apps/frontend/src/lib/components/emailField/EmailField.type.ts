import type { SvelteHTMLElements } from 'svelte/elements';

export type EmailFieldProps = SvelteHTMLElements['div'] & {
  /**
   * Bindable: The address in the field. @default ''
   */
  value?: string;
  /**
   * The visible label of the field. @default t('common.email')
   */
  label?: string;
  /**
   * The name the control is submitted under. Two email fields in one form need different names. @default 'email'
   */
  name?: string;
  /**
   * What the control tells the browser it holds: `'username'` where the address signs a user in, `'email'` elsewhere. @default 'email'
   */
  autocomplete?: 'username' | 'email';
  /**
   * An optional hint shown under the control.
   */
  info?: string;
  /**
   * Bindable: The message shown while the field is in error. The caller decides when the field is in error; the field clears the message when the user edits it.
   */
  error?: string;
  /**
   * The id of the control. The hint takes the id `<id>-info` and the error `<id>-error`. @default a generated id
   */
  id?: string;
  /**
   * The test id of the error message.
   */
  errorTestId?: string;
  /**
   * A word naming why the field is in error, written on the error message as `data-reason`. Nothing is written without one.
   */
  errorReason?: string;
  /**
   * The test id of the control, not of the root element.
   */
  'data-testid'?: string;
};
