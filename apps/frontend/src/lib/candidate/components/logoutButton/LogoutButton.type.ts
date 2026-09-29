import type { ButtonProps } from '$lib/components/button';

export type LogoutButtonProps = Partial<ButtonProps> & {
  /**
   * The duration in seconds a logout modal will wait before automatically logging the user out. @default 30
   */
  logoutModalTimer?: number;
};
