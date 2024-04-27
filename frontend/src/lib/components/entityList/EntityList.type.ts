import type {SvelteHTMLElements} from 'svelte/elements';
import type {EntityCardProps} from '$lib/components/entityCard';

export type EntityListProps = SvelteHTMLElements['div'] & {
  /**
   * A list of possibly ranked entities, e.g. candidates or a parties.
   */
  contents: MaybeRanked[];
  /**
   * An optional function that is called for each entity in the list to determine the action to be performed when the entity card is clicked. @default undefined
   */
  actionCallBack?: (entity: EntityProps) => CardAction;
  /**
   * Optional properties that will be passed to each `EntityCard` in the list. @default undefined
   */
  entityCardProps?: Partial<Omit<EntityCardProps, 'content'>>;
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

/**
 * The return type of the `actionCallBack` property that determines which action is performed when the entity is clicked: either an url string, a `MouseEvent` handler, or `undefined` if no action should be performed.
 */
export type CardAction = string | ((e: MouseEvent) => void) | undefined;
