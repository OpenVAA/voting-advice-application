import type { FilterGroup } from '@openvaa/filters';
import type { SvelteHTMLElements } from 'svelte/elements';

export type EntityListControlsProps<TEntity extends MaybeWrappedEntityVariant = MaybeWrappedEntityVariant> =
  SvelteHTMLElements['div'] & {
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
     * Callback for when the filters are applied.
     */
    onUpdate: (filtered: Array<TEntity>) => void;
  };
