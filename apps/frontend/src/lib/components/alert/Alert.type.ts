import type { SvelteHTMLElements } from 'svelte/elements';
import type { IconName } from '../icon';

export type AlertProps = SvelteHTMLElements['dialog'] & {
  /**
   * The title of the alert
   */
  title: string;
  /**
   * Possible icon of the alert. @default undefined
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
  /**
   * The callback triggered when the alert is closed.
   */
  onClose?: () => void;
};
