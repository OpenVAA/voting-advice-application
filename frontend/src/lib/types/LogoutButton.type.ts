export type LogoutButtonProps = {
  /**
   * value used to determine the variant for logout button
   *
   * @default 'normal'
   */
  buttonVariant?: 'normal' | 'icon' | 'main';
  /**
   * value used to determine if the logout button takes the user to the login page
   *
   * @default false
   */
  stayOnPage?: boolean;
  /**
   * value for the duration in seconds a logout modal will wait before automatically logging the user out
   *
   * @default 30
   */
  logoutModalTimer?: number;
};
