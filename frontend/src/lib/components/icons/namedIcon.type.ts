import type {IconProps, IconColor} from '$lib/components/shared/icon';

export interface NamedIconProps extends Exclude<IconProps, 'fill' | 'stroke'> {
  /**
   * The fill of the icon as one of the predefined colours.
   * For arbitrary values, you can supply a `class` property.
   *
   * @default 'current'
   */
  color?: IconColor | undefined | null;
}
