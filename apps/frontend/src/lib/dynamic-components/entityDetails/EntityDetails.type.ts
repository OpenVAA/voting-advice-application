import type { EntityDetailsContent, ParentEntityDetailsContent } from '@openvaa/app-shared';
import type { SvelteHTMLElements } from 'svelte/elements';

export type EntityDetailsProps = SvelteHTMLElements['article'] & {
  /**
   * A possibly ranked entity, e.g. candidate or a party.
   */
  entity: MaybeWrappedEntityVariant;
  /**
   * Tabs to leave out of the configured contents, e.g. `['children']` where the nomination graph is not loaded. When nothing is left, the `info` and `opinions` tabs are shown. @default []
   */
  excludeTabs?: ReadonlyArray<EntityDetailsContent | ParentEntityDetailsContent>;
};
