import type {SvelteHTMLElements} from 'svelte/elements';

export type DataConsentProps = SvelteHTMLElements['label'] & {
  /**
   * Whether to show an info button that opens a modal displaying information about data collection. @default true
   */
  infoModal?: boolean;
};
