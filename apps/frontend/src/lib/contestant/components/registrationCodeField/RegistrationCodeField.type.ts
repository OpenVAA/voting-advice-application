import type { SvelteHTMLElements } from 'svelte/elements';

export type RegistrationCodeFieldProps = SvelteHTMLElements['div'] & {
  /**
   * Bindable: The code in the field, exactly as it was typed or pasted. @default ''
   */
  value?: string;
  /**
   * The visible label of the field. @default t('contestantApp.register.code')
   */
  label?: string;
  /**
   * The hint shown under the control. @default t('contestantApp.register.codeFormat')
   */
  info?: string;
  /**
   * Bindable: The message shown while the field is in error. The caller decides when the field is in error; the field clears the message when the user edits it.
   */
  error?: string;
  /**
   * Why the field is in error, rendered as `data-reason` on the error message.
   */
  errorReason?: string;
  /**
   * The id of the control. The hint takes the id `<id>-info` and the error `<id>-error`. @default a generated id
   */
  id?: string;
  /**
   * The test id of the error message.
   */
  errorTestId?: string;
  /**
   * The test id of the control, not of the root element.
   */
  'data-testid'?: string;
};
