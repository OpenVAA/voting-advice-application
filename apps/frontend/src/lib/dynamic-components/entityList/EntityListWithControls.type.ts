import type { FilterGroup } from '@openvaa/filters';
import type { SvelteHTMLElements } from 'svelte/elements';

/**
 * Props for the compound `EntityListWithControls` component.
 *
 * Compared to the legacy `EntityListControls.type.ts`:
 *   - Drops `onUpdate` — filtering is now derived (no callback chain).
 *   - Adds optional forwarded `EntityList` props: `itemsPerPage`, `itemsTolerance`, `scrollIntoView`.
 *   - `filterGroup` is optional. When omitted, the component reads `filterContext.filterGroup` — the canonical shape for the results-page integration. The override prop is kept for off-context usage (tests, candidate-app migration).
 */
export type EntityListWithControlsProps<TEntity extends MaybeWrappedEntityVariant = MaybeWrappedEntityVariant> =
  SvelteHTMLElements['div'] & {
    /** A list of possibly ranked entities, e.g. candidates or organizations. */
    entities: Array<TEntity>;
    /**
     * Optional override for the active `FilterGroup`. When omitted, the component pulls the active group from `filterContext.filterGroup`.
     */
    filterGroup?: FilterGroup<TEntity>;
    /** Property used by the search filter. @default 'name' */
    searchProperty?: string;
    /** Number of entities per page (forwarded to `EntityList`). @default 50 */
    itemsPerPage?: number;
    /** Page tolerance fraction (forwarded to `EntityList`). @default 0.2 */
    itemsTolerance?: number;
    /** Scroll loaded items into view (forwarded to `EntityList`). @default true */
    scrollIntoView?: boolean;
  };
