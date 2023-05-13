/**
 * Allows debug errors to be logged in development environment, but filtered out for production.
 * @param message Message to log into console
 * @param error Potential error message to print out completely
 */
export function logDebugError(message: string, error: any = null) {
  if (import.meta.env.DEV) {
    error ? console.error(message, error) : console.error(message);
  }
}

/**
 * Allows debug messages to be logged in development environment, but filtered out for production.
 * @param message Message to log into console
 * @param info Additional object to print
 */
export function logDebugInfo(message: string, error: any = null) {
  if (import.meta.env.DEV) {
    error ? console.info(message, error) : console.info(message);
  }
}
