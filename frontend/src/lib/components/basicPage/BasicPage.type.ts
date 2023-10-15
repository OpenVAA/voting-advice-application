import type {PageProps} from '$lib/components/shared/page';

export interface BasicPageProps extends PageProps {
  /**
   * The title of the page.
   */
  title: string;

  /**
   * Optional id for the `hgroup` element that contains the `heading` slot.
   *
   * @default `'mainHgroup'`
   */
  hgroupId?: string | undefined | null;

  /**
   * Optional Aria label for the section that contains the primary page
   * actions.
   *
   * @default `$_('primaryActionsLabel')`
   */
  primaryActionsLabel?: string | undefined | null;
}
