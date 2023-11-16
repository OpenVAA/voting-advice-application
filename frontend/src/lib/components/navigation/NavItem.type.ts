import type {SvelteHTMLElements} from 'svelte/elements';
import type {IconName} from '$lib/components/icon';

/**
 * The properties of a navigation item.
 */
export type NavItemProps = LinkOrButtonProps & {
  /**
   * The optional name of the icon to use with the navigation item.
   * See the `Icon` component for more details.
   */
  icon?: IconName | null;
  /**
   * The text to display in the navigation item.
   */
  text: string;
};

/**
 * The base properties of a navigation item must be either those of an `<a>`
 * element with the `href` attribute, or a `<button>` element, preferably
 * with the `on:click` event handler.
 */
type LinkOrButtonProps =
  | WithRequired<SvelteHTMLElements['a'], 'href'>
  | SvelteHTMLElements['button'];

/**
 * Make specific properties of an interface required. Works the same way as
 * `Required<Type>` but only applies to keys listed.
 * Source: https://stackoverflow.com/questions/69327990/how-can-i-make-one-property-non-optional-in-a-typescript-type
 */
type WithRequired<Type, Key extends keyof Type> = Type & {[Prop in Key]-?: Type[Prop]};