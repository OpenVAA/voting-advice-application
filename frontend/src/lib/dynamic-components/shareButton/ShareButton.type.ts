import type { ButtonProps } from '$lib/components/button';

export type ShareButtonProps = Partial<ButtonProps> & {
  /**
   * The url to share. @default the root url of the app, resolved from the current `location`
   */
  url?: string;
};
