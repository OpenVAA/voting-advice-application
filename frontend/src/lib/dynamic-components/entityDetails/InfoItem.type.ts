import type { SvelteHTMLElements } from 'svelte/elements';

export type InfoItemProps = SvelteHTMLElements['div'] & {
  /**
   * The label of the information.
   */
  label: string;
  /**
   * Layout mode for the item. @default false
   */
  vertical?: boolean;
  /**
   * Whether the value auto-detects its writing direction (`dir="auto"`) from the author-supplied content. Set to `false` for structural values (icons, tags, links, UI text) that must follow the UI locale direction instead — the author-supplied text inside still isolates its own direction.
   * @default true
   */
  autoDir?: boolean;
};
