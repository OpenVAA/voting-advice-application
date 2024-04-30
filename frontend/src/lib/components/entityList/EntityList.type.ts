import type {SvelteHTMLElements} from 'svelte/elements';
import type {EntityCardProps} from '$lib/components/entityCard';

export type EntityListProps = SvelteHTMLElements['div'] & {
  /**
   * The properties for the `EntityCard`s to show.
   */
  cards: EntityCardProps[];
  /**
   * The number of entities to display on each page of the list. @default 20
   */
  itemsPerPage?: number;
  /**
   * The fraction of `itemsPerPage` that can be exceeded on the last page to prevent showing a short last page. @default 0.2
   */
  itemsTolerance?: number;
  /**
   * Bind to this property to use the number of shown items.
   */
  readonly itemsShown?: number;
};
