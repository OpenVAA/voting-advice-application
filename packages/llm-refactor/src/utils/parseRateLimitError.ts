/**
 * Parses the suggested wait time from an OpenAI rate limit error message.
 *
 * @param errorMessage - The error message string from the API.
 * @returns The suggested wait time in milliseconds, or null if it cannot be parsed.
 *
 * @example
 * // returns 6154
 * parseWaitTimeFromError("...Please try again in 6.154s. ...")
 */
export function parseWaitTimeFromError(errorMessage: string): number | null {
  const match = errorMessage.match(/try again in ([\d.]+)s/);

  if (match && match[1]) {
    const waitTimeInSeconds = parseFloat(match[1]);
    if (!isNaN(waitTimeInSeconds)) {
      return Math.ceil(waitTimeInSeconds * 1000) + 5000; // Add 5s buffer just to be safe(r)
    }
  }

  return null;
}
