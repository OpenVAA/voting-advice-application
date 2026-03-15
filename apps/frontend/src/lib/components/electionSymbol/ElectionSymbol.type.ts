import type { SvelteHTMLElements } from 'svelte/elements';

export type ElectionSymbolProps = SvelteHTMLElements['span'] & {
  /**
   * The text of the symbol, e.g. '15' or 'A'. If the symbol is an image, `text` will be used as its `alt` attribute.
   */
  text: string;
  /**
   * The `src` of an image election symbol.
   */
  image?: string;
};
