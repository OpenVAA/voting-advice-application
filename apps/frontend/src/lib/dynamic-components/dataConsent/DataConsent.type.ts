import type { SvelteHTMLElements } from 'svelte/elements';
import type { ConsentStatus } from '$lib/contexts/app/userPreferences.type';

export type DataConsentProps = SvelteHTMLElements['div'] & {
  /**
   * Whether and how to show the data consent description. @default modal
   * - `none`: Don't show the description.
   * - `inline`: Show the consent description above the buttons.
   * - `modal`: Show a button that opens the description in a modal.
   */
  description?: 'none' | 'inline' | 'modal';
  /**
   * Callback fired when the user changes their data collection consent.
   */
  onChange?: (consent: ConsentStatus) => void;
};
