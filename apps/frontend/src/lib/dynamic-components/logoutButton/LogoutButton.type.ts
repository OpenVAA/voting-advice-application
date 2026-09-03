import type { ButtonProps } from '$lib/components/button';
import type { Route } from '$lib/routes';

export type LogoutButtonProps = Partial<ButtonProps> & {
  /**
   * The route to redirect to after logging out. Default `Home`.
   */
  redirectTo?: Route;
};
