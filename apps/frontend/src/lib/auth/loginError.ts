import type { TranslationKey } from '$types';

/**
 * The message of each sign-out the user did not make on the login page, which every app's login page shows the same way.
 *
 * - `loggedOutAutomatically` has `common.loggedOutAutomatically`, which says the logout the user started was not cancelled in time.
 * - `loggedOutElsewhere` has `common.loggedOutElsewhere`, which says the user was logged out in another tab or window.
 */
export const SESSION_ENDED_MESSAGES = {
  loggedOutAutomatically: 'common.loggedOutAutomatically',
  loggedOutElsewhere: 'common.loggedOutElsewhere'
} as const satisfies Readonly<Record<string, TranslationKey>>;

/**
 * Get the translation key of a login page's message for a reason.
 *
 * The reason may arrive on the address bar, so it is any text at all. Only a reason the map holds as its own member has a message: a name every object inherits, such as `constructor`, has none.
 * @param messages - The message of each reason the login page knows.
 * @param reason - The reason to look up, if any.
 * @returns The key of the message, or `undefined` when the value is not one of the reasons.
 */
export function loginErrorKey<TReason extends string>(
  messages: Readonly<Record<TReason, TranslationKey>>,
  reason: string | null | undefined
): TranslationKey | undefined {
  if (reason == null || !Object.hasOwn(messages, reason)) return undefined;
  return messages[reason as TReason];
}
