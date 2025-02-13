import type { SvelteHTMLElements } from 'svelte/elements';
export type PartyTagProps = SvelteHTMLElements['div'] & {
  /**
   * The Party object
   */
  party: LegacyPartyProps;
  /**
   * Whether to use an abbreviation or the full name. @default 'default'
   */
  variant?: 'default' | 'short' | 'full';
};
