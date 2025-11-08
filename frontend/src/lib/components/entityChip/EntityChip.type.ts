import type { SvelteHTMLElements } from 'svelte/elements';

export type EntityChipProps = SvelteHTMLElements['div'] & {
  /**
   * A possibly ranked entity, e.g. candidate or a party.
   */
  entity: MaybeWrappedEntityVariant;
};
