import type { Id } from '@openvaa/core';
import type { SvelteHTMLElements } from 'svelte/elements';
import type { EntityCardProps } from '$lib/dynamic-components/entityCard';

export type EntityListProps = SvelteHTMLElements['div'] & {
  /**
   * The properties for the `EntityCard`s to show.
   */
  cards: Array<EntityCardProps>;
  /**
   * The number of entities to display on each page of the list. @default 50
   */
  itemsPerPage?: number;
  /**
   * The fraction of `itemsPerPage` that can be exceeded on the last page to prevent showing a short last page. @default 0.2
   */
  itemsTolerance?: number;
  /**
   * Whether to scroll loaded items into view. This may results in glitches when the list is contained in a modal. @default true
   */
  scrollIntoView?: boolean;
  /**
   * Bind to this property to use the number of shown items.
   */
  readonly itemsShown?: number;
  questionId?: Id;
};
