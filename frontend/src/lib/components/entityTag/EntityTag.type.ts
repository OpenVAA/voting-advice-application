import type { SvelteHTMLElements } from 'svelte/elements';
export type EntityTagProps = SvelteHTMLElements['div'] & {
  /**
   * A possibly wrapped entity, e.g. candidate or a party.
   */
  entity: MaybeWrappedEntityVariant;
  /**
   * Whether to use an abbreviation or the full name. @default 'default'
   */
  variant?: 'default' | 'short' | 'full';
};
