import type { EntityType } from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';

export type ResultsPreviewProps = SvelteHTMLElements['article'] & {
  /**
   * The type of entity for which the results are displayed.
   */
  entityType: EntityType;
  /**
   * The number of results to display. Defaults to 5.
   */
  numResults?: number;
  /**
   * Whether to hide the label. Defaults to false.
   */
  hideLabel?: boolean;
};
