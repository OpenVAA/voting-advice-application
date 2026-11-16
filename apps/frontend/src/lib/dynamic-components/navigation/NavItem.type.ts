import type { Snippet } from 'svelte';
import type { HTMLAttributes, SvelteHTMLElements } from 'svelte/elements';
import type { IconName } from '$lib/components/icon';

/**
 * The properties of a navigation item.
 */
export type NavItemProps = LinkOrButtonElementProps & {
  /**
   * Additional contents of the navigation item.
   */
  children?: Snippet;
  /**
   * The optional name of the icon to use with the navigation item. See the `Icon` component for more details.
   */
  icon?: IconName;
  /**
   * The text to display in the navigation item.
   */
  text: string;
  /**
   * Whether the button is disabled. This can also be used with items rendered as `<a>` elements.
   */
  disabled?: boolean;
  /**
   * The sentence a click on the disabled item shows under it, saying why it is disabled. With it, the disabled item stays operable: it is rendered as a button announced as unavailable, which shows and hides the sentence and neither navigates nor closes the menu.
   */
  disabledReason?: string;
  /**
   * Any valid attributes of the `<p>` element that holds the shown `disabledReason`.
   */
  disabledReasonProps?: HTMLAttributes<HTMLParagraphElement>;
  /**
   * Whether the menu available from the page context should be closed when the item is clicked. @default true
   */
  autoCloseNav?: boolean;
  /**
   * Optional click event handler for the navigation item.
   */
  onclick?: (event: MouseEvent) => void;
};

/**
 * The base properties of a navigation item must be either those of an `<a>` element with the `href` attribute, or a `<button>` element, preferably with the `on:click` event handler.
 */
type LinkOrButtonElementProps =
  WithRequired<SvelteHTMLElements['a'], 'href'> | (SvelteHTMLElements['button'] & { href?: null });
