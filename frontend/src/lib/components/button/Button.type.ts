import type {SvelteHTMLElements} from 'svelte/elements';
import type {IconName} from '$lib/components/icon';

export type ButtonProps = LinkOrButtonElementProps & {
  /**
   * The required text of the button. If `variant` is `icon`, the text will be used as the `aria-label` and `title` for the button. You can override both by providing them as attributes, e.g. `aria-label="Another text"`.
   */
  text: string;
  /**
   * The name of the icon to use in the button or `null` if no icon should be used. @default 'next' if `variant='main'`, otherwise `null`
   */
  icon?: IconName | null;
  /**
   * The color of the icon. @default 'primary'
   */
  color?: Color | null;
  /**
   * Whether the button is disabled. This can also be used with buttons rendered as `<a>` elements.
   */
  disabled?: boolean | null;
  /**
   * Type of the button, which defines it's appearance. @default 'normal'
   */
  variant?: 'main' | 'icon' | 'normal' | 'responsive-icon' | 'secondary' | null;
  /**
   * Position of the icon in the button. Only relevant if `icon` is not `null` and `variant` is not `icon`. Note that `top` and `bottom` are not supported if `variant='main'`. @default 'right' if `variant='main'`, otherwise `left`
   */
  iconPos?: 'left' | 'right' | 'top' | 'bottom';
};

/**
 * The base properties of a navigation item must be either those of an `<a>` element with the `href` attribute, or a `<button>` element, preferably with the `on:click` event handler.
 */
type LinkOrButtonElementProps =
  | WithRequired<SvelteHTMLElements['a'], 'href'>
  | (SvelteHTMLElements['button'] & {href?: null});
