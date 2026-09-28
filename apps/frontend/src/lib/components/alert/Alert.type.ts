import type { Snippet } from 'svelte';
import type { SvelteHTMLElements } from 'svelte/elements';
import type { IconName } from '../icon';

export type AlertProps = SvelteHTMLElements['div'] & {
  /**
   * The content of the alert.
   */
  children?: Snippet;
  /**
   * The action buttons to display.
   */
  actions?: Snippet;
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
   * Whether the alert is open.
   */
  isOpen?: boolean;
  /**
   * The callback triggered when the alert is closed.
   */
  onClose?: () => void;
  /**
   * The callback triggered when the alert is opened.
   */
  onOpen?: () => void;
};
