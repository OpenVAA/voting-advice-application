import { constants } from '$lib/utils/constants';

/**
 * Allows debug messages to be logged in development environment, but filtered out for production.
 * @param message Message or object to log into console
 * @param error Potential error message to print out completely
 */
export function logDebugError(message: unknown, error: unknown = null) {
  if (import.meta.env.DEV || constants.PUBLIC_DEBUG) {
    if (error) console.error(message, error);
    else console.info(message);
  }
}
