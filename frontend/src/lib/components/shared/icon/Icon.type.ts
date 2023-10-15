import type {SVGAttributes} from 'svelte/elements';

export type IconColor =
  | 'current'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'neutral'
  | 'base-100'
  | 'base-200'
  | 'base-300'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'base-content'
  | 'primary-content'
  | 'secondary-content'
  | 'accent-content'
  | 'info-content'
  | 'success-content'
  | 'warning-content'
  | 'error-content';

export interface IconProps extends SVGAttributes<SVGSVGElement> {
  /**
   * The size of the icon as one of the predefined sizes 'sm', 'md' or 'lg'.
   * For arbitrary values, you can supply a `class` property.
   *
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | undefined | null;

  /**
   * The fill of the icon as one of the predefined colours.
   * For arbitrary values, you can supply a `class` property.
   *
   * @default 'current'
   */
  fill?: IconColor | undefined | null;

  /**
   * The fill of the icon as one of the predefined colours.
   * For arbitrary values, you can supply a `class` property.
   *
   * @default undefined
   */
  stroke?: IconColor | undefined | null;

  /**
   * The optional title of the icon. Unless you're specifying `aria-hidden`
   * as `true`, you should provide a `title` for accessibility.
   */
  title?: string | undefined | null;

  /**
   * The optional description of the icon.
   */
  desc?: string | undefined | null;
}
