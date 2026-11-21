import type { SvelteHTMLElements } from 'svelte/elements';

export type TermsOfUseFormProps = SvelteHTMLElements['section'] & {
  /**
   * Bindable: Whether the terms are accepted. @default false
   */
  termsAccepted?: boolean;
};
