import type {SvelteHTMLElements} from 'svelte/elements';
export type CardProps = SvelteHTMLElements['article'] & {
  /**
   * Set to `true` if you want to explicitly use the styling for an interactive card, i.e. shadow on hover and a pointer cursor. The styles are automatically applied if the component is wrapped in an `<a>` or a `<button>`. @default false
   */
  interactive?: boolean;
};
