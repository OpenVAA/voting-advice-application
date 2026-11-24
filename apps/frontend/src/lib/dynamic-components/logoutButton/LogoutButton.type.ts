import type { ButtonProps } from '$lib/components/button';

/**
 * What a Log out leaves undone, as the app reads it: the counts the modal's sentences say and whether the entity is hidden from voters while opinion questions are unanswered.
 */
export type LogoutWarning = {
  /** How many opinion questions are unanswered. */
  opinionQuestionsLeft: number;
  /** How many required info questions are unanswered. */
  infoQuestionsLeft: number;
  /** Whether the entity is hidden from voters while it has unanswered opinion questions. */
  hiddenIfMissing: boolean;
};

export type LogoutButtonProps = Partial<ButtonProps> & {
  /**
   * The app's own sign-out, which navigates to the app's login after a sign-out that worked. It rejects when the sign-out failed. It takes the reason the session ends for, for the login to say.
   */
  logout: (options?: { reason?: 'loggedOutAutomatically' }) => Promise<void>;
  /**
   * What is left undone. When it is set the button opens its modal before logging out, and the modal says what is left.
   */
  warning?: LogoutWarning;
  /**
   * The duration in seconds a logout modal will wait before automatically logging the user out. @default 30
   */
  logoutModalTimer?: number;
};
