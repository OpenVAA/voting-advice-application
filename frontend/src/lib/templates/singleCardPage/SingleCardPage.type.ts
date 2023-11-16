import type {PageProps} from '../page';

export interface SingleCardPageProps extends PageProps {
  /**
   * Optional class string to add to the `<div>` tag that defines the
   * card wrapping the `default` slot.
   */
  cardClass?: string;
}
