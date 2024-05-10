import type {SvelteHTMLElements} from 'svelte/elements';
import type {IconName} from '../icon';

export type AlertProps = SvelteHTMLElements['dialog'] & {
  /**
   * The title of the alert
   */
  title: string;
  /**
   * The icon of the alert. @default info
   */
  icon?: IconName;
  /**
   * Whether to open the alert automatically. @default true
   */
  autoOpen?: boolean;
  /**
   * Bind to this to get the alert's open state.
   */
  readonly isOpen?: boolean;
};
