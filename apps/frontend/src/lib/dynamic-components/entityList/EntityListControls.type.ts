import type { FilterGroup } from '@openvaa/filters';
import type { Snippet } from 'svelte';
import type { SvelteHTMLElements } from 'svelte/elements';

export type EntityListControlsProps<TEntity extends MaybeWrappedEntityVariant = MaybeWrappedEntityVariant> = Omit<
  SvelteHTMLElements['div'],
  'children'
> & {
  /**
   * A list of possibly ranked entities, e.g. candidates or a parties.
   */
  entities: Array<TEntity>;
  /**
   * The filters applied to the contents
   */
  filterGroup?: FilterGroup<TEntity>;
  /**
   * The property used for the search tool. @default 'name'
   */
  searchProperty?: string;
  /**
   * Renders the list from the entities left after the filters and the search.
   */
  children?: Snippet<[Array<TEntity>]>;
};
