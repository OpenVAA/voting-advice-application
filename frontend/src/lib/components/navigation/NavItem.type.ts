import type {SvelteHTMLElements} from 'svelte/elements';
import type {IconName} from '$lib/components/icon';

/**
 * The properties of a navigation item.
 */
export type NavItemProps = LinkOrButtonElementProps & {
  /**
   * The optional name of the icon to use with the navigation item. See the `Icon` component for more details.
   */
  icon?: IconName | null;
  /**
   * The text to display in the navigation item.
   */
  text: string;
  /**
   * Whether the button is disabled. This can also be used with items rendered as `<a>` elements.
   */
  disabled?: boolean | null;
};

/**
 * The base properties of a navigation item must be either those of an `<a>` element with the `href` attribute, or a `<button>` element, preferably with the `on:click` event handler.
 */
type LinkOrButtonElementProps =
  | WithRequired<SvelteHTMLElements['a'], 'href'>
  | (SvelteHTMLElements['button'] & {href?: null});
