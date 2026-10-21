import type { SvelteHTMLElements } from 'svelte/elements';

export type EmailSentResendProps = SvelteHTMLElements['div'] & {
  /**
   * How many seconds are left before another email can be asked for. The button is unavailable while any are left.
   */
  secondsLeft: number;
  /**
   * Whether a request the button made is still in flight. The button is unavailable meanwhile. @default false
   */
  loading?: boolean;
  /**
   * Called when the button is pressed while it is available.
   */
  onresend: () => void | Promise<void>;
};
