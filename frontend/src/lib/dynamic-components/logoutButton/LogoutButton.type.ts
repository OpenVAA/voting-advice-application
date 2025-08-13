import type { ButtonProps } from '$lib/components/button';
import type { Route } from '$lib/utils/route';

export type LogoutButtonProps = Partial<ButtonProps> & {
  /**
   * The route to redirect to after logging out. Default `Home`.
   */
  redirectTo?: Route;
};
