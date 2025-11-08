import type { SvelteHTMLElements } from 'svelte/elements';
export type EntityTagProps = SvelteHTMLElements['div'] & {
  /**
   * A possibly wrapped entity, e.g. candidate or a party.
   */
  entity: MaybeWrappedEntityVariant;
  /**
   * Controls whether to use an abbreviation or the full name and the size of the tag. @default 'default'
   */
  variant?: 'default' | 'short' | 'full' | 'small';
  /**
   * Whether to hide the possible parent nomination. @default false
   */
  hideParent?: boolean;
};
