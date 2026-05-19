import type { SvelteHTMLElements } from 'svelte/elements';

export type EntityDetailsProps = SvelteHTMLElements['article'] & {
  /**
   * A possibly ranked entity, e.g. candidate or a party.
   */
  entity: MaybeWrappedEntityVariant;
};
