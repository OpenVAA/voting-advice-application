import type {SvelteHTMLElements} from 'svelte/elements';

export type DataConsentProps = SvelteHTMLElements['div'] & {
  /**
   * Whether and how to show the data consent description. @default modal
   * - `none`: Don’t show the description.
   * - `inline`: Show the consent description above the buttons.
   * - `modal`: Show a button that opens the description in a modal.
   */
  description?: 'none' | 'inline' | 'modal';
};

/**
 * The events that are fired by the component.
 */
export interface DataConsentEvents {
  change: {
    consent: UserDataCollectionConsent;
  };
}
