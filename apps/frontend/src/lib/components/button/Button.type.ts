import type { HTMLAttributes } from 'svelte/elements';
import type { IconName } from '$lib/components/icon';

export type ButtonProps = ButtonBaseElementProps & {
  /**
   * A snippet for adding a badge to the button.
   */
  badge?: import('svelte').Snippet;
  /**
   * The required text of the button. If `variant` is `icon`, the text will be used as the `aria-label` and `title` for the button. You can override both by providing them as attributes, e.g. `aria-label="Another text"`.
   */
  text: string;
  /**
   * The name of the icon to use in the button or `null` if no icon should be used. @default 'next' if `variant='main'`, otherwise `null`
   */
  icon?: IconName | null;
  /**
   * The color of the button or text. @default 'primary'
   */
  color?: Color | null;
  /**
   * Whether the button is disabled. This can also be used with buttons rendered as `<a>` elements.
   */
  disabled?: boolean | null;
  /**
   * Type of the button, which defines it's appearance. @default 'normal'
   */
  variant?: 'main' | 'prominent' | 'icon' | 'normal' | 'responsive-icon' | 'secondary' | 'floating-icon' | null;
  /**
   * Position of the icon in the button. Only relevant if `icon` is not `null` and `variant` is not `icon` or `floating-icon`. Note that `top` and `bottom` are not supported if `variant='main'`. @default 'right' if `variant='main'`, otherwise `left`
   */
  iconPos?: 'left' | 'right' | 'top' | 'bottom';
  /**
   * Set to `true` to show a loading spinner instead of the possible icon and disable the button. @default false
   */
  loading?: boolean;
  /**
   * The text shown when `loading` is `true`. @default t('common.loading')
   */
  loadingText?: string;
};

/**
 * Base element properties for Button. Uses a single type instead of a union of
 * `SvelteHTMLElements['a'] | SvelteHTMLElements['button']` to avoid "union too complex"
 * TypeScript errors when consumers spread `Partial<ButtonProps>` as restProps.
 * The component renders as `<a>` or `<button>` dynamically based on `href`.
 */
type ButtonBaseElementProps = HTMLAttributes<HTMLElement> & {
  /** If provided, the button renders as an `<a>` element. */
  href?: string | null;
  /** The type attribute for the button element. */
  type?: 'button' | 'submit' | 'reset' | string | null;
  /** Anchor-specific: target window/frame. */
  target?: string | null;
  /** Anchor-specific: relationship to linked resource. */
  rel?: string | null;
  /** Anchor-specific: download filename. */
  download?: unknown;
  /** Button-specific: form action URL. */
  formaction?: string | null;
  /** Button-specific: skip form validation. */
  formnovalidate?: boolean | null;
  /** Click handler. */
  onclick?: ((e: MouseEvent) => void) | null;
};
