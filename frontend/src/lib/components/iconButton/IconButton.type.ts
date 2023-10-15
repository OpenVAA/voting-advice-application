import type {ButtonProps} from '$lib/components/shared/button';

export interface IconButtonProps extends ButtonProps {
  /**
   * Optionally prominence of the button. Defines the colour of the icon
   * and possible label.
   *
   * @default 'primary'
   */
  type?: 'primary' | 'secondary';
}
